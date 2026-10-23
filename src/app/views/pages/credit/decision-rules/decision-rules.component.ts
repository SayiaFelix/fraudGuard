import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DecisionRule } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-decision-rules',
  templateUrl: './decision-rules.component.html'
})
export class DecisionRulesComponent implements OnInit, OnDestroy {
  rules: DecisionRule[] = [];
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.rules$.subscribe(rules => this.rules = rules));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggle(rule: DecisionRule): void {
    this.credit.toggleRule(rule.code);
  }
}
