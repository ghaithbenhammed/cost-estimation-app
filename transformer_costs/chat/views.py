from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Conversation, Message, Notification
from .serializers import ConversationSerializer, MessageSerializer,NotificationSerializer
from django.contrib.auth import get_user_model
from rest_framework.generics import ListAPIView
from accounts.serializers import UserSerializer  
from rest_framework.decorators import api_view, permission_classes
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import action
from rest_framework import viewsets

User = get_user_model()

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(participants=request.user).order_by('-created_at')
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)
class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        content = request.data.get('content')

        if not receiver_id or not content:
            return Response({'detail': 'receiver_id et content requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        
        conversation = Conversation.objects.filter(participants=request.user).filter(participants=receiver).first()
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.set([request.user, receiver])
            conversation.save()

       
        message = Message.objects.create(conversation=conversation, sender=request.user, content=content)

        
        Notification.objects.create(
            user=receiver,
            content=f"Vous avez reçu un message de {request.user.first_name}"
        )

        
        send_mail(
            subject=f"Nouveau message de {request.user.first_name}",
            message=content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[receiver.email],
            fail_silently=True,  
        )

        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
class ConversationMessagesView(ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        return Message.objects.filter(conversation_id=conversation_id).order_by('timestamp')
    User = get_user_model()

class AvailableUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.exclude(id=request.user.id)
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_or_create_conversation(request):
    current_user = request.user
    receiver_id = request.data.get('receiver_id')

    if not receiver_id:
        return Response({"error": "receiver_id manquant"}, status=400)

    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable"}, status=404)

    
    convo = Conversation.objects.filter(participants=current_user).filter(participants=receiver).first()

    if convo:
        return Response({"conversation": convo.id})

   
    new_convo = Conversation.objects.create()
    new_convo.participants.add(current_user, receiver)
    return Response({"conversation": new_convo.id})
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, pk):
    try:
        conversation = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({"detail": "Conversation introuvable"}, status=404)

    if request.user not in conversation.participants.all():
        return Response({"detail": "Accès non autorisé"}, status=403)

    conversation.delete()
    return Response({"detail": "Conversation supprimée"}, status=204)

class NotificationListView(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marquée comme lue ✅"})
    except Notification.DoesNotExist:
        return Response({"error": "Notification introuvable ❌"}, status=404)
