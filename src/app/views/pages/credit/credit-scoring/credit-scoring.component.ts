import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CreditApplication, MODEL_METRICS, SCORE_BANDS } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-credit-scoring',
  templateUrl: './credit-scoring.component.html'
})
export class CreditScoringComponent implements OnInit, OnDestroy {
  bands = SCORE_BANDS;
  model = MODEL_METRICS;
  apps: CreditApplication[] = [];
  selectedId = '';
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.applications$.subscribe(apps => {
      this.apps = apps;
      if (!this.selectedId && apps.length) this.selectedId = apps[0].id;
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get selected(): CreditApplication | null {
    return this.apps.find(app => app.id === this.selectedId) || null;
  }

  factorBar(impact: number): number {
    return Math.max(8, Math.min(100, Math.abs(impact)));
  }
}
