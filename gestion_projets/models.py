from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings


class Projet(models.Model):
    titre = models.CharField(max_length=200)
    description = models.TextField()
    date_debut = models.DateField()
    date_fin = models.DateField()
    # Relation : Un projet est créé par UN utilisateur (Professeur)
    createur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projets_crees'
    )

    def __str__(self):
        return self.titre
class DocumentProjet(models.Model):
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='documents')
    fichier = models.FileField(upload_to='projets/documents/')
    nom_document = models.CharField(max_length=255, blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Doc pour {self.projet.titre}"

class Tache(models.Model):
    STATUT_CHOICES = (
        ('A_FAIRE', 'À faire'),
        ('EN_COURS', 'En cours'),
        ('EN_ATTENTE', 'En attente'),
        ('TERMINE', 'Terminé'),
    )

    titre = models.CharField(max_length=200)
    description = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    date_limite = models.DateTimeField()
    # Important pour le calcul des primes !
    date_fin_reelle = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='A_FAIRE')
    fichier_rendu = models.FileField(upload_to='taches/rendus/', null=True, blank=True)
    # Relations
    projet = models.ForeignKey(
        Projet,
        on_delete=models.CASCADE,
        related_name='taches'
    )
    # Relation : Une tâche est assignée à UN utilisateur (Étudiant ou Prof)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='taches_assignees'
    )

    def __str__(self):
        return f"{self.titre} ({self.get_statut_display()})"

    def save(self, *args, **kwargs):
        if self.statut == 'TERMINE' and not self.date_fin_reelle:
            from django.utils import timezone
            self.date_fin_reelle = timezone.now()
        elif self.statut != 'TERMINE':
            self.date_fin_reelle = None
        super().save(*args, **kwargs)