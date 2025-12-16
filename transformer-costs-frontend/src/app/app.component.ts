import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SidebarComponent } from './components/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    SidebarComponent,  // Ajouter le composant sidebar
    HeaderComponent,   // Ajouter le composant header
    RouterOutlet      // Router outlet pour la navigation dynamique
  ]
})
export class AppComponent {
  title = 'SACEM INDUSTRIES';
  showHeader: boolean = false;
  sidebarCollapsed = false;
  showSidebar: boolean = false;
  
  constructor(
    
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        const isLoginPage = url.includes('/login');
        const isLoggedIn = this.authService.isLoggedIn();

        // Afficher ou masquer le header/sidebar selon l'état de connexion
        this.showHeader = !isLoginPage && isLoggedIn;
        this.showSidebar = !isLoginPage && isLoggedIn;

      });
  }
  
  // Méthode pour basculer l'état de la sidebar
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

}
