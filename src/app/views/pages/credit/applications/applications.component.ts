import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { RiskBand } from '../credit-demo.data';
import { LoanAssessment, LoanRecord, latestAssessment } from '../workflow/loan-workflow.models';
import { LoanWorkflowService } from '../workflow/loan-workflow.service';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['../workflow/loan-workflow.scss']
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  apps: LoanRecord[] = [];
  search = '';
  status = '';
  risk = '';
  recommendation = '';
  sort: 'newest' | 'probability' | 'amount' | 'score' = 'newest';
  page = 1;
  pageSize = 10;
  private sub = new Subscription();

  constructor(public workflow: LoanWorkflowService) {}

  ngOnInit(): void {
    this.sub.add(this.workflow.applications$.subscribe(apps => this.apps = apps));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  latest(app: LoanRecord): LoanAssessment {
    return latestAssessment(app);
  }

  get analysedCount(): number {
    return this.apps.filter(app => !!this.latest(app).ai).length;
  }

  get totalRequested(): number {
    return this.apps.reduce((sum, app) => sum + this.latest(app).input.amount, 0);
  }

  get averageLikelihood(): number {
    const values = this.apps
      .map(app => this.latest(app).ai?.probability)
      .filter((value): value is number => Number.isFinite(value));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  riskCount(band: RiskBand): number {
    return this.apps.filter(app => this.workflow.riskFor(this.latest(app)) === band).length;
  }

  share(band: RiskBand): number {
    return this.apps.length ? this.riskCount(band) / this.apps.length * 100 : 0;
  }

  get rows(): LoanRecord[] {
    const query = this.search.trim().toLowerCase();
    const rows = this.apps.filter(app => {
      const assessment = this.latest(app);
      const advice = this.workflow.facilityAdvice(assessment);
      const matchesQuery = !query
        || app.customerName.toLowerCase().includes(query)
        || app.nationalId.toLowerCase().includes(query)
        || app.id.toLowerCase().includes(query);
      const matchesStatus = !this.status || app.status === this.status;
      const matchesRisk = !this.risk || this.workflow.riskFor(assessment) === this.risk;
      const matchesAdvice = !this.recommendation
        || (this.recommendation === 'Reduced'
          ? assessment.limit?.outcome === 'Approve reduced amount'
          : advice === this.recommendation);
      return matchesQuery && matchesStatus && matchesRisk && matchesAdvice;
    });
    rows.sort((left, right) => {
      const a = this.latest(left);
      const b = this.latest(right);
      if (this.sort === 'probability') { return (b.ai?.probability || 0) - (a.ai?.probability || 0); }
      if (this.sort === 'amount') { return b.input.amount - a.input.amount; }
      if (this.sort === 'score') { return a.score - b.score; }
      return Date.parse(right.submittedAt) - Date.parse(left.submittedAt);
    });
    return rows;
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get pageRows(): LoanRecord[] {
    const page = Math.min(this.page, this.pages);
    const start = (page - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  get first(): number {
    return this.rows.length ? (Math.min(this.page, this.pages) - 1) * this.pageSize + 1 : 0;
  }

  get last(): number {
    return Math.min(Math.min(this.page, this.pages) * this.pageSize, this.rows.length);
  }

  resetFilters(): void {
    this.search = '';
    this.status = '';
    this.risk = '';
    this.recommendation = '';
    this.sort = 'newest';
    this.page = 1;
  }

  track(_index: number, app: LoanRecord): string {
    return app.id;
  }
}
