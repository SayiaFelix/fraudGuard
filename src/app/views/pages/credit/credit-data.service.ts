import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ANALYSTS,
  APPLICATIONS,
  AUDIT_EVENTS,
  AuditEvent,
  BookRow,
  COUNTRIES,
  CreditApplication,
  CreditDecision,
  DECISION_RULES,
  DEFAULT_POLICY,
  DecisionRule,
  PolicySettings,
  PORTFOLIO_SUMMARY,
  PortfolioSummary,
  PRODUCTS,
  RiskBand,
  ScoreFactor
} from './credit-demo.data';
import { BehaviourStanding, explainBehaviour } from './ops/credit-ops';

export interface ApplicationDraft {
  applicant: string;
  phone: string;
  nationalId: string;
  country: string;
  branch: string;
  product: string;
  amount: number;
  tenorMonths: number;
  income: number;
  obligations: number;
  employment: string;
  bureau: string;
  channel: string;
}

export interface ScorePreview {
  score: number;
  dti: number;
  decision: CreditDecision;
  risk: RiskBand;
  reasons: string[];
  factors: ScoreFactor[];
}

export interface SimulationBucket {
  approved: number;
  declined: number;
  referred: number;
}

export interface SimulationResult {
  current: SimulationBucket;
  next: SimulationBucket;
  changeCount: number;
  bookSize: number;
  changes: Array<BookRow & { from: CreditDecision; to: CreditDecision }>;
}

const NAMES = [
  'David Munya', 'Simon Kilonzo', 'Mary Mwende', 'Grace Gitau',
  'Peter Odhiambo', 'James Were', 'Kevin Owino', 'Faith Achieng',
  'Mercy Chebet', 'Samuel Omondi', 'Lucy Atieno', 'Ann Njeri'
];

@Injectable({ providedIn: 'root' })
export class CreditDataService {
  readonly products = PRODUCTS;
  readonly countries = COUNTRIES;
  readonly analysts = ANALYSTS;

  private applicationsSubject = new BehaviorSubject<CreditApplication[]>(clone(APPLICATIONS));
  private summarySubject = new BehaviorSubject<PortfolioSummary>(clone(PORTFOLIO_SUMMARY));
  private rulesSubject = new BehaviorSubject<DecisionRule[]>(clone(DECISION_RULES));
  private auditSubject = new BehaviorSubject<AuditEvent[]>(clone(AUDIT_EVENTS));
  private policySubject = new BehaviorSubject<PolicySettings>(this.readPolicy());
  private book = this.buildBook();

  applications$ = this.applicationsSubject.asObservable();
  summary$ = this.summarySubject.asObservable();
  rules$ = this.rulesSubject.asObservable();
  audit$ = this.auditSubject.asObservable();
  policy$ = this.policySubject.asObservable();

  get applications(): CreditApplication[] {
    return this.applicationsSubject.value;
  }

  get summary(): PortfolioSummary {
    return this.summarySubject.value;
  }

  get rules(): DecisionRule[] {
    return this.rulesSubject.value;
  }

  get policy(): PolicySettings {
    return this.policySubject.value;
  }

  money(value: number): string {
    return 'KSh ' + Math.round(value || 0).toLocaleString('en-KE');
  }

  pct(part: number, total: number): string {
    if (!total) {
      return '0%';
    }
    return Math.round((part / total) * 100) + '%';
  }

  riskClass(risk: string): string {
    if (risk === 'Low') return 'is-low';
    if (risk === 'High') return 'is-high';
    return 'is-mid';
  }

  decisionClass(decision: string): string {
    if (decision === 'Approved') return 'is-ok';
    if (decision === 'Declined') return 'is-bad';
    return 'is-wait';
  }

  find(id: string): CreditApplication | undefined {
    return this.applications.find(item => item.id === id);
  }

  scoreDraft(input: ApplicationDraft): ScorePreview {
    const policy = this.policy;
    const tenor = Math.max(1, Number(input.tenorMonths) || 1);
    const amount = Number(input.amount) || 0;
    const income = Number(input.income) || 0;
    const obligations = Number(input.obligations) || 0;
    const installment = amount / tenor;
    const dti = income > 0 ? (obligations + installment) / income : 1;

    let incomeImpact = -20;
    if (income >= 800000) incomeImpact = 90;
    else if (income >= 400000) incomeImpact = 60;
    else if (income >= 150000) incomeImpact = 30;

    const employmentImpact = input.employment === 'Salaried' ? 45 : input.employment === 'Business owner' ? 15 : 5;
    const bureauImpact = input.bureau === 'Clean' ? 70 : input.bureau === 'Thin file' ? 5 : -90;
    const dtiImpact = -Math.round(Math.min(dti, 1.2) * 80);
    const amountImpact = amount > policy.maxAmount ? -25 : 8;
    const tenorImpact = tenor > 36 ? -15 : 0;

    const score = clamp(Math.round(500 + incomeImpact + employmentImpact + bureauImpact + dtiImpact + amountImpact + tenorImpact), 300, 900);
    const factors: ScoreFactor[] = [
      { label: 'Income stability', impact: incomeImpact },
      { label: 'Employment', impact: employmentImpact },
      { label: 'Bureau record', impact: bureauImpact },
      { label: 'Debt service', impact: dtiImpact },
      { label: 'Requested amount', impact: amountImpact }
    ];

    const decision = this.decide({
      score,
      dti,
      amount,
      bureau: input.bureau,
      tenor,
      product: input.product
    }, policy);

    const reasons = this.reasonsFor({
      score,
      dti,
      amount,
      bureau: input.bureau,
      tenor,
      product: input.product
    }, policy, decision);

    return {
      score,
      dti,
      decision,
      risk: this.risk(score),
      reasons,
      factors
    };
  }

  submitApplication(input: ApplicationDraft): CreditApplication {
    const preview = this.scoreDraft(input);
    const created: CreditApplication = {
      id: 'APP-' + Date.now().toString().slice(-5),
      applicant: input.applicant.trim(),
      product: input.product,
      amount: Number(input.amount),
      score: preview.score,
      risk: preview.risk,
      decision: preview.decision,
      caseStatus: preview.decision === 'Refer' ? 'New' : 'Closed',
      channel: input.channel,
      country: input.country,
      branch: input.branch || input.country,
      submittedAt: new Date().toISOString(),
      reasonCodes: preview.reasons,
      assignedTo: preview.decision === 'Refer' ? 'Unassigned' : 'Demo User',
      notes: [{
        author: 'Scorecard v3.2',
        text: `Scored ${preview.score} and marked ${preview.decision.toLowerCase()} in the demo workspace.`,
        time: 'Just now'
      }],
      phone: input.phone,
      nationalId: input.nationalId,
      income: Number(input.income),
      obligations: Number(input.obligations) || 0,
      tenorMonths: Number(input.tenorMonths),
      dti: preview.dti,
      employment: input.employment,
      bureau: input.bureau,
      factors: preview.factors
    };

    this.applicationsSubject.next([created, ...this.applications]);
    const summary = { ...this.summary };
    summary.total += 1;
    summary.openApplications += 1;
    if (created.decision === 'Approved') summary.approved += 1;
    else if (created.decision === 'Declined') summary.declined += 1;
    else summary.referred += 1;
    if (created.risk === 'Low') summary.lowRisk += 1;
    else if (created.risk === 'High') summary.highRisk += 1;
    else summary.mediumRisk += 1;
    this.summarySubject.next(summary);
    this.pushAudit(created, created.decision === 'Refer' ? 'Referred to queue' : `Application ${created.decision.toLowerCase()}`);
    return created;
  }

  applyCaseAction(
    id: string,
    action: 'approve' | 'decline' | 'request-info' | 'escalate' | 'assign' | 'note',
    extra?: { note?: string; assignee?: string }
  ): void {
    const apps = this.cloneApplications();
    const target = apps.find(item => item.id === id);
    if (!target) {
      return;
    }

    const note = (extra?.note || '').trim();
    if (action === 'note' && !note) {
      return;
    }
    if ((action === 'approve' || action === 'decline') && (target.decision !== 'Refer' || target.caseStatus === 'Closed')) {
      return;
    }

    if (action === 'approve') {
      target.decision = 'Approved';
      target.caseStatus = 'Closed';
      target.notes.unshift({ author: 'Demo User', text: note || 'Approved from alerts.', time: 'Just now' });
      this.shiftBook('Approved');
    } else if (action === 'decline') {
      target.decision = 'Declined';
      target.caseStatus = 'Closed';
      target.notes.unshift({ author: 'Demo User', text: note || 'Declined from alerts.', time: 'Just now' });
      this.shiftBook('Declined');
    } else if (action === 'request-info') {
      target.caseStatus = 'Awaiting information';
      target.notes.unshift({ author: 'Demo User', text: note || 'Requested additional information from the applicant.', time: 'Just now' });
    } else if (action === 'escalate') {
      target.caseStatus = 'Escalated';
      target.assignedTo = 'Credit committee';
      target.notes.unshift({ author: 'Demo User', text: note || 'Escalated to the credit committee.', time: 'Just now' });
    } else if (action === 'assign') {
      target.assignedTo = extra?.assignee || 'Demo User';
      if (target.caseStatus === 'New') {
        target.caseStatus = 'In review';
      }
      target.notes.unshift({ author: 'Demo User', text: `Assigned to ${target.assignedTo}.`, time: 'Just now' });
    } else {
      target.notes.unshift({ author: 'Demo User', text: note, time: 'Just now' });
    }

    this.applicationsSubject.next(apps);
    const labels: Record<string, string> = {
      approve: 'Application approved',
      decline: 'Application declined',
      'request-info': 'Information requested',
      escalate: 'Case escalated',
      assign: 'Case assigned',
      note: 'Case note added'
    };
    this.pushAudit(target, labels[action]);
  }

  recordActivity(id: string, outcome: 'On time' | 'Late' | 'Default'): BehaviourStanding | null {
    const apps = this.cloneApplications();
    const target = apps.find(item => item.id === id);
    if (!target) {
      return null;
    }
    target.extraCycles = [...(target.extraCycles || []), outcome];
    const before = explainBehaviour({ ...target, extraCycles: target.extraCycles.slice(0, -1) });
    const standing = explainBehaviour(target);
    const step = standing.standingScore - before.standingScore;
    const stepWay = step > 0 ? `up ${step}` : step < 0 ? `down ${Math.abs(step)}` : 'unchanged';
    const note = outcome === 'On time'
      ? `On-time repayment recorded. Standing score is ${standing.standingScore}.`
      : outcome === 'Late'
        ? `Late payment recorded. Standing score is ${standing.standingScore}.`
        : `Default recorded. Standing score is ${standing.standingScore}.`;
    target.notes.unshift({ author: 'Demo User', text: note, time: 'Just now' });
    this.applicationsSubject.next(apps);
    this.pushAudit(
      target,
      step < 0 ? 'Standing score reduced' : 'Standing score raised',
      `${target.id} · ${target.applicant}. ${outcome}. This cycle moved the score ${stepWay} to ${standing.standingScore}.`
    );
    return standing;
  }

  toggleRule(code: string): void {
    this.rulesSubject.next(this.rules.map(rule => rule.code === code ? { ...rule, enabled: !rule.enabled } : rule));
  }

  updatePolicy(policy: PolicySettings): void {
    const before = this.policy;
    const next = this.normalisePolicy(policy);
    this.policySubject.next(next);
    localStorage.setItem('eclectics-credit-policy', JSON.stringify(next));
    const changes = this.policyChanges(before, next);
    if (changes.length) {
      this.recordControl('Policy updated', changes.join('. ') + '.', 'Policy');
    }
  }

  recordControl(action: string, detail: string, decision = 'Policy'): void {
    this.auditSubject.next([
      {
        id: 'AUD-' + Date.now().toString().slice(-6),
        time: new Date().toISOString(),
        actor: 'Demo User',
        action,
        detail,
        decision
      },
      ...this.auditSubject.value
    ]);
  }

  simulate(draft: PolicySettings): SimulationResult {
    const current = this.tally(this.policy);
    const next = this.tally(draft);
    const changes: SimulationResult['changes'] = [];
    this.book.forEach(row => {
      const from = this.decide(row, this.policy);
      const to = this.decide(row, draft);
      if (from !== to) {
        changes.push({ ...row, from, to });
      }
    });
    return {
      current,
      next,
      changeCount: changes.length,
      bookSize: this.book.length,
      changes: changes.slice(0, 8)
    };
  }

  private shiftBook(decision: 'Approved' | 'Declined'): void {
    const summary = { ...this.summary };
    summary.referred = Math.max(0, summary.referred - 1);
    if (decision === 'Approved') summary.approved += 1;
    else summary.declined += 1;
    this.summarySubject.next(summary);
  }

  private cloneApplications(): CreditApplication[] {
    return this.applications.map(item => ({
      ...item,
      notes: [...item.notes],
      reasonCodes: [...item.reasonCodes],
      factors: [...item.factors],
      extraCycles: [...(item.extraCycles || [])]
    }));
  }

  private pushAudit(app: CreditApplication, action: string, detail?: string): void {
    this.auditSubject.next([
      {
        id: 'AUD-' + Date.now().toString().slice(-6),
        time: new Date().toISOString(),
        actor: 'Demo User',
        action,
        detail: detail || `${app.id} · ${app.applicant}`,
        decision: app.decision
      },
      ...this.auditSubject.value
    ]);
  }

  private tally(policy: PolicySettings): SimulationBucket {
    const bucket: SimulationBucket = { approved: 0, declined: 0, referred: 0 };
    this.book.forEach(row => {
      const decision = this.decide(row, policy);
      if (decision === 'Approved') bucket.approved += 1;
      else if (decision === 'Declined') bucket.declined += 1;
      else bucket.referred += 1;
    });
    return bucket;
  }

  private decide(
    row: { score: number; dti: number; amount: number; bureau: string; tenor: number; product: string },
    policy: PolicySettings
  ): CreditDecision {
    let decision: CreditDecision = row.score >= policy.approveFrom && row.dti <= policy.maxDti && row.amount <= policy.maxAmount
      ? 'Approved'
      : row.score < policy.declineBelow
        ? 'Declined'
        : 'Refer';
    if (policy.maxTenorMonths && row.tenor > policy.maxTenorMonths && decision === 'Approved') {
      decision = 'Refer';
    }

    this.rules.filter(rule => rule.enabled).forEach(rule => {
      const effect = this.ruleEffect(rule, row, policy);
      if (effect) {
        decision = stronger(decision, effect);
      }
    });
    return decision;
  }

  private ruleEffect(
    rule: DecisionRule,
    row: { score: number; dti: number; amount: number; bureau: string; tenor: number; product: string },
    policy: PolicySettings
  ): CreditDecision | null {
    switch (rule.code) {
      case 'CR-01':
        return row.score < policy.declineBelow ? 'Declined' : null;
      case 'CR-02':
        return row.dti > policy.maxDti ? 'Refer' : null;
      case 'CR-03':
        return row.amount > policy.maxAmount ? 'Refer' : null;
      case 'CR-04':
        return row.bureau === 'Thin file' ? 'Refer' : null;
      case 'CR-05':
        return row.bureau === 'Adverse' ? 'Declined' : null;
      case 'CR-06':
        return row.product === 'Salary Advance' && row.tenor > 1 ? 'Declined' : null;
      case 'CR-09':
        return row.score >= policy.approveFrom && row.dti <= policy.maxDti && row.bureau === 'Clean' && row.amount <= policy.maxAmount
          ? 'Approved'
          : null;
      default:
        return null;
    }
  }

  private reasonsFor(
    row: { score: number; dti: number; amount: number; bureau: string; tenor: number; product: string },
    policy: PolicySettings,
    decision: CreditDecision
  ): string[] {
    const reasons: string[] = [];
    this.rules.filter(rule => rule.enabled).forEach(rule => {
      if (this.ruleEffect(rule, row, policy)) {
        reasons.push(rule.name);
      }
    });
    if (policy.maxTenorMonths && row.tenor > policy.maxTenorMonths) {
      reasons.push(`Tenor longer than ${policy.maxTenorMonths} months`);
    }
    if (row.score < policy.approveFrom && row.score >= policy.declineBelow) {
      reasons.unshift('Score is below the auto-approval cutoff');
    }
    if (decision === 'Approved' && !reasons.length) {
      reasons.push('Score inside auto-approval band');
    }
    if (!reasons.length) {
      reasons.push('Held for analyst review');
    }
    return reasons;
  }

  private normalisePolicy(policy: PolicySettings): PolicySettings {
    const next: PolicySettings = {
      approveFrom: clamp(Math.round(Number(policy.approveFrom)), 500, 850),
      declineBelow: clamp(Math.round(Number(policy.declineBelow)), 400, 750),
      maxDti: Math.round(Number(policy.maxDti) * 100) / 100,
      maxAmount: Math.max(100000, Math.round(Number(policy.maxAmount))),
      maxTenorMonths: clamp(Math.round(Number(policy.maxTenorMonths) || DEFAULT_POLICY.maxTenorMonths), 1, 60),
      bureauMaxAgeDays: clamp(Math.round(Number(policy.bureauMaxAgeDays) || DEFAULT_POLICY.bureauMaxAgeDays), 1, 180),
      salaryAdvanceSla: clamp(Math.round(Number(policy.salaryAdvanceSla) || DEFAULT_POLICY.salaryAdvanceSla), 1, 72),
      highRiskSla: clamp(Math.round(Number(policy.highRiskSla) || DEFAULT_POLICY.highRiskSla), 1, 72),
      standardSla: clamp(Math.round(Number(policy.standardSla) || DEFAULT_POLICY.standardSla), 1, 96),
      makerChecker: policy.makerChecker !== false
    };
    if (next.declineBelow >= next.approveFrom) {
      next.declineBelow = next.approveFrom - 40;
    }
    return next;
  }

  private policyChanges(before: PolicySettings, next: PolicySettings): string[] {
    const lines: string[] = [];
    if (before.approveFrom !== next.approveFrom) lines.push(`Approve from ${before.approveFrom} to ${next.approveFrom}`);
    if (before.declineBelow !== next.declineBelow) lines.push(`Decline below ${before.declineBelow} to ${next.declineBelow}`);
    if (before.maxDti !== next.maxDti) lines.push(`Maximum DTI ${Math.round(before.maxDti * 100)}% to ${Math.round(next.maxDti * 100)}%`);
    if (before.maxAmount !== next.maxAmount) lines.push(`Auto-approval limit ${this.money(before.maxAmount)} to ${this.money(next.maxAmount)}`);
    if (before.maxTenorMonths !== next.maxTenorMonths) lines.push(`Maximum tenor ${before.maxTenorMonths} to ${next.maxTenorMonths} months`);
    if (before.bureauMaxAgeDays !== next.bureauMaxAgeDays) lines.push(`Bureau freshness ${before.bureauMaxAgeDays} to ${next.bureauMaxAgeDays} days`);
    if (before.salaryAdvanceSla !== next.salaryAdvanceSla || before.highRiskSla !== next.highRiskSla || before.standardSla !== next.standardSla) {
      lines.push(`SLA ${next.salaryAdvanceSla}h salary advance, ${next.highRiskSla}h high risk, ${next.standardSla}h standard`);
    }
    if (before.makerChecker !== next.makerChecker) lines.push(next.makerChecker ? 'Maker-checker turned on' : 'Maker-checker turned off');
    return lines;
  }

  private risk(score: number): RiskBand {
    if (score >= 700) return 'Low';
    if (score >= 580) return 'Medium';
    return 'High';
  }

  private readPolicy(): PolicySettings {
    try {
      const saved = localStorage.getItem('eclectics-credit-policy');
      if (!saved) return clone(DEFAULT_POLICY);
      const parsed = JSON.parse(saved);
      return this.normalisePolicy({ ...DEFAULT_POLICY, ...parsed });
    } catch {
      return clone(DEFAULT_POLICY);
    }
  }

  private buildBook(): BookRow[] {
    const random = mulberry32(20261023);
    const bureaus = ['Clean', 'Clean', 'Clean', 'Thin file', 'Adverse'];
    return Array.from({ length: 240 }, (_, index) => {
      const score = Math.round(420 + random() * 460);
      return {
        id: 'BK-' + String(index + 1).padStart(4, '0'),
        applicant: NAMES[index % NAMES.length],
        product: PRODUCTS[index % PRODUCTS.length],
        score,
        dti: Math.round((0.12 + random() * 0.55) * 100) / 100,
        amount: Math.round((80000 + random() * 3200000) / 1000) * 1000,
        bureau: bureaus[Math.floor(random() * bureaus.length)],
        tenor: [1, 6, 12, 18, 24, 36][Math.floor(random() * 6)]
      };
    });
  }
}

function stronger(current: CreditDecision, next: CreditDecision): CreditDecision {
  const rank = { Declined: 3, Refer: 2, Approved: 1 };
  return rank[next] > rank[current] ? next : current;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value |= 0;
    value = value + 0x6D2B79F5 | 0;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
