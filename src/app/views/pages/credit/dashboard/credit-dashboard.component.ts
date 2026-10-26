import { Component, OnDestroy, OnInit } from '@angular/core';
import { CreditApplication, DECISION_TREND, PortfolioSummary } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-credit-dashboard',
  templateUrl: './credit-dashboard.component.html'
})
export class CreditDashboardComponent implements OnInit, OnDestroy {
  summary!: PortfolioSummary;
  recent: CreditApplication[] = [];
  trend: any = {};
  donut: any = {};
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  get greeting(): string {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `${part}, Demo User`;
  }

  ngOnInit(): void {
    this.trend = {
      series: [
        { name: 'Approved', data: DECISION_TREND.approved },
        { name: 'Declined', data: DECISION_TREND.declined },
        { name: 'Referred', data: DECISION_TREND.referred }
      ],
      chart: { type: 'area', height: 280, toolbar: { show: false }, fontFamily: 'Manrope, Roboto, sans-serif', zoom: { enabled: false } },
      colors: ['#12B76A', '#F04438', '#F79009'],
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 100] } },
      xaxis: { categories: DECISION_TREND.categories, labels: { style: { colors: '#8A97AB' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { min: 0, labels: { style: { colors: '#8A97AB' } } },
      grid: { borderColor: '#EEF2F6', strokeDashArray: 4 },
      legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 },
      tooltip: { shared: true }
    };

    this.sub.add(this.credit.summary$.subscribe(summary => {
      this.summary = summary;
      this.donut = this.buildDonut(summary);
    }));
    this.sub.add(this.credit.applications$.subscribe(apps => {
      this.recent = [...apps].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5);
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private buildDonut(summary: PortfolioSummary): any {
    return {
      series: [summary.lowRisk, summary.mediumRisk, summary.highRisk],
      chart: { type: 'donut', height: 250, fontFamily: 'Manrope, Roboto, sans-serif' },
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      colors: ['#12B76A', '#F79009', '#F04438'],
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '74%',
            labels: {
              show: true,
              name: { fontSize: '12px', color: '#66758A', offsetY: 18 },
              value: { fontSize: '26px', fontWeight: 800, color: '#122033', offsetY: -16, formatter: (val: string) => Number(val).toLocaleString('en-NG') },
              total: {
                show: true,
                label: 'Total Applications',
                fontSize: '11px',
                color: '#66758A',
                formatter: () => summary.total.toLocaleString('en-NG')
              }
            }
          }
        }
      }
    };
  }
}
