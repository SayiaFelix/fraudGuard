import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { initialsFromName, officerDisplayName } from 'src/app/shared/services/auth.service';
import { latestAssessment } from './workflow/loan-workflow.models';
import { LoanWorkflowService } from './workflow/loan-workflow.service';

@Component({
  selector: 'app-credit-shell',
  templateUrl: './credit-shell.component.html'
})
export class CreditShellComponent implements OnInit, OnDestroy {
  pageTitle = '';
  pageSubtitle = '';
  ownHeader = false;
  now = new Date();
  showNotes = false;
  showUser = false;
  displayName = 'User';
  email = '';
  title = 'Bank Officer';
  initials = 'U';
  queue: { id: string; name: string; detail: string }[] = [];
  private sub = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private workflow: LoanWorkflowService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
        this.syncTitle();
        document.body.classList.remove('sidebar-open');
      })
    );
    this.sub.add(this.workflow.applications$.subscribe(apps => {
      this.queue = apps.filter(item => this.workflow.pending(item)).slice(0, 5).map(item => ({
        id: item.id,
        name: item.customerName,
        detail: `${latestAssessment(item).input.product} · ${item.status}`
      }));
    }));
    this.sub.add(interval(1000).subscribe(() => this.now = new Date()));
    this.loadOfficer();
    queueMicrotask(() => this.syncTitle());
  }

  private loadOfficer(): void {
    let loginId = '';
    let sessionUser: any = null;
    const raw = sessionStorage.getItem('uba_demo_user');
    if (raw) {
      try {
        sessionUser = JSON.parse(raw);
        loginId = String(sessionUser?.email || sessionUser?.username || '').trim();
      } catch {
        loginId = '';
      }
    }
    if (!loginId) {
      loginId = localStorage.getItem('userEmail') || localStorage.getItem('userName') || '';
    }
    const derived = officerDisplayName(sessionUser, loginId);
    this.displayName = derived && derived !== 'User'
      ? derived
      : (localStorage.getItem('userDisplayName') || 'User');
    this.email = loginId;
    this.title = localStorage.getItem('userTitle') || 'Bank Officer';
    this.initials = initialsFromName(this.displayName);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggleSidebar(): void {
    document.body.classList.toggle('sidebar-open');
  }

  closePopovers(): void {
    this.showNotes = false;
    this.showUser = false;
  }

  private syncTitle(): void {
    let current = this.route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    const data = current.snapshot.data || {};
    this.ownHeader = !!data['ownHeader'];
    if (data['greeting'] || data['ownHeader']) {
      this.pageTitle = '';
      this.pageSubtitle = '';
    } else {
      this.pageTitle = data['title'] || 'Credit Decisioning';
      this.pageSubtitle = data['subtitle'] || 'Demo environment';
    }
    this.closePopovers();
  }
}
