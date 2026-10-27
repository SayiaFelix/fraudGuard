import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuditEvent, CreditApplication, DEFAULT_POLICY, PolicySettings } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import {
  ALERT_SIGNALS,
  AlertSignal,
  BEHAVIOUR_RULES,
  BehaviourStanding,
  CasePriority,
  CycleOutcome,
  OpsCase,
  barWidth,
  buildOpsCase,
  downloadCsv,
  eventAppId,
  explainBehaviour,
  needsOverrideNote,
  opsNarrative,
  priorityTone,
  slaTone,
  statusLabel,
  statusTone
} from '../ops/credit-ops';

type CaseFilter = 'Active' | 'Open' | 'In review' | 'Awaiting information' | 'Escalated' | 'Resolved';
type DeskTab = 'score' | 'application' | 'audit' | 'signals';

@Component({
  selector: 'app-credit-alerts',
  templateUrl: './alerts.component.html'
})
export class AlertsComponent implements OnInit, OnDestroy {
  readonly signals = ALERT_SIGNALS;
  readonly rules = BEHAVIOUR_RULES;
  readonly filters: CaseFilter[] = ['Active', 'Open', 'In review', 'Awaiting information', 'Escalated', 'Resolved'];
  readonly priorities: Array<'All' | CasePriority> = ['All', 'Critical', 'High', 'Medium', 'Low'];
  readonly tone = priorityTone;
  readonly statusTone = statusTone;
  readonly statusLabel = statusLabel;
  readonly slaTone = slaTone;
  readonly barWidth = barWidth;
  readonly narrative = opsNarrative;
  readonly explain = explainBehaviour;

  people: OpsCase[] = [];
  visible: OpsCase[] = [];
  events: AuditEvent[] = [];
  signal: 'All' | AlertSignal = 'All';
  filter: CaseFilter = 'Active';
  priority: 'All' | CasePriority = 'All';
  query = '';
  page = 1;
  pageSize = 6;
  selectedId = '';
  tab: DeskTab = 'score';
  policy: PolicySettings = DEFAULT_POLICY;
  assignee = 'Demo User';
  note = '';
  banner = '';
  bannerTone: 'ok' | 'bad' = 'ok';
  pulse: 'up' | 'down' | '' = '';
  private requestedId = '';
  private focused = false;
  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public credit: CreditDataService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.credit.policy$.subscribe(policy => {
      this.policy = policy;
      this.rebuild();
    }));
    this.sub.add(this.credit.applications$.subscribe(apps => this.rebuild(apps)));
    this.sub.add(this.credit.audit$.subscribe(events => this.events = events));
    this.sub.add(this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (!id || id === this.requestedId) return;
      this.requestedId = id;
      this.focused = false;
      this.focusRequested();
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get selected(): OpsCase | null {
    return this.people.find(row => row.app.id === this.selectedId) || null;
  }

  get standing(): BehaviourStanding | null {
    return this.selected ? explainBehaviour(this.selected.app) : null;
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }

  get pageRows(): OpsCase[] {
    const start = (this.page - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }

  get recentEvents(): AuditEvent[] {
    return this.events.slice(0, 4);
  }

  get activeCases(): OpsCase[] {
    return this.people.filter(row => row.app.decision === 'Refer' && row.app.caseStatus !== 'Closed');
  }

  count(filter: CaseFilter): number {
    return this.people.filter(row => this.matchesFilter(row, filter)).length;
  }

  signalCount(signal: 'All' | AlertSignal): number {
    return this.activeCases.filter(row => signal === 'All' || row.signals.includes(signal)).length;
  }

  statusCount(status: 'New' | 'In review' | 'Escalated' | 'Closed'): number {
    return this.people.filter(row => row.app.caseStatus === status).length;
  }

  get breachedCount(): number {
    return this.activeCases.filter(row => row.breached).length;
  }

  get exposure(): number {
    return this.activeCases.reduce((sum, row) => sum + row.app.amount, 0);
  }

  track(score: number): number {
    return Math.max(0, Math.min(100, ((score - 300) / 600) * 100));
  }

  signed(value: number): string {
    if (value > 0) return `+${value}`;
    return String(value);
  }

  setFilter(filter: CaseFilter): void {
    this.filter = filter;
    this.page = 1;
    this.apply();
  }

  setSignal(signal: 'All' | AlertSignal): void {
    this.signal = signal;
    this.page = 1;
    this.apply();
  }

  setPriority(value: string): void {
    if (value === 'All' || value === 'Critical' || value === 'High' || value === 'Medium' || value === 'Low') {
      this.priority = value;
    }
    this.page = 1;
    this.apply();
  }

  onSearch(value: string): void {
    this.query = value;
    this.page = 1;
    this.apply();
  }

  jump(event: AuditEvent): void {
    const id = eventAppId(event.detail);
    const match = id ? this.people.find(row => row.app.id === id) : undefined;
    if (!match) {
      this.onSearch(id || event.action);
      return;
    }
    this.filter = match.app.caseStatus === 'Closed' ? 'Resolved' : 'Active';
    this.signal = 'All';
    this.priority = 'All';
    this.query = '';
    this.page = 1;
    this.selectedId = match.app.id;
    this.tab = 'score';
    this.apply();
  }

  select(row: OpsCase): void {
    this.selectedId = row.app.id;
    this.banner = '';
    this.pulse = '';
    this.tab = 'score';
  }

  prev(): void { this.page = Math.max(1, this.page - 1); }
  next(): void { this.page = Math.min(this.pages, this.page + 1); }

  openCase(): boolean {
    const row = this.selected;
    return !!row && row.app.decision === 'Refer' && row.app.caseStatus !== 'Closed';
  }

  overrideRequired(app: CreditApplication): boolean {
    return needsOverrideNote(app, this.policy);
  }

  caseEvents(id: string): AuditEvent[] {
    return this.events.filter(event => eventAppId(event.detail) === id || event.detail.includes(id));
  }

  act(action: 'approve' | 'decline' | 'request-info' | 'escalate' | 'assign' | 'note'): void {
    const row = this.selected;
    if (!row) return;
    const needsNote = this.policy.makerChecker || this.overrideRequired(row.app);
    if ((action === 'approve' || action === 'decline') && needsNote && !this.note.trim()) {
      this.banner = this.policy.makerChecker
        ? 'Add a case note. Maker-checker is on, so an officer decision needs a written reason.'
        : 'Add a case note. This decision overrides the scorecard.';
      this.bannerTone = 'bad';
      return;
    }
    if (action === 'note' && !this.note.trim()) return;
    if (action === 'approve' || action === 'decline') this.filter = 'Resolved';
    this.credit.applyCaseAction(row.app.id, action, { note: this.note, assignee: this.assignee });
    const labels = {
      approve: 'Approved and marked resolved. The book counts moved with it.',
      decline: 'Declined and marked resolved. The audit trail has the decision.',
      'request-info': 'Case is awaiting information.',
      escalate: 'Escalated to the credit committee.',
      assign: `Assigned to ${this.assignee}. The case is in review.`,
      note: 'Note added to the case.'
    };
    this.banner = labels[action];
    this.bannerTone = 'ok';
    this.note = '';
  }

  record(outcome: CycleOutcome): void {
    const row = this.selected;
    const before = this.standing?.standingScore;
    if (!row || before === undefined) return;
    const next = this.credit.recordActivity(row.app.id, outcome);
    if (!next) return;
    const delta = next.standingScore - before;
    this.pulse = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
    const move = delta > 0 ? `rose ${delta}` : delta < 0 ? `fell ${Math.abs(delta)}` : 'stayed put';
    this.banner = outcome === 'On time'
      ? `On-time repayment posted. Standing score ${move} to ${next.standingScore}. Limit is now ${this.credit.money(next.standingLimit)}.`
      : outcome === 'Late'
        ? `Late payment posted. Standing score ${move} to ${next.standingScore}. Limit is now ${this.credit.money(next.standingLimit)}.`
        : `Default posted. Standing score ${move} to ${next.standingScore}. Limit is now ${this.credit.money(next.standingLimit)}.`;
    this.bannerTone = delta < 0 ? 'bad' : 'ok';
    this.tab = 'score';
  }

  download(): void {
    downloadCsv(
      'eclectics-alerts-cases.csv',
      ['Applicant', 'Reference', 'Product', 'Priority', 'Signals', 'Status', 'Amount', 'Origination score', 'Standing score', 'Score change', 'Owner'],
      this.visible.map(row => {
        const standing = explainBehaviour(row.app);
        return [
          row.app.applicant,
          row.app.id,
          row.app.product,
          row.priority,
          row.signals.join('; '),
          statusLabel(row.app.caseStatus),
          row.app.amount,
          standing.openingScore,
          standing.standingScore,
          standing.scoreDelta,
          row.app.assignedTo
        ];
      })
    );
  }

  private rebuild(apps?: CreditApplication[]): void {
    const source = apps || this.credit.applications;
    this.people = source.map(app => buildOpsCase(app, this.policy));
    this.apply();
    this.focusRequested();
  }

  private focusRequested(): void {
    if (!this.requestedId || this.focused) return;
    const match = this.people.find(row => row.app.id === this.requestedId);
    if (!match) return;
    this.selectedId = match.app.id;
    this.filter = match.app.caseStatus === 'Closed' ? 'Resolved' : 'Active';
    this.signal = 'All';
    this.priority = 'All';
    this.focused = true;
    this.tab = 'score';
    this.apply();
  }

  private apply(): void {
    const needle = this.query.trim().toLowerCase();
    const rank: Record<CasePriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const list = this.people.filter(row => {
      if (!this.matchesFilter(row, this.filter)) return false;
      if (this.signal !== 'All' && !row.signals.includes(this.signal)) return false;
      if (this.priority !== 'All' && row.priority !== this.priority) return false;
      if (!needle) return true;
      const app = row.app;
      return [app.applicant, app.id, app.product, app.country, app.assignedTo, row.signals.join(' ')].join(' ').toLowerCase().includes(needle);
    });
    list.sort((a, b) => rank[a.priority] - rank[b.priority] || b.ageMs - a.ageMs);
    this.visible = list;
    const pages = Math.max(1, Math.ceil(list.length / this.pageSize));
    if (this.page > pages) this.page = 1;
    if (!list.some(row => row.app.id === this.selectedId)) this.selectedId = list[0]?.app.id || '';
  }

  private matchesFilter(row: OpsCase, filter: CaseFilter): boolean {
    const status = row.app.caseStatus;
    if (filter === 'Active') return row.app.decision === 'Refer' && status !== 'Closed';
    if (filter === 'Open') return status === 'New';
    if (filter === 'Resolved') return status === 'Closed';
    return status === filter;
  }
}
