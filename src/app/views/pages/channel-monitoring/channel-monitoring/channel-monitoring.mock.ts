export interface ChannelKpi {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: string;
  color: string;
  description: string;
}

export interface ChannelHealth {
  name: string;
  code: string;
  status: 'Healthy' | 'Degraded' | 'Critical' | 'Maintenance';
  txnVolume: number;
  fraudRate: number;
  avgLatencyMs: number;
  uptime: number;
  blockedInPeriod: number;
  color: string;
  icon: string;
}

export interface MonitoredTransaction {
  id: string;
  time: string;
  channel: string;
  type: string;
  amount: number;
  customer: string;
  riskScore: number;
  fraudFlag: 'None' | 'Suspicious' | 'Blocked' | 'Under Review';
  ruleHit: string;
}

export interface ChannelSummary {
  channel: string;
  totalTxns: number;
  flagged: number;
  blocked: number;
  amountAtRisk: number;
  recoveryRate: number;
  topThreat: string;
}

export const CHANNEL_KPIS: ChannelKpi[] = [
  {
    label: 'Txns Monitored',
    value: '2.48M',
    change: '+6.3%',
    trend: 'up',
    icon: 'fa-exchange-alt',
    color: '#4361ee',
    description: 'last 24 hours'
  },
  {
    label: 'Fraud Alerts',
    value: '347',
    change: '+11.2%',
    trend: 'up',
    icon: 'fa-bell',
    color: '#f72585',
    description: 'across all channels'
  },
  {
    label: 'Blocked Value',
    value: 'KES 18.4M',
    change: '+4.8%',
    trend: 'up',
    icon: 'fa-ban',
    color: '#06d6a0',
    description: 'prevented loss today'
  },
  {
    label: 'Channel Health',
    value: '94.2%',
    change: '-1.1%',
    trend: 'down',
    icon: 'fa-heartbeat',
    color: '#4cc9f0',
    description: 'composite score'
  },
  {
    label: 'Peak Throughput',
    value: '4,820/min',
    change: '+2.4%',
    trend: 'up',
    icon: 'fa-tachometer-alt',
    color: '#fd7e14',
    description: 'at 12:45 EAT'
  },
  {
    label: 'False Positives',
    value: '2.8%',
    change: '-0.6%',
    trend: 'down',
    icon: 'fa-filter',
    color: '#7209b7',
    description: 'vs. yesterday'
  }
];

export const CHANNEL_HEALTH: ChannelHealth[] = [
  {
    name: 'Mobile Banking',
    code: 'MOB',
    status: 'Healthy',
    txnVolume: 982450,
    fraudRate: 0.42,
    avgLatencyMs: 186,
    uptime: 99.97,
    blockedInPeriod: 128,
    color: '#4361ee',
    icon: 'fa-mobile-alt'
  },
  {
    name: 'Internet Banking',
    code: 'IB',
    status: 'Healthy',
    txnVolume: 412380,
    fraudRate: 0.31,
    avgLatencyMs: 142,
    uptime: 99.99,
    blockedInPeriod: 54,
    color: '#06d6a0',
    icon: 'fa-globe'
  },
  {
    name: 'USSD',
    code: 'USSD',
    status: 'Degraded',
    txnVolume: 628110,
    fraudRate: 0.78,
    avgLatencyMs: 312,
    uptime: 98.64,
    blockedInPeriod: 97,
    color: '#fd7e14',
    icon: 'fa-keyboard'
  },
  {
    name: 'ATM / POS',
    code: 'ATM',
    status: 'Healthy',
    txnVolume: 245670,
    fraudRate: 0.25,
    avgLatencyMs: 98,
    uptime: 99.91,
    blockedInPeriod: 31,
    color: '#4cc9f0',
    icon: 'fa-credit-card'
  },
  {
    name: 'Agency Banking',
    code: 'AGY',
    status: 'Critical',
    txnVolume: 156890,
    fraudRate: 1.24,
    avgLatencyMs: 428,
    uptime: 96.12,
    blockedInPeriod: 62,
    color: '#f72585',
    icon: 'fa-store'
  },
  {
    name: 'Core Banking',
    code: 'CORE',
    status: 'Healthy',
    txnVolume: 58420,
    fraudRate: 0.18,
    avgLatencyMs: 76,
    uptime: 99.99,
    blockedInPeriod: 12,
    color: '#7209b7',
    icon: 'fa-university'
  }
];

export const CHANNEL_SUMMARIES: ChannelSummary[] = [
  { channel: 'Mobile Banking', totalTxns: 982450, flagged: 4120, blocked: 128, amountAtRisk: 8200000, recoveryRate: 91.4, topThreat: 'Account Takeover' },
  { channel: 'Internet Banking', totalTxns: 412380, flagged: 1280, blocked: 54, amountAtRisk: 4100000, recoveryRate: 94.2, topThreat: 'Phishing' },
  { channel: 'USSD', totalTxns: 628110, flagged: 4890, blocked: 97, amountAtRisk: 3600000, recoveryRate: 87.6, topThreat: 'SIM Swap' },
  { channel: 'ATM / POS', totalTxns: 245670, flagged: 610, blocked: 31, amountAtRisk: 980000, recoveryRate: 96.1, topThreat: 'Card Skimming' },
  { channel: 'Agency Banking', totalTxns: 156890, flagged: 1940, blocked: 62, amountAtRisk: 1250000, recoveryRate: 78.3, topThreat: 'Money Mule' },
  { channel: 'Core Banking', totalTxns: 58420, flagged: 105, blocked: 12, amountAtRisk: 270000, recoveryRate: 98.5, topThreat: 'Insider Fraud' }
];

export const MONITORED_TRANSACTIONS: MonitoredTransaction[] = [
  { id: 'TXN-92618401', time: '16:02:14', channel: 'Mobile Banking', type: 'P2P Transfer', amount: 450000, customer: '****7842', riskScore: 94, fraudFlag: 'Blocked', ruleHit: 'Velocity + New Device' },
  { id: 'TXN-92618398', time: '16:01:52', channel: 'Agency Banking', type: 'Cash Withdrawal', amount: 185000, customer: '****3310', riskScore: 88, fraudFlag: 'Under Review', ruleHit: 'Agent Limit Breach' },
  { id: 'TXN-92618391', time: '16:01:08', channel: 'USSD', type: 'Airtime Bundle', amount: 5000, customer: '****9921', riskScore: 22, fraudFlag: 'None', ruleHit: '—' },
  { id: 'TXN-92618385', time: '16:00:41', channel: 'Internet Banking', type: 'RTGS Transfer', amount: 3200000, customer: '****4418', riskScore: 91, fraudFlag: 'Suspicious', ruleHit: 'Cross-Border Spike' },
  { id: 'TXN-92618372', time: '15:59:55', channel: 'ATM / POS', type: 'POS Purchase', amount: 78500, customer: '****1209', riskScore: 67, fraudFlag: 'Suspicious', ruleHit: 'Geo Mismatch' },
  { id: 'TXN-92618368', time: '15:59:22', channel: 'Mobile Banking', type: 'Bill Payment', amount: 12400, customer: '****5567', riskScore: 15, fraudFlag: 'None', ruleHit: '—' },
  { id: 'TXN-92618354', time: '15:58:47', channel: 'Core Banking', type: 'Internal Transfer', amount: 8900000, customer: '****0088', riskScore: 81, fraudFlag: 'Under Review', ruleHit: 'High-Value Dual Auth' },
  { id: 'TXN-92618341', time: '15:57:33', channel: 'USSD', type: 'P2P Transfer', amount: 98000, customer: '****6723', riskScore: 86, fraudFlag: 'Blocked', ruleHit: 'SIM Swap Indicator' },
  { id: 'TXN-92618329', time: '15:56:19', channel: 'Agency Banking', type: 'Deposit', amount: 42000, customer: '****8845', riskScore: 38, fraudFlag: 'None', ruleHit: '—' },
  { id: 'TXN-92618315', time: '15:55:02', channel: 'Mobile Banking', type: 'Merchant Pay', amount: 256000, customer: '****2190', riskScore: 73, fraudFlag: 'Suspicious', ruleHit: 'Beneficiary Mismatch' },
  { id: 'TXN-92618302', time: '15:54:11', channel: 'Internet Banking', type: 'Salary Credit', amount: 145000, customer: '****3344', riskScore: 12, fraudFlag: 'None', ruleHit: '—' },
  { id: 'TXN-92618291', time: '15:53:28', channel: 'ATM / POS', type: 'ATM Withdrawal', amount: 40000, customer: '****7611', riskScore: 55, fraudFlag: 'None', ruleHit: '—' }
];
