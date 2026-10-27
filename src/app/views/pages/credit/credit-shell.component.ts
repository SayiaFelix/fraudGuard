import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { initialsFromName, officerDisplayName } from 'src/app/shared/services/auth.service';
import { CreditApplication } from './credit-demo.data';
import { CreditDataService } from './credit-data.service';

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
  queue: CreditApplication[] = [];
  private sub = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public credit: CreditDataService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
        this.syncTitle();
        document.body.classList.remove('sidebar-open');
      })
    );
    this.sub.add(this.credit.applications$.subscribe(apps => {
      this.queue = apps.filter(item => item.decision === 'Refer' && item.caseStatus !== 'Closed').slice(0, 5);
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
