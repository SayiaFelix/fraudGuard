// dashboard.component.ts
import { Component, OnInit,Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Transaction {
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_category: string;
  transaction_details: {
    Transaction_Amount: number;
    Model_Agreement: string;
    real_time_signals?: {
      amount_risk: number;
      velocity_risk: number;
      avg_amount_used: number;
    };
  };
  recommended_action: string;
}

export interface FraudHistoryResponse {
  status: string;
  message: string;
  fraud_transactions: Transaction[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface TransactionsResponse {
  status: string;
  message: string;
  transactions: Transaction[];
  pagination: {
    page: number;
    size: number;
    total: number;
    has_more: boolean;
  };
}

export interface ModelMetrics {
  status: string;
  model_version: string;
  national_alert_mode: boolean;
  threshold: number;
  metrics: {
    [modelName: string]: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
    };
  };
}

export interface AuditLogEntry {
  timestamp: string;
  transaction_id: string;
  model_version: string;
  risk_score: number;
  risk_category: string;
  recommended_action: string;
  national_alert_mode: boolean;
}

export interface AuditLogResponse {
  status: string;
  message: string;
  log_count: number;
  logs: AuditLogEntry[];
}

export interface AlertModeResponse {
  status: string;
  message: string;
  national_alert_mode: boolean;
  active_threshold: number;
}

interface KPI {
  label: string;
  value: number | string;
  icon: string;
  borderClass: string;
  textClass: string;
  trend: 'up' | 'down' | 'flat';
  description: string;
  color: string;
}

interface TransactionAlert {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  channel: 'Mobile' | 'Web' | 'ATM' | 'Agent';
  location: string;
  timestamp: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  flaggedBy: 'AI' | 'Rules' | 'Manual';
}

interface FraudTrend {
  month: string;
  fraudCount: number;
  amount: number;
}

interface ChannelRisk {
  channel: string;
  transactions: number;
  fraudCases: number;
  riskPercentage: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  lastUpdated = new Date();
  
  kpis: KPI[] = [
  {
    label: 'Total Transactions',
    value: '158,432',
    icon: 'fas fa-exchange-alt',
    borderClass: 'border-primary',
    textClass: 'text-primary',
    trend: 'up',
    description: 'Last 24 hours',
    color: '#4361ee'  // Blue
  },
  {
    label: 'High Risk Alerts',
    value: '1,284',
    icon: 'fas fa-exclamation-triangle',
    borderClass: 'border-danger',
    textClass: 'text-danger',
    trend: 'up',
    description: 'Critical + High',
    color: '#f72585'  // Pink/Red
  },
  {
    label: 'Fraud Blocked',
    value: 'KES 2.4M',
    icon: 'fas fa-shield-alt',
    borderClass: 'border-success',
    textClass: 'text-success',
    trend: 'up',
    description: 'Prevented losses',
    color: '#06d6a0'  // Green
  },
  {
    label: 'AI Confidence',
    value: '94%',
    icon: 'fas fa-brain',
    borderClass: 'border-info',
    textClass: 'text-info',
    trend: 'flat',
    description: 'Model accuracy',
    color: '#4cc9f0'  // Light Blue
  }
];

  // Recent high-risk transactions
  recentAlerts: TransactionAlert[] = [
    {
      id: '1',
      transactionId: 'TXN-2024-001',
      amount: 450000,
      riskScore: 9.2,
      riskCategory: 'Critical',
      channel: 'Mobile',
      location: 'Nairobi, KE',
      timestamp: '2024-02-23T14:23:45',
      status: 'Open',
      flaggedBy: 'AI'
    },
    {
      id: '2',
      transactionId: 'TXN-2024-002',
      amount: 275000,
      riskScore: 8.7,
      riskCategory: 'Critical',
      channel: 'Web',
      location: 'Mombasa, KE',
      timestamp: '2024-02-23T13:15:22',
      status: 'Investigating',
      flaggedBy: 'AI'
    },
    {
      id: '3',
      transactionId: 'TXN-2024-003',
      amount: 89000,
      riskScore: 7.8,
      riskCategory: 'High',
      channel: 'Mobile',
      location: 'Kisumu, KE',
      timestamp: '2024-02-23T12:45:10',
      status: 'Open',
      flaggedBy: 'Rules'
    },
    {
      id: '4',
      transactionId: 'TXN-2024-004',
      amount: 150000,
      riskScore: 7.2,
      riskCategory: 'High',
      channel: 'ATM',
      location: 'Nakuru, KE',
      timestamp: '2024-02-23T11:30:05',
      status: 'Resolved',
      flaggedBy: 'AI'
    },
    {
      id: '5',
      transactionId: 'TXN-2024-005',
      amount: 32000,
      riskScore: 6.5,
      riskCategory: 'Medium',
      channel: 'Agent',
      location: 'Eldoret, KE',
      timestamp: '2024-02-23T10:20:30',
      status: 'Investigating',
      flaggedBy: 'Manual'
    }
  ];

  // Fraud trends over time
  fraudTrends: FraudTrend[] = [
    { month: 'Jan', fraudCount: 245, amount: 1250000 },
    { month: 'Feb', fraudCount: 312, amount: 1890000 },
    { month: 'Mar', fraudCount: 278, amount: 1560000 },
    { month: 'Apr', fraudCount: 425, amount: 2340000 },
    { month: 'May', fraudCount: 389, amount: 2120000 },
    { month: 'Jun', fraudCount: 456, amount: 2670000 }
  ];

  // Channel risk distribution
  channelRisk: ChannelRisk[] = [
    { channel: 'Mobile Money', transactions: 84500, fraudCases: 623, riskPercentage: 0.74 },
    { channel: 'Web/Online', transactions: 42300, fraudCases: 487, riskPercentage: 1.15 },
    { channel: 'ATM', transactions: 18900, fraudCases: 98, riskPercentage: 0.52 },
    { channel: 'Agent', transactions: 12732, fraudCases: 76, riskPercentage: 0.60 }
  ];

  // Risk category distribution
  riskDistribution = {
    critical: 342,
    high: 942,
    medium: 2456,
    low: 154692
  };

  // Recent activities
  recentActivities = [
    {
      type: 'critical',
      message: 'New critical fraud pattern detected',
      details: 'Multiple SIM swap attempts followed by large transfers',
      time: '5 minutes ago'
    },
    {
      type: 'update',
      message: 'Case TXN-2024-001 escalated',
      details: 'Assigned to Senior Investigator Otieno',
      time: '15 minutes ago'
    },
    {
      type: 'success',
      message: 'Fraud blocked: Transaction TXN-2024-002',
      details: 'KES 275,000 prevented from leaving to mule account',
      time: '32 minutes ago'
    },
    {
      type: 'warning',
      message: 'Model drift detected',
      details: 'Retraining scheduled in 2 hours',
      time: '1 hour ago'
    },
    {
      type: 'info',
      message: 'New fraud ring identified',
      details: 'Connected devices: 12 accounts flagged',
      time: '2 hours ago'
    }
  ];

  // Top fraud locations
  topLocations = [
    { city: 'Nairobi', count: 456, riskLevel: 'High' },
    { city: 'Mombasa', count: 234, riskLevel: 'High' },
    { city: 'Kisumu', count: 156, riskLevel: 'Medium' },
    { city: 'International', count: 48, riskLevel: 'Low' },
    { city: 'Nakuru', count: 98, riskLevel: 'Medium' },
    { city: 'Eldoret', count: 67, riskLevel: 'Low' }
  ];

  // Chart Data
  barChartData: ChartData<'bar'> = {
    labels: ['Mobile Money', 'Web/Online', 'ATM', 'Agent'],
    datasets: [{
      data: [0.74, 1.15, 0.52, 0.60],
      label: 'Fraud Risk %',
      backgroundColor: ['#4361ee', '#f72585', '#06d6a0', '#ff9e00'],
      borderRadius: 6
    }]
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#e9ecef' },
        title: { display: true, text: 'Risk Percentage (%)' }
      }
    }
  };

  pieChartData: ChartData<'pie'> = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [342, 942, 2456, 154692],
      backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745']
    }]
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (ctx) => `${ctx.raw} cases` } }
    }
  };

  lineChartData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [245, 312, 278, 425, 389, 456],
        label: 'Fraud Cases',
        borderColor: '#f72585',
        backgroundColor: 'rgba(247, 37, 133, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        data: [1.25, 1.89, 1.56, 2.34, 2.12, 2.67],
        label: 'Amount (M KES)',
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
        fill: true
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Fraud Cases' },
        grid: { color: '#e9ecef' }
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        title: { display: true, text: 'Amount (Millions KES)' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.lastUpdated = new Date();
  }
// Safe method to get pie chart colors
getPieChartColor(index: number): string {
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
  return colors[index] || '#6c757d';
}

// Safe method to get pie chart values
getPieChartValue(index: number): number {
  if (this.pieChartData?.datasets?.[0]?.data && 
      Array.isArray(this.pieChartData.datasets[0].data) && 
      index < this.pieChartData.datasets[0].data.length) {
    return this.pieChartData.datasets[0].data[index] as number;
  }
  return 0;
}

// Also add this safe method for bar chart colors if needed
getBarChartColor(index: number): string {
  const colors = ['#4361ee', '#f72585', '#06d6a0', '#ff9e00'];
  return colors[index] || '#6c757d';
}

  refresh(): void {
  this.isLoading = true;

  setTimeout(() => {
    this.isLoading = false;
    this.lastUpdated = new Date();
  }, 2000);
}

  viewTransaction(transactionId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', transactionId]);
  }

  investigateAlert(alertId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph']);
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
      'Resolved': 'bg-success'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  getActivityIcon(type: string): string {
    const icons = {
      'critical': 'fa-exclamation-circle text-danger',
      'update': 'fa-sync-alt text-primary',
      'success': 'fa-check-circle text-success',
      'warning': 'fa-exclamation-triangle text-warning',
      'info': 'fa-info-circle text-info'
    };
    return icons[type as keyof typeof icons] || 'fa-bell text-secondary';
  }

  getLocationRiskClass(riskLevel: string): string {
    const classes = {
      'High': 'text-danger fw-bold',
      'Medium': 'text-warning',
      'Low': 'text-success'
    };
    return classes[riskLevel as keyof typeof classes] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  exportExcel(): void {
    // Mock export for POC
    alert('Excel export ready in production version');
  }

  exportPDF(): void {
    // Mock export for POC
    alert('PDF export ready in production version');
  }
}