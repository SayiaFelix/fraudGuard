export type RiskBand = 'Low' | 'Medium' | 'High';
export type CreditDecision = 'Approved' | 'Declined' | 'Refer';
export type CaseStatus = 'New' | 'In review' | 'Awaiting information' | 'Escalated' | 'Closed';

export interface CaseNote {
  author: string;
  text: string;
  time: string;
}

export interface ScoreFactor {
  label: string;
  impact: number;
}

export interface CreditApplication {
  id: string;
  applicant: string;
  product: string;
  amount: number;
  score: number;
  risk: RiskBand;
  decision: CreditDecision;
  caseStatus: CaseStatus;
  channel: string;
  country: string;
  branch: string;
  submittedAt: string;
  reasonCodes: string[];
  assignedTo: string;
  notes: CaseNote[];
  phone: string;
  nationalId: string;
  income: number;
  obligations: number;
  tenorMonths: number;
  dti: number;
  employment: string;
  bureau: string;
  factors: ScoreFactor[];
  extraCycles?: Array<'On time' | 'Late' | 'Default'>;
}

export interface PortfolioSummary {
  total: number;
  approved: number;
  declined: number;
  referred: number;
  openApplications: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  avgScore: number;
  avgDecisionSeconds: number;
  deltas: {
    total: number;
    approved: number;
    declined: number;
    referred: number;
    score: number;
    decisionTime: number;
  };
}

export interface DecisionRule {
  code: string;
  name: string;
  condition: string;
  action: CreditDecision;
  enabled: boolean;
  severity: 'Hard' | 'Soft';
}

export interface PolicySettings {
  approveFrom: number;
  declineBelow: number;
  maxDti: number;
  maxAmount: number;
}

export interface AuditEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  detail: string;
  decision: string;
}

export interface BookRow {
  id: string;
  applicant: string;
  product: string;
  score: number;
  dti: number;
  amount: number;
  bureau: string;
  tenor: number;
}

export const PRODUCTS = [
  'Personal Loan',
  'Salary Advance',
  'SME Working Capital',
  'School Fees',
  'Device Finance',
  'Asset Finance'
];

export const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'Uganda',
  'Cameroon',
  'Côte d\'Ivoire',
  'Senegal',
  'Tanzania'
];

export const ANALYSTS = [
  'Demo User',
  'Nelly Cheruiyot',
  'Moses Kipchoge',
  'Felix Oduor',
  'Credit committee'
];

export const DEFAULT_POLICY: PolicySettings = {
  approveFrom: 700,
  declineBelow: 580,
  maxDti: 0.45,
  maxAmount: 2000000
};

export const PORTFOLIO_SUMMARY: PortfolioSummary = {
  total: 1248,
  approved: 682,
  declined: 412,
  referred: 154,
  openApplications: 124,
  lowRisk: 649,
  mediumRisk: 399,
  highRisk: 200,
  avgScore: 612,
  avgDecisionSeconds: 42,
  deltas: {
    total: 12,
    approved: 8,
    declined: 4,
    referred: -2,
    score: 11,
    decisionTime: -18
  }
};

export const DECISION_TREND = {
  categories: ['Oct 17', 'Oct 18', 'Oct 19', 'Oct 20', 'Oct 21', 'Oct 22', 'Oct 23'],
  approved: [186, 204, 198, 246, 312, 298, 354],
  declined: [92, 101, 108, 126, 164, 151, 188],
  referred: [38, 52, 49, 66, 84, 73, 61]
};

export const PRODUCT_MIX = [
  { name: 'Personal Loan', count: 420, approval: 61 },
  { name: 'Salary Advance', count: 260, approval: 72 },
  { name: 'SME Working Capital', count: 210, approval: 44 },
  { name: 'School Fees', count: 140, approval: 68 },
  { name: 'Device Finance', count: 118, approval: 57 },
  { name: 'Asset Finance', count: 100, approval: 39 }
];

export const COUNTRY_MIX = [
  { name: 'Nigeria', count: 486, approval: 58 },
  { name: 'Ghana', count: 214, approval: 54 },
  { name: 'Kenya', count: 176, approval: 51 },
  { name: 'Uganda', count: 98, approval: 49 },
  { name: 'Cameroon', count: 86, approval: 46 },
  { name: 'Côte d\'Ivoire', count: 74, approval: 52 },
  { name: 'Senegal', count: 62, approval: 55 },
  { name: 'Tanzania', count: 52, approval: 48 }
];

export const SCORE_BANDS = [
  { band: '800–900', label: 'Prime', share: 11, decision: 'Auto approve' },
  { band: '700–799', label: 'Low risk', share: 28, decision: 'Approve in policy' },
  { band: '620–699', label: 'Medium risk', share: 33, decision: 'Refer to analyst' },
  { band: '580–619', label: 'Watch', share: 14, decision: 'Refer, senior review' },
  { band: '300–579', label: 'High risk', share: 14, decision: 'Decline' }
];

export const MODEL_METRICS = {
  name: 'Eclectics Retail Scorecard',
  version: 'v3.2',
  gini: 0.48,
  ks: 32,
  psi: 0.08,
  overrideRate: 6.4,
  population: [
    { band: '300–579', expected: 14, actual: 15 },
    { band: '580–619', expected: 14, actual: 13 },
    { band: '620–699', expected: 33, actual: 34 },
    { band: '700–799', expected: 28, actual: 27 },
    { band: '800–900', expected: 11, actual: 11 }
  ]
};

export const INTEGRATIONS = [
  { name: 'Finacle core', detail: 'Account standing, existing exposure, arrears', status: 'Awaiting JSON feed' },
  { name: 'CRC / FirstCentral bureau', detail: 'Bureau score, delinquency, enquiries', status: 'Awaiting JSON feed' },
  { name: 'NIN identity', detail: 'Identity match and duplicate detection', status: 'Awaiting JSON feed' },
  { name: 'Mobile origination', detail: 'USSD, app, and agent applications', status: 'Awaiting JSON feed' },
  { name: 'Collections', detail: 'Post-disbursement performance', status: 'Awaiting JSON feed' }
];

export const DECISION_RULES: DecisionRule[] = [
  { code: 'CR-01', name: 'Score below decline cutoff', condition: 'Score is under the decline cutoff', action: 'Declined', enabled: true, severity: 'Hard' },
  { code: 'CR-02', name: 'Debt service above policy', condition: 'DTI is above the maximum debt service ratio', action: 'Refer', enabled: true, severity: 'Soft' },
  { code: 'CR-03', name: 'Amount above auto-approval', condition: 'Requested amount exceeds the auto-approval limit', action: 'Refer', enabled: true, severity: 'Soft' },
  { code: 'CR-04', name: 'Thin credit file', condition: 'No usable bureau history', action: 'Refer', enabled: true, severity: 'Soft' },
  { code: 'CR-05', name: 'Adverse bureau status', condition: 'Bureau record is adverse', action: 'Declined', enabled: true, severity: 'Hard' },
  { code: 'CR-06', name: 'Salary advance tenor', condition: 'Salary advance tenor is longer than 1 month', action: 'Declined', enabled: true, severity: 'Hard' },
  { code: 'CR-09', name: 'Clean auto-approval', condition: 'Score, DTI, and bureau are inside the approve band', action: 'Approved', enabled: true, severity: 'Soft' }
];

export const APPLICATIONS: CreditApplication[] = [
  app('APP-10482', 'David Munya', 'Personal Loan', 500000, 742, 'Approved', 'Closed', 'Mobile app', 'Nigeria', 'Lagos', '2026-10-23T10:12:00', 'Low', ['Score inside auto-approval band', 'Clean bureau'], 'Demo User', 'Salaried', 'Clean', 850000, 120000, 12, 0.22, '+234 803 441 2201', '12445890123'),
  app('APP-10479', 'Simon Kilonzo', 'SME Working Capital', 2500000, 621, 'Refer', 'In review', 'Branch', 'Nigeria', 'Abuja', '2026-10-23T09:58:00', 'Medium', ['Amount above auto-approval limit', 'Debt service near the policy edge'], 'Nelly Cheruiyot', 'Business owner', 'Thin file', 920000, 310000, 18, 0.48, '+234 809 220 1184', '22891004561'),
  app('APP-10477', 'Mary Mwende', 'School Fees', 350000, 688, 'Refer', 'New', 'Mobile app', 'Nigeria', 'Kano', '2026-10-23T09:47:00', 'Medium', ['Thin credit file', 'Score below auto-approval'], 'Unassigned', 'Salaried', 'Thin file', 240000, 40000, 9, 0.33, '+234 701 552 9033', '33129088421'),
  app('APP-10474', 'Grace Gitau', 'Device Finance', 180000, 705, 'Approved', 'Closed', 'Agent', 'Ghana', 'Accra', '2026-10-23T09:32:00', 'Low', ['Score inside auto-approval band', 'Clean bureau'], 'Demo User', 'Salaried', 'Clean', 420000, 60000, 6, 0.21, '+233 24 411 9088', 'GHA-229184'),
  app('APP-10471', 'Peter Odhiambo', 'Salary Advance', 120000, 590, 'Refer', 'New', 'USSD', 'Senegal', 'Dakar', '2026-10-23T09:20:00', 'Medium', ['Score below auto-approval', 'Thin credit file'], 'Unassigned', 'Salaried', 'Thin file', 180000, 20000, 1, 0.28, '+221 77 441 2033', 'SN-449120'),
  app('APP-10468', 'James Were', 'Asset Finance', 1800000, 540, 'Declined', 'Closed', 'Branch', 'Kenya', 'Nairobi', '2026-10-23T09:05:00', 'High', ['Score below decline cutoff', 'Debt service above policy'], 'Felix Oduor', 'Self employed', 'Adverse', 260000, 140000, 24, 0.62, '+254 712 880 221', 'KE-3391208'),
  app('APP-10466', 'Faith Achieng', 'Personal Loan', 750000, 801, 'Approved', 'Closed', 'Mobile app', 'Nigeria', 'Lagos', '2026-10-22T16:40:00', 'Low', ['Clean auto-approval'], 'Demo User', 'Salaried', 'Clean', 1200000, 150000, 24, 0.18, '+234 805 119 3340', '10992384711'),
  app('APP-10463', 'Kevin Owino', 'Salary Advance', 90000, 660, 'Refer', 'Awaiting information', 'Mobile app', 'Nigeria', 'Ibadan', '2026-10-22T15:10:00', 'Medium', ['Income document not attached'], 'Moses Kipchoge', 'Salaried', 'Clean', 210000, 45000, 1, 0.36, '+234 816 300 2291', '55201938447'),
  app('APP-10460', 'Mercy Chebet', 'School Fees', 420000, 715, 'Approved', 'Closed', 'Agent', 'Uganda', 'Kampala', '2026-10-22T14:02:00', 'Low', ['Score inside auto-approval band'], 'Demo User', 'Salaried', 'Clean', 480000, 70000, 10, 0.23, '+256 772 441 908', 'UG-229184'),
  app('APP-10457', 'Samuel Omondi', 'Personal Loan', 600000, 575, 'Refer', 'Escalated', 'Branch', 'Cameroon', 'Douala', '2026-10-22T11:26:00', 'High', ['Score on the decline boundary', 'Existing exposure'], 'Credit committee', 'Business owner', 'Clean', 300000, 90000, 18, 0.44, '+237 677 220 184', 'CM-881203'),
  app('APP-10454', 'Lucy Atieno', 'Device Finance', 250000, 634, 'Refer', 'New', 'Mobile app', 'Ghana', 'Accra', '2026-10-22T10:14:00', 'Medium', ['Thin credit file'], 'Unassigned', 'Self employed', 'Thin file', 190000, 30000, 8, 0.32, '+233 20 558 1142', 'GHA-110293'),
  app('APP-10451', 'Ann Njeri', 'Personal Loan', 400000, 612, 'Refer', 'In review', 'Mobile app', 'Kenya', 'Nairobi', '2026-10-22T09:02:00', 'Medium', ['Score below auto-approval'], 'Nelly Cheruiyot', 'Salaried', 'Clean', 220000, 50000, 12, 0.38, '+254 723 009 441', 'KE-1002934'),
  app('APP-10448', 'Stephen Odongo', 'Salary Advance', 150000, 455, 'Declined', 'Closed', 'USSD', 'Nigeria', 'Enugu', '2026-10-21T18:22:00', 'High', ['Score below decline cutoff', 'Adverse bureau status'], 'Demo User', 'Self employed', 'Adverse', 90000, 40000, 1, 0.71, '+234 703 228 1190', '77301928334'),
  app('APP-10444', 'Joseph Owino', 'SME Working Capital', 2100000, 598, 'Refer', 'New', 'Branch', 'Côte d\'Ivoire', 'Abidjan', '2026-10-21T13:41:00', 'Medium', ['Amount above auto-approval limit'], 'Unassigned', 'Business owner', 'Clean', 700000, 180000, 12, 0.41, '+225 07 44 21 90', 'CI-229103')
];

export const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'AUD-2201', time: '2026-10-23T10:12:20', actor: 'Scorecard v3.2', action: 'Auto approved', detail: 'APP-10482 · David Munya', decision: 'Approved' },
  { id: 'AUD-2200', time: '2026-10-23T09:58:40', actor: 'Decision rules', action: 'Referred to queue', detail: 'APP-10479 · Simon Kilonzo', decision: 'Refer' },
  { id: 'AUD-2198', time: '2026-10-23T09:32:10', actor: 'Scorecard v3.2', action: 'Auto approved', detail: 'APP-10474 · Grace Gitau', decision: 'Approved' },
  { id: 'AUD-2194', time: '2026-10-23T09:05:33', actor: 'Felix Oduor', action: 'Application declined', detail: 'APP-10468 · James Were', decision: 'Declined' },
  { id: 'AUD-2188', time: '2026-10-22T15:18:02', actor: 'Moses Kipchoge', action: 'Information requested', detail: 'APP-10463 · Kevin Owino', decision: 'Refer' },
  { id: 'AUD-2181', time: '2026-10-22T11:40:18', actor: 'Demo User', action: 'Case escalated', detail: 'APP-10457 · Samuel Omondi', decision: 'Refer' }
];

function app(
  id: string,
  applicant: string,
  product: string,
  amount: number,
  score: number,
  decision: CreditDecision,
  caseStatus: CaseStatus,
  channel: string,
  country: string,
  branch: string,
  submittedAt: string,
  risk: RiskBand,
  reasonCodes: string[],
  assignedTo: string,
  employment: string,
  bureau: string,
  income: number,
  obligations: number,
  tenorMonths: number,
  dti: number,
  phone: string,
  nationalId: string
): CreditApplication {
  const notes: CaseNote[] = [];
  if (caseStatus === 'In review') {
    notes.push({ author: assignedTo, text: 'Opened for manual review. Affordability is the open question.', time: 'Oct 23, 9:10 AM' });
  }
  if (caseStatus === 'Awaiting information') {
    notes.push({ author: assignedTo, text: 'Asked the applicant for a current salary slip.', time: 'Oct 22, 3:18 PM' });
  }
  if (caseStatus === 'Escalated') {
    notes.push({ author: 'Demo User', text: 'Escalated because the score sits on the decline boundary and exposure is material.', time: 'Oct 22, 11:40 AM' });
  }
  return {
    id,
    applicant,
    product,
    amount,
    score,
    risk,
    decision,
    caseStatus,
    channel,
    country,
    branch,
    submittedAt,
    reasonCodes,
    assignedTo,
    notes,
    phone,
    nationalId,
    income,
    obligations,
    tenorMonths,
    dti,
    employment,
    bureau,
    factors: [
      { label: 'Income stability', impact: employment === 'Salaried' ? 45 : 12 },
      { label: 'Bureau record', impact: bureau === 'Clean' ? 70 : bureau === 'Thin file' ? 5 : -90 },
      { label: 'Debt service', impact: dti > 0.45 ? -40 : 18 },
      { label: 'Requested amount', impact: amount > 2000000 ? -25 : 8 }
    ]
  };
}
