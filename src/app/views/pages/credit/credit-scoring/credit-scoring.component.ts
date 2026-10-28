import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PRODUCTS } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { GroqService } from '../../../../shared/services/groq.service';
import { LEO_SYSTEM } from './leo-assistant';

type Channel = 'mobile' | 'chatbot';
type JourneyStep = 'welcome' | 'limit-check' | 'explain' | 'apply' | 'success';
type PhoneTab = 'home' | 'offers' | 'loans' | 'cards' | 'profile';

interface ChatMessage {
  sender: 'bot' | 'customer';
  text: string;
  time: string;
}

interface LeoOffer {
  name: string;
  amount: number;
  termMonths: number;
  monthlyRepayment: number;
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
  pendingOffer: LeoOffer | null = null;
  chatApplication: (LeoOffer & { ref: string; status: string }) | null = null;
  private readonly openingReplies = ['Check my limit', 'Apply for a loan', 'Track my application', 'Recommend a loan for me'];

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

  constructor(public credit: CreditDataService, private cdr: ChangeDetectorRef, private groq: GroqService) {}

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
    this.pendingOffer = null;
    this.chatApplication = null;
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
    this.pendingOffer = null;
    this.chatApplication = null;
    this.quickReplies = [...this.openingReplies];
    this.chatMessages = [{
      sender: 'bot',
      text: `Hello Felix! 👋 Welcome to UBA WhatsApp Banking. I'm Leo, your AI Loan Assistant. How can I help you today?`,
      time: this.now()
    }];
  }

  sendQuickReply(text: string) {
    this.chatInput = text;
    this.sendChatMessage();
  }

  sendChatMessage() {
    const prompt = this.chatInput.trim();
    if (!prompt || this.isBotTyping) return;

    this.chatMessages.push({ sender: 'customer', text: this.escapeChat(prompt), time: this.now() });
    this.chatInput = '';
    this.quickReplies = [];
    this.isBotTyping = true;
    this.scrollToChatBottom();
    void this.replyWithLeo(prompt);
  }

  private async replyWithLeo(prompt: string): Promise<void> {
    const lower = prompt.toLowerCase().trim();
    if (/^(start over|start again|begin again)$/.test(lower)) {
      this.isBotTyping = false;
      this.resetChat();
      this.cdr.detectChanges();
      return;
    }
    if (lower === 'cancel' || lower === 'no' || lower === 'nope') {
      this.pendingOffer = null;
    }

    let submission = '';
    if (this.pendingOffer && /\b(confirm|proceed|submit)\b/.test(lower)) {
      const ref = 'DEMO-' + Math.floor(Math.random() * 900000 + 100000);
      const offer = this.pendingOffer;
      this.chatApplication = { ...offer, ref, status: 'Pending Disbursement' };
      this.applicationRef = ref;
      this.pendingOffer = null;
      submission = `The application was just submitted. Use exactly these fields: product ${offer.name}, reference ${ref}, amount ${this.money(offer.amount)}, term ${offer.termMonths} months, monthly repayment ${this.money(offer.monthlyRepayment)}, status Pending Disbursement.`;
    }

    const history = this.chatMessages
      .slice(0, -1)
      .slice(-8)
      .map(message => ({
        role: message.sender === 'customer' ? 'user' as const : 'assistant' as const,
        content: message.text.replace(/<[^>]+>/g, ' ')
      }));

    try {
      const result = await this.groq.json<{
        reply?: string;
        quickReplies?: string[];
        offer?: LeoOffer | null;
      }>(LEO_SYSTEM, [
        ...history,
        { role: 'user', content: `${this.leoContext()}\n${submission}\n\nCustomer said:\n${prompt}` }
      ]);
      const reply = (result.reply || '').trim();
      if (!reply) throw new Error('empty');
      const offer = result.offer;
      if (!this.chatApplication && offer && Number.isFinite(Number(offer.amount))) {
        this.pendingOffer = {
          name: String(offer.name || 'Loan'),
          amount: Number(offer.amount),
          termMonths: Number(offer.termMonths) || 12,
          monthlyRepayment: Number(offer.monthlyRepayment) || 0
        };
      }
      const replies = Array.isArray(result.quickReplies) ? result.quickReplies : [];
      this.quickReplies = replies
        .map(label => String(label).trim())
        .filter(Boolean)
        .slice(0, 4);
      this.addBotMessage(this.formatLeo(reply));
    } catch (error) {
      this.quickReplies = [...this.openingReplies];
      const detail = error instanceof Error ? error.message : '';
      this.addBotMessage(detail || 'I could not reach the analysis service. Ask me again in a moment.');
    } finally {
      this.isBotTyping = false;
      this.cdr.detectChanges();
      this.scrollToChatBottom();
    }
  }

  private leoContext(): string {
    const a = this.assessment;
    const catalog = [
      ['Professional Development (Standard)', 80000, 12, 'The last facility was a student loan, repaid in full and on time. That clean education credit is why the next offer is a follow-on for a certification or further study.'],
      ['Career Booster (Plus)', 120000, 18, 'A repaid student loan plus the verified income points to the move from study into work. This limit covers larger professional certifications or relocation.'],
      ['Premier Lifestyle (Premium)', 400000, 24, 'Income and a clean credit history support a higher facility, up to the indicative limit.']
    ] as const;
    const priced = catalog.map(([name, amount, term, why]) =>
      `${name}: amount ${this.money(amount)}, term ${term} months, estimated monthly repayment ${this.money(this.installment(amount, term))}. Reason: ${why}`
    );
    const application = this.chatApplication
      ? `Application on file: ${this.chatApplication.ref}, ${this.chatApplication.name}, ${this.money(this.chatApplication.amount)}, ${this.chatApplication.termMonths} months, status ${this.chatApplication.status}.`
      : 'No application has been submitted in this chat.';
    const waiting = this.pendingOffer
      ? `Offer waiting for confirmation: ${this.pendingOffer.name}, ${this.money(this.pendingOffer.amount)}, ${this.pendingOffer.termMonths} months, monthly ${this.money(this.pendingOffer.monthlyRepayment)}.`
      : 'No offer is waiting for confirmation.';
    const passed = a.policyChecks.filter(check => check.passed).length;
    return [
      'Live customer facts:',
      `Name: ${this.customer.name}.`,
      `Verified monthly income: ${this.money(this.customer.income)}.`,
      `Existing monthly commitments: ${this.money(this.customer.existingDebt)}.`,
      `Credit score: ${a.score} out of 850 (${a.riskCategory} risk).`,
      `Indicative limit: ${this.money(a.maxLimit)}.`,
      `Debt-to-income: ${a.dti.toFixed(1)}% against a 40% ceiling.`,
      `Policy checks passed: ${passed} of ${a.policyChecks.length}.`,
      `Repayment history: ${this.customer.hasDefaulted ? 'Prior default' : 'No defaults'}.`,
      `Last facility: ${this.previousLoan.product} of ${this.money(this.previousLoan.amount)}, ${this.previousLoan.status}, closed ${this.previousLoan.closed}. Describe it as their student loan.`,
      'Catalog:',
      ...priced,
      application,
      waiting
    ].join('\n');
  }

  private installment(principal: number, months: number): number {
    const monthlyRate = this.annualInterestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, months);
    const repaymentFactor = monthlyRate === 0 ? 1 / months : (monthlyRate * factor) / (factor - 1);
    return Math.round(principal * repaymentFactor);
  }

  private formatLeo(text: string): string {
    return this.escapeChat(text)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }

  private escapeChat(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private stageOffer(offer: LoanRecommendation): void {
    this.selectedOffer = offer;
    this.loanTermMonths = offer.term;
    const ceiling = this.calculateAssessment().maxLimit;
    this.requestedAmount = Math.min(offer.amount, ceiling);
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