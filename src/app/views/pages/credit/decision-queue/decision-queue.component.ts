import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoanRecord, isPending, latestAssessment } from '../workflow/loan-workflow.models';
import { LoanWorkflowService } from '../workflow/loan-workflow.service';

type AlertView = 'open' | 'awaiting' | 'information';

@Component({
  selector: 'app-decision-queue',
  templateUrl: './decision-queue.component.html',
  styleUrls: ['../workflow/loan-workflow.scss', './decision-queue.component.scss']
})
export class DecisionQueueComponent implements OnInit, OnDestroy {
  apps: LoanRecord[] = [];
  view: AlertView = 'open';
  search = '';
  risk = '';
  page = 1;
  pageSize = 8;
  selectedId = '';
  reason = '';
  ack = false;
  basis: 'requested' | 'recommended' = 'requested';
  banner = '';
  bannerError = false;
  readonly latest = latestAssessment;
  private sub = new Subscription();

  constructor(private route: ActivatedRoute, public workflow: LoanWorkflowService) {}

  ngOnInit(): void {
    this.sub.add(this.workflow.applications$.subscribe(apps => {
      this.apps = apps;
      if (this.page > this.pages) this.page = this.pages;
      if (!this.selectedId || !apps.some(app => app.id === this.selectedId)) {
        this.selectedId = this.rows[0]?.id || '';
        this.syncBasis();
      }
    }));
    this.sub.add(this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.selectedId = id;
        this.banner = '';
        this.syncBasis();
      }
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get openCount(): number {
    return this.apps.filter(app => isPending(app)).length;
  }

  get awaitingCount(): number {
    return this.apps.filter(app => app.status === 'Awaiting decision').length;
  }

  get informationCount(): number {
    return this.apps.filter(app => app.status === 'More information required').length;
  }

  get rows(): LoanRecord[] {
    const query = this.search.trim().toLowerCase();
    return this.apps.filter(app => {
      if (this.view === 'open' && !isPending(app)) return false;
      if (this.view === 'awaiting' && app.status !== 'Awaiting decision') return false;
      if (this.view === 'information' && app.status !== 'More information required') return false;
      if (this.risk && this.workflow.riskFor(latestAssessment(app)) !== this.risk) return false;
      if (!query) return true;
      return [app.customerName, app.nationalId, app.id, latestAssessment(app).input.product]
        .join(' ')
        .toLowerCase()
        .includes(query);
    }).sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get pageRows(): LoanRecord[] {
    const start = (this.page - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  get rangeStart(): number {
    return this.rows.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.rows.length);
  }

  get selected(): LoanRecord | null {
    return this.apps.find(app => app.id === this.selectedId) || null;
  }

  get needsOverride(): boolean {
    const app = this.selected;
    return !!app && this.workflow.approvalNeedsOverride(latestAssessment(app), this.basis);
  }

  get reasonReady(): boolean {
    const length = this.reason.trim().length;
    return length >= 10 && length <= 2000;
  }

  get canApprove(): boolean {
    const app = this.selected;
    if (!app || app.status !== 'Awaiting decision' || !this.reasonReady) return false;
    if (this.needsOverride && (!this.ack || this.reason.trim().length < 20)) return false;
    return true;
  }

  setView(view: AlertView): void {
    this.view = view;
    this.page = 1;
    this.banner = '';
    this.bannerError = false;
    this.selectedId = this.rows[0]?.id || '';
    this.reason = '';
    this.ack = false;
    this.syncBasis();
  }

  select(id: string): void {
    this.selectedId = id;
    this.banner = '';
    this.bannerError = false;
    this.reason = '';
    this.ack = false;
    this.syncBasis();
  }

  act(action: 'Approve' | 'Decline' | 'Request information'): void {
    const app = this.selected;
    if (!app) return;
    try {
      this.workflow.decide(app.id, action, this.reason, latestAssessment(app).version, this.ack, this.basis);
      this.banner = action === 'Approve' ? 'Approved.' : action === 'Decline' ? 'Declined.' : 'Information requested.';
      this.bannerError = false;
      this.reason = '';
      this.ack = false;
      this.selectedId = this.rows[0]?.id || '';
      this.syncBasis();
    } catch (error) {
      this.banner = error instanceof Error ? error.message : 'The decision was not saved.';
      this.bannerError = true;
    }
  }

  private syncBasis(): void {
    const app = this.selected;
    const assessment = app ? latestAssessment(app) : null;
    this.basis = assessment?.limit?.offer ? 'recommended' : 'requested';
  }
}
