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

  // DEMO DATA: Hardcoded trend paths for the SVG sparklines
  mockTrends = [
    "0,25 15,10 30,20 45,5 60,15 80,10",
    "0,5 15,20 30,10 45,25 60,5 80,15",
    "0,20 15,25 30,5 45,15 60,10 80,20",
    "0,10 15,5 30,25 45,10 60,20 80,5"
  ];

  newRule = {
    name: '',
    description: '',
    category: 'GENERAL',
    priority: 5,
    is_active: true,
    conditions: { field: 'transaction_amount', operator: 'greater_than', value: 100000 },
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
            ...rule, // Keep all your real API data (id, name, status, etc.)
            // Add creative hardcoded data for the demo visuals:
            accuracy: (96 + Math.random() * 3.8).toFixed(1), // Fake accuracy e.g. 98.4%
            impact: (Math.floor(Math.random() * 5000) + 500).toLocaleString(), // Fake ROI e.g. 1,200
            trendPoints: this.mockTrends[index % this.mockTrends.length] // Assign a fake graph line
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

  saveRule() {
    this.loading = true;
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