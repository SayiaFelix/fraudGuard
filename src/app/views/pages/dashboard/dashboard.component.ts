import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpService, ModelMetrics, Transaction } from 'src/app/shared/services/http.service';

interface KPI {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'flat';
  description: string;
}

interface TransactionAlert {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;
  riskCategory: string; 
  channel: string;
  location: string;
  timestamp: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  flaggedBy: 'AI' | 'Rules' | 'Manual';
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
  
  // Real data from API
  transactions: Transaction[] = [];
  fraudTransactions: Transaction[] = [];
  modelMetrics: ModelMetrics | null = null;
  auditLogs: any[] = [];
  
  // Auto-refresh subscription
  private refreshSubscription?: Subscription;
  
  // KPIs 
  kpis: KPI[] = [
    {
      label: 'Total Transactions',
      value: '0',
      icon: 'fas fa-exchange-alt',
      color: '#4361ee',
      trend: 'flat',
      description: 'Last 24 hours'
    },
    {
      label: 'High Risk Alerts',
      value: '0',
      icon: 'fas fa-exclamation-triangle',
      color: '#f72585',
      trend: 'flat',
      description: 'Critical + High'
    },
    {
      label: 'Fraud Blocked',
      value: 'KES 0',
      icon: 'fas fa-shield-alt',
      color: '#06d6a0',
      trend: 'flat',
      description: 'Prevented losses'
    },
    {
      label: 'AI Confidence',
      value: '0%',
      icon: 'fas fa-brain',
      color: '#4cc9f0',
      trend: 'flat',
      description: 'Model accuracy'
    }
  ];
  recentAlerts: TransactionAlert[] = [];

  fraudTrends: any[] = [];

  channelRisk: ChannelRisk[] = [
    { channel: 'Mobile Money', transactions: 0, fraudCases: 0, riskPercentage: 0 },
    { channel: 'Web/Online', transactions: 0, fraudCases: 0, riskPercentage: 0 },
    { channel: 'ATM', transactions: 0, fraudCases: 0, riskPercentage: 0 },
    { channel: 'Agent', transactions: 0, fraudCases: 0, riskPercentage: 0 }
  ];

  riskDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  recentActivities: any[] = [];

  topLocations: any[] = [];

  barChartData: ChartData<'bar'> = {
    labels: ['Mobile Money', 'Web/Online', 'ATM', 'Agent'],
    datasets: [{
      data: [0, 0, 0, 0],
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
      data: [0, 0, 0, 0],
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
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Fraud Cases',
        borderColor: '#f72585',
        backgroundColor: 'rgba(247, 37, 133, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        data: [],
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
  }

    constructor(
    private router: Router,
    private fraudService: HttpService
  ) {}

  ngOnInit(): void {
  this.loadDashboardData();
  this.loadTransactions();
  
  setTimeout(() => {
    if (this.isLoading) {
      console.log('Safety timeout - forcing loader off');
      this.isLoading = false;
    }
  }, 10000);
  
  this.refreshSubscription = interval(60000).subscribe(() => {
    this.refresh();
  });
}
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadDashboardData(): void {
  console.log('Loading dashboard data...');
  this.isLoading = true;
  
  Promise.all([
    this.loadTransactions(),
    this.loadFraudHistory(),
    this.loadModelMetrics(),
    this.loadAuditLog()
  ]).then(() => {
    console.log('All data loaded successfully');
    this.isLoading = false;
    this.lastUpdated = new Date();
  }).catch((error) => {
    console.error('Error loading data:', error);
    this.isLoading = false;
    this.lastUpdated = new Date();
  });
}

loadTransactions(): Promise<void> {
  return new Promise((resolve) => {
    this.fraudService.getTransactions(1, 100).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.transactions) {
   
          this.transactions = response.transactions.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          console.log('Transactions loaded (latest first):', this.transactions);
          this.updateKPIs();
          this.updateRecentAlerts();
          this.calculateChannelRisk();
          // this.updateCharts(); //
        }
        resolve();
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        resolve(); 
      }
    });
  });
}

updateRecentAlerts(): void {
  
  const highRiskTransactions = this.transactions.filter(t => 
    t.risk_category === 'High Potential Fraud' || 
    t.risk_category === 'Critical Fraud Risk'
  );
  
  console.log(`Found ${highRiskTransactions.length} high/critical risk transactions`);
  
  const sortedHighRisk = highRiskTransactions.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  sortedHighRisk.slice(0, 5).forEach(t => {
    console.log(`${t.transaction_id}: ${t.timestamp} - ${t.risk_category}`);
  });
  
  this.recentAlerts = sortedHighRisk.slice(0, 5).map(t => {
    return {
      id: t.transaction_id,
      transactionId: t.transaction_id,
      amount: t.transaction_details?.Transaction_Amount || 0,
      riskScore: t.risk_score,
      riskCategory: t.risk_category,
      channel: 'Web',
      location: 'Nairobi, KE',
      timestamp: t.timestamp,
      status: 'Open',
      flaggedBy: 'AI'
    };
  });
  
  console.log('High-risk alerts with original categories:', this.recentAlerts);
}

loadFraudHistory(): Promise<void> {
  return new Promise((resolve) => {
    this.fraudService.getFraudHistory(1, 100).subscribe({
      next: (response) => {
        console.log('Fraud history loaded:', response);
        if (response.status === 'success' && response.fraud_transactions) {
          this.fraudTransactions = response.fraud_transactions;
          this.updateRiskDistribution();
          this.updateLineChart();
        }
        resolve();
      },
      error: (error) => {
        console.error('Error loading fraud history:', error);
        resolve(); 
      }
    });
  });
}

loadModelMetrics(): Promise<void> {
  return new Promise((resolve) => {
    this.fraudService.getModelMetrics().subscribe({
      next: (response) => {
        console.log('Model metrics loaded:', response);
        if (response.status === 'success') {
          this.modelMetrics = response;
          this.updateKPIs();
        }
        resolve();
      },
      error: (error) => {
        console.error('Error loading model metrics:', error);
        resolve(); 
      }
    });
  });
}

loadAuditLog(): Promise<void> {
  return new Promise((resolve) => {
    this.fraudService.getAuditLog().subscribe({
      next: (response) => {
        console.log('Audit log loaded:', response);
        
        if (response.status === 'success' && response.logs) {
          this.auditLogs = response.logs;
        
          const sortedLogs = response.logs.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
        
          this.recentActivities = sortedLogs.slice(0, 5).map(log => {
         
            let type = 'info';
            let icon = 'fa-info-circle';
            
            if (log.risk_score >= 7) {
              type = 'critical';
              icon = 'fa-exclamation-circle';
            } else if (log.risk_score >= 5) {
              type = 'warning';
              icon = 'fa-exclamation-triangle';
            } else if (log.risk_score >= 3) {
              type = 'info';
              icon = 'fa-info-circle';
            } else {
              type = 'success';
              icon = 'fa-check-circle';
            }
            
            const logTime = new Date(log.timestamp);
            const now = new Date();
            const diffMs = now.getTime() - logTime.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            let timeAgo = '';
            if (diffMins < 1) timeAgo = 'Just now';
            else if (diffMins < 60) timeAgo = `${diffMins} minutes ago`;
            else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
            else timeAgo = `${Math.floor(diffMins / 1440)} days ago`;
            
            return {
              type: type,
              message: `Transaction ${log.transaction_id} - ${log.risk_category}`,
              details: `Score: ${log.risk_score}/10 - ${log.recommended_action}`,
              time: timeAgo
            };
          });
          
          // this.updateLocationsFromAuditLogs(sortedLogs);
        }
        resolve();
      },
      error: (error) => {
        console.error('Error loading audit log:', error);
        resolve();
      }
    });
  });
}




  updateKPIs(): void {
    this.kpis[0].value = this.transactions.length.toLocaleString();
    
    const highRiskCount = this.fraudTransactions.length;
    this.kpis[1].value = highRiskCount.toLocaleString();
    
    // Fraud Blocked
    const totalBlocked = this.fraudTransactions.reduce((sum, tx) => 
      sum + (tx.transaction_details?.Transaction_Amount || 0), 0);
    this.kpis[2].value = `KES ${(totalBlocked / 1000000).toFixed(1)}M`;
    
    if (this.modelMetrics?.metrics?.['Random Forest']) {
      const accuracy = this.modelMetrics.metrics['Random Forest'].accuracy * 100;
      this.kpis[3].value = `${accuracy.toFixed(0)}%`;
      
      if (accuracy > 94) {
        this.kpis[3].trend = 'up';
      } else if (accuracy < 90) {
        this.kpis[3].trend = 'down';
      } else {
        this.kpis[3].trend = 'flat';
      }
    }
  }

  updateRiskDistribution(): void {
    this.riskDistribution = {
      critical: this.fraudTransactions.filter(tx => tx.risk_category === 'Critical Fraud Risk').length,
      high: this.fraudTransactions.filter(tx => tx.risk_category === 'High Potential Fraud').length,
      medium: this.transactions.filter(tx => tx.risk_category === 'Medium Risk').length,
      low: this.transactions.filter(tx => tx.risk_category === 'Low Potential Fraud').length
    };
    
    this.pieChartData.datasets[0].data = [
      this.riskDistribution.critical,
      this.riskDistribution.high,
      this.riskDistribution.medium,
      this.riskDistribution.low
    ];
  }

  updateLineChart(): void {

    const monthlyData = new Map<string, { count: number; amount: number }>();
 
    this.fraudTransactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { count: 0, amount: 0 });
      }
      const data = monthlyData.get(month)!;
      data.count++;
      data.amount += tx.transaction_details?.Transaction_Amount || 0;
    });
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    this.lineChartData.labels = last6Months;
    this.lineChartData.datasets[0].data = last6Months.map(month => 
      monthlyData.get(month)?.count || 0
    );
    this.lineChartData.datasets[1].data = last6Months.map(month => 
      (monthlyData.get(month)?.amount || 0) / 1000000 
    );
  }

  calculateChannelRisk(): void {
    const channelMap = new Map<string, { total: number; fraud: number }>();
    
    this.transactions.forEach(tx => {
      let channel = 'Web/Online'; // Default
      if (tx.transaction_details?.Model_Agreement) {
  
      }
      
      if (!channelMap.has(channel)) {
        channelMap.set(channel, { total: 0, fraud: 0 });
      }
      const data = channelMap.get(channel)!;
      data.total++;
      
      if (tx.risk_category === 'Critical Fraud Risk' || tx.risk_category === 'High Potential Fraud') {
        data.fraud++;
      }
    });
    
    const channels = ['Mobile Money', 'Web/Online', 'ATM', 'Agent'];
    this.channelRisk = channels.map(channel => {
      const data = channelMap.get(channel) || { total: 0, fraud: 0 };
      return {
        channel,
        transactions: data.total,
        fraudCases: data.fraud,
        riskPercentage: data.total > 0 ? (data.fraud / data.total) * 100 : 0
      };
    });

    this.barChartData.datasets[0].data = this.channelRisk.map(cr => 
      Number(cr.riskPercentage.toFixed(2))
    );
  }

  updateRecentActivities(): void {
    this.recentActivities = this.auditLogs.slice(0, 5).map(log => {
     
      let type = 'info';
      if (log.risk_score >= 7) type = 'critical';
      else if (log.risk_score >= 5) type = 'warning';
      else if (log.risk_score >= 3) type = 'info';
      else type = 'success';
      
      const logTime = new Date(log.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - logTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      let timeAgo = '';
      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins} minutes ago`;
      else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
      else timeAgo = `${Math.floor(diffMins / 1440)} days ago`;
      
      return {
        type,
        message: `Transaction ${log.transaction_id} flagged as ${log.risk_category}`,
        details: `Risk score: ${log.risk_score}/10 - ${log.recommended_action}`,
        time: timeAgo
      };
    });
  }

  calculateLocations(): void {
    const locations = [
      { city: 'Nairobi', count: 0, riskLevel: 'Low' },
      { city: 'Mombasa', count: 0, riskLevel: 'Low' },
      { city: 'Kisumu', count: 0, riskLevel: 'Low' },
      { city: 'International', count: 0, riskLevel: 'Low' }
    ];
    
    this.fraudTransactions.forEach(tx => {
  
    });
    
    this.topLocations = locations.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  refresh(): void {
    this.loadDashboardData();
  }

  viewTransaction(transactionId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', transactionId]);
  }

  investigateAlert(alertId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph']);
  }

  getRiskBadgeClass(riskCategory: string): string {
  if (riskCategory.includes('Critical')) {
    return 'bg-danger';
  } else if (riskCategory.includes('High')) {
    return 'bg-warning text-dark';
  } else if (riskCategory.includes('Medium')) {
    return 'bg-info';
  } else if (riskCategory.includes('Low')) {
    return 'bg-success';
  }
  return 'bg-secondary';
}

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Resolved': 'bg-success'
    };
    return classes[status] || 'bg-secondary';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'critical': 'fa-exclamation-circle text-danger',
      'update': 'fa-sync-alt text-primary',
      'success': 'fa-check-circle text-success',
      'warning': 'fa-exclamation-triangle text-warning',
      'info': 'fa-info-circle text-info'
    };
    return icons[type] || 'fa-bell text-secondary';
  }

  getLocationRiskClass(riskLevel: string): string {
    const classes: { [key: string]: string } = {
      'High': 'text-danger fw-bold',
      'Medium': 'text-warning',
      'Low': 'text-success'
    };
    return classes[riskLevel] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getPieChartColor(index: number): string {
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
    return colors[index] || '#6c757d';
  }

  getPieChartValue(index: number): number {
    if (this.pieChartData?.datasets?.[0]?.data && 
        Array.isArray(this.pieChartData.datasets[0].data) && 
        index < this.pieChartData.datasets[0].data.length) {
      return this.pieChartData.datasets[0].data[index] as number;
    }
    return 0;
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