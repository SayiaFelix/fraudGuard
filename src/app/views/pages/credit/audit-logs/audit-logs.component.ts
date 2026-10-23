import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuditEvent } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html'
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  events: AuditEvent[] = [];
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.audit$.subscribe(events => this.events = events));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
