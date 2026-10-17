# Visual references to maintainable Astro

Read when translating a screenshot, generative concept (`designmd.ai`, Stitch, OpenDesign, Claude Design), source site, UX flow teardown (Nicelydone, Refero), or external component/interaction recipe (`21st.dev MCP`). Keep the existing `AGENTS.md` art-direction gate and specialist sequence. This reference is project-owned; do not patch Impeccable or EmDash mirrors to add these rules.

## Evidence before implementation

Record source URL/file, date, route/archetype, locale, interaction state, CSS viewport, DPR, and full-page versus viewport capture. Separate measured facts, inferred rules and unknowns. A flat screenshot cannot establish mobile behavior, exact fonts, editorial ownership, hidden content or interaction semantics. Inspect real content and assets when available; verify provenance and usage rights.

For a migration classify preserve/refine/overhaul using the existing migration audit and content-candidate register. For a flat mockup or generative prototype capture missing responsive/interaction assumptions explicitly. Do not invent factual copy or shrink an editorial heading merely to match a line break. Additional concept work belongs under `audit/visual-concepts/` until the direction is recorded.

## Translation order

1. Identify actual fonts, legally available files, supported weights, line height and reading measure. Metric trimming is optional progressive enhancement; check clipping and the unsupported fallback.
2. Map colors to semantic roles: page, surface, text, muted, border, action, on-action, focus and applicable status roles. Tailwind `@theme` namespaces and ordinary custom-property aliases serve different purposes. Preserve fluid `clamp()/vi/calc()` expressions; a computed value at one width is not the source token.
3. Establish container bounds, gutters, intrinsic grids and responsive composition. Use `minmax(0, 1fr)` and `min-width: 0` where intrinsic minimums cause overflow. A valid intrinsic auto-fit grid with `1fr` is not an error. Inspect narrow placement, intermediate widths, long strings, zoom/reflow and translated copy.
4. Compose existing `Section`/`Container`/`Grid`/`Card` APIs. Reuse structures where they match content; allow meaningful differences across archetypes and vary section pacing so consecutive sections do not repeat the same layout. Do not wrap every native element or invent new variants merely to fill a specimen page.
5. Keep meaningful text as HTML. A poetry/address break may warrant `br`; a forced heading wrap usually warrants measure/layout work. Preserve multicolor vector logos; use `currentColor` where the artwork's semantics permit it. Photographs and other raster assets remain appropriate raster assets.
6. Bind CMS identity and each field's edit attributes to the exact stored value, including CTA text spans. Preserve canonical Portable Text in edit mode. Public markup, registered/populated fields and editor save/reload are separate acceptance checks. UI dictionary text and tracked fallbacks need not pretend to be editable fields.
7. Use native image delivery, original dimensions/captions and cache hints for all queries when caching is enabled. Layout quality does not excuse missing content or broken editor behavior.

## Borrowing components and interactions (`21st.dev` & external registries)

Record component/recipe source, license, and behavior. Route external component blueprints (such as React/Tailwind snippets from `21st.dev MCP`) through `references/component-quarantine.md` on `/_styleguide`: strip unnecessary React/Framer Motion runtime down to zero-JS Astro, replace hardcoded Tailwind palette classes with semantic tokens, and bind fluid typographic/spacing steps. Prefer CSS where sufficient, but do not promise CSS-only implementation for behavior needing JavaScript. Test keyboard/focus/touch, reduced motion and performance. Do not install smooth scrolling or magnetic effects as a default modernization step.

## Verification and handoff

Use `/_styleguide` in development and `npm run design:tokens` for component/token calibration, then inspect representative real routes across mobile, intermediate, and wide viewports. Record each capture's metadata and verify WCAG contrast and fluid `clamp()` bounds via `npm run test:design`.

Example: a supplied 1440px screenshot establishes an image/text composition and visible hierarchy, not a 12-column mobile layout. Record the guessed stacking rule, implement with actual content, then test 320/390/768/1440px and a long title. Example: a dated WordPress source establishes URLs, content and recognizable assets; a refine/overhaul decision can improve composition while retaining those facts. Do not call either example faithful or editor-ready without rendered evidence and actual supported editor tests.

`AGENTS.md` is the project bridge. Harness-specific rule folders are optional adapters, not universal enforcement. CI validates outcomes, not chronology or quality. Preserve upstream skill provenance; review/stage dirty mirrors before synchronization. #3 owns safe sync tooling and required skill distribution.

The canonical starter includes a [neutral rendered workflow replay](../../../../audit/visual-concepts/reference-workflow/README.md): a flat reference and a fixed-width source refinement, with 390/768/1440 captures, semantic address breaks, a valid bounded `1fr` grid, preserved multicolor SVG and complete localized long copy. These are constructed workflow examples, not client migration/editor certification. Retain their evidence bounds when using them as teaching material.
