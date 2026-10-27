import { ApplicationDraft } from '../credit-data.service';
import { CreditDecision, PolicySettings } from '../credit-demo.data';
import { LoanCheck, LoanCustomerFacts, LoanEligibility, LoanEligibilityPolicy } from './loan-workflow.models';

export const DEMO_ELIGIBILITY_POLICY: LoanEligibilityPolicy = {
  minAccountMonths: 6,
  maxActiveLoans: 4,
  maxActiveLenders: 3,
  minEmploymentMonths: 6
};

export const DEMO_LOAN_CUSTOMER_FACTS: LoanCustomerFacts[] = [
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 24, crbDefaulter: false, crbBlacklisted: false, activeLoans: 1, activeLenders: 1, previousInstitutionDefault: false, employmentTenureMonths: 18, ageYears: 34, averageBalance6m: 80000 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 18, crbDefaulter: false, crbBlacklisted: false, activeLoans: 2, activeLenders: 1, previousInstitutionDefault: false, employmentTenureMonths: 12, ageYears: 29, averageBalance6m: 45000 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 36, crbDefaulter: false, crbBlacklisted: false, activeLoans: 1, activeLenders: 1, previousInstitutionDefault: false, employmentTenureMonths: 24, ageYears: 41, averageBalance6m: 120000 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 12, crbDefaulter: false, crbBlacklisted: false, activeLoans: 2, activeLenders: 2, previousInstitutionDefault: false, employmentTenureMonths: 10, ageYears: 33, averageBalance6m: 30000 },
  { nationalIdVerified: true, kycCompleted: true, accountTenureMonths: 20, crbDefaulter: false, crbBlacklisted: false, activeLoans: 1, activeLenders: 1, previousInstitutionDefault: false, employmentTenureMonths: 16, ageYears: 38, averageBalance6m: 60000 }
];

const BOOLEAN_KEYS = ['nationalIdVerified', 'kycCompleted', 'crbDefaulter', 'crbBlacklisted', 'previousInstitutionDefault'] as const;
const INTEGER_KEYS = ['accountTenureMonths', 'employmentTenureMonths', 'activeLoans', 'activeLenders', 'ageYears'] as const;

function rank(decision: CreditDecision): number {
  return decision === 'Declined' ? 2 : decision === 'Refer' ? 1 : 0;
}

export function combineLoanDecisions(left: CreditDecision, right: CreditDecision): CreditDecision {
  return rank(left) >= rank(right) ? left : right;
}

export function customerFacts(input?: Partial<LoanCustomerFacts> | null): LoanCustomerFacts {
  const source = (input || {}) as Partial<Record<keyof LoanCustomerFacts, unknown>>;
  const facts = {} as LoanCustomerFacts;
  for (const key of BOOLEAN_KEYS) {
    const value = source[key];
    if (value === undefined || value === null) { facts[key] = null; continue; }
    if (typeof value !== 'boolean') { throw new Error('Customer verification facts must be yes, no, or unknown.'); }
    facts[key] = value;
  }
  for (const key of INTEGER_KEYS) {
    const value = source[key];
    if (value === undefined || value === null || value === '') { facts[key] = null; continue; }
    const max = key === 'ageYears' ? 120 : Number.MAX_SAFE_INTEGER;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
      throw new Error('Customer numeric facts must be whole numbers within the allowed range.');
    }
    facts[key] = value;
  }
  const balance = source.averageBalance6m;
  if (balance === undefined || balance === null || balance === '') { facts.averageBalance6m = null; }
  else if (typeof balance !== 'number' || !Number.isFinite(balance) || balance < 0) {
    throw new Error('Average balance must be a non-negative number or unknown.');
  } else { facts.averageBalance6m = balance; }
  return facts;
}

function debtService(input: ApplicationDraft): number {
  const tenor = Math.max(1, Number(input.tenorMonths) || 1);
  const income = Number(input.income) || 0;
  if (income <= 0) { return 1; }
  return (Number(input.obligations) + Number(input.amount) / tenor) / income;
}

export function evaluateLoanEligibility(
  facts: Partial<LoanCustomerFacts> | null | undefined,
  input: ApplicationDraft,
  policy: PolicySettings,
  eligibilityPolicy: LoanEligibilityPolicy = DEMO_ELIGIBILITY_POLICY
): LoanEligibility {
  const customer = customerFacts(facts || undefined);
  const dti = debtService(input);
  const checks: LoanCheck[] = [];

  if (customer.nationalIdVerified === null || customer.kycCompleted === null) {
    checks.push({ code: 'EL-01', name: 'Identity and KYC', observed: 'Unknown', requirement: 'Verified national ID and completed KYC', result: 'Needs review', effect: 'Refer' });
  } else if (customer.nationalIdVerified === false) {
    checks.push({ code: 'EL-01', name: 'Identity and KYC', observed: 'National ID not verified', requirement: 'Verified national ID and completed KYC', result: 'Triggered', effect: 'Declined' });
  } else if (customer.kycCompleted === false) {
    checks.push({ code: 'EL-01', name: 'Identity and KYC', observed: 'KYC incomplete', requirement: 'Verified national ID and completed KYC', result: 'Triggered', effect: 'Refer' });
  } else {
    checks.push({ code: 'EL-01', name: 'Identity and KYC', observed: 'Verified', requirement: 'Verified national ID and completed KYC', result: 'Pass', effect: 'No change' });
  }

  if (customer.accountTenureMonths === null) {
    checks.push({ code: 'EL-02', name: 'Account tenure', observed: 'Unknown', requirement: 'At least ' + eligibilityPolicy.minAccountMonths + ' months', result: 'Needs review', effect: 'Refer' });
  } else if (customer.accountTenureMonths < eligibilityPolicy.minAccountMonths) {
    checks.push({ code: 'EL-02', name: 'Account tenure', observed: customer.accountTenureMonths + ' months', requirement: 'At least ' + eligibilityPolicy.minAccountMonths + ' months', result: 'Triggered', effect: 'Refer' });
  } else {
    checks.push({ code: 'EL-02', name: 'Account tenure', observed: customer.accountTenureMonths + ' months', requirement: 'At least ' + eligibilityPolicy.minAccountMonths + ' months', result: 'Pass', effect: 'No change' });
  }

  if (customer.crbDefaulter === null || customer.crbBlacklisted === null) {
    checks.push({ code: 'EL-03', name: 'Credit reference bureau', observed: 'Unknown', requirement: 'Not a defaulter and not blacklisted', result: 'Needs review', effect: 'Refer' });
  } else if (customer.crbDefaulter || customer.crbBlacklisted) {
    checks.push({ code: 'EL-03', name: 'Credit reference bureau', observed: customer.crbBlacklisted ? 'Blacklisted' : 'Defaulter listed', requirement: 'Not a defaulter and not blacklisted', result: 'Triggered', effect: 'Declined' });
  } else {
    checks.push({ code: 'EL-03', name: 'Credit reference bureau', observed: 'Clear', requirement: 'Not a defaulter and not blacklisted', result: 'Pass', effect: 'No change' });
  }

  if (customer.activeLoans === null || customer.activeLenders === null) {
    checks.push({ code: 'EL-04', name: 'Active exposure', observed: 'Unknown', requirement: 'At most ' + eligibilityPolicy.maxActiveLoans + ' loans and ' + eligibilityPolicy.maxActiveLenders + ' lenders', result: 'Needs review', effect: 'Refer' });
  } else if (customer.activeLoans > eligibilityPolicy.maxActiveLoans || customer.activeLenders > eligibilityPolicy.maxActiveLenders) {
    checks.push({ code: 'EL-04', name: 'Active exposure', observed: customer.activeLoans + ' loans / ' + customer.activeLenders + ' lenders', requirement: 'At most ' + eligibilityPolicy.maxActiveLoans + ' loans and ' + eligibilityPolicy.maxActiveLenders + ' lenders', result: 'Triggered', effect: 'Refer' });
  } else {
    checks.push({ code: 'EL-04', name: 'Active exposure', observed: customer.activeLoans + ' loans / ' + customer.activeLenders + ' lenders', requirement: 'At most ' + eligibilityPolicy.maxActiveLoans + ' loans and ' + eligibilityPolicy.maxActiveLenders + ' lenders', result: 'Pass', effect: 'No change' });
  }

  if (customer.previousInstitutionDefault === null) {
    checks.push({ code: 'EL-05', name: 'Internal default', observed: 'Unknown', requirement: 'No previous default with this institution', result: 'Needs review', effect: 'Refer' });
  } else if (customer.previousInstitutionDefault) {
    checks.push({ code: 'EL-05', name: 'Internal default', observed: 'Previous default', requirement: 'No previous default with this institution', result: 'Triggered', effect: 'Declined' });
  } else {
    checks.push({ code: 'EL-05', name: 'Internal default', observed: 'None', requirement: 'No previous default with this institution', result: 'Pass', effect: 'No change' });
  }

  const dtiText = (dti * 100).toFixed(2) + '%';
  checks.push({
    code: 'EL-06',
    name: 'Debt service',
    observed: dtiText,
    requirement: 'At most ' + (policy.maxDti * 100) + '%',
    result: dti <= policy.maxDti ? 'Pass' : 'Triggered',
    effect: dti <= policy.maxDti ? 'No change' : 'Refer'
  });

  if (customer.employmentTenureMonths === null) {
    checks.push({ code: 'EL-07', name: 'Employment tenure', observed: 'Unknown', requirement: 'At least ' + eligibilityPolicy.minEmploymentMonths + ' months', result: 'Needs review', effect: 'Refer' });
  } else if (customer.employmentTenureMonths < eligibilityPolicy.minEmploymentMonths) {
    checks.push({ code: 'EL-07', name: 'Employment tenure', observed: customer.employmentTenureMonths + ' months', requirement: 'At least ' + eligibilityPolicy.minEmploymentMonths + ' months', result: 'Triggered', effect: 'Refer' });
  } else {
    checks.push({ code: 'EL-07', name: 'Employment tenure', observed: customer.employmentTenureMonths + ' months', requirement: 'At least ' + eligibilityPolicy.minEmploymentMonths + ' months', result: 'Pass', effect: 'No change' });
  }

  let decision: CreditDecision = 'Approved';
  for (const check of checks) {
    if (check.result === 'Triggered' && check.effect === 'Declined') { decision = 'Declined'; break; }
    if (check.result === 'Triggered' || check.result === 'Needs review') { decision = 'Refer'; }
  }
  const reasons = checks.filter(check => check.result !== 'Pass').map(check => check.name + ': ' + check.observed + '.');
  return { version: 'eligibility-demo-1', customer, policy: { ...eligibilityPolicy }, checks, decision, reasons };
}

export function validLoanEligibility(value: unknown, input: ApplicationDraft, policy: PolicySettings): value is LoanEligibility {
  const stored = value as LoanEligibility;
  if (!stored || stored.version !== 'eligibility-demo-1' || !stored.customer || !Array.isArray(stored.checks)) { return false; }
  try {
    const expected = evaluateLoanEligibility(stored.customer, input, policy, stored.policy);
    return expected.decision === stored.decision && JSON.stringify(expected.checks) === JSON.stringify(stored.checks);
  } catch {
    return false;
  }
}
