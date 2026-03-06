import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';

interface RiskAssessmentResponse {
  status: string;
  message: string;
  result: RiskAssessmentResult;
}
interface RiskAssessmentResult {
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_category: string;
  transaction_details: {
    Transaction_Amount: number;
    Risk_Score: number;
    Model_Agreement: string;
    ML_Votes?: string;
    Rule_Engine?: {
      triggered: boolean;
      rules: string[];
      severity: number;
    };
    Rule_Flags?: string[];
    Rule_Triggered?: boolean;
    Hybrid_Score?: boolean;
    real_time_signals?: {
      amount_risk: number;
      avg_amount_used: number;
      velocity_risk: number;
    };
  };
  explanations?: {
    rule_based?: string;
    llm?: string;
    final?: string;
  };
  recommended_action: string;
  feedback_effect?: any;
  llm_status?: string;
}
interface RiskResult {
  transactionId: string;
  actualAmount: number; 
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  modelAgreement: {
    flagged: number;
    total: number;
    text: string;
  };
  mlVotes?: string;
  ruleEngine?: {
    triggered: boolean;
    rules: string[];
    severity: number;
  };
  aiAnalysis: {
    details: string;
    signals: string[];
    ruleBased?: string;
    llm?: string;
    final?: string;
  };
  recommendedAction: string;
  timestamp: Date;
  transactionDetails?: any;
  feedbackEffect?: any;
  rawData?: any;
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
  transactionTypes = ['Online', 'POS', 'Transfer', 'Withdrawal', 'Payment'];
  devices = ['iPhone', 'Android', 'MacBook', 'Windows_PC', 'Unknown_Device'];
  timeSlots = ['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-11pm)', 'Late Night (11pm-6am)'];
  
  deviceTypeMap: { [key: string]: string } = {
    'iPhone': 'Device_Type_iPhone',
    'Android': 'Device_Type_Android',
    'MacBook': 'Device_Type_MacBook',
    'Windows_PC': 'Device_Type_Windows_PC',
    'Unknown_Device': 'Device_Type_Unknown_Device'
  };
  
  locationMap: { [key: string]: { local: number; international: number } } = {
    'Nairobi, KE': { local: 1, international: 0 },
    'Mombasa, KE': { local: 1, international: 0 },
    'Kisumu, KE': { local: 1, international: 0 },
    'Nakuru, KE': { local: 1, international: 0 },
    'Eldoret, KE': { local: 1, international: 0 },
    'Thika, KE': { local: 1, international: 0 },
    'International': { local: 0, international: 1 }
  };
  
  transactionTypeMap: { [key: string]: { online: number; pos: number } } = {
    'Online': { online: 1, pos: 0 },
    'POS': { online: 0, pos: 1 },
    'Transfer': { online: 1, pos: 0 },
    'Withdrawal': { online: 0, pos: 1 },
    'Payment': { online: 1, pos: 0 }
  };
  
  amountCategoryMap = {
    low: [0, 10000],
    medium: [10000, 25000],
    high: [25000, 50000],
    veryHigh: [50000, Infinity]
  };
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private httpService: HttpService
  ) {
    this.riskForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      channel: ['Mobile', Validators.required],
      location: ['Nairobi, KE', Validators.required],
      transactionType: ['Online', Validators.required],
      deviceType: ['iPhone', Validators.required],
      customerId: ['', Validators.required],
      customerName: ['', Validators.required],
      ipAddress: ['192.168.1.1'],
      timeSlot: ['Afternoon (12pm-6pm)'],
      transactionFrequency: [1, [Validators.min(1)]],
      accountActivity: [5000],
      dayOfWeek: [new Date().getDay()],
      isWeekend: [new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0]
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
    
    this.showErrorToast('Please fill in all required fields correctly');
    return;
  }

  this.isAnalyzing = true;
  this.showResult = false;
  
  try {
    var backendPayload = this.mapFormToBackend(this.riskForm.value);
    console.log('Sending payload to backend:', backendPayload);
  } catch (error) {
    console.error('Error mapping form data:', error);
    this.handleError('Failed to prepare transaction data. Please check your inputs.');
    return;
  }
  
  //Calling real backend API with timeout
  const timeoutMs = 30000; // 30 second timeout
  
  const subscription = this.httpService.checkTransactionRisk(backendPayload)
    .subscribe({
      next: (response: RiskAssessmentResponse) => {
        console.log('Risk assessment response:', response);
        
        if (response.status === 'success' && response.result) {
          this.analysisResult = this.mapBackendResult(response.result);
          this.isAnalyzing = false;
          this.showResult = true;
          
          this.recentAnalyses.unshift(this.analysisResult);
          if (this.recentAnalyses.length > 5) {
            this.recentAnalyses.pop();
          }
          
          this.saveRecentAnalyses();
          
          this.showSuccessToast('Risk analysis completed successfully');
          
          setTimeout(() => {
            document.getElementById('analysis-result')?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 300);
        } else {
          this.handleError(response.message || 'Invalid response from server');
        }
      },
      error: (error: any) => {
        console.error('Error analyzing risk:', error);
        
        let errorMessage = 'Failed to connect to risk analysis service';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if backend is running.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid request. Please check your input values.';
        } else if (error.status === 404) {
          errorMessage = 'API endpoint not found. Please check backend configuration.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.handleError(errorMessage);
      },
      complete: () => {
  
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    });
}

showErrorToast(message: string): void {
  console.error(' Error:', message);
  this.showTemporaryMessage(message, 'error');
}

showSuccessToast(message: string): void {
  console.log(' Success:', message);
  this.showTemporaryMessage(message, 'success');
}

showTemporaryMessage(message: string, type: 'error' | 'success' | 'info'): void {
 console.log(` Showing ${type} message:`, message);
}

showErrorBanner: boolean = false;
errorMessage: string = '';

showError(message: string): void {
  this.errorMessage = message;
  this.showErrorBanner = true;
  this.isAnalyzing = false;

  setTimeout(() => {
    this.showErrorBanner = false;
  }, 5000);
}

handleError(message: string): void {
  this.isAnalyzing = false;
  console.error('Risk analysis error:', message);
  
  this.showError(message);
  
}

hideError(): void {
  this.showErrorBanner = false;
  this.errorMessage = '';
}


mapFormToBackend(formData: any): any {
  const deviceField = this.deviceTypeMap[formData.deviceType] || 'Device_Type_Unknown_Device';
  const locationFields = this.locationMap[formData.location] || { local: 1, international: 0 };
  const typeFields = this.transactionTypeMap[formData.transactionType] || { online: 1, pos: 0 };
  
  //amount category
  let amountCategory = {
    'Amount_Category_Low': 0,
    'Amount_Category_Medium': 0,
    'Amount_Category_High': 0,
    'Amount_Category_Very High': 0
  };
  
  const amount = Number(formData.amount); 
  
  if (amount < 5000) {
    amountCategory['Amount_Category_Low'] = 1;
  } else if (amount < 10000) {
    amountCategory['Amount_Category_Medium'] = 1;
  } else if (amount < 15000) {
    amountCategory['Amount_Category_High'] = 1;
  } else {
    amountCategory['Amount_Category_Very High'] = 1;
  }
  
  //transaction period based on time slot
  let period = {
    'Transaction_Period_Morning': 0,
    'Transaction_Period_Afternoon': 0,
    'Transaction_Period_Evening': 0,
    'Transaction_Period_Night': 0
  };
  
  switch(formData.timeSlot) {
    case 'Morning (6am-12pm)':
      period['Transaction_Period_Morning'] = 1;
      break;
    case 'Afternoon (12pm-6pm)':
      period['Transaction_Period_Afternoon'] = 1;
      break;
    case 'Evening (6pm-11pm)':
      period['Transaction_Period_Evening'] = 1;
      break;
    case 'Late Night (11pm-6am)':
      period['Transaction_Period_Night'] = 1;
      break;
    default:
      period['Transaction_Period_Afternoon'] = 1;
  }

  const ipInt = this.ipToInt(formData.ipAddress || '192.168.1.1');
  
  const payload = {
    'Transaction_Amount': Number(amount),
    'Transaction_Hour': Number(new Date().getHours()),
    'Transaction_Frequency': Number(formData.transactionFrequency || 1),
    'Account_Activity': Number(formData.accountActivity || 5000),
    'Day_of_Week': Number(formData.dayOfWeek),
    'IP_Address': Number(ipInt), // Ensure IP is number
    ...amountCategory,
    'Transaction_Location_International': Number(locationFields.international),
    'Transaction_Location_Local': Number(locationFields.local),
    [deviceField]: 1,
    'Device_Type_iPhone': formData.deviceType === 'iPhone' ? 1 : 0,
    'Device_Type_Android': formData.deviceType === 'Android' ? 1 : 0,
    'Device_Type_MacBook': formData.deviceType === 'MacBook' ? 1 : 0,
    'Device_Type_Windows_PC': formData.deviceType === 'Windows_PC' ? 1 : 0,
    'Device_Type_Unknown_Device': formData.deviceType === 'Unknown_Device' ? 1 : 0,
    'Transaction_Type_Online': Number(typeFields.online),
    'Transaction_Type_POS': Number(typeFields.pos),
    ...period,
    'Is_Weekend': Number(formData.isWeekend),
    'tx_count_last_hour': Number(formData.transactionFrequency || 1)
  };
  
  // console.log('Payload being sent:', JSON.stringify(payload, null, 2));
  
  return payload;
}

mapBackendResult(result: RiskAssessmentResult): RiskResult {
  //risk category
  let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
  if (result.risk_category.includes('Critical')) riskCategory = 'Critical';
  else if (result.risk_category.includes('High')) riskCategory = 'High';
  else if (result.risk_category.includes('Medium')) riskCategory = 'Medium';
  else if (result.risk_category.includes('Low')) riskCategory = 'Low';

  //model agreement
  const modelAgreement = result.transaction_details?.Model_Agreement || '0/7 models flagged';
  const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
  const total = 7;

  const signals: string[] = [];
  
  if (result.transaction_details?.Rule_Engine?.triggered) {
    result.transaction_details.Rule_Engine.rules.forEach((rule: string) => {
      signals.push(` Rule: ${rule}`);
    });
  }
  
  // real-time signals
  if (result.transaction_details?.real_time_signals) {
    const signals_data = result.transaction_details.real_time_signals;
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

  return {
    transactionId: result.transaction_id,
    actualAmount: result.transaction_details?.Transaction_Amount || 0,
    riskScore: result.risk_score,
    riskCategory: riskCategory,
    modelAgreement: {
      flagged: flagged,
      total: total,
      text: modelAgreement
    },
    mlVotes: result.transaction_details?.ML_Votes,
    ruleEngine: result.transaction_details?.Rule_Engine,
    aiAnalysis: {
      details: result.explanations?.final || result.explanations?.llm || result.explanations?.rule_based || 'Risk analysis completed',
      signals: signals,
      ruleBased: result.explanations?.rule_based,
      llm: result.explanations?.llm,
      final: result.explanations?.final
    },
    recommendedAction: result.recommended_action,
    timestamp: new Date(result.timestamp),
    transactionDetails: result.transaction_details,
    feedbackEffect: result.feedback_effect,
    rawData: result
  };
}

ipToInt(ip: string): number {
  try {
    const octets = ip.split('.');
    if (octets.length === 4) {
      return Number(octets[0]) * 256**3 + 
             Number(octets[1]) * 256**2 + 
             Number(octets[2]) * 256 + 
             Number(octets[3]);
    }
    return 3232235777; //Default 192.168.1.1
  } catch {
    return 3232235777; //Default 192.168.1.1
  }
}


resetForm(): void {
    this.riskForm.reset({
      channel: 'Mobile',
      location: 'Nairobi, KE',
      transactionType: 'Online',
      deviceType: 'iPhone',
      timeSlot: 'Afternoon (12pm-6pm)',
      transactionFrequency: 1,
      accountActivity: 5000,
      dayOfWeek: new Date().getDay(),
      isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0
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
    const classes: { [key: string]: string } = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory] || 'bg-secondary';
  }

  getRiskProgressColor(score: number): string {
    if (score >= 7) {
      return '#f72585'; 
    } else if (score >= 5) {
      return '#fc7201'; 
    } else if (score >= 3) {
      return '#ffc107';
    } else {
      return '#28a745'; // 
    }
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