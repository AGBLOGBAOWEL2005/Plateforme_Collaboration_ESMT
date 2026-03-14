from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser


class Utilisateur(AbstractUser):
    # Définition des rôles pour ton projet ESMT
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('PROFESSEUR', 'Professeur'),
        ('ETUDIANT', 'Etudiant'),
    )

    # Ajout des champs personnalisés
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='ETUDIANT')
    photo = models.ImageField(upload_to='profiles/', default='profiles/default.webp', null=True, blank=True)
    prenom = models.CharField(max_length=100)
    nom = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.username} ({self.role})"