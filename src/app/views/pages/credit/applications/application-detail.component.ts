import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CreditApplication } from '../credit-demo.data';
import { LoanAssessment, LoanRecord } from '../workflow/loan-workflow.models';
import { LoanWorkflowService } from '../workflow/loan-workflow.service';

@Component({ selector: 'app-application-detail', templateUrl: './application-detail.component.html', styleUrls: ['../workflow/loan-workflow.scss'] })
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  application: LoanRecord | null = null; legacy: CreditApplication | null = null; selectedVersion = 0; private id = '';
  private subscription = new Subscription();
  constructor(private route: ActivatedRoute, public workflow: LoanWorkflowService) {}
  ngOnInit(): void {
    this.subscription.add(this.route.paramMap.subscribe(params => { this.id = params.get('id') || ''; this.selectedVersion = 0; this.load(); }));
    this.subscription.add(this.workflow.applications$.subscribe(() => this.load()));
  }
  ngOnDestroy(): void { this.subscription.unsubscribe(); }
  get assessment(): LoanAssessment | undefined { return this.application?.assessments.find(a => a.version === this.selectedVersion); }
  private load(): void {
    this.application = this.workflow.find(this.id) || null;
    this.legacy = !this.application ? this.workflow.credit.find(this.id) || null : null;
    if (this.application && (this.selectedVersion < 1 || this.selectedVersion > this.application.assessments.length)) { this.selectedVersion = this.application.assessments.length; }
  }
}
