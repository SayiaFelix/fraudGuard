# Profile retrieval, Felix score and Credit Copilot update

Copy every included `src` file into the matching location in your existing portal, beside your existing `package.json`. Replace the files when prompted. The scripts are optional verification commands. This is an updated-files package, not a standalone Angular project. No AppModule, CreditModule, package.json, sidebar or other-module changes are required.

This package includes the current Copilot/product-recommendation and small-loan approval dependencies from the preceding update, plus this update. It assumes the existing three lending modules and browser-only connector preview integration are already installed.

## What changed

- Retrieving a customer shows a spinner and **Loading profile…**, followed by the customer profile. Choosing a directory entry uses the same retrieval flow. After successful retrieval, **Browse available customers** collapses. Failed lookups leave the directory available for correction and retry. Repeated selection is blocked while retrieving. Reset and navigation cancel pending UI updates.
- Felix Sayia's standard Personal Loan application and offer now both show **800/900**. Monthly income remains **KSh 150,000**, the 12-month requested/offer amount remains **KSh 400,000**, the lending limit remains **KSh 436,000**, and ensemble risk remains **Low**. This KSh 400,000 case still requires an officer decision.
- Offer score, offer likelihood, offer debt service, principal/month, Explore this offer, limit reasons, How this limit is determined (including expanded text), and connector availability text are black.
- **Model perspectives** appears first under AI overview. The **CREDIT COPILOT / The story behind the application** button then opens a visible loading state before showing the brief and alternative products. Clicking Hide briefing closes it. Product suggestions are generated on demand. Errors can be retried; changing the assessment, leaving during loading or navigating away cancels stale results.
- Existing KSh 1–10,000 eligible automatic-approval routing, all 15 profiles, bulk upload, model-loading panel, officer actions, pop-out explanations and browser-only API examples are retained.

## Felix's score and saved assessments

The customer directory has an explicit demonstration credit-history adjustment of +176 points for Felix's supplied financial profile: 624 source points + 176 = 800. It is recorded as **Customer credit history** in assessment contributions and as a versioned adjustment snapshot. Candidate offers and product suggestions use the same adjustment. The original source scorecard remains unchanged for other customers. Names are not model features.

The adjustment applies while income, obligations, employment and bureau fields match the configured profile. Editing these financial fields removes the profile-specific adjustment. Changing amount or term still changes the request score through the original scorecard; 800 is the result for the supplied KSh 400,000 / 12-month application, not a score forced onto every scenario. The score remains constrained to 300–900. Policy, eligibility, risk and affordability checks continue to apply.

Existing saved assessments keep their original scores and history. For an existing pending Felix case, use **Reassess** with a valid reason, then run AI assessment. The new version shows 800 while the old version remains intact. For a new case, retrieve Felix and run AI assessment. Do not clear browser storage to apply this update.

The customer lookup and Copilot currently use local demo data and deterministic briefing/product-selection logic. Their short loading transitions make the busy state visible; they do not call a live bank, trained ML service or LLM API. Model simulation disclosure remains visible.

## Run

From your existing project root, use your normal command, for example:

```powershell
npx ng serve --port 22602
```

No separate Node API process or new dependency installation is needed for these changes.

## Quick verification

1. Expand Browse available customers and select Felix. Loading profile appears, then the directory closes and his profile appears.
2. Assess the default KSh 400,000 / 12-month application. Verify score/offer score 800, Low ensemble risk, maximum 436,000 and offer 400,000.
3. Under AI overview, see Model perspectives first. Click Credit Copilot: loading appears, then the brief and product suggestions. Hide briefing closes it.
4. Inspect the offer evidence, expanded limit explanation and connector strip: requested text is black.
5. Assess an eligible KSh 10,000 application: automatic approval bypasses the pending officer queue. KSh 10,001 retains officer review.

## Validation completed

Strict Angular 14 TypeScript/template compilation and both Sass files compiled successfully in an isolated validation module. The existing workflow, browser-only connector and recommendation checks passed. The new profile/Copilot check covers loading visibility, duplicate clicks, directory collapse, unknown ID/retry, reset/navigation cleanup, Copilot lazy generation/error/retry/cancellation, Felix's score/limit/offer, historical reassessment and saved-state validation. A full production portal build and browser visual screenshot test were not performed.

To run the checks in the existing project with dependencies installed:

```powershell
node scripts/check-loan-profile-copilot.mjs
node scripts/check-loan-workflow.mjs
node scripts/check-loan-connectors.mjs
node scripts/check-loan-recommendations.mjs
```

## Included files

- `src/app/views/pages/credit/applications/application-detail.component.html`
- `src/app/views/pages/credit/applications/applications.component.html`
- `src/app/views/pages/credit/decision-queue/loan-decision-queue.component.html`
- `src/app/views/pages/credit/new-application/loan-intake-integration.scss`
- `src/app/views/pages/credit/new-application/new-application.component.html`
- `src/app/views/pages/credit/new-application/new-application.component.ts`
- `src/app/views/pages/credit/workflow/loan-ai.engine.ts`
- `src/app/views/pages/credit/workflow/loan-assessment.component.html`
- `src/app/views/pages/credit/workflow/loan-assessment.component.ts`
- `src/app/views/pages/credit/workflow/loan-auto-approval.engine.ts`
- `src/app/views/pages/credit/workflow/loan-bulk.ts`
- `src/app/views/pages/credit/workflow/loan-eligibility.engine.ts`
- `src/app/views/pages/credit/workflow/loan-limit.engine.ts`
- `src/app/views/pages/credit/workflow/loan-product-recommender.ts`
- `src/app/views/pages/credit/workflow/loan-workflow.models.ts`
- `src/app/views/pages/credit/workflow/loan-workflow.scss`
- `src/app/views/pages/credit/workflow/loan-workflow.service.ts`
- `scripts/check-loan-connectors.mjs`
- `scripts/check-loan-recommendations.mjs`
- `scripts/check-loan-workflow.mjs`
- `src/app/views/pages/credit/workflow/loan-customers.data.ts`
- `scripts/check-loan-profile-copilot.mjs`
