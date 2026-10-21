import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import { ChannelHealth, ChannelKpi, ChannelSummary, MonitoredTransaction } from './channel-monitoring.mock';

@Component({
  selector: 'app-channel-monitoring',
  templateUrl: './channel-monitoring.component.html',
  styleUrls: ['./channel-monitoring.component.scss']
})
export class ChannelMonitoringComponent implements OnInit, OnDestroy {
  kpis: ChannelKpi[] = [];
  channels: ChannelHealth[] = [];
  summaries: ChannelSummary[] = [];
  transactions: MonitoredTransaction[] = [];
  filteredTransactions: MonitoredTransaction[] = [];

  selectedChannel = 'all';
  selectedFlag = 'all';
  searchTerm = '';
  lastRefreshed: Date | null = null;
  monitoringStatus = 'unknown';
  loading = false;
  loadingTransactions = false;
  chartsReady = false;
  errorMessage = '';
  page = 1;
  pageSize = 25;
  totalTransactions = 0;
  totalPages = 0;
  private refreshRequest?: Subscription;
  private transactionRequest?: Subscription;
  private blockedTransactionTotal = 0;

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

  private readonly channelVisuals: Record<string, { color: string; icon: string }> = {
    MOBILE_BANKING: { color: '#4361ee', icon: 'fa-mobile-alt' },
    INTERNET_BANKING: { color: '#06d6a0', icon: 'fa-globe' },
    USSD: { color: '#fd7e14', icon: 'fa-keyboard' },
    ATM_POS: { color: '#4cc9f0', icon: 'fa-credit-card' },
    AGENCY: { color: '#f72585', icon: 'fa-store' },
    CORE_BANKING: { color: '#7209b7', icon: 'fa-university' }
  };

  constructor(private finca: HttpService) { }

  ngOnInit(): void {
    this.initCharts();
    this.refreshFeed();
  }

  ngOnDestroy(): void {
    this.refreshRequest?.unsubscribe();
    this.transactionRequest?.unsubscribe();
  }

  applyFilters(): void {
    this.page = 1;
    this.loadTransactions();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadTransactions();
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
    this.loading = true;
    this.loadingTransactions = true;
    this.errorMessage = '';
    this.page = 1;
    this.refreshRequest?.unsubscribe();
    this.transactionRequest?.unsubscribe();
    this.refreshRequest = forkJoin({
      overview: this.finca.getChannelMonitoringOverview(),
      analytics: this.finca.getChannelMonitoringAnalytics({ interval: 'day' })
    }).subscribe({
      next: ({ overview, analytics }) => {
        this.applyOverview(overview);
        this.applyAnalytics(analytics);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load channel monitoring data. Please try again.';
        this.loading = false;
        this.loadTransactions();
      }
    });
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.loadingTransactions = true;
    this.transactionRequest?.unsubscribe();
    this.transactionRequest = this.finca
      .getChannelMonitoringTransactions(this.transactionQuery())
      .subscribe({
        next: response => this.applyTransactionResponse(response),
        error: () => {
          this.errorMessage = 'Unable to load monitored transactions.';
          this.loadingTransactions = false;
        }
      });
  }

  private transactionQuery(): {
    channel?: string;
    flag?: string;
    q?: string;
    page: number;
    size: number;
  } {
    return {
      channel: this.selectedChannel === 'all' ? undefined : this.selectedChannel,
      flag: this.selectedFlag === 'all' ? undefined : this.selectedFlag,
      q: this.searchTerm.trim() || undefined,
      page: this.page,
      size: this.pageSize
    };
  }

  private applyOverview(response: any): void {
    const metrics = response.kpis;
    this.monitoringStatus = response.monitoring_status;
    this.lastRefreshed = response.generated_at ? new Date(response.generated_at) : new Date();
    this.kpis = [
      this.createKpi('Txns Monitored', this.formatVolume(metrics.transactions_monitored.value), metrics.transactions_monitored.change_percent, 'fa-exchange-alt', '#4361ee', 'selected period'),
      this.createKpi('Fraud Alerts', this.formatVolume(metrics.fraud_alerts.value), metrics.fraud_alerts.change_percent, 'fa-bell', '#f72585', 'across all channels'),
      this.createKpi('Blocked Value', this.formatCompact(metrics.blocked_value.value), metrics.blocked_value.change_percent, 'fa-ban', '#06d6a0', 'prevented loss in period'),
      this.createKpi('Channel Health', `${metrics.channel_health_percent.value}%`, metrics.channel_health_percent.change_percent, 'fa-heartbeat', '#4cc9f0', 'composite score'),
      this.createKpi('Peak Throughput', `${metrics.peak_throughput_per_minute.value.toLocaleString()}/min`, metrics.peak_throughput_per_minute.change_percent, 'fa-tachometer-alt', '#fd7e14', `at ${this.formatTime(metrics.peak_throughput_per_minute.at)}`),
      this.createKpi('False Positives', `${metrics.false_positive_rate_percent.value}%`, metrics.false_positive_rate_percent.change_percent, 'fa-filter', '#7209b7', 'vs. previous period')
    ];
    this.channels = response.channels.map((channel: any) => ({
      code: channel.code,
      name: channel.name,
      status: channel.status,
      txnVolume: channel.transaction_volume,
      fraudRate: channel.fraud_rate_percent,
      avgLatencyMs: channel.average_latency_ms,
      uptime: channel.uptime_percent,
      blockedInPeriod: channel.blocked_in_period,
      color: this.channelVisuals[channel.code]?.color || '#7987a1',
      icon: this.channelVisuals[channel.code]?.icon || 'fa-university'
    }));
    this.summaries = response.summaries.map((summary: any) => ({
      channel: summary.channel,
      totalTxns: summary.total_transactions,
      flagged: summary.flagged,
      blocked: summary.blocked,
      amountAtRisk: summary.amount_at_risk,
      recoveryRate: summary.recovery_rate_percent,
      topThreat: summary.top_threat
    }));
  }

  private createKpi(
    label: string,
    value: string,
    changePercent: number,
    icon: string,
    color: string,
    description: string
  ): ChannelKpi {
    return {
      label,
      value,
      change: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
      trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat',
      icon,
      color,
      description
    };
  }

  private applyAnalytics(response: any): void {
    const colors = response.volume_by_channel.series.map((series: any) =>
      this.channelVisuals[series.channel_code]?.color || '#7987a1'
    );
    this.volumeTrendOptions = {
      ...this.volumeTrendOptions,
      series: response.volume_by_channel.series.map((series: any) => ({ name: series.name, data: series.data })),
      colors,
      xaxis: { ...this.volumeTrendOptions.xaxis, categories: response.volume_by_channel.categories }
    };

    this.blockedTransactionTotal = response.blocked_by_channel.reduce(
      (total: number, channel: any) => total + channel.count,
      0
    );
    this.blockedByChannelOptions = {
      ...this.blockedByChannelOptions,
      series: response.blocked_by_channel.map((channel: any) => channel.count),
      labels: response.blocked_by_channel.map((channel: any) => channel.name),
      colors: response.blocked_by_channel.map((channel: any) =>
        this.channelVisuals[channel.channel_code]?.color || '#7987a1'
      )
    };

    this.fraudRateOptions = {
      ...this.fraudRateOptions,
      series: [{ name: 'Fraud rate %', data: response.fraud_rate_by_channel.map((channel: any) => channel.rate_percent) }],
      colors: response.fraud_rate_by_channel.map((channel: any) =>
        this.channelVisuals[channel.channel_code]?.color || '#7987a1'
      ),
      xaxis: {
        ...this.fraudRateOptions.xaxis,
        categories: response.fraud_rate_by_channel.map((channel: any) => channel.name)
      }
    };

    this.hourlyActivityOptions = {
      ...this.hourlyActivityOptions,
      labels: response.hourly_activity.categories,
      series: [
        { name: 'Transactions', type: 'column', data: response.hourly_activity.transactions },
        { name: 'Fraud alerts', type: 'line', data: response.hourly_activity.fraud_alerts }
      ]
    };

    this.riskRadarOptions = {
      ...this.riskRadarOptions,
      series: [
        { name: 'Risk exposure', data: response.risk_and_detection_coverage.map((channel: any) => channel.risk_exposure) },
        { name: 'Detection coverage', data: response.risk_and_detection_coverage.map((channel: any) => channel.detection_coverage) }
      ],
      xaxis: {
        ...this.riskRadarOptions.xaxis,
        categories: response.risk_and_detection_coverage.map((channel: any) => channel.name)
      }
    };
    this.chartsReady = true;
  }

  private applyTransactionResponse(response: any): void {
    this.transactions = response.transactions.map((transaction: any) => ({
      id: transaction.id,
      time: this.formatTime(transaction.timestamp),
      channel: transaction.channel,
      type: transaction.type,
      amount: transaction.amount,
      customer: transaction.customer,
      riskScore: transaction.risk_score,
      fraudFlag: transaction.fraud_flag,
      ruleHit: transaction.rule_hit
    }));
    this.filteredTransactions = this.transactions;
    this.totalTransactions = response.pagination.total;
    this.totalPages = response.pagination.total_pages;
    this.loadingTransactions = false;
  }

  private formatTime(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(value));
  }

  private initCharts(): void {
    this.volumeTrendOptions = {
      series: [],
      chart: { type: 'area', height: 320, stacked: false, toolbar: { show: false }, fontFamily: this.colors.font },
      colors: [this.colors.primary, this.colors.warning, this.colors.success, this.colors.info],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
      xaxis: { categories: [] },
      yaxis: { title: { text: 'Txn volume (K)' } },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: this.colors.grid },
      dataLabels: { enabled: false }
    };

    this.fraudRateOptions = {
      series: [{ name: 'Fraud rate %', data: [] }],
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
        categories: [],
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
      series: [],
      chart: { height: 300, type: 'line', toolbar: { show: false }, fontFamily: this.colors.font },
      stroke: { width: [0, 3], curve: 'smooth' },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
      colors: [this.colors.primary, this.colors.danger],
      fill: { opacity: [0.75, 1] },
      labels: [],
      markers: { size: [0, 3] },
      yaxis: [
        { title: { text: 'Txns / hr' } },
        { opposite: true, title: { text: 'Alerts' } }
      ],
      legend: { position: 'top' },
      grid: { borderColor: this.colors.grid }
    };

    this.riskRadarOptions = {
      series: [],
      chart: { type: 'radar', height: 300, toolbar: { show: false }, fontFamily: this.colors.font },
      colors: [this.colors.danger, this.colors.success],
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      markers: { size: 3 },
      xaxis: { categories: [] },
      yaxis: { show: false, max: 100 },
      legend: { position: 'bottom' }
    };

    this.blockedByChannelOptions = {
      series: [],
      chart: { type: 'donut', height: 300, fontFamily: this.colors.font },
      labels: [],
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
              total: { show: true, label: 'Blocked', fontSize: '12px', formatter: () => String(this.blockedTransactionTotal) }
            }
          }
        }
      },
      dataLabels: { enabled: false }
    };
  }
}
