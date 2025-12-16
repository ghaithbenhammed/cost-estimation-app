import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatInboxComponent } from '../chat-inbox/chat-inbox.component';
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { ChatStartComponent } from '../chat-start/chat-start.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatInboxComponent,
    ChatBoxComponent,
    ChatStartComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  selectedConversationId: number | null = null;
  selectedReceiverId: number | null = null;

  currentUserId = Number(localStorage.getItem('user_id'));

  openConversation(event: {
    conversationId: number;
    receiverId: number;
  }): void {
    if (!event?.conversationId || !event?.receiverId) {
      console.warn('Conversation ou destinataire invalide');
      return;
    }

    if (event.receiverId === this.currentUserId) {
      console.warn(
        'Vous ne pouvez pas ouvrir une conversation avec vous-même.'
      );
      return;
    }

    if (this.selectedConversationId === event.conversationId) return;

    this.selectedConversationId = event.conversationId;
    this.selectedReceiverId = event.receiverId;

    console.log(
      `Conversation ouverte : ${event.conversationId} avec ${event.receiverId}`
    );
  }
}
