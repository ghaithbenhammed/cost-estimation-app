import { Component, OnInit } from '@angular/core';
import { CompanyListService } from './company-list.service';
import { BomHeaderService } from '../bom-header/bom-header.service';
import { BomLinesService } from '../bom-lines/bom-lines.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Company {
  name: string;
  displayName: string;
  id: string;
  businessProfileId: string;
  [key: string]: string;
}

@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CompanyListComponent implements OnInit {
  companies: Company[] = [];
  isLoading: boolean = false;
  bomDetails: any[] = [];
  bomLines: any[] = [];
  showBomDetails: boolean = false;
  searchText: string = '';
  showBomLines: boolean = false;
  searchColumn: string = 'name';
  testMode: boolean = false;
  bomHeaders: any[] = [];

  constructor(
    private companyListService: CompanyListService,
    private bomHeaderService: BomHeaderService,
    private bomLinesService: BomLinesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.companyListService.getCompanies().subscribe(
      (data: Company[]) => {
        this.companies = data ?? [];
        console.log('Liste des entreprises chargée :', this.companies);
        this.isLoading = false;
      },
      (error) => {
        console.error(
          'Erreur lors de la récupération des entreprises :',
          error
        );
        this.isLoading = false;
      }
    );
  }

  filterByColumn() {
    return this.companies.filter((company) => {
      const columnValue = company[this.searchColumn as keyof Company];
      return columnValue?.toLowerCase().includes(this.searchText.toLowerCase());
    });
  }

  viewDetails(companyName: string): void {
    if (companyName === 'SACEM INDUSTRIES') {
      this.router.navigate(['/sacem-industries']);
    } else {
      alert('Les détails ne sont disponibles que pour SACEM INDUSTRIES.');
    }
  }

  loadBomHeaders(): void {
    this.bomHeaderService.getBomHeaders().subscribe(
      (data: any[]) => {
        this.bomHeaders = data;
        this.showBomDetails = true;
        this.showBomLines = false;
        console.log('En-têtes BOM :', this.bomHeaders);
      },
      (error: any) => {
        console.error(
          'Erreur lors de la récupération des en-têtes BOM :',
          error
        );
      }
    );
  }

  loadBomLines(header: any): void {
    this.bomLinesService.getBomLines(header.No).subscribe(
      (data) => {
        this.bomLines = data;
        this.showBomLines = true;
        this.showBomDetails = false;
        console.log('Lignes BOM :', this.bomLines);
      },
      (error) => {
        console.error('Erreur lors de la récupération des lignes BOM :', error);
      }
    );
  }
}
