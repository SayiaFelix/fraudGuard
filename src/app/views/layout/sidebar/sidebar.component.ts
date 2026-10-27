import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  Inject,
  Output,
  EventEmitter
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import MetisMenu from 'metismenujs';
import { MENU } from './menu';
import { MenuItem } from './menu.model';
import { Router, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../shared/services/NotificationService';
import { InboxItem } from '../../pages/mobile-banking/requests/list-requests/list-requests.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CreditDataService } from '../../pages/credit/credit-data.service';
import { LoanWorkflowService } from '../../pages/credit/workflow/loan-workflow.service';

interface SidebarMenuGroup {
  label: string;
  open: boolean;
  items: MenuItem[];
}

interface SidebarAiMessage {
  from: 'you' | 'ai';
  text: string;
}

type SidebarMenuEntry = MenuItem & {
  isTitle?: boolean;
  isLogout?: boolean;
};

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sidebarToggler') sidebarToggler!: ElementRef;
  @ViewChild('sidebarMenu') sidebarMenu!: ElementRef;
  @Output() helpCenterToggled = new EventEmitter<MouseEvent>();

  menuItems: MenuItem[] = [];
  menuGroups: SidebarMenuGroup[] = [];
  logoutItem?: MenuItem;

  aiOpen = false;
  aiMessages: SidebarAiMessage[] = [];

  userDisplayName = '';
  userTitle = '';
  userInitials = '';
  isSettingsModalVisible = false;
  showSubItems = true;
  logo = '\\assets\\images\\TRA_Logo.png';
  showingClass = 'd-none';
  selectedParent: string | undefined;

  private subscriptions = new Subscription();
  private desktopMedium?: MediaQueryList;

  private readonly onDesktopMediumChange = (): void => {
    if (this.desktopMedium) {
      this.iconSidebar(this.desktopMedium);
    }
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router,
    private authservice: AuthService,
    private notificationService: NotificationService,
    private creditData: CreditDataService,
    private loanWorkflow: LoanWorkflowService
  ) {
    this.subscriptions.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this._activateMenuDropdown();

          if (window.matchMedia('(max-width: 991px)').matches) {
            this.document.body.classList.remove('sidebar-open');
          }
        }
      })
    );
  }

  ngOnInit(): void {
    const role = localStorage.getItem('userRole');

    this.menuItems = MENU.filter(item =>
      !item.roles || item.roles.includes(role!)
    );

    this.buildMenuGroups();

    this.userDisplayName = this.authservice.getUserDisplayName();
    this.userTitle = this.authservice.getUserTitle();
    this.userInitials = this.getInitials(this.userDisplayName);

    this.desktopMedium = window.matchMedia(
      '(min-width: 992px) and (max-width: 1199px)'
    );
    this.desktopMedium.addEventListener('change', this.onDesktopMediumChange);
    this.iconSidebar(this.desktopMedium);

    this.subscriptions.add(
      this.notificationService.currentNotifications.subscribe(
        (notifications: InboxItem[]) => this.updateInboxBadge(notifications)
      )
    );

    this.subscriptions.add(
      this.loanWorkflow.applications$.subscribe(apps => {
        const applications = this.menuItems.find(
          item => item.link === '/applications'
        );
        const queue = this.menuItems.find(
          item => item.link === '/decision-queue'
        );

        if (applications) {
          applications.badge = { text: apps.length, variant: 'uba' };
        }

        if (queue) {
          queue.badge = {
            text: apps.filter(item => this.loanWorkflow.pending(item)).length,
            variant: 'uba'
          };
        }
      })
    );

    this.subscriptions.add(
      this.creditData.applications$.subscribe(apps => {
        const open = apps.filter(
          item => item.decision === 'Refer' && item.caseStatus !== 'Closed'
        ).length;
        const alerts = this.menuItems.find(item => item.link === '/alerts');

        if (alerts) {
          alerts.badge = { text: open, variant: 'uba' };
        }
      })
    );
  }

  ngAfterViewInit(): void {
    new MetisMenu(this.sidebarMenu.nativeElement);
    this._activateMenuDropdown();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.desktopMedium?.removeEventListener(
      'change',
      this.onDesktopMediumChange
    );
  }

  toggleAi(event: Event): void {
    event.preventDefault();
    this.aiOpen = !this.aiOpen;
  }

  askAi(question: string): void {
    const text = question.trim();
    if (!text) return;

    this.aiOpen = true;
    this.aiMessages = [
      ...this.aiMessages,
      { from: 'you', text },
      {
        from: 'ai',
        // Replace this reply with the assistant service response when available.
        text: 'The AI assistant is not available yet.'
      }
    ];
  }

  toggleGroup(group: SidebarMenuGroup): void {
    group.open = !group.open;
  }

  private buildMenuGroups(): void {
    this.logoutItem = undefined;

    let group: SidebarMenuGroup = {
      label: '',
      open: true,
      items: []
    };

    this.menuGroups = [group];

    for (const item of this.menuItems) {
      const entry = item as SidebarMenuEntry;

      if (entry.isLogout) {
        this.logoutItem = item;
        continue;
      }

      if (entry.isTitle) {
        group = {
          label: entry.label || '',
          open: true,
          items: []
        };
        this.menuGroups.push(group);
        continue;
      }

      group.items.push(item);
    }

    this.menuGroups = this.menuGroups.filter(
      section => section.items.length > 0
    );
  }

  private updateInboxBadge(notifications: InboxItem[]): void {
    const inboxMenuItem = this.menuItems.find(item => item.label === 'Alerts');
    if (!inboxMenuItem) return;

    const unreadCount = notifications.length;

    if (unreadCount > 0) {
      inboxMenuItem.badge = {
        text: unreadCount.toString(),
        variant: 'danger'
      };
    } else {
      delete inboxMenuItem.badge;
    }
  }

  onSettingsClick(event: MouseEvent): void {
    event.preventDefault();
    this.isSettingsModalVisible = true;
  }

  onHelpCenterClick(event: MouseEvent): void {
    event.preventDefault();
    this.helpCenterToggled.emit(event);
  }

  closeSettingsModal(): void {
    this.isSettingsModalVisible = false;
  }

  toggleSidebar(event: Event): void {
    event.preventDefault();

    this.sidebarToggler.nativeElement.classList.toggle('active');
    this.sidebarToggler.nativeElement.classList.toggle('not-active');

    if (window.matchMedia('(min-width: 992px)').matches) {
      this.document.body.classList.toggle('sidebar-folded');
    } else {
      this.document.body.classList.toggle('sidebar-open');
    }
  }

  toggleSettingsSidebar(event: Event): void {
    event.preventDefault();
    this.document.body.classList.toggle('settings-open');
  }

  operSidebarFolded(): void {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.add('open-sidebar-folded');
    }
  }

  closeSidebarFolded(): void {
    this.document.body.classList.remove('open-sidebar-folded');
  }

  iconSidebar(_mq: MediaQueryList): void {
    // Keep labelled navigation visible in the credit workspace.
    this.renderer.removeClass(this.document.body, 'sidebar-folded');
  }

  onSidebarThemeChange(event: Event): void {
    const target = event.target as HTMLInputElement;

    this.document.body.classList.remove('sidebar-light', 'sidebar-dark');
    this.document.body.classList.add(target.value);
    this.document.body.classList.remove('settings-open');

    this.logo = this.logo === '\\assets\\images\\MicrosoftTeams-image (1).png'
      ? '\\assets\\images\\MicrosoftTeams-image (2).png'
      : '\\assets\\images\\MicrosoftTeams-image (1).png';
  }

  onLogout(event: Event): void {
    event.preventDefault();

    Swal.fire({
      width: 500,
      title: 'Are you sure?',
      text: 'You will be logged out of your session.',
      icon: 'warning',
      iconColor: '#f5c28d',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      showCancelButton: true,
      confirmButtonText: 'Yes, log me out!',
      cancelButtonText: 'Cancel',
      backdrop: true,
      allowOutsideClick: false
    }).then(result => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Logging out...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        this.authservice.logout();

        [
          'access_token',
          'refresh_token',
          'current_user',
          'userRole',
          'userEmail',
          'userName',
          'userDisplayName',
          'userTitle'
        ].forEach(key => localStorage.removeItem(key));

        this.router.navigate(['/dashboard']);
        Swal.close();
      } catch (error) {
        console.error('Logout error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred during logout. Please try again.',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  hasItems(item: MenuItem): boolean {
    return !!item.subItems?.length;
  }

  _activateMenuDropdown(): void {
    this.resetMenuItems();
    this.activateMenuItems();
  }

  resetMenuItems(): void {
    const links = this.document.getElementsByClassName('nav-link-ref');

    for (let i = 0; i < links.length; i++) {
      const menuItemEl = links[i];
      menuItemEl.classList.remove('mm-active');

      let parent = menuItemEl.parentElement;
      while (parent && parent !== this.sidebarMenu?.nativeElement) {
        parent.classList.remove('mm-active', 'mm-show');
        parent = parent.parentElement;
      }
    }
  }

  activateMenuItems(): void {
    const links = this.document.getElementsByClassName('nav-link-ref');

    for (let i = 0; i < links.length; i++) {
      const link = links[i] as HTMLAnchorElement;
      if (window.location.pathname !== link.pathname) continue;

      link.classList.add('mm-active');

      let parent = link.parentElement;
      while (parent && parent !== this.sidebarMenu?.nativeElement) {
        if (parent.tagName === 'UL') {
          parent.classList.add('mm-show');
        } else if (parent.tagName === 'LI') {
          parent.classList.add('mm-active');
        }
        parent = parent.parentElement;
      }

      break;
    }
  }

  showMenuItem(profiles: any): boolean {
    const assignedProfile = JSON.parse(localStorage.getItem('profile')!);
    return !!profiles.find(
      (allowedProfile: string) => allowedProfile === assignedProfile
    );
  }

  private getInitials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';

    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0))
        .toUpperCase();
    }

    return parts[0].substring(0, 2).toUpperCase();
  }
}
