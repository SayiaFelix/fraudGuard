import { Injectable, OnDestroy } from '@angular/core';
import { LoanConnectorStatus, LoanDataAvailability, LoanRecord, latestAssessment } from './loan-workflow.models';
import { LOAN_API_ENDPOINTS, LoanApiTrace, loanApiPreview } from './loan-mock-api.client';

export interface LoanConnector {
  id: string; name: string; system: string; purpose: string; usedBy: string; owner: string; required: boolean;
  status: LoanConnectorStatus; latencyMs: number; callsToday: number; success: number | null;
}
export interface LoanConnectorResult {
  tone: 'ok' | 'bad' | 'wait'; title: string; lines: string[]; connectorId: string; applicationId: string; assessmentVersion: number; checkedAt: string;
  trace?: LoanApiTrace;
}
interface ConnectorEvent { id: string; at: string; action: string; connectorId: string; connector: string; applicationId: string; outcome: string; assessmentVersion?: number; }
interface ConnectorState { schema: 1; date: string; status: Record<string, LoanConnectorStatus>; calls: Record<string, { total: number; delivered: number }>; events: ConnectorEvent[]; }
const KEY = 'eclectics-loan-connectors-v1';
const definitions = [
  { id: 'core', name: 'Core banking', system: 'Core banking adapter', purpose: 'Account tenure, income, existing exposure and repayment capacity on the selected assessment.', usedBy: 'Affordability and lending limit', owner: 'Core systems', required: true, initial: 'Live', latencyMs: 240 },
  { id: 'bureau', name: 'Credit reference bureau', system: 'Kenya CRB adapter', purpose: 'Bureau category, defaulter/blacklist flags and active loan/lender counts saved with this application.', usedBy: 'Credit risk and eligibility', owner: 'Risk data', required: true, initial: 'Live', latencyMs: 400 },
  { id: 'identity', name: 'National identity & KYC', system: 'Identity verification adapter', purpose: 'Review recorded national-ID verification and completed KYC, without treating an ID format as a verified identity.', usedBy: 'Eligibility and approval review', owner: 'Fraud & KYC', required: true, initial: 'Live', latencyMs: 410 },
  { id: 'origination', name: 'Origination channels', system: 'Mobile app / USSD / agent', purpose: 'Application product, channel, requested principal and selected repayment period.', usedBy: 'New application', owner: 'Channels', required: false, initial: 'Live', latencyMs: 180 },
  { id: 'collections', name: 'Collections ledger', system: 'Loan servicing adapter', purpose: 'Previous default with this institution as recorded in the assessment. No repayment-history counts are invented.', usedBy: 'Internal default policy', owner: 'Collections', required: true, initial: 'Live', latencyMs: 320 },
  { id: 'payout', name: 'Disbursement readiness', system: 'Mobile money / bank adapter', purpose: 'Check the saved officer approval and approved amount. This is a readiness preview and never moves money.', usedBy: 'Post-approval review', owner: 'Operations', required: false, initial: 'Paused', latencyMs: 300 },
  { id: 'screening', name: 'Sanctions & PEP screening', system: 'Watchlist adapter', purpose: 'Show whether verified screening evidence is available. An adverse credit bureau category is not a sanctions match.', usedBy: 'Compliance review', owner: 'Compliance', required: false, initial: 'Live', latencyMs: 260 },
  { id: 'notices', name: 'Customer notices', system: 'SMS adapter', purpose: 'Prepare an application-specific notice preview. No message is sent from this demonstration.', usedBy: 'Decision and evidence notices', owner: 'Customer care', required: false, initial: 'Degraded', latencyMs: 1800 }
] as const;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const today = (): string => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const defaultState = (): ConnectorState => ({ schema: 1, date: today(), status: Object.fromEntries(definitions.map(c => [c.id, c.initial])), calls: {}, events: [] });

@Injectable({ providedIn: 'root' })
export class LoanIntegrationService implements OnDestroy {
  private state = defaultState(); storageError = '';
  private previewTimes: Record<string, number> = {};
  private storageListener = (e: StorageEvent): void => { if (e.key === KEY || e.key === null) { this.restore(); } };
  constructor() { this.restore(); if (typeof window !== 'undefined') { window.addEventListener('storage', this.storageListener); } }
  ngOnDestroy(): void { if (typeof window !== 'undefined') { window.removeEventListener('storage', this.storageListener); } }
  private read(): ConnectorState {
    const raw = localStorage.getItem(KEY); if (!raw) { return defaultState(); } const s = JSON.parse(raw) as ConnectorState;
    if (!s || s.schema !== 1 || typeof s.date !== 'string' || !s.status || !s.calls || !Array.isArray(s.events)
      || !definitions.every(d => ['Live', 'Degraded', 'Paused'].includes(s.status[d.id]))
      || !Object.values(s.calls).every(c => c && Number.isSafeInteger(c.total) && Number.isSafeInteger(c.delivered) && c.delivered >= 0 && c.total >= c.delivered)
      || !s.events.every(e => e && typeof e.id === 'string' && typeof e.action === 'string' && typeof e.connector === 'string' && typeof e.connectorId === 'string' && typeof e.applicationId === 'string' && typeof e.outcome === 'string' && Number.isFinite(Date.parse(e.at)))) { throw new Error('Saved connector state is inconsistent; it has been retained.'); }
    if (s.date !== today()) { s.date = today(); s.calls = {}; } return s;
  }
  private restore(): void { try { this.state = this.read(); this.storageError = ''; } catch (e) { this.storageError = e instanceof Error ? e.message : 'Connector settings could not be read.'; } }
  private commit(state: ConnectorState): void {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { throw new Error('The browser could not save the connector change. No change was recorded.'); }
    this.state = copy(state); this.storageError = '';
  }
  get connectors(): LoanConnector[] {
    const calls = this.state.date === today() ? this.state.calls : {};
    return definitions.map(d => { const c = calls[d.id]; return { ...d, status: this.state.status[d.id], latencyMs: this.state.status[d.id] === 'Paused' ? 0 : this.previewTimes[d.id] || 0,
      callsToday: c?.total || 0, success: c?.total ? Math.round(c.delivered / c.total * 1000) / 10 : null }; });
  }
  get events(): ConnectorEvent[] { return copy(this.state.events); }
  count(status: LoanConnectorStatus): number { return this.connectors.filter(c => c.status === status).length; }
  get callsToday(): number { return this.connectors.reduce((sum, c) => sum + c.callsToday, 0); }
  find(id: string): LoanConnector | undefined { return this.connectors.find(c => c.id === id); }
  endpoint(id: string): string { return LOAN_API_ENDPOINTS[id] || ''; }
  private event(s: ConnectorState, c: LoanConnector, action: string, applicationId: string, outcome: string, assessmentVersion?: number): void {
    s.events.unshift({ id: 'CONN-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), at: new Date().toISOString(), connectorId: c.id, connector: c.name, action, applicationId, outcome, ...(assessmentVersion ? { assessmentVersion } : {}) }); s.events = s.events.slice(0, 250);
  }
  toggle(id: string): LoanConnector {
    const s = this.read(); const connector = this.find(id); if (!connector) { throw new Error('Choose an available connector.'); }
    const status: LoanConnectorStatus = s.status[id] === 'Paused' ? 'Live' : 'Paused'; s.status[id] = status;
    this.event(s, connector, status === 'Paused' ? 'Paused' : 'Resumed', '', status === 'Paused' ? 'API preview paused; required data gates future assessments for review.' : 'Connector available for API previews.');
    this.commit(s); return this.find(id)!;
  }
  availability(): LoanDataAvailability {
    this.restore(); const connectors = this.connectors.filter(c => c.required).map(c => ({ id: c.id, name: c.name, status: c.status }));
    const reasons = connectors.filter(c => c.status !== 'Live').map(c => c.name + ' is ' + c.status.toLowerCase() + '; review required before supporting an offer.');
    if (this.storageError) { reasons.push('Connector configuration is unavailable; confirm the data sources before proceeding.'); }
    return { version: 'connector-demo-1', checkedAt: new Date().toISOString(), decision: reasons.length ? 'Refer' : 'Approved', connectors, reasons };
  }
  async runCheck(id: string, record: LoanRecord): Promise<LoanConnectorResult> {
    this.restore(); const connector = this.find(id); if (!connector) { throw new Error('Select a connector.'); }
    if (!record?.assessments?.length) { throw new Error('Select a saved application before running a check.'); }
    const assessment = latestAssessment(record); const at = new Date().toISOString(); const started = Date.now();
    const base = { connectorId: id, applicationId: record.id, assessmentVersion: assessment.version, checkedAt: at };
    if (connector.status === 'Paused') {
      const result: LoanConnectorResult = { ...base, tone: 'bad', title: 'Check blocked — connector paused', lines: ['Resume this connector before previewing its response. No check was counted.'] };
      const s = this.read(); this.event(s, connector, 'Check blocked', record.id, result.title, assessment.version); this.commit(s); return result;
    }
    await new Promise<void>(resolve => setTimeout(resolve, 180));
    const state = this.read(); if (state.status[id] !== connector.status) { throw new Error('Connector state changed while checking. Retry using its current status.'); }
    const result: LoanConnectorResult = connector.status === 'Degraded' ? { ...base, tone: 'wait' as const, title: 'Slow connector — review required', lines: ['This example shows a degraded API response. No fresh verification is asserted.', 'Pause and resume this connector to preview normal delivery.'] }
      : { ...base, ...this.readSnapshot(id, record) };
    const elapsed = Date.now() - started;
    result.trace = loanApiPreview(id, record, elapsed, connector.status === 'Degraded');
    const c = state.calls[id] || { total: 0, delivered: 0 }; c.total++; if (connector.status === 'Live') { c.delivered++; } state.calls[id] = c;
    this.event(state, connector, 'Check', record.id, result.title, assessment.version); this.commit(state);
    this.previewTimes[id] = elapsed; return result;
  }
  private readSnapshot(id: string, record: LoanRecord): Pick<LoanConnectorResult, 'tone' | 'title' | 'lines'> {
    const a = latestAssessment(record), input = a.input, facts = a.eligibility?.customer;
    const money = (n: number): string => 'KSh ' + new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(n);
    if (id === 'core') { return { tone: a.affordability.dti <= a.policy.maxDti ? 'ok' : 'wait', title: 'Account and exposure snapshot', lines: ['Income ' + money(input.income) + '; existing monthly obligations ' + money(input.obligations) + '.', 'Requested debt service ' + (a.affordability.dti * 100).toFixed(1) + '%; policy cap ' + (a.policy.maxDti * 100).toFixed(0) + '%.', 'Monthly repayment headroom ' + money(a.affordability.headroom) + '.'] }; }
    if (id === 'bureau') { return { tone: facts?.crbDefaulter || facts?.crbBlacklisted ? 'bad' : !facts || facts.crbDefaulter === null || facts.crbBlacklisted === null || input.bureau === 'Thin file' ? 'wait' : 'ok', title: 'Bureau snapshot: ' + input.bureau, lines: ['Defaulter listing: ' + this.flag(facts?.crbDefaulter) + '; blacklist: ' + this.flag(facts?.crbBlacklisted) + '.', 'Active loans ' + (facts?.activeLoans ?? 'unknown') + '; lenders ' + (facts?.activeLenders ?? 'unknown') + '.', 'Uses saved assessment v' + a.version + '; no fresh external bureau pull has occurred.'] }; }
    if (id === 'identity') { const good = facts?.nationalIdVerified === true && facts.kycCompleted === true; return { tone: good ? 'ok' : 'wait', title: good ? 'ID and KYC confirmed on this snapshot' : 'Identity evidence needs review', lines: ['Customer ' + input.applicant + ' · ' + input.nationalId + '.', 'ID verified: ' + this.flag(facts?.nationalIdVerified) + '; KYC complete: ' + this.flag(facts?.kycCompleted) + '.', 'These are saved demonstration facts, not a national identity service response.'] }; }
    if (id === 'collections') { return { tone: facts?.previousInstitutionDefault === true ? 'bad' : facts?.previousInstitutionDefault === false ? 'ok' : 'wait', title: 'Internal repayment standing', lines: ['Previous default with this institution: ' + this.flag(facts?.previousInstitutionDefault) + '.', 'Detailed instalment history is not available on this file.'] }; }
    if (id === 'payout') { const ready = record.status === 'Approved' && !!record.approvedAmount && facts?.nationalIdVerified === true && facts.kycCompleted === true && facts.crbDefaulter === false && facts.crbBlacklisted === false && !this.availability().reasons.length;
      return { tone: ready ? 'ok' : 'wait', title: ready ? 'Officer approval ready for further payout checks' : 'Not ready for payout review', lines: ['Officer status: ' + record.status + '.', record.approvedAmount ? 'Approved principal ' + money(record.approvedAmount) + '.' : 'No saved officer-approved amount.', 'Readiness preview only. Compliance/freshness checks and customer acceptance are still required; no funds are transferred.'] }; }
    if (id === 'screening') { return { tone: 'wait', title: 'Verified screening evidence not available', lines: ['No sanctions or PEP screening result is attached to this assessment.', 'A credit bureau category does not establish a sanctions or PEP match.', 'Use an approved screening source and officer review before payout.'] }; }
    if (id === 'notices') { return { tone: 'ok', title: 'Customer notice preview', lines: ['Recipient on file: ' + input.phone + '.', record.status === 'More information required' ? 'Additional supporting information is required for your loan application.' : 'Your application is ' + record.status.toLowerCase() + '.', 'Preview only. No SMS has been sent.'] }; }
    return { tone: 'ok', title: 'Origination snapshot', lines: [input.applicant + ' · ' + input.product + '.', money(input.amount) + ' over ' + input.tenorMonths + ' months · ' + input.channel + '.', input.branch + ', ' + input.country + '.'] };
  }
  private flag(v: boolean | null | undefined): string { return v === true ? 'Yes' : v === false ? 'No' : 'Unknown'; }
}
