import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreditApplication } from './credit-demo.data';
import { CreditDataService } from './credit-data.service';

@Component({
  selector: 'app-credit-shell',
  templateUrl: './credit-shell.component.html'
})
export class CreditShellComponent implements OnInit, OnDestroy {
  title = 'Good morning, Demo User';
  subtitle = 'Digital Credit Decisioning';
  now = new Date();
  showNotes = false;
  showUser = false;
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
    this.sub.add(interval(30000).subscribe(() => this.now = new Date()));
    queueMicrotask(() => this.syncTitle());
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
    if (data['greeting']) {
      this.title = this.greeting();
      this.subtitle = 'Digital Credit Decisioning';
    } else {
      this.title = data['title'] || 'Credit Decisioning';
      this.subtitle = data['subtitle'] || 'Demo environment';
    }
    this.closePopovers();
  }

  private greeting(): string {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `${part}, Demo User`;
  }
}
