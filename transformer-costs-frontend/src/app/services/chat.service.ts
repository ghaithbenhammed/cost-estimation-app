import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = 'http://127.0.0.1:8000/api/chat';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private handleError(error: any) {
    console.error('Erreur API ChatService :', error);
    return throwError(() => error);
  }

  getConversations(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/conversations/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  sendMessage(receiver_id: number, content: string): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/messages/send/`,
        { receiver_id, content },
        { headers: this.getAuthHeaders() }
      )
      .pipe(catchError(this.handleError));
  }

  getMessages(conversationId: number): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/messages/?conversation=${conversationId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getAvailableUsers(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/users/available/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getOrCreateConversation(receiver_id: number): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/conversations/get_or_create/`,
        {
          receiver_id,
        },
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(catchError(this.handleError));
  }

  deleteConversation(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/conversations/${id}/delete/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getConversationById(id: number): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/conversations/${id}/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/notifications/${notificationId}/mark_as_read/`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(catchError(this.handleError));
  }
}
