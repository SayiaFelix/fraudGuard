import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, Inject, Output, EventEmitter } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import MetisMenu from 'metismenujs';
import { MENU } from './menu';
import { MenuItem } from './menu.model';
import { Router, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../shared/services/NotificationService';
import { InboxItem } from '../../pages/mobile-banking/requests/list-requests/list-requests.component'; // Adjust this path if your inbox component is in a different folder
import { AuthService } from 'src/app/shared/services/auth.service';
import { CreditDataService } from '../../pages/credit/credit-data.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  
  @ViewChild('sidebarToggler') sidebarToggler: ElementRef;
  @Output() helpCenterToggled = new EventEmitter<MouseEvent>();
  menuItems: MenuItem[] = [];
  menuGroups: SidebarGroup[] = [];
  logoutItem: MenuItem | null = null;
  userDisplayName = '';
  userTitle = '';
  userInitials = '';
  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;
  isSettingsModalVisible = false;
  aiOpen = false;
  aiDraft = '';
  aiMessages: Array<{ from: 'ai' | 'you'; text: string }> = [
    { from: 'ai', text: 'I can walk through an alert, a case status, or how a standing score moves. This assistant is a demo and stays on this page.' }
  ];
  showSubItems: boolean = true;
  logo: string = '\\assets\\images\\TRA_Logo.png';
  showingClass = "d-none";
  selectedParent: string | undefined;
  private notificationSub: Subscription;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router,
     private authservice: AuthService,
    private notificationService: NotificationService,
    private creditData: CreditDataService
  ) {
    
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this.openActiveGroup();
        this._activateMenuDropdown();
        if (window.matchMedia('(max-width: 991px)').matches) {
          this.document.body.classList.remove('sidebar-open');
        }
      }
    });
  }

  ngOnInit(): void {
    
    const role = localStorage.getItem('userRole');
    this.menuItems = MENU.filter(item => 
      !item.roles || item.roles.includes(role!)
    );
    this.buildGroups();

    this.userDisplayName = this.authservice.getUserDisplayName();
    this.userTitle = this.authservice.getUserTitle();
    this.userInitials = this.getInitials(this.userDisplayName);

    const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
    desktopMedium.addEventListener('change', () => this.iconSidebar(desktopMedium));
    this.iconSidebar(desktopMedium);

    
    this.notificationSub = this.notificationService.currentNotifications.subscribe((notifications: InboxItem[]) => {
      this.updateInboxBadge(notifications);
    });

    this.creditData.summary$.subscribe(summary => {
      const applications = this.menuItems.find(item => item.link === '/applications');
      if (applications) {
        applications.badge = { text: summary.openApplications, variant: 'uba' };
      }
    });

    this.creditData.applications$.subscribe(apps => {
      const open = apps.filter(item => item.decision === 'Refer' && item.caseStatus !== 'Closed').length;
      ['/alerts', '/decision-queue'].forEach(link => {
        const item = this.menuItems.find(entry => entry.link === link);
        if (item) {
          item.badge = { text: open, variant: 'uba' };
        }
      });
    });
  }

  
  ngOnDestroy(): void {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }

  
  toggleGroup(group: SidebarGroup): void {
    group.open = !group.open;
  }

  private buildGroups(): void {
    const groups: SidebarGroup[] = [];
    let current: SidebarGroup | null = null;
    this.logoutItem = null;
    this.menuItems.forEach(item => {
      if (item.isLogout) {
        this.logoutItem = item;
        return;
      }
      if (item.isTitle) {
        current = { label: item.label || '', items: [], open: false };
        groups.push(current);
        return;
      }
      if (!current) {
        current = { label: null, items: [], open: true };
        groups.push(current);
      }
      current.items.push(item);
    });
    this.menuGroups = groups;
    this.openActiveGroup();
  }

  private openActiveGroup(): void {
    const url = this.router.url.split('?')[0];
    this.menuGroups.forEach(group => {
      if (!group.label) {
        return;
      }
      const active = group.items.some(item => !!item.link && (url === item.link || url.startsWith(item.link + '/')));
      if (active) {
        group.open = true;
      }
    });
  }

  private updateInboxBadge(_notifications: InboxItem[]): void {
    // The Alerts badge follows the open credit cases, not the legacy inbox.
  }

  toggleAi(event: Event): void {
    event.preventDefault();
    this.aiOpen = !this.aiOpen;
  }

  askAi(prompt?: string): void {
    const text = (prompt || this.aiDraft).trim();
    if (!text) return;
    this.aiMessages = [...this.aiMessages, { from: 'you', text }];
    this.aiDraft = '';
    const lower = text.toLowerCase();
    let reply = 'I can help with alerts, case statuses, repayment scores, reports, and the audit trail. Try one of the suggestions.';
    if (/score|repay|limit|default|late/.test(lower)) {
      reply = 'On-time repayment raises the standing score by 4, and every third on-time cycle adds another 6. A late payment cuts 6. A default cuts 28. The case decision still uses the origination score.';
    } else if (/alert|case|escalat|review/.test(lower)) {
      reply = 'Alerts and cases are one desk. Open a row, then approve, decline, request information, assign, or escalate. Statuses are Open, In review, Escalated, and Resolved.';
    } else if (/report|audit|export|csv/.test(lower)) {
      reply = 'Reports and the audit trail use the same applications as the alerts desk. You can export CSV or print a report, and every case action is written to the trail.';
    }
    this.aiMessages = [...this.aiMessages, { from: 'ai', text: reply }];
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

  ngAfterViewInit() {
    new MetisMenu(this.sidebarMenu.nativeElement);
    this._activateMenuDropdown();
  }

  toggleSidebar(e: Event) {
    this.sidebarToggler.nativeElement.classList.toggle('active');
    this.sidebarToggler.nativeElement.classList.toggle('not-active');
    if (window.matchMedia('(min-width: 992px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-folded');
    } else if (window.matchMedia('(max-width: 991px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-open');
    }
  }

  toggleSettingsSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('settings-open');
  }

  operSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')){
      this.document.body.classList.add("open-sidebar-folded");
    }
  }

  closeSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')){
      this.document.body.classList.remove("open-sidebar-folded");
    }
  }

  iconSidebar(mq: MediaQueryList) {
    // Credit workspace keeps the labelled navigation open.
    // if (mq.matches) {
    //   this.document.body.classList.add('sidebar-folded');
    // } else {
    this.document.body.classList.remove('sidebar-folded');
    // }
  }

  onSidebarThemeChange(event: Event) {
    this.document.body.classList.remove('sidebar-light', 'sidebar-dark');
    this.document.body.classList.add((<HTMLInputElement>event.target).value);
    this.document.body.classList.remove('settings-open');
    this.logo = this.logo == '\\assets\\images\\MicrosoftTeams-image (1).png'? '\\assets\\images\\MicrosoftTeams-image (2).png' : '\\assets\\images\\MicrosoftTeams-image (1).png'
  }
  
onLogout(e: Event) {
  e.preventDefault();
  
  Swal.fire({
    width: 500,
    title: 'Are you sure?',
    text: "You will be logged out of your session.",
    icon: 'warning',
    iconColor: '#f5c28d',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    showCancelButton: true,
    confirmButtonText: 'Yes, log me out!',
    cancelButtonText: 'Cancel',
    backdrop: true,
    allowOutsideClick: false
  }).then((result) => {
    if (result.isConfirmed) {

      Swal.fire({
        title: 'Logging out...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      try {
      
        this.authservice.logout();
      
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userDisplayName');
        localStorage.removeItem('userTitle');
        localStorage.removeItem('isLoggedin');
        sessionStorage.removeItem('uba_demo_mode');
        sessionStorage.removeItem('uba_demo_user');
        sessionStorage.removeItem('uba_demo_display_name');

        this.router.navigate(['/auth/login']);
      
        Swal.close();
        
        // Swal.fire({
        //   icon: 'success',
        //   title: 'Logged Out',
        //   text: 'You have been successfully logged out.',
        //   timer: 700,
        //   showConfirmButton: false
        // });
        
      } catch (error) {
        console.error('Logout error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred during logout. Please try again.',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  });
}

  hasItems(item: MenuItem) {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }

  _activateMenuDropdown() {
    this.resetMenuItems();
    this.activateMenuItems();
  }

  resetMenuItems() {
    const links = document.getElementsByClassName('nav-link-ref');
    for (let i = 0; i < links.length; i++) {
      const menuItemEl = links[i];
      menuItemEl.classList.remove('mm-active');
      const parentEl = menuItemEl.parentElement;
      if (parentEl) {
          parentEl.classList.remove('mm-active');
          const parent2El = parentEl.parentElement;
          if (parent2El) {
            parent2El.classList.remove('mm-show');
          }
          const parent3El = parent2El?.parentElement;
          if (parent3El) {
            parent3El.classList.remove('mm-active');
            if (parent3El.classList.contains('side-nav-item')) {
              const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');
              if (firstAnchor) {
                firstAnchor.classList.remove('mm-active');
              }
            }
            const parent4El = parent3El.parentElement;
            if (parent4El) {
              parent4El.classList.remove('mm-show');
              const parent5El = parent4El.parentElement;
              if (parent5El) {
                parent5El.classList.remove('mm-active');
              }
            }
          }
      }
    }
  };

  activateMenuItems() {
    const links: any = document.getElementsByClassName('nav-link-ref');
    let menuItemEl = null;
    for (let i = 0; i < links.length; i++) {
        if (window.location.pathname === links[i]['pathname']) {
            menuItemEl = links[i];
            break;
        }
    }
    if (menuItemEl) {
        menuItemEl.classList.add('mm-active');
        const parentEl = menuItemEl.parentElement;
        if (parentEl) {
            parentEl.classList.add('mm-active');
            const parent2El = parentEl.parentElement;
            if (parent2El) {
                parent2El.classList.add('mm-show');
            }
            const parent3El = parent2El.parentElement;
            if (parent3El) {
                parent3El.classList.add('mm-active');
                if (parent3El.classList.contains('side-nav-item')) {
                    const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');
                    if (firstAnchor) {
                        firstAnchor.classList.add('mm-active');
                    }
                }
                const parent4El = parent3El.parentElement;
                if (parent4El) {
                    parent4El.classList.add('mm-show');
                    const parent5El = parent4El.parentElement;
                    if (parent5El) {
                        parent5El.classList.add('mm-active');
                    }
                }
            }
        }
    }
  };

  showMenuItem(profiles: any) { 
    let assignedProfile = JSON.parse(localStorage.getItem('profile')!);
    let found = profiles.find((allowedProfile: string) => {
      return allowedProfile === assignedProfile;
    })
    if (found) {
      return true;
    } else
    return false;
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

interface SidebarGroup {
  label: string | null;
  items: MenuItem[];
  open: boolean;
}