# UBA lending workflow — three modules, latest consolidated files

This ZIP combines all previous workflow updates. Earlier ZIPs do not need to be applied in sequence. Use it inside your existing `finca_fraud_portal` Angular project.

## Contents

- **New Application:** Individual application, Bulk Intelligence and Integration panels.
- **Applications:** Saved assessments, filters, application detail and assessment/decision history.
- **Decision Queue:** Review, approve, decline, request information and record the approved amount.
- **Shared workflow:** model perspectives, risk-adjusted limits, seven policy checks, eight Kenyan profiles, integration controls, file imports and ranked Explainable Outlook with floating hover cards.
- The latest clean wording and decision submission fixes.

There are 25 code/configuration files: 23 in `src`/`scripts`, plus two older fixes in `optional-support`. `FILE_LIST.md` lists each path. `package-manifest.json` includes provenance and SHA-256 hashes.

## Install

1. Stop Angular with Ctrl+C.
2. Merge this ZIP's `src` and `scripts` folders into the existing project folder containing `package.json`. Replace matching files and add new files; retain your other project files.
3. If you have since customised `credit.module.ts` or `sidebar.component.ts`, merge the workflow component registrations, Decision Queue route and workflow counts into your current files, retaining your other changes. Declare credit components in `CreditModule` only.
4. Run from that existing project folder:

```powershell
npx ng serve --port 22602
```

Open `http://localhost:22602` after compilation. This is an update package, not a standalone Angular project: it contains no `package.json`, `node_modules` or build output. It adds no npm dependency.

## Optional support references

These are separate from the three modules and are not applied by merging the main `src`/`scripts` folders:

- `optional-support/angular.json`: the earlier full-portal configuration with the inherited development bundle-size budget disabled. If your current configuration needs that adjustment, merge its development `budgets: []` setting while retaining your other configurations. Production settings in the reference retain their earlier values.
- `optional-support/src/app/views/pages/credit/decision-rules/decision-rules.component.ts`: the earlier compilation repair for an original file missing its component/class wrapper. Keep your newer working Decision Rules page. Use this reference only if that original compilation repair is still needed.

## Verify and demonstrate

With the existing project's dependencies installed, run:

```powershell
node scripts/check-loan-workflow.mjs
```

Create an Individual application for Samuel Mwangi or Mercy Njeri to see a positive reviewed High-risk proposal. Open Explainable Outlook and hover, focus or tap a bar: the explanation floats beside or above/below it without pushing the graph down. Review the application in Decision Queue and record an outcome with the required rationale and acknowledgements.

Bulk Intelligence's Download template includes all eight Kenyan profiles. Integration reads the saved assessment and supports checks and pause/resume controls. Existing browser records remain on the same origin/port.

The model/connector simulation badges and methodology disclosures remain. This consolidation introduces no trained model or live bank/CRB/KYC/SMS/payout endpoint.

## Package validation

Every included code/configuration file matches the latest applicable update byte for byte. All 25 hashes, ZIP integrity, module/shared-file references, eight profile names, the hover implementation, clean wording and policy-table columns were checked.

No source logic was changed during consolidation. The preceding hover version passed strict Angular compilation, a full development build and desktop/mobile browser checks. The later wording-only patch received text/binding comparison and formatter checks. A new full Angular build was not run for this archive assembly.
