import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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

  Math: Math;
  page = 1;
  size = 1000;

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
  showSnoozeOptions = false;
  showDismissOptions = false;

  analysts = ['Analyst', 'Senior Analyst', 'Fraud Investigator', 'Compliance Officer'];

  detailTabs = [
    { id: 'overview', label: 'Overview', icon: 'fa-home' },
    { id: 'customer', label: 'Customer', icon: 'fa-user' },
    { id: 'transaction', label: 'Transaction', icon: 'fa-exchange-alt' },
    { id: 'rules', label: 'Rules', icon: 'fa-shield-alt' }
  ];

  statCards: any[] = [];
  dashboardMetrics: any = null;
  selectedIds = new Set<string>();
  bulkMode = false;
  notificationsEnabled = false;
  private pollInterval: any;
  private previousAlertCount = 0;
  private selectedIndex = -1;

  relatedLoading = false;
  relatedPage = 1;
  relatedPageSize = 5;

  constructor(private finca: HttpService, private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.load();
    this.loadDashboard();
    this.requestNotificationPermission();
    this.pollInterval = setInterval(() => this.load(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadAlertDetail(alert: any): void {
    this.loadingDetail = true;
    const txnId = alert.transaction_id;
    if (!txnId) {
      this.loadingDetail = false;
      return;
    }

    // Load transaction details
    this.finca.getTransaction(txnId).subscribe({
      next: (res) => {
        this.transactionDetail = this.transformTransactionData(res);
        this.customerProfile = res?.customer_info || null;
        this.loadingDetail = false;
        this.cdr.detectChanges(); // ✅ Force update
      },
      error: () => {
        this.loadingDetail = false;
        this.cdr.detectChanges();
      }
    });

    // ✅ Load related transactions
    this.relatedLoading = true;
    this.relatedTransactions = []; // ✅ Clear previous data
    this.cdr.detectChanges(); // ✅ Force update to show loading state

    this.finca.getRelatedTransactions(txnId).subscribe({
      next: (r) => {
        this.relatedTransactions = r.related_transactions || [];
        this.relatedLoading = false;
        this.relatedPage = 1;
        this.cdr.detectChanges(); // ✅ Force update to show data

        console.log('✅ Related transactions loaded:', this.relatedTransactions.length);
      },
      error: (err) => {
        this.relatedTransactions = [];
        this.relatedLoading = false;
        this.relatedPage = 1;
        this.cdr.detectChanges(); // ✅ Force update
        console.error('❌ Error loading related transactions:', err);
      }
    });
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
    this.finca.saveAlerts(this.alerts).subscribe({ next: () => { }, error: () => { } });
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

  // ===== GET FINAL EXPLANATION =====
  getFinalExplanation(): string {
    if (!this.selected) return '';

    // Check if explanations exist
    const explanations = this.selected.explanations || this.transactionDetail?.explanations;

    if (!explanations) return '';

    // Priority: final > llm > rule_based
    return explanations.final || explanations.llm || explanations.rule_based || '';
  }

  // ===== GET RISK BADGE CLASS (for rule badges) =====
  getRuleBadgeClass(rule: string): string {
    const map: any = {
      'NEW_DEVICE': 'bg-danger',
      'LOCATION_ANOMALY': 'bg-danger',
      'AMOUNT_ANOMALY': 'bg-warning text-dark',
      'VELOCITY_ANOMALY': 'bg-warning text-dark',
      'UNUSUAL_TIME': 'bg-info',
      'WEEKEND_TXN': 'bg-info',
      'HIGH_FREQUENCY': 'bg-warning text-dark',
      'INTERNATIONAL_TXN': 'bg-danger'
    };
    return map[rule] || 'bg-secondary';
  }

  getRiskBadgeClass(level: string): string {
    const map: any = {
      'CRITICAL': 'bg-danger',
      'HIGH': 'bg-warning text-dark',
      'MEDIUM': 'bg-info text-dark',
      'LOW': 'bg-success'
    };
    return map[level] || 'bg-secondary';
  }

  get relatedTotalPages(): number {
    return Math.ceil(this.relatedTransactions.length / this.relatedPageSize);
  }

  get paginatedRelatedAlerts(): any[] {
    const start = (this.relatedPage - 1) * this.relatedPageSize;
    return this.relatedTransactions.slice(start, start + this.relatedPageSize);
  }

  transformTransactionData(data: any): any {
    if (!data) return null;

    return {
      ...data,
      transaction_details: {
        transaction_id: data.transaction_id,
        Transaction_Amount: data.transaction_details?.Transaction_Amount || data.transaction_details?.transaction_amount,
        channel: data.transaction_details?.finca_channel || data.transaction_details?.channel,
        device_type: data.transaction_details?.finca_device_type || data.transaction_details?.device_type,
        location: data.transaction_details?.finca_location || data.transaction_details?.location,
        final_risk_level: data.transaction_details?.final_risk_level || data.risk_assessment?.risk_category,
        ml_risk_score: data.transaction_details?.ml_risk_score || data.risk_assessment?.risk_score,
        finca_total_rule_points: data.transaction_details?.finca_total_rule_points,
        finca_capped_rule_points: data.transaction_details?.finca_capped_rule_points,
        finca_rule_count: data.transaction_details?.finca_rule_count,
        finca_final_decision: data.transaction_details?.finca_final_decision,
        finca_rules_triggered: data.transaction_details?.finca_rules_triggered || [],
        ...data.transaction_details
      },
      risk_assessment: data.risk_assessment || {
        risk_score: data.transaction_details?.ml_risk_score || data.risk_score,
        risk_category: data.transaction_details?.final_risk_level || data.risk_category
      }
    };
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
    this.showSnoozeOptions = false;
    this.showDismissOptions = false;
    alert.read = true;
    this.selectedIndex = this.filteredAlerts.findIndex(a => a.id === alert.id);
    this.activeDetailTab = 'overview';
    this.customerProfile = null;
    this.transactionDetail = null;
    this.relatedTransactions = [];
    this.loadAlertDetail(alert);

    this.finca.markAlertRead(alert.id).subscribe({ next: () => { }, error: () => { } });
    this.computeStats();
    this.applyFilters();
  }
  close(): void {
    this.selected = null;
    this.customerProfile = null;
    this.transactionDetail = null;
  }

  refresh(): void { this.load(); }

  markAllRead(): void {
    const alertIds = this.alerts.map(alert => alert.id).filter(Boolean);
    if (!alertIds.length) return;

    this.finca.markAlertsRead(alertIds).subscribe({
      next: () => {
        this.alerts.forEach(alert => {
          alert.read = true;
          if (alert.status === 'NEW') alert.status = 'READ';
        });
        this.saveAndRefresh();
        this.toastr.success('All alerts marked as read', 'Inbox');
      },
      error: () => this.toastr.error('Failed to mark alerts as read', 'Inbox')
    });
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
    const alertIds = Array.from(this.selectedIds);
    if (!alertIds.length) return;

    const reason = this.dismissReason || 'Bulk dismissed';
    this.finca.dismissAlerts(alertIds, reason).subscribe({
      next: () => {
        this.filteredAlerts.filter(alert => this.selectedIds.has(alert.id)).forEach(alert => {
          alert.status = 'DISMISSED';
          alert.dismiss_reason = reason;
        });
        this.saveAndRefresh();
        this.toastr.info(`Dismissed ${alertIds.length} alert(s)`, 'Bulk Action');
        this.selectedIds.clear();
        this.bulkMode = false;
      },
      error: () => this.toastr.error('Failed to dismiss alerts', 'Bulk Action')
    });
  }

  bulkMarkRead(): void {
    const alertIds = Array.from(this.selectedIds);
    if (!alertIds.length) return;

    this.finca.markAlertsRead(alertIds).subscribe({
      next: () => {
        this.filteredAlerts.filter(alert => this.selectedIds.has(alert.id)).forEach(alert => {
          alert.read = true;
          if (alert.status === 'NEW') alert.status = 'READ';
        });
        this.saveAndRefresh();
        this.toastr.success(`Marked ${alertIds.length} alert(s) as read`, 'Bulk Action');
        this.selectedIds.clear();
        this.bulkMode = false;
      },
      error: () => this.toastr.error('Failed to mark alerts as read', 'Bulk Action')
    });
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

  toggleSnoozeOptions(): void {
    this.showSnoozeOptions = !this.showSnoozeOptions;
    if (this.showSnoozeOptions) this.showDismissOptions = false;
  }

  toggleDismissOptions(): void {
    this.showDismissOptions = !this.showDismissOptions;
    if (this.showDismissOptions) {
      this.showSnoozeOptions = false;
    } else {
      this.dismissReason = '';
    }
  }

  dismissAlert(): void {
    if (!this.selected) return;
    const reason = this.dismissReason.trim();
    if (!reason) {
      this.toastr.warning('Enter a dismissal reason to continue', 'Dismiss Alert');
      return;
    }

    this.finca.dismissAlert(this.selected.id, reason).subscribe({
      next: (response) => {
        Object.assign(this.selected, response?.alert || {
          status: 'DISMISSED',
          dismiss_reason: reason
        });
        this.saveAndRefresh();
        this.showDismissOptions = false;
        this.dismissReason = '';
        this.close();
        this.toastr.info('Alert dismissed', 'Inbox');
      },
      error: () => this.toastr.error('Failed to dismiss alert', 'Inbox')
    });
  }

  snoozeAlert(): void {
    if (!this.selected) return;

    const durationMinutes: Record<string, number> = {
      '1h': 60,
      '4h': 240,
      '24h': 1440,
      '7d': 10080
    };
    const minutes = durationMinutes[this.snoozeDuration] || 60;

    this.finca.snoozeAlert(this.selected.id, minutes).subscribe({
      next: (response) => {
        Object.assign(this.selected, response?.alert || { status: 'SNOOZED' });
        this.saveAndRefresh();
        this.showSnoozeOptions = false;
        this.toastr.info('Alert snoozed', 'Inbox');
      },
      error: () => this.toastr.error('Failed to snooze alert', 'Inbox')
    });
  }

  escalateAlert(): void {
    if (!this.selected) return;

    const reason = prompt(
      'Escalation reason:',
      'High-value customer, repeated risk signals'
    );
    if (!reason) return;

    this.finca.escalateAlert(this.selected.id, 'URGENT', reason).subscribe({
      next: (response) => {
        Object.assign(this.selected, response?.alert || {
          status: 'ESCALATED',
          priority: 'URGENT'
        });
        this.saveAndRefresh();
        this.toastr.warning('Alert escalated', 'Escalation');
      },
      error: () => this.toastr.error('Failed to escalate alert', 'Escalation')
    });
  }

  flagForReview(): void {
    if (!this.selected) return;

    const reviewReason = prompt(
      'Review reason:',
      'Manual review required by compliance'
    );
    if (!reviewReason) return;

    this.finca.flagAlertForReview(this.selected.id, reviewReason).subscribe({
      next: (response) => {
        Object.assign(this.selected, response?.alert || {
          flagged: true,
          review_reason: reviewReason
        });
        this.saveAndRefresh();
        this.toastr.info('Alert flagged for review', 'Flag');
      },
      error: () => this.toastr.error('Failed to flag alert', 'Flag')
    });
  }

  blockTransaction(): void {
    if (!this.selected || !confirm('Block this transaction?')) return;

    const transactionId = this.selected.transaction_id;
    const reason = prompt('Block reason:', 'Blocked by analyst');
    if (!transactionId || !reason) return;

    this.finca.blockAlert(this.selected.id, transactionId, reason).subscribe({
      next: (response) => {
        Object.assign(this.selected, response?.alert || {
          status: 'BLOCKED',
          decision: 'BLOCK'
        });
        this.saveAndRefresh();
        this.toastr.error('Transaction blocked', 'Action');
      },
      error: () => this.toastr.error('Failed to block transaction', 'Action')
    });
  }

  sendChallenge(): void {
    if (!this.selected) return;

    const message = prompt('Challenge message:', 'Please confirm this transaction');
    if (!message) return;

    this.finca.challengeCustomer(this.selected.id, message).subscribe({
      next: (response) => {
        Object.assign(this.selected, response?.alert || {
          status: 'CHALLENGED',
          decision: 'CHALLENGE'
        });
        this.saveAndRefresh();
        this.toastr.info('Challenge sent to customer', 'Action');
      },
      error: () => this.toastr.error('Failed to challenge customer', 'Action')
    });
  }

  private saveAndRefresh(): void {
    this.finca.saveAlerts(this.alerts).subscribe({
      next: () => {
        this.computeStats();
        this.applyFilters();
      }
    });
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
