import { ApplicationDraft } from '../credit-data.service';
import { CreditDecision, PolicySettings } from '../credit-demo.data';
import { simulatedLoanProbability, simulatedRisk } from './loan-ai.engine';
import { LoanLimitRecommendation } from './loan-workflow.models';

type CandidateScore = { score: number; dti: number; decision: CreditDecision; eligibilityDecision?: CreditDecision; dataDecision?: CreditDecision };
export const LOAN_RISK_LIMITS = { Low: { multiplier: 1, ceiling: 0.12 }, Medium: { multiplier: 0.65, ceiling: 0.30 }, High: { multiplier: 0.35, ceiling: 0.50 } };
// Risk-adjusted indicative limit at the current product/term. High and Medium requests
// need officer review even when a smaller candidate has a lower simulated likelihood.
export function recommendLoanLimit(input: ApplicationDraft, policy: PolicySettings,
  evaluate: (candidate: ApplicationDraft) => CandidateScore): LoanLimitRecommendation {
  const riskBand = simulatedRisk(simulatedLoanProbability(input)); const tier = LOAN_RISK_LIMITS[riskBand];
  if (![policy.maxDti, policy.maxAmount, policy.approveFrom, policy.declineBelow].every(Number.isFinite) || policy.maxDti <= 0 || policy.maxDti > 1 || policy.maxAmount < 10000 || policy.declineBelow >= policy.approveFrom) { throw new Error('Valid policy settings are required to recommend a lending limit.'); }
  if (input.amount < 10000) { return recommendSmallLoanLimit(input, policy, evaluate); }
  const monthlyBudget = Math.max(0, input.income * policy.maxDti - input.obligations);
  const affordabilityCeiling = monthlyBudget * input.tenorMonths;
  const cap = Math.floor(Math.min(policy.maxAmount, affordabilityCeiling * tier.multiplier) / 1000) * 1000;
  const result: LoanLimitRecommendation = { version: 'limit-demo-2', outcome: 'Refer for review', requestedAmount: input.amount,
    tenorMonths: input.tenorMonths, maximumAmount: Math.max(0, cap), recommendedAmount: 0, monthlyBudget, affordabilityCeiling,
    policyCeiling: policy.maxAmount, minimumAmount: 10000, increment: 1000, riskCeiling: tier.ceiling, riskBand, riskMultiplier: tier.multiplier, offer: null,
    reasons: [riskBand + ' requested-risk band: use ' + Math.round(tier.multiplier * 100) + '% of principal-only repayment capacity, capped by the configured amount ceiling.'] };
  const assess = (amount: number) => {
    const candidate = { ...input, amount }; const source = evaluate(candidate);
    if (!Number.isFinite(source.score) || !Number.isFinite(source.dti)) { throw new Error('Candidate policy assessment returned invalid values.'); }
    return { source, offer: { score: source.score, probability: simulatedLoanProbability(candidate), dti: source.dti, installment: amount / input.tenorMonths,
      policyDecision: source.decision === 'Declined' ? 'Declined' as CreditDecision : riskBand !== 'Low' || source.decision !== 'Approved' || source.score < policy.approveFrom ? 'Refer' as CreditDecision : 'Approved' as CreditDecision } };
  };
  if (cap < 10000) { result.maximumAmount = 0; result.outcome = 'Decline'; result.reasons.push('Repayment capacity does not support the minimum KSh 10,000 principal at this risk allocation.'); return result; }
  const minimum = assess(10000);
  if (minimum.source.decision === 'Declined' || minimum.source.eligibilityDecision === 'Declined') { result.maximumAmount = 0; result.outcome = 'Decline'; result.reasons.push('A decline finding remains at the minimum amount. A smaller loan does not resolve it.'); return result; }
  if ((minimum.source.eligibilityDecision && minimum.source.eligibilityDecision !== 'Approved') || (minimum.source.dataDecision && minimum.source.dataDecision !== 'Approved')) {
    result.reasons.push('This indicative capacity is not an offer. Resolve customer eligibility or required connector availability before terms can be supported.'); return result;
  }
  const viable = (a: ReturnType<typeof assess>): boolean => a.source.decision !== 'Declined' && a.source.score >= policy.declineBelow && a.offer.dti <= policy.maxDti && a.offer.probability < tier.ceiling;
  if (!viable(minimum)) { result.maximumAmount = 0; result.reasons.push('No candidate meets the minimum score, affordability and risk checks.'); return result; }
  let low = 10; let high = cap / 1000;
  while (low < high) { const mid = low + Math.ceil((high - low) / 2); if (viable(assess(mid * 1000))) { low = mid; } else { high = mid - 1; } }
  result.maximumAmount = low * 1000; result.recommendedAmount = Math.min(input.amount, result.maximumAmount); result.offer = assess(result.recommendedAmount).offer;
  result.outcome = result.offer.policyDecision !== 'Approved' ? 'Refer for review' : result.recommendedAmount === input.amount ? 'Approve full amount' : 'Approve reduced amount';
  result.reasons.push(result.outcome === 'Refer for review' ? 'A positive limit is proposed for officer review. It is not an automatic approval.' : result.recommendedAmount < input.amount ? 'The smaller offer passes the candidate checks.' : 'The request fits within the supported lending limit.');
  if (result.maximumAmount + 1000 > policy.maxAmount) { result.reasons.push('The configured policy amount ceiling is binding.'); }
  else if (result.maximumAmount + 1000 <= cap) { result.reasons.push('A higher principal falls outside the candidate score or simulated risk threshold.'); }
  else { result.reasons.push('Risk-adjusted repayment capacity is binding at this term.'); }
  return result;
}

function recommendSmallLoanLimit(input: ApplicationDraft, policy: PolicySettings,
  evaluate: (candidate: ApplicationDraft) => CandidateScore): LoanLimitRecommendation {
  const riskBand = simulatedRisk(simulatedLoanProbability(input)), tier = LOAN_RISK_LIMITS[riskBand];
  const monthlyBudget = Math.max(0, input.income * policy.maxDti - input.obligations);
  const capacity = monthlyBudget * input.tenorMonths;
  const cap = Math.floor(Math.min(policy.maxAmount, capacity * tier.multiplier));
  const rounded = (amount: number): number => amount >= 1000 ? Math.floor(amount / 1000) * 1000 : amount;
  const result: LoanLimitRecommendation = { version: 'limit-demo-3', outcome: 'Refer for review',
    requestedAmount: input.amount, tenorMonths: input.tenorMonths, maximumAmount: rounded(Math.max(0, cap)),
    recommendedAmount: 0, monthlyBudget, affordabilityCeiling: capacity, policyCeiling: policy.maxAmount,
    minimumAmount: 1, increment: cap >= 1000 ? 1000 : 1, riskCeiling: tier.ceiling,
    riskBand, riskMultiplier: tier.multiplier, offer: null,
    reasons: ['Small requests use the same risk and affordability checks, with a minimum principal of KSh 1.'] };
  const assess = (amount: number) => {
    const candidate = { ...input, amount }, source = evaluate(candidate);
    if (!Number.isFinite(source.score) || !Number.isFinite(source.dti)) { throw new Error('Candidate policy assessment returned invalid values.'); }
    return { source, offer: { score: source.score, probability: simulatedLoanProbability(candidate),
      dti: source.dti, installment: amount / input.tenorMonths,
      policyDecision: source.decision === 'Declined' ? 'Declined' as CreditDecision
        : riskBand !== 'Low' || source.decision !== 'Approved' || source.score < policy.approveFrom ? 'Refer' as CreditDecision : 'Approved' as CreditDecision } };
  };
  if (cap < 1) { result.maximumAmount = 0; result.outcome = 'Decline'; result.reasons.push('No repayment capacity is available.'); return result; }
  const minimum = assess(1);
  if (minimum.source.decision === 'Declined' || minimum.source.eligibilityDecision === 'Declined') {
    result.maximumAmount = 0; result.outcome = 'Decline'; result.reasons.push('A decline finding remains at the minimum amount.'); return result;
  }
  if ((minimum.source.eligibilityDecision && minimum.source.eligibilityDecision !== 'Approved') ||
      (minimum.source.dataDecision && minimum.source.dataDecision !== 'Approved')) {
    result.reasons.push('Resolve outstanding customer eligibility or data-availability findings before supporting an offer.'); return result;
  }
  const viable = (a: ReturnType<typeof assess>): boolean => a.source.decision !== 'Declined' &&
    a.source.score >= policy.declineBelow && a.offer.dti <= policy.maxDti && a.offer.probability < tier.ceiling;
  if (!viable(minimum)) { result.maximumAmount = 0; result.reasons.push('No candidate meets the risk, score and affordability checks.'); return result; }
  let low = 1, high = cap;
  while (low < high) { const mid = low + Math.ceil((high - low) / 2); if (viable(assess(mid))) low = mid; else high = mid - 1; }
  result.maximumAmount = rounded(low); result.increment = result.maximumAmount >= 1000 ? 1000 : 1;
  result.recommendedAmount = Math.min(input.amount, result.maximumAmount);
  result.offer = assess(result.recommendedAmount).offer;
  result.outcome = result.offer.policyDecision !== 'Approved' ? 'Refer for review'
    : result.recommendedAmount === input.amount ? 'Approve full amount' : 'Approve reduced amount';
  result.reasons.push('The supported offer is assessed separately from the automatic-approval routing rule.');
  return result;
}

function validSmallLoanLimit(a: LoanLimitRecommendation, input: ApplicationDraft, policy: PolicySettings): boolean {
  const band = simulatedRisk(simulatedLoanProbability(input)), tier = LOAN_RISK_LIMITS[band];
  const budget = Math.max(0, input.income * policy.maxDti - input.obligations);
  const finite = (n: number) => Number.isFinite(n) && n >= 0;
  if (a.version !== 'limit-demo-3' || input.amount < 1 || input.amount >= 10000 ||
      !['Approve full amount', 'Approve reduced amount', 'Refer for review', 'Decline'].includes(a.outcome) ||
      a.requestedAmount !== input.amount || a.tenorMonths !== input.tenorMonths ||
      a.minimumAmount !== 1 || ![1, 1000].includes(a.increment) || a.policyCeiling !== policy.maxAmount ||
      a.riskBand !== band || a.riskMultiplier !== tier.multiplier || a.riskCeiling !== tier.ceiling ||
      ![a.maximumAmount, a.recommendedAmount, a.monthlyBudget, a.affordabilityCeiling].every(finite) ||
      !Number.isInteger(a.maximumAmount) || a.maximumAmount > Math.min(policy.maxAmount, budget * input.tenorMonths * tier.multiplier) ||
      (a.maximumAmount >= 1000 && (a.increment !== 1000 || a.maximumAmount % 1000 !== 0)) ||
      (a.maximumAmount > 0 && a.maximumAmount < 1000 && a.increment !== 1) ||
      Math.abs(a.monthlyBudget - budget) > 0.01 || Math.abs(a.affordabilityCeiling - budget * input.tenorMonths) > 0.01 ||
      !Array.isArray(a.reasons) || !a.reasons.length || !a.reasons.every(reason => typeof reason === 'string')) return false;
  if (!a.offer) return a.recommendedAmount === 0 && (a.outcome === 'Refer for review' || (a.outcome === 'Decline' && a.maximumAmount === 0));
  const o = a.offer;
  if (a.maximumAmount < 1 || a.recommendedAmount !== Math.min(input.amount, a.maximumAmount) ||
      !finite(o.score) || o.score < policy.declineBelow || o.score > 900 || !finite(o.probability) ||
      o.probability >= tier.ceiling || Math.abs(o.probability - simulatedLoanProbability({ ...input, amount: a.recommendedAmount })) > 0.00001 ||
      !finite(o.dti) || o.dti > policy.maxDti || Math.abs(o.dti - (input.obligations + a.recommendedAmount / input.tenorMonths) / input.income) > 0.00001 ||
      !finite(o.installment) || Math.abs(o.installment - a.recommendedAmount / input.tenorMonths) > 0.01 ||
      !['Approved', 'Refer'].includes(o.policyDecision)) return false;
  return o.policyDecision === 'Approved' ? band === 'Low' && o.score >= policy.approveFrom &&
    a.outcome === (a.recommendedAmount === input.amount ? 'Approve full amount' : 'Approve reduced amount') : a.outcome === 'Refer for review';
}

function validLegacyLoanLimit(value: unknown, input: ApplicationDraft, policy: PolicySettings): value is LoanLimitRecommendation {
  const a = value as LoanLimitRecommendation; const finite = (n: number): boolean => Number.isFinite(n) && n >= 0;
  if (!a || a.version !== 'limit-demo-1' || !['Approve full amount', 'Approve reduced amount', 'Refer for review', 'Decline'].includes(a.outcome)
    || a.requestedAmount !== input.amount || a.tenorMonths !== input.tenorMonths || a.policyCeiling !== policy.maxAmount
    || a.minimumAmount !== 10000 || a.increment !== 1000 || a.riskCeiling !== 0.12
    || ![a.maximumAmount, a.recommendedAmount, a.monthlyBudget, a.affordabilityCeiling].every(finite)
    || Math.abs(a.monthlyBudget - Math.max(0, input.income * policy.maxDti - input.obligations)) > 0.01
    || Math.abs(a.affordabilityCeiling - a.monthlyBudget * input.tenorMonths) > 0.01
    || !Array.isArray(a.reasons) || !a.reasons.length || !a.reasons.every(x => typeof x === 'string')) { return false; }
  if (a.outcome === 'Refer for review' || a.outcome === 'Decline') { return a.maximumAmount === 0 && a.recommendedAmount === 0 && a.offer === null; }
  const o = a.offer;
  return a.maximumAmount >= 10000 && a.maximumAmount % 1000 === 0 && a.maximumAmount <= Math.min(a.affordabilityCeiling, policy.maxAmount)
    && a.recommendedAmount === Math.min(input.amount, a.maximumAmount)
    && a.outcome === (a.recommendedAmount === input.amount ? 'Approve full amount' : 'Approve reduced amount')
    && !!o && Number.isFinite(o.score) && o.score >= policy.approveFrom && o.score <= 900 && o.policyDecision === 'Approved'
    && finite(o.probability) && o.probability < 0.12 && Math.abs(o.probability - simulatedLoanProbability({ ...input, amount: a.recommendedAmount })) < 0.00001
    && finite(o.dti) && o.dti <= policy.maxDti && Math.abs(o.dti - (input.obligations + a.recommendedAmount / input.tenorMonths) / input.income) < 0.00001
    && finite(o.installment) && Math.abs(o.installment - a.recommendedAmount / input.tenorMonths) < 0.01;
}

export function validLoanLimit(value: unknown, input: ApplicationDraft, policy: PolicySettings): value is LoanLimitRecommendation {
  const a = value as LoanLimitRecommendation;
  if (a?.version === 'limit-demo-3') { try { return validSmallLoanLimit(a, input, policy); } catch { return false; } }
  if (a?.version === 'limit-demo-1') { return validLegacyLoanLimit(value, input, policy); }
  try {
    const band = simulatedRisk(simulatedLoanProbability(input)); const tier = LOAN_RISK_LIMITS[band];
    const finite = (n: number): boolean => Number.isFinite(n) && n >= 0;
    const budget = Math.max(0, input.income * policy.maxDti - input.obligations);
    if (!a || a.version !== 'limit-demo-2' || !['Approve full amount', 'Approve reduced amount', 'Refer for review', 'Decline'].includes(a.outcome)
      || a.requestedAmount !== input.amount || a.tenorMonths !== input.tenorMonths || a.policyCeiling !== policy.maxAmount || a.minimumAmount !== 10000 || a.increment !== 1000
      || a.riskBand !== band || a.riskMultiplier !== tier.multiplier || a.riskCeiling !== tier.ceiling
      || ![a.maximumAmount, a.recommendedAmount, a.monthlyBudget, a.affordabilityCeiling].every(finite)
      || Math.abs(a.monthlyBudget - budget) > 0.01 || Math.abs(a.affordabilityCeiling - budget * input.tenorMonths) > 0.01
      || a.maximumAmount % 1000 !== 0 || a.maximumAmount > Math.min(policy.maxAmount, a.affordabilityCeiling * tier.multiplier)
      || !Array.isArray(a.reasons) || !a.reasons.length || !a.reasons.every(x => typeof x === 'string')) { return false; }
    if (!a.offer) { return a.recommendedAmount === 0 && (a.outcome === 'Refer for review' || (a.outcome === 'Decline' && a.maximumAmount === 0)); }
    const o = a.offer;
    if (a.maximumAmount < 10000 || a.recommendedAmount !== Math.min(input.amount, a.maximumAmount) || !finite(o.score) || o.score < policy.declineBelow || o.score > 900
      || !finite(o.probability) || o.probability >= tier.ceiling || Math.abs(o.probability - simulatedLoanProbability({ ...input, amount: a.recommendedAmount })) > 0.00001
      || !finite(o.dti) || o.dti > policy.maxDti || Math.abs(o.dti - (input.obligations + a.recommendedAmount / input.tenorMonths) / input.income) > 0.00001
      || !finite(o.installment) || Math.abs(o.installment - a.recommendedAmount / input.tenorMonths) > 0.01 || !['Approved', 'Refer'].includes(o.policyDecision)) { return false; }
    if (o.policyDecision === 'Approved') { return band === 'Low' && o.score >= policy.approveFrom && a.outcome === (a.recommendedAmount === input.amount ? 'Approve full amount' : 'Approve reduced amount'); }
    return a.outcome === 'Refer for review';
  } catch { return false; }
}
