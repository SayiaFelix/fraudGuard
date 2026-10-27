# Explainable Outlook — hover pop-out update

Apply this after `Loan_Workflow_Integration_Kenya_Risk_Update_Files.zip` has been installed.

## Install

1. Stop Angular with Ctrl+C.
2. Extract this package and merge its `src` folder into the existing project folder containing `package.json`, replacing the three matching files.
3. Restart:

```powershell
npx ng serve --port 22602
```

## Included replacements

- `src/app/views/pages/credit/workflow/loan-assessment.component.ts`
- `src/app/views/pages/credit/workflow/loan-assessment.component.html`
- `src/app/views/pages/credit/workflow/loan-workflow.scss`

The shared assessment is used by New Application, Applications and Decision Queue. No new package or NgModule declaration is needed.

## Hover behaviour

The reason now appears in a floating card with a pointer and shadow, rather than expanding below the graph. It opens beside the bar when space allows, or above/below it on smaller screens. It remains within the viewport, scrolls internally when necessary, and follows the bar as the page scrolls. Hovering does not change the graph height.

Hover, focus or tap a bar to open its explanation. You can move the pointer onto the card to read it. Move away, tap outside, change tabs or press Escape to dismiss it. Each assessment has its own accessible description identifier. Resize/scroll handlers and pending timers are cleaned up when the assessment closes.

The customer information, ranked sensitivities, seven policy checks, lending limits and decision submission behaviour remain as in the previous update.

## Validation

Strict Angular compilation and the existing workflow checks passed. Actual browser checks passed for desktop hover, no layout shift, hovering over the card, keyboard focus/Escape, outside dismissal, scroll repositioning, tab cleanup, 390px mobile and short landscape viewport bounds, and real touch open/dismiss interactions. No browser page errors were reported.

The full development build passed with the original project's existing development bundle budget temporarily disabled for validation; its exact configuration was restored and is not included in this package. Existing unrelated optional-chain/CommonJS warnings remain.
