import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PRODUCTS } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

type Channel = 'mobile' | 'chatbot';
type JourneyStep = 'welcome' | 'limit-check' | 'explain' | 'apply' | 'success';
type PhoneTab = 'home' | 'offers' | 'loans' | 'cards' | 'profile';

interface ChatMessage {
  sender: 'bot' | 'customer';
  text: string;
  time: string;
}

interface LoanRecommendation {
  name: string;
  amount: number;
  term: number;
  points: string[];
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
    product: 'School Fees',
    amount: 180000,
    status: 'Repaid on time',
    closed: 'Mar 2026'
  };

  /** Same six products as the credit book. Amounts and tenors stay inside each product's demo range. */
  bookLoans: LoanRecommendation[] = PRODUCTS.map(name => ({ name, ...this.loanTerms(name) }));

  /** Offers matched to the closed School Fees facility. The rest of the book stays available in chat. */
  recommendations: LoanRecommendation[] = ['School Fees', 'Device Finance', 'Personal Loan']
    .map(name => this.bookLoans.find(loan => loan.name === name)!);

  selectedOffer: LoanRecommendation | null = null;
  offerReady = false;
  quickReplies: string[] = [];

  get loanChoices(): LoanRecommendation[] {
    return this.bookLoans;
  }

  private loanTerms(name: string): { amount: number; term: number; points: string[] } {
    switch (name) {
      case 'School Fees':
        return {
          amount: 80000,
          term: 12,
          points: [
            'Last facility was School Fees',
            'Repaid in full and on time',
            'Next offer is another fees cycle'
          ]
        };
      case 'Device Finance':
        return {
          amount: 45000,
          term: 6,
          points: [
            'School Fees closed cleanly',
            'Fits a phone, laptop, or other device',
            'Related purchase after school fees'
          ]
        };
      case 'Personal Loan':
        return {
          amount: 50000,
          term: 12,
          points: [
            'School Fees was repaid on time',
            'For costs that are not the next term',
            'General facility inside the limit'
          ]
        };
      case 'Salary Advance':
        return {
          amount: 30000,
          term: 1,
          points: [
            'Salaried income is on file',
            'Advance covers one month only',
            'Separate from the next school term'
          ]
        };
      case 'SME Working Capital':
        return {
          amount: 120000,
          term: 12,
          points: [
            'For business income, not school fees',
            'Working capital over 12 months',
            'Use it when the need is the business'
          ]
        };
      case 'Asset Finance':
        return {
          amount: 150000,
          term: 12,
          points: [
            'For equipment or a vehicle',
            'Larger than a phone or laptop',
            'Sits beside Device Finance'
          ]
        };
      default:
        return { amount: 50000, term: 12, points: ['This product is on the credit book'] };
    }
  }

  whyText(offer: LoanRecommendation): string {
    return offer.points.join('. ') + '.';
  }

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
    return this.selectedOffer || this.recommendations[0];
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
      this.selectedOffer = null;
      this.requestedAmount = 50000;
      this.loanTermMonths = 12;
      this.startJourney();
    }
  }

  startPersonalJourney(): void {
    this.selectedOffer = null;
    this.requestedAmount = 50000;
    this.loanTermMonths = 12;
    this.startJourney();
  }

  chooseRecommendation(rec: LoanRecommendation): void {
    this.stageOffer(rec);
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
    this.selectedOffer = null;
    this.offerReady = false;
    this.quickReplies = [];
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
      text: `Hello Felix. I am Leo, your loan assistant. How may I help you?`,
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
    const named = this.findNamedProduct(lower);
    const wantsApply = /\b(apply|application|i want a loan|i need a loan|get a loan|take a loan)\b/.test(lower);
    const wantsDifferent = /different|another loan|something else|other loan|not that|not this|any loan|whatever|choose another/.test(lower);
    const chat = this.smallTalk(lower);
    this.quickReplies = [];
    let reply = '';

    if (named && !wantsApply && (lower.includes('why') || lower.includes('explain'))) {
      reply = this.explainProduct(named);
    }
    else if (named) {
      reply = this.prepareOffer(named);
    }
    else if (lower.includes('recommended') && wantsApply) {
      reply = this.prepareOffer(this.recommendations[0]);
    }
    else if (wantsApply || wantsDifferent) {
      reply = this.loanMenu();
    }
    else if (lower.includes('recommend') || lower.includes('suggest')) {
      reply = this.recommendReply();
    }
    else if (lower.includes('increase') || lower.includes('qualify') || lower.includes('boost')) {
      reply = this.boostReply();
    }
    else if (lower === 'no' || lower === 'nope') {
      reply = `Understood.`;
    }
    else if (lower.includes('why') || lower.includes('explain')) {
      reply = lower.includes('limit') || lower.includes('score')
        ? this.reasonsReply()
        : `Are you asking about your limit, or about a specific loan?`;
    }
    else if (lower.includes('limit') || lower.includes('how much') || lower.includes('afford')) {
      reply = this.limitReply(a);
    }
    else if (lower === 'yes' || lower === 'yeah' || lower === 'sure') {
      if (this.offerReady) {
        this.confirmOffer();
        return;
      }
      reply = this.loanMenu();
    }
    else if (lower === 'confirm' || lower === 'proceed' || lower === 'submit') {
      if (!this.selectedOffer) {
        reply = this.loanMenu();
      } else {
        this.confirmOffer();
        return;
      }
    }
    else if (lower.includes('status') || lower.includes('track') || lower.includes('reference')) {
      reply = this.applicationRef && this.selectedOffer
        ? `Application <b>${this.applicationRef}</b> for <b>${this.selectedOffer.name}</b> is pending disbursement. The amount is <b>${this.money(this.requestedAmount)}</b>.`
        : `There is no application on file.`;
    }
    else if (chat) {
      reply = chat;
    }
    else {
      reply = `I can check your limit, recommend a loan, or prepare an application. Which do you need?`;
    }

    this.addBotMessage(reply);
  }

  private stageOffer(offer: LoanRecommendation): void {
    this.selectedOffer = offer;
    this.loanTermMonths = offer.term;
    const ceiling = this.calculateAssessment().maxLimit;
    this.requestedAmount = Math.min(offer.amount, ceiling);
  }

  private confirmOffer(): void {
    const offer = this.selectedOffer;
    if (!offer) return;
    this.stageOffer(offer);
    this.offerReady = false;
    this.quickReplies = [];
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.applicationRef = 'DEMO-' + Math.floor(Math.random() * 900000 + 100000);
      this.journeyStep = 'success';
      this.addBotMessage(
        `Your <b>${offer.name}</b> application has been submitted.<br><br>` +
        `Reference: <b>${this.applicationRef}</b><br>` +
        `Amount: <b>${this.money(this.requestedAmount)}</b><br>` +
        `Term: <b>${this.termLabel(this.loanTermMonths)}</b><br>` +
        `Status: pending disbursement.`
      );
    }, 1500);
  }

  private prepareOffer(offer: LoanRecommendation): string {
    this.stageOffer(offer);
    this.offerReady = true;
    this.quickReplies = ['Confirm', 'Choose another loan'];
    const priced = this.assessment;
    return `<b>${offer.name}</b><br>` +
      `Amount: <b>${this.money(this.requestedAmount)}</b><br>` +
      `Term: <b>${this.termLabel(this.loanTermMonths)}</b><br>` +
      `Estimated monthly repayment: <b>${this.money(priced.monthlyRepayment)}</b><br><br>` +
      `Confirm if you want to submit this application.`;
  }

  private explainProduct(offer: LoanRecommendation): string {
    this.quickReplies = [`Apply for ${offer.name}`];
    const lines = offer.points.map(point => `• ${point}`).join('<br>');
    return `<b>${offer.name}</b> is available at <b>${this.money(offer.amount)}</b> over ${this.termLabel(offer.term)}.<br><br>${lines}`;
  }

  private limitReply(a: { maxLimit: number; score: number; dti: number }): string {
    return `Your indicative limit is <b>${this.money(a.maxLimit)}</b>.<br><br>` +
      `• Credit score: <b>${a.score}</b><br>` +
      `• Verified income: <b>${this.money(this.customer.income)}</b><br>` +
      `• Existing monthly debt: <b>${this.money(this.customer.existingDebt)}</b><br>` +
      `• Debt-to-income ratio: <b>${a.dti.toFixed(1)}%</b><br>` +
      `• Repayment history: <b>${this.customer.hasDefaulted ? 'Prior default' : 'No defaults'}</b>`;
  }

  private findNamedProduct(lower: string): LoanRecommendation | null {
    const catalog = [
      { name: 'Salary Advance', keys: ['salary', 'advance'] },
      { name: 'SME Working Capital', keys: ['working capital', 'sme', 'business'] },
      { name: 'School Fees', keys: ['school', 'fees', 'college', 'student'] },
      { name: 'Device Finance', keys: ['device', 'laptop', 'phone'] },
      { name: 'Asset Finance', keys: ['asset', 'vehicle', 'equipment'] },
      { name: 'Personal Loan', keys: ['personal'] }
    ];
    const chosen = catalog.find(item =>
      item.keys.some(key => lower.includes(key)) && !this.productRejected(lower, item.keys)
    );
    return chosen ? this.bookLoans.find(loan => loan.name === chosen.name) || null : null;
  }

  private productRejected(lower: string, keys: string[]): boolean {
    return keys.some(key => {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b(not|no|don't|dont|do not|without)\\b(?:\\W+\\w+){0,4}\\W+${escaped}\\b`).test(lower);
    });
  }

  private loanMenu(): string {
    this.quickReplies = this.bookLoans.map(loan => loan.name);
    return `What type of loan would you like?`;
  }

  private smallTalk(lower: string): string | null {
    if (/^(hi|hello|hey|hiya|good morning|good afternoon|good evening)\b/.test(lower)) {
      return `Hello Felix. How may I help you?`;
    }
    if (lower.includes('how are you') || lower.includes("how's it going") || lower.includes('how are u')) {
      return `I am available. How may I help you?`;
    }
    if (lower.includes('thank')) {
      return `You are welcome.`;
    }
    if (lower.includes('who are you') || lower.includes('your name') || lower.includes('what are you')) {
      return `I am Leo, the loan assistant for this account.`;
    }
    if (lower.includes('what can you') || lower === 'help' || lower.includes('help me')) {
      return `I can check your limit, recommend a loan, or prepare an application.`;
    }
    if (/\b(bye|goodbye|see you)\b/.test(lower)) {
      return `Goodbye, Felix.`;
    }
    if (lower.includes('joke') || lower.includes('weather')) {
      return `I can help with your limit, a recommendation, or an application.`;
    }
    if (lower.includes('my name') || lower.includes('who am i')) {
      return `This account is held by <b>${this.customer.name}</b>, <b>${this.customer.id}</b>.`;
    }
    if (lower.includes('how old') || lower.includes('where are you')) {
      return `I am the loan assistant for this account.`;
    }
    return null;
  }

  private recommendReply(): string {
    this.quickReplies = this.recommendations.map(loan => loan.name);
    const lines = this.recommendations
      .map(rec => `• <b>${rec.name}</b> — ${this.money(rec.amount)} over ${this.termLabel(rec.term)}. ${rec.points[0]}.`)
      .join('<br>');
    return `Your last facility was <b>${this.previousLoan.product}</b> of <b>${this.money(this.previousLoan.amount)}</b>, ${this.previousLoan.status.toLowerCase()} in ${this.previousLoan.closed}.<br><br>${lines}`;
  }

  private reasonsReply(): string {
    const lines = this.limitReasons
      .map(reason => `• <b>${reason.title}: ${reason.value}.</b> ${reason.detail}`)
      .join('<br>');
    return `Your indicative limit is <b>${this.money(this.assessment.maxLimit)}</b>.<br><br>${lines}`;
  }

  private boostReply(): string {
    const lines = this.limitBoosts
      .map(boost => `• <b>${boost.title}.</b> ${boost.detail}`)
      .join('<br>');
    return `The limit can move in three ways:<br><br>${lines}`;
  }

  private addBotMessage(text: string) {
    this.chatMessages.push({ sender: 'bot', text, time: this.now() });
    this.cdr.detectChanges();
    this.scrollToChatBottom();
  }

  private now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  private scrollToChatBottom() { setTimeout(() => { const el = document.getElementById('chat-scroll'); if (el) el.scrollTop = el.scrollHeight; }, 50); }
  private termLabel(months: number): string {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  money(val: number) { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val || 0); }
}