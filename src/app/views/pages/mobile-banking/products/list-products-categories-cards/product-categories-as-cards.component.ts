import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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

interface ChartDataPoint {
  date: string;
  count: number;
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
  
  // Calendar properties (RESTORED)
  showDatePicker: boolean = false;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  isSelectingRange: boolean = false;
  
  // Filter dropdown states
  showGroupByDropdown: boolean = false;
  showSegmentByDropdown: boolean = false;
  showChatTypeDropdown: boolean = false;
  showAIAssistantsDropdown: boolean = false;
  showChannelsDropdown: boolean = false;
  showLiveAgentsDropdown: boolean = false;
  showTeamsDropdown: boolean = false;
  showStatusDropdown: boolean = false;
  showCSATRatingDropdown: boolean = false;
  
  // Filter selected values
  selectedGroupBy: string = 'Day';
  selectedSegmentBy: string = 'Select';
  selectedChatType: string = 'Select';
  selectedAIAssistants: string[] = [];
  selectedChannels: string[] = [];
  selectedLiveAgents: string[] = [];
  selectedTeams: string[] = [];
  selectedStatus: string[] = [];
  selectedCSATRating: string[] = [];
  
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
  chartData: ChartDataPoint[] = [];
  
  // Available options for dropdowns
  availableChatbots: any[] = [];
  availableChannels: string[] = ['Web Chat', 'WhatsApp', 'Facebook', 'SMS'];
  availableLiveAgents: any[] = [{ id: 1, name: 'Tecla Kyalo' }];
  availableTeams: string[] = ['Customer Support', 'Sales', 'Technical'];
  
  // Filter options
  groupByOptions = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
  segmentByOptions = ['Chat type', 'AI Assistants', 'Channels', 'Live Agents', 'Teams', 'Status', 'CSAT Rating'];
  chatTypeOptions = ['Livechats', 'AI assistants'];
  statusOptions = ['Open', 'Pending', 'Resolved', 'Overdue', 'Closed'];
  csatRatingOptions = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
  
  // Calendar data (RESTORED)
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
    // Initialize years array (RESTORED)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    // Initialize calendar with current date range (RESTORED)
    this.selectedStartDate = new Date(this.startDate);
    this.selectedEndDate = new Date(this.endDate);
    
    // Load initial data
    this.loadUserStats();
    this.loadAvailableChatbots();
    this.loadDataForActiveTab();
    this.generateMockChartData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Generate mock chart data for demonstration
   */
  private generateMockChartData(): void {
    const data: ChartDataPoint[] = [];
    const startTime = this.startDate.getTime();
    const endTime = this.endDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let time = startTime; time <= endTime; time += dayMs) {
      const date = new Date(time);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      data.push({
        date: dateStr,
        count: Math.floor(Math.random() * 20) + 5 // Random count between 5-25
      });
    }
    this.chartData = data;
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
    this.isLoadingChats = true;
    const payload = {
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: this.selectedGroupBy.toLowerCase(),
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
    const payload = {
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: this.selectedGroupBy.toLowerCase(),
      segmented_by: 'channel',
      filters: this.buildFilters(),
      days: this.getDaysBetweenDates()
    };

    this._httpService.mobileBankingPost('analytics/conversations', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === '00' && Array.isArray(response.data)) {
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
    const payload = {
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: this.selectedGroupBy.toLowerCase(),
      segmented_by: 'channel',
      filters: this.buildFilters(),
      days: this.getDaysBetweenDates()
    };

    this._httpService.mobileBankingPost('analytics/performance', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === '00' && Array.isArray(response.data)) {
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
    setTimeout(() => {
      this.isLoadingInteractions = false;
      console.log('Interactions API not yet implemented');
    }, 1000);
  }

  // Filter dropdown methods
  toggleGroupByDropdown(): void {
    this.showGroupByDropdown = !this.showGroupByDropdown;
    this.closeOtherDropdowns('groupBy');
  }

  toggleSegmentByDropdown(): void {
    this.showSegmentByDropdown = !this.showSegmentByDropdown;
    this.closeOtherDropdowns('segmentBy');
  }

  toggleChatTypeDropdown(): void {
    this.showChatTypeDropdown = !this.showChatTypeDropdown;
    this.closeOtherDropdowns('chatType');
  }

  toggleAIAssistantsDropdown(): void {
    this.showAIAssistantsDropdown = !this.showAIAssistantsDropdown;
    this.closeOtherDropdowns('aiAssistants');
  }

  toggleChannelsDropdown(): void {
    this.showChannelsDropdown = !this.showChannelsDropdown;
    this.closeOtherDropdowns('channels');
  }

  toggleLiveAgentsDropdown(): void {
    this.showLiveAgentsDropdown = !this.showLiveAgentsDropdown;
    this.closeOtherDropdowns('liveAgents');
  }

  toggleTeamsDropdown(): void {
    this.showTeamsDropdown = !this.showTeamsDropdown;
    this.closeOtherDropdowns('teams');
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
    this.closeOtherDropdowns('status');
  }

  toggleCSATRatingDropdown(): void {
    this.showCSATRatingDropdown = !this.showCSATRatingDropdown;
    this.closeOtherDropdowns('csatRating');
  }

  private closeOtherDropdowns(except: string): void {
    if (except !== 'groupBy') this.showGroupByDropdown = false;
    if (except !== 'segmentBy') this.showSegmentByDropdown = false;
    if (except !== 'chatType') this.showChatTypeDropdown = false;
    if (except !== 'aiAssistants') this.showAIAssistantsDropdown = false;
    if (except !== 'channels') this.showChannelsDropdown = false;
    if (except !== 'liveAgents') this.showLiveAgentsDropdown = false;
    if (except !== 'teams') this.showTeamsDropdown = false;
    if (except !== 'status') this.showStatusDropdown = false;
    if (except !== 'csatRating') this.showCSATRatingDropdown = false;
  }

  // Selection methods
  selectGroupBy(option: string): void {
    this.selectedGroupBy = option;
    this.showGroupByDropdown = false;
    this.refreshData();
  }

  selectSegmentBy(option: string): void {
    this.selectedSegmentBy = option;
    this.showSegmentByDropdown = false;
    this.refreshData();
  }

  selectChatType(option: string): void {
    this.selectedChatType = option;
    this.showChatTypeDropdown = false;
    this.refreshData();
  }

  toggleAIAssistantSelection(botId: number, botName: string): void {
    const index = this.selectedAIAssistants.findIndex(bot => bot === botName);
    if (index > -1) {
      this.selectedAIAssistants.splice(index, 1);
    } else {
      this.selectedAIAssistants.push(botName);
    }
    this.refreshData();
  }

  toggleStatusSelection(status: string): void {
    const index = this.selectedStatus.indexOf(status);
    if (index > -1) {
      this.selectedStatus.splice(index, 1);
    } else {
      this.selectedStatus.push(status);
    }
    this.refreshData();
  }

  toggleCSATRatingSelection(rating: string): void {
    const index = this.selectedCSATRating.indexOf(rating);
    if (index > -1) {
      this.selectedCSATRating.splice(index, 1);
    } else {
      this.selectedCSATRating.push(rating);
    }
    this.refreshData();
  }

  // Helper methods
  isAIAssistantSelected(botName: string): boolean {
    return this.selectedAIAssistants.includes(botName);
  }

  isStatusSelected(status: string): boolean {
    return this.selectedStatus.includes(status);
  }

  isCSATRatingSelected(rating: string): boolean {
    return this.selectedCSATRating.includes(rating);
  }

  getSelectedAIAssistantsDisplay(): string {
    if (this.selectedAIAssistants.length === 0) return 'Select';
    if (this.selectedAIAssistants.length === 1) return this.selectedAIAssistants[0];
    return `${this.selectedAIAssistants.length} selected`;
  }

  getSelectedStatusDisplay(): string {
    if (this.selectedStatus.length === 0) return 'Select';
    if (this.selectedStatus.length === 1) return this.selectedStatus[0];
    return `${this.selectedStatus.length} selected`;
  }

  getSelectedCSATRatingDisplay(): string {
    if (this.selectedCSATRating.length === 0) return 'Select';
    if (this.selectedCSATRating.length === 1) return this.selectedCSATRating[0];
    return `${this.selectedCSATRating.length} selected`;
  }

  /**
   * Helper method to build filters array
   */
  private buildFilters(): FilterItem[] {
    const filters: FilterItem[] = [];
    
    if (this.selectedChatType !== 'Select') {
      filters.push({ field: 'chat_type', operator: 'eq', value: this.selectedChatType });
    }
    
    if (this.selectedAIAssistants.length > 0) {
      filters.push({ field: 'ai_assistants', operator: 'in', value: this.selectedAIAssistants.join(',') });
    }
    
    if (this.selectedStatus.length > 0) {
      filters.push({ field: 'status', operator: 'in', value: this.selectedStatus.join(',') });
    }
    
    if (this.selectedCSATRating.length > 0) {
      filters.push({ field: 'csat_rating', operator: 'in', value: this.selectedCSATRating.join(',') });
    }
    
    return filters;
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
    return !this.isLoadingTickets && false;
  }

  /**
   * Check if we have interaction data to display
   */
  hasInteractionData(): boolean {
    return !this.isLoadingInteractions && false;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.loadDataForActiveTab();
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
    this.generateMockChartData();
  }

  resetAllFilters(): void {
    this.selectedGroupBy = 'Day';
    this.selectedSegmentBy = 'Select';
    this.selectedChatType = 'Select';
    this.selectedAIAssistants = [];
    this.selectedChannels = [];
    this.selectedLiveAgents = [];
    this.selectedTeams = [];
    this.selectedStatus = [];
    this.selectedCSATRating = [];
    this.refreshData();
  }

  /**
   * Get status color based on status name
   */
  getStatusColor(status: string): string {
    const statusColor = this.chatStatuses.find(s => s.name === status);
    return statusColor ? statusColor.color : '#666';
  }

  /**
   * Get maximum count for bar chart scaling
   */
  getMaxCount(): number {
    if (this.chartData.length === 0) return 1;
    return Math.max(...this.chartData.map(d => d.count));
  }

  /**
   * Close all dropdowns when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-container')) {
      this.closeAllDropdowns();
    }
  }

  private closeAllDropdowns(): void {
    this.showGroupByDropdown = false;
    this.showSegmentByDropdown = false;
    this.showChatTypeDropdown = false;
    this.showAIAssistantsDropdown = false;
    this.showChannelsDropdown = false;
    this.showLiveAgentsDropdown = false;
    this.showTeamsDropdown = false;
    this.showStatusDropdown = false;
    this.showCSATRatingDropdown = false;
  }

  // ========================================
  // CALENDAR METHODS (RESTORED)
  // ========================================

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

  // =========== FIX STARTS HERE ===========
  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentMonth = parseInt(target.value, 10);
  }

  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentYear = parseInt(target.value, 10);
  }
  // =========== FIX ENDS HERE ===========

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
}