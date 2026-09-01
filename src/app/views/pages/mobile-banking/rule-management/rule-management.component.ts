import { Component, OnInit } from '@angular/core';
import { RuleService } from './rule-management.service'; 

@Component({
  selector: 'app-rule-management',
  templateUrl: './rule-management.component.html',
  styleUrls: ['./rule-management.component.scss']
})
export class RuleManagementComponent implements OnInit {
  view: 'list' | 'create' | 'simulator' | 'edit' = 'list';
  loading: boolean = false;
  filterCategory: string = '';
  filterStatus: string = '';
  rules: any[] = [];
  selectedRule: any = null;

  // REPORT MODAL STATE
  showReport: boolean = false;
  reportSummary: any = null;

  // DEMO DATA: Hardcoded trend paths for the SVG sparklines
  mockTrends = [
    "0,25 15,10 30,20 45,5 60,15 80,10",
    "0,5 15,20 30,10 45,25 60,5 80,15",
    "0,20 15,25 30,5 45,15 60,10 80,20",
    "0,10 15,5 30,25 45,10 60,20 80,5"
  ];

  newRule = {
    id: '',
    name: '',
    description: '',
    category: 'GENERAL',
    priority: 5,
    is_active: true,
    // FIX: value is now defined more flexibly to allow strings or numbers
    conditions: { field: 'transaction_amount', operator: 'greater_than', value: 100000 as any },
    action: { risk_points: 10, decision: 'CHALLENGE', alert: true }
  };

  simulatorInput: string = '';
  simulationResult: any = null;

  constructor(private ruleService: RuleService) {}

  ngOnInit(): void {
    this.loadRules();
    this.resetSimulatorInput();
  }

  loadRules() {
    this.loading = true;
    this.ruleService.getRules().subscribe({
      next: (res: any) => {
        // ENRICHMENT: We take the real rules from your API and add hardcoded metrics for the demo
        this.rules = res.rules.map((rule: any, index: number) => {
          return {
            ...rule, 
            accuracy: (96 + Math.random() * 3.8).toFixed(1),
            impact: (Math.floor(Math.random() * 500000) + 50000).toLocaleString(), 
            trendPoints: this.mockTrends[index % this.mockTrends.length]
          };
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching rules:', err);
        this.loading = false;
      }
    });
  }

  // NEW METHOD: Handles the AI Suggestion "Apply Optimization" button
  applyAiOptimization() {
    this.loading = true;

    // We simulate the AI "typing" out the suggested rule
    this.newRule = {
      id: 'AI-' + Math.floor(Math.random() * 1000),
      name: 'AI Optimized: Midnight Withdrawal Filter',
      description: 'Automatically suggested to prevent midnight mobile withdrawal spikes.',
      category: 'TIME',
      priority: 9,
      is_active: true,
      conditions: { 
        field: 'transaction_hour', 
        operator: 'between', 
        value: '00:00 - 04:00' // This will now work without error
      },
      action: { 
        risk_points: 25, 
        decision: 'CHALLENGE', 
        alert: true 
      }
    };

    setTimeout(() => {
      this.view = 'create'; 
      this.loading = false;
    }, 1200); 
  }

  saveRule() {
    this.loading = true;

    if (this.view === 'edit') {
      const service = this.ruleService as any;
      if (service.updateRule) {
        service.updateRule(this.newRule['id'], this.newRule).subscribe({
          next: () => { this.loadRules(); this.showList(); },
          error: (err: any) => { console.error(err); this.loading = false; }
        });
      } else {
        const index = this.rules.findIndex(r => r.id === this.newRule['id']);
        if (index !== -1) {
          this.rules[index] = { ...this.newRule, accuracy: '98.2', impact: '145,000', trendPoints: this.mockTrends[0] };
        } else {
          this.rules.unshift({ ...this.newRule, id: this.newRule['id'] || 'R-005', accuracy: '94.5', impact: '85,000', trendPoints: this.mockTrends[2] });
        }
        setTimeout(() => { this.loadRules(); this.showList(); }, 800);
      }
    } else {
      this.ruleService.createRule(this.newRule).subscribe({
        next: (res: any) => {
          this.loadRules();
          this.showList();
        },
        error: (err: any) => {
          console.error('Error creating rule:', err);
          this.loading = false;
        }
      });
    }
  }

  editRule(ruleId: string) {
    this.loading = true;
    let ruleToEdit = this.rules.find(r => r.id === ruleId);

    if (ruleToEdit) {
      this.newRule = JSON.parse(JSON.stringify(ruleToEdit));
    } else {
      this.newRule = {
        id: ruleId,
        name: 'High False-Positive Optimization (' + ruleId + ')',
        description: 'Reviewing logic based on AI anomaly detection.',
        category: 'AMOUNT',
        priority: 7,
        is_active: true,
        conditions: { field: 'transaction_amount', operator: 'greater_than', value: 150000 },
        action: { risk_points: 15, decision: 'CHALLENGE', alert: true }
      };
    }

    setTimeout(() => {
      this.view = 'edit';
      this.loading = false;
    }, 600);
  }

  // NEW METHOD: AI Traffic Report Generation
  generateAiReport() {
    this.loading = true;
    
    // Simulate AI analyzing traffic and generating a scorecard
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
    }, 1500);
  }

  closeReport() {
    this.showReport = false;
  }

  toggleRuleStatus(rule: any) {
    this.ruleService.toggleRule(rule.id).subscribe({
      next: (res: any) => {
        rule.is_active = res.rule.is_active;
      },
      error: (err: any) => console.error('Error toggling rule:', err)
    });
  }

  runSimulation() {
    if (!this.selectedRule) return;
    this.loading = true;
    try {
      const payload = {
        rule_id: this.selectedRule.id,
        transaction: JSON.parse(this.simulatorInput)
      };
      this.ruleService.simulateRule(payload).subscribe({
        next: (res: any) => {
          this.simulationResult = res.simulation.result;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Simulation failed:', err);
          this.loading = false;
        }
      });
    } catch (e) {
      alert("Invalid JSON format.");
      this.loading = false;
    }
  }

  showList() { this.view = 'list'; this.simulationResult = null; }
  showCreateForm() { this.view = 'create'; }
  openSimulator(rule: any) {
    this.selectedRule = rule;
    this.view = 'simulator';
    this.simulationResult = null;
    this.resetSimulatorInput();
  }

  resetSimulatorInput() {
    this.simulatorInput = JSON.stringify({
      "customer_id": "CUST-003",
      "transaction_amount": 500000,
      "transaction_hour": 2,
      "channel": "mobile",
      "location": "Nairobi"
    }, null, 2);
  }

  getPriorityClass(priority: number) {
    if (priority >= 8) return 'bg-danger';
    if (priority >= 5) return 'bg-warning text-dark';
    return 'bg-info text-dark';
  }
}