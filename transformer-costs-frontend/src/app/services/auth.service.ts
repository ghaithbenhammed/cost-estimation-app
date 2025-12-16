import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/accounts/token/`, credentials).pipe(
      tap((res: any) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
        }
      })
    );
  }

  getUserProfile(): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[SSR] getUserProfile bloqué car pas dans le browser');
      return of(null);
    }
  
    const token = localStorage.getItem('access');
    if (!token) {
      console.warn('🚫 Aucun token dans localStorage');
      return of(null);
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  
    console.log('📡 GET /accounts/profile avec headers:', headers.get('Authorization'));
  
    return this.http.get(`${this.apiUrl}/accounts/profile/`, { headers });
  }
  

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
  }

  isLoggedIn(): boolean {
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem('access');
  }
  private userDataSubject = new BehaviorSubject<any>(null);
userData$ = this.userDataSubject.asObservable();

updateUserData(data: any) {
  this.userDataSubject.next(data);
}
}
