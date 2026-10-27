import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CreditDataService } from '../credit-data.service';

type Channel = 'mobile' | 'chatbot';
type JourneyStep = 'welcome' | 'limit-check' | 'explain' | 'apply' | 'success';

interface ChatMessage {
  sender: 'bot' | 'customer';
  text: string;
  time: string;
}

@Component({
  selector: 'app-credit-scoring',
  templateUrl: './credit-scoring.component.html',
  styleUrls: ['./credit-scoring.component.scss']
})
export class CreditScoringComponent implements OnInit, OnDestroy {
  // Customer profile (The "Source of Truth" for the demo)
  customer = {
    id: 'CUST-8821',
    name: 'Felix Sayia',
    income: 150000,
    existingDebt: 20000,
    hasDefaulted: false
  };

  // Journey State
  channel: Channel = 'mobile';
  journeyStep: JourneyStep = 'welcome'; 
  isProcessing = false;

  // Loan Parameters
  requestedAmount = 50000;
  loanTermMonths = 12;
  annualInterestRate = 18;
  
  // What-If State
  showWhatIf = false;
  whatIfIncome = 150000;
  whatIfDebt = 20000;

  // Application State
  applicationRef = '';

  // Chat State
  chatInput = '';
  chatMessages: ChatMessage[] = [];
  isBotTyping = false;

  private sub = new Subscription();

  constructor(public credit: CreditDataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // In a real app, fetch this by ID. Here we hardcode Felix for the demo.
    this.whatIfIncome = this.customer.income;
    this.whatIfDebt = this.customer.existingDebt;
    this.resetChat();
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  // --- CORE ENGINE (Shared by Mobile & Chat) ---
  calculateAssessment(income = this.customer.income, debt = this.customer.existingDebt) {
    // 1. Calculate Score
    let score = 500;
    if (income >= 100000) score += 150;
    else if (income >= 50000) score += 100;
    if (!this.customer.hasDefaulted) score += 100;
    if (debt <= income * 0.15) score += 50;

    // 2. Calculate Repayment & DTI
    const monthlyRate = this.annualInterestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, this.loanTermMonths);
    const repaymentFactor = monthlyRate === 0 ? 1 / this.loanTermMonths : (monthlyRate * factor) / (factor - 1);
    
    const monthlyRepayment = this.requestedAmount * repaymentFactor;
    const dti = ((debt + monthlyRepayment) / income) * 100;

    // 3. Affordability & Max Limit
    const availableForRepayment = Math.max(0, income * 0.4 - debt);
    const maxLimit = Math.floor((availableForRepayment / repaymentFactor) / 1000) * 1000;

    // 4. Decision
    let outcome: 'eligible' | 'review' | 'declined' = 'declined';
    let reason = '';

    if (score >= 650 && dti <= 40 && this.requestedAmount <= maxLimit) {
      outcome = 'eligible';
      reason = 'Your income and credit score comfortably support this repayment.';
    } else if (score >= 550 && dti <= 50) {
      outcome = 'review';
      reason = 'Your debt-to-income ratio is slightly high. A credit officer will review this.';
    } else {
      outcome = 'declined';
      reason = this.requestedAmount > maxLimit 
        ? `The requested amount exceeds your maximum limit of ${this.money(maxLimit)}.`
        : 'Your profile does not meet our minimum criteria at this time.';
    }

    return { score, dti, monthlyRepayment, maxLimit, outcome, reason };
  }

  get assessment() {
    return this.calculateAssessment();
  }

  get whatIfAssessment() {
    return this.calculateAssessment(this.whatIfIncome, this.whatIfDebt);
  }

  // --- MOBILE APP JOURNEY ACTIONS ---
  startJourney() {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.journeyStep = 'limit-check';
    }, 1200);
  }

  exploreImprovements() {
    this.journeyStep = 'explain';
  }

  proceedToApply() {
    this.journeyStep = 'apply';
  }

  submitApplication() {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.applicationRef = 'DEMO-' + Math.floor(Math.random() * 900000 + 100000);
      this.journeyStep = 'success';
      
      // Auto-notify the chatbot
      if (this.channel === 'chatbot') {
        this.addBotMessage(`Your application has been submitted! Reference: ${this.applicationRef}. You can track its status here.`);
      }
    }, 1500);
  }

  resetJourney() {
    this.journeyStep = 'welcome';
    this.requestedAmount = 50000;
    this.showWhatIf = false;
    this.whatIfIncome = this.customer.income;
    this.whatIfDebt = this.customer.existingDebt;
    this.resetChat();
  }

  applyWhatIf() {
    this.customer.income = this.whatIfIncome;
    this.customer.existingDebt = this.whatIfDebt;
    this.showWhatIf = false;
  }

  // --- CHATBOT ACTIONS ---
  resetChat() {
    this.chatMessages = [{
      sender: 'bot',
      text: `Hello Felix! 👋 I'm Leo, your UBA Smart Loan Assistant. Based on your profile, you have an indicative limit of ${this.money(this.assessment.maxLimit)}. How can I help you today?`,
      time: this.now()
    }];
  }

  sendQuickReply(text: string) {
    this.chatInput = text;
    this.sendChatMessage();
  }

  sendChatMessage() {
    if (!this.chatInput.trim() || this.isBotTyping) return;

    this.chatMessages.push({ sender: 'customer', text: this.chatInput, time: this.now() });
    this.chatInput = '';
    this.isBotTyping = true;
    this.scrollToChatBottom();

    setTimeout(() => {
      this.isBotTyping = false;
      this.processBotResponse(this.chatMessages[this.chatMessages.length - 1].text);
      this.scrollToChatBottom();
    }, 1500);
  }

  private processBotResponse(prompt: string) {
    const lower = prompt.toLowerCase();
    const a = this.assessment;
    let reply = '';

    if (lower.includes('limit') || lower.includes('how much')) {
      reply = `Your indicative maximum limit is ${this.money(a.maxLimit)}.\n\nThis is based on your income of ${this.money(this.customer.income)} and existing monthly obligations of ${this.money(this.customer.existingDebt)}.`;
    } 
    else if (lower.includes('why') || lower.includes('explain')) {
      reply = `Your limit is calculated using our Affordability Model. We reserve 40% of your income for debt repayment (${this.money(this.customer.income * 0.4)}). After subtracting your existing debt (${this.money(this.customer.existingDebt)}), you have ${this.money(this.customer.income * 0.4 - this.customer.existingDebt)} available. We then factor in the 18% interest rate to give you your max limit.`;
    }
    else if (lower.includes('improve') || lower.includes('more')) {
      reply = `To increase your limit, you could:\n1. Reduce your existing monthly debt.\n2. Increase your verified income.\n3. Maintain a clean repayment history.\n\nYou can also try our What-If Simulator on the Mobile App to see how paying off your car loan might increase your limit!`;
    }
    else if (lower.includes('apply')) {
      reply = `You can apply for up to ${this.money(a.maxLimit)}. To submit a formal application, please switch to the Mobile Banking tab to review terms and confirm.`;
    }
    else if (lower.includes('status') || lower.includes('track')) {
      reply = this.applicationRef 
        ? `Your application ${this.applicationRef} is currently in status: Pending Disbursement.`
        : `You haven't submitted an application yet. Ask me to "Apply" to get started.`;
    }
    else {
      reply = `I can help you check your limit, explain how it's calculated, show you how to qualify for more, or track an application. What would you like to know?`;
    }

    this.addBotMessage(reply);
  }

  private addBotMessage(text: string) {
    this.chatMessages.push({ sender: 'bot', text, time: this.now() });
    this.cdr.detectChanges();
    this.scrollToChatBottom();
  }

  private now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  private scrollToChatBottom() { setTimeout(() => { const el = document.getElementById('chat-scroll'); if (el) el.scrollTop = el.scrollHeight; }, 50); }
  money(val: number) { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val || 0); }
}