import { Component } from '@angular/core';

type FieldKey = 'credit_score' | 'dti' | 'overdue_loans' | 'loan_amount' | 'employment_months';
type Operator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq';
interface RuleForm { name: string; category: string; field: FieldKey; operator: Operator; value: number | null; action: string; severity: string; enabled: boolean; }
interface PolicyRule extends Omit<RuleForm, 'value'> { value: number; code: string; condition: string; }

@Component({ selector: 'app-decision-rules', templateUrl: './decision-rules.component.html', styleUrls: ['./decision-rules.component.scss'] })
export class DecisionRulesComponent {
  readonly categories = ['Credit Score', 'Affordability', 'Credit History', 'Loan Eligibility', 'Customer Profile'];
  readonly fields: Array<{ key: FieldKey; label: string; category: string }> = [
    { key: 'credit_score', label: 'Credit score', category: 'Credit Score' },
    { key: 'dti', label: 'Debt-to-income ratio (%)', category: 'Affordability' },
    { key: 'overdue_loans', label: 'Overdue loans', category: 'Credit History' },
    { key: 'loan_amount', label: 'Requested loan amount', category: 'Loan Eligibility' },
    { key: 'employment_months', label: 'Employment months', category: 'Customer Profile' }
  ];
  readonly operators: Array<{ key: Operator; label: string }> = [
    { key: 'lt', label: '< Less than' }, { key: 'lte', label: '≤ Less than or equal' },
    { key: 'gt', label: '> Greater than' }, { key: 'gte', label: '≥ Greater than or equal' },
    { key: 'eq', label: '= Equal' }, { key: 'neq', label: '≠ Not equal' }
  ];
  private readonly storageKey = 'eclectics-credit-decision-rules-v1';
  rules = this.readSaved() || this.initialRules();
  searchTerm = ''; categoryFilter = 'All'; statusFilter = 'All'; showForm = false;
  editingCode: string | null = null; form = this.emptyForm(); formError = ''; notice = ''; outcome = '';
  applicant: Record<FieldKey, number | null> = { credit_score: null, dti: null, overdue_loans: null, loan_amount: null, employment_months: null };
  evaluation: Array<{ rule: PolicyRule; missing: boolean; matched: boolean }> | null = null;
  trackRule(_index: number, rule: PolicyRule): string { return rule.code; }
  get totalRules(): number { return this.rules.length; }
  get activeRules(): number { return this.rules.filter(r => r.enabled).length; }
  get inactiveRules(): number { return this.totalRules - this.activeRules; }
  get filteredRules(): PolicyRule[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.rules.filter(r =>
      (!q || [r.code, r.name, r.category, r.condition].some(v => v.toLowerCase().includes(q))) &&
      (this.categoryFilter === 'All' || r.category === this.categoryFilter) &&
      (this.statusFilter === 'All' || (this.statusFilter === 'Active' ? r.enabled : !r.enabled))
    );
  }
  get availableFields(): typeof this.fields { return this.fields.filter(f => f.category === this.form.category); }

  private emptyForm(): RuleForm {
    return { name: '', category: 'Credit Score', field: 'credit_score', operator: 'lt', value: null,
      action: 'Manual Review', severity: 'Medium', enabled: true };
  }
  private initialRules(): PolicyRule[] {
    const defaults: Omit<PolicyRule, 'code' | 'condition'>[] = [
      { name: 'Low Credit Score', category: 'Credit Score', field: 'credit_score', operator: 'lt', value: 650, action: 'Manual Review', severity: 'High', enabled: true },
      { name: 'High Debt-to-Income Ratio', category: 'Affordability', field: 'dti', operator: 'gt', value: 45, action: 'Decline', severity: 'High', enabled: true },
      { name: 'Existing Loan Arrears', category: 'Credit History', field: 'overdue_loans', operator: 'gt', value: 0, action: 'Decline', severity: 'Critical', enabled: true },
      { name: 'Loan Amount Above Limit', category: 'Loan Eligibility', field: 'loan_amount', operator: 'gt', value: 500000, action: 'Manual Review', severity: 'Medium', enabled: true },
      { name: 'Short Employment History', category: 'Customer Profile', field: 'employment_months', operator: 'lt', value: 6, action: 'Manual Review', severity: 'Medium', enabled: false }
    ];
    return defaults.map((r, i) => this.completeRule(r, `POL-${String(i + 1).padStart(3, '0')}`));
  }
  private completeRule(r: Omit<PolicyRule, 'code' | 'condition'>, code: string): PolicyRule {
    const field = this.fields.find(f => f.key === r.field)?.label || r.field;
    const op = this.operators.find(o => o.key === r.operator)?.label.split(' ')[0] || r.operator;
    return { ...r, code, condition: `${field} ${op} ${r.value}` };
  }
  private readSaved(): PolicyRule[] | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === null) { return null; }
      const value: unknown = JSON.parse(raw);
      return Array.isArray(value) && value.every(r => this.validRule(r)) ? value as PolicyRule[] : null;
    } catch { return null; }
  }
  private validRule(r: any): boolean {
    return !!r && typeof r.code === 'string' && typeof r.name === 'string' &&
      this.fields.some(f => f.key === r.field) && this.operators.some(o => o.key === r.operator) &&
      typeof r.value === 'number' && Number.isFinite(r.value) && typeof r.enabled === 'boolean' &&
      ['Approve', 'Manual Review', 'Decline'].includes(r.action) &&
      ['Low', 'Medium', 'High', 'Critical'].includes(r.severity) && typeof r.category === 'string' &&
      typeof r.condition === 'string';
  }
  private persist(): void {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.rules)); this.notice = ''; }
    catch { this.notice = 'Changes are active in this browser session but could not be saved locally.'; }
    this.evaluation = null;
    this.outcome = '';
  }
  toggle(rule: PolicyRule): void {
    this.rules = this.rules.map(r => r.code === rule.code ? { ...r, enabled: !r.enabled } : r);
    this.persist();
  }
  openCreate(): void { this.editingCode = null; this.form = this.emptyForm(); this.formError = ''; this.showForm = true; }
  openEdit(rule: PolicyRule): void {
    this.editingCode = rule.code;
    this.form = { name: rule.name, category: rule.category, field: rule.field, operator: rule.operator,
      value: rule.value, action: rule.action, severity: rule.severity, enabled: rule.enabled };
    this.formError = '';
    this.showForm = true;
  }
  closeForm(): void { this.showForm = false; this.formError = ''; }
  setCategory(category: string): void {
    this.form.category = category;
    this.form.field = this.availableFields[0].key;
  }
  saveRule(): void {
    const name = this.form.name.trim();
    if (!name || this.form.value === null || !Number.isFinite(Number(this.form.value))) {
      this.formError = 'Enter a rule name and a valid numeric threshold.';
      return;
    }
    const value = Number(this.form.value);
    if (value < 0 || (this.form.field === 'dti' && value > 100) ||
      (this.form.field === 'credit_score' && value > 850) ||
      (['overdue_loans', 'employment_months'].includes(this.form.field) && !Number.isInteger(value))) {
      this.formError = 'Enter a valid non-negative threshold for the selected attribute.';
      return;
    }
    const code = this.editingCode || this.nextCode();
    const updated = this.completeRule({ name, category: this.form.category, field: this.form.field,
      operator: this.form.operator, value, action: this.form.action,
      severity: this.form.severity, enabled: this.form.enabled }, code);
    this.rules = this.editingCode
      ? this.rules.map(r => r.code === code ? updated : r)
      : [...this.rules, updated];
    this.persist(); this.closeForm();
  }
  private nextCode(): string {
    const ids = this.rules.map(r => Number(r.code.match(/^POL-(\d+)$/)?.[1] || 0));
    return `POL-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
  }
  deleteRule(rule: PolicyRule): void {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) { return; }
    this.rules = this.rules.filter(r => r.code !== rule.code);
    this.persist();
  }
  private matches(actual: number, operator: Operator, expected: number): boolean {
    switch (operator) {
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
    }
  }
  evaluate(): void {
    this.evaluation = this.rules.filter(r => r.enabled).map(rule => {
      const actual = this.applicant[rule.field];
      return { rule, missing: actual === null || !Number.isFinite(actual),
        matched: actual !== null && Number.isFinite(actual) && this.matches(actual, rule.operator, rule.value) };
    });
    if (this.evaluation.some(x => x.missing)) { this.outcome = 'Incomplete Information'; return; }
    const matched = this.evaluation.filter(x => x.matched);
    this.outcome = matched.some(x => x.rule.action === 'Decline') ? 'Decline'
      : matched.some(x => x.rule.action === 'Manual Review') ? 'Manual Review'
      : 'Approve';
  }
  resetPolicies(): void {
    if (!window.confirm('Restore the default lending rules? All custom rules and changes will be lost.')) { return; }
    this.rules = this.initialRules(); this.persist();
  }
}
