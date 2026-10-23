import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html'
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  application: CreditApplication | null = null;
  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public credit: CreditDataService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.route.paramMap.subscribe(params => this.load(params.get('id'))));
    this.sub.add(this.credit.applications$.subscribe(() => this.load(this.route.snapshot.paramMap.get('id'))));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  factorBar(impact: number): number {
    return Math.max(8, Math.min(100, Math.abs(impact)));
  }

  private load(id: string | null): void {
    this.application = id ? this.credit.find(id) || null : null;
  }
}
