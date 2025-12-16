import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BomLinesService } from './bom-lines.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bom-lines',
  templateUrl: './bom-lines.component.html',
  styleUrls: ['./bom-lines.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BomLinesComponent implements OnInit {
  allBomLines: any[] = [];
  filteredBomLines: any[] = [];
  headerNo: string = '';
  searchColumn: string = 'Production_BOM_No';
  searchText: string = '';
  customerNo: string = '';
  customerName: string = '';
  requestId: string = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bomLinesService: BomLinesService
  ) {}

  ngOnInit(): void {
    console.log("✅ BomLinesComponent chargé !");
  
    this.route.queryParams.subscribe(params => {
      this.headerNo = params['headerNo'] || '';
      this.customerNo = params['customerNo'] || '';
      this.customerName = params['customerName'] || '';
      this.requestId = params['requestId'] || '';
      console.log("🔍 Paramètres reçus :", this.headerNo, this.customerNo, this.customerName);
      console.log("🆔 Request ID reçu :", this.requestId);
      this.loadBomLines();
    });
  }

  loadBomLines(): void {
    this.bomLinesService.getBomLines(this.headerNo).subscribe(
      (data: any[]) => {
        this.allBomLines = data;

        if (this.headerNo) {
          this.filteredBomLines = this.allBomLines.filter(
            line => line.Production_BOM_No === this.headerNo
          );
          console.log("📄 Lignes BOM filtrées :", this.filteredBomLines);
        } else {
          this.filteredBomLines = this.allBomLines;
          console.log("📄 Toutes les lignes BOM :", this.filteredBomLines);
        }
      },
      (error: any) => {
        console.error('❌ Erreur lors du chargement des lignes BOM', error);
      }
    );
  }

  searchBomLines(): void {
    if (!this.searchText.trim()) {
      this.filteredBomLines = this.allBomLines;
    } else {
      this.filteredBomLines = this.allBomLines.filter(line =>
        line[this.searchColumn]?.toString().toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
  }

  goBack(): void {
    window.history.back();
  }

  goToBomGestion(): void {
    console.log("📨 Redirection vers BOM Gestion avec client :", this.customerNo, this.customerName);

    this.router.navigate(['/bom-gestion'], {
      queryParams: {
        headerNo: this.headerNo,
        customerNo: this.customerNo,
        customerName: this.customerName,
        requestId: this.requestId 
        
      }
    });
  }
}
