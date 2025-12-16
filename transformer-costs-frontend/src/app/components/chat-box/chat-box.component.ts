import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.css'],
})
export class ChatBoxComponent implements OnInit, OnChanges, OnDestroy {
  @Input() conversationId!: number;
  @Input() receiverId!: number;

  messages: any[] = [];
  newMessage = '';
  interval: any;

  currentUserId: number = Number(localStorage.getItem('user_id'));

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.loadMessages();

    this.interval = setInterval(() => this.loadMessages(), 6000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversationId'] && !changes['conversationId'].firstChange) {
      this.messages = [];
      this.loadMessages();
    }
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  loadMessages(): void {
    if (!this.conversationId) {
      console.warn('❌ conversationId manquant.');
      return;
    }

    this.chatService.getMessages(this.conversationId).subscribe({
      next: (data) => {
        this.messages = data;
        console.log('🔍 Messages reçus :', this.messages);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err) => {
        console.error('❌ Erreur chargement messages', err);
      },
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    if (this.receiverId === this.currentUserId) {
      console.warn(
        '⚠️ Vous ne pouvez pas vous envoyer un message à vous-même.'
      );
      return;
    }

    this.chatService
      .sendMessage(this.receiverId, this.newMessage.trim())
      .subscribe({
        next: (message: any) => {
          this.messages.push(message);
          this.newMessage = '';
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (err) => {
          console.error('❌ Erreur envoi message', err);
        },
      });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    const container = document.getElementById('message-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
