# Regional spacing evaluation 2

Completed the requested local maintenance change in `site/`. No deployment or external application writes were performed. All authored source, acceptance scripts, captures, logs, temporary directories and npm cache for verification are inside this trial directory. No other trial or parent repository evidence was inspected. No delegation was used.

## Actual changes

- `site/src/pages/index.astro`: added only `gap="calc(var(--layout-grid-gap) * 0.75)"` to the existing homepage services `Grid`.
- `site/AGENTS.md`: recorded that narrowly scoped composition decision. The existing Art Direction Record and its core physics remain unchanged.
- `check-spacing.mjs`, `check-styleguide.mjs`, `evidence/`: local acceptance scripts, computed-style receipts, screenshots and check logs. These do not change the site's verification suite or package scripts.

The existing Grid prop sets its private `--grid-gap`, while the public `--layout-grid-gap` continues to resolve through the established fluid spacing scale. Both gap axes scale by 0.75 at every width. Shared CSS, primitives, brand tokens, typography, card radii, content and navigation were not edited. The normal layout consequence is that later content moves upward when stacked service gaps shrink, and service cards can grow slightly wider when columns share the reclaimed gap space.

## Guidance and assumptions

Read the installed README, AGENTS, `baseline.config.json`, package scripts, checked-in `astro-site-design` skill, and the spacing ownership/maintenance guidance in `docs/design-framework.md` and `docs/native-composition.md`. This is an existing `static` profile, not an EmDash site or a new design project. The fixture's existing art direction is authoritative. The user's explicit request authorizes this local 25% reduction; no new visual direction or density assumption was required.

The documented scope table selects a primitive `gap` for one composition. A root alias CLI write would affect every grid, so it was intentionally not used. Global token calibration was audited without reseeding or rewriting it. No CSS scale, breakpoint, parallel configuration store or directory exception was added. The existing art-direction gate passed before implementation and again after recording the decision.

## Verification

- `npm.cmd run check:art-direction -- --require-record`: passed before the edit and after the site decision note.
- `npm.cmd run verify`: passed all installed lint, CSS contract, art-direction and token audits; all **39 tests passed**; Astro check reported **0 errors, 0 warnings, 4 hints**. The hints are unused `Card`/`Grid` imports in the unchanged Services and Contact pages.
- `npm.cmd run build`: passed, producing seven release pages. Its `postbuild` release artifact check passed.
- `npm.cmd run check:dev-tools`: passed. Release output contains no styleguide route, fixture specimens or server entrypoint. The production preview returned 404 for `/_styleguide/`.
- `npm.cmd run fixtures:build`: passed; the isolated fixture build was used solely for styleguide acceptance and was not deployed.
- `git diff --check`: passed. Source changes are restricted to the homepage gap prop and its AGENTS note. No existing tests, checks or thresholds were removed, disabled or weakened.

Before screenshots and computed styles were captured on the unmodified site. After captures were taken from the fresh release build using local Astro preview. Chromium acceptance covered the homepage and About page at 320, 768 and 1440 CSS pixels (1000px viewport height). Screenshots of homepage and About, and styleguide grid/card specimens, were visually inspected at representative narrow and wide widths; the intermediate homepage was also inspected.

| Viewport | Services before, both axes | Services after, both axes | Approach and About, unchanged |
| --- | --- | --- | --- |
| 320px | 20.0006px | 15.0005px | 20.0006px |
| 768px | 27.4675px | 20.6006px | 27.4675px |
| 1440px | 36px | 27px | 36px |

The sub-millipixel differences from exact multiplication are browser serialization rounding. Acceptance asserts a maximum 0.001px discrepancy. Services retain intrinsic one/two/three-column layouts at those widths. No horizontal document overflow was observed. The comparison verifies equal copy, link labels/destinations, fonts, font sizes, line heights, colors, backgrounds, borders, radii and padding for the inspected elements, with only the services row/column gap allowed to change. Approach and About grid columns and card sizes are equal before/after. About screenshots are byte-identical at all three widths. Service links remain focusable with visible card focus outlines.

The isolated styleguide's grid/card specimens keep the original 20.0006/27.4675/36px gap progression at 320/768/1440px. Its checks found no horizontal document overflow. Evidence is in `evidence/before.json`, `evidence/after.json`, `evidence/styleguide.json`, PNG captures, and the named command logs.

## Friction and limits

- The first after-edit capture encountered a Vite HMR navigation while reading computed styles. A clean rerun passed; final after receipts come from production preview, avoiding HMR entirely.
- The installed styleguide URL returned 404 in development, including after a fresh dev restart. The supported fixture build succeeded. Its explicit trailing-slash URL `/_styleguide/` worked; its slashless URL returned 404. No routing/integration code was changed for this unrelated tooling issue.
- Astro typechecking took noticeably longer than the tests and build. It completed successfully; no check was skipped because of duration.
- Verification uses the installed local browser and tooling. It is focused maintenance acceptance, not a claim of exhaustive accessibility conformance.

All owned development, fixture-preview and release-preview server sessions were stopped after acceptance. Production and fixture outputs remain separate. No commit, push or deployment was performed.
