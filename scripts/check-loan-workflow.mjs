import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';

const root = process.cwd();
const temp = fs.mkdtempSync(path.join(root, '.loan-check-'));
const credit = 'src/app/views/pages/credit/';
const names = [
  'credit-demo.data.ts', 'credit-data.service.ts', 'workflow/loan-workflow.models.ts',
  'workflow/loan-workflow.service.ts', 'workflow/loan-bulk.ts', 'workflow/loan-ai.engine.ts', 'workflow/loan-limit.engine.ts', 'workflow/loan-eligibility.engine.ts', 'workflow/loan-auto-approval.engine.ts', 'workflow/loan-product-recommender.ts', 'workflow/loan-customers.data.ts', 'workflow/loan-integration.service.ts', 'workflow/loan-mock-api.client.ts', 'workflow/loan-assessment.component.ts',
  'new-application/new-application.component.ts', 'applications/applications.component.ts',
  'applications/application-detail.component.ts', 'decision-queue/loan-decision-queue.component.ts'
];
for (const name of names) {
  const target = path.join(temp, credit, name.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const output = ts.transpileModule(fs.readFileSync(path.join(root, credit, name), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020, experimentalDecorators: true }
  }).outputText.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, '$1$2.mjs$3');
  fs.writeFileSync(target, output);
}
const stub = path.join(temp, 'src/app/shared/services/auth.service.mjs');
fs.mkdirSync(path.dirname(stub), { recursive: true }); fs.writeFileSync(stub, 'export class AuthService {}');
const load = name => import(pathToFileURL(path.join(temp, credit, name.replace(/\.ts$/, '.mjs'))).href);
class MemoryStorage {
  values = new Map(); fail = false;
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { if (this.fail) throw new Error('quota'); this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
globalThis.localStorage = new MemoryStorage();
try {
  const { CreditDataService } = await load('credit-data.service.ts');
  const { LoanWorkflowService } = await load('workflow/loan-workflow.service.ts');
  const { LOAN_STORAGE_KEY, latestAssessment } = await load('workflow/loan-workflow.models.ts');
  const { parseLoanCsv, loanRowsFromCells, readLoanUpload } = await load('workflow/loan-bulk.ts');
  const { ApplicationsComponent } = await load('applications/applications.component.ts');
  const { NewApplicationComponent } = await load('new-application/new-application.component.ts');
  const { ApplicationDetailComponent } = await load('applications/application-detail.component.ts');
  const { LoanDecisionQueueComponent } = await load('decision-queue/loan-decision-queue.component.ts');
  const { LoanAssessmentComponent } = await load('workflow/loan-assessment.component.ts');
  const { simulateLoanAi, previewLoanScenario, validLoanAi } = await load('workflow/loan-ai.engine.ts');
  const { recommendLoanLimit, validLoanLimit } = await load('workflow/loan-limit.engine.ts');
  const { evaluateLoanEligibility, validLoanEligibility, customerFacts, combineLoanDecisions } = await load('workflow/loan-eligibility.engine.ts');
  const original = new CreditDataService();
  const auth = { getCurrentUser: () => ({ username: 'officer@example.test' }) };
  const workflow = new LoanWorkflowService(original, auth);
  assert.equal(workflow.customers.length, 15); assert.equal(workflow.lookup('UNKNOWN'), null);
  assert.equal(workflow.lookup('ke-3391208').profile.applicant, 'Joseph Mwangi');
  const draft = workflow.customers[0].profile;
  const clearFacts = { ...workflow.customers[0].facts };
  const eligibilityDraft = { ...draft, amount: 100000, income: 2000000, obligations: 100000, tenorMonths: 12 };
  const eligibility = evaluateLoanEligibility(clearFacts, eligibilityDraft, original.policy);
  assert.equal(eligibility.checks.length, 7); assert.equal(eligibility.decision, 'Approved'); assert(eligibility.checks.every(c => c.result === 'Pass'));
  assert(validLoanEligibility(eligibility, eligibilityDraft, original.policy));
  for (const [change, code, expected] of [
    [{ nationalIdVerified: false }, 'EL-01', 'Declined'], [{ kycCompleted: false }, 'EL-01', 'Refer'],
    [{ accountTenureMonths: 5 }, 'EL-02', 'Refer'], [{ crbDefaulter: true }, 'EL-03', 'Declined'],
    [{ crbBlacklisted: true }, 'EL-03', 'Declined'], [{ activeLoans: 5 }, 'EL-04', 'Refer'],
    [{ activeLenders: 4 }, 'EL-04', 'Refer'], [{ previousInstitutionDefault: true }, 'EL-05', 'Declined'],
    [{ employmentTenureMonths: 5 }, 'EL-07', 'Refer']
  ]) {
    const checked = evaluateLoanEligibility({ ...clearFacts, ...change }, eligibilityDraft, original.policy);
    assert.equal(checked.checks.find(c => c.code === code).result, 'Triggered'); assert.equal(checked.decision, expected);
  }
  for (const field of ['nationalIdVerified', 'kycCompleted', 'accountTenureMonths', 'crbDefaulter', 'crbBlacklisted', 'activeLoans', 'activeLenders', 'previousInstitutionDefault', 'employmentTenureMonths']) {
    const unknown = evaluateLoanEligibility({ ...clearFacts, [field]: null }, eligibilityDraft, original.policy);
    assert.equal(unknown.decision, 'Refer'); assert(unknown.checks.some(c => c.result === 'Needs review'));
  }
  assert.equal(evaluateLoanEligibility(undefined, eligibilityDraft, original.policy).decision, 'Refer');
  assert.equal(evaluateLoanEligibility({ ...clearFacts, accountTenureMonths: 6, employmentTenureMonths: 6, activeLoans: 4, activeLenders: 3 }, eligibilityDraft, original.policy).decision, 'Approved');
  const atDti = { ...eligibilityDraft, amount: (eligibilityDraft.income * original.policy.maxDti - eligibilityDraft.obligations) * eligibilityDraft.tenorMonths };
  assert.equal(evaluateLoanEligibility(clearFacts, atDti, original.policy).checks.find(c => c.code === 'EL-06').result, 'Pass');
  assert.equal(evaluateLoanEligibility(clearFacts, { ...atDti, amount: atDti.amount + 1000 }, original.policy).checks.find(c => c.code === 'EL-06').result, 'Triggered');
  for (const bad of [{ activeLoans: -1 }, { activeLenders: 1.5 }, { crbDefaulter: 'false' }, { averageBalance6m: NaN }, { ageYears: 121 }]) { assert.throws(() => customerFacts(bad)); }
  assert.equal(customerFacts({ activeLoans: 0 }).activeLoans, 0);
  assert.equal(combineLoanDecisions('Declined', 'Refer'), 'Declined');
  assert(!validLoanEligibility({ ...eligibility, decision: 'Declined' }, eligibilityDraft, original.policy));
  const mainTemplate = fs.readFileSync(path.join(root, credit, 'workflow/loan-assessment.component.html'), 'utf8');
  assert.match(mainTemplate, /<th>Check<\/th><th>Observed input<\/th><th>Requirement<\/th><th>Evaluation<\/th><th>Effect<\/th>/);
  assert.match(mainTemplate, /CUSTOMER INFORMATION/); assert.match(mainTemplate, /Average balance · 6 months/); assert.match(mainTemplate, /What moves the risk signal/);
  const limitDraft = { ...draft, income: 2000000, obligations: 100000, amount: 8000000, tenorMonths: 12, product: 'Personal Loan', bureau: 'Clean', employment: 'Salaried' };
  const scoreCandidate = candidate => original.scoreDraft(candidate);
  const limit = recommendLoanLimit(limitDraft, original.policy, scoreCandidate);
  assert.equal(limit.outcome, 'Approve reduced amount'); assert.equal(limit.maximumAmount, original.policy.maxAmount);
  assert.equal(limit.recommendedAmount, limit.maximumAmount); assert(validLoanLimit(limit, limitDraft, original.policy));
  assert.equal(limit.offer.policyDecision, 'Approved'); assert(limit.offer.probability < 0.12); assert(limit.offer.dti <= original.policy.maxDti);
  const completeRequest = { ...limitDraft, amount: 200001.5 };
  const full = recommendLoanLimit(completeRequest, original.policy, scoreCandidate);
  assert.equal(full.outcome, 'Approve full amount'); assert.equal(full.recommendedAmount, 200001.5); assert(full.maximumAmount >= full.recommendedAmount);
  assert.deepEqual(limit, recommendLoanLimit({ ...limitDraft, applicant: 'Another name', nationalId: 'Another ID', phone: 'Other phone', country: 'Other country' }, original.policy, scoreCandidate));
  const scoreBound = recommendLoanLimit({ ...limitDraft, income: 800000 }, original.policy, scoreCandidate);
  assert(scoreBound.maximumAmount >= 10000 && scoreBound.maximumAmount < original.policy.maxAmount);
  assert(original.scoreDraft({ ...limitDraft, income: 800000, amount: scoreBound.maximumAmount + 1000 }).score < original.policy.approveFrom);
  const noCapacityDraft = { ...limitDraft, obligations: 1900000 };
  assert.equal(recommendLoanLimit(noCapacityDraft, original.policy, scoreCandidate).outcome, 'Decline');
  const adverseLimit = recommendLoanLimit({ ...limitDraft, bureau: 'Adverse' }, original.policy, scoreCandidate);
  assert.equal(adverseLimit.outcome, 'Decline'); assert.equal(adverseLimit.maximumAmount, 0); assert.equal(adverseLimit.offer, null);
  const referredLimit = recommendLoanLimit({ ...limitDraft, bureau: 'Thin file' }, original.policy, scoreCandidate);
  assert.equal(referredLimit.outcome, 'Refer for review'); assert(referredLimit.maximumAmount > 0); assert(referredLimit.offer); assert.equal(referredLimit.offer.policyDecision, 'Refer');
  assert.equal(recommendLoanLimit({ ...limitDraft, product: 'Salary Advance', tenorMonths: 12 }, original.policy, scoreCandidate).outcome, 'Decline');
  // An independent brute-force sweep checks the bisection maximum against the actual source engine.
  let independentMaximum = 0;
  for (let amount = 10000; amount <= Math.min(original.policy.maxAmount, scoreBound.affordabilityCeiling * scoreBound.riskMultiplier); amount += 1000) {
    const candidate = { ...limitDraft, income: 800000, amount }; const scored = original.scoreDraft(candidate);
    if (scored.decision !== 'Declined' && scored.score >= original.policy.declineBelow && scored.dti <= original.policy.maxDti && simulateLoanAi(candidate, original.policy, scored.decision).probability < scoreBound.riskCeiling) { independentMaximum = amount; }
  }
  assert.equal(scoreBound.maximumAmount, independentMaximum);
  assert(!validLoanLimit({ ...limit, recommendedAmount: limitDraft.amount }, limitDraft, original.policy));
  const legacyLimit = { ...limit, version: 'limit-demo-1' }; delete legacyLimit.riskBand; delete legacyLimit.riskMultiplier;
  assert(validLoanLimit(legacyLimit, limitDraft, original.policy));
  const initialPolicy = { ...original.policy };
  try {
    original.updatePolicy({ ...initialPolicy, approveFrom: 630, maxDti: 0.8 });
    const riskDraft = { ...limitDraft, income: 400000, obligations: 40000, amount: 2000000 };
    const riskBound = recommendLoanLimit(riskDraft, original.policy, scoreCandidate);
    assert(riskBound.offer && riskBound.maximumAmount <= Math.min(original.policy.maxAmount, riskBound.affordabilityCeiling * riskBound.riskMultiplier));
    const beyondRisk = { ...riskDraft, amount: riskBound.maximumAmount + 1000 };
    assert.equal(riskBound.riskBand, 'Medium'); assert.equal(riskBound.offer.policyDecision, 'Refer'); assert(riskBound.offer.probability < riskBound.riskCeiling);
    original.updatePolicy({ ...initialPolicy, approveFrom: 630, maxDti: 0.15 });
    const budgetBound = recommendLoanLimit({ ...limitDraft, obligations: 0, tenorMonths: 1 }, original.policy, scoreCandidate);
    assert.equal(budgetBound.maximumAmount, 105000); assert.equal(budgetBound.affordabilityCeiling, 300000);
  } finally { original.updatePolicy(initialPolicy); }
  const apps = new ApplicationsComponent(workflow); apps.ngOnInit();
  const first = await workflow.submit(draft, { submissionKey: 'one' });
  assert.equal(first.status, 'Awaiting decision'); assert.equal(workflow.pendingCount, 1);
  assert.equal(apps.apps.length, 1); assert.equal(latestAssessment(first).score, original.scoreDraft(draft).score);
  assert.equal(latestAssessment(first).modelAvailable, false); assert.equal(latestAssessment(first).mode, 'SIMULATED');
  assert.equal(first.history[0].officer, 'officer@example.test');
  const originalDownload = workflow.download; const exports = [];
  workflow.download = (content, name, type) => exports.push({ content, name, type });
  workflow.exportApplications([{ ...first, customerName: '=1+1, "customer"' }]);
  const csvExport = parseLoanCsv(exports[0].content);
  assert(csvExport[0].includes('simulated_default_likelihood')); assert.equal(csvExport[1][1], '\'=1+1, "customer"');
  assert(csvExport[0].includes('recommended_limit')); assert(csvExport[0].includes('approved_amount'));
  workflow.downloadAssessment(first); assert.equal(JSON.parse(exports[1].content).assessments[0].ai.origin, 'SIMULATED');
  workflow.download = originalDownload;
  const insight = latestAssessment(first).ai;
  assert.equal(insight.origin, 'SIMULATED'); assert(validLoanAi(insight)); assert.equal(insight.models.length, 3);
  assert.deepEqual(insight, simulateLoanAi(draft, original.policy, latestAssessment(first).recommendation));
  assert.deepEqual(insight, simulateLoanAi({ ...draft, applicant: 'Different name', nationalId: 'Different ID', country: 'Different country', phone: 'Other phone' }, original.policy, latestAssessment(first).recommendation));
  const weighted = insight.models.reduce((sum, m) => sum + m.weight * m.probability, 0);
  assert(Math.abs(weighted - insight.probability) < 0.0001);
  assert.equal(insight.drivers.find(x => x.label === 'Bureau outlook').deltaPp, 0);
  assert(simulateLoanAi({ ...draft, income: draft.income * 2 }, original.policy, 'Approved').probability < insight.probability);
  assert(simulateLoanAi({ ...draft, bureau: 'Adverse' }, original.policy, 'Approved').probability > insight.probability);
  assert(simulateLoanAi({ ...draft, obligations: draft.obligations * 3 }, original.policy, 'Approved').probability > insight.probability);
  assert.equal(simulateLoanAi(draft, original.policy, 'Declined').advice, 'Declined');
  assert.equal(simulateLoanAi({ ...draft, obligations: draft.income * 1.5 }, original.policy, 'Approved').advice, 'Refer');
  assert.throws(() => simulateLoanAi({ ...draft, income: 0 }, original.policy, 'Approved'));
  const originalAssessment = JSON.stringify(latestAssessment(first));
  assert.equal(latestAssessment(first).eligibility.customer.accountTenureMonths, clearFacts.accountTenureMonths);
  assert.equal(latestAssessment(first).checks.length, 7);
  assert(latestAssessment(first).sourceChecks.some(c => c.code === 'BASE-SCORE'));
  const scenario = previewLoanScenario(latestAssessment(first), draft.amount * 0.8, draft.tenorMonths);
  assert(scenario.probability <= insight.probability); assert(scenario.monthlySaving > 0);
  assert.equal(JSON.stringify(latestAssessment(first)), originalAssessment);
  const salary = { ...latestAssessment(first), input: { ...draft, product: 'Salary Advance' } };
  assert.equal(previewLoanScenario(salary, 100000, 6).withinBudget, false);
  const presenter = new LoanAssessmentComponent(workflow); presenter.assessment = latestAssessment(first); presenter.ngOnChanges();
  assert.deepEqual(presenter.customer, clearFacts); assert.equal(presenter.verification(null), 'Unknown'); assert.equal(presenter.verification(false), 'Not verified');
  assert.deepEqual(presenter.outlookDrivers.find(d => d.label === 'Bureau outlook').checks.map(c => c.code), ['EL-03', 'EL-05']);
  assert.deepEqual(presenter.outlookDrivers.find(d => d.label === 'Repayment burden').checks.map(c => c.code), ['EL-06']);
  assert.deepEqual(presenter.outlookDrivers.find(d => d.label === 'Employment profile').checks.map(c => c.code), ['EL-07']);
  assert(Math.abs(presenter.rankedDrivers.reduce((sum, d) => sum + d.share, 0) - 100) < 0.00001);
  assert(presenter.rankedDrivers.every((d, i, ds) => i === 0 || ds[i - 1].share >= d.share));
  presenter.showDriver(presenter.rankedDrivers[0].label); assert.equal(presenter.activeGraphDriver.label, presenter.rankedDrivers[0].label);
  assert.equal(new Set([...presenter.outlookDrivers.flatMap(d => d.checks), ...presenter.identityChecks].map(c => c.code)).size, 7);
  for (const d of presenter.outlookDrivers) { assert.equal(d.deltaPp, insight.drivers.find(original => original.label === d.label).deltaPp); }
  presenter.preset('smaller'); assert(presenter.scenario.monthlySaving > 0); presenter.resetScenario(); assert.equal(presenter.scenario, null);
  presenter.updateScenario('amount', NaN); assert.match(presenter.scenarioError, /Valid financial/);
  assert.equal((await workflow.submit(draft, { submissionKey: 'one' })).id, first.id);
  assert.equal(workflow.applications.length, 1);
  const blockedKyc = await workflow.submit(eligibilityDraft, { submissionKey: 'kyc-review', customerFacts: { ...clearFacts, kycCompleted: false } });
  assert.equal(workflow.advice(latestAssessment(blockedKyc)), 'Refer'); assert.equal(latestAssessment(blockedKyc).limit.offer, null);
  assert.throws(() => workflow.decide(blockedKyc.id, 'Approve', 'Approval without verification acknowledgement.', 1), /Acknowledge/);
  const blockedCrb = await workflow.submit(eligibilityDraft, { submissionKey: 'crb-decline', customerFacts: { ...clearFacts, crbBlacklisted: true } });
  assert.equal(workflow.advice(latestAssessment(blockedCrb)), 'Declined'); assert.equal(latestAssessment(blockedCrb).limit.outcome, 'Decline');
  const unknownFacts = await workflow.submit(eligibilityDraft, { submissionKey: 'unknown-eligibility', customerFacts: {} });
  assert.equal(latestAssessment(unknownFacts).limit.offer, null); assert.equal(latestAssessment(unknownFacts).eligibility.decision, 'Refer');
  const historical = JSON.stringify(blockedKyc.assessments);
  const correctedKyc = await workflow.submit(eligibilityDraft, { submissionKey: 'kyc-corrected', applicationId: blockedKyc.id, reassessmentNote: 'Completed and reviewed missing verification evidence.', customerFacts: clearFacts });
  assert.equal(correctedKyc.assessments.length, 2); assert.equal(JSON.stringify(correctedKyc.assessments.slice(0, 1)), historical);
  assert.equal(latestAssessment(correctedKyc).eligibility.decision, 'Approved'); assert(latestAssessment(correctedKyc).limit.offer);
  const reducedRecord = await workflow.submit(limitDraft, { submissionKey: 'reduced-offer' });
  const reducedAssessment = latestAssessment(reducedRecord);
  assert.equal(reducedAssessment.limit.outcome, 'Approve reduced amount'); assert.equal(workflow.approvalNeedsOverride(reducedAssessment, 'recommended'), false);
  assert.throws(() => workflow.decide(reducedRecord.id, 'Approve', 'Reviewed verified income and all policy findings.', 1), /Acknowledge/);
  const reducedApproved = workflow.decide(reducedRecord.id, 'Approve', 'Verified income and accepted the assessed smaller principal.', 1, false, 'recommended');
  assert.equal(reducedApproved.approvedAmount, reducedAssessment.limit.recommendedAmount);
  assert.equal(latestAssessment(reducedApproved).input.amount, limitDraft.amount);
  assert.equal(reducedApproved.history.at(-1).approvalBasis, 'Recommended offer'); assert.equal(reducedApproved.history.at(-1).policyOverride, false);
  assert.equal(reducedApproved.history.at(-1).approvedTenorMonths, limitDraft.tenorMonths);
  const attempts = await Promise.allSettled([
    workflow.submit(draft, { submissionKey: 'double' }), workflow.submit(draft, { submissionKey: 'double' })
  ]);
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1);
  for (const invalid of [{ amount: 0 }, { income: 0 }, { amount: NaN }, { obligations: -1 }, { tenorMonths: 1.5 }, { product: 'Unknown' }, { nationalId: 'UNKNOWN' }]) {
    await assert.rejects(workflow.submit({ ...draft, ...invalid }, { submissionKey: 'invalid' }));
  }
  const expectedBands = ['Low', 'Low', 'Low', 'Medium', 'Medium', 'Medium', 'High', 'High', 'Low', 'Low', 'Medium', 'Medium', 'High', 'High', 'High']; const bandFixtures = [];
  for (const [i, customer] of workflow.customers.entries()) {
    const saved = await workflow.submit(customer.profile, { submissionKey: customer.id });
    const assessment = latestAssessment(saved); const reference = original.scoreDraft(customer.profile);
    if (customer.scorecardAdjustment) {
      assert.equal(assessment.score, 800); assert.equal(assessment.risk, 'Low');
      assert.equal(assessment.recommendation, 'Approved'); assert.equal(assessment.limit.offer.score, 800);
      assert.equal(assessment.scorecardAdjustment.sourceScore, reference.score);
    } else {
      assert.equal(assessment.score, reference.score); assert.equal(assessment.risk, reference.risk);
      assert.equal(assessment.recommendation, reference.decision);
    } assert.equal(assessment.affordability.dti, reference.dti);
    assert.equal(assessment.baseScore + assessment.contributions.reduce((sum, x) => sum + x.impact, 0), assessment.score);
    assert.equal(saved.status, 'Awaiting decision');
    assert.equal(customer.profile.country, 'Kenya'); assert.equal(assessment.ai.risk, expectedBands[i], customer.profile.applicant); assert(assessment.limit.maximumAmount >= 10000);
    assert(assessment.limit.offer && assessment.limit.recommendedAmount > 0); assert(validLoanLimit(assessment.limit, assessment.input, assessment.policy));
    if (assessment.ai.risk !== 'Low') { assert.equal(assessment.limit.outcome, 'Refer for review'); assert.equal(workflow.approvalNeedsOverride(assessment, 'recommended'), true); }
    bandFixtures.push({ name: customer.profile.applicant, id: customer.profile.nationalId, risk: assessment.ai.risk, likelihood: assessment.ai.probability, requested: customer.profile.amount, limit: assessment.limit.maximumAmount, proposed: assessment.limit.recommendedAmount, outcome: assessment.limit.outcome });
  }
  fs.writeFileSync(path.join(os.tmpdir(), 'loan-kenya-band-fixtures.json'), JSON.stringify(bandFixtures, null, 2));
  const felix = bandFixtures.find(customer => customer.name === 'Felix Sayia');
  assert(felix); assert.equal(felix.risk, 'Low'); assert.equal(felix.requested, 400000);
  assert.equal(felix.limit, 436000); assert.equal(felix.proposed, 400000);
  const highCase = workflow.applications.find(x => latestAssessment(x).ai.risk === 'High');
  assert.throws(() => workflow.decide(highCase.id, 'Approve', 'Reviewed the smaller high risk proposal.', 1, false, 'recommended'), /Acknowledge/);
  const highApproved = workflow.decide(highCase.id, 'Approve', 'Verified repayment evidence and authorised the smaller high risk exception.', 1, true, 'recommended');
  assert.equal(highApproved.approvedAmount, latestAssessment(highCase).limit.recommendedAmount); assert.equal(highApproved.history.at(-1).policyOverride, true);
  const longTenor = await workflow.submit({ ...draft, tenorMonths: 60 }, { submissionKey: 'long-tenor' });
  assert.equal(latestAssessment(longTenor).contributions.find(x => x.label === 'Tenor adjustment').impact, -15);
  const storageReload = new LoanWorkflowService(original, auth);
  assert.equal(storageReload.applications.length, workflow.applications.length); assert.equal(storageReload.storageError, '');
  const before = JSON.stringify(first.assessments);
  workflow.decide(first.id, 'Request information', 'Provide the latest verified payslip.', 1);
  assert.equal(workflow.find(first.id).status, 'More information required');
  assert.throws(() => workflow.decide(first.id, 'Approve', 'Reviewed and accepted documentation.', 1), /Reassess/);
  const revised = await workflow.submit({ ...draft, amount: 200000 }, { applicationId: first.id, submissionKey: 'reassess', reassessmentNote: 'Latest salary evidence reviewed.' });
  assert.equal(revised.id, first.id); assert.equal(revised.assessments.length, 2);
  assert.equal(JSON.stringify(revised.assessments.slice(0, 1)), before);
  assert.equal(revised.history.length, 3); assert.equal(revised.status, 'Awaiting decision');
  assert.throws(() => workflow.decide(first.id, 'Approve', 'Reviewed and accepted documentation.', 1), /newer assessment/);
  assert.throws(() => workflow.decide(first.id, 'Decline', '', 2), /reason/);
  workflow.decide(first.id, 'Approve', 'Reviewed current income and policy results.', 2, true);
  assert.equal(workflow.find(first.id).status, 'Approved');
  assert.equal(apps.apps.find(x => x.id === first.id).status, 'Approved');
  assert.throws(() => workflow.decide(first.id, 'Decline', 'Another attempted decision.', 2), /finalised/);
  await assert.rejects(workflow.submit(draft, { applicationId: first.id, submissionKey: 'closed-reassess', reassessmentNote: 'Should not reopen final decisions.' }), /undecided/);
  const adverse = await workflow.submit({ ...draft, bureau: 'Adverse' }, { submissionKey: 'adverse', customerFacts: { ...clearFacts, crbDefaulter: true } });
  assert.notEqual(latestAssessment(adverse).recommendation, 'Approved');
  assert.throws(() => workflow.decide(adverse.id, 'Approve', 'Cannot select an offer that is unavailable.', 1, true, 'recommended'), /No supported recommended offer/);
  assert.throws(() => workflow.decide(adverse.id, 'Approve', 'Override with insufficient acknowledgement.', 1), /Acknowledge/);
  workflow.decide(adverse.id, 'Decline', 'Adverse bureau evidence remains unresolved.', 1);
  assert.equal(workflow.find(adverse.id).history.at(-1).previousStatus, 'Awaiting decision');
  const route = { queryParamMap: new BehaviorSubject(convertToParamMap({ id: 'not-found' })) };
  const queue = new LoanDecisionQueueComponent(route, workflow); queue.ngOnInit();
  assert.equal(queue.selected, undefined); assert.match(queue.error, /not found/);
  const pending = workflow.applications.find(x => workflow.pending(x));
  queue.select(pending.id); queue.begin('Request information'); queue.note = 'Provide supporting bank statements.';
  queue.confirmDecision(); assert.match(queue.error, /reviewed/);
  queue.reviewed = true; queue.confirmDecision();
  assert.equal(workflow.find(pending.id).status, 'More information required');
  queue.scope = 'information'; assert(queue.rows.every(x => x.status === 'More information required'));
  assert.equal(queue.canOpenNext, false);
  queue.begin('Request information'); queue.draftNote(); queue.reviewed = true; queue.confirmDecision();
  assert.match(queue.error, /own evidence/);
  queue.note += 'Please provide the current payslip and bank statement for verification.'; queue.confirmDecision();
  assert.equal(queue.error, ''); assert.equal(workflow.find(pending.id).status, 'More information required');
  const reducedQueueRecord = await workflow.submit(limitDraft, { submissionKey: 'queue-reduced-offer' });
  queue.select(reducedQueueRecord.id); queue.begin('Approve'); assert.equal(queue.approvalBasis, 'recommended');
  assert.equal(queue.approvalAmount, latestAssessment(reducedQueueRecord).limit.recommendedAmount); assert.equal(queue.requiresOverride, false);
  queue.approvalBasis = 'requested'; assert.equal(queue.requiresOverride, true);
  queue.approvalBasis = 'recommended'; queue.note = 'Verified the smaller principal against income evidence and the assessment.'; queue.reviewed = true; queue.confirmDecision();
  assert.equal(queue.error, ''); assert.equal(workflow.find(reducedQueueRecord.id).approvedAmount, latestAssessment(reducedQueueRecord).limit.recommendedAmount);
  const declineQueueRecord = await workflow.submit(draft, { submissionKey: 'queue-decline-submit' });
  queue.select(declineQueueRecord.id); queue.begin('Decline');
  queue.confirmDecision(); assert(queue.decisionErrors.some(x => /own evidence/.test(x))); assert(queue.decisionErrors.some(x => /reviewed/.test(x)));
  assert.equal(workflow.find(declineQueueRecord.id).status, 'Awaiting decision'); assert.equal(queue.busy, false);
  queue.note = 'Officer evidence that should remain editable.'; queue.draftNote(); assert.equal(queue.note, 'Officer evidence that should remain editable.');
  assert(queue.copilotContext.length > 0); queue.reviewed = true; queue.confirmDecision();
  assert.equal(workflow.find(declineQueueRecord.id).status, 'Declined'); assert.equal(queue.message.length > 0, true); assert.equal(queue.confirmation, null);
  const failedSave = await workflow.submit(draft, { submissionKey: 'queue-storage-retry' });
  queue.select(failedSave.id); queue.begin('Request information'); queue.note = 'Supply the latest verified bank statements.'; queue.reviewed = true;
  localStorage.fail = true; queue.confirmDecision(); localStorage.fail = false;
  assert(queue.decisionErrors.some(x => /could not save/.test(x))); assert.equal(queue.confirmation, 'Request information'); assert.equal(queue.note, 'Supply the latest verified bank statements.');
  assert.equal(workflow.find(failedSave.id).status, 'Awaiting decision'); queue.confirmDecision();
  assert.equal(queue.decisionErrors.length, 0); assert.equal(workflow.find(failedSave.id).status, 'More information required');
  const overrideCase = await workflow.submit(eligibilityDraft, { submissionKey: 'queue-override-validation', customerFacts: { ...clearFacts, kycCompleted: false } });
  queue.select(overrideCase.id); queue.begin('Approve'); queue.note = 'Reviewed exception evidence and financial details.'; queue.reviewed = true; queue.confirmDecision();
  assert(queue.decisionErrors.some(x => /override/.test(x))); assert.equal(workflow.find(overrideCase.id).status, 'Awaiting decision');
  queue.cancelDecision(); assert.equal(queue.confirmation, null); assert.equal(queue.decisionErrors.length, 0);
  apps.search = first.nationalId; assert(apps.rows.every(x => x.nationalId === first.nationalId));
  apps.resetFilters(); apps.status = 'Approved'; assert(apps.rows.every(x => x.status === 'Approved'));
  apps.resetFilters(); apps.pageSize = 1; assert.equal(apps.pageRows.length, 1); assert(apps.pages > 1);
  const detail = new ApplicationDetailComponent({ paramMap: new BehaviorSubject(convertToParamMap({ id: first.id })) }, workflow);
  detail.ngOnInit(); assert.equal(detail.assessment.version, 2); detail.selectedVersion = 1; assert.equal(detail.assessment.input.amount, draft.amount);
  const component = new NewApplicationComponent(new FormBuilder(), { queryParamMap: new BehaviorSubject(convertToParamMap({})) }, workflow);
  const adapters = workflow.integration; assert.equal(adapters.connectors.length, 8); assert.equal(adapters.callsToday, 0);
  assert.equal(adapters.availability().decision, 'Approved'); const beforePauseSnapshot = JSON.stringify(latestAssessment(first));
  adapters.toggle('bureau'); assert.equal(adapters.find('bureau').status, 'Paused'); assert.equal(adapters.availability().decision, 'Refer');
  const callsBeforeBlocked = adapters.callsToday; const blockedCheck = await adapters.runCheck('bureau', revised);
  assert.equal(blockedCheck.tone, 'bad'); assert.equal(adapters.callsToday, callsBeforeBlocked); assert.equal(adapters.events[0].action, 'Check blocked');
  const dataHeld = await workflow.submit(eligibilityDraft, { submissionKey: 'connector-held' });
  assert.equal(latestAssessment(dataHeld).integration.decision, 'Refer'); assert.equal(latestAssessment(dataHeld).limit.offer, null);
  assert.equal(JSON.stringify(latestAssessment(first)), beforePauseSnapshot);
  adapters.toggle('bureau'); const bureauCheck = await adapters.runCheck('bureau', revised); assert.equal(bureauCheck.applicationId, revised.id); assert.equal(bureauCheck.assessmentVersion, 2); assert.equal(adapters.callsToday, callsBeforeBlocked + 1);
  const recoveredData = await workflow.submit(eligibilityDraft, { submissionKey: 'connector-recovered' }); assert(latestAssessment(recoveredData).limit.offer);
  const screening = await adapters.runCheck('screening', recoveredData); assert.equal(screening.tone, 'wait'); assert.match(screening.title, /not available/);
  const beforePauseFailure = JSON.stringify(adapters.connectors); localStorage.fail = true; assert.throws(() => adapters.toggle('core'), /could not save/); localStorage.fail = false; assert.equal(JSON.stringify(adapters.connectors), beforePauseFailure);
  assert(adapters.events.some(e => e.action === 'Paused')); assert(adapters.events.some(e => e.action === 'Resumed'));
  component.ngOnInit(); component.nationalId = 'UNKNOWN'; await component.lookup(); assert.equal(component.customer, null); assert.match(component.error, /not found/);
  component.setTab('integration'); assert.equal(component.tab, 'integration'); assert(component.integrationApplicantId); component.connectorId = 'identity'; await component.runIntegrationCheck(); assert.equal(component.integrationResult.connectorId, 'identity'); component.setTab('individual');
  component.nationalId = draft.nationalId; await component.lookup(); const count = workflow.applications.length;
  const assessmentStarted = Date.now(); const pendingAssessment = component.submit();
  assert.equal(component.busy, true); assert.equal(component.created, null);
  assert.equal(workflow.applications.length, count);
  component.setTab('bulk'); assert.equal(component.tab, 'individual');
  await Promise.all([pendingAssessment, component.submit()]); assert.equal(workflow.applications.length, count + 1);
  assert.equal(component.busy, false); assert(Date.now() - assessmentStarted >= 1800);
  assert.deepEqual(latestAssessment(component.created).eligibility.customer, clearFacts);
  const failedComponent = new NewApplicationComponent(new FormBuilder(), {}, workflow);
  failedComponent.nationalId = draft.nationalId; await failedComponent.lookup();
  const preservedAmount = failedComponent.form.getRawValue().amount, submitActual = workflow.submit;
  workflow.submit = async () => { throw new Error('Assessment temporarily unavailable'); };
  await failedComponent.submit(); assert.equal(failedComponent.busy, false); assert.equal(failedComponent.created, null);
  assert.match(failedComponent.error, /temporarily unavailable/); assert.equal(failedComponent.form.getRawValue().amount, preservedAmount);
  workflow.submit = submitActual;
  await failedComponent.submit(); assert(failedComponent.created); assert.equal(failedComponent.busy, false);
  failedComponent.ngOnDestroy();
  const leavingComponent = new NewApplicationComponent(new FormBuilder(), {}, workflow);
  leavingComponent.nationalId = draft.nationalId; await leavingComponent.lookup();
  const beforeLeaving = workflow.applications.length, leavingRun = leavingComponent.submit();
  leavingComponent.ngOnDestroy(); await leavingRun;
  assert.equal(workflow.applications.length, beforeLeaving); assert.equal(leavingComponent.created, null);
  assert.equal(leavingComponent.busy, false);
  const headers = ['national_id', 'requested_amount', 'tenor_months', 'product', 'application_id', 'reassessment_note'];
  const validRow = [draft.nationalId, '250000', '12', 'Personal Loan', '', ''];
  assert.deepEqual(parseLoanCsv('a,b\r\n"one,two","escaped ""quote"""'), [['a', 'b'], ['one,two', 'escaped "quote"']]);
  assert.throws(() => parseLoanCsv('a\n"unclosed'), /unclosed/);
  assert.throws(() => loanRowsFromCells([['national_id'], ['x']]), /Missing columns/);
  const rows = workflow.validateBulk(loanRowsFromCells([headers, validRow, validRow, ['UNKNOWN', '1', '0', 'Wrong', '', '']]));
  assert.equal(rows[0].state, 'Ready'); assert.equal(rows[1].state, 'Invalid'); assert.equal(rows[2].state, 'Invalid');
  const bulkSaved = await workflow.submitBulkRow(rows[0]);
  assert.equal(latestAssessment(bulkSaved).score, original.scoreDraft({ ...draft, amount: 250000, tenorMonths: 12, product: 'Personal Loan' }).score);
  assert.deepEqual(latestAssessment(bulkSaved).eligibility.customer, clearFacts);
  assert.equal((await workflow.submitBulkRow(rows[0])).id, bulkSaved.id);
  component.rows = workflow.validateBulk(loanRowsFromCells([headers,
    [draft.nationalId, '110000', '12', 'Personal Loan', '', ''],
    [draft.nationalId, '120000', '12', 'Personal Loan', '', ''],
    [draft.nationalId, '130000', '12', 'Personal Loan', '', '']
  ]));
  const actualScoring = original.scoreDraft.bind(original); let failedOnce = false;
  original.scoreDraft = input => {
    if (input.amount === 120000 && !failedOnce) { failedOnce = true; throw new Error('Temporary assessment failure'); }
    return actualScoring(input);
  };
  const beforeBatch = workflow.applications.length;
  await component.processBulk(); assert.equal(component.savedCount, 2); assert.equal(component.failedCount, 1);
  const savedIds = component.rows.filter(x => x.state === 'Saved').map(x => x.resultId);
  await component.processBulk(); assert.equal(component.savedCount, 3); assert.equal(component.failedCount, 0);
  assert.equal(workflow.applications.length, beforeBatch + 3);
  assert(savedIds.every(id => component.rows.some(x => x.resultId === id)));
  original.scoreDraft = actualScoring;
  const makeFile = (name, cells, type = 'xlsx') => {
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(cells), 'Applications');
    const buffer = XLSX.write(book, { type: 'buffer', bookType: type });
    return new File([buffer], name);
  };
  assert.equal((await readLoanUpload(new File([headers.join(',') + '\n' + validRow.join(',')], 'loans.csv'))).length, 1);
  assert.equal((await readLoanUpload(makeFile('loans.xlsx', [headers, validRow])))[0].nationalId, draft.nationalId);
  assert.equal((await readLoanUpload(makeFile('loans.xls', [headers, validRow], 'biff8'))).length, 1);
  const numericId = await readLoanUpload(makeFile('numeric-id.xlsx', [headers, [123456, 250000, 12, 'Personal Loan']]));
  assert.match(numericId[0].errors.join(' '), /Text/);
  await assert.rejects(readLoanUpload(new File(['x'], 'loans.pdf')), /CSV, XLSX or XLS/);
  await assert.rejects(readLoanUpload({ name: 'big.csv', size: 2097153 }), /2 MB/);
  assert.throws(() => loanRowsFromCells([headers, ...Array.from({ length: 501 }, () => validRow)]), /500/);
  const scoreFn = original.scoreDraft.bind(original); original.scoreDraft = () => { throw new Error('Assessment unavailable'); };
  const failedCount = workflow.applications.length;
  await assert.rejects(workflow.submit(draft, { submissionKey: 'failure-and-retry' }), /unavailable/);
  assert.equal(workflow.applications.length, failedCount); original.scoreDraft = scoreFn;
  await workflow.submit(draft, { submissionKey: 'failure-and-retry' });
  const snapshot = localStorage.getItem(LOAN_STORAGE_KEY); localStorage.fail = true;
  const beforeFailure = JSON.stringify(workflow.applications);
  await assert.rejects(workflow.submit(draft, { submissionKey: 'quota' }), /could not save/);
  assert.equal(JSON.stringify(workflow.applications), beforeFailure); localStorage.fail = false;
  const oldData = JSON.parse(snapshot); for (const app of oldData.applications) { delete app.approvedAmount; for (const a of app.assessments) { delete a.ai; delete a.limit; } for (const event of app.history) { delete event.approvedAmount; delete event.approvedTenorMonths; delete event.approvalBasis; } }
  for (const app of oldData.applications) { for (const a of app.assessments) { if (a.sourceChecks) { a.checks = a.sourceChecks; } delete a.eligibility; delete a.sourceChecks; } }
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(oldData)); const legacyStore = new LoanWorkflowService(original, auth);
  assert.equal(legacyStore.storageError, ''); assert(legacyStore.applications.every(x => !latestAssessment(x).ai));
  const badAi = JSON.parse(snapshot); badAi.applications[0].assessments[0].ai.models[0].probability = 5;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(badAi)); const invalidModelStore = new LoanWorkflowService(original, auth);
  assert.match(invalidModelStore.storageError, /could not be read/);
  const oldAiData = JSON.parse(snapshot); for (const app of oldAiData.applications) { delete app.approvedAmount; for (const a of app.assessments) { delete a.limit; } for (const e of app.history) { delete e.approvedAmount; delete e.approvedTenorMonths; delete e.approvalBasis; } }
  for (const app of oldAiData.applications) { for (const a of app.assessments) { if (a.sourceChecks) { a.checks = a.sourceChecks; } delete a.eligibility; delete a.sourceChecks; } }
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(oldAiData)); const earlierAiStore = new LoanWorkflowService(original, auth);
  assert.equal(earlierAiStore.storageError, ''); assert(earlierAiStore.applications.every(x => !latestAssessment(x).limit));
  const badLimit = JSON.parse(snapshot); const withLimit = badLimit.applications.find(x => latestAssessment(x).limit?.offer);
  latestAssessment(withLimit).limit.recommendedAmount = 999999999;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(badLimit)); const invalidLimitStore = new LoanWorkflowService(original, auth);
  assert.match(invalidLimitStore.storageError, /could not be read/);
  const badApproval = JSON.parse(snapshot); const approvedWithAmount = badApproval.applications.find(x => x.approvedAmount !== undefined);
  approvedWithAmount.approvedAmount += 1;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(badApproval)); const invalidApprovalStore = new LoanWorkflowService(original, auth);
  assert.match(invalidApprovalStore.storageError, /could not be read/);
  const badEligibility = JSON.parse(snapshot); badEligibility.applications[0].assessments[0].eligibility.customer.activeLoans = -1;
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(badEligibility)); const invalidEligibilityStore = new LoanWorkflowService(original, auth);
  assert.match(invalidEligibilityStore.storageError, /could not be read/);
  const oldLimitsData = JSON.parse(snapshot);
  for (const app of oldLimitsData.applications) { for (const a of app.assessments) { if (a.sourceChecks) { a.checks = a.sourceChecks; } delete a.eligibility; delete a.sourceChecks; } }
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(oldLimitsData)); const earlierLimitsStore = new LoanWorkflowService(original, auth);
  assert.equal(earlierLimitsStore.storageError, ''); assert(earlierLimitsStore.applications.every(x => !latestAssessment(x).eligibility));
  localStorage.setItem(LOAN_STORAGE_KEY, '{bad json'); const corrupt = new LoanWorkflowService(original, auth);
  assert.match(corrupt.storageError, /could not be read/);
  await assert.rejects(corrupt.submit(draft, { submissionKey: 'do-not-overwrite' }));
  assert.equal(localStorage.getItem(LOAN_STORAGE_KEY), '{bad json'); localStorage.setItem(LOAN_STORAGE_KEY, snapshot);
  for (const item of [apps, queue, detail, component, workflow, storageReload, legacyStore, invalidModelStore, earlierAiStore, invalidLimitStore, invalidApprovalStore, invalidEligibilityStore, earlierLimitsStore, corrupt]) { item.ngOnDestroy(); }
  console.log('PASS: seven eligibility checks, exact boundary/unknown/zero handling, downstream limits and approvals, verification reassessment and historical context.');
  console.log('PASS: fifteen Kenyan profiles across all risk bands, positive band-adjusted limits, reviewed High-risk approval, integration controls/availability/activity and ranked graph shares.');
  console.log('PASS: policy context alongside unchanged model sensitivities, actionable submission feedback, all officer actions, safe storage retry and override validation.');
  console.log('PASS: full/reduced limits, independent maximum reconciliation, identity invariance, decline/referral, exact approved amount and legacy-state compatibility.');
  console.log('PASS: deterministic three-model simulation, weighted reconciliation, identity-invariant financial inputs and directional sensitivities.');
  console.log('PASS: scenario isolation, policy-constrained advice, old assessment compatibility and invalid ensemble-state rejection.');
  console.log('PASS: original scorecard reuse, fifteen-customer lookup, unknown IDs and all draft validation guards.');
  console.log('PASS: individual and CSV/XLSX/XLS bulk submission, duplicate protection, partial invalid rows and retry.');
  console.log('PASS: visible assessment loading, duplicate-click guard, error recovery, retry and navigation cleanup.');
  console.log('PASS: pending review, approve, decline, information request, policy override and final-status guards.');
  console.log('PASS: reassessment version history, saved-state restoration, quota failure and corrupt-state preservation.');
  console.log('PASS: real page controllers, list filters/pagination, version selection, queue selection and shared status updates.');
  console.log('LIMIT: API examples run in the browser; no external lending backend or trained ML model is called.');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
