import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuditEvent, CreditApplication, DEFAULT_POLICY, PolicySettings } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { downloadCsv, eventAppId, limitEvents } from '../ops/credit-ops';

type AuditFamily = 'All' | 'Approvals' | 'Declines' | 'Referrals' | 'Case work' | 'Scorecard' | 'Limit changes' | 'Controls';
type AuditWindow = 'All' | 'Today' | 'Decision day';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html'
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  readonly families: AuditFamily[] = ['All', 'Approvals', 'Declines', 'Referrals', 'Case work', 'Scorecard', 'Limit changes', 'Controls'];
  readonly windows: AuditWindow[] = ['All', 'Today', 'Decision day'];
  readonly appId = eventAppId;

  events: AuditEvent[] = [];
  visible: AuditEvent[] = [];
  family: AuditFamily = 'All';
  window: AuditWindow = 'All';
  onlyReview = false;
  actor = 'All';
  reviewNote = '';
  banner = '';
  private reviewed = new Set<string>();
  query = '';
  page = 1;
  pageSize = 8;
  selectedId = '';
  actors: string[] = [];
  policy: PolicySettings = DEFAULT_POLICY;
  private ledger: AuditEvent[] = [];
  private apps: CreditApplication[] = [];
  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public credit: CreditDataService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.credit.policy$.subscribe(policy => this.policy = policy));
    this.sub.add(this.credit.applications$.subscribe(apps => {
      this.apps = apps;
      this.rebuild();
    }));
    this.sub.add(this.credit.audit$.subscribe(events => {
      this.ledger = events;
      this.rebuild();
    }));
    this.sub.add(this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const app = params.get('app');
      if (app) this.query = app;
      if (id) this.selectedId = id;
      this.page = 1;
      this.apply();
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get selected(): AuditEvent | null {
    return this.events.find(event => event.id === this.selectedId) || null;
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }

  get pageRows(): AuditEvent[] {
    const start = (this.page - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }

  count(family: AuditFamily): number {
    if (family === 'All') return this.events.length;
    return this.events.filter(event => this.kind(event) === family).length;
  }

  get scorecardCount(): number {
    return this.count('Scorecard');
  }

  get analystCount(): number {
    return this.events.filter(event => !this.isMachine(event)).length;
  }

  get overrideCount(): number {
    return this.events.filter(event => this.isOverride(event)).length;
  }

  get openReviews(): number {
    return this.events.filter(event => this.needsReview(event)).length;
  }

  setFamily(family: AuditFamily): void {
    this.family = family;
    this.page = 1;
    this.apply();
  }

  setWindow(window: AuditWindow): void {
    this.window = window;
    this.page = 1;
    this.apply();
  }

  toggleReview(): void {
    this.onlyReview = !this.onlyReview;
    this.page = 1;
    this.apply();
  }

  onSearch(value: string): void {
    this.query = value;
    this.page = 1;
    this.apply();
  }

  onActor(value: string): void {
    this.actor = value;
    this.page = 1;
    this.apply();
  }

  select(event: AuditEvent): void {
    this.selectedId = event.id;
  }

  prev(): void { this.page = Math.max(1, this.page - 1); }
  next(): void { this.page = Math.min(this.pages, this.page + 1); }

  isScorecard(event: AuditEvent): boolean {
    return this.isMachine(event);
  }

  linked(event: AuditEvent): CreditApplication | undefined {
    const id = eventAppId(event.detail);
    return id ? this.credit.find(id) : undefined;
  }

  needsReview(event: AuditEvent): boolean {
    return this.isOverride(event) && !this.reviewed.has(event.id) && !/compliance reviewed/i.test(event.action);
  }

  purpose(event: AuditEvent): string {
    const kind = this.kind(event);
    if (kind === 'Limit changes') return 'Servicing. This is why the standing score and the limit moved after repayment.';
    if (kind === 'Scorecard') return 'Origination. The model decided. No officer touched the file.';
    if (kind === 'Approvals' || kind === 'Declines') return 'Override. An officer replaced the scorecard. A regulator will ask for the note.';
    if (kind === 'Controls') return 'Control. Policy, bureau, identity, or a connector changed how decisions are made.';
    if (kind === 'Referrals') return 'Queue. The file was held for a person because policy would not auto-decide.';
    return 'Case work. Assignment, a question to the customer, or an escalation.';
  }

  chain(event: AuditEvent): AuditEvent[] {
    const id = eventAppId(event.detail);
    if (!id) return [event];
    return this.events.filter(item => eventAppId(item.detail) === id || item.detail.includes(id));
  }

  markReviewed(): void {
    const event = this.selected;
    if (!event || !this.reviewNote.trim()) {
      this.banner = 'Write what you checked before you sign the event off.';
      return;
    }
    this.reviewed.add(event.id);
    this.credit.recordControl(
      'Compliance reviewed',
      `${event.id} · ${event.action}. ${this.reviewNote.trim()}`,
      event.decision || 'Policy'
    );
    this.banner = 'Signed off. The review is now its own line on the trail.';
    this.reviewNote = '';
  }

  evidence(): void {
    const event = this.selected;
    if (!event) return;
    const rows = this.chain(event);
    downloadCsv(`eclectics-evidence-${this.appId(event.detail) || event.id}.csv`, ['Id', 'Time', 'Actor', 'Action', 'Decision', 'Detail'], rows.map(item => [
      item.id, item.time, item.actor, item.action, item.decision, item.detail
    ]));
  }

  printView(): void {
    window.print();
  }

  kind(event: AuditEvent): AuditFamily {
    const actor = event.actor.toLowerCase();
    const action = event.action.toLowerCase();
    if (/policy|bureau|disburse|compliance|connector|identity/.test(action)) return 'Controls';
    if (action.includes('limit') || action.includes('standing score') || action.includes('repay')) return 'Limit changes';
    const machine = actor.includes('scorecard') || actor.includes('decision rule');
    if (action.includes('refer')) return 'Referrals';
    if (action.includes('approv') && machine) return 'Scorecard';
    if (action.includes('approv')) return 'Approvals';
    if (action.includes('declin')) return 'Declines';
    if (machine) return 'Scorecard';
    return 'Case work';
  }

  decisionTone(decision: string): string {
    if (decision === 'Approved') return 'ok';
    if (decision === 'Declined') return 'bad';
    if (decision === 'Policy') return 'review';
    return 'refer';
  }

  download(): void {
    downloadCsv('eclectics-audit.csv', ['Id', 'Time', 'Actor', 'Action', 'Decision', 'Detail', 'Family'], this.visible.map(event => [
      event.id, event.time, event.actor, event.action, event.decision, event.detail, this.kind(event)
    ]));
  }

  private rebuild(): void {
    const generated = limitEvents(this.apps);
    this.events = [...generated, ...this.ledger].sort((a, b) => b.time.localeCompare(a.time));
    this.actors = Array.from(new Set(this.events.map(event => event.actor)));
    this.apply();
  }

  private apply(): void {
    const needle = this.query.trim().toLowerCase();
    const list = this.events.filter(event => {
      if (this.family !== 'All' && this.kind(event) !== this.family) return false;
      if (!this.matchesWindow(event)) return false;
      if (this.onlyReview && !this.needsReview(event)) return false;
      if (this.actor !== 'All' && event.actor !== this.actor) return false;
      if (!needle) return true;
      return [event.id, event.actor, event.action, event.detail, event.decision].join(' ').toLowerCase().includes(needle);
    });
    this.visible = list;
    const pages = Math.max(1, Math.ceil(list.length / this.pageSize));
    if (this.page > pages) this.page = 1;
    if (!list.some(event => event.id === this.selectedId)) this.selectedId = list[0]?.id || '';
  }

  private matchesWindow(event: AuditEvent): boolean {
    if (this.window === 'All') return true;
    const day = event.time.slice(0, 10);
    if (this.window === 'Decision day') return day === '2026-10-23';
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return day === today;
  }

  private isMachine(event: AuditEvent): boolean {
    const actor = event.actor.toLowerCase();
    return actor.includes('scorecard') || actor.includes('decision rule');
  }

  private isOverride(event: AuditEvent): boolean {
    const action = event.action.toLowerCase();
    return !this.isMachine(event) && (action.includes('approv') || action.includes('declin'));
  }
}
