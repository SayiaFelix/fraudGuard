import { Component, OnInit } from '@angular/core';
import {
  CHANNEL_KPIS,
  CHANNEL_HEALTH,
  CHANNEL_SUMMARIES,
  MONITORED_TRANSACTIONS,
  ChannelHealth,
  MonitoredTransaction
} from './channel-monitoring.mock';

@Component({
  selector: 'app-channel-monitoring',
  templateUrl: './channel-monitoring.component.html',
  styleUrls: ['./channel-monitoring.component.scss']
})
export class ChannelMonitoringComponent implements OnInit {
  kpis = CHANNEL_KPIS;
  channels = CHANNEL_HEALTH;
  summaries = CHANNEL_SUMMARIES;
  transactions = MONITORED_TRANSACTIONS;
  filteredTransactions: MonitoredTransaction[] = [];

  selectedChannel = 'all';
  selectedFlag = 'all';
  searchTerm = '';
  lastRefreshed = 'Sep 3, 2026 16:05 EAT';

  volumeTrendOptions: any = {};
  fraudRateOptions: any = {};
  hourlyActivityOptions: any = {};
  riskRadarOptions: any = {};
  blockedByChannelOptions: any = {};

  private readonly colors = {
    primary: '#4361ee',
    danger: '#f72585',
    success: '#06d6a0',
    warning: '#fd7e14',
    info: '#4cc9f0',
    purple: '#7209b7',
    muted: '#7987a1',
    grid: 'rgba(77, 138, 240, .12)',
    font: "'Roboto', Helvetica, sans-serif"
  };

  ngOnInit(): void {
    this.filteredTransactions = [...this.transactions];
    this.initCharts();
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter(t => {
      const matchChannel = this.selectedChannel === 'all' || t.channel === this.selectedChannel;
      const matchFlag = this.selectedFlag === 'all' || t.fraudFlag === this.selectedFlag;
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term ||
        t.id.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term) ||
        t.customer.toLowerCase().includes(term) ||
        t.ruleHit.toLowerCase().includes(term);
      return matchChannel && matchFlag && matchSearch;
    });
  }

  getStatusClass(status: ChannelHealth['status']): string {
    const map: Record<string, string> = {
      Healthy: 'status-healthy',
      Degraded: 'status-degraded',
      Critical: 'status-critical',
      Maintenance: 'status-maintenance'
    };
    return map[status] || '';
  }

  getFlagClass(flag: string): string {
    const map: Record<string, string> = {
      None: 'flag-none',
      Suspicious: 'flag-suspicious',
      Blocked: 'flag-blocked',
      'Under Review': 'flag-review'
    };
    return map[flag] || '';
  }

  getRiskColor(score: number): string {
    if (score >= 90) return '#f72585';
    if (score >= 75) return '#fd7e14';
    if (score >= 50) return '#ffc107';
    return '#06d6a0';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatCompact(amount: number): string {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return this.formatCurrency(amount);
  }

  formatVolume(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  }

  refreshFeed(): void {
    this.lastRefreshed = 'Sep 3, 2026 16:05 EAT';
  }

  private initCharts(): void {
    this.volumeTrendOptions = {
      series: [
        { name: 'Mobile', data: [72, 78, 85, 91, 88, 95, 102, 98, 110, 118, 125, 132] },
        { name: 'USSD', data: [48, 52, 49, 55, 58, 61, 64, 59, 67, 70, 68, 74] },
        { name: 'Internet', data: [28, 30, 32, 35, 34, 38, 41, 39, 44, 46, 48, 52] },
        { name: 'ATM/POS', data: [18, 19, 17, 20, 22, 21, 24, 23, 25, 27, 26, 28] }
      ],
      chart: { type: 'area', height: 320, stacked: false, toolbar: { show: false }, fontFamily: this.colors.font },
      colors: [this.colors.primary, this.colors.warning, this.colors.success, this.colors.info],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
      yaxis: { title: { text: 'Txn volume (K)' } },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: this.colors.grid },
      dataLabels: { enabled: false }
    };

    this.fraudRateOptions = {
      series: [{ name: 'Fraud rate %', data: [0.42, 0.31, 0.78, 0.25, 1.24, 0.18] }],
      chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: this.colors.font },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '55%',
          distributed: true,
          dataLabels: { position: 'top' }
        }
      },
      colors: [
        this.colors.primary,
        this.colors.success,
        this.colors.warning,
        this.colors.info,
        this.colors.danger,
        this.colors.purple
      ],
      xaxis: {
        categories: ['Mobile', 'Internet', 'USSD', 'ATM/POS', 'Agency', 'Core'],
        labels: { style: { fontSize: '11px' } }
      },
      yaxis: { title: { text: 'Fraud rate (%)' }, max: 1.5 },
      legend: { show: false },
      grid: { borderColor: this.colors.grid },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        offsetY: -18,
        style: { fontSize: '10px', colors: ['#6b7280'] }
      }
    };

    this.hourlyActivityOptions = {
      series: [
        {
          name: 'Transactions',
          type: 'column',
          data: [820, 640, 410, 280, 190, 350, 980, 2100, 3200, 3800, 4100, 4500, 4820, 4600, 4300, 3900, 3600, 3400, 3100, 2800, 2200, 1800, 1400, 1050]
        },
        {
          name: 'Fraud alerts',
          type: 'line',
          data: [8, 5, 3, 2, 1, 4, 12, 28, 42, 48, 51, 55, 62, 58, 52, 47, 41, 38, 34, 29, 22, 18, 14, 10]
        }
      ],
      chart: { height: 300, type: 'line', toolbar: { show: false }, fontFamily: this.colors.font },
      stroke: { width: [0, 3], curve: 'smooth' },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
      colors: [this.colors.primary, this.colors.danger],
      fill: { opacity: [0.75, 1] },
      labels: [
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
        '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'
      ],
      markers: { size: [0, 3] },
      yaxis: [
        { title: { text: 'Txns / hr' } },
        { opposite: true, title: { text: 'Alerts' } }
      ],
      legend: { position: 'top' },
      grid: { borderColor: this.colors.grid }
    };

    this.riskRadarOptions = {
      series: [
        {
          name: 'Risk exposure',
          data: [78, 52, 88, 41, 94, 35]
        },
        {
          name: 'Detection coverage',
          data: [92, 95, 81, 97, 72, 98]
        }
      ],
      chart: { type: 'radar', height: 300, toolbar: { show: false }, fontFamily: this.colors.font },
      colors: [this.colors.danger, this.colors.success],
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      markers: { size: 3 },
      xaxis: { categories: ['Mobile', 'Internet', 'USSD', 'ATM/POS', 'Agency', 'Core'] },
      yaxis: { show: false, max: 100 },
      legend: { position: 'bottom' }
    };

    this.blockedByChannelOptions = {
      series: [128, 97, 62, 54, 31, 12],
      chart: { type: 'donut', height: 300, fontFamily: this.colors.font },
      labels: ['Mobile Banking', 'USSD', 'Agency', 'Internet Banking', 'ATM/POS', 'Core Banking'],
      colors: [
        this.colors.primary,
        this.colors.warning,
        this.colors.danger,
        this.colors.success,
        this.colors.info,
        this.colors.purple
      ],
      legend: { position: 'bottom', fontSize: '11px' },
      plotOptions: {
        pie: {
          donut: {
            size: '62%',
            labels: {
              show: true,
              total: { show: true, label: 'Blocked', fontSize: '12px', formatter: () => '384' }
            }
          }
        }
      },
      dataLabels: { enabled: false }
    };
  }
}
