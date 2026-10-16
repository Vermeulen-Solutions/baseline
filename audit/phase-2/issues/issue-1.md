# Visual-first implementation workflow and upstream skill safeguards

## Outcome and review decision
Make screenshot/reference-to-Astro work reproducible without replacing this starter's Tailwind v4 token system, semantic Astro primitives, or EmDash editorial contracts. Extend existing specialist guidance; do not introduce another overlapping design skill.

Reviewed 2026-10-15 against checkout 7be19d1 plus the pre-existing local editorial/schema work. The installed baseline is Astro 7.3.5 / EmDash 1.1.0 / Tailwind 4.3.3, Node adapter and ./data.db. Astro 5 is a legacy downstream audit case, not a supported target implied by this issue.

## Corrections to the original RFC
- Keep Lumos as a methodological reference, not a dependency. Its docs describe an independent Astro framework; mandatory Stacki coupling or inherent EmDash incompatibility has not been demonstrated. Retaining our stack is a maintenance decision, not proof other frameworks cannot work.
- The video observations are supplied review notes, not independently verified transcript evidence. Timestamp any claims retained as direct observations.
- AGENTS.md is the canonical project instruction bridge. .agent/rules/ is harness-specific and cannot be described as universally loaded or enforced.
- Impeccable 4.3.1 supports construction as well as critique/documentation. Project workflow assigns responsibilities without misdescribing upstream capabilities.
- CSS 1fr, br, fixed values and raster images are not categorically defects. Identify the contextual failure and test it.

## Technical contract
1. Add references/visual-mockup-workflow.md under the Vermeulen-maintained astro-site-design skill. Route to it from new-site-workflow and a concise AGENTS.md rule. site-art-direction retains ownership of the direction and saved Art Direction Record; astro-site-design owns translation/implementation; Impeccable remains upstream-owned.
2. Evidence preflight records source URL/file, capture date, CSS viewport, device pixel ratio, page/state/locale, full-page versus viewport, fonts/assets and provenance. Separate measured, inferred and unknown facts. A flat screenshot does not reveal mobile behavior, interactions, content ownership or exact font metrics.
3. Translate color to existing semantic roles, including on-action/focus/status where applicable. Map Tailwind @theme namespaces separately from ordinary custom properties. Preserve clamp()/vi expressions and supported font weights; do not sample a fluid value at one viewport and bake it into source.
4. Infer container/gutter/grid rules, then test narrow and intermediate widths, long unbroken strings, real/translated headings, missing imagery, zoom/reflow and supported surface treatments. Use minmax(0, 1fr) and min-width: 0 where intrinsic sizing requires them. Use semantic breaks only where content warrants them; do not rewrite editorial copy to satisfy an arbitrary word budget.
5. Keep meaningful text as HTML and scalable icons as suitable SVG/currentColor assets. Preserve multicolor logos and legitimate photographic raster assets. Font trimming is progressive enhancement with feature detection and clipping/fallback checks, not a mandatory font fix.
6. Interaction recipes require source/license/provenance, keyboard/focus/touch/reduced-motion behavior and a performance rationale. Prefer CSS when sufficient; do not require every interaction to be CSS-only or add smooth scrolling by default.
7. Preserve CMS identity, field-level edit attributes on the exact stored value, canonical Portable Text metadata, cache hints when caching is enabled, and native row-per-locale ownership. Proxy annotations require actual save/reload acceptance on a supported disposable editor surface.
8. Calibrate using source-style comparison in TweaksBar; merge reviewed CSS exports and reload cleanly. Layout changes remain in source.

## Skill ownership and distribution
Do not edit impeccable or the three EmDash mirrors for project policy. Keep project overlays in maintained skills/AGENTS.md/references. Record upstream source/version/license and local modifications before sync. #3 owns implementing staged sync, local-drift detection and distribution manifests, including the currently omitted emdash-content-modeling skill; this issue defines the policy and guidance.

## Acceptance criteria
- [ ] Reference and routing changes demonstrate one flat-screenshot case and one source-site redesign, with preserve/refine/overhaul decisions and explicit unknowns.
- [ ] Review examples cover semantic br, valid 1fr, a multicolor logo and localized long copy so guidance avoids blanket rewrites.
- [x] Saved Art Direction Record and existing check:art-direction gate remain authoritative; no fabricated client direction or directory-wide exception.
- [ ] Before/after evidence includes mobile, intermediate and wide widths plus a clean reload without HUD overrides.
- [x] Public rendering and actual editor save/reload are separately recorded for CMS-owned fields.
- [x] Upstream skill content is unchanged by this implementation; project rules remain discoverable after a staged upstream refresh.
- [x] Documentation distinguishes advisory instructions, CI outcome checks and actual runner enforcement.

## Dependencies and boundaries
Can start immediately. #4 defines optional DESIGN.md mapping; #5/#6/#7 implement verification surfaces, not prerequisites for writing this reference. No framework swap, blanket motion retrofit, invented copy, or harness installation.

## Sources
[Lumos docs](https://lumosframework.com/docs/) · [reference video, supplied notes require verification](https://www.youtube.com/watch?v=z2-WESZxSgM) · existing AGENTS.md and astro-site-design/site-art-direction/new-site-workflow skills.

## Implementation progress — Phase 2 (2026-10-15)

Maintained reference/routing and upstream-ownership guidance are implemented. Phase 1 responsive/HUD evidence remains separate from Phase 2 public/title/canonical rich-text save/reload/publish evidence. Existing modified mirrors were preserved and an immutable upstream diff staged. This issue remains open for the remaining complete reference-translation/before-and-after acceptance scope; no client conversion is implied.

Local implementation/evidence: audit/phase-2/README.md, runtime receipts, tests and standards/manifest.json. Changes are uncommitted; no production deployment or stable release is implied.
