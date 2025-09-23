import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
  
  // This is the part we are updating to include all possible fields
  details?: {
    subject: string;
    reportId?: string;
    paraId?: string;
    // --- ADDED NEW OPTIONAL PROPERTIES ---
    auditId?: string;
    observationId?: string;
    auditUnit?: string;
    reviewPeriod?: string;
    dueDate?: string;
    attachments?: { name: string; icon: string; }[];
    history?: { user: string; action: string; date: string; }[];
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
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // We now directly call the function to load data, no role check needed.
    this.loadInboxData();
  }

  private loadInboxData(): void {
    this.isLoading = true;
    const fullUrl = 'http://localhost:3000/inboxItems';

    this.http.get(fullUrl).pipe(
      map((items: any) => {
        // This maps the raw data from the server to our InboxItem model
        return (items as any[]).map((item: any): InboxItem => ({
          ...item,
          timestamp: new Date(item.timestamp).getTime(),
          date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
      }),
      catchError(err => {
        // This handles errors if the server isn't running
        console.error("Failed to load inbox items.", err);
        Swal.fire('Error', 'Could not load inbox data. Please ensure the mock backend server is running.', 'error');
        return of([]); // Return an empty array to prevent the app from crashing
      })
    ).subscribe((allItems: InboxItem[]) => {
      // The API call was successful
      this.allInboxItems = allItems;
      this.filterItems(this.activeFilter); // Apply the default "All Items" filter
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  selectItem(item: InboxItem): void {
    this.selectedItem = item;
    item.isRead = true;
  }

  filterItems(filter: string): void {
    this.activeFilter = filter;
    let itemsToFilter = [...this.allInboxItems];

    // The filters for "Awaiting Action" and "Notifications" will still work
    switch (filter) {
      case 'awaiting_action':
        this.filteredInboxItems = itemsToFilter.filter(item => item.type === 'approval' || item.type === 'response');
        break;
      case 'notifications':
        this.filteredInboxItems = itemsToFilter.filter(item => item.type === 'notification' || item.type === 'assignment');
        break;
      default: // 'all'
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