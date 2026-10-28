import { LoanAssessment, LoanAutomaticApproval } from './loan-workflow.models';

export const SMALL_LOAN_AUTO_LIMIT = 10000;

// Size-based automation is a separate decision rule. It does not change the
// underlying scorecard, model output or customer-verification findings.
export function evaluateAutomaticApproval(a: LoanAssessment): LoanAutomaticApproval {
  const result: LoanAutomaticApproval = { version: 'small-loan-policy-1', threshold: 10000, eligible: false, reasons: [] };
  if (!Number.isFinite(a.input.amount) || a.input.amount < 1 || a.input.amount > SMALL_LOAN_AUTO_LIMIT) {
    result.reasons.push('The request is outside the KSh 1–10,000 automatic-approval range.'); return result;
  }
  if (!a.eligibility || a.eligibility.decision !== 'Approved' || a.eligibility.checks.length !== 7 ||
      a.eligibility.checks.some(check => check.result !== 'Pass')) {
    result.reasons.push('Complete all seven customer eligibility checks before automatic approval.');
  }
  if (a.input.bureau !== 'Clean') { result.reasons.push('The bureau profile requires review.'); }
  if (a.integration?.decision !== 'Approved') { result.reasons.push('Required customer data sources must be available.'); }
  if (a.recommendation === 'Declined' || a.score < a.policy.declineBelow) { result.reasons.push('A scorecard decline finding requires review.'); }
  if (!a.ai || a.ai.risk === 'High' || a.ai.advice === 'Declined') { result.reasons.push('The model outlook requires review.'); }
  if (!a.limit?.offer || a.limit.outcome === 'Decline' || a.limit.recommendedAmount !== a.input.amount ||
      a.limit.maximumAmount < a.input.amount || a.limit.offer.dti > a.policy.maxDti) {
    result.reasons.push('The full requested amount must pass the lending-limit and affordability checks.');
  }
  result.eligible = result.reasons.length === 0;
  return result;
}

export function validAutomaticApproval(value: unknown, a: LoanAssessment): value is LoanAutomaticApproval {
  const v = value as LoanAutomaticApproval, expected = evaluateAutomaticApproval(a);
  return !!v && v.version === expected.version && v.threshold === expected.threshold &&
    v.eligible === expected.eligible && JSON.stringify(v.reasons) === JSON.stringify(expected.reasons);
}
