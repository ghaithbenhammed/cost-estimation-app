import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-chat-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-inbox.component.html',
  styleUrls: ['./chat-inbox.component.css'],
})
export class ChatInboxComponent implements OnInit {
  conversations: any[] = [];
  selectedConversationId: number | null = null;
  selectedReceiverId: number | null = null;

  @Output() conversationSelected = new EventEmitter<{
    conversationId: number;
    receiverId: number;
  }>();

  currentUserId: number = Number(localStorage.getItem('user_id')) || 0;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    if (!this.currentUserId) {
      const storedId = localStorage.getItem('user_id');
      this.currentUserId = storedId ? Number(storedId) : 0;
    }

    this.refreshConversations();
  }

  refreshConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
      },
      error: (err) => {
        console.error('Erreur chargement conversations', err);
      },
    });
  }

  onSelectConversation(conv: any): void {
    const receiver = this.getReceiver(conv);

    if (!receiver || !conv?.id) {
      console.warn('Conversation invalide.');
      return;
    }

    if (this.selectedConversationId === conv.id) {
      return;
    }

    this.selectedConversationId = conv.id;
    this.selectedReceiverId = receiver.id;

    this.conversationSelected.emit({
      conversationId: conv.id,
      receiverId: receiver.id,
    });
  }

  getReceiver(conv: any): any {
    return conv.participants.find((p: any) => p.id !== this.currentUserId);
  }

  delete(convId: number): void {
    if (confirm('🗑️ Supprimer cette conversation ?')) {
      this.chatService.deleteConversation(convId).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(
            (c) => c.id !== convId
          );

          if (this.selectedConversationId === convId) {
            this.selectedConversationId = null;
            this.selectedReceiverId = null;
          }
        },
        error: (err) => {
          console.error('Erreur suppression conversation', err);
        },
      });
    }
  }
}
