import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../services/request.service';

@Component({
  selector: 'app-demande-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-list.component.html',
  styleUrls: ['./demande-list.component.css'],
})
export class DemandeListComponent implements OnInit {
  demandes: any[] = [];
  filteredDemandes: any[] = [];
  selectedStatus: string = 'all';

  constructor(private requestService: RequestService, private router: Router) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.requestService.getAllRequests().subscribe(
      (data) => {
        this.demandes = data;
        this.filteredDemandes = data;
      },
      (error) =>
        console.error('Erreur lors du chargement des demandes :', error)
    );
  }

  filterByStatus(): void {
    this.filteredDemandes =
      this.selectedStatus === 'all'
        ? this.demandes
        : this.demandes.filter((d) => d.status === this.selectedStatus);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return '🕒 En attente';
      case 'completed':
        return '✅ Terminée';
      case 'rejected':
        return '❌ Rejetée';
      default:
        return '❓ Inconnu';
    }
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge badge-pending';
      case 'completed':
        return 'badge badge-completed';
      case 'rejected':
        return 'badge badge-rejected';
      default:
        return 'badge';
    }
  }

  updateStatus(demande: any): void {
    this.requestService
      .updateRequestStatus(demande.id, demande.status)
      .subscribe(
        () => console.log('✅ Statut mis à jour :', demande.status),
        (error) => console.error('❌ Erreur lors de la mise à jour :', error)
      );
  }

  supprimerDemande(demande: any): void {
    if (
      confirm(
        `❗ Confirmer la suppression de la demande pour ${
          demande.customer_name || 'Client'
        } ?`
      )
    ) {
      this.requestService.deleteRequest(demande.id).subscribe(
        () => {
          this.demandes = this.demandes.filter((d) => d.id !== demande.id);
          this.filterByStatus();
          console.log('🗑️ Demande supprimée');
        },
        (error) => console.error('❌ Erreur lors de la suppression :', error)
      );
    }
  }

  voirNomenclature(demande: any): void {
    const isReadOnly = demande.status === 'completed';
    this.router.navigate(['/bom-gestion'], {
      queryParams: {
        requestId: demande.id,
        customerNo: demande.customer_no,
        customerName: demande.customer_name,
        readonly: isReadOnly,
      },
    });
  }
}
