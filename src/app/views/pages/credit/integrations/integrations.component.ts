import { Component } from '@angular/core';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { explainBehaviour } from '../ops/credit-ops';

type ConnectorStatus = 'Live' | 'Degraded' | 'Paused';

interface Connector {
  id: string;
  name: string;
  system: string;
  purpose: string;
  usedBy: string;
  status: ConnectorStatus;
  latencyMs: number;
  success: number;
  callsToday: number;
  owner: string;
}

interface CheckResult {
  tone: 'ok' | 'bad' | 'wait';
  title: string;
  lines: string[];
}

@Component({
  selector: 'app-integrations',
  templateUrl: './integrations.component.html'
})
export class IntegrationsComponent {
  connectors: Connector[] = [
    { id: 'core', name: 'Core banking', system: 'Finacle', purpose: 'Existing exposure, arrears, and whether the account can take more credit.', usedBy: 'Affordability and the standing limit', status: 'Live', latencyMs: 240, success: 99.2, callsToday: 186, owner: 'Core systems' },
    { id: 'bureau', name: 'Credit bureau', system: 'CRC / FirstCentral', purpose: 'Bureau score, delinquency, enquiries, and a thin-file flag.', usedBy: 'Scorecard and the adverse-bureau rule', status: 'Degraded', latencyMs: 1800, success: 94.1, callsToday: 142, owner: 'Risk data' },
    { id: 'identity', name: 'National identity', system: 'NIN', purpose: 'Confirms the person is who the application says, before money moves.', usedBy: 'Disbursement hold', status: 'Live', latencyMs: 410, success: 98.4, callsToday: 121, owner: 'Fraud & KYC' },
    { id: 'origination', name: 'Origination channels', system: 'USSD, app, agent', purpose: 'Brings the application in and keeps the channel on the file.', usedBy: 'New application', status: 'Live', latencyMs: 180, success: 99.6, callsToday: 96, owner: 'Channels' },
    { id: 'collections', name: 'Collections ledger', system: 'Loan servicing', purpose: 'On-time, late, and defaulted instalments that move the standing score.', usedBy: 'Standing score and limit', status: 'Live', latencyMs: 320, success: 99.1, callsToday: 74, owner: 'Collections' },
    { id: 'payout', name: 'Disbursement', system: 'Mobile money / bank', purpose: 'Pays an approved loan only after identity and bureau are fresh.', usedBy: 'Payout', status: 'Paused', latencyMs: 0, success: 0, callsToday: 0, owner: 'Operations' },
    { id: 'screening', name: 'Sanctions and PEP', system: 'Watchlist', purpose: 'Stops a payout when the name matches a sanctions or politically exposed list.', usedBy: 'Approve', status: 'Live', latencyMs: 260, success: 99.8, callsToday: 121, owner: 'Compliance' },
    { id: 'notices', name: 'Customer notices', system: 'SMS', purpose: 'Tells the customer the decision, a missing document, or a repayment due.', usedBy: 'Alerts and collections', status: 'Live', latencyMs: 140, success: 97.5, callsToday: 210, owner: 'Customer care' }
  ];

  selectedId = 'bureau';
  applicantId = '';
  result: CheckResult | null = null;
  banner = '';

  constructor(public credit: CreditDataService) {
    this.applicantId = this.credit.applications[0]?.id || '';
  }

  get selected(): Connector | undefined {
    return this.connectors.find(item => item.id === this.selectedId);
  }

  get applicants(): CreditApplication[] {
    return this.credit.applications;
  }

  count(status: ConnectorStatus): number {
    return this.connectors.filter(item => item.status === status).length;
  }

  get callsToday(): number {
    return this.connectors.reduce((sum, item) => sum + item.callsToday, 0);
  }

  tone(status: ConnectorStatus): string {
    if (status === 'Live') return 'ok';
    if (status === 'Paused') return 'bad';
    return 'wait';
  }

  select(item: Connector): void {
    this.selectedId = item.id;
    this.result = null;
    this.banner = '';
  }

  toggle(item: Connector): void {
    item.status = item.status === 'Paused' ? 'Live' : 'Paused';
    if (item.status === 'Live' && !item.latencyMs) item.latencyMs = 300;
    const verb = item.status === 'Paused' ? 'paused' : 'resumed';
    this.banner = `${item.name} ${verb}. New decisions will ${item.status === 'Paused' ? 'not' : ''} use it.`;
    this.credit.recordControl(
      item.status === 'Paused' ? 'Connector paused' : 'Connector resumed',
      `${item.name} (${item.system}). ${item.purpose}`,
      'Policy'
    );
    this.result = null;
  }

  runCheck(): void {
    const connector = this.selected;
    const app = this.credit.find(this.applicantId);
    if (!connector || !app) return;
    if (connector.status === 'Paused') {
      this.result = {
        tone: 'bad',
        title: 'Check blocked',
        lines: [`${connector.name} is paused. Resume it before a decision can depend on it.`]
      };
      return;
    }
    connector.callsToday += 1;
    this.result = this.readConnector(connector, app);
    this.banner = `${connector.name} checked ${app.applicant}. The result is on this screen and on the audit trail.`;
    this.credit.recordControl(
      connector.id === 'bureau' ? 'Bureau pull' : connector.id === 'identity' ? 'Identity check' : 'Connector check',
      `${app.id} · ${app.applicant}. ${connector.name}. ${this.result.title}`,
      app.decision
    );
  }

  private readConnector(connector: Connector, app: CreditApplication): CheckResult {
    const policy = this.credit.policy;
    const ageDays = Math.max(0, Math.round((Date.now() - new Date(app.submittedAt).getTime()) / 86400000));
    const stale = ageDays > policy.bureauMaxAgeDays;
    if (connector.id === 'core') {
      const room = app.income - app.obligations;
      return {
        tone: app.dti > policy.maxDti ? 'bad' : 'ok',
        title: app.dti > policy.maxDti ? 'Exposure is outside affordability' : 'Account can be considered',
        lines: [
          `Obligations ${this.credit.money(app.obligations)} against income ${this.credit.money(app.income)}.`,
          `Debt service ${Math.round(app.dti * 100)}%. Policy cap ${Math.round(policy.maxDti * 100)}%.`,
          `Spare monthly capacity is about ${this.credit.money(Math.max(0, room))}.`
        ]
      };
    }
    if (connector.id === 'bureau') {
      return {
        tone: stale || app.bureau === 'Adverse' ? 'bad' : app.bureau === 'Thin file' ? 'wait' : 'ok',
        title: stale ? 'Bureau file is stale' : `Bureau is ${app.bureau.toLowerCase()}`,
        lines: [
          stale
            ? `Last file is ${ageDays} days old. Policy allows ${policy.bureauMaxAgeDays}. Pull a fresh report before auto-approval.`
            : `File is ${ageDays} days old, inside the ${policy.bureauMaxAgeDays}-day freshness window.`,
          `Origination score on this file is ${app.score}.`,
          connector.status === 'Degraded' ? 'The bureau is slow today. A referral is safer than waiting on a timeout.' : 'Response time is inside the usual window.'
        ]
      };
    }
    if (connector.id === 'identity') {
      const matched = !!app.nationalId && app.nationalId.length >= 6;
      return {
        tone: matched ? 'ok' : 'bad',
        title: matched ? 'Identity matched' : 'Identity not confirmed',
        lines: [
          matched ? `National ID ${app.nationalId} is on the file for ${app.applicant}.` : 'No usable national ID. Do not disburse.',
          `Phone on the application: ${app.phone}.`,
          matched && app.decision === 'Approved' ? 'Payout may proceed once disbursement is live.' : 'Keep the payout on hold.'
        ]
      };
    }
    if (connector.id === 'collections') {
      const standing = explainBehaviour(app);
      return {
        tone: standing.defaults ? 'bad' : standing.late ? 'wait' : 'ok',
        title: standing.summary,
        lines: [
          `${standing.onTime} on time, ${standing.late} late, ${standing.defaults} default${standing.defaults === 1 ? '' : 's'}.`,
          `Standing score ${standing.standingScore} (${standing.scoreDelta > 0 ? '+' : ''}${standing.scoreDelta} from origination).`,
          `Limit ${this.credit.money(standing.standingLimit)}.`
        ]
      };
    }
    if (connector.id === 'payout') {
      const ready = app.decision === 'Approved';
      return {
        tone: ready ? 'ok' : 'wait',
        title: ready ? 'Ready to disburse' : 'Not ready to disburse',
        lines: [
          ready ? `${this.credit.money(app.amount)} can be sent on ${app.channel}.` : `Decision is ${app.decision}. Money does not move.`,
          `Tenor ${app.tenorMonths} months. Policy maximum is ${policy.maxTenorMonths}.`,
          app.tenorMonths > policy.maxTenorMonths ? 'Tenor is outside policy, so this stays a referral.' : 'Tenor is inside policy.'
        ]
      };
    }
    if (connector.id === 'screening') {
      const hit = app.bureau === 'Adverse';
      return {
        tone: hit ? 'bad' : 'ok',
        title: hit ? 'Do not pay. Review the name.' : 'No sanctions or PEP match',
        lines: [
          hit ? 'Adverse bureau plus a name review. Compliance must clear it.' : `${app.applicant} is clear on the demo watchlist.`,
          `Checked against the name and national ID ${app.nationalId}.`
        ]
      };
    }
    if (connector.id === 'notices') {
      return {
        tone: 'ok',
        title: 'Notice ready',
        lines: [
          `SMS to ${app.phone}.`,
          app.caseStatus === 'Awaiting information'
            ? 'Ask for the missing document before the SLA runs out.'
            : `Tell the customer the decision is ${app.decision}.`
        ]
      };
    }
    return {
      tone: 'ok',
      title: `Received on ${app.channel}`,
      lines: [
        `${app.product} for ${this.credit.money(app.amount)} from ${app.branch}, ${app.country}.`,
        `Submitted ${app.submittedAt.slice(0, 16).replace('T', ' ')}.`
      ]
    };
  }
}
