from django.shortcuts import render
from django.db.models import Q

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Projet, Tache, DocumentProjet
from .serializers import ProjetSerializer, TacheSerializer, DocumentProjetSerializer
from .permissions import IsProfesseur, IsProjectCreatorOrMemberReadOnly, IsTaskAssigneeOrProjectCreator


class ProjetViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admin voit tout, les autres voient leurs projets (créateur ou membre)
        if self.request.user.role == 'ADMIN':
            return Projet.objects.all().distinct()
            
        return Projet.objects.filter(
            Q(createur=self.request.user) | 
            Q(taches__assigned_to=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(createur=self.request.user)


class TacheViewSet(viewsets.ModelViewSet):
    serializer_class = TacheSerializer
    permission_classes = [IsAuthenticated, IsTaskAssigneeOrProjectCreator]

    def get_queryset(self):
        # Admin voit tout, les autres voient leurs tâches
        if self.request.user.role == 'ADMIN':
            return Tache.objects.all().distinct()
            
        return Tache.objects.filter(
            Q(projet__createur=self.request.user) | 
            Q(assigned_to=self.request.user) |
            Q(projet__taches__assigned_to=self.request.user) # Membre du projet
        ).distinct()

    def create(self, request, *args, **kwargs):
        projet_id = request.data.get('projet')
        try:
            projet = Projet.objects.get(id=projet_id)
        except Projet.DoesNotExist:
            return Response({'error': 'Projet non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        if projet.createur != request.user and request.user.role != 'ADMIN':
            return Response({'error': 'Seul le créateur du projet ou un admin peut créer une tâche.'}, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)

class DocumentProjetViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentProjetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DocumentProjet.objects.filter(
            Q(projet__createur=self.request.user) | 
            Q(projet__taches__assigned_to=self.request.user)
        ).distinct()
