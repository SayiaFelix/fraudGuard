import { ApplicationDraft } from '../credit-data.service';
import { CreditDecision, DecisionRule, PolicySettings, RiskBand } from '../credit-demo.data';

export type LoanStatus = 'Awaiting decision' | 'More information required' | 'Approved' | 'Declined';
export interface LoanCustomerFacts {
  nationalIdVerified: boolean | null; kycCompleted: boolean | null; accountTenureMonths: number | null;
  crbDefaulter: boolean | null; crbBlacklisted: boolean | null; activeLoans: number | null; activeLenders: number | null;
  previousInstitutionDefault: boolean | null; employmentTenureMonths: number | null;
  ageYears: number | null; averageBalance6m: number | null;
}
export interface LoanEligibilityPolicy { minAccountMonths: number; maxActiveLoans: number; maxActiveLenders: number; minEmploymentMonths: number; }
export interface LoanEligibility {
  version: 'eligibility-demo-1'; customer: LoanCustomerFacts; policy: LoanEligibilityPolicy;
  checks: LoanCheck[]; decision: CreditDecision; reasons: string[];
}
export interface LoanCustomer { id: string; source: 'Mock customer from original portal' | 'Kenya demo profile'; profile: ApplicationDraft; facts: LoanCustomerFacts; }
export interface LoanCheck { code: string; name: string; observed: string; requirement: string; result: 'Pass' | 'Triggered' | 'Not implemented' | 'Needs review'; effect: string; }
export interface LoanModelOutput { id: string; name: string; probability: number; risk: RiskBand; weight: number; }
export interface LoanRiskDriver { label: string; deltaPp: number; reference: string; explanation: string; }
export interface LoanAiInsight {
  origin: 'SIMULATED'; engineVersion: 'ensemble-demo-1';
  probability: number; risk: RiskBand; agreement: number; signals: number;
  models: LoanModelOutput[]; drivers: LoanRiskDriver[];
  advice: CreditDecision; summary: string; strengths: string[]; concerns: string[]; actions: string[];
}
export interface LoanScenario {
  amount: number; tenor: number; probability: number; risk: RiskBand; installment: number;
  dti: number; withinBudget: boolean; monthlySaving: number; deltaPp: number;
}
export type LoanLimitOutcome = 'Approve full amount' | 'Approve reduced amount' | 'Refer for review' | 'Decline';
export interface LoanLimitRecommendation {
  version: 'limit-demo-1' | 'limit-demo-2'; outcome: LoanLimitOutcome; requestedAmount: number; tenorMonths: number;
  maximumAmount: number; recommendedAmount: number; monthlyBudget: number; affordabilityCeiling: number;
  policyCeiling: number; minimumAmount: 10000; increment: 1000; riskCeiling: number;
  riskBand?: RiskBand; riskMultiplier?: number;
  offer: { score: number; probability: number; dti: number; installment: number; policyDecision: CreditDecision } | null;
  reasons: string[];
}
export interface LoanAssessment {
  version: number; assessedAt: string; input: ApplicationDraft;
  mode: 'SIMULATED'; modelAvailable: false; modelMessage: string;
  score: number; scoreMinimum: 300; scoreMaximum: 900; risk: RiskBand;
  baseScore: 500; contributions: Array<{ label: string; impact: number }>;
  policy: PolicySettings; configuredRules: DecisionRule[]; checks: LoanCheck[];
  affordability: { installment: number; dti: number; headroom: number; residual: number; affordable: boolean; };
  recommendation: CreditDecision; reasons: string[]; limitations: string[];
  ai?: LoanAiInsight;
  limit?: LoanLimitRecommendation;
  eligibility?: LoanEligibility;
  sourceChecks?: LoanCheck[];
  integration?: LoanDataAvailability;
}
export type LoanConnectorStatus = 'Live' | 'Degraded' | 'Paused';
export interface LoanDataAvailability {
  version: 'connector-demo-1'; checkedAt: string; decision: 'Approved' | 'Refer';
  connectors: Array<{ id: string; name: string; status: LoanConnectorStatus }>; reasons: string[];
}
export interface LoanEvent {
  id: string; action: 'Assessed' | 'Reassessed' | 'Approve' | 'Decline' | 'Request information';
  officer: string; officerSource: 'Portal session' | 'Demo identity'; timestamp: string;
  previousStatus: LoanStatus | 'Not submitted'; status: LoanStatus;
  reason: string; informationRequested: string; assessmentVersion: number; policyOverride: boolean;
  approvedAmount?: number; approvedTenorMonths?: number; approvalBasis?: 'Requested amount' | 'Recommended offer';
}
export interface LoanRecord {
  id: string; customerId: string; nationalId: string; customerName: string;
  submittedAt: string; updatedAt: string; status: LoanStatus;
  submissionKeys: string[]; assessments: LoanAssessment[]; history: LoanEvent[];
  approvedAmount?: number;
}
export interface BulkApplicationRow {
  row: number; nationalId: string; amount: number; tenorMonths: number; product: string;
  applicationId: string; reassessmentNote: string; errors: string[];
  state: 'Ready' | 'Invalid' | 'Saved' | 'Failed'; message: string; resultId: string; submissionKey: string;
}
export const LOAN_STORAGE_KEY = 'eclectics-original-loan-workflow-v1';
export const LOAN_STATUSES: LoanStatus[] = ['Awaiting decision', 'More information required', 'Approved', 'Declined'];
export function latestAssessment(record: LoanRecord): LoanAssessment { return record.assessments[record.assessments.length - 1]; }
export function isPending(record: LoanRecord): boolean { return record.status === 'Awaiting decision' || record.status === 'More information required'; }
