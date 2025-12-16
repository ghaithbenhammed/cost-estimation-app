import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class BomHeaderService {
    private apiUrl = 'http://127.0.0.1:8000/api/companies/sacem-industries/header-bom/';

    constructor(private http: HttpClient) {}

    getBomHeaders(designFileNo?: string, no?: string): Observable<any[]> {
        let params = new HttpParams();

        if (designFileNo) params = params.set('design_file_no', designFileNo);
        if (no) params = params.set('no', no);

        return this.http.get<any>(this.apiUrl, { params })
            .pipe(
                map(response => response?.value ?? []),
                catchError(error => {
                    console.error('Erreur lors de la récupération des en-têtes BOM:', error);
                    return throwError(() => new Error('Erreur lors de la récupération des en-têtes BOM.'));
                })
            );
    }
}
