# Clean wording update — files only

Apply after `Loan_Workflow_Hover_Popout_Update_Files.zip`.

## Install

1. Stop Angular with Ctrl+C.
2. Extract this ZIP and merge its `src` folder into the existing project folder containing `package.json`, replacing the four matching files.
3. Restart:

```powershell
npx ng serve --port 22602
```

## Updated files

- `src/app/views/pages/credit/workflow/loan-assessment.component.html`
- `src/app/views/pages/credit/workflow/loan-workflow.service.ts`
- `src/app/views/pages/credit/applications/applications.component.html`
- `src/app/views/pages/credit/new-application/new-application.component.html`

The repeated word “simulated” is removed from the Explainable Outlook, hover explanations, scenario wording, assessment labels and integration labels. Generated summaries, strengths, concerns, limit reasons and connector messages also receive the clean wording when displayed, including messages in previously saved assessments.

The Model simulation and Connector simulation badges, methodology disclosures and endpoint limitations remain. These accurately describe the demo. This is a presentation change: stored assessment text, numerical model outputs, risk bands, loan limits, policy checks, connector controls and decision submission logic are unchanged. The existing floating hover card remains in place.

No new npm package, component or NgModule declaration is needed.

## Verification

The three HTML templates were compared against the preceding versions after accounting for the text substitutions and the new display-formatter calls. Their structure, original binding expressions, controls and policy-table columns are unchanged. The shared service is identical apart from its display-only text formatter. The remaining templates contain no standalone occurrence of the removed word. Formatter checks cover earlier saved summaries and case-insensitive text.

This wording-only patch was not subjected to a new full Angular build.
