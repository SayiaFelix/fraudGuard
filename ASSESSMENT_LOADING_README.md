# AI assessment loading update

Copy the included src and scripts folders into your existing project, replacing matching files. This update builds on the Simple API Preview update.

The three component files are:

- src/app/views/pages/credit/new-application/new-application.component.ts
- src/app/views/pages/credit/new-application/new-application.component.html
- src/app/views/pages/credit/new-application/loan-intake-integration.scss

Refresh the portal after Angular recompiles. Select a customer and click Run AI assessment.

A Loading AI assessment panel replaces the input form while the submission is busy. It includes an animated spinner and three stages: Preparing application, Running risk assessment and Preparing results. The results appear after the submission finishes.

The browser-based demo has a short presentation transition of about two seconds so the loading state is visible. These stages are not measured progress from a remote inference service. The model-simulation label remains visible.

Duplicate clicks are blocked. Errors restore the form and preserve its inputs for retry. Leaving the page clears pending presentation timers; leaving before assessment starts does not create an application.

Individual applications and reassessments use the loading panel. Bulk Intelligence keeps its existing batch progress display.

The supplied workflow check covers loading visibility, duplicate submissions, failure/retry and navigation cleanup. Angular template compilation, Sass compilation, the lending workflow checks and the browser-only API preview checks passed.

Start the portal using your usual Angular command:

    npx ng serve --port 22602
