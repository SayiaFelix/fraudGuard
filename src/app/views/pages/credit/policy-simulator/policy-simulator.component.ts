
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { PolicySettings } from '../credit-demo.data';
import {
  CreditDataService,
  SimulationResult
} from '../credit-data.service';

type DecisionType = 'approved' | 'referred' | 'declined';

interface DecisionSummary {
  key: DecisionType;
  label: string;
  current: number;
  proposed: number;
  currentPct: number;
  proposedPct: number;
  difference: number;
  colorClass: string;
}

@Component({
  selector: 'app-policy-simulator',
  templateUrl: './policy-simulator.component.html',
  styleUrls: ['./policy-simulator.component.scss']
})
export class PolicySimulatorComponent
  implements OnInit, OnDestroy {

  // Current saved policy
  currentPolicy: PolicySettings = {
    approveFrom: 700,
    declineBelow: 580,
    maxDti: 0.45,
    maxAmount: 2000000
  };

  // Editable scenario
  draft: PolicySettings = {
    approveFrom: 700,
    declineBelow: 580,
    maxDti: 0.45,
    maxAmount: 2000000
  };

  result: SimulationResult | null = null;

  saved = false;
  loading = false;

  hasChanges = false;
  validationError = '';

  activeTab: 'overview' | 'applications' = 'overview';

  searchTerm = '';
  decisionFilter = 'All';

  pageSize = 10;
  currentPage = 1;

  private sub = new Subscription();

  constructor(
    public credit: CreditDataService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.credit.policy$.subscribe(policy => {
        this.currentPolicy = { ...policy };

        // Do not discard an unsaved scenario if the
        // policy stream emits while the user is editing.
        if (!this.hasChanges) {
          this.draft = { ...policy };
        }

        this.run();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ----------------------------------------
  // POLICY VALIDATION
  // ----------------------------------------

  validatePolicy(): boolean {
    const p = this.draft;

    const values = [
      p.approveFrom,
      p.declineBelow,
      p.maxDti,
      p.maxAmount
    ];

    if (
      values.some(value =>
        !Number.isFinite(Number(value))
      )
    ) {
      this.validationError =
        'All policy parameters must contain valid numbers.';

      return false;
    }

    if (
      p.approveFrom < 620 ||
      p.approveFrom > 820
    ) {
      this.validationError =
        'The approval threshold must be between 620 and 820.';

      return false;
    }

    if (
      p.declineBelow < 450 ||
      p.declineBelow > 680
    ) {
      this.validationError =
        'The decline threshold must be between 450 and 680.';

      return false;
    }

    if (p.declineBelow >= p.approveFrom) {
      this.validationError =
        'The decline threshold must be lower than ' +
        'the automatic approval threshold.';

      return false;
    }

    if (
      p.maxDti < 0.25 ||
      p.maxDti > 0.70
    ) {
      this.validationError =
        'The maximum debt-to-income ratio ' +
        'must be between 25% and 70%.';

      return false;
    }

    if (
      p.maxAmount < 200000 ||
      p.maxAmount > 5000000
    ) {
      this.validationError =
        'The maximum loan amount must be between ' +
        'KES 200,000 and KES 5,000,000.';

      return false;
    }

    this.validationError = '';
    return true;
  }

  // ----------------------------------------
  // HANDLE POLICY CHANGES
  // ----------------------------------------

  onPolicyChange(): void {
    this.saved = false;

    this.draft = {
      approveFrom: Number(this.draft.approveFrom),
      declineBelow: Number(this.draft.declineBelow),
      maxDti: Number(this.draft.maxDti),
      maxAmount: Number(this.draft.maxAmount)
    };

    this.hasChanges = this.isPolicyModified();

    this.run();
  }

  isPolicyModified(): boolean {
    return (
      this.draft.approveFrom !==
        this.currentPolicy.approveFrom ||

      this.draft.declineBelow !==
        this.currentPolicy.declineBelow ||

      this.draft.maxDti !==
        this.currentPolicy.maxDti ||

      this.draft.maxAmount !==
        this.currentPolicy.maxAmount
    );
  }

  // ----------------------------------------
  // RUN SIMULATION
  // ----------------------------------------

  run(): void {
    if (!this.validatePolicy()) {
      this.result = null;
      return;
    }

    try {
      this.loading = true;

      // Use the existing shared simulation engine.
      // Do not implement another scoring engine here.
      this.result = this.credit.simulate({
        ...this.draft
      });

      this.currentPage = 1;
    } catch (error) {
      console.error(
        'Policy simulation failed:',
        error
      );

      this.validationError =
        'Unable to evaluate the proposed policy.';

      this.result = null;
    } finally {
      this.loading = false;
    }
  }

  // ----------------------------------------
  // APPLY POLICY
  // ----------------------------------------

  save(): void {
    if (!this.validatePolicy()) {
      return;
    }

    if (!this.hasChanges) {
      return;
    }

    try {
      const nextPolicy = {
        ...this.draft
      };

      // Existing shared data service.
      this.credit.updatePolicy(nextPolicy);

      this.currentPolicy = {
        ...nextPolicy
      };

      this.hasChanges = false;
      this.saved = true;

      this.run();
    } catch (error) {
      console.error(
        'Failed to apply policy:',
        error
      );

      this.validationError =
        'Unable to apply the selected policy.';
    }
  }

  // ----------------------------------------
  // RESET CHANGES
  // ----------------------------------------

  reset(): void {
    this.draft = {
      ...this.currentPolicy
    };

    this.saved = false;
    this.hasChanges = false;
    this.validationError = '';

    this.run();
  }

  // ----------------------------------------
  // FORMATTING
  // ----------------------------------------

  share(count: number, total: number): string {
    return this.credit.pct(count, total);
  }

  money(amount: number): string {
    return this.credit.money(amount);
  }

  percentage(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
  }

  countPercentage(
    count: number,
    total: number
  ): number {
    if (!total || total <= 0) {
      return 0;
    }

    return Number(
      ((count / total) * 100).toFixed(1)
    );
  }

  signedNumber(value: number): string {
    if (value > 0) {
      return `+${value}`;
    }

    return String(value);
  }

  getDifferenceClass(value: number): string {
    if (value > 0) {
      return 'positive';
    }

    if (value < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  getDecisionClass(
    decision: string
  ): string {
    const value = decision.toLowerCase();

    if (
      value.includes('approve')
    ) {
      return 'approved';
    }

    if (
      value.includes('refer') ||
      value.includes('review')
    ) {
      return 'referred';
    }

    if (
      value.includes('decline')
    ) {
      return 'declined';
    }

    return 'neutral';
  }

  // ----------------------------------------
  // RESULTS AND SUMMARY
  // ----------------------------------------

  get bookSize(): number {
    return this.result?.bookSize || 0;
  }

  get changedCount(): number {
    return this.result?.changeCount || 0;
  }

  get unchangedCount(): number {
    return Math.max(
      0,
      this.bookSize - this.changedCount
    );
  }

  get changedPercentage(): number {
    return this.countPercentage(
      this.changedCount,
      this.bookSize
    );
  }

  get unchangedPercentage(): number {
    return this.countPercentage(
      this.unchangedCount,
      this.bookSize
    );
  }

  get summary(): DecisionSummary[] {
    if (!this.result) {
      return [];
    }

    const sim = this.result;
    const total = sim.bookSize;

    const values: {
      key: DecisionType;
      label: string;
      colorClass: string;
    }[] = [
      {
        key: 'approved',
        label: 'Approved',
        colorClass: 'approved'
      },
      {
        key: 'referred',
        label: 'Manual Review',
        colorClass: 'referred'
      },
      {
        key: 'declined',
        label: 'Declined',
        colorClass: 'declined'
      }
    ];

    return values.map(item => {
      const current = sim.current[item.key];
      const proposed = sim.next[item.key];

      return {
        key: item.key,
        label: item.label,
        current,
        proposed,
        currentPct: this.countPercentage(
          current,
          total
        ),
        proposedPct: this.countPercentage(
          proposed,
          total
        ),
        difference: proposed - current,
        colorClass: item.colorClass
      };
    });
  }

  get approvedDifference(): number {
    if (!this.result) {
      return 0;
    }

    return (
      this.result.next.approved -
      this.result.current.approved
    );
  }

  get referredDifference(): number {
    if (!this.result) {
      return 0;
    }

    return (
      this.result.next.referred -
      this.result.current.referred
    );
  }

  get declinedDifference(): number {
    if (!this.result) {
      return 0;
    }

    return (
      this.result.next.declined -
      this.result.current.declined
    );
  }

  // ----------------------------------------
  // APPLICATION FILTERING
  // ----------------------------------------

  get filteredChanges() {
    if (!this.result) {
      return [];
    }

    const search =
      this.searchTerm.trim().toLowerCase();

    return this.result.changes.filter(row => {
      const matchesSearch =
        !search ||
        String(row.id)
          .toLowerCase()
          .includes(search) ||
        String(row.applicant)
          .toLowerCase()
          .includes(search);

      const matchesDecision =
        this.decisionFilter === 'All' ||
        row.to === this.decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.filteredChanges.length /
        this.pageSize
      )
    );
  }

  get paginatedChanges() {
    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.filteredChanges.slice(
      start,
      start + this.pageSize
    );
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // ----------------------------------------
  // UI NAVIGATION
  // ----------------------------------------

  setTab(
    tab: 'overview' | 'applications'
  ): void {
    this.activeTab = tab;
  }
}
