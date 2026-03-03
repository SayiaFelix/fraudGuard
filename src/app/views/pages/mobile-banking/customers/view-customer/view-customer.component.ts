import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

interface FraudCase {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  channel: 'Mobile' | 'Web' | 'ATM' | 'Agent';
  location: string;
  timestamp: Date;
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive';
  flaggedBy: 'AI' | 'Rules' | 'Manual';
  customerName: string;
  customerId: string;
  deviceId: string;
  ipAddress: string;
  resolution?: {
    resolvedBy?: string;
    resolvedAt?: Date;
    notes?: string;
    action?: 'Blocked' | 'Approved' | 'Flagged' | 'Escalated';
  };
  aiExplanation: string;
  modelAgreement: {
    flagged: number;
    total: number;
  };
}



@Component({
  selector: 'app-view-customer',
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.scss']
})
export class ViewCustomerComponent implements OnInit {
@ViewChild('table') table: any;

  // Filters
  searchTerm: string = '';
  riskFilter: string = 'all';
  statusFilter: string = 'all';
  channelFilter: string = 'all';
  dateRange: 'today' | 'week' | 'month' | 'all' = 'week';
  startDate: string = '';
  endDate: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalRecords: number = 0;

  // Data
  allFraudCases: FraudCase[] = [];
  filteredCases: FraudCase[] = [];
  selectedCase: FraudCase | null = null;
  showDetailsModal: boolean = false;

  // Stats
  stats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    falsePositive: 0,
    totalAmount: 0
  };

Math = Math; 

constructor(private router: Router, private datePipe: DatePipe) {
  this.Math = Math; 
}
  ngOnInit(): void {
    this.generateMockData();
    this.applyFilters();
    this.calculateStats();
  }

  private generateMockData(): void {
  // Create fresh dates for each case
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const threeWeeksAgo = new Date(today);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);
  
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

  const cases: FraudCase[] = [
    // Today's cases (3 cases)
    {
      id: 'case-001',
      transactionId: 'TXN-2026-001',
      amount: 450000,
      riskScore: 9.2,
      riskCategory: 'Critical',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: new Date(today.setHours(14, 23, 45)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'John Mwangi',
      customerId: 'CUST-001',
      deviceId: 'DEV-8F7D2A',
      ipAddress: '197.248.0.45',
      resolution: {
        resolvedBy: 'Jane Otieno',
        resolvedAt: new Date(today.setHours(16, 30, 0)),
        notes: 'Confirmed fraud. Account frozen and customer notified.',
        action: 'Blocked'
      },
      aiExplanation: 'Multiple anomalies detected: Amount 4x normal, new device, and location mismatch with customer profile. 6/7 models flagged as fraud.',
      modelAgreement: { flagged: 6, total: 7 }
    },
    {
      id: 'case-011',
      transactionId: 'TXN-2026-011',
      amount: 125000,
      riskScore: 7.8,
      riskCategory: 'High',
      channel: 'Web',
      location: 'Nairobi, KE',
      timestamp: new Date(today.setHours(9, 15, 22)),
      status: 'Investigating',
      flaggedBy: 'AI',
      customerName: 'Lucy Wambui',
      customerId: 'CUST-011',
      deviceId: 'DEV-2K3L4M',
      ipAddress: '197.248.12.56',
      aiExplanation: 'Unusual login pattern from new device. Multiple failed attempts before transaction. 5/7 models flagged.',
      modelAgreement: { flagged: 5, total: 7 }
    },
    {
      id: 'case-012',
      transactionId: 'TXN-2026-012',
      amount: 35000,
      riskScore: 4.5,
      riskCategory: 'Low',
      channel: 'ATM',
      location: 'Thika, KE',
      timestamp: new Date(today.setHours(8, 30, 15)),
      status: 'False Positive',
      flaggedBy: 'Rules',
      customerName: 'Samuel Kariuki',
      customerId: 'CUST-012',
      deviceId: 'DEV-5N6P7Q',
      ipAddress: '197.249.45.78',
      resolution: {
        resolvedBy: 'System',
        resolvedAt: new Date(today.setHours(9, 45, 0)),
        notes: 'Customer confirmed transaction. Rule adjusted for this ATM location.',
        action: 'Approved'
      },
      aiExplanation: 'Low risk transaction flagged due to new ATM location. Customer history normal.',
      modelAgreement: { flagged: 1, total: 7 }
    },

    // Yesterday's cases (2 cases)
    {
      id: 'case-002',
      transactionId: 'TXN-2026-002',
      amount: 275000,
      riskScore: 8.7,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'Mombasa, KE',
      timestamp: new Date(yesterday.setHours(13, 15, 22)),
      status: 'Investigating',
      flaggedBy: 'AI',
      customerName: 'Sarah Omondi',
      customerId: 'CUST-002',
      deviceId: 'DEV-3B5E9C',
      ipAddress: '105.27.143.78',
      aiExplanation: 'Velocity check failed: 3 transactions in 5 minutes from different IPs. 5/7 models flagged as fraud.',
      modelAgreement: { flagged: 5, total: 7 }
    },
    {
      id: 'case-013',
      transactionId: 'TXN-2026-013',
      amount: 89000,
      riskScore: 6.8,
      riskCategory: 'Medium',
      channel: 'Mobile',
      location: 'Kilifi, KE',
      timestamp: new Date(yesterday.setHours(18, 45, 33)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Hassan Abdalla',
      customerId: 'CUST-013',
      deviceId: 'DEV-8R9S1T',
      ipAddress: '105.28.67.89',
      resolution: {
        resolvedBy: 'Ahmed Mohammed',
        resolvedAt: new Date(yesterday.setHours(20, 15, 0)),
        notes: 'Customer verified transaction. Location consistent with travel.',
        action: 'Approved'
      },
      aiExplanation: 'Location anomaly but customer verified travel. 3/7 models flagged.',
      modelAgreement: { flagged: 3, total: 7 }
    },

    // 2 days ago (2 cases)
    {
      id: 'case-003',
      transactionId: 'TXN-2026-003',
      amount: 89000,
      riskScore: 7.8,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Kisumu, KE',
      timestamp: new Date(twoDaysAgo.setHours(12, 45, 10)),
      status: 'Open',
      flaggedBy: 'Rules',
      customerName: 'Peter Ochieng',
      customerId: 'CUST-003',
      deviceId: 'DEV-2A1C4D',
      ipAddress: '154.122.89.34',
      aiExplanation: 'Suspicious pattern: Transaction amount exceeds daily average by 340%. 4/7 models flagged as fraud.',
      modelAgreement: { flagged: 4, total: 7 }
    },
    {
      id: 'case-014',
      transactionId: 'TXN-2026-014',
      amount: 560000,
      riskScore: 9.1,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'Nairobi, KE',
      timestamp: new Date(twoDaysAgo.setHours(22, 30, 45)),
      status: 'Investigating',
      flaggedBy: 'AI',
      customerName: 'Margaret Njeri',
      customerId: 'CUST-014',
      deviceId: 'DEV-2U3V4W',
      ipAddress: '197.250.78.12',
      aiExplanation: 'Large night transaction from new device. Multiple failed logins earlier. 6/7 models flagged.',
      modelAgreement: { flagged: 6, total: 7 }
    },

    // 3 days ago (2 cases)
    {
      id: 'case-004',
      transactionId: 'TXN-2026-004',
      amount: 150000,
      riskScore: 7.2,
      riskCategory: 'High',
      channel: 'ATM',
      location: 'Nakuru, KE',
      timestamp: new Date(threeDaysAgo.setHours(11, 30, 5)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Mary Akinyi',
      customerId: 'CUST-004',
      deviceId: 'DEV-7E2F1B',
      ipAddress: '197.250.34.21',
      resolution: {
        resolvedBy: 'System',
        resolvedAt: new Date(threeDaysAgo.setHours(12, 15, 0)),
        notes: 'False positive. Customer confirmed legitimate transaction.',
        action: 'Approved'
      },
      aiExplanation: 'Unusual location: First transaction from this region in 2 years. Customer verified travel plans.',
      modelAgreement: { flagged: 4, total: 7 }
    },
    {
      id: 'case-015',
      transactionId: 'TXN-2026-015',
      amount: 234000,
      riskScore: 8.4,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Eldoret, KE',
      timestamp: new Date(threeDaysAgo.setHours(16, 20, 10)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Joseph Ruto',
      customerId: 'CUST-015',
      deviceId: 'DEV-5X6Y7Z',
      ipAddress: '154.123.56.90',
      resolution: {
        resolvedBy: 'Jane Otieno',
        resolvedAt: new Date(threeDaysAgo.setHours(18, 30, 0)),
        notes: 'Confirmed business transaction. Pattern noted.',
        action: 'Approved'
      },
      aiExplanation: 'High amount consistent with business pattern. 4/7 models flagged.',
      modelAgreement: { flagged: 4, total: 7 }
    },

    // 4-6 days ago (3 cases)
    {
      id: 'case-016',
      transactionId: 'TXN-2026-016',
      amount: 78000,
      riskScore: 6.2,
      riskCategory: 'Medium',
      channel: 'Agent',
      location: 'Kakamega, KE',
      timestamp: new Date(fourDaysAgo.setHours(10, 15, 30)),
      status: 'Resolved',
      flaggedBy: 'Manual',
      customerName: 'Alice Musyoka',
      customerId: 'CUST-016',
      deviceId: 'DEV-1A2B3C',
      ipAddress: '197.251.23.45',
      resolution: {
        resolvedBy: 'John Kamau',
        resolvedAt: new Date(fourDaysAgo.setHours(14, 20, 0)),
        notes: 'Agent trust score low but transaction legitimate.',
        action: 'Approved'
      },
      aiExplanation: 'Agent trust score low but transaction pattern normal. 2/7 models flagged.',
      modelAgreement: { flagged: 2, total: 7 }
    },
    {
      id: 'case-017',
      transactionId: 'TXN-2026-017',
      amount: 890000,
      riskScore: 9.4,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'International',
      timestamp: new Date(fiveDaysAgo.setHours(14, 30, 22)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Patrick Maina',
      customerId: 'CUST-017',
      deviceId: 'DEV-4D5E6F',
      ipAddress: '45.67.89.123',
      resolution: {
        resolvedBy: 'Jane Otieno',
        resolvedAt: new Date(fiveDaysAgo.setHours(17, 45, 0)),
        notes: 'Confirmed fraud. International scam pattern.',
        action: 'Blocked'
      },
      aiExplanation: 'International transfer from new IP. 7/7 models flagged.',
      modelAgreement: { flagged: 7, total: 7 }
    },
    {
      id: 'case-018',
      transactionId: 'TXN-2026-018',
      amount: 45000,
      riskScore: 4.8,
      riskCategory: 'Low',
      channel: 'Mobile',
      location: 'Nyeri, KE',
      timestamp: new Date(sixDaysAgo.setHours(9, 45, 12)),
      status: 'False Positive',
      flaggedBy: 'Rules',
      customerName: 'Esther Wanjiru',
      customerId: 'CUST-018',
      deviceId: 'DEV-7G8H9I',
      ipAddress: '197.248.90.123',
      resolution: {
        resolvedBy: 'System',
        resolvedAt: new Date(sixDaysAgo.setHours(11, 0, 0)),
        notes: 'Normal transaction pattern. Rule adjusted.',
        action: 'Approved'
      },
      aiExplanation: 'Normal transaction pattern. 0/7 models flagged.',
      modelAgreement: { flagged: 0, total: 7 }
    },

    // Last week (2 cases)
    {
      id: 'case-005',
      transactionId: 'TXN-2026-005',
      amount: 32000,
      riskScore: 6.5,
      riskCategory: 'Medium',
      channel: 'Agent',
      location: 'Eldoret, KE',
      timestamp: new Date(lastWeek.setHours(10, 20, 30)),
      status: 'Resolved',
      flaggedBy: 'Manual',
      customerName: 'James Kipchoge',
      customerId: 'CUST-005',
      deviceId: 'DEV-4C8D3E',
      ipAddress: '105.29.167.92',
      resolution: {
        resolvedBy: 'John Kamau',
        resolvedAt: new Date(lastWeek.setHours(14, 20, 0)),
        notes: 'Agent trust score low but transaction legitimate. Agent flagged for monitoring.',
        action: 'Approved'
      },
      aiExplanation: 'Agent trust score low: This agent has been linked to 2 previous fraud cases. Transaction pattern normal.',
      modelAgreement: { flagged: 3, total: 7 }
    },
    {
      id: 'case-007',
      transactionId: 'TXN-2026-007',
      amount: 45000,
      riskScore: 4.2,
      riskCategory: 'Low',
      channel: 'Mobile',
      location: 'Thika, KE',
      timestamp: new Date(lastWeek.setHours(18, 30, 45)),
      status: 'False Positive',
      flaggedBy: 'Rules',
      customerName: 'David Kimani',
      customerId: 'CUST-007',
      deviceId: 'DEV-5F6E7D',
      ipAddress: '197.248.12.67',
      resolution: {
        resolvedBy: 'System',
        resolvedAt: new Date(lastWeek.setHours(19, 15, 0)),
        notes: 'Transaction matched normal patterns. Rule adjusted.',
        action: 'Approved'
      },
      aiExplanation: 'Low risk: Transaction matches normal customer behavior patterns.',
      modelAgreement: { flagged: 1, total: 7 }
    },

    // 10+ days ago (3 cases)
    {
      id: 'case-019',
      transactionId: 'TXN-2026-019',
      amount: 345000,
      riskScore: 8.2,
      riskCategory: 'High',
      channel: 'Web',
      location: 'Mombasa, KE',
      timestamp: new Date(tenDaysAgo.setHours(15, 30, 45)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Fatima Hassan',
      customerId: 'CUST-019',
      deviceId: 'DEV-9J8K7L',
      ipAddress: '105.30.45.67',
      resolution: {
        resolvedBy: 'Ahmed Mohammed',
        resolvedAt: new Date(tenDaysAgo.setHours(18, 20, 0)),
        notes: 'Customer confirmed business transaction.',
        action: 'Approved'
      },
      aiExplanation: 'High amount but customer history clean. 4/7 models flagged.',
      modelAgreement: { flagged: 4, total: 7 }
    },
    {
      id: 'case-020',
      transactionId: 'TXN-2026-020',
      amount: 670000,
      riskScore: 9.3,
      riskCategory: 'Critical',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: new Date(twoWeeksAgo.setHours(20, 45, 30)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Bernard Otieno',
      customerId: 'CUST-020',
      deviceId: 'DEV-2M3N4P',
      ipAddress: '197.252.67.89',
      resolution: {
        resolvedBy: 'Jane Otieno',
        resolvedAt: new Date(twoWeeksAgo.setHours(23, 0, 0)),
        notes: 'Fraud confirmed. Account compromised.',
        action: 'Blocked'
      },
      aiExplanation: 'Multiple devices used. Unusual night activity. 6/7 models flagged.',
      modelAgreement: { flagged: 6, total: 7 }
    },
    {
      id: 'case-010',
      transactionId: 'TXN-2026-010',
      amount: 560000,
      riskScore: 9.5,
      riskCategory: 'Critical',
      channel: 'Mobile',
      location: 'Kisumu, KE',
      timestamp: new Date(lastWeek.setHours(20, 15, 44)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Felix Omondi',
      customerId: 'CUST-010',
      deviceId: 'DEV-9J8K7L',
      ipAddress: '197.249.34.78',
      resolution: {
        resolvedBy: 'Jane Otieno',
        resolvedAt: new Date(lastWeek.setHours(22, 0, 0)),
        notes: 'Fraud confirmed. Funds recovered from mule account.',
        action: 'Blocked'
      },
      aiExplanation: 'Multiple high-risk signals: New device, night transaction, amount exceeds pattern by 500%. 6/7 models flagged.',
      modelAgreement: { flagged: 6, total: 7 }
    },

    // Last month (2 cases)
    {
      id: 'case-006',
      transactionId: 'TXN-2026-006',
      amount: 1250000,
      riskScore: 9.8,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'International',
      timestamp: new Date(lastMonth.setHours(9, 45, 12)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Elizabeth Wanjiku',
      customerId: 'CUST-006',
      deviceId: 'DEV-9A1B2C',
      ipAddress: '45.123.89.156',
      resolution: {
        resolvedBy: 'Jane Otieno',
        resolvedAt: new Date(lastMonth.setHours(11, 20, 0)),
        notes: 'Confirmed account takeover. Transaction blocked, account frozen.',
        action: 'Blocked'
      },
      aiExplanation: 'CRITICAL: Large international transfer from new device. Previous activity suggests possible account takeover. 7/7 models flagged.',
      modelAgreement: { flagged: 7, total: 7 }
    },
    {
      id: 'case-009',
      transactionId: 'TXN-2026-009',
      amount: 78000,
      riskScore: 7.1,
      riskCategory: 'High',
      channel: 'Web',
      location: 'Mombasa, KE',
      timestamp: new Date(threeDaysAgo.setHours(11, 45, 22)),
      status: 'Resolved',
      flaggedBy: 'AI',
      customerName: 'Brian Odhiambo',
      customerId: 'CUST-009',
      deviceId: 'DEV-6G7H8I',
      ipAddress: '105.26.78.123',
      resolution: {
        resolvedBy: 'Mary Wambui',
        resolvedAt: new Date(threeDaysAgo.setHours(14, 30, 0)),
        notes: 'Customer verified transaction. Pattern noted for future reference.',
        action: 'Approved'
      },
      aiExplanation: 'Unusual browser fingerprint combined with high amount. Customer verified as legitimate.',
      modelAgreement: { flagged: 4, total: 7 }
    },

    // Two months ago (1 case)
    {
      id: 'case-008',
      transactionId: 'TXN-2026-008',
      amount: 230000,
      riskScore: 8.1,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: new Date(twoMonthsAgo.setHours(15, 20, 33)),
      status: 'Investigating',
      flaggedBy: 'AI',
      customerName: 'Grace Auma',
      customerId: 'CUST-008',
      deviceId: 'DEV-1D2E3F',
      ipAddress: '154.124.56.89',
      aiExplanation: 'SIM swap detected 3 hours ago followed by large transfer request. 5/7 models flagged.',
      modelAgreement: { flagged: 5, total: 7 }
    }
  ];

  this.allFraudCases = cases;
  this.totalRecords = cases.length;
}

// Add this method to handle page size changes
onPageSizeChange(): void {
  this.currentPage = 1; 
}

applyFilters(): void {
  this.filteredCases = this.allFraudCases.filter(case_ => {
    // Risk filter
    if (this.riskFilter !== 'all' && case_.riskCategory.toLowerCase() !== this.riskFilter) {
      return false;
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      const statusMap: { [key: string]: string } = {
        'open': 'open',
        'investigating': 'investigating',
        'resolved': 'resolved',
        'falsepositive': 'false positive'
      };
      const filterStatus = statusMap[this.statusFilter];
      if (case_.status.toLowerCase() !== filterStatus) {
        return false;
      }
    }

    // Channel filter
    if (this.channelFilter !== 'all' && case_.channel.toLowerCase() !== this.channelFilter) {
      return false;
    }

    // Date range filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const caseDate = new Date(case_.timestamp);
    caseDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - caseDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (this.dateRange === 'today' && diffDays > 0) {
      return false; // Must be today
    }
    
    if (this.dateRange === 'week' && diffDays > 7) {
      return false; // Must be within last 7 days
    }
    
    if (this.dateRange === 'month' && diffDays > 30) {
      return false; // Must be within last 30 days
    }

    // Custom date range
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      
      if (case_.timestamp < start || case_.timestamp > end) {
        return false;
      }
    }

    // Search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      return case_.transactionId.toLowerCase().includes(term) ||
             case_.customerName.toLowerCase().includes(term) ||
             case_.location.toLowerCase().includes(term) ||
             case_.id.toLowerCase().includes(term);
    }

    return true;
  });

  this.totalRecords = this.filteredCases.length;
  this.calculateStats();
  
  // Reset to first page when filters change
  this.currentPage = 1;
}

onPageChange(page: number): void {
  this.currentPage = page;
  // Optional: Add console.log for debugging
  console.log('Page changed to:', page);
  console.log('Showing items:', (page-1)*this.pageSize, 'to', page*this.pageSize);
}

  calculateStats(): void {
    const cases = this.filteredCases;
    this.stats = {
      total: cases.length,
      critical: cases.filter(c => c.riskCategory === 'Critical').length,
      high: cases.filter(c => c.riskCategory === 'High').length,
      medium: cases.filter(c => c.riskCategory === 'Medium').length,
      low: cases.filter(c => c.riskCategory === 'Low').length,
      open: cases.filter(c => c.status === 'Open').length,
      investigating: cases.filter(c => c.status === 'Investigating').length,
      resolved: cases.filter(c => c.status === 'Resolved').length,
      falsePositive: cases.filter(c => c.status === 'False Positive').length,
      totalAmount: cases.reduce((sum, c) => sum + c.amount, 0)
    };
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.riskFilter = 'all';
    this.statusFilter = 'all';
    this.channelFilter = 'all';
    this.dateRange = 'week';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  viewCaseDetails(case_: FraudCase): void {
    this.selectedCase = case_;
    this.showDetailsModal = true;
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedCase = null;
  }

  investigateCase(case_: FraudCase): void {
    this.closeModal();
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', case_.id]);
  }

  viewTransaction(case_: FraudCase): void {
    this.closeModal();
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', case_.transactionId]);
  }

  exportData(): void {
    alert('Exporting fraud history data will be live in PRODUCTION...');
  }


  getRiskBadgeClass(riskCategory: string): string {
    const classes = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory as keyof typeof classes] || 'bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Resolved': 'bg-success',
      'False Positive': 'bg-secondary'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  getFlaggedByIcon(flaggedBy: string): string {
    const icons = {
      'AI': 'fas fa-robot',
      'Rules': 'fas fa-cogs',
      'Manual': 'fas fa-user'
    };
    return icons[flaggedBy as keyof typeof icons] || 'fas fa-question';
  }

  getChannelIcon(channel: string): string {
    const icons = {
      'Mobile': 'fas fa-mobile-alt',
      'Web': 'fas fa-globe',
      'ATM': 'fas fa-credit-card',
      'Agent': 'fas fa-user-tie'
    };
    return icons[channel as keyof typeof icons] || 'fas fa-exchange-alt';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'MMM d, y, HH:mm') || '';
  }

  getResolutionActionClass(action?: string): string {
    const classes = {
      'Blocked': 'bg-danger',
      'Approved': 'bg-success',
      'Flagged': 'bg-warning',
      'Escalated': 'bg-primary'
    };
    return classes[action as keyof typeof classes] || 'bg-secondary';
  }
  
}