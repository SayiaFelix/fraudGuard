import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuditEvent, CreditApplication, DEFAULT_POLICY, PolicySettings } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import {
  CasePriority,
  OpsCase,
  barWidth,
  buildOpsCase,
  downloadCsv,
  eventAppId,
  explainBehaviour,
  needsOverrideNote,
  opsNarrative,
  priorityTone,
  riskTone,
  slaTone,
  statusLabel,
  statusTone
} from '../ops/credit-ops';

type CaseFilter = 'Active' | 'Open' | 'In review' | 'Awaiting information' | 'Escalated' | 'Resolved';
type CaseSort = 'priority' | 'sla' | 'amount' | 'score';

@Component({
  selector: 'app-credit-case-desk',
  templateUrl: './case-management.component.html'
})
export class CaseManagementComponent implements OnInit, OnDestroy {
  readonly filters: CaseFilter[] = ['Active', 'Open', 'In review', 'Awaiting information', 'Escalated', 'Resolved'];
  readonly priorities: Array<'All' | CasePriority> = ['All', 'Critical', 'High', 'Medium', 'Low'];
  readonly tone = priorityTone;
  readonly statusTone = statusTone;
  readonly statusLabel = statusLabel;
  readonly slaTone = slaTone;
  readonly barWidth = barWidth;
  readonly riskTone = riskTone;
  readonly narrative = opsNarrative;

  cases: OpsCase[] = [];
  visible: OpsCase[] = [];
  events: AuditEvent[] = [];
  filter: CaseFilter = 'Active';
  priority: 'All' | CasePriority = 'All';
  owner = 'All';
  query = '';
  sort: CaseSort = 'priority';
  page = 1;
  pageSize = 5;
  selectedId = '';
  tab: 'score' | 'application' | 'audit' | 'alerts' = 'score';
  policy: PolicySettings = DEFAULT_POLICY;
  assignee = 'Demo User';
  note = '';
  banner = '';
  bannerTone: 'ok' | 'bad' = 'ok';
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
    return this.cases.find(item => item.app.id === this.selectedId) || null;
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }

  get pageRows(): OpsCase[] {
    const start = (this.page - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }

  get activeCases(): OpsCase[] {
    return this.cases.filter(item => item.app.caseStatus !== 'Closed' && item.app.decision === 'Refer');
  }

  get owners(): string[] {
    return Array.from(new Set(this.cases.map(item => item.app.assignedTo)));
  }

  count(filter: CaseFilter): number {
    return this.cases.filter(item => this.matchesFilter(item, filter)).length;
  }

  get openCount(): number {
    return this.activeCases.filter(item => item.app.caseStatus === 'New').length;
  }

  get escalatedCount(): number {
    return this.activeCases.filter(item => item.app.caseStatus === 'Escalated').length;
  }

  get breachedCount(): number {
    return this.activeCases.filter(item => item.breached).length;
  }

  get activeExposure(): number {
    return this.activeCases.reduce((sum, item) => sum + item.app.amount, 0);
  }

  get ageBuckets(): { within: number; mid: number; over: number } {
    const day = 24 * 3600000;
    return this.activeCases.reduce((bucket, item) => {
      if (item.ageMs < day) bucket.within += 1;
      else if (item.ageMs < day * 2) bucket.mid += 1;
      else bucket.over += 1;
      return bucket;
    }, { within: 0, mid: 0, over: 0 });
  }

  get analystLoad(): Array<{ name: string; count: number; amount: number; width: number; color: string }> {
    const colors = ['#2f6bff', '#22d3ee', '#f59e0b', '#22c55e', '#a78bfa'];
    const map = new Map<string, { count: number; amount: number }>();
    this.activeCases.forEach(item => {
      const current = map.get(item.app.assignedTo) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += item.app.amount;
      map.set(item.app.assignedTo, current);
    });
    const rows = Array.from(map.entries()).map(([name, value]) => ({ name, ...value }));
    const max = Math.max(1, ...rows.map(row => row.amount));
    return rows
      .sort((a, b) => b.amount - a.amount)
      .map((row, index) => ({ ...row, width: Math.round((row.amount / max) * 100), color: colors[index % colors.length] }));
  }

  setFilter(filter: CaseFilter): void {
    this.filter = filter;
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

  onOwner(value: string): void {
    this.owner = value;
    this.page = 1;
    this.apply();
  }

  toggleSort(sort: CaseSort): void {
    this.sort = sort;
    this.apply();
  }

  select(item: OpsCase): void {
    this.selectedId = item.app.id;
    this.banner = '';
    this.tab = 'application';
  }

  prev(): void { this.page = Math.max(1, this.page - 1); }
  next(): void { this.page = Math.min(this.pages, this.page + 1); }

  overrideRequired(app: CreditApplication): boolean {
    return needsOverrideNote(app, this.policy);
  }

  caseEvents(id: string): AuditEvent[] {
    return this.events.filter(event => eventAppId(event.detail) === id || event.detail.includes(id));
  }

  act(action: 'approve' | 'decline' | 'request-info' | 'escalate' | 'assign' | 'note'): void {
    const item = this.selected;
    if (!item) return;
    if ((action === 'approve' || action === 'decline') && this.overrideRequired(item.app) && !this.note.trim()) {
      this.banner = 'Add a case note. This decision overrides the scorecard.';
      this.bannerTone = 'bad';
      return;
    }
    if (action === 'note' && !this.note.trim()) return;
    if (action === 'approve' || action === 'decline') this.filter = 'Resolved';
    this.credit.applyCaseAction(item.app.id, action, { note: this.note, assignee: this.assignee });
    const labels = {
      approve: 'Approved. The book referred count moved with it.',
      decline: 'Declined. The decision is on the file and the audit trail.',
      'request-info': 'Marked as awaiting information.',
      escalate: 'Escalated to the credit committee.',
      assign: `Assigned to ${this.assignee}.`,
      note: 'Note added to the case.'
    };
    this.banner = labels[action];
    this.bannerTone = 'ok';
    this.note = '';
  }

  download(): void {
    downloadCsv('eclectics-cases.csv', ['Applicant', 'Reference', 'Product', 'Priority', 'Status', 'SLA', 'Owner', 'Amount', 'Origination score', 'Standing score', 'Score change', 'Opening limit', 'Standing limit'], this.visible.map(item => {
      const standing = explainBehaviour(item.app);
      return [
        item.app.applicant,
        item.app.id,
        item.app.product,
        item.priority,
        item.app.caseStatus,
        `${item.ageLabel} / ${item.slaHours}h`,
        item.app.assignedTo,
        item.app.amount,
        standing.openingScore,
        standing.standingScore,
        standing.scoreDelta,
        standing.openingLimit,
        standing.standingLimit
      ];
    }));
  }

  private rebuild(apps?: CreditApplication[]): void {
    this.cases = (apps || this.credit.applications).map(app => buildOpsCase(app, this.policy));
    this.apply();
    this.focusRequested();
  }

  private focusRequested(): void {
    if (!this.requestedId || this.focused) return;
    const match = this.cases.find(item => item.app.id === this.requestedId);
    if (!match) return;
    this.selectedId = match.app.id;
    this.filter = match.app.caseStatus === 'Closed' ? 'Resolved' : 'Active';
    this.priority = 'All';
    this.focused = true;
    this.apply();
  }

  private apply(): void {
    const needle = this.query.trim().toLowerCase();
    const rank: Record<CasePriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const list = this.cases.filter(item => {
      if (!this.matchesFilter(item, this.filter)) return false;
      if (this.priority !== 'All' && item.priority !== this.priority) return false;
      if (this.owner !== 'All' && item.app.assignedTo !== this.owner) return false;
      if (!needle) return true;
      const app = item.app;
      return [app.applicant, app.id, app.product, app.assignedTo, app.country].join(' ').toLowerCase().includes(needle);
    });
    list.sort((a, b) => {
      if (this.sort === 'amount') return b.app.amount - a.app.amount;
      if (this.sort === 'score') return a.app.score - b.app.score;
      if (this.sort === 'sla') return b.slaRatio - a.slaRatio;
      return rank[a.priority] - rank[b.priority] || b.ageMs - a.ageMs;
    });
    this.visible = list;
    const pages = Math.max(1, Math.ceil(list.length / this.pageSize));
    if (this.page > pages) this.page = 1;
    if (!list.some(item => item.app.id === this.selectedId)) this.selectedId = list[0]?.app.id || '';
  }

  private matchesFilter(item: OpsCase, filter: CaseFilter): boolean {
    const status = item.app.caseStatus;
    if (filter === 'Active') return status !== 'Closed' && item.app.decision === 'Refer';
    if (filter === 'Open') return status === 'New';
    if (filter === 'Resolved') return status === 'Closed';
    return status === filter;
  }
}
