import { ApplicationDraft } from '../credit-data.service';
import { CreditDecision, PolicySettings, RiskBand } from '../credit-demo.data';
import { LoanAiInsight, LoanAssessment, LoanModelOutput, LoanRiskDriver, LoanScenario } from './loan-workflow.models';

function debtService(input: Pick<ApplicationDraft, 'amount' | 'tenorMonths' | 'income' | 'obligations'>): number {
  const income = Number(input.income);
  if (!Number.isFinite(income) || income <= 0) { throw new Error('Income must be positive before a model outlook can be produced.'); }
  const tenor = Math.max(1, Number(input.tenorMonths) || 1);
  return (Number(input.obligations) + Number(input.amount) / tenor) / income;
}

export function simulatedLoanProbability(input: Pick<ApplicationDraft, 'amount' | 'tenorMonths' | 'income' | 'obligations' | 'bureau' | 'employment'>): number {
  const dti = debtService(input);
  let probability = 0.04 + dti * 0.35;
  if (input.bureau === 'Adverse') { probability += 0.25; }
  else if (input.bureau === 'Thin file') { probability += 0.06; }
  if (input.employment === 'Self employed') { probability += 0.04; }
  else if (input.employment === 'Business owner') { probability += 0.02; }
  return Math.min(0.95, Math.max(0.02, probability));
}

export function simulatedRisk(probability: number): RiskBand {
  if (probability < 0.12) { return 'Low'; }
  if (probability < 0.30) { return 'Medium'; }
  return 'High';
}

function deltaPp(input: ApplicationDraft, patch: Partial<ApplicationDraft>): number {
  const base = simulatedLoanProbability(input);
  const next = simulatedLoanProbability({ ...input, ...patch });
  return Math.round((next - base) * 1000) / 10;
}

function driversFor(input: ApplicationDraft): LoanRiskDriver[] {
  return [
    { label: 'Bureau outlook', deltaPp: input.bureau === 'Clean' ? 0 : deltaPp(input, { bureau: 'Clean' }), reference: 'Clean bureau file', explanation: 'How the saved bureau category moves the illustrative likelihood versus a clean file.' },
    { label: 'Repayment burden', deltaPp: deltaPp(input, { obligations: 0 }), reference: 'No existing monthly obligations', explanation: 'How reported obligations change debt service in the illustrative ensemble.' },
    { label: 'Loan-to-income exposure', deltaPp: deltaPp(input, { amount: Math.max(10000, input.amount * 0.5) }), reference: 'Half the requested principal', explanation: 'How the requested principal changes the illustrative likelihood.' },
    { label: 'Employment profile', deltaPp: input.employment === 'Salaried' ? 0 : deltaPp(input, { employment: 'Salaried' }), reference: 'Salaried employment', explanation: 'How the employment category is treated in the demonstration ensemble.' },
    { label: 'Income capacity', deltaPp: deltaPp(input, { income: input.income * 1.25 }), reference: 'Income 25% higher', explanation: 'How a higher reported income would move the illustrative likelihood.' },
    { label: 'Repayment term', deltaPp: deltaPp(input, { tenorMonths: Math.min(60, input.tenorMonths + 6) }), reference: 'Six months longer', explanation: 'How a longer principal-only term changes the illustrative likelihood.' }
  ];
}

export function simulateLoanAi(input: ApplicationDraft, policy: PolicySettings, decision: CreditDecision): LoanAiInsight {
  const probability = simulatedLoanProbability(input);
  const risk = simulatedRisk(probability);
  const dti = debtService(input);
  const weights = [0.4, 0.35, 0.25];
  const first = Math.min(0.99, Math.max(0.01, probability - 0.02));
  const second = Math.min(0.99, Math.max(0.01, probability + 0.01));
  const third = (probability - weights[0] * first - weights[1] * second) / weights[2];
  const models: LoanModelOutput[] = [
    { id: 'model-1', name: 'Logistic surrogate', probability: first, risk: simulatedRisk(first), weight: weights[0] },
    { id: 'model-2', name: 'Boosted-tree surrogate', probability: second, risk: simulatedRisk(second), weight: weights[1] },
    { id: 'model-3', name: 'Forest surrogate', probability: third, risk: simulatedRisk(third), weight: weights[2] }
  ];
  const advice: CreditDecision = decision === 'Declined'
    ? 'Declined'
    : decision === 'Approved' && risk === 'Low' && dti <= policy.maxDti
      ? 'Approved'
      : 'Refer';
  const matching = models.filter(model => model.risk === risk).length;
  return {
    origin: 'SIMULATED',
    engineVersion: 'ensemble-demo-1',
    probability,
    risk,
    agreement: matching / models.length,
    signals: models.length,
    models,
    drivers: driversFor(input),
    advice,
    summary: risk + ' illustrative outlook. The ensemble likelihood is ' + (probability * 100).toFixed(1) + '%.',
    strengths: risk === 'High' ? [] : ['Debt service and bureau inputs are reflected in the illustrative ensemble.'],
    concerns: advice === 'Approved' ? [] : ['Officer review is required before this illustrative outlook can support a decision.'],
    actions: advice === 'Approved' ? ['Review the policy checks and record the officer decision.'] : ['Resolve the triggered findings before supporting an offer.']
  };
}

export function validLoanAi(value: unknown): value is LoanAiInsight {
  const insight = value as LoanAiInsight;
  if (!insight || insight.origin !== 'SIMULATED' || insight.engineVersion !== 'ensemble-demo-1') { return false; }
  if (!Number.isFinite(insight.probability) || insight.probability < 0 || insight.probability > 1) { return false; }
  if (!['Low', 'Medium', 'High'].includes(insight.risk)) { return false; }
  if (!Array.isArray(insight.models) || insight.models.length !== 3) { return false; }
  if (!insight.models.every(model => Number.isFinite(model.probability) && model.probability >= 0 && model.probability <= 1 && Number.isFinite(model.weight))) { return false; }
  const weighted = insight.models.reduce((sum, model) => sum + model.weight * model.probability, 0);
  if (Math.abs(weighted - insight.probability) > 0.0001) { return false; }
  return Array.isArray(insight.drivers) && insight.drivers.length > 0 && insight.drivers.every(driver => typeof driver.label === 'string' && Number.isFinite(driver.deltaPp));
}

export function previewLoanScenario(assessment: LoanAssessment, amount: number, tenor: number): LoanScenario {
  if (!Number.isFinite(amount) || !Number.isFinite(tenor) || amount < 10000 || tenor < 1 || tenor > 60) {
    throw new Error('Valid financial inputs are required.');
  }
  const input = { ...assessment.input, amount, tenorMonths: Math.round(tenor) };
  const probability = simulatedLoanProbability(input);
  const installment = amount / input.tenorMonths;
  const original = assessment.input.amount / Math.max(1, assessment.input.tenorMonths);
  const income = Number(input.income) || 0;
  const dti = income > 0 ? (Number(input.obligations) + installment) / income : 1;
  const salaryBlocked = input.product === 'Salary Advance' && input.tenorMonths > 1;
  const withinBudget = !salaryBlocked && dti <= assessment.policy.maxDti && amount <= assessment.policy.maxAmount;
  const baseline = assessment.ai?.probability ?? simulatedLoanProbability(assessment.input);
  return {
    amount,
    tenor: input.tenorMonths,
    probability,
    risk: simulatedRisk(probability),
    installment,
    dti,
    withinBudget,
    monthlySaving: original - installment,
    deltaPp: Math.round((probability - baseline) * 1000) / 10
  };
}
