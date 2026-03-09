import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpService } from 'src/app/shared/services/http.service';

interface AlertDetail {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  channel: 'Mobile' | 'Web' | 'ATM' | 'Agent';
  location: string;
  timestamp: Date;
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive';
  flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
  customer: {
    name: string;
    id: string;
    email: string;
    phone: string;
    accountAge: number;
    averageTransaction: number;
    riskProfile: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  device: {
    id: string;
    type: string;
    fingerprint: string;
    firstSeen: Date;
    lastSeen: Date;
    trusted: boolean;
    location?: string;
  };
  ipAddress: {
    address: string;
    geolocation: string;
    isp: string;
    proxy: boolean;
    blacklisted: boolean;
  };
  aiAnalysis: {
    explanation: string;
    signals: Array<{
      name: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
    }>;
    modelAgreement: {
      flagged: number;
      total: number;
      models: Array<{
        name: string;
        prediction: 'fraud' | 'legitimate' | 'uncertain';
        confidence: number;
      }>;
    };
    recommendedAction: string;
    confidence: number;
  };
  relatedTransactions?: Array<{
    id: string;
    amount: number;
    timestamp: Date;
    riskScore: number;
    status: string;
  }>;
  timeline?: Array<{
    action: string;
    timestamp: Date;
    user: string;
    details: string;
  }>;
  rawData?: any;
}

@Component({
  selector: 'app-list-observations',
  templateUrl: './send-sms.component.html',
  styleUrls: ['./send-sms.component.scss'],
})
export class SendSmsComponent implements OnInit {
  alertId: string | null = null;
  alertData: AlertDetail | null = null;
  isLoading: boolean = true;
  activeTab: 'overview' | 'aiAnalysis' | 'timeline' | 'related' = 'overview';
  errorMessage: string = '';
  
  // For action buttons
  showActionModal: boolean = false;
  actionType: 'block' | 'approve' | 'flag' | 'escalate' | null = null;
  actionNotes: string = '';
  actionLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.alertId = params.get('id');
      if (this.alertId) {
        this.loadAlertData();
      } else {
        this.errorMessage = 'No alert ID provided';
        this.isLoading = false;
      }
    });
  }

  loadAlertData(): void {
    this.isLoading = true;
    
    this.httpService.getTransactionById(this.alertId!).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.transaction_details) {
          this.alertData = this.mapBackendResponse(response);
          this.isLoading = false;
        } else {
          this.errorMessage = response.message || 'Alert not found';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading alert details:', error);
        this.errorMessage = error.error?.message || 'Failed to load alert details';
        this.isLoading = false;
      }
    });
  }

  mapBackendResponse(response: any): AlertDetail {
    const tx = response;
    const transactionDetails = tx.transaction_details || {};
    const explanations = tx.explanations || {};
    
    // Determine risk category
    let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    if (tx.risk_category.includes('Critical')) riskCategory = 'Critical';
    else if (tx.risk_category.includes('High')) riskCategory = 'High';
    else if (tx.risk_category.includes('Medium')) riskCategory = 'Medium';
    else if (tx.risk_category.includes('Low')) riskCategory = 'Low';

    // Parse model agreement
    const modelAgreement = transactionDetails.Model_Agreement || '0/7 models flagged';
    const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
    const total = 7;

    // Determine flagged by
    let flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)' = 'AI';
    if (transactionDetails.Rule_Engine?.triggered && flagged > 0) {
      flaggedBy = 'AI + Rules (Hybrid)';
    } else if (transactionDetails.Rule_Engine?.triggered) {
      flaggedBy = 'Rules';
    } else if (flagged > 0) {
      flaggedBy = 'AI';
    }

    // Extract signals
    const signals: Array<{name: string; severity: 'high' | 'medium' | 'low'; description: string}> = [];
    
    // Add rule-based signals
    if (transactionDetails.Rule_Engine?.triggered) {
      transactionDetails.Rule_Engine.rules.forEach((rule: string) => {
        signals.push({
          name: rule,
          severity: this.determineSignalSeverity(rule, transactionDetails.Rule_Engine.severity),
          description: `Rule engine detected: ${rule}`
        });
      });
    }
    
    // Add real-time signals
    if (transactionDetails.real_time_signals) {
      const signals_data = transactionDetails.real_time_signals;
      if (signals_data.amount_risk > 0.7) {
        signals.push({
          name: 'High Amount Anomaly',
          severity: 'high',
          description: `Amount is ${(signals_data.amount_risk * 100).toFixed(0)}% above average (KES ${signals_data.avg_amount_used?.toLocaleString()})`
        });
      } else if (signals_data.amount_risk > 0.4) {
        signals.push({
          name: 'Medium Amount Anomaly',
          severity: 'medium',
          description: `Amount is ${(signals_data.amount_risk * 100).toFixed(0)}% above average (KES ${signals_data.avg_amount_used?.toLocaleString()})`
        });
      }
      
      if (signals_data.velocity_risk > 0.7) {
        signals.push({
          name: 'High Velocity Risk',
          severity: 'high',
          description: `${(signals_data.velocity_risk * 5).toFixed(0)} transactions per hour detected`
        });
      } else if (signals_data.velocity_risk > 0.4) {
        signals.push({
          name: 'Medium Velocity Risk',
          severity: 'medium',
          description: `${(signals_data.velocity_risk * 5).toFixed(0)} transactions per hour detected`
        });
      }
    }

    // Generate AI explanation
    const aiExplanation = explanations.final || explanations.llm || explanations.rule_based || 
      `This transaction was flagged as ${tx.risk_category} with a risk score of ${tx.risk_score}.`;

    // Determine channel
    let channel: 'Mobile' | 'Web' | 'ATM' | 'Agent' = 'Web';
    // You can add logic to determine channel from transaction data

    // Determine location
    let location = transactionDetails.Transaction_Location === 'International' ? 'International' : 'Nairobi, KE';

    return {
      id: tx.transaction_id,
      transactionId: tx.transaction_id,
      amount: transactionDetails.Transaction_Amount || 0,
      riskScore: tx.risk_score,
      riskCategory: riskCategory,
      channel: channel,
      location: location,
      timestamp: new Date(tx.timestamp),
      status: this.determineStatus(riskCategory),
      flaggedBy: flaggedBy,
      
      customer: {
        name: `Customer ${tx.transaction_id.substring(0, 8)}`,
        id: `CUST-${tx.transaction_id.substring(0, 8)}`,
        email: 'customer@example.com',
        phone: '+254 XXX XXX XXX',
        accountAge: 365,
        averageTransaction: 50000,
        riskProfile: riskCategory
      },
      
      device: {
        id: 'Unknown',
        type: this.determineDeviceType(tx),
        fingerprint: 'unknown',
        firstSeen: new Date(tx.timestamp),
        lastSeen: new Date(tx.timestamp),
        trusted: !transactionDetails.Rule_Engine?.rules.includes('Unknown device'),
        location: location
      },
      
      ipAddress: {
        address: '197.248.0.45',
        geolocation: location,
        isp: 'Safaricom',
        proxy: false,
        blacklisted: riskCategory === 'Critical'
      },
      
      aiAnalysis: {
        explanation: aiExplanation,
        signals: signals,
        modelAgreement: {
          flagged: flagged,
          total: total,
          models: this.generateModelList(flagged, total, riskCategory)
        },
        recommendedAction: tx.recommended_action,
        confidence: Math.round(tx.risk_score * 10) // Convert 0-10 to 0-100 scale
      },
      
      relatedTransactions: [], // You can fetch related transactions if needed
      timeline: this.generateTimeline(tx),
      rawData: tx
    };
  }

  determineSignalSeverity(rule: string, severity: number): 'high' | 'medium' | 'low' {
    if (severity >= 6) return 'high';
    if (severity >= 3) return 'medium';
    return 'low';
  }

  determineStatus(riskCategory: string): 'Open' | 'Investigating' | 'Resolved' | 'False Positive' {
    if (riskCategory === 'Critical') return 'Open';
    if (riskCategory === 'High') return 'Investigating';
    if (riskCategory === 'Medium') return 'Resolved';
    return 'False Positive';
  }

  determineDeviceType(tx: any): string {
    // Check transaction features for device type
    if (tx.transaction_details) {
      if (tx.transaction_details.Device_Type_iPhone) return 'iPhone';
      if (tx.transaction_details.Device_Type_Android) return 'Android';
      if (tx.transaction_details.Device_Type_MacBook) return 'MacBook';
      if (tx.transaction_details.Device_Type_Windows_PC) return 'Windows PC';
      if (tx.transaction_details.Device_Type_Unknown_Device) return 'Unknown Device';
    }
    return 'Unknown';
  }

  generateModelList(flagged: number, total: number, riskCategory: string): any[] {
    const models = [
      { name: 'Random Forest', baseConfidence: 94 },
      { name: 'XGBoost', baseConfidence: 92 },
      { name: 'LightGBM', baseConfidence: 89 },
      { name: 'CatBoost', baseConfidence: 91 },
      { name: 'Neural Network', baseConfidence: 87 },
      { name: 'Gradient Boosting', baseConfidence: 85 },
      { name: 'Logistic Regression', baseConfidence: 62 }
    ];

    return models.map((model, index) => ({
      name: model.name,
      prediction: index < flagged ? 'fraud' : 'legitimate',
      confidence: model.baseConfidence
    }));
  }

  generateTimeline(tx: any): any[] {
    const timestamp = new Date(tx.timestamp);
    const timeline = [
      {
        action: 'Transaction Flagged',
        timestamp: timestamp,
        user: 'AI System',
        details: `Transaction flagged as ${tx.risk_category} with risk score ${tx.risk_score}`
      },
      {
        action: 'Alert Created',
        timestamp: timestamp,
        user: 'System',
        details: 'Alert added to fraud investigation queue'
      }
    ];

    // Add rule engine trigger if applicable
    if (tx.transaction_details?.Rule_Engine?.triggered) {
      timeline.push({
        action: 'Rule Engine Triggered',
        timestamp: timestamp,
        user: 'Rules Engine',
        details: `Rules triggered: ${tx.transaction_details.Rule_Engine.rules.join(', ')}`
      });
    }

    // Add feedback if available
    if (tx.feedback_effect) {
      timeline.push({
        action: 'Feedback Applied',
        timestamp: new Date(),
        user: 'System',
        details: `Feedback effect: Score adjusted from ${tx.feedback_effect.original_score} to ${tx.feedback_effect.adjusted_score}`
      });
    }

    return timeline;
  }

  // Tab navigation
  setActiveTab(tab: 'overview' | 'aiAnalysis' | 'timeline' | 'related'): void {
    this.activeTab = tab;
  }

  // Action methods
  openActionModal(action: 'block' | 'approve' | 'flag' | 'escalate'): void {
    this.actionType = action;
    this.actionNotes = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.actionType = null;
    this.actionNotes = '';
  }

  submitAction(): void {
    if (!this.actionType) return;
    
    this.actionLoading = true;
  
    setTimeout(() => {
      console.log(`Action ${this.actionType} taken with notes:`, this.actionNotes);
      
      if (this.alertData) {
        switch(this.actionType) {
          case 'block':
            this.alertData.status = 'Resolved';
            break;
          case 'approve':
            this.alertData.status = 'False Positive';
            break;
          case 'flag':
            this.alertData.status = 'Investigating';
            break;
          case 'escalate':
            this.alertData.status = 'Investigating';
            break;
        }
      }
      
      this.actionLoading = false;
      this.closeActionModal();
    
      alert(`Action completed successfully !!!`);
    }, 1500);
  }

  goToInvestigation(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', this.alertId]);
  }

  goBack(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/history']);
  }

  // Helper methods
  getRiskBadgeClass(riskCategory: string): string {
    const classes: any = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory] || 'bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Resolved': 'bg-success',
      'False Positive': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  getSignalSeverityClass(severity: string): string {
    const classes: any = {
      'high': 'bg-danger',
      'medium': 'bg-warning text-dark',
      'low': 'bg-info'
    };
    return classes[severity] || 'bg-secondary';
  }

  getPredictionClass(prediction: string): string {
    const classes: any = {
      'fraud': 'text-danger',
      'legitimate': 'text-success',
      'uncertain': 'text-warning'
    };
    return classes[prediction] || 'text-secondary';
  }

  getChannelIcon(channel: string): string {
    const icons: any = {
      'Mobile': 'fas fa-mobile-alt',
      'Web': 'fas fa-globe',
      'ATM': 'fas fa-credit-card',
      'Agent': 'fas fa-user-tie'
    };
    return icons[channel] || 'fas fa-exchange-alt';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'MMM d, y, HH:mm') || '';
  }

  formatDateTime(date: Date): string {
    return this.datePipe.transform(date, 'MMM d, y, HH:mm:ss') || '';
  }

  formatDuration(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
}