import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FincaService } from 'src/app/shared/services/finca.service';

@Component({
  selector: 'app-case-management',
  templateUrl: './case-management.component.html',
  styleUrls: ['./case-management.component.scss']
})
export class CaseManagementComponent implements OnInit, OnDestroy {
  cases: any[] = [];
  filteredCases: any[] = [];
  selected: any = null;
  loading = false;

  filterText = '';
  filterStatus = '';
  filterPriority = '';
  filterRisk = '';
  filterAssigned = '';
  sortBy = 'newest';
  activeView = 'queue';
  activeTab = 'overview';

  noteText = '';
  noteCategory = 'general';
  evidenceFiles: any[] = [];
  related: any[] = [];
  relatedLoading = false;
  customerProfile: any = null;
  showCustomerModal = false;

  assignAnalyst = '';
  assignPriority = 'NORMAL';
  assignNotes = '';
  escalationLevel = 'URGENT';
  escalationNotify = 'email';
  escalationReason = '';
  resolutionType = 'FRAUD_CONFIRMED';
  resolutionNotes = '';

  investigationChecks = { device: false, velocity: false, network: false };

  analysts = ['Analyst', 'Senior Analyst', 'Fraud Investigator', 'Compliance Officer', 'Supervisor'];

  detailTabs = [
    { id: 'overview', label: 'Overview', icon: 'fa-home' },
    { id: 'assignment', label: 'Assignment', icon: 'fa-user-plus' },
    { id: 'investigation', label: 'Investigation', icon: 'fa-search' },
    { id: 'playbook', label: 'Playbook', icon: 'fa-tasks' },
    { id: 'evidence', label: 'Evidence', icon: 'fa-paperclip' },
    { id: 'related', label: 'Related', icon: 'fa-link' },
    { id: 'customer', label: 'Customer', icon: 'fa-user' },
    { id: 'notes', label: 'Notes', icon: 'fa-sticky-note' },
    { id: 'escalation', label: 'Escalation', icon: 'fa-level-up-alt' },
    { id: 'resolution', label: 'Resolution', icon: 'fa-gavel' },
    { id: 'timeline', label: 'Timeline', icon: 'fa-clock' }
  ];

  workflowSteps = [
    { num: 1, label: 'Alert', done: false, active: false },
    { num: 2, label: 'Case', done: false, active: false },
    { num: 3, label: 'Assignment', done: false, active: false },
    { num: 4, label: 'Investigation', done: false, active: false },
    { num: 5, label: 'Escalation', done: false, active: false },
    { num: 6, label: 'Resolution', done: false, active: false }
  ];

  statCards: any[] = [];
  dashboardMetrics: any = null;
  showActivityFeed = true;
  recentActivity: any[] = [];
  highRiskUsers: any[] = [];
  playbookItems = [
    { id: 'identity', label: 'Verify customer identity', done: false },
    { id: 'device', label: 'Review device fingerprint', done: false },
    { id: 'velocity', label: 'Check transaction velocity', done: false },
    { id: 'network', label: 'Analyze IP / geolocation', done: false },
    { id: 'related', label: 'Review related transactions', done: false },
    { id: 'rules', label: 'Validate triggered rules', done: false },
    { id: 'customer', label: 'Check customer history', done: false },
    { id: 'evidence', label: 'Collect supporting evidence', done: false }
  ];
  private pollInterval: any;
  private slaInterval: any;

  constructor(private finca: FincaService, private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadDashboard();
    this.pollInterval = setInterval(() => this.loadAll(true), 30000);
    this.slaInterval = setInterval(() => {}, 60000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.slaInterval) clearInterval(this.slaInterval);
  }

  refresh(): void { this.loadAll(); }

  loadAll(silent = false): void {
    if (!silent) this.loading = true;
    this.finca.listCases(1, 200).subscribe({
      next: (r) => {
        const fetched = (r.cases || []).map((c: any) => ({
          ...c,
          display_score: this.normalizeScore(c.risk_score),
          timeline: c.timeline || [],
          notes: c.notes || []
        }));
        // dedupe by id keeping the latest entry
        const byId: any = {};
        fetched.forEach((c: any) => { byId[c.id] = c; });
        this.cases = Object.keys(byId).map(k => byId[k]);
        // persist cases locally so they remain visible across reloads
        this.finca.saveCases(this.cases).subscribe({ next: () => {}, error: () => {} });
        this.computeStats();
        this.buildActivityFeed();
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.cases = [];
        this.computeStats();
        this.buildActivityFeed();
        this.applyFilter();
        this.loading = false;
      }
    });
  }

  computeStats(): void {
    const open = this.cases.filter(c => c.status === 'OPEN').length;
    const investigating = this.cases.filter(c => c.status === 'INVESTIGATING').length;
    const resolved = this.cases.filter(c => c.status === 'RESOLVED').length;
    const escalated = this.cases.filter(c => c.priority === 'URGENT').length;
    const critical = this.cases.filter(c => c.final_risk_level === 'CRITICAL').length;
    const unassigned = this.cases.filter(c => !c.assigned_to && c.status !== 'RESOLVED').length;

    this.statCards = [
      { label: 'Open', value: open, bgClass: 'bg-primary bg-opacity-10', textClass: 'text-primary' },
      { label: 'Investigating', value: investigating, bgClass: 'bg-info bg-opacity-10', textClass: 'text-info' },
      { label: 'Resolved', value: resolved, bgClass: 'bg-success bg-opacity-10', textClass: 'text-success' },
      { label: 'Escalated', value: escalated, bgClass: 'bg-danger bg-opacity-10', textClass: 'text-danger' },
      { label: 'Critical', value: critical, bgClass: 'bg-warning bg-opacity-10', textClass: 'text-warning' },
      { label: 'Unassigned', value: unassigned, bgClass: 'bg-secondary bg-opacity-10', textClass: 'text-secondary' }
    ];
    // Also refresh high risk users aggregation
    this.highRiskUsers = this.aggregateHighRiskUsers();
  }

  applyFilter(): void {
    const q = (this.filterText || '').toLowerCase();
    let list = [...this.cases];

    if (q) {
      list = list.filter(c =>
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
        (c.alert_id && c.alert_id.toLowerCase().includes(q))
      );
    }
    if (this.filterStatus) list = list.filter(c => c.status === this.filterStatus);
    if (this.filterPriority) list = list.filter(c => c.priority === this.filterPriority);
    if (this.filterRisk) list = list.filter(c => c.final_risk_level === this.filterRisk);
    if (this.filterAssigned === 'mine') list = list.filter(c => c.assigned_to);

    if (this.activeView === 'escalated') list = list.filter(c => c.priority === 'URGENT');
    if (this.activeView === 'resolved') list = list.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');

    list.sort((a, b) => {
      if (this.sortBy === 'oldest') return (a.created_at || '').localeCompare(b.created_at || '');
      if (this.sortBy === 'risk') return (b.risk_score || 0) - (a.risk_score || 0);
      if (this.sortBy === 'priority') {
        const order: any = { URGENT: 0, HIGH: 1, NORMAL: 2 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      }
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    this.filteredCases = list;
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterRisk = '';
    this.filterAssigned = '';
    this.activeView = 'queue';
    this.applyFilter();
  }

  selectCase(c: any): void {
    this.selected = c;
    this.activeTab = 'overview';
    this.noteText = '';
    this.evidenceFiles = [];
    this.related = [];
    this.customerProfile = null;
    this.investigationChecks = { device: false, velocity: false, network: false };
    this.resetPlaybook();
    this.updateWorkflowSteps();
    this.loadCaseTransaction(c);
  }

  loadCaseTransaction(c: any): void {
    const txnId = c.transaction_id || c.alert_transaction_id;
    if (!txnId) return;
    this.finca.getTransaction(txnId).subscribe({
      next: (res) => {
        if (res?.status === 'success' && res.transaction_details) {
          this.selected.transaction = res;
          if (res.customer_info) this.customerProfile = res.customer_info;
        } else if (res?.result) {
          this.selected.transaction = res.result || res;
        }
      },
      error: () => {}
    });
  }

  updateWorkflowSteps(): void {
    if (!this.selected) return;
    const s = this.selected.status;
    const hasAssign = !!this.selected.assigned_to;
    const isResolved = s === 'RESOLVED' || s === 'CLOSED';
    const isEscalated = this.selected.priority === 'URGENT';

    this.workflowSteps = [
      { num: 1, label: 'Alert', done: true, active: false },
      { num: 2, label: 'Case', done: true, active: s === 'OPEN' && !hasAssign },
      { num: 3, label: 'Assignment', done: hasAssign, active: s === 'OPEN' && !hasAssign },
      { num: 4, label: 'Investigation', done: s === 'INVESTIGATING' || isResolved, active: s === 'INVESTIGATING' },
      { num: 5, label: 'Escalation', done: isEscalated, active: isEscalated && !isResolved },
      { num: 6, label: 'Resolution', done: isResolved, active: isResolved }
    ];
  }

  closeSelected(): void { this.selected = null; }

  openNewCase(): void {
    const customer = prompt('Customer ID for new case:');
    if (!customer) return;
    const newCase = {
      id: 'CASE' + Date.now(),
      alert_id: null,
      customer_id: customer,
      final_risk_level: 'MEDIUM',
      risk_score: 50,
      display_score: 50,
      status: 'OPEN',
      priority: 'NORMAL',
      assigned_to: null,
      timeline: [{ timestamp: new Date().toISOString(), action: 'Case created manually', actor: 'Analyst' }],
      notes: [],
      created_at: new Date().toISOString()
    };
    this.finca.createCase(newCase).subscribe({
      next: (r) => {
        const c = (r && r.case) ? r.case : newCase;
        this.cases.unshift(c);
        this.computeStats();
        this.applyFilter();
        this.selectCase(c);
        this.toastr.success('Case created', 'Success');
      },
      error: () => {
        this.cases.unshift(newCase);
        this.computeStats();
        this.applyFilter();
        this.selectCase(newCase);
        this.toastr.success('Case created (local)', 'Success');
      }
    });
  }

  assignSelected(): void {
    const name = this.assignAnalyst || prompt('Assign to (analyst name):', 'Analyst');
    if (!name || !this.selected) return;
    this.finca.assignCase(this.selected.id, name).subscribe({
      next: (r) => {
        this.selected.assigned_to = name;
        this.selected.status = 'INVESTIGATING';
        this.selected.priority = this.assignPriority;
        this.pushTimeline(`Assigned to ${name}${this.assignNotes ? ': ' + this.assignNotes : ''}`);
        this.updateWorkflowSteps();
        this.assignNotes = '';
        this.toastr.success(`Assigned to ${name}`, 'Case Assigned');
      },
      error: () => {
        this.selected.assigned_to = name;
        this.selected.status = 'INVESTIGATING';
        this.selected.priority = this.assignPriority;
        this.pushTimeline(`Assigned to ${name} (local)`);
        this.updateWorkflowSteps();
        // small risk bump for assignment
        this.adjustRisk(3, `Assigned to ${name}`);
        this.toastr.info(`Assigned to ${name} (offline)`, 'Local Update');
      }
    });
  }

  unassignCase(): void {
    if (!this.selected) return;
    this.selected.assigned_to = null;
    this.selected.status = 'OPEN';
    this.pushTimeline('Case unassigned');
    this.updateWorkflowSteps();
    this.finca.updateCaseLocal(this.selected.id, { assigned_to: null, status: 'OPEN' }).subscribe();
    this.toastr.info('Case unassigned', 'Assignment');
  }

  reassignCase(): void {
    this.assignAnalyst = '';
    this.activeTab = 'assignment';
  }

  addNote(): void {
    if (!this.selected || !this.noteText.trim()) return;
    const note = `[${this.noteCategory}] ${this.noteText}`;
    this.finca.addCaseNote(this.selected.id, note, 'Analyst').subscribe({
      next: (r) => {
        if (r.case) this.selected = { ...this.selected, ...r.case };
        else {
          if (!this.selected.notes) this.selected.notes = [];
          this.selected.notes.push({ timestamp: new Date().toISOString(), analyst: 'Analyst', note });
        }
        this.pushTimeline(`Note added: ${this.noteText.substring(0, 50)}...`);
        this.noteText = '';
        this.toastr.success('Note saved', 'Investigation');
      },
      error: () => {
        if (!this.selected.notes) this.selected.notes = [];
        this.selected.notes.push({ timestamp: new Date().toISOString(), analyst: 'Analyst', note });
        this.pushTimeline(`Note: ${this.noteText.substring(0, 50)}...`);
        this.noteText = '';
        this.toastr.info('Note saved locally', 'Offline');
      }
    });
  }

  startInvestigation(): void {
    if (!this.selected) return;
    this.selected.status = 'INVESTIGATING';
    this.pushTimeline('Investigation started');
    this.activeTab = 'investigation';
    this.updateWorkflowSteps();
    // small risk increase when investigation starts
    this.adjustRisk(5, 'Investigation started');
    this.finca.updateCaseLocal(this.selected.id, { status: 'INVESTIGATING' }).subscribe();
    this.toastr.info('Investigation started', 'Case');
  }

  runCheck(type: string): void {
    if (!this.selected) return;
    (this.investigationChecks as any)[type] = true;
    const labels: any = { device: 'Device fingerprint verified', velocity: 'Velocity check passed', network: 'Network analysis complete' };
    // For device check, only add risk when device is suspicious. Prompt analyst (or integrate device analysis later).
    if (type === 'device') {
      const suspicious = confirm('Run device analysis: Mark device as suspicious? Click OK if suspicious, Cancel if benign.');
      this.pushTimeline(suspicious ? 'Device check: suspicious' : 'Device check: benign');
      if (suspicious) this.adjustRisk(10, `Investigation check: ${type} (suspicious)`);
    } else {
      this.pushTimeline(labels[type] || `Check: ${type}`);
      // weight checks differently
      const weights: any = { velocity: 8, network: 7 };
      const w = weights[type] || 5;
      this.adjustRisk(w, `Investigation check: ${type}`);
    }
  }

  requestInfo(): void {
    const who = prompt('Request info from (e.g., Ops, Customer):', 'Ops');
    if (!who || !this.selected) return;
    this.pushTimeline(`Requested additional info from ${who}`);
  }

  onEvidenceUpload(event: any): void {
    const files = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      this.evidenceFiles.push({ name: files[i].name, size: files[i].size, uploaded_at: new Date().toISOString() });
    }
    this.pushTimeline(`${files.length} evidence file(s) uploaded`);
  }

  removeEvidence(i: number): void { this.evidenceFiles.splice(i, 1); }

  addEvidenceLink(): void {
    const url = prompt('Evidence URL:');
    if (url) {
      this.evidenceFiles.push({ name: url, uploaded_at: new Date().toISOString(), type: 'link' });
      this.pushTimeline(`Evidence link added: ${url}`);
    }
  }

  captureScreenshot(): void {
    this.evidenceFiles.push({ name: 'screenshot_' + Date.now() + '.png', uploaded_at: new Date().toISOString(), type: 'screenshot' });
    this.pushTimeline('Screenshot captured');
  }

  exportEvidence(): void {
    this.toastr.info(`Bundling ${this.evidenceFiles.length} evidence items`, 'Export');
  }

  loadRelated(): void {
    if (!this.selected) return;
    const transactionId = this.selected.transaction_id || this.selected.alert_id;
    if (!transactionId) return;
    this.relatedLoading = true;
    this.finca.getRelatedTransactions(transactionId).subscribe({
      next: (r) => { this.relatedLoading = false; this.related = r.related_transactions || []; this.toastr.success(`Found ${this.related.length} related transactions`, 'Related'); },
      error: () => { this.relatedLoading = false; this.related = []; this.toastr.error('Could not load related transactions', 'Error'); }
    });
  }

  loadCustomerProfile(): void {
    if (this.customerProfile) return;
    const txnId = this.selected?.transaction_id || this.selected?.alert_id;
    if (!txnId) {
      this.customerProfile = { customer_id: this.selected?.customer_id, customer_name: this.selected?.customer_id };
      return;
    }
    this.finca.getTransaction(txnId).subscribe({
      next: (res) => {
        this.customerProfile = res?.customer_info || res?.transaction_details?.customer_info || { customer_id: this.selected.customer_id };
      },
      error: () => {
        this.customerProfile = { customer_id: this.selected?.customer_id };
      }
    });
  }

  openCustomerProfile(): void {
    this.loadCustomerProfile();
    this.showCustomerModal = true;
  }

  escalate(): void {
    if (!this.selected) return;
    const level = this.escalationLevel || 'URGENT';
    this.finca.escalateCase(this.selected.id, level, 'Supervisor').subscribe({
      next: () => {
        this.selected.priority = 'URGENT';
        this.pushTimeline(`Escalated to ${level}: ${this.escalationReason || 'No reason provided'}`);
        this.updateWorkflowSteps();
        // escalate increases risk
        this.adjustRisk(20, `Escalated to ${level}`);
        this.toastr.warning(`Escalated to ${level}`, 'Escalation');
      },
      error: () => {
        this.selected.priority = 'URGENT';
        this.pushTimeline(`Escalated to ${level} (local)`);
        this.updateWorkflowSteps();
        this.adjustRisk(20, `Escalated to ${level} (local)`);
        this.toastr.warning(`Escalated to ${level} (offline)`, 'Escalation');
      }
    });
  }

  escalateToLegal(): void {
    this.escalationLevel = 'LEGAL';
    this.escalate();
  }

  markFraud(): void {
    if (!this.selected || !confirm('Mark this case as FRAUD_CONFIRMED?')) return;
    const notes = this.resolutionNotes || 'Marked by analyst';
    this.finca.resolveCase(this.selected.id, 'FRAUD_CONFIRMED', notes, 'Analyst').subscribe({
      next: (r) => {
        this.selected.status = 'RESOLVED';
        // mark as fraud sets risk to max
        this.selected.resolution = r.case?.resolution || { verdict: 'FRAUD_CONFIRMED', resolved_at: new Date().toISOString(), resolved_by: 'Analyst' };
        this.adjustRisk(1000, 'Case resolved: FRAUD CONFIRMED');
        this.pushTimeline('Case resolved: FRAUD CONFIRMED');
        this.updateWorkflowSteps();
        this.loadAll(true);
        this.toastr.error('Case marked as fraud', 'Resolved');
      },
      error: () => {
        this.selected.status = 'RESOLVED';
        this.selected.resolution = { verdict: 'FRAUD_CONFIRMED', resolved_at: new Date().toISOString(), resolved_by: 'Analyst' };
        this.adjustRisk(1000, 'Case resolved: FRAUD CONFIRMED (local)');
        this.pushTimeline('Case resolved: FRAUD CONFIRMED (local)');
        this.updateWorkflowSteps();
        this.toastr.error('Marked as fraud (offline)', 'Resolved');
      }
    });
  }

  markFalsePositive(): void {
    if (!this.selected || !confirm('Mark this case as FALSE_POSITIVE?')) return;
    const notes = this.resolutionNotes || 'Marked false positive';
    this.finca.resolveCase(this.selected.id, 'FALSE_POSITIVE', notes, 'Analyst').subscribe({
      next: (r) => {
        this.selected.status = 'RESOLVED';
        // false positive lowers risk significantly and remove case from active list
        this.selected.resolution = r.case?.resolution || { verdict: 'FALSE_POSITIVE', resolved_at: new Date().toISOString(), resolved_by: 'Analyst' };
        this.adjustRisk(-50, 'Case resolved: FALSE POSITIVE');
        this.pushTimeline('Case resolved: FALSE POSITIVE');
        this.updateWorkflowSteps();
        // remove from local cases and show popup
        this.finca.deleteCaseLocal(this.selected.id).subscribe(() => {
          this.cases = this.cases.filter(c => c.id !== this.selected.id);
          this.applyFilter();
          this.toastr.info('Case removed from Case Management (false positive)', 'Removed');
        });
      },
      error: () => {
        this.selected.status = 'RESOLVED';
        this.selected.resolution = { verdict: 'FALSE_POSITIVE', resolved_at: new Date().toISOString(), resolved_by: 'Analyst' };
        this.adjustRisk(-50, 'Case resolved: FALSE POSITIVE (local)');
        this.pushTimeline('Case resolved: FALSE POSITIVE (local)');
        this.updateWorkflowSteps();
        this.finca.deleteCaseLocal(this.selected.id).subscribe(() => {
          this.cases = this.cases.filter(c => c.id !== this.selected.id);
          this.applyFilter();
          this.toastr.info('Case removed from Case Management (false positive, offline)', 'Removed');
        });
      }
    });
  }

  allowTransaction(): void {
    if (!this.selected) return;
    const txnId = this.selected.transaction_id || this.selected.alert_id || prompt('Transaction ID to allow:');
    if (!txnId) return;
    this.finca.allowTransaction(txnId).subscribe({
      next: () => { this.pushTimeline(`Transaction ${txnId} allowed`); this.toastr.success('Transaction allowed', 'Action'); },
      error: () => { this.pushTimeline(`Transaction ${txnId} allowed (local)`); this.toastr.info('Transaction allowed (offline)', 'Action'); }
    });
  }

  forceClose(): void {
    if (!this.selected || !confirm('Force close this case?')) return;
    this.selected.status = 'CLOSED';
    this.pushTimeline('Case force closed');
    this.updateWorkflowSteps();
    this.finca.updateCaseLocal(this.selected.id, { status: 'CLOSED' }).subscribe(() => this.loadAll(true));
    this.toastr.info('Case force closed', 'Closed');
  }

  reopenCase(): void {
    if (!this.selected) return;
    this.selected.status = 'OPEN';
    this.selected.resolution = null;
    this.pushTimeline('Case reopened');
    this.updateWorkflowSteps();
    this.finca.updateCaseLocal(this.selected.id, { status: 'OPEN', resolution: null }).subscribe();
  }

  flagForCompliance(): void { this.pushTimeline('Flagged for compliance review'); this.activeTab = 'escalation'; }
  flagCustomer(): void { this.pushTimeline(`Customer ${this.selected?.customer_id} flagged`); }
  blockCustomer(): void { if (confirm('Block this customer account?')) this.pushTimeline(`Customer ${this.selected?.customer_id} blocked (simulated)`); }
  sendCustomerAlert(): void { this.pushTimeline('Alert SMS sent to customer (simulated)'); }
  linkCase(): void { const id = prompt('Link to case ID:'); if (id) this.pushTimeline(`Linked to case ${id}`); }
  printCase(): void { window.print(); }
  exportCases(): void { this.downloadCsv(this.filteredCases, 'cases'); }

  loadDashboard(): void {
    this.finca.getDashboard().subscribe({
      next: (r) => { this.dashboardMetrics = r.metrics || r; },
      error: () => { this.dashboardMetrics = null; }
    });
  }

  buildActivityFeed(): void {
    const events: any[] = [];
    this.cases.forEach(c => {
      (c.timeline || []).forEach((t: any) => {
        events.push({ ...t, caseId: c.id, customerId: c.customer_id });
      });
    });
    this.recentActivity = events
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 12);
  }

  getSlaHours(c: any): number {
    if (c.priority === 'URGENT') return 4;
    if (c.priority === 'HIGH') return 8;
    return 24;
  }

  getSlaStatus(c: any): { label: string; class: string; pct: number } {
    if (!c.created_at || c.status === 'RESOLVED' || c.status === 'CLOSED') {
      return { label: 'N/A', class: 'bg-secondary', pct: 0 };
    }
    const slaMs = this.getSlaHours(c) * 3600000;
    const elapsed = Date.now() - new Date(c.created_at).getTime();
    const remaining = slaMs - elapsed;
    const pct = Math.min(100, Math.round((elapsed / slaMs) * 100));
    if (remaining <= 0) return { label: 'BREACHED', class: 'bg-danger', pct: 100 };
    const hrs = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    const label = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
    const cls = pct >= 80 ? 'bg-danger' : pct >= 60 ? 'bg-warning text-dark' : 'bg-success';
    return { label, class: cls, pct };
  }

  resetPlaybook(): void {
    this.playbookItems.forEach(p => p.done = false);
  }

  togglePlaybookItem(item: any): void {
    item.done = !item.done;
    if (item.done) this.pushTimeline(`Playbook: ${item.label} completed`);
    const done = this.playbookItems.filter(p => p.done).length;
    // small incremental risk for each completed playbook item
    if (item.done) this.adjustRisk(5, `Playbook item completed: ${item.label}`);
    if (done === this.playbookItems.length) {
      this.toastr.success('Investigation playbook complete', 'Playbook');
    }
  }

  deleteCase(caseId?: string): void {
    const id = caseId || this.selected?.id;
    if (!id) return;
    if (!confirm('WARNING: Deleting a case is permanent. Click OK to proceed with delete.')) return;
    // perform local delete and update UI
    this.finca.deleteCaseLocal(id).subscribe(() => {
      this.cases = this.cases.filter(c => c.id !== id);
      if (this.selected && this.selected.id === id) this.selected = null;
      this.applyFilter();
      this.computeStats();
      this.toastr.info('Case deleted locally', 'Delete');
    });
  }

  getPlaybookProgress(): number {
    return Math.round((this.playbookItems.filter(p => p.done).length / this.playbookItems.length) * 100);
  }

  jumpToCase(caseId: string): void {
    const c = this.cases.find(x => x.id === caseId);
    if (c) this.selectCase(c);
  }

  downloadCsv(rows: any[], filename: string): void {
    if (!rows.length) { this.toastr.warning('Nothing to export', 'Export'); return; }
    const headers = ['id', 'customer_id', 'status', 'priority', 'final_risk_level', 'risk_score', 'assigned_to', 'created_at'];
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

  aggregateHighRiskUsers(): any[] {
    const map: any = {};
    (this.cases || []).forEach((c: any) => {
      if (c.final_risk_level === 'HIGH' || c.final_risk_level === 'CRITICAL') {
        if (!map[c.customer_id]) map[c.customer_id] = { customer_id: c.customer_id, cases: 0, highest: c.final_risk_level, score: c.risk_score || c.display_score || 0 };
        map[c.customer_id].cases += 1;
        if (c.risk_score > map[c.customer_id].score) map[c.customer_id].score = c.risk_score;
        if (c.final_risk_level === 'CRITICAL') map[c.customer_id].highest = 'CRITICAL';
      }
    });
    return Object.keys(map).map(k => map[k]).sort((a: any, b: any) => b.score - a.score);
  }

  selectHighRiskUser(customerId: string): void {
    // filter the case list to this customer
    this.filterText = customerId;
    this.applyFilter();
  }

  viewAlert(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/alerts']);
  }

  viewTransaction(txnId: string): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', txnId]);
  }

  viewCustomerTransactions(): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/transactions']);
  }

  navigateToInvestigationGraph(): void {
    const id = this.selected?.transaction_id || this.selected?.alert_id || this.selected?.id;
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', id]);
  }

  pushTimeline(action: string): void {
    if (!this.selected.timeline) this.selected.timeline = [];
    this.selected.timeline.unshift({ timestamp: new Date().toISOString(), action, actor: 'Analyst' });
  }

  adjustRisk(delta: number, action?: string): void {
    if (!this.selected) return;
    // If delta is very large (marker to set max), handle specially
    let current = Number(this.selected.risk_score || this.selected.display_score || 0);
    if (isNaN(current)) current = 0;
    let newScore = current;
    if (delta >= 1000) {
      newScore = 100;
    } else {
      newScore = Math.min(100, Math.max(0, Math.round(current + delta)));
    }
    this.selected.risk_score = newScore;
    this.selected.display_score = this.getDisplayScore(this.selected);
    // derive level
    let level = 'LOW';
    if (newScore >= 80) level = 'CRITICAL';
    else if (newScore >= 60) level = 'HIGH';
    else if (newScore >= 40) level = 'MEDIUM';
    this.selected.final_risk_level = level;
    if (action) this.pushTimeline(action);
    // persist locally
    this.finca.updateCaseLocal(this.selected.id, { risk_score: newScore, final_risk_level: level }).subscribe();
    // update lists/statistics
    const idx = this.cases.findIndex(c => c.id === this.selected.id);
    if (idx >= 0) { this.cases[idx] = { ...this.cases[idx], ...this.selected }; }
    this.computeStats();
    this.applyFilter();
  }

  normalizeScore(score: any): number {
    const n = Number(score);
    if (isNaN(n)) return 0;
    if (n <= 10) return Math.round(n * 10);
    return Math.round(n);
  }

  getDisplayScore(c: any): number {
    return c.display_score || this.normalizeScore(c.risk_score) || 0;
  }

  getRiskBadge(level: string): string {
    const map: any = { CRITICAL: 'bg-danger', HIGH: 'bg-warning text-dark', MEDIUM: 'bg-info text-dark', LOW: 'bg-success' };
    return map[level] || 'bg-secondary';
  }

  getStatusBadge(status: string): string {
    const map: any = { OPEN: 'bg-primary', INVESTIGATING: 'bg-info', RESOLVED: 'bg-success', CLOSED: 'bg-secondary' };
    return map[status] || 'bg-secondary';
  }

  getRiskGradient(c: any): string {
    const score = this.getDisplayScore(c);
    if (score >= 80) return 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
    if (score >= 60) return 'linear-gradient(135deg, #feca57, #ff9f43)';
    if (score >= 40) return 'linear-gradient(135deg, #48dbfb, #0abde3)';
    return 'linear-gradient(135deg, #1dd1a1, #10ac84)';
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
}
