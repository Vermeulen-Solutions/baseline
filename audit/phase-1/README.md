# Phase 1 implementation receipt — 15 October 2026

The first roadmap slice is implemented in the working tree. This is a local implementation receipt, not a standards release or completion of all nine issues. Astro remains 7.3.5 and EmDash remains 1.1.0; dependencies and package-lock.json were not upgraded.

## Delivered

| Scope | Implementation | Remaining issue scope |
| --- | --- | --- |
| #1 | Maintained visual-reference workflow with evidence/capture metadata, contextual CSS decisions and upstream ownership safeguards | Real client/editor acceptance and ongoing upstream review |
| #3 initial slice | Read-only `audit:baseline`, tested missing/drift states, skill hashes and recurring Astro/adapter/Node/EmDash review runbook | Safe sync tooling, live release checker, upgrade rehearsal, forms/registry and release certification |
| #5 first slice | Dev styleguide composing existing primitives, synthetic Portable Text and local authored SVG; coverage/limits manifest | Full edge-case fixtures, CMS-backed fixture, built-server fixture mode and broader accessibility/zoom checks |
| #6 G slice | 10/12 columns measured from a selected Container, actual gap token, resize/scroll/RTL handling and teardown; T/B retained | Screenshot overlay O and proxy inspector P |
| Safety | Isolated dev/build/server HTTP check and CI wiring; production GET/HEAD 404 and no active HUD code | Cloudflare profile certification and Phase 3 visual diff suite |

Astro ignores underscore-prefixed filenames during automatic discovery. The integration explicitly registers `/_styleguide`; the route's compile-time DEV guard provides the normal-build 404. The original review misstated this discovery behavior; assessment and GitHub issue #5 were corrected with preserved before/after receipts. Runtime flags, URL parameters and cookies cannot activate the normally built fixture route.

## Verification

- `node --test tests/*.test.mjs`: 24 passed, including existing schema/editorial utility coverage and the new baseline test.
- `npm run typecheck`: 35 files, zero errors/warnings/hints.
- `npm run build`: passed on the installed Node adapter. Existing EmDash admin bundle size warning remains; no chunk-limit change was made.
- `npm run check:art-direction`: exact infrastructure path/content hashes accepted; no invented client direction or directory exemption.
- `npm run check:dev-tools`: dev 200, seven specimen images available, no synthetic edit identities; built Node GET/HEAD 404 including query/cookie/runtime-flag attempts; active HUD strings absent from emitted client JavaScript. See [HTTP receipt](http-checks.json).
- Browser checks at requested 320/390/768/1440 widths found no horizontal overflow. Selected overlay content bounds matched within 0.02 CSS px. G, 10/12 selection, B comparison, Escape order, typing exclusion and reload reset were exercised; RTL reported correctly. See [browser receipt](browser-checks.json).
- Bounded Impeccable source detection returned no findings; rendered wide/mobile specimens were inspected. This is neutral tooling QA, not a brand-direction approval or WCAG conformance certification.

The new integration was tested after the initial underscore-route 404 was caught. The HTTP helper uses a fresh temporary source/DB/media root and sanitized environment with an ephemeral key, then removes its own copy. It shares installed modules, so it is not an independent dependency installation or an upgrade rehearsal. The browser-only temporary copy needed a Vite filesystem allowlist for those shared modules; this test-copy setting was not added to the starter.

## Pre-upgrade captures and limits

[Capture manifest](captures.json) records bitmap sizes and source hashes. The styleguide full-page captures and grid preview are exploratory Windows browser evidence, not pinned Linux golden baselines. Browser viewport requests are recorded separately from captured bitmap dimensions; the later public/admin run used the actual 1192×1123 CSS viewport and approximately 1.1 device pixel ratio.

- [Wide styleguide](styleguide-wide.jpg), [mobile styleguide](styleguide-mobile.jpg), [grid guide](grid-guide-preview.jpg).
- [Seeded public home](pre-upgrade-public.jpg) and [ready admin dashboard](pre-upgrade-admin.jpg), with only disposable sample content and a development admin.
- [About/editor entry surface](pre-upgrade-editor-entry.jpg): the toolbar was visible, but the automated check action did not activate Edit mode; its checkbox remained false. This is a captured limitation, not successful editor validation. Establish an activated editor baseline and real save/reload receipt before dependency upgrades. No source or authentication workaround was introduced for it.

No Cloudflare/D1/R2 checks, real CMS field saves, provider notifications, dependency upgrades or deployments are certified by these results. The baseline inventory intentionally retains those unverified states.

## Existing work and next handoff

[Pre-existing work hashes](pre-existing-work.json) distinguish the dirty work present before this slice. The previously modified upstream mirrors and custom content/migration skill files were preserved byte-for-byte. Existing schema/editorial changes still require their own release review. Additions to AGENTS.md/package.json preserve that work; no commit or publication was made.

Continue with Phase 2's safe skill synchronization and joint Astro/EmDash evaluation using [the implementation plan](../roadmap-review-2026-10-15/implementation-plan.md) and [meta-review runbook](../../docs/starter-meta-review.md). Resolve the editor-baseline limitation first. Keep issues open against their full acceptance criteria.
