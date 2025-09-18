// ====================================================================================
// FINAL, CORRECTED `list-requests.component.ts` WITH DATA CONVERSION
// ====================================================================================

import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from 'src/app/shared/services/NotificationService';
import { Notification } from 'src/app/shared/services/Notification'; // <-- Import the Notification model

export interface Conversation {
  id: number | string;
  sender: string;
  timestamp: string;
  preview: string;
  status: string;
  avatarUrl: string | null;
  initials: string;
  avatarColor: string;
  channelIcon: string;
  personDetails: any;
  assignee?: string;
  isPendingApproval?: boolean;
  creatorData?: any;
}

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.scss']
})
export class ListRequestsComponent implements OnInit {

  public conversations: Conversation[] = [];
  public selectedConversation: Conversation | null = null;
  public isDetailsSidebarVisible: boolean = false;
  public isLoading: boolean = true;
  public pendingApprovals: Conversation[] = [];
  public isNotificationsVisible: boolean = false;
  public views: any[] = [];
  public selectedView: any = null;
  public sortByOptions: any[] = [];
  public sortOrderOptions: any[] = [];
  public selectedSortBy: any = null;
  public selectedSortOrder: any = null;
  public statusOptions: any[] = [];
  public isStatusDropdownOpen: boolean = false;
  public activeTab: 'conversation' | 'person' = 'conversation';

  constructor(
    private httpService: HttpService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
    this.views = [{ id: 1, name: 'All active conversations' }, { id: 2, name: 'Active Livechats' }, { id: 3, name: 'Active Tickets' }, { id: 4, name: 'My inbox' }, { id: 5, 'name': 'AI assistant chats' }, { id: 6, name: 'All test conversations' }];
    this.selectedView = this.views[0];
    this.sortByOptions = [{ id: 'creation_date', name: 'Creation date' }, { id: 'latest_message', name: 'Latest message' }];
    this.sortOrderOptions = [{ id: 'asc', name: 'Ascending' }, { id: 'desc', name: 'Descending' }];
    this.selectedSortBy = this.sortByOptions[0];
    this.selectedSortOrder = this.sortOrderOptions[0];
    this.statusOptions = [{ name: 'Open', color: '#0d6efd' }, { name: 'Pending', color: '#fd7e14' }, { name: 'Resolved', color: '#198754' }, { name: 'Closed', color: '#6c757d' }];
  }

  loadInitialData(): void {
    this.isLoading = true;
    const conversations$ = this.loadConversations();
    const pendingApprovals$ = this.loadPendingApprovals();

    forkJoin([conversations$, pendingApprovals$]).subscribe(
      ([conversations, pendingApprovals]: [Conversation[], Conversation[]]) => {
        this.conversations = conversations;
        this.pendingApprovals = pendingApprovals;

        // --- THIS IS THE NEW CONVERSION LOGIC ---
        // 1. Convert the 'pendingApprovals' (Conversation[]) into the format the service expects (Notification[])
        const notificationsForService: Notification[] = pendingApprovals.map(conv => {
          return {
            process: conv.preview, // e.g., "New creator registration..."
            stagerDetails: conv.sender, // e.g., "John Doe"
            createdOn: conv.timestamp  // e.g., "Sep 17"
          };
        });

        // 2. Update the service with the correctly formatted data
        this.notificationService.updateNotifications(notificationsForService);
        // --- END OF NEW LOGIC ---

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  loadConversations(): Observable<Conversation[]> {
    const staticConversations: Conversation[] = [
      { id: 1, sender: 'Ecl Test', assignee: 'Admin', timestamp: '5 Aug', preview: 'Test', status: 'Open', avatarUrl: null, initials: 'ET', avatarColor: '#e9ecef', channelIcon: 'feather icon-message-circle', personDetails: {}},
      { id: 2, sender: 'Chris Theuri', assignee: 'Admin', timestamp: '4 Aug', preview: 'Confirm', status: 'Open', avatarUrl: null, initials: 'CT', avatarColor: '#f1f3f5', channelIcon: 'feather icon-message-square', personDetails: {} },
    ];
    // --- FIX: Corrected the typo ---
    return of(staticConversations);
  }

  loadPendingApprovals(): Observable<Conversation[]> {
    const endpoint = 'auth/admin/pending-creators';
    return this.httpService.mobileBankingGet(endpoint).pipe(
      map((res: any) => {
        if (Array.isArray(res)) {
          return res.map((creator: any): Conversation => {
            const nameParts = creator.name ? creator.name.split(' ') : ['New', 'User'];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            return {
              id: `APPROVAL-${creator.id}`,
              sender: creator.name || 'Unnamed User',
              assignee: 'Unassigned',
              timestamp: new Date(creator.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              preview: 'New creator registration requires approval.',
              status: 'Pending Approval',
              avatarUrl: null,
              initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
              avatarColor: '#fff0e1',
              channelIcon: 'feather icon-user-plus',
              personDetails: { email: creator.email },
              isPendingApproval: true,
              creatorData: creator,
            };
          });
        }
        return [];
      }),
      catchError(err => of([]))
    );
  }

  // ... all your other functions (approveCreator, removeCreator, etc.) remain unchanged ...
  
  approveCreator(creatorId: number): void {
    const payload = { id: creatorId, approve: true };
    this.httpService.mobileBankingPost('auth/admin/approve-creator', payload).subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          Swal.fire('Success', 'Creator has been approved!', 'success');
          this.hideDetailsSidebar();
          this.loadInitialData();
        } else {
          Swal.fire('Error', res.message || 'Could not approve creator.', 'error');
        }
      },
      error: (err: any) => Swal.fire('Error', 'An API error occurred during approval.', 'error')
    });
  }

  removeCreator(creatorId: number): void {
    const payload = { creator_id: creatorId, reason: "Registration denied by admin." };
    const endpoint = 'auth/admin/reject-creator'; 
    this.httpService.mobileBankingPost(endpoint, payload).subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          Swal.fire('Success', 'Creator has been rejected and removed.', 'success');
          this.hideDetailsSidebar();
          this.loadInitialData();
        } else {
          Swal.fire('Error', res.message || 'Could not reject creator.', 'error');
        }
      },
      error: (err: any) => {
        const errorMessage = err?.error?.message || 'An API error occurred during removal.';
        Swal.fire('Error', `Request failed: ${errorMessage}`, 'error');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.panel-header')) {
      this.isNotificationsVisible = false;
    }
    if (!target.closest('summary') && !target.closest('.status-dropdown-container')) {
      document.querySelectorAll('details[open]').forEach(el => el.removeAttribute('open'));
      this.isStatusDropdownOpen = false;
    }
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationsVisible = !this.isNotificationsVisible;
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.isDetailsSidebarVisible = true;
    this.activeTab = 'conversation';
    this.isNotificationsVisible = false;
  }

  hideDetailsSidebar(): void {
    this.isDetailsSidebarVisible = false;
    this.selectedConversation = null;
  }

  selectView(view: any): void { this.selectedView = view; }
  selectSortBy(option: any): void { this.selectedSortBy = option; }
  selectSortOrder(order: any): void { this.selectedSortOrder = order; }
  toggleStatusDropdown(event: MouseEvent): void { event.stopPropagation(); this.isStatusDropdownOpen = !this.isStatusDropdownOpen; }
  selectStatus(newStatus: any): void { if (this.selectedConversation) { this.selectedConversation.status = newStatus.name; } this.isStatusDropdownOpen = false; }
  selectTab(tab: 'conversation' | 'person'): void { this.activeTab = tab; }
}