export interface FraudKpi {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: string;
  color: string;
  description: string;
}

export interface FraudReportRow {
  id: string;
  date: string;
  type: string;
  channel: string;
  amount: number;
  status: 'Confirmed' | 'Under Review' | 'False Positive' | 'Escalated';
  riskScore: number;
  analyst: string;
  region: string;
}

export interface TopPattern {
  pattern: string;
  occurrences: number;
  lossPrevented: number;
  trend: number;
}

export const FRAUD_KPIS: FraudKpi[] = [
  {
    label: 'Total Fraud Cases',
    value: '1,284',
    change: '+12.4%',
    trend: 'up',
    icon: 'fa-exclamation-triangle',
    color: '#f72585',
    description: 'vs. previous quarter'
  },
  {
    label: 'Amount at Risk',
    value: 'KES 48.7M',
    change: '-8.2%',
    trend: 'down',
    icon: 'fa-money-bill-wave',
    color: '#4361ee',
    description: 'Blocked & recovered'
  },
  {
    label: 'Detection Rate',
    value: '96.8%',
    change: '+2.1%',
    trend: 'up',
    icon: 'fa-shield-alt',
    color: '#06d6a0',
    description: 'ML + rules engine'
  },
  {
    label: 'False Positive Rate',
    value: '3.2%',
    change: '-1.4%',
    trend: 'down',
    icon: 'fa-check-circle',
    color: '#4cc9f0',
    description: 'Improved accuracy'
  },
  {
    label: 'Avg Resolution Time',
    value: '4.2 hrs',
    change: '-18%',
    trend: 'down',
    icon: 'fa-clock',
    color: '#fd7e14',
    description: 'Case closure speed'
  },
  {
    label: 'Compliance Score',
    value: '98.5%',
    change: '+0.8%',
    trend: 'up',
    icon: 'fa-balance-scale',
    color: '#7209b7',
    description: 'Regulatory adherence'
  }
];

export const FRAUD_REPORTS: FraudReportRow[] = [
  { id: 'FR-2026-0847', date: '2026-09-02', type: 'Account Takeover', channel: 'Mobile Banking', amount: 2450000, status: 'Confirmed', riskScore: 94, analyst: 'Grace Wanjiku', region: 'Nairobi' },
  { id: 'FR-2026-0846', date: '2026-09-02', type: 'SIM Swap Fraud', channel: 'USSD', amount: 890000, status: 'Escalated', riskScore: 91, analyst: 'James Otieno', region: 'Mombasa' },
  { id: 'FR-2026-0845', date: '2026-09-01', type: 'Card Skimming', channel: 'ATM/POS', amount: 156000, status: 'Under Review', riskScore: 78, analyst: 'Amina Hassan', region: 'Kisumu' },
  { id: 'FR-2026-0844', date: '2026-09-01', type: 'Phishing', channel: 'Internet Banking', amount: 3200000, status: 'Confirmed', riskScore: 88, analyst: 'Peter Kamau', region: 'Nairobi' },
  { id: 'FR-2026-0843', date: '2026-08-31', type: 'Money Mule', channel: 'Agency', amount: 675000, status: 'False Positive', riskScore: 42, analyst: 'Grace Wanjiku', region: 'Nakuru' },
  { id: 'FR-2026-0842', date: '2026-08-31', type: 'Identity Theft', channel: 'Core Banking', amount: 1890000, status: 'Confirmed', riskScore: 96, analyst: 'James Otieno', region: 'Eldoret' },
  { id: 'FR-2026-0841', date: '2026-08-30', type: 'Transaction Laundering', channel: 'Mobile Banking', amount: 4500000, status: 'Escalated', riskScore: 92, analyst: 'Amina Hassan', region: 'Nairobi' },
  { id: 'FR-2026-0840', date: '2026-08-30', type: 'Insider Fraud', channel: 'Core Banking', amount: 7800000, status: 'Under Review', riskScore: 85, analyst: 'Peter Kamau', region: 'Nairobi' },
  { id: 'FR-2026-0839', date: '2026-08-29', type: 'Social Engineering', channel: 'USSD', amount: 320000, status: 'Confirmed', riskScore: 79, analyst: 'Grace Wanjiku', region: 'Thika' },
  { id: 'FR-2026-0838', date: '2026-08-29', type: 'Account Takeover', channel: 'Mobile Banking', amount: 1120000, status: 'Confirmed', riskScore: 90, analyst: 'James Otieno', region: 'Mombasa' }
];

export const TOP_PATTERNS: TopPattern[] = [
  { pattern: 'Velocity Anomaly (5+ txns/hr)', occurrences: 342, lossPrevented: 12400000, trend: 15 },
  { pattern: 'New Device + High Amount', occurrences: 287, lossPrevented: 9800000, trend: 8 },
  { pattern: 'Cross-Border Transfer Spike', occurrences: 198, lossPrevented: 15600000, trend: -3 },
  { pattern: 'SIM Swap Indicators', occurrences: 156, lossPrevented: 4200000, trend: 22 },
  { pattern: 'Dormant Account Reactivation', occurrences: 134, lossPrevented: 3100000, trend: 5 },
  { pattern: 'Beneficiary Mismatch', occurrences: 112, lossPrevented: 2800000, trend: -7 }
];
