# Credit Copilot recommendations and small-loan automation

Copy the included src and scripts folders into your existing Angular project beside package.json. Replace all matching files together. This update builds on the browser-only API previews and assessment loading updates. It changes only the three lending modules and their shared workflow files.

Start the portal as usual:

    npx ng serve --port 22602

## Credit Copilot

The visible brief is shortened to the risk outlook, proposed amount and customer-check summary. The longer model explanation, strengths, concerns and review actions are available under View assessment reasoning.

Other products to consider shows up to two alternatives from the project's existing catalog: Personal Loan, Salary Advance, SME Working Capital, School Fees, Device Finance and Asset Finance. The current product is excluded.

Suggestions use the saved customer's financial profile, the current configured policy, the existing source scorecard, affordability, eligibility and the existing model risk signal. Salaried profiles can receive Salary Advance suggestions. Business/self-employed profiles can receive SME Working Capital suggestions. Purpose-based suggestions explicitly say that the borrowing purpose needs confirmation.

The illustrative recommendation terms use these demo ranges: Salary Advance 1 month, SME Working Capital 3–24 months, Personal Loan 3–36 months, School Fees 3–12 months, Device Finance 3–24 months and Asset Finance 6–48 months. These are recommendation assumptions, not a claim about a bank's approved product terms. Recommended amounts do not exceed the original request and are not approved new facilities.

Assess this product opens a new application with the suggested product and terms. It carries forward the selected source assessment's financial and verification inputs, including historical versions, for review. It does not alter the original application or submit automatically.

## Automatic approval for small requests

Positive requests from KSh 1 through KSh 10,000 inclusive can now be entered individually and in bulk. Eligible requests are saved directly as Approved, with approvalMode Automatic and a system Auto-approved history event. They do not enter the pending officer queue.

The rule requires:

- All seven customer eligibility checks pass, including ID/KYC, tenure, CRB/default status, borrowing exposure and affordability.
- A Clean bureau profile and available required data connectors.
- No source-scorecard decline, a score at least at the configured decline cutoff, and a model risk outlook below High.
- The full requested amount is supported by the assessed lending limit and DTI cap.

This size-based rule can approve a small request that the source scorecard would ordinarily refer because it is below the normal approval-score cutoff. The underlying score and model recommendation remain in the assessment for explanation. Hard decline findings, missing evidence and unsupported amounts continue to require review.

Requests above KSh 10,000 retain officer review. Older saved pending applications are not approved merely by loading this update. Reassess with current evidence to apply the new rule.

The success screen links automatic cases to their saved approval. Applications identifies automatic decisions, and the history records Decision engine / System policy. Approved cases remain visible in the finalised/all queue views for reference, while the pending inbox excludes them.

## Quick demonstration

1. Select Felix Sayia and request KSh 5,000 or KSh 10,000 with his existing verified profile. Run AI assessment. The loading panel appears, followed by Approved automatically.
2. Open Applications to see the approval and its system history.
3. Repeat at KSh 10,001. It remains Awaiting decision.
4. Mark KYC incomplete on a KSh 5,000 request. It requires review instead of automatic approval.
5. Assess Brian Otieno's Personal Loan and open Credit Copilot. Explore an alternative product and review its prefilled application.

Felix's original KSh 400,000 request remains a manual-review case with the previously demonstrated KSh 436,000 limit and KSh 400,000 offer under the default settings. All 15 existing customer inputs are retained.

## Compatibility and validation

The existing lending-limit calculation remains unchanged for requests of KSh 10,000 and above. Smaller requests use a versioned limit snapshot with a minimum of KSh 1. Supported limits of KSh 1,000 and above retain KSh 1,000 rounding; lower limits use whole shillings. Older limit and assessment snapshots remain readable.

This remains a frontend demonstration using the existing illustrative model outputs and product rules. Product suggestions are not produced by a newly trained recommender. Automatic approval records the decision; it does not transfer funds.

Checks:

    node scripts/check-loan-recommendations.mjs
    node scripts/check-loan-workflow.mjs
    node scripts/check-loan-connectors.mjs

Checks cover the inclusive amount threshold, policy failures, bulk/reassessment routing, system history, reload integrity, queue exclusion, product ranking, source-preserving prefill and fresh-application submission. Angular template compilation and both affected Sass files also passed.
