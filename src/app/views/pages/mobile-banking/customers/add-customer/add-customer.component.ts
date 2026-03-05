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
  status: 'Open' | 'Investigating' | 'Resolved';
  flaggedBy: 'AI' | 'Rules' | 'Manual';
  customerName: string;
  customerId: string;
  deviceId: string;
  ipAddress: string;
  modelAgreement: {
    flagged: number;
    total: number;
  };
  aiAnalysis: {
    details: string;
    signals: string[];
  };
  recommendedAction: string;
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
  
  // Filters
  riskFilter: string = 'all';
  channelFilter: string = 'all';
  searchTerm: string = '';
  
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
    
    // Refresh every 60 seconds
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

  loadTransactions(): void {
    this.httpService.getTransactions(1, 50).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.transactions) {
          // Converting backend transactions to frontend format
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

  mapBackendTransaction(tx: any): Transaction {
    let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    if (tx.risk_category.includes('Critical')) riskCategory = 'Critical';
    else if (tx.risk_category.includes('High')) riskCategory = 'High';
    else if (tx.risk_category.includes('Medium')) riskCategory = 'Medium';
    else if (tx.risk_category.includes('Low')) riskCategory = 'Low';

    // Parse model agreement (e.g., "3/7 models flagged as fraud")
    const modelAgreement = tx.transaction_details?.Model_Agreement || '0/7 models flagged';
    const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
    const total = 7; // Your backend always uses 7 models

    // Extract signals from real_time_signals if available
    const signals: string[] = [];
    if (tx.transaction_details?.real_time_signals) {
      const signals_data = tx.transaction_details.real_time_signals;
      if (signals_data.amount_risk > 0.7) signals.push('High amount anomaly');
      else if (signals_data.amount_risk > 0.4) signals.push('Medium amount anomaly');
      if (signals_data.velocity_risk > 0.7) signals.push('High velocity risk');
      else if (signals_data.velocity_risk > 0.4) signals.push('Medium velocity risk');
    }

    let channel = 'Web';
    // You might have channel info in transaction_details or elsewhere

    // Determine location (you can enhance this)
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
      status: 'Open', // Default status
      flaggedBy: 'AI',
      customerName: `Customer ${tx.transaction_id.substring(0, 8)}`, 
      customerId: `CUST-${tx.transaction_id.substring(0, 8)}`, 
      deviceId: 'Unknown', 
      ipAddress: 'Unknown', 
      modelAgreement: {
        flagged: flagged,
        total: total
      },
      aiAnalysis: {
        details: this.generateAnalysisDetails(tx),
        signals: signals
      },
      recommendedAction: tx.recommended_action,
      rawData: tx
    };
  }

  generateAnalysisDetails(tx: any): string {
    const signals = tx.transaction_details?.real_time_signals;
    let details = `This transaction was flagged as ${tx.risk_category} with a risk score of ${tx.risk_score}. `;
    
    if (signals) {
      if (signals.amount_risk > 0.7) {
        details += `The amount (KES ${tx.transaction_details?.Transaction_Amount?.toLocaleString()}) is significantly higher than the average (KES ${signals.avg_amount_used?.toLocaleString()}). `;
      }
      if (signals.velocity_risk > 0.5) {
        details += `Unusual transaction frequency detected (${tx.transaction_details?.real_time_signals?.velocity_risk * 5} transactions per hour). `;
      }
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

  investigateTransaction(): void {
    if (this.selectedTransaction) {
      this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph']);
    }
  }

  showAIAnalysis(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showModal = true;
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
    if (score >= 8) return '#f72585';
    if (score >= 6) return '#ff9e00';
    if (score >= 4) return '#4cc9f0';
    return '#06d6a0';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
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