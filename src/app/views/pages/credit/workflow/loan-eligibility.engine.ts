import { ApplicationDraft } from '../credit-data.service';
import { CreditDecision, PolicySettings } from '../credit-demo.data';
import { LoanCheck, LoanCustomerFacts, LoanEligibility, LoanEligibilityPolicy } from './loan-workflow.models';

// Demo policy defaults; these are not presented as CRB or regulatory requirements.
export const DEFAULT_LOAN_ELIGIBILITY: Readonly<LoanEligibilityPolicy> = Object.freeze({ minAccountMonths: 6, maxActiveLoans: 4, maxActiveLenders: 3, minEmploymentMonths: 6 });
const booleanFields = ['nationalIdVerified', 'kycCompleted', 'crbDefaulter', 'crbBlacklisted', 'previousInstitutionDefault'] as const;
const integerFields = ['accountTenureMonths', 'activeLoans', 'activeLenders', 'employmentTenureMonths', 'ageYears'] as const;
export function customerFacts(value?: Partial<LoanCustomerFacts>): LoanCustomerFacts {
  if (value !== undefined && (!value || typeof value !== 'object' || Array.isArray(value))) { throw new Error('Customer verification details must be a valid record.'); }
  const facts: LoanCustomerFacts = { nationalIdVerified: null, kycCompleted: null, accountTenureMonths: null,
    crbDefaulter: null, crbBlacklisted: null, activeLoans: null, activeLenders: null, previousInstitutionDefault: null,
    employmentTenureMonths: null, ageYears: null, averageBalance6m: null };
  for (const key of booleanFields) {
    const v = value?.[key];
    if (v !== undefined && v !== null && typeof v !== 'boolean') { throw new Error('Verification and default flags must be Yes, No or Unknown.'); }
    facts[key] = v ?? null;
  }
  for (const key of integerFields) {
    const v = value?.[key];
    if (v !== undefined && v !== null && (!Number.isSafeInteger(v) || v < 0 || (key === 'ageYears' && v > 120))) { throw new Error('Customer months, counts and age must be valid non-negative whole numbers.'); }
    facts[key] = v ?? null;
  }
  const balance = value?.averageBalance6m;
  if (balance !== undefined && balance !== null && (!Number.isFinite(balance) || balance < 0)) { throw new Error('Average balance must be a non-negative number or unknown.'); }
  facts.averageBalance6m = balance ?? null;
  return facts;
}
export function combineLoanDecisions(a: CreditDecision, b: CreditDecision): CreditDecision {
  return a === 'Declined' || b === 'Declined' ? 'Declined' : a === 'Refer' || b === 'Refer' ? 'Refer' : 'Approved';
}
const yesNo = (value: boolean | null): string => value === null ? 'Unknown' : value ? 'Yes' : 'No';
const months = (value: number | null): string => value === null ? 'Unknown' : value + ' months';

export function evaluateLoanEligibility(value: Partial<LoanCustomerFacts> | undefined, input: ApplicationDraft,
  sourcePolicy: PolicySettings, policy: LoanEligibilityPolicy = DEFAULT_LOAN_ELIGIBILITY): LoanEligibility {
  const facts = customerFacts(value);
  if (![policy.minAccountMonths, policy.maxActiveLoans, policy.maxActiveLenders, policy.minEmploymentMonths].every(n => Number.isSafeInteger(n) && n >= 0)
    || !Number.isFinite(sourcePolicy.maxDti) || sourcePolicy.maxDti <= 0 || sourcePolicy.maxDti > 1
    || ![input.amount, input.income, input.obligations, input.tenorMonths].every(Number.isFinite) || input.income <= 0 || input.amount < 10000 || input.obligations < 0 || input.tenorMonths <= 0) { throw new Error('Valid policy and financial inputs are required for eligibility checks.'); }
  let decision: CreditDecision = 'Approved'; const checks: LoanCheck[] = []; const reasons: string[] = [];
  const add = (code: string, name: string, observed: string, requirement: string, failed: boolean, missing: boolean, failure: CreditDecision): void => {
    const effect: CreditDecision = failed ? failure : missing ? 'Refer' : 'Approved';
    decision = combineLoanDecisions(decision, effect);
    const result = failed ? 'Triggered' : missing ? 'Needs review' : 'Pass';
    checks.push({ code, name, observed, requirement, result, effect: effect === 'Approved' ? 'Eligibility check passed' : effect === 'Declined' ? 'Recommend decline' : 'Refer for review' });
    if (effect !== 'Approved') { reasons.push(name + ': ' + (failed ? effect === 'Declined' ? 'decline finding' : 'policy threshold not met' : 'verification required')); }
  };
  add('EL-01', 'Valid national ID and KYC completed', 'ID verified: ' + yesNo(facts.nationalIdVerified) + '; KYC completed: ' + yesNo(facts.kycCompleted),
    'Verified national ID and completed KYC', facts.nationalIdVerified === false || facts.kycCompleted === false,
    facts.nationalIdVerified === null || facts.kycCompleted === null, facts.nationalIdVerified === false ? 'Declined' : 'Refer');
  add('EL-02', 'Minimum account tenure', months(facts.accountTenureMonths), 'At least ' + policy.minAccountMonths + ' months as a customer',
    facts.accountTenureMonths !== null && facts.accountTenureMonths < policy.minAccountMonths, facts.accountTenureMonths === null, 'Refer');
  add('EL-03', 'CRB defaulter or blacklist listing', 'Defaulter: ' + yesNo(facts.crbDefaulter) + '; blacklisted: ' + yesNo(facts.crbBlacklisted), 'Neither currently listed as a defaulter nor blacklisted',
    facts.crbDefaulter === true || facts.crbBlacklisted === true, facts.crbDefaulter === null || facts.crbBlacklisted === null, 'Declined');
  add('EL-04', 'Active loans and lenders', 'Loans: ' + (facts.activeLoans ?? 'Unknown') + '; lenders: ' + (facts.activeLenders ?? 'Unknown'),
    'At most ' + policy.maxActiveLoans + ' active loans and ' + policy.maxActiveLenders + ' active lenders',
    (facts.activeLoans !== null && facts.activeLoans > policy.maxActiveLoans) || (facts.activeLenders !== null && facts.activeLenders > policy.maxActiveLenders),
    facts.activeLoans === null || facts.activeLenders === null, 'Refer');
  add('EL-05', 'Previous default with this institution', yesNo(facts.previousInstitutionDefault), 'No previous default with this institution',
    facts.previousInstitutionDefault === true, facts.previousInstitutionDefault === null, 'Declined');
  const dti = (input.obligations + input.amount / input.tenorMonths) / input.income;
  add('EL-06', 'Debt service / income', (dti * 100).toFixed(2) + '%', 'At most ' + Number((sourcePolicy.maxDti * 100).toFixed(2)) + '% of monthly income', dti > sourcePolicy.maxDti, false, 'Refer');
  add('EL-07', 'Time in current employment or business', months(facts.employmentTenureMonths), 'At least ' + policy.minEmploymentMonths + ' months in the current employment or business',
    facts.employmentTenureMonths !== null && facts.employmentTenureMonths < policy.minEmploymentMonths, facts.employmentTenureMonths === null, 'Refer');
  return { version: 'eligibility-demo-1', customer: facts, policy: { ...policy }, checks, decision, reasons };
}

export function validLoanEligibility(value: unknown, input: ApplicationDraft, policy: PolicySettings): value is LoanEligibility {
  try {
    const a = value as LoanEligibility;
    if (!a || a.version !== 'eligibility-demo-1' || !a.customer || !a.policy || !Array.isArray(a.checks) || !Array.isArray(a.reasons)) { return false; }
    const expected = evaluateLoanEligibility(a.customer, input, policy, a.policy);
    return JSON.stringify(a.customer) === JSON.stringify(expected.customer) && JSON.stringify(a.checks) === JSON.stringify(expected.checks)
      && JSON.stringify(a.reasons) === JSON.stringify(expected.reasons) && a.decision === expected.decision;
  } catch { return false; }
}

// Five new demonstration fact sets accompany the original five customer profiles.
// These extra fields were absent in the original source. They are never backfilled into saved history.
export const DEMO_LOAN_CUSTOMER_FACTS: LoanCustomerFacts[] = [
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 36, crbDefaulter: false, crbBlacklisted: false, activeLoans: 2, activeLenders: 2, previousInstitutionDefault: false, employmentTenureMonths: 24, ageYears: 34, averageBalance6m: 184000 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 5, crbDefaulter: false, crbBlacklisted: false, activeLoans: 5, activeLenders: 4, previousInstitutionDefault: false, employmentTenureMonths: 4, ageYears: 29, averageBalance6m: 38000 },
  { nationalIdVerified: true, kycCompleted: false, accountTenureMonths: 14, crbDefaulter: false, crbBlacklisted: false, activeLoans: 3, activeLenders: 2, previousInstitutionDefault: false, employmentTenureMonths: 18, ageYears: 38, averageBalance6m: 96500 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 26, crbDefaulter: true, crbBlacklisted: false, activeLoans: 4, activeLenders: 3, previousInstitutionDefault: true, employmentTenureMonths: 30, ageYears: 42, averageBalance6m: 38400 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 48, crbDefaulter: false, crbBlacklisted: false, activeLoans: 1, activeLenders: 1, previousInstitutionDefault: false, employmentTenureMonths: 60, ageYears: 36, averageBalance6m: 226000 }
];
