import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { convertToParamMap } from '@angular/router';

const root = process.cwd(), prefix = 'src/app/views/pages/credit/';
const temp = fs.mkdtempSync(path.join(root, '.recommendation-check-'));
const names = ['credit-demo.data.ts', 'credit-data.service.ts', 'workflow/loan-workflow.models.ts',
  'workflow/loan-ai.engine.ts', 'workflow/loan-limit.engine.ts', 'workflow/loan-eligibility.engine.ts',
  'workflow/loan-auto-approval.engine.ts', 'workflow/loan-product-recommender.ts',
  'workflow/loan-customers.data.ts', 'workflow/loan-integration.service.ts', 'workflow/loan-mock-api.client.ts',
  'workflow/loan-workflow.service.ts', 'workflow/loan-bulk.ts', 'workflow/loan-assessment.component.ts',
  'new-application/new-application.component.ts', 'applications/applications.component.ts',
  'decision-queue/loan-decision-queue.component.ts'];
for (const name of names) {
  const target = path.join(temp, prefix, name.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, ts.transpileModule(fs.readFileSync(path.join(root, prefix, name), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020, experimentalDecorators: true }
  }).outputText.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, '$1$2.mjs$3'));
}
const stub = path.join(temp, 'src/app/shared/services/auth.service.mjs');
fs.mkdirSync(path.dirname(stub), { recursive: true }); fs.writeFileSync(stub, 'export class AuthService {}');
const load = name => import(pathToFileURL(path.join(temp, prefix, name + '.mjs')));
class MemoryStorage { values = new Map(); getItem(k) { return this.values.get(k) ?? null; } setItem(k,v) { this.values.set(k,v); } removeItem(k) { this.values.delete(k); } }
globalThis.localStorage = new MemoryStorage();
const routeFor = params => ({ queryParamMap: new BehaviorSubject(convertToParamMap(Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])))) });
let workflow, queue, applications, productPage;
try {
  const { CreditDataService } = await load('credit-data.service');
  const { LoanWorkflowService } = await load('workflow/loan-workflow.service');
  const { LoanAssessmentComponent } = await load('workflow/loan-assessment.component');
  const { NewApplicationComponent } = await load('new-application/new-application.component');
  const { LoanDecisionQueueComponent } = await load('decision-queue/loan-decision-queue.component');
  const { ApplicationsComponent } = await load('applications/applications.component');
  const { latestAssessment, LOAN_STORAGE_KEY } = await load('workflow/loan-workflow.models');
  const { recommendLoanProducts } = await load('workflow/loan-product-recommender');
  const { loanRowsFromCells } = await load('workflow/loan-bulk');
  const credit = new CreditDataService(), auth = { getCurrentUser: () => ({ username: 'Verification officer' }) };
  workflow = new LoanWorkflowService(credit, auth);
  const felix = workflow.customers.find(c => c.profile.applicant === 'Felix Sayia');
  const automatic = [];
  for (const amount of [1, 500, 5000, 9999, 10000]) {
    const record = await workflow.submit({ ...felix.profile, amount }, { submissionKey: 'auto-' + amount });
    assert.equal(record.status, 'Approved'); assert.equal(record.approvalMode, 'Automatic');
    assert.equal(record.approvedAmount, amount); assert.equal(workflow.pending(record), false);
    const event = record.history.at(-1); assert.equal(event.action, 'Auto-approved');
    assert.equal(event.officerSource, 'System policy'); assert.equal(event.automaticRule, 'small-loan-policy-1');
    assert.equal(event.policyOverride, false); assert.equal(latestAssessment(record).automaticApproval.eligible, true);
    automatic.push(record);
  }
  assert.equal(workflow.pendingCount, 0);
  for (const amount of [10000.01, 10001]) {
    const record = await workflow.submit({ ...felix.profile, amount }, { submissionKey: 'manual-' + amount });
    assert.equal(record.status, 'Awaiting decision'); assert.equal(record.approvedAmount, undefined);
  }
  for (const amount of [0, -1, NaN]) await assert.rejects(workflow.submit({ ...felix.profile, amount }, { submissionKey: 'invalid-' + amount }));
  const factCases = [{ kycCompleted: false }, { kycCompleted: null }, { nationalIdVerified: false },
    { crbDefaulter: true }, { crbBlacklisted: true }, { previousInstitutionDefault: true },
    { activeLoans: 5 }, { activeLenders: 4 }, { accountTenureMonths: 5 }, { employmentTenureMonths: 5 }];
  for (const [i, changes] of factCases.entries()) {
    const record = await workflow.submit({ ...felix.profile, amount: 5000 }, {
      submissionKey: 'held-facts-' + i, customerFacts: { ...felix.facts, ...changes }
    });
    assert.equal(record.status, 'Awaiting decision'); assert.equal(record.approvedAmount, undefined);
    assert.equal(latestAssessment(record).automaticApproval.eligible, false);
  }
  for (const [i, changes] of [{ obligations: 80000 }, { bureau: 'Thin file' },
      { income: 50000, employment: 'Self employed', obligations: 5000 }].entries()) {
    const record = await workflow.submit({ ...felix.profile, amount: 5000, ...changes }, { submissionKey: 'held-finance-' + i });
    assert.equal(record.status, 'Awaiting decision'); assert.equal(record.approvedAmount, undefined);
  }
  workflow.integration.toggle('core');
  const dataHeld = await workflow.submit({ ...felix.profile, amount: 5000 }, { submissionKey: 'data-held' });
  assert.equal(dataHeld.status, 'Awaiting decision');
  workflow.integration.toggle('core');
  const reassessed = await workflow.submit({ ...felix.profile, amount: 5000 }, {
    applicationId: dataHeld.id, submissionKey: 'data-recovered', reassessmentNote: 'Required data source is available again.'
  });
  assert.equal(reassessed.status, 'Approved'); assert.equal(reassessed.approvalMode, 'Automatic'); assert.equal(reassessed.assessments.length, 2);
  const header = ['national_id', 'requested_amount', 'tenor_months', 'product'];
  const rows = workflow.validateBulk(loanRowsFromCells([header, ...[5000, 10000, 10001].map(n => [felix.profile.nationalId, n, 12, 'Personal Loan'])]));
  assert(rows.every(r => r.state === 'Ready'));
  const bulk = []; for (const row of rows) bulk.push(await workflow.submitBulkRow(row));
  assert.deepEqual(bulk.map(r => r.status), ['Approved', 'Approved', 'Awaiting decision']);
  const queueRoute = routeFor({}); queue = new LoanDecisionQueueComponent(queueRoute, workflow); queue.ngOnInit();
  assert(queue.rows.every(record => !workflow.isAutoApproved(record)));
  queue.select(automatic[0].id); queue.begin('Approve'); assert.equal(queue.confirmation, null);
  applications = new ApplicationsComponent(workflow); applications.ngOnInit(); applications.recommendation = 'Approved';
  assert(automatic.every(record => applications.rows.some(row => row.id === record.id)));
  const reload = new LoanWorkflowService(credit, auth); assert.equal(reload.storageError, '');
  assert.equal(reload.find(automatic[0].id).status, 'Approved'); reload.ngOnDestroy();
  const saved = localStorage.getItem(LOAN_STORAGE_KEY);
  const tampered = JSON.parse(saved), autoRecord = tampered.applications.find(r => r.approvalMode === 'Automatic');
  autoRecord.history.at(-1).approvedAmount = 20000; autoRecord.approvedAmount = 20000;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(tampered));
  const invalid = new LoanWorkflowService(credit, auth); assert.match(invalid.storageError, /could not be read/); invalid.ngOnDestroy();
  localStorage.setItem(LOAN_STORAGE_KEY, saved);
  const brian = workflow.customers.find(c => c.profile.applicant === 'Brian Otieno');
  const personal = await workflow.submit({ ...brian.profile, income: 1100000, obligations: 61000 }, { submissionKey: 'source-product-case' });
  const original = JSON.stringify(personal), a = latestAssessment(personal);
  const suggestions = recommendLoanProducts(a, candidate => credit.scoreDraft(candidate));
  assert.equal(suggestions.length, 2); assert(suggestions.some(s => s.product === 'Salary Advance'));
  assert(suggestions.every(s => s.product !== a.input.product && s.amount > 0 && s.amount <= a.input.amount));
  assert(!suggestions.some(s => s.product === 'SME Working Capital'));
  assert.deepEqual(suggestions, recommendLoanProducts({ ...a, input: { ...a.input, applicant: 'Other person', nationalId: 'OTHER-ID', phone: 'OTHER' } }, candidate => credit.scoreDraft(candidate)));
  const peter = workflow.customers.find(c => c.profile.applicant === 'Peter Mutua');
  const business = await workflow.submit(peter.profile, { submissionKey: 'business-product-case' });
  assert.equal(recommendLoanProducts(latestAssessment(business), candidate => credit.scoreDraft(candidate))[0].product, 'SME Working Capital');
  assert(!recommendLoanProducts(latestAssessment(business), candidate => credit.scoreDraft(candidate)).some(s => s.product === 'Salary Advance'));
  const presenter = new LoanAssessmentComponent(workflow); presenter.assessment = a; presenter.applicationId = personal.id; presenter.ngOnChanges();
  assert(presenter.copilotBrief.length < 240);
  const selected = presenter.productSuggestions[0], countBefore = workflow.applications.length;
  productPage = new NewApplicationComponent(new FormBuilder(), routeFor(presenter.suggestionParams(selected)), workflow);
  productPage.ngOnInit();
  assert.equal(productPage.form.getRawValue().product, selected.product);
  assert.equal(productPage.form.getRawValue().amount, selected.amount);
  assert.equal(productPage.form.getRawValue().income, 1100000);
  assert.deepEqual(productPage.form.getRawValue().customerFacts, a.eligibility.customer);
  assert.equal(productPage.reassessmentId, ''); assert.equal(workflow.applications.length, countBefore);
  await productPage.submit(); assert(productPage.created); assert.notEqual(productPage.created.id, personal.id);
  assert.equal(JSON.stringify(workflow.find(personal.id)), original); presenter.ngOnDestroy();
  // Older pending records are read as saved; adding the rule does not approve them on reload.
  const legacy = JSON.parse(localStorage.getItem(LOAN_STORAGE_KEY));
  const old = legacy.applications.find(r => latestAssessment(r).input.amount === 10000 && r.approvalMode === 'Automatic');
  delete latestAssessment(old).automaticApproval; old.history.pop(); old.status = 'Awaiting decision';
  delete old.approvalMode; delete old.approvedAmount;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(legacy));
  const legacyReload = new LoanWorkflowService(credit, auth); assert.equal(legacyReload.storageError, '');
  assert.equal(legacyReload.find(old.id).status, 'Awaiting decision'); legacyReload.ngOnDestroy();
  console.log('PASS: KSh 1–10,000 automatic approval, KSh 10,000.01 manual routing, system history, reload validation and tamper rejection.');
  console.log('PASS: KYC, ID, bureau/default, tenure, exposure, affordability, score and unavailable-data holds; reassessment and bulk routing.');
  console.log('PASS: automatic cases leave the pending queue and appear as approved in Applications.');
  console.log('PASS: product ranking, identity invariance, source-preserving prefill and a fresh assessment without changing the original application.');
} finally {
  productPage?.ngOnDestroy(); queue?.ngOnDestroy(); applications?.ngOnDestroy(); workflow?.ngOnDestroy();
  fs.rmSync(temp, { recursive: true, force: true });
}
