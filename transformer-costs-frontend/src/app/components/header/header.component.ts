import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Output, EventEmitter } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  user: any = null;
  showMenu = false;
  showHeader = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications = false;

  private refreshInterval: any;
  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.userSub = this.authService.userData$.subscribe((data) => {
        if (data) {
          this.user = data;
        } else {
          this.authService.getUserProfile().subscribe({
            next: (res) => {
              this.user = res;
              this.authService.updateUserData(res);
            },
            error: () => {
              this.user = null;
            },
          });
        }
      });
    }

    this.loadNotifications();
    this.refreshInterval = setInterval(() => {
      if (!this.showNotifications) {
        this.loadNotifications();
      }
    }, 5000);
  }

  // Fermer les menus si on clique en dehors
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.eRef.nativeElement.contains(target)) {
      this.showMenu = false;
      this.showNotifications = false;
    }
  }

  handleNotificationClick(notification: any): void {
    if (!notification.is_read) {
      notification.is_read = true;
      this.unreadCount = this.notifications.filter((n) => !n.is_read).length;

      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (err) => {
          console.error('Erreur lors du marquage comme lu', err);
        },
      });
    }

    // Fermer le panneau de notifications
    this.showNotifications = false;

    const content = notification.content.toLowerCase();
    if (content.includes('facture')) {
      this.router.navigate(['/facturation-a-traiter']);
    } else if (content.includes('message')) {
      this.router.navigate(['/chat']);
    } else if (content.includes('tentative')) {
      this.router.navigate(['/admin-users']);
    } else {
      this.router.navigate(['/']);
    }
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  goToProfile() {
    this.router.navigate(['/mon-profil']);
  }

  logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    this.authService.updateUserData(null);
    this.snackBar.open('Vous avez été déconnecté avec succès.', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }

  goToChat(): void {
    this.router.navigate(['/chat']);
  }

  loadNotifications(): void {
    const oldUnreadCount = this.unreadCount;

    this.notificationService.getNotifications().subscribe(
      (data) => {
        this.notifications = data;
        this.unreadCount = this.notifications.filter((n) => !n.is_read).length;

        if (this.unreadCount > oldUnreadCount && !this.showNotifications) {
          const latest = this.notifications.find((n) => !n.is_read);
          if (latest) {
            this.snackBar
              .open(`🔔 ${latest.content}`, 'Voir', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              })
              .onAction()
              .subscribe(() => {
                this.handleNotificationClick(latest);
              });
          }
        }
      },
      (error) => {
        console.error('Erreur lors du chargement des notifications', error);
      }
    );
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}
