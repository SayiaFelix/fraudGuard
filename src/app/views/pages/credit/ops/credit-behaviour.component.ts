import { Component, Input } from '@angular/core';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { BehaviourStanding, BehaviourStep, explainBehaviour } from './credit-ops';

@Component({
  selector: 'app-credit-behaviour',
  templateUrl: './credit-behaviour.component.html'
})
export class CreditBehaviourComponent {
  @Input() app!: CreditApplication;
  @Input() mode: 'compact' | 'full' | 'steps' = 'compact';

  constructor(public credit: CreditDataService) {}

  get standing(): BehaviourStanding | null {
    return this.app ? explainBehaviour(this.app) : null;
  }

  get latest(): BehaviourStep | null {
    const steps = this.standing?.steps || [];
    return steps.length ? steps[steps.length - 1] : null;
  }

  signed(value: number): string {
    if (value > 0) return `+${value}`;
    return String(value);
  }
}
