import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatSidenavModule,
    MatTooltipModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Input() collapsed: boolean = false;
  menuItems: { title: string; icon: string; route: string }[] = [];

  ngOnInit(): void {
    const role = localStorage.getItem('role') || '';
    let dashboardRoute = '/dashboard';
    if (role === 'ResponsableEtude') {
      dashboardRoute = '/dashboard-etude';
    } else if (role === 'ResponsableCout') {
      dashboardRoute = '/dashboard-cout';
    }

    this.menuItems = [
      { title: 'Dashboard', icon: 'dashboard', route: dashboardRoute },
      { title: 'Clients', icon: 'people', route: '/customers' },
      ...(role === 'Admin' ||
      role === 'SuperAdmin' ||
      role === 'ResponsableEtude'
        ? [{ title: 'Demandes', icon: 'assignment', route: '/demandes' }]
        : []),
      { title: 'BOM', icon: 'build', route: '/bom-headers' },
      ...(role === 'Admin' ||
      role === 'SuperAdmin' ||
      role === 'ResponsableCout'
        ? [
            {
              title: 'Factures',
              icon: 'receipt_long',
              route: '/facturation-a-traiter',
            },
          ]
        : []),
      ...(role === 'Admin' || role === 'SuperAdmin'
        ? [
            {
              title: 'Admin',
              icon: 'admin_panel_settings',
              route: '/admin-users',
            },
          ]
        : []),
    ];
  }
}
