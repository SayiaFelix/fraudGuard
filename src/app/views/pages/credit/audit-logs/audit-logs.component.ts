import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoanEvent, LoanRecord } from '../workflow/loan-workflow.models';
import { LoanWorkflowService } from '../workflow/loan-workflow.service';

type AuditKind = 'All' | 'Assessments' | 'Decisions' | 'Automatic' | 'Information';

interface AuditLine {
  id: string;
  time: string;
  actor: string;
  source: string;
  action: LoanEvent['action'];
  applicationId: string;
  customer: string;
  nationalId: string;
  from: string;
  to: string;
  reason: string;
  override: boolean;
  amount?: number;
}

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['../workflow/loan-workflow.scss', './audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  readonly kinds: AuditKind[] = ['All', 'Assessments', 'Decisions', 'Automatic', 'Information'];
  lines: AuditLine[] = [];
  kind: AuditKind = 'All';
  actor = 'All';
  search = '';
  page = 1;
  pageSize = 15;
  selectedId = '';
  private sub = new Subscription();

  constructor(private route: ActivatedRoute, public workflow: LoanWorkflowService) {}

  ngOnInit(): void {
    this.sub.add(this.workflow.applications$.subscribe(apps => {
      this.lines = this.flatten(apps);
      if (this.actor !== 'All' && !this.actors.includes(this.actor)) this.actor = 'All';
      if (this.page > this.pages) this.page = this.pages;
      if (this.selectedId && !this.lines.some(line => line.id === this.selectedId)) this.selectedId = '';
    }));
    this.sub.add(this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.selectedId = id;
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get filtered(): AuditLine[] {
    const query = this.search.trim().toLowerCase();
    return this.lines.filter(line => {
      if (this.kind === 'Assessments' && line.action !== 'Assessed' && line.action !== 'Reassessed') return false;
      if (this.kind === 'Decisions' && !['Approve', 'Decline', 'Auto-approved'].includes(line.action)) return false;
      if (this.kind === 'Automatic' && line.action !== 'Auto-approved') return false;
      if (this.kind === 'Information' && line.action !== 'Request information') return false;
      if (this.actor !== 'All' && line.actor !== this.actor) return false;
      if (!query) return true;
      return [line.customer, line.nationalId, line.applicationId, line.actor, line.action, line.reason, line.to]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get pageRows(): AuditLine[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get rangeStart(): number {
    return this.filtered.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.filtered.length);
  }

  get applicationCount(): number {
    return new Set(this.lines.map(line => line.applicationId)).size;
  }

  get exceptionCount(): number {
    return this.lines.filter(line => line.override).length;
  }

  get automaticCount(): number {
    return this.lines.filter(line => line.action === 'Auto-approved').length;
  }

  get summary(): string {
    const eventWord = this.lines.length === 1 ? 'event' : 'events';
    const applicationWord = this.applicationCount === 1 ? 'application' : 'applications';
    const exceptionWord = this.exceptionCount === 1 ? 'exception' : 'exceptions';
    return `${this.lines.length} ${eventWord} · ${this.applicationCount} ${applicationWord} · ${this.automaticCount} confirmed automatically · ${this.exceptionCount} ${exceptionWord}`;
  }

  get actors(): string[] {
    return ['All', ...Array.from(new Set(this.lines.map(line => line.actor))).sort()];
  }

  select(id: string): void {
    this.selectedId = this.selectedId === id ? '' : id;
  }

  setKind(value: string): void {
    if (value === 'All' || value === 'Assessments' || value === 'Decisions' || value === 'Automatic' || value === 'Information') {
      this.kind = value;
      this.page = 1;
    }
  }

  label(action: LoanEvent['action']): string {
    if (action === 'Approve') return 'Approved';
    if (action === 'Decline') return 'Declined';
    if (action === 'Auto-approved') return 'Confirmed automatically';
    if (action === 'Request information') return 'Information requested';
    return action;
  }

  detail(line: AuditLine): string {
    if (line.action !== 'Auto-approved' || /^confirmed automatically/i.test(line.reason)) return line.reason;
    const rest = line.reason.replace(/^Automatically approved under /i, 'Under ');
    return `Confirmed automatically. ${rest}`;
  }

  exportRows(): void {
    const headers = ['Time', 'Actor', 'Source', 'Action', 'Application', 'Customer', 'From', 'To', 'Reason', 'Amount'];
    const rows = this.filtered.map(line => [
      line.time, line.actor, line.source, this.label(line.action), line.applicationId,
      line.customer, line.from, line.to, this.detail(line), line.amount != null ? String(line.amount) : ''
    ]);
    const body = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private flatten(apps: LoanRecord[]): AuditLine[] {
    const rows: AuditLine[] = [];
    for (const app of apps) {
      for (const event of app.history) {
        rows.push({
          id: event.id,
          time: event.timestamp,
          actor: event.officer,
          source: event.officerSource,
          action: event.action,
          applicationId: app.id,
          customer: app.customerName,
          nationalId: app.nationalId,
          from: event.previousStatus,
          to: event.status,
          reason: event.reason,
          override: event.policyOverride,
          amount: event.approvedAmount
        });
      }
    }
    return rows.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  }
}
