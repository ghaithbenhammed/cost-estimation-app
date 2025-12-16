import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-start',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-start.component.html',
  styleUrls: ['./chat-start.component.css'],
})
export class ChatStartComponent implements OnInit {
  users: any[] = [];

  @Output() startConversation = new EventEmitter<{
    conversationId: number;
    receiverId: number;
  }>();

  private currentUserId = Number(localStorage.getItem('user_id')) || 0;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.getAvailableUsers().subscribe({
      next: (data) => {
        this.users = data.filter((user: any) => user.id !== this.currentUserId);
      },
      error: (err) => {
        console.error('❌ Erreur chargement utilisateurs disponibles', err);
      },
    });
  }

  selectUser(user: any): void {
    if (!user?.id) {
      console.warn('⚠️ Utilisateur invalide sélectionné.');
      return;
    }

    this.chatService.getOrCreateConversation(user.id).subscribe({
      next: (res) => {
        if (res.conversation) {
          this.startConversation.emit({
            conversationId: res.conversation,
            receiverId: user.id,
          });
        } else {
          console.error('❌ Réponse sans ID de conversation.');
        }
      },
      error: (err) => {
        console.error(
          '❌ Erreur lors de la création ou récupération de la conversation',
          err
        );
      },
    });
  }
}
