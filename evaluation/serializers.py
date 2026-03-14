from rest_framework import serializers
from utilisateur.models import Utilisateur

class EvaluationEnseignantSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    prenom = serializers.CharField()
    nom = serializers.CharField()
    username = serializers.CharField()
    photo = serializers.ImageField(read_only=True)
    total_taches = serializers.IntegerField()
    dans_delai = serializers.IntegerField()
    pourcentage = serializers.IntegerField()
    prime = serializers.IntegerField()
    commentaire = serializers.CharField()
