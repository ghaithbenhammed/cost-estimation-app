import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardAdminComponent implements OnInit, AfterViewInit {
  totalDemandes = 0;
  totalFactures = 0;
  tauxValidation = 0;
  tauxGeneration = 0;
  variationValidation: number | null = null;
  variationGeneration: number | null = null;
  dernieresDemandes: any[] = [];
  dernieresFactures: any[] = [];
  timeline: any[] = [];
  afficherTout = false;
  chartsReady = false;

  @ViewChild('barChart', { static: false })
  barChartDirective?: BaseChartDirective<'bar'>;
  @ViewChild('pieChart', { static: false })
  pieChartDirective?: BaseChartDirective<'doughnut'>;
  @ViewChild('pieChartContainer', { static: false })
  pieChartContainerRef?: ElementRef;

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Demandes',
        data: [],
        backgroundColor: 'rgba(59,130,246,0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
      {
        label: 'Factures',
        data: [],
        backgroundColor: 'rgba(16,185,129,0.6)',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { display: true },
    },
  };

  pieChartType: 'doughnut' = 'doughnut';

  pieChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [
      'Demandes - En attente',
      'Demandes - Terminée',
      'Demandes - Rejetée',
      'Factures - En cours',
      'Factures - Émise',
    ],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#facc15',
          '#10b981',
          '#ef4444',
          '#60a5fa',
          '#6366f1',
        ],
        hoverOffset: 12,
      },
    ],
  };

  pieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#4b5563',
          font: {
            size: 14,
            family: 'Segoe UI',
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value: any, ctx: any) => {
          const total = ctx.chart.data.datasets[0].data.reduce(
            (a: any, b: any) => a + b,
            0
          );
          return total ? `${((value / total) * 100).toFixed(1)}%` : '';
        },
      },
    },
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
    setInterval(() => this.loadData(), 30000);
  }

  ngAfterViewInit(): void {
    const container = this.pieChartContainerRef?.nativeElement;
    if (container && 'ResizeObserver' in window && this.pieChartDirective) {
      const observer = new ResizeObserver(() => {
        this.pieChartDirective?.chart?.resize();
      });
      observer.observe(container);
    }
  }

  isPieDataReady(): boolean {
    return (
      this.chartsReady &&
      this.pieChartData &&
      this.pieChartData.datasets &&
      this.pieChartData.datasets.length > 0 &&
      this.pieChartData.datasets[0].data.some((val) => val > 0)
    );
  }

  loadData(): void {
    this.timeline = [];

    const demandes$ = this.http.get<any[]>(
      'http://127.0.0.1:8000/api/requests/'
    );
    const factures$ = this.http.get<any[]>(
      'http://127.0.0.1:8000/api/boms-to-invoice/'
    );

    demandes$.subscribe((demandes) => {
      this.totalDemandes = demandes.length;
      const valides = demandes.filter(
        (d) => d.status === 'completed' && d.validated_at
      );
      const rejetes = demandes.filter((d) => d.status === 'rejected');
      const pending = demandes.filter((d) => d.status === 'pending');

      this.tauxValidation = Math.round(
        (valides.length / Math.max(1, demandes.length)) * 100
      );

      const groupedDemandes: Record<string, number> = {};
      demandes.forEach((d) => {
        const date = new Date(d.created_at).toLocaleDateString();
        groupedDemandes[date] = (groupedDemandes[date] || 0) + 1;
      });

      this.barChartData.labels = Object.keys(groupedDemandes);
      this.barChartData.datasets[0].data = Object.values(groupedDemandes);

      this.pieChartData.datasets[0].data[0] = pending.length;
      this.pieChartData.datasets[0].data[1] = valides.length;
      this.pieChartData.datasets[0].data[2] = rejetes.length;

      this.dernieresDemandes = demandes
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      const aujourdHui = new Date();
      const septJours = 7 * 24 * 3600 * 1000;

      const periodeActuelle = demandes.filter(
        (d) =>
          new Date(d.created_at).getTime() >= aujourdHui.getTime() - septJours
      );
      const periodePrecedente = demandes.filter((d) => {
        const t = new Date(d.created_at).getTime();
        return (
          t < aujourdHui.getTime() - septJours &&
          t >= aujourdHui.getTime() - 2 * septJours
        );
      });

      const validesActuels = periodeActuelle.filter(
        (d) => d.status === 'completed' && d.validated_at
      );
      const validesAnciens = periodePrecedente.filter(
        (d) => d.status === 'completed' && d.validated_at
      );

      const tauxActuel =
        (validesActuels.length / Math.max(1, periodeActuelle.length)) * 100;
      const tauxAncien =
        (validesAnciens.length / Math.max(1, periodePrecedente.length)) * 100;
      this.variationValidation = +(tauxActuel - tauxAncien).toFixed(1);

      this.timeline.push(
        ...demandes.map((d) => ({
          type: 'demande',
          date: new Date(d.created_at),
          client: d.customer_name,
          statut: d.status,
          label: d.request_type,
        }))
      );

      this.cdr.detectChanges();
    });

    factures$.subscribe((factures) => {
      this.totalFactures = factures.length;
      const emises = factures.filter((f) => f.status === 'emise');
      const encours = factures.filter((f) => f.status === 'en_cours');

      this.tauxGeneration = Math.round(
        (emises.length / Math.max(1, factures.length)) * 100
      );

      const groupedFactures: Record<string, number> = {};
      factures.forEach((f) => {
        const date = new Date(f.date_creation).toLocaleDateString();
        groupedFactures[date] = (groupedFactures[date] || 0) + 1;
      });

      this.barChartData.datasets[1].data = (
        this.barChartData.labels as string[]
      ).map((label) => groupedFactures[label] || 0);

      this.pieChartData.datasets[0].data[3] = encours.length;
      this.pieChartData.datasets[0].data[4] = emises.length;

      this.dernieresFactures = factures
        .sort(
          (a, b) =>
            new Date(b.date_creation).getTime() -
            new Date(a.date_creation).getTime()
        )
        .slice(0, 5);

      const aujourdHui = new Date();
      const septJours = 7 * 24 * 3600 * 1000;

      const periodeActuelle = factures.filter(
        (f) =>
          new Date(f.date_creation).getTime() >=
          aujourdHui.getTime() - septJours
      );
      const periodePrecedente = factures.filter(
        (f) =>
          new Date(f.date_creation).getTime() <
            aujourdHui.getTime() - septJours &&
          new Date(f.date_creation).getTime() >=
            aujourdHui.getTime() - 2 * septJours
      );

      const emisesActuelles = periodeActuelle.filter(
        (f) => f.status === 'emise'
      );
      const emisesAnciennes = periodePrecedente.filter(
        (f) => f.status === 'emise'
      );

      const tauxActuel =
        (emisesActuelles.length / Math.max(1, periodeActuelle.length)) * 100;
      const tauxAncien =
        (emisesAnciennes.length / Math.max(1, periodePrecedente.length)) * 100;
      this.variationGeneration = +(tauxActuel - tauxAncien).toFixed(1);

      this.timeline.push(
        ...factures.map((f) => ({
          type: 'facture',
          date: new Date(f.date_creation),
          client: f.client_name,
          statut: f.status,
          label: f.objet,
        }))
      );

      this.timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

      this.chartsReady = true;
      setTimeout(() => {
        this.barChartDirective?.chart?.update();
        this.pieChartDirective?.chart?.update();
      }, 0);

      this.cdr.detectChanges();
    });
  }
}
