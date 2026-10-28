import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationDraft } from '../credit-data.service';
import { readLoanUpload, BULK_COLUMNS } from '../workflow/loan-bulk';
import { BulkApplicationRow, LoanCustomer, LoanRecord } from '../workflow/loan-workflow.models';
import { LoanWorkflowService, loanId } from '../workflow/loan-workflow.service';
import { customerFacts } from '../workflow/loan-eligibility.engine';
import { LoanConnector, LoanConnectorResult } from '../workflow/loan-integration.service';

@Component({ selector: 'app-new-application', templateUrl: './new-application.component.html', styleUrls: ['../workflow/loan-workflow.scss', './loan-intake-integration.scss'] })
export class NewApplicationComponent implements OnInit, OnDestroy {
  tab: 'individual' | 'bulk' | 'integration' = 'individual'; nationalId = ''; customer: LoanCustomer | null = null;
  readonly modes = [
    { id: 'individual', label: 'Individual application', detail: 'Assess one customer', icon: '01' },
    { id: 'bulk', label: 'Bulk Intelligence', detail: 'Assess a file of applications', icon: '02' },
    { id: 'integration', label: 'Integration', detail: 'Connectors and application checks', icon: '03' }
  ] as const;
  connectorId = 'bureau'; integrationApplicantId = ''; integrationResult: LoanConnectorResult | null = null;
  integrationBusy = false; integrationError = ''; integrationBanner = '';
  created: LoanRecord | null = null; error = ''; looking = false; busy = false; reading = false; processing = false;
  directoryOpen = false;
  assessmentStep = 0;
  readonly assessmentStages = [
    { title: 'Preparing application', detail: 'Customer profile and requested terms' },
    { title: 'Running risk assessment', detail: 'Credit signals and affordability' },
    { title: 'Preparing results', detail: 'Policy checks and recommended limit' }
  ];
  private destroyed = false;
  private assessmentWait: { timer: ReturnType<typeof setTimeout>; resolve: () => void } | null = null;
  private assessmentFrame: number | null = null;
  private profileRequest = 0;
  private profileWait: { timer: ReturnType<typeof setTimeout>; resolve: () => void } | null = null;
  rows: BulkApplicationRow[] = []; fileName = ''; bulkDone = 0; bulkCancelled = false;
  reassessmentId = ''; reassessmentNote = ''; submissionKey = loanId('SINGLE');
  recommendationContext = '';
  private subscription = new Subscription();
  readonly verificationFields = [
    { key: 'nationalIdVerified', label: 'National ID verified' }, { key: 'kycCompleted', label: 'KYC completed' },
    { key: 'crbDefaulter', label: 'Currently a CRB-listed defaulter' }, { key: 'crbBlacklisted', label: 'Currently blacklisted at CRB' },
    { key: 'previousInstitutionDefault', label: 'Previous default with this institution' }
  ];
  readonly customerNumberFields = [
    { key: 'accountTenureMonths', label: 'Account tenure · months', step: 1 },
    { key: 'employmentTenureMonths', label: 'Current employment / business · months', step: 1 },
    { key: 'activeLoans', label: 'Number of active loans', step: 1 }, { key: 'activeLenders', label: 'Number of active lenders', step: 1 },
    { key: 'ageYears', label: 'Age · years', step: 1 }, { key: 'averageBalance6m', label: 'Average balance · last 6 months (KSh)', step: 0.01 }
  ];
  form = this.fb.group({
    product: ['Personal Loan', Validators.required], amount: [250000, [Validators.required, Validators.min(1)]],
    tenorMonths: [12, [Validators.required, Validators.min(1), Validators.max(60), Validators.pattern(/^\d+$/)]],
    income: [350000, [Validators.required, Validators.min(1)]], obligations: [40000, [Validators.required, Validators.min(0)]],
    employment: ['Salaried', Validators.required], bureau: ['Clean', Validators.required], channel: ['Branch', Validators.required],
    customerFacts: this.fb.group({
      nationalIdVerified: [null as boolean | null], kycCompleted: [null as boolean | null], crbDefaulter: [null as boolean | null],
      crbBlacklisted: [null as boolean | null], previousInstitutionDefault: [null as boolean | null],
      accountTenureMonths: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      employmentTenureMonths: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      activeLoans: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      activeLenders: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      ageYears: [null as number | null, [Validators.min(0), Validators.max(120), Validators.pattern(/^\d+$/)]],
      averageBalance6m: [null as number | null, Validators.min(0)]
    })
  });
  constructor(private fb: FormBuilder, private route: ActivatedRoute, public workflow: LoanWorkflowService) {}
  ngOnInit(): void {
    this.subscription.add(this.route.queryParamMap.subscribe(params => {
      if (this.busy || this.processing || this.integrationBusy) { return; }
      this.reset(); const id = params.get('reassess');
      if (!id) {
        if (params.get('mode') === 'integration') { this.integrationApplicantId = params.get('application') || ''; this.setTab('integration'); }
        else if (params.get('customer')) {
          const customer = this.workflow.lookup(params.get('customer')!);
          const product = params.get('product') || '', amount = Number(params.get('amount')), tenor = Number(params.get('tenor'));
          if (!customer || !this.workflow.products.includes(product) || !Number.isFinite(amount) || amount < 1 ||
              !Number.isInteger(tenor) || tenor < 1 || tenor > 60) {
            this.error = 'The product suggestion is incomplete. Choose a customer and review the terms.'; return;
          }
          const sourceId = params.get('sourceApplication');
          if (sourceId) {
            const source = this.workflow.find(sourceId), version = Number(params.get('sourceVersion'));
            const snapshot = source?.assessments.find(a => a.version === version);
            if (!source || source.nationalId !== customer.profile.nationalId || !snapshot) {
              this.error = 'The source assessment for this suggestion was not found.'; return;
            }
            customer.profile = { ...snapshot.input };
            customer.facts = snapshot.eligibility?.customer || customer.facts;
          }
          this.customer = customer; this.nationalId = customer.profile.nationalId;
          this.form.patchValue({ ...customer.profile, product, amount, tenorMonths: tenor, customerFacts: customer.facts });
          this.recommendationContext = product + ' suggestion for ' + customer.profile.applicant + '. Review the details, then run a new assessment.';
        }
        return;
      }
      const record = this.workflow.find(id);
      if (!record || !this.workflow.pending(record)) { this.error = 'The reassessment application is missing or already finalised.'; return; }
      this.reassessmentId = id; this.nationalId = record.nationalId; this.customer = this.workflow.lookup(record.nationalId);
      this.form.patchValue({ ...this.workflow.latest(record).input, customerFacts: this.workflow.latest(record).eligibility?.customer || this.customer?.facts });
    }));
  }
  setTab(mode: 'individual' | 'bulk' | 'integration'): void {
    if (this.looking || this.busy || this.processing || this.reading || this.integrationBusy || (!!this.reassessmentId && mode !== 'individual')) { return; }
    this.tab = mode; this.error = '';
    if (mode === 'integration' && !this.workflow.find(this.integrationApplicantId)) { this.integrationApplicantId = this.workflow.applications[0]?.id || ''; this.integrationResult = null; }
  }
  modeKey(event: KeyboardEvent, index: number): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { return; } event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    this.setTab(this.modes[next].id);
    if (typeof document !== 'undefined') { document.getElementById('intake-tab-' + this.tab)?.focus(); }
  }
  get selectedConnector(): LoanConnector | undefined { return this.workflow.integration.find(this.connectorId); }
  get integrationApplicants(): LoanRecord[] { return this.workflow.applications; }
  selectConnector(item: LoanConnector): void { if (this.integrationBusy) { return; } this.connectorId = item.id; this.integrationResult = null; this.integrationError = ''; this.integrationBanner = ''; }
  toggleConnector(): void {
    if (this.integrationBusy) { return; } this.integrationError = ''; this.integrationResult = null;
    try { const item = this.workflow.integration.toggle(this.connectorId); this.integrationBanner = item.name + (item.status === 'Paused' ? ' paused.' : ' available for API previews.'); }
    catch (e) { this.integrationError = this.workflow.errorMessage(e); }
  }
  async runIntegrationCheck(): Promise<void> {
    if (this.integrationBusy) { return; } this.integrationError = ''; this.integrationResult = null; this.integrationBanner = '';
    const record = this.workflow.find(this.integrationApplicantId);
    if (!record) { this.integrationError = 'Select a saved application before running a check.'; return; }
    this.integrationBusy = true;
    try { this.integrationResult = await this.workflow.integration.runCheck(this.connectorId, record); }
    catch (e) { this.integrationError = this.workflow.errorMessage(e); }
    finally { this.integrationBusy = false; }
  }
  ngOnDestroy(): void {
    this.destroyed = true; this.subscription.unsubscribe(); this.finishAssessmentWait(); this.cancelProfileLookup();
    if (this.assessmentFrame !== null && typeof window !== 'undefined') { window.cancelAnimationFrame(this.assessmentFrame); }
  }
  private waitForAssessmentStage(): Promise<void> {
    // A short presentation transition makes the browser-based demo's busy state visible.
    // These stages are not measured progress from a remote ML inference job.
    return new Promise(resolve => {
      const timer = setTimeout(() => { this.assessmentWait = null; resolve(); }, 650);
      this.assessmentWait = { timer, resolve };
    });
  }
  private finishAssessmentWait(): void {
    const pending = this.assessmentWait; this.assessmentWait = null;
    if (pending) { clearTimeout(pending.timer); pending.resolve(); }
  }
  private focusAssessmentStatus(id: string): void {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') { return; }
    if (this.assessmentFrame !== null) { window.cancelAnimationFrame(this.assessmentFrame); }
    this.assessmentFrame = window.requestAnimationFrame(() => {
      this.assessmentFrame = null;
      if (this.destroyed) { return; }
      const element = document.getElementById(id);
      element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  }
  reset(): void {
    this.cancelProfileLookup(); this.directoryOpen = false;
    this.tab = 'individual';
    this.created = null; this.customer = null; this.error = ''; this.nationalId = ''; this.assessmentStep = 0;
    this.reassessmentId = ''; this.reassessmentNote = ''; this.submissionKey = loanId('SINGLE'); this.recommendationContext = '';
  }
  clearCustomer(): void { if (!this.reassessmentId) { this.customer = null; this.created = null; this.error = ''; this.recommendationContext = ''; this.submissionKey = loanId('SINGLE'); } }
  async lookup(): Promise<void> {
    if (this.destroyed || this.looking || this.busy || this.reassessmentId) { return; }
    const request = ++this.profileRequest, nationalId = this.nationalId;
    this.looking = true; this.error = ''; this.customer = null; this.created = null;
    try {
      // The directory is local. This presentation delay lets the loading state paint;
      // it does not represent a live core-banking request.
      const [customer] = await Promise.all([Promise.resolve().then(() => this.workflow.lookup(nationalId)),
        new Promise<void>(resolve => {
          const timer = setTimeout(() => { this.profileWait = null; resolve(); }, 750);
          this.profileWait = { timer, resolve };
        })]);
      if (this.destroyed || request !== this.profileRequest) { return; }
      if (!customer) { throw new Error('Customer not found. Check the ID or choose a customer from the directory.'); }
      this.customer = customer; this.directoryOpen = false; this.recommendationContext = '';
      this.form.patchValue({ ...customer.profile, customerFacts: customer.facts }); this.submissionKey = loanId('SINGLE');
      this.focusAssessmentStatus('retrieved-customer-profile');
    } catch (error) { if (!this.destroyed && request === this.profileRequest) { this.error = this.workflow.errorMessage(error); } }
    finally { if (request === this.profileRequest) { this.cancelProfileLookup(); } }
  }
  private cancelProfileLookup(): void {
    ++this.profileRequest; this.looking = false;
    const pending = this.profileWait; this.profileWait = null;
    if (pending) { clearTimeout(pending.timer); pending.resolve(); }
  }
  async submit(): Promise<void> {
    if (this.destroyed || this.busy || this.processing || this.created) { return; }
    if (!this.customer || this.form.invalid) { this.form.markAllAsTouched(); this.error = 'Look up a customer and complete valid loan and financial details.'; return; }
    this.busy = true; this.error = ''; this.assessmentStep = 0; this.focusAssessmentStatus('assessment-loading');
    try {
      const value = this.form.getRawValue();
      const draft: ApplicationDraft = { ...this.customer.profile, product: value.product || '', amount: Number(value.amount), tenorMonths: Number(value.tenorMonths), income: Number(value.income), obligations: Number(value.obligations), employment: value.employment || '', bureau: value.bureau || '', channel: value.channel || '' };
      const options = { applicationId: this.reassessmentId || undefined, submissionKey: this.submissionKey, reassessmentNote: this.reassessmentNote, customerFacts: customerFacts(value.customerFacts) };
      await this.waitForAssessmentStage();
      if (this.destroyed) { return; }
      this.assessmentStep = 1;
      const [result] = await Promise.all([this.workflow.submit(draft, options), this.waitForAssessmentStage()]);
      if (this.destroyed) { return; }
      this.assessmentStep = 2;
      await this.waitForAssessmentStage();
      if (this.destroyed) { return; }
      this.created = result; this.integrationApplicantId = result.id; this.focusAssessmentStatus('assessment-complete');
    } catch (error) {
      if (!this.destroyed) { this.error = this.workflow.errorMessage(error); this.focusAssessmentStatus('application-error'); }
    } finally { this.finishAssessmentWait(); this.busy = false; }
  }
  async upload(event: Event): Promise<void> {
    if (this.processing || this.reading) { return; }
    const input = event.target as HTMLInputElement; const file = input.files?.[0];
    if (!file) { return; }
    this.reading = true; this.error = ''; this.rows = []; this.fileName = file.name; this.bulkDone = 0;
    try { this.rows = this.workflow.validateBulk(await readLoanUpload(file)); }
    catch (error) { this.error = this.workflow.errorMessage(error); }
    finally { this.reading = false; input.value = ''; }
  }
  customerName(id: string): string { const customer = this.workflow.lookup(id); return customer ? customer.profile.applicant : 'Customer not found'; }
  get liveInstallment(): number { const v = this.form.getRawValue(); return Number(v.tenorMonths) > 0 ? Number(v.amount) / Number(v.tenorMonths) : 0; }
  get liveDti(): number { const v = this.form.getRawValue(); return Number(v.income) > 0 ? (Number(v.obligations) + this.liveInstallment) / Number(v.income) : 0; }
  get assessedRows(): BulkApplicationRow[] { return this.rows.filter(x => x.state === 'Saved'); }
  chooseCustomer(id: string): void { if (!this.destroyed && !this.looking && !this.busy && !this.reassessmentId) { this.nationalId = id; void this.lookup(); } }
  get readyCount(): number { return this.rows.filter(x => x.state === 'Ready' || x.state === 'Failed').length; }
  get savedCount(): number { return this.rows.filter(x => x.state === 'Saved').length; }
  get invalidCount(): number { return this.rows.filter(x => x.state === 'Invalid').length; }
  get failedCount(): number { return this.rows.filter(x => x.state === 'Failed').length; }
  async processBulk(): Promise<void> {
    if (this.processing || !this.readyCount) { return; }
    this.processing = true; this.bulkCancelled = false; this.error = ''; this.bulkDone = 0;
    const pending = this.rows.filter(x => x.state === 'Ready' || x.state === 'Failed');
    try {
      for (const row of pending) {
        if (this.bulkCancelled) { break; }
        try { const result = await this.workflow.submitBulkRow(row); row.state = 'Saved'; row.resultId = result.id; row.message = this.workflow.isAutoApproved(result) ? 'Approved automatically · ' + this.workflow.money(result.approvedAmount!) : 'Assessment saved; awaiting officer decision.'; }
        catch (error) { row.state = 'Failed'; row.message = this.workflow.errorMessage(error); }
        this.bulkDone++;
        if (this.bulkDone % 5 === 0) { await new Promise<void>(resolve => setTimeout(resolve, 0)); }
      }
    } finally { this.processing = false; }
  }
  downloadTemplate(): void {
    const customers = this.workflow.customers;
    const text = [BULK_COLUMNS.join(','), ...customers.map(c => [c.profile.nationalId, c.profile.amount, c.profile.tenorMonths, c.profile.product, '', ''].join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'loan-applications-template.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
