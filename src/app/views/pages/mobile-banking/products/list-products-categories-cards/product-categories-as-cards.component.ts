import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, Observable } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs'; // Explicitly import forkJoin

interface FilterItem {
  field: string;
  operator: string;
  value: string;
}

interface UserStats {
  total_chatbots: number;
  active_chatbots: number;
  inactive_chatbots: number;
  chatbots_by_language: { [key: string]: number };
  avg_intents_per_chatbot: number;
  avg_flows_per_chatbot: number;
}

interface UserActivity {
  chatbots_created: number;
  intents_created: number;
  actions_created: number;
  channels_created: number;
  activity_trend: { [key: string]: number }; // Date string to count mapping for chart
}

interface ChannelDistributionItem {
  channel_type: string;
  count: number;
  percentage: number;
}

interface UserProductivity {
  avg_time_to_first_flow_hours: number;
  chatbots_without_flows: number;
  total_chatbots_analyzed: number;
}

interface ChartDataPoint {
  date: string;
  count: number;
  label: string;
}

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss']
})
export class ProductCategoriesAsCardsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeTab: string = 'chats';

  // Date range properties - Initialized to a default range
  startDate: Date = new Date('2025-07-01');
  endDate: Date = new Date('2025-07-31');

  // Calendar properties
  showDatePicker: boolean = false;
  currentMonth: number;
  currentYear: number;
  selectedStartDate: Date | null = null; // Used for temporary selection in calendar
  selectedEndDate: Date | null = null;   // Used for temporary selection in calendar
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
  selectedAIAssistants: { id: number, name: string }[] = []; // Store selected chatbot objects
  selectedChannels: string[] = []; // Used for the "Channels" filter, not the distribution API response
  selectedLiveAgents: string[] = []; // Stores live agent IDs as strings
  selectedTeams: string[] = [];
  selectedStatus: string[] = [];
  selectedCSATRating: string[] = [];
  selectedChatbotId: number | null = null; // Used when a single chatbot is effectively selected

  // Loading states
  isLoadingChats: boolean = false;
  isLoadingTickets: boolean = false;
  isLoadingInteractions: boolean = false;
  isLoadingUserStats: boolean = false;
  isLoadingUserActivity: boolean = false;
  isLoadingAvailableChatbots: boolean = false;
  isLoadingUserProductivity: boolean = false; // New loading state
  isLoadingChannelDistribution: boolean = false; // New loading state

  // Data properties
  userStats: UserStats | null = null; // From analytics/user/stats
  userActivity: UserActivity | null = null; // From analytics/user/activity
  userProductivity: UserProductivity | null = null; // From analytics/user/productivity
  channelDistribution: ChannelDistributionItem[] | null = null; // From analytics/user/channels-distribution

  // Placeholder for general chat/conversation/performance analytics (if separate APIs are confirmed)
  // For now, these interfaces are not being directly filled from a single 'analytics/chats' API.
  // Instead, the summary cards and other metrics are built from userStats, userActivity, etc.
  // Keeping them here for future expansion if specific APIs are defined.
  chatAnalytics: any | null = null; 
  conversationMetrics: any | null = null;
  performanceMetrics: any | null = null;

  chartData: ChartDataPoint[] = [];

  // Available options for dropdowns
  availableChatbots: { id: number, name: string, is_active: boolean }[] = []; // For "AI Assistants" filter
  availableChannels: string[] = ['Web Chat', 'WhatsApp', 'Facebook', 'SMS']; // Default channels, can be updated by API if dynamic
  availableLiveAgents: any[] = [{ id: 1, name: 'Tecla Kyalo' }, { id: 2, name: 'John Doe' }, { id: 3, name: 'Jane Smith' }];
  availableTeams: string[] = ['Customer Support', 'Sales', 'Technical'];

  // Filter options (UI labels)
  groupByOptions = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
  segmentByOptions = ['Chat type', 'AI Assistants', 'Channels', 'Live Agents', 'Teams', 'Status', 'CSAT Rating'];
  chatTypeOptions = ['Livechats', 'AI assistants'];
  statusOptions = ['Open', 'Pending', 'Resolved', 'Overdue', 'Closed'];
  csatRatingOptions = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];

  // Calendar data
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  years: number[] = [];

  // Statuses for the CHATS tab summary cards (Hardcoded colors for UI)
  chatStatuses = [
    { name: 'Open', color: '#56CCF2' },
    { name: 'Pending', color: '#F2994A' },
    { name: 'Resolved', color: '#27AE60' },
    { name: 'Overdue', color: '#EB5757' },
    { name: 'Closed', color: '#828282' }
  ];

  // Statuses for the TICKETS tab summary cards (Hardcoded colors for UI)
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
    const currentYear = new Date().getFullYear();
    this.currentYear = currentYear;
    this.currentMonth = new Date().getMonth();

    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    const today = new Date();
    // Initialize current calendar view to today's month/year
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();

    // Set initial selected range to match the default display range
    this.selectedStartDate = new Date(this.startDate);
    this.selectedEndDate = new Date(this.endDate);

    this.refreshData(); // Triggers all necessary initial data loads
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Helper to generate chart data from user activity (activity_trend)
   */
  private generateChartDataFromActivity(): void {
    if (!this.userActivity?.activity_trend || Object.keys(this.userActivity.activity_trend).length === 0) {
      this.generateMockChartData(); // Fallback to mock data if API doesn't provide activity_trend or it's empty
      return;
    }

    const activityTrend = this.userActivity.activity_trend;
    this.chartData = Object.entries(activityTrend).map(([dateStr, count]) => {
      const date = new Date(dateStr);
      const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      return {
        date: dateStr,
        count: count as number,
        label: shortDate
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (this.chartData.length === 0) { // If activity_trend was present but mapped to empty chartData
      this.generateMockChartData();
    }
  }

  /**
   * Generates mock chart data, respecting the current date range.
   * Used as a fallback or for demonstration if API data is unavailable.
   */
  private generateMockChartData(): void {
    const data: ChartDataPoint[] = [];
    const startTime = this.startDate.getTime();
    const endTime = this.endDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    console.log(`Generating mock chart data from ${this.formatDate(this.startDate)} to ${this.formatDate(this.endDate)}`);

    for (let time = startTime; time <= endTime; time += dayMs) {
      const date = new Date(time);
      const dateStr = date.toISOString().split('T')[0];
      const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

      let baseCount = 150;
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Lower activity on weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseCount *= 0.6;
      }

      let finalCount = 0;
      if (Math.random() > 0.15) { // ~85% chance of activity
          const variation = (Math.random() - 0.5) * 100;
          finalCount = Math.max(0, Math.floor(baseCount + variation)); // Ensure non-negative
      }

      data.push({
        date: dateStr,
        count: finalCount,
        label: shortDate
      });
    }

    this.chartData = data;
    console.log(`Generated ${data.length} mock data points.`);
  }

  /**
   * Load user statistics (Total, Active, Inactive AI Assistants, Avg Intents/Bot)
   * API: POST api/analytics/user/stats
   */
  private loadUserStats(): void {
    this.isLoadingUserStats = true;
    const payload = {
      days: this.getDaysBetweenDates() 
    };

    console.log('Fetching user stats with payload:', payload);
    this._httpService.mobileBankingPost('analytics/user/stats', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingUserStats = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('User stats API raw response:', response);
          if (response.status === '00' && response.data) {
            this.userStats = response.data;
            console.log('User stats loaded:', this.userStats);
          } else {
            this._toastService.warning(response.message || 'Failed to load user stats', 'Warning');
            // Fallback empty stats on API error or unexpected response
            this.userStats = {
              total_chatbots: 0, active_chatbots: 0, inactive_chatbots: 0,
              chatbots_by_language: {}, avg_intents_per_chatbot: 0, avg_flows_per_chatbot: 0,
            };
          }
        },
        error: (error: any) => {
          console.error('Error loading user stats:', error);
          this._toastService.error('Failed to load user statistics', 'Error');
          // Fallback empty stats on HTTP error
          this.userStats = {
            total_chatbots: 0, active_chatbots: 0, inactive_chatbots: 0,
            chatbots_by_language: {}, avg_intents_per_chatbot: 0, avg_flows_per_chatbot: 0,
          };
        }
      });
  }

  /**
   * Load user activity data (e.g., for "AI Assistants Created Over Time" chart trend)
   * API: POST api/analytics/user/activity
   */
  private loadUserActivity(): void {
    this.isLoadingUserActivity = true;
    const userId = localStorage.getItem('user_id'); // Assuming this API might be user_id dependent

    if (!userId) {
      console.warn('User ID not found for user activity. Generating mock chart data.');
      this.isLoadingUserActivity = false;
      this.userActivity = { chatbots_created: 0, intents_created: 0, actions_created: 0, channels_created: 0, activity_trend: {} };
      this.generateMockChartData(); // Fallback to mock data
      return;
    }

    const payload = {
      user_id: parseInt(userId, 10), // User ID from local storage
      days: this.getDaysBetweenDates()
    };

    console.log('Fetching user activity with payload:', payload);
    this._httpService.mobileBankingPost('analytics/user/activity', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingUserActivity = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('User activity API raw response:', response);
          if (response.status === '00' && response.data) {
            this.userActivity = response.data;
            this.generateChartDataFromActivity(); // Generate chart data from loaded activity
          } else {
            this.userActivity = { chatbots_created: 0, intents_created: 0, actions_created: 0, channels_created: 0, activity_trend: {} };
            this.generateMockChartData(); // Fallback to mock data on API error
          }
        },
        error: (error: any) => {
          console.error('Error loading user activity:', error);
          this.userActivity = { chatbots_created: 0, intents_created: 0, actions_created: 0, channels_created: 0, activity_trend: {} };
          this.generateMockChartData(); // Fallback to mock data on HTTP error
        }
      });
  }

  /**
   * Load user productivity data (e.g., avg_time_to_first_flow_hours)
   * API: POST api/analytics/user/productivity
   */
  private loadUserProductivity(): void {
    this.isLoadingUserProductivity = true;
    const payload = {
      days: this.getDaysBetweenDates()
    };

    console.log('Fetching user productivity with payload:', payload);
    this._httpService.mobileBankingPost('analytics/user/productivity', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingUserProductivity = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('User productivity API raw response:', response);
          if (response.status === '00' && response.data) {
            this.userProductivity = response.data;
            console.log('User productivity loaded:', this.userProductivity);
          } else {
            this.userProductivity = null;
          }
        },
        error: (error: any) => {
          console.error('Error loading user productivity:', error);
          this.userProductivity = null;
        }
      });
  }

  /**
   * Load channel distribution data (e.g., for "Channels" breakdown in summary)
   * API: POST api/analytics/user/channels-distribution
   */
  private loadChannelDistribution(): void {
    this.isLoadingChannelDistribution = true;
    const payload = {
      days: this.getDaysBetweenDates()
    };

    console.log('Fetching channel distribution with payload:', payload);
    this._httpService.mobileBankingPost('analytics/user/channels-distribution', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingChannelDistribution = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Channel distribution API raw response:', response);
          if (response.status === '00' && response.data && Array.isArray(response.data.channels)) {
            this.channelDistribution = response.data.channels;
            console.log('Channel distribution loaded:', this.channelDistribution);
            // Optionally update availableChannels if they are meant to be dynamic from this API
            // this.availableChannels = this.channelDistribution.map(c => c.channel_type);
          } else {
            this.channelDistribution = null;
          }
        },
        error: (error: any) => {
          console.error('Error loading channel distribution:', error);
          this.channelDistribution = null;
        }
      });
  }

  /**
   * Load available chatbots for selection (e.g., in "AI Assistants" filter dropdown)
   * API: GET builder/chatbots/list
   */
  private loadAvailableChatbots(): void {
    this.isLoadingAvailableChatbots = true;
    const userId = localStorage.getItem('user_id');

    // Assuming builder/chatbots/list expects user_id in GET query params or Authorization handles user_id.
    this._httpService.customerPortalGet('builder/chatbots/list', userId ? { user_id: parseInt(userId, 10) } : {} )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingAvailableChatbots = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Available chatbots API raw response (from GET):', response);
          // Assuming the response is like { status: '00', data: [...] }
          if (response.status === '00' && Array.isArray(response.data)) {
            this.availableChatbots = response.data.filter((bot: any) => bot.is_active);
            console.log('Available chatbots loaded:', this.availableChatbots);
            // Auto-select first chatbot if available AND nothing is currently selected
            if (this.availableChatbots.length > 0 && this.selectedAIAssistants.length === 0 && this.selectedChatbotId === null) {
              this.selectedAIAssistants.push(this.availableChatbots[0]); // Add to multi-select list
              this.selectedChatbotId = this.availableChatbots[0].id; // Set single ID for context
              this.refreshData(); // Re-trigger data load for analytics using the newly selected chatbot
            }
          } else {
            this.availableChatbots = [];
            console.warn('API did not return expected data structure for available chatbots:', response);
          }
        },
        error: (error: any) => {
          console.error('Error loading chatbots:', error);
          this.availableChatbots = [];
        }
      });
  }

  // --- Placeholder for other Analytics APIs, keeping structure as per your previous code ---
  private loadChatAnalytics(): void {
    if (!this.selectedChatbotId && this.selectedAIAssistants.length === 0) {
      console.warn('No chatbot selected for chat analytics. Skipping load.');
      this.chatAnalytics = null;
      return;
    }

    this.isLoadingChats = true;
    const payload = {
      chatbot_id: this.selectedChatbotId,
      chatbot_ids: this.selectedAIAssistants.length > 0 ? this.selectedAIAssistants.map(bot => bot.id) : undefined,
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: this.selectedGroupBy.toLowerCase(),
      filters: this.buildFilters()
    };
    const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

    console.log('Fetching chat analytics with payload:', filteredPayload);
    this._httpService.mobileBankingPost('analytics/chats', filteredPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingChats = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Chat analytics API raw response:', response);
          if (response.status === '00' && response.data) {
            this.chatAnalytics = response.data;
          } else {
            this.chatAnalytics = null;
            this._toastService.warning(response.message || 'Failed to load chat analytics', 'Warning');
          }
          this.loadConversationMetrics();
          this.loadPerformanceMetrics();
        },
        error: (error: any) => {
          console.error('Error loading chat analytics:', error);
          this.chatAnalytics = null;
          this._toastService.error('Failed to load chat analytics', 'Error');
          this.loadConversationMetrics();
          this.loadPerformanceMetrics();
        }
      });
  }

  private loadConversationMetrics(): void {
    if (!this.selectedChatbotId && this.selectedAIAssistants.length === 0) {
        console.warn('No chatbot selected for conversation metrics. Skipping load.');
        this.conversationMetrics = null;
        return;
    }

    const payload = {
        chatbot_id: this.selectedChatbotId,
        chatbot_ids: this.selectedAIAssistants.length > 0 ? this.selectedAIAssistants.map(bot => bot.id) : undefined,
        start_date: this.formatDateForAPI(this.startDate),
        end_date: this.formatDateForAPI(this.endDate),
        group_by: this.selectedGroupBy.toLowerCase(),
        segmented_by: this.selectedSegmentBy.toLowerCase() !== 'select' ? this.selectedSegmentBy.toLowerCase() : undefined,
        filters: this.buildFilters(),
        days: this.getDaysBetweenDates()
    };
    const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

    console.log('Fetching general conversation metrics with payload:', filteredPayload);
    this._httpService.mobileBankingPost('analytics/conversations', filteredPayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (response: any) => {
                console.log('General Conversation metrics API raw response:', response);
                if (response.status === '00' && response.data) {
                    this.conversationMetrics = response.data;
                } else {
                    this.conversationMetrics = null;
                }
            },
            error: (error: any) => {
                console.error('Error loading general conversation metrics:', error);
                this.conversationMetrics = null;
            }
        });
  }

  private loadPerformanceMetrics(): void {
    if (!this.selectedChatbotId && this.selectedAIAssistants.length === 0) {
      console.warn('No chatbot selected for performance metrics. Skipping load.');
      this.performanceMetrics = null;
      return;
    }

    const payload = {
      chatbot_id: this.selectedChatbotId,
      chatbot_ids: this.selectedAIAssistants.length > 0 ? this.selectedAIAssistants.map(bot => bot.id) : undefined,
      start_date: this.formatDateForAPI(this.startDate),
      end_date: this.formatDateForAPI(this.endDate),
      group_by: this.selectedGroupBy.toLowerCase(),
      segmented_by: this.selectedSegmentBy.toLowerCase() !== 'select' ? this.selectedSegmentBy.toLowerCase() : undefined,
      filters: this.buildFilters(),
      days: this.getDaysBetweenDates()
    };
    const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

    console.log('Fetching performance metrics with payload:', filteredPayload);
    this._httpService.mobileBankingPost('analytics/performance', filteredPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Performance metrics API raw response:', response);
          if (response.status === '00' && response.data) {
            this.performanceMetrics = response.data;
          } else {
            this.performanceMetrics = null;
          }
        },
        error: (error: any) => {
          console.error('Error loading performance metrics:', error);
          this.performanceMetrics = null;
        }
      });
  }

  private loadTicketAnalytics(): void {
    this.isLoadingTickets = true;
    setTimeout(() => {
      this.isLoadingTickets = false;
      console.log('Tickets API not yet implemented');
    }, 1000);
    this.chatAnalytics = null;
    this.conversationMetrics = null;
    this.performanceMetrics = null;
    this.channelDistribution = null;
    this.userProductivity = null;
  }

  private loadInteractionAnalytics(): void {
    this.isLoadingInteractions = true;
    setTimeout(() => {
      this.isLoadingInteractions = false;
      console.log('Interactions API not yet implemented');
    }, 1000);
    this.chatAnalytics = null;
    this.conversationMetrics = null;
    this.performanceMetrics = null;
    this.channelDistribution = null;
    this.userProductivity = null;
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

  toggleAIAssistantSelection(bot: { id: number, name: string, is_active: boolean }): void {
    const index = this.selectedAIAssistants.findIndex(selectedBot => selectedBot.id === bot.id);
    if (index > -1) {
      this.selectedAIAssistants.splice(index, 1);
    } else {
      this.selectedAIAssistants.push(bot);
    }

    if (this.selectedAIAssistants.length === 1) {
      this.selectedChatbotId = this.selectedAIAssistants[0].id;
    } else if (this.selectedAIAssistants.length === 0) {
      this.selectedChatbotId = null;
    } else {
      this.selectedChatbotId = null; // If multiple bots are selected, clear single ID
    }

    this.refreshData();
  }

  toggleChannelsSelection(channel: string): void {
    const index = this.selectedChannels.indexOf(channel);
    if (index > -1) {
      this.selectedChannels.splice(index, 1);
    } else {
      this.selectedChannels.push(channel);
    }
    this.refreshData();
  }

  toggleLiveAgentSelection(agent: any): void {
    const agentIdStr = agent.id.toString();
    const index = this.selectedLiveAgents.indexOf(agentIdStr);
    if (index > -1) {
      this.selectedLiveAgents.splice(index, 1);
    } else {
      this.selectedLiveAgents.push(agentIdStr);
    }
    this.refreshData();
  }

  toggleTeamsSelection(team: string): void {
    const index = this.selectedTeams.indexOf(team);
    if (index > -1) {
      this.selectedTeams.splice(index, 1);
    } else {
      this.selectedTeams.push(team);
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

  // Helper methods for UI display
  isAIAssistantSelected(bot: { id: number, name: string }): boolean {
    return this.selectedAIAssistants.some(selectedBot => selectedBot.id === bot.id);
  }

  isChannelSelected(channel: string): boolean {
    return this.selectedChannels.includes(channel);
  }

  isLiveAgentSelected(agent: any): boolean {
    return this.selectedLiveAgents.includes(agent.id.toString());
  }

  isTeamSelected(team: string): boolean {
    return this.selectedTeams.includes(team);
  }

  isStatusSelected(status: string): boolean {
    return this.selectedStatus.includes(status);
  }

  isCSATRatingSelected(rating: string): boolean {
    return this.selectedCSATRating.includes(rating);
  }

  getSelectedAIAssistantsDisplay(): string {
    if (this.selectedAIAssistants.length === 0) return 'Select';
    if (this.selectedAIAssistants.length === 1) return this.selectedAIAssistants[0].name;
    return `${this.selectedAIAssistants.length} selected`;
  }

  getSelectedChannelsDisplay(): string {
    if (this.selectedChannels.length === 0) return 'Select';
    if (this.selectedChannels.length === 1) return this.selectedChannels[0];
    return `${this.selectedChannels.length} selected`;
  }

  getSelectedLiveAgentsDisplay(): string {
    if (this.selectedLiveAgents.length === 0) return 'Select';
    if (this.selectedLiveAgents.length === 1) {
      const agent = this.availableLiveAgents.find(a => a.id.toString() === this.selectedLiveAgents[0]);
      return agent ? agent.name : 'Select';
    }
    return `${this.selectedLiveAgents.length} selected`;
  }

  getSelectedTeamsDisplay(): string {
    if (this.selectedTeams.length === 0) return 'Select';
    if (this.selectedTeams.length === 1) return this.selectedTeams[0];
    return `${this.selectedTeams.length} selected`;
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
   * Helper method to build filters array for API payloads
   */
  private buildFilters(): FilterItem[] {
    const filters: FilterItem[] = [];

    if (this.selectedChatType !== 'Select') {
      filters.push({ field: 'chat_type', operator: 'eq', value: this.selectedChatType });
    }

    if (this.selectedAIAssistants.length > 0) {
      filters.push({ field: 'ai_assistant_ids', operator: 'in', value: this.selectedAIAssistants.map(bot => bot.id).join(',') });
    }

    if (this.selectedChannels.length > 0) {
      filters.push({ field: 'channels', operator: 'in', value: this.selectedChannels.join(',') });
    }

    if (this.selectedLiveAgents.length > 0) {
      filters.push({ field: 'live_agent_ids', operator: 'in', value: this.selectedLiveAgents.join(',') });
    }

    if (this.selectedTeams.length > 0) {
      filters.push({ field: 'teams', operator: 'in', value: this.selectedTeams.join(',') });
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
   * Helper method to format date for API (YYYY-MM-DD)
   */
  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper method to calculate number of days between dates
   */
  private getDaysBetweenDates(): number {
    const start = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
    const end = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    return days >= 0 ? days + 1 : 1;
  }

  /**
   * Loads all relevant data for the currently active tab.
   */
  private loadDataForActiveTab(): void {
    console.log(`Loading data for active tab: ${this.activeTab}`);
    // Clear previous data for other tabs or specific metrics
    this.chatAnalytics = null;
    this.conversationMetrics = null;
    this.performanceMetrics = null;

    switch (this.activeTab) {
      case 'chats':
        this.loadChatAnalytics();
        this.loadConversationMetrics();
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
    return this.conversationMetrics?.total_sessions?.toString() || '0';
  }

  /**
   * Get completed sessions for display
   */
  getCompletedSessions(): string {
    return this.conversationMetrics?.completed_sessions?.toString() || '0';
  }

  /**
   * Get average duration for display
   */
  getAverageDurationDisplay(): string {
    if (this.conversationMetrics?.avg_duration !== undefined && this.conversationMetrics.avg_duration !== null) {
      const durationSeconds = this.conversationMetrics.avg_duration;
      if (durationSeconds < 60) {
        return `${durationSeconds.toFixed(0)}s`;
      } else {
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return `${minutes}m ${seconds.toFixed(0)}s`;
      }
    }
    return '-';
  }

  /**
   * Get average response time for display (for Live Agent)
   */
  getAverageResponseTimeDisplay(): string {
    if (this.performanceMetrics?.avg_response_time !== undefined && this.performanceMetrics.avg_response_time !== null) {
      const timeMs = this.performanceMetrics.avg_response_time;
      if (timeMs < 1000) {
        return `${timeMs.toFixed(0)}ms`;
      } else {
        return `${(timeMs / 1000).toFixed(1)}s`;
      }
    }
    return '-';
  }

  /**
   * Get system uptime for display
   */
  getSystemUptimeDisplay(): string {
    if (this.performanceMetrics?.uptime !== undefined && this.performanceMetrics.uptime !== null) {
      return `${this.performanceMetrics.uptime.toFixed(1)}%`;
    }
    return '-';
  }

  /**
   * Get intents triggered count
   */
  getIntentsTriggeredDisplay(): string {
    return this.performanceMetrics?.intents_triggered?.toString() || '0';
  }

  /**
   * Get average AI assistant response time for display (using PerformanceMetrics avg_response_time)
   */
  getAverageAIAssistantResponseTimeDisplay(): string {
    return this.getAverageResponseTimeDisplay(); // Re-uses the general avg_response_time
  }

  /**
   * Check if we have any data (real or mock) to display in the chats tab's main area.
   */
  hasChatData(): boolean {
    const hasChartData = this.chartData.length > 0 && this.chartData.some(d => d.count > 0);
    const hasConversationMetrics = this.conversationMetrics && this.conversationMetrics.total_sessions !== undefined && this.conversationMetrics.total_sessions > 0;
    const hasPerformanceMetrics = this.performanceMetrics && this.performanceMetrics.avg_response_time !== undefined && this.performanceMetrics.avg_response_time > 0;
    const hasUserActivity = this.userActivity && Object.keys(this.userActivity.activity_trend).length > 0;

    return !this.isLoadingChats && !this.isLoadingUserActivity && (
      hasChartData ||
      hasConversationMetrics ||
      hasPerformanceMetrics ||
      hasUserActivity
    );
  }

  hasTicketData(): boolean {
    return !this.isLoadingTickets && false;
  }

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
    return `${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
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
        return 'Date,Total Sessions,Completed Sessions,Avg Duration,Avg Messages,Avg Response Time,System Uptime,Chatbots Created';
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

    if (this.activeTab === 'chats' && this.chartData.length > 0) {
      this.chartData.forEach(dataPoint => {
        const totalSessions = this.conversationMetrics?.total_sessions || 0;
        const completedSessions = this.conversationMetrics?.completed_sessions || 0;
        const avgDuration = this.conversationMetrics?.avg_duration || 0;
        const avgMessages = this.conversationMetrics?.avg_messages || 0;
        const avgResponseTime = this.performanceMetrics?.avg_response_time || 0;
        const uptime = this.performanceMetrics?.uptime || 0;

        rows.push(`${dataPoint.label},${totalSessions},${completedSessions},${avgDuration.toFixed(2)},${avgMessages.toFixed(2)},${avgResponseTime.toFixed(2)},${uptime.toFixed(1)}%,${dataPoint.count}`);
      });
    } else {
      const startTime = this.startDate.getTime();
      const endTime = this.endDate.getTime();
      const dayMs = 24 * 60 * 60 * 1000;

      for (let time = startTime; time <= endTime; time += dayMs) {
        const date = new Date(time);
        const dateStr = date.toISOString().split('T')[0];

        switch (this.activeTab) {
          case 'chats':
            rows.push(`${dateStr},0,0,0,0,0,0%,0`);
            break;
          case 'tickets':
            rows.push(`${dateStr},0,0,0,0,0,0 min`);
            break;
          case 'interactions':
            rows.push(`${dateStr},0,0,0,0`);
            break;
        }
      }
    }

    return rows;
  }

  private refreshData(): void {
    console.log(`Refreshing all analytics data for range: ${this.getDateRangeDisplay()}. Active Tab: ${this.activeTab}`);
    this.loadUserStats();          // Top cards
    this.loadUserActivity();       // Chart data
    this.loadUserProductivity();   // Productivity metrics
    this.loadChannelDistribution(); // Channel distribution
    this.loadAvailableChatbots();  // Ensure chatbots list is fresh for filters
    this.loadDataForActiveTab();   // Tab-specific data (chat analytics, conversation metrics, performance metrics)
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
    // Reset to first available chatbot or null
    this.selectedChatbotId = this.availableChatbots.length > 0 ? this.availableChatbots[0].id : null;
    this.refreshData();
  }

  /**
   * Get status color based on status name (for Chat and Ticket Statuses)
   */
  getStatusColor(status: string): string {
    let statusColor = this.chatStatuses.find(s => s.name === status);
    if (!statusColor) { // Fallback for ticket statuses or unknown
      statusColor = this.ticketStatuses.find(s => s.name === status);
    }
    return statusColor ? statusColor.color : '#666';
  }

  /**
   * Get maximum count for bar chart scaling
   */
  getMaxCount(): number {
    if (this.chartData.length === 0) return 100;
    const max = Math.max(...this.chartData.map(d => d.count));
    return Math.max(max, 10);
  }

  /**
   * Get bar height percentage for proper scaling
   */
  getBarHeightPercentage(count: number): number {
    if (count === 0) return 0;
    const maxCount = this.getMaxCount();
    const minHeight = 5;
    const percentage = (count / maxCount) * 95;
    return Math.max(percentage, minHeight);
  }

  /**
   * Get Y-axis labels for the chart
   */
  getYAxisLabels(): number[] {
    const maxCount = this.getMaxCount();
    const labels: number[] = [];
    const steps = 5;

    for (let i = steps; i >= 0; i--) {
      const value = Math.round((maxCount * i) / steps);
      labels.push(value);
    }

    return labels;
  }

  /**
   * Check if a bar should be visible (has non-zero value)
   */
  isBarVisible(count: number): boolean {
    return count > 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-container') && !target.closest('.date-range-container')) {
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
    this.showDatePicker = false;
  }

  // ========================================
  // CUSTOM CALENDAR METHODS
  // ========================================

  toggleDatePicker(): void {
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      this.selectedStartDate = new Date(this.startDate);
      this.selectedEndDate = new Date(this.endDate);

      this.currentYear = this.startDate.getFullYear();
      this.currentMonth = this.startDate.getMonth();
      this.isSelectingRange = false;
    } else {
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
    selectedDate.setHours(0, 0, 0, 0);

    if (!this.isSelectingRange || !this.selectedStartDate) {
      this.selectedStartDate = selectedDate;
      this.selectedEndDate = null;
      this.isSelectingRange = true;
    } else {
      if (selectedDate.getTime() < this.selectedStartDate.getTime()) {
        this.selectedEndDate = this.selectedStartDate;
        this.selectedStartDate = selectedDate;
      } else if (selectedDate.getTime() === this.selectedStartDate.getTime()) {
        this.selectedEndDate = selectedDate;
      } else {
        this.selectedEndDate = selectedDate;
      }
      this.isSelectingRange = false;
    }
  }

  isDaySelected(day: number | null): boolean {
    if (day === null) return false;

    const date = new Date(this.currentYear, this.currentMonth, day);
    date.setHours(0, 0, 0, 0);

    return !!(this.selectedStartDate && this.selectedStartDate.getTime() === date.getTime()) ||
           !!(this.selectedEndDate && this.selectedEndDate.getTime() === date.getTime());
  }

  isDayInRange(day: number | null): boolean {
    if (day === null || !this.selectedStartDate || !this.selectedEndDate) return false;

    const date = new Date(this.currentYear, this.currentMonth, day);
    date.setHours(0, 0, 0, 0);

    const normalizedStart = new Date(Math.min(this.selectedStartDate.getTime(), this.selectedEndDate.getTime()));
    const normalizedEnd = new Date(Math.max(this.selectedStartDate.getTime(), this.selectedEndDate.getTime()));
    normalizedStart.setHours(0, 0, 0, 0);
    normalizedEnd.setHours(0, 0, 0, 0);

    return date.getTime() > normalizedStart.getTime() && date.getTime() < normalizedEnd.getTime();
  }

  isDayRangeStart(day: number | null): boolean {
    if (day === null || !this.selectedStartDate) return false;
    const date = new Date(this.currentYear, this.currentMonth, day);
    date.setHours(0, 0, 0, 0);
    return this.selectedStartDate.getTime() === date.getTime();
  }

  isDayRangeEnd(day: number | null): boolean {
    if (day === null || !this.selectedEndDate) return false;
    const date = new Date(this.currentYear, this.currentMonth, day);
    date.setHours(0, 0, 0, 0);
    return this.selectedEndDate.getTime() === date.getTime();
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

  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentMonth = parseInt(target.value, 10);
  }

  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentYear = parseInt(target.value, 10);
  }

  /**
   * Apply selected date range and refresh all data.
   */
  applyDateRange(): void {
    if (this.selectedStartDate && this.selectedEndDate) {
      if (this.selectedStartDate.getTime() > this.selectedEndDate.getTime()) {
        [this.selectedStartDate, this.selectedEndDate] = [this.selectedEndDate, this.selectedStartDate];
      }
      this.startDate = new Date(this.selectedStartDate);
      this.endDate = new Date(this.selectedEndDate);
      this.showDatePicker = false;
      console.log('Applied new date range:', this.getDateRangeDisplay());
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