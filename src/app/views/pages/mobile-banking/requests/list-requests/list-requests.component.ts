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
  // This is the new property we will use for filtering
  role: 'Auditor' | 'CIA' | 'AuditUnit'; 
  details?: {
    subject: string;
    reportId?: string;
    paraId?: string;
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
  // To store the current user's role
  private currentUserRole: string | null = null; 

  constructor(
    private httpService: HttpService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // --- STEP 1: Get the logged-in user's role from localStorage ---
    this.currentUserRole = localStorage.getItem('userRole');

    if (!this.currentUserRole) {
      // Handle case where user is not logged in or role is missing
      console.error("User role not found in localStorage. Cannot filter inbox.");
      this.isLoading = false;
      // Optionally, you could redirect to the login page here
      // this.router.navigate(['/auth/login']); 
      return;
    }
    
    this.loadInboxData();
  }

  private loadInboxData(): void {
    this.isLoading = true;
    const fullUrl = 'http://localhost:3000/inboxItems';

    this.http.get(fullUrl).pipe(
      map((items: any) => {
        const allItems = (items as any[]).map((item: any): InboxItem => ({
          ...item,
          timestamp: new Date(item.timestamp).getTime(),
          date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        // --- STEP 2: Filter the items based on the current user's role ---
        if (this.currentUserRole) {
          return allItems.filter(item => item.role === this.currentUserRole);
        }
        // If for some reason there's no role, return an empty array to be safe
        return []; 
      }),
      catchError(err => {
        console.error("Failed to load inbox items.", err);
        Swal.fire('Error', 'Could not load inbox data. Is the mock backend server running?', 'error');
        return of([]);
      })
    ).subscribe((roleFilteredItems: InboxItem[]) => {
      this.allInboxItems = roleFilteredItems;
      this.filterItems(this.activeFilter);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  // ... (the rest of your component's code remains exactly the same) ...

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