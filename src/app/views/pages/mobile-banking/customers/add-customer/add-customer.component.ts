import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { NotificationService } from 'src/app/shared/services/NotificationService';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;           // Raw risk score from backend (0-100)
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  mlRiskLevel: string;         // ml_risk_level from backend
  finalRiskLevel: string;      // final_risk_level from backend
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
}

interface SimulationConfig {
  count: number;
  fraudRatio: number;
  isRunning: boolean;
  progress: number;
  results: any[];
  summary: any;
}

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})

export class AddCustomerComponent implements OnInit {
  @ViewChild('feedContainer') feedContainer!: ElementRef;

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedTransaction: Transaction | null = null;
  autoScroll = false;
  showModal = false;
  currentPage = 1;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  pageSize: number = 5;
  totalItems: number = 0;
  activeTab: 'final' | 'llm' | 'rule' = 'final';

  // ✅ Loading state
  isLoading: boolean = false;

  // ✅ Updated channel options
  channelOptions: string[] = [
    'Mobile banking',
    'Internet banking',
    'Core banking',
    'Cards',
    'Agency',
    'ATM/POS',
    'USSD'
  ];

  // Filters
  riskFilter: string = 'all';
  channelFilter: string = 'all';
  searchTerm: string = '';
  isLoadingRelated: boolean = false;

  // Simulation
  showSimulationModal: boolean = false;
  simulation: SimulationConfig = {
    count: 10,
    fraudRatio: 0.25,
    isRunning: false,
    progress: 0,
    results: [],
    summary: null
  };

  // Stats
  stats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    avgRiskScore: 0,
    alerts: 0,
    cases: 0,
    blocked: 0,
    challenged: 0,
    approved: 0
  };

  private refreshSubscription?: Subscription;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();

    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadTransactions();
    });

    this.notificationService.currentAlerts.subscribe((payload) => {
      if (payload) {
        try {
          const tx = this.mapBackendTransaction(payload);
          if (tx) {
            this.transactions.unshift(tx);
            this.applyFilters();
            this.calculateStats();
          }
        } catch (err) {
          console.error('Failed to map incoming alert payload', err);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  get paginatedTransactions(): Transaction[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransactions.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredTransactions.length);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push(-1);
      }
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) {
        pages.push(-1);
      }
      pages.push(total);
    }
    return pages;
  }

  // ============= SIMULATION METHODS =============

  openSimulationModal(): void {
    this.showSimulationModal = true;
    this.simulation.results = [];
    this.simulation.summary = null;
    this.simulation.progress = 0;
  }

  closeSimulationModal(): void {
    if (!this.simulation.isRunning) {
      this.showSimulationModal = false;
    }
  }

  runSimulation(): void {
    if (this.simulation.isRunning) return;

    this.simulation.isRunning = true;
    this.simulation.progress = 0;
    this.simulation.results = [];
    this.simulation.summary = null;

    const payload = {
      count: this.simulation.count,
      fraud_ratio: this.simulation.fraudRatio
    };

    this.httpService.simulateBatch(payload).subscribe({
      next: (response) => {
        this.simulation.isRunning = false;
        this.simulation.progress = 100;

        if (response.status === 'success') {
          this.simulation.summary = response.summary;
          this.simulation.results = response.transactions || [];

          this.processSimulationResults(response.transactions || []);

          Swal.fire({
            icon: 'success',
            title: 'Simulation Complete!',
            html: `
              <div class="text-start">
                <p><strong>${response.summary.total}</strong> transactions processed</p>
                <div class="d-flex gap-2 flex-wrap mt-2">
                  <span class="badge bg-success">✅ Approved: ${response.summary.approved}</span>
                  <span class="badge bg-warning text-dark">⚠️ Challenged: ${response.summary.challenged}</span>
                  <span class="badge bg-danger">🚫 Blocked: ${response.summary.blocked}</span>
                  <span class="badge bg-danger">🔔 Alerts: ${response.summary.alerts}</span>
                  <span class="badge bg-warning text-dark">📁 Cases: ${response.summary.cases}</span>
                </div>
              </div>
            `,
            confirmButtonText: 'View Transactions',
            confirmButtonColor: '#4361ee'
          }).then((result) => {
            if (result.isConfirmed) {
              this.loadTransactions();
            }
          });

          this.loadTransactions();
        }
      },
      error: (error) => {
        this.simulation.isRunning = false;
        console.error('Simulation error:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Simulation Failed',
          text: error.message || 'Failed to run simulation. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    });

    this.simulateProgress();
  }

  private simulateProgress(): void {
    if (!this.simulation.isRunning) return;

    const intervalId = setInterval(() => {
      if (!this.simulation.isRunning) {
        clearInterval(intervalId);
        return;
      }

      const increment = Math.random() * 15 + 5;
      this.simulation.progress = Math.min(this.simulation.progress + increment, 90);

      if (this.simulation.progress >= 90) {
        clearInterval(intervalId);
      }
    }, 500);
  }

  private processSimulationResults(results: any[]): void {
    results.forEach((result) => {
      if (result.status === 'success') {
        const tx = this.mapBatchTransaction(result);
        if (tx) {
          this.transactions.unshift(tx);
        }
      }
    });

    this.applyFilters();
    this.calculateStats();
  }

  // ============= MAPPING METHODS =============

  mapRiskCategory(mlRiskLevel: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    const upper = (mlRiskLevel || '').toUpperCase();
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

  loadRelatedTransactions(transactionId: string): void {
    this.isLoadingRelated = true;

    this.httpService.getRelatedTransactions(transactionId).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.related_transactions) {
          const related = response.related_transactions.map((tx: any) => ({
            id: tx.transaction_id,
            amount: tx.amount || 0,
            riskScore: tx.risk_score || 0,
            status: tx.status_info?.current || 'Resolved'
          }));

          if (this.selectedTransaction) {
            this.selectedTransaction.relatedTransactions = related;
          }
        }
        this.isLoadingRelated = false;
      },
      error: (error) => {
        console.error('Error loading related transactions:', error);
        if (this.selectedTransaction) {
          this.selectedTransaction.relatedTransactions = [];
        }
        this.isLoadingRelated = false;
      }
    });
  }

  loadTransactions(): void {
    this.isLoading = true;
    
    this.httpService.getTransactions(1, 1000).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.transactions) {
          const mappedTransactions: Transaction[] = [];
          response.transactions.forEach((tx: any) => {
            const mapped = this.mapBackendTransaction(tx);
            if (mapped) {
              mappedTransactions.push(mapped);
            }
          });
          
          this.transactions = mappedTransactions.sort(
            (a: Transaction, b: Transaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          this.currentPage = 1;
          this.applyFilters();
          this.calculateStats();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: 'final' | 'llm' | 'rule'): void {
    this.activeTab = tab;
  }

  showAIAnalysis(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.activeTab = 'final';
    this.showModal = true;
    this.selectedTransaction.relatedTransactions = [];
    this.loadRelatedTransactions(transaction.transactionId);
  }

  //
  normalizeChannel(channel: string): string {
    if (!channel) return 'Other';
    
    const ch = String(channel).toLowerCase();
    
    // Map backend channel names to display names
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
    
    // Return original if no match, or capitalize first letter
    return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
  }

  mapBatchTransaction(result: any): Transaction | null {
    try {
      const resultData = result.result || {};
      const fincaSpecific = result.finca_specific || {};
      const txDetails = resultData.transaction_details || {};

      const mlRiskLevel = txDetails.ml_risk_level || 'LOW';
      const riskCategory = this.mapRiskCategory(mlRiskLevel);
      const riskScore = txDetails.ml_risk_score || resultData.risk_score || 0;

      // Parse model agreement
      const modelAgreement = txDetails.Model_Agreement || '0/7 models flagged';
      const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
      const total = 7;

      // Rule engine details
      const ruleEngine = txDetails.Rule_Engine || {
        triggered: false,
        rules: [],
        severity: 0
      };

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
        const signalsData = txDetails.real_time_signals;
        if (signalsData.amount_risk > 0.7) {
          signals.push(`High amount anomaly (${(signalsData.amount_risk * 100).toFixed(0)}% above normal)`);
        } else if (signalsData.amount_risk > 0.4) {
          signals.push(`Medium amount anomaly (${(signalsData.amount_risk * 100).toFixed(0)}% above normal)`);
        }
        if (signalsData.velocity_risk > 0.7) {
          signals.push(`High velocity risk - ${(signalsData.velocity_risk * 5).toFixed(0)} transactions per hour`);
        } else if (signalsData.velocity_risk > 0.4) {
          signals.push(`Medium velocity risk - ${(signalsData.velocity_risk * 5).toFixed(0)} transactions per hour`);
        }
      }

      if (ruleEngine.triggered) {
        ruleEngine.rules.forEach((rule: string) => {
          signals.push(`Rule: ${rule}`);
        });
      }

      // ✅ Normalize channel using the new method
      let channel = fincaSpecific.channel || 'Other';
      channel = this.normalizeChannel(channel);

      const decision = txDetails.finca_final_decision || resultData.decision || 'N/A';
      const status = this.mapStatusFromRisk(riskCategory, decision);

      let location = fincaSpecific.location || 'Nairobi, KE';
      if (location === 'International') location = 'International';

      return {
        id: resultData.transaction_id || fincaSpecific.transaction_id || 'TXN-0000',
        transactionId: resultData.transaction_id || fincaSpecific.transaction_id || 'TXN-0000',
        amount: fincaSpecific.transaction_amount || 0,
        riskScore: riskScore,
        riskCategory: riskCategory,
        mlRiskLevel: mlRiskLevel,
        finalRiskLevel: txDetails.final_risk_level || 'LOW',
        channel: channel,
        location: location,
        timestamp: new Date(resultData.timestamp || new Date()),
        status: status,
        flaggedBy: flaggedBy,
        customerName: fincaSpecific.customer_name || resultData.customer_info?.customer_name || 'Unknown',
        customerId: fincaSpecific.customer_id || resultData.customer_info?.customer_id || 'CUST-0000',
        deviceId: fincaSpecific.device_type || 'Unknown',
        deviceType: fincaSpecific.device_type || 'Unknown',
        ipAddress: 'Unknown',
        modelAgreement: {
          flagged: flagged,
          total: total,
          text: modelAgreement
        },
        mlVotes: txDetails.ML_Votes || '0/7',
        ruleEngine: ruleEngine,
        hybridScore: txDetails.Hybrid_Score || false,
        feedbackEffect: resultData.feedback_effect,
        aiAnalysis: {
          details: this.generateAnalysisDetails(resultData),
          signals: signals,
          ruleBased: resultData.explanations?.rule_based,
          llm: resultData.explanations?.llm,
          final: resultData.explanations?.final
        },
        recommendedAction: resultData.recommended_action || 'Review transaction',
        alertId: fincaSpecific.alert_id,
        caseId: fincaSpecific.case_id,
        rulePoints: txDetails.finca_total_rule_points || 0,
        rulesTriggered: txDetails.finca_rules_triggered?.map((r: any) => r.rule_name) || [],
        isFraud: fincaSpecific.is_fraud || false,
        decision: decision,
        fincaRulesTriggered: txDetails.finca_rules_triggered || [],
        fincaTotalRulePoints: txDetails.finca_total_rule_points || 0,
        fincaCappedRulePoints: txDetails.finca_capped_rule_points || 0,
        fincaRuleRiskLevel: txDetails.finca_rule_risk_level || 'LOW',
        fincaFinalDecision: txDetails.finca_final_decision || 'N/A',
        fincaRuleCount: txDetails.finca_rule_count || 0,
        rawData: result
      };
    } catch (error) {
      console.error('Error mapping batch transaction:', error);
      return null;
    }
  }

  mapBackendTransaction(tx: any): Transaction | null {
    try {
      const txDetails = tx.transaction_details || {};
      
      const mlRiskLevel = txDetails.ml_risk_level || tx.ml_risk_level || 'LOW';
      const riskCategory = this.mapRiskCategory(mlRiskLevel);
      const riskScore = txDetails.ml_risk_score || tx.risk_score || 0;

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

      // ✅ Normalize channel using the new method
      let channel = tx.channel || txDetails.finca_channel || 'Other';
      channel = this.normalizeChannel(channel);

      let location = txDetails.finca_location || tx.location || 'Nairobi, KE';
      if (location === 'International') location = 'International';

      const decision = tx.decision || 'N/A';
      const status = this.mapStatusFromRisk(riskCategory, decision);

      return {
        id: tx.transaction_id || 'TXN-0000',
        transactionId: tx.transaction_id || 'TXN-0000',
        amount: txDetails.Transaction_Amount || txDetails.finca_transaction_amount || 0,
        riskScore: riskScore,
        riskCategory: riskCategory,
        mlRiskLevel: mlRiskLevel,
        finalRiskLevel: tx.final_risk_level || 'LOW',
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

    let details = `This transaction was flagged as ${tx.risk_category || 'Unknown'} with a risk score of ${tx.risk_score || 0}. `;

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

  calculateStats(): void {
    const filtered = this.filteredTransactions.length ? this.filteredTransactions : this.transactions;
    this.stats = {
      total: filtered.length,
      critical: filtered.filter(t => t.riskCategory === 'Critical').length,
      high: filtered.filter(t => t.riskCategory === 'High').length,
      medium: filtered.filter(t => t.riskCategory === 'Medium').length,
      low: filtered.filter(t => t.riskCategory === 'Low').length,
      avgRiskScore: filtered.length > 0
        ? Math.round((filtered.reduce((sum, t) => sum + t.riskScore, 0) / filtered.length) * 10) / 10
        : 0,
      alerts: filtered.filter(t => t.alertId).length,
      cases: filtered.filter(t => t.caseId).length,
      blocked: filtered.filter(t => t.decision === 'BLOCK' || t.riskCategory === 'Critical').length,
      challenged: filtered.filter(t => t.decision === 'CHALLENGE' || t.riskCategory === 'High').length,
      approved: filtered.filter(t => t.decision === 'APPROVE' || t.riskCategory === 'Low').length
    };
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions
      .filter(t => {
        if (this.riskFilter !== 'all' && t.riskCategory.toLowerCase() !== this.riskFilter) {
          return false;
        }

        if (this.channelFilter !== 'all' && t.channel.toLowerCase() !== this.channelFilter.toLowerCase()) {
          return false;
        }

        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          return t.transactionId.toLowerCase().includes(term) ||
            t.customerName.toLowerCase().includes(term) ||
            t.location.toLowerCase().includes(term);
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.calculateStats();
  }

  clearFilters(): void {
    this.riskFilter = 'all';
    this.channelFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  getCounterpartyDisplay(transaction: Transaction): string {
    const raw = transaction.rawData || {};
    const senderValue = this.normalizeCounterparty(
      raw.sender_name ||
      raw.sender_customer_name ||
      raw.sender?.name ||
      raw.sender?.customer_name ||
      raw.sender_device?.id ||
      raw.sender_device?.name ||
      'Sender'
    );
    const recipientValue = this.normalizeCounterparty(
      raw.recipient_name ||
      raw.recipient_customer_name ||
      raw.recipient?.name ||
      raw.recipient?.customer_name ||
      raw.recipient_device?.id ||
      raw.recipient_device?.name ||
      'Recipient'
    );

    const currentCustomerId = transaction.customerId || raw.customer_info?.customer_id;
    const senderId = raw.sender_device?.id || raw.sender?.customer_id || raw.sender_customer_id;
    const recipientId = raw.recipient_device?.id || raw.recipient?.customer_id || raw.recipient_customer_id;
    const customerIsSender = !!currentCustomerId && !!senderId && String(currentCustomerId) === String(senderId) &&
      (!recipientId || String(currentCustomerId) !== String(recipientId));

    if (customerIsSender) {
      return recipientValue || 'Recipient unavailable';
    }

    return senderValue || recipientValue || 'Counterparty unavailable';
  }

  private normalizeCounterparty(value: string | null | undefined): string {
    if (!value || value === 'null' || value === 'undefined' || value === 'N/A' || value === 'Unknown') {
      return '';
    }
    return String(value).trim();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTransaction = null;
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

  getRiskProgressColor(score: number): string {
    if (score >= 80) return '#f72585';
    else if (score >= 60) return '#fc7201';
    else if (score >= 30) return '#ffc107';
    else return '#28a745';
  }

  viewTransactionDetail(transaction: Transaction): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', transaction.transactionId]);
  }

  investigateTransaction(): void {
    if (this.selectedTransaction) {
      this.router.navigate([
        '/fraudsentinelAi/transaction_management/fraud/investigation-graph',
        this.selectedTransaction.transactionId
      ]);
      this.closeModal();
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(timestamp: string): string {
    if (!timestamp) return '--/--/----';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(timestamp: Date): string {
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

  refresh(): void {
    this.loadTransactions();
  }
}