import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface FilterItem {
  field: string;
  operator: string;
  value: string;
}

interface AnalyticsData {
  metrics: any;
  time_series: any;
  grouped_data: any;
  segments: any;
}

interface UserStats {
  total_chatbots: number;
  active_chatbots: number;
  inactive_chatbots: number;
  chatbots_by_language: { [key: string]: number };
  avg_intents_per_chatbot: number;
  avg_flows_per_chatbot: number;
}

interface ConversationMetrics {
  total_sessions: number;
  completed_sessions: number;
  avg_duration: number;
  avg_messages: number;
  intent_distribution: { [key: string]: number };
  channel_distribution: { [key: string]: number };
}

interface PerformanceMetrics {
  uptime: number;
  error_rate: number;
  avg_response_time: number;
  max_concurrent_users: number;
  intents_triggered: number;
  fallback_rate: number;
}

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss']
})
export class ProductCategoriesAsCardsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: string = 'chats';
  
  // Date range properties
  startDate: Date = new Date('2025-07-01');
  endDate: Date = new Date('2025-07-31');
  showDatePicker: boolean = false;
  
  // Calendar properties
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  isSelectingRange: boolean = false;
  
  // Loading states
  isLoadingChats: boolean = false;
  isLoadingTickets: boolean = false;
  isLoadingInteractions: boolean = false;
  isLoadingUserStats: boolean = false;
  
  // Data properties
  userStats: UserStats | null = null;
  chatAnalytics: AnalyticsData | null = null;
  conversationMetrics: ConversationMetrics | null = null;
  performanceMetrics: PerformanceMetrics | null = null;
  
  // Selected chatbot for analytics (you might want to add a chatbot selector)
  selectedChatbotId: number | null = null;
  availableChatbots: any[] = [];
  
  // Calendar data
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  years: number[] = [];
  
  // Statuses for the CHATS tab summary cards
  chatStatuses = [
    { name: 'Open', color: '#56CCF2' },
    { name: 'Pending', color: '#F2994A' },
    { name: 'Resolved', color: '#27AE60' },
    { name: 'Overdue', color: '#EB5757' },
    { name: 'Closed', color: '#828282' }
  ];

  // Statuses for the TICKETS tab summary cards
  ticketStatuses = [
    { name: 'Open', color: '#56CCF2' },
    { name: 'Pending', color: '#F2994A' },
    { name: 'Resolved', color: '#27AE60' },
    { name: 'Overdue', color: '#EB5757' }
  ];

  constructor(
    private _httpService: HttpService,
    private _toastService: ToastrService
  ) {
    // Initialize years array
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    // Initialize calendar with current date range
    this.selectedStartDate = new Date(this.startDate);
    this.selectedEndDate = new Date(this.endDate);
    
    // Load initial data
    this.loadUserStats();
    this.loadAvailableChatbots();
    this.loadDataForActiveTab();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user statistics
   */
  private loadUserStats(): void {
    this.isLoadingUserStats = true;
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
      this._toastService.error('User ID not found', 'Error');
      this.isLoadingUserStats = false;
      return;
    }

    const payload = {
      user_id: parseInt(userId, 10),
      days: this.getDaysBetweenDates()
    };

    this._httpService.mobileBankingPost('analytics/user/stats', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingUserStats = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.status === '00') {
            this.userStats = response.data;
          } else {
            this._toastService.warning(response.message || 'Failed to load user stats', 'Warning');
          }
        },
        error: (error: any) => {
          console.error('Error loading user stats:', error);
          this._toastService.error('Failed to load user statistics', 'Error');
        }
      });
  }

  /**
   * Load available chatbots for selection
   */
  private loadAvailableChatbots(): void {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    const payload = { user_id: parseInt(userId, 10) };

    this._httpService.mobileBankingPost('builder/chatbots/list', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === '00' && Array.isArray(response.data)) {
            this.availableChatbots = response.data.filter((bot: any) => bot.is_active);
            // Select first active chatbot if none selected
            if (this.availableChatbots.length > 0 && !this.selectedChatbotId) {
              this.selectedChatbotId = this.availableChatbots[0].id;
              this.loadDataForActiveTab();
            }
          }
        },
        error: (error: any) => {
          console.error('Error loading chatbots:', error);
        }
      });
  }

  /**
   * Load chat analytics data
   */
  private loadChatAnalytics(): void {
    if (!this.selectedChatbotId) {
      this.chatAnalytics = null;
      return;
    }

    this.isLoadingChats = true;
    const payload = {
      chatbot_id: this.selectedChatbotId,
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: 'day',
      filters: this.buildFilters()
    };

    this._httpService.mobileBankingPost('analytics/chats', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingChats = false)
      )
      .subscribe({
        next: (response: any) => {
          this.chatAnalytics = response;
          this.loadConversationMetrics();
        },
        error: (error: any) => {
          console.error('Error loading chat analytics:', error);
          this._toastService.error('Failed to load chat analytics', 'Error');
        }
      });
  }

  /**
   * Load conversation metrics
   */
  private loadConversationMetrics(): void {
    if (!this.selectedChatbotId) return;

    const payload = {
      chatbot_id: this.selectedChatbotId,
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: 'day',
      segmented_by: 'channel',
      filters: this.buildFilters(),
      days: this.getDaysBetweenDates()
    };

    this._httpService.mobileBankingPost('analytics/conversations', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === '00' && Array.isArray(response.data)) {
            // Convert array format to object
            const metrics: any = {};
            response.data.forEach(([key, value]: [string, any]) => {
              metrics[key] = value;
            });
            this.conversationMetrics = metrics;
          }
        },
        error: (error: any) => {
          console.error('Error loading conversation metrics:', error);
        }
      });
  }

  /**
   * Load performance metrics
   */
  private loadPerformanceMetrics(): void {
    if (!this.selectedChatbotId) return;

    const payload = {
      chatbot_id: this.selectedChatbotId,
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: 'day',
      segmented_by: 'channel',
      filters: this.buildFilters(),
      days: this.getDaysBetweenDates()
    };

    this._httpService.mobileBankingPost('analytics/performance', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === '00' && Array.isArray(response.data)) {
            // Convert array format to object
            const metrics: any = {};
            response.data.forEach(([key, value]: [string, any]) => {
              metrics[key] = value;
            });
            this.performanceMetrics = metrics;
          }
        },
        error: (error: any) => {
          console.error('Error loading performance metrics:', error);
        }
      });
  }

  /**
   * Load ticket analytics (placeholder - implement when API is ready)
   */
  private loadTicketAnalytics(): void {
    this.isLoadingTickets = true;
    // Placeholder for when tickets API is implemented
    setTimeout(() => {
      this.isLoadingTickets = false;
      console.log('Tickets API not yet implemented');
    }, 1000);
  }

  /**
   * Load interaction analytics (placeholder - implement when API is ready)
   */
  private loadInteractionAnalytics(): void {
    this.isLoadingInteractions = true;
    // Placeholder for when interactions API is implemented
    setTimeout(() => {
      this.isLoadingInteractions = false;
      console.log('Interactions API not yet implemented');
    }, 1000);
  }

  /**
   * Helper method to build filters array
   */
  private buildFilters(): FilterItem[] {
    // Build filters based on your filter chips
    // This is a placeholder - implement based on your filter UI
    return [];
  }

  /**
   * Helper method to format date for API
   */
  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper method to calculate days between dates
   */
  private getDaysBetweenDates(): number {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Load data based on active tab
   */
  private loadDataForActiveTab(): void {
    switch (this.activeTab) {
      case 'chats':
        this.loadChatAnalytics();
        this.loadPerformanceMetrics();
        break;
      case 'tickets':
        this.loadTicketAnalytics();
        break;
      case 'interactions':
        this.loadInteractionAnalytics();
        break;
    }
  }

  /**
   * Handle chatbot selection change
   */
  onChatbotChange(chatbotId: number): void {
    this.selectedChatbotId = chatbotId;
    this.loadDataForActiveTab();
  }

  /**
   * Get total sessions for display
   */
  getTotalSessions(): string {
    return this.conversationMetrics?.total_sessions?.toString() || '-';
  }

  /**
   * Get completed sessions for display
   */
  getCompletedSessions(): string {
    return this.conversationMetrics?.completed_sessions?.toString() || '-';
  }

  /**
   * Get average response time for display
   */
  getAverageResponseTime(): string {
    if (this.performanceMetrics?.avg_response_time) {
      return `${this.performanceMetrics.avg_response_time.toFixed(2)} ms`;
    }
    return '-';
  }

  /**
   * Get system uptime for display
   */
  getSystemUptime(): string {
    if (this.performanceMetrics?.uptime) {
      return `${this.performanceMetrics.uptime.toFixed(1)}%`;
    }
    return '-';
  }

  /**
   * Check if we have chat data to display
   */
  hasChatData(): boolean {
    return !this.isLoadingChats && (
      this.conversationMetrics !== null || 
      this.performanceMetrics !== null ||
      this.chatAnalytics !== null
    );
  }

  /**
   * Check if we have ticket data to display
   */
  hasTicketData(): boolean {
    return !this.isLoadingTickets && false; // Update when tickets API is implemented
  }

  /**
   * Check if we have interaction data to display
   */
  hasInteractionData(): boolean {
    return !this.isLoadingInteractions && false; // Update when interactions API is implemented
  }

  // ========================================
  // EXISTING METHODS (keep all your existing calendar and UI methods)
  // ========================================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.loadDataForActiveTab();
  }

  toggleDatePicker(): void {
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      this.selectedStartDate = new Date(this.startDate);
      this.selectedEndDate = new Date(this.endDate);
      this.isSelectingRange = false;
    }
  }

  getCalendarDays(): (number | null)[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }

  selectDay(day: number | null): void {
    if (day === null) return;
    
    const selectedDate = new Date(this.currentYear, this.currentMonth, day);
    
    if (!this.isSelectingRange || !this.selectedStartDate) {
      this.selectedStartDate = selectedDate;
      this.selectedEndDate = null;
      this.isSelectingRange = true;
    } else {
      if (selectedDate < this.selectedStartDate) {
        this.selectedEndDate = this.selectedStartDate;
        this.selectedStartDate = selectedDate;
      } else {
        this.selectedEndDate = selectedDate;
      }
      this.isSelectingRange = false;
    }
  }

  isDaySelected(day: number | null): boolean {
    if (day === null) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dateStr = date.toDateString();
    
    return (this.selectedStartDate?.toDateString() === dateStr) ||
           (this.selectedEndDate?.toDateString() === dateStr);
  }

  isDayInRange(day: number | null): boolean {
    if (day === null || !this.selectedStartDate || !this.selectedEndDate) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    return date > this.selectedStartDate && date < this.selectedEndDate;
  }

  isDayRangeStart(day: number | null): boolean {
    if (day === null) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    return this.selectedStartDate?.toDateString() === date.toDateString();
  }

  isDayRangeEnd(day: number | null): boolean {
    if (day === null) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    return this.selectedEndDate?.toDateString() === date.toDateString();
  }

  isToday(day: number | null): boolean {
    if (day === null) return false;
    
    const today = new Date();
    return day === today.getDate() && 
           this.currentMonth === today.getMonth() && 
           this.currentYear === today.getFullYear();
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  onMonthChange(month: number): void {
    this.currentMonth = month;
  }

  onYearChange(year: number): void {
    this.currentYear = year;
  }

  applyDateRange(): void {
    if (this.selectedStartDate && this.selectedEndDate) {
      this.startDate = new Date(this.selectedStartDate);
      this.endDate = new Date(this.selectedEndDate);
      this.showDatePicker = false;
      this.refreshData();
    }
  }

  cancelDateSelection(): void {
    this.showDatePicker = false;
    this.selectedStartDate = new Date(this.startDate);
    this.selectedEndDate = new Date(this.endDate);
    this.isSelectingRange = false;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  }

  getDateRangeDisplay(): string {
    return `Date range: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
  }

  downloadData(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `${this.activeTab}_data_${currentDate}.csv`;
    
    let csvData = this.generateCSVData();
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private generateCSVData(): string {
    const headers = this.getCSVHeaders();
    const rows = this.getCSVRows();
    
    return [headers, ...rows].join('\n');
  }

  private getCSVHeaders(): string {
    switch (this.activeTab) {
      case 'chats':
        return 'Date,Total Sessions,Completed Sessions,Avg Duration,Avg Messages,Avg Response Time,System Uptime';
      case 'tickets':
        return 'Date,Total New Tickets,Open,Pending,Resolved,Overdue,Avg Live Agent Response Time';
      case 'interactions':
        return 'Date,Total Interactions,By Channel,By Agent Type,By Status';
      default:
        return 'Date,Value';
    }
  }

  private getCSVRows(): string[] {
    const rows: string[] = [];
    const startTime = this.startDate.getTime();
    const endTime = this.endDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let time = startTime; time <= endTime; time += dayMs) {
      const date = new Date(time);
      const dateStr = date.toISOString().split('T')[0];
      
      switch (this.activeTab) {
        case 'chats':
          const totalSessions = this.conversationMetrics?.total_sessions || 0;
          const completedSessions = this.conversationMetrics?.completed_sessions || 0;
          const avgDuration = this.conversationMetrics?.avg_duration || 0;
          const avgMessages = this.conversationMetrics?.avg_messages || 0;
          const avgResponseTime = this.performanceMetrics?.avg_response_time || 0;
          const uptime = this.performanceMetrics?.uptime || 0;
          rows.push(`${dateStr},${totalSessions},${completedSessions},${avgDuration.toFixed(2)},${avgMessages.toFixed(2)},${avgResponseTime.toFixed(2)},${uptime.toFixed(1)}%`);
          break;
        case 'tickets':
          rows.push(`${dateStr},0,0,0,0,0,0 min`);
          break;
        case 'interactions':
          rows.push(`${dateStr},0,0,0,0`);
          break;
      }
    }
    
    return rows;
  }

  private refreshData(): void {
    console.log(`Refreshing ${this.activeTab} data for range: ${this.getDateRangeDisplay()}`);
    this.loadUserStats();
    this.loadDataForActiveTab();
  }
}