import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  title?: string;
  profile_picture?: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://127.0.0.1:8000/api/accounts/';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}list/`, {
      headers: this.getAuthHeaders(),
    });
  }

  createUser(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}create/`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}user/${userId}/`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateUser(userId: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders();

    if (data instanceof FormData) {
      return this.http.put(`${this.apiUrl}user/${userId}/`, data, { headers });
    } else {
      return this.http.patch(`${this.apiUrl}user/${userId}/`, data, {
        headers,
      });
    }
  }
}
