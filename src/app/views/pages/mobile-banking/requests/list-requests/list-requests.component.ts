import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
// --- ADDITION: Import the new NotificationService ---
import { NotificationService } from 'src/app/shared/services/NotificationService';

export interface InboxItem {
  id: number;
  type: 'approval' | 'response' | 'notification' | 'assignment';
  title: string;
  from: string;
  summary: string;
  date: string;
  timestamp: number;
  isRead: boolean;
  role: 'Auditor' | 'CIA' | 'AuditUnit';
  
  // This is the updated part. We are defining all possible
  // properties that the 'details' object can have.
  // The '?' makes them all optional, which is crucial.
  details?: {
    subject: string;
    reportId?: string;
    paraId?: string;
    auditId?: string;
    observationId?: string;
    auditUnit?: string;
    reviewPeriod?: string;
    dueDate?: string;
    attachments?: { name: string; icon: string; }[];
    history?: { user: string; action: string; date: string; }[];
    role?: string;
    startDate?: string;
    status?: string;
  };
}

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.scss']
})
export class ListRequestsComponent implements OnInit {

  public allInboxItems: InboxItem[] = [];
  public filteredInboxItems: InboxItem[] = [];
  public selectedItem: InboxItem | null = null;
  public isLoading: boolean = true;
  public activeFilter: string = 'all';

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    // --- ADDITION: Inject the NotificationService ---
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadInboxData();
  }

  private loadInboxData(): void {
    this.isLoading = true;
    const fullUrl = `${environment.apiBase}/inboxItems`;

    this.http.get(fullUrl).pipe(
      map((items: any) => {
        return (items as any[]).map((item: any): InboxItem => ({
          ...item,
          timestamp: new Date(item.timestamp).getTime(),
          date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
      }),
      catchError(err => {
        console.error("Failed to load inbox items.", err);
        Swal.fire('Error', 'Could not load inbox data. Please ensure the mock backend server is running.', 'error');
        return of([]);
      })
    ).subscribe((allItems: InboxItem[]) => {
      this.allInboxItems = allItems;
      this.filterItems(this.activeFilter);
      this.isLoading = false;
      this.cdr.detectChanges();

      // --- ADDITION: After loading data, find unread items and update the service ---
      const unreadItems = this.allInboxItems.filter(item => !item.isRead);
      this.notificationService.updateNotifications(unreadItems);
    });
  }

  selectItem(item: InboxItem): void {
    this.selectedItem = item;
    // Mark the item as read
    item.isRead = true;

    // --- ADDITION: When an item is read, update the notification service again ---
    const unreadItems = this.allInboxItems.filter(i => !i.isRead);
    this.notificationService.updateNotifications(unreadItems);
  }

  filterItems(filter: string): void {
    this.activeFilter = filter;
    let itemsToFilter = [...this.allInboxItems];

    switch (filter) {
      case 'awaiting_action':
        this.filteredInboxItems = itemsToFilter.filter(item => item.type === 'approval' || item.type === 'response');
        break;
      case 'notifications':
        this.filteredInboxItems = itemsToFilter.filter(item => item.type === 'notification' || item.type === 'assignment');
        break;
      default:
        this.filteredInboxItems = itemsToFilter;
        break;
    }
    this.sortItems('desc');
  }

  sortItems(direction: 'asc' | 'desc'): void {
    this.filteredInboxItems.sort((a, b) => {
      return direction === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
  }
}