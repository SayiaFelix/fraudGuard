import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-decision-queue',
  templateUrl: './decision-queue.component.html'
})
export class DecisionQueueComponent implements OnInit, OnDestroy {
  apps: CreditApplication[] = [];
  filter: 'All' | 'High' | 'Medium' | 'Unassigned' = 'All';
  selectedId = '';
  note = '';
  assignee = 'Demo User';
  banner = '';
  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public credit: CreditDataService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.credit.applications$.subscribe(apps => {
      this.apps = apps;
      if (!this.selectedId && this.queue.length) {
        this.selectedId = this.queue[0].id;
      }
    }));
    this.sub.add(this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.selectedId = id;
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get queueLabel(): string {
    const count = this.queue.length;
    if (this.router.url.includes('decision-queue')) {
      return count === 1 ? '1 case in the queue' : `${count} cases in the queue`;
    }
    return count === 1 ? '1 open alert' : `${count} open alerts`;
  }

  get queue(): CreditApplication[] {
    return this.apps.filter(app => app.decision === 'Refer' && app.caseStatus !== 'Closed').filter(app => {
      if (this.filter === 'High') return app.risk === 'High';
      if (this.filter === 'Medium') return app.risk === 'Medium';
      if (this.filter === 'Unassigned') return app.assignedTo === 'Unassigned';
      return true;
    });
  }

  get selected(): CreditApplication | null {
    return this.apps.find(app => app.id === this.selectedId) || null;
  }

  setFilter(value: string): void {
    if (value === 'All' || value === 'High' || value === 'Medium' || value === 'Unassigned') {
      this.filter = value;
    }
  }

  select(id: string): void {
    this.selectedId = id;
    this.banner = '';
  }

  act(action: 'approve' | 'decline' | 'request-info' | 'escalate' | 'assign' | 'note'): void {
    if (!this.selected) return;
    this.credit.applyCaseAction(this.selected.id, action, { note: this.note, assignee: this.assignee });
    const labels = {
      approve: 'Approved and removed from the queue.',
      decline: 'Declined and removed from the queue.',
      'request-info': 'Marked as awaiting information.',
      escalate: 'Escalated to the credit committee.',
      assign: `Assigned to ${this.assignee}.`,
      note: 'Note added to the case.'
    };
    this.banner = labels[action];
    this.note = '';
  }
}
