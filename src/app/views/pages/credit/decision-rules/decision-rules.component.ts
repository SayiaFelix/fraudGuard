
import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';

type Operator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq';
type Action = 'Decline' | 'Manual Review';
type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
type Decision = 'Approved' | 'Refer' | 'Declined' | 'Incomplete';
type Tab = 'rules' | 'applications' | 'batch' | 'copilot';
type Insight = 'explanation' | 'factors' | 'actions' | 'summary';

interface PolicyField {
  key: string;
  name: string;
  category: string;
  min: number;
  max: number;
  initial: number;
}

interface LendingRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  field: string;
  operator: Operator;
  value: number;
  action: Action;
  severity: Severity;
  priority: number;
  enabled: boolean;
}

interface LoanApplication {
  id: string;
  name: string;
  product: string;
  country: string;
  amount: number;
  score: number | null;
  income: number | null;
  debt: number | null;
  age: number | null;
  employmentMonths: number | null;
  overdueLoans: number | null;
  existingLoans: number | null;
  tenure: number | null;
  submitted: string;
}

interface RuleResult {
  rule: LendingRule;
  actual: number | null;
  triggered: boolean;
  missing: boolean;
}

interface Evaluation {
  application: LoanApplication;
  decision: Decision;
  results: RuleResult[];
  reasons: string[];
  evaluatedAt: string;
}

@Component({
  selector: 'app-decision-rules',
  templateUrl: './decision-rules.component.html',
  styleUrls: ['./decision-rules.component.scss']
})
export class DecisionRulesComponent implements OnInit {

  private readonly RULES_KEY = 'uba_credit_decision_rules_v1';
  private readonly APPLICATIONS_KEY = 'eclectics_decision_applications_v2';

  activeTab: Tab = 'rules';
  activeInsight: Insight = 'explanation';

  readonly categories = [
    'Credit Score',
    'Affordability',
    'Credit History',
    'Loan Eligibility',
    'Customer Profile'
  ];

  readonly actions: Action[] = ['Decline', 'Manual Review'];
  readonly severities: Severity[] = [
    'Critical', 'High', 'Medium', 'Low'
  ];

  readonly operators: Array<{ value: Operator; label: string }> = [
    { value: 'lt', label: 'Less than (<)' },
    { value: 'lte', label: 'Less or equal (≤)' },
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'gte', label: 'Greater or equal (≥)' },
    { value: 'eq', label: 'Equal (=)' },
    { value: 'neq', label: 'Not equal (≠)' }
  ];

  readonly fields: PolicyField[] = [
    { key: 'score', name: 'Credit Score', category: 'Credit Score',
      min: 300, max: 850, initial: 650 },
    { key: 'income', name: 'Monthly Income', category: 'Affordability',
      min: 0, max: 100000000, initial: 20000 },
    { key: 'debt', name: 'Monthly Debt', category: 'Affordability',
      min: 0, max: 100000000, initial: 20000 },
    { key: 'dti', name: 'Debt-to-Income Ratio', category: 'Affordability',
      min: 0, max: 100, initial: 45 },
    { key: 'amount', name: 'Requested Amount', category: 'Loan Eligibility',
      min: 0, max: 100000000, initial: 500000 },
    { key: 'tenure', name: 'Loan Tenure', category: 'Loan Eligibility',
      min: 1, max: 120, initial: 36 },
    { key: 'overdueLoans', name: 'Overdue Loans', category: 'Credit History',
      min: 0, max: 100, initial: 0 },
    { key: 'existingLoans', name: 'Active Loans', category: 'Credit History',
      min: 0, max: 100, initial: 4 },
    { key: 'age', name: 'Applicant Age', category: 'Customer Profile',
      min: 0, max: 120, initial: 18 },
    { key: 'employmentMonths', name: 'Employment Duration',
      category: 'Customer Profile', min: 0, max: 600, initial: 6 }
  ];

  readonly products = [
    'Personal Loan',
    'SME Working Capital',
    'Salary Advance',
    'School Fees',
    'Asset Finance',
    'Device Finance'
  ];

  readonly countries = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ghana'];

  rules: LendingRule[] = [];
  applications: LoanApplication[] = [];

  ruleSearch = '';
  ruleCategory = 'All';
  ruleStatus = 'All';

  applicationSearch = '';
  applicationFilter = 'All';
  applicationProduct = 'All';

  batchResults: Evaluation[] = [];
  batchCompleted = false;
  batchSearch = '';
  batchFilter = 'All';

  selectedEvaluation: Evaluation | null = null;
  selectedApplication: LoanApplication | null = null;
  evaluationHistory: Evaluation[] = [];

  showRuleModal = false;
  showDeleteModal = false;
  showNewApplication = false;
  showPolicyHealth = false;
  showTrace = false;

  editingRuleId: string | null = null;
  deletingRule: LendingRule | null = null;

  ruleError = '';
  applicationError = '';

  toastMessage = '';
  toastError = false;

  ruleForm: LendingRule = this.emptyRule();
  applicationForm: LoanApplication = this.emptyApplication();

  ngOnInit(): void {
    this.loadRules();
    this.loadApplications();
  }

  // -------------------------------------------------------
  // DEMO DATA
  // -------------------------------------------------------

  private defaultRules(): LendingRule[] {
    return [
      this.makeRule(1, 'Minimum Credit Score', 'Credit Score',
        'creditScore', 'lt', 650, 'Manual Review', 'High', 10),
      this.makeRule(2, 'Debt-to-Income Limit', 'Affordability',
        'dti', 'gt', 45, 'Manual Review', 'High', 20),
      this.makeRule(3, 'Outstanding Loan Arrears', 'Credit History',
        'overdueLoans', 'gt', 0, 'Decline', 'Critical', 30),
      this.makeRule(4, 'Maximum Loan Amount', 'Loan Eligibility',
        'requestedAmount', 'gt', 500000, 'Manual Review', 'Medium', 40),
      this.makeRule(5, 'Minimum Applicant Age', 'Customer Profile',
        'age', 'lt', 18, 'Decline', 'Critical', 50),
      this.makeRule(6, 'Employment Stability', 'Customer Profile',
        'employmentMonths', 'lt', 6, 'Manual Review', 'Medium', 60),
      this.makeRule(7, 'Multiple Active Loans', 'Credit History',
        'existingLoans', 'gt', 4, 'Manual Review', 'Medium', 70, false)
    ];
  }

  private makeRule(
    n: number, name: string, category: string, field: string,
    operator: Operator, value: number, action: Action,
    severity: Severity, priority: number, enabled = true
  ): LendingRule {
    return {
      id: `default-${n}`,
      code: `CR-${String(n).padStart(3, '0')}`,
      name,
      description: `Evaluate ${name.toLowerCase()} against the policy threshold.`,
      category, field, operator, value, action,
      severity, priority, enabled
    };
  }

  private emptyRule(): LendingRule {
    return {
      id: '', code: '', name: '', description: '',
      category: 'Credit Score', field: 'creditScore',
      operator: 'lt', value: 650, action: 'Manual Review',
      severity: 'Medium', priority: 100, enabled: true
    };
  }

  private emptyApplication(): LoanApplication {
    return {
      id: '', name: '', product: 'Personal Loan',
      country: 'Kenya', amount: 150000,
      score: 680, income: 80000, debt: 20000,
      age: 30, employmentMonths: 24,
      overdueLoans: 0, existingLoans: 1,
      tenure: 12, submitted: ''
    };
  }

  private generateApplications(count = 480): LoanApplication[] {
    const firstNames = [
      'Grace', 'Brian', 'Mary', 'Peter', 'David',
      'Faith', 'James', 'Amina', 'Daniel', 'Sarah',
      'Samuel', 'Joy', 'Kevin', 'Linda', 'Robert'
    ];

    const lastNames = [
      'Wanjiku', 'Otieno', 'Mwangi', 'Achieng',
      'Kiptoo', 'Njeri', 'Omondi', 'Kamau',
      'Muthoni', 'Maina', 'Okello', 'Munya'
    ];

    const list: LoanApplication[] = [];

    for (let i = 0; i < count; i++) {
      const x = i + 1;
      const income = 30000 + (x * 1793 % 210000);
      const debtRatio = 0.09 + (x * 13 % 69) / 100;
      const submitted = new Date(
        Date.now() - x * 37 * 60000
      ).toISOString();

      list.push({
        id: `APP-${String(11000 + x).padStart(5, '0')}`,
        name: `${firstNames[i % firstNames.length]} ${
          lastNames[(i * 7 + Math.floor(i / 12)) % lastNames.length]
        }`,
        product: this.products[(i * 3 + Math.floor(i / 7)) % this.products.length],
        country: this.countries[Math.floor(i / 11) % this.countries.length],
        amount: 50000 + (x * 53 % 41) * 25000,
        score: 480 + (x * 47 % 361),
        income,
        debt: Math.round(income * debtRatio),
        age: 21 + (x * 11 % 44),
        employmentMonths: x * 7 % 97,
        overdueLoans: x % 19 === 0 ? 2 : x % 11 === 0 ? 1 : 0,
        existingLoans: x * 3 % 7,
        tenure: [6, 12, 18, 24, 36, 48][i % 6],
        submitted
      });
    }

    return list;
  }

  // -------------------------------------------------------
  // STORAGE
  // -------------------------------------------------------

  private loadRules(): void {
    try {
      const saved = localStorage.getItem(this.RULES_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          // Map rules from the earlier Decision Rules version
          // into the current field names.
          const map: Record<string, string> = {
            creditScore: 'creditScore',
            monthlyIncome: 'monthlyIncome',
            monthlyDebt: 'monthlyDebt',
            requestedAmount: 'requestedAmount',
            loanTenure: 'loanTenure'
          };

          this.rules = parsed
            .filter((r: any) =>
              r && typeof r.field === 'string' &&
              typeof r.name === 'string'
            )
            .map((r: any) => ({
              ...r,
              field: map[r.field] || r.field
            }));

          if (this.rules.length) return;
        }
      }
    } catch (error) {
      console.warn('Saved rules could not be loaded.', error);
    }

    this.rules = this.defaultRules();
    this.saveRules();
  }

  private saveRules(): void {
    try {
      localStorage.setItem(
        this.RULES_KEY, JSON.stringify(this.rules)
      );
    } catch (error) {
      console.warn('Rule storage unavailable.', error);
    }
  }

  private loadApplications(): void {
    try {
      const saved = localStorage.getItem(this.APPLICATIONS_KEY);
      const custom = saved ? JSON.parse(saved) : [];

      this.applications = [
        ...(Array.isArray(custom) ? custom : []),
        ...this.generateApplications()
      ];
    } catch {
      this.applications = this.generateApplications();
    }
  }

  private saveCustomApplications(): void {
    try {
      const custom = this.applications.filter(
        app => app.id.startsWith('NEW-')
      );

      localStorage.setItem(
        this.APPLICATIONS_KEY, JSON.stringify(custom)
      );
    } catch {
      this.notify('Application could not be saved locally.', true);
    }
  }

  // -------------------------------------------------------
  // TABS / GENERAL
  // -------------------------------------------------------

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  get totalRules(): number { return this.rules.length; }
  get activeRules(): number {
    return this.rules.filter(r => r.enabled).length;
  }
  get criticalRules(): number {
    return this.rules.filter(
      r => r.enabled && r.severity === 'Critical'
    ).length;
  }

  get filteredRules(): LendingRule[] {
    const s = this.ruleSearch.trim().toLowerCase();

    return this.rules.filter(r =>
      (!s || `${r.name} ${r.code} ${r.description}`.toLowerCase().includes(s)) &&
      (this.ruleCategory === 'All' || r.category === this.ruleCategory) &&
      (this.ruleStatus === 'All' ||
        (this.ruleStatus === 'Active' ? r.enabled : !r.enabled))
    ).sort((a, b) => a.priority - b.priority);
  }

  get availableFields(): PolicyField[] {
    return this.fields.filter(f => f.category === this.ruleForm.category);
  }

  getFieldName(field: string): string {
    return this.fields.find(f => f.key === field)?.name || field;
  }

  getOperatorSymbol(operator: Operator): string {
    return ({
      lt: '<', lte: '≤', gt: '>',
      gte: '≥', eq: '=', neq: '≠'
    } as Record<Operator, string>)[operator];
  }

  getCondition(rule: LendingRule): string {
    const suffix = rule.field === 'dti' ? '%' :
      ['monthlyIncome', 'monthlyDebt', 'requestedAmount'].includes(rule.field)
        ? ' KES' : '';

    return `${this.getFieldName(rule.field)} ${
      this.getOperatorSymbol(rule.operator)
    } ${rule.value.toLocaleString('en-KE')}${suffix}`;
  }

  onRuleCategoryChange(): void {
    const field = this.availableFields[0];
    if (field) {
      this.ruleForm.field = field.key;
      this.ruleForm.value = field.initial;
    }
  }

  // -------------------------------------------------------
  // POLICY MANAGEMENT
  // -------------------------------------------------------

  openCreateRule(): void {
    this.editingRuleId = null;
    this.ruleError = '';
    this.ruleForm = this.emptyRule();

    const next = this.rules.reduce((max, r) => {
      const match = /^CR-(\d+)$/.exec(r.code);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;

    this.ruleForm.code = `CR-${String(next).padStart(3, '0')}`;
    this.showRuleModal = true;
  }

  editRule(rule: LendingRule): void {
    this.editingRuleId = rule.id;
    this.ruleForm = { ...rule };
    this.ruleError = '';
    this.showRuleModal = true;
  }

  saveRule(): void {
    const r = this.ruleForm;
    const field = this.fields.find(f => f.key === r.field);

    if (!r.name.trim() || r.name.trim().length < 4) {
      this.ruleError = 'Enter a rule name of at least 4 characters.';
      return;
    }

    if (!field || field.category !== r.category) {
      this.ruleError = 'Select a valid policy attribute.';
      return;
    }

    if (!Number.isFinite(Number(r.value)) ||
        Number(r.value) < field.min ||
        Number(r.value) > field.max) {
      this.ruleError = `Threshold must be between ${field.min} and ${field.max}.`;
      return;
    }

    if (!Number.isInteger(Number(r.priority)) || Number(r.priority) < 1) {
      this.ruleError = 'Priority must be a positive whole number.';
      return;
    }

    if (this.rules.some(item =>
      item.id !== this.editingRuleId &&
      item.name.trim().toLowerCase() === r.name.trim().toLowerCase()
    )) {
      this.ruleError = 'Another rule already uses that name.';
      return;
    }

    const updated = {
      ...r,
      name: r.name.trim(),
      description: r.description.trim(),
      value: Number(r.value),
      priority: Number(r.priority)
    };

    if (this.editingRuleId) {
      this.rules = this.rules.map(item =>
        item.id === this.editingRuleId ? updated : item
      );
    } else {
      updated.id = `custom-${Date.now()}`;
      this.rules = [...this.rules, updated];
    }

    this.saveRules();
    this.invalidateBatch();
    this.showRuleModal = false;
    this.notify('Lending policy rule saved.');
  }

  toggleRule(rule: LendingRule): void {
    rule.enabled = !rule.enabled;
    this.saveRules();
    this.invalidateBatch();
    this.notify(rule.enabled ? 'Rule activated.' : 'Rule deactivated.');
  }

  askDeleteRule(rule: LendingRule): void {
    this.deletingRule = rule;
    this.showDeleteModal = true;
  }

  deleteRule(): void {
    if (!this.deletingRule) return;

    this.rules = this.rules.filter(r => r.id !== this.deletingRule?.id);
    this.saveRules();
    this.invalidateBatch();
    this.showDeleteModal = false;
    this.deletingRule = null;
    this.notify('Rule deleted.');
  }

  restoreRules(): void {
    if (!window.confirm('Restore demo policy rules? Existing custom rules will be lost.')) {
      return;
    }

    this.rules = this.defaultRules();
    this.saveRules();
    this.invalidateBatch();
    this.notify('Default rules restored.');
  }

  get policyFindings(): string[] {
    const findings: string[] = [];
    const active = this.rules.filter(r => r.enabled);

    if (!active.length) {
      return ['No active lending rules are configured.'];
    }

    for (const category of this.categories) {
      if (!active.some(r => r.category === category)) {
        findings.push(`No active coverage for ${category}.`);
      }
    }

    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];

        if (a.field === b.field &&
            a.operator === b.operator &&
            a.value === b.value) {
          findings.push(
            a.action === b.action
              ? `Possible duplicate: ${a.code} and ${b.code}.`
              : `Conflicting actions: ${a.code} and ${b.code}.`
          );
        }
      }
    }

    return findings;
  }

  get policyCoverage(): number {
    return Math.round(
      this.categories.filter(c =>
        this.rules.some(r => r.enabled && r.category === c)
      ).length / this.categories.length * 100
    );
  }

  // -------------------------------------------------------
  // SHARED DECISION ENGINE
  // -------------------------------------------------------

  getDti(app: LoanApplication): number | null {
    if (app.income === null || app.debt === null ||
        !Number.isFinite(app.income) || !Number.isFinite(app.debt) ||
        app.income <= 0 || app.debt < 0) {
      return null;
    }

    return app.debt / app.income * 100;
  }

  private getValue(app: LoanApplication, field: string): number | null {
    if (field === 'dti') return this.getDti(app);

    const mapping: Record<string, keyof LoanApplication> = {
      creditScore: 'score',
      monthlyIncome: 'income',
      monthlyDebt: 'debt',
      requestedAmount: 'amount',
      loanTenure: 'tenure',
      age: 'age',
      overdueLoans: 'overdueLoans',
      existingLoans: 'existingLoans',
      employmentMonths: 'employmentMonths'
    };

    const key = mapping[field];
    if (!key) return null;

    const value = app[key];

    return typeof value === 'number' &&
      Number.isFinite(value) ? value : null;
  }

  private compare(
    actual: number, operator: Operator, threshold: number
  ): boolean {
    switch (operator) {
      case 'lt': return actual < threshold;
      case 'lte': return actual <= threshold;
      case 'gt': return actual > threshold;
      case 'gte': return actual >= threshold;
      case 'eq': return actual === threshold;
      case 'neq': return actual !== threshold;
    }
  }

  evaluate(app: LoanApplication): Evaluation {
    const active = this.rules
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: RuleResult[] = active.map(rule => {
      const actual = this.getValue(app, rule.field);
      const definition = this.fields.find(f => f.key === rule.field);
      const missing = actual === null ||
        (definition !== undefined &&
          (actual < definition.min || actual > definition.max));

      return {
        rule,
        actual,
        missing,
        triggered: !missing &&
          this.compare(actual as number, rule.operator, rule.value)
      };
    });

    let decision: Decision = 'Approved';

    if (!active.length || results.some(r => r.missing)) {
      decision = 'Incomplete';
    } else if (results.some(r =>
      r.triggered && r.rule.action === 'Decline'
    )) {
      decision = 'Declined';
    } else if (results.some(r => r.triggered)) {
      decision = 'Refer';
    }

    const reasons = results
      .filter(r => r.triggered || r.missing)
      .map(r => r.missing
        ? `${r.rule.name}: required information is unavailable or invalid.`
        : `${r.rule.name}: ${this.getCondition(r.rule)}.`
      );

    return {
      application: app,
      decision,
      results,
      reasons,
      evaluatedAt: new Date().toISOString()
    };
  }

  decisionFor(app: LoanApplication): Decision {
    return this.evaluate(app).decision;
  }

  getDecisionClass(decision: Decision): string {
    switch (decision) {
      case 'Approved': return 'approved';
      case 'Declined': return 'declined';
      case 'Refer': return 'refer';
      default: return 'incomplete';
    }
  }

  // -------------------------------------------------------
  // APPLICATION EXPLORER
  // -------------------------------------------------------

  get filteredApplications(): LoanApplication[] {
    const s = this.applicationSearch.trim().toLowerCase();

    return this.applications.filter(app =>
      (!s || `${app.name} ${app.id} ${app.product}`.toLowerCase().includes(s)) &&
      (this.applicationProduct === 'All' || app.product === this.applicationProduct) &&
      (this.applicationFilter === 'All' ||
        this.decisionFor(app) === this.applicationFilter)
    );
  }

  openApplication(app: LoanApplication): void {
    this.selectedApplication = app;
    this.selectedEvaluation = this.evaluate(app);
    this.showTrace = false;

    this.evaluationHistory = [
      this.selectedEvaluation,
      ...this.evaluationHistory
    ].slice(0, 10);
  }

  closeApplication(): void {
    this.selectedApplication = null;
  }

  newApplication(): void {
    this.applicationForm = this.emptyApplication();
    this.applicationError = '';
    this.showNewApplication = true;
  }

  saveApplication(): void {
    const a = this.applicationForm;

    if (!a.name.trim() || a.name.trim().length < 3) {
      this.applicationError = 'Enter a valid applicant name.';
      return;
    }

    if (a.amount === null || !Number.isFinite(Number(a.amount)) ||
        Number(a.amount) <= 0) {
      this.applicationError = 'Requested amount must be greater than zero.';
      return;
    }

    const app: LoanApplication = {
      ...a,
      id: `NEW-${Date.now()}`,
      name: a.name.trim(),
      amount: Number(a.amount),
      submitted: new Date().toISOString()
    };

    this.applications = [app, ...this.applications];
    this.saveCustomApplications();
    this.invalidateBatch();
    this.showNewApplication = false;
    this.applicationSearch = '';
    this.applicationFilter = 'All';
    this.applicationProduct = 'All';
    this.openApplication(app);
    this.notify('New application created and evaluated.');
  }

  // -------------------------------------------------------
  // BATCH INTELLIGENCE
  // -------------------------------------------------------

  runBatch(): void {
    this.batchResults = this.applications.map(app => this.evaluate(app));
    this.batchCompleted = true;
    this.notify(`${this.batchResults.length} synthetic applications evaluated.`);
  }

  private invalidateBatch(): void {
    this.batchResults = [];
    this.batchCompleted = false;
    this.selectedEvaluation = null;
    this.selectedApplication = null;
  }

  get batchApproved(): number {
    return this.batchResults.filter(r => r.decision === 'Approved').length;
  }

  get batchReferred(): number {
    return this.batchResults.filter(r => r.decision === 'Refer').length;
  }

  get batchDeclined(): number {
    return this.batchResults.filter(r => r.decision === 'Declined').length;
  }

  get batchIncomplete(): number {
    return this.batchResults.filter(r => r.decision === 'Incomplete').length;
  }

  get batchFilteredResults(): Evaluation[] {
    const s = this.batchSearch.trim().toLowerCase();

    return this.batchResults.filter(r =>
      (!s || `${r.application.name} ${r.application.id} ${
        r.application.product
      }`.toLowerCase().includes(s)) &&
      (this.batchFilter === 'All' || r.decision === this.batchFilter)
    );
  }

  batchPercentage(value: number): number {
    return this.batchResults.length
      ? value / this.batchResults.length * 100 : 0;
  }

  inspectBatch(result: Evaluation): void {
    this.selectedEvaluation = result;
    this.selectedApplication = result.application;
    this.showTrace = false;
    this.activeTab = 'applications';
  }

  // -------------------------------------------------------
  // COPILOT
  // -------------------------------------------------------

  openCopilot(): void {
    if (!this.selectedEvaluation) {
      this.notify('Select an application to generate its insights.', true);
      this.activeTab = 'applications';
      return;
    }

    this.activeTab = 'copilot';
    this.activeInsight = 'explanation';
  }

  get copilotExplanation(): string {
    const e = this.selectedEvaluation;
    if (!e) return 'Select an application to begin.';

    if (e.decision === 'Incomplete') {
      return 'The application cannot receive a complete policy recommendation because one or more required inputs are missing or invalid. Review the flagged fields before proceeding.';
    }

    if (e.decision === 'Approved') {
      return `${e.application.name} satisfies all ${
        e.results.length
      } active lending policy checks. No configured decline or referral condition was triggered. The next authorized lending checks should still be completed.`;
    }

    if (e.decision === 'Declined') {
      const declines = e.results.filter(
        r => r.triggered && r.rule.action === 'Decline'
      );

      return `The application triggered ${declines.length} decline condition(s), including ${
        declines.map(r => r.rule.name).join(', ')
      }. These rules take precedence over referral conditions under the current policy.`;
    }

    return `${e.application.name} triggered ${
      e.results.filter(r => r.triggered).length
    } referral condition(s). The application requires human assessment rather than automatic approval.`;
  }

  get copilotFactors(): string[] {
    const e = this.selectedEvaluation;
    if (!e) return [];

    return e.reasons.length
      ? e.reasons
      : ['No active policy exceptions were identified.'];
  }

  get copilotActions(): string[] {
    const e = this.selectedEvaluation;
    if (!e) return [];

    const triggered = e.results
      .filter(r => r.triggered)
      .map(r => r.rule.field);

    const actions: string[] = [];

    if (e.decision === 'Incomplete') {
      actions.push('Obtain and verify incomplete application information.');
    }

    if (triggered.includes('dti') ||
        triggered.includes('monthlyDebt') ||
        triggered.includes('monthlyIncome')) {
      actions.push('Review documented income and existing repayment commitments.');
    }

    if (triggered.includes('creditScore')) {
      actions.push('Review the customer credit report and repayment history.');
    }

    if (triggered.includes('overdueLoans')) {
      actions.push('Verify outstanding arrears and follow the bank arrears policy.');
    }

    if (triggered.includes('requestedAmount')) {
      actions.push('Confirm requested amount against applicable product limits.');
    }

    if (triggered.includes('employmentMonths')) {
      actions.push('Verify employment or income-stability documentation.');
    }

    if (triggered.includes('existingLoans')) {
      actions.push('Assess the applicant total outstanding credit exposure.');
    }

    if (triggered.includes('age')) {
      actions.push('Verify identity and age eligibility.');
    }

    if (e.decision === 'Approved') {
      actions.push('Proceed to the next authorized underwriting stage.');
    } else if (e.decision === 'Refer') {
      actions.push('Route the application to a credit officer for manual review.');
    } else if (e.decision === 'Declined') {
      actions.push('Record the decline reasons and follow the bank notification procedure.');
    }

    return [...new Set(actions)];
  }

  get assessmentReport(): string {
    const e = this.selectedEvaluation;
    if (!e) return '';

    const a = e.application;
    const dti = this.getDti(a);

    return [
      'ECLECTICS CREDIT INTELLIGENCE',
      'SIMULATED CREDIT ASSESSMENT',
      '-------------------------------------------',
      `Application: ${a.id}`,
      `Applicant: ${a.name}`,
      `Product: ${a.product}`,
      `Amount: KES ${a.amount.toLocaleString('en-KE')}`,
      `Credit score: ${a.score ?? 'Unavailable'}`,
      `Debt-to-income: ${dti === null ? 'Unavailable' : dti.toFixed(1) + '%'}`,
      `Policy recommendation: ${e.decision}`,
      '',
      'DECISION EXPLANATION',
      this.copilotExplanation,
      '',
      'KEY OBSERVATIONS',
      ...this.copilotFactors.map(x => `- ${x}`),
      '',
      'SUGGESTED NEXT ACTIONS',
      ...this.copilotActions.map(x => `- ${x}`),
      '',
      'This is a synthetic, rule-based demonstration.',
      'It is not a production ML credit decision.'
    ].join('\n');
  }

  exportAssessmentPDF(): void {
    if (!this.selectedEvaluation) {
      this.notify('Select an application first.', true);
      return;
    }

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      const textWidth = width - margin * 2;
      let y = 23;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(35, 55, 82);
      pdf.text('ECLECTICS CREDIT INTELLIGENCE', margin, y);
      y += 9;
      pdf.setFontSize(11);
      pdf.setTextColor(52, 104, 246);
      pdf.text('CREDIT ASSESSMENT REPORT', margin, y);
      y += 7;
      pdf.setDrawColor(225, 233, 243);
      pdf.line(margin, y, width - margin, y);
      y += 10;

      const headings = new Set([
        'DECISION EXPLANATION', 'KEY OBSERVATIONS', 'SUGGESTED NEXT ACTIONS'
      ]);

      for (const raw of this.assessmentReport.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) { y += 3; continue; }
        if (line === 'ECLECTICS CREDIT INTELLIGENCE' ||
            line === 'SIMULATED CREDIT ASSESSMENT' || /^-+$/.test(line)) continue;

        const heading = headings.has(line);
        pdf.setFont('helvetica', heading ? 'bold' : 'normal');
        pdf.setFontSize(heading ? 11 : 10);
        pdf.setTextColor(heading ? 52 : 65, heading ? 104 : 80, heading ? 246 : 100);

        const wrapped: string[] = pdf.splitTextToSize(line, textWidth);
        for (const part of wrapped) {
          if (y + 6 > height - 20) { pdf.addPage(); y = 23; }
          pdf.text(part, margin, y);
          y += heading ? 6.5 : 5.5;
        }
        y += heading ? 3 : 1;
      }

      const pages = pdf.getNumberOfPages();
      for (let page = 1; page <= pages; page++) {
        pdf.setPage(page);
        pdf.setFontSize(8);
        pdf.setTextColor(145, 155, 175);
        pdf.text(`Page ${page} of ${pages}`, width - margin, height - 12, { align: 'right' });
      }

      const safeId = this.selectedEvaluation.application.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Credit_Assessment_${safeId}.pdf`);
      this.notify('Assessment PDF exported successfully.');
    } catch (error) {
      console.error('PDF export failed:', error);
      this.notify('Unable to export assessment PDF.', true);
    }
  }

  copyReport(): void {
    if (!this.selectedEvaluation) return;

    if (!navigator.clipboard?.writeText) {
      this.notify('Clipboard is unavailable.', true);
      return;
    }

    navigator.clipboard.writeText(this.assessmentReport)
      .then(() => this.notify('Assessment copied.'))
      .catch(() => this.notify('Unable to copy assessment.', true));
  }

  // -------------------------------------------------------
  // FEEDBACK
  // -------------------------------------------------------

  notify(message: string, error = false): void {
    this.toastMessage = message;
    this.toastError = error;
  }

  dismissToast(): void {
    this.toastMessage = '';
  }

  trackRule(_index: number, rule: LendingRule): string {
    return rule.id;
  }

  trackApplication(_index: number, app: LoanApplication): string {
    return app.id;
  }
}
