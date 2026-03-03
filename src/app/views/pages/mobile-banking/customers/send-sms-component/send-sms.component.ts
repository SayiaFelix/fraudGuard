import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

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
  flaggedBy: 'AI' | 'Rules' | 'Manual';
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
  
  // For action buttons
  showActionModal: boolean = false;
  actionType: 'block' | 'approve' | 'flag' | 'escalate' | null = null;
  actionNotes: string = '';
  actionLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.alertId = params.get('id');
      this.loadAlertData();
    });
  }

  private loadAlertData(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.alertData = this.generateMockAlertData();
      this.isLoading = false;
    }, 800);
  }

  private generateMockAlertData(): AlertDetail {
  // Create dates
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(now.getHours() - 1);
  
  const twoHoursAgo = new Date(now);
  twoHoursAgo.setHours(now.getHours() - 2);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  
  // Use the alertId to determine which transaction to show
  const alertId = this.alertId || 'case-001';
  
  // Mock data for different transaction IDs
  const mockDataMap: { [key: string]: AlertDetail } = {
    'case-001': {
      id: 'case-001',
      transactionId: 'TXN-2026-001',
      amount: 450000,
      riskScore: 9.2,
      riskCategory: 'Critical',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: now,
      status: 'Investigating',
      flaggedBy: 'AI',
      
      customer: {
        name: 'John Mwangi',
        id: 'CUST-001',
        email: 'john.mwangi@example.com',
        phone: '+254 712 345 678',
        accountAge: 365,
        averageTransaction: 25000,
        riskProfile: 'High'
      },
      
      device: {
        id: 'DEV-8F7D2A',
        type: 'Samsung Galaxy A52',
        fingerprint: '8f7d2a3b5c9e1f4a',
        firstSeen: lastWeek,
        lastSeen: now,
        trusted: false,
        location: 'Nairobi, KE'
      },
      
      ipAddress: {
        address: '197.248.0.45',
        geolocation: 'Nairobi, KE',
        isp: 'Safaricom',
        proxy: false,
        blacklisted: false
      },
      
      aiAnalysis: {
        explanation: 'This transaction was flagged as Critical Potential Fraud with a risk score of 9.2. The system detected multiple high-risk signals: transaction amount 4x normal pattern, new device (first seen today), and location mismatch with customer profile. These indicators are consistent with known fraud scenarios observed across similar accounts.',
        signals: [
          {
            name: 'Amount Anomaly',
            severity: 'high',
            description: 'Transaction amount (KES 450,000) is 4x higher than customer average (KES 25,000)'
          },
          {
            name: 'New Device',
            severity: 'high',
            description: 'Device first seen today - no history with this customer'
          },
          {
            name: 'Location Mismatch',
            severity: 'medium',
            description: 'Transaction location (Nairobi) differs from customer registered location (Mombasa)'
          },
          {
            name: 'Velocity Check',
            severity: 'medium',
            description: 'Multiple transactions in short time window'
          }
        ],
        modelAgreement: {
          flagged: 6,
          total: 7,
          models: [
            { name: 'Random Forest', prediction: 'fraud', confidence: 94 },
            { name: 'XGBoost', prediction: 'fraud', confidence: 92 },
            { name: 'LightGBM', prediction: 'fraud', confidence: 89 },
            { name: 'CatBoost', prediction: 'fraud', confidence: 91 },
            { name: 'Neural Network', prediction: 'fraud', confidence: 87 },
            { name: 'Gradient Boosting', prediction: 'fraud', confidence: 85 },
            { name: 'Logistic Regression', prediction: 'legitimate', confidence: 62 }
          ]
        },
        recommendedAction: 'Block transaction immediately and initiate account takeover investigation. Contact customer via registered phone number to verify recent activity.',
        confidence: 94
      },
      
      relatedTransactions: [
        {
          id: 'TXN-2026-002',
          amount: 275000,
          timestamp: oneHourAgo,
          riskScore: 8.7,
          status: 'Investigating'
        },
        {
          id: 'TXN-2026-003',
          amount: 89000,
          timestamp: twoHoursAgo,
          riskScore: 7.8,
          status: 'Open'
        },
        {
          id: 'TXN-2026-004',
          amount: 150000,
          timestamp: yesterday,
          riskScore: 7.2,
          status: 'Resolved'
        }
      ],
      
      timeline: [
        {
          action: 'Transaction Flagged',
          timestamp: now,
          user: 'AI Model (Ensemble)',
          details: 'Transaction flagged as Critical Risk by AI ensemble (6/7 models)'
        },
        {
          action: 'Alert Created',
          timestamp: now,
          user: 'System',
          details: 'Alert assigned to fraud investigation queue'
        },
        {
          action: 'Customer History Checked',
          timestamp: now,
          user: 'System',
          details: 'Customer has no previous fraud history. Account age: 365 days'
        },
        {
          action: 'Device Analysis',
          timestamp: now,
          user: 'System',
          details: 'Device ID DEV-8F7D2A first seen today. No trusted status.'
        },
        {
          action: 'Assigned to Investigator',
          timestamp: now,
          user: 'System',
          details: 'Case assigned to Jane Otieno for investigation'
        }
      ]
    },
    
    'case-002': {
      id: 'case-002',
      transactionId: 'TXN-2026-002',
      amount: 275000,
      riskScore: 8.7,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'Mombasa, KE',
      timestamp: oneHourAgo,
      status: 'Investigating',
      flaggedBy: 'AI',
      
      customer: {
        name: 'Sarah Omondi',
        id: 'CUST-002',
        email: 'sarah.omondi@example.com',
        phone: '+254 723 456 789',
        accountAge: 180,
        averageTransaction: 15000,
        riskProfile: 'High'
      },
      
      device: {
        id: 'DEV-3B5E9C',
        type: 'iPhone 13',
        fingerprint: '3b5e9c7f2a1d8e4f',
        firstSeen: lastWeek,
        lastSeen: now,
        trusted: true,
        location: 'Mombasa, KE'
      },
      
      ipAddress: {
        address: '105.27.143.78',
        geolocation: 'Mombasa, KE',
        isp: 'Safaricom',
        proxy: false,
        blacklisted: false
      },
      
      aiAnalysis: {
        explanation: 'This transaction was flagged as Critical Potential Fraud with a risk score of 8.7. The system detected unusual transaction velocity: 3 transactions in 5 minutes from different IP addresses. These indicators are consistent with automated attack patterns.',
        signals: [
          {
            name: 'Velocity Anomaly',
            severity: 'high',
            description: '3 transactions in 5 minutes from different IPs'
          },
          {
            name: 'Multiple IPs',
            severity: 'high',
            description: 'Transactions originating from different IP addresses'
          },
          {
            name: 'Time Pattern',
            severity: 'medium',
            description: 'Unusual time of day for this customer'
          }
        ],
        modelAgreement: {
          flagged: 5,
          total: 7,
          models: [
            { name: 'Random Forest', prediction: 'fraud', confidence: 89 },
            { name: 'XGBoost', prediction: 'fraud', confidence: 92 },
            { name: 'LightGBM', prediction: 'fraud', confidence: 87 },
            { name: 'CatBoost', prediction: 'fraud', confidence: 85 },
            { name: 'Neural Network', prediction: 'fraud', confidence: 83 },
            { name: 'Gradient Boosting', prediction: 'legitimate', confidence: 72 },
            { name: 'Logistic Regression', prediction: 'legitimate', confidence: 68 }
          ]
        },
        recommendedAction: 'Flag for review and escalate to fraud investigation team. Possible automated attack.',
        confidence: 89
      },
      
      relatedTransactions: [
        {
          id: 'TXN-2026-001',
          amount: 450000,
          timestamp: twoHoursAgo,
          riskScore: 9.2,
          status: 'Investigating'
        },
        {
          id: 'TXN-2026-005',
          amount: 32000,
          timestamp: yesterday,
          riskScore: 6.5,
          status: 'Resolved'
        }
      ],
      
      timeline: [
        {
          action: 'Transaction Flagged',
          timestamp: oneHourAgo,
          user: 'AI Model (Ensemble)',
          details: 'Transaction flagged as Critical Risk due to velocity anomaly'
        },
        {
          action: 'Alert Created',
          timestamp: oneHourAgo,
          user: 'System',
          details: 'Alert assigned to fraud investigation queue'
        },
        {
          action: 'IP Analysis',
          timestamp: oneHourAgo,
          user: 'System',
          details: 'Multiple IP addresses detected: 105.27.143.78, 105.27.143.79, 105.27.143.80'
        }
      ]
    },
    
    'case-003': {
      id: 'case-003',
      transactionId: 'TXN-2026-003',
      amount: 89000,
      riskScore: 7.8,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Kisumu, KE',
      timestamp: twoHoursAgo,
      status: 'Open',
      flaggedBy: 'Rules',
      
      customer: {
        name: 'Peter Ochieng',
        id: 'CUST-003',
        email: 'peter.ochieng@example.com',
        phone: '+254 734 567 890',
        accountAge: 90,
        averageTransaction: 8000,
        riskProfile: 'Medium'
      },
      
      device: {
        id: 'DEV-2A1C4D',
        type: 'Tecno Spark',
        fingerprint: '2a1c4d8f7e3b6a9c',
        firstSeen: twoDaysAgo,
        lastSeen: now,
        trusted: false,
        location: 'Kisumu, KE'
      },
      
      ipAddress: {
        address: '154.122.89.34',
        geolocation: 'Kisumu, KE',
        isp: 'Airtel',
        proxy: false,
        blacklisted: false
      },
      
      aiAnalysis: {
        explanation: 'This transaction was flagged as High Potential Fraud with a risk score of 7.8. The system detected a transaction amount exceeding daily average by 340%, along with behavioral patterns that differ from the customer\'s historical activity.',
        signals: [
          {
            name: 'Amount Spike',
            severity: 'high',
            description: 'Transaction amount exceeds daily average by 340%'
          },
          {
            name: 'New Device',
            severity: 'medium',
            description: 'Device first seen 2 days ago'
          },
          {
            name: 'Location Match',
            severity: 'low',
            description: 'Location matches customer profile'
          }
        ],
        modelAgreement: {
          flagged: 4,
          total: 7,
          models: [
            { name: 'Random Forest', prediction: 'fraud', confidence: 82 },
            { name: 'XGBoost', prediction: 'fraud', confidence: 79 },
            { name: 'LightGBM', prediction: 'fraud', confidence: 76 },
            { name: 'CatBoost', prediction: 'legitimate', confidence: 71 },
            { name: 'Neural Network', prediction: 'legitimate', confidence: 68 },
            { name: 'Gradient Boosting', prediction: 'legitimate', confidence: 65 },
            { name: 'Logistic Regression', prediction: 'legitimate', confidence: 62 }
          ]
        },
        recommendedAction: 'Require additional verification (2FA) and monitor for follow-up transactions.',
        confidence: 82
      },
      
      relatedTransactions: [
        {
          id: 'TXN-2026-004',
          amount: 150000,
          timestamp: yesterday,
          riskScore: 7.2,
          status: 'Resolved'
        }
      ],
      
      timeline: [
        {
          action: 'Transaction Flagged',
          timestamp: twoHoursAgo,
          user: 'Rules Engine',
          details: 'Transaction flagged due to amount exceeding threshold'
        },
        {
          action: 'Alert Created',
          timestamp: twoHoursAgo,
          user: 'System',
          details: 'Alert created and pending review'
        }
      ]
    }
  };

  return mockDataMap[alertId] || mockDataMap['case-001'];
}

  // private generateMockAlertData(): AlertDetail {
  //   // Create dates
  //   const now = new Date();
  //   const oneHourAgo = new Date(now);
  //   oneHourAgo.setHours(now.getHours() - 1);
    
  //   const twoHoursAgo = new Date(now);
  //   twoHoursAgo.setHours(now.getHours() - 2);
    
  //   const yesterday = new Date(now);
  //   yesterday.setDate(now.getDate() - 1);
    
  //   const lastWeek = new Date(now);
  //   lastWeek.setDate(now.getDate() - 7);

  //   return {
  //     id: this.alertId || 'case-001',
  //     transactionId: 'TXN-2026-001',
  //     amount: 450000,
  //     riskScore: 9.2,
  //     riskCategory: 'Critical',
  //     channel: 'Mobile',
  //     location: 'Nairobi, KE',
  //     timestamp: now,
  //     status: 'Investigating',
  //     flaggedBy: 'AI',
      
  //     customer: {
  //       name: 'John Mwangi',
  //       id: 'CUST-001',
  //       email: 'john.mwangi@example.com',
  //       phone: '+254 712 345 678',
  //       accountAge: 365,
  //       averageTransaction: 25000,
  //       riskProfile: 'High'
  //     },
      
  //     device: {
  //       id: 'DEV-8F7D2A',
  //       type: 'Samsung Galaxy A52',
  //       fingerprint: '8f7d2a3b5c9e1f4a',
  //       firstSeen: lastWeek,
  //       lastSeen: now,
  //       trusted: false,
  //       location: 'Nairobi, KE'
  //     },
      
  //     ipAddress: {
  //       address: '197.248.0.45',
  //       geolocation: 'Nairobi, KE',
  //       isp: 'Safaricom',
  //       proxy: false,
  //       blacklisted: false
  //     },
      
  //     aiAnalysis: {
  //       explanation: 'This transaction was flagged as Critical Potential Fraud with a risk score of 9.2. The system detected multiple high-risk signals: transaction amount 4x normal pattern, new device (first seen today), and location mismatch with customer profile. These indicators are consistent with known fraud scenarios observed across similar accounts.',
  //       signals: [
  //         {
  //           name: 'Amount Anomaly',
  //           severity: 'high',
  //           description: 'Transaction amount (KES 450,000) is 4x higher than customer average (KES 25,000)'
  //         },
  //         {
  //           name: 'New Device',
  //           severity: 'high',
  //           description: 'Device first seen today - no history with this customer'
  //         },
  //         {
  //           name: 'Location Mismatch',
  //           severity: 'medium',
  //           description: 'Transaction location (Nairobi) differs from customer registered location (Mombasa)'
  //         },
  //         {
  //           name: 'Velocity Check',
  //           severity: 'medium',
  //           description: 'Multiple transactions in short time window'
  //         }
  //       ],
  //       modelAgreement: {
  //         flagged: 6,
  //         total: 7,
  //         models: [
  //           { name: 'Random Forest', prediction: 'fraud', confidence: 94 },
  //           { name: 'XGBoost', prediction: 'fraud', confidence: 92 },
  //           { name: 'LightGBM', prediction: 'fraud', confidence: 89 },
  //           { name: 'CatBoost', prediction: 'fraud', confidence: 91 },
  //           { name: 'Neural Network', prediction: 'fraud', confidence: 87 },
  //           { name: 'Gradient Boosting', prediction: 'fraud', confidence: 85 },
  //           { name: 'Logistic Regression', prediction: 'legitimate', confidence: 62 }
  //         ]
  //       },
  //       recommendedAction: 'Block transaction immediately and initiate account takeover investigation. Contact customer via registered phone number to verify recent activity.',
  //       confidence: 94
  //     },
      
  //     relatedTransactions: [
  //       {
  //         id: 'TXN-2026-002',
  //         amount: 275000,
  //         timestamp: oneHourAgo,
  //         riskScore: 8.7,
  //         status: 'Investigating'
  //       },
  //       {
  //         id: 'TXN-2026-003',
  //         amount: 89000,
  //         timestamp: twoHoursAgo,
  //         riskScore: 7.8,
  //         status: 'Open'
  //       },
  //       {
  //         id: 'TXN-2026-004',
  //         amount: 150000,
  //         timestamp: yesterday,
  //         riskScore: 7.2,
  //         status: 'Resolved'
  //       }
  //     ],
      
  //     timeline: [
  //       {
  //         action: 'Transaction Flagged',
  //         timestamp: now,
  //         user: 'AI Model (Ensemble)',
  //         details: 'Transaction flagged as Critical Risk by AI ensemble (6/7 models)'
  //       },
  //       {
  //         action: 'Alert Created',
  //         timestamp: now,
  //         user: 'System',
  //         details: 'Alert assigned to fraud investigation queue'
  //       },
  //       {
  //         action: 'Customer History Checked',
  //         timestamp: now,
  //         user: 'System',
  //         details: 'Customer has no previous fraud history. Account age: 365 days'
  //       },
  //       {
  //         action: 'Device Analysis',
  //         timestamp: now,
  //         user: 'System',
  //         details: 'Device ID DEV-8F7D2A first seen today. No trusted status.'
  //       },
  //       {
  //         action: 'Assigned to Investigator',
  //         timestamp: now,
  //         user: 'System',
  //         details: 'Case assigned to Jane Otieno for investigation'
  //       }
  //     ]
  //   };
  // }

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


  getRiskBadgeClass(riskCategory: string): string {
    const classes = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory as keyof typeof classes] || 'bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Resolved': 'bg-success',
      'False Positive': 'bg-secondary'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  getSignalSeverityClass(severity: string): string {
    const classes = {
      'high': 'bg-danger',
      'medium': 'bg-warning text-dark',
      'low': 'bg-info'
    };
    return classes[severity as keyof typeof classes] || 'bg-secondary';
  }

  getPredictionClass(prediction: string): string {
    const classes = {
      'fraud': 'text-danger',
      'legitimate': 'text-success',
      'uncertain': 'text-warning'
    };
    return classes[prediction as keyof typeof classes] || 'text-secondary';
  }

  getChannelIcon(channel: string): string {
    const icons = {
      'Mobile': 'fas fa-mobile-alt',
      'Web': 'fas fa-globe',
      'ATM': 'fas fa-credit-card',
      'Agent': 'fas fa-user-tie'
    };
    return icons[channel as keyof typeof icons] || 'fas fa-exchange-alt';
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