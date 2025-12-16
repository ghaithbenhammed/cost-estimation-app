import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BomLinesService {
  private apiUrl =
    'http://127.0.0.1:8000/api/companies/sacem-industries/bom-lines/';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les lignes BOM depuis l'API.
   * @param productionBomNo (Optionnel) Filtre par le numéro de BOM de production.
   * @returns Observable des lignes BOM sous forme de tableau.
   */
  getBomLines(headerNo?: string): Observable<any[]> {
    let params = new HttpParams();

    if (headerNo) {
      params = params.set('Production_BOM_No', headerNo);
    }

    console.log(
      '🔵 Requête des lignes BOM avec paramètres :',
      params.toString()
    );

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && response.value && Array.isArray(response.value)) {
          return response.value;
        } else {
          console.warn('⚠️ Format de réponse inattendu :', response);
          return [];
        }
      }),
      catchError((error) => {
        console.error(
          '❌ Erreur lors de la récupération des lignes BOM :',
          error
        );
        return throwError(
          () => new Error('Erreur lors de la récupération des lignes BOM.')
        );
      })
    );
  }
}
