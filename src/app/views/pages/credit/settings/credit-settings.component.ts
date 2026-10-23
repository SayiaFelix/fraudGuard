import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PolicySettings } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-credit-settings',
  templateUrl: './credit-settings.component.html'
})
export class CreditSettingsComponent implements OnInit, OnDestroy {
  policy: PolicySettings = { approveFrom: 700, declineBelow: 580, maxDti: 0.45, maxAmount: 2000000 };
  saved = false;
  private sub = new Subscription();

  constructor(private credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.policy$.subscribe(policy => this.policy = { ...policy }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  save(): void {
    this.credit.updatePolicy({
      approveFrom: Number(this.policy.approveFrom),
      declineBelow: Number(this.policy.declineBelow),
      maxDti: Number(this.policy.maxDti),
      maxAmount: Number(this.policy.maxAmount)
    });
    this.saved = true;
  }
}
