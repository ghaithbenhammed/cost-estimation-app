import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard-cout',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard-cout.component.html',
  styleUrls: ['./dashboard-cout.component.css'],
})
export class DashboardCoutComponent implements OnInit, AfterViewInit {
  totalBoms = 0;
  totalEmises = 0;
  totalEnCours = 0;
  tauxGeneration = 0;
  tempsMoyen = 0;
  variationTauxGeneration: number | null = null;
  dernieresFactures: any[] = [];
  chartsReady = false;
  granularite: 'jour' | 'semaine' | 'mois' | 'annee' = 'jour';

  @ViewChild('barChart', { static: false })
  barChartDirective?: BaseChartDirective<'bar'>;
  @ViewChild('pieChart', { static: false })
  pieChartDirective?: BaseChartDirective<'doughnut'>;
  @ViewChild('pieChartContainer', { static: false })
  pieChartContainerRef?: ElementRef;

  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Factures par jour',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    ],
  };

  chartOptions: ChartOptions<'bar'> = {
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
    labels: ['En cours', 'Émise'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#facc15', '#10b981'],
        hoverOffset: 12,
      },
    ],
  };

  pieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
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
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label} : ${value}`;
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
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
      },
    },
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.chargerStats();
    setInterval(() => this.chargerStats(), 30000);
  }

  ngAfterViewInit(): void {
    const container = this.pieChartContainerRef?.nativeElement;
    if (container && 'ResizeObserver' in window && this.pieChartDirective) {
      const observer = new ResizeObserver(() => {
        this.pieChartDirective?.chart;
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

  chargerStats(): void {
    this.http
      .get<any[]>('http://127.0.0.1:8000/api/boms-to-invoice/')
      .subscribe((data) => {
        const now = new Date();
        this.totalBoms = data.length;
        this.totalEnCours = data.filter((b) => b.status === 'en_cours').length;
        this.totalEmises = data.filter((b) => b.status === 'emise').length;

        this.tauxGeneration = Math.round(
          (this.totalEmises / Math.max(1, this.totalBoms)) * 100
        );

        const delais = data.map((b) => {
          const d1 = new Date(b.date_creation);
          return (now.getTime() - d1.getTime()) / (1000 * 3600 * 24);
        });
        this.tempsMoyen =
          +(delais.reduce((a, b) => a + b, 0) / delais.length).toFixed(1) || 0;

        const grouped = data.reduce((acc: Record<string, number>, b: any) => {
          const date = new Date(b.date_creation).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        this.chartData.labels = Object.keys(grouped);
        this.chartData.datasets[0].data = Object.values(grouped);

        this.pieChartData.datasets[0].data = [
          this.totalEnCours,
          this.totalEmises,
        ];

        this.dernieresFactures = [...data]
          .sort(
            (a, b) =>
              new Date(b.date_creation).getTime() -
              new Date(a.date_creation).getTime()
          )
          .slice(0, 5);

        const aujourdHui = new Date();
        const septJours = 7 * 24 * 3600 * 1000;

        const periodeActuelle = data.filter(
          (b) =>
            new Date(b.date_creation).getTime() >=
            aujourdHui.getTime() - septJours
        );
        const periodePrecedente = data.filter(
          (b) =>
            new Date(b.date_creation).getTime() <
              aujourdHui.getTime() - septJours &&
            new Date(b.date_creation).getTime() >=
              aujourdHui.getTime() - 2 * septJours
        );

        const emisesActuelles = periodeActuelle.filter(
          (b) => b.status === 'emise'
        );
        const emisesAnciennes = periodePrecedente.filter(
          (b) => b.status === 'emise'
        );

        if (
          periodeActuelle.length > 0 &&
          periodePrecedente.length > 0 &&
          (emisesActuelles.length > 0 || emisesAnciennes.length > 0)
        ) {
          const tauxActuel =
            (emisesActuelles.length / periodeActuelle.length) * 100;
          const tauxAncien =
            (emisesAnciennes.length / periodePrecedente.length) * 100;
          this.variationTauxGeneration = +(tauxActuel - tauxAncien).toFixed(1);
        } else {
          this.variationTauxGeneration = null;
        }

        this.chartsReady = true;
        setTimeout(() => {
          this.barChartDirective?.chart?.update();
          this.pieChartDirective?.chart?.update();
        }, 0);

        this.cdr.detectChanges();
      });
  }
}
