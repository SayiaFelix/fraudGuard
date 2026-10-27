# Exact source-file modification plan

Paths below are relative to the original project's folder containing `package.json`. The plan was presented before implementation; the development budget fix was added after the full build exposed the inherited size limit.

## 1. New Application frontend

| File Path | Current Responsibility | Required Changes | Action |
|---|---|---|---|
| `src/app/views/pages/credit/new-application/new-application.component.ts` | Builds a reactive form and directly submits a demo application, allowing the recommendation to become the final status. | Add explicit ID lookup/confirmation, async submission guards, retry, reassessment by existing ID, file validation/preview, bulk progress and partial-failure handling through one shared service. | Modify |
| `src/app/views/pages/credit/new-application/new-application.component.html` | Single manual application form and a result screen. | Retain existing card/button/form styles; add individual/bulk tabs, mock lookup labels, confirmation fields, loading/errors, upload preview/template and links to saved assessments. | Modify |

## 2. Applications frontend

| File Path | Current Responsibility | Required Changes | Action |
|---|---|---|---|
| `src/app/views/pages/credit/applications/applications.component.ts` | Searches and filters the in-memory original demo book. | Subscribe to successfully saved workflow applications; search identity fields; filter officer status, risk and recommendation; sort and paginate. | Modify |
| `src/app/views/pages/credit/applications/applications.component.html` | Displays seeded application decisions as one outcome. | Display score/risk and rule-derived recommendation separately from officer status; add View assessment, filters, sorting and pagination. | Modify |
| `src/app/views/pages/credit/applications/application-detail.component.ts` | Loads a single seeded application through the existing route. | Load saved assessments, select prior versions and retain a labelled legacy-record fallback for old dashboard links. | Modify |
| `src/app/views/pages/credit/applications/application-detail.component.html` | Shows a financial snapshot, factors and notes. | Use the shared assessment view; show versions, officer identity/time, information requests, status transitions, override history and reassessment action. | Modify |

## 3. Decision Queue frontend

| File Path | Current Responsibility | Required Changes | Action |
|---|---|---|---|
| `src/app/views/pages/credit/decision-queue/loan-decision-queue.component.ts` | New controller. The old queue component is also used by Alerts. | Keep Alerts unchanged by isolating the new assessed-application workflow. Add filters/pagination, current-assessment review, final confirmation and three recorded officer actions. | Create |
| `src/app/views/pages/credit/decision-queue/loan-decision-queue.component.html` | New view built from the existing portal's cards, tables, pills and buttons. | Show pending/information/finalised states, issues, assessment review and reason/override confirmation. | Create |

## 4. Backend routes, controllers and services

No backend source is present in the archive. There are no existing lending backend paths to update or reuse. No fictional route/controller files have been added or described as an existing backend. The frontend demo does not issue lending API requests.

`src/app/shared/services/http.service.ts` remains unchanged: its customer and prediction-related methods point at fraud services and do not supply a verified lending feature/output contract. Using those model outputs as loan default predictions would be unsupported.

## 5. Database models, schemas and migrations

No database schema or migration is supplied. No database integration is claimed. The new frontend types and versioned browser store are listed below. Live persistence and an authenticated decision history require the missing backend/database code.

## 6. Model and assessment services

| File Path | Current Responsibility | Required Changes | Action |
|---|---|---|---|
| `src/app/views/pages/credit/credit-data.service.ts` | Existing deterministic scorecard, policy/rule evaluation and other modules' demo state. | Call its actual `scoreDraft`, policy and rules without changing its behavior for unrelated pages. | Reuse unchanged |
| `src/app/views/pages/credit/credit-demo.data.ts` | Original application fixtures, scorecard types, products and policy defaults. | Derive only five mock lookup profiles from records already present; do not import the enhanced synthetic dataset. | Reuse unchanged |
| `src/app/views/pages/credit/workflow/loan-workflow.models.ts` | New workflow-specific data types. | Represent application identity, assessment versions, immutable input/policy snapshots, recommendations, officer statuses, events and bulk-row outcomes separately from the old shared demo type. | Create |
| `src/app/views/pages/credit/workflow/loan-workflow.service.ts` | New shared application workflow. | Validate input, reuse the original scorer, snapshot results/policies, save only successful assessments, deduplicate submissions, append reassessments and record final officer decisions with shared browser state. A separate service prevents the requested workflow from changing every unrelated demo module. | Create |

There is no trained model or model preprocessing file in the ZIP to invoke, retrain or replace. Model availability is explicitly false in each assessment, and the UI explains why.

## 7. Explainability and credit policies

| File Path | Current Responsibility | Required Changes | Action |
|---|---|---|---|
| `src/app/views/pages/credit/workflow/loan-workflow.service.ts` | Shared assessment workflow listed above. | Reconcile the source's additive terms, including its tenor adjustment and range clamp; expose actual enabled-rule evaluators and label unsupported rules; retain policy snapshots. These are deterministic explanations, not SHAP/LIME or a model prediction. | Create |
| `src/app/views/pages/credit/workflow/loan-assessment.component.ts` | New reusable assessment presenter. | Give Applications and Decision Queue the same human-readable interpretation of source factors and separate output types. | Create |
| `src/app/views/pages/credit/workflow/loan-assessment.component.html` | New shared assessment view. | Present customer/loan inputs, unavailable ML output, simulated score, affordability limitations, policy checks, source contributions and rule-derived recommendation in separate sections. | Create |
| `src/app/views/pages/credit/decision-rules/decision-rules.component.ts` | Original rule-editor file starts with methods outside any component class and cannot compile. | Restore imports, types, component/class declaration and fields referenced by its existing methods/template, and add the missing class closing brace. Preserve the existing rule methods and template. This is a compilation prerequisite, not a new policy-engine integration. | Repair |

No separate real model explainer can be implemented faithfully without the missing model, preprocessing pipeline and expected outputs. A live integration must supply those artifacts and an appropriate model-specific explanation method.

## 8. Shared utilities, configuration and checks

| File Path | Current Responsibility | Required Changes | Action |
|---|---|---|---|
| `src/app/views/pages/credit/workflow/loan-bulk.ts` | New file import utility. | Parse quoted CSV and existing-library Excel files; validate required/optional headers, types, row/file limits, duplicate rows and malformed content before assessment. | Create |
| `src/app/views/pages/credit/workflow/loan-workflow.scss` | New styles scoped to the requested pages. | Extend the existing blue theme, cards, filters, forms, responsive tables, progress and confirmation states. Keep the original global theme unchanged. | Create |
| `src/app/views/pages/credit/credit.module.ts` | Existing credit routes and declarations. | Register the shared assessment and new Decision Queue view; retain routes/navigation and keep Alerts on its original component. | Modify |
| `src/app/views/layout/sidebar/sidebar.component.ts` | Navigation badges sourced from the old demo book. | Use saved workflow counts for Applications/Decision Queue while retaining the existing Alerts source. Unsubscribe the new workflow subscription. | Modify |
| `angular.json` | Full portal build/serve settings, including an inherited 5 MB size limit. | Remove the size budget only from the development configuration so the full unoptimised demo can run. Preserve production settings. | Modify |
| `scripts/check-loan-workflow.mjs` | New reproducible automated check. | Exercise real service/controllers, original scorecard reuse, lookup, CSV/XLSX/XLS, partial failures/retry, reassessment, officer actions, shared list state and storage error paths. | Create |
| `src/app/shared/services/auth.service.ts` | Existing authentication/session identity, currently using demo login in the supplied source. | Read the existing current user for officer attribution; explicitly label the no-session fallback. No authentication behavior is replaced. | Reuse unchanged |
| `package.json` and `package-lock.json` | Existing Angular and Excel dependencies. | No added packages or manifest changes. | Reuse unchanged |

## Files retained unchanged

The original Alerts queue component, Credit Scoring, dashboard, portfolio, policy simulator, model monitoring, reports, settings, integrations, global styles, login, authentication, shared HTTP services, original data fixtures and dependency manifests retain their source code. The ten modified original files and eight new application files are the only application changes in this package; one new test script is also supplied.
