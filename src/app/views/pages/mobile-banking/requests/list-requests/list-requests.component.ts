import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// ==========================================================
// CORRECTED INTERFACE
// ==========================================================
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
    // --- ADDED THESE TWO NEW OPTIONAL PROPERTIES ---
    role?: string;
    startDate?: string;
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
    this.loadInboxData();
  }

  private loadInboxData(): void {
    this.isLoading = true;
    const fullUrl = 'http://localhost:3000/inboxItems';

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
    });
  }

  selectItem(item: InboxItem): void {
    this.selectedItem = item;
    item.isRead = true;
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