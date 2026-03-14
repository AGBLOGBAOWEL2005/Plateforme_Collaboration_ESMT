from rest_framework import serializers
from .models import Utilisateur
from django.contrib.auth.hashers import make_password


class UtilisateurSerializer(serializers.ModelSerializer):

    class Meta:
        model = Utilisateur
        fields = [
            'id',
            'username',
            'email',
            'prenom',
            'nom',
            'role',
            'photo',
            'password'
        ]

        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)