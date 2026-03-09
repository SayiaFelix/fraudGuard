import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription, interval } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
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
  rawData?: any;
}

@Component({
  selector: 'app-view-customer',
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.scss']
})
export class ViewCustomerComponent implements OnInit, OnDestroy {
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
  totalPages: number = 0;

  // Loading state
  isLoading: boolean = true;

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

  // Auto-refresh subscription
  private refreshSubscription?: Subscription;

  constructor(
    private router: Router, 
    private datePipe: DatePipe,
    private httpService: HttpService
  ) {
    this.Math = Math; 
  }

  ngOnInit(): void {
    this.loadFraudHistory();
    
    // Auto-refresh every 10 minutes
    this.refreshSubscription = interval(600000).subscribe(() => {
      this.loadFraudHistory();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

    loadFraudHistory(): void {
    this.isLoading = true;
    
    this.httpService.getFraudHistory(1, 100).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.fraud_transactions) {
          // Map and sort by timestamp (latest first)
          this.allFraudCases = response.fraud_transactions
            .map((tx: any) => this.mapBackendTransaction(tx))
            .sort((a: FraudCase, b: FraudCase) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          
          this.totalRecords = response.pagination?.total || this.allFraudCases.length;
          this.totalPages = response.pagination?.total_pages || 1;
          
          this.applyFilters();
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading fraud history:', error);
        this.isLoading = false;
      }
    });
  }
  
  mapBackendTransaction(tx: any): FraudCase {
    //risk category
    let riskCategory: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    if (tx.risk_category.includes('Critical')) riskCategory = 'Critical';
    else if (tx.risk_category.includes('High')) riskCategory = 'High';
    else if (tx.risk_category.includes('Medium')) riskCategory = 'Medium';
    else if (tx.risk_category.includes('Low')) riskCategory = 'Low';

    //model agreement
    const modelAgreement = tx.transaction_details?.Model_Agreement || '0/7 models flagged';
    const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
    const total = 7;

    //flagged by
    let flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)' = 'AI';
    if (tx.transaction_details?.Rule_Engine?.triggered && flagged > 0) {
      flaggedBy = 'AI + Rules (Hybrid)';
    } else if (tx.transaction_details?.Rule_Engine?.triggered) {
      flaggedBy = 'Rules';
    } else if (flagged > 0) {
      flaggedBy = 'AI';
    }

    //signals for AI explanation
    const signals: string[] = [];
    if (tx.transaction_details?.Rule_Engine?.triggered) {
      tx.transaction_details.Rule_Engine.rules.forEach((rule: string) => {
        signals.push(rule);
      });
    }

    //AI explanation - prioritize final explanation, then rule-based, then construct basic explanation
    let aiExplanation = tx.explanations?.final || tx.explanations?.rule_based || '';
    if (!aiExplanation) {
      aiExplanation = `This transaction was flagged as ${tx.risk_category} with a risk score of ${tx.risk_score}. `;
      if (signals.length > 0) {
        aiExplanation += `Detected signals: ${signals.slice(0, 3).join(', ')}. `;
      }
      aiExplanation += tx.transaction_details?.Model_Agreement || '';
    }

    return {
      id: tx.transaction_id,
      transactionId: tx.transaction_id,
      amount: tx.transaction_details?.Transaction_Amount || 0,
      riskScore: tx.risk_score,
      riskCategory: riskCategory,
      channel: this.determineChannel(tx),
      location: this.determineLocation(tx),
      timestamp: new Date(tx.timestamp),
      status: this.determineStatus(tx),
      flaggedBy: flaggedBy as any,
      customerName:`${tx.customer_info.customer_name || 'Unknown'}`,
      customerId: `${tx.customer_info.customer_id || 'Unknown'}`,
      deviceId: 'Unknown',
      ipAddress: 'Unknown',
      resolution: this.determineResolution(tx),
      aiExplanation: aiExplanation,
      modelAgreement: {
        flagged: flagged,
        total: total
      },
      rawData: tx
    };
  }

  determineChannel(tx: any): any {
    //channel from transaction type
    if (tx.transaction_details?.Transaction_Type) {
      if (tx.transaction_details.Transaction_Type === 'POS') return 'ATM';
      if (tx.transaction_details.Transaction_Type === 'Online') return 'Web';
      if (tx.transaction_details.Transaction_Type === 'Mobile') return 'Mobile';
    }
    return 'Web';
  }

  determineLocation(tx: any): string {
    if (tx.transaction_details?.Transaction_Location === 'International') {
      return 'International';
    }
    return 'Nairobi, KE'; // Default
  }

  determineStatus(tx: any): any {
    //derive status from risk category
    if (tx.risk_category.includes('Critical')) return 'Open';
    if (tx.risk_category.includes('High')) return 'Investigating';
    if (tx.risk_category.includes('Medium')) return 'Resolved';
    return 'False Positive';
  }

  determineResolution(tx: any): any {
    if (tx.risk_category.includes('Medium') || tx.risk_category.includes('Low')) {
      return {
        resolvedBy: 'System',
        resolvedAt: new Date(tx.timestamp),
        notes: 'Transaction reviewed and approved by system.',
        action: tx.risk_category.includes('Medium') ? 'Flagged' : 'Approved'
      };
    }
    return undefined;
  }

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

      // range filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const caseDate = new Date(case_.timestamp);
      caseDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - caseDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (this.dateRange === 'today' && diffDays > 0) {
        return false;
      }
      
      if (this.dateRange === 'week' && diffDays > 7) {
        return false;
      }
      
      if (this.dateRange === 'month' && diffDays > 30) {
        return false;
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

    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed to:', page);
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

  getRiskBadgeClass(riskCategory: string): string {
    const classes: any = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory] || 'bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Resolved': 'bg-success',
      'False Positive': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  getFlaggedByIcon(flaggedBy: string): string {
    const icons: any = {
      'AI': 'fas fa-robot',
      'Rules': 'fas fa-gavel',
      'AI + Rules (Hybrid)': 'fas fa-microchip',
      'Manual': 'fas fa-user'
    };
    return icons[flaggedBy] || 'fas fa-question';
  }

  getChannelIcon(channel: string): string {
    const icons: any = {
      'Mobile': 'fas fa-mobile-alt',
      'Web': 'fas fa-globe',
      'ATM': 'fas fa-credit-card',
      'Agent': 'fas fa-user-tie'
    };
    return icons[channel] || 'fas fa-exchange-alt';
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
    const classes: any = {
      'Blocked': 'bg-danger',
      'Approved': 'bg-success',
      'Flagged': 'bg-warning',
      'Escalated': 'bg-primary'
    };
    return classes[action || ''] || 'bg-secondary';
  }

  exportToPDF(): void {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Fraud History Report', centerX, 15, { align: 'center' });

    // Generated date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const generatedDate = new Date().toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${generatedDate}`, centerX, 22, { align: 'center' });

    // Filters used
    let yPos = 35;
    doc.setFontSize(10);
    doc.setTextColor(52, 73, 94);
    doc.text('Filters Applied ', centerX, yPos, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const filterText = `Risk: ${this.riskFilter === 'all' ? 'All' : this.riskFilter} | Status: ${this.statusFilter === 'all' ? 'All' : this.statusFilter} | Channel: ${this.channelFilter === 'all' ? 'All' : this.channelFilter} | Date Range: ${this.dateRange}`;
    doc.text(filterText, centerX, yPos + 5, { align: 'center' });

    // Stats Summary
    yPos += 15;
    doc.setFontSize(11);
    doc.setTextColor(52, 73, 94);
    doc.text('Summary Statistics', centerX, yPos, { align: 'center' });
    
    const statsData = [
      ['Total Cases', this.stats.total.toString()],
      ['Critical', this.stats.critical.toString()],
      ['High', this.stats.high.toString()],
      ['Open', this.stats.open.toString()],
      ['Investigating', this.stats.investigating.toString()],
      ['Resolved', this.stats.resolved.toString()],
      ['Total Amount', this.formatAmount(this.stats.totalAmount)]
    ];

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: (pageWidth - 140) / 2 }, 
      tableWidth: 140
    });

    //Fraud Cases Table
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(52, 73, 94);
    doc.text('Fraud Cases', centerX, yPos, { align: 'center' });

    const tableData = this.filteredCases.map(case_ => [
      case_.transactionId,
      this.datePipe.transform(case_.timestamp, 'yyyy-MM-dd HH:mm') || '',
      this.formatAmount(case_.amount),
      case_.riskCategory,
      `${case_.riskScore}/10`,
      case_.status,
      case_.flaggedBy
    ]);

    //total table width
    const columnWidths = [40, 35, 30, 20, 15, 25, 25];
    const totalTableWidth = columnWidths.reduce((a, b) => a + b, 0);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Transaction ID', 'Date/Time', 'Amount', 'Risk', 'Score', 'Status', 'Flagged By']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 25, halign: 'left' }
      },
      margin: { left: (pageWidth - totalTableWidth) / 2 }, 
      tableWidth: totalTableWidth
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        centerX,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    const fileName = `fraud-history-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    alert('PDF report downloaded successfully!');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

  exportData(): void {
    const exportFormat = confirm('Click OK for PDF export, Cancel for JSON export');
    
    if (exportFormat) {
      this.exportToPDF();
    } else {
      //JSON export
      const exportData = {
        generatedAt: new Date().toISOString(),
        filters: {
          riskFilter: this.riskFilter,
          statusFilter: this.statusFilter,
          channelFilter: this.channelFilter,
          dateRange: this.dateRange,
          searchTerm: this.searchTerm
        },
        stats: this.stats,
        cases: this.filteredCases
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `fraud-history-${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('Fraud history data exported as JSON!');
    }
  }

}