import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  loginAttempts: number = 0;
  returnUrl: string = '/';
  successMessage: string = '';
  isBlocked = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Réinitialise les messages quand l'utilisateur modifie un champ
    this.loginForm
      .get('email')
      ?.valueChanges.subscribe(() => this.resetMessages());
    this.loginForm
      .get('password')
      ?.valueChanges.subscribe(() => this.resetMessages());
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          this.successMessage = 'Connexion réussie ! Redirection en cours...';

          setTimeout(() => {
            this.authService.getUserProfile().subscribe((user: any) => {
              //  Stocker le rôle pour le sidebar
              localStorage.setItem('role', user.role);
              this.authService.updateUserData(user);

              //  Redirection selon rôle
              if (user.role === 'SuperAdmin' || user.role === 'Admin') {
                this.router.navigateByUrl('/entreprises', { replaceUrl: true });
              } else if (user.role === 'ResponsableEtude') {
                this.router.navigateByUrl('/dashboard-etude', {
                  replaceUrl: true,
                });
              } else if (user.role === 'ResponsableCout') {
                this.router.navigateByUrl('/dashboard-cout', {
                  replaceUrl: true,
                });
              } else {
                this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
              }
            });
          }, 1000);
        },
        error: (err: any) => {
          const detail = err.error?.detail || '';

          if (detail.includes('désactivé')) {
            this.errorMessage = detail;
            this.isBlocked = true;
            return;
          }

          this.loginAttempts++;

          if (this.loginAttempts >= 2) {
            this.errorMessage =
              '2 tentatives échouées. Un mail a été envoyé au SuperAdmin.';
          } else {
            this.errorMessage = 'Email ou mot de passe incorrect.';
          }
        },
      });
    }
  }

  resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
