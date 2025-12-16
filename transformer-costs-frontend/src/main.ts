import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { registerables } from 'chart.js';
import { Chart } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

Chart.register(...registerables);
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimations(),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(NgChartsModule),
    importProvidersFrom(FormsModule) // ✅ Ajoute ceci pour gérer ngModel
  ]
}).catch(err => console.error(err));
