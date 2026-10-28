# 15-customer intake and bulk upload update

## Install

Copy the included src and scripts folders into your existing Angular project beside package.json. Replace the three matching files. These are update files, not a standalone project.

- src/app/views/pages/credit/workflow/loan-customers.data.ts: 15 customers, preserving the existing nine identities and adding six Kenyan profiles.
- src/app/views/pages/credit/workflow/loan-workflow.service.ts: the assessment description now uses the current customer count automatically.
- scripts/check-loan-workflow.mjs: updated checks for all 15 customers and Felix's exact limit and proposed offer.

Let Angular recompile and refresh the browser. The in-app Download template button already reads the customer directory and now includes all 15 rows. No New Application template or styling replacement is required.

## Upload

1. Install the code updates first so every uploaded national ID resolves to its customer profile.
2. Open New Application > Bulk Intelligence.
3. Select either uploads/UBA_Bulk_Upload_15_Customers.csv or uploads/UBA_Bulk_Upload_15_Customers.xlsx.
4. Confirm 15 rows are Ready, then select Assess valid / retry failed rows.
5. Open Applications or Decision Queue to review the saved assessments.

Use either format for a batch. The Excel file's first worksheet, Applications, contains the upload data. Customer reference lists all 15 names and expected default-policy results; that worksheet is not imported.

The upload columns remain national_id, requested_amount, tenor_months, product, application_id and reassessment_note. Customer names, monthly income and verification facts are retrieved from the updated customer directory. Leave application_id and reassessment_note blank for these new application examples.

## Customers and expected results

There are five Low, five Medium and five High AI risk profiles under the default policy and available required connectors. Risk labels are calculated, not stored as overrides. Every profile produces a positive proposed offer. The existing eight customers keep their previous inputs and results.

Felix Sayia keeps income KSh 150,000, requested principal KSh 400,000, a 12-month term and KSh 20,400 monthly obligations. The current calculations give Low AI risk, a KSh 436,000 maximum and KSh 400,000 proposed offer. His source scorecard remains 624, requiring officer review under the default 700 approval cutoff. Additional profile and verification details are demonstration assumptions.

New profiles: John Kamau, Purity Naliaka, Hassan Abdi, Esther Chebet, Kevin Omondi and Rose Wanjiku. New customer IDs are appended so the prior nine internal IDs remain stable.

The default policy is approve from 700, decline below 580, maximum debt service / income 45%, and maximum principal KSh 2,000,000. Different policy settings, changed financial inputs or unavailable required connectors can change the results.

## Verification

The existing workflow checks passed with 15 customers. Both delivered upload files passed the actual upload parser, customer lookup, validation and bulk submission: 15 Ready and 15 saved, with Felix's requested figures intact. The CSV matches the application's generated template. Both Excel worksheets were rendered and inspected. No full Angular production build was run for this data update.
