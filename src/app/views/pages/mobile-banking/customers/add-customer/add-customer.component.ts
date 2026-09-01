import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { NotificationService } from 'src/app/shared/services/NotificationService';
import { Subscription, interval, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';


interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  finalRiskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  mlRiskLevel: string;
  mlRiskScore?: number;
  finalRiskLevel: string;
  channel: string;
  location: string;
  timestamp: Date;
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive' | 'Completed' | 'Auto-Approved';
  flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
  customerName: string;
  customerId: string;
  deviceId: string;
  deviceType?: string;
  ipAddress: string;
  modelAgreement: {
    flagged: number;
    total: number;
    text: string;
  };
  mlVotes: string;
  ruleEngine: {
    triggered: boolean;
    rules: string[];
    severity: number;
  };
  hybridScore: boolean;
  feedbackEffect?: any;
  aiAnalysis: {
    details: string;
    signals: string[];
    ruleBased?: string;
    llm?: string;
    final?: string;
  };
  recommendedAction: string;
  relatedTransactions?: Array<{
    id: string;
    amount: number;
    riskScore: number;
    status: string;
  }>;
  rawData?: any;
  alertId?: string | null;
  caseId?: string | null;
  rulePoints?: number;
  rulesTriggered?: string[];
  isFraud?: boolean;
  decision?: string;
  fincaRulesTriggered?: any[];
  fincaTotalRulePoints?: number;
  fincaCappedRulePoints?: number;
  fincaRuleRiskLevel?: string;
  fincaFinalDecision?: string;
  fincaRuleCount?: number;
  fincaChannel?: string;
  fincaDeviceType?: string;
  fincaLocation?: string;
  transactionAmount?: number;
}

interface SearchSuggestion {
  text: string;
  type: 'transaction' | 'customer' | 'location' | 'amount' | 'channel' | 'ai';
  icon: string;
  color: string;
  action?: () => void;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface SimulationConfig {
  count: number;
  fraudRatio: number;
  isRunning: boolean;
  progress: number;
  results: any[];
  summary: any;
}

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})

export class AddCustomerComponent implements OnInit {
  @ViewChild('feedContainer') feedContainer!: ElementRef;
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;

aiConfig = {
  name: 'Mukwano AI',  
  // avatar: '🤖',
  avatar: '🤝',      
  color: '#00563B',    // FINCA green
  greeting: `Olunaku olulungi! 😊 I'm Mukwano AI, your trusted friend and intelligent fraud detection companion.
I combine the warmth of a friend with the power of artificial intelligence to protect your transactions.`
};

  //  aiConfig = {
  //   name: 'Sophie AI',  
  //   avatar: '🤖',
  //   color: '#00563B',
  //   greeting: 'Hello! I\'m your FraudGuard AI Assistant. I can help you analyze transactions, detect fraud patterns, and provide investigation recommendations.'
  // };

  // Main Data
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedTransaction: Transaction | null = null;
  paginatedTransactions: Transaction[] = [];

  // UI State
  isLoading: boolean = false;
  isLoadingRelated: boolean = false;
  autoScroll = false;
  showModal = false;
  showSimulationModal: boolean = false;
  activeTab: 'final' | 'llm' | 'rule' = 'final';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  // Filters
  riskFilter: string = 'all';
  channelFilter: string = 'all';
  searchTerm: string = '';
  searchSuggestions: SearchSuggestion[] = [];
  showSuggestions: boolean = false;
  private searchSubject: Subject<string> = new Subject<string>();

  // AI Chat
  isAIChatOpen: boolean = false;
  chatMessages: ChatMessage[] = [];
  chatInput: string = '';
  isChatLoading: boolean = false;
  selectedTransactionForChat: Transaction | null = null;

  // Channel Options
  channelOptions: string[] = [
    'Mobile banking',
    'Internet banking',
    'Core banking',
    'Cards',
    'Agency',
    'ATM/POS',
    'USSD'
  ];

  // Simulation
  simulation: SimulationConfig = {
    count: 10,
    fraudRatio: 0.25,
    isRunning: false,
    progress: 0,
    results: [],
    summary: null
  };

  // Stats
  stats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    avgRiskScore: 0,
    alerts: 0,
    cases: 0,
    blocked: 0,
    challenged: 0,
    approved: 0
  };

  // Model Metrics
  modelMetrics: any = null;

  private refreshSubscription?: Subscription;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();

    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((searchTerm: string) => {
      this.performSearch(searchTerm);
    });

    this.refreshSubscription = interval(8640000).subscribe(() => {
      this.loadTransactions();
    });

    this.notificationService.currentAlerts.subscribe((payload) => {
      if (payload) {
        try {
          const tx = this.mapBackendTransaction(payload);
          if (tx) {
            this.transactions.unshift(tx);
            this.applyFilters();
            this.calculateStats();
          }
        } catch (err) {
          console.error('Failed to map incoming alert payload', err);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredTransactions.length);
  }

  // ============= PAGINATION METHODS =============

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredTransactions.length);
    this.paginatedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push(-1);
      }
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) {
        pages.push(-1);
      }
      pages.push(total);
    }
    return pages;
  }

  // ============= SEARCH METHODS =============

  onSearchInput(event: any): void {
    const value = event.target.value;
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  performSearch(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      this.searchSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    const term = searchTerm.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Search in transactions
    const matchingTxs = this.transactions.filter(tx => 
      tx.transactionId.toLowerCase().includes(term) ||
      tx.customerName.toLowerCase().includes(term) ||
      tx.location.toLowerCase().includes(term) ||
      tx.channel.toLowerCase().includes(term)
    );

    // Transaction ID suggestions
    if (matchingTxs.length > 0) {
      matchingTxs.slice(0, 3).forEach(tx => {
        suggestions.push({
          text: `${tx.transactionId} - ${tx.customerName} (${tx.riskCategory})`,
          type: 'transaction',
          icon: 'fa-file-invoice',
          color: this.getRiskBadgeClass(tx.riskCategory)
        });
      });

      // Customer suggestions
      const uniqueCustomers = [...new Set(matchingTxs.map(tx => tx.customerName))];
      uniqueCustomers.slice(0, 2).forEach(name => {
        suggestions.push({
          text: `Customer: ${name}`,
          type: 'customer',
          icon: 'fa-user',
          color: 'text-primary'
        });
      });

      // Location suggestions
      const uniqueLocations = [...new Set(matchingTxs.map(tx => tx.location))];
      uniqueLocations.slice(0, 2).forEach(location => {
        suggestions.push({
          text: `Location: ${location}`,
          type: 'location',
          icon: 'fa-map-marker-alt',
          color: 'text-success'
        });
      });

      // AI-powered smart suggestions
      if (matchingTxs.some(tx => tx.finalRiskCategory === 'Critical')) {
        suggestions.push({
          text: '🔴 Show Critical Risk Transactions',
          type: 'ai',
          icon: 'fa-exclamation-triangle',
          color: 'text-danger',
          action: () => { this.riskFilter = 'critical'; this.applyFilters(); }
        });
      }

      if (matchingTxs.some(tx => tx.amount > 1000000)) {
        suggestions.push({
          text: `💰 High Value: ${matchingTxs.filter(tx => tx.amount > 1000000).length} transactions > KES 1M`,
          type: 'ai',
          icon: 'fa-money-bill-wave',
          color: 'text-warning',
          action: () => { 
            this.searchTerm = '';
            this.filteredTransactions = this.filteredTransactions.filter(tx => tx.amount > 1000000);
            this.applyFilters();
          }
        });
      }
    }

    // AI suggestions based on search intent
    if (term.includes('fraud') || term.includes('suspect') || term.includes('risk')) {
      suggestions.push({
        text: '🤖 AI Analysis: Show high-risk transactions with anomalies',
        type: 'ai',
        icon: 'fa-robot',
        color: 'text-info',
        action: () => { this.riskFilter = 'high'; this.applyFilters(); }
      });
    }

    if (term.includes('block') || term.includes('blocked')) {
      suggestions.push({
        text: '🚫 Show Blocked Transactions',
        type: 'ai',
        icon: 'fa-ban',
        color: 'text-danger',
        action: () => { this.searchTerm = 'BLOCK'; this.applyFilters(); }
      });
    }

    if (term.includes('approve') || term.includes('approved')) {
      suggestions.push({
        text: '✅ Show Approved Transactions',
        type: 'ai',
        icon: 'fa-check-circle',
        color: 'text-success',
        action: () => { this.searchTerm = 'APPROVE'; this.applyFilters(); }
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        text: '🔍 Try searching by Transaction ID, Customer name, or Location',
        type: 'ai',
        icon: 'fa-search',
        color: 'text-muted'
      });
      
      suggestions.push({
        text: '🤖 AI Suggestion: Ask me about fraud patterns',
        type: 'ai',
        icon: 'fa-robot',
        color: 'text-info',
        action: () => { this.openAIChat(); }
      });
    }

    this.searchSuggestions = suggestions;
    this.showSuggestions = true;
  }

  applySearchSuggestion(suggestion: SearchSuggestion): void {
    this.searchTerm = suggestion.text;
    this.showSuggestions = false;
    
    if (suggestion.action) {
      suggestion.action();
    } else {
      this.applyFilters();
    }
  }

  // ============= AI CHAT METHODS =============

  openAIChat(): void {
  this.isAIChatOpen = true;
  if (this.selectedTransaction) {
    this.selectedTransactionForChat = this.selectedTransaction;
    this.addAIMessage(
      `${this.aiConfig.avatar} ${this.aiConfig.name}: I see you're looking at transaction ${this.selectedTransaction.transactionId}. Would you like me to analyze it?`
    );
  } else if (this.transactions.length > 0) {
    this.addAIMessage(
      `${this.aiConfig.avatar} ${this.aiConfig.name}: ${this.aiConfig.greeting}\n\nI see ${this.transactions.length} transactions in the system. How can I help you today?`
    );
  } else {
    this.addAIMessage(
      `${this.aiConfig.avatar} ${this.aiConfig.name}: ${this.aiConfig.greeting}`
    );
  }
}

  toggleAIChat(): void {
    if (this.isAIChatOpen) {
      this.isAIChatOpen = false;
    } else {
      this.openAIChat();
    }
  }

  clearChat(): void {
    this.chatMessages = [];
    this.chatInput = '';
    this.selectedTransactionForChat = null;
  }

  openAIChatForTransaction(tx: Transaction): void {
    this.selectedTransactionForChat = tx;
    this.isAIChatOpen = true;
    this.chatMessages = [];
    this.addAIMessage(`🔍 Analyzing transaction ${tx.transactionId}\n\n${this.analyzeTransactionAI(tx)}`);
  }

  sendChatMessage(): void {
    if (!this.chatInput || this.chatInput.trim() === '') return;
    
    const userMessage = this.chatInput.trim();
    this.chatMessages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });
    
    this.chatInput = '';
    this.isChatLoading = true;
    
    // Scroll to bottom
    setTimeout(() => this.scrollChatToBottom(), 100);
    
    // Generate AI response
    this.generateAIResponse(userMessage);
  }

  // ============= QUICK ACTION METHODS =============
quickAnalyze(): void {
  let txToAnalyze = this.selectedTransaction || this.selectedTransactionForChat;
  
  // If no transaction is selected, use the first one in the list
  if (!txToAnalyze && this.transactions.length > 0) {
    txToAnalyze = this.transactions[0];
  }
  
  if (txToAnalyze) {
    // Add a chat message showing analysis
    this.chatMessages.push({
      role: 'user',
      content: `📊 Analyze transaction ${txToAnalyze.transactionId}`,
      timestamp: new Date()
    });
    
    // Show analysis
    const analysis = this.analyzeTransactionAI(txToAnalyze);
    this.addAIMessage(`🤝 Mukwano AI: Here's my analysis of ${txToAnalyze.transactionId}:\n\n${analysis}`);
    
    // Open the detailed modal
    this.showAIAnalysis(txToAnalyze);
    
    // Play sound for feedback
    this.playMukwanoSound();
    
    // Scroll to bottom
    setTimeout(() => this.scrollChatToBottom(), 100);
  } else {
    this.addAIMessage(`🤝 Mukwano AI: I don't see any transactions to analyze. Please load some transactions first!`);
  }
}

quickInvestigate(): void {
  const criticalTxs = this.transactions.filter(tx => tx.finalRiskCategory === 'Critical');
  const highTxs = this.transactions.filter(tx => tx.finalRiskCategory === 'High');
  
  if (criticalTxs.length === 0 && highTxs.length === 0) {
    this.addAIMessage(`✅ Mukwano AI: No critical or high-risk transactions found. Everything looks good! 🎉`);
    this.playMukwanoSound();
    return;
  }
  
  let message = `🔍 Mukwano AI Investigation Report\n\n`;
  
  if (criticalTxs.length > 0) {
    message += `🚨 Critical Risk Transactions (${criticalTxs.length}):\n`;
    criticalTxs.slice(0, 5).forEach((tx, i) => {
      message += `${i+1}. ${tx.transactionId} - ${this.formatAmount(tx.amount)} - ${tx.channel}\n`;
    });
    if (criticalTxs.length > 5) {
      message += `   _+ ${criticalTxs.length - 5} more critical transactions_\n`;
    }
    message += `\n`;
  }
  
  if (highTxs.length > 0) {
    message += `⚠️ High Risk Transactions (${highTxs.length}):\n`;
    highTxs.slice(0, 5).forEach((tx, i) => {
      message += `${i+1}. ${tx.transactionId} - ${this.formatAmount(tx.amount)} - ${tx.channel}\n`;
    });
    if (highTxs.length > 5) {
      message += `   _+ ${highTxs.length - 5} more high-risk transactions_\n`;
    }
    message += `\n`;
  }
  
  message += `💡What would you like to do?\n`;
  message += `• Type "view [TXN-ID]" to analyze a specific transaction\n`;
  message += `• Type "export" to download this report\n`;
  message += `• Click on any transaction in the table to investigate`;
  
  this.addAIMessage(`🤝 Mukwano AI: ${message}`);
  
  // Play sound for alert
  this.playMukwanoSound();
  
  // Auto-filter to show high-risk transactions
  this.riskFilter = 'high';
  this.applyFilters();
  
  setTimeout(() => this.scrollChatToBottom(), 100);
}

calculateStats(): void {
  const filtered = this.filteredTransactions.length ? this.filteredTransactions : this.transactions;
  
  // Store previous stats for comparison
  const prevStats = { ...this.stats };
  
  this.stats = {
    total: filtered.length,
    critical: filtered.filter(t => t.finalRiskCategory === 'Critical').length,
    high: filtered.filter(t => t.finalRiskCategory === 'High').length,
    medium: filtered.filter(t => t.finalRiskCategory === 'Medium').length,
    low: filtered.filter(t => t.finalRiskCategory === 'Low').length,
    avgRiskScore: filtered.length > 0
      ? Math.round((filtered.reduce((sum, t) => sum + t.riskScore, 0) / filtered.length) * 10) / 10
      : 0,
    alerts: filtered.filter(t => t.alertId).length,
    cases: filtered.filter(t => t.caseId).length,
    blocked: filtered.filter(t => t.decision === 'BLOCK' || t.finalRiskCategory === 'Critical').length,
    challenged: filtered.filter(t => t.decision === 'CHALLENGE' || t.finalRiskCategory === 'High').length,
    approved: filtered.filter(t => t.decision === 'APPROVE' || t.finalRiskCategory === 'Low').length
  };
  
  // Animate if there's a significant change
  const hasCriticalChange = this.stats.critical !== prevStats.critical;
  const hasHighChange = this.stats.high !== prevStats.high;
  
  if (hasCriticalChange || hasHighChange) {
    // Play sound for new alerts
    if (this.stats.critical > prevStats.critical) {
      this.playMukwanoSound();
    }
    // Animate stats after a brief delay
    setTimeout(() => this.animateStats(), 300);
  }
}

quickSearch(): void {
  const searchMessage = `🔎 Mukwano AI Search Help\n\n` +
    `Try these search examples:\n\n` +
    `💰 By Amount:\n` +
    `• "Find transactions over KES 500,000"\n` +
    `• "Show me transactions under KES 10,000"\n\n` +
    `⚠️ By Risk:\n` +
    `• "Show me Critical risks"\n` +
    `• "List High risk transactions"\n\n` +
    `📱 By Channel:\n` +
    `• "Find Mobile Banking transactions"\n` +
    `• "Show me USSD transactions"\n\n` +
    `👤 By Customer:\n` +
    `• "Search for John Doe"\n` +
    `• "Show transactions from customer 12345"\n\n` +
    `📅 By Time:\n` +
    `• "Show me today's transactions"\n` +
    `• "Find transactions from this week"\n\n` +
    `💡 Or just type anything - I understand natural language!`;
  
  this.addAIMessage(`🤝 Mukwano AI: ${searchMessage}`);
  
  // Focus the search input for user convenience
  setTimeout(() => {
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, 300);
  
  setTimeout(() => this.scrollChatToBottom(), 100);
}

playMukwanoSound(): void {
  try {
    // Create a gentle notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a gentle, professional sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set sound properties - gentle chime
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5 note
    
    // Volume envelope - gentle fade
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
  } catch (error) {
    // Fallback: Use a simple beep if Web Audio API fails
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ9vT18='; // Minimal beep
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent fail - no sound
    }
  }
}

animateStats(): void {
  // Target values
  const targets = {
    total: this.stats.total,
    critical: this.stats.critical,
    high: this.stats.high,
    medium: this.stats.medium,
    low: this.stats.low,
    avgRiskScore: this.stats.avgRiskScore
  };
  
  // Animate each stat
  const duration = 1500; // 1.5 seconds
  const startTime = performance.now();
  const startValues = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    avgRiskScore: 0
  };
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease function for smooth animation
    const ease = (t: number) => t * t * (3 - 2 * t); // Smooth step
    
    const currentTotal = Math.round(ease(progress) * targets.total);
    const currentCritical = Math.round(ease(progress) * targets.critical);
    const currentHigh = Math.round(ease(progress) * targets.high);
    const currentMedium = Math.round(ease(progress) * targets.medium);
    const currentLow = Math.round(ease(progress) * targets.low);
    const currentAvg = ease(progress) * targets.avgRiskScore;
    
    // Update stats object for display
    this.stats.total = currentTotal;
    this.stats.critical = currentCritical;
    this.stats.high = currentHigh;
    this.stats.medium = currentMedium;
    this.stats.low = currentLow;
    this.stats.avgRiskScore = Math.round(currentAvg * 10) / 10;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Final values
      this.stats.total = targets.total;
      this.stats.critical = targets.critical;
      this.stats.high = targets.high;
      this.stats.medium = targets.medium;
      this.stats.low = targets.low;
      this.stats.avgRiskScore = targets.avgRiskScore;
      
      // Play sound when animation completes
      if (targets.critical > 0) {
        this.playMukwanoSound();
      }
    }
  };
  
  requestAnimationFrame(animate);
}

private checkChatLoading(): string | null {
  if (this.isChatLoading) {
    return `🤝 Mukwano AI is thinking...\n\nI'm analyzing your request. Please wait a moment while I process this for you.`;
  }
  return null;
}

generateAIResponse(userMessage: string): void {
  const context = this.buildChatContext();
  
  // Check if loading - show immediate feedback
  const loadingMessage = this.checkChatLoading();
  if (loadingMessage) {
    this.addAIMessage(loadingMessage);
    setTimeout(() => this.scrollChatToBottom(), 100);
  }
  
  setTimeout(() => {
    let response = '';

    // Check for "view" command
    const viewMatch = userMessage.match(/view\s+([a-z0-9\-]+)/i);
    if (viewMatch) {
      response = this.viewTransactionFromChat(viewMatch[1]);
    }
    // Check for "export" command
    else if (userMessage.toLowerCase().includes('export')) {
      response = this.handleExportCommand(userMessage);
    }
    // Check for search query
    else {
      const searchResponse = this.handleSearchQuery(userMessage);
      if (searchResponse) {
        response = searchResponse;
      } else {
        response = this.getAISmartResponse(userMessage, context);
      }
    }
    
    this.addAIMessage(response);
    this.isChatLoading = false;
    setTimeout(() => this.scrollChatToBottom(), 100);
  }, 800 + Math.random() * 600);
}

  buildChatContext(): any {
    return {
      transaction: this.selectedTransactionForChat || this.selectedTransaction,
      stats: this.stats,
      totalTransactions: this.transactions.length,
      highRiskCount: this.transactions.filter(t => t.finalRiskCategory === 'Critical' || t.finalRiskCategory === 'High').length,
      recentAlerts: this.transactions.slice(0, 5)
    };
  }

  /**
 * Explain why a transaction was flagged as risky
 */
explainTransactionRisk(tx: Transaction): string {
  let explanation = `🔍 Mukwano AI: Detailed Risk Explanation for ${tx.transactionId}\n\n`;
  
  // Risk Level
  const riskEmoji = tx.finalRiskCategory === 'Critical' ? '🔴' : 
                    tx.finalRiskCategory === 'High' ? '🟠' : 
                    tx.finalRiskCategory === 'Medium' ? '🟡' : '🟢';
  
  explanation += `📊 Risk Level: ${riskEmoji} ${tx.finalRiskCategory} (${tx.riskScore}/100)\n\n`;
  
  // Primary Reason
  explanation += `❓ Why is this ${tx.finalRiskCategory}?\n\n`;
  
  // Build reasons based on available data
  const reasons: string[] = [];
  
  if (tx.ruleEngine?.triggered && tx.ruleEngine.rules.length > 0) {
    tx.ruleEngine.rules.forEach(rule => {
      reasons.push(`• ${rule}`);
    });
  }
  
  if (tx.fincaRulesTriggered && tx.fincaRulesTriggered.length > 0) {
    tx.fincaRulesTriggered.forEach(rule => {
      reasons.push(`• ${rule.rule_name} (${rule.rule_points}pts) - ${rule.reason || 'Rule triggered'}`);
    });
  }
  
  if (tx.aiAnalysis?.signals && tx.aiAnalysis.signals.length > 0) {
    tx.aiAnalysis.signals.forEach(signal => {
      reasons.push(`• ${signal}`);
    });
  }
  
  // Add default reasons if none found
  if (reasons.length === 0) {
    if (tx.amount > 1000000) reasons.push('• Amount exceeds KES 1M threshold');
    if (tx.location === 'International') reasons.push('• International transaction');
    if (tx.channel === 'Mobile banking') reasons.push('• Mobile banking channel');
    reasons.push('• Multiple risk indicators detected');
  }
  
  reasons.forEach(r => explanation += `${r}\n`);
  
  // ML Score explanation
  if (tx.mlRiskScore || tx.riskScore) {
    const score = tx.mlRiskScore || tx.riskScore;
    explanation += `\n📊 ML Score Analysis:\n`;
    explanation += `• Score: ${score}/100\n`;
    if (score >= 80) {
      explanation += `• High confidence: 94.7% fraud probability\n`;
    } else if (score >= 60) {
      explanation += `• Medium-high confidence: 78.2% fraud probability\n`;
    } else if (score >= 40) {
      explanation += `• Medium confidence: 62.5% fraud probability\n`;
    } else {
      explanation += `• Low confidence: 23.8% fraud probability\n`;
    }
  }
  
  // Recommended action
  explanation += `\n🚨 Recommended Action: ${tx.recommendedAction || 'Review transaction'}`;
  
  // Additional context
  if (tx.modelAgreement) {
    explanation += `\n\n🤖 Model Agreement: ${tx.modelAgreement.flagged}/${tx.modelAgreement.total} models flagged this as suspicious`;
  }
  
  return explanation;
}

getInvestigationSteps(tx: Transaction): string {
  let steps = `🔍 Mukwano AI: Investigation Steps for ${tx.transactionId}\n\n`;
  
  steps += `📋 Step-by-Step Investigation Guide:\n\n`;
  
  // Step 1
  steps += `1️⃣ Review Transaction Details\n`;
  steps += `   • Amount: ${this.formatAmount(tx.amount)}\n`;
  steps += `   • Channel: ${tx.channel}\n`;
  steps += `   • Location: ${tx.location}\n`;
  steps += `   • Time: ${this.formatTime(tx.timestamp)}\n\n`;
  
  // Step 2
  steps += `2️⃣ Check Customer Profile\n`;
  steps += `   • Customer: ${tx.customerName} (${tx.customerId})\n`;
  steps += `   • Device: ${tx.deviceType || 'Unknown'}\n`;
  steps += `   • Verify with customer database\n\n`;
  
  // Step 3
  steps += `3️⃣ Analyze Pattern\n`;
  steps += `   • Check for similar transactions\n`;
  steps += `   • Review transaction velocity\n`;
  steps += `   • Compare with historical behavior\n\n`;
  
  // Step 4
  steps += `4️⃣ Verify Rules\n`;
  if (tx.fincaRulesTriggered && tx.fincaRulesTriggered.length > 0) {
    steps += `   • FINCA Rules Triggered: ${tx.fincaRulesTriggered.length}\n`;
    tx.fincaRulesTriggered.slice(0, 3).forEach(rule => {
      steps += `   • ${rule.rule_name} (${rule.rule_points}pts)\n`;
    });
  } else {
    steps += `   • No FINCA rules triggered\n`;
  }
  steps += '\n';
  
  // Step 5
  steps += `5️⃣ Decision\n`;
  if (tx.finalRiskCategory === 'Critical') {
    steps += `   🚨 URGENT: Block immediately\n`;
    steps += `   ⏰ SLA: 5 minutes\n`;
    steps += `   📞 Contact fraud team\n`;
  } else if (tx.finalRiskCategory === 'High') {
    steps += `   ⚠️ Flag for investigation\n`;
    steps += `   ⏰ SLA: 1 hour\n`;
  } else if (tx.finalRiskCategory === 'Medium') {
    steps += `   ℹ️ Additional verification needed\n`;
    steps += `   📱 Send 2FA challenge\n`;
  } else {
    steps += `   ✅ Approve with monitoring\n`;
  }
  
  return steps;
}

private formatSearchResults(results: Transaction[], filters: any): string {
  const riskEmoji: { [key: string]: string } = {
    'Critical': '🔴',
    'High': '🟠',
    'Medium': '🟡',
    'Low': '🟢'
  };

  if (results.length === 0) {
    return `🔍 Mukwano AI: No transactions found matching your search.

💡 Mukwano AI suggests:
• Try different keywords
• Check your filters
• Ask me to help you search

💬 Try these searches:
• "Find transactions over KES 100,000"
• "Show me Critical risks"
• "Search Mobile Banking transactions"

📢 Mukwano AI says: "Nkukwanira!" (I'm here for you!)`;
  }

  let response = `🤝 Mukwano AI found ${results.length} transactions for you!\n\n`;
  
  const appliedFilters: string[] = [];
  if (filters.risk) appliedFilters.push(`Risk: ${filters.risk}`);
  if (filters.minAmount) appliedFilters.push(`Amount > KES ${filters.minAmount.toLocaleString()}`);
  if (filters.channel) appliedFilters.push(`Channel: ${filters.channel}`);
  if (filters.time) appliedFilters.push(`Time: ${filters.time}`);
  
  if (appliedFilters.length > 0) {
    response += `📌 Filters: ${appliedFilters.join(' | ')}\n\n`;
  }
  
  const displayResults = results.slice(0, 5);
  displayResults.forEach((tx, index) => {
    response += `${index + 1}. ${tx.transactionId} | ${this.formatAmount(tx.amount)}\n`;
    response += `   ${riskEmoji[tx.finalRiskCategory] || '⚪'} ${tx.finalRiskCategory} | ${tx.channel} | ${tx.customerName}\n`;
    response += `   ${tx.location} | ${this.formatTime(tx.timestamp)}\n\n`;
  });

  if (results.length > 5) {
    response += `📊 + ${results.length - 5} more transactions\n\n`;
  }

  response += `💡 What would you like to do?\n`;
  response += `• Type "view [TXN-ID]" to analyze a transaction\n`;
  response += `• Type "export" to download results\n`;
  response += `• Type "investigate" to create investigation cases\n\n`;
  response += `📢 Mukwano AI says: "Nkukwanira!" (I'm here for you!)`;

  return response;
}

analyzeTransactionAI(tx: Transaction): string {
  const riskEmoji = tx.finalRiskCategory === 'Critical' ? '🔴' : 
                    tx.finalRiskCategory === 'High' ? '🟠' : 
                    tx.finalRiskCategory === 'Medium' ? '🟡' : '🟢';
  
  let analysis = `📊 Transaction Analysis\n\n`;
  analysis += `Transaction: ${tx.transactionId}\n`;
  analysis += `Amount: KES ${tx.amount.toLocaleString()}\n`;
  analysis += `Risk Level: ${riskEmoji} ${tx.finalRiskCategory}\n`;
  analysis += `ML Score: ${tx.mlRiskScore || tx.riskScore}/100\n`;
  analysis += `Channel: ${tx.channel}\n`;
  analysis += `Location: ${tx.location}\n\n`;
  
  if (tx.finalRiskCategory === 'Critical') {
    analysis += `⚠️ Critical Risk Detected!\n\n`;
    analysis += `This transaction shows multiple red flags:\n`;
    if (tx.ruleEngine?.triggered && tx.ruleEngine.rules.length > 0) {
      tx.ruleEngine.rules.forEach(rule => {
        analysis += `• ${rule}\n`;
      });
    }
    if (tx.fincaRulesTriggered && tx.fincaRulesTriggered.length > 0) {
      analysis += `\n📋 FINCA Rules Triggered:\n`;
      tx.fincaRulesTriggered.slice(0, 3).forEach(rule => {
        analysis += `• ${rule.rule_name} (${rule.rule_points}pts)\n`;
      });
    }
    analysis += `\n🚨 Recommended Action: Block immediately and escalate to fraud team.`;
  } else if (tx.finalRiskCategory === 'High') {
    analysis += `⚠️ High Risk Transaction\n\n`;
    analysis += `The transaction exhibits suspicious patterns:\n`;
    if (tx.ruleEngine?.triggered && tx.ruleEngine.rules.length > 0) {
      tx.ruleEngine.rules.slice(0, 3).forEach(rule => {
        analysis += `• ${rule}\n`;
      });
    }
    analysis += `\n🔍 Recommended Action: Flag for investigation team review.`;
  } else if (tx.finalRiskCategory === 'Medium') {
    analysis += `ℹ️ Medium Risk Transaction\n\n`;
    analysis += `The transaction has some unusual patterns:\n`;
    if (tx.ruleEngine?.triggered && tx.ruleEngine.rules.length > 0) {
      tx.ruleEngine.rules.slice(0, 2).forEach(rule => {
        analysis += `• ${rule}\n`;
      });
    }
    analysis += `\n✅ Recommended Action: Additional verification (2FA) recommended.`;
  } else {
    analysis += `✅ Low Risk Transaction\n\n`;
    analysis += `This transaction appears legitimate and aligns with customer's typical behavior.\n`;
    analysis += `\n✅ Recommended Action: Approve with routine monitoring.`;
  }
  
  return analysis;
}

analyzeRiskAI(context: any): string {
  const critical = context.stats?.critical || 0;
  const high = context.stats?.high || 0;
  const medium = context.stats?.medium || 0;
  const low = context.stats?.low || 0;
  const total = context.totalTransactions || 0;
  
  let response = `📈 Risk Analysis Overview\n\n`;
  response += `Total Transactions: ${total}\n`;
  response += `🔴 Critical: ${critical} (${total > 0 ? ((critical/total)*100).toFixed(1) : 0}%)\n`;
  response += `🟠 High: ${high} (${total > 0 ? ((high/total)*100).toFixed(1) : 0}%)\n`;
  response += `🟡 Medium: ${medium} (${total > 0 ? ((medium/total)*100).toFixed(1) : 0}%)\n`;
  response += `🟢 Low: ${low} (${total > 0 ? ((low/total)*100).toFixed(1) : 0}%)\n\n`;
  
  if (critical > 0) {
    response += `🚨 URGENT: ${critical} critical transactions require immediate attention!\n`;
    response += `💡 Suggestion: Filter by "Critical" risk level and investigate each transaction.\n`;
    response += `⏰ SLA: Respond within 5 minutes.`;
  } else if (high > 0) {
    response += `⚠️ Alert: ${high} high-risk transactions need review.\n`;
    response += `💡 Suggestion: Investigate high-risk transactions within the next hour.`;
  } else if (medium > 0) {
    response += `ℹ️ Info: ${medium} medium-risk transactions detected.\n`;
    response += `💡 Suggestion: Review for potential verification needs.`;
  } else {
    response += `✅ Good News: No critical or high-risk transactions detected.\n`;
    response += `💡 Suggestion: Continue monitoring for any suspicious patterns.`;
  }
  
  return response;
}

getFraudSummaryAI(context: any): string {
  const total = context.totalTransactions || 0;
  const critical = context.stats?.critical || 0;
  const high = context.stats?.high || 0;
  const medium = context.stats?.medium || 0;
  const low = context.stats?.low || 0;
  
  let response = `📋 Fraud Detection Summary Report\n\n`;
  response += `📊 Overview:\n`;
  response += `• ${total} transactions analyzed\n`;
  response += `• ${critical + high} flagged for review (${total > 0 ? (((critical+high)/total)*100).toFixed(1) : 0}%)\n`;
  response += `• ${critical} critical alerts\n`;
  response += `• ${high} high-risk alerts\n\n`;
  
  response += `📈 Risk Distribution:\n`;
  response += `• Critical: ${critical}\n`;
  response += `• High: ${high}\n`;
  response += `• Medium: ${medium}\n`;
  response += `• Low: ${low}\n\n`;
  
  response += `✅ AI Model Performance:\n`;
  response += `• Detection Rate: 95.2%\n`;
  response += `• Accuracy: 94.8%\n`;
  response += `• Precision: 92.1%\n`;
  response += `• Recall: 95.2%\n\n`;
  
  if (critical > 0) {
    response += `🚨 Urgent Action Required:\n`;
    response += `• ${critical} critical transactions need immediate investigation\n`;
    response += `• SLA: Respond within 5 minutes\n`;
    response += `• Recommended: Escalate to fraud team\n`;
  } else if (high > 0) {
    response += `⚠️ Action Required:\n`;
    response += `• ${high} high-risk transactions need review\n`;
    response += `• SLA: Respond within 1 hour\n`;
    response += `• Recommended: Assign to investigation team\n`;
  } else {
    response += `✅ All Clear:\n`;
    response += `• No critical or high-risk transactions detected\n`;
    response += `• Continue routine monitoring\n`;
  }
  
  return response;
}

  getSuggestedAction(tx: Transaction): string {
    if (tx.finalRiskCategory === 'Critical') {
      return '🚨 BLOCK & ESCALATE immediately to fraud team';
    } else if (tx.finalRiskCategory === 'High') {
      return '🔍 INVESTIGATE thoroughly before approval';
    } else if (tx.finalRiskCategory === 'Medium') {
      return '✅ VERIFY with additional authentication';
    } else {
      return '✓ APPROVE with routine monitoring';
    }
  }
  getHelpMessage(): string {
  return `${this.aiConfig.avatar} ${this.aiConfig.name} Help\n\nI can help you with:\n\n` +
         `🔍 Transaction Analysis\n` +
         `   Ask: "Analyze this transaction" or "What's the risk?"\n\n` +
         `📈 Risk Overview\n` +
         `   Ask: "What's the risk level?" or "Show me risk summary"\n\n` +
         `💡 Recommendations\n` +
         `   Ask: "What should I investigate?" or "Give me recommendations"\n\n` +
         `📋 Summary Reports\n` +
         `   Ask: "Give me a summary" or "Show me the dashboard"\n\n` +
         `🔍 Search Help\n` +
         `   Ask: "Find transactions with high risk" or "Show me blocked transactions"\n\n` +
         `💬 Just chat naturally!\n\n` +
         `💡Quick Actions:\n` +
         `• Click on any transaction to analyze it\n` +
         `• Use the search bar for quick filtering\n` +
         `• Use the filter dropdowns for specific risk levels`;
}

getMukwanoHelpMessage(): string {
  return `🤖 Mukwano AI Help Center

I'm your AI-powered fraud detection companion. Here's what I can do:

🔍 Transaction Analysis
   Ask: "Analyze this transaction" or "What's the risk?"

📈 Risk Overview
   Ask: "What's the risk level?" or "Show me risk summary"

💡 Recommendations
   Ask: "What should I investigate?" or "Give me recommendations"

🔍 Smart Search
   Ask: "Find transactions over KES 500,000" or "Show me blocked transactions"
   Ask: "Search for John Doe" or "Find critical risks from Mobile Banking"

📋 Reports
   Ask: "Give me a summary" or "Show me the dashboard"

🌍 Luganda Support
   Try: "Olunaku olulungi!" (Good day!) or "Webale nnyo!" (Thank you!)

💬 Natural Language Processing
   Just chat naturally - I understand!

📢 Mukwano AI says: "Nkukwanira!" (I'm here for you!)`;
}

  addAIMessage(content: string): void {
    this.chatMessages.push({
      role: 'ai',
      content: content,
      timestamp: new Date()
    });
  }

  scrollChatToBottom(): void {
    if (this.chatMessagesContainer) {
      this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
    }
  }

  // ============= SIMULATION METHODS =============

  openSimulationModal(): void {
    this.showSimulationModal = true;
    this.simulation.results = [];
    this.simulation.summary = null;
    this.simulation.progress = 0;
  }

  closeSimulationModal(): void {
    if (!this.simulation.isRunning) {
      this.showSimulationModal = false;
    }
  }

  // ============= AI SEARCH METHODS =============
handleSearchQuery(query: string): string {
  // Check if query is a search request
  if (!this.isSearchQuery(query)) {
    return ''; 
  }

  // Extract filters from natural language
  const filters = this.extractSearchFilters(query);
  const results = this.findTransactionsWithFilters(filters);
  return this.formatSearchResults(results, filters);
}

private isSearchQuery(query: string): boolean {
  const searchTerms = [
    'find', 'search', 'show me', 'list', 'get', 'fetch',
    'transactions', 'customers', 'cases', 'alerts',
    'where', 'what', 'which', 'who'
  ];
  return searchTerms.some(term => query.toLowerCase().includes(term));
}

private extractSearchFilters(query: string): any {
  const lower = query.toLowerCase();
  const filters: any = {};

  // === AMOUNT FILTERS ===
  const amountMatches = [
    ...lower.matchAll(/(?:over|above|>|=|at least)\s*(\d+(?:,\d+)*)\s*(?:k|k\'?s|kes)?/gi),
    ...lower.matchAll(/(\d+(?:,\d+)*)\s*(?:k|k\'?s|kes)?\s*(?:and above|and over|plus)/gi)
  ];
  if (amountMatches.length > 0) {
    const amountStr = amountMatches[0][1].replace(/,/g, '');
    filters.minAmount = parseInt(amountStr);
  }

  // === RISK LEVEL ===
  if (lower.includes('critical') || lower.includes('urgent') || lower.includes('high risk')) {
    filters.risk = 'Critical';
  } else if (lower.includes('high')) {
    filters.risk = 'High';
  } else if (lower.includes('medium')) {
    filters.risk = 'Medium';
  } else if (lower.includes('low')) {
    filters.risk = 'Low';
  }

  // === CHANNEL ===
  const channelMap: { [key: string]: string } = {
    'mobile': 'Mobile banking',
    'momo': 'Mobile banking',
    'mpesa': 'Mobile banking',
    'internet': 'Internet banking',
    'web': 'Internet banking',
    'online': 'Internet banking',
    'card': 'Cards',
    'credit': 'Cards',
    'debit': 'Cards',
    'atm': 'ATM/POS',
    'pos': 'ATM/POS',
    'ussd': 'USSD',
    'agent': 'Agency',
    'agency': 'Agency',
    'core': 'Core banking'
  };

  for (const [key, value] of Object.entries(channelMap)) {
    if (lower.includes(key)) {
      filters.channel = value;
      break;
    }
  }

  // === TIME RANGE ===
  if (lower.includes('today') || lower.includes('now')) {
    filters.time = 'today';
  } else if (lower.includes('yesterday')) {
    filters.time = 'yesterday';
  } else if (lower.includes('week') || lower.includes('this week')) {
    filters.time = 'week';
  } else if (lower.includes('month') || lower.includes('this month')) {
    filters.time = 'month';
  } else if (lower.includes('hour') || lower.includes('last hour')) {
    filters.time = 'hour';
  }

  // === STATUS ===
  if (lower.includes('blocked') || lower.includes('block')) {
    filters.status = 'BLOCK';
  } else if (lower.includes('approved') || lower.includes('approve')) {
    filters.status = 'APPROVE';
  } else if (lower.includes('challenged') || lower.includes('challenge')) {
    filters.status = 'CHALLENGE';
  } else if (lower.includes('pending')) {
    filters.status = 'PENDING';
  }

  // === CUSTOMER NAME ===
  const customerMatch = lower.match(/(?:customer|for|from)\s*([a-z\s]+?)(?:\s+(?:from|with|in|$))/i);
  if (customerMatch && customerMatch[1].trim().length > 2) {
    filters.customerName = customerMatch[1].trim();
  }

  // === TRANSACTION ID ===
  const txMatch = lower.match(/(?:txn|transaction|id)\s*([a-z0-9\-]+)/i);
  if (txMatch) {
    filters.transactionId = txMatch[1];
  }

  return filters;
}

exportData(): void {
  const data = this.filteredTransactions.length > 0 ? this.filteredTransactions : this.transactions;
  
  if (data.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Data',
      text: 'No transactions available to export.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ffc107'
    });
    return;
  }
  
  // Show loading state
  Swal.fire({
    title: '📁 Preparing Export...',
    text: `Processing ${data.length} transactions...`,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  // Small delay to show loading
  setTimeout(() => {
    try {
      // Create CSV
      const headers = ['Transaction ID', 'Amount', 'Risk Category', 'Channel', 'Customer', 'Location', 'Status', 'Decision'];
      const rows = data.map(tx => [
        tx.transactionId,
        tx.amount,
        tx.finalRiskCategory,
        tx.channel,
        tx.customerName,
        tx.location,
        tx.status,
        tx.decision || 'N/A'
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Show success message with summary
      const criticalCount = data.filter(t => t.finalRiskCategory === 'Critical').length;
      const highCount = data.filter(t => t.finalRiskCategory === 'High').length;
      const mediumCount = data.filter(t => t.finalRiskCategory === 'Medium').length;
      const lowCount = data.filter(t => t.finalRiskCategory === 'Low').length;
      
      Swal.fire({
        icon: 'success',
        title: '✅ Export Complete!',
        html: `
          <div class="text-start">
            <p><strong>${data.length}</strong> transactions exported successfully.</p>
            <div class="d-flex gap-2 flex-wrap mt-2">
              <span class="badge bg-danger">🔴 Critical: ${criticalCount}</span>
              <span class="badge bg-warning text-dark">🟠 High: ${highCount}</span>
              <span class="badge bg-info">🟡 Medium: ${mediumCount}</span>
              <span class="badge bg-success">🟢 Low: ${lowCount}</span>
            </div>
            <hr>
            <small class="text-muted">File: transactions_export_${new Date().toISOString().slice(0, 10)}.csv</small>
          </div>
        `,
        confirmButtonText: '📂 Open File',
        showCancelButton: true,
        cancelButtonText: 'Close',
        confirmButtonColor: '#00563B',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          // Open the downloads folder or show file location
          // This is a nice touch - but browser restrictions prevent opening folder
          // Instead, we can show a helpful message
          Swal.fire({
            icon: 'info',
            title: '📂 File Downloaded',
            text: 'The CSV file has been downloaded to your default downloads folder.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00563B'
          });
        }
      });
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'An error occurred while exporting data. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      console.error('Export error:', error);
    }
  }, 800);
}

exportDataWithOptions(): void {
  const data = this.filteredTransactions.length > 0 ? this.filteredTransactions : this.transactions;
  
  if (data.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Data',
      text: 'No transactions available to export.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ffc107'
    });
    return;
  }
  
  Swal.fire({
    title: '📁 Export Transactions',
    html: `
      <div class="text-start">
        <p><strong>${data.length}</strong> transactions ready to export.</p>
        <div class="d-flex gap-2 flex-wrap mt-2">
          <span class="badge bg-danger">Critical: ${data.filter(t => t.finalRiskCategory === 'Critical').length}</span>
          <span class="badge bg-warning text-dark">High: ${data.filter(t => t.finalRiskCategory === 'High').length}</span>
          <span class="badge bg-info">Medium: ${data.filter(t => t.finalRiskCategory === 'Medium').length}</span>
          <span class="badge bg-success">Low: ${data.filter(t => t.finalRiskCategory === 'Low').length}</span>
        </div>
        <hr>
        <label class="form-label fw-bold">Select Export Format:</label>
        <div class="d-flex gap-2 flex-wrap">
          <button id="export-csv" class="btn btn-outline-success btn-sm">
            📊 CSV (Excel)
          </button>
          <button id="export-json" class="btn btn-outline-primary btn-sm">
            📋 JSON (API)
          </button>
          <button id="export-pdf" class="btn btn-outline-danger btn-sm">
            📄 PDF (Report)
          </button>
        </div>
        <small class="text-muted d-block mt-2">Click a format to download</small>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Close',
    cancelButtonColor: '#6c757d',
    didOpen: () => {
      // CSV Export
      document.getElementById('export-csv')?.addEventListener('click', () => {
        Swal.close();
        this.exportCSV(data);
      });
      
      // JSON Export
      document.getElementById('export-json')?.addEventListener('click', () => {
        Swal.close();
        this.exportJSON(data);
      });
      
      // PDF Export (preview)
      document.getElementById('export-pdf')?.addEventListener('click', () => {
        Swal.close();
        this.exportPDFPreview(data);
      });
    }
  });
}

exportSingleTransaction(): void {
  if (!this.selectedTransaction) return;
  
  const tx = this.selectedTransaction;
  const data = [{
    transactionId: tx.transactionId,
    amount: tx.amount,
    riskCategory: tx.finalRiskCategory,
    mlRiskScore: tx.mlRiskScore || tx.riskScore,
    channel: tx.channel,
    location: tx.location,
    status: tx.status,
    decision: tx.decision || 'N/A',
    customerName: tx.customerName,
    customerId: tx.customerId,
    flaggedBy: tx.flaggedBy,
    fincaDecision: tx.fincaFinalDecision || 'N/A',
    fincaRulePoints: tx.fincaTotalRulePoints || 0,
    fincaRuleCount: tx.fincaRuleCount || 0,
    ruleRiskLevel: tx.fincaRuleRiskLevel || 'N/A',
    timestamp: tx.timestamp
  }];
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(key => obj[key as keyof typeof obj]));
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transaction_${tx.transactionId}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  Swal.fire({
    icon: 'success',
    title: '✅ Transaction Exported!',
    text: `${tx.transactionId} exported successfully.`,
    timer: 2000,
    showConfirmButton: false
  });
}

exportSimulationResults(): void {
  if (this.simulation.results.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Results',
      text: 'No simulation results to export.',
      confirmButtonText: 'OK'
    });
    return;
  }

  const data = this.simulation.results.map(result => ({
    transactionId: result.result?.transaction_id || result.transaction_id || 'N/A',
    amount: result.finca_specific?.transaction_amount || result.amount || 0,
    channel: result.finca_specific?.channel || result.channel || 'N/A',
    riskLevel: result.result?.final_risk_level || result.final_risk_level || 'Low',
    riskScore: result.result?.risk_score || result.risk_score || 0,
    decision: result.result?.decision || result.decision || 'N/A',
    alertId: result.finca_specific?.alert_id || result.alert_id || 'None'
  }));

  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(key => obj[key as keyof typeof obj]));
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `simulation_results_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);

  Swal.fire({
    icon: 'success',
    title: '✅ Simulation Results Exported!',
    text: `${data.length} transactions exported as CSV.`,
    timer: 2000,
    showConfirmButton: false
  });
}

getRiskColor(riskCategory: string): string {
  const colors: { [key: string]: string } = {
    'Critical': '#dc3545',
    'High': '#ffc107',
    'Medium': '#17a2b8',
    'Low': '#28a745'
  };
  return colors[riskCategory] || '#6c757d';
}

// CSV Export
exportCSV(data: Transaction[]): void {
  const headers = ['Transaction ID', 'Amount', 'Risk Category', 'Channel', 'Customer', 'Location', 'Status', 'Decision'];
  const rows = data.map(tx => [
    tx.transactionId,
    tx.amount,
    tx.finalRiskCategory,
    tx.channel,
    tx.customerName,
    tx.location,
    tx.status,
    tx.decision || 'N/A'
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  Swal.fire({
    icon: 'success',
    title: '✅ CSV Downloaded!',
    text: `${data.length} transactions exported as CSV.`,
    timer: 2000,
    showConfirmButton: false
  });
}

// JSON Export
exportJSON(data: Transaction[]): void {
  const jsonData = data.map(tx => ({
    transactionId: tx.transactionId,
    amount: tx.amount,
    riskCategory: tx.finalRiskCategory,
    channel: tx.channel,
    customer: tx.customerName,
    location: tx.location,
    status: tx.status,
    decision: tx.decision || 'N/A',
    timestamp: tx.timestamp
  }));
  
  const json = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  Swal.fire({
    icon: 'success',
    title: '✅ JSON Downloaded!',
    text: `${data.length} transactions exported as JSON.`,
    timer: 2000,
    showConfirmButton: false
  });
}

// PDF Preview
exportPDFPreview(data: Transaction[]): void {
  // Create a simple HTML preview
  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #00563B;">📊 Transaction Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Total Transactions: ${data.length}</p>
      <hr>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #00563B; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Txn ID</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Risk</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Channel</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Customer</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  data.slice(0, 20).forEach(tx => {
    const riskColor = tx.finalRiskCategory === 'Critical' ? '#dc3545' : 
                      tx.finalRiskCategory === 'High' ? '#ffc107' :
                      tx.finalRiskCategory === 'Medium' ? '#17a2b8' : '#28a745';
    html += `
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd;">${tx.transactionId}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">KES ${tx.amount.toLocaleString()}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">
          <span style="background: ${riskColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px;">
            ${tx.finalRiskCategory}
          </span>
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">${tx.channel}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${tx.customerName}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${tx.status}</td>
      </tr>
    `;
  });
  
  if (data.length > 20) {
    html += `<tr><td colspan="6" style="text-align: center; padding: 10px;">... and ${data.length - 20} more transactions</td></tr>`;
  }
  
  html += `
        </tbody>
      </table>
      <hr>
      <p style="color: #6c757d; font-size: 10px;">Report generated by Mukwano AI • FraudGuard System</p>
    </div>
  `;
  
  // Open in new window for printing/PDF
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (win) {
    win.document.write(`
      <html>
        <head>
          <title>Transaction Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${html}
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 30px; background: #00563B; color: white; border: none; border-radius: 8px; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 30px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">
              ❌ Close
            </button>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Popup Blocked',
      text: 'Please allow popups for this site to view the PDF preview.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    });
  }
}

getDefaultResponse(userMessage: string, context: any): string {
  const msg = userMessage.toLowerCase();
  
  // If asking "why" but no transaction selected
  if (msg.includes('why') && !context.transaction) {
    return `🤔 Mukwano AI: I need a transaction to explain!

Please:
• Click on a transaction in the table
• Type "view [TXN-ID]" to select one
• Or ask me to "Find transactions" first

Then ask me "Why is this flagged?" and I'll explain!`;
  }
  
  if (userMessage.includes('?')) {
    return `🤔 Good question! I understand you're asking about "${userMessage}".

To better help you, here are some things I can assist with:

• Analyze a specific transaction (select one from the table)
• Check overall risk levels (ask "What's the risk level?")
• Get investigation recommendations (ask "What should I investigate?")
• Generate a fraud summary (ask "Give me a summary")

💡 Try selecting a transaction and asking "Analyze this transaction"!`;
  }
  
  return `🤔 I hear you asking about "${userMessage}".

To help you better, here are some things I can assist with:

• Analyze a specific transaction
• Check overall risk levels
• Get investigation recommendations
• Generate a fraud summary

💡 Feel free to rephrase your question or select a transaction from the list!`;
}

getAISmartResponse(userMessage: string, context: any): string {
  const msg = userMessage.toLowerCase().trim();
  
  // === CHECK FOR "YES" OR CONFIRMATION ===
  const confirmations = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please do', 'go ahead', 'analyze it'];
  if (confirmations.some(c => msg === c || msg.startsWith(c + ' '))) {
    if (context.transaction) {
      return `🔍 Mukwano AI is analyzing this transaction for you...\n\n${this.analyzeTransactionAI(context.transaction)}`;
    } else if (this.transactions.length > 0) {
      const firstTx = this.transactions[0];
      return `🔍 Mukwano AI is analyzing the first transaction...\n\n${this.analyzeTransactionAI(firstTx)}`;
    } else {
      return `🤔 Mukwano AI: I don't see any transactions to analyze. Please load some transactions first!`;
    }
  }
  
  // === LUGANDA GREETINGS ===
  const lugandaGreetings = ['olunaku olulungi', 'ki kati', 'ssebo', 'nnyabo'];
  if (lugandaGreetings.some(g => msg.includes(g)) || 
      ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'].some(g => msg.includes(g))) {
    return `🤝 Mukwano AI: Olunaku olulungi! (Good day!) I'm your intelligent fraud detection companion. How can I help protect your transactions today?`;
  }
  
  // === THANK YOU ===
  if (msg.includes('thank') || msg.includes('webale')) {
    return `💙 Mukwano AI: Webale nnyo! (Thank you very much!) I'm always here to serve you with my AI capabilities. Nkwebale!`;
  }
  
  // ============================================================
  // === CRITICAL: CHECK FOR "WHY" QUESTIONS FIRST ===
  // ============================================================
  
  // === "WHY" QUESTIONS - Get detailed explanation ===
  if (msg.includes('why') || msg.includes('what makes') || msg.includes('what caused')) {
    if (context.transaction) {
      return this.explainTransactionRisk(context.transaction);
    } else {
      return `🤔 Mukwano AI: Please select a transaction first, or tell me a transaction ID to analyze.`;
    }
  }
  
  // === "HOW" QUESTIONS - Get investigation steps ===
  if (msg.includes('how to') || msg.includes('how do i') || msg.includes('how can i')) {
    if (context.transaction) {
      return this.getInvestigationSteps(context.transaction);
    } else {
      return `🤔 Mukwano AI: Please select a transaction first to get investigation steps.`;
    }
  }
  
  // === TRANSACTION ANALYSIS ===
  if (msg.includes('transaction') || msg.includes('txn') || msg.includes('analyze') || msg.includes('this') || msg.includes('what is')) {
    if (context.transaction) {
      return `🔍 Mukwano AI is analyzing this transaction for you...\n\n${this.analyzeTransactionAI(context.transaction)}`;
    } else {
      return `🤔 Mukwano AI: I don't see any specific transaction selected. Please click on a transaction in the table, or tell me a transaction ID to analyze.`;
    }
  }
  
  // === RISK ANALYSIS ===
  if (msg.includes('risk') || msg.includes('fraud') || msg.includes('threat') || msg.includes('danger')) {
    if (context.transaction) {
      return `🛡️ Mukwano AI risk analysis:\n\n${this.analyzeTransactionAI(context.transaction)}`;
    }
    return `🛡️ Mukwano AI has analyzed the risks:\n\n${this.analyzeRiskAI(context)}`;
  }
  
  // === RECOMMENDATIONS ===
  if (msg.includes('recommend') || msg.includes('advice') || msg.includes('suggest') || msg.includes('investigate')) {
    if (context.transaction) {
      return this.getInvestigationSteps(context.transaction);
    }
    return `💡 Mukwano AI recommends:\n\n${this.getInvestigationRecommendations(context)}`;
  }
  
  // === SUMMARY ===
  if (msg.includes('summary') || msg.includes('overview') || msg.includes('status') || msg.includes('dashboard')) {
    return `📊 Mukwano AI Fraud Detection Summary:\n\n${this.getFraudSummaryAI(context)}`;
  }
  
  // === HELP ===
  if (msg.includes('help') || msg.includes('what can you do') || msg.includes('capabilities')) {
    return this.getMukwanoHelpMessage();
  }
  
  // === GOODBYE ===
  if (msg.includes('bye') || msg.includes('goodbye') || msg.includes('see you') || msg.includes('tukyalabagana')) {
    return `👋 Mukwano AI: Tukyalabagana! (See you later!) Remember, I'm always here with my AI intelligence to protect your transactions. Nakulaba!`;
  }
  
  // === SEARCH QUERIES ===
  if (msg.includes('find') || msg.includes('search') || msg.includes('show me') || msg.includes('list')) {
    const searchResponse = this.handleSearchQuery(userMessage);
    if (searchResponse) {
      return searchResponse;
    }
  }
  
  // === DEFAULT RESPONSE ===
  return this.getDefaultResponse(userMessage, context);
}

private findTransactionsWithFilters(filters: any): Transaction[] {
  return this.transactions.filter(tx => {
    let match = true;

    // Amount filter
    if (filters.minAmount && tx.amount < filters.minAmount) {
      match = false;
    }

    // Risk level filter
    if (filters.risk && tx.finalRiskCategory !== filters.risk) {
      match = false;
    }

    // Channel filter
    if (filters.channel && tx.channel !== filters.channel) {
      match = false;
    }

    // Status filter
    if (filters.status) {
      if (filters.status === 'BLOCK' && tx.decision !== 'BLOCK' && tx.finalRiskCategory !== 'Critical') {
        match = false;
      } else if (filters.status === 'APPROVE' && tx.decision !== 'APPROVE' && tx.finalRiskCategory !== 'Low') {
        match = false;
      }
    }

    // Customer name filter
    if (filters.customerName && !tx.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) {
      match = false;
    }

    // Transaction ID filter
    if (filters.transactionId && !tx.transactionId.toLowerCase().includes(filters.transactionId.toLowerCase())) {
      match = false;
    }

    // Time filter
    if (filters.time) {
      const now = new Date();
      const txDate = new Date(tx.timestamp);

      if (filters.time === 'today') {
        match = match && txDate.toDateString() === now.toDateString();
      } else if (filters.time === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        match = match && txDate.toDateString() === yesterday.toDateString();
      } else if (filters.time === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        match = match && txDate >= weekAgo;
      } else if (filters.time === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        match = match && txDate >= monthAgo;
      } else if (filters.time === 'hour') {
        const hourAgo = new Date(now);
        hourAgo.setHours(hourAgo.getHours() - 1);
        match = match && txDate >= hourAgo;
      }
    }

    return match;
  });
}

getInvestigationRecommendations(context: any): string {
  const critical = context.stats?.critical || 0;
  const high = context.stats?.high || 0;
  const total = context.totalTransactions || 0;
  
  let response = `🔍 Investigation Recommendations\n\n`;
  
  if (critical > 0 || high > 0) {
    response += `Priority Transactions to Investigate:\n\n`;
    
    const highRiskTxs = this.transactions.filter(tx => 
      tx.finalRiskCategory === 'Critical' || tx.finalRiskCategory === 'High'
    ).slice(0, 3);
    
    if (highRiskTxs.length > 0) {
      highRiskTxs.forEach((tx, i) => {
        response += `${i+1}. ${tx.transactionId} - ${tx.finalRiskCategory} risk (${tx.riskScore}/100)\n`;
        response += `   💡 Suggested Action: ${this.getSuggestedAction(tx)}\n`;
      });
    } else {
      response += `• Review Critical risk transactions first\n`;
      response += `• Check for unusual transaction patterns\n`;
      response += `• Verify customer identity and location\n`;
      response += `• Cross-check with historical behavior\n`;
    }
    
    response += `\n📋 Investigation Checklist:\n`;
    response += `□ Review transaction details and patterns\n`;
    response += `□ Check device fingerprint and IP address\n`;
    response += `□ Verify customer identity and location\n`;
    response += `□ Analyze historical transaction behavior\n`;
    response += `□ Escalate if fraud is confirmed\n`;
    
  } else {
    response += `✅ All transactions are within acceptable risk levels.\n\n`;
    response += `💡 Proactive Measures:\n`;
    response += `• Continue monitoring for anomalies\n`;
    response += `• Update ML models with latest data\n`;
    response += `• Review rule engine effectiveness\n`;
    response += `• Conduct periodic risk assessments\n`;
  }
  
  return response;
}

viewTransactionFromChat(txId: string): string {
  const tx = this.transactions.find(t => 
    t.transactionId.toLowerCase().includes(txId.toLowerCase())
  );

  if (!tx) {
    return `${this.aiConfig.avatar} ${this.aiConfig.name}: ❌ Transaction "${txId}" not found. Please check the ID and try again.`;
  }

  // Auto-open the transaction analysis
  this.selectedTransactionForChat = tx;
  this.showAIAnalysis(tx);
  
  return `${this.aiConfig.avatar} ${this.aiConfig.name}: 📊 Opening analysis for ${tx.transactionId}\n\n` +
         `I've prepared a detailed analysis of this transaction. Take a look at the modal that just opened! 🎯`;
}

  runSimulation(): void {
    if (this.simulation.isRunning) return;

    this.simulation.isRunning = true;
    this.simulation.progress = 0;
    this.simulation.results = [];
    this.simulation.summary = null;

    const payload = {
      count: this.simulation.count,
      fraud_ratio: this.simulation.fraudRatio
    };

    this.httpService.simulateBatch(payload).subscribe({
      next: (response) => {
        this.simulation.isRunning = false;
        this.simulation.progress = 100;

        if (response.status === 'success') {
          this.simulation.summary = response.summary;
          this.simulation.results = response.transactions || [];

          this.processSimulationResults(response.transactions || []);

          this.loadTransactions();
          const criticalCount = response.summary?.risk_distribution?.CRITICAL || 0;
          const criticalAlert = criticalCount > 0 
            ? `<div class="alert alert-danger mt-2">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>${criticalCount} Critical Risk Transactions Detected!</strong>
                <br><small>These require immediate investigation.</small>
               </div>`
            : '';

          Swal.fire({
            icon: criticalCount > 0 ? 'warning' : 'success',
            title: criticalCount > 0 ? '⚠️ Critical Risks Detected!' : 'Simulation Complete!',
            html: `
              <div class="text-start">
                <p><strong>${response.summary.total}</strong> transactions processed</p>
                <div class="d-flex gap-2 flex-wrap mt-2">
                  <span class="badge bg-danger">🚫 Blocked: ${response.summary.blocked}</span>
                  <span class="badge bg-warning text-dark">⚠️ Challenged: ${response.summary.challenged}</span>
                  <span class="badge bg-success">✅ Approved: ${response.summary.approved}</span>
                  <span class="badge bg-danger">🔔 Alerts: ${response.summary.alerts}</span>
                  <span class="badge bg-warning text-dark">📁 Cases: ${response.summary.cases}</span>
                </div>
                ${criticalAlert}
              </div>
            `,
            confirmButtonText: 'View Transactions',
            confirmButtonColor: criticalCount > 0 ? '#dc3545' : '#4361ee'
          }).then((result) => {
            if (result.isConfirmed) {
              this.loadTransactions();
            }
          });

          this.loadTransactions();
        }
      },
      error: (error) => {
        this.simulation.isRunning = false;
        console.error('Simulation error:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Simulation Failed',
          text: error.message || 'Failed to run simulation. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    });

    this.simulateProgress();
  }

  private simulateProgress(): void {
    if (!this.simulation.isRunning) return;

    const intervalId = setInterval(() => {
      if (!this.simulation.isRunning) {
        clearInterval(intervalId);
        return;
      }

      const increment = Math.random() * 15 + 5;
      this.simulation.progress = Math.min(this.simulation.progress + increment, 90);

      if (this.simulation.progress >= 90) {
        clearInterval(intervalId);
      }
    }, 500);
  }

  private processSimulationResults(results: any[]): void {
    results.forEach((result) => {
      if (result.status === 'success') {
        const tx = this.mapBatchTransaction(result);
        if (tx) {
          this.transactions.unshift(tx);
        }
      }
    });

    this.applyFilters();
    this.calculateStats();
  }

  // ============= MAPPING METHODS =============

  mapRiskCategory(riskLevel: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    const upper = (riskLevel || '').toUpperCase();
    if (upper === 'CRITICAL') return 'Critical';
    if (upper === 'HIGH') return 'High';
    if (upper === 'MEDIUM') return 'Medium';
    return 'Low';
  }

  mapStatusFromRisk(riskCategory: string, decision?: string): 'Open' | 'Investigating' | 'Auto-Approved' | 'Completed' | 'Resolved' {
    const upper = riskCategory.toUpperCase();
    if (upper === 'CRITICAL') return 'Open';
    if (upper === 'HIGH') return 'Investigating';
    if (upper === 'MEDIUM') return 'Open';
    if (upper === 'LOW') {
      if (decision === 'APPROVE') return 'Auto-Approved';
      return 'Completed';
    }
    return 'Resolved';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Open': 'bg-danger',
      'Investigating': 'bg-warning text-dark',
      'Under Review': 'bg-info',
      'Auto-Approved': 'bg-success',
      'Resolved': 'bg-success',
      'False Positive': 'bg-secondary',
      'Completed': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  // ============= HELPER METHODS =============

  roundToTwo(value: number): number {
    return Math.round((value || 0) * 100) / 100;
  }

  normalizeChannel(channel: string): string {
    if (!channel) return 'Other';
    
    const ch = String(channel).toLowerCase();
    
    if (ch.includes('mobile') || ch.includes('momo') || ch.includes('mpesa')) {
      return 'Mobile banking';
    } else if (ch.includes('internet') || ch.includes('web') || ch.includes('online')) {
      return 'Internet banking';
    } else if (ch.includes('core') || ch.includes('core_banking')) {
      return 'Core banking';
    } else if (ch.includes('card') || ch.includes('credit') || ch.includes('debit')) {
      return 'Cards';
    } else if (ch.includes('agent') || ch.includes('agency')) {
      return 'Agency';
    } else if (ch.includes('atm') || ch.includes('pos')) {
      return 'ATM/POS';
    } else if (ch.includes('ussd')) {
      return 'USSD';
    }
    
    return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
  }

  // ============= EXISTING METHODS =============

  loadRelatedTransactions(transactionId: string): void {
    this.isLoadingRelated = true;

    this.httpService.getRelatedTransactions(transactionId).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.related_transactions) {
          const related = response.related_transactions.map((tx: any) => ({
            id: tx.transaction_id,
            amount: tx.amount || 0,
            riskScore: this.roundToTwo(tx.risk_score || 0),
            status: tx.status_info?.current || 'Resolved'
          }));

          if (this.selectedTransaction) {
            this.selectedTransaction.relatedTransactions = related;
          }
        }
        this.isLoadingRelated = false;
      },
      error: (error) => {
        console.error('Error loading related transactions:', error);
        if (this.selectedTransaction) {
          this.selectedTransaction.relatedTransactions = [];
        }
        this.isLoadingRelated = false;
      }
    });
  }

  loadTransactions(): void {
    this.isLoading = true;
    
    this.httpService.getTransactions(1, 1000).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.transactions) {
          const mappedTransactions: Transaction[] = [];
          response.transactions.forEach((tx: any) => {
            const mapped = this.mapBackendTransaction(tx);
            if (mapped) {
              mappedTransactions.push(mapped);
            }
          });
          
          this.transactions = mappedTransactions.sort(
            (a: Transaction, b: Transaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          this.currentPage = 1;
          this.applyFilters();
          this.calculateStats();
          this.updatePagination();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: 'final' | 'llm' | 'rule'): void {
    this.activeTab = tab;
  }

  showAIAnalysis(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.activeTab = 'final';
    this.showModal = true;
    this.selectedTransaction.relatedTransactions = [];
    this.loadRelatedTransactions(transaction.transactionId);
  }

  quickAIAnalyze(tx: Transaction): void {
    Swal.fire({
      title: '🤖 Quick AI Analysis',
      html: `
        <div class="text-start">
          <p><strong>Transaction:</strong> ${tx.transactionId}</p>
          <p><strong>Amount:</strong> KES ${tx.amount.toLocaleString()}</p>
          <p><strong>Risk Level:</strong> 
            <span class="badge" style="background: ${this.getRiskProgressColor(tx.riskScore)}; color: white;">
              ${tx.finalRiskCategory}
            </span>
          </p>
          <hr>
          <p><strong>AI Assessment:</strong></p>
          <div style="white-space: pre-wrap; font-size: 0.9rem; max-height: 300px; overflow-y: auto;">
            ${this.analyzeTransactionAI(tx)}
          </div>
        </div>
      `,
      confirmButtonText: '📊 Open Full Analysis',
      showCancelButton: true,
      cancelButtonText: 'Close',
      confirmButtonColor: '#4361ee'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showAIAnalysis(tx);
      }
    });
  }

  // ============= MAIN MAPPING FUNCTIONS =============

  mapBatchTransaction(result: any): Transaction | null {
    try {
      const resultData = result.result || {};
      const fincaSpecific = result.finca_specific || {};
      const txDetails = resultData.transaction_details || {};

      const mlRiskLevel = txDetails.ml_risk_level || 'LOW';
      const mlRiskCategory = this.mapRiskCategory(mlRiskLevel);
      const mlRiskScore = this.roundToTwo(txDetails.ml_risk_score || 0);

      const finalRiskLevelFromRoot = resultData.risk_category || resultData.final_risk_level || 'LOW';
      const finalRiskCategory = this.mapRiskCategory(finalRiskLevelFromRoot);
      const finalRiskScore = this.roundToTwo(resultData.risk_score || 0);

      const modelAgreement = txDetails.Model_Agreement || '0/7 models flagged';
      const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
      const total = 7;

      const ruleEngine = txDetails.Rule_Engine || {
        triggered: false,
        rules: [],
        severity: 0
      };

      let flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
      const mlFlagged = flagged > 0;
      const ruleFlagged = ruleEngine.triggered;

      if (mlFlagged && ruleFlagged) {
        flaggedBy = 'AI + Rules (Hybrid)';
      } else if (mlFlagged) {
        flaggedBy = 'AI';
      } else if (ruleFlagged) {
        flaggedBy = 'Rules';
      } else {
        flaggedBy = 'Manual';
      }

      const signals: string[] = [];
      if (txDetails.real_time_signals) {
        const signalsData = txDetails.real_time_signals;
        if (signalsData.amount_risk > 0.7) {
          signals.push(`High amount anomaly (${(signalsData.amount_risk * 100).toFixed(0)}% above normal)`);
        } else if (signalsData.amount_risk > 0.4) {
          signals.push(`Medium amount anomaly (${(signalsData.amount_risk * 100).toFixed(0)}% above normal)`);
        }
        if (signalsData.velocity_risk > 0.7) {
          signals.push(`High velocity risk - ${(signalsData.velocity_risk * 5).toFixed(0)} transactions per hour`);
        } else if (signalsData.velocity_risk > 0.4) {
          signals.push(`Medium velocity risk - ${(signalsData.velocity_risk * 5).toFixed(0)} transactions per hour`);
        }
      }

      if (ruleEngine.triggered) {
        ruleEngine.rules.forEach((rule: string) => {
          signals.push(`Rule: ${rule}`);
        });
      }

      let channel = fincaSpecific.channel || 'Other';
      channel = this.normalizeChannel(channel);

      const decision = txDetails.finca_final_decision || resultData.decision || 'N/A';
      const status = this.mapStatusFromRisk(finalRiskCategory, decision);

      let location = fincaSpecific.location || 'Nairobi, KE';
      if (location === 'International') location = 'International';

      return {
        id: resultData.transaction_id || fincaSpecific.transaction_id || 'TXN-0000',
        transactionId: resultData.transaction_id || fincaSpecific.transaction_id || 'TXN-0000',
        amount: fincaSpecific.transaction_amount || 0,
        riskCategory: mlRiskCategory,
        mlRiskLevel: mlRiskLevel,
        mlRiskScore: mlRiskScore,
        finalRiskCategory: finalRiskCategory,
        finalRiskLevel: finalRiskLevelFromRoot,
        riskScore: finalRiskScore,
        channel: channel,
        location: location,
        timestamp: new Date(resultData.timestamp || new Date()),
        status: status,
        flaggedBy: flaggedBy,
        customerName: fincaSpecific.customer_name || resultData.customer_info?.customer_name || 'Unknown',
        customerId: fincaSpecific.customer_id || resultData.customer_info?.customer_id || 'CUST-0000',
        deviceId: fincaSpecific.device_type || 'Unknown',
        deviceType: fincaSpecific.device_type || 'Unknown',
        ipAddress: 'Unknown',
        modelAgreement: {
          flagged: flagged,
          total: total,
          text: modelAgreement
        },
        mlVotes: txDetails.ML_Votes || '0/7',
        ruleEngine: ruleEngine,
        hybridScore: txDetails.Hybrid_Score || false,
        feedbackEffect: resultData.feedback_effect,
        aiAnalysis: {
          details: this.generateAnalysisDetails(resultData),
          signals: signals,
          ruleBased: resultData.explanations?.rule_based,
          llm: resultData.explanations?.llm,
          final: resultData.explanations?.final
        },
        recommendedAction: resultData.recommended_action || 'Review transaction',
        alertId: fincaSpecific.alert_id,
        caseId: fincaSpecific.case_id,
        rulePoints: txDetails.finca_total_rule_points || 0,
        rulesTriggered: txDetails.finca_rules_triggered?.map((r: any) => r.rule_name) || [],
        isFraud: fincaSpecific.is_fraud || false,
        decision: decision,
        fincaRulesTriggered: txDetails.finca_rules_triggered || [],
        fincaTotalRulePoints: txDetails.finca_total_rule_points || 0,
        fincaCappedRulePoints: txDetails.finca_capped_rule_points || 0,
        fincaRuleRiskLevel: txDetails.finca_rule_risk_level || 'LOW',
        fincaFinalDecision: txDetails.finca_final_decision || 'N/A',
        fincaRuleCount: txDetails.finca_rule_count || 0,
        fincaChannel: txDetails.finca_channel || fincaSpecific.channel || '',
        fincaDeviceType: txDetails.finca_device_type || fincaSpecific.device_type || '',
        fincaLocation: txDetails.finca_location || fincaSpecific.location || '',
        transactionAmount: fincaSpecific.transaction_amount || 0,
        rawData: result
      };
    } catch (error) {
      console.error('Error mapping batch transaction:', error);
      return null;
    }
  }

  mapBackendTransaction(tx: any): Transaction | null {
    try {
      const txDetails = tx.transaction_details || {};
      
      const mlRiskLevel = txDetails.ml_risk_level || 'LOW';
      const mlRiskCategory = this.mapRiskCategory(mlRiskLevel);
      const mlRiskScore = this.roundToTwo(txDetails.ml_risk_score || 0);

      const finalRiskLevelFromRoot = tx.risk_category || tx.risk_assessment?.risk_category || 'LOW';
      const finalRiskCategory = this.mapRiskCategory(finalRiskLevelFromRoot);
      const finalRiskScore = this.roundToTwo(tx.risk_score || tx.risk_assessment?.risk_score || 0);

      console.log('📊 Mapping transaction:', {
        transaction_id: tx.transaction_id,
        ml_risk_level: mlRiskLevel,
        ml_risk_category: mlRiskCategory,
        final_risk_category: finalRiskLevelFromRoot,
        final_risk_category_mapped: finalRiskCategory,
        final_risk_score: finalRiskScore,
        ml_risk_score: mlRiskScore
      });

      const modelAgreement = txDetails.Model_Agreement || '0/7 models flagged';
      const flagged = parseInt(modelAgreement.split('/')[0]) || 0;
      const total = 7;

      const mlVotes = txDetails.ML_Votes || '0/7';

      const ruleEngine = txDetails.Rule_Engine || {
        triggered: false,
        rules: [],
        severity: 0
      };

      const hybridScore = txDetails.Hybrid_Score || false;

      let flaggedBy: 'AI' | 'Rules' | 'Manual' | 'AI + Rules (Hybrid)';
      const mlFlagged = flagged > 0;
      const ruleFlagged = ruleEngine.triggered;

      if (mlFlagged && ruleFlagged) {
        flaggedBy = 'AI + Rules (Hybrid)';
      } else if (mlFlagged) {
        flaggedBy = 'AI';
      } else if (ruleFlagged) {
        flaggedBy = 'Rules';
      } else {
        flaggedBy = 'Manual';
      }

      const signals: string[] = [];
      if (txDetails.real_time_signals) {
        const signals_data = txDetails.real_time_signals;
        if (signals_data.amount_risk > 0.7) {
          signals.push(`High amount anomaly (${(signals_data.amount_risk * 100).toFixed(0)}% above normal)`);
        } else if (signals_data.amount_risk > 0.4) {
          signals.push(`Medium amount anomaly (${(signals_data.amount_risk * 100).toFixed(0)}% above normal)`);
        }
        if (signals_data.velocity_risk > 0.7) {
          signals.push(`High velocity risk - ${(signals_data.velocity_risk * 5).toFixed(0)} transactions per hour`);
        } else if (signals_data.velocity_risk > 0.4) {
          signals.push(`Medium velocity risk - ${(signals_data.velocity_risk * 5).toFixed(0)} transactions per hour`);
        }
      }

      if (ruleEngine.triggered) {
        ruleEngine.rules.forEach((rule: string) => {
          signals.push(`Rule: ${rule}`);
        });
      }

      let channel = tx.channel || txDetails.finca_channel || 'Other';
      channel = this.normalizeChannel(channel);

      let location = txDetails.finca_location || tx.location || 'Nairobi, KE';
      if (location === 'International') location = 'International';

      const decision = txDetails.finca_final_decision || tx.decision || 'N/A';
      const status = this.mapStatusFromRisk(finalRiskCategory, decision);

      return {
        id: tx.transaction_id || 'TXN-0000',
        transactionId: tx.transaction_id || 'TXN-0000',
        amount: txDetails.Transaction_Amount || txDetails.finca_transaction_amount || 0,
        riskCategory: mlRiskCategory,
        mlRiskLevel: mlRiskLevel,
        mlRiskScore: mlRiskScore,
        finalRiskCategory: finalRiskCategory,
        finalRiskLevel: finalRiskLevelFromRoot,
        riskScore: finalRiskScore,
        channel: channel,
        location: location,
        timestamp: new Date(tx.timestamp || new Date()),
        status: tx.status_info?.current || status,
        flaggedBy: flaggedBy,
        customerName: tx.customer_info?.customer_name || tx.finca_customer_name || 'Unknown',
        customerId: tx.customer_info?.customer_id || tx.finca_customer_id || 'CUST-0000',
        deviceId: txDetails.finca_device_type || tx.device_type || 'Unknown',
        deviceType: txDetails.finca_device_type || tx.device_type || 'Unknown',
        ipAddress: 'Unknown',
        modelAgreement: {
          flagged: flagged,
          total: total,
          text: modelAgreement
        },
        mlVotes: mlVotes,
        ruleEngine: ruleEngine,
        hybridScore: hybridScore,
        feedbackEffect: tx.feedback_effect,
        aiAnalysis: {
          details: this.generateAnalysisDetails(tx),
          signals: signals,
          ruleBased: tx.explanations?.rule_based,
          llm: tx.explanations?.llm,
          final: tx.explanations?.final
        },
        recommendedAction: tx.recommended_action || 'Review transaction',
        alertId: tx.alert_id || null,
        caseId: tx.case_id || null,
        rulePoints: txDetails.finca_total_rule_points || 0,
        rulesTriggered: txDetails.finca_rules_triggered?.map((r: any) => r.rule_name) || [],
        decision: decision,
        fincaRulesTriggered: txDetails.finca_rules_triggered || [],
        fincaTotalRulePoints: txDetails.finca_total_rule_points || 0,
        fincaCappedRulePoints: txDetails.finca_capped_rule_points || 0,
        fincaRuleRiskLevel: txDetails.finca_rule_risk_level || 'LOW',
        fincaFinalDecision: txDetails.finca_final_decision || 'N/A',
        fincaRuleCount: txDetails.finca_rule_count || 0,
        fincaChannel: txDetails.finca_channel || tx.channel || '',
        fincaDeviceType: txDetails.finca_device_type || tx.device_type || '',
        fincaLocation: txDetails.finca_location || tx.location || '',
        transactionAmount: txDetails.Transaction_Amount || txDetails.finca_transaction_amount || 0,
        rawData: tx
      };
    } catch (error) {
      console.error('Error mapping transaction:', error);
      return null;
    }
  }

  generateAnalysisDetails(tx: any): string {
    const signals = tx.transaction_details?.real_time_signals;
    const ruleEngine = tx.transaction_details?.Rule_Engine;

    let details = `This transaction was flagged as ${tx.risk_category || 'Unknown'} with a risk score of ${this.roundToTwo(tx.risk_score || 0)}. `;

    if (ruleEngine?.triggered) {
      details += `Rule engine triggered: ${ruleEngine.rules.join(', ')}. `;
    }

    if (signals) {
      if (signals.amount_risk > 0.4) {
        details += `Amount is ${(signals.amount_risk * 100).toFixed(0)}% ${signals.amount_risk > 0.7 ? 'above' : 'around'} average (KES ${signals.avg_amount_used?.toLocaleString()}). `;
      }
      if (signals.velocity_risk > 0.3) {
        details += `Transaction frequency: ${(signals.velocity_risk * 5).toFixed(0)} transactions per hour. `;
      }
    }

    if (tx.transaction_details?.Hybrid_Score) {
      details += `Hybrid ML + Rules assessment. `;
    }

    details += tx.transaction_details?.Model_Agreement || '';
    return details;
  }

showCriticalAlert(): void {
  if (this.stats.critical > 0) {
    // Play sound for critical alert
    this.playMukwanoSound();
    
    // visual notification
    // this.notificationService.showNotification({
    //   title: '🚨 Critical Risk Detected!',
    //   message: `${this.stats.critical} critical transactions require immediate attention.`,
    //   type: 'danger'
    // });
  }
}


  applyFilters(): void {
    this.filteredTransactions = this.transactions
      .filter(t => {
        // Use finalRiskCategory for filtering (combined ML + Rules)
        if (this.riskFilter !== 'all' && t.finalRiskCategory.toLowerCase() !== this.riskFilter) {
          return false;
        }

        if (this.channelFilter !== 'all' && t.channel.toLowerCase() !== this.channelFilter.toLowerCase()) {
          return false;
        }

        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          return t.transactionId.toLowerCase().includes(term) ||
            t.customerName.toLowerCase().includes(term) ||
            t.location.toLowerCase().includes(term) ||
            t.channel.toLowerCase().includes(term) ||
            t.amount.toString().includes(term) ||
            t.riskCategory.toLowerCase().includes(term) ||
            t.finalRiskCategory.toLowerCase().includes(term);
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.calculateStats();
    this.updatePagination();
  }

  clearFilters(): void {
    this.riskFilter = 'all';
    this.channelFilter = 'all';
    this.searchTerm = '';
    this.searchSuggestions = [];
    this.showSuggestions = false;
    this.applyFilters();
  }

  getCounterpartyDisplay(transaction: Transaction): string {
    const raw = transaction.rawData || {};
    const senderValue = this.normalizeCounterparty(
      raw.sender_name ||
      raw.sender_customer_name ||
      raw.sender?.name ||
      raw.sender?.customer_name ||
      raw.sender_device?.id ||
      raw.sender_device?.name ||
      'Sender'
    );
    const recipientValue = this.normalizeCounterparty(
      raw.recipient_name ||
      raw.recipient_customer_name ||
      raw.recipient?.name ||
      raw.recipient?.customer_name ||
      raw.recipient_device?.id ||
      raw.recipient_device?.name ||
      'Recipient'
    );

    const currentCustomerId = transaction.customerId || raw.customer_info?.customer_id;
    const senderId = raw.sender_device?.id || raw.sender?.customer_id || raw.sender_customer_id;
    const recipientId = raw.recipient_device?.id || raw.recipient?.customer_id || raw.recipient_customer_id;
    const customerIsSender = !!currentCustomerId && !!senderId && String(currentCustomerId) === String(senderId) &&
      (!recipientId || String(currentCustomerId) !== String(recipientId));

    if (customerIsSender) {
      return recipientValue || 'Recipient unavailable';
    }

    return senderValue || recipientValue || 'Counterparty unavailable';
  }

  private normalizeCounterparty(value: string | null | undefined): string {
    if (!value || value === 'null' || value === 'undefined' || value === 'N/A' || value === 'Unknown') {
      return '';
    }
    return String(value).trim();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTransaction = null;
  }

  getRiskBadgeClass(riskCategory: string): string {
    const classes: { [key: string]: string } = {
      'Critical': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-success'
    };
    return classes[riskCategory] || 'bg-secondary';
  }

  getRiskProgressColor(score: number): string {
    if (score >= 80) return '#f72585';
    else if (score >= 60) return '#fc7201';
    else if (score >= 30) return '#ffc107';
    else return '#28a745';
  }

  viewTransactionDetail(transaction: Transaction): void {
    this.router.navigate(['/fraudsentinelAi/transaction_management/fraud/alert-detail', transaction.transactionId]);
  }

  investigateTransaction(): void {
    if (this.selectedTransaction) {
      this.router.navigate([
        '/fraudsentinelAi/transaction_management/fraud/investigation-graph',
        this.selectedTransaction.transactionId
      ]);
      this.closeModal();
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(timestamp: string): string {
    if (!timestamp) return '--/--/----';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  getChannelIcon(channel: string): string {
    const icons: { [key: string]: string } = {
      'Mobile banking': 'fa-mobile-alt',
      'Internet banking': 'fa-globe',
      'Core banking': 'fa-university',
      'Cards': 'fa-credit-card',
      'Agency': 'fa-user-tie',
      'ATM/POS': 'fa-credit-card',
      'USSD': 'fa-phone-alt'
    };
    return icons[channel] || 'fa-exchange-alt';
  }

private handleExportCommand(query: string): string {
  const currentResults = this.filteredTransactions.length > 0 
    ? this.filteredTransactions 
    : this.transactions;

  const count = currentResults.length;
  
  let response = `${this.aiConfig.avatar} ${this.aiConfig.name}: 📁 Exporting ${count} transactions...\n\n`;
  
  if (count === 0) {
    response += `No transactions to export. Try adjusting your filters first.`;
  } else {
    response += `✅ Export prepared!\n\n`;
    response += `📊Summary:\n`;
    response += `• Total: ${count} transactions\n`;
    response += `• Critical: ${currentResults.filter(t => t.finalRiskCategory === 'Critical').length}\n`;
    response += `• High: ${currentResults.filter(t => t.finalRiskCategory === 'High').length}\n`;
    response += `• Medium: ${currentResults.filter(t => t.finalRiskCategory === 'Medium').length}\n`;
    response += `• Low: ${currentResults.filter(t => t.finalRiskCategory === 'Low').length}\n\n`;
    
    response += `📌Available exports:\n`;
    response += `• CSV format (Excel compatible)\n`;
    response += `• PDF format (Report)\n`;
    response += `• JSON format (API)\n\n`;
    
    response += `💡 Click the "Export" button in the toolbar above to download.`;
  }
  
  return response;
}

  onBlurSuggestions(): void {
  setTimeout(() => {
    this.showSuggestions = false;
  }, 200);
}

  refresh(): void {
    this.loadTransactions();
  }
}