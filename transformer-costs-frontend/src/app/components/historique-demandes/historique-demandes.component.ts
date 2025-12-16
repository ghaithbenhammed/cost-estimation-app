import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerCardService } from '../customer-card/customer-card.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historique-demandes',
  templateUrl: './historique-demandes.component.html',
  styleUrls: ['./historique-demandes.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class HistoriqueDemandesComponent implements OnInit {
  customerNo: string = '';
  demandes: any[] = [];
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerCardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.customerNo = params['customerNo'];
      console.log('🔍 Customer No reçu :', this.customerNo);
      if (this.customerNo) {
        this.getCustomerRequests();
      }
    });
  }

  getCustomerRequests(): void {
    console.log(
      `📤 Envoi de la requête à : /api/requests/?customer_no=${this.customerNo}`
    );

    this.customerService.getCustomerRequests(this.customerNo).subscribe(
      (data: any) => {
        console.log('📥 Données reçues :', data);
        if (data.length > 0) {
          this.demandes = data;
          this.message = '';
        } else {
          this.message = "Ce client n'a pas encore de demandes.";
        }
      },
      (error) => {
        console.error('❌ Erreur lors du chargement des demandes:', error);
        this.message = 'Erreur de récupération des demandes.';
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
