import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BomHeaderService } from '../bom-header/bom-header.service';
import { BomLinesService } from '../bom-lines/bom-lines.service';

@Component({
  selector: 'app-bom-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bom-gestion.component.html',
  styleUrls: ['./bom-gestion.component.css'],
})
export class BomGestionComponent implements OnInit {
  headerNo: string = '';
  customerNo: string = '';
  customerName: string = '';
  requestId: string = '';
  nomenclatureDate: string = '';
  bomHeader: any = null;
  bomLines: any[] = [];
  customBomLines: any[] = [
    {
      code: '',
      designation: '',
      unite: '',
      quantite: 0,
      remarque: '',
      is_custom: true,
    },
  ];
  readonlyMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bomHeaderService: BomHeaderService,
    private bomLinesService: BomLinesService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.readonlyMode = params['readonly'] === 'true';
      this.requestId = params['requestId'] || '';
      this.customerNo = params['customerNo'] || '';
      this.customerName = params['customerName'] || '';
      this.headerNo = params['headerNo'] || '';
      this.nomenclatureDate = new Date().toISOString().slice(0, 10);

      if (this.requestId) {
        this.http
          .get<any>(
            `http://127.0.0.1:8000/api/saved-bom/?request_id=${this.requestId}`
          )
          .subscribe(
            (data) => {
              if (
                data &&
                data.client_no &&
                data.client_name &&
                data.lines.length > 0
              ) {
                console.log('✅ Vraie nomenclature existante trouvée :', data);
                this.customerNo = data.client_no;
                this.customerName = data.client_name;
                this.headerNo = data.objet;
                this.bomHeader = {
                  Design_File_no: data.dossier,
                  No: data.objet,
                };
                this.customBomLines = data.lines.filter(
                  (l: any) => l.is_custom
                );
                this.nomenclatureDate = data.date_creation;

                this.bomLinesService.getBomLines().subscribe((lines) => {
                  this.bomLines = lines
                    .filter((l: any) => l.Production_BOM_No === this.headerNo)
                    .map((l: any) => ({
                      ...l,
                      remarque:
                        data.lines.find((dl: any) => dl.code === l.No)
                          ?.remarque || '',
                    }));
                });
              } else {
                console.warn(
                  '📭 Aucune vraie nomenclature trouvée — création normale.'
                );
                this.initCreationMode(params);
              }
            },
            (err) => {
              console.warn('❌ Erreur GET nomenclature — création normale.');
              this.initCreationMode(params);
            }
          );
      } else {
        console.warn('⚠️ Pas de requestId — création normale.');
        this.initCreationMode(params);
      }
    });
  }

  initCreationMode(params: any): void {
    this.customerNo = params['customerNo'] || '';
    this.customerName = params['customerName'] || '';
    this.headerNo = params['headerNo'] || '';
    this.loadBomHeaderAndLines();
  }

  loadBomHeaderAndLines(): void {
    this.bomHeaderService.getBomHeaders().subscribe((headers) => {
      this.bomHeader = headers.find((h) => h.No === this.headerNo);
    });

    this.bomLinesService.getBomLines().subscribe((lines) => {
      this.bomLines = lines
        .filter((line) => line.Production_BOM_No === this.headerNo)
        .map((line) => ({ ...line, remarque: '' }));
    });
  }

  addCustomLine(): void {
    this.customBomLines.push({
      code: '',
      designation: '',
      unite: '',
      quantite: 0,
      remarque: '',
      is_custom: true,
    });
  }

  confirmerBOM(): void {
    if (!this.requestId) {
      alert('❌ Impossible de valider : aucun ID de demande détecté.');
      return;
    }

    const lignesNavision = this.bomLines.map((line) => ({
      code: line.No || '',
      designation: line.Description || '',
      unite: line.Unit_of_Measure_Code || '',
      quantite: parseFloat(line.Quantity_per) || 0,
      remarque: line.remarque || '',
      is_custom: false,
    }));

    const lignesPersonnalisees = this.customBomLines
      .filter((line) => line.designation && line.quantite > 0)
      .map((line) => ({
        code: line.code || '',
        designation: line.designation,
        unite: line.unite || '',
        quantite: parseFloat(line.quantite),
        remarque: line.remarque || '',
        is_custom: true,
      }));

    const allLines = [...lignesNavision, ...lignesPersonnalisees];

    const payload = {
      dossier: this.bomHeader?.Design_File_no || '',
      objet: this.bomHeader?.No || '',
      client_no: this.customerNo,
      client_name: this.customerName,
      date_creation: this.nomenclatureDate,
      request: this.requestId,
      lines: allLines,
    };

    console.log('📦 Payload final prêt :', payload);

    this.http.post('http://127.0.0.1:8000/api/save-bom/', payload).subscribe(
      (res) => {
        alert('✅ Nomenclature enregistrée avec succès !');
        console.log('📨 Réponse backend :', res);
        this.router.navigate(['/demandes']);
      },
      (err) => {
        console.error("❌ Erreur lors de l'enregistrement :", err);
        alert("❌ Une erreur est survenue lors de l'enregistrement.");
      }
    );
  }

  goBackToBomLines(): void {
    this.router.navigate(['/bom-lines'], {
      queryParams: {
        headerNo: this.headerNo,
        customerNo: this.customerNo,
        customerName: this.customerName,
        requestId: this.requestId,
      },
    });
  }
}
