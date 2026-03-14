from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsProfesseur(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'PROFESSEUR'

class IsProjectCreatorOrMemberReadOnly(BasePermission):
    """
    - Admin a tous les droits.
    - Le créateur a tous les droits.
    - Les membres ont le droit de lecture (GET, HEAD, OPTIONS).
    """
    def has_object_permission(self, request, view, obj):
        # Admin a tous les droits
        if request.user.role == 'ADMIN':
            return True
            
        # Le créateur a tous les droits
        if obj.createur == request.user:
            return True
        
        # Les membres ont seulement le droit de lecture
        is_member = obj.taches.filter(assigned_to=request.user).exists()
        if is_member and request.method in SAFE_METHODS:
            return True
            
        return False

class IsTaskAssigneeOrProjectCreator(BasePermission):
    """
    - Admin a tous les droits.
    - Le créateur du projet a tous les droits.
    - L'assigné peut modifier le statut et ajouter des documents (update partiel).
    """
    def has_object_permission(self, request, view, obj):
        # Admin a tous les droits
        if request.user.role == 'ADMIN':
            return True
            
        # Le créateur du projet a tous les droits
        if obj.projet.createur == request.user:
            return True

        # L'utilisateur assigné peut modifier certains champs (statut et fichier_rendu)
        if obj.assigned_to == request.user:
            if request.method in ['PATCH', 'PUT']:
                # On vérifie quels champs sont modifiés
                # Si l'utilisateur tente de modifier autre chose que 'statut' ou 'fichier_rendu'
                allowed_fields = {'statut', 'fichier_rendu'}
                data_keys = set(request.data.keys())
                if data_keys.issubset(allowed_fields):
                    return True
            # L'assigné peut aussi lire la tâche
            if request.method in SAFE_METHODS:
                return True
            
        return False
