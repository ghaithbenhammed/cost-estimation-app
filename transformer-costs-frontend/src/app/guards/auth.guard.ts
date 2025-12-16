import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class authGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access');
    console.log("🛡️ Vérification du token :", token);
    
    if (token) {
      return true;  // Si l'utilisateur est authentifié, permet l'accès à la route
    } else {
      // Si l'utilisateur n'est pas authentifié, redirige vers la page de login
      this.router.navigate(['/login']);
      return false;
    }
  }
}
