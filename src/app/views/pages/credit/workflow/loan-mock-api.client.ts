import { LoanRecord, latestAssessment } from './loan-workflow.models';

// Browser-only API examples. This file deliberately performs no network I/O.
export const LOAN_API_ENDPOINTS: Readonly<Record<string, string>> = {
  core: '/api/core-banking/check', bureau: '/api/crb/check',
  identity: '/api/identity/verify', origination: '/api/origination/validate',
  collections: '/api/collections/check', payout: '/api/disbursement/readiness',
  screening: '/api/screening/check', notices: '/api/notices/preview'
};
export interface LoanApiTrace {
  method: 'POST'; url: string; httpStatus: number; durationMs: number;
  requestId: string; requestBody: string; responseBody: string; sample: true;
}
export function loanApiPreview(id: string, record: LoanRecord, durationMs: number, degraded: boolean): LoanApiTrace {
  const a = latestAssessment(record), p = a.input, f = a.eligibility?.customer;
  const requestId = 'DEMO-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const request = { nationalId: p.nationalId, applicationId: record.id, assessmentVersion: a.version,
    loan: { requestedAmount: p.amount, tenorMonths: p.tenorMonths, product: p.product } };
  let data: Record<string, unknown>;
  switch (id) {
    case 'core': data = { monthlyIncome: p.income, monthlyObligations: p.obligations,
      accountTenureMonths: f?.accountTenureMonths ?? null, averageBalance6m: f?.averageBalance6m ?? null,
      debtServiceRatio: a.affordability.dti }; break;
    case 'bureau': data = { bureauCategory: p.bureau, crbDefaulter: f?.crbDefaulter ?? null,
      crbBlacklisted: f?.crbBlacklisted ?? null, activeLoans: f?.activeLoans ?? null, activeLenders: f?.activeLenders ?? null }; break;
    case 'identity': data = { customerName: p.applicant, nationalIdVerified: f?.nationalIdVerified ?? null,
      kycCompleted: f?.kycCompleted ?? null }; break;
    case 'collections': data = { previousInstitutionDefault: f?.previousInstitutionDefault ?? null,
      detailedRepaymentHistoryAvailable: false }; break;
    case 'origination': data = { product: p.product, requestedAmount: p.amount,
      tenorMonths: p.tenorMonths, channel: p.channel, branch: p.branch }; break;
    case 'payout': data = { officerStatus: record.status, approvedAmount: record.approvedAmount ?? null,
      previewOnly: true, transferExecuted: false }; break;
    case 'screening': data = { screeningStatus: 'not_performed', sanctionsMatch: null, pepMatch: null }; break;
    default: data = { recipient: p.phone, applicationStatus: record.status, previewOnly: true, sent: false };
  }
  const response = { source: 'browser-demo', sample: true, requestId, connectorId: id,
    nationalId: p.nationalId, applicationId: record.id, assessmentVersion: a.version,
    statusCode: degraded ? 503 : 200, status: degraded ? 'review_required' : 'available',
    ...(degraded ? { message: 'Example unavailable response. Resume the connector to preview normal delivery.' } : { data }) };
  return { method: 'POST', url: LOAN_API_ENDPOINTS[id] || '', httpStatus: response.statusCode,
    durationMs, requestId, requestBody: JSON.stringify(request, null, 2),
    responseBody: JSON.stringify(response, null, 2), sample: true };
}
