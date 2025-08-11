import { Component, OnInit, HostListener } from '@angular/core'; // Added HostListener here

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.scss']
})
export class ListRequestsComponent implements OnInit {

  // State for the main inbox view
  public conversations: any[] = [];
  public selectedConversation: any = null;
  public isDetailsSidebarVisible: boolean = false;

  // State for the "Views" filter dropdown
  public views: any[] = [];
  public selectedView: any = null;

  // State for the "Sort" filter dropdown
  public sortByOptions: any[] = [];
  public sortOrderOptions: any[] = [];
  public selectedSortBy: any = null;
  public selectedSortOrder: any = null;

  // State for the in-sidebar "Status" dropdown
  public statusOptions: any[] = [];
  public isStatusDropdownOpen: boolean = false;

  constructor() { }

  ngOnInit(): void {
    // Populate conversations list (with a status property for the dropdown to work)
    this.conversations = [
      { id: 1, sender: 'Ecl Test', timestamp: '5 Aug', preview: 'Test', status: 'Open', avatarUrl: null, initials: '', avatarColor: '#e9ecef', channelIcon: 'feather icon-message-circle' },
      { id: 2, sender: 'Chris Theuri', timestamp: '4 Aug', preview: 'Confirm', status: 'Open', avatarUrl: null, initials: 'CT', avatarColor: '#f1f3f5', channelIcon: 'feather icon-message-square' },
      { id: 3, sender: 'Chris - WA', timestamp: '4 Aug', preview: 'Message from WhatsApp', status: 'Pending', avatarUrl: null, initials: '', avatarColor: '#e9ecef', channelIcon: 'feather icon-phone' },
      { id: 4, sender: 'Unknown', timestamp: '31 Jul', preview: 'Hello! How can I hel...', status: 'Resolved', avatarUrl: null, initials: '', avatarColor: '#e9ecef', channelIcon: 'feather icon-users' },
      { id: 5, sender: 'Default Webchat', timestamp: '28 Jul', preview: 'A new webchat started', status: 'Open', avatarUrl: null, initials: '', avatarColor: '#e9ecef', channelIcon: 'feather icon-message-square' },
      { id: 6, sender: 'Tim', timestamp: '6 Jul', preview: 'Family', status: 'Closed', avatarUrl: null, initials: 'T', avatarColor: '#f1f3f5', channelIcon: 'feather icon-message-circle' }
    ];

    // Populate "Views" filter options
    this.views = [
      { id: 1, name: 'All active conversations' },
      { id: 2, name: 'Active Livechats' },
      { id: 3, name: 'Active Tickets' },
      { id: 4, name: 'My inbox' },
      { id: 5, name: 'AI assistant chats' },
      { id: 6, name: 'All test conversations' }
    ];
    this.selectedView = this.views[0];

    // Populate "Sort" filter options
    this.sortByOptions = [
      { id: 'creation_date', name: 'Creation date' },
      { id: 'latest_message', name: 'Latest message' },
      { id: 'customer_wait_time', name: 'Customer wait time' },
      { id: 'agent_takeover_time', name: 'Time since live agent takeover' }
    ];
    this.sortOrderOptions = [
      { id: 'asc', name: 'Ascending' },
      { id: 'desc', name: 'Descending' }
    ];
    this.selectedSortBy = this.sortByOptions[0];
    this.selectedSortOrder = this.sortOrderOptions[0];
    
    // Populate "Status" dropdown options
    this.statusOptions = [
      { name: 'Open', color: '#0d6efd' },
      { name: 'Pending', color: '#fd7e14' },
      { name: 'Overdue', color: '#dc3545' },
      { name: 'Resolved', color: '#198754' },
      { name: 'Closed', color: '#6c757d' }
    ];
  }

  // =======================================================================
  // ===== THIS IS THE CRITICAL FUNCTION THAT WAS MISSING =====
  // =======================================================================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // If the click is outside of any details summary or the status dropdown, close them
    if (!target.closest('summary') && !target.closest('.status-dropdown-container')) {
      document.querySelectorAll('details[open]').forEach(el => el.removeAttribute('open'));
      this.isStatusDropdownOpen = false;
    }
  }
  // =======================================================================

  // --- Inbox Methods ---
  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.isDetailsSidebarVisible = true;
  }

  hideDetailsSidebar(): void {
    this.isDetailsSidebarVisible = false;
  }

  // --- Filter Methods ---
  selectView(view: any): void {
    this.selectedView = view;
    const detailsElement = document.querySelector('.conversation-filter');
    if (detailsElement) {
      detailsElement.removeAttribute('open');
    }
  }

  selectSortBy(option: any): void {
    this.selectedSortBy = option;
  }

  selectSortOrder(order: any): void {
    this.selectedSortOrder = order;
  }

  // --- In-Sidebar Status Dropdown Methods ---
  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  selectStatus(newStatus: any): void {
    if (this.selectedConversation) {
      this.selectedConversation.status = newStatus.name;
    }
    this.isStatusDropdownOpen = false;
  }
}