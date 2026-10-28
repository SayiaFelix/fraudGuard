
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { PolicySettings } from '../credit-demo.data';
import {
  CreditDataService,
  SimulationResult
} from '../credit-data.service';

type StudioTab =
  | 'scenario'
  | 'impact'
  | 'migration'
  | 'risk'
  | 'advisor';

type StrategyName = 'Conservative' | 'Balanced' | 'Growth' | 'Custom';
type DecisionKey = 'approved' | 'referred' | 'declined';
type ApprovalState =
  | 'Draft'
  | 'Simulated'
  | 'Submitted'
  | 'Approved'
  | 'Activated';

interface DecisionComparison {
  key: DecisionKey;
  label: string;
  current: number;
  proposed: number;
  currentPct: number;
  proposedPct: number;
  difference: number;
}

interface StrategyComparison {
  name: StrategyName;
  policy: PolicySettings;
  result: SimulationResult;
  approvalRate: number;
  referralRate: number;
  changed: number;
}

interface MigrationRecord {
  id: string;
  applicant: string;
  from: string;
  to: string;
  explanation: string;
}

@Component({
  selector: 'app-policy-simulator',
  templateUrl: './policy-simulator.component.html',
  styleUrls: ['./policy-simulator.component.scss']
})
export class PolicySimulatorComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();

  private readonly initialPolicy: PolicySettings = {
    approveFrom: 700,
    declineBelow: 580,
    maxDti: 0.45,
    maxAmount: 2000000,
    maxTenorMonths: 0,
    bureauMaxAgeDays: 0,
    salaryAdvanceSla: 0,
    highRiskSla: 0,
    standardSla: 0,
    makerChecker: false
  };

  currentPolicy: PolicySettings = { ...this.initialPolicy };
  draft: PolicySettings = { ...this.initialPolicy };

  result: SimulationResult | null = null;

  activeTab: StudioTab = 'scenario';
  selectedStrategy: StrategyName = 'Balanced';

  hasChanges = false;
  loading = false;
  saved = false;
  validationError = '';
  simulationStale = false;

  approvalState: ApprovalState = 'Draft';
  approvalNote = '';
  showApprovalWorkflow = false;

  searchTerm = '';
  transitionFilter = 'All';
  currentPage = 1;
  pageSize = 10;

  showStrategyBattle = false;
  strategyComparisons: StrategyComparison[] = [];

  selectedMigration: MigrationRecord | null = null;
  briefingCopied = false;

  readonly tabs: Array<{
    id: StudioTab;
    label: string;
    detail: string;
    icon: string;
  }> = [
    {
      id: 'scenario',
      label: 'Scenario Builder',
      detail: 'Design a strategy',
      icon: 'fa-sliders-h'
    },
    {
      id: 'impact',
      label: 'Impact Analysis',
      detail: 'Compare outcomes',
      icon: 'fa-chart-bar'
    },
    {
      id: 'migration',
      label: 'Applicant Migration',
      detail: 'Inspect changes',
      icon: 'fa-exchange-alt'
    },
    {
      id: 'risk',
      label: 'Risk Intelligence',
      detail: 'Review tradeoffs',
      icon: 'fa-shield-alt'
    },
    {
      id: 'advisor',
      label: 'AI Strategy Advisor',
      detail: 'Executive briefing',
      icon: 'fa-brain'
    }
  ];

  aiBriefingLoading = false;
aiBriefingGenerated = false;

generateAIBriefing(): void {
  if (this.aiBriefingLoading) return;

  this.aiBriefingLoading = true;
  this.aiBriefingGenerated = false;

  setTimeout(() => {
    this.aiBriefingLoading = false;
    this.aiBriefingGenerated = true;
  }, 2000);
}

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.credit.policy$.subscribe(policy => {
        this.currentPolicy = { ...policy };

        if (!this.hasChanges) {
          this.draft = { ...policy };
          this.runSimulation();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ====================================================
  // NAVIGATION
  // ====================================================

  setTab(tab: StudioTab): void {
    this.activeTab = tab;
  }

  // ====================================================
  // PRESET STRATEGIES
  // ====================================================

  private strategyPolicy(name: StrategyName): PolicySettings {
    const base = { ...this.currentPolicy };

    switch (name) {
      case 'Conservative':
        return {
          ...base,
          approveFrom: 750,
          declineBelow: 610,
          maxDti: 0.35,
          maxAmount: 1500000
        };

      case 'Growth':
        return {
          ...base,
          approveFrom: 650,
          declineBelow: 550,
          maxDti: 0.60,
          maxAmount: 3000000
        };

      case 'Balanced':
        return {
          ...base,
          approveFrom: 700,
          declineBelow: 580,
          maxDti: 0.45,
          maxAmount: 2000000
        };

      default:
        return { ...this.draft };
    }
  }

  chooseStrategy(name: StrategyName): void {
    if (name === 'Custom') {
      this.selectedStrategy = 'Custom';
      return;
    }

    this.selectedStrategy = name;
    this.draft = this.strategyPolicy(name);
    this.policyEdited();
  }

  onPolicyChange(): void {
    this.selectedStrategy = 'Custom';
    this.policyEdited();
  }

  private policyEdited(): void {
    this.hasChanges = this.isPolicyModified();
    this.saved = false;
    this.validationError = '';
    this.simulationStale = true;
    this.result = null;
    this.approvalState = 'Draft';
    this.approvalNote = '';
  }

  isPolicyModified(): boolean {
    return (
      Number(this.draft.approveFrom) !== this.currentPolicy.approveFrom ||
      Number(this.draft.declineBelow) !== this.currentPolicy.declineBelow ||
      Number(this.draft.maxDti) !== this.currentPolicy.maxDti ||
      Number(this.draft.maxAmount) !== this.currentPolicy.maxAmount
    );
  }

  reset(): void {
    this.draft = { ...this.currentPolicy };
    this.selectedStrategy = 'Custom';
    this.hasChanges = false;
    this.saved = false;
    this.approvalState = 'Draft';
    this.approvalNote = '';
    this.runSimulation();
  }

  // ====================================================
  // VALIDATION
  // ====================================================

  validatePolicy(): boolean {
    const p = this.draft;

    if ([
      p.approveFrom, p.declineBelow, p.maxDti, p.maxAmount
    ].some(value => !Number.isFinite(Number(value)))) {
      this.validationError = 'Enter valid numeric policy values.';
      return false;
    }

    if (p.approveFrom < 620 || p.approveFrom > 820) {
      this.validationError =
        'Approval score must be between 620 and 820.';
      return false;
    }

    if (p.declineBelow < 450 || p.declineBelow > 680) {
      this.validationError =
        'Decline score must be between 450 and 680.';
      return false;
    }

    if (p.declineBelow >= p.approveFrom) {
      this.validationError =
        'Decline score must be below the approval score.';
      return false;
    }

    if (p.maxDti < 0.25 || p.maxDti > 0.70) {
      this.validationError =
        'Maximum debt-to-income ratio must be between 25% and 70%.';
      return false;
    }

    if (p.maxAmount < 200000 || p.maxAmount > 5000000) {
      this.validationError =
        'Maximum loan amount must be between KES 200,000 and 5,000,000.';
      return false;
    }

    this.validationError = '';
    return true;
  }

  // ====================================================
  // SIMULATION
  // ====================================================

  runSimulation(): void {
    if (!this.validatePolicy()) {
      this.result = null;
      this.simulationStale = true;
      return;
    }

    this.loading = true;

    try {
      this.result = this.credit.simulate({ ...this.draft });
      this.simulationStale = false;
      this.currentPage = 1;
      this.approvalState = 'Simulated';
      this.strategyComparisons = [];
      this.briefingCopied = false;
    } catch (error) {
      console.error('Simulation error:', error);
      this.result = null;
      this.simulationStale = true;
      this.validationError = 'Simulation could not be completed.';
    } finally {
      this.loading = false;
    }
  }

  runAndViewImpact(): void {
    this.runSimulation();

    if (this.result) {
      this.activeTab = 'impact';
    }
  }

  get ready(): boolean {
    return this.result !== null && !this.simulationStale;
  }

  get bookSize(): number {
    return this.result?.bookSize ?? 0;
  }

  get changedCount(): number {
    return this.result?.changeCount ?? 0;
  }

  get stableCount(): number {
    return Math.max(0, this.bookSize - this.changedCount);
  }

  get changedRate(): number {
    return this.percentOf(this.changedCount, this.bookSize);
  }

  percentOf(value: number, total: number): number {
    return total > 0
      ? Number((value * 100 / total).toFixed(1))
      : 0;
  }

  get comparisons(): DecisionComparison[] {
    if (!this.ready || !this.result) return [];

    return ([
      ['approved', 'Approved'],
      ['referred', 'Manual Review'],
      ['declined', 'Declined']
    ] as Array<[DecisionKey, string]>).map(([key, label]) => {
      const current = this.result!.current[key];
      const proposed = this.result!.next[key];

      return {
        key, label, current, proposed,
        currentPct: this.percentOf(current, this.bookSize),
        proposedPct: this.percentOf(proposed, this.bookSize),
        difference: proposed - current
      };
    });
  }

  get approvedDelta(): number {
    return this.result
      ? this.result.next.approved - this.result.current.approved
      : 0;
  }

  get referredDelta(): number {
    return this.result
      ? this.result.next.referred - this.result.current.referred
      : 0;
  }

  get declinedDelta(): number {
    return this.result
      ? this.result.next.declined - this.result.current.declined
      : 0;
  }

  get approvalRateDelta(): number {
    return this.result
      ? this.percentOf(this.result.next.approved, this.bookSize) -
        this.percentOf(this.result.current.approved, this.bookSize)
      : 0;
  }

  // ====================================================
  // APPLICATION MIGRATION
  // ====================================================

  get migrations(): MigrationRecord[] {
    if (!this.ready || !this.result) return [];

    return this.result.changes.map(row => ({
      id: String(row.id),
      applicant: String(row.applicant),
      from: String(row.from),
      to: String(row.to),
      explanation: this.migrationExplanation(
        String(row.from), String(row.to)
      )
    }));
  }

  private migrationExplanation(from: string, to: string): string {
    const before = from.toLowerCase();
    const after = to.toLowerCase();

    if (before.includes('refer') && after.includes('approv')) {
      return 'Applicant now meets the proposed automatic approval conditions.';
    }

    if (before.includes('approv') && after.includes('refer')) {
      return 'Applicant requires review under the proposed thresholds.';
    }

    if (after.includes('declin')) {
      return 'Proposed policy produces a decline recommendation.';
    }

    if (before.includes('declin') && after.includes('approv')) {
      return 'Application becomes eligible under the proposed conditions.';
    }

    return 'One or more configured thresholds changed the recommendation.';
  }

  get filteredMigrations(): MigrationRecord[] {
    const search = this.searchTerm.toLowerCase().trim();

    return this.migrations.filter(row => {
      const matchesSearch = !search ||
        `${row.id} ${row.applicant}`.toLowerCase().includes(search);

      const matchesTransition = this.transitionFilter === 'All' ||
        row.to.toLowerCase().includes(this.transitionFilter.toLowerCase());

      return matchesSearch && matchesTransition;
    });
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredMigrations.length / this.pageSize)
    );
  }

  get paginatedMigrations(): MigrationRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMigrations.slice(start, start + this.pageSize);
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  inspectMigration(row: MigrationRecord): void {
    this.selectedMigration = row;
  }

  // ====================================================
  // RISK INTELLIGENCE
  // ====================================================

  get scoreChange(): number {
    return this.draft.approveFrom - this.currentPolicy.approveFrom;
  }

  get dtiChangePoints(): number {
    return Math.round(
      (this.draft.maxDti - this.currentPolicy.maxDti) * 100
    );
  }

  get amountChange(): number {
    return this.draft.maxAmount - this.currentPolicy.maxAmount;
  }

  get lowerScoreAllowed(): boolean {
    return this.scoreChange < 0;
  }

  get higherDtiAllowed(): boolean {
    return this.dtiChangePoints > 0;
  }

  get largerLoansAllowed(): boolean {
    return this.amountChange > 0;
  }

  get loosenedControls(): number {
    return [
      this.lowerScoreAllowed,
      this.higherDtiAllowed,
      this.largerLoansAllowed,
      this.draft.declineBelow < this.currentPolicy.declineBelow
    ].filter(Boolean).length;
  }

  get tightenedControls(): number {
    return [
      this.scoreChange > 0,
      this.dtiChangePoints < 0,
      this.amountChange < 0,
      this.draft.declineBelow > this.currentPolicy.declineBelow
    ].filter(Boolean).length;
  }

  get riskObservations(): string[] {
    if (!this.ready) return [];

    const notes: string[] = [];

    if (this.lowerScoreAllowed) {
      notes.push(
        'The proposed approval threshold admits applicants with lower ' +
        'credit scores than the current policy.'
      );
    }

    if (this.higherDtiAllowed) {
      notes.push(
        'The higher permitted DTI allows applicants with greater ' +
        'existing debt commitments relative to income.'
      );
    }

    if (this.largerLoansAllowed) {
      notes.push(
        'The increased maximum loan amount permits larger individual ' +
        'loan requests under the proposed policy.'
      );
    }

    if (this.tightenedControls > 0) {
      notes.push(
        `${this.tightenedControls} configured threshold(s) became more restrictive.`
      );
    }

    if (this.approvedDelta > 0) {
      notes.push(
        `${this.approvedDelta} more applications receive approval ` +
        'recommendations in the evaluated portfolio.'
      );
    } else if (this.approvedDelta < 0) {
      notes.push(
        `${Math.abs(this.approvedDelta)} fewer applications receive ` +
        'approval recommendations.'
      );
    }

    if (!notes.length) {
      notes.push(
        'No material difference was detected in the supported policy parameters.'
      );
    }

    return notes;
  }

  get guardrailText(): string {
    if (!this.ready) {
      return 'Run a valid simulation to view policy guardrails.';
    }

    if (this.loosenedControls > 0) {
      return (
        'Some eligibility thresholds have been relaxed. Before deployment, ' +
        'review underwriting guardrails, concentration limits and ' +
        'approval authority for newly eligible applications.'
      );
    }

    return (
      'Review the effect of these thresholds on access to credit ' +
      'and confirm that the revised settings match the bank risk appetite.'
    );
  }

  // ====================================================
  // THREE-STRATEGY COMPARISON
  // ====================================================

  compareStrategies(): void {
    if (!this.ready) return;

    const names: StrategyName[] = [
      'Conservative', 'Balanced', 'Growth'
    ];

    try {
      this.strategyComparisons = names.map(name => {
        const policy = this.strategyPolicy(name);
        const result = this.credit.simulate(policy);

        return {
          name,
          policy,
          result,
          approvalRate: this.percentOf(result.next.approved, result.bookSize),
          referralRate: this.percentOf(result.next.referred, result.bookSize),
          changed: result.changeCount
        };
      });

      this.showStrategyBattle = true;
    } catch (error) {
      console.error('Strategy comparison failed:', error);
      this.validationError = 'Unable to compare preset strategies.';
    }
  }

  useComparedStrategy(name: StrategyName): void {
    this.chooseStrategy(name);
    this.showStrategyBattle = false;
    this.activeTab = 'scenario';
  }

  // ====================================================
  // EXECUTIVE AI-STYLE ADVISOR
  // ====================================================

  get executiveSummary(): string {
    if (!this.ready || !this.result) {
      return 'Run a simulation to generate the executive assessment.';
    }

    const movement = this.approvedDelta > 0
      ? `${this.approvedDelta} additional applications qualify for approval`
      : this.approvedDelta < 0
        ? `${Math.abs(this.approvedDelta)} fewer applications qualify for approval`
        : 'the approval volume remains unchanged';

    return (
      `The ${this.selectedStrategy.toLowerCase()} policy scenario ` +
      `was evaluated against ${this.bookSize.toLocaleString('en-KE')} ` +
      `applications. Under the proposed thresholds, ${movement}. ` +
      `${this.changedCount} applications change their decision ` +
      'recommendation. This comparison illustrates potential eligibility ' +
      'impacts rather than actual future performance.'
    );
  }

  get strategicRecommendation(): string {
    if (!this.ready) {
      return 'Complete a scenario evaluation first.';
    }

    if (this.loosenedControls > 0 && this.approvedDelta > 0) {
      return (
        'The scenario expands eligibility while relaxing one or more ' +
        'risk-related controls. Consider a controlled pilot, documented ' +
        'risk limits and monitoring of newly eligible applicants.'
      );
    }

    if (this.tightenedControls > 0 && this.approvedDelta < 0) {
      return (
        'The scenario reduces approval access while tightening policy. ' +
        'Review whether the expected risk-control benefit justifies ' +
        'the reduction in eligible lending applications.'
      );
    }

    return (
      'The scenario should be assessed against the institution risk ' +
      'appetite, product objectives and existing underwriting controls ' +
      'before any policy activation.'
    );
  }

  get executiveReport(): string {
    if (!this.ready) return '';

    return [
      'ECLECTICS POLICY INTELLIGENCE',
      'EXECUTIVE STRATEGY BRIEFING — DEMONSTRATION',
      '',
      `Scenario: ${this.selectedStrategy}`,
      `Applications evaluated: ${this.bookSize}`,
      `Decisions changed: ${this.changedCount}`,
      `Approval difference: ${this.signed(this.approvedDelta)}`,
      `Referral difference: ${this.signed(this.referredDelta)}`,
      `Decline difference: ${this.signed(this.declinedDelta)}`,
      '',
      'EXECUTIVE SUMMARY',
      this.executiveSummary,
      '',
      'RISK OBSERVATIONS',
      ...this.riskObservations.map(note => `- ${note}`),
      '',
      'STRATEGIC RECOMMENDATION',
      this.strategicRecommendation,
      '',
      'Simulation results are illustrative and based on the existing',
      'credit demonstration dataset. No default-risk or profitability',
      'forecast is implied without validated models and assumptions.'
    ].join('\n');
  }

  copyBriefing(): void {
    if (!this.ready || !navigator.clipboard?.writeText) return;

    navigator.clipboard.writeText(this.executiveReport)
      .then(() => {
        this.briefingCopied = true;
      })
      .catch(() => {
        this.briefingCopied = false;
      });
  }

  // ====================================================
  // GOVERNANCE — DEMONSTRATION WORKFLOW
  // ====================================================

  submitForApproval(): void {
    if (!this.ready || !this.hasChanges) return;

    this.approvalState = 'Submitted';
    this.approvalNote =
      'Simulation submitted for demonstration review.';
  }

  approveScenario(): void {
    if (this.approvalState !== 'Submitted') return;

    this.approvalState = 'Approved';
    this.approvalNote =
      'Demo policy approval recorded. No production authorization occurred.';
  }

  applyApprovedPolicy(): void {
    if (this.approvalState !== 'Approved' || !this.ready) return;

    try {
      const policy = { ...this.draft };
      this.credit.updatePolicy(policy);

      this.currentPolicy = { ...policy };
      this.hasChanges = false;
      this.saved = true;
      this.approvalState = 'Activated';
      this.approvalNote =
        'Policy updated in the existing demo data service.';
      this.runSimulation();
      this.approvalState = 'Activated';
    } catch (error) {
      console.error('Unable to apply demo policy:', error);
      this.validationError = 'Policy could not be applied.';
    }
  }

  // ====================================================
  // FORMATTING
  // ====================================================

  money(value: number): string {
    return this.credit.money(value);
  }

  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  signed(value: number): string {
    return value > 0 ? `+${value}` : String(value);
  }

  differenceClass(value: number): string {
    return value > 0 ? 'increase'
      : value < 0 ? 'decrease'
      : 'neutral';
  }

  decisionClass(value: string): string {
    const normalized = value.toLowerCase();

    if (normalized.includes('approv')) return 'approved';
    if (normalized.includes('refer') || normalized.includes('review')) {
      return 'referred';
    }
    if (normalized.includes('declin')) return 'declined';

    return 'neutral';
  }
}
