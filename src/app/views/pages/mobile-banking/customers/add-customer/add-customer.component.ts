import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription, interval } from 'rxjs';

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  channel: string;
  location: string;
  timestamp: Date;
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive' | 'Completed';
  flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)'; 
  customerName: string;
  customerId: string;
  deviceId: string;
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
  feedbackEffect?: {  
    original_score: number;
    adjusted_score: number;
    original_category: string;
    adjusted_category: string;
    difference: number;
    feedback_outcome: string;
    weights_adjusted: boolean;
  };
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
  autoScroll = true;
  showModal = false;
  activeTab: 'final' | 'llm' | 'rule' = 'final';
  // Filters
  riskFilter: string = 'all';
  channelFilter: string = 'all';
  searchTerm: string = '';
  isLoadingRelated: boolean = false;
  // Stats
  stats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    avgRiskScore: 0
  };

  private refreshSubscription?: Subscription;

  constructor(
    private router: Router,
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadTransactions();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }


loadRelatedTransactions(transactionId: string): void {
  this.isLoadingRelated = true;
  
  this.httpService.getRelatedTransactions(transactionId).subscribe({
    next: (response) => {
      if (response.status === 'success' && response.related_transactions) {
        const related = response.related_transactions.map((tx: any) => ({
          id: tx.transaction_id,
          amount: tx.amount || 0,
          riskScore: tx.risk_score,
          status:  tx.status_info.current ||this.mapRiskCategoryToStatus(tx.risk_category)
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

mapRiskCategoryToStatus(riskCategory: string): string {
  if (riskCategory?.includes('Critical')) {
    return 'Open';
  } else if (riskCategory?.includes('High')) {
    return 'Investigating';
  } else if (riskCategory?.includes('Medium')) {
    return 'Auto-Approved';
  } else if (riskCategory?.includes('Low')) {
    return 'Auto-Approved';
  }
  return 'Resolved'; // Default
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

  loadTransactions(): void {
    this.httpService.getTransactions(1, 100).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.transactions) {
      
          this.transactions = response.transactions.map(tx => this.mapBackendTransaction(tx));
          this.applyFilters();
          this.calculateStats();
          console.log('Live transactions loaded:', this.transactions);
        }
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
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

mapBackendTransaction(tx: any): Transaction {
  let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
  if (tx.risk_category.includes('Critical')) riskCategory = 'Critical';
  else if (tx.risk_category.includes('High')) riskCategory = 'High';
  else if (tx.risk_category.includes('Medium')) riskCategory = 'Medium';
  else if (tx.risk_category.includes('Low')) riskCategory = 'Low';

  // Parse model agreement
  const modelAgreement = tx.transaction_details?.Model_Agreement || '0/7 models flagged';
  const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
  const total = 7;

  const mlVotes = tx.transaction_details?.ML_Votes || '0/7';

  // Rule engine details
  const ruleEngine = tx.transaction_details?.Rule_Engine || {
    triggered: false,
    rules: [],
    severity: 0
  };

  const hybridScore = tx.transaction_details?.Hybrid_Score || false;


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
    flaggedBy = 'Manual'; // Default
  }

  const signals: string[] = [];
  if (tx.transaction_details?.real_time_signals) {
    const signals_data = tx.transaction_details.real_time_signals;
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
      signals.push(` Rule: ${rule}`);
    });
  }

  let channel = 'Web';
  let location = 'Nairobi, KE';

  return {
    id: tx.transaction_id,
    transactionId: tx.transaction_id,
    amount: tx.transaction_details?.Transaction_Amount || 0,
    riskScore: tx.risk_score,
    riskCategory: riskCategory,
    channel: channel,
    location: location,
    timestamp: new Date(tx.timestamp),
    status: tx.status_info?.current || this.mapRiskCategoryToStatus(riskCategory),
    flaggedBy: flaggedBy, 
    customerName: `${tx.customer_info?.customer_name || 'Unknown'}`,
    customerId: `${tx.customer_info?.customer_id || 'CUST-0000'}`,
    deviceId: 'Unknown',
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
    recommendedAction: tx.recommended_action,
    rawData: tx
  };
}

generateAnalysisDetails(tx: any): string {
  const signals = tx.transaction_details?.real_time_signals;
  const ruleEngine = tx.transaction_details?.Rule_Engine;
  
  let details = `This transaction was flagged as ${tx.risk_category} with a risk score of ${tx.risk_score}. `;
  
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
        : 0
    };
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter(t => {
      // Risk filter
      if (this.riskFilter !== 'all' && t.riskCategory.toLowerCase() !== this.riskFilter) {
        return false;
      }
      
      // Channel filter
      if (this.channelFilter !== 'all' && t.channel.toLowerCase() !== this.channelFilter) {
        return false;
      }
      
      // Search term
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        return t.transactionId.toLowerCase().includes(term) ||
               t.customerName.toLowerCase().includes(term) ||
               t.location.toLowerCase().includes(term);
      }
      
      return true;
    });
    
    this.calculateStats();
  }

  clearFilters(): void {
    this.riskFilter = 'all';
    this.channelFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.feedContainer) {
          this.feedContainer.nativeElement.scrollTop = this.feedContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Scroll error:', err);
    }
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
    if (score >= 8) {
      return '#f72585'; 
    } else if (score >= 6) {
      return '#fc7201'; 
    } else if (score >= 3) {
      return '#ffc107';
    } else {
      return '#28a745'; // 
    }
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
      'Mobile': 'fa-mobile-alt',
      'Web': 'fa-globe',
      'ATM': 'fa-credit-card',
      'Agent': 'fa-user-tie'
    };
    return icons[channel] || 'fa-exchange-alt';
  }

  refresh(): void {
    this.loadTransactions();
  }
}