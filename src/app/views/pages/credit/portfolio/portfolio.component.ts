
import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import {
  Chart,
  registerables
} from 'chart.js';

import {
  COUNTRY_MIX,
  PRODUCT_MIX
} from '../credit-demo.data';

import {
  CreditDataService
} from '../credit-data.service';

Chart.register(...registerables);

// ---------------------------------------------
// TYPES
// ---------------------------------------------

type PortfolioTab = 'products' | 'countries' | 'reports';

type ApprovalBand =
  | 'all'
  | 'high'
  | 'medium'
  | 'low';

type SortField =
  | 'name'
  | 'count'
  | 'approval';

type SortDirection = 'asc' | 'desc';

interface PortfolioItem {
  name: string;
  count: number;
  approval: number;
}

interface PortfolioRow extends PortfolioItem {
  share: number;
  estimatedApproved: number;
  estimatedNotApproved: number;
}

interface PortfolioSummary {
  applications: number;
  approved: number;
  notApproved: number;
  approvalRate: number;
  categories: number;
}

interface PortfolioInsight {
  title: string;
  description: string;
  icon: string;
  type: 'positive' | 'warning' | 'neutral';
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent
  implements AfterViewInit, OnDestroy {

  // ---------------------------------------------
  // CHART REFERENCES
  // ---------------------------------------------

  @ViewChild('compositionChart')
  compositionChart?: ElementRef<HTMLCanvasElement>;

  @ViewChild('approvalChart')
  approvalChart?: ElementRef<HTMLCanvasElement>;

  @ViewChild('outcomeChart')
  outcomeChart?: ElementRef<HTMLCanvasElement>;

  private compositionInstance?: Chart<'doughnut', number[], string>;

private approvalInstance?: Chart<'bar', number[], string>;

private outcomeInstance?: Chart<'bar', number[], string>;

  private viewReady = false;

  // ---------------------------------------------
  // COLORS
  // ---------------------------------------------

  readonly chartColors = [
    '#C8102E',
    '#EA526F',
    '#F59E0B',
    '#243B5A',
    '#798AA6',
    '#C7D0DC',
    '#9F1239',
    '#64748B'
  ];

  // ---------------------------------------------
  // DATA
  // ---------------------------------------------

  readonly products: PortfolioItem[] =
    (PRODUCT_MIX as PortfolioItem[]).map(item => ({
      name: String(item.name),
      count: Number(item.count),
      approval: Number(item.approval)
    }));

  readonly countries: PortfolioItem[] =
    (COUNTRY_MIX as PortfolioItem[]).map(item => ({
      name: String(item.name),
      count: Number(item.count),
      approval: Number(item.approval)
    }));

  // ---------------------------------------------
  // PAGE STATE
  // ---------------------------------------------

  activeTab: PortfolioTab = 'products';

  searchTerm = '';

  approvalBand: ApprovalBand = 'all';

  minimumVolume = 0;

  sortField: SortField = 'count';

  sortDirection: SortDirection = 'desc';

  readonly pageSizes = [5, 10, 20];

  pageSize = 10;

  currentPage = 1;

  notification = '';

  constructor(
  public credit: CreditDataService,
  private ngZone: NgZone
) {}

  // ---------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------

  ngAfterViewInit(): void {
  this.viewReady = true;

  this.ngZone.runOutsideAngular(() => {
    this.renderCharts();
  });
}

  ngOnDestroy(): void {
    this.viewReady = false;
    this.destroyCharts();
  }

  // ---------------------------------------------
  // VALID DATA
  // ---------------------------------------------

  private validData(
    items: PortfolioItem[]
  ): PortfolioItem[] {
    return items.filter(item =>
      item.name.trim().length > 0 &&
      Number.isFinite(item.count) &&
      item.count >= 0 &&
      Number.isFinite(item.approval) &&
      item.approval >= 0 &&
      item.approval <= 100
    );
  }

  get activeData(): PortfolioItem[] {
    return this.activeTab === 'products'
      ? this.products
      : this.countries;
  }

  get activeLabel(): string {
    return this.activeTab === 'products'
      ? 'Product'
      : 'Country';
  }

  get sourceRecordCount(): number {
    return this.activeData.length;
  }

  // ---------------------------------------------
  // PORTFOLIO SUMMARY
  // ---------------------------------------------

  private summarize(
    items: PortfolioItem[]
  ): PortfolioSummary {

    const valid = this.validData(items);

    const applications = valid.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const approvedRaw = valid.reduce(
      (sum, item) =>
        sum + (item.count * item.approval / 100),
      0
    );

    const approved = Math.round(approvedRaw);

    const notApproved = Math.max(
      0,
      applications - approved
    );

    const approvalRate = applications > 0
      ? (approvedRaw / applications) * 100
      : 0;

    return {
      applications,
      approved,
      notApproved,
      approvalRate,
      categories: valid.length
    };
  }

  get productSummary(): PortfolioSummary {
    return this.summarize(this.products);
  }

  get countrySummary(): PortfolioSummary {
    return this.summarize(this.countries);
  }

  get portfolioSummary(): PortfolioSummary {
    return this.summarize(this.activeData);
  }

  get filteredSummary(): PortfolioSummary {
    return this.summarize(this.filteredItems);
  }

  get dataTotalsMatch(): boolean {
    return (
      this.productSummary.applications ===
      this.countrySummary.applications
    );
  }

  // ---------------------------------------------
  // FILTERING
  // ---------------------------------------------

  private matchesApprovalBand(
    rate: number
  ): boolean {

    switch (this.approvalBand) {

      case 'high':
        return rate >= 80;

      case 'medium':
        return rate >= 60 && rate < 80;

      case 'low':
        return rate < 60;

      default:
        return true;
    }
  }

  get filteredItems(): PortfolioItem[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    const result = this.validData(this.activeData)
      .filter(item => {

        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(search);

        const matchesApproval =
          this.matchesApprovalBand(item.approval);

        const matchesVolume =
          item.count >= this.minimumVolume;

        return (
          matchesSearch &&
          matchesApproval &&
          matchesVolume
        );
      });

    return result.sort((a, b) => {

      let comparison = 0;

      if (this.sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison =
          a[this.sortField] - b[this.sortField];
      }

      return this.sortDirection === 'asc'
        ? comparison
        : -comparison;
    });
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.approvalBand !== 'all' ||
      this.minimumVolume > 0
    );
  }

  // ---------------------------------------------
  // TABLE ROWS
  // ---------------------------------------------

  get rows(): PortfolioRow[] {

    const items = this.filteredItems;

    const total = items.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return items.map(item => {

      const estimatedApproved = Math.round(
        item.count * item.approval / 100
      );

      return {
        ...item,

        share: total > 0
          ? (item.count / total) * 100
          : 0,

        estimatedApproved,

        estimatedNotApproved: Math.max(
          0,
          item.count - estimatedApproved
        )
      };
    });
  }

  get chartRows(): PortfolioRow[] {
    return [...this.rows]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  // ---------------------------------------------
  // KPI VALUES
  // ---------------------------------------------

  get approvalRate(): number {
    return this.filteredSummary.approvalRate;
  }

  get estimatedApprovals(): number {
    return this.filteredSummary.approved;
  }

  get estimatedNotApproved(): number {
    return this.filteredSummary.notApproved;
  }

  get totalApplications(): number {
    return this.filteredSummary.applications;
  }

  get largestSegment(): PortfolioRow | null {
    const rows = this.rows;

    if (!rows.length) {
      return null;
    }

    return [...rows].sort(
      (a, b) => b.count - a.count
    )[0];
  }

  get bestApprovalSegment(): PortfolioRow | null {
    const rows = this.rows.filter(
      item => item.count > 0
    );

    if (!rows.length) {
      return null;
    }

    return [...rows].sort(
      (a, b) =>
        b.approval - a.approval ||
        b.count - a.count
    )[0];
  }

  get lowestApprovalSegment(): PortfolioRow | null {
    const rows = this.rows.filter(
      item => item.count > 0
    );

    if (!rows.length) {
      return null;
    }

    return [...rows].sort(
      (a, b) =>
        a.approval - b.approval ||
        b.count - a.count
    )[0];
  }

  // ---------------------------------------------
  // INSIGHTS
  // ---------------------------------------------

  get insights(): PortfolioInsight[] {

    if (this.totalApplications === 0) {
      return [{
        title: 'No matching portfolio records',
        description:
          'Adjust the current filters to view portfolio insights.',
        icon: 'fa-search',
        type: 'neutral'
      }];
    }

    const insights: PortfolioInsight[] = [];

    const largest = this.largestSegment;

    if (largest) {
      insights.push({
        title: 'Largest portfolio segment',
        description:
          `${largest.name} accounts for ` +
          `${largest.share.toFixed(1)}% of ` +
          `applications in the selected view.`,
        icon: 'fa-chart-pie',
        type: 'neutral'
      });
    }

    const best = this.bestApprovalSegment;

    if (best) {
      insights.push({
        title: 'Highest approval performance',
        description:
          `${best.name} has the highest ` +
          `reported approval rate at ` +
          `${best.approval.toFixed(1)}%.`,
        icon: 'fa-arrow-up',
        type: 'positive'
      });
    }

    const lowest = this.lowestApprovalSegment;

    if (lowest) {
      insights.push({
        title: 'Segment requiring attention',
        description:
          `${lowest.name} has the lowest reported ` +
          `approval rate at ` +
          `${lowest.approval.toFixed(1)}%. ` +
          `Review this segment for further context.`,
        icon: 'fa-exclamation-circle',
        type: 'warning'
      });
    }

    return insights;
  }

  // ---------------------------------------------
  // CHART MANAGEMENT
  // ---------------------------------------------

  private destroyCharts(): void {

    this.compositionInstance?.destroy();
    this.approvalInstance?.destroy();
    this.outcomeInstance?.destroy();

    this.compositionInstance = undefined;
    this.approvalInstance = undefined;
    this.outcomeInstance = undefined;
  }

  private renderCharts(): void {

    if (!this.viewReady) {
      return;
    }

    this.destroyCharts();

    const items = this.chartRows;

    const labels = items.map(
      item => item.name
    );

    const volumes = items.map(
      item => item.count
    );

    const approvalRates = items.map(
      item => item.approval
    );

    const estimatedApproved = items.map(
      item => item.estimatedApproved
    );

    const estimatedNotApproved = items.map(
      item => item.estimatedNotApproved
    );

    // -----------------------------------------
    // DOUGHNUT CHART
    // -----------------------------------------

    const donutCanvas =
      this.compositionChart?.nativeElement;

    if (donutCanvas && items.length > 0) {

      this.compositionInstance = new Chart(
        donutCanvas,
        {
          type: 'doughnut',

          data: {
            labels,

            datasets: [{
              data: volumes,

              backgroundColor: items.map(
                (_, index) =>
                  this.chartColors[
                    index % this.chartColors.length
                  ]
              ),

              borderColor: '#FFFFFF',
              borderWidth: 3,
              hoverOffset: 8
            }]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            cutout: '70%',

            plugins: {
              legend: {
                display: true,
                position: 'bottom',

                labels: {
                  color: '#475467',
                  boxWidth: 11,
                  boxHeight: 11,
                  padding: 14,

                  font: {
                    size: 10
                  }
                }
              },

              tooltip: {
                callbacks: {
                  label: context => {

                    const count =
                      Number(context.raw) || 0;

                    const total = volumes.reduce(
                      (sum, value) => sum + value,
                      0
                    );

                    const percentage = total > 0
                      ? (count / total * 100).toFixed(1)
                      : '0.0';

                    return (
                      ` ${this.formatNumber(count)}` +
                      ` applications (${percentage}%)`
                    );
                  }
                }
              }
            }
          }
        }
      );
    }

    // -----------------------------------------
    // APPROVAL RATE CHART
    // -----------------------------------------

    const approvalCanvas =
      this.approvalChart?.nativeElement;

    if (approvalCanvas && items.length > 0) {

      this.approvalInstance = new Chart(
        approvalCanvas,
        {
          type: 'bar',

          data: {
            labels,

            datasets: [{
              label: 'Approval Rate',

              data: approvalRates,

              backgroundColor: '#C8102E',

              hoverBackgroundColor: '#A30D24',

              borderRadius: 6,

              maxBarThickness: 48
            }]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            plugins: {
              legend: {
                display: false
              },

              tooltip: {
                callbacks: {
                  label: context =>
                    ` Approval rate: ${context.parsed.y}%`
                }
              }
            },

            scales: {
              x: {
                grid: {
                  display: false
                },

                ticks: {
                  color: '#667085',
                  maxRotation: 40,
                  minRotation: 0,

                  font: {
                    size: 10
                  }
                }
              },

              y: {
                beginAtZero: true,
                max: 100,

                ticks: {
                  color: '#667085',
                  callback: value => `${value}%`
                },

                grid: {
                  color: '#EDF0F4'
                }
              }
            }
          }
        }
      );
    }

    // -----------------------------------------
    // STACKED OUTCOME CHART
    // -----------------------------------------

    const outcomeCanvas =
      this.outcomeChart?.nativeElement;

    if (outcomeCanvas && items.length > 0) {

      this.outcomeInstance = new Chart(
        outcomeCanvas,
        {
          type: 'bar',

          data: {
            labels,

            datasets: [
              {
                label: 'Estimated Approved',

                data: estimatedApproved,

                backgroundColor: '#C8102E',

                borderRadius: 4,

                maxBarThickness: 52
              },
              {
                label: 'Estimated Not Approved',

                data: estimatedNotApproved,

                backgroundColor: '#D5DCE5',

                borderRadius: 4,

                maxBarThickness: 52
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            plugins: {
              legend: {
                display: true,
                position: 'bottom',

                labels: {
                  color: '#475467',
                  boxWidth: 12,
                  padding: 20,

                  font: {
                    size: 11
                  }
                }
              }
            },

            scales: {
              x: {
                stacked: true,

                grid: {
                  display: false
                },

                ticks: {
                  color: '#667085',
                  maxRotation: 35,
                  minRotation: 0,

                  font: {
                    size: 10
                  }
                }
              },

              y: {
                stacked: true,
                beginAtZero: true,

                ticks: {
                  precision: 0,
                  color: '#667085'
                },

                grid: {
                  color: '#EDF0F4'
                }
              }
            }
          }
        }
      );
    }
  }

  private refreshCharts(): void {
  if (!this.viewReady) {
    return;
  }

  this.ngZone.runOutsideAngular(() => {
    this.renderCharts();
  });
}

  // ---------------------------------------------
  // USER INTERACTIONS
  // ---------------------------------------------

  setTab(tab: PortfolioTab): void {

    if (this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;

    if (tab === 'reports') {
      this.clearNotification();
      return;
    }

    this.currentPage = 1;
    this.searchTerm = '';
    this.approvalBand = 'all';
    this.minimumVolume = 0;

    this.clearNotification();

    this.refreshCharts();
  }

  onFiltersChange(): void {
    this.currentPage = 1;
    this.clearNotification();
    this.refreshCharts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.approvalBand = 'all';
    this.minimumVolume = 0;
    this.currentPage = 1;

    this.clearNotification();
    this.refreshCharts();
  }

  setSort(field: SortField): void {

    if (this.sortField === field) {
      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection =
        field === 'name' ? 'asc' : 'desc';
    }

    this.currentPage = 1;
    this.refreshCharts();
  }

  // ---------------------------------------------
  // PAGINATION
  // ---------------------------------------------

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.rows.length / this.pageSize)
    );
  }

  get paginatedRows(): PortfolioRow[] {

    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.rows.slice(
      start,
      start + this.pageSize
    );
  }

  get pageStart(): number {
    if (this.rows.length === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize + 1
    );
  }

  get pageEnd(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.rows.length
    );
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // ---------------------------------------------
  // FORMATTING
  // ---------------------------------------------

  formatNumber(value: number): string {
    return value.toLocaleString('en-KE', {
      maximumFractionDigits: 0
    });
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getApprovalClass(rate: number): string {

    if (rate >= 80) {
      return 'high';
    }

    if (rate >= 60) {
      return 'medium';
    }

    return 'low';
  }

  // ---------------------------------------------
  // CSV EXPORT
  // ---------------------------------------------

  private csvEscape(value: unknown): string {

    const text = String(value ?? '');

    // Prevent spreadsheet formula execution.
    const safeText =
      /^[\s]*[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;

    return (
      '"' +
      safeText.replace(/"/g, '""') +
      '"'
    );
  }

  exportCsv(): void {

    if (this.rows.length === 0) {
      this.notification =
        'There are no records to export.';
      return;
    }

    const headers = [
      this.activeLabel,
      'Applications',
      'Portfolio Share (%)',
      'Approval Rate (%)',
      'Estimated Approved',
      'Estimated Not Approved'
    ];

    const records = this.rows.map(row => [
      row.name,
      row.count,
      row.share.toFixed(2),
      row.approval.toFixed(2),
      row.estimatedApproved,
      row.estimatedNotApproved
    ]);

    const csv = [
      headers,
      ...records
    ]
      .map(row =>
        row.map(value =>
          this.csvEscape(value)
        ).join(',')
      )
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      {
        type: 'text/csv;charset=utf-8;'
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download =
      `UBA_Portfolio_${this.activeTab}_` +
      `${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    this.notification =
      'Portfolio report exported successfully.';
  }

  clearNotification(): void {
    this.notification = '';
  }

  trackByName(
    index: number,
    item: PortfolioItem
  ): string {
    return item.name;
  }
}
