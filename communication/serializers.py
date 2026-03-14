from rest_framework import serializers
from .models import Conversation, Message, Notification, Reaction
from utilisateur.serializers import UtilisateurSerializer

class ReactionSerializer(serializers.ModelSerializer):
    user_details = UtilisateurSerializer(source='user', read_only=True)
    
    class Meta:
        model = Reaction
        fields = ['id', 'message', 'user', 'user_details', 'emoji', 'date_reaction']
        read_only_fields = ['user', 'date_reaction']

class MessageSerializer(serializers.ModelSerializer):
    sender_details = UtilisateurSerializer(source='sender', read_only=True)
    message_parent_details = serializers.SerializerMethodField()
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_details', 'contenu', 'date_envoi', 'lu', 'message_parent', 'message_parent_details', 'reactions']
        read_only_fields = ['sender', 'date_envoi']

    def get_message_parent_details(self, obj):
        if obj.message_parent:
            return {
                'id': obj.message_parent.id,
                'sender': obj.message_parent.sender.username,
                'contenu': obj.message_parent.contenu
            }
        return None


class ConversationSerializer(serializers.ModelSerializer):
    participants_details = UtilisateurSerializer(source='participants', many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='project.titre', read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'type', 'project', 'project_title', 'created_at', 'participants', 'participants_details', 'last_message']

    def get_last_message(self, obj):
        last = obj.messages.all().order_by('-date_envoi').first()
        if last:
            return MessageSerializer(last).data
        return None


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['date_notification']