from rest_framework import serializers
from .models import TemporaryCustomer , CustomerRequest,SavedBom, SavedBomLine


class TemporaryCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemporaryCustomer
        fields = '__all__'  
class CustomerRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerRequest
        fields = '__all__' 

class SavedBomLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedBomLine
        fields = ['code', 'designation', 'unite', 'quantite', 'remarque', 'is_custom']
    def validate(self, data):
        if not data.get('is_custom') and not data.get('code'):
            raise serializers.ValidationError("Le code est requis pour les lignes non personnalisées.")
        return data

class SavedBomSerializer(serializers.ModelSerializer):
    lines = SavedBomLineSerializer(many=True)

    class Meta:
        model = SavedBom
        fields = '__all__'
    def create(self, validated_data):
        lines_data = validated_data.pop('lines')
        saved_bom = SavedBom.objects.create(**validated_data)
        for line in lines_data:
            SavedBomLine.objects.create(bom=saved_bom, **line)
        return saved_bom
    
