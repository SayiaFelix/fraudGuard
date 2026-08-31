import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpService } from 'src/app/shared/services/http.service';

// ============================================
// INTERFACES
// ============================================

interface FincaSpecific {
  alert_id: string;
  case_id: string;
  customer_id: string;
  customer_name: string;
  transaction_amount: number;
  channel: string;
  device_type: string;
  location: string;
}

interface FincaDetails {
  channel: string;
  deviceType: string;
  location: string;
  alertId: string;
  caseId: string;
  totalRulePoints: number;
  cappedRulePoints: number;
  ruleRiskLevel: string;
  rulesTriggered: Array<{
    rule_id: string;
    rule_name: string;
    reason: string;
    rule_points: number;
  }>;
  mlRiskLevel: string;
  finalRiskLevel: string;
  decision: string;
}

interface RiskAssessmentResult {
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_category: string;
  
  // FINCA-specific fields
  ml_risk_level?: string;
  final_risk_level?: string;
  decision?: string;
  ml_score?: number;
  
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
    // FINCA-SPECIFIC FIELDS (from response)
    finca_channel?: string;
    finca_device_type?: string;
    finca_location?: string;
    finca_rules_triggered?: Array<{
      rule_id: string;
      rule_name: string;
      reason: string;
      rule_points: number;
    }>;
    finca_total_rule_points?: number;
    finca_capped_rule_points?: number;
    finca_rule_risk_level?: string;
    finca_final_decision?: string;
    finca_rule_count?: number;
    ml_risk_score?: number;
    ml_risk_level?: string;
    final_risk_level?: string;
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

interface RiskAssessmentResponse {
  status: string;
  message: string;
  async_mode?: boolean;
  async_processing?: boolean;
  result: RiskAssessmentResult;
  finca_specific?: FincaSpecific;
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
  fincaDetails?: FincaDetails;
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
  
  channels = ['Mobile banking', 'Internet banking', 'Core banking', 'Cards', 'Agency', 'ATM/POS', 'USSD'];
  locations = ['Nairobi, KE', 'Mombasa, KE', 'Kisumu, KE', 'Nakuru, KE', 'Eldoret, KE', 'Thika, KE', 'Kampala, UG', 'Entebbe, UG', 'International'];
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
    'Kampala, UG': { local: 1, international: 0 },
    'Entebbe, UG': { local: 1, international: 0 },
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
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router,
    private httpService: HttpService
  ) {
    this.riskForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      channel: ['Mobile banking', Validators.required],
      location: ['Kampala, UG', Validators.required],
      transactionType: ['Online', Validators.required],
      deviceType: ['iPhone', Validators.required],
      customerId: ['', Validators.required],
      customerName: ['', Validators.required],
      ipAddress: ['192.168.1.1'],
      timeSlot: ['Afternoon (12pm-6pm)'],
      transactionFrequency: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      accountActivity: [5000],
      dayOfWeek: [new Date().getDay()],
      isWeekend: [new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0],
      customerEmail: [''],
      customerPhone: [''],
      accountAge: [365],
      avgTransaction: [50000],
      customerTier: ['regular']
    });
  }

  ngOnInit(): void {
    this.loadRecentAnalyses();
  }

  // ============================================
  // MAIN ANALYSIS FUNCTION
  // ============================================

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

    this.httpService.checkTransactionRisk(backendPayload)
      .subscribe({
        next: (response: RiskAssessmentResponse) => {
          console.log('Risk assessment response:', response);

          if (response.status === 'success' && response.result) {
            // Pass both result AND finca_specific
            this.analysisResult = this.mapBackendResult(
              response.result,
              response.finca_specific
            );
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
          this.isAnalyzing = false;
        }
      });
  }

  // ============================================
  // MAP FORM TO BACKEND PAYLOAD
  // ============================================

  mapFormToBackend(formData: any): any {
  const deviceField = this.deviceTypeMap[formData.deviceType] || 'Device_Type_Unknown_Device';
  const locationFields = this.locationMap[formData.location] || { local: 1, international: 0 };
  const typeFields = this.transactionTypeMap[formData.transactionType] || { online: 1, pos: 0 };

  // Amount category
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

  // Transaction period
  let period = {
    'Transaction_Period_Morning': 0,
    'Transaction_Period_Afternoon': 0,
    'Transaction_Period_Evening': 0,
    'Transaction_Period_Night': 0
  };

  switch (formData.timeSlot) {
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

  // ============================================
  // FINCA CHANNEL MAPPING
  // ============================================
  const channelMap: { [key: string]: string } = {
    'Mobile banking': 'MOBILE_BANKING',
    'Internet banking': 'INTERNET_BANKING',
    'Core banking': 'CORE_BANKING',
    'Cards': 'CARDS',
    'Agency': 'AGENCY',
    'ATM/POS': 'ATM',
    'USSD': 'USSD'
  };
  const channel = channelMap[formData.channel] || 'MOBILE_BANKING';

  // ============================================
  // FINCA DEVICE TYPE MAPPING
  // ============================================
  const deviceTypeMap: { [key: string]: string } = {
    'iPhone': 'iPhone',
    'Android': 'Android',
    'MacBook': 'MacBook',
    'Windows_PC': 'Windows',
    'Unknown_Device': 'Unknown'
  };
  const deviceType = deviceTypeMap[formData.deviceType] || 'Unknown';

  // ============================================
  // FINCA LOCATION MAPPING
  // ============================================
  let location = formData.location || 'Kampala, UG';
  // If location is 'International', keep as is
  if (location === 'International') {
    // Keep as 'International'
  } else if (location.includes(',')) {
    // Extract city name (e.g., "Kampala, UG" → "Kampala")
    location = location.split(',')[0].trim();
  }

  const payload = {
    // ============================================
    // Engine format (one-hot encoded)
    // ============================================
    'Transaction_Amount': Number(amount),
    'Transaction_Hour': Number(new Date().getHours()),
    'Transaction_Frequency': Number(formData.transactionFrequency || 1),
    'Account_Activity': Number(formData.accountActivity || 5000),
    'Day_of_Week': Number(formData.dayOfWeek),
    'IP_Address': Number(ipInt),
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
    'tx_count_last_hour': Number(formData.transactionFrequency || 1),

    // Customer info
    'customer_id': formData.customerId,
    'customer_name': formData.customerName,
    'customer_email': formData.customerEmail || '',
    'customer_phone': formData.customerPhone || '',
    'account_age_days': Number(formData.accountAge || 0),
    'avg_transaction_amount': Number(formData.avgTransaction || 0),
    'customer_tier': formData.customerTier || 'regular',

    // ============================================
    // FINCA-SPECIFIC FIELDS (for finca_specific)
    // These match exactly what FINCA expects
    // ============================================
    'device_type': deviceType,
    'location': location,
    'channel': channel
  };

  console.log('📤 FINCA Payload:', JSON.stringify(payload, null, 2));

  return payload;
}

  // ============================================
  // MAP BACKEND RESPONSE TO UI
  // ============================================

  mapBackendResult(result: RiskAssessmentResult, fincaSpecific?: FincaSpecific): RiskResult {
    // Determine risk category
    let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';

    const riskLevel = result.ml_risk_level || result.risk_category || '';

    if (riskLevel.includes('Critical') || riskLevel.includes('CRITICAL')) {
      riskCategory = 'Critical';
    } else if (riskLevel.includes('High') || riskLevel.includes('HIGH')) {
      riskCategory = 'High';
    } else if (riskLevel.includes('Medium') || riskLevel.includes('MEDIUM')) {
      riskCategory = 'Medium';
    } else if (riskLevel.includes('Low') || riskLevel.includes('LOW')) {
      riskCategory = 'Low';
    }

    // Model agreement
    const modelAgreement = result.transaction_details?.Model_Agreement || '0/7 models flagged';
    const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
    const total = 7;

    // Build signals
    const signals: string[] = [];

    // Old format: Rule_Engine
    if (result.transaction_details?.Rule_Engine?.triggered) {
      result.transaction_details.Rule_Engine.rules.forEach((rule: string) => {
        signals.push(`Rule: ${rule}`);
      });
    }

    // New format: finca_rules_triggered
    if (result.transaction_details?.finca_rules_triggered) {
      result.transaction_details.finca_rules_triggered.forEach((rule: any) => {
        signals.push(`[${rule.rule_id}] ${rule.rule_name}: ${rule.reason} (+${rule.rule_points}pts)`);
      });
    }

    // Real-time signals
    if (result.transaction_details?.real_time_signals) {
      const signalsData = result.transaction_details.real_time_signals;
      if (signalsData.amount_risk > 0.7) {
        signals.push(`High amount anomaly (${(signalsData.amount_risk * 100).toFixed(0)}% above normal)`);
      } else if (signalsData.amount_risk > 0.4) {
        signals.push(`Medium amount anomaly (${(signalsData.amount_risk * 100).toFixed(0)}% above normal)`);
      }

      if (signalsData.velocity_risk > 0.7) {
        signals.push(`High velocity risk - ${(signalsData.velocity_risk * 5).toFixed(0)} transactions/hour`);
      } else if (signalsData.velocity_risk > 0.4) {
        signals.push(`Medium velocity risk - ${(signalsData.velocity_risk * 5).toFixed(0)} transactions/hour`);
      }
    }

    // Build FINCA details
    const fincaDetails: FincaDetails = {
      channel: fincaSpecific?.channel || result.transaction_details?.finca_channel || 'N/A',
      deviceType: fincaSpecific?.device_type || result.transaction_details?.finca_device_type || 'N/A',
      location: fincaSpecific?.location || result.transaction_details?.finca_location || 'N/A',
      alertId: fincaSpecific?.alert_id || 'N/A',
      caseId: fincaSpecific?.case_id || 'N/A',
      totalRulePoints: result.transaction_details?.finca_total_rule_points || 0,
      cappedRulePoints: result.transaction_details?.finca_capped_rule_points || 0,
      ruleRiskLevel: result.transaction_details?.finca_rule_risk_level || 'LOW',
      rulesTriggered: result.transaction_details?.finca_rules_triggered || [],
      mlRiskLevel: result.ml_risk_level || result.risk_category || 'LOW',
      finalRiskLevel: result.final_risk_level || result.risk_category || 'LOW',
      decision: result.decision || 'APPROVE'
    };

    console.log('FINCA Details extracted:', fincaDetails);

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
      rawData: result,
      fincaDetails: fincaDetails
    };
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  ipToInt(ip: string): number {
    try {
      const octets = ip.split('.');
      if (octets.length === 4) {
        return Number(octets[0]) * 256 ** 3 +
          Number(octets[1]) * 256 ** 2 +
          Number(octets[2]) * 256 +
          Number(octets[3]);
      }
      return 3232235777;
    } catch {
      return 3232235777;
    }
  }

  resetForm(): void {
    this.riskForm.reset({
      channel: 'Mobile banking',
      location: 'Kampala, UG',
      transactionType: 'Online',
      deviceType: 'iPhone',
      timeSlot: 'Afternoon (12pm-6pm)',
      transactionFrequency: 1,
      accountActivity: 5000,
      dayOfWeek: new Date().getDay(),
      isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0,
      customerEmail: '',
      customerPhone: '',
      accountAge: 365,
      avgTransaction: 50000,
      customerTier: 'regular'
    });
    this.showResult = false;
    this.analysisResult = null;
  }

  // ============================================
  // RECENT ANALYSES
  // ============================================

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

  // ============================================
  // NAVIGATION
  // ============================================

  investigateTransaction(): void {
    if (this.analysisResult) {
      this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', this.analysisResult.transactionId]);
    }
  }

  // ============================================
  // FORM VALIDATION
  // ============================================

  isFieldInvalid(controlName: string): boolean {
    const control = this.riskForm.get(controlName);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.riskForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      if (controlName === 'transactionFrequency') {
        return 'Transaction frequency is required';
      }
      return `${controlName} is required`;
    }

    if (control.hasError('min')) {
      if (controlName === 'transactionFrequency') {
        return 'Transaction frequency must be at least 1 per hour (zero not allowed)';
      }
      const min = control.errors?.['min'].min;
      return `Value must be greater than ${min}`;
    }

    if (control.hasError('max')) {
      if (controlName === 'transactionFrequency') {
        return 'Transaction frequency cannot exceed 100 per hour';
      }
      const max = control.errors?.['max'].max;
      return `Value must be less than ${max}`;
    }

    if (control.hasError('pattern')) {
      switch (controlName) {
        case 'ipAddress':
          return 'Invalid IP address format (use xxx.xxx.xxx.xxx)';
        case 'customerEmail':
          return 'Invalid email format (e.g., name@example.com)';
        case 'customerPhone':
          return 'Invalid phone number (10-15 digits, optional +)';
        case 'customerName':
          return 'Name can only contain letters, spaces, and hyphens';
        case 'customerId':
          return 'Customer ID can only contain uppercase letters, numbers, and hyphens';
        default:
          return 'Invalid format';
      }
    }

    return '';
  }

  // ============================================
  // TOAST / ERROR HANDLING
  // ============================================

  showErrorBanner: boolean = false;
  errorMessage: string = '';

  showErrorToast(message: string): void {
    this.toastr.error(message, 'Error', {
      timeOut: 5000,
      positionClass: 'toast-top-right'
    });
  }

  showSuccessToast(message: string): void {
    this.toastr.success(message, 'Success', {
      timeOut: 3000,
      positionClass: 'toast-top-right'
    });
  }

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

  // ============================================
  // UI HELPERS
  // ============================================

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
      return '#28a745';
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

  // ============================================
  // FORM GETTERS
  // ============================================

  get transactionFrequency() {
    return this.riskForm.get('transactionFrequency');
  }

  get accountActivity() {
    return this.riskForm.get('accountActivity');
  }

  get accountAge() {
    return this.riskForm.get('accountAge');
  }

  get avgTransaction() {
    return this.riskForm.get('avgTransaction');
  }

  get ipAddress() {
    return this.riskForm.get('ipAddress');
  }
}