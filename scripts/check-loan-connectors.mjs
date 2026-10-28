import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';

const root = process.cwd(), prefix = 'src/app/views/pages/credit/';
const temp = fs.mkdtempSync(path.join(root, '.connector-check-'));
const names = ['credit-demo.data.ts', 'credit-data.service.ts', 'workflow/loan-workflow.models.ts',
  'workflow/loan-ai.engine.ts', 'workflow/loan-limit.engine.ts', 'workflow/loan-eligibility.engine.ts',
  'workflow/loan-customers.data.ts', 'workflow/loan-integration.service.ts',
  'workflow/loan-mock-api.client.ts', 'workflow/loan-auto-approval.engine.ts', 'workflow/loan-product-recommender.ts', 'workflow/loan-workflow.service.ts', 'workflow/loan-bulk.ts',
  'new-application/new-application.component.ts'];
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
class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
globalThis.localStorage = new MemoryStorage();
localStorage.setItem('eclectics-loan-api-settings-v1', JSON.stringify({ mode: 'api', baseUrl: 'http://127.0.0.1:3300', scenario: 'error' }));
const originalFetch = globalThis.fetch, originalXhr = globalThis.XMLHttpRequest;
let networkCalls = 0, integration, workflow;
globalThis.fetch = () => { networkCalls++; throw new Error('Network is disabled for preview checks.'); };
globalThis.XMLHttpRequest = class { constructor() { networkCalls++; throw new Error('Network is disabled.'); } };
try {
  const { CreditDataService } = await load('credit-data.service');
  const { LoanWorkflowService } = await load('workflow/loan-workflow.service');
  const { LoanIntegrationService } = await load('workflow/loan-integration.service');
  const { latestAssessment } = await load('workflow/loan-workflow.models');
  const { NewApplicationComponent } = await load('new-application/new-application.component');
  integration = new LoanIntegrationService();
  assert.equal(integration.availability().decision, 'Approved');
  workflow = new LoanWorkflowService(new CreditDataService(), { getCurrentUser: () => ({ username: 'Preview verification' }) }, integration);
  assert.equal(workflow.customers.length, 15);
  const felix = workflow.customers.find(c => c.profile.applicant === 'Felix Sayia');
  const record = await workflow.submit(felix.profile, { submissionKey: 'preview-felix' });
  assert.equal(latestAssessment(record).ai.risk, 'Low');
  assert.equal(latestAssessment(record).limit.maximumAmount, 436000);
  assert.equal(latestAssessment(record).limit.recommendedAmount, 400000);
  const original = JSON.stringify(record);
  for (const connector of integration.connectors) {
    if (connector.status === 'Paused') integration.toggle(connector.id);
    if (connector.status === 'Degraded') {
      const degraded = await integration.runCheck(connector.id, record);
      assert.equal(degraded.trace.httpStatus, 503); assert.equal(JSON.parse(degraded.trace.responseBody).status, 'review_required');
      integration.toggle(connector.id); integration.toggle(connector.id);
    }
    const result = await integration.runCheck(connector.id, record);
    assert.equal(result.trace.sample, true); assert.equal(result.trace.httpStatus, 200);
    assert.equal(result.trace.url, integration.endpoint(connector.id)); assert.match(result.trace.url, /^\/api\//);
    assert.match(result.trace.requestId, /^DEMO-/);
    const response = JSON.parse(result.trace.responseBody);
    assert.equal(response.source, 'browser-demo'); assert.equal(response.sample, true);
    assert.equal(response.connectorId, connector.id); assert.equal(response.applicationId, record.id);
    if (connector.id === 'core') assert.equal(response.data.monthlyIncome, 150000);
    if (connector.id === 'payout') assert.equal(response.data.transferExecuted, false);
    if (connector.id === 'notices') assert.equal(response.data.sent, false);
    if (connector.id === 'screening') assert.equal(response.data.sanctionsMatch, null);
  }
  integration.toggle('bureau'); const beforeBlocked = integration.callsToday;
  const blocked = await integration.runCheck('bureau', record);
  assert.match(blocked.title, /blocked/); assert.equal(blocked.trace, undefined);
  assert.equal(integration.callsToday, beforeBlocked); integration.toggle('bureau');
  assert.equal(JSON.stringify(record), original); assert.equal(JSON.stringify(workflow.find(record.id)), original);
  const component = new NewApplicationComponent(new FormBuilder(), {}, workflow);
  component.setTab('integration'); component.integrationApplicantId = record.id; component.connectorId = 'core';
  await component.runIntegrationCheck();
  assert.equal(component.integrationBusy, false); assert.equal(component.integrationError, '');
  assert.equal(JSON.parse(component.integrationResult.trace.responseBody).data.monthlyIncome, 150000);
  component.ngOnDestroy();
  assert.equal(networkCalls, 0);
  console.log('PASS: all eight endpoint and JSON previews work with fetch and XMLHttpRequest disabled.');
  console.log('PASS: legacy server settings are ignored; pause/degraded previews, counters and Integration page actions work.');
  console.log('PASS: 15 customers, Felix Low / 436000 / 400000 and saved assessments are preserved.');
} finally {
  workflow?.ngOnDestroy(); integration?.ngOnDestroy();
  globalThis.fetch = originalFetch; globalThis.XMLHttpRequest = originalXhr;
  fs.rmSync(temp, { recursive: true, force: true });
}
