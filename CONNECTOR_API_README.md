# Simple API previews

Copy the included src and scripts folders into your existing Angular project beside package.json. Replace matching files.

Start the portal with your usual Angular command:

    npx ng serve --port 22602

Open New Application > Integration. Select a connector and a saved application, then click Preview response. Expand Sample request & response to show the JSON.

The tab includes eight API examples: core banking, CRB, national ID/KYC, origination, collections, payout readiness, screening and notices. Each shows an example POST endpoint. Responses are generated in the browser from the selected saved assessment.

This replaces the previous connector setup. There are no connection settings, server URLs or additional services to start. Previous local API connection settings are ignored. If the earlier server folder is present, it is unused by these previews.

Sample status codes, preview timing and DEMO request IDs describe the browser demonstration. They do not represent an external HTTP request. Payout and notice examples send no funds or messages. Screening evidence remains unavailable.

The 15 customer profiles, Felix's assessed terms, officer actions and saved assessment history are retained. Pause/resume controls and connector availability checks continue to work. The included 15-customer CSV can be used to create saved applications through Bulk Intelligence.

Optional verification commands:

    node scripts/check-loan-connectors.mjs
    node scripts/check-loan-workflow.mjs

The connector checks disable fetch and XMLHttpRequest and verify that all eight previews work. Angular template compilation and the existing lending workflow checks also passed.
