import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FincaService } from 'src/app/shared/services/finca.service';
import { HttpService } from 'src/app/shared/services/http.service';

@Component({
  selector: 'app-finca-alerts',
  templateUrl: './finca-alerts.component.html',
  styleUrls: ['./finca-alerts.component.scss']
})
export class FincaAlertsComponent implements OnInit, OnDestroy {
  alerts: any[] = [];
  filteredAlerts: any[] = [];
  selected: any = null;
  loading = false;
  lastRefreshed: Date = new Date();

  page = 1;
  size = 50;

  filterStatus = '';
  filterRisk = '';
  filterDecision = '';
  searchText = '';
  sortBy = 'newest';
  inboxView = 'all';

  activeDetailTab = 'overview';
  customerProfile: any = null;
  transactionDetail: any = null;
  relatedTransactions: any[] = [];
  loadingDetail = false;
  showCustomerModal = false;

  assignAnalyst = '';
  snoozeDuration = '1h';
  dismissReason = '';

  analysts = ['Analyst', 'Senior Analyst', 'Fraud Investigator', 'Compliance Officer'];

  detailTabs = [
    { id: 'overview', label: 'Overview', icon: 'fa-home' },
    { id: 'transaction', label: 'Transaction', icon: 'fa-exchange-alt' },
    { id: 'customer', label: 'Customer', icon: 'fa-user' },
    { id: 'rules', label: 'Rules', icon: 'fa-shield-alt' },
    { id: 'actions', label: 'Actions', icon: 'fa-bolt' }
  ];

  statCards: any[] = [];
  dashboardMetrics: any = null;
  selectedIds = new Set<string>();
  bulkMode = false;
  notificationsEnabled = false;
  private pollInterval: any;
  private previousAlertCount = 0;
  private selectedIndex = -1;

  constructor(private finca: HttpService, private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.load();
    this.loadDashboard();
    this.requestNotificationPermission();
    this.pollInterval = setInterval(() => this.load(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  normalizeScore(score: any): number {
    if (score === null || score === undefined) return 0;
    const n = Number(score);
    if (isNaN(n)) return 0;
    if (n <= 10) return Math.round(n * 10);
    return Math.round(n);
  }

  load(silent = false): void {
    if (!silent) this.loading = true;
    this.finca.listAlerts(this.page, this.size).subscribe({
      next: (res) => {
        this.alerts = (res.alerts || []).map((a: any) => ({
          ...a,
          display_score: this.normalizeScore(a.risk_score),
          read: a.read || false
        }));
        if (this.alerts.length === 0 && !silent) {
          this.finca.getFraudHistory(this.page, this.size).subscribe({
            next: (hres) => {
              this.alerts = (hres.fraud_transactions || []).map((a: any) => ({
                ...a,
                id: a.id || a.transaction_id,
                transaction_id: a.transaction_id,
                display_score: this.normalizeScore(a.risk_score),
                read: false,
                status: a.status || 'NEW'
              }));
              this.finishLoad();
            },
            error: () => this.finishLoad()
          });
        } else {
          this.finishLoad();
        }
      },
      error: () => {
        this.alerts = [];
        this.finishLoad();
      }
    });
  }

  finishLoad(): void {
    const newCount = this.alerts.filter(a => a.status === 'NEW').length;
    if (this.previousAlertCount > 0 && newCount > this.previousAlertCount) {
      const diff = newCount - this.previousAlertCount;
      this.toastr.warning(`${diff} new alert(s) received`, 'Inbox');
      this.notifyDesktop(`${diff} new fraud alert(s)`);
    }
    this.previousAlertCount = newCount;
    this.lastRefreshed = new Date();
    this.computeStats();
    this.applyFilters();
    this.loading = false;
    // ensure alerts persisted locally for offline visibility
    this.finca.saveAlerts(this.alerts).subscribe({ next: () => {}, error: () => {} });
  }

  computeStats(): void {
    const newCount = this.alerts.filter(a => a.status === 'NEW').length;
    const assigned = this.alerts.filter(a => a.status === 'ASSIGNED').length;
    const critical = this.alerts.filter(a => (a.final_risk_level || a.ml_risk_level) === 'CRITICAL').length;
    const high = this.alerts.filter(a => (a.final_risk_level || a.ml_risk_level) === 'HIGH').length;
    const unread = this.alerts.filter(a => !a.read).length;

    this.statCards = [
      { label: 'New', value: newCount, bgClass: 'bg-danger bg-opacity-10', textClass: 'text-danger' },
      { label: 'Assigned', value: assigned, bgClass: 'bg-primary bg-opacity-10', textClass: 'text-primary' },
      { label: 'Critical', value: critical, bgClass: 'bg-danger bg-opacity-10', textClass: 'text-danger' },
      // { label: 'High Risk', value: high, bgClass: 'bg-warning bg-opacity-10', textClass: 'text-warning' },
      // { label: 'Unread', value: unread, bgClass: 'bg-info bg-opacity-10', textClass: 'text-info' },
      { label: 'Total', value: this.alerts.length, bgClass: 'bg-secondary bg-opacity-10', textClass: 'text-secondary' }
    ];
  }

  applyFilters(): void {
    let list = [...this.alerts];
    const q = (this.searchText || '').toLowerCase();

    if (q) {
      list = list.filter(a =>
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.transaction_id && a.transaction_id.toLowerCase().includes(q)) ||
        (a.customer_id && a.customer_id.toLowerCase().includes(q))
      );
    }
    if (this.filterStatus) list = list.filter(a => a.status === this.filterStatus);
    if (this.filterRisk) list = list.filter(a => (a.final_risk_level || a.ml_risk_level) === this.filterRisk);
    if (this.filterDecision) list = list.filter(a => a.decision === this.filterDecision);

    if (this.inboxView === 'new') list = list.filter(a => a.status === 'NEW');
    if (this.inboxView === 'critical') list = list.filter(a => (a.final_risk_level || a.ml_risk_level) === 'CRITICAL');
    if (this.inboxView === 'unread') list = list.filter(a => !a.read);
    if (this.inboxView === 'assigned') list = list.filter(a => a.status === 'ASSIGNED');

    list.sort((a, b) => {
      if (this.sortBy === 'oldest') return (a.created_at || '').localeCompare(b.created_at || '');
      if (this.sortBy === 'risk') return (b.display_score || 0) - (a.display_score || 0);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    this.filteredAlerts = list;
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterStatus = '';
    this.filterRisk = '';
    this.filterDecision = '';
    this.inboxView = 'all';
    this.applyFilters();
  }

  open(alert: any): void {
    this.selected = alert;
    alert.read = true;
    this.selectedIndex = this.filteredAlerts.findIndex(a => a.id === alert.id);
    this.activeDetailTab = 'overview';
    this.customerProfile = null;
    this.transactionDetail = null;
    this.relatedTransactions = [];
    this.loadAlertDetail(alert);
    // persist read status via service (falls back to local storage)
    this.finca.markAlertRead(alert.id).subscribe({ next: () => {}, error: () => {} });
    this.computeStats();
    this.applyFilters();
  }

  loadAlertDetail(alert: any): void {
    this.loadingDetail = true;
    const txnId = alert.transaction_id;
    if (!txnId) { this.loadingDetail = false; return; }

    this.finca.getTransaction(txnId).subscribe({
      next: (res) => {
        this.transactionDetail = res;
        this.customerProfile = res?.customer_info || null;
        this.loadingDetail = false;
      },
      error: () => { this.loadingDetail = false; }
    });

    this.finca.getRelatedTransactions(txnId).subscribe({
      next: (r) => { this.relatedTransactions = r.related_transactions || []; },
      error: () => { this.relatedTransactions = []; }
    });
  }

  close(): void {
    this.selected = null;
    this.customerProfile = null;
    this.transactionDetail = null;
  }

  refresh(): void { this.load(); }

  markAllRead(): void {
    this.alerts.forEach(a => a.read = true);
    this.computeStats();
    this.applyFilters();
    this.toastr.success('All alerts marked as read', 'Inbox');
  }

  toggleBulkMode(): void {
    this.bulkMode = !this.bulkMode;
    if (!this.bulkMode) this.selectedIds.clear();
  }

  toggleSelect(alert: any, event: Event): void {
    event.stopPropagation();
    if (this.selectedIds.has(alert.id)) this.selectedIds.delete(alert.id);
    else this.selectedIds.add(alert.id);
  }

  toggleSelectAll(): void {
    if (this.selectedIds.size === this.filteredAlerts.length) {
      this.selectedIds.clear();
    } else {
      this.filteredAlerts.forEach(a => this.selectedIds.add(a.id));
    }
  }

  bulkAssign(): void {
    const name = this.assignAnalyst || prompt('Assign to analyst:', 'Analyst');
    if (!name) return;
    let count = 0;
    this.filteredAlerts.filter(a => this.selectedIds.has(a.id)).forEach(a => {
      this.finca.assignAlert(a.id, name).subscribe({
        next: () => { a.assigned_to = name; a.status = 'ASSIGNED'; count++; },
        error: () => { a.assigned_to = name; a.status = 'ASSIGNED'; count++; }
      });
    });
    this.toastr.success(`Assigned ${this.selectedIds.size} alert(s) to ${name}`, 'Bulk Action');
    this.selectedIds.clear();
    this.bulkMode = false;
    this.computeStats();
    this.applyFilters();
  }

  bulkDismiss(): void {
    const reason = this.dismissReason || 'Bulk dismissed';
    this.filteredAlerts.filter(a => this.selectedIds.has(a.id)).forEach(a => {
      a.status = 'DISMISSED';
      a.dismiss_reason = reason;
    });
    this.finca.saveAlerts(this.alerts).subscribe();
    this.toastr.info(`Dismissed ${this.selectedIds.size} alert(s)`, 'Bulk Action');
    this.selectedIds.clear();
    this.bulkMode = false;
    this.computeStats();
    this.applyFilters();
  }

  bulkMarkRead(): void {
    this.filteredAlerts.filter(a => this.selectedIds.has(a.id)).forEach(a => a.read = true);
    this.finca.saveAlerts(this.alerts).subscribe();
    this.toastr.success(`Marked ${this.selectedIds.size} alert(s) as read`, 'Bulk Action');
    this.selectedIds.clear();
    this.computeStats();
    this.applyFilters();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
    if (event.key === 'j' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredAlerts.length - 1);
      if (this.filteredAlerts[this.selectedIndex]) this.open(this.filteredAlerts[this.selectedIndex]);
    }
    if (event.key === 'k' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      if (this.filteredAlerts[this.selectedIndex]) this.open(this.filteredAlerts[this.selectedIndex]);
    }
    if (event.key === 'r' && !event.ctrlKey) { this.refresh(); }
    if (event.key === 'Escape') { this.close(); }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { this.notificationsEnabled = p === 'granted'; });
    } else if ('Notification' in window) {
      this.notificationsEnabled = Notification.permission === 'granted';
    }
  }

  notifyDesktop(message: string): void {
    if (this.notificationsEnabled && 'Notification' in window) {
      new Notification('FINCA Alert Inbox', { body: message, icon: '/favicon.ico' });
    }
  }

  loadDashboard(): void {
    this.finca.getDashboard().subscribe({
      next: (r) => { this.dashboardMetrics = r.metrics || r; },
      error: () => { this.dashboardMetrics = null; }
    });
  }

  assign(alert?: any): void {
    const target = alert || this.selected;
    if (!target) return;
    const name = this.assignAnalyst || prompt('Assign to analyst:', 'Analyst');
    if (!name) return;
    this.finca.assignAlert(target.id, name).subscribe({
      next: (r) => {
        target.assigned_to = name;
        target.status = 'ASSIGNED';
        target.assigned_at = r?.alert?.assigned_at || new Date().toISOString();
        this.computeStats();
        this.applyFilters();
        this.toastr.success(`Assigned to ${name}`, 'Alert');
      },
      error: () => {
        target.assigned_to = name;
        target.status = 'ASSIGNED';
        this.toastr.info(`Assigned to ${name} (offline)`, 'Alert');
      }
    });
  }

  createCase(): void {
    if (!this.selected) return;
    this.router.navigate(['/fraudsentinelAi/transaction_management/case-management']);
  }

  investigate(): void {
    if (!this.selected) return;
    const id = this.selected.transaction_id || this.selected.id;
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', id]);
  }

  viewTransactionDetail(): void {
    if (!this.selected?.transaction_id) return;
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', this.selected.transaction_id]);
  }

  viewRelatedTransaction(txnId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', txnId]);
  }

  openCustomerProfile(): void {
    this.showCustomerModal = true;
  }

  viewCustomerTransactions(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/transactions']);
  }

  dismissAlert(): void {
    if (!this.selected) return;
    const reason = this.dismissReason || prompt('Dismiss reason:', 'False positive');
    if (!reason) return;
    this.selected.status = 'DISMISSED';
    this.selected.dismiss_reason = reason;
    this.finca.saveAlerts(this.alerts).subscribe();
    this.computeStats();
    this.applyFilters();
    this.close();
    this.toastr.info('Alert dismissed', 'Inbox');
  }

  snoozeAlert(): void {
    if (!this.selected) return;
    this.selected.status = 'SNOOZED';
    this.selected.snoozed_until = new Date(Date.now() + 3600000).toISOString();
    this.finca.saveAlerts(this.alerts).subscribe();
    this.computeStats();
    this.applyFilters();
    this.toastr.info('Alert snoozed for 1 hour', 'Inbox');
  }

  escalateAlert(): void {
    if (!this.selected) return;
    this.selected.priority = 'URGENT';
    this.selected.status = 'ESCALATED';
    this.finca.saveAlerts(this.alerts).subscribe();
    this.computeStats();
    this.applyFilters();
    this.toastr.warning('Alert escalated', 'Escalation');
  }

  flagForReview(): void {
    if (!this.selected) return;
    this.selected.flagged = true;
    this.finca.saveAlerts(this.alerts).subscribe();
    this.toastr.info('Alert flagged for review', 'Flag');
  }

  blockTransaction(): void {
    if (!this.selected || !confirm('Block this transaction?')) return;
    this.selected.decision = 'BLOCK';
    this.selected.status = 'BLOCKED';
    if (this.selected.transaction_id) {
      this.finca.updateTransactionStatus(this.selected.transaction_id, 'Resolved', 'Blocked by analyst').subscribe({
        next: () => this.toastr.error('Transaction blocked', 'Action'),
        error: () => this.toastr.error('Transaction blocked (offline)', 'Action')
      });
      this.finca.saveAlerts(this.alerts).subscribe();
    }
  }

  sendChallenge(): void {
    if (!this.selected) return;
    this.selected.decision = 'CHALLENGE';
    this.finca.saveAlerts(this.alerts).subscribe();
    this.toastr.info('Challenge sent to customer', 'Action');
  }

  confirmFraud(): void {
    if (!this.selected?.transaction_id) return;
    this.finca.submitFraudFeedback(this.selected.transaction_id, 'confirmed_fraud').subscribe({
      next: () => this.toastr.error('Fraud confirmed via feedback API', 'Feedback'),
      error: () => this.toastr.error('Fraud confirmed (offline)', 'Feedback')
    });
  }

  confirmFalsePositive(): void {
    if (!this.selected?.transaction_id) return;
    this.finca.submitFraudFeedback(this.selected.transaction_id, 'false_positive').subscribe({
      next: () => { this.dismissAlert(); this.toastr.success('Marked as false positive', 'Feedback'); },
      error: () => this.toastr.success('Marked as false positive (offline)', 'Feedback')
    });
  }

  exportAlert(): void { this.downloadCsv(this.filteredAlerts, 'alerts'); }

  downloadCsv(rows: any[], filename: string): void {
    if (!rows.length) { this.toastr.warning('Nothing to export', 'Export'); return; }
    const headers = ['id', 'transaction_id', 'customer_id', 'status', 'final_risk_level', 'risk_score', 'decision', 'assigned_to', 'created_at'];
    const csv = [headers.join(',')].concat(
      rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    this.toastr.success(`Exported ${rows.length} rows`, 'CSV');
  }

  getRiskBadge(level: string): string {
    const map: any = { CRITICAL: 'bg-danger', HIGH: 'bg-warning text-dark', MEDIUM: 'bg-info text-dark', LOW: 'bg-success' };
    return map[level] || 'bg-secondary';
  }

  getStatusBadge(status: string): string {
    const map: any = { NEW: 'bg-danger', ASSIGNED: 'bg-primary', DISMISSED: 'bg-secondary', SNOOZED: 'bg-warning text-dark', ESCALATED: 'bg-danger', BLOCKED: 'bg-dark' };
    return map[status] || 'bg-secondary';
  }

  getRiskBarColor(score: number): string {
    if (score >= 80) return '#dc3545';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#0dcaf0';
    return '#198754';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(/[\s_-]+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  formatAmount(amount: any): string {
    const n = Number(amount);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
