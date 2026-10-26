
import { Component, OnInit } from '@angular/core';

type RuleCategory =
  | 'Credit Score'
  | 'Affordability'
  | 'Credit History'
  | 'Loan Eligibility'
  | 'Customer Profile';

type RuleOperator =
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'eq'
  | 'neq';

type RuleAction = 'Decline' | 'Manual Review';

type RuleSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

type DecisionOutcome =
  | 'Approve'
  | 'Decline'
  | 'Manual Review'
  | 'Incomplete Information'
  | 'Not Evaluated';

interface RuleField {
  key: string;
  label: string;
  category: RuleCategory;
  unit: string;
  min: number;
  max: number;
  step: number;
}

interface LendingRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  value: number;
  action: RuleAction;
  severity: RuleSeverity;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApplicantData {
  creditScore: number | null;
  monthlyIncome: number | null;
  monthlyDebt: number | null;
  requestedAmount: number | null;
  loanTenure: number | null;
  age: number | null;
  overdueLoans: number | null;
  existingLoans: number | null;
  employmentMonths: number | null;
}

interface RuleEvaluation {
  rule: LendingRule;
  actual: number | null;
  matched: boolean;
  missing: boolean;
}

@Component({
  selector: 'app-decision-rules',
  templateUrl: './decision-rules.component.html',
  styleUrls: ['./decision-rules.component.scss']
})
export class DecisionRulesComponent implements OnInit {

  private readonly STORAGE_KEY = 'uba_credit_decision_rules_v1';

  readonly categories: RuleCategory[] = [
    'Credit Score',
    'Affordability',
    'Credit History',
    'Loan Eligibility',
    'Customer Profile'
  ];

  readonly actions: RuleAction[] = [
    'Decline',
    'Manual Review'
  ];

  readonly severities: RuleSeverity[] = [
    'Critical',
    'High',
    'Medium',
    'Low'
  ];

  readonly operators = [
    { value: 'lt', label: 'Less than (<)' },
    { value: 'lte', label: 'Less than or equal to (≤)' },
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'gte', label: 'Greater than or equal to (≥)' },
    { value: 'eq', label: 'Equal to (=)' },
    { value: 'neq', label: 'Not equal to (≠)' }
  ];

  readonly fields: RuleField[] = [
    {
      key: 'creditScore',
      label: 'Credit Score',
      category: 'Credit Score',
      unit: 'points',
      min: 300,
      max: 850,
      step: 1
    },
    {
      key: 'monthlyIncome',
      label: 'Monthly Income',
      category: 'Affordability',
      unit: 'KES',
      min: 0,
      max: 100000000,
      step: 1000
    },
    {
      key: 'monthlyDebt',
      label: 'Monthly Debt Repayments',
      category: 'Affordability',
      unit: 'KES',
      min: 0,
      max: 100000000,
      step: 1000
    },
    {
      key: 'dti',
      label: 'Debt-to-Income Ratio',
      category: 'Affordability',
      unit: '%',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'requestedAmount',
      label: 'Requested Loan Amount',
      category: 'Loan Eligibility',
      unit: 'KES',
      min: 0,
      max: 100000000,
      step: 1000
    },
    {
      key: 'loanTenure',
      label: 'Loan Tenure',
      category: 'Loan Eligibility',
      unit: 'months',
      min: 1,
      max: 120,
      step: 1
    },
    {
      key: 'age',
      label: 'Applicant Age',
      category: 'Customer Profile',
      unit: 'years',
      min: 0,
      max: 120,
      step: 1
    },
    {
      key: 'overdueLoans',
      label: 'Overdue Loans',
      category: 'Credit History',
      unit: 'loans',
      min: 0,
      max: 1000,
      step: 1
    },
    {
      key: 'existingLoans',
      label: 'Existing Active Loans',
      category: 'Credit History',
      unit: 'loans',
      min: 0,
      max: 1000,
      step: 1
    },
    {
      key: 'employmentMonths',
      label: 'Employment Duration',
      category: 'Customer Profile',
      unit: 'months',
      min: 0,
      max: 600,
      step: 1
    }
  ];

  rules: LendingRule[] = [];

  searchTerm = '';
  categoryFilter = 'All';
  statusFilter = 'All';
  actionFilter = 'All';

  activeTab: 'rules' | 'tester' = 'rules';

  showRuleModal = false;
  editingRuleId: string | null = null;

  ruleForm: LendingRule = this.emptyRule();
  formError = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  showDeleteModal = false;
  deletingRule: LendingRule | null = null;

  applicant: ApplicantData = this.emptyApplicant();

  evaluation: RuleEvaluation[] = [];
  outcome: DecisionOutcome = 'Not Evaluated';
  evaluated = false;
  evaluationTime = '';

  ngOnInit(): void {
    this.loadRules();
  }

  // --------------------------------------------------
  // DEFAULT POLICY
  // --------------------------------------------------

  private defaultRules(): LendingRule[] {
    const now = new Date().toISOString();

    return [
      {
        id: 'rule-001',
        code: 'CR-001',
        name: 'Minimum Credit Score',
        description: 'Refer applicants with a credit score below the minimum acceptable threshold.',
        category: 'Credit Score',
        field: 'creditScore',
        operator: 'lt',
        value: 650,
        action: 'Manual Review',
        severity: 'High',
        priority: 10,
        enabled: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule-002',
        code: 'CR-002',
        name: 'High Debt-to-Income Ratio',
        description: 'Refer applicants whose monthly debt obligations exceed the configured affordability limit.',
        category: 'Affordability',
        field: 'dti',
        operator: 'gt',
        value: 45,
        action: 'Manual Review',
        severity: 'High',
        priority: 20,
        enabled: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule-003',
        code: 'CR-003',
        name: 'Outstanding Loan Arrears',
        description: 'Decline applications where overdue loans are reported.',
        category: 'Credit History',
        field: 'overdueLoans',
        operator: 'gt',
        value: 0,
        action: 'Decline',
        severity: 'Critical',
        priority: 30,
        enabled: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule-004',
        code: 'CR-004',
        name: 'Maximum Loan Amount',
        description: 'Refer applications above the permitted lending amount.',
        category: 'Loan Eligibility',
        field: 'requestedAmount',
        operator: 'gt',
        value: 500000,
        action: 'Manual Review',
        severity: 'Medium',
        priority: 40,
        enabled: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule-005',
        code: 'CR-005',
        name: 'Minimum Applicant Age',
        description: 'Decline applications from applicants below the minimum age.',
        category: 'Customer Profile',
        field: 'age',
        operator: 'lt',
        value: 18,
        action: 'Decline',
        severity: 'Critical',
        priority: 50,
        enabled: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule-006',
        code: 'CR-006',
        name: 'Minimum Employment Duration',
        description: 'Refer applicants with limited employment history.',
        category: 'Customer Profile',
        field: 'employmentMonths',
        operator: 'lt',
        value: 6,
        action: 'Manual Review',
        severity: 'Medium',
        priority: 60,
        enabled: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule-007',
        code: 'CR-007',
        name: 'Multiple Existing Loans',
        description: 'Refer applicants with several existing credit facilities.',
        category: 'Credit History',
        field: 'existingLoans',
        operator: 'gt',
        value: 4,
        action: 'Manual Review',
        severity: 'Medium',
        priority: 70,
        enabled: false,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  // --------------------------------------------------
  // STORAGE
  // --------------------------------------------------

  private loadRules(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);

      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.every(item =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.code === 'string' &&
            typeof item.enabled === 'boolean'
          )
        ) {
          this.rules = parsed as LendingRule[];
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load lending rules', error);
    }

    this.rules = this.defaultRules();
    this.persistRules();
  }

  private persistRules(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.rules)
      );
    } catch (error) {
      console.error('Failed to save lending rules', error);
      this.notify('Unable to save rules in this browser.', 'error');
    }
  }

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  get totalRules(): number {
    return this.rules.length;
  }

  get activeRules(): number {
    return this.rules.filter(rule => rule.enabled).length;
  }

  get inactiveRules(): number {
    return this.rules.filter(rule => !rule.enabled).length;
  }

  get criticalRules(): number {
    return this.rules.filter(
      rule => rule.enabled && rule.severity === 'Critical'
    ).length;
  }

  get filteredRules(): LendingRule[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.rules
      .filter(rule => {
        const matchesSearch =
          !search ||
          rule.name.toLowerCase().includes(search) ||
          rule.code.toLowerCase().includes(search) ||
          rule.description.toLowerCase().includes(search);

        const matchesCategory =
          this.categoryFilter === 'All' ||
          rule.category === this.categoryFilter;

        const matchesStatus =
          this.statusFilter === 'All' ||
          (this.statusFilter === 'Active' && rule.enabled) ||
          (this.statusFilter === 'Inactive' && !rule.enabled);

        const matchesAction =
          this.actionFilter === 'All' ||
          rule.action === this.actionFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesAction
        );
      })
      .sort((a, b) => a.priority - b.priority);
  }

  get availableFields(): RuleField[] {
    return this.fields.filter(
      field => field.category === this.ruleForm.category
    );
  }

  get triggeredRules(): RuleEvaluation[] {
    return this.evaluation.filter(
      result => result.matched
    );
  }

  get passedRules(): RuleEvaluation[] {
    return this.evaluation.filter(
      result => !result.matched && !result.missing
    );
  }

  get missingRules(): RuleEvaluation[] {
    return this.evaluation.filter(
      result => result.missing
    );
  }

  // --------------------------------------------------
  // FORM HELPERS
  // --------------------------------------------------

  private emptyRule(): LendingRule {
    const now = new Date().toISOString();

    return {
      id: '',
      code: '',
      name: '',
      description: '',
      category: 'Credit Score',
      field: 'creditScore',
      operator: 'lt',
      value: 650,
      action: 'Manual Review',
      severity: 'Medium',
      priority: 100,
      enabled: true,
      createdAt: now,
      updatedAt: now
    };
  }

  private emptyApplicant(): ApplicantData {
    return {
      creditScore: 680,
      monthlyIncome: 85000,
      monthlyDebt: 25000,
      requestedAmount: 150000,
      loanTenure: 12,
      age: 32,
      overdueLoans: 0,
      existingLoans: 2,
      employmentMonths: 24
    };
  }

  private nextCode(): string {
    const highest = this.rules.reduce((max, rule) => {
      const number = Number(rule.code.replace('CR-', ''));
      return Number.isFinite(number)
        ? Math.max(max, number)
        : max;
    }, 0);

    return `CR-${String(highest + 1).padStart(3, '0')}`;
  }

  onCategoryChange(): void {
    const firstField = this.availableFields[0];

    if (firstField) {
      this.ruleForm.field = firstField.key;
      this.ruleForm.value = firstField.min;
    }
  }

  getFieldLabel(field: string): string {
    return this.fields.find(item => item.key === field)?.label || field;
  }

  getFieldUnit(field: string): string {
    return this.fields.find(item => item.key === field)?.unit || '';
  }

  getOperatorLabel(operator: RuleOperator): string {
    return this.operators.find(
      item => item.value === operator
    )?.label || operator;
  }

  getOperatorSymbol(operator: RuleOperator): string {
    const symbols: Record<RuleOperator, string> = {
      lt: '<',
      lte: '≤',
      gt: '>',
      gte: '≥',
      eq: '=',
      neq: '≠'
    };

    return symbols[operator];
  }

  formatValue(value: number, field: string): string {
    const unit = this.getFieldUnit(field);

    const formatted = value.toLocaleString('en-KE', {
      maximumFractionDigits: 2
    });

    if (unit === 'KES') {
      return `KES ${formatted}`;
    }

    if (unit === '%') {
      return `${formatted}%`;
    }

    return `${formatted} ${unit}`.trim();
  }

  getCondition(rule: LendingRule): string {
    return (
      `${this.getFieldLabel(rule.field)} ` +
      `${this.getOperatorSymbol(rule.operator)} ` +
      `${this.formatValue(rule.value, rule.field)}`
    );
  }

  // --------------------------------------------------
  // CREATE AND EDIT
  // --------------------------------------------------

  openCreateModal(): void {
    this.editingRuleId = null;
    this.ruleForm = this.emptyRule();
    this.ruleForm.code = this.nextCode();
    this.formError = '';
    this.showRuleModal = true;
  }

  openEditModal(rule: LendingRule): void {
    this.editingRuleId = rule.id;
    this.ruleForm = { ...rule };
    this.formError = '';
    this.showRuleModal = true;
  }

  closeRuleModal(): void {
    this.showRuleModal = false;
    this.editingRuleId = null;
    this.formError = '';
  }

  private validateRule(): string {
    const rule = this.ruleForm;

    if (!rule.name.trim()) {
      return 'Rule name is required.';
    }

    if (rule.name.trim().length < 4) {
      return 'Rule name must contain at least 4 characters.';
    }

    if (!rule.field) {
      return 'Select a rule attribute.';
    }

    if (!Number.isFinite(Number(rule.value))) {
      return 'Enter a valid threshold.';
    }

    const field = this.fields.find(
      item => item.key === rule.field
    );

    if (!field) {
      return 'Invalid rule attribute.';
    }

    if (
      Number(rule.value) < field.min ||
      Number(rule.value) > field.max
    ) {
      return (
        `Threshold must be between ` +
        `${field.min} and ${field.max}.`
      );
    }

    if (!Number.isInteger(Number(rule.priority)) ||
        Number(rule.priority) < 1) {
      return 'Priority must be a positive whole number.';
    }

    const duplicate = this.rules.some(
      existing =>
        existing.name.trim().toLowerCase() ===
          rule.name.trim().toLowerCase() &&
        existing.id !== this.editingRuleId
    );

    if (duplicate) {
      return 'A rule with this name already exists.';
    }

    return '';
  }

  saveRule(): void {
    this.formError = this.validateRule();

    if (this.formError) {
      return;
    }

    const now = new Date().toISOString();

    const updatedRule: LendingRule = {
      ...this.ruleForm,
      name: this.ruleForm.name.trim(),
      description: this.ruleForm.description.trim(),
      value: Number(this.ruleForm.value),
      priority: Number(this.ruleForm.priority),
      updatedAt: now
    };

    if (this.editingRuleId) {
      this.rules = this.rules.map(rule =>
        rule.id === this.editingRuleId
          ? updatedRule
          : rule
      );

      this.notify('Lending rule updated successfully.');
    } else {
      updatedRule.id =
        `rule-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      updatedRule.createdAt = now;

      this.rules = [...this.rules, updatedRule];

      this.notify('Lending rule created successfully.');
    }

    this.persistRules();
    this.invalidateEvaluation();
    this.closeRuleModal();
  }

  // --------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // --------------------------------------------------

  toggleRule(rule: LendingRule): void {
    this.rules = this.rules.map(item =>
      item.id === rule.id
        ? {
            ...item,
            enabled: !item.enabled,
            updatedAt: new Date().toISOString()
          }
        : item
    );

    this.persistRules();
    this.invalidateEvaluation();

    this.notify(
      rule.enabled
        ? 'Lending rule deactivated.'
        : 'Lending rule activated.'
    );
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  requestDelete(rule: LendingRule): void {
    this.deletingRule = rule;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.deletingRule = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.deletingRule) {
      return;
    }

    this.rules = this.rules.filter(
      rule => rule.id !== this.deletingRule?.id
    );

    this.persistRules();
    this.invalidateEvaluation();
    this.cancelDelete();

    this.notify('Lending rule deleted successfully.');
  }

  // --------------------------------------------------
  // POLICY EVALUATION
  // --------------------------------------------------

  get applicantDti(): number | null {
    const income = this.applicant.monthlyIncome;
    const debt = this.applicant.monthlyDebt;

    if (
      income === null ||
      debt === null ||
      !Number.isFinite(income) ||
      !Number.isFinite(debt) ||
      income <= 0 ||
      debt < 0
    ) {
      return null;
    }

    return (debt / income) * 100;
  }

  private getApplicantValue(field: string): number | null {
    if (field === 'dti') {
      return this.applicantDti;
    }

    const key = field as keyof ApplicantData;
    const value = this.applicant[key];

    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return null;
    }

    return value;
  }

  private matches(
    actual: number,
    operator: RuleOperator,
    expected: number
  ): boolean {
    switch (operator) {
      case 'lt':
        return actual < expected;

      case 'lte':
        return actual <= expected;

      case 'gt':
        return actual > expected;

      case 'gte':
        return actual >= expected;

      case 'eq':
        return actual === expected;

      case 'neq':
        return actual !== expected;

      default:
        return false;
    }
  }

  private invalidateEvaluation(): void {
    this.evaluated = false;
    this.evaluation = [];
    this.outcome = 'Not Evaluated';
    this.evaluationTime = '';
  }

  onApplicantChange(): void {
    this.invalidateEvaluation();
  }

  evaluateApplicant(): void {
    const active = this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    this.evaluation = active.map((rule): RuleEvaluation => {
      const actual = this.getApplicantValue(rule.field);

      const missing =
        actual === null ||
        !Number.isFinite(actual);

      return {
        rule,
        actual,
        missing,
        matched: !missing &&
          this.matches(
            actual as number,
            rule.operator,
            rule.value
          )
      };
    });

    if (active.length === 0) {
      this.outcome = 'Not Evaluated';
    } else if (this.evaluation.some(item => item.missing)) {
      this.outcome = 'Incomplete Information';
    } else if (
      this.evaluation.some(
        item => item.matched && item.rule.action === 'Decline'
      )
    ) {
      this.outcome = 'Decline';
    } else if (
      this.evaluation.some(
        item =>
          item.matched &&
          item.rule.action === 'Manual Review'
      )
    ) {
      this.outcome = 'Manual Review';
    } else {
      this.outcome = 'Approve';
    }

    this.evaluated = true;
    this.evaluationTime = new Date().toLocaleString('en-KE');
  }

  resetApplicant(): void {
    this.applicant = this.emptyApplicant();
    this.invalidateEvaluation();
  }

  // --------------------------------------------------
  // RESTORE POLICY
  // --------------------------------------------------

  resetPolicies(): void {
    const confirmed = window.confirm(
      'Restore the original lending rules? ' +
      'All custom rules and policy changes will be lost.'
    );

    if (!confirmed) {
      return;
    }

    this.rules = this.defaultRules();
    this.persistRules();
    this.invalidateEvaluation();

    this.notify('Lending rules restored successfully.');
  }

  // --------------------------------------------------
  // UI UTILITIES
  // --------------------------------------------------

  setTab(tab: 'rules' | 'tester'): void {
    this.activeTab = tab;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = 'All';
    this.statusFilter = 'All';
    this.actionFilter = 'All';
  }

  notify(
    message: string,
    type: 'success' | 'error' = 'success'
  ): void {
    this.toastMessage = message;
    this.toastType = type;
  }

  dismissToast(): void {
    this.toastMessage = '';
  }

  trackByRule(index: number, rule: LendingRule): string {
    return rule.id;
  }

  getSeverityClass(severity: RuleSeverity): string {
    return severity.toLowerCase();
  }

  getActionClass(action: RuleAction): string {
    return action === 'Decline' ? 'decline' : 'review';
  }

  getOutcomeClass(): string {
    switch (this.outcome) {
      case 'Approve':
        return 'approve';
      case 'Decline':
        return 'decline';
      case 'Manual Review':
        return 'review';
      default:
        return 'neutral';
    }
  }
}
