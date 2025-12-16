import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService } from '../../services/request.service';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard-etude',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard-etude.component.html',
  styleUrls: ['./dashboard-etude.component.css'],
})
export class DashboardEtudeComponent implements OnInit, AfterViewInit {
  nombreDemandes = 0;
  tauxValidation = 0;
  tempsMoyenValidation = 0;
  variationTauxValidation: number | null = null;
  dernieresDemandes: any[] = [];
  chartsReady: boolean = false;

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
        label: 'Demandes par jour',
        backgroundColor: 'rgba(78, 115, 223, 0.4)',
        borderColor: '#4e73df',
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
    labels: ['En attente', 'Terminée', 'Rejetée'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#f6c23e', '#1cc88a', '#e74a3b'],
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

  constructor(
    private requestService: RequestService,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.requestService.getAllRequests().subscribe((demandes) => {
      this.nombreDemandes = demandes.length;

      const valides = demandes.filter(
        (d) => d.status === 'completed' && d.validated_at
      );
      this.tauxValidation = Math.round(
        (valides.length / demandes.length) * 100
      );

      const delais = valides.map((d) => {
        const d1 = new Date(d.created_at);
        const d2 = new Date(d.validated_at);
        return (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
      });
      const moyenne = delais.reduce((a, b) => a + b, 0) / delais.length || 0;
      this.tempsMoyenValidation = +moyenne.toFixed(1);

      const grouped = demandes.reduce((acc: Record<string, number>, d: any) => {
        const date = new Date(d.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      this.chartData.labels = Object.keys(grouped);
      this.chartData.datasets[0].data = Object.values(grouped);

      const counts: Record<'pending' | 'completed' | 'rejected', number> = {
        pending: 0,
        completed: 0,
        rejected: 0,
      };

      demandes.forEach((d) => {
        const status = d.status;
        if (
          status === 'pending' ||
          status === 'completed' ||
          status === 'rejected'
        ) {
          counts[status as keyof typeof counts]++;
        }
      });

      this.pieChartData.datasets[0].data = [
        counts.pending,
        counts.completed,
        counts.rejected,
      ];

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

      this.variationTauxValidation = +(tauxActuel - tauxAncien).toFixed(1);

      this.chartsReady = true;
      setTimeout(() => {
        this.barChartDirective?.chart?.update();
        this.pieChartDirective?.chart?.update();
      }, 0);

      this.cdr.detectChanges();
    });
  }
}
