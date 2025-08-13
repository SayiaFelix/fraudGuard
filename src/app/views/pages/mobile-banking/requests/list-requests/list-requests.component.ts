import { Component, OnInit, HostListener } from '@angular/core';

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

  // State for the active sidebar tab
  public activeTab: 'conversation' | 'person' = 'conversation';

  constructor() { }

  ngOnInit(): void {
    // =======================================================================
    // ===== MODIFIED: conversations array now includes personDetails    =====
    // =======================================================================
    this.conversations = [
      { 
        id: 1, sender: 'Ecl Test', timestamp: '5 Aug', preview: 'Test', status: 'Open', avatarUrl: null, initials: 'ET', avatarColor: '#e9ecef', channelIcon: 'feather icon-message-circle',
        personDetails: {
          location: 'Dar es Salaam',
          country: 'Tanzania',
          ipAddress: '192.168.1.10',
          email: 'test@ecl.com',
          phoneNumber: '0712345678',
          personalId: 'N/A',
          channelId: 'web-1a2b3c',
          uniqueId: 'uid-ecl-test'
        }
      },
      { 
        id: 2, sender: 'Chris Theuri', timestamp: '4 Aug', preview: 'Confirm', status: 'Open', avatarUrl: null, initials: 'CT', avatarColor: '#f1f3f5', channelIcon: 'feather icon-message-square',
        personDetails: {
          location: 'Nairobi',
          country: 'Kenya',
          ipAddress: '10.0.0.5',
          email: 'criskahiga@example.com',
          phoneNumber: '0704349218',
          personalId: '01J1YSQW...',
          channelId: '254704349...',
          uniqueId: 'uid-chris-t'
        }
      },
      { 
        id: 3, sender: 'Chris - WA', timestamp: '4 Aug', preview: 'Message from WhatsApp', status: 'Pending', avatarUrl: null, initials: 'CW', avatarColor: '#e9ecef', channelIcon: 'feather icon-phone',
         personDetails: {
          location: null,
          country: 'Kenya',
          ipAddress: null,
          email: null,
          phoneNumber: '254798765432',
          personalId: 'N/A',
          channelId: 'wa-254798765432',
          uniqueId: 'uid-chris-wa'
        }
      },
      { 
        id: 4, sender: 'Unknown', timestamp: '31 Jul', preview: 'Hello! How can I hel...', status: 'Resolved', avatarUrl: null, initials: '?', avatarColor: '#e9ecef', channelIcon: 'feather icon-users',
         personDetails: {
          location: null, country: null, ipAddress: '172.16.0.100', email: null, phoneNumber: null, personalId: null, channelId: null, uniqueId: 'uid-unknown-1'
        }
      },
      { 
        id: 5, sender: 'Default Webchat', timestamp: '28 Jul', preview: 'A new webchat started', status: 'Open', avatarUrl: null, initials: 'DW', avatarColor: '#e9ecef', channelIcon: 'feather icon-message-square',
        personDetails: {
          location: 'New York', country: 'USA', ipAddress: '208.80.154.224', email: 'visitor@web.com', phoneNumber: null, personalId: null, channelId: 'web-def-456', uniqueId: 'uid-webchat-def'
        }
      },
      { 
        id: 6, sender: 'Tim', timestamp: '6 Jul', preview: 'Family', status: 'Closed', avatarUrl: null, initials: 'T', avatarColor: '#f1f3f5', channelIcon: 'feather icon-message-circle',
         personDetails: {
          location: 'London', country: 'UK', ipAddress: '8.8.8.8', email: 'tim@family.com', phoneNumber: '442079460991', personalId: 'UK-TIM-123', channelId: 'email-tim', uniqueId: 'uid-tim-uk'
        }
      }
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // If the click is outside of any details summary or the status dropdown, close them
    if (!target.closest('summary') && !target.closest('.status-dropdown-container')) {
      document.querySelectorAll('details[open]').forEach(el => el.removeAttribute('open'));
      this.isStatusDropdownOpen = false;
    }
  }

  // --- Inbox Methods ---
  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.isDetailsSidebarVisible = true;
    // When a new conversation is selected, it's good practice to default to the conversation tab
    this.activeTab = 'conversation'; 
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

  // --- Sidebar Tab Method ---
  selectTab(tab: 'conversation' | 'person'): void {
    this.activeTab = tab;
  }
}