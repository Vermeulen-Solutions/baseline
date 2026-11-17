# Design-system iteration (2026-11-17)

Implementation report for the owner's review. Scope: the spacing changes approved on 2026-11-17 (section joins, a medium section size, a relative empty-band audit and the documented convention) and every recommendation of that day's read-only design-system audit. All work is on branch `dev/design-system-iteration-3d7877`; nothing is pushed, merged, tagged, published or deployed.

## Commits

| Commit | Scope |
| --- | --- |
| `c34576c` | A.1–A.4: same-ground section joins, medium section size, relative `empty-band`, convention docs |
| `1c369d4` | B.2, B.3, B.4, B.7: fluid space scale, type steps 3–5 and heading map, 2.5× resize-text rule, layering/motion/breakpoint tokens |
| `b44708d` | B.5, B.6: container-query Card, Grid slot containers, token-typed `gap` props |
| `54c55be` | B.1: advisory token guardrails in `check:css`; strict theme for new client sites |
| `74d174a` | B.8: `design:tokens --format dtcg` |
| `77035fc` | B.8: CSS scroll-driven reveal by default, opt-in registry aliases, optional recipes marked |
| (last) | Release notes, gate reasons, renewed visual references and this report |

## Per item

### A.1 Same-ground section join

- **What:** two sections on the same ground share one section step: the second drops its start padding. A ground change (`data-surface`, `data-ground`, a `bg-*`/`surface-*` class, an inline background or an `.is-bg` child) keeps both paddings; two `data-surface="dark"` (or `light`) sections in a row join. `data-join="separate"` keeps a join at full padding.
- **Versioning decision:** the rule is gated on a new root attribute, `data-section-joins="shared"`, written by `SiteShell sectionJoins="shared"`. Neither the `legacy` nor the versioned `automatic-v2` policy changes without it, so no existing site shifts on update. The starter `Base.astro`, the static profile's Base, the styleguide and the primitives fixture opt in, so new sites get it.
- **Files:** `src/styles/global.css`, `src/layouts/SiteShell.astro`, `src/layouts/Base.astro`, `profiles/static/project/src/layouts/Base.astro`, `src/components/dev/Styleguide.astro`, `src/dev/PrimitivesFixture.astro`.
- **Effect on existing sites:** none until they add `sectionJoins="shared"` to their Base.
- **Limit:** CSS cannot see a background painted by a scoped style, nor compare two `data-ground` values. A section that paints its own ground that way must carry `data-ground`; two adjacent sections with the same custom ground keep both paddings.

### A.2 Medium section size

- **What:** `--spacing-section-m` (32px → 96px, equal to the scale pair `l-2xl`), `<Section spacing="medium">` / `data-spacing="medium"` in both policies, with a fallback to the full step where the token is missing.
- **Naming:** the section ladder is `none` → `content` → `medium` → `section` (full). The primitive scale uses its own t-shirt steps (`--spacing-s`, `--spacing-m` …); the medium section is `--spacing-section-m`, as the brief suggested.
- **Files:** `global.css`, `src/components/Section.astro`, `scripts/design-system.mjs` (optional token list, generator).
- **Effect on existing sites:** additive.

### A.3 Relative `empty-band`

- **What:** the limit is 1.5 × the page's own resolved `--spacing-section` (measured in the page), 160px on a page without that token; `--band <px>` stays a fixed override. A same-ground join of one step passes; two stacked steps fail.
- **Files:** `scripts/audit-ui.mjs`, `tests/audit-ui.test.mjs`.

### A.4 Convention docs

`docs/design-framework.md` (new "Section rhythm: one fluid step, set once"), `docs/site-standards-audit.md` (Delivery rules → Section rhythm), `docs/baseline-updates.md`, and the `astro-site-design` skill (`SKILL.md`, `fluid-tokens.md`, `astro-primitives.md`, `rollout-verification.md`): one fluid section step set once (Bricks fluid-spacing model), same-ground joins pay one step, `data-spacing` exceptions, contextual spacing only for content inside text.

### B.1 Guardrails

- **(a) Advisory check:** `npm run check:css` now prints token guardrails: default palette, type size, radius and shadow utilities, numeric spacing, arbitrary values and registry alias classes in markup; raw `gap` props; raw colour, ≥1rem spacing and numeric `z-index` in author CSS outside custom-property definitions and `@theme`. Exemptions: a `token-exempt: <reason>` comment. `--guardrails` lists all, `--strict-guardrails` fails. The starter reports 8 advisories (1rem control paddings); two deliberate fixed colours (partner logo backplate, gallery caption scrim) carry exemptions. Implemented inside the shipped `css-contracts.mjs`, so sync stays bounded.
- **(b) Strict theme for new sites:** `design:tokens --init-client` prepends `--color-*`, `--text-*`, `--radius-*` and `--shadow-*: initial` to `@theme`; `--strict-theme` applies it on request. A trial build with it applied passed.
- **Deviation:** the brief asked for the reset "in the generated profile". I first applied it in `init:profile`, but `tests/baseline-sync.test.mjs` showed the consequence: the generated `global.css` then differs from upstream, so every `sync:baseline` proposes undoing the reset. I moved it to `--init-client`, the step every new client site runs before its tokens become client-owned (all profiles, EmDash included). **Owner decision:** keep this, or also apply it at generation and teach `sync:baseline` about the transformation.
- **Not re-added:** `--color-white`/`--color-black` (the audit suggested re-adding them). Baseline's semantic colours cover them and `bg-transparent`/`bg-current` are static utilities that keep working.

### B.2 Fluid space scale

- **What:** `--spacing-3xs` … `--spacing-3xl` (Utopia multipliers of s = 1rem → 1.5rem) and the pairs `3xs-2xs` … `2xl-3xl`, `s-l`, `l-2xl`, `xl-3xl`; `generateSpacePrimitives()`; `generateSpaceScale` now also emits them and the medium section step.
- **Aliases, deviation:** `--spacing-content`, `--spacing-section` and `--spacing-section-m` equal `s`, `xl-3xl` and `l-2xl` exactly (a unit test holds them equal), but stay literal `clamp()` values rather than `var()` aliases. Reasons: the required-contract starter suggestions must be self-contained for older sites adopting one token at a time, and the fluid validator, canvas kit and lanes read literal clamps. `--spacing-grid` and `--spacing-container` sit between steps; making them aliases would change their values.
- **Compatibility:** new tokens are optional (`OPTIONAL_THEME_TOKENS`); `--type-scale`/`--space-scale` skip optional tokens a stylesheet does not declare instead of failing.

### B.3 Type scale

- **What:** `--text-step-3`, `-4`, `-5` and `--text-body: 1rem`; heading map h1 step 2, h2 step 1, **h3 step 0, h4 body size, h5/h6 step −1**; the styleguide shows steps −1…5, the map and the space scale. `docs/design-framework.md` no longer labels `--text-step-0` "Body copy": body is a fixed 1rem; step 0 is lead text.
- **Visible change:** h3–h6 outside cards previously inherited the body size; h3 now grows to 24px on wide screens.

### B.4 2.5× resize-text rule

- **What:** `design:tokens` fails a fluid `--text-*` token whose max exceeds 2.5 × its min (four-place rounding slack), unless a `/* resize-text-exception: <reason> */` comment precedes it. The generator raises bridge and high-step minimums to that floor. The zoom-model advisory stays.
- **Retuned:** `--text-step-2-to-0` 1rem → 1.3125rem minimum (16 → 21px), `--text-step-3-to-1` 1.25rem → 1.75rem (20 → 28px). Golden-hash test now pins the unchanged non-bridge values (hash of the earlier output, recomputed before the change).
- **Effect on existing sites:** a site that syncs `design-system.mjs` while keeping the old bridges fails `design:tokens` until it retunes or records an exception. That is the intent of "failing", but it is a hard stop on update; see the owner decisions.

### B.5 Card narrow-slot rule

- **What:** a horizontal Card is its own named query container (`container: card / inline-size`) and goes side by side from a 32rem card width (`@container card (min-width: 32rem)`), stacked otherwise; media and body sit in a `.card-layout` wrapper with `display: contents` for stacked cards, so their layout is unchanged. Grid items are named `card-slot` inline-size containers by default (`slots={false}` opts out).
- **Why the card is its own container:** a container query cannot style the container itself. When a Card is a direct Grid item, the Grid's container *is* the card, so a card that only queried `card-slot` could never go side by side inside a Grid. Making the horizontal card its own container works in any slot. Only horizontal cards get containment, which avoids collapsing ordinary cards placed in content-sized contexts.
- **Visible change:** horizontal cards in narrow cells at desktop stay stacked (the earlier unnamed `max-width` query was inert, as the audit found).

### B.6 Typed `gap`

`LayoutGap` = `'none' | content | grid | container | section | section-m | space steps and pairs | (string & Record<never, never>)` on Section, Container and Grid; `layoutStyle` maps names to `var(--spacing-<name>)` and `none` to `0px`; other strings pass through. The guardrail reports raw lengths.

### B.7 Layering, motion, breakpoints

`--z-behind/raised/sticky/skip/overlay`, `--duration-fast/base/slow/slower`, `--breakpoint-sm/md` (Tailwind's defaults, named). Raw values replaced in `global.css`, Card and Steps; `@media` rules name the token in a comment because media queries cannot read custom properties. Three timings were rounded to the nearest token (180 → 200ms, 220 → 200ms, 240 → 250ms). Loop/progress durations (shimmer, navigation progress) and the existing `--duration-normal` site hook stay.

### B.8 Lower-ranked items

- **DTCG export:** `design:tokens --format dtcg [--out file]`; typed tokens, aliases for `var()` aliases, fluid ranges in `$extensions`, dark-surface overrides, CSS-only list for shadows/`color-mix()`/`linear()`.
- **Optional recipes:** `global.css` opens with a map of core rules and optional recipes, and each decorative family carries an "Optional recipe" banner. Rules were not moved, because reordering same-specificity rules can change the cascade and would make reviewed merges harder. Docs and skill references call the families opt-in, selected by the Art Direction Record.
- **Scroll-driven reveal:** `data-reveal` animates with `animation-timeline: view()` where supported; SiteShell's observer runs only as the fallback (and keeps adding `is-revealed`). `data-reveal-delay` applies only on the fallback.
- **Registry aliases:** `src/styles/registry-aliases.css` (`@theme inline`, not imported by default; one commented import line in `global.css`). Trial build confirmed `bg-primary` compiles to `var(--color-action)`. `bg-muted` is deliberately not aliased (shadcn's muted is a background, Baseline's is ink).
- **Skipped:** anchor positioning (the audit flagged it as a trial with conflicting support dates; out of scope).

## Verification

See the final section of this report, completed after the last run.

## Owner decisions

1. **Strict theme timing:** keep it in `--init-client` (current), or also apply it at generation with a matching `sync:baseline` rule.
2. **Resize-text rule as a hard failure on update:** older sites with 3.25× bridges fail `design:tokens` after syncing the script. Keep it failing, or make it advisory for stylesheets that predate the rule.
3. **Section joins for existing sites:** adopt per site (`sectionJoins="shared"` in the Base) during their next reviewed update, starting with the live test bed.
4. **Heading sizes:** h3 at step 0 and h4 at body size is the shipped map; confirm before the next fleet update, because it changes every site that merges `global.css`.
