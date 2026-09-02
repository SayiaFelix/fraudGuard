import { Component, OnInit } from '@angular/core';
import { FRAUD_KPIS, FRAUD_REPORTS, TOP_PATTERNS, FraudReportRow } from './fraud-reports.mock';

@Component({
  selector: 'app-fraud-reports',
  templateUrl: './fraud-reports.component.html',
  styleUrls: ['./fraud-reports.component.scss']
})
export class FraudReportsComponent implements OnInit {
  kpis = FRAUD_KPIS;
  reports = FRAUD_REPORTS;
  topPatterns = TOP_PATTERNS;
  filteredReports: FraudReportRow[] = [];
  selectedPeriod = 'quarter';
  selectedChannel = 'all';
  searchTerm = '';

  fraudTrendOptions: any = {};
  channelBreakdownOptions: any = {};
  fraudTypeOptions: any = {};
  monthlyComparisonOptions: any = {};
  regionHeatmapOptions: any = {};
  detectionSourceOptions: any = {};

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
    this.filteredReports = [...this.reports];
    this.initCharts();
  }

  applyFilters(): void {
    this.filteredReports = this.reports.filter(r => {
      const matchChannel = this.selectedChannel === 'all' || r.channel === this.selectedChannel;
      const matchSearch = !this.searchTerm ||
        r.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.analyst.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchChannel && matchSearch;
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Confirmed': 'status-confirmed',
      'Under Review': 'status-review',
      'False Positive': 'status-fp',
      'Escalated': 'status-escalated'
    };
    return map[status] || '';
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

  exportReport(): void {
    alert('Report export will be available in production.');
  }

  private initCharts(): void {
    this.fraudTrendOptions = {
      series: [
        { name: 'Fraud Cases', type: 'column', data: [89, 112, 98, 134, 156, 142, 168, 187, 201, 178, 195, 214] },
        { name: 'Amount (M KES)', type: 'line', data: [3.2, 4.1, 3.8, 5.4, 6.2, 5.8, 7.1, 8.3, 9.2, 7.8, 8.9, 10.4] }
      ],
      chart: { height: 340, type: 'line', toolbar: { show: false }, fontFamily: this.colors.font },
      stroke: { width: [0, 3], curve: 'smooth' },
      colors: [this.colors.danger, this.colors.primary],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      fill: { opacity: [0.85, 1] },
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      markers: { size: 4 },
      xaxis: { labels: { style: { fontSize: '11px' } } },
      yaxis: [
        { title: { text: 'Cases' } },
        { opposite: true, title: { text: 'Amount (M KES)' } }
      ],
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: this.colors.grid }
    };

    this.channelBreakdownOptions = {
      series: [{ name: 'Fraud Cases', data: [412, 287, 198, 156, 134, 97] }],
      chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: this.colors.font },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '65%' } },
      colors: [this.colors.primary],
      xaxis: { categories: ['Mobile Banking', 'Internet Banking', 'USSD', 'ATM/POS', 'Agency', 'Core Banking'] },
      grid: { borderColor: this.colors.grid }
    };

    this.fraudTypeOptions = {
      series: [28, 22, 18, 14, 10, 8],
      chart: { type: 'donut', height: 300, fontFamily: this.colors.font },
      labels: ['Account Takeover', 'SIM Swap', 'Phishing', 'Card Skimming', 'Money Mule', 'Other'],
      colors: [this.colors.danger, this.colors.warning, this.colors.primary, this.colors.purple, this.colors.info, this.colors.muted],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '62%', labels: { show: true, total: { show: true, label: 'Total Cases', fontSize: '12px' } } } } },
      dataLabels: { enabled: false }
    };

    this.monthlyComparisonOptions = {
      series: [
        { name: 'Detected', data: [78, 92, 85, 110, 124, 118, 142, 156, 168, 152, 171, 189] },
        { name: 'Blocked', data: [72, 88, 80, 105, 119, 112, 138, 150, 162, 147, 165, 182] },
        { name: 'Recovered', data: [45, 52, 48, 68, 78, 72, 89, 98, 105, 94, 108, 120] }
      ],
      chart: { type: 'area', height: 300, toolbar: { show: false }, fontFamily: this.colors.font },
      colors: [this.colors.primary, this.colors.success, this.colors.info],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
      legend: { position: 'top' },
      grid: { borderColor: this.colors.grid }
    };

    this.regionHeatmapOptions = {
      series: [
        { name: 'Nairobi', data: this.generateHeatmapData() },
        { name: 'Mombasa', data: this.generateHeatmapData() },
        { name: 'Kisumu', data: this.generateHeatmapData() },
        { name: 'Nakuru', data: this.generateHeatmapData() },
        { name: 'Eldoret', data: this.generateHeatmapData() }
      ],
      chart: { type: 'heatmap', height: 280, toolbar: { show: false }, fontFamily: this.colors.font },
      dataLabels: { enabled: false },
      colors: [this.colors.danger],
      xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      plotOptions: { heatmap: { shadeIntensity: 0.5, colorScale: { ranges: [
        { from: 0, to: 5, color: '#e8f4fd', name: 'Low' },
        { from: 6, to: 15, color: '#4cc9f0', name: 'Medium' },
        { from: 16, to: 30, color: '#f72585', name: 'High' }
      ] } } }
    };

    this.detectionSourceOptions = {
      series: [58, 28, 14],
      chart: { type: 'pie', height: 280, fontFamily: this.colors.font },
      labels: ['AI / ML Models', 'Rule Engine', 'Manual Review'],
      colors: [this.colors.primary, this.colors.warning, this.colors.success],
      legend: { position: 'bottom' },
      dataLabels: { formatter: (val: number) => `${val.toFixed(1)}%` }
    };
  }

  private generateHeatmapData(): { x: string; y: number }[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(d => ({ x: d, y: Math.floor(Math.random() * 25) + 2 }));
  }
}
