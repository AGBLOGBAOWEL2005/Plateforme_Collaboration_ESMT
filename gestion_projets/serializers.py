from rest_framework import serializers
from .models import Projet, Tache, DocumentProjet
from utilisateur.models import Utilisateur
from utilisateur.serializers import UtilisateurSerializer


class TacheSerializer(serializers.ModelSerializer):
    assigned_to_details = UtilisateurSerializer(source='assigned_to', read_only=True)

    class Meta:
        model = Tache
        fields = [
            'id', 'titre', 'description', 'date_creation', 'date_limite',
            'date_fin_reelle', 'statut', 'fichier_rendu', 'projet',
            'assigned_to', 'assigned_to_details'
        ]
        read_only_fields = ('date_creation',)


class DocumentProjetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentProjet
        fields = ['id', 'projet', 'fichier', 'nom_document', 'date_upload']


class ProjetSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    documents = DocumentProjetSerializer(many=True, read_only=True)
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Projet
        fields = [
            'id', 'titre', 'description', 'date_debut', 'date_fin',
            'createur', 'members', 'documents', 'user_role'
        ]
        read_only_fields = ('createur',)

    def get_members(self, obj):
        # Récupère tous les utilisateurs uniques assignés aux tâches de ce projet
        assigned_users = Utilisateur.objects.filter(taches_assignees__projet=obj).distinct()
        return UtilisateurSerializer(assigned_users, many=True).data

    def get_user_role(self, obj):
        user = self.context['request'].user
        if obj.createur == user:
            return 'creator'
        if obj.taches.filter(assigned_to=user).exists():
            return 'member'
        return 'guest' # Ou null, selon la logique souhaitée