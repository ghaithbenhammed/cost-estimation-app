import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-facturation-bom',
  standalone: true,
  templateUrl: './facturation-bom.component.html',
  styleUrls: ['./facturation-bom.component.css'],
  imports: [CommonModule, FormsModule],
})
export class FacturationBomComponent implements OnInit {
  requestId: string = '';
  bom: any = null;
  lignesFacture: any[] = [];
  total: number = 0;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.requestId = params['requestId'];
      if (this.requestId) {
        this.chargerBOM();
      }
    });
  }

  chargerBOM(): void {
    this.loading = true;
    this.http
      .get<any>(
        `http://127.0.0.1:8000/api/saved-bom/?request_id=${this.requestId}`
      )
      .subscribe((bom) => {
        this.bom = bom;
        this.lignesFacture = [];
        this.total = 0;

        const lignes = [...bom.lines];
        let processed = 0;
        const totalLignes = lignes.length;

        lignes.forEach((line) => {
          const codeValide = line.code && line.code.trim() !== '';

          if (!line.is_custom && codeValide) {
            this.http
              .get<any>(`http://127.0.0.1:8000/api/item-cost/${line.code}/`)
              .subscribe(
                (itemData) => {
                  const prixUnitaire = itemData.unit_cost || 0;
                  const quantite = parseFloat(line.quantite) || 0;

                  this.lignesFacture.push({
                    ...line,
                    designation: itemData.designation || line.designation,
                    prix_unitaire: prixUnitaire,
                    prix_personnalise: prixUnitaire,
                    posting_date: itemData.posting_date || '-',
                    total_ligne: (prixUnitaire * quantite).toFixed(2),
                  });

                  processed++;
                  if (processed === totalLignes) {
                    this.recalculerTotal();
                    this.loading = false;
                  }
                },
                () => {
                  this.lignesFacture.push({
                    ...line,
                    prix_unitaire: 0,
                    prix_personnalise: 0,
                    posting_date: '-',
                    total_ligne: 0,
                  });
                  processed++;
                  if (processed === totalLignes) {
                    this.recalculerTotal();
                    this.loading = false;
                  }
                }
              );
          } else {
            this.lignesFacture.push({
              ...line,
              prix_unitaire: 0,
              prix_personnalise: 0,
              posting_date: '-',
              total_ligne: 0,
            });
            processed++;
            if (processed === totalLignes) {
              this.recalculerTotal();
              this.loading = false;
            }
          }
        });
      });
  }

  recalculerTotal(): void {
    this.total = 0;
    this.lignesFacture.forEach((ligne) => {
      const prix = parseFloat(ligne.prix_personnalise) || 0;
      const quantite = parseFloat(ligne.quantite) || 0;
      const totalLigne = prix * quantite;
      ligne.total_ligne = totalLigne.toFixed(2);
      this.total += totalLigne;
    });
  }

  async genererFacturePDF(): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');

    const logo = await this.getImageFromAssets('assets/sacem-logo.jpg');

    if (logo) {
      doc.addImage(logo, 'PNG', 10, 10, 40, 20);
    }

    // En-tête entreprise
    doc.setFontSize(18);
    doc.text('FACTURE DE TRANSFORMATEUR', 60, 20);

    // Infos Client
    doc.setFontSize(12);
    doc.text(`Client: ${this.bom.client_name}`, 10, 40);
    doc.text(`Dossier: ${this.bom.dossier}`, 10, 46);
    doc.text(`Date: ${this.bom.date_creation}`, 10, 52);

    // Table
    autoTable(doc, {
      head: [
        [
          'Code',
          'Désignation',
          'Quantité',
          'Prix Unitaire (TND)',
          'Total Ligne (TND)',
        ],
      ],
      body: this.lignesFacture.map((ligne) => [
        ligne.code || '-',
        ligne.designation || '-',
        ligne.quantite,
        ligne.prix_personnalise.toFixed(3),
        ligne.total_ligne,
      ]),
      startY: 60,
      headStyles: { fillColor: [89, 165, 179] },
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { top: 60 },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text(`Total Global: ${this.total.toFixed(2)} TND`, 10, finalY);

    // Télécharger
    doc.save(`Facture_${this.bom.client_name}_${this.bom.dossier}.pdf`);

    // Changer statut
    this.changerStatutEmise();
  }

  changerStatutEmise(): void {
    const token = localStorage.getItem('access');

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    this.http
      .patch(
        `http://127.0.0.1:8000/api/factures/${this.bom.id}/update-status/`,
        { status: 'emise' },
        { headers }
      )
      .subscribe({
        next: () => {
          alert('✅ Facture marquée comme Émise avec succès.');
          this.router.navigate(['/facturation-a-traiter'], {
            queryParams: { refresh: Date.now() },
          });
        },
        error: (err) => {
          console.error('Erreur changement de statut:', err);
        },
      });
  }

  getImageFromAssets(path: string): Promise<string | null> {
    return fetch(path)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => null);
  }

  getImageFromUrl(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}
