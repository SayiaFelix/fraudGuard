import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subscription, interval } from 'rxjs';
import { HttpService, ModelMetrics } from 'src/app/shared/services/http.service';
import { Transaction } from 'src/app/shared/services/http.service';

// Use the same Transaction interface as add-customer component
interface DashboardTransaction {
  id: string;
  transactionId: string;
  amount: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  finalRiskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  mlRiskLevel: string;
  mlRiskScore?: number;
  finalRiskLevel: string;
  channel: string;
  location: string;
  timestamp: Date;
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive' | 'Completed' | 'Auto-Approved';
  flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
  customerName: string;
  customerId: string;
  deviceId: string;
  deviceType?: string;
  ipAddress: string;
  modelAgreement: {
    flagged: number;
    total: number;
    text: string;
  };
  mlVotes: string;
  ruleEngine: {
    triggered: boolean;
    rules: string[];
    severity: number;
  };
  hybridScore: boolean;
  feedbackEffect?: any;
  aiAnalysis: {
    details: string;
    signals: string[];
    ruleBased?: string;
    llm?: string;
    final?: string;
  };
  recommendedAction: string;
  relatedTransactions?: Array<{
    id: string;
    amount: number;
    riskScore: number;
    status: string;
  }>;
  rawData?: any;
  alertId?: string | null;
  caseId?: string | null;
  rulePoints?: number;
  rulesTriggered?: string[];
  isFraud?: boolean;
  decision?: string;
  fincaRulesTriggered?: any[];
  fincaTotalRulePoints?: number;
  fincaCappedRulePoints?: number;
  fincaRuleRiskLevel?: string;
  fincaFinalDecision?: string;
  fincaRuleCount?: number;
  fincaChannel?: string;
  fincaDeviceType?: string;
  fincaLocation?: string;
  transactionAmount?: number;
}

interface KPI {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'flat';
  description: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = false;
  lastUpdated = new Date();
  
  footerStats = {
    transactionsAnalyzed: 0,
    avgResponse: '0ms',
    modelVersion: 'v1.0.0-stage1'
  };

  allTransactions: DashboardTransaction[] = [];
  
  modelMetrics: ModelMetrics | null = null;
  auditLogs: any[] = [];
  
  private refreshSubscription?: Subscription;

  kpis: KPI[] = [
    {
      label: 'Total Transactions',
      value: '0',
      icon: 'fas fa-exchange-alt',
      color: '#4361ee',
      trend: 'flat',
      description: 'Last 24 hours'
    },
    {
      label: 'High Risk Alerts',
      value: '0',
      icon: 'fas fa-exclamation-triangle',
      color: '#f72585',
      trend: 'flat',
      description: 'Critical + High'
    },
    {
      label: 'Fraud Blocked',
      value: 'KES 0',
      icon: 'fas fa-shield-alt',
      color: '#06d6a0',
      trend: 'flat',
      description: 'Prevented losses'
    },
    {
      label: 'AI Confidence',
      value: '0%',
      icon: 'fas fa-brain',
      color: '#4cc9f0',
      trend: 'flat',
      description: 'Model accuracy'
    }
  ];
  
  allHighRiskTransactions: DashboardTransaction[] = [];
  filteredHighRiskTransactions: DashboardTransaction[] = [];
  paginatedHighRiskTransactions: DashboardTransaction[] = [];
  
  recentActivities: any[] = [];

  // Chart Data
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Fraud Cases',
        borderColor: '#f72585',
        backgroundColor: 'rgba(247, 37, 133, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        data: [],
        label: 'Amount (M KES)',
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
        fill: true
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Fraud Cases' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        title: { display: true, text: 'Amount (Millions KES)' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  pieChartData: ChartData<'pie'> = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745']
    }]
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (ctx) => `${ctx.raw} cases` } }
    }
  };

  scoreDistributionData: ChartData<'bar'> = {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      label: 'Transactions',
      backgroundColor: ['#4cc9f0', '#ff9e00', '#ffc107', '#fd7e14', '#dc3545'],
      borderRadius: 6
    }]
  };

  scoreDistributionOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: 'ML Risk Score Distribution',
        font: { size: 14, weight: 'bold' }
      }
    },
    scales: {
      x: {
        title: { 
          display: true, 
          text: 'ML Risk Score Range',
          font: { size: 12, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { 
          display: true, 
          text: 'Number of Transactions',
          font: { size: 12, weight: 'bold' }
        }
      }
    }
  };

  // Pagination & Filters
  page: number = 1;
  pageSize: number = 5;
  totalRecords: number = 0;
  riskFilter: string = 'all';
  channelFilter: string = 'all';
  searchTerm: string = '';

  channelOptions: string[] = [
    'Mobile banking',
    'Internet banking',
    'Core banking',
    'Cards',
    'Agency',
    'ATM/POS',
    'USSD'
  ];

  constructor(
    private router: Router,
    private fraudService: HttpService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    
    setTimeout(() => {
      if (this.isLoading) {
        console.log('Safety timeout - forcing loader off');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 10000);
    
    this.refreshSubscription = interval(360000).subscribe(() => {
      this.refresh();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // ============= DATA LOADING =============

  loadDashboardData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.loadTransactions(),
      this.loadFraudHistory(),
      this.loadModelMetrics(),
      this.loadAuditLog()
    ]).then(() => {
      this.isLoading = false;
      this.lastUpdated = new Date();
      this.cdr.detectChanges();
      console.log('✅ Dashboard data loaded successfully');
    }).catch((error) => {
      console.error('❌ Error loading data:', error);
      this.isLoading = false;
      this.lastUpdated = new Date();
      this.cdr.detectChanges();
    });
  }

  loadTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.fraudService.getTransactions(1, 1000).subscribe({
        next: (response) => {
          console.log('📊 Transactions loaded:', response.transactions?.length || 0);
          
          if (response.status === 'success' && response.transactions) {
            const mappedTransactions: DashboardTransaction[] = [];
            response.transactions.forEach((tx: any) => {
              const mapped = this.mapBackendTransaction(tx);
              if (mapped) {
                mappedTransactions.push(mapped);
              }
            });
            
            this.allTransactions = mappedTransactions.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            // ✅ Store ALL high risk transactions (not paginated)
            this.allHighRiskTransactions = this.allTransactions.filter(tx => 
              tx.finalRiskCategory === 'Critical' || tx.finalRiskCategory === 'High'
            );
            
            // ✅ Initialize filtered list with all high risk transactions
            this.filteredHighRiskTransactions = [...this.allHighRiskTransactions];
            
            console.log('🔴 High risk transactions:', this.allHighRiskTransactions.length);
            
            this.updateKPIs();
            this.applyFiltersAndPaginate();
            this.updateRiskDistribution();
            this.updateLineChart();
            this.calculateScoreDistribution();
            this.updateFooterStats();
            
            this.cdr.detectChanges();
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error loading transactions:', error);
          resolve();
        }
      });
    });
  }

  loadFraudHistory(): Promise<void> {
    return new Promise((resolve) => {
      this.fraudService.getFraudHistory(1, 100).subscribe({
        next: (response) => {
          console.log('📊 Fraud history loaded:', response.fraud_transactions?.length || 0);
          resolve();
        },
        error: (error) => {
          console.error('❌ Error loading fraud history:', error);
          resolve();
        }
      });
    });
  }

  loadModelMetrics(): Promise<void> {
    return new Promise((resolve) => {
      this.fraudService.getModelMetrics().subscribe({
        next: (response) => {
          console.log('📊 Model metrics loaded');
          if (response.status === 'success') {
            this.modelMetrics = response;
            this.updateKPIs();
            this.updateFooterStats();
            this.cdr.detectChanges();
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error loading model metrics:', error);
          resolve();
        }
      });
    });
  }

  loadAuditLog(): Promise<void> {
    return new Promise((resolve) => {
      this.fraudService.getAuditLog().subscribe({
        next: (response) => {
          console.log('📊 Audit log loaded:', response.logs?.length || 0);
          if (response.status === 'success' && response.logs) {
            this.auditLogs = response.logs;
            this.updateRecentActivities();
            this.cdr.detectChanges();
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error loading audit log:', error);
          resolve();
        }
      });
    });
  }

  // ============= MAPPING METHODS =============

  mapRiskCategory(riskLevel: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    const upper = (riskLevel || '').toUpperCase();
    if (upper === 'CRITICAL') return 'Critical';
    if (upper === 'HIGH') return 'High';
    if (upper === 'MEDIUM') return 'Medium';
    return 'Low';
  }

  mapStatusFromRisk(riskCategory: string, decision?: string): 'Open' | 'Investigating' | 'Auto-Approved' | 'Completed' | 'Resolved' {
    const upper = riskCategory.toUpperCase();
    if (upper === 'CRITICAL') return 'Open';
    if (upper === 'HIGH') return 'Investigating';
    if (upper === 'MEDIUM') return 'Open';
    if (upper === 'LOW') {
      if (decision === 'APPROVE') return 'Auto-Approved';
      return 'Completed';
    }
    return 'Resolved';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Under Review': 'bg-info',
      'Auto-Approved': 'bg-success',
      'Resolved': 'bg-success',
      'False Positive': 'bg-secondary',
      'Completed': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  roundToTwo(value: number): number {
    return Math.round((value || 0) * 100) / 100;
  }

  normalizeChannel(channel: string): string {
    if (!channel) return 'Other';
    
    const ch = String(channel).toLowerCase();
    
    if (ch.includes('mobile') || ch.includes('momo') || ch.includes('mpesa')) {
      return 'Mobile banking';
    } else if (ch.includes('internet') || ch.includes('web') || ch.includes('online')) {
      return 'Internet banking';
    } else if (ch.includes('core') || ch.includes('core_banking')) {
      return 'Core banking';
    } else if (ch.includes('card') || ch.includes('credit') || ch.includes('debit')) {
      return 'Cards';
    } else if (ch.includes('agent') || ch.includes('agency')) {
      return 'Agency';
    } else if (ch.includes('atm') || ch.includes('pos')) {
      return 'ATM/POS';
    } else if (ch.includes('ussd')) {
      return 'USSD';
    }
    
    return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
  }

  mapBackendTransaction(tx: any): DashboardTransaction | null {
    try {
      const txDetails = tx.transaction_details || {};
      
      const mlRiskLevel = txDetails.ml_risk_level || 'LOW';
      const mlRiskCategory = this.mapRiskCategory(mlRiskLevel);
      const mlRiskScore = this.roundToTwo(txDetails.ml_risk_score || 0);

      const finalRiskLevelFromRoot = tx.risk_category || tx.risk_assessment?.risk_category || 'LOW';
      const finalRiskCategory = this.mapRiskCategory(finalRiskLevelFromRoot);
      const finalRiskScore = this.roundToTwo(tx.risk_score || tx.risk_assessment?.risk_score || 0);

      const modelAgreement = txDetails.Model_Agreement || '0/7 models flagged';
      const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
      const total = 7;

      const mlVotes = txDetails.ML_Votes || '0/7';

      const ruleEngine = txDetails.Rule_Engine || {
        triggered: false,
        rules: [],
        severity: 0
      };

      const hybridScore = txDetails.Hybrid_Score || false;

      let flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
      const mlFlagged = flagged > 0;
      const ruleFlagged = ruleEngine.triggered;

      if (mlFlagged && ruleFlagged) {
        flaggedBy = 'AI + Rules (Hybrid)';
      } else if (mlFlagged) {
        flaggedBy = 'AI';
      } else if (ruleFlagged) {
        flaggedBy = 'Rules';
      } else {
        flaggedBy = 'Manual';
      }

      const signals: string[] = [];
      if (txDetails.real_time_signals) {
        const signals_data = txDetails.real_time_signals;
        if (signals_data.amount_risk > 0.7) {
          signals.push(`High amount anomaly (${(signals_data.amount_risk * 100).toFixed(0)}% above normal)`);
        } else if (signals_data.amount_risk > 0.4) {
          signals.push(`Medium amount anomaly (${(signals_data.amount_risk * 100).toFixed(0)}% above normal)`);
        }
        if (signals_data.velocity_risk > 0.7) {
          signals.push(`High velocity risk - ${(signals_data.velocity_risk * 5).toFixed(0)} transactions per hour`);
        } else if (signals_data.velocity_risk > 0.4) {
          signals.push(`Medium velocity risk - ${(signals_data.velocity_risk * 5).toFixed(0)} transactions per hour`);
        }
      }

      if (ruleEngine.triggered) {
        ruleEngine.rules.forEach((rule: string) => {
          signals.push(`Rule: ${rule}`);
        });
      }

      let channel = tx.channel || txDetails.finca_channel || 'Other';
      channel = this.normalizeChannel(channel);

      let location = txDetails.finca_location || tx.location || 'Nairobi, KE';
      if (location === 'International') location = 'International';

      const decision = txDetails.finca_final_decision || tx.decision || 'N/A';
      const status = this.mapStatusFromRisk(finalRiskCategory, decision);

      return {
        id: tx.transaction_id || 'TXN-0000',
        transactionId: tx.transaction_id || 'TXN-0000',
        amount: txDetails.Transaction_Amount || txDetails.finca_transaction_amount || 0,
        riskCategory: mlRiskCategory,
        mlRiskLevel: mlRiskLevel,
        mlRiskScore: mlRiskScore,
        finalRiskCategory: finalRiskCategory,
        finalRiskLevel: finalRiskLevelFromRoot,
        riskScore: finalRiskScore,
        channel: channel,
        location: location,
        timestamp: new Date(tx.timestamp || new Date()),
        status: tx.status_info?.current || status,
        flaggedBy: flaggedBy,
        customerName: tx.customer_info?.customer_name || tx.finca_customer_name || 'Unknown',
        customerId: tx.customer_info?.customer_id || tx.finca_customer_id || 'CUST-0000',
        deviceId: txDetails.finca_device_type || tx.device_type || 'Unknown',
        deviceType: txDetails.finca_device_type || tx.device_type || 'Unknown',
        ipAddress: 'Unknown',
        modelAgreement: {
          flagged: flagged,
          total: total,
          text: modelAgreement
        },
        mlVotes: mlVotes,
        ruleEngine: ruleEngine,
        hybridScore: hybridScore,
        feedbackEffect: tx.feedback_effect,
        aiAnalysis: {
          details: this.generateAnalysisDetails(tx),
          signals: signals,
          ruleBased: tx.explanations?.rule_based,
          llm: tx.explanations?.llm,
          final: tx.explanations?.final
        },
        recommendedAction: tx.recommended_action || 'Review transaction',
        alertId: tx.alert_id || null,
        caseId: tx.case_id || null,
        rulePoints: txDetails.finca_total_rule_points || 0,
        rulesTriggered: txDetails.finca_rules_triggered?.map((r: any) => r.rule_name) || [],
        decision: decision,
        fincaRulesTriggered: txDetails.finca_rules_triggered || [],
        fincaTotalRulePoints: txDetails.finca_total_rule_points || 0,
        fincaCappedRulePoints: txDetails.finca_capped_rule_points || 0,
        fincaRuleRiskLevel: txDetails.finca_rule_risk_level || 'LOW',
        fincaFinalDecision: txDetails.finca_final_decision || 'N/A',
        fincaRuleCount: txDetails.finca_rule_count || 0,
        fincaChannel: txDetails.finca_channel || tx.channel || '',
        fincaDeviceType: txDetails.finca_device_type || tx.device_type || '',
        fincaLocation: txDetails.finca_location || tx.location || '',
        transactionAmount: txDetails.Transaction_Amount || txDetails.finca_transaction_amount || 0,
        rawData: tx
      };
    } catch (error) {
      console.error('Error mapping transaction:', error);
      return null;
    }
  }

  generateAnalysisDetails(tx: any): string {
    const signals = tx.transaction_details?.real_time_signals;
    const ruleEngine = tx.transaction_details?.Rule_Engine;

    let details = `This transaction was flagged as ${tx.risk_category || 'Unknown'} with a risk score of ${this.roundToTwo(tx.risk_score || 0)}. `;

    if (ruleEngine?.triggered) {
      details += `Rule engine triggered: ${ruleEngine.rules.join(', ')}. `;
    }

    if (signals) {
      if (signals.amount_risk > 0.4) {
        details += `Amount is ${(signals.amount_risk * 100).toFixed(0)}% ${signals.amount_risk > 0.7 ? 'above' : 'around'} average (KES ${signals.avg_amount_used?.toLocaleString()}). `;
      }
      if (signals.velocity_risk > 0.3) {
        details += `Transaction frequency: ${(signals.velocity_risk * 5).toFixed(0)} transactions per hour. `;
      }
    }

    if (tx.transaction_details?.Hybrid_Score) {
      details += `Hybrid ML + Rules assessment. `;
    }

    details += tx.transaction_details?.Model_Agreement || '';
    return details;
  }

  // ============= UI UPDATE METHODS =============

  updateKPIs(): void {
    this.kpis[0].value = this.allTransactions.length.toLocaleString();
    
    const highRiskCount = this.allHighRiskTransactions.length;
    this.kpis[1].value = highRiskCount.toLocaleString();
    
    const totalBlocked = this.allHighRiskTransactions
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    this.kpis[2].value = `KES ${(totalBlocked / 1000000).toFixed(1)}M`;
    
    if (this.modelMetrics?.metrics?.['XGBoost']) {
      const xgb = this.modelMetrics.metrics['XGBoost'];
      this.kpis[3].value = `${(xgb.accuracy * 100).toFixed(1)}%`;
      this.kpis[3].description = `Precision: ${(xgb.precision * 100).toFixed(1)}% | Recall: ${(xgb.recall * 100).toFixed(1)}%`;
      this.kpis[3].trend = xgb.accuracy > 0.95 ? 'up' : xgb.accuracy > 0.90 ? 'flat' : 'down';
    }
  }

  // ✅ Apply filters and paginate in one method
  applyFiltersAndPaginate(): void {
    // Step 1: Filter all high risk transactions
    this.filteredHighRiskTransactions = this.allHighRiskTransactions.filter(tx => {
      // Filter by risk level
      if (this.riskFilter !== 'all' && tx.finalRiskCategory.toLowerCase() !== this.riskFilter) {
        return false;
      }
      
      // Filter by channel
      if (this.channelFilter !== 'all' && tx.channel.toLowerCase() !== this.channelFilter) {
        return false;
      }
      
      // Filter by search term
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        return tx.transactionId.toLowerCase().includes(term) ||
          tx.customerName.toLowerCase().includes(term) ||
          tx.location.toLowerCase().includes(term);
      }
      
      return true;
    });
    
    // Step 2: Update total records
    this.totalRecords = this.filteredHighRiskTransactions.length;
    
    // Step 3: Paginate
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.totalRecords);
    this.paginatedHighRiskTransactions = this.filteredHighRiskTransactions.slice(startIndex, endIndex);
    
    // Step 4: Reset page if current page is out of range
    if (this.page > this.getTotalPages() && this.totalRecords > 0) {
      this.page = this.getTotalPages();
      this.applyFiltersAndPaginate();
    }
    
    this.cdr.detectChanges();
  }

  // ✅ Filter method called from UI
  applyHighRiskFilters(): void {
    this.page = 1; // Reset to first page
    this.applyFiltersAndPaginate();
  }

  // ✅ Clear all filters
  clearHighRiskFilters(): void {
    this.riskFilter = 'all';
    this.channelFilter = 'all';
    this.searchTerm = '';
    this.page = 1;
    this.applyFiltersAndPaginate();
  }

  updateRiskDistribution(): void {
    const critical = this.allTransactions.filter(tx => tx.finalRiskCategory === 'Critical').length;
    const high = this.allTransactions.filter(tx => tx.finalRiskCategory === 'High').length;
    const medium = this.allTransactions.filter(tx => tx.finalRiskCategory === 'Medium').length;
    const low = this.allTransactions.filter(tx => tx.finalRiskCategory === 'Low').length;
    
    this.pieChartData = {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        data: [critical, high, medium, low],
        backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'],
        borderWidth: 1
      }]
    };
  }

  updateLineChart(): void {
    const monthlyData = new Map<string, { count: number; amount: number }>();
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    last6Months.forEach(month => {
      monthlyData.set(month, { count: 0, amount: 0 });
    });
    
    const fraudTransactions = this.allTransactions.filter(tx => 
      tx.finalRiskCategory === 'Critical' || tx.finalRiskCategory === 'High'
    );
    
    fraudTransactions.forEach(tx => {
      try {
        const date = new Date(tx.timestamp);
        const month = date.toLocaleString('default', { month: 'short' });
        
        if (monthlyData.has(month)) {
          const data = monthlyData.get(month)!;
          data.count++;
          data.amount += tx.amount || 0;
        }
      } catch (e) {
        console.error('Error parsing date:', tx.timestamp);
      }
    });
    
    this.lineChartData = {
      labels: last6Months,
      datasets: [
        {
          data: last6Months.map(month => monthlyData.get(month)?.count || 0),
          label: 'Fraud Cases',
          borderColor: '#f72585',
          backgroundColor: 'rgba(247, 37, 133, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          data: last6Months.map(month => (monthlyData.get(month)?.amount || 0) / 1000000),
          label: 'Amount (M KES)',
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          tension: 0.4,
          yAxisID: 'y1',
          fill: true
        }
      ]
    };
  }

  calculateScoreDistribution(): void {
    const distribution = [0, 0, 0, 0, 0];
    
    this.allTransactions.forEach(tx => {
      const mlScore = tx.mlRiskScore || tx.riskScore || 0;
      
      if (mlScore <= 20) distribution[0]++;
      else if (mlScore <= 40) distribution[1]++;
      else if (mlScore <= 60) distribution[2]++;
      else if (mlScore <= 80) distribution[3]++;
      else distribution[4]++;
    });
    
    this.scoreDistributionData = {
      labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
      datasets: [{
        data: distribution,
        label: 'Transactions',
        backgroundColor: ['#4cc9f0', '#ff9e00', '#ffc107', '#fd7e14', '#dc3545'],
        borderRadius: 6
      }]
    };
  }

  updateRecentActivities(): void {
    const sortedLogs = this.auditLogs.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    this.recentActivities = sortedLogs.slice(0, 5).map(log => {
      let type = 'info';
      const riskScore = log.risk_score || 0;
      if (riskScore >= 8) type = 'critical';
      else if (riskScore >= 6) type = 'warning';
      else if (riskScore >= 3) type = 'info';
      else type = 'success';
      
      const logTime = new Date(log.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - logTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      let timeAgo = 'Just now';
      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins} minutes ago`;
      else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
      else timeAgo = `${Math.floor(diffMins / 1440)} days ago`;
      
      return {
        type: type,
        message: `Transaction ${log.transaction_id} - ${log.risk_category || 'Unknown'}`,
        details: `Score: ${riskScore}/10 - ${log.recommended_action || 'Review required'}`,
        time: timeAgo
      };
    });
  }

  updateFooterStats(): void {
    this.footerStats.transactionsAnalyzed = this.allTransactions.length;
    if (this.modelMetrics?.model_version) {
      this.footerStats.modelVersion = this.modelMetrics.model_version;
    }
    this.footerStats.avgResponse = this.calculateAvgResponseTime();
  }

  calculateAvgResponseTime(): string {
    const responseTimes = [156, 178, 192, 201, 187, 165, 179];
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return `${Math.round(avg)}ms`;
  }

  // ============= PAGINATION METHODS =============

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.page = page;
      this.applyFiltersAndPaginate();
    }
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.applyFiltersAndPaginate();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.applyFiltersAndPaginate();
    }
  }

  nextPage(): void {
    if (this.page < this.getTotalPages()) {
      this.page++;
      this.applyFiltersAndPaginate();
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // ============= UI HELPER METHODS =============

  formatTime(timestamp: Date): string {
    if (!timestamp) return 'N/A';
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  formatDate(timestamp: Date): string {
    if (!timestamp) return '--/--/----';
    return timestamp.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  getRiskBadgeClass(riskCategory: string): string {
    const classes: { [key: string]: string } = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory] || 'bg-secondary';
  }

  getRiskScoreColor(score: number): string {
    if (score >= 80) return '#f72585';
    else if (score >= 60) return '#fc7201';
    else if (score >= 30) return '#ffc107';
    else return '#28a745';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'critical': 'fa-exclamation-circle text-danger',
      'update': 'fa-sync-alt text-primary',
      'success': 'fa-check-circle text-success',
      'warning': 'fa-exclamation-triangle text-warning',
      'info': 'fa-info-circle text-info'
    };
    return icons[type] || 'fa-bell text-secondary';
  }

  getPieChartColor(index: number): string {
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
    return colors[index] || '#6c757d';
  }

  getPieChartValue(index: number): number {
    if (this.pieChartData?.datasets?.[0]?.data && 
        Array.isArray(this.pieChartData.datasets[0].data) && 
        index < this.pieChartData.datasets[0].data.length) {
      return this.pieChartData.datasets[0].data[index] as number;
    }
    return 0;
  }

  getChannelIcon(channel: string): string {
    const icons: { [key: string]: string } = {
      'Mobile banking': 'fa-mobile-alt',
      'Internet banking': 'fa-globe',
      'Core banking': 'fa-university',
      'Cards': 'fa-credit-card',
      'Agency': 'fa-user-tie',
      'ATM/POS': 'fa-credit-card',
      'USSD': 'fa-phone-alt'
    };
    return icons[channel] || 'fa-exchange-alt';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // ============= NAVIGATION METHODS =============

  viewTransaction(transactionId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', transactionId]);
  }

  investigateAlert(alertId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', alertId]);
  }

  refresh(): void {
    this.loadDashboardData();
  }

  exportExcel(): void {
    alert('Excel export ready in production version');
  }

  

  exportPDF(): void {
    alert('PDF export ready in production version');
  }
}