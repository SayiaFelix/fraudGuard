import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-credit-reports',
  templateUrl: './credit-reports.component.html'
})
export class CreditReportsComponent implements OnInit, OnDestroy {
  reports = [
    { id: 'decisions', name: 'Decision summary', detail: 'Approve, refer, and decline counts on the live worklist' },
    { id: 'scores', name: 'Score distribution', detail: 'Worklist scores by risk band' },
    { id: 'overrides', name: 'Manual decisions', detail: 'Cases closed by an analyst rather than the scorecard' },
    { id: 'turnaround', name: 'Referral book', detail: 'Everything still sitting in Alerts' }
  ];
  active = 'decisions';
  apps: CreditApplication[] = [];
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.sub.add(this.credit.applications$.subscribe(apps => this.apps = apps));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get activeLabel(): string {
    return this.reports.find(report => report.id === this.active)?.name || 'Report';
  }

  get rows(): CreditApplication[] {
    if (this.active === 'overrides') {
      return this.apps.filter(app => app.caseStatus === 'Closed' && app.notes.some(note => note.author === 'Demo User'));
    }
    if (this.active === 'turnaround') {
      return this.apps.filter(app => app.decision === 'Refer' && app.caseStatus !== 'Closed');
    }
    return this.apps;
  }

  download(): void {
    const header = ['id', 'applicant', 'product', 'country', 'amount', 'score', 'risk', 'decision', 'case'];
    const lines = [header.join(',')].concat(this.rows.map(row => [
      row.id,
      csv(row.applicant),
      csv(row.product),
      csv(row.country),
      row.amount,
      row.score,
      row.risk,
      row.decision,
      csv(row.caseStatus)
    ].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eclectics-${this.active}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function csv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
