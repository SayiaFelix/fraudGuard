# Lending card overlap fix

Apply all **seven files together**: five HTML templates and two SCSS files. The templates and styles need the same new class names.

## Cause and fix

The lending cards used the generic `ai-panel` class. A floating AI-panel style can therefore give them fixed positioning, popup dimensions and a translation, which lifts them over the header, tabs and neighbouring cards.

The lending templates now use `loan-panel` and `loan-panel-heading`. The scoped styles keep those cards in the normal page layout. The existing sticky inbox/connector list and floating risk explanation retain their intended behaviour. The active intake mode also keeps its contrasting blue background while hovered.

## Install

1. Stop Angular with Ctrl+C.
2. Merge this ZIP's `src` folder into the existing project folder containing `package.json`. Replace all seven matching files completely.
3. Restart your usual Angular command on the same port. For example:

```powershell
npx ng serve --port 22602
```

4. Refresh the page with Ctrl+Shift+R.

## Included files

- `src/app/views/pages/credit/applications/application-detail.component.html`
- `src/app/views/pages/credit/applications/applications.component.html`
- `src/app/views/pages/credit/decision-queue/loan-decision-queue.component.html`
- `src/app/views/pages/credit/new-application/loan-intake-integration.scss`
- `src/app/views/pages/credit/new-application/new-application.component.html`
- `src/app/views/pages/credit/workflow/loan-assessment.component.html`
- `src/app/views/pages/credit/workflow/loan-workflow.scss`

The five HTML changes are class-name changes only. No TypeScript, score calculation, loan limit, customer profile, decision action, module declaration or dependency is changed. The sidebar and its AI assistant styles are retained.

## Verification

The previous class conflict was reproduced with a global floating `.ai-panel` rule. After the rename, an Angular style-review fixture passes with that same conflicting rule still loaded. Checks cover normal card flow, all three intake modes, Applications, populated/empty Decision Queue, external AI-panel styling, focus, active tabs, table scrolling and explanation positioning at 1440, 1024, 768, 390 and 320 pixels. Desktop/mobile layouts were visually reviewed.

All five actual HTML templates parse with Angular's compiler, and both SCSS files compile with the project's Sass version. Full portal/backend tests were not rerun for this presentation-only change.
