import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private baseUrl = 'http://127.0.0.1:8000/api/chat/notifications/';

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<any> {
    const token = localStorage.getItem('access');  // Récupérer le token JWT du stockage local

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(this.baseUrl, { headers: headers });
  }
  markAsRead(notificationId: number): Observable<any> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`http://127.0.0.1:8000/api/chat/notifications/${notificationId}/mark_as_read/`, {}, { headers });
  }
  
}
