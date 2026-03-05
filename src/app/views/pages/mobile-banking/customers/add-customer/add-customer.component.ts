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
  rawData?: any; // Store original backend data
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
  private modalInstance: any;
  
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

  private mockTransactions: Transaction[] = [
    {
      id: '1',
      transactionId: 'TXN-2024-001',
      amount: 450000,
      riskScore: 9.2,
      riskCategory: 'Critical',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: new Date(Date.now() - 2 * 60000),
      status: 'Open',
      flaggedBy: 'AI',
      customerName: 'John Mwangi',
      customerId: 'CUST-001',
      deviceId: 'DEV-8F7D2A',
      ipAddress: '197.248.0.45',
      modelAgreement: { flagged: 6, total: 7 },
      aiAnalysis: {
        details: 'The system detected a relatively high transaction amount (4x normal), strong agreement across multiple fraud detection models, a new device (first seen today), and shared IP address with 3 previously flagged accounts. These indicators are consistent with known fraud scenarios observed across similar accounts.',
        signals: ['Amount anomaly', 'New device', 'Shared IP with flagged accounts', 'Velocity check failed']
      },
      recommendedAction: 'Block transaction immediately and notify authorities. Account takeover pattern detected.'
    },
    {
      id: '2',
      transactionId: 'TXN-2024-002',
      amount: 275000,
      riskScore: 8.7,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'Mombasa, KE',
      timestamp: new Date(Date.now() - 5 * 60000),
      status: 'Investigating',
      flaggedBy: 'AI',
      customerName: 'Sarah Joy',
      customerId: 'CUST-002',
      deviceId: 'DEV-3B5E9C',
      ipAddress: '105.27.143.78',
      modelAgreement: { flagged: 5, total: 7 },
      aiAnalysis: {
        details: 'The system detected unusual transaction velocity (3 transactions in 5 minutes from different IP addresses), strong agreement across multiple fraud detection models, along with behavioral patterns that differ significantly from the customer\'s historical activity. These indicators are consistent with known fraud scenarios observed across similar accounts.',
        signals: ['Velocity anomaly', 'Multiple IPs', 'Time pattern unusual']
      },
      recommendedAction: 'Flag for review and escalate to fraud investigation team. Possible automated attack.'
    },
    {
      id: '3',
      transactionId: 'TXN-2024-003',
      amount: 89000,
      riskScore: 7.8,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Kisumu, KE',
      timestamp: new Date(Date.now() - 12 * 60000),
      status: 'Open',
      flaggedBy: 'Rules',
      customerName: 'Peter Petro',
      customerId: 'CUST-003',
      deviceId: 'DEV-2A1C4D',
      ipAddress: '154.122.89.34',
      modelAgreement: { flagged: 4, total: 7 },
      aiAnalysis: {
        details: 'The system detected a relatively high transaction amount (340% above daily average), partial agreement across fraud detection models, along with behavioral patterns that differ from the customer\'s historical activity. These indicators warrant additional verification.',
        signals: ['Amount spike', 'Location mismatch', 'Time unusual']
      },
      recommendedAction: 'Require additional verification (2FA) and monitor for follow-up transactions.'
    },
    {
      id: '4',
      transactionId: 'TXN-2024-004',
      amount: 150000,
      riskScore: 7.2,
      riskCategory: 'High',
      channel: 'ATM',
      location: 'Nakuru, KE',
      timestamp: new Date(Date.now() - 18 * 60000),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Mary Ann',
      customerId: 'CUST-004',
      deviceId: 'DEV-7E2F1B',
      ipAddress: '197.250.34.21',
      modelAgreement: { flagged: 4, total: 7 },
      aiAnalysis: {
        details: 'The system detected unusual location (first transaction from this region in 2 years), partial agreement across fraud detection models, along with behavioral patterns that differ from the customer\'s historical activity. These indicators suggest possible account testing.',
        signals: ['Geographic anomaly', 'First-time location', 'Amount unusual']
      },
      recommendedAction: 'Flag for review and contact customer to verify recent travel.'
    },
    {
      id: '5',
      transactionId: 'TXN-2024-005',
      amount: 32000,
      riskScore: 6.5,
      riskCategory: 'Medium',
      channel: 'Agent',
      location: 'Eldoret, KE',
      timestamp: new Date(Date.now() - 25 * 60000),
      status: 'Investigating',
      flaggedBy: 'Manual',
      customerName: 'Felix Lucas',
      customerId: 'CUST-005',
      deviceId: 'DEV-4C8D3E',
      ipAddress: '105.29.167.92',
      modelAgreement: { flagged: 3, total: 7 },
      aiAnalysis: {
        details: 'The system detected minimal agreement across fraud detection models, but agent trust score is low (this agent has been linked to 2 previous fraud cases). The transaction amount is within normal range, but the channel risk elevates the overall score.',
        signals: ['Low agent trust score', 'Historical fraud link', 'Channel risk']
      },
      recommendedAction: 'Flag agent ID for monitoring and verify with customer via alternate channel.'
    },
    {
      id: '6',
      transactionId: 'TXN-2024-006',
      amount: 1250000,
      riskScore: 9.8,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'International',
      timestamp: new Date(Date.now() - 32 * 60000),
      status: 'Open',
      flaggedBy: 'AI',
      customerName: 'Elizabeth Wanjiku',
      customerId: 'CUST-006',
      deviceId: 'DEV-9A1B2C',
      ipAddress: '45.123.89.156',
      modelAgreement: { flagged: 7, total: 7 },
      aiAnalysis: {
        details: 'CRITICAL: The system detected an extremely high international transfer amount, unanimous agreement across all fraud detection models, new device (first seen today), and IP geolocation mismatch with customer profile. These indicators strongly suggest account takeover with immediate financial loss risk.',
        signals: ['International transfer', 'New device', 'IP geolocation mismatch', 'Amount extreme']
      },
      recommendedAction: 'Block transaction immediately, freeze account, and initiate account takeover protocol.'
    },
    {
      id: '7',
      transactionId: 'TXN-2024-007',
      amount: 45000,
      riskScore: 4.2,
      riskCategory: 'Low',
      channel: 'Mobile',
      location: 'Thika, KE',
      timestamp: new Date(Date.now() - 41 * 60000),
      status: 'Resolved',
      flaggedBy: 'Rules',
      customerName: 'David Omondi',
      customerId: 'CUST-007',
      deviceId: 'DEV-5F6E7D',
      ipAddress: '197.248.12.67',
      modelAgreement: { flagged: 1, total: 7 },
      aiAnalysis: {
        details: 'The system detected minimal agreement across fraud detection models, and the transaction aligns closely with the customer\'s typical behavior and historical transaction patterns. Only minimal risk indicators were observed.',
        signals: ['Normal pattern', 'Trusted device', 'Regular amount']
      },
      recommendedAction: 'Approve transaction with routine monitoring.'
    },
    {
      id: '8',
      transactionId: 'TXN-2024-008',
      amount: 230000,
      riskScore: 8.1,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: new Date(Date.now() - 53 * 60000),
      status: 'Investigating',
      flaggedBy: 'AI',
      customerName: 'Grace Kanene',
      customerId: 'CUST-008',
      deviceId: 'DEV-1D2E3F',
      ipAddress: '154.124.56.89',
      modelAgreement: { flagged: 5, total: 7 },
      aiAnalysis: {
        details: 'The system detected a SIM swap event 3 hours ago followed by this large transfer request, strong agreement across multiple fraud detection models, along with behavioral patterns that differ significantly from the customer\'s historical activity. SIM swap fraud is a known attack vector.',
        signals: ['Recent SIM swap', 'Large transfer post-SIM swap', 'Device change']
      },
      recommendedAction: 'Flag for immediate review. Contact customer via registered email to verify SIM swap.'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.calculateStats();
    
    setInterval(() => {
      this.addRandomTransaction();
    }, 45000); 
  }

  ngAfterViewChecked(): void {
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  private loadTransactions(): void {
    this.transactions = [...this.mockTransactions].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    this.applyFilters();
  }

  private addRandomTransaction(): void {
    const channels: Array<'Mobile' | 'Web' | 'ATM' | 'Agent'> = ['Mobile', 'Web', 'ATM', 'Agent'];
    const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos'];
    const names = ['John', 'Sarah', 'Peter', 'Mary', 'James', 'Elizabeth', 'David', 'Grace'];
    const riskScores = [9.5, 8.9, 7.5, 6.8, 5.2, 4.1, 3.3, 2.1];
    
    const riskScore = riskScores[Math.floor(Math.random() * riskScores.length)];
    let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
    
    if (riskScore >= 8) riskCategory = 'Critical';
    else if (riskScore >= 6) riskCategory = 'High';
    else if (riskScore >= 4) riskCategory = 'Medium';
    else riskCategory = 'Low';

    const modelFlagged = Math.floor(Math.random() * 7) + 1;
    const analysisTexts = {
      'Critical': 'The system detected a relatively high transaction amount, strong agreement across multiple fraud detection models, along with behavioral patterns that differ significantly from the customer\'s historical activity. These indicators are consistent with known fraud scenarios observed across similar accounts.',
      'High': 'The system detected unusual patterns including transaction velocity and location anomalies, strong agreement across fraud detection models. These indicators suggest potential fraud and require investigation.',
      'Medium': 'The system detected minimal agreement across fraud detection models, but some behavioral patterns deviate from historical activity. Additional verification is recommended.',
      'Low': 'The system detected minimal agreement across fraud detection models, and the transaction aligns closely with the customer\'s typical behavior and historical transaction patterns.'
    };

    const newTransaction: Transaction = {
      id: `new-${Date.now()}`,
      transactionId: `TXN-${Math.floor(Math.random() * 1000)}`,
      amount: Math.floor(Math.random() * 500000) + 1000,
      riskScore: riskScore,
      riskCategory: riskCategory,
      channel: channels[Math.floor(Math.random() * channels.length)],
      location: locations[Math.floor(Math.random() * locations.length)] + ', KE',
      timestamp: new Date(),
      status: 'Open',
      flaggedBy: 'AI',
      customerName: names[Math.floor(Math.random() * names.length)] + ' ' + 
                     ['Mwangi', 'Omondi', 'Ochieng', 'Akinyi', 'Kipchoge', 'Wanjiku'][Math.floor(Math.random() * 6)],
      customerId: `CUST-${Math.floor(Math.random() * 1000)}`,
      deviceId: `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      modelAgreement: { flagged: modelFlagged, total: 7 },
      aiAnalysis: {
        details: analysisTexts[riskCategory],
        signals: ['Real-time AI analysis', 'Pattern detected']
      },
      recommendedAction: riskCategory === 'Critical' ? 'Block transaction immediately and notify authorities.' :
                         riskCategory === 'High' ? 'Flag for review and escalate to fraud investigation team.' :
                         riskCategory === 'Medium' ? 'Require additional verification (2FA).' :
                         'Approve transaction with monitoring.'
    };

    this.transactions.unshift(newTransaction);
    if (this.transactions.length > 50) {
      this.transactions = this.transactions.slice(0, 50);
    }
    this.applyFilters();
    this.calculateStats();
  }

  private calculateStats(): void {
    const filtered = this.filteredTransactions.length ? this.filteredTransactions : this.transactions;
    this.stats = {
      total: filtered.length,
      critical: filtered.filter(t => t.riskCategory === 'Critical').length,
      high: filtered.filter(t => t.riskCategory === 'High').length,
      medium: filtered.filter(t => t.riskCategory === 'Medium').length,
      low: filtered.filter(t => t.riskCategory === 'Low').length,
      avgRiskScore: Math.round((filtered.reduce((sum, t) => sum + t.riskScore, 0) / filtered.length) * 10) / 10
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
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    // if (this.selectedTransaction) {
    //   this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', this.selectedTransaction.id]);
    // }
      if (this.selectedTransaction) {
      this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph']);
    }
  }

  getRiskBadgeClass(riskCategory: string): string {
    const classes = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory as keyof typeof classes] || 'bg-secondary';
  }

  getRiskProgressColor(score: number): string {
    if (score >= 8) return '#f72585';
    if (score >= 6) return '#ff9e00';
    if (score >= 4) return '#4cc9f0';
    return '#06d6a0';
  }

  showModal: boolean = false;

showAIAnalysis(transaction: Transaction): void {
  this.selectedTransaction = transaction;
  this.showModal = true;
}

closeModal(): void {
  this.showModal = false;
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
    const icons = {
      'Mobile': 'fa-mobile-alt',
      'Web': 'fa-globe',
      'ATM': 'fa-credit-card',
      'Agent': 'fa-user-tie'
    };
    return icons[channel as keyof typeof icons] || 'fa-exchange-alt';
  }
}