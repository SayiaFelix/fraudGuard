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

    // Determine Risk Category
    let riskCategory = 'High';
    if (score >= 700) riskCategory = 'Low';
    else if (score >= 600) riskCategory = 'Medium';

    // 2. Calculate Repayment & DTI
    const monthlyRate = this.annualInterestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, this.loanTermMonths);
    const repaymentFactor = monthlyRate === 0 ? 1 / this.loanTermMonths : (monthlyRate * factor) / (factor - 1);
    
    const monthlyRepayment = this.requestedAmount * repaymentFactor;
    const dti = ((debt + monthlyRepayment) / income) * 100;

    // 3. Affordability & Max Limit
    const availableForRepayment = Math.max(0, income * 0.4 - debt);
    const maxLimit = Math.floor((availableForRepayment / repaymentFactor) / 1000) * 1000;

    // 4. Decision & Next Action (AI Insights)
    let outcome: 'eligible' | 'review' | 'declined' = 'declined';
    let reason = '';
    let nextAction = '';
    let policyChecks: { label: string, passed: boolean }[] = [];

    // Policy Checks
    policyChecks.push({ label: `Minimum Score (650)`, passed: score >= 650 });
    policyChecks.push({ label: `Max DTI (40%)`, passed: dti <= 40 });
    policyChecks.push({ label: `Within Max Limit (${this.money(maxLimit)})`, passed: this.requestedAmount <= maxLimit });

    if (score >= 650 && dti <= 40 && this.requestedAmount <= maxLimit) {
      outcome = 'eligible';
      reason = 'Your income and credit score comfortably support this repayment.';
      nextAction = 'Proceed to final loan agreement and disbursement setup.';
    } else if (score >= 550 && dti <= 50) {
      outcome = 'review';
      reason = 'Your debt-to-income ratio is slightly high. A credit officer will review this.';
      nextAction = 'Request 3 months of bank statements to verify income consistency.';
    } else {
      outcome = 'declined';
      reason = this.requestedAmount > maxLimit 
        ? `The requested amount exceeds your maximum limit of ${this.money(maxLimit)}.`
        : 'Your profile does not meet our minimum criteria at this time.';
      nextAction = 'Suggest a lower loan amount or request a co-signer.';
    }

    return { 
      score, dti, monthlyRepayment, maxLimit, outcome, reason, 
      riskCategory, nextAction, policyChecks 
    };
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
    this.applicationRef = ''; // Reset application so you can demo again
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
    const lower = prompt.toLowerCase().trim();
    const a = this.assessment;
    let reply = '';

    // 1. Handle Follow-up Confirmations
    if (lower === 'yes' || lower === 'yeah' || lower === 'sure') {
      reply = `Great! To increase your limit, you could:<br><br>` +
              `• Reduce your existing monthly debt (currently <b>${this.money(this.customer.existingDebt)}</b>).<br>` +
              `• Increase your verified income.<br>` +
              `• Maintain a clean repayment history.<br><br>` +
              `You can also try our <b>What-If Simulator</b> on the Mobile App to see exactly how paying off your car loan might increase your limit!`;
    }
    else if (lower === 'no' || lower === 'nope') {
      reply = `Understood. If you change your mind, you can always ask me to explain your limit or help you apply for a loan.`;
    }
    // 2. Limit Queries
    else if (lower.includes('limit') || lower.includes('how much')) {
      reply = `Your indicative maximum limit is <b>${this.money(a.maxLimit)}</b>.<br><br>` +
              `This is calculated based on your income of <b>${this.money(this.customer.income)}</b> and existing monthly obligations of <b>${this.money(this.customer.existingDebt)}</b>.`;
    } 
    // 3. Explainability Queries
    else if (lower.includes('why') || lower.includes('explain')) {
      const passedChecks = a.policyChecks.filter(c => c.passed).length;
      const failedChecks = a.policyChecks.filter(c => !c.passed).map(c => c.label).join(', ');
      
      reply = `Here is the detailed breakdown of your assessment, Felix:<br><br>` +
              `📊 <b>Financial Health</b><br>` +
              `• Credit Score: <b>${a.score}</b> (${a.riskCategory} Risk)<br>` +
              `• Debt-to-Income (DTI): <b>${a.dti.toFixed(1)}%</b> (Max allowed: 40%)<br>` +
              `• Passed <b>${passedChecks} of 3</b> automated policy checks.<br><br>` +
              `🛡️ <b>Policy Engine</b><br>` +
              (failedChecks ? `• The limiting factor was: <b>${failedChecks}</b>.<br><br>` : `• All policy thresholds were successfully met.<br><br>`) +
              `🤖 <b>AI Next Action</b><br>` +
              `• <b>${a.nextAction}</b><br><br>` +
              `Would you like to explore how to increase this limit?`;
    }
    // 4. CHATBOT APPLICATION FLOW
    else if (lower.includes('apply')) {
      if (this.applicationRef) {
        reply = `You already have a pending application: <b>${this.applicationRef}</b>. You can track its status anytime.`;
      } else {
        // Capture the intent and confirm the terms right in the chat!
        reply = `I can process that for you right now.<br><br>` +
                `Based on your limit, here are the demo terms:<br>` +
                `• Amount: <b>${this.money(this.requestedAmount)}</b><br>` +
                `• Term: <b>${this.loanTermMonths} Months</b><br>` +
                `• Est. Monthly Repayment: <b>${this.money(a.monthlyRepayment)}</b><br><br>` +
                `Shall I submit this application? Reply <b>"Confirm"</b> to proceed.`;
      }
    }
    // 5. HANDLE CONFIRMATION FROM CHAT
    else if (lower === 'confirm' || lower === 'proceed') {
      this.isProcessing = true; // Trigger loading state
      setTimeout(() => {
        this.isProcessing = false;
        this.applicationRef = 'DEMO-' + Math.floor(Math.random() * 900000 + 100000);
        
        // Auto-switch the view to success (optional, but good for demo)
        this.journeyStep = 'success';
        
        this.addBotMessage(
          `🎉 <b>Application Submitted Successfully!</b><br><br>` +
          `• Reference: <b>${this.applicationRef}</b><br>` +
          `• Amount: <b>${this.money(this.requestedAmount)}</b><br>` +
          `• Status: <b>Pending Disbursement</b><br><br>` +
          `You can view your new limit and application details by clicking the "Mobile Banking" tab.`
        );
      }, 1500);
      return; // Exit here because we handle the response inside the setTimeout
    }
    else if (lower.includes('status') || lower.includes('track')) {
      reply = this.applicationRef 
        ? `Your application <b>${this.applicationRef}</b> is currently in status: <b>Pending Disbursement</b>.`
        : `You haven't submitted an application yet. Ask me to "Apply" to get started.`;
    }
    // 6. Fallback
    else {
      reply = `I can help you check your limit, explain how it's calculated, show you how to qualify for more, or apply for a loan right here in chat. What would you like to do?`;
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