from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationListView, SendMessageView, ConversationMessagesView,
    AvailableUsersView, get_or_create_conversation, delete_conversation,
    NotificationViewSet
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('messages/send/', SendMessageView.as_view(), name='send-message'),
    path('messages/', ConversationMessagesView.as_view(), name='conversation-messages'),
    path('users/available/', AvailableUsersView.as_view(), name='available-users'),
    path('conversations/get_or_create/', get_or_create_conversation),
    path('conversations/<int:pk>/delete/', delete_conversation),
    path('', include(router.urls)),
]
