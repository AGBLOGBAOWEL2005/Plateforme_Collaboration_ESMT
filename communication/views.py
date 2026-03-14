from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message, Notification, Reaction
from .serializers import ConversationSerializer, MessageSerializer, NotificationSerializer, ReactionSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # L'administrateur ne voit que ses propres conversations
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        # On s'assure que le créateur est ajouté aux participants s'il ne l'est pas déjà
        conversation = serializer.save()
        if self.request.user not in conversation.participants.all():
            conversation.participants.add(self.request.user)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Message.objects.filter(conversation__participants=self.request.user)
        conv_id = self.request.query_params.get('conversation')
        if conv_id:
            qs = qs.filter(conversation_id=conv_id)
        return qs.order_by('date_envoi')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'], url_path='react')
    def react(self, request, pk=None):
        message = self.get_object()
        emoji = request.data.get('emoji')
        user = request.user

        if not emoji:
            return Response({'error': 'Emoji is required'}, status=400)

        # Supprimer l'ancienne réaction si elle existe
        Reaction.objects.filter(message=message, user=user).delete()
        # Ajouter la nouvelle réaction
        reaction = Reaction.objects.create(message=message, user=user, emoji=emoji)
        
        return Response(ReactionSerializer(reaction).data, status=201)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)