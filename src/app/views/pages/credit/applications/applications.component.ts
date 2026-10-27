import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoanRecord, latestAssessment } from '../workflow/loan-workflow.models';
import { LoanWorkflowService } from '../workflow/loan-workflow.service';

@Component({ selector: 'app-applications', templateUrl: './applications.component.html', styleUrls: ['../workflow/loan-workflow.scss'] })
export class ApplicationsComponent implements OnInit, OnDestroy {
  apps: LoanRecord[] = []; search = ''; status = ''; risk = ''; recommendation = ''; sort = 'newest'; page = 1; pageSize = 10;
  private subscription = new Subscription();
  constructor(public workflow: LoanWorkflowService) {}
  ngOnInit(): void { this.subscription.add(this.workflow.applications$.subscribe(apps => { this.apps = apps; this.page = Math.min(this.page, this.pages); })); }
  ngOnDestroy(): void { this.subscription.unsubscribe(); }
  latest = latestAssessment;
  get rows(): LoanRecord[] {
    const query = this.search.trim().toLowerCase();
    const rows = this.apps.filter(app => {
      const assessment = latestAssessment(app);
      return (!query || [app.id, app.customerId, app.nationalId, app.customerName, assessment.input.product].some(x => x.toLowerCase().includes(query))) && (!this.status || app.status === this.status) && (!this.risk || this.workflow.riskFor(assessment) === this.risk) && (!this.recommendation || (this.recommendation === 'Reduced' ? assessment.limit?.outcome === 'Approve reduced amount' : this.workflow.facilityAdvice(assessment) === this.recommendation));
    });
    return rows.sort((a, b) => this.sort === 'amount' ? latestAssessment(b).input.amount - latestAssessment(a).input.amount : this.sort === 'score' ? latestAssessment(a).score - latestAssessment(b).score : this.sort === 'probability' ? (latestAssessment(b).ai?.probability ?? -1) - (latestAssessment(a).ai?.probability ?? -1) : b.submittedAt.localeCompare(a.submittedAt));
  }
  get analysedCount(): number { return this.apps.filter(x => !!latestAssessment(x).ai).length; }
  get totalRequested(): number { return this.apps.reduce((sum, x) => sum + latestAssessment(x).input.amount, 0); }
  get averageLikelihood(): number { const analysed = this.apps.filter(x => !!latestAssessment(x).ai); return analysed.length ? analysed.reduce((sum, x) => sum + (latestAssessment(x).ai?.probability || 0), 0) / analysed.length : 0; }
  riskCount(band: string): number { return this.apps.filter(x => this.workflow.riskFor(latestAssessment(x)) === band).length; }
  share(band: string): number { return this.apps.length ? this.riskCount(band) / this.apps.length * 100 : 0; }
  get pages(): number { return Math.max(1, Math.ceil(this.rows.length / this.pageSize)); }
  get pageRows(): LoanRecord[] { return this.rows.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }
  get first(): number { return this.rows.length ? (this.page - 1) * this.pageSize + 1 : 0; }
  get last(): number { return Math.min(this.page * this.pageSize, this.rows.length); }
  resetFilters(): void { this.search = ''; this.status = ''; this.risk = ''; this.recommendation = ''; this.page = 1; }
  track(_index: number, record: LoanRecord): string { return record.id; }
}
