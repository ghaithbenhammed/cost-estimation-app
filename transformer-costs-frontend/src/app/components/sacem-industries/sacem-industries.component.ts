import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SacemIndustriesService } from './sacem-industries.service';
import { CustomerCardService } from '../customer-card/customer-card.service';
import { BomHeaderService } from '../bom-header/bom-header.service';
import { BomLinesService } from '../bom-lines/bom-lines.service';
import { Router, RouterModule } from '@angular/router';  
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FilterPipe } from '../../filter.pipe'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';




@Component({
  selector: 'app-sacem-industries',
  templateUrl: './sacem-industries.component.html',
  styleUrls: ['./sacem-industries.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule] 
})
export class SacemIndustriesComponent implements OnInit {
  companyDetails: any;

  isLoading: boolean = false;
  showCustomerCards: boolean = false;
  bomHeaders: any[] = [];
  allBomLines: any[] = []; 
  filteredBomLines: any[] = []; 
  showBomHeaders: boolean = false;
  showBomLines: boolean = false;
  selectedHeader: any = null;
  searchBomHeader: string = '';
  searchBomLine: string = '';
  searchColumnHeader: string = 'Production_BOM_No';
  searchColumnLine: string = 'Line_No';

  searchText: string = '';
  searchColumn: string = 'Name'
  showTable: boolean = false;
  showCustomerDetails: boolean = false;


 


  // Mode Facture
  isFactureMode: boolean = false;
  isHeaderSelected: boolean = false; 
  selectedBomNo: string = '';
  selectedDesignFileNo: string = '';
  selectedQuantity: number = 1;
  selectedDate: string = '';
  todayDate: string = new Date().toISOString().split('T')[0];

  itemsData: any[] = []; 

  constructor(
    private sacemIndustriesService: SacemIndustriesService,
    private bomHeaderService: BomHeaderService,
    private bomLinesService: BomLinesService,
    private router: Router,  
    private location: Location,  
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.selectedHeader = null;
    this.loadCompanyDetails();
    
    
  }

  // Récupère les détails de SACEM INDUSTRIES via SacemIndustriesService
  loadCompanyDetails(): void {
    this.sacemIndustriesService.getDetails().subscribe(
      (data) => {
        this.companyDetails = data;
        console.log('Détails de SACEM INDUSTRIES :', this.companyDetails);
      },
      (error) => {
        console.error('Erreur lors de la récupération des détails de SACEM INDUSTRIES :', error);
      }
    );
  }
  goToCustomers(): void {
    console.log("Navigation vers : /customers");  // Vérifie si ce log apparaît
    this.router.navigate(['/customers']);
  }
  goToBomHeaders(headerId?: string): void {
    const path = headerId ? `/bom-headers/${headerId}` : '/bom-headers';
    console.log("Navigation vers :", path);
    this.router.navigate([path]);
  }
  goToBomLines(): void {
    this.router.navigate(['/bom-lines']); // ✅ Navigation vers la page des lignes BOM
  }
  
  // ✅ Lorsqu'on clique sur un en-tête BOM, on navigue vers les lignes associées
  goToBomLinesForHeader(headerNo: string): void {
    this.router.navigate(['/bom-lines'], { queryParams: { headerNo } }); // ✅ Passage de l'ID BOM Header
  }
  
  
 
  toggleFactureMode(): void {
    this.isFactureMode = !this.isFactureMode;
    if (this.isFactureMode) {
      
      this.selectedHeader = null;
      this.isHeaderSelected = false;
    }
    this.showBomHeaders = true;
    this.showBomLines = false;
  }

  calculateTotal(line: any): number {
    return line.Quantity_per * (line.customPrice || line.Unit_Cost);
  }

  generatePDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Facture - SACEM INDUSTRIE', 70, 15);
    doc.setFontSize(12);
    doc.text(`Objet (No BOM): ${this.selectedBomNo}`, 14, 30);
    autoTable(doc, {
      startY: 70,
      head: [['N', 'Désignation', 'Qté', 'Code', 'Prix', 'Total']],
      body: this.filteredBomLines.map(line => [
        line.N,
        line.Description,
        line.Quantity_per,
        line.No,
        line.Unit_Cost,
        this.calculateTotal(line)
      ]),
    });
    doc.save(`Facture_SACEM_${this.selectedBomNo}.pdf`);
  }

  goBack(): void {
    this.location.back();
  }
}
