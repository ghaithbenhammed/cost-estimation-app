from rest_framework import serializers
from .models import Conversation, Message, Notification
from django.contrib.auth import get_user_model

User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'profile_picture', 'role', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class MessageSerializer(serializers.ModelSerializer):
    sender = UserShortSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'is_read']


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserShortSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'created_at']

    def get_last_message(self, obj):
      last_msg = obj.messages.order_by('-timestamp').first()
      if last_msg:
        return {
            'id': last_msg.id,
            'content': last_msg.content,
            'timestamp': last_msg.timestamp,
            'sender': {
                'id': last_msg.sender.id,
                'first_name': last_msg.sender.first_name,
                'last_name': last_msg.sender.last_name,
                'profile_picture': last_msg.sender.profile_picture.url if last_msg.sender.profile_picture else None,
                'role': last_msg.sender.role,
            }
        }
      return None

    
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'content', 'is_read', 'created_at']
