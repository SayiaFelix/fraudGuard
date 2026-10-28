import { ApplicationDraft } from '../credit-data.service';
import { CreditDecision, PolicySettings, RiskBand } from '../credit-demo.data';
import { LoanAiInsight, LoanAssessment, LoanRiskDriver, LoanScenario } from './loan-workflow.models';

// Deterministic surrogates for a presentation. No trained estimator, calibrated PD,
// inference endpoint or generative model is executed. The UI identifies this ensemble as a simulation.
type Signals = { burden: number; bureau: number; exposure: number; income: number; employment: number; term: number };
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const round = (value: number, precision = 4): number => Number(value.toFixed(precision));
const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value));
export const MODEL_WEIGHTS = [0.35, 0.40, 0.25];
export function simulatedRisk(probability: number): RiskBand { return probability < 0.12 ? 'Low' : probability < 0.30 ? 'Medium' : 'High'; }

function signals(input: ApplicationDraft): Signals {
  if (![input.amount, input.income, input.obligations, input.tenorMonths].every(Number.isFinite) || input.amount < 1 || input.income <= 0 || input.obligations < 0 || !Number.isInteger(input.tenorMonths) || input.tenorMonths < 1 || input.tenorMonths > 60) { throw new Error('Valid financial inputs are required for model simulation.'); }
  if (!['Clean', 'Thin file', 'Adverse'].includes(input.bureau) || !['Salaried', 'Business owner', 'Self employed'].includes(input.employment)) { throw new Error('Bureau and employment inputs are required for model simulation.'); }
  return {
    burden: clamp((input.obligations + input.amount / input.tenorMonths) / input.income, 0, 2),
    bureau: input.bureau === 'Clean' ? -0.6 : input.bureau === 'Thin file' ? 0.55 : 1.4,
    exposure: clamp(input.amount / (input.income * 12), 0, 2),
    income: clamp(Math.log1p(input.income / 100000), 0, 5),
    employment: input.employment === 'Salaried' ? -0.2 : input.employment === 'Business owner' ? 0.1 : 0.2,
    term: clamp((input.tenorMonths - 12) / 48, -0.25, 1)
  };
}
function modelProbabilities(s: Signals): number[] {
  const linear = sigmoid(-2.1 + 2.6 * s.burden + s.bureau + 1.2 * s.exposure - 0.35 * s.income + s.employment + 0.25 * s.term);
  const boosted = sigmoid(-2.25 + (s.burden > 0.55 ? 2.2 : s.burden > 0.35 ? 0.9 : 0.1)
    + (s.bureau > 1 ? 2 : s.bureau > 0 ? 0.7 : -0.45) + (s.exposure > 0.6 ? 0.7 : 0.05)
    - 0.25 * s.income + s.employment * 0.5 + (s.burden > 0.45 && s.bureau > 1 ? 0.8 : 0) + 0.2 * s.term);
  const forest = (
    sigmoid(-2.15 + 3 * s.burden + 0.8 * s.bureau + 0.8 * s.exposure - 0.3 * s.income + 0.3 * s.employment + 0.2 * s.term) +
    sigmoid(-2.35 + 2.1 * s.burden + 1.1 * s.bureau + 1.1 * s.exposure - 0.25 * s.income + s.employment + 0.15 * s.term) +
    sigmoid(-1.95 + 2.5 * s.burden + s.bureau + 0.9 * s.exposure - 0.4 * s.income + 0.6 * s.employment + 0.25 * s.term)
  ) / 3;
  return [linear, boosted, forest].map(x => round(x));
}
function ensemble(s: Signals): number { return round(modelProbabilities(s).reduce((sum, probability, i) => sum + probability * MODEL_WEIGHTS[i], 0)); }
export function simulatedLoanProbability(input: ApplicationDraft): number { return ensemble(signals(input)); }

export function simulateLoanAi(input: ApplicationDraft, policy: PolicySettings, sourceRecommendation: CreditDecision): LoanAiInsight {
  const actual = signals(input); const probability = ensemble(actual); const risk = simulatedRisk(probability);
  const definitions: Array<{ key: keyof Signals; label: string; value: number; reference: string; explanation: string }> = [
    { key: 'burden', label: 'Repayment burden', value: 0.35, reference: '35% debt service / income', explanation: 'Monthly obligations and the proposed principal instalment relative to income.' },
    { key: 'bureau', label: 'Bureau outlook', value: -0.6, reference: 'Clean bureau record', explanation: 'The reported bureau category supplied with this application.' },
    { key: 'exposure', label: 'Loan-to-income exposure', value: 0.1, reference: '10% of annualised income', explanation: 'Requested principal relative to twelve months of reported income.' },
    { key: 'income', label: 'Income capacity', value: Math.log(2), reference: 'KSh 100,000 monthly income', explanation: 'The income-capacity signal used by the ensemble simulation.' },
    { key: 'employment', label: 'Employment profile', value: -0.2, reference: 'Salaried employment', explanation: 'The reported employment category, held separate from identity attributes.' },
    { key: 'term', label: 'Repayment term', value: 0, reference: '12-month term signal', explanation: 'Term sensitivity with the other derived signals held fixed.' }
  ];
  const drivers: LoanRiskDriver[] = definitions.map(item => ({ label: item.label,
    deltaPp: round((probability - ensemble({ ...actual, [item.key]: item.value })) * 100, 2),
    reference: item.reference, explanation: item.explanation
  })).sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp));
  const probabilities = modelProbabilities(actual);
  const names = ['Logistic regression', 'Gradient boosting', 'Random forest'];
  const ids = ['linear-surrogate', 'boost-surrogate', 'forest-surrogate'];
  const models = probabilities.map((p, i) => ({ id: ids[i], name: names[i], probability: p, risk: simulatedRisk(p), weight: MODEL_WEIGHTS[i] }));
  const dti = (input.obligations + input.amount / input.tenorMonths) / input.income;
  const advice: CreditDecision = sourceRecommendation === 'Declined' ? 'Declined'
    : sourceRecommendation === 'Approved' && risk === 'Low' && dti <= policy.maxDti ? 'Approved' : 'Refer';
  const strengths = drivers.filter(x => x.deltaPp < -0.05).slice(0, 3).map(x => x.label + ' lowers the simulated likelihood by ' + Math.abs(x.deltaPp).toFixed(1) + ' percentage points against its reference.');
  const concerns = drivers.filter(x => x.deltaPp > 0.05).slice(0, 3).map(x => x.label + ' raises the simulated likelihood by ' + x.deltaPp.toFixed(1) + ' percentage points against its reference.');
  const actions: string[] = [];
  if (input.bureau === 'Adverse') { actions.push('Review the adverse bureau finding and supporting repayment evidence.'); }
  if (dti > policy.maxDti) { actions.push('Explore a smaller principal and verify the existing monthly obligations.'); }
  if (input.bureau === 'Thin file') { actions.push('Review additional repayment evidence for the limited bureau file.'); }
  if (sourceRecommendation === 'Declined') { actions.push('Review the decisive policy finding before considering an exception.'); }
  else if (advice === 'Refer') { actions.push('Review the scorecard and ensemble outlook together before recording a decision.'); }
  actions.push('Confirm the financial evidence and record the credit officer decision.');
  return { origin: 'SIMULATED', engineVersion: 'ensemble-demo-1', probability, risk,
    agreement: round(models.filter(x => x.risk === risk).length / models.length), signals: 6, models, drivers, advice,
    summary: 'The ensemble returns a ' + risk.toLowerCase() + '-risk outlook at ' + (probability * 100).toFixed(1) + '% default likelihood. Proposed debt service uses ' + (dti * 100).toFixed(1) + '% of reported income, ' + (dti <= policy.maxDti ? 'within' : 'above') + ' the configured ' + (policy.maxDti * 100).toFixed(0) + '% ceiling. ' + (advice === 'Approved' ? 'The combined recommendation supports approval, subject to officer review.' : advice === 'Declined' ? 'The configured policy recommends decline; inspect its decisive finding.' : 'The combined recommendation is to refer this application for review.'),
    strengths, concerns, actions: actions.slice(0, 3) };
}

export function previewLoanScenario(assessment: LoanAssessment, amount: number, tenor: number): LoanScenario {
  const input = { ...assessment.input, amount, tenorMonths: tenor };
  const ai = simulateLoanAi(input, assessment.policy, assessment.recommendation);
  const installment = amount / tenor; const dti = (input.obligations + installment) / input.income;
  return { amount, tenor, probability: ai.probability, risk: ai.risk, installment, dti,
    withinBudget: dti <= assessment.policy.maxDti && amount <= assessment.policy.maxAmount && !(input.product === 'Salary Advance' && tenor > 1),
    monthlySaving: assessment.affordability.installment - installment,
    deltaPp: round((ai.probability - (assessment.ai?.probability ?? simulateLoanAi(assessment.input, assessment.policy, assessment.recommendation).probability)) * 100, 2) };
}

export function validLoanAi(value: unknown): value is LoanAiInsight {
  const a = value as LoanAiInsight;
  const probability = (n: number): boolean => Number.isFinite(n) && n >= 0 && n <= 1;
  const risk = (s: string): boolean => ['Low', 'Medium', 'High'].includes(s);
  const textArray = (xs: unknown): boolean => Array.isArray(xs) && xs.every(x => typeof x === 'string');
  return !!a && a.origin === 'SIMULATED' && a.engineVersion === 'ensemble-demo-1' && probability(a.probability)
    && risk(a.risk) && a.risk === simulatedRisk(a.probability) && probability(a.agreement) && a.signals === 6
    && ['Approved', 'Declined', 'Refer'].includes(a.advice) && typeof a.summary === 'string'
    && Array.isArray(a.models) && a.models.length === 3 && a.models.every(m => !!m && typeof m.name === 'string' && typeof m.id === 'string' && probability(m.probability) && probability(m.weight) && risk(m.risk) && m.risk === simulatedRisk(m.probability))
    && new Set(a.models.map(m => m.id)).size === 3
    && Math.abs(a.models.reduce((sum, m) => sum + m.weight, 0) - 1) < 0.00001
    && Math.abs(a.models.reduce((sum, m) => sum + m.weight * m.probability, 0) - a.probability) < 0.0001
    && Math.abs(a.models.filter(m => m.risk === a.risk).length / 3 - a.agreement) < 0.0001
    && Array.isArray(a.drivers) && a.drivers.length === 6 && a.drivers.every(d => !!d && typeof d.label === 'string' && typeof d.explanation === 'string' && typeof d.reference === 'string' && Number.isFinite(d.deltaPp))
    && textArray(a.strengths) && textArray(a.concerns) && textArray(a.actions);
}
