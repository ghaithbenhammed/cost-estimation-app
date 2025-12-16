// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SacemIndustriesComponent } from './components/sacem-industries/sacem-industries.component';
import { BomHeaderComponent } from './components/bom-header/bom-header.component';
import { BomLinesComponent } from './components/bom-lines/bom-lines.component';
import { CustomerCardComponent } from './components/customer-card/customer-card.component';
import { CompanyListComponent } from './components/company-list/company-list.component';
import { ManageRequestComponent } from './components/manage-request/manage-request.component';
import { HistoriqueDemandesComponent } from './components/historique-demandes/historique-demandes.component';
import { BomGestionComponent } from './components/bom-gestion/bom-gestion.component';
import { authGuard } from './guards/auth.guard';
import { MonProfilComponent } from './components/mon-profil/mon-profil.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatStartComponent } from './components/chat-start/chat-start.component';
import { DemandeListComponent } from './demandes/demande-list.component';
import { FacturationBomComponent } from './facturation-bom/facturation-bom.component';
import { FacturationATraiterComponent } from './components/facturation-a-traiter/facturation-a-traiter.component';
import { AdminUsersComponent } from './pages/admin-users.component';
import { DashboardEtudeComponent } from './dashboards/dashboard-etude/dashboard-etude.component';
import { DashboardCoutComponent } from './dashboards/dashboard-cout/dashboard-cout.component';
import { DashboardAdminComponent } from './dashboards/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: 'sacem-industries',
    component: SacemIndustriesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'bom-headers',
    component: BomHeaderComponent,
    canActivate: [authGuard],
  },
  { path: 'bom-lines', component: BomLinesComponent, canActivate: [authGuard] },
  {
    path: 'customers',
    component: CustomerCardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'entreprises',
    component: CompanyListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'gestion-demande',
    component: ManageRequestComponent,
    canActivate: [authGuard],
  },
  {
    path: 'historique-demandes',
    component: HistoriqueDemandesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'bom-gestion',
    component: BomGestionComponent,
    canActivate: [authGuard],
  },
  {
    path: 'mon-profil',
    component: MonProfilComponent,
    canActivate: [authGuard],
  },
  { path: 'chat', component: ChatComponent },
  { path: 'chat/start', component: ChatStartComponent },
  { path: 'demandes', component: DemandeListComponent },
  { path: 'facturation-bom', component: FacturationBomComponent },
  { path: 'facturation-a-traiter', component: FacturationATraiterComponent },
  {
    path: 'admin-users',
    component: AdminUsersComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard-etude',
    component: DashboardEtudeComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard-cout',
    component: DashboardCoutComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: DashboardAdminComponent,
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'login' },
];
