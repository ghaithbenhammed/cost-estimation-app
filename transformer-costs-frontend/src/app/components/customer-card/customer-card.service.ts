import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface CustomerCard {
  No: string;
  Name: string;
  County: string;
  Responsibility_Center: string;
  Customer_Status: string;
  VAT_Registration_No: string;
  Last_Date_Modified: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerCardService {
  private unifiedCustomersUrl =
    'http://127.0.0.1:8000/api/companies/sacem-industries/unified-customers/'; //Nouvelle API fusionnée
  private temporaryCustomersUrl =
    'http://127.0.0.1:8000/api/temporary-customers/'; // API pour ajouter/supprimer les clients temporaires
  private apiUrl = 'http://127.0.0.1:8000/api';
  private localCustomers: CustomerCard[] = []; // Stocker les clients ajoutés en local

  constructor(private http: HttpClient) {}

  // Récupérer tous les clients (Navision + Temporaires)
  getCustomerCards(): Observable<CustomerCard[]> {
    return this.http.get<CustomerCard[]>(this.unifiedCustomersUrl).pipe(
      map((apiCustomers) => [...apiCustomers, ...this.localCustomers]),
      catchError((error) => {
        console.error('Erreur lors de la récupération des clients :', error);
        return throwError(
          () => new Error('Erreur lors de la récupération des clients.')
        );
      })
    );
  }

  addCustomer(newCustomer: Partial<CustomerCard>): Observable<CustomerCard> {
    return this.http
      .post<CustomerCard>(this.temporaryCustomersUrl, newCustomer)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors de l'ajout du client :", error);
          return throwError(() => new Error("Impossible d'ajouter ce client."));
        })
      );
  }

  updateCustomer(
    updatedCustomer: Partial<CustomerCard>
  ): Observable<CustomerCard> {
    return this.http
      .put<CustomerCard>(
        `${this.temporaryCustomersUrl}${encodeURIComponent(
          updatedCustomer.No!
        )}/`,
        updatedCustomer
      )
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la mise à jour du client :', error);
          return throwError(
            () => new Error('Impossible de modifier ce client.')
          );
        })
      );
  }

  deleteCustomer(customerNo: string): Observable<any> {
    const deleteUrl = `${this.temporaryCustomersUrl}${encodeURIComponent(
      customerNo
    )}/`;
    return this.http.delete(deleteUrl).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la suppression du client:', error);
        return throwError(
          () => new Error('Impossible de supprimer ce client.')
        );
      })
    );
  }

  getCustomerRequests(customerNo: string): Observable<any> {
    const encodedNo = encodeURIComponent(customerNo.trim());
    return this.http.get<any>(
      `${this.apiUrl}/requests/?customer_no=${encodedNo}`
    );
  }

  addCustomerRequest(requestData: any): Observable<any> {
    return this.http.post('http://127.0.0.1:8000/api/requests/', requestData);
  }
}
