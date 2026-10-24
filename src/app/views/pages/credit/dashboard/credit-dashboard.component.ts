import { Component, OnDestroy, OnInit } from '@angular/core';
import { CreditApplication, DECISION_TREND, PortfolioSummary } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-credit-dashboard',
  templateUrl: './credit-dashboard.component.html',
  styleUrls: ['./credit-dashboard.component.scss']
})
export class CreditDashboardComponent implements OnInit, OnDestroy {
  summary?: PortfolioSummary;
  recent: CreditApplication[] = [];
  trend: any = {};
  donut: any = {};

  // KPI Sparklines
  sparkTotal: any = {};
  sparkApproved: any = {};
  sparkDeclined: any = {};
  sparkReferred: any = {};

  now: Date = new Date();
  lastRefreshed: Date | null = null;

  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.now = new Date();
    
    this.buildTrendChart();
    this.buildSparklines();

    this.sub.add(
      this.credit.summary$.subscribe(summary => {
        this.summary = summary;
        this.donut = this.buildDonut(summary);
        this.lastRefreshed = new Date();
      })
    );

    this.sub.add(
      this.credit.applications$.subscribe(apps => {
        this.recent = [...apps]
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
          .slice(0, 5);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }


    private buildSparklines(): void {
    const baseOptions = {
      stroke: { curve: 'smooth', width: 2.5 },
      tooltip: { enabled: false },
      dataLabels: { enabled: false },
    };

    // Total Applications (Blue)
    this.sparkTotal = { 
      ...baseOptions, 
      series: [{ data: [15, 40, 25, 60, 45, 80, 70] }], 
      chart: { 
        type: 'path', 
        sparkline: { enabled: true }, 
        height: 60, 
        width: 130,
        path: { d: "M 5 45 Q 20 15 35 35 T 65 25 T 95 45 T 125 15" } // <--- Moved inside chart
      }, 
      colors: ['#3B82F6'] 
    };

    // Approved (Green)
    this.sparkApproved = { 
      ...baseOptions, 
      series: [{ data: [10, 30, 20, 50, 40, 70, 80] }], 
      chart: { 
        type: 'path', 
        sparkline: { enabled: true }, 
        height: 60, 
        width: 130,
        path: { d: "M 5 45 Q 20 50 35 35 T 65 40 T 95 20 T 125 10" } // <--- Moved inside chart
      },
      colors: ['#10B981'] 
    };

    // Declined (Red)
    this.sparkDeclined = { 
      ...baseOptions, 
      series: [{ data: [80, 50, 60, 30, 50, 20, 30] }], 
      chart: { 
        type: 'path', 
        sparkline: { enabled: true }, 
        height: 60, 
        width: 130,
        path: { d: "M 5 25 Q 20 35 35 45 T 65 35 T 95 50 T 125 35" } // <--- Moved inside chart
      },
      colors: ['#EF4444'] 
    };

    // Referred (Amber)
    this.sparkReferred = { 
      ...baseOptions, 
      series: [{ data: [30, 60, 40, 70, 50, 80, 60] }], 
      chart: { 
        type: 'path', 
        sparkline: { enabled: true }, 
        height: 60, 
        width: 130,
        path: { d: "M 5 35 Q 20 45 35 30 T 65 40 T 95 25 T 125 50" } // <--- Moved inside chart
      },
      colors: ['#F59E0B'] 
    };
  }


  private buildTrendChart(): void {
    this.trend = {
      series: [
        { name: 'Approved', data: DECISION_TREND.approved },
        { name: 'Declined', data: DECISION_TREND.declined },
        { name: 'Referred', data: DECISION_TREND.referred }
      ],
      chart: { 
        type: 'area', 
        height: 280, 
        toolbar: { show: false }, 
        fontFamily: 'Inter, Manrope, Roboto, sans-serif', 
        zoom: { enabled: false } 
      },
      colors: ['#10B981', '#EF4444', '#F59E0B'],
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false },
      fill: { 
        type: 'gradient', 
        gradient: { 
          shadeIntensity: 1, 
          opacityFrom: 0.25, 
          opacityTo: 0.02, 
          stops: [0, 100] 
        } 
      },
      xaxis: { 
        categories: DECISION_TREND.categories, 
        labels: { style: { colors: '#94A3B8', fontWeight: 500 } }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false } 
      },
      yaxis: { 
        min: 0, 
        labels: { style: { colors: '#94A3B8', fontWeight: 500 } } 
      },
      grid: { 
        borderColor: '#F1F5F9', 
        strokeDashArray: 4 
      },
      legend: { 
        position: 'top', 
        horizontalAlign: 'right', 
        fontWeight: 600,
        markers: { radius: 4 }
      },
      tooltip: { shared: true }
    };
  }

  private buildDonut(summary: PortfolioSummary): any {
    return {
      series: [summary.lowRisk, summary.mediumRisk, summary.highRisk],
      chart: { 
        type: 'donut', 
        height: 250, 
        fontFamily: 'Inter, Manrope, Roboto, sans-serif' 
      },
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      colors: ['#10B981', '#F59E0B', '#EF4444'],
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: { 
                fontSize: '13px', 
                color: '#64748B', 
                offsetY: 20,
                fontWeight: 500
              },
              value: { 
                fontSize: '28px', 
                fontWeight: 700, 
                color: '#0F172A', 
                offsetY: -15, 
                formatter: (val: string) => Number(val).toLocaleString('en-KE') 
              },
              total: { 
                show: true, 
                label: 'Total', 
                fontSize: '12px', 
                color: '#64748B', 
                formatter: () => (summary?.total ?? 0).toLocaleString('en-KE') 
              }
            }
          }
        }
      }
    };
  }
}