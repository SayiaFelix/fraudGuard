import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { FincaService } from 'src/app/shared/services/finca.service';

import { HttpService } from 'src/app/shared/services/http.service';

import Swal from 'sweetalert2';



@Component({

  selector: 'app-case-management',

  templateUrl: './case-management.component.html',

  styleUrls: ['./case-management.component.scss']

})

export class CaseManagementComponent implements OnInit, OnDestroy {

  // ============= DATA =============

  cases: any[] = [];

  filteredCases: any[] = [];

  selected: any = null;

  loading = false;

  Math = Math;

  // ============= CREATE CASE =============

  showCreateCaseModal = false;

  selectedTransactionForCase: any = null;



  availableAlerts: any[] = [];

  alertsLoading = false;



  caseFormData: any = {

    customerId: '',

    customerName: '',

    riskLevel: 'MEDIUM',

    priority: 'NORMAL',

    assignedTo: '',

    alertId: '',

    transactionId: '',

    notes: '',

    triggeredRules: []

  };



  // ============= FILTERS =============

  filterText = '';

  filterStatus = '';

  filterPriority = '';

  filterRisk = '';

  filterAssigned = '';

  sortBy = 'newest';

  activeView = 'queue';

  activeTab = 'overview';



  // ============= NOTES & EVIDENCE =============

  noteText = '';

  noteCategory = 'general';

  evidenceFiles: any[] = [];

  related: any[] = [];

  relatedLoading = false;

  customerProfile: any = null;

  showCustomerModal = false;



  // ============= ASSIGNMENT =============

  assignAnalyst = '';

  assignPriority = 'NORMAL';

  assignNotes = '';



  // ============= ESCALATION =============

  escalationLevel = 'URGENT';

  escalationNotify = 'email';

  escalationReason = '';



  // ============= RESOLUTION =============

  resolutionType = 'FRAUD_CONFIRMED';

  resolutionNotes = '';



  // ============= INVESTIGATION =============

  investigationChecks = { device: false, velocity: false, network: false };



  // ============= STATIC DATA =============

  analysts = ['Analyst', 'Senior Analyst', 'Fraud Investigator', 'Compliance Officer', 'Supervisor'];



  detailTabs = [

    { id: 'overview', label: 'Overview', icon: 'fa-home' },

    { id: 'assignment', label: 'Assignment', icon: 'fa-user-plus' },

    { id: 'investigation', label: 'Investigation', icon: 'fa-search' },

    { id: 'playbook', label: 'Playbook', icon: 'fa-tasks' },

    { id: 'evidence', label: 'Evidence', icon: 'fa-paperclip' },

    // { id: 'related', label: 'Related', icon: 'fa-link' },

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



  // ============= INTERVALS =============

  private pollInterval: any;

  private slaInterval: any;



  // ============= KEYBOARD SHORTCUTS =============

  @HostListener('document:keydown.escape', ['$event'])

  onEscape(): void {

    if (this.selected) {

      this.closeSelected();

    }

  }



  @HostListener('document:keydown.ctrl.n', ['$event'])

  onCtrlN(event: KeyboardEvent): void {

    event.preventDefault();

    this.openCreateCaseModal();

  }



  @HostListener('document:keydown.ctrl.r', ['$event'])

  onCtrlR(event: KeyboardEvent): void {

    event.preventDefault();

    this.refresh();

  }



  constructor(

    private finca: HttpService,

    private router: Router,

    private toastr: ToastrService

  ) { }



  // ============= LIFECYCLE =============



  ngOnInit(): void {

    this.loadAll();

    this.loadDashboard();

    this.pollInterval = setInterval(() => this.loadAll(true), 30000);

    this.slaInterval = setInterval(() => this.updateSlaIndicators(), 60000);

  }



  ngOnDestroy(): void {

    if (this.pollInterval) clearInterval(this.pollInterval);

    if (this.slaInterval) clearInterval(this.slaInterval);

  }



  currentPage = 1;

  pageSize = 20;



  get totalPages(): number {

    return Math.ceil(this.filteredCases.length / this.pageSize);

  }



  get paginatedCases(): any[] {

    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredCases.slice(start, start + this.pageSize);

  }



  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

    }

  }



  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

    }

  }



  submitCreateCase(): void {

    if (

      !this.caseFormData.customerId ||

      !this.caseFormData.riskLevel ||

      !this.caseFormData.alertId

    ) {

      this.showWarningAlert(

        'Customer ID, Risk Level and Alert ID are required',

        'Warning'

      );

      return;

    }



    const riskScore = this.getRiskScoreFromLevel(this.caseFormData.riskLevel);



    const newCase = {

      id: 'CASE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),

      alert_id: this.caseFormData.alertId,

      customer_id: this.caseFormData.customerId,

      customer_name: this.caseFormData.customerName || this.caseFormData.customerId,

      final_risk_level: this.caseFormData.riskLevel,

      risk_score: riskScore,

      display_score: riskScore,

      ml_risk_level: this.caseFormData.riskLevel === 'CRITICAL' ? 'HIGH' :

        this.caseFormData.riskLevel === 'HIGH' ? 'MEDIUM' : 'LOW',

      status: 'OPEN',

      priority: this.caseFormData.priority || 'NORMAL',

      assigned_to: this.caseFormData.assignedTo || null,

      triggered_rules:

        this.caseFormData.triggeredRules || [],

      transaction_id:

        this.caseFormData.transactionId || null,

      timeline: [{

        timestamp: new Date().toISOString(),

        action: 'Case created manually by analyst',

        actor: 'Analyst'

      }],

      notes: this.caseFormData.notes ? [{

        timestamp: new Date().toISOString(),

        analyst: 'Analyst',

        note: this.caseFormData.notes

      }] : [],

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString()

    };




    this.finca.createCaseBackend(newCase).subscribe({

      next: (res: any) => {

        if (res && res.case) {

          // Use backend case data

          const backendCase = res.case;

          this.cases.unshift(backendCase);

          this.finca.saveCases(this.cases).subscribe();

          this.computeStats();

          this.applyFilter();

          this.selectCase(backendCase);

          this.closeCreateCaseModal();

          this.showSuccessAlert('Case created on server', 'Success');

        }

      },

    error: (err: any) => {
  console.error('Failed to create case:', err);

  this.showErrorAlert(
    'Failed to create case. Please try again.',
    'Create Case Failed'
  );
}

    });

  }



  openCreateCaseFromTransaction(transaction: any): void {

    if (!transaction) {

      this.showWarningAlert('No transaction selected', 'Warning');

      return;

    }



    this.selectedTransactionForCase = transaction;



    // Pre-fill form data from transaction

    this.caseFormData = {

      customerId: transaction.customer_id || transaction.customer_info?.customer_id || '',

      customerName: transaction.customer_name || transaction.customer_info?.customer_name || '',

      riskLevel: transaction.risk_category || transaction.final_risk_level || 'MEDIUM',

      priority: transaction.risk_category === 'CRITICAL' || transaction.final_risk_level === 'CRITICAL' ? 'URGENT' : 'NORMAL',

      assignedTo: '',

      alertId: transaction.alert_id || transaction.id || '',

      transactionId: transaction.transaction_id || transaction.id || '',

      notes: `Case created from transaction ${transaction.transaction_id || transaction.id}`,

      triggeredRules: transaction.triggered_rules || transaction.rules_triggered || []

    };



    this.showCreateCaseModal = true;

  }



  closeCreateCaseModal(): void {

    this.showCreateCaseModal = false;

    this.selectedTransactionForCase = null;

    this.resetCaseForm();

  }



  resetCaseForm(): void {

    this.caseFormData = {

      customerId: '',

      customerName: '',

      riskLevel: 'MEDIUM',

      priority: 'NORMAL',

      assignedTo: '',

      alertId: '',

      transactionId: '',

      notes: '',

      triggeredRules: []

    };

  }



  createCaseFromTransaction(transaction: any): void {

    if (!transaction) return;



    const newCase = {

      id: 'CASE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),

      alert_id: transaction.transaction_id || null,

      customer_id: transaction.customer_id || transaction.customer_info?.customer_id || 'UNKNOWN',

      customer_name: transaction.customer_name || transaction.customer_info?.customer_name || 'Unknown',

      final_risk_level: transaction.risk_category || transaction.final_risk_level || 'MEDIUM',

      risk_score: transaction.risk_score || 50,

      display_score: transaction.risk_score || 50,

      ml_risk_level: transaction.ml_risk_level || 'MEDIUM',

      status: 'OPEN',

      priority: transaction.risk_category === 'CRITICAL' || transaction.final_risk_level === 'CRITICAL' ? 'URGENT' : 'NORMAL',

      assigned_to: null,

      triggered_rules: transaction.triggered_rules || [],

      timeline: [{

        timestamp: new Date().toISOString(),

        action: `Case created from transaction ${transaction.transaction_id}`,

        actor: 'System'

      }],

      notes: [],

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString()

    };



    this.finca.createCase(newCase).subscribe({

      next: (r) => {

        const c = (r && r.case) ? r.case : newCase;

        this.cases.unshift(c);

        this.computeStats();

        this.applyFilter();

        this.selectCase(c);

        this.showSuccessAlert('Case created from transaction', 'Success');

      },

    error: (err) => {
  console.error('Failed to create case from transaction:', err);

  this.showErrorAlert(
    'Failed to create case from transaction.',
    'Create Case Failed'
  );
}

    });

  }



  updatePagination(): void {

    // Update the displayed cases

    this.applyFilter();

  }



  // ============= LOAD METHODS =============



  refresh(): void {

    this.loadAll();

  }



  loadAll(silent = false): void {

    if (!silent) this.loading = true;



    this.finca.listCases(1, 1000).subscribe({

      next: (r: any) => {

        console.log('📋 Cases loaded:', r); // Debug log



        const fetched = (r.cases || []).map((c: any) => ({

          ...c,

          display_score: this.normalizeScore(c.risk_score),

          // Ensure these fields exist for the UI

          timeline: c.timeline || [],

          notes: c.notes || [],

          // If customer_name is not in the response, use customer_id

          customer_name: c.customer_name || c.customer_id || 'Unknown'

        }));



        // Dedupe by ID

        const byId: any = {};

        fetched.forEach((c: any) => { byId[c.id] = c; });

        this.cases = Object.keys(byId).map(k => byId[k]);



        this.computeStats();

        this.buildActivityFeed();

        this.applyFilter();

        this.loading = false;

        // Normal case loading is intentionally silent.

      },

      error: (err: any) => {
    console.error('Error loading cases:', err);

  this.cases = [];
  this.computeStats();
  this.buildActivityFeed();
  this.applyFilter();
  this.loading = false;

    this.showErrorAlert(
    'Could not load cases from the server.',
    'Load Cases Failed'
  );
  }

    });

  }



  openCreateCaseModal(): void {

    this.caseFormData = {

      customerId: '',

      customerName: '',

      riskLevel: 'MEDIUM',

      priority: 'NORMAL',

      assignedTo: '',

      alertId: '',

      transactionId: '',

      notes: '',

      triggeredRules: []

    };



    this.showCreateCaseModal = true;



    this.loadAvailableAlerts();

  }



  onAlertSelected(): void {



    if (!this.caseFormData.alertId) {

      return;

    }



    const selectedAlert = this.availableAlerts.find(

      (alert: any) =>

        (alert.alert_id || alert.id) ===

        this.caseFormData.alertId

    );



    if (!selectedAlert) {

      console.warn(

        'Selected alert not found:',

        this.caseFormData.alertId

      );

      return;

    }



    console.log(

      'Selected alert:',

      selectedAlert

    );



    // Customer

    this.caseFormData.customerId =

      selectedAlert.customer_id ||

      selectedAlert.customer?.customer_id ||

      '';



    this.caseFormData.customerName =

      selectedAlert.customer_name ||

      selectedAlert.customer?.customer_name ||

      '';



    // Transaction

    this.caseFormData.transactionId =

      selectedAlert.transaction_id ||

      selectedAlert.transaction?.transaction_id ||

      '';



    // Risk

    const riskLevel =

      selectedAlert.risk_level ||

      selectedAlert.final_risk_level ||

      selectedAlert.risk_category ||

      'MEDIUM';



    this.caseFormData.riskLevel =

      riskLevel.toUpperCase();



    // Automatically suggest priority

    if (

      this.caseFormData.riskLevel === 'CRITICAL'

    ) {

      this.caseFormData.priority = 'URGENT';



    } else if (

      this.caseFormData.riskLevel === 'HIGH'

    ) {

      this.caseFormData.priority = 'HIGH';



    } else {

      this.caseFormData.priority = 'NORMAL';

    }



    // Triggered rules

    this.caseFormData.triggeredRules =

      selectedAlert.triggered_rules ||

      selectedAlert.finca_rules_triggered ||

      selectedAlert.rules_triggered ||

      [];

  }



  getRiskScoreFromLevel(level: string): number {

    const map: any = {

      'LOW': 30,

      'MEDIUM': 50,

      'HIGH': 70,

      'CRITICAL': 85

    };

    return map[level] || 50;

  }



  loadDashboard(): void {

    this.finca.getDashboard().subscribe({

      next: (r) => {

        this.dashboardMetrics = r.metrics || r;

      },

      error: () => {

        this.dashboardMetrics = null;

      }

    });

  }

  loadCaseTransaction(c: any): void {



    let txnId = c.transaction_id ||

      c.alert_transaction_id ||

      c.alert?.transaction_id ||

      c.alert?.alert_transaction_id;



    if (!txnId && c.alert_id) {



      this.finca.getAlert(c.alert_id).subscribe({

        next: (alert) => {

          if (alert?.transaction_id) {

            this.loadTransaction(alert.transaction_id);

          } else {

            this.loadCustomerOnly(c);

          }

        },

        error: () => this.loadCustomerOnly(c)

      });

      return;

    }



    if (txnId && txnId.startsWith('ALT')) {

      this.loadCustomerOnly(c);

      return;

    }



    if (txnId) {

      this.loadTransaction(txnId);

    } else {

      this.loadCustomerOnly(c);

    }

  }



  loadAvailableAlerts(): void {

    this.alertsLoading = true;



    this.finca.listAlerts(1, 1000).subscribe({

      next: (res: any) => {



        console.log('Available alerts:', res);



        const alerts =

          res?.alerts ||

          res?.data ||

          [];



        // Prefer alerts that have not already finished their lifecycle

        this.availableAlerts = alerts.filter((alert: any) => {



          const status = (

            alert.status || ''

          ).toUpperCase();



          return ![

            'RESOLVED',

            'CLOSED'

          ].includes(status);

        });



        this.alertsLoading = false;



        console.log(

          'Selectable alerts:',

          this.availableAlerts

        );

      },



      error: (err: any) => {

        console.error(

          'Could not load alerts:',

          err

        );



        this.availableAlerts = [];

        this.alertsLoading = false;



        this.showErrorAlert(

          'Could not load available alerts',

          'Alerts'

        );

      }

    });

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



    this.customerProfile = {

      customer_id: c.customer_id || 'Unknown',

      customer_name: c.customer_name || c.customer_id || 'Unknown'

    };



    if (!c.transaction_id && c.alert?.transaction_id) {

      c.transaction_id = c.alert.transaction_id;

    }



    this.loadCaseTransaction(c);

  }



  loadRelatedTransactions(transactionId: string): void {

    this.relatedLoading = true;



    this.finca.getRelatedTransactions(transactionId).subscribe({

      next: (r) => {

        this.relatedLoading = false;

        this.related = r.related_transactions || [];

        if (this.related.length > 0) {

          this.showSuccessAlert(`Found ${this.related.length} related transactions`, 'Related');

        } else {

          this.showInfoAlert('No related transactions found', 'Related');

        }

      },

      error: (err) => {

        this.relatedLoading = false;

        this.related = [];

        console.error('Error loading related transactions:', err);

        this.showErrorAlert('Could not load related transactions', 'Error');

      }

    });

  }



  loadCustomerOnly(c: any): void {

    this.customerProfile = {

      customer_id: c.customer_id || 'Unknown',

      customer_name: c.customer_name || c.customer_id || 'Unknown',

      customer_email: c.customer_email || '',

      customer_phone: c.customer_phone || '',

      account_age_days: c.account_age_days || 0,

      avg_transaction_amount: c.avg_transaction_amount || 0

    };

    this.updateWorkflowSteps();

  }



  loadTransaction(txnId: string): void {

    this.finca.getTransaction(txnId).subscribe({

      next: (res) => {

        if (res?.status === 'success' || res?.transaction_id) {

          this.selected.transaction = res;

          if (res.customer_info) {

            this.customerProfile = res.customer_info;

          } else if (this.selected?.customer_id) {

            this.customerProfile = {

              customer_id: this.selected.customer_id,

              customer_name: this.selected.customer_name || this.selected.customer_id

            };

          }

        }

        this.updateWorkflowSteps();

      },

      error: () => {

        // Fallback to customer info from case

        if (this.selected?.customer_id) {

          this.customerProfile = {

            customer_id: this.selected.customer_id,

            customer_name: this.selected.customer_name || this.selected.customer_id

          };

        }

        this.updateWorkflowSteps();

      }

    });

  }



  getRuleFlags(caseData: any): string[] {

    if (!caseData) return [];



    // Check multiple sources for rule flags

    const flags = caseData.Rule_Flags ||

      caseData.rule_flags ||

      caseData.transaction?.transaction_details?.Rule_Flags ||

      caseData.transaction?.transaction_details?.rule_flags ||

      [];



    return flags;

  }



  getFincaRules(caseData: any): any[] {

    if (!caseData) return [];



    const rules = caseData.finca_rules_triggered ||

      caseData.transaction?.transaction_details?.finca_rules_triggered ||

      caseData.triggered_rules ||

      [];



    if (rules.length > 0 && typeof rules[0] === 'string') {

      return rules.map((rule: string) => ({

        rule_id: rule,

        rule_name: this.getRuleName(rule),

        reason: this.getRuleReason(rule),

        rule_points: 0

      }));

    }



    return rules;

  }

  getRuleName(ruleId: string): string {

    const map: any = {

      'R001': 'New Device + High Value',

      'R002': 'Location Anomaly',

      'R003': 'Transaction Velocity',

      'R004': 'Amount Anomaly',

      'R011': 'Location Anomaly',

      'R012': 'Unusual Time',

      'NEW_DEVICE': 'New Device',

      'LOCATION_ANOMALY': 'Location Anomaly',

      'AMOUNT_ANOMALY': 'Amount Anomaly',

      'VELOCITY_ANOMALY': 'Velocity Anomaly',

      'UNUSUAL_TIME': 'Unusual Time'

    };

    return map[ruleId] || ruleId;

  }



  getRuleReason(ruleId: string): string {

    const map: any = {

      'R001': 'New/unrecognized device detected',

      'R002': 'Location anomaly detected',

      'R003': 'Transaction velocity exceeds threshold',

      'R004': 'Amount exceeds normal pattern',

      'R011': 'Unusual location detected',

      'R012': 'Transaction at unusual hour',

      'NEW_DEVICE': 'New/unrecognized device detected',

      'LOCATION_ANOMALY': 'Unusual location detected',

      'AMOUNT_ANOMALY': 'Amount exceeds normal pattern',

      'VELOCITY_ANOMALY': 'High transaction frequency',

      'UNUSUAL_TIME': 'Transaction at unusual hour'

    };

    return map[ruleId] || 'Rule triggered';

  }



  hasFincaRules(caseData: any): boolean {

    if (!caseData) return false;



    const rules = this.getFincaRules(caseData);

    return rules.length > 0;

  }



  loadCustomerProfile(): void {

    if (this.customerProfile) return;



    const txnId = this.selected?.transaction_id || this.selected?.alert_id || this.selected?.id;

    if (!txnId) {

      this.customerProfile = {

        customer_id: this.selected?.customer_id || 'Unknown',

        customer_name: this.selected?.customer_name || this.selected?.customer_id || 'Unknown'

      };

      return;

    }



    this.finca.getTransaction(txnId).subscribe({

      next: (res) => {

        if (res?.customer_info) {

          this.customerProfile = res.customer_info;

        } else if (res?.result?.customer_info) {

          this.customerProfile = res.result.customer_info;

        } else if (res?.transaction_details?.customer_info) {

          this.customerProfile = res.transaction_details.customer_info;

        } else {

          this.customerProfile = {

            customer_id: this.selected?.customer_id || 'Unknown',

            customer_name: this.selected?.customer_name || this.selected?.customer_id || 'Unknown'

          };

        }

      },

      error: () => {

        this.customerProfile = {

          customer_id: this.selected?.customer_id || 'Unknown',

          customer_name: this.selected?.customer_name || this.selected?.customer_id || 'Unknown'

        };

      }

    });

  }

  getCaseRules(caseData: any): any[] {

    if (!caseData) return [];



    // Check multiple possible locations

    const rules = caseData.triggered_rules ||

      caseData.finca_rules_triggered ||

      caseData.alert?.finca_rules_triggered ||

      [];



    // If rules are strings, convert to objects

    if (rules.length > 0 && typeof rules[0] === 'string') {

      return rules.map((rule: string) => ({

        rule_id: rule,

        rule_name: this.getRuleName(rule),

        reason: this.getRuleReason(rule),

        rule_points: 0

      }));

    }



    return rules;

  }



  // ============= STATS & FILTERS =============



  computeStats(): void {

    const open = this.cases.filter(c => c.status === 'OPEN' || c.status === 'Open').length;

    const investigating = this.cases.filter(c => c.status === 'INVESTIGATING' || c.status === 'Investigating').length;

    const resolved = this.cases.filter(c => c.status === 'RESOLVED' || c.status === 'Resolved' || c.status === 'CLOSED').length;

    const escalated = this.cases.filter(c => c.priority === 'URGENT').length;

    const critical = this.cases.filter(c => c.final_risk_level === 'CRITICAL').length;

    const unassigned = this.cases.filter(c => !c.assigned_to && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;



    this.statCards = [

      { label: 'Open', value: open, bgClass: 'bg-primary bg-opacity-10', textClass: 'text-primary', icon: 'fa-folder-open' },

      { label: 'Investigating', value: investigating, bgClass: 'bg-info bg-opacity-10', textClass: 'text-info', icon: 'fa-search' },

      { label: 'Resolved', value: resolved, bgClass: 'bg-success bg-opacity-10', textClass: 'text-success', icon: 'fa-check-circle' },

      { label: 'Escalated', value: escalated, bgClass: 'bg-danger bg-opacity-10', textClass: 'text-danger', icon: 'fa-exclamation-triangle' },

      { label: 'Critical', value: critical, bgClass: 'bg-warning bg-opacity-10', textClass: 'text-warning', icon: 'fa-skull' },

      { label: 'Unassigned', value: unassigned, bgClass: 'bg-secondary bg-opacity-10', textClass: 'text-secondary', icon: 'fa-user-slash' }

    ];



    this.highRiskUsers = this.aggregateHighRiskUsers();

  }



  applyFilter(): void {

    const q = (this.filterText || '').toLowerCase();

    let list = [...this.cases];



    if (q) {

      list = list.filter(c =>

        (c.id && c.id.toLowerCase().includes(q)) ||

        (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||

        (c.alert_id && c.alert_id.toLowerCase().includes(q)) ||

        (c.customer_name && c.customer_name.toLowerCase().includes(q))

      );

    }



    if (this.filterStatus) {

      list = list.filter(c => c.status === this.filterStatus);

    }



    if (this.filterPriority) {

      list = list.filter(c => c.priority === this.filterPriority);

    }



    if (this.filterRisk) {

      list = list.filter(c => c.final_risk_level === this.filterRisk);

    }



    if (this.filterAssigned === 'mine') {

      list = list.filter(c => c.assigned_to);

    }



    if (this.filterAssigned === 'unassigned') {

      list = list.filter(c => !c.assigned_to);

    }



    if (this.activeView === 'escalated') {

      list = list.filter(c => c.priority === 'URGENT');

    }



    if (this.activeView === 'resolved') {

      list = list.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');

    }



    list.sort((a, b) => {

      if (this.sortBy === 'oldest') {

        return (a.created_at || '').localeCompare(b.created_at || '');

      }

      if (this.sortBy === 'risk') {

        return (b.risk_score || 0) - (a.risk_score || 0);

      }

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



  relatedPage = 1;

  relatedPageSize = 5;



  get relatedTotalPages(): number {

    return Math.ceil(this.related.length / this.relatedPageSize);

  }



  get paginatedRelated(): any[] {

    const start = (this.relatedPage - 1) * this.relatedPageSize;

    return this.related.slice(start, start + this.relatedPageSize);

  }



  loadRelated(): void {

    if (!this.selected) return;



    // ✅ Get transaction ID

    let transactionId = this.getTransactionIdFromCase(this.selected);



    if (!transactionId) {

      this.showWarningAlert('No transaction ID found for this case', 'Warning');

      this.relatedLoading = false;

      return;

    }



    this.relatedLoading = true;



    this.finca.getRelatedTransactions(transactionId).subscribe({

      next: (r) => {

        this.relatedLoading = false;



        // ✅ Assign the data

        this.related = r.related_transactions || r.transactions || r.data || [];



        // ✅ Reset to first page

        this.relatedPage = 1;



        if (this.related.length > 0) {

          this.showSuccessAlert(`Found ${this.related.length} related transactions`, 'Related');

        } else {

          this.showInfoAlert('No related transactions found', 'Related');

        }

      },

      error: (err) => {

        this.relatedLoading = false;

        this.related = [];

        console.error('Error loading related transactions:', err);

        this.showErrorAlert('Could not load related transactions', 'Error');

      }

    });

  }



  getTransactionIdFromCase(caseData: any): string | null {

    if (!caseData) return null;



    // Priority 1: From transaction object

    if (caseData.transaction?.transaction_id) {

      return caseData.transaction.transaction_id;

    }



    // Priority 2: From case.transaction_id (if not an alert ID)

    if (caseData.transaction_id && !caseData.transaction_id.startsWith('ALT')) {

      return caseData.transaction_id;

    }



    if (caseData.alert?.transaction_id) {

      return caseData.alert.transaction_id;

    }



    return null;

  }



  closeSelected(): void {

    this.selected = null;

    this.activeTab = 'overview';

  }



  updateWorkflowSteps(): void {

    if (!this.selected) return;



    const s = this.selected.status || 'OPEN';

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



  updateSlaIndicators(): void {

    // Refresh SLA indicators without full reload

    this.applyFilter();

  }



  // ============= CASE ACTIONS =============

  assignSelected(): void {

    const name = this.assignAnalyst || prompt('Assign to (analyst name):', 'Analyst');

    if (!name || !this.selected) return;



    this.finca.assignCase(this.selected.id, name).subscribe({

      next: (r) => {

        this.selected.assigned_to = name;

        this.selected.status = 'INVESTIGATING';

        if (this.assignPriority) {

          this.selected.priority = this.assignPriority;

        }

        this.pushTimeline(`Assigned to ${name}${this.assignNotes ? ': ' + this.assignNotes : ''}`);

        this.updateWorkflowSteps();

        this.assignNotes = '';

        this.showSuccessAlert(`Assigned to ${name}`, 'Case Assigned');

        this.adjustRisk(3, `Assigned to ${name}`);

      },

      error: (err) => {
  console.error('Assignment failed:', err);

  this.showErrorAlert(
    'Failed to assign case. Please try again.',
    'Assignment Failed'
  );
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

    this.showSuccessAlert('Case unassigned successfully', 'Assignment Successful');

  }



  reassignCase(): void {

    this.assignAnalyst = '';

    this.activeTab = 'assignment';

    this.showInfoAlert('Select a new analyst and confirm assignment', 'Reassign');

  }



  startInvestigation(): void {

    if (!this.canModifyCase()) {
      return;
    }

    this.selected.status = 'INVESTIGATING';

    this.pushTimeline('Investigation started');

    this.activeTab = 'investigation';

    this.updateWorkflowSteps();

    this.adjustRisk(5, 'Investigation started');

    this.finca.updateCaseLocal(this.selected.id, { status: 'INVESTIGATING' }).subscribe();

    this.showSuccessAlert('Investigation started successfully', 'Investigation Started');

  }



  // ============= NOTES =============



  addNote(): void {

    if (!this.selected || !this.noteText.trim()) {

      this.showWarningAlert('Please enter a note', 'Warning');

      return;

    }



    const note = `[${this.noteCategory}] ${this.noteText}`;



    this.finca.addCaseNote(this.selected.id, note, 'Analyst').subscribe({

      next: (r) => {

        if (r.case) {

          this.selected = { ...this.selected, ...r.case };

        } else {

          if (!this.selected.notes) this.selected.notes = [];

          this.selected.notes.push({

            timestamp: new Date().toISOString(),

            analyst: 'Analyst',

            note

          });

        }

        this.pushTimeline(`Note added: ${this.noteText.substring(0, 50)}...`);

        this.noteText = '';

        this.showSuccessAlert('Note saved', 'Investigation');

      },

      error: (err) => {
  console.error('Failed to add note:', err);

  this.showErrorAlert(
    'Failed to save note. Please try again.',
    'Add Note Failed'
  );
}

    });

  }

  canModifyCase(): boolean {

    if (!this.selected) {
      return false;
    }

    if (this.isCaseResolved()) {

      this.showWarningAlert(
        'This case has already been resolved. Reopen the case before making changes.',
        'Case Resolved'
      );

      return false;
    }

    return true;
  }



  // ============= INVESTIGATION CHECKS =============



  runCheck(type: string): void {

    if (!this.selected) return;



    (this.investigationChecks as any)[type] = true;



    const labels: any = {

      device: 'Device fingerprint verified',

      velocity: 'Velocity check passed',

      network: 'Network analysis complete'

    };



    if (type === 'device') {

      const suspicious = confirm('Run device analysis: Mark device as suspicious? Click OK if suspicious, Cancel if benign.');

      this.pushTimeline(suspicious ? 'Device check: suspicious' : 'Device check: benign');

      if (suspicious) {

        this.adjustRisk(10, `Investigation check: ${type} (suspicious)`);

      }

    } else {

      this.pushTimeline(labels[type] || `Check: ${type}`);

      const weights: any = { velocity: 8, network: 7 };

      const w = weights[type] || 5;

      this.adjustRisk(w, `Investigation check: ${type}`);

    }



    this.showSuccessAlert(`${labels[type] || type}`, 'Check Complete');

  }



  requestInfo(): void {

    const who = prompt('Request info from (e.g., Ops, Customer):', 'Ops');

    if (!who || !this.selected) return;

    this.pushTimeline(`Requested additional info from ${who}`);

    this.showSuccessAlert(`Info requested from ${who}`, 'Request Sent');

  }



  // ============= EVIDENCE =============



  onEvidenceUpload(event: any): void {

    const files = event.target.files;

    if (!files) return;



    for (let i = 0; i < files.length; i++) {

      this.evidenceFiles.push({

        name: files[i].name,

        size: files[i].size,

        uploaded_at: new Date().toISOString()

      });

    }

    this.pushTimeline(`${files.length} evidence file(s) uploaded`);

    this.showSuccessAlert(`${files.length} file(s) uploaded`, 'Evidence');

    event.target.value = '';

  }



  removeEvidence(i: number): void {

    this.evidenceFiles.splice(i, 1);

    this.showSuccessAlert('Evidence removed successfully', 'Evidence Updated');

  }



  addEvidenceLink(): void {

    const url = prompt('Evidence URL:');

    if (url) {

      this.evidenceFiles.push({

        name: url,

        uploaded_at: new Date().toISOString(),

        type: 'link'

      });

      this.pushTimeline(`Evidence link added: ${url}`);

      this.showSuccessAlert('Link added to evidence', 'Evidence');

    }

  }



  captureScreenshot(): void {

    this.evidenceFiles.push({

      name: 'screenshot_' + Date.now() + '.png',

      uploaded_at: new Date().toISOString(),

      type: 'screenshot'

    });

    this.pushTimeline('Screenshot captured');

    this.showSuccessAlert('Screenshot captured', 'Evidence');

  }



  exportEvidence(): void {

    if (this.evidenceFiles.length === 0) {

      this.showWarningAlert('No evidence to export', 'Export');

      return;

    }

    this.showInfoAlert(`Bundling ${this.evidenceFiles.length} evidence items`, 'Export');

    // Simulate download

    setTimeout(() => {

      this.showSuccessAlert('Evidence bundle ready for download', 'Export');

    }, 1500);

  }



  // ============= ESCALATION =============



  escalate(): void {

    if (!this.selected) return;



    const level = this.escalationLevel || 'URGENT';



    this.finca.escalateCase(

      this.selected.id,

      level,

      this.escalationReason,

      this.escalationNotify,

      'Supervisor'

    ).subscribe({

      next: () => {

        this.selected.priority = 'URGENT';

        this.pushTimeline(`Escalated to ${level}: ${this.escalationReason || 'No reason provided'}`);

        this.updateWorkflowSteps();

        this.adjustRisk(20, `Escalated to ${level}`);

        this.showSuccessAlert(`Escalated to ${level}`, 'Escalation Successful');

      },

      error: (err) => {
  console.error('Failed to escalate case:', err);

  this.showCriticalError(
    'Failed to escalate case. Please try again.',
    'Escalation Failed'
  );
}

    });

  }



  escalateToLegal(): void {

    this.escalationLevel = 'LEGAL';

    this.escalate();

  }



  flagForCompliance(): void {

    this.pushTimeline('Flagged for compliance review');

    this.activeTab = 'escalation';

    this.showSuccessAlert('Case flagged for compliance review', 'Compliance Action Successful');

  }



  // ============= RESOLUTION =============



  async markFraud(): Promise<void> {

    if (!this.selected) return;

    const confirmed = await this.confirmAction(
      'Confirm Fraud',
      'Are you sure you want to mark this case as confirmed fraud?',
      'Mark as Fraud'
    );

    if (!confirmed) return;

    const notes = this.resolutionNotes || 'Marked by analyst';



    this.finca.resolveCase(this.selected.id, 'FRAUD_CONFIRMED', notes, 'Analyst').subscribe({

      next: (r: any) => {

        this.selected.status = 'RESOLVED';
        this.activeTab = 'resolution';

        this.selected.resolution = r.case?.resolution || {

          verdict: 'FRAUD_CONFIRMED',

          resolved_at: new Date().toISOString(),

          resolved_by: 'Analyst',

          notes

        };

        this.adjustRisk(1000, 'Case resolved: FRAUD CONFIRMED');

        this.pushTimeline('Case resolved: FRAUD CONFIRMED');

        this.updateWorkflowSteps();

        this.loadAll(true);

        this.showSuccessAlert('Case marked as fraud', 'Resolution Successful');

      },

      error: (err) => {
  console.error('Failed to resolve fraud case:', err);

  this.showErrorAlert(
    'Failed to resolve case. Please try again.',
    'Resolution Failed'
  );
}

    });

  }



  async markFalsePositive(): Promise<void> {

    if (!this.selected) return;

    const confirmed = await this.confirmAction(
      'Confirm False Positive',
      'Are you sure you want to resolve this case as a false positive?',
      'Confirm'
    );

    if (!confirmed) return;

    const notes = this.resolutionNotes || 'Marked false positive';



    this.finca.resolveCase(this.selected.id, 'FALSE_POSITIVE', notes, 'Analyst').subscribe({

      next: (r: any) => {

        this.selected.status = 'RESOLVED';

        this.selected.resolution = r.case?.resolution || {

          verdict: 'FALSE_POSITIVE',

          resolved_at: new Date().toISOString(),

          resolved_by: 'Analyst',

          notes

        };

        this.adjustRisk(-50, 'Case resolved: FALSE POSITIVE');

        this.pushTimeline('Case resolved: FALSE POSITIVE');

        this.updateWorkflowSteps();



      this.loadAll();
      this.selected = null;

      this.showSuccessAlert(
       'Case resolved as false positive',
       'Resolution Successful'
);

      },

      error: (err) => {
  console.error('Failed to resolve fraud case:', err);

  this.showErrorAlert(
    'Failed to resolve case as false positive.',
    'Resolution Failed'
  );
}

    });

  }



  allowTransaction(): void {

    if (!this.selected) return;



    const txnId = this.selected.transaction_id || this.selected.alert_id || prompt('Transaction ID to allow:');

    if (!txnId) return;



    this.finca.allowTransaction(txnId).subscribe({

      next: () => {

        this.pushTimeline(`Transaction ${txnId} allowed`);

        this.showSuccessAlert('Transaction allowed', 'Action');

      },

      error: () => {

        this.pushTimeline(`Transaction ${txnId} allowed (local)`);

        this.showErrorAlert('The transaction could not be allowed on the server. The action was recorded locally only.', 'Action Failed');

      }

    });

  }



  async forceClose(): Promise<void> {

    if (!this.selected) return;

    const confirmed = await this.confirmAction(
      'Force Close Case?',
      'This will close the case outside the normal resolution flow.',
      'Force Close'
    );

    if (!confirmed) return;

    this.selected.status = 'CLOSED';
    this.activeTab = 'resolution';

    this.pushTimeline('Case force closed');

    this.updateWorkflowSteps();

    this.finca.updateCaseLocal(this.selected.id, { status: 'CLOSED' }).subscribe(() => this.loadAll(true));

    this.showSuccessAlert('Case force closed successfully', 'Case Closed');

  }



  reopenCase(): void {

    if (!this.selected) return;



    this.selected.status = 'OPEN';
    this.activeTab = 'overview';

    this.selected.resolution = null;

    this.pushTimeline('Case reopened');

    this.updateWorkflowSteps();

    this.finca.updateCaseLocal(this.selected.id, { status: 'OPEN', resolution: null }).subscribe();

    this.showSuccessAlert('Case reopened successfully', 'Reopen Successful');

  }



  async deleteCase(caseId?: string): Promise<void> {

    const id = caseId || this.selected?.id;

    if (!id) return;

    const confirmed = await this.confirmAction(
      'Delete Case?',
      'This action is permanent and the case will be deleted.',
      'Delete'
    );

    if (!confirmed) return;

    this.finca.deleteCaseLocal(id).subscribe(() => {

      this.cases = this.cases.filter(c => c.id !== id);

      if (this.selected && this.selected.id === id) {

        this.selected = null;

      }

      this.applyFilter();

      this.computeStats();

      this.showSuccessAlert('Case deleted locally successfully', 'Delete Successful');

    });

  }



  // ============= PLAYBOOK =============



  resetPlaybook(): void {

    this.playbookItems.forEach(p => p.done = false);

    this.showSuccessAlert('Playbook reset successfully', 'Playbook Updated');

  }



  togglePlaybookItem(item: any): void {

    item.done = !item.done;

    if (item.done) {

      this.pushTimeline(`Playbook: ${item.label} completed`);

      this.adjustRisk(5, `Playbook item completed: ${item.label}`);

    }



    const done = this.playbookItems.filter(p => p.done).length;

    if (done === this.playbookItems.length) {

      this.showSuccessAlert('Investigation playbook complete! 🎉', 'Playbook');

    }

  }



  getPlaybookProgress(): number {

    return Math.round((this.playbookItems.filter(p => p.done).length / this.playbookItems.length) * 100);

  }



  // ============= CUSTOMER ACTIONS =============



  openCustomerProfile(): void {

    this.loadCustomerProfile();

    this.showCustomerModal = true;

  }



  flagCustomer(): void {

    this.pushTimeline(`Customer ${this.selected?.customer_id} flagged`);

    this.showSuccessAlert(`Customer ${this.selected?.customer_id} flagged for review`, 'Customer Flagged');

  }



  async blockCustomer(): Promise<void> {

    const confirmed = await this.confirmAction(
      'Block Customer?',
      'This will block the customer account.',
      'Block Customer'
    );

    if (!confirmed) return;

    this.pushTimeline(`Customer ${this.selected?.customer_id} blocked (simulated)`);
    this.showSuccessAlert(`Customer ${this.selected?.customer_id} account blocked`, 'Block Action Successful');

  }



  sendCustomerAlert(): void {

    this.pushTimeline('Alert SMS sent to customer (simulated)');

    this.showSuccessAlert('Customer alert SMS sent', 'Alert Sent');

  }



  // ============= NAVIGATION =============



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

    if (!id) {

      this.showWarningAlert('No transaction ID available for graph', 'Warning');

      return;

    }

    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/investigation-graph', id]);

  }



  linkCase(): void {

    const id = prompt('Link to case ID:');

    if (id) {

      this.pushTimeline(`Linked to case ${id}`);

      this.showSuccessAlert(`Linked to case ${id}`, 'Link');

    }

  }



  printCase(): void {

    window.print();

  }



  exportCases(): void {

    this.downloadCsv(this.filteredCases, 'cases');

  }



  // ============= USER FEEDBACK =============

  /**
   * Routine success feedback is non-blocking.
   */
  private showSuccessAlert(message: string, title: string = 'Success'): void {

    this.toastr.success(message, title, {
      timeOut: 2500,
      closeButton: true,
      progressBar: true
    });

  }

  /**
   * Routine errors are shown as non-blocking toasts.
   */
  private showErrorAlert(message: string, title: string = 'Error'): void {

    this.toastr.error(message, title, {
      timeOut: 5000,
      closeButton: true,
      progressBar: true
    });

  }

  /**
   * Validation and ordinary warnings are non-blocking.
   */
  private showWarningAlert(message: string, title: string = 'Warning'): void {

    this.toastr.warning(message, title, {
      timeOut: 3500,
      closeButton: true,
      progressBar: true
    });

  }

  /**
   * Informational feedback is non-blocking.
   */
  private showInfoAlert(message: string, title: string = 'Information'): void {

    this.toastr.info(message, title, {
      timeOut: 3000,
      closeButton: true,
      progressBar: true
    });

  }

  /**
   * SweetAlert is reserved for important failures requiring acknowledgement.
   */
  private showCriticalError(message: string, title: string = 'Action Failed'): void {

    Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonText: 'OK',
      allowOutsideClick: false
    });

  }

  /**
   * SweetAlert confirmation for consequential/destructive actions only.
   */
  private async confirmAction(
    title: string,
    message: string,
    confirmText: string = 'Confirm'
  ): Promise<boolean> {

    const result = await Swal.fire({
      icon: 'warning',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true
    });

    return result.isConfirmed;

  }

  // ============= UTILITY =============



  pushTimeline(action: string): void {

    if (!this.selected) return;

    if (!this.selected.timeline) this.selected.timeline = [];

    this.selected.timeline.unshift({

      timestamp: new Date().toISOString(),

      action,

      actor: 'Analyst'

    });

  }



  adjustRisk(delta: number, action?: string): void {

    if (!this.selected) return;



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



    let level = 'LOW';

    if (newScore >= 80) level = 'CRITICAL';

    else if (newScore >= 60) level = 'HIGH';

    else if (newScore >= 40) level = 'MEDIUM';

    this.selected.final_risk_level = level;



    if (action) {

      this.pushTimeline(`${action} (Risk: ${current} → ${newScore})`);

    }



    this.finca.updateCaseLocal(this.selected.id, {

      risk_score: newScore,

      final_risk_level: level

    }).subscribe();



    const idx = this.cases.findIndex(c => c.id === this.selected.id);

    if (idx >= 0) {

      this.cases[idx] = { ...this.cases[idx], ...this.selected };

    }

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



  // ============= BADGE HELPERS =============



  getRiskBadge(level: string): string {

    const map: any = {

      'CRITICAL': 'bg-danger',

      'HIGH': 'bg-warning text-dark',

      'MEDIUM': 'bg-info text-dark',

      'LOW': 'bg-success'

    };

    return map[level] || 'bg-secondary';

  }

  isCaseResolved(): boolean {
    const status = (this.selected?.status || '').toUpperCase();

    return status === 'RESOLVED' || status === 'CLOSED';
  }

  get visibleDetailTabs(): any[] {
    if (!this.isCaseResolved()) {
      return this.detailTabs;
    }

    // Resolved/closed cases become read-only.
    return this.detailTabs.filter(tab =>
      ['overview', 'customer', 'resolution', 'timeline'].includes(tab.id)
    );
  }



  getStatusBadge(status: string): string {

    const map: any = {

      'OPEN': 'bg-primary',

      'INVESTIGATING': 'bg-info',

      'RESOLVED': 'bg-success',

      'CLOSED': 'bg-secondary'

    };

    return map[status] || 'bg-secondary';

  }



  getRiskGradient(c: any): string {

    const score = this.getDisplayScore(c);

    if (score >= 80) return 'linear-gradient(135deg, #ff6b6b, #ee5a24)';

    if (score >= 60) return 'linear-gradient(135deg, #feca57, #ff9f43)';

    if (score >= 40) return 'linear-gradient(135deg, #48dbfb, #0abde3)';

    return 'linear-gradient(135deg, #1dd1a1, #10ac84)';

  }



  // ============= SLA HELPERS =============



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



    if (remaining <= 0) {

      return { label: 'BREACHED', class: 'bg-danger', pct: 100 };

    }



    const hrs = Math.floor(remaining / 3600000);

    const mins = Math.floor((remaining % 3600000) / 60000);

    const label = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;

    const cls = pct >= 80 ? 'bg-danger' : pct >= 60 ? 'bg-warning text-dark' : 'bg-success';



    return { label, class: cls, pct };

  }



  // ============= ACTIVITY FEED =============



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



  jumpToCase(caseId: string): void {

    const c = this.cases.find(x => x.id === caseId);

    if (c) {

      this.selectCase(c);

    } else {

      this.showWarningAlert('Case not found', 'Warning');

    }

  }



  // ============= HIGH RISK USERS =============



  aggregateHighRiskUsers(): any[] {

    const map: any = {};

    (this.cases || []).forEach((c: any) => {

      if (c.final_risk_level === 'HIGH' || c.final_risk_level === 'CRITICAL') {

        if (!map[c.customer_id]) {

          map[c.customer_id] = {

            customer_id: c.customer_id,

            cases: 0,

            highest: c.final_risk_level,

            score: c.risk_score || c.display_score || 0

          };

        }

        map[c.customer_id].cases += 1;

        if (c.risk_score > map[c.customer_id].score) {

          map[c.customer_id].score = c.risk_score;

        }

        if (c.final_risk_level === 'CRITICAL') {

          map[c.customer_id].highest = 'CRITICAL';

        }

      }

    });

    return Object.keys(map).map(k => map[k]).sort((a: any, b: any) => b.score - a.score);

  }



  selectHighRiskUser(customerId: string): void {

    this.filterText = customerId;

    this.applyFilter();

    this.showSuccessAlert(`Filtering cases for customer: ${customerId}`, 'Filter Applied');

  }



  // ============= EXPORT =============



  downloadCsv(rows: any[], filename: string): void {

    if (!rows.length) {

      this.showWarningAlert('Nothing to export', 'Export');

      return;

    }



    const headers = ['id', 'customer_id', 'status', 'priority', 'final_risk_level', 'risk_score', 'assigned_to', 'created_at'];

    const csv = [headers.join(',')].concat(

      rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))

    ).join('\n');



    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);

    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;

    a.click();

    this.showSuccessAlert(`Exported ${rows.length} rows`, 'CSV');

  }



  // ============= FORMAT HELPERS =============



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