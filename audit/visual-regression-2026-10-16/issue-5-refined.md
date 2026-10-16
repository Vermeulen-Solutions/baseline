# Living styleguide with shared deterministic fixtures and production isolation

## Outcome and baseline correction
Add /_styleguide as a local verification surface that composes real starter components and styles. It demonstrates their existing API; it is not another source of design truth.

Current APIs differ from the draft: Grid is intrinsic with compact/standard/wide minimums; Card supports stacked/horizontal layout, not default/bordered/elevated variants. CSS uses semantic tokens and data-surface treatment; theme-light/theme-dark/theme-brand are not an established three-theme API. Do not invent variants or themes solely for this page.

## Runtime contract shared with #7
- Astro ignores underscore-prefixed page files during automatic route discovery. Explicitly register src/pages/_styleguide.astro at /_styleguide with an Astro integration (injectRoute); the registered route renders during astro dev. In a normal production build it returns a real 404 before rendering specimens or querying CMS, with no specimen markup/HUD or navigation/sitemap links. noindex is defense in depth, not access control. The underscore filename exclusion is not the runtime security contract for an explicitly registered route; enforce the production guard and test the actual URL.
- If #7 needs built-server specimens, implement an explicit build-time test-fixture mode (proposed ASTRO_TEST_FIXTURES=1, exact name to be agreed with #7). It is enabled only for loopback test builds, defaults off, is not PUBLIC_* or a URL/cookie switch, and is never deployed. Test output is separated from or replaced by a clean normal build; the release/deployment job must not reuse a fixture-enabled artifact.
- Runtime environment toggles cannot activate specimens in a normally built artifact. Verify behavior on the actual Node server and a disposable Cloudflare-compatible build when that target is certified.
- Build-time DEV checks alone do not guarantee processed Astro scripts are removed. Verify emitted/served resources; #6 owns the HUD's corresponding guard.
- Share a fixture module/manifest with #7. Use synthetic, versioned entries/assets without production data, network font providers, writable form endpoints or third-party embeds.

## Specimen contract
1. Typography: existing text-step--1 through text-step-2, semantic h1–h6 demonstrations in a coherent document outline, supported font faces/weights, long headings, 68ch reading measure and zoom/reflow stress. Metric outlines are optional diagnostics, never required trimming.
2. Palette: actual page/surface/text/muted/border/action/on-action/focus roles and available data-surface treatments. Distinguish a surface example from a complete light/dark theme. Do not claim computed swatches prove contrast over every background.
3. Controls: existing link/button classes and native form controls, keyboard focus, disabled and FormError states. Show loading/other variants only if implemented. Forms cannot submit or send notifications from fixtures.
4. Layout/components: Section, Container, intrinsic Grid, real Card layouts/slots, PartnersPanel, CMSPartnersPanel where a deterministic CMS fixture is available, ResponsiveImage, EditorialImage, RichText and PhotoGallery. Include narrow placement, long names, empty/missing media, unusual ratios, captions, small native images and ordered gallery items.
5. Portable Text: canonical valid fixtures rendered through the production RichText/.flow path, not hand-authored HTML masquerading as CMS output. Cover supported headings/lists/quotes/links/code/images/gallery and only supported tables/embeds; record unsupported renderers instead of inventing them.
6. Testable anchors/readiness markers for sections and assets, without fixture CSS that patches production components to look correct.
7. Public specimens do not prove editor support. Use a separate disposable EmDash entry for actual field/proxy save/reload validation; never attach fake writable entry IDs to static fixtures.

## Acceptance criteria
- [x] Dev GET /_styleguide returns 200; default production GET and HEAD return 404 with no specimen content. Query parameters/cookies/runtime env changes cannot bypass normal-build exclusion.
- [x] Fixture-enabled loopback build renders the same production component modules; clean release build is verified separately.
- [x] Coverage manifest lists every existing public primitive, real variants, edge cases and intentionally unsupported examples.
- [x] Fonts/images are local deterministic assets with provenance and native dimensions; all image requests succeed.
- [x] Browser keyboard interactions with reviewed captures, 320px/narrow, 390px, 768px, 1440px and zoom/reflow checks show usable controls and no unintended horizontal overflow; intentionally scrollable content is identified.
- [x] Document actual surface behavior and field/editor verification limits in README/AGENTS.md.
- [x] Neutral infrastructure maintenance follows the exact file/hash design-gate exception review; no directory exemption or invented client Art Direction Record.
- [x] Existing appropriate tests, typecheck/build and production exposure check pass.

## Dependencies and boundaries
Start after #1's fixture/implementation guidance is agreed. Does not require #4, an EmDash upgrade or #6. #7 consumes this fixture contract; it must not rely on an ordinarily production-hidden route becoming public.

## Implementation progress — Phase 2 (2026-10-15)

Phase 1 minimal styleguide is retained and tested on the upgraded Node runtime. Explicit injectRoute registration is required for the underscore filename. Dev specimens/assets succeed; normal production GET/HEAD remains 404 even with runtime/query/cookie flags. Production public content is now also asserted healthy. Full edge-case/CMS fixtures, build-time fixture mode and remaining zoom/accessibility acceptance stay open for Phase 3.

Local implementation/evidence: audit/phase-2/README.md, runtime receipts, tests and standards/manifest.json. Changes are uncommitted; no production deployment or stable release is implied.


## Phase 3 package 1 implementation (2026-10-15)

Explicit ASTRO_TEST_FIXTURES=1 build profile emits dist-fixtures with no HUD; normal dist remains excluded even with runtime flags/query/cookies. Build/start release-profile checks reject fixtures, missing/unknown markers and the stale clean-dist environment trap. Actual disposable built-server checks pass. Version 2 covers actual Section/Container/Grid/Card variants, native controls, small/portrait/missing media, empty states, PT links/marks/code/native table and #10 LogoTicker motion/static/RTL/empty specimens. CMSPartnersPanel remains explicitly deferred without fabricated CMS identities; real editor/table-placeholder saving is separate.

Browser: no document overflow or duplicate IDs at 320/390/768/1440; native select/checkbox/radio keyboard behavior and error-summary focus pass. Actual reduced-motion path shows one complete wrapped logo list. Zoom keyboard input did not change browser viewport/DPR, so zoom/text-spacing verification remains open; active ticker animation/no-JS browser states follow #7/#10. This issue stays open against the remaining manual acceptance.

Evidence and limits: audit/phase-3/README.md, http-checks.json, browser-checks.json and screenshots. Local/uncommitted implementation; no deployment or stable release.


## Final local verification — 16 October 2026

Issue #7 now supplies pinned Windows/Chromium captures against a freshly seeded isolated built Node server. Three comparison repetitions passed: 153 tests, 54 intentional redundant-viewport skips, zero failures/flaky results; all 51 golden hashes stayed unchanged. Native keyboard/lightbox/focus behavior, active motion/stop/resume/hover/focus, reduced-motion/print, no-JS document-script controls, 320px text spacing and actual browser zoom 200%/400% pass. The effective zoom viewports are 640/320 CSS pixels at DPR 2/4, with no document overflow. RTL/LTR tracks cover the viewport and retain visible logo content at start/mid/end, with seams below 1px.

The harness exposed and corrected actual justified-gallery caption clipping and an RTL animation specificity bug; reviewed captures and stronger geometry assertions cover them. A screenshot-only content-visibility override renders offscreen gallery content without masking it or patching layout. Ordinary screenshot allowance remains zero changed pixels.

Fast Node 22.22.0 CI command rehearsal passed 33 unit tests, lint/schema/design checks and normal build/release guard in 14.701 seconds (excluding Actions setup/install/network). Typecheck: 37 files, zero errors/warnings/hints. Production GET/HEAD styleguide exclusion and fixture release rejection pass. Failure/abort cleanup and Windows cancellation relay checks pass.

Evidence: audit/visual-regression-2026-10-16/README.md and its JSON/native capture receipts; runbook: docs/visual-regression.md. Changes remain uncommitted as explicitly requested. No deployment, stable standards tag, Worker/D1/R2 certification or CMS editor/save conformance is implied. Browser keyboard acceptance uses actual automated key events with reviewed captures; screen-reader/WCAG certification is separate.
