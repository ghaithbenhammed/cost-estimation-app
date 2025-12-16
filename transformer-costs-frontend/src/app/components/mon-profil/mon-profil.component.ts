import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mon-profil.component.html',
  styleUrls: ['./mon-profil.component.css']
})
export class MonProfilComponent implements OnInit {
  user: any = null;
  isEditing: boolean = false;
  successMessage: string = '';
  photoMessage: string = '';

  formData = {
    first_name: '',
    last_name: '',
    phone_number: '',
    address: ''
  };

  apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.getUserProfile().subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (err) => {
        console.error('❌ Erreur API profil :', err);
        this.router.navigate(['/login']);
      }
    });
  }

  onEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.user) {
      this.formData.first_name = this.user.first_name;
      this.formData.last_name = this.user.last_name;
      this.formData.phone_number = this.user.phone_number;
      this.formData.address = this.user.address;
    }
  }

  onSave(): void {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    const form = new FormData();
    form.append('first_name', this.formData.first_name);
    form.append('last_name', this.formData.last_name);
    form.append('phone_number', this.formData.phone_number || '');
    form.append('address', this.formData.address || '');
  
    this.http.patch(`${this.apiUrl}/accounts/profile/update/`, form, { headers }).subscribe({
      next: (updatedUser: any) => {
        this.user = updatedUser;
        this.isEditing = false;
        this.successMessage = '✅ Profil mis à jour avec succès !';
        this.authService.updateUserData(updatedUser); // après .patch() dans onSave() et onFileSelected()

        setTimeout(() => {
          this.successMessage = '';
        }, 3000); // Efface après 3 secondes
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour du profil :', err);
      }
    });
  }
  
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;
  
    const form = new FormData();
    form.append('profile_picture', file);
  
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.patch(`${this.apiUrl}/accounts/profile/update/`, form, { headers }).subscribe({
      next: (updatedUser: any) => {
        this.user.profile_picture = updatedUser.profile_picture;
        this.photoMessage = '📸 Photo de profil mise à jour avec succès !';
  
        setTimeout(() => {
          this.photoMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Erreur upload photo :', err);
        this.photoMessage = '❌ Échec de la mise à jour de la photo.';
        setTimeout(() => {
          this.photoMessage = '';
        }, 3000);
      }
    });
  }
}  