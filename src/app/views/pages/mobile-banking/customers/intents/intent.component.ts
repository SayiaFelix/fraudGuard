import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface RiskResult {
  transactionId: string;
  actualAmount: number; 
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  modelAgreement: {
    flagged: number;
    total: number;
  };
  aiAnalysis: {
    details: string;
    signals: string[];
  };
  recommendedAction: string;
  timestamp: Date;
}

@Component({
    selector: 'app-intent',
    templateUrl: './intent.component.html',
    styleUrls: ['./intent.component.scss']
})

export class IntentComponent implements OnInit {
 riskForm: FormGroup;
  analysisResult: RiskResult | null = null;
  isAnalyzing = false;
  showResult = false;
  recentAnalyses: RiskResult[] = [];
  
  channels = ['Mobile', 'Web', 'ATM', 'Agent'];
  locations = ['Nairobi, KE', 'Mombasa, KE', 'Kisumu, KE', 'Nakuru, KE', 'Eldoret, KE', 'Thika, KE', 'International'];
  transactionTypes = ['Transfer', 'Withdrawal', 'Payment', 'Deposit', 'Airtime Purchase'];
  devices = ['Samsung Galaxy', 'iPhone', 'Web Browser', 'ATM Machine', 'Agent Terminal', 'Unknown Device'];
  
  constructor(private fb: FormBuilder, private router: Router) {
    this.riskForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      channel: ['Mobile', Validators.required],
      location: ['Nairobi, KE', Validators.required],
      transactionType: ['Transfer', Validators.required],
      deviceId: ['', Validators.required],
      customerId: ['', Validators.required],
      customerName: ['', Validators.required],
      ipAddress: ['', Validators.pattern('^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$')],
      timeOfDay: ['Now', Validators.required],
      previousTransactions: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadRecentAnalyses();
  }

  analyzeRisk(): void {
    if (this.riskForm.invalid) {
      Object.keys(this.riskForm.controls).forEach(key => {
        this.riskForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isAnalyzing = true;
    this.showResult = false;
    setTimeout(() => {
      const formData = this.riskForm.value;
      this.analysisResult = this.calculateRiskScore(formData);
      this.isAnalyzing = false;
      this.showResult = true;

      this.recentAnalyses.unshift(this.analysisResult);
      if (this.recentAnalyses.length > 5) {
        this.recentAnalyses.pop();
      }
      
      this.saveRecentAnalyses();
    }, 2000);
  }

  
  private calculateRiskScore(data: any): RiskResult {
  const amount = data.amount;
  const channel = data.channel;
  const location = data.location;
  const deviceId = data.deviceId;
  const prevTxns = data.previousTransactions || 0;
  
  let riskScore = 0;
  const signals: string[] = [];
  
  // Amount-based risk
  if (amount > 1000000) {
    riskScore += 3;
    signals.push('Exceptionally high amount (>KES 1M)');
  } else if (amount > 500000) {
    riskScore += 2.5;
    signals.push('Very high amount (>KES 500K)');
  } else if (amount > 100000) {
    riskScore += 1.5;
    signals.push('High amount (>KES 100K)');
  } else if (amount > 50000) {
    riskScore += 0.5;
    signals.push('Moderately high amount');
  }
  
  // Channel-based risk
  if (channel === 'Web') {
    riskScore += 1.5;
    signals.push('High-risk channel (Web)');
  } else if (channel === 'Mobile') {
    riskScore += 1;
    signals.push('Medium-risk channel (Mobile)');
  } else if (channel === 'ATM') {
    riskScore += 0.5;
  } else if (channel === 'Agent') {
    riskScore += 0.5;
    signals.push('Medium-risk channel (Agent)');
  }
  
  // Location-based risk
  if (location.includes('International')) {
    riskScore += 2;
    signals.push('International transaction');
  }
  
  // Device risk
  if (deviceId.includes('Unknown') || deviceId.includes('New')) {
    riskScore += 2;
    signals.push('New/unknown device');
  }
  
  // Previous transactions risk
  if (prevTxns === 0) {
    riskScore += 1.5;
    signals.push('First transaction from this customer');
  } else if (prevTxns > 10) {
    riskScore += 0.5;
    signals.push('High velocity - many transactions today');
  }
  
  // Time-based risk
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 4) {
    riskScore += 1;
    signals.push('Unusual time of day (late night)');
  }
  
  // Normalize to 0-10 scale
  riskScore = Math.min(10, riskScore);

  // Determine risk category
  let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  if (riskScore >= 8) {
    riskCategory = 'Critical';
  } else if (riskScore >= 6) {
    riskCategory = 'High';
  } else if (riskScore >= 4) {
    riskCategory = 'Medium';
  } else {
    riskCategory = 'Low';
  }
  
  // FIXED: Model agreement calculation - ensure at least 1 model flags for Medium/Low risk
  const totalModels = 7;
  let flaggedModels = 0;
  
  if (riskScore >= 8) { // Critical
    flaggedModels = 6 + Math.floor(Math.random() * 2); // 6-7 models
  } else if (riskScore >= 6) { // High
    flaggedModels = 4 + Math.floor(Math.random() * 3); // 4-6 models
  } else if (riskScore >= 4) { // Medium
    flaggedModels = 2 + Math.floor(Math.random() * 3); // 2-4 models (minimum 2)
  } else { // Low
    flaggedModels = 1 + Math.floor(Math.random() * 2); // 1-2 models (minimum 1)
  }
  
  // Ensure we don't exceed total models
  flaggedModels = Math.min(flaggedModels, totalModels);
  
  // Generate analysis details
  const analysisDetails = this.generateAnalysisDetails(riskCategory, riskScore, signals, data);
  
  // Get recommended action
  const recommendedAction = this.getRecommendedAction(riskCategory);
  
  return {
    transactionId: `TXN-${new Date().getTime().toString().slice(-6)}`,
    riskScore: parseFloat(riskScore.toFixed(1)),
    riskCategory,
    actualAmount: amount,
    modelAgreement: {
      flagged: flaggedModels,
      total: totalModels
    },
    aiAnalysis: {
      details: analysisDetails,
      signals: signals
    },
    recommendedAction,
    timestamp: new Date()
  };
}

  private generateAnalysisDetails(riskCategory: string, riskScore: number, signals: string[], data: any): string {
    const signalText = signals.length > 0 ? signals.slice(0, 3).join(', ') : 'normal patterns';
    
    switch(riskCategory) {
      case 'Critical':
        return `The system detected multiple high-risk indicators including ${signalText}. These patterns strongly suggest fraudulent activity with potential immediate financial loss.`;
      case 'High':
        return `The system detected significant risk indicators including ${signalText}. These patterns deviate from normal behavior and require investigation.`;
      case 'Medium':
        return `The system detected some risk indicators including ${signalText}. While not conclusive, these patterns warrant additional verification.`;
      case 'Low':
        return `The system detected minimal risk indicators. The transaction aligns with normal patterns and appears legitimate.`;
      default:
        return 'Standard risk assessment completed.';
    }
  }

  private getRecommendedAction(riskCategory: string): string {
    switch(riskCategory) {
      case 'Critical':
        return 'BLOCK TRANSACTION IMMEDIATELY. Freeze account and initiate fraud investigation protocol. Contact customer via registered phone.';
      case 'High':
        return 'Flag for urgent review. Require additional verification (2FA) and monitor account for suspicious activity.';
      case 'Medium':
        return 'Require step-up authentication. Flag for monitoring and review if additional anomalies detected.';
      case 'Low':
        return 'Approve transaction with routine monitoring. No immediate action required.';
      default:
        return 'Review transaction details.';
    }
  }

  resetForm(): void {
    this.riskForm.reset({
      channel: 'Mobile',
      location: 'Nairobi, KE',
      transactionType: 'Transfer',
      timeOfDay: 'Now',
      previousTransactions: 0
    });
    this.showResult = false;
    this.analysisResult = null;
  }

  loadRecentAnalyses(): void {
    const saved = localStorage.getItem('recentRiskAnalyses');
    if (saved) {
      try {
        this.recentAnalyses = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      } catch (e) {
        console.error('Error loading recent analyses', e);
      }
    }
  }

  private saveRecentAnalyses(): void {
    localStorage.setItem('recentRiskAnalyses', JSON.stringify(this.recentAnalyses));
  }

  viewFullReport(result: RiskResult): void {
    this.analysisResult = result;
    this.showResult = true;
    
    setTimeout(() => {
      document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  investigateTransaction(): void {
    if (this.analysisResult) {
      this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', this.analysisResult.transactionId]);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.riskForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName} is required`;
    }
    if (control?.hasError('min')) {
      return `Amount must be greater than 0`;
    }
    if (control?.hasError('pattern')) {
      return `Invalid IP address format`;
    }
    return '';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.riskForm.get(controlName);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
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

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
}