from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from django.core.cache import cache
from django.contrib.auth import get_user_model
from chat.utils import notify_user

class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role',
            'first_name', 'last_name',
            'phone_number', 'address',
            'profile_picture',
            'is_active'
        ]
        read_only_fields = ['id', 'username', 'email', 'role']

    def to_representation(self, instance):
        # Pour que le champ profile_picture renvoie une URL complète
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.profile_picture and request:
            representation['profile_picture'] = request.build_absolute_uri(instance.profile_picture.url)
        else:
            representation['profile_picture'] = None
        return representation

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        print("🚨 Tentative de login avec email :", email)

        if not email or not password:
            raise serializers.ValidationError("Email et mot de passe requis")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Aucun compte trouvé avec cet email.")

        if not user.is_active:
            raise serializers.ValidationError("🚫 Ce compte est désactivé. Contactez un administrateur.")

        # Vérifie le mot de passe
        if not user.check_password(password):
            key = f"login_fail_{user.id}"
            failed_attempts = cache.get(key, 0) + 1
            cache.set(key, failed_attempts, timeout=600)  

            print(f"❌ Mauvais mot de passe - tentative {failed_attempts}")

            if failed_attempts == 2:
                for superadmin in User.objects.filter(role='SuperAdmin', is_active=True):
                    notify_user(
                        superadmin,
                        f"⚠️ Deux tentatives échouées de connexion pour {email}.",
                        "Alerte de sécurité"
                    )

            if failed_attempts >= 3:
                user.is_active = False
                user.save()
                for superadmin in User.objects.filter(role='SuperAdmin', is_active=True):
                    notify_user(
                        superadmin,
                        f"🚫 Le compte {email} a été désactivé après 3 tentatives échouées.",
                        "Compte désactivé automatiquement"
                    )
                raise serializers.ValidationError("🚫 Votre compte a été désactivé après plusieurs tentatives échouées.")

            raise serializers.ValidationError("Mot de passe incorrect.")

        
        cache.delete(f"login_fail_{user.id}")
        attrs['username'] = email
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['phone_number'] = user.phone_number
        token['address'] = user.address
        return token
class UserCreateSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False)
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirmation',
            'title', 'first_name', 'last_name', 'phone_number', 'address',
            'role', 'profile_picture'
        ]

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirmation')  
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
