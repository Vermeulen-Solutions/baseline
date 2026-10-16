# Phase 2 implementation receipt — 15 October 2026

Phase 2 implementation is in the working tree. It upgrades the reusable Node starter and adds synchronization, diagnostics, registration and optional design-interchange tools. It is an unreleased candidate; Phase 3 certification and a stable standards tag remain outstanding. No client site, Cloudflare resource or external form provider was changed.

## Package and framework decision

| Package / runtime | Previous baseline | Selected / tested |
| --- | --- | --- |
| Astro | 7.3.5 | 7.4.0 |
| EmDash | 1.1.0 | 1.3.0, after reviewing 1.2 and 1.3 release notes |
| Node adapter | 11.1.6 | 11.1.8 |
| React integration | 6.0.6 | 7.1.0 |
| React / React DOM | 19.2.4 | Retained 19.2.4 |
| Node | Declared >=22.16 | Declared >=22.22.0; unit checks on 22.22.0 and 24.21.0 |
| Tailwind / Vite plugin | 4.3.3 | Retained 4.3.3 |
| Optional DESIGN.md CLI | Absent | Dev-only 0.4.0 |

The original `^7.3.2` range admitted 7.4; no intentional 7.3 hold was documented. Astro remains the framework because EmDash's integration and the existing templates depend on it. Version evaluation is now mandatory independently of CMS updates. [Upstream-before](upstream-before.json) and [upstream-after](upstream-after.json) separate available releases from tested versions and retain unverified/error states. A source commit match explicitly does not certify local skill cleanliness.

Astro 7.4 decisions: adopt the Node floor and `build:timings`; retain one native Sharp service on Node because dev/built/new-upload checks pass; defer a split service and Cloudflare profile until there is target evidence. No custom Astro font provider or composable server entrypoint is configured, so custom-provider warnings/notFound composition are not applicable here. The standalone handler and styleguide 404 are exercised. Keep parallel prerender/static redirect experiments and the React Compiler off. React integration 7 uses Oxc; this starter has no custom Babel option to migrate. Current React 19.3.1, Sharp 0.35.5 and Node 24.22.0/26 are surfaced for the next bounded review; the present tested versions are retained rather than silently broadening this change. Revisit on a security/support change or the next certification review.

Two defects surfaced during rehearsal. Reusing the old lockfile left invalid Tiptap peers; a fresh resolution followed by npm ci produced a valid graph. An admin React hydration fault occurred during the first dev optimization sequence; a restarted candidate with the reviewed current integration rendered the admin successfully. This does not establish that every 6.x installation is broken.

A built-server check then found Zod 3 hoisting from optional tooling: emitted EmDash chunks used bare Zod imports and failed at runtime. The final fix bundles dependency-local Zod with Vite `ssr.noExternal`, preserving each package's own version. There is no added direct runtime Zod dependency. The HTTP check now verifies real seeded public content and rejects bare Zod imports in emitted server modules, so an empty error/setup response cannot pass merely because it lacks HUD markup. See [Vite's SSR contract](https://vite.dev/config/ssr-options#ssr-noexternal).

## Maintenance capabilities

- `check:upstream`: read-only npm/Node/immutable skill-source comparison, including independent Astro/adapter drift and offline fixtures.
- Both sync helpers: default staging; explicit check/apply/recover; Git blob verification, normalized text/raw binary hashes, ownership manifests, local extra/missing detection, exact reviewed resolutions, retained backups, lock and recovery journal. A killed-child test exercises partial replacement recovery. See [sync runbook](../../docs/skill-synchronization.md).
- The distribution includes emdash-content-modeling. Existing modified mirrors and custom content/migration skills remain byte-for-byte preserved. The EmDash candidate diff was staged and reviewed, not applied over those edits. A site-skill check against the canonical repository correctly reports local drift/unowned content; pending local improvements must be reviewed/published before downstream refreshes.
- Impeccable distribution/hash/license evidence is in `.emdash/impeccable-source.json`; matching LICENSE/PROVENANCE files accompany the distributed skill, and the upstream commit for the bundled curated snapshot remains unverified. Upstream skill files were not rewritten for project policy.
- `site:register`: idempotent private local registry proposal, rename history, explicit archive reactivation and ignored pending-registration artifact when central access is absent. No real client metadata was added. [Registry runbook](../../docs/site-registry.md).
- [Standards manifest](../../standards/manifest.json): versioned candidate with required/advisory checks, exact runtime matrix and pending scopes. There is no stable release/tag for downstream #2 selection yet.

## DESIGN.md and forms decisions

Issue #4's local bridge is implemented: pinned alpha spec/CLI, neutral account-free example, mapped-source drift check and malformed typography/reference fixtures. The wrapper catches unresolved aliases that the pinned linter silently drops. CSS/DTCG exports and mapping document actual color/alias/font/fluid/context losses. It writes no production stylesheet or authored DESIGN.md. External Stitch/OpenDesign exchanges remain explicitly deferred/unverified, as allowed by that issue. See [design-interchange decision](../../docs/design-interchange.md).

[Forms adoption](../../docs/forms-adoption.md) remains opt-in. The actual 0.2.10 package registered and rendered a public form on Node. Validation, storage and failure probes distinguish mocked handlers from actual HTTP/SQLite integration. Unlimited default retention, broad string recovery and success despite notification failure are material differences; existing utilities remain. Live Turnstile/email, full enhanced keyboard/error behavior and Worker delivery are not certified.

## Verification and restore

- 30 unit tests pass on Node 24.21.0 and Node 22.22.0, including the pre-existing schema-budget suite. Typecheck reports 35 files with zero diagnostics on the selected baseline.
- Root build/timings and disposable production GET/HEAD/HUD/dependency-isolation checks pass. [HTTP receipt](http-checks.json) and [timings](build-timings.txt). Existing admin chunk-size warnings remain.
- [Native image receipt](native-image-checks.json): dev and built Node, new storage-backed media after build, responsive candidate dimensions/formats and rejected unauthorized remote source. This run used the tested temporary root, never working uploads.
- Pre-upgrade title save/reload was completed, resolving Phase 1's automation limitation. Upgraded title and canonical rich-text save/reload/publish passed on the same disposable database. The admin dashboard visibly reports EmDash 1.3.0. [Baseline editor](baseline-editor-saved.jpg), [upgraded admin](upgraded-admin.jpg), [upgraded editor](upgraded-editor-published.jpg).
- [Restore receipt](restore-check.json): old installed lock plus pre-upgrade consistent SQLite snapshot recovered original public content and the pre-upgrade draft. No working database was replaced in the rehearsal. Synthetic fixture has no encrypted plugin settings; matching real key/env files are preserved privately in the working-site snapshot.
- [Private snapshot locator](local-snapshot.json) names the ignored recoverable pre-upgrade database/media/key/package snapshot. Stop site processes before restoring the matching set; restore old packages and data together, remove only stopped-database stale sidecars as appropriate, npm ci and rebuild. Package downgrade alone is not database rollback.

CI now names Node 22.22.0 and 24.21.0 and includes maintenance/schema tests. Local Windows results do not claim a completed GitHub/Linux run. No migration/media helper was invoked against remote data. `media:organize` / `media:sync-r2` were not used as tests. Phase 3 still owns pinned Linux captures, controlled visual failures and broad release certification; the full gallery/locale/editor and Worker matrix remains explicit pending work.

The earlier schema-budget implementation was reviewed: it reads actual table_xinfo including generated columns, escapes identifiers and fails over the 50-column budget; its fixtures pass. Missing DB/tables remain unmeasured even though the legacy command exits zero. This candidate records that limitation rather than representing it as D1 certification.

GitHub checklists are updated from observed evidence. Issue #4 can close for its complete local optional bridge; #3 remains open for full certification, stable publication and remaining target/provider evidence. Other issues retain their own uncompleted criteria. All implementation changes remain uncommitted; pre-existing work is separately attributed by the Phase 1 receipt.
