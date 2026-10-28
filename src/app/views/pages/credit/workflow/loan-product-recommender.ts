import { CreditDecision, PRODUCTS } from '../credit-demo.data';
import { ApplicationDraft } from '../credit-data.service';
import { LoanAssessment } from './loan-workflow.models';
import { evaluateLoanEligibility } from './loan-eligibility.engine';
import { simulatedLoanProbability } from './loan-ai.engine';
import { LOAN_RISK_LIMITS } from './loan-limit.engine';

export interface LoanProductSuggestion {
  product: string; amount: number; tenorMonths: number; monthlyInstallment: number;
  reason: string; basis: 'Profile match' | 'Purpose to confirm';
}
const catalog = [
  { product: 'Salary Advance', min: 1, max: 1, basis: 'Profile match',
    reason: 'Your salaried profile supports exploring a one-month advance.' },
  { product: 'SME Working Capital', min: 3, max: 24, basis: 'Profile match',
    reason: 'Your business income profile matches working-capital borrowing.' },
  { product: 'Personal Loan', min: 3, max: 36, basis: 'Profile match',
    reason: 'Consider personal borrowing for general expenses over a longer term.' },
  { product: 'Device Finance', min: 3, max: 24, basis: 'Purpose to confirm',
    reason: 'Consider this if you are buying a phone, laptop or other device.' },
  { product: 'Asset Finance', min: 6, max: 48, basis: 'Purpose to confirm',
    reason: 'Consider this if the request is for equipment or a vehicle.' },
  { product: 'School Fees', min: 3, max: 12, basis: 'Purpose to confirm',
    reason: 'Consider this if the funds are for school or college fees.' }
] as const;

// Transparent demo ranking using employment, borrowing needs, affordability and
// the existing risk signal. These are product ideas, not approved new facilities.
export function recommendLoanProducts(a: LoanAssessment,
  evaluateScore: (candidate: ApplicationDraft) => { score: number; decision: CreditDecision }): LoanProductSuggestion[] {
  if (!a.limit?.offer || !a.eligibility || a.integration?.decision !== 'Approved') { return []; }
  const p = a.input, facts = a.eligibility.customer;
  const tier = LOAN_RISK_LIMITS[a.ai?.risk || a.risk];
  const budget = Math.max(0, p.income * a.policy.maxDti - p.obligations);
  const business = p.employment === 'Business owner' || p.employment === 'Self employed';
  const options: Array<LoanProductSuggestion & { rank: number }> = [];
  for (const product of catalog) {
    if (product.product === p.product || !PRODUCTS.includes(product.product)) { continue; }
    if (product.product === 'Salary Advance' && p.employment !== 'Salaried') { continue; }
    if (product.product === 'SME Working Capital' && !business) { continue; }
    const tenorMonths = Math.max(product.min, Math.min(product.max, p.tenorMonths));
    const ceiling = Math.min(p.amount, a.limit.maximumAmount, a.policy.maxAmount, budget * tenorMonths * tier.multiplier);
    const increment = ceiling < 10000 ? 1 : 1000;
    let amount = Math.floor(ceiling / increment) * increment;
    if (amount < 1) { continue; }
    const valid = (principal: number): boolean => {
      const candidate = { ...p, product: product.product, amount: principal, tenorMonths };
      const score = evaluateScore(candidate);
      return score.decision !== 'Declined' && score.score >= a.policy.declineBelow &&
        evaluateLoanEligibility(facts, candidate, a.policy, a.eligibility!.policy).decision === 'Approved' &&
        simulatedLoanProbability(candidate) < tier.ceiling;
    };
    if (!valid(1)) { continue; }
    if (!valid(amount)) {
      let low = 1, high = Math.floor(amount);
      while (low < high) { const mid = low + Math.ceil((high - low) / 2); if (valid(mid)) low = mid; else high = mid - 1; }
      amount = low >= 1000 ? Math.floor(low / 1000) * 1000 : low;
    }
    if (amount < 1) { continue; }
    let rank = 50;
    if (product.product === 'Salary Advance') rank = p.tenorMonths <= 3 ? 115 : 100;
    if (product.product === 'SME Working Capital') rank = 115;
    if (product.product === 'Personal Loan') rank = 90;
    if (product.product === 'Asset Finance') rank = p.amount >= 300000 ? 85 : 55;
    if (product.product === 'Device Finance') rank = p.amount <= 300000 ? 80 : 60;
    if (product.product === 'School Fees') rank = 65;
    options.push({ product: product.product, amount, tenorMonths, monthlyInstallment: amount / tenorMonths,
      reason: product.reason, basis: product.basis, rank });
  }
  return options.sort((x, y) => y.rank - x.rank || x.product.localeCompare(y.product))
    .slice(0, 2).map(({ rank, ...suggestion }) => suggestion);
}
