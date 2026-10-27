import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';
import { ApplicationDraft, CreditDataService } from '../credit-data.service';
import { APPLICATIONS, COUNTRIES, PRODUCTS, CreditDecision, DecisionRule, PolicySettings } from '../credit-demo.data';
import { BulkApplicationRow, LoanAssessment, LoanCheck, LoanCustomer, LoanCustomerFacts, LoanEvent, LoanRecord, LOAN_STATUSES, LOAN_STORAGE_KEY, isPending, latestAssessment } from './loan-workflow.models';
import { previewLoanScenario, simulateLoanAi, simulatedRisk, simulatedLoanProbability, validLoanAi } from './loan-ai.engine';
import { recommendLoanLimit, validLoanLimit } from './loan-limit.engine';
import { combineLoanDecisions, customerFacts, DEMO_LOAN_CUSTOMER_FACTS, evaluateLoanEligibility, validLoanEligibility } from './loan-eligibility.engine';
import { KENYA_LOAN_CUSTOMERS } from './loan-customers.data';
import { LoanIntegrationService } from './loan-integration.service';

function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function loanId(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  return prefix + '-' + suffix;
}
export function validateLoanDraft(input: ApplicationDraft): void {
  if (!input || ['applicant', 'phone', 'nationalId', 'branch', 'channel'].some(key => typeof (input as any)[key] !== 'string' || !(input as any)[key].trim())) {
    throw new Error('Customer identity, contact, branch and channel are required.');
  }
  if (!PRODUCTS.includes(input.product) || !COUNTRIES.includes(input.country)) { throw new Error('Choose a supported product and country.'); }
  if (!['Salaried', 'Business owner', 'Self employed'].includes(input.employment) || !['Clean', 'Thin file', 'Adverse'].includes(input.bureau)) { throw new Error('Confirm valid employment and bureau information.'); }
  if (!Number.isFinite(input.amount) || input.amount < 10000 || !Number.isInteger(input.tenorMonths) || input.tenorMonths < 1 || input.tenorMonths > 60) { throw new Error('Enter an amount of at least KSh 10,000 and a tenor of 1–60 whole months.'); }
  if (!Number.isFinite(input.income) || input.income <= 0 || !Number.isFinite(input.obligations) || input.obligations < 0) { throw new Error('Income must be positive and obligations cannot be negative.'); }
}

@Injectable({ providedIn: 'root' })
export class LoanWorkflowService implements OnDestroy {
  readonly products = PRODUCTS;
  readonly statuses = LOAN_STATUSES;
  readonly customers: LoanCustomer[] = copy(KENYA_LOAN_CUSTOMERS);
  // Older saved applications retain their original identity and remain readable.
  private readonly legacyCustomers: LoanCustomer[] = [0, 1, 2, 5, 11].map((index, position) => {
    const app = APPLICATIONS[index];
    return { id: 'DEMO-CUSTOMER-' + (index + 1), source: 'Mock customer from original portal', profile: {
      applicant: app.applicant, nationalId: app.nationalId, phone: app.phone, country: app.country, branch: app.branch,
      product: app.product, amount: app.amount, tenorMonths: app.tenorMonths, income: app.income, obligations: app.obligations,
      employment: app.employment, bureau: app.bureau, channel: app.channel
    }, facts: customerFacts(DEMO_LOAN_CUSTOMER_FACTS[position]) };
  });
  private subject = new BehaviorSubject<LoanRecord[]>([]);
  readonly applications$ = this.subject.asObservable();
  storageError = '';
  private inFlight = new Set<string>();
  private onStorage = (event: StorageEvent): void => { if (event.key === LOAN_STORAGE_KEY || event.key === null) { this.restore(); } };

  constructor(public credit: CreditDataService, private auth: AuthService, public integration: LoanIntegrationService = new LoanIntegrationService()) {
    this.restore();
    if (typeof window !== 'undefined') { window.addEventListener('storage', this.onStorage); }
  }
  ngOnDestroy(): void { if (typeof window !== 'undefined') { window.removeEventListener('storage', this.onStorage); } }
  get applications(): LoanRecord[] { return copy(this.subject.value); }
  get pendingCount(): number { return this.subject.value.filter(isPending).length; }
  find(id: string): LoanRecord | undefined { const record = this.subject.value.find(x => x.id === id); return record ? copy(record) : undefined; }
  latest = latestAssessment;
  pending = isPending;
  money(value: number): string { return this.credit.money(value); }
  advice(assessment: LoanAssessment): CreditDecision { return combineLoanDecisions(combineLoanDecisions(assessment.ai?.advice || assessment.recommendation, assessment.eligibility?.decision || 'Approved'), assessment.integration?.decision || 'Approved'); }
  customerRisk(customer: LoanCustomer): string { return simulatedRisk(simulatedLoanProbability(customer.profile)); }
  bureauLabel(a: LoanAssessment): string { return a.eligibility?.customer.crbBlacklisted === true ? 'Blacklisted' : a.eligibility?.customer.crbDefaulter === true ? 'Defaulter listed' : a.input.bureau; }
  recommendationLabel(a: LoanAssessment): string { return a.limit?.outcome || (this.advice(a) === 'Approved' ? 'Support approval' : this.advice(a) === 'Declined' ? 'Recommend decline' : 'Refer for review'); }
  limitSummary(a: LoanAssessment): string {
    const l = a.limit; if (!l) { return ''; }
    return l.offer ? (l.outcome === 'Refer for review' ? 'A proposed amount of ' : 'An offer of ') + this.money(l.recommendedAmount) + ' is indicated against the ' + this.money(l.requestedAmount) + ' request. The risk-adjusted limit is ' + this.money(l.maximumAmount) + ' at ' + l.tenorMonths + ' months.' + (l.outcome === 'Refer for review' ? ' Officer review and an acknowledged exception are required for approval.' : '')
      : l.outcome === 'Decline' ? 'No eligible principal is recommended at this term. Review the decisive policy or affordability finding.' : (l.maximumAmount > 0 ? 'Indicative repayment capacity is ' + this.money(l.maximumAmount) + '. ' : '') + 'No supported offer is established until the outstanding findings are resolved.';
  }
  facilityAdvice(a: LoanAssessment): CreditDecision { return a.limit ? a.limit.outcome.startsWith('Approve') ? 'Approved' : a.limit.outcome === 'Decline' ? 'Declined' : 'Refer' : this.advice(a); }
  approvalNeedsOverride(a: LoanAssessment, basis: 'requested' | 'recommended'): boolean {
    if (basis === 'recommended') { return !a.limit?.offer || !a.limit.outcome.startsWith('Approve'); }
    return this.advice(a) !== 'Approved' || (!!a.limit && a.limit.outcome !== 'Approve full amount');
  }
  riskFor(assessment: LoanAssessment): string { return assessment.ai?.risk || assessment.risk; }
  previewScenario = previewLoanScenario;
  initials(name: string): string { return name.split(' ').filter(Boolean).slice(0, 2).map(x => x.charAt(0)).join('').toUpperCase(); }
  downloadAssessment(record: LoanRecord): void {
    this.download(JSON.stringify(record, null, 2), record.id + '-assessment.json', 'application/json');
  }
  exportApplications(records: LoanRecord[]): void {
    const headers = ['application_id', 'customer_name', 'national_id', 'requested_amount', 'scorecard_score', 'risk_outlook', 'simulated_default_likelihood', 'combined_recommendation', 'officer_status', 'submitted_at', 'model_origin', 'recommended_limit', 'recommended_offer', 'limit_outcome', 'approved_amount', 'offer_score', 'offer_simulated_likelihood', 'national_id_verified', 'kyc_completed', 'account_tenure_months', 'crb_defaulter', 'crb_blacklisted', 'active_loans', 'active_lenders', 'previous_institution_default', 'employment_tenure_months', 'age_years', 'average_balance_6m', 'eligibility_recommendation'];
    const quote = (value: unknown): string => {
      let s = String(value ?? ''); if (/^[=+\-@\t\r]/.test(s)) { s = "'" + s; }
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const rows = records.map(record => { const a = latestAssessment(record); const c = a.eligibility?.customer; return [record.id, record.customerName, record.nationalId, a.input.amount, a.score, this.riskFor(a), a.ai?.probability ?? '', this.advice(a), record.status, record.submittedAt, a.ai?.origin || 'NO_ENSEMBLE_SNAPSHOT', a.limit?.maximumAmount ?? '', a.limit?.recommendedAmount ?? '', a.limit?.outcome ?? '', record.approvedAmount ?? '', a.limit?.offer?.score ?? '', a.limit?.offer?.probability ?? '', c?.nationalIdVerified ?? '', c?.kycCompleted ?? '', c?.accountTenureMonths ?? '', c?.crbDefaulter ?? '', c?.crbBlacklisted ?? '', c?.activeLoans ?? '', c?.activeLenders ?? '', c?.previousInstitutionDefault ?? '', c?.employmentTenureMonths ?? '', c?.ageYears ?? '', c?.averageBalance6m ?? '', a.eligibility?.decision ?? '']; });
    this.download([headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n'), 'credit-applications.csv', 'text/csv;charset=utf-8');
  }
  private download(content: string, name: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a');
    link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  lookup(nationalId: string): LoanCustomer | null {
    const id = nationalId.trim().toUpperCase();
    const customer = [...this.customers, ...this.legacyCustomers].find(x => x.profile.nationalId.toUpperCase() === id);
    return customer ? copy(customer) : null;
  }
  private officer(): Pick<LoanEvent, 'officer' | 'officerSource'> {
    const current = this.auth.getCurrentUser();
    const identity = current?.username || current?.email || current?.id;
    return identity ? { officer: String(identity), officerSource: 'Portal session' } : { officer: 'Demo officer', officerSource: 'Demo identity' };
  }
  private readStored(): LoanRecord[] {
    const raw = localStorage.getItem(LOAN_STORAGE_KEY);
    if (!raw) { return []; }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || (parsed as any).schema !== 1 || !Array.isArray((parsed as any).applications)) { throw new Error('Unrecognised saved workflow format.'); }
    const apps: LoanRecord[] = (parsed as any).applications;
    if (!apps.every(x => this.validRecord(x)) || new Set(apps.map(x => x.id)).size !== apps.length) { throw new Error('Saved application data is incomplete or inconsistent.'); }
    return apps;
  }
  private validRecord(record: LoanRecord): boolean {
    try {
      if (!record || typeof record.id !== 'string' || !record.id.startsWith('LOAN-') || !this.lookup(record.nationalId) || !LOAN_STATUSES.includes(record.status) || !Array.isArray(record.assessments) || !record.assessments.length || !Array.isArray(record.history) || !Array.isArray(record.submissionKeys)) { return false; }
      if (!record.submissionKeys.every(x => typeof x === 'string') || !Number.isFinite(Date.parse(record.submittedAt)) || !Number.isFinite(Date.parse(record.updatedAt))) { return false; }
      if (!record.assessments.every((a, index) => {
        validateLoanDraft(a.input);
        if (a.ai !== undefined && !validLoanAi(a.ai)) { return false; }
        if (a.limit !== undefined && !validLoanLimit(a.limit, a.input, a.policy)) { return false; }
        if (a.integration && (a.integration.version !== 'connector-demo-1' || !Number.isFinite(Date.parse(a.integration.checkedAt)) || !['Approved', 'Refer'].includes(a.integration.decision)
          || !Array.isArray(a.integration.reasons) || !a.integration.reasons.every(r => typeof r === 'string') || !Array.isArray(a.integration.connectors) || a.integration.connectors.length !== 4
          || new Set(a.integration.connectors.map(c => c.id)).size !== 4 || !a.integration.connectors.every(c => ['core', 'bureau', 'identity', 'collections'].includes(c.id) && typeof c.name === 'string' && ['Live', 'Degraded', 'Paused'].includes(c.status))
          || (a.integration.decision === 'Approved' && (a.integration.reasons.length > 0 || a.integration.connectors.some(c => c.status !== 'Live')))
          || (a.integration.decision === 'Refer' && !a.integration.reasons.length))) { return false; }
        if (a.limit?.offer && a.integration?.decision === 'Refer') { return false; }
        if (a.eligibility !== undefined && (!validLoanEligibility(a.eligibility, a.input, a.policy) || JSON.stringify(a.checks) !== JSON.stringify(a.eligibility.checks))) { return false; }
        if (a.limit?.offer && a.eligibility && evaluateLoanEligibility(a.eligibility.customer, { ...a.input, amount: a.limit.recommendedAmount }, a.policy, a.eligibility.policy).decision !== 'Approved') { return false; }
        if (a.ai) {
          const expected: CreditDecision = a.recommendation === 'Declined' ? 'Declined' : a.recommendation === 'Approved' && a.ai.risk === 'Low' && a.affordability.dti <= a.policy.maxDti ? 'Approved' : 'Refer';
          if (a.ai.advice !== expected) { return false; }
        }
        return a.version === index + 1 && a.input.nationalId === record.nationalId && a.mode === 'SIMULATED' && a.modelAvailable === false && Number.isFinite(a.score) && a.score >= 300 && a.score <= 900 && ['Low', 'Medium', 'High'].includes(a.risk) && ['Approved', 'Declined', 'Refer'].includes(a.recommendation) && Array.isArray(a.checks) && a.checks.every(c => typeof c.name === 'string' && typeof c.observed === 'string' && typeof c.requirement === 'string' && ['Pass', 'Triggered', 'Not implemented', 'Needs review'].includes(c.result)) && Array.isArray(a.contributions) && a.contributions.every(c => typeof c.label === 'string' && Number.isFinite(c.impact)) && a.baseScore + a.contributions.reduce((sum, c) => sum + c.impact, 0) === a.score && Array.isArray(a.reasons) && a.reasons.every(x => typeof x === 'string') && Array.isArray(a.limitations) && a.limitations.every(x => typeof x === 'string') && Number.isFinite(a.affordability?.dti) && Number.isFinite(a.affordability?.installment) && Number.isFinite(Date.parse(a.assessedAt));
      })) { return false; }
      if (!record.history.every(e => typeof e.reason === 'string' && typeof e.informationRequested === 'string' && typeof e.officer === 'string' && ['Portal session', 'Demo identity'].includes(e.officerSource) && ['Assessed', 'Reassessed', 'Approve', 'Decline', 'Request information'].includes(e.action) && (e.previousStatus === 'Not submitted' || LOAN_STATUSES.includes(e.previousStatus)) && LOAN_STATUSES.includes(e.status) && Number.isFinite(Date.parse(e.timestamp)) && e.assessmentVersion >= 1 && e.assessmentVersion <= record.assessments.length)) { return false; }
      const last = record.history[record.history.length - 1];
      for (const event of record.history) {
        if (event.approvedAmount !== undefined || event.approvedTenorMonths !== undefined || event.approvalBasis !== undefined) {
          const a = record.assessments[event.assessmentVersion - 1];
          if (event.action !== 'Approve' || !Number.isFinite(event.approvedAmount) || event.approvedAmount! < 10000 || event.approvedAmount! > a.input.amount
            || event.approvedTenorMonths !== a.input.tenorMonths || !['Requested amount', 'Recommended offer'].includes(event.approvalBasis!)) { return false; }
          if (event.approvalBasis === 'Requested amount' && event.approvedAmount !== a.input.amount) { return false; }
          if (event.approvalBasis === 'Recommended offer' && (!a.limit?.offer || event.approvedAmount !== a.limit.recommendedAmount || a.limit.outcome === 'Decline')) { return false; }
          if (this.approvalNeedsOverride(a, event.approvalBasis === 'Recommended offer' ? 'recommended' : 'requested') && !event.policyOverride) { return false; }
        }
      }
      if (record.approvedAmount !== undefined && (record.status !== 'Approved' || last?.approvedAmount !== record.approvedAmount)) { return false; }
      if (last?.approvedAmount !== undefined && last.approvedAmount !== record.approvedAmount) { return false; }
      return !!last && last.status === record.status;
    } catch { return false; }
  }
  private restore(): void {
    try { this.subject.next(copy(this.readStored())); this.storageError = ''; }
    catch (error) { this.storageError = 'Saved workflow could not be read. Existing data was retained. ' + this.errorMessage(error); }
  }
  private commit(next: LoanRecord[]): void {
    try { localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify({ schema: 1, applications: next })); }
    catch { throw new Error('The browser could not save this change. Free browser storage and retry; no change was recorded.'); }
    this.storageError = ''; this.subject.next(copy(next));
  }
  errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'The assessment failed. Please retry.'; }

  validateBulk(rows: BulkApplicationRow[]): BulkApplicationRow[] {
    return rows.map(row => {
      const next = copy(row); const customer = this.lookup(row.nationalId);
      if (!customer) { next.errors.push('Customer not found. Use an ID from the available customer directory.'); }
      if (!PRODUCTS.includes(row.product)) { next.errors.push('Unknown product. Use an exact product name from the form.'); }
      if (row.applicationId) {
        const existing = this.find(row.applicationId);
        if (!existing || existing.nationalId.toUpperCase() !== row.nationalId.toUpperCase()) { next.errors.push('Reassessment ID must belong to this customer.'); }
        else if (!isPending(existing)) { next.errors.push('Finalised applications cannot be reassessed.'); }
        if (row.reassessmentNote.trim().length < 10) { next.errors.push('Reassessment needs a note of at least 10 characters.'); }
      }
      next.state = next.errors.length ? 'Invalid' : 'Ready'; next.submissionKey = next.submissionKey || loanId('BULK'); return next;
    });
  }
  async submit(input: ApplicationDraft, options: { applicationId?: string; submissionKey: string; reassessmentNote?: string; customerFacts?: Partial<LoanCustomerFacts> }): Promise<LoanRecord> {
    const draft = copy(input); validateLoanDraft(draft);
    const customer = this.lookup(draft.nationalId);
    if (!customer) { throw new Error('Customer not found. Check the ID against the available customer directory.'); }
    const facts = customerFacts(options.customerFacts === undefined ? customer.facts : options.customerFacts);
    draft.nationalId = customer.profile.nationalId; draft.applicant = customer.profile.applicant;
    if (!options.submissionKey) { throw new Error('A submission reference is required.'); }
    const existingResult = this.readStored().find(x => x.submissionKeys.includes(options.submissionKey));
    if (existingResult) { return copy(existingResult); }
    const lock = options.applicationId || options.submissionKey;
    if (this.inFlight.has(lock)) { throw new Error('This application is already being assessed.'); }
    this.inFlight.add(lock);
    try {
      const original = options.applicationId ? this.find(options.applicationId) : undefined;
      if (options.applicationId && (!original || original.nationalId !== draft.nationalId || !isPending(original))) { throw new Error('Only an existing, undecided application for this customer can be reassessed.'); }
      if (original && (options.reassessmentNote || '').trim().length < 10) { throw new Error('Explain the new information in a reassessment note of at least 10 characters.'); }
      // The source ZIP has no lending backend/model. Execute its existing illustrative scorecard explicitly.
      await Promise.resolve();
      const assessment = this.assess(draft, (original?.assessments.length || 0) + 1, facts);
      const now = new Date().toISOString();
      const record: LoanRecord = original ? copy(original) : { id: loanId('LOAN'), customerId: customer.id, nationalId: draft.nationalId, customerName: draft.applicant,
        submittedAt: now, updatedAt: now, status: 'Awaiting decision', submissionKeys: [], assessments: [], history: [] };
      const previousStatus = original?.status || 'Not submitted';
      record.assessments.push(assessment); record.status = 'Awaiting decision'; record.updatedAt = now; record.submissionKeys.push(options.submissionKey);
      record.history.push({ id: loanId('EVENT'), action: original ? 'Reassessed' : 'Assessed', ...this.officer(), timestamp: now,
        previousStatus, status: record.status, reason: original ? (options.reassessmentNote || '').trim() : 'Assessment completed; officer decision required.', informationRequested: '', assessmentVersion: assessment.version, policyOverride: false });
      const latest = this.readStored(); const concurrent = original ? latest.find(x => x.id === original.id) : undefined;
      if (original && (!concurrent || concurrent.updatedAt !== original.updatedAt || concurrent.assessments.length !== original.assessments.length || concurrent.history.length !== original.history.length)) { throw new Error('The application changed during assessment. Reload it before retrying.'); }
      const duplicate = latest.find(x => x.submissionKeys.includes(options.submissionKey));
      if (duplicate) { return copy(duplicate); }
      this.commit([record, ...latest.filter(x => x.id !== record.id)]); return copy(record);
    } finally { this.inFlight.delete(lock); }
  }
  async submitBulkRow(row: BulkApplicationRow): Promise<LoanRecord> {
    if (row.errors.length || row.state === 'Invalid') { throw new Error('Correct this row before assessment.'); }
    const customer = this.lookup(row.nationalId);
    if (!customer) { throw new Error('Customer not found.'); }
    return this.submit({ ...customer.profile, amount: row.amount, tenorMonths: row.tenorMonths, product: row.product }, { applicationId: row.applicationId || undefined, submissionKey: row.submissionKey, reassessmentNote: row.reassessmentNote });
  }
  decide(id: string, action: 'Approve' | 'Decline' | 'Request information', reason: string, expectedVersion: number, acknowledgeOverride = false, approvalBasis: 'requested' | 'recommended' = 'requested'): LoanRecord {
    const apps = this.readStored(); const record = apps.find(x => x.id === id);
    if (!record || !isPending(record)) { throw new Error('This application is missing or already finalised.'); }
    const assessment = latestAssessment(record); const text = reason.trim();
    if (assessment.version !== expectedVersion) { throw new Error('A newer assessment is available. Review it before deciding.'); }
    if (text.length < 10 || text.length > 2000) { throw new Error('Record a reason or information request of 10–2,000 characters.'); }
    if (!['Approve', 'Decline', 'Request information'].includes(action)) { throw new Error('Unknown decision action.'); }
    if (action === 'Approve' && record.status === 'More information required') { throw new Error('Reassess the application after receiving the requested information before approval.'); }
    if (!['requested', 'recommended'].includes(approvalBasis)) { throw new Error('Choose the requested amount or the assessed recommended offer.'); }
    if (action === 'Approve' && approvalBasis === 'recommended' && (!assessment.limit?.offer || assessment.limit.outcome === 'Decline')) { throw new Error('No supported recommended offer exists. Reassess before approving revised terms.'); }
    const approvedAmount = approvalBasis === 'recommended' ? assessment.limit?.recommendedAmount : assessment.input.amount;
    const override = action === 'Approve' && this.approvalNeedsOverride(assessment, approvalBasis);
    if (override && (!acknowledgeOverride || text.length < 20)) { throw new Error('Acknowledge the policy override and explain it in at least 20 characters.'); }
    const previousStatus = record.status;
    record.status = action === 'Approve' ? 'Approved' : action === 'Decline' ? 'Declined' : 'More information required';
    record.updatedAt = new Date().toISOString();
    if (action === 'Approve') { record.approvedAmount = approvedAmount; }
    record.history.push({ id: loanId('EVENT'), action, ...this.officer(), timestamp: record.updatedAt, previousStatus, status: record.status,
      reason: text, informationRequested: action === 'Request information' ? text : '', assessmentVersion: assessment.version, policyOverride: override,
      ...(action === 'Approve' ? { approvedAmount, approvedTenorMonths: assessment.input.tenorMonths, approvalBasis: approvalBasis === 'recommended' ? 'Recommended offer' as const : 'Requested amount' as const } : {}) });
    this.commit(apps); return copy(record);
  }
  private assess(input: ApplicationDraft, version: number, facts: LoanCustomerFacts): LoanAssessment {
    const preview = this.credit.scoreDraft(input); const policy = copy(this.credit.policy); const rules = copy(this.credit.rules);
    if (![policy.approveFrom, policy.declineBelow, policy.maxDti, policy.maxAmount].every(Number.isFinite) || policy.declineBelow >= policy.approveFrom || policy.declineBelow < 300 || policy.approveFrom > 900 || policy.maxDti <= 0 || policy.maxDti > 1 || policy.maxAmount < 10000) { throw new Error('The saved source credit policy is invalid. Correct its cutoffs and limits before assessment.'); }
    if (!Number.isFinite(preview.score) || !Number.isFinite(preview.dti)) { throw new Error('The illustrative scorecard returned an invalid assessment.'); }
    const contributions = [...copy(preview.factors), { label: 'Tenor adjustment', impact: input.tenorMonths > 36 ? -15 : 0 }];
    const raw = 500 + contributions.reduce((sum, x) => sum + x.impact, 0);
    if (raw !== preview.score) { contributions.push({ label: 'Score range clamp (300–900)', impact: preview.score - raw }); }
    const installment = input.amount / input.tenorMonths;
    const eligibility = evaluateLoanEligibility(facts, input, policy);
    const integration = this.integration.availability();
    const limit = recommendLoanLimit(input, policy, candidate => {
      const scored = this.credit.scoreDraft(candidate);
      return { ...scored, eligibilityDecision: evaluateLoanEligibility(facts, candidate, policy, eligibility.policy).decision, dataDecision: integration.decision };
    });
    if (!limit.offer && eligibility.reasons.length) { limit.reasons.push(...eligibility.reasons); }
    if (!limit.offer && integration.reasons.length) { limit.reasons.push(...integration.reasons); }
    return { version, assessedAt: new Date().toISOString(), input: copy(input), mode: 'SIMULATED', modelAvailable: false,
      modelMessage: 'The ensemble uses deterministic model simulations for demonstration. Its likelihoods are illustrative, uncalibrated and do not come from trained estimators or an inference API.',
      score: preview.score, scoreMinimum: 300, scoreMaximum: 900, risk: preview.risk, baseScore: 500, contributions,
      policy, configuredRules: rules, checks: copy(eligibility.checks), eligibility, integration,
      sourceChecks: this.policyChecks(input, preview.score, preview.dti, policy, rules),
      affordability: { installment, dti: preview.dti, headroom: Math.max(0, input.income * policy.maxDti - input.obligations), residual: input.income - input.obligations - installment, affordable: preview.dti <= policy.maxDti },
      recommendation: preview.decision, reasons: copy(preview.reasons), ai: simulateLoanAi(input, policy, preview.decision),
      limit, limitations: [
        'The ensemble represents logistic, boosted-tree and forest-style model outputs using deterministic surrogates. No trained ML estimator or generative AI API is executed.',
        'New intake uses eight fictional Kenyan financial profiles and demonstration identity, KYC, account/employment tenure, CRB, loan/lender, internal-default, age and balance facts. Older saved profiles retain their original snapshots. These facts are not live verification results. Records and decisions are stored in this browser.',
        'The seven eligibility checks are a separate deterministic policy gate. Demo defaults are 6 account months, at most 4 active loans and 3 active lenders, and 6 employment/business months; DTI uses the saved configurable credit policy. Missing facts require review. Age and average balance provide context only and do not enter the six-signal model simulation.',
        'Affordability uses principal / months and reported obligations. Interest, fees and separately itemised living expenses are unavailable.',
        'Risk thresholds (700 / 580) come from the original scorecard. They are separate from the configurable lending cutoffs.',
        'Risk-driver sensitivities compare one derived ensemble signal at a time with a stated demo reference. They are not SHAP, population feature importance or causal effects, and do not add to the likelihood.',
        'Ensemble risk bands are below 12% / below 30% / otherwise high, using illustrative likelihoods without a validated default horizon. Agreement is the proportion of model risk votes matching the ensemble, not predictive accuracy.',
        'Copilot briefings are composed from the actual assessment inputs and checks using templates. Combined advice describes the original request; a smaller recommended offer is assessed separately. Officer review remains required.',
        'New risk-adjusted limits use 100% / 65% / 35% of principal-only repayment capacity for Low / Medium / High requested-risk bands, capped by the configured amount ceiling. Candidate likelihood ceilings are 12% / 30% / 50%. These are demonstration risk-appetite settings. Medium and High proposals always need officer review and explicit override acknowledgement before approval.',
        'Eight fictional Kenyan profiles are used for new intake. Existing saved customer identities and assessment histories are retained. Connector availability is simulated; no external identity, CRB, SMS, sanctions or payout service is called.'
      ] };
  }
  private policyChecks(input: ApplicationDraft, score: number, dti: number, policy: PolicySettings, rules: DecisionRule[]): LoanCheck[] {
    const checks: LoanCheck[] = [
      { code: 'BASE-SCORE', name: 'Configured score bands', observed: String(score), requirement: `Approve from ${policy.approveFrom}; decline below ${policy.declineBelow}`, result: score >= policy.approveFrom ? 'Pass' : 'Triggered', effect: score < policy.declineBelow ? 'Declined' : score < policy.approveFrom ? 'Refer' : 'Approved' },
      { code: 'BASE-DTI', name: 'Debt service', observed: (dti * 100).toFixed(2) + '%', requirement: 'At most ' + policy.maxDti * 100 + '%', result: dti <= policy.maxDti ? 'Pass' : 'Triggered', effect: dti <= policy.maxDti ? 'Within baseline approval band' : 'Baseline approval blocked' },
      { code: 'BASE-LIMIT', name: 'Requested amount', observed: this.money(input.amount), requirement: 'At most ' + this.money(policy.maxAmount), result: input.amount <= policy.maxAmount ? 'Pass' : 'Triggered', effect: input.amount <= policy.maxAmount ? 'Within baseline approval band' : 'Baseline approval blocked' }
    ];
    for (const rule of rules.filter(x => x.enabled)) {
      let triggered = false; let supported = true; let observed = ''; let requirement = '';
      switch (rule.code) {
        case 'CR-01': triggered = score < policy.declineBelow; observed = String(score); requirement = 'Decline below ' + policy.declineBelow; break;
        case 'CR-02': triggered = dti > policy.maxDti; observed = (dti * 100).toFixed(2) + '%'; requirement = 'Review above ' + policy.maxDti * 100 + '%'; break;
        case 'CR-03': triggered = input.amount > policy.maxAmount; observed = this.money(input.amount); requirement = 'Review above ' + this.money(policy.maxAmount); break;
        case 'CR-04': triggered = input.bureau === 'Thin file'; observed = input.bureau; requirement = 'Review a thin bureau file'; break;
        case 'CR-05': triggered = input.bureau === 'Adverse'; observed = input.bureau; requirement = 'Decline an adverse bureau record'; break;
        case 'CR-06': triggered = input.product === 'Salary Advance' && input.tenorMonths > 1; observed = input.product + ' / ' + input.tenorMonths + ' months'; requirement = 'Salary Advance limited to 1 month'; break;
        case 'CR-09': triggered = score >= policy.approveFrom && dti <= policy.maxDti && input.bureau === 'Clean' && input.amount <= policy.maxAmount; observed = 'Score / DTI / bureau / amount checked'; requirement = 'Meet all original clean-file approval checks'; break;
        default: supported = false; observed = 'No evaluator exists in the original scorecard'; requirement = rule.condition;
      }
      checks.push({ code: rule.code, name: rule.name, observed, requirement, result: !supported ? 'Not implemented' : triggered ? 'Triggered' : 'Pass', effect: supported ? (triggered ? rule.action : 'No change') : 'Not applied by source engine' });
    }
    return checks;
  }
}
