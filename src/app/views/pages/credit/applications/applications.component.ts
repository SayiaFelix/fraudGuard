import { Component, OnDestroy, OnInit } from '@angular/core';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html'
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  apps: CreditApplication[] = [];
  search = '';
  decision = 'All';
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.applications$.subscribe(apps => this.apps = apps));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get rows(): CreditApplication[] {
    const query = this.search.trim().toLowerCase();
    return this.apps.filter(app => {
      const matchesQuery = !query
        || app.applicant.toLowerCase().includes(query)
        || app.id.toLowerCase().includes(query)
        || app.product.toLowerCase().includes(query)
        || app.country.toLowerCase().includes(query);
      const matchesDecision = this.decision === 'All' || app.decision === this.decision;
      return matchesQuery && matchesDecision;
    });
  }
}
