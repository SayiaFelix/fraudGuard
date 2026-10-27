import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoanRecord, isPending, latestAssessment } from '../workflow/loan-workflow.models';
import { LoanWorkflowService } from '../workflow/loan-workflow.service';

@Component({ selector: 'app-loan-decision-queue', templateUrl: './loan-decision-queue.component.html', styleUrls: ['../workflow/loan-workflow.scss'] })
export class LoanDecisionQueueComponent implements OnInit, OnDestroy {
  apps: LoanRecord[] = []; selectedId = ''; search = ''; risk = ''; scope = 'pending'; sort = 'priority'; page = 1; pageSize = 10;
  note = ''; reviewed = false; override = false; error = ''; message = ''; busy = false;
  confirmation: 'Approve' | 'Decline' | 'Request information' | null = null; expectedVersion = 0;
  approvalBasis: 'requested' | 'recommended' = 'requested';
  copilotContext = ''; decisionErrors: string[] = [];
  private requestedId = ''; private subscription = new Subscription();
  constructor(private route: ActivatedRoute, public workflow: LoanWorkflowService) {}
  latest = latestAssessment;
  ngOnInit(): void {
    this.subscription.add(this.route.queryParamMap.subscribe(params => {
      this.requestedId = params.get('id') || '';
      if (this.requestedId) { this.select(this.requestedId); if (!this.workflow.find(this.requestedId)) { this.error = 'The linked application was not found in saved assessments.'; } }
    }));
    this.subscription.add(this.workflow.applications$.subscribe(apps => {
      this.apps = apps; this.page = Math.min(this.page, this.pages);
      if (!this.selectedId && !this.requestedId && this.rows.length) { this.selectedId = this.rows[0].id; }
    }));
  }
  ngOnDestroy(): void { this.subscription.unsubscribe(); }
  get rows(): LoanRecord[] {
    const query = this.search.trim().toLowerCase();
    return this.apps.filter(app => (this.scope === 'all' || (this.scope === 'pending' && isPending(app)) || (this.scope === 'information' && app.status === 'More information required') || (this.scope === 'final' && !isPending(app))) &&
      (!this.risk || this.workflow.riskFor(latestAssessment(app)) === this.risk) && (!query || [app.id, app.customerName, app.nationalId].some(x => x.toLowerCase().includes(query))))
      .sort((a, b) => this.sort === 'amount' ? latestAssessment(b).input.amount - latestAssessment(a).input.amount : this.sort === 'score' ? latestAssessment(a).score - latestAssessment(b).score : this.sort === 'priority' ? this.priority(b) - this.priority(a) || a.submittedAt.localeCompare(b.submittedAt) : a.submittedAt.localeCompare(b.submittedAt));
  }
  get pages(): number { return Math.max(1, Math.ceil(this.rows.length / this.pageSize)); }
  get pageRows(): LoanRecord[] { return this.rows.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }
  get selected(): LoanRecord | undefined { return this.apps.find(x => x.id === this.selectedId); }
  get awaiting(): number { return this.apps.filter(x => x.status === 'Awaiting decision').length; }
  get information(): number { return this.apps.filter(x => x.status === 'More information required').length; }
  get finalised(): number { return this.apps.filter(x => !isPending(x)).length; }
  get requiresOverride(): boolean { return !!this.selected && this.workflow.approvalNeedsOverride(latestAssessment(this.selected), this.approvalBasis); }
  get approvalAmount(): number { const a = this.selected ? latestAssessment(this.selected) : undefined; return (this.approvalBasis === 'recommended' ? a?.limit?.recommendedAmount : a?.input.amount) || 0; }
  select(id: string): void { this.selectedId = id; this.note = ''; this.copilotContext = ''; this.decisionErrors = []; this.reviewed = false; this.override = false; this.confirmation = null; this.error = ''; this.message = ''; }
  begin(action: 'Approve' | 'Decline' | 'Request information'): void {
    if (!this.selected || !isPending(this.selected)) { return; }
    this.confirmation = action; this.expectedVersion = latestAssessment(this.selected).version; this.error = '';
    this.note = ''; this.reviewed = false; this.copilotContext = ''; this.decisionErrors = []; this.message = '';
    this.approvalBasis = latestAssessment(this.selected).limit?.offer ? 'recommended' : 'requested'; this.override = false;
    this.focusElement('decision-rationale');
  }
  private focusElement(id: string): void {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => { const element = document.getElementById(id); element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); });
    }
  }
  cancelDecision(): void { if (this.busy) { return; } this.confirmation = null; this.decisionErrors = []; this.error = ''; this.copilotContext = ''; }
  get noteLength(): number { return this.note.trim().length; }
  get confirmationLabel(): string { return this.confirmation === 'Approve' ? 'Approve loan' : this.confirmation === 'Decline' ? 'Decline loan' : 'Request information'; }
  confirmDecision(): void {
    const record = this.selected; const action = this.confirmation;
    if (this.busy) { return; }
    this.decisionErrors = []; this.error = ''; this.message = '';
    if (!record || !action) { this.error = 'Choose an application and a decision action before submitting.'; this.decisionErrors = [this.error]; return; }
    if (!isPending(record)) { this.decisionErrors.push('This application is already finalised.'); }
    if (!this.officerRationaleReady) { this.decisionErrors.push('Add your own evidence and rationale of at least 10 characters.'); }
    if (this.noteLength > 2000) { this.decisionErrors.push('Keep the officer rationale within 2,000 characters.'); }
    if (!this.reviewed) { this.decisionErrors.push('Confirm that you reviewed the latest assessment before recording an action.'); }
    if (action === 'Approve' && record.status === 'More information required') { this.decisionErrors.push('Reassess the application after receiving the requested information before approval.'); }
    if (action === 'Approve' && this.requiresOverride && (!this.override || this.noteLength < 20)) { this.decisionErrors.push('Acknowledge the recommendation override and explain the exception in at least 20 characters.'); }
    if (this.decisionErrors.length) { this.error = this.decisionErrors.join(' '); this.focusElement('decision-feedback'); return; }
    this.busy = true;
    try {
      const saved = this.workflow.decide(record.id, action, this.note, this.expectedVersion, this.override, this.approvalBasis);
      this.message = action === 'Request information' ? 'Information request saved. Reassess this application after receiving the evidence.' : 'Officer decision saved and reflected in Applications.';
      if (action === 'Approve') { this.message = 'Approval of ' + this.workflow.money(saved.approvedAmount!) + ' saved. The original request and assessed offer remain in the history.'; }
      this.confirmation = null; this.note = ''; this.copilotContext = ''; this.reviewed = false; this.override = false;
      this.focusElement('decision-result');
    } catch (error) { this.error = this.workflow.errorMessage(error); this.decisionErrors = [this.error]; this.focusElement('decision-feedback'); }
    finally { this.busy = false; }
  }
  outstanding(record: LoanRecord): string {
    const requests = record.history.filter(x => x.action === 'Request information');
    if (record.status === 'More information required' && requests.length) { return requests[requests.length - 1].informationRequested; }
    return latestAssessment(record).eligibility?.reasons[0] || latestAssessment(record).ai?.actions[0] || latestAssessment(record).reasons.join('; ');
  }
  priority(record: LoanRecord): number { const risk = this.workflow.riskFor(latestAssessment(record)); return record.status === 'More information required' ? 4 : risk === 'High' ? 3 : risk === 'Medium' ? 2 : 1; }
  get officerRationaleReady(): boolean { return this.noteLength >= 10 && (!this.copilotContext || this.note.trim() !== this.copilotContext.trim()); }
  draftNote(): void {
    if (!this.selected) { return; }
    const a = latestAssessment(this.selected);
    this.copilotContext = 'Model and source scorecard: ' + (a.ai?.summary || a.reasons.join('; '))
      + (a.eligibility ? '\nCustomer eligibility: ' + a.eligibility.decision + '. ' + a.eligibility.reasons.join('; ') : '')
      + (a.limit ? '\nFacility recommendation: ' + this.workflow.limitSummary(a) : '');
  }
  get canOpenNext(): boolean { return this.rows.some(x => x.id !== this.selectedId && isPending(x)); }
  nextCase(): void { const next = this.rows.find(x => x.id !== this.selectedId && isPending(x)); if (next) { this.select(next.id); } }
  track(_index: number, record: LoanRecord): string { return record.id; }
}
