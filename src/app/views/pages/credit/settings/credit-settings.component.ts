import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuditEvent, DEFAULT_POLICY, PolicySettings } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-credit-settings',
  templateUrl: './credit-settings.component.html'
})
export class CreditSettingsComponent implements OnInit, OnDestroy {
  policy: PolicySettings = { ...DEFAULT_POLICY };
  saved = '';
  events: AuditEvent[] = [];
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.policy$.subscribe(policy => this.policy = { ...policy }));
    this.sub.add(this.credit.audit$.subscribe(events => {
      this.events = events.filter(event => /policy|connector|compliance/i.test(event.action)).slice(0, 5);
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get band(): string {
    const approve = Number(this.policy.approveFrom) || 0;
    const decline = Number(this.policy.declineBelow) || 0;
    return `A clean file at ${approve} or above, inside the debt-service cap and the amount limit, is approved on the scorecard. Below ${decline} is declined. Everything between is referred to an officer. A tenor past ${this.policy.maxTenorMonths} months is referred even when the score would approve.`;
  }

  save(): void {
    this.credit.updatePolicy({ ...this.policy });
    this.policy = { ...this.credit.policy };
    this.saved = 'Saved. Alerts, new applications, and the audit trail are using these values.';
  }

  reset(): void {
    this.policy = { ...DEFAULT_POLICY };
    this.save();
    this.saved = 'Restored the standard credit policy.';
  }
}
