import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BomHeaderService } from './bom-header.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  selector: 'app-bom-header',
  templateUrl: './bom-header.component.html',
  styleUrls: ['./bom-header.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BomHeaderComponent implements OnInit {
  bomHeaders: any[] = [];
  filteredBomHeaders: any[] = [];
  headerId: string | null = null;
  selectedHeader: any = null;

  searchColumn: string = 'No';
  searchText: string = '';
  customerNo: string = '';
  customerName: string = '';
  requestId: string = '';

  constructor(
    private route: ActivatedRoute,
    private bomHeaderService: BomHeaderService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log("✅ BomHeaderComponent chargé !");

    this.route.params.subscribe(params => {
      this.headerId = params['id'] || null;
      console.log("🔍 ID récupéré :", this.headerId);
    });

    this.route.queryParams.subscribe(queryParams => {
      this.customerNo = queryParams['customerNo'] || '';
      this.customerName = queryParams['customerName'] || '';
      this.requestId = queryParams['requestId'] || '';
      console.log("🧾 Client transmis :", this.customerNo, this.customerName);
      console.log("🆔 Request ID transmis :", this.requestId);
    });

    this.loadBomHeaders();
  }
  loading = true;
  currentPage = 1;
  pageSize = 8;
  paginatedBomHeaders: any[] = [];
  totalPages = 1;

  loadBomHeaders(): void {
    this.bomHeaderService.getBomHeaders().subscribe(
      (data: any[]) => {
        if (this.headerId) {
          this.bomHeaders = data.filter(header => header.No === this.headerId);
        } else {
          this.bomHeaders = data;
        }
        this.filteredBomHeaders = this.bomHeaders;
        console.log('📑 En-têtes BOM chargées:', this.filteredBomHeaders);
        this.searchBomHeaders();
        this.loading = false;
      },
      (error: any) => {
        console.error('❌ Erreur lors de la récupération des en-têtes BOM', error);
        this.loading = false;
      }
    );
  }

  searchBomHeaders(): void {
    if (!this.searchText.trim()) {
      this.filteredBomHeaders = this.bomHeaders;
    } else {
      this.filteredBomHeaders = this.bomHeaders.filter(header =>
        header[this.searchColumn].toString().toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
    this.paginate();
  }
  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.totalPages = Math.ceil(this.filteredBomHeaders.length / this.pageSize);
    this.paginatedBomHeaders = this.filteredBomHeaders.slice(start, end);
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginate();
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginate();
    }
  }
  selectBomHeader(header: any): void {
    this.selectedHeader = header;
  }

  goToBomLinesForHeader(headerNo: string): void {
    this.router.navigate(['/bom-lines'], {
      queryParams: {
        headerNo,
        customerNo: this.customerNo,
        customerName: this.customerName,
        requestId: this.requestId 
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.location.back();
    }
  }
}
