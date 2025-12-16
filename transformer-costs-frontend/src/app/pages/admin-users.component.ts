import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../services/user.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgFor],
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  userForm!: FormGroup;
  showModal = false;
  selectedFile: File | null = null;
  editMode = false;
  editingUserId: number | null = null;
  searchQuery: string = '';
  userHasPermission: boolean = true;

  userStats = [
    { label: 'Admin', count: 0 },
    { label: 'Responsable Étude', count: 0 },
    { label: 'Responsable Coût', count: 0 },
  ];

  constructor(private userService: UserService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();

    setInterval(() => {
      this.loadUsers();
    }, 10000);
  }

  initForm() {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password_confirmation: ['', Validators.required],
      title: ['', Validators.required],
      phone_number: [''],
      address: [''],
      role: ['', Validators.required],
     
    });
  }

  get filteredUsers(): User[] {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.users;

    return this.users.filter(user =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }

  openModal() {
    if (!this.userHasPermission) {
      alert("Vous n’avez pas les droits pour effectuer cette action.");
      return;
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  loadUsers() {
    this.userService.getUsers().subscribe(data => {
      this.users = data;
      this.countRoles();
    });
  }

  countRoles() {
    this.userStats = [
      {
        label: 'Admin',
        count: this.users.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin').length,
      },
      {
        label: 'Responsable Étude',
        count: this.users.filter(u => u.role === 'ResponsableEtude').length,
      },
      {
        label: 'Responsable Coût',
        count: this.users.filter(u => u.role === 'ResponsableCout').length,
      },
    ];
  }

  editUser(user: User) {
    if (!this.userHasPermission) {
      alert("Vous n’avez pas les droits pour modifier un utilisateur.");
      return;
    }

    this.editMode = true;
    this.editingUserId = user.id;
    this.showModal = true;
    this.userForm.patchValue({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      title: user.title,
      phone_number: user.phone_number,
      address: user.address,
      password: '',
      password_confirmation: '',
      role: user.role,
     
    });
  }

  deleteUser(id: number) {
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      this.userService.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  submitForm() {
    if (!this.userHasPermission) {
      alert("Action non autorisée : droits insuffisants.");
      return;
    }

    if (this.userForm.invalid) {
      alert("Merci de remplir tous les champs obligatoires correctement.");
      return;
    }

    const formData = new FormData();
    const formValues = this.userForm.value;

    Object.entries(formValues).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        formData.append(key, val as string);
      }
    });

    if (this.selectedFile) {
      formData.append('profile_picture', this.selectedFile);
    }

    if (this.editMode && this.editingUserId) {
      this.userService.updateUser(this.editingUserId, formData).subscribe({
        next: () => this.resetForm(),
        error: (err) => console.error('Erreur backend (UPDATE) :', err.error)
      });
    } else {
      this.userService.createUser(formData).subscribe({
        next: () => this.resetForm(),
        error: (err) => console.error('Erreur backend (CREATE) :', err.error)
      });
    }
  }

  toggleActivation(user: User): void {
    const newStatus = !user.is_active;
    const message = newStatus ? 'activer' : 'désactiver';

    if (confirm(`Voulez-vous vraiment ${message} ce compte ?`)) {
      const payload = { is_active: newStatus };

      this.userService.updateUser(user.id, payload).subscribe({
        next: () => {
          user.is_active = newStatus;
        },
        error: (err) => {
          console.error("Erreur lors du changement de statut :", err);
          alert("Erreur lors de la mise à jour du statut de l'utilisateur.");
        }
      });
    }
  }

  resetForm() {
    this.loadUsers();
    this.userForm.reset();
    this.selectedFile = null;
    this.editMode = false;
    this.editingUserId = null;
    this.showModal = false;
  }
}
