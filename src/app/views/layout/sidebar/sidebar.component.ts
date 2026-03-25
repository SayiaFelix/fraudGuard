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

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  
  @ViewChild('sidebarToggler') sidebarToggler: ElementRef;
  @Output() helpCenterToggled = new EventEmitter<MouseEvent>();
  menuItems: MenuItem[] = [];
  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;
  isSettingsModalVisible = false;
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
    private notificationService: NotificationService
  ) {
    
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
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

    const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
    desktopMedium.addEventListener('change', () => this.iconSidebar(desktopMedium));
    this.iconSidebar(desktopMedium);

    
    this.notificationSub = this.notificationService.currentNotifications.subscribe((notifications: InboxItem[]) => {
      this.updateInboxBadge(notifications);
    });
  }

  
  ngOnDestroy(): void {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }

  
  private updateInboxBadge(notifications: InboxItem[]): void {
    const inboxMenuItem = this.menuItems.find(item => item.label === 'Inbox');
    
    if (inboxMenuItem) {
      const unreadCount = notifications.length;

      if (unreadCount > 0) {
        inboxMenuItem.badge = { 
          text: unreadCount.toString(), 
          variant: 'danger' // This creates a red badge
        };
      } else {
        
        delete inboxMenuItem.badge;
      }
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
    if (mq.matches) {
      this.document.body.classList.add('sidebar-folded');
    } else {
      this.document.body.classList.remove('sidebar-folded');
    }
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
}