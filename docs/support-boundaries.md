# Capability and support boundaries

Baseline supplies Astro project foundations, design primitives and agent workflows. Upstream capabilities and a successful build still need acceptance against the site's actual content, runtime and integrations.

## Platform profiles

| Profile | Content and editing | Runtime / hosting | Acceptance on the destination |
| --- | --- | --- | --- |
| `emdash` | EmDash relational content, Portable Text, admin and live editor | Root default: Node + SQLite + local media. Workers + D1 + R2 is a separately configured target. | Persistent database/media, fresh admin login, editor permissions/save/publish, content transfer and recovery; Workers bindings/services separately |
| `static` | Typed Astro Content Collections and Git-owned Markdown | Static `dist/`; no database or server adapter | Build/rebuild triggers, real 404s, URL/SEO behavior and native images on the chosen host |
| `static-sveltia` | Same files edited by Sveltia and committed to GitHub | Same static site plus editor SPA; OAuth proxy or PAT authentication | Sign-in, repository/branch permissions, media upload and publication through the actual build/deploy path |

Profile selects editing/runtime independently of Standard/Express delivery tracks. See [Platform Profiles](platform-profiles.md) for generation and hosting choices.

## Division of responsibility

| Capability | Upstream / Baseline responsibility | Evidence still needed per site |
| --- | --- | --- |
| Rendering and imagery | Astro renders pages and processes native images; Baseline provides shell/layout/image components | Rendered responsive behavior, intended originals, media after upload and host-specific transforms |
| Content and WordPress import | EmDash supplies import/conversion, content/media APIs, editor and relationships; Baseline supplies discovery/modeling/handoff guidance | Entity/locale/status reconciliation, unsupported blocks/builders, source identifiers and actual editor round trips |
| Redirects and SEO | EmDash supplies redirect middleware, sitemap/robots routes and SEO APIs in `emdash`; Baseline wires content templates/contributions and requires a legacy URL register | Changed permalinks, redirect destinations, canonical/noindex/social metadata and source-plugin fidelity. Static profiles need their own configuration. |
| Design checks | Baseline checks the art-direction record, changed source, selected token contrast pairs, fluid bounds and component coverage | Visual quality and rendered accessibility, keyboard/reflow and relevant content states; token checks do not certify complete WCAG conformance |
| Database/media tooling | Baseline provides offline schema inspection, reviewed seed candidates, isolated D1 snapshots and explicit media preparation/ingestion/staging | Actual content parity, selected live D1/R2 behavior, complete transfer and host restore acceptance |
| Forms and integrations | Baseline provides behavior inventory and form patterns; optional plugins/providers supply selected features | Spam success/failure, retained submissions, privacy, actual delivery/recovery and each required external integration |
| Maintenance | Baseline workflows produce reviewed proposals; profile-filtered sync preserves conflicts | Review, local verification and adoption of each candidate; proposals do not certify a deployment |

## Tested scope and evidence

- [Standards 0.1.1](../standards/releases/0.1.1.md) retains the scoped Node/SQLite/local-media and Windows Chromium certification. Resolve the immutable standards reference for downstream audits; current main is not automatically that certified release.
- [Platform-profile verification](verification/platform-profiles.md) records independent generated builds and browser checks. Its linked Sveltia pilot verified token publishing on a disposable static deployment, with OAuth, fine-grained PAT and automatic Git hosting limitations stated separately.
- [Phase 5 infrastructure evidence](../audit/phase-5-2026-10-16/README.md) covers synthetic offline transports and a local CMS media/content API rehearsal. It does not certify live Workers/D1/R2, cloud restore or browser editor saving.
- [Native forms evaluation](forms-adoption.md) distinguishes tested local storage/validation from external delivery, Workers and full accessibility/editor acceptance.
- [Gallery migration case study](../audit/gallery-migration-case-study.md) is a privacy-edited architectural example, not a reproducible client receipt or universal importer guarantee.

Root CI and generated-profile CI run on Ubuntu. Screenshot regression remains a local Windows Chromium workflow; screenshots do not prove editor saves, provider delivery or accessibility conformance. See [Visual regression](visual-regression.md).

Migration guidance requires a reviewed URL inventory and content, media and behavioral checks. The [migration acceptance tool](migration-acceptance.md) collects bounded HTTP observations for declared URLs and references, and supports offline replay. Version 3 reconciles complete, hash-bound offline inventories, including unpublished records, against explicit entity mappings. It does not discover a complete legacy inventory, collect credentialed CMS data, verify editor workflows or synchronize deltas. See [inventory contracts](migration-content-inventories.md). Absent required evidence is unverified. Import retries can skip existing entries; see [WordPress content modeling](wordpress-content-modeling.md). Commerce, memberships, feeds, newsletters, analytics and consent behavior must be inventoried and preserved, replaced or deliberately excluded for each site.

Cloudflare EmDash runtime certification and external-provider acceptance remain separate from static hosting pilots. Code deployment does not transfer the CMS database or media. Consult [production deployment](production-deployment.md), [database workflow](database-workflow.md) and [image delivery](image-delivery.md) for the shipped operational boundaries.
