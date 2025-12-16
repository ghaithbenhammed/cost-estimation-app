import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface Company {
    name: string;
    displayName: string;
    id: string;
    businessProfileId: string;
}

@Injectable({
    providedIn: 'root'
})
export class CompanyListService {
    private apiUrl = 'http://127.0.0.1:8000/api/companies/';

    constructor(private http: HttpClient) {}

    getCompanies(): Observable<any[]> {
      return this.http.get<any[]>(this.apiUrl);
          
    }
}
