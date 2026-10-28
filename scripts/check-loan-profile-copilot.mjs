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
const temp = fs.mkdtempSync(path.join(root, '.experience-check-'));
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
let workflow, queue, applications, productPage, presenter;
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
  // Older snapshots remain historical; reassessment applies the new profile score.
  const fixture = workflow.customers.find(c => c.id === felix.id), points = fixture.scorecardAdjustment;
  delete fixture.scorecardAdjustment;
  const old = await workflow.submit(felix.profile, { submissionKey: 'old-felix' });
  assert.equal(latestAssessment(old).score, 624);
  const historical = JSON.stringify(latestAssessment(old));
  fixture.scorecardAdjustment = points;
  const updated = await workflow.submit(felix.profile, { applicationId: old.id, submissionKey: 'updated-felix', reassessmentNote: 'Updated customer credit history reviewed.' });
  const a = latestAssessment(updated);
  assert.equal(a.score, 800); assert.equal(a.risk, 'Low'); assert.equal(a.ai.risk, 'Low');
  assert.equal(a.limit.offer.score, 800); assert.equal(a.limit.maximumAmount, 436000); assert.equal(a.limit.recommendedAmount, 400000);
  assert.equal(a.input.income, 150000); assert.equal(a.recommendation, 'Approved'); assert.equal(updated.status, 'Awaiting decision');
  assert.equal(a.scorecardAdjustment.points, 176); assert.equal(a.scorecardAdjustment.sourceScore, 624);
  assert.equal(a.baseScore + a.contributions.reduce((sum, factor) => sum + factor.impact, 0), 800);
  assert.equal(JSON.stringify(updated.assessments[0]), historical);
  const editedDraft = { ...felix.profile, income: 100000 };
  const edited = await workflow.submit(editedDraft, { submissionKey: 'edited-felix' });
  assert.equal(latestAssessment(edited).score, credit.scoreDraft(editedDraft).score);
  assert.equal(latestAssessment(edited).scorecardAdjustment, undefined);
  const reloaded = new LoanWorkflowService(credit, auth); assert.equal(reloaded.storageError, '');
  assert.equal(latestAssessment(reloaded.find(updated.id)).score, 800); reloaded.ngOnDestroy();
  const saved = localStorage.getItem(LOAN_STORAGE_KEY), invalidData = JSON.parse(saved);
  latestAssessment(invalidData.applications.find(r => r.id === updated.id)).scorecardAdjustment.points++;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(invalidData));
  const rejected = new LoanWorkflowService(credit, auth); assert.match(rejected.storageError, /could not be read/); rejected.ngOnDestroy();
  localStorage.setItem(LOAN_STORAGE_KEY, saved);

  productPage = new NewApplicationComponent(new FormBuilder(), routeFor({}), workflow); productPage.ngOnInit();
  productPage.directoryOpen = true; productPage.nationalId = felix.profile.nationalId;
  let retrieval = productPage.lookup(); assert.equal(productPage.looking, true); assert.equal(productPage.customer, null);
  productPage.chooseCustomer(workflow.customers[0].profile.nationalId);
  assert.equal(productPage.nationalId, felix.profile.nationalId); productPage.setTab('bulk'); assert.equal(productPage.tab, 'individual');
  await new Promise(resolve => setTimeout(resolve, 30)); assert.equal(productPage.looking, true);
  await retrieval; assert.equal(productPage.looking, false); assert.equal(productPage.directoryOpen, false);
  assert.equal(productPage.customer.profile.applicant, 'Felix Sayia'); assert.equal(productPage.form.getRawValue().income, 150000);
  productPage.directoryOpen = true; productPage.nationalId = 'UNKNOWN'; await productPage.lookup();
  assert.equal(productPage.customer, null); assert.equal(productPage.directoryOpen, true); assert.match(productPage.error, /not found/); assert.equal(productPage.looking, false);
  productPage.nationalId = felix.profile.nationalId; await productPage.lookup(); assert.equal(productPage.directoryOpen, false); assert.equal(productPage.error, '');
  productPage.customer = null; productPage.directoryOpen = true; retrieval = productPage.lookup(); productPage.reset(); await retrieval;
  assert.equal(productPage.customer, null); assert.equal(productPage.looking, false); assert.equal(productPage.directoryOpen, false);
  productPage.nationalId = felix.profile.nationalId; retrieval = productPage.lookup(); productPage.ngOnDestroy(); await retrieval;
  assert.equal(productPage.customer, null); assert.equal(productPage.looking, false);

  presenter = new LoanAssessmentComponent(workflow); presenter.assessment = a; presenter.applicationId = updated.id;
  const realSuggestions = workflow.productSuggestions.bind(workflow); let calls = 0;
  workflow.productSuggestions = snapshot => { calls++; return realSuggestions(snapshot); };
  presenter.ngOnChanges(); assert.equal(presenter.copilotState, 'idle'); assert.equal(presenter.productSuggestions.length, 0); assert.equal(calls, 0);
  let briefing = presenter.loadCopilot(); assert.equal(presenter.copilotState, 'loading'); assert.equal(presenter.productSuggestions.length, 0);
  await presenter.loadCopilot(); await new Promise(resolve => setTimeout(resolve, 30)); assert.equal(presenter.copilotState, 'loading');
  await briefing; assert.equal(presenter.copilotState, 'ready'); assert.equal(calls, 1); assert.equal(presenter.productSuggestions.length, 2);
  await presenter.loadCopilot(); assert.equal(presenter.copilotState, 'idle'); assert.equal(presenter.productSuggestions.length, 0);
  workflow.productSuggestions = () => { throw new Error('Briefing is temporarily unavailable.'); };
  await presenter.loadCopilot(); assert.equal(presenter.copilotState, 'error'); assert.match(presenter.copilotError, /temporarily unavailable/);
  workflow.productSuggestions = snapshot => { calls++; return realSuggestions(snapshot); };
  await presenter.loadCopilot(); assert.equal(presenter.copilotState, 'ready'); assert.equal(presenter.copilotError, '');
  await presenter.loadCopilot(); briefing = presenter.loadCopilot(); presenter.selectTab('policy'); await briefing;
  assert.equal(presenter.copilotState, 'idle'); presenter.selectTab('insights'); assert.equal(presenter.productSuggestions.length, 0);
  briefing = presenter.loadCopilot(); presenter.ngOnChanges(); await briefing; assert.equal(presenter.copilotState, 'idle');
  briefing = presenter.loadCopilot(); presenter.ngOnDestroy(); await briefing; assert.equal(presenter.copilotState, 'idle');
  assert.equal(calls, 2); workflow.productSuggestions = realSuggestions;
  const template = fs.readFileSync(path.join(root, prefix, 'workflow/loan-assessment.component.html'), 'utf8');
  assert(template.indexOf('ai-model-first') < template.indexOf('class="copilot-launch"'));
  assert(template.includes('*ngIf="copilotState === \'ready\'"'));
  console.log('PASS: Felix request and offer score 800/900, Low risk, 436000 maximum, 400000 offer and unchanged income.');
  console.log('PASS: historical score preservation, reassessment, score contribution reconciliation, financial edits, reload and metadata validation.');
  console.log('PASS: profile loading is visible, duplicate selection is blocked, the directory collapses on success and failure/retry/reset/navigation are handled.');
  console.log('PASS: models first, Copilot idle/loading/ready/error/retry, lazy product generation, duplicate clicks and cancellation on assessment/tab/navigation changes.');
} finally {
  presenter?.ngOnDestroy(); productPage?.ngOnDestroy(); workflow?.ngOnDestroy();
  fs.rmSync(temp, { recursive: true, force: true });
}
