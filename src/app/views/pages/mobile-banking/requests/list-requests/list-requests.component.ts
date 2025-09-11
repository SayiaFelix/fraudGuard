import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
    // Static data setup...
    this.views = [{ id: 1, name: 'All active conversations' }, { id: 2, name: 'Active Livechats' }, { id: 3, name: 'Active Tickets' }, { id: 4, name: 'My inbox' }, { id: 5, 'name': 'AI assistant chats' }, { id: 6, name: 'All test conversations' }];
    this.selectedView = this.views[0];
    this.sortByOptions = [{ id: 'creation_date', name: 'Creation date' }, { id: 'latest_message', name: 'Latest message' }, { id: 'customer_wait_time', name: 'Customer wait time' }, { id: 'agent_takeover_time', name: 'Time since live agent takeover' }];
    this.sortOrderOptions = [{ id: 'asc', name: 'Ascending' }, { id: 'desc', name: 'Descending' }];
    this.selectedSortBy = this.sortByOptions[0];
    this.selectedSortOrder = this.sortOrderOptions[0];
    this.statusOptions = [{ name: 'Open', color: '#0d6efd' }, { name: 'Pending', color: '#fd7e14' }, { name: 'Overdue', color: '#dc3545' }, { name: 'Resolved', color: '#198754' }, { name: 'Closed', color: '#6c757d' }];
  }

  loadInitialData(): void {
    this.isLoading = true;
    const conversations$ = this.loadConversations();
    const pendingApprovals$ = this.loadPendingApprovals();

    forkJoin([conversations$, pendingApprovals$]).subscribe(
      ([conversations, pendingApprovals]: [Conversation[], Conversation[]]) => {
        this.conversations = conversations;
        this.pendingApprovals = pendingApprovals;
        this.isLoading = false;
        console.log("--- FINAL DATA ---");
        console.log("Loaded conversations:", this.conversations);
        console.log("Loaded pending approvals:", this.pendingApprovals);
        this.cdr.detectChanges();
      }
    );
  }

  loadConversations(): Observable<Conversation[]> {
    console.log("1. Loading static conversations...");
    const staticConversations: Conversation[] = [
      { id: 1, sender: 'Ecl Test', assignee: 'Admin', timestamp: '5 Aug', preview: 'Test', status: 'Open', avatarUrl: null, initials: 'ET', avatarColor: '#e9ecef', channelIcon: 'feather icon-message-circle', personDetails: { location: 'Dar es Salaam', country: 'Tanzania', ipAddress: '192.168.1.10', email: 'test@ecl.com', phoneNumber: '0712345678', personalId: 'N/A', channelId: 'web-1a2b3c', uniqueId: 'uid-ecl-test' } },
      { id: 2, sender: 'Chris Theuri', assignee: 'Admin', timestamp: '4 Aug', preview: 'Confirm', status: 'Open', avatarUrl: null, initials: 'CT', avatarColor: '#f1f3f5', channelIcon: 'feather icon-message-square', personDetails: { location: 'Nairobi', country: 'Kenya', ipAddress: '10.0.0.5', email: 'criskahiga@example.com', phoneNumber: '0704349218', personalId: '01J1YSQW...', channelId: '254704349...', uniqueId: 'uid-chris-t' } },
    ];
    return of(staticConversations);
  }

  loadPendingApprovals(): Observable<Conversation[]> {
    console.log("2. Fetching pending creator approvals...");
    const endpoint = 'auth/admin/pending-creators';
    return this.httpService.mobileBankingGet(endpoint, {}).pipe(
      map((res: any) => {
        console.log("3. RAW API RESPONSE FOR PENDING CREATORS:", res);
        if (Array.isArray(res)) {
          console.log("4. SUCCESS: Response is an array. Processing...");
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
        console.log("4. FAILURE: Response was not a direct array as expected.");
        return [];
      }),
      catchError(err => {
        console.error(`5. HTTP ERROR: Failed to load from endpoint: ${endpoint}`, err);
        return of([]);
      })
    );
  }

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
    this.httpService.mobileBankingPost('auth/admin/remove-creator', payload).subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          Swal.fire('Success', 'Creator has been denied and removed.', 'success');
          this.hideDetailsSidebar();
          this.loadInitialData();
        } else {
          Swal.fire('Error', res.message || 'Could not remove creator.', 'error');
        }
      },
      error: (err: any) => Swal.fire('Error', 'An API error occurred during removal.', 'error')
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