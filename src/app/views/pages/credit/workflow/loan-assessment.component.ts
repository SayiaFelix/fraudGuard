import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { LoanAssessment, LoanCheck, LoanRiskDriver, LoanScenario } from './loan-workflow.models';
import { LoanWorkflowService } from './loan-workflow.service';
import { LoanProductSuggestion } from './loan-product-recommender';
import { GroqService } from '../../../../shared/services/groq.service';

let nextDriverPopoverId = 0;

@Component({ selector: 'app-loan-assessment', templateUrl: './loan-assessment.component.html', styleUrls: ['./loan-workflow.scss'] })
export class LoanAssessmentComponent implements OnChanges, OnDestroy {
  @Input() assessment: LoanAssessment;
  @Input() applicationId = '';
  productSuggestions: LoanProductSuggestion[] = [];
  grokBrief = '';
  copilotState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  copilotError = '';
  activeTab: 'insights' | 'drivers' | 'policy' | 'profile' = 'insights';
  readonly tabs = [{ id: 'insights', label: 'AI overview' }, { id: 'drivers', label: 'Explainable outlook' }, { id: 'policy', label: 'Policy checks' }, { id: 'profile', label: 'Customer & facility' }] as const;
  scenarioAmount = 10000; scenarioTenor = 12; scenario: LoanScenario | null = null; scenarioError = '';
  activeDriverLabel = '';
  readonly driverPopoverId = 'risk-driver-explanation-' + ++nextDriverPopoverId;
  readonly copilotContentId = 'credit-copilot-' + this.driverPopoverId;
  private destroyed = false;
  private copilotRequest = 0;
  private copilotWait: { timer: ReturnType<typeof setTimeout>; resolve: () => void } | null = null;
  @ViewChild('driverPopover') private driverPopover?: ElementRef<HTMLDivElement>;
  driverPopoverReady = false;
  driverPopoverLeft = 12; driverPopoverTop = 12;
  driverPopoverMaxHeight = 418;
  driverArrowLeft = 20; driverArrowTop = 20;
  private driverAnchor?: HTMLElement;
  private driverFrame = 0;
  private driverDismissTimer?: ReturnType<typeof setTimeout>;
  private readonly driverScroll = (event: Event) => {
    if (!this.driverPopover?.nativeElement.contains(event.target as Node)) { this.queueDriverPosition(); }
  };
  constructor(public workflow: LoanWorkflowService, private groq: GroqService, private changeDetector?: ChangeDetectorRef) {}
  readonly MathAbs = Math.abs;
  ngOnChanges(): void {
    this.hideDriver(); this.resetCopilot(); this.resetScenario(); this.activeTab = 'insights';
  }
  ngOnDestroy(): void { this.destroyed = true; this.hideDriver(); this.resetCopilot(); }
  selectTab(tab: typeof this.activeTab): void {
    this.hideDriver();
    if (tab !== 'insights' && this.copilotState === 'loading') { this.resetCopilot(); }
    this.activeTab = tab;
  }
  async loadCopilot(): Promise<void> {
    if (this.destroyed || !this.assessment?.ai || this.copilotState === 'loading') { return; }
    if (this.copilotState === 'ready') { this.resetCopilot(); return; }
    const request = ++this.copilotRequest;
    this.copilotState = 'loading'; this.copilotError = ''; this.productSuggestions = []; this.grokBrief = '';
    try {
      const [brief, suggestions] = await Promise.all([
        this.groq.chat(
          'You are a credit officer briefing writer. Write one short paragraph, in plain language, about this application. Use only the facts given. Do not include a national ID, phone number, or account number. Do not say you are approving the loan. No HTML.',
          [{ role: 'user', content: this.copilotFacts() }]
        ).catch(() => ''),
        Promise.resolve(this.workflow.productSuggestions(this.assessment))
      ]);
      if (this.destroyed || request !== this.copilotRequest) { return; }
      this.grokBrief = brief;
      this.productSuggestions = suggestions;
      this.copilotState = 'ready';
    } catch (error) {
      if (!this.destroyed && request === this.copilotRequest) {
        this.copilotError = this.workflow.errorMessage(error); this.copilotState = 'error';
      }
    }
  }
  private resetCopilot(): void {
    ++this.copilotRequest;
    const pending = this.copilotWait; this.copilotWait = null;
    if (pending) { clearTimeout(pending.timer); pending.resolve(); }
    this.copilotState = 'idle'; this.copilotError = ''; this.productSuggestions = []; this.grokBrief = '';
  }
  get ai() { return this.assessment.ai; }
  get customer() { return this.assessment.eligibility?.customer; }
  get eligibilityPassed(): number { return this.assessment.eligibility?.checks.filter(c => c.result === 'Pass').length || 0; }
  get reviewActions(): string[] { return [...(this.assessment.eligibility?.reasons.map(x => 'Resolve customer eligibility finding — ' + x + '.') || []), ...(this.ai?.actions || [])].slice(0, 3); }
  get copilotBrief(): string {
    if (this.grokBrief) return this.grokBrief;
    const a = this.assessment;
    if (a.automaticApproval?.eligible) { return this.workflow.money(a.input.amount) + ' approved automatically. All required checks passed.'; }
    if (!a.limit?.offer) { return 'This request needs review. Resolve the policy or affordability findings before selecting an offer.'; }
    return (a.ai?.risk || a.risk) + ' risk. ' + this.workflow.money(a.limit.recommendedAmount) +
      ' proposed against the ' + this.workflow.money(a.input.amount) + ' request. ' +
      (a.eligibility?.decision === 'Approved' ? 'Customer eligibility checks passed.' : 'Review the outstanding policy findings.');
  }
  private copilotFacts(): string {
    const a = this.assessment;
    const checks = (a.eligibility?.checks || []).map(check => `${check.code} ${check.result}`);
    return [
      `Product ${a.input.product}. Requested ${this.workflow.money(a.input.amount)} over ${a.input.tenorMonths} months.`,
      `Monthly income ${this.workflow.money(a.input.income)}. Employment ${a.input.employment}. Bureau ${a.input.bureau}.`,
      `Score ${a.score}. Risk ${a.ai?.risk || a.risk}.`,
      `Recommendation ${this.workflow.recommendationLabel(a)}.`,
      `Debt service ${(a.affordability.dti * 100).toFixed(1)}%.`,
      a.limit ? `Limit outcome ${a.limit.outcome}. Proposed ${this.workflow.money(a.limit.recommendedAmount)}.` : 'No limit snapshot.',
      `Eligibility ${a.eligibility?.decision || 'not recorded'}.`,
      `Reasons: ${(a.reasons || []).join('; ') || 'none'}.`,
      `Checks: ${checks.join('; ') || 'none'}.`,
      a.automaticApproval?.eligible ? 'The small-loan policy marked this eligible for automatic routing.' : 'Automatic routing does not apply.'
    ].join('\n');
  }
  suggestionParams(suggestion: LoanProductSuggestion): Record<string, string | number> {
    return { customer: this.assessment.input.nationalId, product: suggestion.product, amount: suggestion.amount,
      tenor: suggestion.tenorMonths, sourceApplication: this.applicationId, sourceVersion: this.assessment.version };
  }
  verification(value: boolean | null | undefined): string { return value === true ? 'Verified' : value === false ? 'Not verified' : 'Unknown'; }
  get outlookDrivers(): Array<LoanRiskDriver & { checks: LoanCheck[]; observed: string }> {
    const groups: Record<string, string[]> = { 'Bureau outlook': ['EL-03', 'EL-05'], 'Repayment burden': ['EL-06'], 'Loan-to-income exposure': ['EL-04'], 'Employment profile': ['EL-07'] };
    const a = this.assessment;
    const observed: Record<string, string> = {
      'Bureau outlook': a.input.bureau, 'Repayment burden': (a.affordability.dti * 100).toFixed(1) + '% debt service / income',
      'Loan-to-income exposure': (a.input.amount / (a.input.income * 12) * 100).toFixed(1) + '% of annualised income',
      'Employment profile': a.input.employment, 'Income capacity': this.workflow.money(a.input.income) + ' / month',
      'Repayment term': a.input.tenorMonths + ' months'
    };
    return (this.ai?.drivers || []).map(d => ({ ...d, observed: observed[d.label] || '', checks: (a.eligibility?.checks || []).filter(c => (groups[d.label] || []).includes(c.code)) }));
  }
  get identityChecks(): LoanCheck[] { return (this.assessment.eligibility?.checks || []).filter(c => ['EL-01', 'EL-02'].includes(c.code)); }
  get rankedDrivers() {
    const drivers = this.outlookDrivers.slice().sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp));
    const total = drivers.reduce((sum, d) => sum + Math.abs(d.deltaPp), 0);
    return drivers.map((driver, i) => ({ ...driver, rank: i + 1, share: total ? Math.abs(driver.deltaPp) / total * 100 : 0 }));
  }
  get activeGraphDriver() { return this.rankedDrivers.find(d => d.label === this.activeDriverLabel); }
  showDriver(label: string, anchor?: HTMLElement): void {
    this.keepDriverOpen();
    if (label !== this.activeDriverLabel) { this.driverPopoverReady = false; }
    this.activeDriverLabel = label;
    if (!anchor) { return; }
    this.driverAnchor = anchor;
    document.addEventListener('scroll', this.driverScroll, true);
    this.queueDriverPosition();
  }
  keepDriverOpen(): void { clearTimeout(this.driverDismissTimer); }
  scheduleDriverClose(): void {
    this.keepDriverOpen();
    this.driverDismissTimer = setTimeout(() => this.hideDriver(), 180);
  }
  hideDriver(): void {
    this.keepDriverOpen();
    if (typeof window !== 'undefined') { window.cancelAnimationFrame?.(this.driverFrame); }
    if (typeof document !== 'undefined') { document.removeEventListener('scroll', this.driverScroll, true); }
    this.driverFrame = 0; this.driverAnchor = undefined;
    this.activeDriverLabel = ''; this.driverPopoverReady = false;
  }
  @HostListener('document:keydown.escape') dismissDriver(): void { this.hideDriver(); }
  @HostListener('document:pointerdown', ['$event']) dismissDriverOutside(event: PointerEvent): void {
    const target = event.target as Node;
    if (this.driverAnchor && !this.driverAnchor.contains(target) && !this.driverPopover?.nativeElement.contains(target)) { this.hideDriver(); }
  }
  @HostListener('window:resize') queueDriverPosition(): void {
    if (!this.driverAnchor || this.driverFrame) { return; }
    this.driverFrame = window.requestAnimationFrame(() => {
      this.driverFrame = 0; this.positionDriver(); this.changeDetector?.detectChanges();
    });
  }
  private positionDriver(): void {
    const anchor = this.driverAnchor, popup = this.driverPopover?.nativeElement;
    if (!anchor || !popup || !anchor.isConnected) { this.hideDriver(); return; }
    const rect = anchor.getBoundingClientRect(), inset = 12, gap = 12;
    const viewportWidth = document.documentElement.clientWidth, viewportHeight = window.innerHeight;
    if (rect.bottom <= inset || rect.top >= viewportHeight - inset || rect.right <= inset || rect.left >= viewportWidth - inset) { this.hideDriver(); return; }
    const width = popup.getBoundingClientRect().width;
    const content = popup.querySelector<HTMLElement>('.risk-tooltip-content')!;
    const maxHeight = Math.min(420, viewportHeight - inset * 2);
    const naturalHeight = Math.min(content.scrollHeight + 2, maxHeight);
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));
    let height = naturalHeight, left: number, top: number;
    if (viewportWidth - rect.right - gap - inset >= width || rect.left - gap - inset >= width) {
      const right = viewportWidth - rect.right - gap - inset >= width;
      left = right ? rect.right + gap : rect.left - gap - width;
      top = clamp(rect.top + (rect.height - height) / 2, inset, viewportHeight - height - inset);
      this.driverArrowLeft = right ? -5 : width - 7;
      this.driverArrowTop = clamp(rect.top + rect.height / 2 - top - 6, 16, height - 28);
    } else {
      const above = rect.top - gap - inset, below = viewportHeight - rect.bottom - gap - inset;
      const useAbove = above >= height || above >= below;
      height = Math.min(height, Math.max(60, useAbove ? above : below));
      left = clamp(rect.left + (rect.width - width) / 2, inset, viewportWidth - width - inset);
      top = clamp(useAbove ? rect.top - gap - height : rect.bottom + gap, inset, viewportHeight - height - inset);
      this.driverArrowLeft = clamp(rect.left + rect.width / 2 - left - 6, 16, width - 28);
      this.driverArrowTop = useAbove ? height - 7 : -5;
    }
    this.driverPopoverMaxHeight = Math.max(40, height - 2);
    this.driverPopoverLeft = Math.round(left); this.driverPopoverTop = Math.round(top);
    this.driverPopoverReady = true;
  }
  trackDriver(_index: number, driver: LoanRiskDriver): string { return driver.label; }
  get riskBackground(): string {
    const color = this.ai?.risk === 'High' ? '#df6685' : this.ai?.risk === 'Medium' ? '#dc9d41' : '#416ef0';
    return 'conic-gradient(' + color + ' ' + ((this.ai?.probability || 0) * 360) + 'deg, #edf0f8 0deg)';
  }
  get maxAmount(): number { return Math.max(10000, Math.ceil(this.assessment.input.amount * 1.25 / 5000) * 5000); }
  get scenarioStep(): number { return this.assessment.input.amount <= 10000 ? 1 : 1000; }
  get maxDriver(): number { return Math.max(1, ...(this.ai?.drivers.map(x => Math.abs(x.deltaPp)) || [1])); }
  resetScenario(): void {
    if (!this.assessment) { return; }
    this.scenarioAmount = this.assessment.input.amount; this.scenarioTenor = this.assessment.input.tenorMonths;
    this.scenario = null; this.scenarioError = '';
  }
  updateScenario(field: 'amount' | 'tenor', value: number): void {
    if (field === 'amount') { this.scenarioAmount = value; } else { this.scenarioTenor = value; }
    this.runScenario();
  }
  runScenario(): void {
    try { this.scenario = this.workflow.previewScenario(this.assessment, this.scenarioAmount, this.scenarioTenor); this.scenarioError = ''; }
    catch (error) { this.scenario = null; this.scenarioError = this.workflow.errorMessage(error); }
  }
  preset(kind: 'smaller' | 'longer' | 'recommended'): void {
    const increment = this.assessment.input.amount <= 10000 ? 1 : 1000;
    this.scenarioAmount = kind === 'recommended' && this.assessment.limit?.offer ? this.assessment.limit.recommendedAmount : kind === 'smaller' ? Math.max(1, Math.floor(this.assessment.input.amount * 0.8 / increment) * increment) : this.assessment.input.amount;
    this.scenarioTenor = kind === 'longer' ? Math.min(60, this.assessment.input.tenorMonths + 6) : this.assessment.input.tenorMonths;
    this.runScenario();
  }
  bar(impact: number): number { return Math.abs(impact) / Math.max(1, ...this.assessment.contributions.map(x => Math.abs(x.impact))) * 100; }
}
