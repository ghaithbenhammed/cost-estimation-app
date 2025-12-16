import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; 
import { FilterPipe } from './filter.pipe';  // Import de la pipe
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),  // Si tu as des routes, ajoute-les ici
    provideHttpClient(),  // Pour les requêtes HTTP
    FormsModule,
    FilterPipe,
    RouterModule,  // Ajouter la pipe ici
  ]
};
