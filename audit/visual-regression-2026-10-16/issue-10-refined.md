# URL-to-Astro playbook: component calibration, open composition and zero-JS logos

## Outcome and evidence

Integrate URL/screenshot migration into the existing staged workflow, using #5's living styleguide to calibrate relevant production primitives before multiplying page templates. Preserve #1's evidence policy and AGENTS' art-direction gate. [Timothy Ricks' supplied reference](https://www.youtube.com/watch?v=Wje2UgNbnTA) is inspiration; video retrieval was unavailable during implementation, so the original supplied breakdown is not independently verified. Original RFC retained in `audit/phase-3/issue-10-original.json`.

Do not promise zero visual debt, perfect responsiveness/SEO, or exclusive ownership of SSR duplication by Astro. Evaluate the resulting implementation and its accessibility instead.

## Stage 4.5: pre-build component quarantine

- Runs after source/content ownership and saved art direction, before broad client page templates or bespoke sections. Scoped neutral starter infrastructure remains an explicit AGENTS exception; client calibration does not bypass the design gate.
- Inspect representative source states and narrow/intermediate/wide placements. Map evidence to actual tokens and APIs: Section labelledBy/spacing; Container reading/content/wide; intrinsic Grid compact/standard/wide; Card stacked/horizontal with required public href.
- Calibrate real modules on `/_styleguide`, not replicas or specimen-only repairs. Add only justified repeated variants. Save `audit/component-calibration.md` with sources/capture metadata, mappings, state/surface coverage, asset provenance, checks, gaps and readiness decisions.
- Resolve material reusable-pattern gaps before page assembly. Real pages may reopen calibration; this is not an unrealistic permanent freeze of every future component. Greenfield work reviews relevant primitives against the brief and records inapplicable source comparisons.
- Keep synthetic fixtures free of fake writable CMS identities and preserve the normal-build 404. Build-time fixture artifacts from #5 are separate and must never be deployed.

## Architecture and action patterns

Use open structural slots and shared gap/padding/flow. The supported composition is `<Section labelledBy="services"><Container width="reading">…</Container></Section>`, not invented variant/Heading/ButtonWrapper APIs. Deliberate semantic composites such as Card, navigation and repeated editorial sections remain valid. Avoid opaque hardcoded page monoliths, redundant containers and per-instance spacing. Keep queries separate from presentation and forward real CMS field attributes to the elements rendering those values.

Document primary solid, secondary ghost/outline and inverted contrast action roles where the brief and supported surfaces require them. Test text/control contrast, focus, hover, active, disabled and applicable loading states per surface; root light/dark switching alone is insufficient. Anchors navigate, buttons act. The neutral starter does not acquire a universal Button component or fabricated dark theme solely to demonstrate this pattern.

## LogoTicker contract

Provide native `src/components/LogoTicker.astro`: render the trusted Astro slot once, repeat the markup server-side through Fragment into equal adjacent lists, and animate with CSS. No component script, hydration directive or carousel dependency.

- Slot contains noninteractive, ID-free li content only. No raw scraped/CMS HTML, links, controls, SVG IDs, scripts/islands or edit proxies. This is a caller contract, not an HTML sanitizer. Use static PartnersPanel/unduplicated lists for linked/editor-owned logos.
- Unique component ID and localized region/control labels; preserve native artwork dimensions. Hidden duplicate is aria-hidden and inert.
- Optional animation with persistent native checkbox stop control for keyboard/touch. Hover/focus pauses; reduced motion/print show one complete wrapped list. Static mode is the default.
- Cover empty/single/many, narrow/wide short tracks, RTL and no-JS behavior. Check seam geometry and accessibility; zero hydration does not mean zero rendering/GPU cost.

## Asset and handoff boundaries

Downloaded site imagery goes to src/assets or EmDash Media Library; never download site content imagery directly to public. Record provenance and native dimensions, then use Astro Image/Picture/getImage or the CMS storage-backed delivery path. `src/assets` alone does not guarantee processing, and public/remote URLs can be explicitly processed with the correct dimensions/service. Reserve public for documented unchanged-URL passthrough files such as favicon/robots/licensed fonts; do not break existing URLs through an unscoped move.

Put canonical policy in AGENTS and maintained astro-site-design guidance; `.agent/rules/astro-composition.md` is a bridge for harnesses that load it, not universal enforcement. Use concise written handoffs between calibration, assembly and motion. Do not automatically fork/archive chats or add Lenis/sliders.

## Acceptance

- [x] Implementation plan includes #10 in Phase 1/2 component work and the dependency path to #5/#7 and migration remediation.
- [x] new-site-workflow defines Stage 4.5, its evidence artifact, gate, iterative reopening and canonical art-direction prerequisite.
- [x] AGENTS, .agent/rules and maintained astro-site-design document open composition, semantic composite exceptions and src/assets/CMS asset boundary.
- [x] Maintained astro-site-design documents surface-aware primary/secondary/inverted actions without inventing unsupported APIs.
- [x] Native LogoTicker and deterministic animated/static/RTL/empty specimens exist with no component JS, hidden inert duplicate and native stop/reduced-motion behavior.
- [x] Actual built-server, narrow/wide, keyboard, reduced-motion and duplicate seam checks pass; production exclusion and appropriate repository checks remain healthy.

## Dependencies and delivery

Depends on #1 evidence policy and #5 component surface; #4 interchange is optional. Implement ticker before #7 goldens. #9 remains the later CMS ingestion option, not a blocker to local src/assets. #10 is reusable starter code/playbook work, not an actual client migration or permission to reuse third-party assets. Current changes are local/uncommitted; no production deployment, release tag or client conversion is implied.


## Implementation and remaining acceptance (2026-10-15)

Code/guidance and Phase 1/2 placement are implemented. All 31 tests, typecheck, normal build/profile guard and disposable built-server checks pass. Browser checks show no overflow/duplicate IDs at 320/390/768/1440; real reduced-motion list fallback and native control keyboard behavior pass. The available browser uses reduced motion and cannot verify active ticker motion; non-reduced pause/seam geometry and no-JS browser checks remain for #7. This issue remains open against the last verification criterion. Evidence: audit/phase-3/README.md, http-checks.json, browser-checks.json and screenshots. Changes are local/uncommitted; no deployment.


## Final local verification — 16 October 2026

Issue #7 now supplies pinned Windows/Chromium captures against a freshly seeded isolated built Node server. Three comparison repetitions passed: 153 tests, 54 intentional redundant-viewport skips, zero failures/flaky results; all 51 golden hashes stayed unchanged. Native keyboard/lightbox/focus behavior, active motion/stop/resume/hover/focus, reduced-motion/print, no-JS document-script controls, 320px text spacing and actual browser zoom 200%/400% pass. The effective zoom viewports are 640/320 CSS pixels at DPR 2/4, with no document overflow. RTL/LTR tracks cover the viewport and retain visible logo content at start/mid/end, with seams below 1px.

The harness exposed and corrected actual justified-gallery caption clipping and an RTL animation specificity bug; reviewed captures and stronger geometry assertions cover them. A screenshot-only content-visibility override renders offscreen gallery content without masking it or patching layout. Ordinary screenshot allowance remains zero changed pixels.

Fast Node 22.22.0 CI command rehearsal passed 33 unit tests, lint/schema/design checks and normal build/release guard in 14.701 seconds (excluding Actions setup/install/network). Typecheck: 37 files, zero errors/warnings/hints. Production GET/HEAD styleguide exclusion and fixture release rejection pass. Failure/abort cleanup and Windows cancellation relay checks pass.

Evidence: audit/visual-regression-2026-10-16/README.md and its JSON/native capture receipts; runbook: docs/visual-regression.md. Changes remain uncommitted as explicitly requested. No deployment, stable standards tag, Worker/D1/R2 certification or CMS editor/save conformance is implied. Browser keyboard acceptance uses actual automated key events with reviewed captures; screen-reader/WCAG certification is separate.
