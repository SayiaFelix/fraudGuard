import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';

@Component({
  selector: 'app-rule-management',
  templateUrl: './rule-management.component.html',
  styleUrls: ['./rule-management.component.scss']
})
export class RuleManagementComponent implements OnInit {
  public view: string = 'list';

  loading = false;
  filterCategory = '';
  filterStatus = '';
  rules: any[] = [];
  ruleStats: any = {
    total_rules: 0,
    active_rules: 0,
    inactive_rules: 0,
    by_category: {},
    top_rules: []
  };
  selectedRule: any = null;

  currentPage = 1;
  itemsPerPage = 5;
  Math = Math;

  statusAlert = {
    show: false,
    title: '',
    message: '',
    icon: '',
    iconColor: ''
  };

  showReport = false;
  reportSummary: any = null;

  mockTrends = [
    '0,25 15,10 30,20 45,5 60,15 80,10',
    '0,5 15,20 30,10 45,25 60,5 80,15',
    '0,20 15,25 30,5 45,15 60,10 80,20',
    '0,10 15,5 30,25 45,10 60,20 80,5'
  ];

  newRule: any = this.getDefaultRule();

  simulatorInput = '';
  simulationResult: any = null;

  constructor(private httpService: HttpService) { }

  ngOnInit(): void {
    this.loadRules();
    this.loadRuleStats();
    this.resetSimulatorInput();
  }

  getDefaultRule(): any {
    return {
      name: '',
      description: '',
      category: 'TIME',
      priority: 9,
      is_active: true,
      conditions: {
        field: 'transaction_hour',
        operator: 'between',
        value: [0, 5]
      },
      action: {
        risk_points: 15,
        decision: 'CHALLENGE',
        alert: true
      },
      created_by: 'Analyst'
    };
  }

  private normalizeRulePayload(rule: any): any {
    const rawConditions = rule?.conditions || {};
    const rawAction = rule?.action || {};

    return {
      name: rule?.name?.trim(),
      description: rule?.description?.trim(),
      category: rule?.category || 'TIME',
      priority: Number(rule?.priority ?? 1),
      is_active: !!rule?.is_active,
      conditions: {
        field: rawConditions.field || '',
        operator: rawConditions.operator || 'equals',
        value: this.normalizeConditionValue(rawConditions),
        ...(rawConditions.amount_threshold !== undefined
          ? { amount_threshold: Number(rawConditions.amount_threshold) }
          : {})
      },
      action: {
        risk_points: Number(rawAction.risk_points ?? 0),
        decision: rawAction.decision || 'FLAG',
        alert: !!rawAction.alert
      },
      ...(rule?.created_by ? { created_by: rule.created_by } : {})
    };
  }

  private normalizeConditionValue(condition: any): any {
    if (!condition) {
      return '';
    }

    const value = condition.value;

    if (condition.operator === 'between') {
      if (Array.isArray(value)) {
        return value.map((v: any) => this.toPrimitive(v));
      }

      if (typeof value === 'string') {
        const parts = value
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v !== '');

        return parts.map((v: string) => this.toPrimitive(v));
      }

      return [];
    }

    if (condition.operator === 'is_new') {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return !!value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return '';
      }

      if (trimmed === 'true' || trimmed === 'false') {
        return trimmed === 'true';
      }

      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }

      return trimmed;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v: any) => this.toPrimitive(v));
    }

    return value;
  }

  private toPrimitive(value: any): any {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return '';
      }

      if (trimmed === 'true' || trimmed === 'false') {
        return trimmed === 'true';
      }

      const numeric = Number(trimmed);

      if (!Number.isNaN(numeric)) {
        return numeric;
      }

      return trimmed;
    }

    return value;
  }

  get filteredRules() {
    return this.rules.filter((rule) => {
      const matchesCategory =
        !this.filterCategory || rule.category === this.filterCategory;

      let matchesStatus = true;

      if (this.filterStatus === 'active') {
        matchesStatus = rule.is_active === true;
      } else if (this.filterStatus === 'inactive') {
        matchesStatus = rule.is_active === false;
      }

      return matchesCategory && matchesStatus;
    });
  }

  get paginatedRules() {
    const filtered = this.filteredRules;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalVisibleItems(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredRules.length);
  }

  isLastPage(): boolean {
    return this.currentPage * this.itemsPerPage >= this.filteredRules.length;
  }

  onPageChange() {
    this.currentPage = 1;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (!this.isLastPage()) {
      this.currentPage++;
    }
  }

  loadRules() {
    this.loading = true;

    this.httpService.getRules().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res?.rules) ? res.rules : [];

        this.rules = list.map((rule: any, index: number) => ({
          ...rule,
          accuracy: (96 + Math.random() * 3.8).toFixed(1),
          impact: (Math.floor(Math.random() * 500000) + 50000).toLocaleString(),
          trendPoints: this.mockTrends[index % this.mockTrends.length]
        }));

        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching rules:', err);
        this.loading = false;
      }
    });
  }

  loadRuleStats() {
    this.httpService.getRuleStats().subscribe({
      next: (res: any) => {
        this.ruleStats = res?.stats || this.ruleStats;
      },
      error: (err: any) => {
        console.error('Error fetching rule stats:', err);
      }
    });
  }

  applyAiOptimization() {
    this.loading = true;

    this.newRule = {
      name: 'AI Optimized: Midnight Withdrawal Filter',
      description: 'Automatically suggested to prevent midnight mobile withdrawal spikes.',
      category: 'TIME',
      priority: 9,
      is_active: true,
      conditions: {
        field: 'transaction_hour',
        operator: 'between',
        value: [0, 5]
      },
      action: {
        risk_points: 25,
        decision: 'CHALLENGE',
        alert: true
      },
      created_by: 'Analyst'
    };

    setTimeout(() => {
      this.view = 'create';
      this.loading = false;
    }, 800);
  }

  saveRule() {
    if (!this.newRule?.name?.trim()) {
      this.triggerProfessionalAlert(
        'Missing rule name',
        'Please enter a valid rule name before deploying.',
        'bi-exclamation-triangle',
        'text-warning'
      );
      return;
    }

    this.loading = true;

    const payload = this.normalizeRulePayload(this.newRule);

    if (this.view === 'edit' && this.newRule.id) {
      this.httpService.updateRule(this.newRule.id, payload).subscribe({
        next: () => {
          this.loadRules();
          this.loadRuleStats();
          this.showList();
          this.triggerProfessionalAlert(
            'Rule Updated',
            'The rule has been updated successfully.',
            'bi-shield-check',
            'text-success'
          );
        },
        error: (err: any) => {
          console.error('Error updating rule:', err);
          this.loading = false;
        }
      });
      return;
    }

    this.httpService.createRule(payload).subscribe({
      next: () => {
        this.loadRules();
        this.loadRuleStats();
        this.showList();
        this.triggerProfessionalAlert(
          'Rule Deployed',
          'New fraud prevention logic is now operational.',
          'bi-check-circle',
          'text-success'
        );
      },
      error: (err: any) => {
        console.error('Error creating rule:', err);
        this.loading = false;
      }
    });
  }

  editRule(ruleId: string) {
    this.loading = true;

    this.httpService.getRule(ruleId).subscribe({
      next: (res: any) => {
        const rule = res?.rule || res;

        this.newRule = {
          ...rule,
          conditions: {
            ...(rule.conditions || {}),
            value: rule.conditions?.value ?? ''
          },
          action: {
            ...(rule.action || {})
          }
        };

        this.view = 'edit';
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading rule:', err);
        this.loading = false;
      }
    });
  }

  generateAiReport() {
    this.loading = true;

    setTimeout(() => {
      this.reportSummary = {
        period: 'Last 30 Days',
        totalAnalyzed: '1,240,580',
        threatsBlocked: '842',
        savings: '45,200,000',
        precision: '99.1%',
        topVector: 'Midnight Mobile Withdrawals'
      };

      this.loading = false;
      this.showReport = true;
    }, 1000);
  }

  closeReport() {
    this.showReport = false;
  }

  toggleRuleStatus(rule: any) {
    this.httpService.toggleRule(rule.id).subscribe({
      next: (res: any) => {
        const updated = res?.rule || res?.data?.rule || rule;
        rule.is_active = updated.is_active;
        this.loadRuleStats();

        if (rule.is_active) {
          this.triggerProfessionalAlert(
            'Rule Operational',
            `Monitoring for ${rule.id} has started.`,
            'bi-play-fill',
            'text-success'
          );
        } else {
          this.triggerProfessionalAlert(
            'Rule Suspended',
            `Decision logic for ${rule.id} is now inactive.`,
            'bi-pause-fill',
            'text-warning'
          );
        }
      },
      error: (err: any) => {
        console.error('Error toggling rule:', err);
      }
    });
  }

  deleteRule(rule: any) {
    if (!rule?.id || !window.confirm(`Delete rule ${rule.id}?`)) {
      return;
    }

    this.loading = true;

    this.httpService.deleteRule(rule.id).subscribe({
      next: (res: any) => {
        this.rules = this.rules.filter((item) => item.id !== rule.id);
        this.loadRuleStats();
        this.loading = false;
        this.triggerProfessionalAlert(
          'Rule Deleted',
          res?.message || `Rule ${rule.id} was deleted successfully.`,
          'bi-trash3',
          'text-success'
        );
      },
      error: (err: any) => {
        console.error('Error deleting rule:', err);
        this.loading = false;
      }
    });
  }

  triggerProfessionalAlert(title: string, message: string, icon: string, iconColor: string) {
    this.statusAlert = { show: true, title, message, icon, iconColor };

    setTimeout(() => {
      this.statusAlert.show = false;
    }, 3000);
  }

  runSimulation() {
    if (!this.selectedRule) return;

    this.loading = true;

    try {
      const payload = {
        transaction: JSON.parse(this.simulatorInput)
      };

      this.httpService.simulateRule(payload).subscribe({
        next: (res: any) => {
          this.simulationResult = res?.simulation?.result || res;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Simulation failed:', err);
          this.loading = false;
        }
      });
    } catch (e) {
      alert('Invalid JSON format.');
      this.loading = false;
    }
  }

  showList() {
    this.view = 'list';
    this.simulationResult = null;
  }

  showCreateForm() {
    this.newRule = this.getDefaultRule();
    this.view = 'create';
  }

  openSimulator(rule: any) {
    this.selectedRule = rule;
    this.view = 'simulator';
    this.simulationResult = null;
    this.resetSimulatorInput();
  }

  resetSimulatorInput() {
    this.simulatorInput = JSON.stringify(
      {
        customer_id: 'CUST-003',
        transaction_amount: 6000000,
        transaction_hour: 2,
        channel: 'mobile',
        location: 'Nairobi',
        device_type: 'new',
        beneficiary: 'NEW_BEN_7',
        tx_count_last_hour: 7,
        avg_transaction_amount: 1000000,
        normal_location: 'Kampala'
      },
      null,
      2
    );
  }

  getPriorityClass(priority: number) {
    if (priority >= 8) return 'bg-danger';
    if (priority >= 5) return 'bg-warning text-dark';
    return 'bg-info text-dark';
  }
}