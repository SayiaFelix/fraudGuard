import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CreditDataService } from '../credit-data.service';

type Channel = 'mobile' | 'chatbot';
type JourneyStep = 'welcome' | 'limit-check' | 'explain' | 'apply' | 'success';
type PhoneTab = 'home' | 'loans' | 'cards' | 'profile';

interface ChatMessage {
  sender: 'bot' | 'customer';
  text: string;
  time: string;
}

interface LoanRecommendation {
  name: string;
  amount: number;
  term: number;
  why: string;
}

@Component({
  selector: 'app-credit-scoring',
  templateUrl: './credit-scoring.component.html',
  styleUrls: ['./credit-scoring.component.scss']
})
export class CreditScoringComponent implements OnInit, OnDestroy {
  customer = {
    id: 'CUST-8821',
    name: 'Felix Sayia',
    income: 150000,
    existingDebt: 20000,
    hasDefaulted: false
  };

  previousLoan = {
    product: 'Student Loan',
    amount: 180000,
    status: 'Repaid on time',
    closed: 'Mar 2026'
  };

  recommendations: LoanRecommendation[] = [
    {
      name: 'Professional Development Loan',
      amount: 80000,
      term: 12,
      why: 'The last facility was a student loan, repaid in full and on time. Education credit that closed cleanly is why the next offer is a follow-on loan for a certification or further study.'
    },
    {
      name: 'Career Starter Loan',
      amount: 50000,
      term: 12,
      why: 'A repaid student loan plus verified income of Ksh 150,000 points to the move from study into work. This amount stays inside the limit that income already supports.'
    },
    {
      name: 'Graduate Equipment Loan',
      amount: 45000,
      term: 6,
      why: 'Customers who finish a student loan often need a laptop or tools before the first salary cycle. The clean close on the student facility is why a short equipment loan sits next to it.'
    }
  ];

  selectedRecommendation: LoanRecommendation | null = null;

  channel: Channel = 'mobile';
  phoneTab: PhoneTab = 'home';
  journeyStep: JourneyStep = 'welcome'; 
  isProcessing = false;

  requestedAmount = 50000;
  loanTermMonths = 12;
  annualInterestRate = 18;
  
  showWhatIf = false;
  whatIfIncome = 150000;
  whatIfDebt = 20000;

  applicationRef = '';
  phoneTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  phoneScale = 1;

  chatInput = '';
  chatMessages: ChatMessage[] = [];
  isBotTyping = false;

  private sub = new Subscription();
  private clock?: ReturnType<typeof setInterval>;

  constructor(public credit: CreditDataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.whatIfIncome = this.customer.income;
    this.whatIfDebt = this.customer.existingDebt;
    this.resetChat();
    this.clock = setInterval(() => {
      this.phoneTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }, 1000);
    this.fitPhone();
    window.addEventListener('resize', this.fitPhone);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.clock) clearInterval(this.clock);
    window.removeEventListener('resize', this.fitPhone);
  }

  private fitPhone = () => {
    const available = window.innerHeight - 348;
    this.phoneScale = Math.min(1, Math.max(0.68, available / 820));
  };

  calculateAssessment(income = this.customer.income, debt = this.customer.existingDebt) {
    let score = 500;
    if (income >= 100000) score += 150;
    else if (income >= 50000) score += 100;
    if (!this.customer.hasDefaulted) score += 100;
    if (debt <= income * 0.15) score += 50;

    let riskCategory = 'High';
    if (score >= 700) riskCategory = 'Low';
    else if (score >= 600) riskCategory = 'Medium';

    const monthlyRate = this.annualInterestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, this.loanTermMonths);
    const repaymentFactor = monthlyRate === 0 ? 1 / this.loanTermMonths : (monthlyRate * factor) / (factor - 1);
    
    const monthlyRepayment = this.requestedAmount * repaymentFactor;
    const dti = ((debt + monthlyRepayment) / income) * 100;

    const availableForRepayment = Math.max(0, income * 0.4 - debt);
    const maxLimit = Math.floor((availableForRepayment / repaymentFactor) / 1000) * 1000;

    let outcome: 'eligible' | 'review' | 'declined' = 'declined';
    let reason = '';
    let nextAction = '';
    let policyChecks: { label: string, passed: boolean }[] = [];

    policyChecks.push({ label: `Minimum Score (650)`, passed: score >= 650 });
    policyChecks.push({ label: `Max DTI (40%)`, passed: dti <= 40 });
    policyChecks.push({ label: `Within Max Limit (${this.money(maxLimit)})`, passed: this.requestedAmount <= maxLimit });
    policyChecks.push({ label: `No prior default`, passed: !this.customer.hasDefaulted });
    policyChecks.push({ label: `Debt within 15% of income`, passed: debt <= income * 0.15 });

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

  get activeRecommendation(): LoanRecommendation {
    return this.selectedRecommendation || this.recommendations[0];
  }

  get whatIfAssessment() {
    return this.calculateAssessment(this.whatIfIncome, this.whatIfDebt);
  }

  get limitReasons(): { title: string; value: string; detail: string }[] {
    const a = this.assessment;
    const income = this.money(this.customer.income);
    const debt = this.money(this.customer.existingDebt);
    const dti = a.dti.toFixed(1);
    return [
      {
        title: 'Credit score',
        value: `${a.score} / 850`,
        detail: a.score >= 650
          ? `A score of ${a.score} is in the ${a.riskCategory.toLowerCase()} risk band and clears the 650 line, so the offer is not held back by score.`
          : `A score of ${a.score} is under the 650 line, so the limit stays lower until the score improves.`
      },
      {
        title: 'Verified monthly income',
        value: income,
        detail: `The limit is built from ${income} of verified income. Only income the bank can confirm is used to size a comfortable repayment.`
      },
      {
        title: 'Existing monthly debt',
        value: debt,
        detail: `${debt} is already committed each month. That amount is reserved before any new loan repayment is added.`
      },
      {
        title: 'Debt-to-income ratio',
        value: `${dti}%`,
        detail: a.dti <= 40
          ? `At ${dti}%, total obligations stay inside the 40% ceiling. That is the rule that lets this limit through.`
          : `At ${dti}%, total obligations are above the 40% ceiling, so the limit is cut until the ratio comes back down.`
      },
      {
        title: 'Repayment history',
        value: this.customer.hasDefaulted ? 'Prior default' : 'No defaults',
        detail: this.customer.hasDefaulted
          ? 'A previous default is on record, which reduces how far the limit can go until a clean period is established.'
          : 'There is no default on record. A clean history is one of the reasons this limit is available.'
      }
    ];
  }

  get limitBoosts(): { title: string; detail: string }[] {
    return [
      {
        title: 'Increase verified income',
        detail: 'A higher confirmed income lifts the 40% repayment budget. The same rule then supports a larger principal.'
      },
      {
        title: 'Reduce existing monthly debt',
        detail: 'Every shilling of debt you clear is freed for a new repayment, which raises the ceiling before the 40% cap is reached.'
      },
      {
        title: 'Keep a clean repayment record',
        detail: 'Paying this loan and any existing facilities on time is what keeps the score in the band that can unlock a higher limit later.'
      }
    ];
  }

  openPhoneTab(tab: PhoneTab): void {
    this.phoneTab = tab;
    if (tab === 'loans' && this.journeyStep === 'welcome' && !this.isProcessing) {
      this.startJourney();
    }
  }

  chooseRecommendation(rec: LoanRecommendation): void {
    this.selectedRecommendation = rec;
    this.loanTermMonths = rec.term;
    const ceiling = this.calculateAssessment().maxLimit;
    this.requestedAmount = Math.min(rec.amount, ceiling);
    this.startJourney();
  }

  startJourney() {
    this.phoneTab = 'loans';
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.journeyStep = 'limit-check';
    }, 1200);
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
    }, 1500);
  }

  resetJourney() {
    this.journeyStep = 'welcome';
    this.requestedAmount = 50000;
    this.showWhatIf = false;
    this.whatIfIncome = this.customer.income;
    this.whatIfDebt = this.customer.existingDebt;
    this.applicationRef = '';
    this.selectedRecommendation = null;
    this.loanTermMonths = 12;
    this.phoneTab = 'home';
    this.resetChat();
  }

  applyWhatIf() {
    this.customer.income = this.whatIfIncome;
    this.customer.existingDebt = this.whatIfDebt;
    this.showWhatIf = false;
  }

  resetChat() {
    this.chatMessages = [{
      sender: 'bot',
      text: `Hello Felix. I'm Leo. Your <b>${this.previousLoan.product}</b> of <b>${this.money(this.previousLoan.amount)}</b> closed on time in ${this.previousLoan.closed}. Because of that, I recommend a <b>${this.recommendations[0].name}</b> of <b>${this.money(this.recommendations[0].amount)}</b>. Ask me why, or say apply.`,
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

    if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('student')) {
      reply = this.recommendReply();
    }
    else if (lower === 'yes' || lower === 'yeah' || lower === 'sure' || lower.includes('increase') || lower.includes('more') || lower.includes('qualify')) {
      reply = this.boostReply();
    }
    else if (lower === 'no' || lower === 'nope') {
      reply = `Understood. If you change your mind, you can always ask me to explain your limit or help you apply for a loan.`;
    }
    else if (lower.includes('why') || lower.includes('explain')) {
      reply = lower.includes('limit') ? this.reasonsReply() : this.recommendReply();
    }
    else if (lower.includes('limit') || lower.includes('how much')) {
      reply = `Your indicative maximum limit is <b>${this.money(a.maxLimit)}</b>.<br><br>` +
              `It comes from five checks: your score of <b>${a.score}</b>, verified income of <b>${this.money(this.customer.income)}</b>, existing debt of <b>${this.money(this.customer.existingDebt)}</b>, a debt-to-income ratio of <b>${a.dti.toFixed(1)}%</b>, and ${this.customer.hasDefaulted ? 'a prior default on record' : 'a clean repayment history'}.<br><br>` +
              `Ask me <b>why this limit</b> for the full explanation, or <b>how to increase it</b> for three ways to qualify for more.`;
    }
    else if (lower.includes('apply')) {
      if (this.applicationRef) {
        reply = `You already have a pending application: <b>${this.applicationRef}</b>. You can track its status anytime.`;
      } else {
        if (!this.selectedRecommendation) {
          this.loanTermMonths = this.activeRecommendation.term;
          this.requestedAmount = Math.min(this.activeRecommendation.amount, this.calculateAssessment().maxLimit);
        }
        const offer = this.activeRecommendation;
        const priced = this.assessment;
        reply = `I can start <b>${offer.name}</b> from here.<br><br>` +
                `${offer.why}<br><br>` +
                `• Amount: <b>${this.money(this.requestedAmount)}</b><br>` +
                `• Term: <b>${this.loanTermMonths} Months</b><br>` +
                `• Est. Monthly Repayment: <b>${this.money(priced.monthlyRepayment)}</b><br><br>` +
                `Shall I submit this application? Reply <b>"Confirm"</b> to proceed.`;
      }
    }
    else if (lower === 'confirm' || lower === 'proceed') {
      if (!this.selectedRecommendation) {
        this.loanTermMonths = this.activeRecommendation.term;
        this.requestedAmount = Math.min(this.activeRecommendation.amount, this.calculateAssessment().maxLimit);
        this.selectedRecommendation = this.activeRecommendation;
      }
      this.isProcessing = true; 
      setTimeout(() => {
        this.isProcessing = false;
        this.applicationRef = 'DEMO-' + Math.floor(Math.random() * 900000 + 100000);
        this.journeyStep = 'success';
        
        this.addBotMessage(
          `🎉 <b>Application Submitted Successfully!</b><br><br>` +
          `• Product: <b>${this.activeRecommendation.name}</b><br>` +
          `• Reference: <b>${this.applicationRef}</b><br>` +
          `• Amount: <b>${this.money(this.requestedAmount)}</b><br>` +
          `• Status: <b>Pending Disbursement</b><br><br>` +
          `You can view your new limit and application details by clicking the "Mobile Banking" tab.`
        );
      }, 1500);
      return; 
    }
    else if (lower.includes('status') || lower.includes('track')) {
      reply = this.applicationRef 
        ? `Your application <b>${this.applicationRef}</b> is currently in status: <b>Pending Disbursement</b>.`
        : `You haven't submitted an application yet. Ask me to "Apply" to get started.`;
    }
    else {
      reply = `I can recommend a loan from your student-loan history, explain why, check your limit, or apply right here in chat. What would you like to do?`;
    }

    this.addBotMessage(reply);
  }

  private recommendReply(): string {
    const lines = this.recommendations
      .map(rec => `• <b>${rec.name} — ${this.money(rec.amount)}, ${rec.term} months.</b> ${rec.why}`)
      .join('<br>');
    return `Your last facility was a <b>${this.previousLoan.product}</b> of <b>${this.money(this.previousLoan.amount)}</b>, ${this.previousLoan.status.toLowerCase()} in ${this.previousLoan.closed}. These are the loans matched to that history:<br><br>${lines}<br><br>Say <b>apply</b> and I will start the ${this.activeRecommendation.name}.`;
  }

  private reasonsReply(): string {
    const lines = this.limitReasons
      .map(reason => `• <b>${reason.title} — ${reason.value}.</b> ${reason.detail}`)
      .join('<br>');
    return `Your indicative limit is <b>${this.money(this.assessment.maxLimit)}</b>. These are the five reasons behind it:<br><br>${lines}<br><br>I can also show you three ways to increase this limit.`;
  }

  private boostReply(): string {
    const lines = this.limitBoosts
      .map(boost => `• <b>${boost.title}.</b> ${boost.detail}`)
      .join('<br>');
    return `Three ways to increase this limit:<br><br>${lines}<br><br>On the Mobile Banking tab, open Loans and use <b>How can I increase my limit?</b> to try a higher income or a lower debt and see the new ceiling.`;
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