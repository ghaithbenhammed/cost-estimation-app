from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import UpdateAPIView
from .models import User
from .serializers import UserSerializer, EmailTokenObtainPairSerializer, UserCreateSerializer
from rest_framework.generics import CreateAPIView
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from django.core.cache import cache
from chat.models import Notification
from django.core.mail import send_mail
from django.conf import settings
from chat.utils import notify_user 

class GetUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = JWTAuthentication()
        try:
            user, _ = auth.authenticate(request)
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': 'Invalid token or user not found'}, status=status.HTTP_401_UNAUTHORIZED)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    print("🔥 Tentative de login reçue dans CustomTokenObtainPairView")

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "")
        user = User.objects.filter(email=email).first()

        if user:
            key = f"login_fail_{user.id}"
            failed_attempts = cache.get(key, 0)

            # Si l'utilisateur est désactivé, on bloque l'accès immédiatement
            if not user.is_active:
                return Response({'detail': "🚫 Votre compte est désactivé. Contactez un administrateur."}, status=403)

            response = super().post(request, *args, **kwargs)

            if response.status_code != 200:
                failed_attempts += 1
                cache.set(key, failed_attempts, timeout=600) 
                print(f"[Tentative échouée] {email} - Essai n°{failed_attempts}")

                if failed_attempts == 2:
                    print("[ALERTE] 2 tentatives échouées — notification + mail au SuperAdmin")

                    superadmins = User.objects.filter(role='SuperAdmin', is_active=True)
                    for superadmin in superadmins:
                        notify_user(
                            superadmin,
                            f"⚠️ Deux tentatives échouées de connexion ont été détectées pour l'adresse {email}.",
                            "Alerte : tentative de connexion échouée"
                        )

                if failed_attempts >= 3:
                    user.is_active = False
                    user.save()

                    for superadmin in User.objects.filter(role='SuperAdmin', is_active=True):
                        notify_user(
                            superadmin,
                            f"🚫 Le compte {email} a été automatiquement désactivé après 3 tentatives échouées.",
                            "Compte désactivé"
                        )

                    return Response({'detail': "🚫 Votre compte a été désactivé après plusieurs tentatives échouées."}, status=403)

                return response

            else:
                # Réinitialisation des tentatives si login réussi
                cache.delete(key)
                return response

        # Aucun utilisateur trouvé → pas de tentative à compter
        return super().post(request, *args, **kwargs)

class UpdateUserProfileView(UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # pour accepter les fichiers

    def get_object(self):
        return self.request.user

class CreateUserView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
       
        if self.request.user.role not in ['SuperAdmin', 'Admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'avez pas la permission de créer un utilisateur.")
        serializer.save()

class UserListView(ListAPIView):
    queryset =User.objects.all()   
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]



class UserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role not in ['Admin', 'SuperAdmin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Accès refusé.")
        return super().get_queryset()
