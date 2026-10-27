import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CreditApplication, DEFAULT_POLICY, PolicySettings, PortfolioSummary, PORTFOLIO_SUMMARY } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { BehaviourStanding, BEHAVIOUR_RULES, buildOpsCase, chartScale, downloadCsv, explainBehaviour, OpsCase } from '../ops/credit-ops';

type ReportId = 'summary' | 'distribution' | 'outcomes' | 'exceptions' | 'turnaround' | 'limits';

interface MixRow { name: string; count: number; approved: number; amount: number; rate: number; share: number; }
interface CompareRow { measure: string; book: string; bookSub: string; file: string; fileSub: string; }
interface Bar { label: string; value: number; color: string; height: number; }
interface ExceptionCard { name: string; detail: string; count: number; amount: number; }

@Component({
  selector: 'app-credit-reports',
  templateUrl: './credit-reports.component.html'
})
export class CreditReportsComponent implements OnInit, OnDestroy {
  @Input() embedded = false;

  readonly reports: Array<{ id: ReportId; name: string }> = [
    { id: 'summary', name: 'Summary' },
    { id: 'distribution', name: 'Distribution' },
    { id: 'outcomes', name: 'Outcomes' },
    { id: 'exceptions', name: 'Exceptions' },
    { id: 'turnaround', name: 'Turnaround' },
    { id: 'limits', name: 'Limits' }
  ];
  readonly behaviourRules = BEHAVIOUR_RULES;

  active: ReportId = 'summary';
  product = 'All';
  country = 'All';
  chartMode: 'worklist' | 'book' = 'worklist';
  summary: PortfolioSummary = PORTFOLIO_SUMMARY;
  policy: PolicySettings = DEFAULT_POLICY;
  file: CreditApplication[] = [];
  ops: OpsCase[] = [];
  compare: CompareRow[] = [];
  bars: Bar[] = [];
  ticks: number[] = [4, 3, 2, 1, 0];
  mixes: Array<{ title: string; rows: MixRow[] }> = [];
  reasons: Array<{ name: string; count: number }> = [];
  exceptions: ExceptionCard[] = [];
  exceptionRows: Array<{ app: CreditApplication; hits: string }> = [];
  movements: Array<{ app: CreditApplication; standing: BehaviourStanding }> = [];
  movementBars: Bar[] = [];
  movementTicks: number[] = [4, 3, 2, 1, 0];
  private all: CreditApplication[] = [];
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.summary$.subscribe(summary => {
      this.summary = summary;
      this.compose();
    }));
    this.sub.add(this.credit.policy$.subscribe(policy => {
      this.policy = policy;
      this.compose();
    }));
    this.sub.add(this.credit.applications$.subscribe(apps => {
      this.all = apps;
      this.compose();
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  setProduct(value: string): void { this.product = value; this.compose(); }
  setCountry(value: string): void { this.country = value; this.compose(); }
  setChart(mode: 'worklist' | 'book'): void { this.chartMode = mode; this.compose(); }

  get referredFile(): CreditApplication[] {
    return this.file.filter(app => app.decision === 'Refer' && app.caseStatus !== 'Closed');
  }

  get fileAmount(): number {
    return this.file.reduce((sum, app) => sum + app.amount, 0);
  }

  get referredAmount(): number {
    return this.referredFile.reduce((sum, app) => sum + app.amount, 0);
  }

  countDecision(decision: CreditApplication['decision']): number {
    return this.file.filter(app => app.decision === decision).length;
  }

  amountDecision(decision: CreditApplication['decision']): number {
    return this.file.filter(app => app.decision === decision).reduce((sum, app) => sum + app.amount, 0);
  }

  get openOps(): OpsCase[] {
    return this.ops.filter(item => item.app.decision === 'Refer' && item.app.caseStatus !== 'Closed');
  }

  get withinSla(): number {
    return this.openOps.filter(item => !item.breached).length;
  }

  get breached(): number {
    return this.openOps.filter(item => item.breached).length;
  }

  get averageAge(): string {
    if (!this.openOps.length) return '0m';
    const avg = this.openOps.reduce((sum, item) => sum + item.ageMs, 0) / this.openOps.length;
    const hours = Math.round(avg / 3600000);
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`;
  }

  reasonShare(count: number): number {
    const top = this.reasons[0]?.count || 1;
    return (count / top) * 100;
  }

  get oldest(): OpsCase | null {
    return this.openOps.slice().sort((a, b) => b.ageMs - a.ageMs)[0] || null;
  }

  get turnaroundBuckets(): Array<{ label: string; count: number }> {
    const day = 24 * 3600000;
    const within = this.openOps.filter(item => item.ageMs < day).length;
    const mid = this.openOps.filter(item => item.ageMs >= day && item.ageMs < day * 2).length;
    const over = this.openOps.filter(item => item.ageMs >= day * 2).length;
    return [
      { label: 'Within 24h', count: within },
      { label: '24–48h', count: mid },
      { label: 'Over 48h', count: over }
    ];
  }

  get ownerRows(): Array<{ name: string; count: number; breached: number; amount: number }> {
    const map = new Map<string, { count: number; breached: number; amount: number }>();
    this.openOps.forEach(item => {
      const current = map.get(item.app.assignedTo) || { count: 0, breached: 0, amount: 0 };
      current.count += 1;
      current.amount += item.app.amount;
      if (item.breached) current.breached += 1;
      map.set(item.app.assignedTo, current);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, ...value })).sort((a, b) => b.amount - a.amount);
  }

  print(): void {
    window.print();
  }

  download(): void {
    if (this.active === 'summary') {
      downloadCsv('eclectics-portfolio-summary.csv', ['Measure', 'Book', 'This file'], this.compare.map(row => [row.measure, row.book, row.file]));
      return;
    }
    if (this.active === 'distribution') {
      const rows = this.mixes.flatMap(group => group.rows.map(row => [group.title, row.name, row.count, row.rate, row.amount]));
      downloadCsv('eclectics-distribution.csv', ['Slice', 'Name', 'Count', 'Approval %', 'Amount'], rows);
      return;
    }
    if (this.active === 'exceptions') {
      downloadCsv('eclectics-exceptions.csv', ['Reference', 'Applicant', 'Product', 'Score', 'Hits'], this.exceptionRows.map(row => [
        row.app.id, row.app.applicant, row.app.product, row.app.score, row.hits
      ]));
      return;
    }
    if (this.active === 'limits') {
      downloadCsv('eclectics-limit-movement.csv', ['Reference', 'Applicant', 'Origination score', 'Standing score', 'Score change', 'Opening limit', 'Standing limit', 'On time', 'Late', 'Defaults', 'Direction'], this.movements.map(row => [
        row.app.id, row.app.applicant, row.standing.openingScore, row.standing.standingScore, row.standing.scoreDelta, row.standing.openingLimit, row.standing.standingLimit, row.standing.onTime, row.standing.late, row.standing.defaults, row.standing.direction
      ]));
      return;
    }
    downloadCsv(`eclectics-${this.active}.csv`, ['Reference', 'Applicant', 'Product', 'Country', 'Amount', 'Score', 'Decision', 'Case'], this.file.map(row => [
      row.id, row.applicant, row.product, row.country, row.amount, row.score, row.decision, row.caseStatus
    ]));
  }

  private compose(): void {
    this.file = this.all.filter(app =>
      (this.product === 'All' || app.product === this.product) &&
      (this.country === 'All' || app.country === this.country)
    );
    this.ops = this.file.map(app => buildOpsCase(app, this.policy));
    this.compare = this.buildCompare();
    this.bars = this.buildBars();
    this.mixes = [
      { title: 'Product', rows: this.mix('product') },
      { title: 'Country', rows: this.mix('country') },
      { title: 'Channel', rows: this.mix('channel') },
      { title: 'Employment', rows: this.mix('employment') }
    ];
    this.reasons = this.buildReasons();
    this.buildExceptions();
    this.buildMovements();
  }

  countDirection(direction: BehaviourStanding['direction']): number {
    return this.movements.filter(row => row.standing.direction === direction).length;
  }

  get averageMove(): number {
    if (!this.movements.length) return 0;
    const total = this.movements.reduce((sum, row) => sum + row.standing.scoreDelta, 0);
    return Math.round(total / this.movements.length);
  }

  private buildCompare(): CompareRow[] {
    const fileTotal = this.file.length || 1;
    const book = this.summary;
    const fileCount = (pick: (app: CreditApplication) => boolean) => this.file.filter(pick).length;
    const line = (measure: string, bookValue: number, bookTotal: number, fileValue: number, bookSub?: string): CompareRow => ({
      measure,
      book: bookValue.toLocaleString('en-KE'),
      bookSub: bookSub || this.credit.pct(bookValue, bookTotal),
      file: String(fileValue),
      fileSub: this.credit.pct(fileValue, fileTotal)
    });
    return [
      line('Applications', book.total, book.total, this.file.length, `${this.credit.pct(book.approved, book.total)} approved`),
      line('Approved', book.approved, book.total, fileCount(app => app.decision === 'Approved')),
      line('Declined', book.declined, book.total, fileCount(app => app.decision === 'Declined')),
      line('Referred', book.referred, book.total, fileCount(app => app.decision === 'Refer'), `Average score ${book.avgScore}`),
      line('Low risk', book.lowRisk, book.total, fileCount(app => app.risk === 'Low')),
      line('Medium risk', book.mediumRisk, book.total, fileCount(app => app.risk === 'Medium')),
      line('High risk', book.highRisk, book.total, fileCount(app => app.risk === 'High'))
    ];
  }

  private buildBars(): Bar[] {
    const source = this.chartMode === 'book'
      ? [
          { label: 'Approved', value: this.summary.approved, color: '#22c55e' },
          { label: 'Referred', value: this.summary.referred, color: '#f59e0b' },
          { label: 'Declined', value: this.summary.declined, color: '#ef4444' }
        ]
      : [
          { label: 'Approved', value: this.countDecision('Approved'), color: '#22c55e' },
          { label: 'Referred', value: this.countDecision('Refer'), color: '#f59e0b' },
          { label: 'Declined', value: this.countDecision('Declined'), color: '#ef4444' }
        ];
    const scale = chartScale(source.map(item => item.value));
    this.ticks = scale.ticks;
    return source.map(item => ({ ...item, height: scale.max ? Math.max(item.value ? 4 : 0, (item.value / scale.max) * 100) : 0 }));
  }

  private mix(key: 'product' | 'country' | 'channel' | 'employment'): MixRow[] {
    const map = new Map<string, { count: number; approved: number; amount: number }>();
    this.file.forEach(app => {
      const name = app[key];
      const current = map.get(name) || { count: 0, approved: 0, amount: 0 };
      current.count += 1;
      current.amount += app.amount;
      if (app.decision === 'Approved') current.approved += 1;
      map.set(name, current);
    });
    const rows = Array.from(map.entries()).map(([name, value]) => ({
      name,
      ...value,
      rate: value.count ? Math.round((value.approved / value.count) * 100) : 0,
      share: 0
    }));
    const max = Math.max(1, ...rows.map(row => row.count));
    return rows
      .map(row => ({ ...row, share: Math.round((row.count / max) * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  private buildReasons(): Array<{ name: string; count: number }> {
    const map = new Map<string, number>();
    this.file.forEach(app => app.reasonCodes.forEach(reason => map.set(reason, (map.get(reason) || 0) + 1)));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }

  private buildExceptions(): void {
    const tests: Array<{ name: string; detail: string; test: (app: CreditApplication) => boolean }> = [
      { name: 'Debt service above cap', detail: `DTI over ${Math.round(this.policy.maxDti * 100)}%`, test: app => app.dti > this.policy.maxDti },
      { name: 'Amount above auto-approval', detail: `Above ${this.credit.money(this.policy.maxAmount)}`, test: app => app.amount > this.policy.maxAmount },
      { name: 'Thin credit file', detail: 'No usable bureau history', test: app => app.bureau === 'Thin file' },
      { name: 'Adverse bureau', detail: 'Hard decline unless overridden', test: app => app.bureau === 'Adverse' },
      { name: 'Score below decline cutoff', detail: `Under ${this.policy.declineBelow}`, test: app => app.score < this.policy.declineBelow },
      { name: 'Salary advance tenor', detail: 'Tenor longer than 1 month', test: app => app.product === 'Salary Advance' && app.tenorMonths > 1 }
    ];
    this.exceptions = tests.map(item => {
      const hits = this.file.filter(item.test);
      return { name: item.name, detail: item.detail, count: hits.length, amount: hits.reduce((sum, app) => sum + app.amount, 0) };
    });
    this.exceptionRows = this.file.map(app => ({
      app,
      hits: tests.filter(item => item.test(app)).map(item => item.name).join(', ')
    })).filter(row => row.hits);
  }

  private buildMovements(): void {
    this.movements = this.file
      .map(app => ({ app, standing: explainBehaviour(app) }))
      .sort((a, b) => a.standing.scoreDelta - b.standing.scoreDelta);
    const counts = [
      { label: 'Raised', value: this.countDirection('Raised'), color: '#22c55e' },
      { label: 'Cut', value: this.countDirection('Cut'), color: '#ef4444' },
      { label: 'Unchanged', value: this.countDirection('Unchanged'), color: '#94a3b8' }
    ];
    const scale = chartScale(counts.map(item => item.value));
    this.movementTicks = scale.ticks;
    this.movementBars = counts.map(item => ({
      ...item,
      height: scale.max ? Math.max(item.value ? 4 : 0, (item.value / scale.max) * 100) : 0
    }));
  }
}
