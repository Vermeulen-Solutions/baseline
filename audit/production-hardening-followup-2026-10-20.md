# Production hardening follow-up — 20 October 2026

This implements the four approved follow-ups to commit `0fce352`. The original [implementation record](production-hardening-2026-10-20.md) and supplied field audit/review remain historical evidence. This is starter infrastructure maintenance, with exact hash-bound design exceptions and no client visual changes. No registry plugin was selected or installed; the user's Publish Check link was an example.

## Decisions and changed files

| Follow-up | Implementation |
| --- | --- |
| One metadata owner | `src/plugins/baseline-metadata/index.ts` contributes BreadcrumbList and Organization through the native `page:metadata` hook configured in `astro.config.mjs`. `Base.astro` passes typed context only; the independent `StructuredData.astro` script renderer is removed, and `src/pages/index.astro` no longer carries a separate organization switch. Core retains WebSite/BlogPosting, SEO-panel precedence, safe serialization and CSP registration. |
| Explicit plugin coexistence | Stable `breadcrumbs` / `organization` contribution IDs and priority 10000 let ordinary earlier hooks win. `organizationPaths: []` and `breadcrumbs: false` disable individual defaults. Deduplication is by ID, not schema type; another plugin using different IDs requires explicit ownership configuration. Documented in `src/plugins/README.md` and `docs/edge-cache-lifecycle.md`. No sandbox runner or package dependency was added. |
| Actual cache contract | `tests/cache.integration.mjs` / `check:cache` build a disposable Node/SQLite production app with Astro memory caching. Authenticated API mutations must cause real HIT/MISS transitions. A real persisted editor session tests shared anonymous HTML and private edit mode. A second production build must change validators/CSS URLs while retained old and current CSS remain available. `tests/visual/site.mjs` supports a post-build retention callback and clean release rebuild. |
| Fresh taxonomy labels | The real cache test exposed stale category labels on cached articles. `src/pages/posts/[slug].astro` now registers category/tag hints for hydrated terms; `src/pages/posts/index.astro` registers the tag hint for its batched term labels. These extra lookups run only when route caching is enabled. |
| Serialized asset generations | `scripts/retain-build-assets.mjs` takes an exclusive archive lock, stages generations under a unique pending name, syncs the manifest and atomically renames the completed generation. Pending trees are quarantined. Token-bound recovery refuses a live local owner; cross-host recovery requires independently established job termination and serialized deployment jobs. No automatic age-based lock expiry or committed-generation deletion. |
| Bounded retries and nested paths | A non-secret output marker rejects processed/interrupted artifacts so inherited files cannot acquire fresh retention ages. Clean rebuilds are required. Fixed a nested-directory variable shadowing failure in the original retention scanner. `tests/asset-retention.test.mjs` exercises lock contention, actual killed-process recovery, incomplete staging, repeated output and nested exact-case bytes. Existing expiry/collision/corruption checks remain. |
| Cohesive deployment skills | Consolidated recovery, caching/retention, bootstrap lockdown, provider parity and observed scheduler checks into the relevant steps of `emdash-site-setup`, `emdash-production-cutover` and `new-site-workflow`. Removed appended duplicate safety sections and misleading backup-after-launch guidance. Routine authorized configuration/checks belong to the deployment agent; bare Wrangler deployment does not invoke them automatically. Node/static routing and upstream skill mirrors are preserved. |
| Supporting contracts | `tests/production-hardening.test.mjs` covers contribution ownership/overrides; `tests/metadata.integration.mjs` and `tests/metadata/fixture-plugin.mjs` verify actual SSR graph deduplication, hostile strings and emitted CSP hashes. `tests/test-tiers.json`, `profiles/file-inventory.json`, `profiles/manifests/emdash.json`, `package.json` and `audit/design-gate-exceptions.json` track the changed inventory and commands. |

## Source verification and CSP boundary

EmDash Docs MCP confirms the shared native/sandboxed [page:metadata hook](https://docs.emdashcms.com/plugins/creating-plugins/hooks/#pagemetadata), first-wins ID deduplication and lower-priority-first execution. The generic hooks reference contains a conflicting last-wins sentence; installed EmDash 1.3.0 `page/metadata.ts`, `components/EmDashHead.astro` and the production fixture establish the actual first-wins behavior. Installed `components/JsonLdScript.astro` and `page/metadata.ts` establish safe serialization and hash registration. Astro Docs MCP verifies the [CSP runtime API](https://docs.astro.build/en/reference/api-reference/#cspinsertscripthash); installed Astro 7.4.0 rendering code and Node 11.1.8 types/runtime define response timing and the buffering option.

The actual-response check found an important limit: default Node streaming can finalize the CSP header before asynchronous EmDashHead contributions register their hashes. The strict-CSP rehearsal therefore uses the supported Node adapter `experimentalDisableStreaming: true` option, waits for the final output, and checks every emitted JSON-LD hash against the HTTP policy. A site adopting strict CSP must use and measure this buffered configuration or independently prove its adapter/streaming strategy. The starter's existing streaming behavior and disabled public CSP remain unchanged. Hash registration alone is not proof of a correct deployed policy; graph hash coverage is not whole-site CSP conformance.

## Verification and operational limits

Runtime receipts and command logs are local ignored artifacts under `.emdash/checks/`. The cache rehearsal covers seven scenarios: publish, shared menu, category, tag, settings, anonymous/editor isolation, and a genuine code/assets rebuild. It uses a fresh synthetic CMS with temporary credentials, then removes its server and source tree. No working database/media/env is copied, and no cloud resources or provider messages are involved.

Cloudflare cache/purge behavior, actual cron propagation, setup restrictions, provider delivery and recovery drills remain deployment acceptance work in the skills against a selected site/account. The memory provider pass does not certify Workers Cache. Neither a registry SEO plugin nor a generic newsletter implementation is introduced.

| Check | Result |
| --- | --- |
| `check:art-direction` | Pass; exact infrastructure exceptions, no client art direction invented |
| `check:schema-budget` | Pass; pages 17 and posts 19 physical columns |
| `verify:fast` | Pass; 145 unit tests |
| `npm test` | Pass; 145 unit + 132 rehearsal tests, zero failures/skips |
| `typecheck` | Pass; 53 files, zero errors/warnings/hints |
| `verify` | Pass; lint, CSS/art/token checks, all 277 tests and final typecheck |
| `build` | Pass; production Node artifact and release-profile assertion |
| `audit:html` | Pass; 9 HTML files from 10 captured public responses; representative linked routes, not all runtime patterns |
| `check:cache` | Pass; seven real cache/rebuild scenarios; two builds, one old CSS asset retained |
| production metadata/browser rehearsal | Pass; twelve routes, final graph CSP hashes under buffered SSR, editor precedence, media and browser JS checks |
| runtime source fingerprints | Pass; both receipts match final source files |

`git diff --check` passed. Logs and runtime receipts remain in ignored `.emdash/checks/`; no credentials or generated build artifacts are committed. The implementation contains 25 changed files, including this record.
