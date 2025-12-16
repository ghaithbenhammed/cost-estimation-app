import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SacemIndustriesService {
    private apiUrl = 'http://127.0.0.1:8000/api/companies/sacem-industries/';

    constructor(private http: HttpClient) {}

    getDetails(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}`)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: any) {
        console.error('Erreur API SACEM INDUSTRIES:', error);
        return throwError(() => new Error('Erreur lors de la récupération des détails SACEM INDUSTRIES.'));
    }
    getItems(): Observable<any[]> {
      return this.http.get<any[]>('http://127.0.0.1:8000/api/items/')
          .pipe(
              catchError(error => {
                  console.error('Erreur lors de la récupération des items :', error);
                  return throwError(() => new Error('Erreur lors de la récupération des items.'));
              })
          );
  }
  
}
