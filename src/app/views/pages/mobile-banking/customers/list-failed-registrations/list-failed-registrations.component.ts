import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { Subject, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import {environment} from 'src/environments/environment';


interface ChatMessage {
  sender: 'bot' | 'user';
  type: 'text' | 'file';
  text?: string;
  fileUrl?: string;
  caption?: string;
  time: Date;
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
export class ListFailedRegistrationsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  isCollapsed = false;
  isDefaultRouteActive = false;
showIntelligencePanel: boolean = true; 
  // Summary data
  viewDate: NgbDateStruct;
  allAudits: any[] = [];
  upcomingAudits: any[] = [];
  riskStats = { critical: 0, high: 0, medium: 0, low: 0 };
  complianceStats = { completed: 0, pending: 0 };

  private apiUrl = `${environment.apiBase}/audits`;
  private observationsUrl = 'http://localhost:3000/observations';
  private workflowsUrl = `${environment.apiBase}/workflows`;

  currentRoute: string = '';



  constructor(
    private httpService: HttpService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    private dataExploration: DataExportationService,
    private http: HttpClient
  ) {
        this.checkRoute();
    const today = new Date();
    this.viewDate = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };

    
  }

 private subs: Subscription[] = [];

 
ngOnInit() {
  this.checkRoute();
  this.router.events.subscribe(() => {
    this.checkRoute();
  });

  // this.loadAudits();
}

checkRoute(): void {
  const currentUrl = this.router.url;
  this.showIntelligencePanel = currentUrl.includes('live-feed') || currentUrl.includes('risk-analyzer');

  if (!this.showIntelligencePanel && !this.isCollapsed) {
    this.isCollapsed = true;
  } else if (this.showIntelligencePanel && this.isCollapsed) {

  }
  
  console.log('Route changed:', currentUrl, 'showPanel:', this.showIntelligencePanel);
}

ngOnDestroy() {
  this.subs.forEach(s => s.unsubscribe());
}

cm = {
  truePositives: 120,
  falseNegatives: 5,
  falsePositives: 10,
  trueNegatives: 865
};

  pendingInvestigations = 4;
  totalAlerts = 24;
  currentRiskLevel = 71; 

  recentAIDetections = [
    { severity: 'Critical', message: 'SIM swap + large transfer detected', time: '2m ago' },
    { severity: 'High', message: 'Unusual velocity from Nairobi', time: '5m ago' },
    { severity: 'High', message: 'Multiple failed logins + transfer', time: '12m ago' },
    { severity: 'Medium', message: 'New device + location mismatch', time: '18m ago' }
  ];

  riskDistribution = {
    critical: 342,
    high: 942,
    medium: 2456,
    low: 154692
  };

 
  toggleIntelligencePanel(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  canInvestigate(): boolean {
    return this.pendingInvestigations > 0;
  }

  runModelRetraining(): void {
    console.log('Triggering model retraining...');
    alert('Model retraining started. This will take approximately 5 minutes.');
  }

  exportFraudReport(): void {
    console.log('Exporting fraud report...');
    alert('Fraud report export started. Check downloads folder.');
  }

  viewAlerts(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/history']);
  }

loadRiskStats(): void {
  this.http.get<any[]>(this.workflowsUrl).subscribe(workflows => {
    let critical = 0, high = 0, medium = 0, low = 0;
    
    workflows.forEach(workflow => {
      const preClosing = workflow.fieldwork?.preClosing || [];
      preClosing.forEach((finding: any) => {
        switch(finding.severity) {
          case 'Critical': critical++; break;
          case 'High': high++; break;
          case 'Medium': medium++; break;
          case 'Low': low++; break;
        }
      });
    });
    
    this.riskStats = { critical, high, medium, low };
  });
}

  isAuditDay(date: { year: number; month: number; day: number }): boolean {
    const d = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return this.allAudits.some(audit =>
      audit.startDate === d || audit.endDate === d
    );
  }

isAuditStartDay(date: { year: number; month: number; day: number }): any[] {
  const d = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  return this.allAudits.filter(audit => audit.startDate === d);
}

isAuditEndDay(date: { year: number; month: number; day: number }): any[] {
  const d = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  return this.allAudits.filter(audit => audit.endDate === d);
}

getAuditTooltip(date: { year: number; month: number; day: number }): string {
  const starts = this.isAuditStartDay(date);
  const ends = this.isAuditEndDay(date);

  let tips: string[] = [];

  if (starts.length) {
    tips.push(...starts.map(a => `Start: ${a.title} (${a.department})`));
  }
  if (ends.length) {
    tips.push(...ends.map(a => `End: ${a.title} (${a.department})`));
  }

  return tips.join(' | ') || '';
}

loadUpcomingAudits(): void {
  const today = new Date();
  this.upcomingAudits = this.allAudits
    .filter(a => new Date(a.startDate) >= today) // only future audits
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3); // take only next 3
}



get nextThreeAudits() {
  const today = new Date();
  return this.allAudits
    .filter(a => new Date(a.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);
}

  loadAudits(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (audits) => {
        this.allAudits = audits;
        this.loadUpcomingAudits();
        this.loadRiskStats();
        this.loadComplianceStats();
      },
      error: (err) => {
        console.error('Error loading audits:', err);
      }
    });
  }

  loadComplianceStats(): void {
    const completed = this.allAudits.filter(a => a.status === 'Completed').length;
    const pending = this.allAudits.length - completed;
    this.complianceStats = { completed, pending };
  }

  toggleConversationPanel() {
    this.isCollapsed = !this.isCollapsed;
  }

  isPlanningRoute(): boolean {
  return this.router.url.includes('planning');
}

isObservationRoute(): boolean {
  return this.router.url.includes('observation');
}

shouldEnableObservations(): boolean {
  const hasAuditContext = this.allAudits.length > 0; // Or check for specific audit
  const isBlockedRoute = this.router.url.includes('planning') || this.router.url.includes('scoping');
  
  return hasAuditContext && !isBlockedRoute;
}

}
