import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NgbDateStruct, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddCustomerComponent } from "../add-customer/add-customer.component";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { SwalComponent } from "@sweetalert2/ngx-sweetalert2";
import Swal from "sweetalert2";
import { GlobalService } from 'src/app/shared/services/global.service';
import { Subject, Subscription, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastrService } from 'ngx-toastr';

interface AIDetection {
fullDate: any;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  time: string;
  transactionId?: string;
  riskScore?: number;
}

@Component({
  selector: 'app-list-failed-registrations',
  templateUrl: './list-failed-registrations.component.html',
  styleUrls: ['./list-failed-registrations.component.scss'],
  providers: [DatePipe],
  animations: [
    trigger('slideInOut', [
      state('in', style({ transform: 'translateX(0%)', opacity: 1, display: 'block' })),
      state('out', style({ transform: 'translateX(100%)', opacity: 0 })),
      transition('in => out', [animate('300ms ease-in-out')]),
      transition('out => in', [animate('300ms ease-in-out')]),
    ])
  ]
})
export class ListFailedRegistrationsComponent implements OnInit, OnDestroy {
  @ViewChild('table') table: DatatableComponent;
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  isCollapsed = false;
  isDefaultRouteActive = false;
  showIntelligencePanel: boolean = true;
  
  // View Date
  viewDate: NgbDateStruct;
  allAudits: any[] = [];
  upcomingAudits: any[] = [];
  riskStats = { critical: 0, high: 0, medium: 0, low: 0 };
  
  
  currentRoute: string = '';

  transactions: any[] = [];
  modelMetrics: any = null;
  auditLogs: any[] = [];
  
  // Dynamic stats
  pendingInvestigations = 0;
  totalAlerts = 0;
  currentRiskLevel = 0;
  
  // Dynamic AI detections (only High & Critical)
  recentAIDetections: AIDetection[] = [];
  
  // Dynamic risk distribution
  riskDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  //model performance (XGBoost)
  modelPerformance = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    modelName: 'XGBoost'
  };

  systemStats = {
    totalTransactions: 0,
    avgResponseMs: 187,
    modelVersion: 'v1.0.0-stage1',
    threshold: 5.0,
    nationalAlertMode: false
  };

 
  isAlertModeEnabled: boolean = false;

  private refreshSubscription?: Subscription;
  private subs: Subscription[] = [];

  constructor(
    private httpService: HttpService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    private dataExploration: DataExportationService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.checkRoute();
    const today = new Date();
    this.viewDate = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

  ngOnInit() {
    this.checkRoute();
    this.router.events.subscribe(() => {
      this.checkRoute();
    });
    this.loadDashboardData();
    this.loadSovereignMode();

    
    // Auto-refresh every 10 minutes
    this.refreshSubscription = interval(600000).subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  checkRoute(): void {
    const currentUrl = this.router.url;
    this.showIntelligencePanel = currentUrl.includes('live-feed') || currentUrl.includes('risk-analyzer');

    if (!this.showIntelligencePanel && !this.isCollapsed) {
      this.isCollapsed = true;
    } else if (this.showIntelligencePanel && this.isCollapsed) {
      // Panel will be shown
    }
    
    console.log('Route changed:', currentUrl, 'showPanel:', this.showIntelligencePanel);
  }

  loadDashboardData(): void {
    Promise.all([
      this.loadTransactions(),
      this.loadModelMetrics(),
      this.loadAuditLog(),
      this.loadSystemStats()
    ]).then(() => {
      this.updateAIDetections();
      this.updateRiskDistribution();
      this.updateModelPerformance();
      this.calculateAlerts();
    });
  }

  loadTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.httpService.getTransactions(1, 100).subscribe({
        next: (response) => {
          if (response.status === 'success' && response.transactions) {
            this.transactions = response.transactions;
            
            if (this.transactions.length > 0) {
              const recentTx = this.transactions.slice(0, 10);
              const avgRisk = recentTx.reduce((sum, tx) => sum + tx.risk_score, 0) / recentTx.length;
              this.currentRiskLevel = Math.round(avgRisk * 10); //Convert 0-10 to 0-100
            }
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          resolve();
        }
      });
    });
  }

  // In your component (e.g., dashboard or system controls)
sovereignMode: boolean = true;

loadSovereignMode(): void {
  this.httpService.getSovereignMode().subscribe({
    next: (response) => {
      if (response.status === 'success') {
        this.sovereignMode = response.sovereign_mode;
      }
    },
    error: (error) => {
      console.error('Error loading sovereign mode:', error);
    }
  });
}

toggleSovereignMode(enable: boolean): void {
  this.httpService.toggleSovereignMode(enable).subscribe({
    next: (response) => {
      if (response.status === 'success') {
        this.sovereignMode = response.sovereign_mode;
        // Show toast notification
        this.toastr.success(
          `Sovereign mode ${this.sovereignMode ? 'enabled' : 'disabled'}. ` +
          `LLM is now ${this.sovereignMode ? 'disabled' : 'enabled'}.`,
          'Sovereign Mode'
        );
      }
    },
    error: (error) => {
      console.error('Error toggling sovereign mode:', error);
      this.toastr.error('Failed to toggle sovereign mode', 'Error');
    }
  });
}

  //(using XGBoost)
  loadModelMetrics(): Promise<void> {
    return new Promise((resolve) => {
      this.httpService.getModelMetrics().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.metrics) {
            this.modelMetrics = response;
            
            // Use XGBoost metrics
            if (response.metrics['XGBoost']) {
              const xgb = response.metrics['XGBoost'];
              this.modelPerformance = {
                accuracy: xgb.accuracy * 100,
                precision: xgb.precision * 100,
                recall: xgb.recall * 100,
                f1Score: xgb.f1_score * 100,
                modelName: 'XGBoost'
              };
            }
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading model metrics:', error);
          resolve();
        }
      });
    });
  }

  loadAuditLog(): Promise<void> {
    return new Promise((resolve) => {
      this.httpService.getAuditLog().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.logs) {
            this.auditLogs = response.logs;
            
            this.pendingInvestigations = this.auditLogs.filter(
              log => log.risk_category.includes('Critical') || log.risk_category.includes('High')
            ).length;
            
            this.totalAlerts = this.auditLogs.length;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading audit log:', error);
          resolve();
        }
      });
    });
  }

  loadSystemStats(): Promise<void> {
    return new Promise((resolve) => {
      this.httpService.getSystemStats().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.systemStats = {
              totalTransactions: response.transactions_analyzed || 0,
              avgResponseMs: response.avg_response_ms || 187,
              modelVersion: response.model_version || 'v1.0.0-stage1',
              threshold: response.threshold || 5.0,
              nationalAlertMode: response.national_alert_mode || false
            };
            this.isAlertModeEnabled = this.systemStats.nationalAlertMode;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading system stats:', error);
          resolve();
        }
      });
    });
  }

updateAIDetections(): void {
  if (!this.auditLogs || this.auditLogs.length === 0) {
    this.recentAIDetections = [];
    return;
  }
  
  const highRiskLogs = this.auditLogs.filter(log => 
    log.risk_category.includes('Critical') || log.risk_category.includes('High')
  );
  
  const sortedLogs = highRiskLogs.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  this.recentAIDetections = sortedLogs.slice(0, 5).map(log => {
    let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'High';
    if (log.risk_category.includes('Critical')) severity = 'Critical';
    else if (log.risk_category.includes('High')) severity = 'High';
    
    // Format time ago
    const logTime = new Date(log.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - logTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    let timeAgo = '';
    let fullDate = '';
    
    if (diffMins < 1) {
      timeAgo = 'Just now';
    } else if (diffMins < 60) {
      timeAgo = `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      timeAgo = `${hours}h ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      timeAgo = `${days}d ago`;
  
      fullDate = logTime.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    let amount = '';
    if (log.transaction_details?.Transaction_Amount) {
      amount = `KES ${log.transaction_details.Transaction_Amount.toLocaleString()}`;
    }
    
    let message = '';
    if (amount) {
      message = `${log.risk_category}: ${amount}`;
    } else {
      message = `${log.risk_category} detected`;
    }
    
    if (log.transaction_details?.Rule_Flags && log.transaction_details.Rule_Flags.length > 0) {
      const topRule = log.transaction_details.Rule_Flags[0];
      message = `${log.risk_category}: ${topRule}`;
    }
    
    return {
      severity: severity,
      message: message,
      time: timeAgo,
      fullDate: fullDate,
      transactionId: log.transaction_id,
      riskScore: log.risk_score
    };
  });
  
  console.log('Recent AI Detections (latest first):', this.recentAIDetections);
}

  updateRiskDistribution(): void {
    if (!this.transactions || this.transactions.length === 0) return;
    
    this.riskDistribution = {
      critical: this.transactions.filter(t => t.risk_category === 'Critical Fraud Risk').length,
      high: this.transactions.filter(t => t.risk_category === 'High Potential Fraud').length,
      medium: this.transactions.filter(t => t.risk_category === 'Medium Risk').length,
      low: this.transactions.filter(t => t.risk_category === 'Low Potential Fraud').length
    };
  }

  updateModelPerformance(): void {
    if (this.modelMetrics?.metrics && this.modelMetrics.metrics['XGBoost']) {
      const xgb = this.modelMetrics.metrics['XGBoost'];
      this.modelPerformance = {
        accuracy: xgb.accuracy * 100,
        precision: xgb.precision * 100,
        recall: xgb.recall * 100,
        f1Score: xgb.f1_score * 100,
        modelName: 'XGBoost'
      };
    }
  }

  calculateAlerts(): void {
    if (!this.transactions || this.transactions.length === 0) return;
    
    this.totalAlerts = this.transactions.filter(
      t => t.risk_category === 'Critical Fraud Risk' || t.risk_category === 'High Potential Fraud'
    ).length;
  }


  toggleAlertMode(): void {
    const newMode = !this.isAlertModeEnabled;
    
    this.httpService.toggleAlertMode(newMode).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.isAlertModeEnabled = response.national_alert_mode;
          this.systemStats.nationalAlertMode = response.national_alert_mode;
          this.systemStats.threshold = response.active_threshold;
          
          Swal.fire({
            title: `Alert Mode ${this.isAlertModeEnabled ? 'Enabled' : 'Disabled'}`,
            text: `Threshold is now ${this.systemStats.threshold}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadDashboardData();
        }
      },
      error: (error) => {
        console.error('Error toggling alert mode:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to toggle alert mode',
          icon: 'error',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  toggleIntelligencePanel(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  canInvestigate(): boolean {
    return this.pendingInvestigations > 0;
  }

  runModelRetraining(): void {
    console.log('Triggering model retraining...');
    Swal.fire({
      title: 'Model Retraining Started',
      text: 'This will take approximately 5 minutes. You will be notified when complete.',
      icon: 'info',
      timer: 3000,
      showConfirmButton: false
    });
  }

  exportFraudReport(): void {
    console.log('Exporting fraud report...');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      totalTransactions: this.systemStats.totalTransactions,
      riskDistribution: this.riskDistribution,
      modelPerformance: this.modelPerformance,
      recentDetections: this.recentAIDetections
    };
    
    // Export as JSON
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `fraud-report-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    Swal.fire({
      title: 'Report Exported',
      text: 'Fraud report has been downloaded ',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  viewAlerts(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/history']);
  }


  toggleConversationPanel() {
    this.isCollapsed = !this.isCollapsed;
  }

}