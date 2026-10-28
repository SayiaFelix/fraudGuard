# Sidebar spacing fix — three lending modules

Copy the four included source files into their matching locations in your existing Angular project. Replace the existing files when prompted. Run the portal using your usual command.

## Result

The content below each page header now has a consistent horizontal gutter beside the sidebar and at the right edge:

- Desktop: 28 px on each side.
- Viewports up to 700 px: 22 px on each side.
- Viewports up to 480 px: 16 px on each side.

This covers New application (steps, mode buttons, individual/bulk/integration panels), Applications (KPI cards, filters and table), and Decision Queue (KPI cards, inbox and review).

Each template now places the page body in a `loan-page-content` wrapper. Its padding comes from the shared stylesheet. The existing page headers stay outside this wrapper, preserving their title alignment. Nested assessment cards receive no additional page gutter.

## Replace these files

1. `src/app/views/pages/credit/workflow/loan-workflow.scss`
2. `src/app/views/pages/credit/new-application/new-application.component.html`
3. `src/app/views/pages/credit/applications/applications.component.html`
4. `src/app/views/pages/credit/decision-queue/loan-decision-queue.component.html`

Your supplied `loan-intake-integration.scss` can remain in place; the shared gutter handles its content too.

The update uses your supplied current templates and stylesheet. Existing headers and Angular bindings are preserved, including profile loading, directory collapse, Copilot controls and decision actions.

## Verification

Checked that all three updated templates are balanced, each has exactly one page-body wrapper, and removing that wrapper restores the original supplied template exactly. Header markup and bindings are unchanged. The shared stylesheet is byte-preserved with the new padding rules appended. No overflow clipping, transforms or positioning changes were added.

A full Angular compilation and browser visual check were not run because this upload contains templates and styles rather than the full project.
