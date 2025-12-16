import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CustomerCardService } from '../customer-card/customer-card.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-manage-request',
  templateUrl: './manage-request.component.html',
  styleUrls: ['./manage-request.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ManageRequestComponent implements OnInit {
  requestForm: FormGroup;
  customerNo: string = '';
  customerName: string = '';
  successMessage: string = '';
  requestId: string = '';
  pdfFile: any;
  lastPatchedFields: string[] = [];
  suggestedTransformers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private customerService: CustomerCardService,
    private router: Router,
    private location: Location,
    private http: HttpClient
  ) {
    this.requestForm = this.fb.group({
      customerNo: [''],
      customerName: [''],
      request_type: ['', Validators.required],
      power: ['', Validators.required],
      primary_voltage: ['', Validators.required],
      secondary_voltage: ['', Validators.required],
      frequency: ['', Validators.required],
      oil_heating: ['', Validators.required],
      conductor_heating: ['', Validators.required],
      description_text: [''],
      description_file: [null],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.customerNo = params['customerNo'] || '';
      this.customerName = params['customerName'] || '';
      console.log(
        "🔍 Paramètres reçus depuis l'URL :",
        this.customerNo,
        this.customerName
      );

      this.requestForm.patchValue({
        customerNo: this.customerNo,
        customerName: this.customerName,
      });
    });
  }

  submitRequest(): void {
    if (this.requestForm.valid) {
      const values = this.requestForm.value;

      const customerNo = values.customerNo;
      const customerName = values.customerName;

      const formData = new FormData();
      formData.append('customer_no', customerNo);
      formData.append('customer_name', customerName);
      formData.append('request_type', values.request_type);
      formData.append('power', values.power);
      formData.append('primary_voltage', values.primary_voltage);
      formData.append('secondary_voltage', values.secondary_voltage);
      formData.append('frequency', values.frequency);
      formData.append('oil_heating', values.oil_heating);
      formData.append('conductor_heating', values.conductor_heating);

      if (values.description_text) {
        formData.append('description_text', values.description_text);
      }

      if (values.description_file) {
        formData.append(
          'description_file',
          values.description_file,
          values.description_file.name
        );
      }

      console.log('📤 Données envoyées au backend (FormData)', formData);

      this.customerService.addCustomerRequest(formData).subscribe(
        (response: any) => {
          this.successMessage = '✅ Demande enregistrée avec succès !';
          const requestId = response.id;

          setTimeout(() => {
            this.successMessage = '';

            this.router.navigate(['/bom-headers'], {
              queryParams: {
                customerNo,
                customerName,
                requestId,
              },
            });
          }, 2000);
        },
        (error) => {
          console.error(
            '❌ Erreur lors de la soumission de la demande :',
            error
          );
        }
      );
    }
  }
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.requestForm.patchValue({
        description_file: file,
      });
    }
  }
  aiLoadingStep = '';
  isAnalysing = false;

  analyserPDF() {
    if (!this.pdfFile) return;
    this.isAnalysing = true;
    this.aiLoadingStep = '📄 Lecture du fichier technique...';

    const formData = new FormData();
    formData.append('file', this.pdfFile, this.pdfFile.name);

    setTimeout(
      () => (this.aiLoadingStep = '🔍 Extraction des données...'),
      1500
    );
    setTimeout(
      () =>
        (this.aiLoadingStep = '🤖 Recherche des transformateurs similaires...'),
      3000
    );

    this.http
      .post<any>('http://localhost:8000/api/analyze_pdf', formData)
      .subscribe(
        (response) => {
          console.log("📩 Réponse complète de l'IA :", response);
          console.log(
            '📦 Suggestions transformateurs :',
            response.closest_descriptions_from_navision
          );

          this.requestForm.patchValue({
            power: response.puissance || '',
            frequency: response.fréquence || '',
            primary_voltage: response.tension_primaire || '',
            secondary_voltage: response.tension_secondaire || '',
            request_type: response.request_type || 'Transformateur',
          });
          this.lastPatchedFields = [
            'power',
            'frequency',
            'primary_voltage',
            'secondary_voltage',
          ];
          setTimeout(() => (this.lastPatchedFields = []), 2000);

          this.suggestedTransformers =
            response.closest_descriptions_from_navision || [];
          this.isAnalysing = false;
          this.aiLoadingStep = '';
        },
        (error) => {
          this.isAnalysing = false;
          this.aiLoadingStep = '';
          alert('Erreur IA');
        }
      );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.pdfFile = input.files[0];
    } else {
      this.pdfFile = null;
    }
  }
  useSuggestedTransformer(item: any): void {
    if (this.requestForm.valid) {
      const values = this.requestForm.value;
      const formData = new FormData();

      formData.append('customer_no', values.customerNo);
      formData.append('customer_name', values.customerName);
      formData.append('request_type', values.request_type);
      formData.append('power', values.power);
      formData.append('primary_voltage', values.primary_voltage);
      formData.append('secondary_voltage', values.secondary_voltage);
      formData.append('frequency', values.frequency);
      formData.append('oil_heating', values.oil_heating);
      formData.append('conductor_heating', values.conductor_heating);

      if (values.description_text) {
        formData.append('description_text', values.description_text);
      }

      if (values.description_file) {
        formData.append(
          'description_file',
          values.description_file,
          values.description_file.name
        );
      }

      this.customerService.addCustomerRequest(formData).subscribe(
        (response: any) => {
          const requestId = response.id;

          this.router.navigate(['/bom-gestion'], {
            queryParams: {
              requestId: requestId,
              headerNo: item,
            },
          });
        },
        (error) => {
          console.error('❌ Erreur lors de la création de la demande :', error);
          alert('Erreur lors de la création de la demande.');
        }
      );
    } else {
      alert(
        'Veuillez compléter tous les champs obligatoires avant de continuer.'
      );
    }
  }

  goBack(): void {
    this.location.back();
  }
}
