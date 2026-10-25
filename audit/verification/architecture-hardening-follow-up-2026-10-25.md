# Architecture hardening follow-up — 2026-10-25

## Scope and environment

This is a source review and local acceptance record for issue #6, run on Windows with Node 24.21.0, npm 10.5.0, the EmDash Node/SQLite development profile, and local Chromium through Playwright. The static-profile commands create independent disposable installs. No production database, uploads, credentials, deployed provider, or mail service were used.

The adoption replay compared immutable checkpoint `d497299ffec500eb4369d3b1d33e3d570482143a` with source commit `b25df72e3cbdb03e8012ae9218444f430ac01ed8`. It exercised a near-default static site and a synthetic calibrated static-Sveltia site. The local app inventory exposed Chrome; NVDA and Firefox were not available in the exposed app list/common install locations. Firefox was omitted as requested. No human screen-reader session is represented by these results.

## Source review

- **Metadata ownership:** `SiteShell.astro` emits the single document title and owns `html[lang]`. EmDash `Base.astro` sets `metadataOwner="platform"`; the EmDash head contribution API supplies description, canonical, social metadata and JSON-LD, but not a second title. Static `Base.astro` resolves one metadata model and renders `StaticMetadata`. The static resolver omits public canonicals and absolute relative-image URLs when `siteUrl` is unconfigured rather than leaking a preview host.
- **URL and article facts:** EmDash public-origin selection follows configured settings URL, then `Astro.site`, then request origin; that fallback is deliberate and is documented by the installed runtime. Canonicals preserve route case/base and drop tracking query/fragment only for defaults. Editor-selected canonicals retain their own origin and meaningful query. Article dates/bylines come from hydrated content facts; unknown/invalid facts are omitted. Static route output honors configured base, trailing-slash and build-format policy.
- **Editor/plugin precedence:** SEO-panel values are overlaid before head/plugin consumers; plugin contributions win first-wins deduplication for canonical, description and the primary JSON-LD graph. The `<title>` remains layout-owned, with editor SEO title applied by the page resolver. Error routes omit canonical and JSON-LD and emit `noindex, nofollow`.
- **JSON-LD and cache:** serialization escapes script-closing characters and line separators. The integration rehearsal checked hashes against the actual buffered SSR CSP response. Cache hints are added only when `Astro.cache.enabled`; this local template has no configured external cache provider, so provider invalidation remains N/A here.
- **Bounded sync and ownership:** sync retains installed membership, original provenance, and client-owned Base/routes/config/content. It does not add new files or dependencies automatically. From the checkpoint, the exact expected conflicts are `src/styles/global.css`, `src/components/Section.astro`, `src/components/Container.astro`, `src/components/Grid.astro`, `scripts/design-system.mjs`, and `scripts/sync-baseline.mjs`. Reasons are the missing `layout-style` helper, new spacing aliases, direct `postcss` dependency, and the documented caller/editorial migration. Both fixtures preserve these conflicts until the reviewed additions are applied. The calibrated fixture preserves its prior theme, root and dark tokens, custom Base wrapper, navigation, and Sveltia config. The test adds shared spacing aliases without rewriting calibration or managed membership.
- **Native focus evidence:** `tests/journeys/composition.mjs` deliberately paces only its Enter and Tab actions by 50 ms and retains visibility/focus assertions. A fresh-page direct fragment load into the closed disclosure now also passes in local Chromium at 390/768/1440px. This supports native fragment reveal; it does not establish behavior for arbitrary faster physical input. Toolbar Find remains marked manual-pending.

## Rehearsals and results

| Check | Result |
| --- | --- |
| `npm.cmd run doctor` | Pass; Windows outer-launcher check is a warning because it cannot be observed from the Node process. |
| Metadata unit suites | 28/28 pass. |
| Disposable EmDash metadata rehearsal | Pass, 12 routes; synthetic editor SEO API write, native plugin precedence, error policy, JSON-LD/CSP hashes, LocalStorage bytes and responsive image candidates. No Media Library record or human editor session. |
| `node tests/visual/editor-rehearsal.mjs` | Pass in a fresh disposable EmDash site: built inline editor selected/typed/saved/reloaded/published a seeded page; anonymous render and empty field checked; built admin UI uploaded a synthetic PNG, edited alt text and caption, saved (HTTP 200), and confirmed both values after reload. Uses local dev-bypass, not human sign-in. |
| `npm.cmd run test:visual:functional` | Pass: 43 passed, 8 deliberate skips across Chromium widths 390/768/1440. The added direct-fragment test loaded the styleguide at `#disclosure-reveal-target`, confirmed native opening and viewport location, then checked visible unobscured focus after Tab while the disclosure remained open. |
| `npm.cmd run test:profiles -- --public-browser --keep` | Pass for static and static-Sveltia: independent install and clean install, verify, typecheck (35 files each, zero diagnostics), production/fixture builds, public HTTP and Chromium smoke. Both profiles have zero CMS/database packages. |
| `tests/architecture-adoption.integration.mjs` from checkpoint to `b25df72…` | Pass for both synthetic fixtures after correcting the replay to assert the six migration conflicts and explicitly apply the documented CSS/component/helper/dependency patch. Verify/build/fixture/HTTP/browser checks pass; ordered-list markers are present. Sign-in UI smoke is not authenticated publishing. |
| `npm.cmd run verify` | Pass: 182 unit tests, 136 rehearsal tests, and Astro check (53 files; zero errors, warnings or hints). |
| `npm.cmd run build` | Pass. Vite reported the existing advisory that some chunks exceed 500 kB. |
| `npm.cmd run audit:html` | Pass: 9 emitted HTML files and 10 linked public SSR responses. |
| `npm.cmd run test:visual` | Pass: 90 passed, 24 skipped, at Chromium widths 390/768/1440. Actual 200%/400% zoom checks passed at 1440; some viewport-specific zoom/reflow cases were deliberately skipped. |

The adoption rehearsal exposed two gaps in the previous test/documentation: it expected bounded sync to apply files that correctly require migration, and its explicit dependency list omitted `@types/node` although adopted native components import `node:crypto`. It also skipped the CSS/helper/component reconciliation needed for semantic list markers. The rehearsal now checks the exact migration reasons, includes `@types/node`, manually reconciles only the synthetic token values, and verifies marker semantics. `docs/baseline-updates.md` now lists the required type dependency.

Local source-bound receipts and rendered results are retained under ignored `.emdash/checks/architecture-metadata-review.json`, `.emdash/checks/architecture-adoption-20261025-run5/`, `.emdash/visual/report/`, and `.emdash/visual/editor-rehearsal/`. The editor receipt records the actual UI save response and the Media Library upload. The metadata receipt records LF-normalized SHA-256 values for the inspected wrappers, routes, metadata helpers and plugin. The adoption output records both immutable revisions and fixture invariants. The independent-profile retained tree is `C:\Users\Jaap\AppData\Local\Temp\baseline-profile-verification-CeedR6`; the final adoption fixture tree is `C:\Users\Jaap\AppData\Local\Temp\baseline-architecture-adoption-6uVb5m`.

## Still open

- Human NVDA checks, including title/language/landmarks/reading order and forms. No NVDA app was available here.
- Manual rapid Enter→Tab/Space/Shift+Tab and exclusive disclosure input, browser toolbar Find, direct fragment plus follow-up keyboard behavior in the browser UI, text-only enlargement, default/root font preferences, and physical/touch-device acceptance. The direct URL fragment now has automated Chromium coverage; automated checks do not replace these manual observations.
- Human EmDash editor sign-in (the automated save/publish rehearsal uses local dev-bypass); verifying media alt/caption in published content and missing/small-original fallback. The disposable UI upload and metadata edit create a Media Library item and persist its fields, while responsive image fallback was not manually exercised.
- Credentialed Sveltia draft/publish/upload/rebuild and auth-failure retry. Only public-site checks, configuration preservation and sign-in UI smoke ran.
- External cache invalidation, provider redirects/base paths, and form/mail delivery are N/A for this unconfigured local template; assess them against a deployed site/provider if configured.

Issue #6 remains open until the applicable human/editor/provider acceptance is recorded. This report makes no WCAG, authenticated-publishing, physical-device, or provider-certification claim.
