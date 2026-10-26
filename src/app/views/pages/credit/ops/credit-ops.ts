import { AuditEvent, CreditApplication, PolicySettings } from '../credit-demo.data';

export type AlertSignal =
  | 'Manual review'
  | 'Missing information'
  | 'Policy exception'
  | 'SLA breach'
  | 'Material exposure'
  | 'Limit reduction';

export type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export const ALERT_SIGNALS: AlertSignal[] = [
  'Manual review',
  'Missing information',
  'Policy exception',
  'SLA breach',
  'Material exposure',
  'Limit reduction'
];

export interface OpsCase {
  app: CreditApplication;
  ageMs: number;
  ageLabel: string;
  slaHours: number;
  slaRatio: number;
  breached: boolean;
  priority: CasePriority;
  signals: AlertSignal[];
  affordability: number;
}

export interface AlertRow {
  key: string;
  signal: AlertSignal;
  item: OpsCase;
}

export function slaHoursFor(app: CreditApplication, policy?: PolicySettings): number {
  if (app.risk === 'High') return policy?.highRiskSla || 12;
  if (app.product === 'Salary Advance') return policy?.salaryAdvanceSla || 8;
  return policy?.standardSla || 24;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function buildOpsCase(app: CreditApplication, policy: PolicySettings, now = Date.now()): OpsCase {
  const submitted = new Date(app.submittedAt).getTime();
  const ageMs = Number.isNaN(submitted) ? 0 : Math.max(0, now - submitted);
  const slaHours = slaHoursFor(app, policy);
  const slaRatio = slaHours > 0 ? ageMs / (slaHours * 3600000) : 0;
  const open = app.decision === 'Refer' && app.caseStatus !== 'Closed';
  const breached = open && slaRatio >= 1;
  const policyHit = app.dti > policy.maxDti || app.amount > policy.maxAmount || app.bureau === 'Adverse' || app.score < policy.declineBelow;
  const thin = app.bureau === 'Thin file';
  const signals: AlertSignal[] = [];

  if (open) signals.push('Manual review');
  if (app.caseStatus === 'Awaiting information' || app.reasonCodes.some(reason => /document|income|not attached|salary|missing/i.test(reason))) {
    signals.push('Missing information');
  }
  if (policyHit || (thin && app.decision === 'Refer')) signals.push('Policy exception');
  if (breached) signals.push('SLA breach');
  if (app.amount >= 1500000 || app.amount > policy.maxAmount) signals.push('Material exposure');
  const behaviour = explainBehaviour(app);
  if (behaviour.steps.length && behaviour.standingLimit < behaviour.openingLimit) signals.push('Limit reduction');

  let priority: CasePriority = 'Low';
  if (!open) {
    if (app.decision === 'Declined' || app.risk === 'High') priority = 'High';
    else if (app.risk === 'Medium') priority = 'Medium';
  } else if (app.amount >= 2000000 || app.risk === 'High' || (slaRatio >= 2 && policyHit)) {
    priority = 'Critical';
  } else if (policyHit || thin || app.caseStatus === 'Awaiting information' || app.caseStatus === 'Escalated') {
    priority = 'High';
  } else {
    priority = 'Medium';
  }

  return {
    app,
    ageMs,
    ageLabel: formatDuration(ageMs),
    slaHours,
    slaRatio,
    breached,
    priority,
    signals,
    affordability: Math.round(app.dti * 100)
  };
}

export function toAlertRows(item: OpsCase): AlertRow[] {
  if (item.app.caseStatus === 'Closed' || item.app.decision !== 'Refer') return [];
  const signals = item.signals.length ? item.signals : ['Manual review' as AlertSignal];
  return signals.map(signal => ({ key: `${item.app.id}|${signal}`, signal, item }));
}

export function statusLabel(status: string): string {
  if (status === 'New') return 'Open';
  if (status === 'Closed') return 'Resolved';
  return status;
}

export function statusTone(status: string): string {
  if (status === 'In review') return 'review';
  if (status === 'Awaiting information') return 'wait';
  if (status === 'Escalated') return 'escalated';
  if (status === 'Closed') return 'resolved';
  return 'open';
}

export function priorityTone(priority: string): string {
  return priority.toLowerCase();
}

export function riskTone(risk: string): string {
  if (risk === 'Low') return 'low';
  if (risk === 'High') return 'high';
  return 'mid';
}

export function slaTone(item: OpsCase): string {
  if (item.breached) return 'bad';
  if (item.slaRatio >= 0.75 && item.app.caseStatus !== 'Closed') return 'warn';
  return 'ok';
}

export function barWidth(item: OpsCase): number {
  return Math.max(8, Math.min(100, Math.round(item.slaRatio * 100)));
}

export function needsOverrideNote(app: CreditApplication, policy: PolicySettings): boolean {
  return app.score < policy.approveFrom || app.dti > policy.maxDti || app.amount > policy.maxAmount || app.bureau !== 'Clean';
}

export function opsNarrative(item: OpsCase, signal?: AlertSignal): string {
  const app = item.app;
  if (signal === 'Material exposure' || (!signal && app.amount >= 2000000)) {
    return 'Escalate to the credit committee. A single officer cannot close this exposure.';
  }
  if (signal === 'SLA breach' || (!signal && item.breached)) {
    const multiple = item.slaRatio >= 2 ? 'more than double the target' : 'past the target';
    return `Decision SLA is ${multiple}. Open for ${item.ageLabel} against a ${item.slaHours} hour target for ${app.product}.`;
  }
  if (signal === 'Missing information' || app.caseStatus === 'Awaiting information') {
    return 'The file is waiting on the applicant. Chase the missing document before the SLA lapses.';
  }
  if (app.bureau === 'Thin file') {
    return 'The bureau file is too thin to auto-decide. Confirm income another way.';
  }
  if (app.dti > 0.45) {
    return 'Debt service sits outside the affordability cap. Confirm income before you decide.';
  }
  if (signal === 'Limit reduction') {
    return explainBehaviour(app).summary;
  }
  if (app.score < 580) {
    return 'The score is on the decline side of policy. Record why if you override it.';
  }
  return app.reasonCodes[0] || 'Held for an analyst decision.';
}

export function chartScale(values: number[]): { max: number; ticks: number[] } {
  const peak = Math.max(0, ...values);
  let max = 4;
  if (peak > 4) {
    const pow = Math.pow(10, Math.floor(Math.log10(peak)));
    const step = pow >= 10 ? pow / 2 : 2;
    max = Math.ceil(peak / step) * step;
  }
  return { max, ticks: [1, 0.75, 0.5, 0.25, 0].map(part => Math.round(max * part)) };
}

export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>): void {
  const lines = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function eventAppId(detail: string): string {
  const match = detail.match(/APP-\d+/);
  return match ? match[0] : '';
}

export type CycleOutcome = 'On time' | 'Late' | 'Default';

export interface BehaviourStep {
  when: string;
  outcome: CycleOutcome;
  scoreBefore: number;
  scoreAfter: number;
  limitBefore: number;
  limitAfter: number;
  reason: string;
}

export interface BehaviourFactor {
  label: string;
  impact: number;
}

export interface BehaviourStanding {
  openingScore: number;
  standingScore: number;
  scoreDelta: number;
  openingLimit: number;
  standingLimit: number;
  limitDelta: number;
  onTime: number;
  late: number;
  defaults: number;
  streak: number;
  direction: 'Raised' | 'Cut' | 'Unchanged';
  summary: string;
  factors: BehaviourFactor[];
  steps: BehaviourStep[];
}

export const BEHAVIOUR_RULES: Array<{ name: string; effect: string }> = [
  { name: 'On-time payment', effect: 'Score +4. The limit grows by 3%.' },
  { name: 'Consistency step', effect: 'Every third on-time payment in a row adds another +6 and grows the limit by a further 4%.' },
  { name: 'Late payment', effect: 'Score -6. The limit shrinks by 4%, and the on-time streak starts again.' },
  { name: 'Default', effect: 'Score -28. The limit shrinks by 18%, and the on-time streak starts again.' }
];

const REPAYMENT: Record<string, { limit: number; cycles: CycleOutcome[] }> = {
  'APP-10482': { limit: 400000, cycles: ['On time', 'On time', 'On time', 'On time', 'On time', 'On time'] },
  'APP-10479': { limit: 1800000, cycles: ['On time', 'Late', 'On time', 'Default', 'Late'] },
  'APP-10477': { limit: 200000, cycles: ['On time', 'On time', 'On time', 'On time', 'On time'] },
  'APP-10474': { limit: 150000, cycles: ['On time', 'On time', 'On time', 'On time'] },
  'APP-10471': { limit: 80000, cycles: ['Late', 'Late', 'On time'] },
  'APP-10468': { limit: 900000, cycles: ['Default', 'Late', 'Default'] },
  'APP-10466': { limit: 500000, cycles: ['On time', 'On time', 'On time', 'On time', 'On time', 'On time'] },
  'APP-10463': { limit: 70000, cycles: ['On time', 'On time'] },
  'APP-10460': { limit: 300000, cycles: ['On time', 'Late', 'On time', 'On time', 'On time'] },
  'APP-10457': { limit: 450000, cycles: ['Default', 'Late', 'Default'] },
  'APP-10454': { limit: 150000, cycles: ['On time', 'On time', 'On time', 'On time'] },
  'APP-10451': { limit: 280000, cycles: ['On time', 'On time', 'On time', 'Late'] },
  'APP-10448': { limit: 60000, cycles: ['Default', 'Late'] },
  'APP-10444': { limit: 1500000, cycles: ['On time', 'On time', 'Late', 'Default', 'Default'] }
};

export function explainBehaviour(app: CreditApplication): BehaviourStanding {
  const known = REPAYMENT[app.id];
  const openingLimit = known ? known.limit : roundThousands(Math.max(50000, Math.min(app.amount, app.income || app.amount)));
  const cycles = [...(known ? known.cycles : []), ...(app.extraCycles || [])];
  const openingScore = app.score;
  const floor = roundThousands(openingLimit * 0.25);
  const ceiling = roundThousands(openingLimit * 2);
  let score = openingScore;
  let limit = openingLimit;
  let streak = 0;
  let onTimePoints = 0;
  let consistencyPoints = 0;
  let latePoints = 0;
  let defaultPoints = 0;
  const steps: BehaviourStep[] = cycles.map((outcome, index) => {
    const scoreBefore = score;
    const limitBefore = limit;
    let scoreDelta = 0;
    let limitFactor = 1;
    let reason = '';
    if (outcome === 'On time') {
      streak += 1;
      scoreDelta = 4;
      limitFactor = 1.03;
      const consistency = streak % 3 === 0;
      if (consistency) {
        scoreDelta += 6;
        limitFactor *= 1.04;
        reason = `Paid on time, ${streak} in a row. Score +4, plus +6 because this is a consistency step. Limit +3%, then another +4%.`;
      } else {
        reason = 'Paid on time. Score +4. Limit +3%.';
      }
      const nextScore = clampScore(score + scoreDelta);
      const applied = nextScore - score;
      const bonus = consistency ? Math.max(0, applied - 4) : 0;
      onTimePoints += applied - bonus;
      consistencyPoints += bonus;
      score = nextScore;
    } else if (outcome === 'Late') {
      streak = 0;
      scoreDelta = -6;
      limitFactor = 0.96;
      reason = 'Paid late. Score -6. Limit -4%. The on-time streak started again.';
      score = clampScore(score + scoreDelta);
      latePoints += score - scoreBefore;
    } else {
      streak = 0;
      scoreDelta = -28;
      limitFactor = 0.82;
      reason = 'Defaulted. Score -28. Limit -18%. The on-time streak started again.';
      score = clampScore(score + scoreDelta);
      defaultPoints += score - scoreBefore;
    }
    const unclamped = roundThousands(limit * limitFactor);
    limit = Math.min(ceiling, Math.max(floor, unclamped));
    if (score === scoreBefore && scoreDelta !== 0) reason += ' The score stayed at the edge of the 300–900 scale.';
    if (limit === limitBefore) reason += ' The limit stayed at its floor or ceiling.';
    return {
      when: cycleMonth(index, cycles.length),
      outcome,
      scoreBefore,
      scoreAfter: score,
      limitBefore,
      limitAfter: limit,
      reason
    };
  });

  const factors: BehaviourFactor[] = [
    { label: 'On-time payments', impact: onTimePoints },
    { label: 'Consistency streak', impact: consistencyPoints },
    { label: 'Late payments', impact: latePoints },
    { label: 'Defaults', impact: defaultPoints }
  ].filter(factor => factor.impact !== 0);

  const scoreDelta = score - openingScore;
  const limitDelta = limit - openingLimit;
  const direction: BehaviourStanding['direction'] = limitDelta > 0 ? 'Raised' : limitDelta < 0 ? 'Cut' : 'Unchanged';
  const onTime = cycles.filter(item => item === 'On time').length;
  const late = cycles.filter(item => item === 'Late').length;
  const defaults = cycles.filter(item => item === 'Default').length;
  const summary = behaviourSummary(app, openingScore, score, openingLimit, limit, onTime, late, defaults, cycles.length);

  return {
    openingScore,
    standingScore: score,
    scoreDelta,
    openingLimit,
    standingLimit: limit,
    limitDelta,
    onTime,
    late,
    defaults,
    streak,
    direction,
    summary,
    factors,
    steps
  };
}

export function limitEvents(apps: CreditApplication[]): AuditEvent[] {
  const events: AuditEvent[] = [];
  apps.forEach((app, index) => {
    const standing = explainBehaviour(app);
    if (!standing.steps.length || standing.direction === 'Unchanged') return;
    const latest = standing.steps[standing.steps.length - 1];
    events.push({
      id: `AUD-L-${app.id}`,
      time: `2026-10-23T07:${String(index).padStart(2, '0')}:00`,
      actor: 'Scorecard v3.2',
      action: standing.direction === 'Cut' ? 'Limit reduced' : 'Limit raised',
      detail: `${app.id} · ${app.applicant}. ${standing.summary} Last cycle ${latest.when}: ${latest.outcome}.`,
      decision: app.decision
    });
  });
  return events;
}

function behaviourSummary(
  app: CreditApplication,
  openingScore: number,
  standingScore: number,
  openingLimit: number,
  standingLimit: number,
  onTime: number,
  late: number,
  defaults: number,
  cycles: number
): string {
  if (!cycles) {
    return `No repayment cycle yet, so the score stays at the origination score of ${openingScore} and the limit stays at ${ksh(openingLimit)}.`;
  }
  const scoreWay = standingScore === openingScore ? 'unchanged from' : standingScore > openingScore ? `up ${standingScore - openingScore} from` : `down ${openingScore - standingScore} from`;
  const limitWay = standingLimit === openingLimit ? 'is unchanged at' : standingLimit > openingLimit ? `rose from ${ksh(openingLimit)} to` : `fell from ${ksh(openingLimit)} to`;
  const payments = `${countWord(onTime, 'on-time payment')}, ${countWord(late, 'late payment')}, and ${countWord(defaults, 'default')}`;
  let text = `Standing score is ${standingScore}, ${scoreWay} the origination score of ${openingScore}. The limit ${limitWay} ${ksh(standingLimit)}. ${payments} produced that move. The case decision still uses the origination score.`;
  if (standingScore < 580 && openingScore >= 580) {
    text += ' Repayment has carried the standing score under the 580 decline line.';
  }
  if (standingScore >= 700 && openingScore < 700) {
    text += ' Repayment has carried the standing score over the 700 approve line.';
  }
  if (app.amount > standingLimit) {
    text += ` This request of ${ksh(app.amount)} is above the standing limit.`;
  }
  return text;
}

function countWord(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : singular + 's'}`;
}

function cycleMonth(index: number, total: number): string {
  const date = new Date(Date.UTC(2026, 9 - (total - 1 - index), 1));
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function roundThousands(value: number): number {
  return Math.round(value / 1000) * 1000;
}

function clampScore(value: number): number {
  return Math.max(300, Math.min(900, value));
}

function ksh(value: number): string {
  return 'KSh ' + Math.round(value).toLocaleString('en-KE');
}
