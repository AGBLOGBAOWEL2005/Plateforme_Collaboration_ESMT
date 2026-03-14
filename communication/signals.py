from django.db.models.signals import post_save
from django.dispatch import receiver
from gestion_projets.models import Tache, Projet
from .models import Notification, Message, Conversation

@receiver(post_save, sender=Projet)
def create_project_group_conversation(sender, instance, created, **kwargs):
    if created:
        # Créer le groupe de discussion par défaut pour le projet
        conv = Conversation.objects.create(
            type='PROJET',
            project=instance
        )
        conv.participants.add(instance.createur)

@receiver(post_save, sender=Tache)
def handle_task_signals(sender, instance, created, **kwargs):
    # 1. Gestion des Notifications
    if created:
        Notification.objects.create(
            user=instance.assigned_to,
            notification=f"Une nouvelle tâche vous a été attribuée : '{instance.titre}' dans le projet '{instance.projet.titre}'."
        )
    else:
        if instance.statut == 'TERMINE':
            Notification.objects.create(
                user=instance.projet.createur,
                notification=f"La tâche '{instance.titre}' du projet '{instance.projet.titre}' a été marquée comme terminée par {instance.assigned_to.username}."
            )
        elif instance.statut == 'EN_COURS':
             Notification.objects.create(
                user=instance.projet.createur,
                notification=f"La tâche '{instance.titre}' du projet '{instance.projet.titre}' est maintenant en cours."
            )
    
    # 2. Synchronisation des participants au groupe projet
    try:
        project_conv = Conversation.objects.get(project=instance.projet, type='PROJET')
        if instance.assigned_to:
            project_conv.participants.add(instance.assigned_to)
    except Conversation.DoesNotExist:
        # Si la conversation n'existe pas encore (sécurité), on la crée
        conv = Conversation.objects.create(type='PROJET', project=instance.projet)
        conv.participants.add(instance.projet.createur)
        if instance.assigned_to:
            conv.participants.add(instance.assigned_to)

@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    if created:
        # Notifier tous les participants de la conversation sauf l'expéditeur
        participants = instance.conversation.participants.exclude(id=instance.sender.id)
        for user in participants:
            Notification.objects.create(
                user=user,
                notification=f"Nouveau message de {instance.sender.username} dans une conversation."
            )
