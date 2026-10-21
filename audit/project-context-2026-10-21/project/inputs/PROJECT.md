# Project context

## Existing site brief

Fictional evaluation facts; these approvals describe the synthetic client, not a real customer.
Purpose: help local team leads find and register for practical workshops.
Audience: team leads at small local organizations.
Launch scope: one English locale, native static content, a workshop index and detail pages. No browser CMS or payment integration.
Registration: mailto:workshops@northline.example.test; preserve this endpoint.
Ownership: Studio editor supplies workshop copy; site maintainer handles code/build/deployment.
Decisions: static editing and email registration approved in audit/brief-decision.md; no launch date is approved. Quarterly publication cadence is assumed, not approved.
Source map: baseline.config.json and astro.config.mjs describe the installed platform; src/content.config.ts and src/content/workshops/ own the model/content. AGENTS.md contains the Art Direction Record; DESIGN.md is a visual reference; CSS owns shipped values.
