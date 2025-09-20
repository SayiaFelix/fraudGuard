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

  // Summary data
  viewDate: NgbDateStruct;
  allAudits: any[] = [];
  upcomingAudits: any[] = [];
  riskStats = { high: 0, medium: 0, low: 0 };
  complianceStats = { completed: 0, pending: 0 };

  private apiUrl = 'http://localhost:3000/audits';
  private observationsUrl = 'http://localhost:3000/observations';

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
    const today = new Date();
    this.viewDate = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

 private subs: Subscription[] = [];

ngOnInit() {
  this.loadAudits();

  this.subs.push(
    this.globalService.observationsChanged$.subscribe(() => {
      console.log('🔄 Observations changed, refreshing parent...');
      this.loadAudits();
    })
  );

  this.subs.push(
    this.globalService.auditsChanged$.subscribe(() => {
      this.loadAudits();
    })
  );
}

ngOnDestroy() {
  this.subs.forEach(s => s.unsubscribe());
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


  loadRiskStats(): void {
    this.http.get<any[]>(this.observationsUrl).subscribe(obs => {
      this.riskStats = {
        high: obs.filter(o => o.severity === 'High').length,
        medium: obs.filter(o => o.severity === 'Medium').length,
        low: obs.filter(o => o.severity === 'Low').length
      };
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

}
