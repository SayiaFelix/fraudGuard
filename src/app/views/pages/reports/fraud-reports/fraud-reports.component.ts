import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';

interface FraudReportRow {
  id: string;
  date: string;
  type: string;
  channel: string;
  region: string;
  amount: number;
  currency: string;
  riskScore: number;
  status: string;
  analyst: string;
}

interface FraudPatternRow {
  rank: number;
  rule_id: string;
  pattern: string;
  category: string;
  description: string;
  priority: number;
  is_active: boolean;
  decision: string;
  risk_points: number;
  raises_alert: boolean;
  trigger_count: number;
  rule_false_positive_rate: number;
  last_triggered_at: string | null;
  blocked_alerts_count: number;
}

@Component({
  selector: 'app-fraud-reports',
  templateUrl: './fraud-reports.component.html',
  styleUrls: ['./fraud-reports.component.scss']
})
export class FraudReportsComponent implements OnInit {

  kpis: any[] = [];

  reports: FraudReportRow[] = [];
  filteredReports: FraudReportRow[] = [];

  topPatterns: FraudPatternRow[] = [];

  selectedPeriod = 'quarter';
  selectedChannel = 'all';
  selectedRegion = 'all';
  selectedStatus = 'all';
  searchTerm = '';

  currentPage = 1;
  pageSize = 10;
  totalReports = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPreviousPage = false;

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

  constructor(
    private httpService: HttpService
  ) {}

  ngOnInit(): void {

    this.initCharts();

    this.loadKpis();

    this.loadMonthlyTrend();

    this.loadChannelBreakdown();

    this.loadFraudTypes();

    this.loadDetectionRecovery();

    this.loadRegionHeatmap();

    this.loadDetectionSource();

    this.loadTopPatterns();

    this.loadRecentReports();
  }


  // =====================================================
  // KPI CARDS
  // =====================================================

  private loadKpis(): void {

    this.httpService.getFraudReportKpis().subscribe({

      next: (response: any) => {

        if (response?.status !== 'success') {

          console.error(
            'Unable to load fraud report KPIs',
            response
          );

          this.kpis = [];

          return;
        }

        const metrics = response?.metrics || {};

        this.kpis = [

          {
            label: 'Total Fraud Cases',

            value: Number(
              metrics.total_fraud_cases ?? 0
            ).toLocaleString(),

            icon: 'fa-shield-alt',

            color: this.colors.danger,

            trend: 'flat',

            change: '',

            description: 'Total fraud cases'
          },

          {
            label: 'Amount at Risk',

            value: this.formatCompact(
              Number(
                metrics.amount_at_risk ?? 0
              )
            ),

            icon: 'fa-money-bill-wave',

            color: this.colors.warning,

            trend: 'flat',

            change: '',

            description: 'Total exposure'
          },

          {
            label: 'Detection Rate',

            value: `${Number(
              metrics.detection_rate ?? 0
            ).toFixed(1)}%`,

            icon: 'fa-search',

            color: this.colors.primary,

            trend: 'flat',

            change: '',

            description: 'Fraud detection rate'
          },

          {
            label: 'False Positive Rate',

            value: `${Number(
              metrics.false_positive_rate ?? 0
            ).toFixed(1)}%`,

            icon: 'fa-exclamation-triangle',

            color: '#ffc107',

            trend: 'flat',

            change: '',

            description: 'False positive rate'
          },

          {
            label: 'Avg Resolution Time',

            value: `${Number(
              metrics.avg_resolution_time_hours ?? 0
            ).toFixed(2)} hrs`,

            icon: 'fa-clock',

            color: this.colors.info,

            trend: 'flat',

            change: '',

            description: 'Average resolution time'
          },

          {
            label: 'Compliance Score',

            value: `${Number(
              metrics.compliance_score ?? 0
            ).toFixed(1)}%`,

            icon: 'fa-check-circle',

            color: this.colors.success,

            trend: 'flat',

            change: '',

            description: 'Compliance performance'
          }

        ];
      },

      error: (error: any) => {

        console.error(
          'Error loading fraud report KPIs:',
          error
        );

        this.kpis = [];
      }

    });
  }


  // =====================================================
  // MONTHLY FRAUD TREND
  // =====================================================

  private loadMonthlyTrend(): void {

    this.httpService
      .getFraudMonthlyTrend()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load monthly fraud trend'
            );

            return;
          }

          const data = response?.series || [];

          this.fraudTrendOptions = {

            series: [

              {
                name: 'Fraud Cases',

                type: 'column',

                data: data.map(
                  (item: any) =>
                    Number(
                      item.confirmed_fraud_cases ?? 0
                    )
                )
              },

              {
                name: 'Amount (M KES)',

                type: 'line',

                data: data.map(
                  (item: any) =>
                    Number(
                      (
                        Number(
                          item.amount_stolen ?? 0
                        ) / 1000000
                      ).toFixed(2)
                    )
                )
              }

            ],

            chart: {
              height: 340,
              type: 'line',

              toolbar: {
                show: false
              },

              fontFamily: this.colors.font
            },

            stroke: {
              width: [0, 3],
              curve: 'smooth'
            },

            colors: [
              this.colors.danger,
              this.colors.primary
            ],

            plotOptions: {
              bar: {
                borderRadius: 4,
                columnWidth: '55%'
              }
            },

            fill: {
              opacity: [0.85, 1]
            },

            labels: data.map(
              (item: any) =>
                this.formatMonth(
                  item.period
                )
            ),

            markers: {
              size: 4
            },

            xaxis: {
              labels: {
                style: {
                  fontSize: '11px'
                }
              }
            },

            yaxis: [

              {
                title: {
                  text: 'Cases'
                }
              },

              {
                opposite: true,

                title: {
                  text: 'Amount (M KES)'
                }
              }

            ],

            legend: {
              position: 'top',
              horizontalAlign: 'right'
            },

            grid: {
              borderColor: this.colors.grid
            }

          };
        },

        error: (error: any) => {

          console.error(
            'Error loading monthly fraud trend:',
            error
          );

        }

      });
  }


  // =====================================================
  // FRAUD BY CHANNEL
  // =====================================================

  private loadChannelBreakdown(): void {

    this.httpService
      .getFraudByChannel()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load fraud by channel'
            );

            return;
          }

          const data = response?.series || [];

          this.channelBreakdownOptions = {

            series: [

              {
                name: 'Fraud Cases',

                data: data.map(
                  (item: any) =>
                    Number(
                      item.count ?? 0
                    )
                )
              }

            ],

            chart: {
              type: 'bar',
              height: 300,

              toolbar: {
                show: false
              },

              fontFamily: this.colors.font
            },

            plotOptions: {

              bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '65%'
              }

            },

            colors: [
              this.colors.primary
            ],

            xaxis: {

              categories: data.map(
                (item: any) =>
                  item.label ||
                  item.channel
              )

            },

            grid: {
              borderColor: this.colors.grid
            }

          };
        },

        error: (error: any) => {

          console.error(
            'Error loading fraud by channel:',
            error
          );

        }

      });
  }


  // =====================================================
  // FRAUD TYPES
  // =====================================================

  private loadFraudTypes(): void {

    this.httpService
      .getFraudTypes()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load fraud types'
            );

            return;
          }

          const data = response?.series || [];

          this.fraudTypeOptions = {

            series: data.map(
              (item: any) =>
                Number(
                  item.count ?? 0
                )
            ),

            chart: {
              type: 'donut',
              height: 300,
              fontFamily: this.colors.font
            },

            labels: data.map(
              (item: any) =>
                item.label ||
                item.fraud_type
            ),

            colors: [
              this.colors.danger,
              this.colors.warning,
              this.colors.primary,
              this.colors.purple,
              this.colors.info,
              this.colors.muted
            ],

            legend: {
              position: 'bottom'
            },

            plotOptions: {

              pie: {

                donut: {

                  size: '62%',

                  labels: {

                    show: true,

                    total: {
                      show: true,
                      label: 'Total Cases',
                      fontSize: '12px'
                    }

                  }

                }

              }

            },

            dataLabels: {
              enabled: false
            }

          };
        },

        error: (error: any) => {

          console.error(
            'Error loading fraud types:',
            error
          );

        }

      });
  }


  // =====================================================
  // DETECTION / BLOCKING / RECOVERY
  // =====================================================

  private loadDetectionRecovery(): void {

    this.httpService
      .getDetectionRecovery()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load detection/recovery'
            );

            return;
          }

          const data = response?.series || [];

          this.monthlyComparisonOptions = {

            series: [

              {
                name: 'Detected',

                data: data.map(
                  (item: any) =>
                    Number(
                      item.detected ?? 0
                    )
                )
              },

              {
                name: 'Blocked',

                data: data.map(
                  (item: any) =>
                    Number(
                      item.blocked ?? 0
                    )
                )
              },

              {
                name: 'Recovered',

                data: data.map(
                  (item: any) =>
                    Number(
                      item.recovered ?? 0
                    )
                )
              }

            ],

            chart: {

              type: 'area',

              height: 300,

              toolbar: {
                show: false
              },

              fontFamily: this.colors.font

            },

            colors: [
              this.colors.primary,
              this.colors.success,
              this.colors.info
            ],

            stroke: {
              curve: 'smooth',
              width: 2
            },

            fill: {

              type: 'gradient',

              gradient: {
                opacityFrom: 0.4,
                opacityTo: 0.05
              }

            },

            xaxis: {

              categories: data.map(
                (item: any) =>
                  this.formatMonth(
                    item.period
                  )
              )

            },

            legend: {
              position: 'top'
            },

            grid: {
              borderColor: this.colors.grid
            }

          };
        },

        error: (error: any) => {

          console.error(
            'Error loading detection/recovery:',
            error
          );

        }

      });
  }


  // =====================================================
  // REGIONAL HEATMAP
  // =====================================================

  private loadRegionHeatmap(): void {

    this.httpService
      .getRegionalFraudHeatmap()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load regional fraud heatmap'
            );

            return;
          }

          const series = (
            response?.series || []
          ).map(
            (region: any) => ({

              name: region.name,

              data: (
                region.data || []
              ).map(
                (item: any) => ({

                  x: item.x,

                  y: Number(
                    item.y ?? 0
                  ),

                  level:
                    item.level,

                  transaction_count:
                    item.transaction_count,

                  risk_counts:
                    item.risk_counts

                })
              )

            })
          );

          this.regionHeatmapOptions = {

            series,

            chart: {
              type: 'heatmap',
              height: 280,

              toolbar: {
                show: false
              },

              fontFamily: this.colors.font
            },

            dataLabels: {
              enabled: false
            },

            plotOptions: {

              heatmap: {

                shadeIntensity: 0.5,

                colorScale: {

                  ranges: [

                    {
                      from: 0,
                      to: 1,
                      color: '#e8f4fd',
                      name: 'Low'
                    },

                    {
                      from: 2,
                      to: 2,
                      color: '#4cc9f0',
                      name: 'Medium'
                    },

                    {
                      from: 3,
                      to: 100,
                      color: '#f72585',
                      name: 'High'
                    }

                  ]

                }

              }

            },

            xaxis: {
              type: 'category'
            },

            grid: {
              borderColor: this.colors.grid
            }

          };
        },

        error: (error: any) => {

          console.error(
            'Error loading regional heatmap:',
            error
          );

        }

      });
  }


  // =====================================================
  // DETECTION SOURCE
  // =====================================================

  private loadDetectionSource(): void {

    this.httpService
      .getDetectionSource()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load detection source'
            );

            return;
          }

          const data = response?.series || [];

          this.detectionSourceOptions = {

            series: data.map(
              (item: any) =>
                Number(
                  item.count ?? 0
                )
            ),

            chart: {
              type: 'pie',
              height: 280,
              fontFamily: this.colors.font
            },

            labels: data.map(
              (item: any) =>
                item.label ||
                item.source
            ),

            colors: [
              this.colors.primary,
              this.colors.warning,
              this.colors.success
            ],

            legend: {
              position: 'bottom'
            },

            dataLabels: {

              formatter:
                (val: number) =>
                  `${val.toFixed(1)}%`

            }

          };
        },

        error: (error: any) => {

          console.error(
            'Error loading detection source:',
            error
          );

        }

      });
  }


  // =====================================================
  // TOP FRAUD PATTERNS
  // =====================================================

  private loadTopPatterns(): void {

    this.httpService
      .getTopFraudPatterns()
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load top fraud patterns'
            );

            this.topPatterns = [];

            return;
          }

          this.topPatterns =
            response?.patterns || [];
        },

        error: (error: any) => {

          console.error(
            'Error loading top fraud patterns:',
            error
          );

          this.topPatterns = [];
        }

      });
  }


  // =====================================================
  // RECENT FRAUD REPORTS
  // =====================================================

  private loadRecentReports(
    page: number = this.currentPage
  ): void {

    const payload = {

  page: page,

  page_size:
    this.pageSize,

  search:
    this.searchTerm?.trim() || '',

  channel:
    this.selectedChannel || 'all',

  region:
    this.selectedRegion || 'all',

  status:
    this.selectedStatus || 'all'

};

    this.httpService
      .getRecentFraudReports(
        payload
      )
      .subscribe({

        next: (response: any) => {

          if (response?.status !== 'success') {

            console.error(
              'Unable to load recent fraud reports'
            );

            this.reports = [];

            this.applyLocalFilters();

            return;
          }

          const apiReports =
            response?.reports || [];

          this.reports =
            apiReports.map(
              (
                item: any
              ): FraudReportRow => ({

                id:
                  item.report_id || '',

                date:
                  item.date || '',

                type:
                  item.fraud_type ||
                  'Unknown',

                channel:
                  item.channel ||
                  'Unknown',

                region:
                  item.region ||
                  'Unknown',

                amount:
                  Number(
                    item.amount ?? 0
                  ),

                currency:
                  item.currency ||
                  'KES',

                riskScore:
                  Number(
                    item.risk_score ?? 0
                  ),

                status:
                  item.status ||
                  'Unknown',

                analyst:
                  item.analyst ||
                  'Unassigned'

              })
            );

          this.filteredReports = [
            ...this.reports
          ];

          const pagination =
            response?.pagination || {};

          this.currentPage =
            Number(
              pagination.page ??
              page
            );

          this.pageSize =
            Number(
              pagination.page_size ??
              this.pageSize
            );

          this.totalReports =
            Number(
              pagination.total_reports ??
              0
            );

          this.totalPages =
            Number(
              pagination.total_pages ??
              0
            );

          this.hasNextPage =
            Boolean(
              pagination.has_next
            );

          this.hasPreviousPage =
            Boolean(
              pagination.has_previous
            );

        },

        error: (error: any) => {

          console.error(
            'Error loading recent fraud reports:',
            error
          );

          this.reports = [];

          this.filteredReports = [];

        }

      });
  }


  // =====================================================
  // FILTERS
  // =====================================================

  applyFilters(): void {

  this.currentPage = 1;

  this.applyLocalFilters();

}


private applyLocalFilters(): void {


  const search =
    (this.searchTerm || '')
      .trim()
      .toLowerCase();

  this.filteredReports =
    this.reports.filter(report => {

      const matchesSearch =
        !search ||
        report.id
          .toLowerCase()
          .includes(search) ||
        report.channel
          .toLowerCase()
          .includes(search) ||
        report.region
          .toLowerCase()
          .includes(search) ||
        report.status
          .toLowerCase()
          .includes(search) ||
        report.analyst
          .toLowerCase()
          .includes(search);

      const matchesChannel =
        this.selectedChannel === 'all' ||
        report.channel ===
          this.selectedChannel;

      const matchesRegion =
        this.selectedRegion === 'all' ||
        (report.region || '').trim().toLowerCase() ===
        (this.selectedRegion || '').trim().toLowerCase();

      const matchesStatus =
        this.selectedStatus === 'all' ||
        report.status ===
          this.selectedStatus;

      return (
        matchesSearch &&
        matchesChannel &&
        matchesRegion &&
        matchesStatus
      );

    });

}

  // =====================================================
  // STATUS
  // =====================================================

  getStatusClass(status: string): string {

  switch ((status || '').toLowerCase()) {

    case 'confirmed':
      return 'status-confirmed';

    case 'under review':
      return 'status-review';

    case 'false positive':
      return 'status-fp';

    case 'escalated':
      return 'status-escalated';

    case 'resolved':
      return 'status-resolved';

    case 'pending':
      return 'status-pending';

    default:
      return 'status-default';
  }
}

  getChannelClass(channel: string): string {
  const value = (channel || '').toLowerCase();

  if (value.includes('mobile')) {
    return 'channel-mobile';
  }

  if (value.includes('internet')) {
    return 'channel-internet';
  }

  if (value.includes('ussd')) {
    return 'channel-ussd';
  }

  if (value.includes('atm') || value.includes('pos')) {
    return 'channel-atm';
  }

  if (value.includes('agency')) {
    return 'channel-agency';
  }

  if (value.includes('core')) {
    return 'channel-core';
  }

  return 'channel-default';
}


getChannelIcon(channel: string): string {
  const value = (channel || '').toLowerCase();

  if (value.includes('mobile')) {
    return 'fa-mobile-alt';
  }

  if (value.includes('internet')) {
    return 'fa-globe';
  }

  if (value.includes('ussd')) {
    return 'fa-keyboard';
  }

  if (value.includes('atm')) {
    return 'fa-credit-card';
  }

  if (value.includes('pos')) {
    return 'fa-cash-register';
  }

  if (value.includes('agency')) {
    return 'fa-store';
  }

  if (value.includes('core')) {
    return 'fa-database';
  }

  return 'fa-network-wired';
}


getRiskClass(score: number): string {
  if (score >= 90) {
    return 'risk-critical';
  }

  if (score >= 75) {
    return 'risk-high';
  }

  if (score >= 50) {
    return 'risk-medium';
  }

  return 'risk-low';
}


getRiskLabel(score: number): string {
  if (score >= 90) {
    return 'Critical';
  }

  if (score >= 75) {
    return 'High';
  }

  if (score >= 50) {
    return 'Medium';
  }

  return 'Low';
}


getAnalystClass(analyst: string): string {
  if (
    !analyst ||
    analyst.toLowerCase() === 'unassigned'
  ) {
    return 'analyst-unassigned';
  }

  /*
   * Deterministically assign a color based on the analyst name.
   * The same analyst will always receive the same color.
   */
  const classes = [
    'analyst-blue',
    'analyst-purple',
    'analyst-green',
    'analyst-orange',
    'analyst-cyan'
  ];

  const hash = analyst
    .split('')
    .reduce(
      (total, character) =>
        total + character.charCodeAt(0),
      0
    );

  return classes[hash % classes.length];
}


  getRiskColor(
    score: number
  ): string {

    if (score >= 90) {
      return '#f72585';
    }

    if (score >= 75) {
      return '#fd7e14';
    }

    if (score >= 50) {
      return '#ffc107';
    }

    return '#06d6a0';
  }


  // =====================================================
  // FORMATTERS
  // =====================================================

  formatCurrency(
    amount: number,
    currency: string = 'KES'
  ): string {

    return new Intl.NumberFormat(
      'en-KE',
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
      }
    ).format(
      Number(amount || 0)
    );
  }


  formatCompact(
    amount: number
  ): string {

    const value =
      Number(amount || 0);

    if (
      value >= 1000000000
    ) {

      return `KES ${(
        value / 1000000000
      ).toFixed(1)}B`;

    }

    if (
      value >= 1000000
    ) {

      return `KES ${(
        value / 1000000
      ).toFixed(1)}M`;

    }

    if (
      value >= 1000
    ) {

      return `KES ${(
        value / 1000
      ).toFixed(0)}K`;

    }

    return this.formatCurrency(
      value
    );
  }


  private formatMonth(
    period: string
  ): string {

    if (!period) {

      return '';

    }

    const parts =
      period.split('-');

    if (
      parts.length < 2
    ) {

      return period;

    }

    const year =
      Number(parts[0]);

    const month =
      Number(parts[1]);

    return new Date(
      year,
      month - 1,
      1
    ).toLocaleString(
      'en-US',
      {
        month: 'short'
      }
    );
  }


  // =====================================================
  // EXPORT
  // =====================================================

  exportReport(): void {

    alert(
      'Report export will be available in production.'
    );

  }


  // =====================================================
  // EMPTY INITIAL CHART CONFIGURATION
  // =====================================================

  private initCharts(): void {

    this.fraudTrendOptions = {

      series: [],

      chart: {
        height: 340,
        type: 'line',

        toolbar: {
          show: false
        },

        fontFamily:
          this.colors.font
      },

      stroke: {
        width: [0, 3],
        curve: 'smooth'
      },

      colors: [
        this.colors.danger,
        this.colors.primary
      ],

      labels: [],

      grid: {
        borderColor:
          this.colors.grid
      }

    };


    this.channelBreakdownOptions = {

      series: [
        {
          name:
            'Fraud Cases',

          data: []
        }
      ],

      chart: {
        type: 'bar',
        height: 300,

        toolbar: {
          show: false
        },

        fontFamily:
          this.colors.font
      },

      plotOptions: {

        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '65%'
        }

      },

      colors: [
        this.colors.primary
      ],

      xaxis: {
        categories: []
      },

      grid: {
        borderColor:
          this.colors.grid
      }

    };


    this.fraudTypeOptions = {

      series: [],

      chart: {
        type: 'donut',
        height: 300,
        fontFamily:
          this.colors.font
      },

      labels: [],

      colors: [
        this.colors.danger,
        this.colors.warning,
        this.colors.primary,
        this.colors.purple,
        this.colors.info,
        this.colors.muted
      ],

      legend: {
        position: 'bottom'
      },

      dataLabels: {
        enabled: false
      }

    };


    this.monthlyComparisonOptions = {

      series: [

        {
          name: 'Detected',
          data: []
        },

        {
          name: 'Blocked',
          data: []
        },

        {
          name: 'Recovered',
          data: []
        }

      ],

      chart: {
        type: 'area',
        height: 300,

        toolbar: {
          show: false
        },

        fontFamily:
          this.colors.font
      },

      colors: [
        this.colors.primary,
        this.colors.success,
        this.colors.info
      ],

      stroke: {
        curve: 'smooth',
        width: 2
      },

      xaxis: {
        categories: []
      },

      grid: {
        borderColor:
          this.colors.grid
      }

    };


    this.regionHeatmapOptions = {

      series: [],

      chart: {
        type: 'heatmap',
        height: 280,

        toolbar: {
          show: false
        },

        fontFamily:
          this.colors.font
      },

      dataLabels: {
        enabled: false
      }

    };


    this.detectionSourceOptions = {

      series: [],

      chart: {
        type: 'pie',
        height: 280,

        fontFamily:
          this.colors.font
      },

      labels: [],

      colors: [
        this.colors.primary,
        this.colors.warning,
        this.colors.success
      ],

      legend: {
        position: 'bottom'
      }

    };

  }

}