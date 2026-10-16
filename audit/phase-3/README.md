# Issue #10 integration and next styleguide package

Implemented locally on 15 October 2026, Node 24.21.0 / Astro 7.4.0 / EmDash 1.3.0. Work remains uncommitted; no deployment or stable release is implied. Existing unrelated source changes and upstream mirrors were preserved.

## Delivered

- Integrated #10 into Phase 1/2 component work and the #5 → #7 capture dependency. Added Stage 4.5 component quarantine after content/art direction and before broad client pages, with `audit/component-calibration.md` evidence/readiness and iterative reopening. No fabricated client calibration/art-direction record was created for neutral starter maintenance.
- Canonical AGENTS, maintained astro-site-design reference and `.agent/rules/astro-composition.md` define open structural slots, deliberate semantic composites, actual APIs, surface-aware actions and src/assets/CMS asset ownership. Harness-specific rules are guidance bridges, not universal pre-write enforcement.
- Added native LogoTicker: trusted noninteractive ID-free li slot rendered once and duplicated through Fragment, no component script/island; static default, native checkbox motion toggle, hover/focus pause, hidden inert duplicate, reduced-motion/print wrapped list. Linked/editor-owned logos use an unduplicated component. Native labels/dimensions remain caller responsibilities.
- Proceeded with Phase 3 package 1: versioned real-component styleguide fixtures, actual primitive variants, small/portrait assets, missing/empty content, PT links/marks/code/native table, and ticker states. CMSPartnersPanel and actual table-editor save checks remain explicitly outside static specimen coverage.
- Explicit build-only ASTRO_TEST_FIXTURES=1 profile emits dist-fixtures/. Normal dist remains isolated. Build markers and release/start checks reject fixture/unknown profiles, including the stale-clean-dist environment trap. CI includes this failure-contract test; no deployment workflow was invented.

## Verification

- All 31 Node tests pass; `npm run typecheck` reports 37 files, zero errors/warnings/hints. Art-direction gate passes exact reviewed LF/hash infrastructure exceptions. Normal build/postbuild passes. Existing admin chunk-size advisory remains; no new build failure.
- `npm run check:dev-tools` exercises fresh disposable dev setup, local assets, built fixture 200/no HUD/no fake editing identities, fixture release rejection, then separate clean built Node GET/HEAD 404 with attempted runtime/query/cookie bypass and healthy seeded public 200. Scans retain dependency-local Zod bundling and no functional HUD client code. See [HTTP receipt](http-checks.json).
- Browser inspected the actual isolated built Node fixture server at 320/390/768/1440 CSS pixels. No document horizontal overflow or duplicate IDs; at 320px only code/table wrappers intentionally scroll. Native select/checkbox/radio keys and error-summary focus work, with a visible input focus outline. See [browser receipt](browser-checks.json) and screenshots.
- The browser reports prefers-reduced-motion: reduce. Both ticker instances show a complete wrapped first list; duplicate and motion control are hidden and no animation is computed. Empty ticker is omitted. This verifies the real reduced-motion path, not active animation.
- Active non-reduced animation/pause/seam geometry, JavaScript-disabled browser mode, actual browser zoom/text-spacing overrides and other engines remain unverified. Browser zoom keyboard input did not change viewport/DPR, so no zoom claim is made. These remain tracked in #5/#7/#10; issues #5/#10 remain open rather than treating implementation alone as complete acceptance. #4 stays closed from Phase 2.

## Review corrections and limits

The first checks caught two invalid Card specimens missing required href, then the SSR build-hook client/outDir distinction for marker placement. Both were corrected and successful checks repeated. The inspector hold mode now stops the normal server before starting the fixture server and verifies a 200, preventing inspection of the wrong profile. Tool interruption of an inspection server can bypass cleanup; the owned inspection tree is separately verified/removed at handoff.

The original video could not be fetched (YouTube throttled); its supplied notes remain attributed inspiration, not a verified transcript. Astro APIs were checked via actual Astro Docs MCP queries for [slots/Fragment](https://docs.astro.build/en/reference/astro-syntax/#fragments) and [integration build/config hooks](https://docs.astro.build/en/reference/integrations-reference/#astrobuilddone). EmDash Docs MCP confirmed [native PT rendering](https://docs.emdashcms.com/guides/querying-content/); installed EmDash 1.3 table/code types were inspected before constructing fixtures. No upstream skill mirror was patched.

Next package: #7 pinned Linux visual capture/bootstrap and sensitivity checks, including the pending active-motion/no-JS/zoom states. Cloudflare/D1/R2 runtime certification remains separate.


## Superseding package 2 receipt — 16 October 2026

The maintainer replaced the Linux/browser-CI proposal with authoritative local Windows verification. #7 now resolves active motion, no-JS and actual zoom/text-spacing acceptance for #5/#10; see [final package receipt](../visual-regression-2026-10-16/README.md). Three comparison repetitions pass; source/caption/RTL corrections and strict screenshot tolerances are documented there. Cloudflare and real editor certification remain separate, and all source changes remain uncommitted.
