from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from gestion_projets.models import Tache

class Command(BaseCommand):
    help = 'Envoie des notifications par email pour les tâches dont la date limite approche'

    def handle(self, *args, **options):
        seuil = timezone.now() + timedelta(hours=24)
        
        taches_proches = Tache.objects.filter(
            date_limite__lte=seuil,
            date_limite__gte=timezone.now()
        ).exclude(statut='TERMINE')

        for tache in taches_proches:
            destinataire = tache.assigned_to.email
            if destinataire:
                sujet = f"Rappel : Échéance proche pour la tâche '{tache.titre}'"
                message = f"Bonjour {tache.assigned_to.prenom},\n\n" \
                          f"La tâche '{tache.titre}' du projet '{tache.projet.titre}' arrive à échéance le {tache.date_limite.strftime('%d/%m/%Y à %H:%M')}.\n\n" \
                          f"N'oubliez pas de la terminer à temps.\n\n" \
                          f"Cordialement,\nL'équipe de gestion de projets."
                
                try:
                    send_mail(
                        sujet,
                        message,
                        settings.EMAIL_HOST_USER,
                        [destinataire],
                        fail_silently=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Email envoyé à {destinataire} pour la tâche '{tache.titre}'"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Erreur lors de l'envoi à {destinataire}: {str(e)}"))
            else:
                self.stdout.write(self.style.WARNING(f"L'utilisateur {tache.assigned_to.username} n'a pas d'email configuré."))
