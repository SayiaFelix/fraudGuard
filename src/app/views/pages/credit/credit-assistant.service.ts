import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AUDIT_EVENTS, COUNTRY_MIX, CreditApplication, PRODUCT_MIX, SCORE_BANDS } from './credit-demo.data';
import { CreditDataService } from './credit-data.service';
import { LoanRecord } from './workflow/loan-workflow.models';
import { LoanWorkflowService } from './workflow/loan-workflow.service';

export type AssistantPageId =
  | 'dashboard'
  | 'ingestion'
  | 'applications'
  | 'application'
  | 'queue'
  | 'alerts'
  | 'simulator'
  | 'rules'
  | 'policy'
  | 'portfolio'
  | 'reports'
  | 'model'
  | 'audit'
  | 'settings'
  | 'other';

export interface AssistantSuggestion {
  label: string;
  prompt: string;
}

export interface AssistantContext {
  id: AssistantPageId;
  label: string;
  placeholder: string;
  suggestions: AssistantSuggestion[];
}

export interface AssistantDownload {
  filename: string;
  body: string;
}

export interface AssistantTurn {
  text: string;
  download?: AssistantDownload;
  tour?: 'workspace' | 'model';
}

export interface AssistantStep {
  path: string;
  title: string;
  narration: () => string;
}

@Injectable({ providedIn: 'root' })
export class CreditAssistantService {
  constructor(
    private credit: CreditDataService,
    private loans: LoanWorkflowService,
    private router: Router
  ) {}

  context(url: string): AssistantContext {
    const id = this.page(url);
    const pages: Record<AssistantPageId, Omit<AssistantContext, 'id'>> = {
      dashboard: {
        label: 'Dashboard',
        placeholder: 'Ask about the book, a cutoff, or the model',
        suggestions: [
          { label: 'Read the book', prompt: 'Read the portfolio in plain language' },
          { label: 'Where to look first', prompt: 'Where is approval weakest in the book?' },
          { label: 'Score to decision', prompt: 'How does policy turn a credit score into approve, refer, or decline?' },
          { label: 'Walk the workspace', prompt: 'Walk me through the workspace' }
        ]
      },
      ingestion: {
        label: 'Ingestion',
        placeholder: 'Ask how to assess a file, or what a column means',
        suggestions: [
          { label: 'What this page does', prompt: 'Explain this page' },
          { label: 'Bulk file columns', prompt: 'What columns does a bulk file need?' },
          { label: 'What connectors check', prompt: 'What do the integration connectors check?' },
          { label: 'Handover note', prompt: 'Reconstruct a handover file I can edit' }
        ]
      },
      applications: {
        label: 'Applications',
        placeholder: 'Ask what the queue is holding',
        suggestions: [
          { label: 'Read this queue', prompt: 'Explain this page' },
          { label: 'Who still needs an officer', prompt: 'Which applications still need an officer?' },
          { label: 'Handover note', prompt: 'Reconstruct a handover file I can edit' },
          { label: 'What I will not do', prompt: 'What are your limits on this page?' }
        ]
      },
      application: {
        label: 'Application',
        placeholder: 'Ask what this file means, or for a handover note',
        suggestions: [
          { label: 'Explain this file', prompt: 'Explain this file in plain language' },
          { label: 'Compare with policy', prompt: 'Compare this file with the current policy' },
          { label: 'Rebuild the handover', prompt: 'Reconstruct a handover file I can edit' },
          { label: 'What I will not decide', prompt: 'What are your limits on this page?' }
        ]
      },
      queue: {
        label: 'Decision queue',
        placeholder: 'Ask what is waiting, or what an override means',
        suggestions: [
          { label: 'What is waiting', prompt: 'Explain this page' },
          { label: 'How an officer decides', prompt: 'How does an officer approve, decline, or ask for information?' },
          { label: 'What an override is', prompt: 'What is a policy override?' },
          { label: 'I will not approve', prompt: 'What are your limits on this page?' }
        ]
      },
      alerts: {
        label: 'Alerts',
        placeholder: 'Ask how to work an open alert',
        suggestions: [
          { label: 'How to work an alert', prompt: 'Explain this page' },
          { label: 'What open means', prompt: 'What does an open alert mean?' },
          { label: 'Where the audit is', prompt: 'Where is the audit trail?' },
          { label: 'I will not close one', prompt: 'What are your limits on this page?' }
        ]
      },
      simulator: {
        label: 'Channel simulator',
        placeholder: 'Ask what a simulated score means',
        suggestions: [
          { label: 'What this page is', prompt: 'Explain this page' },
          { label: 'Explain a score', prompt: 'Explain the credit score in operational terms' },
          { label: 'Does policy still apply', prompt: 'Does policy still apply to a simulated score?' },
          { label: 'Show the cutoffs', prompt: 'What are the current credit policy cutoffs?' }
        ]
      },
      rules: {
        label: 'Decision rules',
        placeholder: 'Ask what a rule does to a file',
        suggestions: [
          { label: 'Rules in plain language', prompt: 'Explain the decision rules in plain language' },
          { label: 'Hard stop versus refer', prompt: 'What is the difference between a hard decline and a refer?' },
          { label: 'A worked decline', prompt: 'Show a worked example of a decline' },
          { label: 'I will not change a rule', prompt: 'What are your limits on this page?' }
        ]
      },
      policy: {
        label: 'Policy simulator',
        placeholder: 'Ask who would move if a cutoff changed',
        suggestions: [
          { label: 'If a cutoff moves', prompt: 'Explain this page' },
          { label: 'Who would be affected', prompt: 'Who would move if the approval cutoff changed?' },
          { label: 'This does not save', prompt: 'Does the policy simulator save a new cutoff?' },
          { label: 'Current cutoffs', prompt: 'What are the current credit policy cutoffs?' }
        ]
      },
      portfolio: {
        label: 'Portfolio analytics',
        placeholder: 'Ask for the book in plain language',
        suggestions: [
          { label: 'Read the book', prompt: 'Read the portfolio in plain language' },
          { label: 'Weakest approval', prompt: 'Where is approval weakest in the book?' },
          { label: 'Products and countries', prompt: 'Compare products and countries in the portfolio' },
          { label: 'What this view is not', prompt: 'What is the portfolio view not able to tell me?' }
        ]
      },
      reports: {
        label: 'Reports',
        placeholder: 'Ask what a download contains',
        suggestions: [
          { label: 'What I can download', prompt: 'Explain this page' },
          { label: 'What is left out', prompt: 'What is left out of a report download?' },
          { label: 'How to read a row', prompt: 'How should I read a report row?' },
          { label: 'No identity extract', prompt: 'What are your limits on this page?' }
        ]
      },
      model: {
        label: 'Model monitoring',
        placeholder: 'Ask what the champion is doing, in plain language',
        suggestions: [
          { label: 'Explain without the maths', prompt: 'Explain this page to someone who is not a data scientist' },
          { label: 'Gini, KS and PSI', prompt: 'What do Gini, KS and PSI mean for operations?' },
          { label: 'Is the champion fit?', prompt: 'Is the champion model still fit to use?' },
          { label: 'Give me a demo', prompt: 'Give me a demo of model monitoring' }
        ]
      },
      audit: {
        label: 'Audit logs',
        placeholder: 'Ask what was recorded, or what was not',
        suggestions: [
          { label: 'What is recorded', prompt: 'Explain this page' },
          { label: 'Latest actions', prompt: 'What are the latest audit actions?' },
          { label: 'What is not stored', prompt: 'What is not stored in the audit log?' },
          { label: 'I will not edit the log', prompt: 'What are your limits on this page?' }
        ]
      },
      settings: {
        label: 'Settings',
        placeholder: 'Ask what a cutoff means before anyone saves it',
        suggestions: [
          { label: 'What the cutoffs mean', prompt: 'What are the current credit policy cutoffs?' },
          { label: 'Maker-checker', prompt: 'What does maker-checker mean here?' },
          { label: 'I will not save a change', prompt: 'What are your limits on this page?' },
          { label: 'Read the book', prompt: 'Read the portfolio in plain language' }
        ]
      },
      other: {
        label: 'Credit workspace',
        placeholder: 'Ask a policy, portfolio, or model question',
        suggestions: [
          { label: 'Policy question', prompt: 'How does policy turn a credit score into approve, refer, or decline?' },
          { label: 'Read the portfolio', prompt: 'Read the portfolio in plain language' },
          { label: 'Explain the model', prompt: 'Explain the model in operational terms' },
          { label: 'What I will not do', prompt: 'What are your limits?' }
        ]
      }
    };
    return { id, ...pages[id] };
  }

  sessionKey(url: string): string {
    const page = this.page(url);
    if (page === 'application') {
      const id = this.applicationId(url);
      return id ? `application:${id}` : 'application';
    }
    return page;
  }

  greeting(url: string): string {
    const page = this.context(url);
    return [
      `You are on ${page.label} page.`,
      '',
      'I can answer a policy question, read the portfolio in plain language, explain the model in operational terms, or rebuild one handover note for an officer to edit.',
      '',
      'I will not approve a loan, change a cutoff, retrain a model, or show a national ID, phone number, or account number.',
      '',
      this.pageBrief(page.id, url, true)
    ].join('\n');
  }

  answer(question: string, url: string): AssistantTurn {
    const q = question.toLowerCase().replace(/\s+/g, ' ').trim();
    const page = this.page(url);

    if (this.isSensitive(q)) {
      return { text: this.refusal(q) };
    }
    if (/\b(this page|this screen|here)\b/.test(q) && /\b(walk|demo|tour|guide)\b/.test(q) && page !== 'model' && !/\bworkspace\b/.test(q)) {
      return { text: this.pageBrief(page, url) };
    }
    if (this.wantsTour(q)) {
      const tour = this.tourKind(q, page);
      return { text: this.tourIntro(tour), tour };
    }
    if (this.wantsHandover(q) || (page === 'application' && /\b(this file|compare this file)\b/.test(q))) {
      if (/\bcompare this file\b/.test(q) || /\bexplain this file\b/.test(q)) {
        return { text: this.fileReading(url) };
      }
      return this.handover(url);
    }
    if (/\blimit|cannot|can't|will not|won't|not allowed|sensitive\b/.test(q)) {
      return { text: this.limits(page) };
    }
    if (/\b(bulk|column|csv|connector)\b/.test(q)) {
      return { text: this.ingestionDetail(q) };
    }
    if (/\b(decision rules|worked example of a decline)\b/.test(q)) {
      return { text: /\bworked\b/.test(q) ? this.workedDecline() : this.rulesBrief() };
    }
    if (/\b(still need an officer|which applications)\b/.test(q)) {
      return { text: this.applicationsShort() };
    }
    if (/\boverride\b/.test(q) || (/\bofficer\b/.test(q) && /\b(approve|decline|information|decid)\b/.test(q))) {
      return { text: this.queueAnswer(q) };
    }
    if (this.wantsPolicy(q)) {
      return { text: this.policyAnswer(q) };
    }
    if (this.wantsPortfolio(q)) {
      return { text: this.portfolioAnswer(q) };
    }
    if (this.wantsModel(q) || (page === 'model' && /\b(this page|happening|not a data scientist|plain language)\b/.test(q))) {
      return { text: this.modelAnswer(q) };
    }
    if (/\b(audit|trail)\b/.test(q)) {
      return { text: this.auditAnswer(q) };
    }
    if (/\balert\b/.test(q)) {
      return { text: this.alertsBrief() };
    }
    if (/\b(queue|officer|waiting)\b/.test(q)) {
      return { text: this.queueAnswer(q) };
    }
    if (/\b(this page|this screen|happening here|what am i looking at|explain this)\b/.test(q)) {
      return { text: this.pageBrief(page, url) };
    }
    return { text: this.fallback(page) };
  }

  tourSteps(kind: 'workspace' | 'model'): AssistantStep[] {
    if (kind === 'model') {
      return [
        { path: '/model-monitoring', title: 'Three scores, one decision', narration: () => this.modelPipeline() },
        { path: '/model-monitoring', title: 'The numbers, in operations', narration: () => this.modelMetrics() },
        { path: '/decision-rules', title: 'Policy sits on the score', narration: () => this.policyBridge() },
        { path: '/portfolio', title: 'The book the score serves', narration: () => this.portfolioShort() },
        { path: '/model-monitoring', title: 'Back to the champion', narration: () => this.modelClose() }
      ];
    }
    return [
      { path: '/dashboard', title: 'Dashboard', narration: () => this.dashboardShort() },
      { path: '/applications/new', title: 'Ingestion', narration: () => this.ingestionShort() },
      { path: '/applications', title: 'Applications', narration: () => this.applicationsShort() },
      { path: '/decision-queue', title: 'Decision queue', narration: () => this.queueShort() },
      { path: '/model-monitoring', title: 'Model monitoring', narration: () => this.modelPipeline() },
      { path: '/portfolio', title: 'Portfolio', narration: () => this.portfolioShort() },
      { path: '/decision-rules', title: 'Decision rules', narration: () => this.policyBridge() }
    ];
  }

  private page(url: string): AssistantPageId {
    const path = (url || this.router.url || '/').split('?')[0].replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/applications/new') return 'ingestion';
    if (path === '/applications') return 'applications';
    if (path.startsWith('/applications/')) return 'application';
    if (path === '/decision-queue') return 'queue';
    if (path === '/alerts') return 'alerts';
    if (path === '/credit-scoring') return 'simulator';
    if (path === '/decision-rules') return 'rules';
    if (path === '/policy-simulator') return 'policy';
    if (path === '/portfolio') return 'portfolio';
    if (path === '/reports') return 'reports';
    if (path === '/model-monitoring') return 'model';
    if (path === '/audit-logs') return 'audit';
    if (path === '/settings') return 'settings';
    return 'other';
  }

  private applicationId(url: string): string {
    const path = url.split('?')[0];
    const match = path.match(/\/applications\/([^/]+)$/);
    if (!match || match[1] === 'new') return '';
    return decodeURIComponent(match[1]);
  }

  private wantsTour(q: string): boolean {
    return /\b(demo|tour|walk me|show me around|take me through|guide me)\b/.test(q);
  }

  private tourKind(q: string, page: AssistantPageId): 'workspace' | 'model' {
    if (/\b(workspace|whole app|entire app|all pages)\b/.test(q)) return 'workspace';
    if (page === 'model' || /\bmodel\b/.test(q)) return 'model';
    return 'workspace';
  }

  private wantsHandover(q: string): boolean {
    return /\b(handover|hand over|reconstruct|rebuild|briefing note|officer note)\b/.test(q);
  }

  private wantsPolicy(q: string): boolean {
    return /\b(policy|cutoff|cut-off|dti|debt service|debt-to-income|rule|cr-0|approve|decline|refer|hard stop|maker|tenor|bureau|auto-approv|score band|override)\b/.test(q);
  }

  private wantsPortfolio(q: string): boolean {
    return /\b(portfolio|the book|approval rate|concentrat|weakest|country|product mix|exposure|where is risk)\b/.test(q);
  }

  private wantsModel(q: string): boolean {
    return /\b(model|gini|psi|roc|auc|brier|\bks\b|scorecard|champion|xgboost|lightgbm|ensemble|stability|false positive|data scientist)\b/.test(q);
  }

  private isSensitive(q: string): boolean {
    const identity = /\b(national id|nin\b|bvn\b|phone number|mobile number|account number|password|api key|credential)\b/.test(q)
      && /\b(show|give|reveal|include|tell|display|export|list|what is|put)\b/.test(q);
    const gaming = /\b(game|beat|bypass|manipulate|trick|inflate)\b/.test(q)
      && /\b(score|model|policy|rule|kyc|cutoff)\b/.test(q);
    const wipe = /\b(delete|wipe|hide|erase|edit|change)\b/.test(q) && /\b(audit|log|trail)\b/.test(q)
      && !/\b(what|how|explain|mean)\b/.test(q);
    const dump = /\b(export|download|dump|extract)\b/.test(q)
      && /\b(all|every|full|entire|customer list|identit)\b/.test(q);
    const act = /\b(approve|decline|reject|disburse|override|blacklist|waive|close the alert|close this)\b/.test(q)
      && /\b(this|that|the loan|the application|the file|the alert|app-|loan-|for me|now)\b/.test(q)
      && !/\b(what|how|explain|mean|does|work|difference)\b/.test(q);
    const mutate = /\b(change|set|update|disable|turn off|save|retrain|deploy|promote|apply)\b/.test(q)
      && /\b(cutoff|policy|rule|threshold|model|weight)\b/.test(q)
      && !/\b(what|how|explain|if|would|happen|mean|does)\b/.test(q);
    return identity || gaming || wipe || dump || act || mutate;
  }

  private refusal(q: string): string {
    if (/\b(national id|nin\b|bvn\b|phone|account number|password|api key|credential)\b/.test(q)) {
      return 'I will not show a national ID, phone number, account number, or credential. A handover note can name the file and the officer-facing facts, with those fields left out.';
    }
    if (/\b(game|beat|bypass|manipulate|trick|inflate)\b/.test(q)) {
      return 'I will not explain how to game a score, bypass a rule, or get around KYC. I can explain how a file is scored and which policy gate it failed.';
    }
    if (/\b(audit|log|trail)\b/.test(q)) {
      return 'I will not edit, hide, or delete an audit line. The log is the record of who acted and why. I can read the latest entries in plain language.';
    }
    if (/\b(export|download|dump|extract)\b/.test(q)) {
      return 'I will not export the customer book or a list of identity numbers. Reports on this workspace are for the demo book, and a handover note covers one file with identity numbers withheld.';
    }
    if (/\b(retrain|deploy|promote|cutoff|policy|rule|threshold|weight)\b/.test(q)) {
      return 'I will not retrain a model, deploy a champion, or save a cutoff or rule. Those stay with an authorised officer, and a sensitive change is maker-checker. I can explain what the current values do.';
    }
    return 'I will not approve, decline, disburse, override, or close this file. The recommendation can be explained. The decision stays with the officer, and the reason has to be written on the file.';
  }

  private limits(page: AssistantPageId): string {
    const local: Record<AssistantPageId, string> = {
      dashboard: 'On the dashboard I will read the book and point at where to look. I will not open a customer identity, and I will not move a case.',
      ingestion: 'On ingestion I will explain the form, the bulk columns, and the connectors. I will not type into the form, upload a file, or submit an assessment.',
      applications: 'On the application list I will say which files are still waiting. I will not decide one, and I will not export the list with identity numbers.',
      application: 'On an open file I will explain the recommendation against policy and rebuild a handover note. I will not approve, decline, or request information for you.',
      queue: 'On the decision queue I will explain what the officer is being asked to do, including when an approval would be a policy override. I will not take the decision.',
      alerts: 'On alerts I will explain what open means and where the trail is. I will not assign, close, or clear an alert.',
      simulator: 'A result in the channel simulator is not an application and not a decision. I will not treat it as one.',
      rules: 'I will explain a rule and show a worked example. I will not enable, disable, or rewrite a rule.',
      policy: 'The policy simulator shows who would move. It does not save. I will not apply a new cutoff.',
      portfolio: 'I will read concentration and approval in plain language. This view is not a customer list, and I will not turn it into one.',
      reports: 'I will say what a download is for. I will not build an identity extract.',
      model: 'I will explain whether the champion is fit to keep using. I will not start a retrain or promote a model.',
      audit: 'I will read the trail. I will not edit it.',
      settings: 'I will explain the saved cutoffs. I will not save a new value.',
      other: 'I stay inside this credit workspace.'
    };
    return [
      local[page],
      '',
      'Across the workspace I will not:',
      '- approve, decline, disburse, or override a file',
      '- change a cutoff, a rule, or a model',
      '- show a national ID, phone number, account number, or credential',
      '- export the full customer book',
      '- explain how to manipulate a score',
      '',
      'A demo only opens pages that already exist. It does not fill a form or press a decision.'
    ].join('\n');
  }

  private fallback(page: AssistantPageId): string {
    const label = this.context(this.pathOf(page)).label;
    return [
      `I stay on four jobs while you are on ${label}.`,
      '',
      '1. Policy: how a score becomes approve, refer, or decline under the cutoffs saved here.',
      '2. The portfolio, in plain language: where the book is large, and where approval is weakest.',
      '3. The model, in operational terms: what the champion is doing, and whether it is still fit to use.',
      '4. One handover note for a file, with identity numbers left out, ready for an officer to edit.',
      '',
      'Use a suggestion under this window, or ask one of those. I will not act on a file or change policy.'
    ].join('\n');
  }

  private pathOf(page: AssistantPageId): string {
    const paths: Record<AssistantPageId, string> = {
      dashboard: '/dashboard',
      ingestion: '/applications/new',
      applications: '/applications',
      application: '/applications',
      queue: '/decision-queue',
      alerts: '/alerts',
      simulator: '/credit-scoring',
      rules: '/decision-rules',
      policy: '/policy-simulator',
      portfolio: '/portfolio',
      reports: '/reports',
      model: '/model-monitoring',
      audit: '/audit-logs',
      settings: '/settings',
      other: '/dashboard'
    };
    return paths[page];
  }

  private tourIntro(kind: 'workspace' | 'model'): string {
    const scope = kind === 'model'
      ? 'I will stay on model monitoring, then open decision rules and the portfolio, then come back. That is the path from the score to the policy to the book.'
      : 'I will open the dashboard, ingestion, applications, the decision queue, model monitoring, the portfolio, and decision rules.';
    return [
      scope,
      '',
      'I will only open those pages. I will not fill a form, submit a file, retrain a model, or change a rule. Use Stop if you want to stay where you are.'
    ].join('\n');
  }

  private pageBrief(page: AssistantPageId, url: string, lead = false): string {
    const briefs: Record<AssistantPageId, () => string> = {
      dashboard: () => this.dashboardShort(),
      ingestion: () => this.ingestionDetail('page'),
      applications: () => this.applicationsShort(),
      application: () => this.fileReading(url),
      queue: () => this.queueShort(),
      alerts: () => this.alertsBrief(),
      simulator: () => [
        'The channel simulator shows how a score would be produced on a channel such as mobile. A result here is a demonstration. It is not an application, and it is not a decision.',
        '',
        'The same policy still applies if that person is later assessed for real. A strong simulated score does not skip the debt-service cap, the amount cap, or a hard bureau rule.',
        '',
        this.cutoffBlock()
      ].join('\n'),
      rules: () => this.rulesBrief(),
      policy: () => [
        'This page answers a what-if: who would move if a cutoff changed. It does not save the policy.',
        '',
        this.cutoffBlock(),
        '',
        'Read the movement before anyone edits the live cutoff. A wider approve band takes in more of the middle of the book, which is exactly the band that is referred to an officer today. I will not apply the change.'
      ].join('\n'),
      portfolio: () => this.portfolioAnswer('portfolio'),
      reports: () => [
        'Reports download a CSV of the demo book: summary, distribution, outcomes, exceptions, turnaround, and limits.',
        '',
        'Use a row to see product, outcome, and concentration. Do not treat the file as a production customer extract. I will not add national IDs or phone numbers to it, and I will not email it onward.'
      ].join('\n'),
      model: () => this.modelAnswer('explain'),
      audit: () => this.auditAnswer('latest'),
      settings: () => [
        'Settings holds the demo cutoffs. Saving a new value is an administration action. Maker-checker means a second person confirms a sensitive change. I will not save one.',
        '',
        this.cutoffBlock()
      ].join('\n'),
      other: () => 'Open a credit page and I will switch the suggestions to that page. The four jobs stay the same: policy, the book, the model, and one handover note.'
    };
    const text = briefs[page]();
    if (!lead) return text;
    return text;
  }

  private dashboardShort(): string {
    const book = this.bookFacts();
    return [
      `The dashboard is the morning read of the demo book. ${book.headline}`,
      '',
      book.where,
      '',
      `The number that still needs a person is the referred slice: ${book.referred}. High-risk exposure on the book is ${book.exposure}. Average automatic decision time is ${book.seconds} seconds. That clock is the scorecard path, not the wait for a manual file.`,
      '',
      'Start with referred files, then Asset Finance and SME Working Capital, which approve least often. I can read the book in more detail, or walk the pages without changing anything.'
    ].join('\n');
  }

  private ingestionDetail(q: string): string {
    const columns = q === 'page' || /\b(column|csv|bulk|upload)\b/.test(q);
    const connectors = q === 'page' || /\bconnector|integration\b/.test(q);
    const parts = [
      'Ingestion is where a file enters. It has three modes, and none of them is a decision.'
    ];
    if (q === 'page' || (!columns && !connectors)) {
      parts.push('', 'Individual assessment looks up one customer and records the amount, tenor, income, obligations, and the eligibility facts. A missing fact stays missing. It is not filled in as a pass.');
    }
    if (columns) {
      parts.push(
        '',
        'Bulk intake takes a file of 1 to 500 rows. Required columns are national_id, requested_amount, tenor_months, and product. Optional columns are application_id and reassessment_note. The amount has to be at least 10,000, and the tenor a whole number from 1 to 60 months.',
        'I can describe that file. I will not upload one, and I will not ask you to paste identity numbers here.'
      );
    }
    if (connectors) {
      parts.push(
        '',
        'The integration check looks at core, bureau, identity, and collections for one application. A live connector can support the file. A paused or degraded connector sends it to review. It does not silently approve.',
        'The wider connector list (core, bureau, identity, mobile origination, collections) stays paused until a JSON feed is connected. That is a waiting state, not a failure of the file in front of you.'
      );
    }
    parts.push('', 'A demo of this page will not type into the form.');
    return parts.join('\n');
  }

  private ingestionShort(): string {
    return [
      'This is ingestion. One customer, a bulk file, or a connector check. All three create an assessment. None of them approves the loan.',
      '',
      'A missing eligibility fact stays missing and goes to review. A paused connector does the same. I am not filling the form.'
    ].join('\n');
  }

  private applicationsShort(): string {
    const records = this.loans.applications;
    const waiting = this.loans.pendingCount;
    if (!records.length) {
      return [
        'The application list is empty in this browser. Files appear here after an assessment is saved on Ingestion.',
        '',
        'The dashboard and portfolio are a separate demo book of 1,248 applications. They are not this queue. I can still rebuild a handover note from a referred file in that book.'
      ].join('\n');
    }
    return [
      `This list is the assessed files saved in this browser: ${records.length} on file, ${waiting} still waiting for an officer.`,
      '',
      'Use it to find a file and open the score, the eligibility checks, and the recommendation. The decision itself is taken on the decision queue. I will not take it from here.'
    ].join('\n');
  }

  private queueAnswer(q: string): string {
    if (/\boverride\b/.test(q)) {
      return [
        'A policy override is an officer approving a file the rules did not clear.',
        '',
        'It is allowed only as an explicit exception. The officer has to acknowledge it and write the reason in at least 20 characters. The audit trail then shows that the approval was against the recommendation, and who accepted that.',
        '',
        'I can say when a file would need one. I will not tick it, and I will not invent the reason.'
      ].join('\n');
    }
    return this.queueShort();
  }

  private queueShort(): string {
    const waiting = this.loans.pendingCount;
    const noun = waiting === 1 ? 'file is' : 'files are';
    return [
      waiting
        ? `${waiting} ${noun} waiting on an officer in this browser.`
        : 'Nothing in this browser is waiting on an officer yet. Assess a file on Ingestion and it will land here.',
      '',
      'An officer can approve, decline, or ask for more information. If the recommendation is not a clean approval, approving the requested amount is a policy override: it has to be acknowledged and explained.',
      '',
      'The score and the rules prepare that choice. They do not make it. I will not approve, decline, or request information for you.'
    ].join('\n');
  }

  private alertsBrief(): string {
    const open = this.credit.applications.filter(item => item.decision === 'Refer' && item.caseStatus !== 'Closed').length;
    return [
      `Alerts are referred files in the demo book that are not closed. ${open} are open.`,
      '',
      'Working an alert means reading the reason codes, seeing who it is assigned to, and recording the outcome on the case. An open alert is not a decline, and it is not an approval. It is a file that still needs a person.',
      '',
      'The audit log is the trail of what was then recorded. I will not assign or close an alert.'
    ].join('\n');
  }

  private rulesBrief(): string {
    const enabled = this.credit.rules.filter(rule => rule.enabled);
    const lines = enabled.map(rule => `- ${rule.code} ${rule.name}: ${rule.condition}. Action: ${rule.action} (${rule.severity.toLowerCase()}).`);
    return [
      'Rules sit on top of the score. The score ranks risk. A rule says what the institution does with that rank.',
      '',
      ...lines,
      '',
      'A hard rule declines. A soft rule sends the file to an officer. Clean auto-approval needs the score, debt service, bureau, and amount all inside the band at the same time. One miss is enough to stop the automatic yes.',
      '',
      this.workedDecline(),
      '',
      'I will not enable, disable, or rewrite any of these.'
    ].join('\n');
  }

  private workedDecline(): string {
    return [
      'Worked example. James Were, APP-10468, Asset Finance, is a decline and it is closed. The score is 540, under the decline cutoff. Debt service is 62% against a 45% cap. The bureau status is adverse.',
      'Two hard gates fired: the score cutoff and the adverse bureau. The high debt service would have referred the file even if the score had been higher. That is the pattern to remember: a strong score does not outvote a hard rule.'
    ].join('\n');
  }

  private policyBridge(): string {
    return [
      'These rules are the institution’s layer on top of the model. The ensemble can rank a file. It does not approve it.',
      '',
      this.cutoffBlock(),
      '',
      'Between the decline cutoff and the approve cutoff, the file waits for an officer. I have not changed a rule on the way here.'
    ].join('\n');
  }

  private policyAnswer(q: string): string {
    if (/\b(who would|would move|cutoff changed|cutoff moves)\b/.test(q)) {
      return [
        'Moving a cutoff does not change today’s book. It shows who would have landed in a different band.',
        '',
        this.cutoffBlock(),
        '',
        'A higher approve-from score leaves more of the middle with an officer. A lower one lets more of that middle through automatically, including files that are only just inside the other gates. The policy simulator is the place to see that shift. It does not save, and I will not apply it.'
      ].join('\n');
    }
    const code = q.match(/cr-0\d/);
    if (code) {
      const rule = this.credit.rules.find(item => item.code.toLowerCase() === code[0]);
      if (rule) {
        return `${rule.code} — ${rule.name}. ${rule.condition}. The action is ${rule.action}, and it is a ${rule.severity.toLowerCase()} rule. ${rule.severity === 'Hard' ? 'A hard rule declines the file. The score does not outvote it.' : 'A soft rule does not decline on its own. It puts the file in front of an officer.'} I will not switch this rule off.`;
      }
    }
    if (/\boverride\b/.test(q)) {
      return this.queueAnswer('override');
    }
    if (/\bworked|example\b/.test(q) && /\bdecline\b/.test(q)) {
      return this.workedDecline();
    }
    if (/\bmaker/.test(q)) {
      return this.credit.policy.makerChecker
        ? 'Maker-checker is on. The person who proposes a sensitive change is not the person who confirms it. I can explain a cutoff. I cannot save one, and I cannot confirm one.'
        : 'Maker-checker is off in the saved demo policy. A sensitive change should still be a second person’s decision. I will not save a cutoff either way.';
    }
    if (/\bhard\b/.test(q) && /\brefer|soft\b/.test(q)) {
      return 'A hard rule declines. On this book that is a score under the decline cutoff, an adverse bureau, or a salary advance longer than one month. A soft rule refers: debt service over the cap, an amount over the auto-approval limit, or a thin bureau file. Refer means a person decides. It does not mean yes, and it does not mean no.';
    }
    if (/\b(policy simulator save|save a new cutoff|does the policy simulator)\b/.test(q)) {
      return 'No. The policy simulator shows who would move if a cutoff changed. The saved policy stays where it is until an authorised change is made in settings, under maker-checker. I will not apply the scenario.';
    }
    const simulated = /\bsimulat/.test(q)
      ? 'A simulated score is still subject to these cutoffs. The channel simulator does not create an application, and it does not approve anyone.\n\n'
      : '';
    return [
      simulated + 'A credit score is a rank, not a decision. This workspace uses 300 to 900. Policy is the institution deciding what to do with that rank.',
      '',
      this.cutoffBlock(),
      '',
      'How to read a file. At or above the approve cutoff, the file can be automatic only if debt service, amount, tenor, and bureau also pass. Under the decline cutoff, the hard score rule declines it. In between, an officer sees it. A missing eligibility fact does not become a pass. The demo gate also asks for 6 months on book, at most 4 active loans and 3 active lenders, and 6 months in the current job or business.',
      '',
      'Salary-advance files are expected inside 8 hours, high-risk files inside 12, and a standard file inside 24. Those are service clocks, not risk bands.',
      '',
      this.bandsBlock()
    ].join('\n');
  }

  private cutoffBlock(): string {
    const policy = this.credit.policy;
    return [
      'Saved cutoffs on this environment:',
      `- Auto-approve from ${policy.approveFrom}, and only when the other gates also pass.`,
      `- Decline below ${policy.declineBelow}.`,
      `- Debt service cap ${(policy.maxDti * 100).toFixed(0)}% of income.`,
      `- Auto-approval amount cap ${this.credit.money(policy.maxAmount)}.`,
      `- Maximum tenor ${policy.maxTenorMonths} months.`,
      `- Bureau pull no older than ${policy.bureauMaxAgeDays} days.`,
      `- Maker-checker is ${policy.makerChecker ? 'on' : 'off'}.`
    ].join('\n');
  }

  private bandsBlock(): string {
    const lines = SCORE_BANDS.map(band => `- ${band.band} ${band.label}: ${band.share}% of the book. ${band.decision}.`);
    return ['Where the demo book sits:', ...lines].join('\n');
  }

  private portfolioAnswer(q: string): string {
    const book = this.bookFacts();
    if (/\bnot able|what this view is not|is not\b/.test(q)) {
      return [
        'Portfolio analytics shows concentration. It does not show a customer, a national ID, or a reason code for one file.',
        '',
        'It cannot tell you why a particular person was referred, whether an override was sound, or whether the model drifted this week. Those answers are on the file, the audit log, and model monitoring.',
        '',
        'The figures are the demo book, not a live ledger.'
      ].join('\n');
    }
    const focusWeak = /\bweak|asset|sme|lowest\b/.test(q);
    const focusMix = /\bcountr|product\b/.test(q);
    const parts = [book.headline, '', book.where];
    if (!focusWeak) {
      parts.push('', book.products, '', book.countries);
    }
    if (focusMix && focusWeak) {
      parts.push('', book.products, '', book.countries);
    }
    parts.push('', `High-risk exposure marked on the dashboard is ${book.exposure}. ${book.referred} are referred, which is the slice that still needs a person. I have not named a customer in this reading.`);
    return parts.join('\n');
  }

  private portfolioShort(): string {
    const book = this.bookFacts();
    return [book.headline, '', book.where, '', 'This is concentration, not a customer list. I have not opened a file.'].join('\n');
  }

  private bookFacts(): { headline: string; where: string; products: string; countries: string; referred: string; exposure: string; seconds: number } {
    const summary = this.credit.summary;
    const products = [...PRODUCT_MIX].sort((a, b) => a.approval - b.approval);
    const weakest = products[0];
    const nextWeak = products[1];
    const strongest = [...PRODUCT_MIX].sort((a, b) => b.approval - a.approval)[0];
    const largest = [...PRODUCT_MIX].sort((a, b) => b.count - a.count)[0];
    const countries = [...COUNTRY_MIX].sort((a, b) => b.count - a.count);
    const lead = countries[0];
    const kenya = COUNTRY_MIX.find(item => item.name === 'Kenya');
    return {
      headline: `The demo book has ${summary.total.toLocaleString('en-KE')} applications. ${summary.approved.toLocaleString('en-KE')} were approved (${this.credit.pct(summary.approved, summary.total)}), ${summary.declined.toLocaleString('en-KE')} declined, and ${summary.referred.toLocaleString('en-KE')} referred. The average score is ${summary.avgScore}.`,
      where: `Approval is weakest in ${weakest.name} at ${weakest.approval}%, then ${nextWeak.name} at ${nextWeak.approval}%. ${strongest.name} approves most often, at ${strongest.approval}%, because the amounts are smaller and the tenor is short. A salary advance longer than one month is still a hard decline.`,
      products: `${largest.name} is the largest product, with ${largest.count.toLocaleString('en-KE')} files and a ${largest.approval}% approval rate. Read Asset Finance and SME Working Capital first if the question is where policy is tight.`,
      countries: `${lead.name} is the largest country book, with ${lead.count.toLocaleString('en-KE')} files at ${lead.approval}% approved.${kenya ? ` Kenya is ${kenya.count.toLocaleString('en-KE')} files at ${kenya.approval}%.` : ''}`,
      referred: `${summary.referred.toLocaleString('en-KE')} referred files (${this.credit.pct(summary.referred, summary.total)})`,
      exposure: this.credit.money(summary.exposureAtRisk),
      seconds: summary.avgDecisionSeconds
    };
  }

  private modelAnswer(q: string): string {
    if (/\bgini|psi|\bks\b|auc|brier\b/.test(q)) return this.modelMetrics();
    if (/\bfit|safe|trust|champion\b/.test(q) && !/\bexplain|page|happening|data scientist\b/.test(q)) return this.modelVerdict();
    return [this.modelPipeline(), '', this.modelMetrics(), '', this.modelVerdict()].join('\n');
  }

  private modelPipeline(): string {
    return [
      'This page answers one operational question: is the score still fit to use? No model on this screen approves a loan.',
      '',
      'Three scores, in the order a file meets them:',
      '1. Origination (PD-XGB-4.2) ranks a new application from bureau, income, tenor, and channel, before any repayment exists. If you pick one future defaulter and one good payer at random, it ranks the defaulter as riskier about 81 times out of 100.',
      '2. Behaviour (PD-LGBM-2.8) updates an open loan from days past due, how much of the limit is used, and whether payments are on time. It is stronger because it can see behaviour the first score never had.',
      '3. The ensemble (ENS-STACK-1.6) blends those two. The cutoff drawn on this page, 660, describes that blend. It is not the institution’s lending rule.',
      '',
      'Lending still uses the policy cutoffs: auto-approve from ' + this.credit.policy.approveFrom + ', decline below ' + this.credit.policy.declineBelow + ', and an officer in between. The Retrain button is a demonstration. I will not start it.'
    ].join('\n');
  }

  private modelMetrics(): string {
    return [
      'Read the three health numbers as operations, not as a formula.',
      '',
      'Gini on the ensemble is 0.722. It is the same ranking skill as ROC-AUC, rescaled the way credit reports print it. Higher means the model separates people who later default from people who pay. It is not the chance that one customer will default.',
      '',
      'KS on the ensemble is 51.4. Walk down the score and watch the share of good accounts and the share of bad accounts. KS is the widest gap between those two shares. A wider gap means the score sorts the book more cleanly. It is not a pass mark for a customer.',
      '',
      'PSI on the ensemble is 0.06. It asks whether the people applying now still look like the people the model was trained on. Under 0.10 is calm. From 0.10 to 0.25, watch. Above 0.25, do not trust the score until someone reviews it. The largest feature shift on the ensemble is affordability, at 0.07, which is still calm.',
      '',
      'Brier, 0.037, says the predicted default rate is close to what later happened. Lower is better. The false-positive rate of 9.8% is good customers ranked as if they were risky. The false-negative rate of 16.1% is future defaulters who still look acceptable. That gap is why the middle of the book is referred to a person.'
    ].join('\n');
  }

  private modelVerdict(): string {
    return [
      'Yes. On the October 2026 validation book the champion is fit to keep using.',
      '',
      'The ensemble was fit on 19 Oct 2026, the next window is 16 Nov 2026, and population stability is calm at 0.06. Origination and behaviour are also inside a calm PSI band. The score bands on screen — expected share against actual share — have not jumped.',
      '',
      'Fit to use does not mean fit to approve. The model ranks. Policy and an officer decide. I will not retrain it and I will not move its cutoff.'
    ].join('\n');
  }

  private modelClose(): string {
    return 'Back on model monitoring. The champion is fit to keep ranking files. Policy still decides, and an officer still owns the middle of the book. Nothing was retrained on this demo.';
  }

  private auditAnswer(q: string): string {
    const latest = AUDIT_EVENTS.slice(0, 4).map(event => `- ${event.time.slice(0, 16).replace('T', ' ')} · ${event.actor} · ${event.action}. ${event.detail}.`);
    if (/\bnot stored|missing|contain\b/.test(q)) {
      return 'The audit log stores who acted, when, which file, and the outcome. It does not store the model weights, a national ID, or a draft that was never submitted. If a line is missing, the action was not recorded. I will not add one, and I will not delete one.';
    }
    return [
      'The audit log is the trail of decisions in this demo: who acted, on which file, and what the outcome was.',
      '',
      'Latest entries:',
      ...latest,
      '',
      'Use it when someone asks why a file moved. A score without a trail is not an explanation. I will not edit these lines.'
    ].join('\n');
  }

  private fileReading(url: string): string {
    const id = this.applicationId(url);
    const loan = id ? this.loans.find(id) : undefined;
    if (loan) return this.loanSpeech(loan);
    const legacy = id ? this.credit.find(id) : undefined;
    if (legacy) return this.legacySpeech(legacy);
    return 'Open a file from Applications and I will read that file against the current policy. I will leave the national ID and phone number out.';
  }

  private loanSpeech(record: LoanRecord): string {
    const assessment = this.loans.latest(record);
    const advice = this.loans.recommendationLabel(assessment);
    const dti = (assessment.affordability.dti * 100).toFixed(1);
    const cap = (assessment.policy.maxDti * 100).toFixed(0);
    return [
      `${record.id} for ${record.customerName} is ${record.status}. The recommendation on the file is “${advice}”.`,
      '',
      `${assessment.input.product}, ${this.credit.money(assessment.input.amount)} over ${assessment.input.tenorMonths} months. Score ${assessment.score} on a 300–900 scale (${this.loans.riskFor(assessment)} risk). Debt service ${dti}% against a ${cap}% cap.`,
      '',
      assessment.reasons.length ? `Reasons already on the file: ${assessment.reasons.join('; ')}.` : 'No extra reason codes are stored on the latest assessment.',
      '',
      this.loans.approvalNeedsOverride(assessment, 'requested')
        ? 'Approving the requested amount from here would be a policy override. It needs an acknowledgement and a written reason. I will not do that.'
        : 'I can rebuild this as a handover note. I will not take the decision.',
      '',
      'National ID and phone are withheld.'
    ].join('\n');
  }

  private legacySpeech(app: CreditApplication): string {
    const policy = this.credit.policy;
    const position = app.score >= policy.approveFrom
      ? 'inside the auto-approve band, which still needs the other gates to pass'
      : app.score < policy.declineBelow
        ? 'under the decline cutoff'
        : 'between the cutoffs, so it sits with an officer';
    return [
      `${app.id} for ${app.applicant} is ${app.decision}, and the case is ${app.caseStatus}. The score of ${app.score} is ${position}.`,
      '',
      `${app.product}, ${this.credit.money(app.amount)} over ${app.tenorMonths} months, via ${app.channel}. Debt service ${(app.dti * 100).toFixed(0)}% against a ${(policy.maxDti * 100).toFixed(0)}% cap. Bureau: ${app.bureau}. Assigned to ${app.assignedTo}.`,
      '',
      `Reasons on the file: ${app.reasonCodes.join('; ')}.`,
      '',
      'This is a demo-book file, separate from the intake queue. I will not change the outcome. National ID and phone are withheld.'
    ].join('\n');
  }

  private handover(url: string): AssistantTurn {
    const id = this.applicationId(url);
    if (id) {
      const loan = this.loans.find(id);
      if (loan) return this.noteFromLoan(loan, 'the file open on this page');
      const legacy = this.credit.find(id);
      if (legacy) return this.noteFromLegacy(legacy, 'the file open on this page');
    }
    const pending = this.loans.applications.find(record => this.loans.pending(record));
    if (pending) return this.noteFromLoan(pending, 'the first file still waiting on an officer');
    const referred = this.credit.applications.find(app => app.decision === 'Refer' && app.caseStatus !== 'Closed');
    if (referred) return this.noteFromLegacy(referred, 'a referred file in the demo book, because the intake queue has no waiting file');
    return { text: 'There is no file to rebuild yet. Assess one customer on Ingestion, then ask again. Identity numbers will stay out of the note.' };
  }

  private noteFromLoan(record: LoanRecord, source: string): AssistantTurn {
    const assessment = this.loans.latest(record);
    const policy = assessment.policy;
    const body = [
      'ECLECTICS AI CREDIT INTELLIGENCE — HANDOVER NOTE',
      'Rebuilt for an officer to edit. This is not a credit decision.',
      'National ID, phone, and account numbers are withheld.',
      '',
      `Source: ${source}.`,
      `File: ${record.id}`,
      `Customer: ${record.customerName}`,
      `Officer status: ${record.status}`,
      `Product: ${assessment.input.product}`,
      `Requested: ${this.credit.money(assessment.input.amount)} over ${assessment.input.tenorMonths} months`,
      `Score: ${assessment.score} (${this.loans.riskFor(assessment)} risk) on a 300–900 scale`,
      `Debt service: ${(assessment.affordability.dti * 100).toFixed(1)}% against a ${(policy.maxDti * 100).toFixed(0)}% cap`,
      `Auto-approve from ${policy.approveFrom}; decline below ${policy.declineBelow}.`,
      `Recommendation on file: ${this.loans.recommendationLabel(assessment)}`,
      `Bureau label: ${this.loans.bureauLabel(assessment)}`,
      '',
      'Reasons already recorded:',
      ...(assessment.reasons.length ? assessment.reasons.map(reason => `- ${reason}`) : ['- None stored on the latest assessment.']),
      '',
      'What the next officer should do:',
      this.loans.approvalNeedsOverride(assessment, 'requested')
        ? '- Approving the requested amount is a policy override. Acknowledge it and write at least 20 characters of reason, or ask for the missing information instead.'
        : '- Confirm the recommendation still matches the saved policy, then record the decision in the queue.',
      '- Do not treat this note as the decision.',
      '',
      'Officer note (edit before handover):',
      '',
      '',
      `Prepared ${new Date().toISOString()} by the AI Credit assistant.`,
      'The assistant did not approve, decline, or override policy.'
    ].join('\n');
    return {
      text: [
        `I rebuilt a handover note for ${record.id} (${record.customerName}), from ${source}.`,
        '',
        `It carries the product, amount, score, debt service against the current cap, the reasons already on the file, and a blank officer note. National ID and phone are not in it.`,
        '',
        'Download it, edit the officer section, and pass that file on. I have not approved or declined the application.'
      ].join('\n'),
      download: { filename: `handover-${record.id}.txt`, body }
    };
  }

  private noteFromLegacy(app: CreditApplication, source: string): AssistantTurn {
    const policy = this.credit.policy;
    const body = [
      'ECLECTICS AI CREDIT INTELLIGENCE — HANDOVER NOTE',
      'Rebuilt for an officer to edit. This is not a credit decision.',
      'National ID, phone, and account numbers are withheld.',
      '',
      `Source: ${source}.`,
      `File: ${app.id}`,
      `Customer: ${app.applicant}`,
      `Case: ${app.decision} · ${app.caseStatus}`,
      `Assigned: ${app.assignedTo}`,
      `Product: ${app.product}`,
      `Channel: ${app.channel} · ${app.branch}, ${app.country}`,
      `Requested: ${this.credit.money(app.amount)} over ${app.tenorMonths} months`,
      `Score: ${app.score} (${app.risk} risk)`,
      `Debt service: ${(app.dti * 100).toFixed(0)}% against a ${(policy.maxDti * 100).toFixed(0)}% cap`,
      `Bureau: ${app.bureau}`,
      `Employment: ${app.employment}`,
      `Auto-approve from ${policy.approveFrom}; decline below ${policy.declineBelow}.`,
      '',
      'Reasons already recorded:',
      ...app.reasonCodes.map(reason => `- ${reason}`),
      '',
      'What the next officer should do:',
      app.decision === 'Refer'
        ? '- This file is referred. Confirm income evidence and whether any hard rule has fired, then record the outcome. Do not treat a mid-range score as an approval.'
        : '- The outcome is already recorded. Use this note to brief the next person. Do not reopen it from this assistant.',
      '- Do not paste the national ID or phone into chat or email.',
      '',
      'Officer note (edit before handover):',
      '',
      '',
      `Prepared ${new Date().toISOString()} by the AI Credit assistant.`,
      'The assistant did not approve, decline, or override policy.'
    ].join('\n');
    return {
      text: [
        `I rebuilt a handover note for ${app.id} (${app.applicant}), from ${source}.`,
        '',
        `${app.product}, ${this.credit.money(app.amount)}, score ${app.score}, currently ${app.decision}. The note includes the reasons on the file and a blank section for the next officer. National ID and phone are not in it.`,
        '',
        'Download it and edit the officer section. I have not changed the case.'
      ].join('\n'),
      download: { filename: `handover-${app.id}.txt`, body }
    };
  }
}
