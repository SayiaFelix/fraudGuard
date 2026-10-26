import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DEFAULT_POLICY, PolicySettings } from '../credit-demo.data';
import { CreditDataService, SimulationResult } from '../credit-data.service';

@Component({
  selector: 'app-policy-simulator',
  templateUrl: './policy-simulator.component.html'
})
export class PolicySimulatorComponent implements OnInit, OnDestroy {
  draft: PolicySettings = { ...DEFAULT_POLICY };
  result: SimulationResult | null = null;
  saved = false;
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.policy$.subscribe(policy => {
      this.draft = { ...policy };
      this.run();
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  run(): void {
    this.draft = {
      ...this.draft,
      approveFrom: Number(this.draft.approveFrom),
      declineBelow: Number(this.draft.declineBelow),
      maxDti: Number(this.draft.maxDti),
      maxAmount: Number(this.draft.maxAmount)
    };
    this.result = this.credit.simulate(this.draft);
    this.saved = false;
  }

  save(): void {
    this.credit.updatePolicy(this.draft);
    this.saved = true;
  }

  share(count: number, total: number): string {
    return this.credit.pct(count, total);
  }
}
