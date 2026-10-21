# Regional spacing change

## Scope and implementation
Only `site/src/pages/index.astro` changed: the homepage `services-grid` receives `gap="calc(var(--layout-grid-gap) * 0.75)"` through the existing Grid primitive. It scales both axes from the inherited shared responsive spacing alias. No root tokens, shared primitives, other homepage sections, About grid, brand, typography, radii, copy, links, or checks changed. Grid widths naturally gain the space released by smaller gaps; later content moves upward when fewer gap pixels are needed.

Read the installed static profile, AGENTS.md, README, spacing documentation, Astro design and Impeccable guidance. Existing Art Direction Record passed the pre-write gate. Impeccable context permits this narrow incumbent refinement without PRODUCT.md. The explicit single-session/no-delegation instruction was followed; layout assessments were performed in this session.

## Commands and results
- `npm.cmd run check:art-direction -- --require-record`: passed before editing.
- `npm.cmd run design:tokens -- --set '--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.75)' --json`: preview passed. Reviewed only; deliberately not written because root scope would affect all grids. The same proportional operation was applied through the single Grid gap prop.
- `node ../capture.mjs before` and `node ../capture.mjs after`: passed. Chromium at 320x1000, 768x1000 and 1440x1000, homepage, About and development styleguide. Before/after computed styles, text and link inventories compared. Both row and column gaps are 75% of baseline (0.01px tolerance); approach/About grids unchanged; no horizontal overflow. Keyboard Tab reaches links.
- `impeccable.cmd detect --json src/pages/index.astro`: passed, zero findings (`impeccable-detect.json`).
- `npm.cmd run verify`: passed, including existing lint/CSS/art direction/token audits/tests/typecheck. Typecheck: 0 errors, 0 warnings, 4 existing unused-import hints in contact/services. See `verify.log`.
- `npm.cmd run build`: passed, 7 production pages and optimized images; postbuild release check passed. See `build.log`.
- `npm.cmd run check:dev-tools`: passed; production excludes styleguide/fixture/server artifacts. See `check-dev-tools.log`.
- `git diff --check`: passed.

## Measured gaps
| Viewport | Services before | Services after | Approach and About |
| --- | --- | --- | --- |
| 320px | 20.0006px | 15.0005px | 20.0006px unchanged |
| 768px | 27.4675px | 20.6006px | 27.4675px unchanged |
| 1440px | 36px | 27px | 36px unchanged |

## Screenshots and visual acceptance
Absolute screenshot directory: `C:/dev/baseline-task-evals-20261021-cde21c0d/regional-spacing-1/screenshots/`.

Before and after full-page screenshots exist as `{before,after}-{home,about,styleguide}-{320,768,1440}.png` (18 images). Representative inspected captures:
- `screenshots/before-home-320.png`
- `screenshots/before-home-1440.png`
- `screenshots/after-home-320.png`
- `screenshots/after-home-768.png`
- `screenshots/after-home-1440.png`
- `screenshots/after-about-320.png`
- `screenshots/after-about-1440.png`

Narrow services remain a readable single column, intermediate services retain two columns, wide services retain three columns. The reading order and established editorial appearance remain intact. Automated equality checks cover all collected unaffected element styles, content and links; screenshot review corroborates the scoped result. `before-measurements.json`, `after-measurements.json`, and `capture.mjs` preserve the local comparison procedure/evidence.

## Assumptions, limitations and clarification
“25 percent tighter” means multiplying the existing row and column gaps by 0.75 at every width. No clarification needed. Verification is local Chromium and static checks; it is not an exhaustive cross-browser/accessibility audit. Screenshots use the development server to include the required styleguide; the separate production build/isolation check passed. No deployment or external writes. No tests were removed, disabled, weakened, or changed. No broader redesign/context-documentation work was needed; optional Impeccable context setup can be considered separately if desired.

The sole local server used port 4511 and was stopped before handoff.
