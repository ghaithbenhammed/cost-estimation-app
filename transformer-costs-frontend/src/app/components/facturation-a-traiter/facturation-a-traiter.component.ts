import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-facturation-a-traiter',
  standalone: true,
  templateUrl: './facturation-a-traiter.component.html',
  styleUrls: ['./facturation-a-traiter.component.css'],
  imports: [CommonModule, FormsModule]
})
export class FacturationATraiterComponent implements OnInit {
  boms: any[] = [];
  filteredBoms: any[] = [];
  loading: boolean = true;
  selectedStatus: string = 'all';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(() => {
      this.chargerBoms();
    });
    setInterval(() => {
    this.chargerBoms();
   }, 10000);
  }

  chargerBoms(): void {
    this.loading = true;
    this.http.get<any[]>('http://127.0.0.1:8000/api/boms-to-invoice/')
      .subscribe({
        next: (data) => {
          this.boms = data;
          this.applyFilter();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement BOMs:', err);
          this.loading = false;
        }
      });
  }

  allerVersFacturation(requestId: number): void {
    this.router.navigate(['/facturation-bom'], {
      queryParams: { requestId }
    });
  }

  applyFilter(): void {
    if (this.selectedStatus === 'all') {
      this.filteredBoms = this.boms;
    } else {
      this.filteredBoms = this.boms.filter(bom => bom.status === this.selectedStatus);
    }
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Inconnu';

    const normalized = status.toLowerCase().replace(/\s/g, '_');
    switch (normalized) {
      case 'en_cours': return 'En cours';
      case 'emise': return 'Émise';
      default: return 'Inconnu';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'en_cours': return 'badge-en-cours';
      case 'emise': return 'badge-emise';
      default: return 'badge-inconnu';
    }
  }

  changerStatut(bom: any): void {
    const nouveauStatut = bom.status === 'en_cours' ? 'emise' : 'en_cours';
    const confirmation = bom.status === 'en_cours'
      ? 'Confirmer que cette facture est émise ?'
      : 'Remettre cette facture en cours ?';

    if (!confirm(confirmation)) return;

    this.http.patch(`http://127.0.0.1:8000/api/factures/${bom.id}/update-status/`, {
      status: nouveauStatut
    }).subscribe({
      next: () => {
        bom.status = nouveauStatut;
        this.applyFilter();
      },
      error: (err) => {
        console.error('Erreur lors du changement de statut:', err);
        alert("Erreur lors de la mise à jour du statut.");
      }
    });
  }
supprimerFacture(facture: any): void {
  if (confirm(`Voulez-vous supprimer la facture du client ${facture.client_name} ?`)) {
    const token = localStorage.getItem('access'); // 🔐 récupère le token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`http://127.0.0.1:8000/api/factures/${facture.id}/`, { headers }).subscribe({
      next: () => {
        // Supprimer localement
        this.boms = this.boms.filter(f => f.id !== facture.id);
        this.applyFilter();
      },
      error: err => {
        console.error("Erreur lors de la suppression de la facture :", err);
        alert("❌ Impossible de supprimer la facture.");
      }
    });
  }
}


}
