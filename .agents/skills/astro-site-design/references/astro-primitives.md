# Astro structural primitives

Read when defining shared layouts or repeated page patterns. Keep primitives as server-rendered Astro components unless an interaction truly needs client JavaScript.

## Suggested responsibilities

- `Section`: page-level landmark/region, optional heading relationship, and one of a small set of vertical spacing variants. Avoid placing a `<section>` around content with no heading or meaningful thematic grouping; allow a safe element choice when semantics require it.
- `Container`: consistent inline gutters and a named content width (`width="reading" | "content" | "wide"` via `.container-shell`) for standard sections, or `breakout` (`.content-grid`) for long-form editorial articles and case studies where default children stay in the `content` (`--measure-reading`) track while specific child blocks break out to `.content--feature` (`--measure-content`), `.content--wide` (`--measure-wide`), `.content--full`, or `.content--full-safe` without closing the container. It should not own page-specific color or typography.
- `Grid`: repeated responsive columns with named gap and a small set of useful minimum card widths. A CSS auto-fit recipe such as `repeat(auto-fit, minmax(min(100%, var(--grid-min)), 1fr))` can work, but inspect card counts and awkward last rows before making it universal.
- `Card`: semantic `<article class="card">` primitive with an accessible heading link (`<a class="card-link clickable-parent">`) whose `::after` pseudo-element stretches across the card while keeping body copy out of the screen-reader link announcement, paired with `.focus-parent` (`:focus-within:has(:focus-visible)`) for a single keyboard focus ring on the card perimeter. Customize via `--card-bg`, `--card-text`, `--card-muted`, `--card-border-color`, `--card-radius`, `--card-padding`, `--card-frame-padding`, `--card-gap`, `--card-shadow`, and concentric inner media radius (`--card-media-radius: max(0px, calc(var(--card-radius) - var(--card-frame-padding)))`). Any secondary interactive link or badge inside a card raises above the stretched link via `z-index: 2`.
- Background and mask helpers: use `.is-bg` on a child `<img>`/`<picture>`/`<video>` to make its parent automatically `position: relative; isolation: isolate` via `:where(:has(> .is-bg))`, and `.fade--bottom`, `.fade--top`, `.fade--block`, or `.fade--inline` (`--fade-amount: 25%`) for hardware-accelerated `mask-image` fades that remain independent of background colors.

When a card needs to change layout based on its own available width, establish a query container on its item wrapper, not just on the whole grid (`Card` includes both `@container (max-width: 32rem)` and `@media (max-width: 40rem)` fallbacks for `layout="horizontal"`). Keep this an explicit contract of the composition; see `responsive-architecture.md`. Do not add query containers to every primitive preemptively.

Don't make a component for every `div`, add many polymorphic props preemptively, or hide materially different semantics behind one component. Share tokens and classes first; introduce an Astro component when it clarifies repeated structure, valid semantics, or behavior.

## Normalize repeated builder patterns

When a builder styled repeated cards or sections through individual IDs or per-element control panels, inspect multiple examples before designing the Astro API. Separate content differences from intentional visual variants and accidental source inconsistencies. Put repeated content in an EmDash collection when editors need to maintain it, then render it with one shared component. Use explicit data fields and a few named variants (for example, `featured` or `compact`) only when the visual difference has a clear purpose. Do not create a component or CSS rule per source ID, and do not preserve ID selectors as Tailwind styling hooks; reserve IDs for fragment targets and accessibility relationships.

For layout spacing, use container padding for edge inset, `gap` for layout siblings, and the `.flow` pattern for rich text. Avoid empty spacer elements and unrelated per-instance padding values. A component-level custom property can express a real relationship between dimensions, but do not add custom-property indirection for a value used only once.

## Composition rules

- Prefer `<Section><Container>...` for site-wide page structure, then use a small set of semantic Tailwind utilities for local flex/grid alignment.
- Macro spacing should use named tokens/components (`gap-content`, `gap-grid`, `gap-container`) rather than guessed scale values. Internal control spacing may use a documented compact scale.
- Avoid `p-[22px]`, repeated inline layout styles, and component-local media queries that duplicate shared responsive rules. Allow a one-off when a visual requirement truly is one-off; leave a short explanation rather than distorting the token system.
- Use media/container queries for discrete behavior, not as substitutes for a missing fluid scale. Centralize breakpoint names when Tailwind variants are appropriate.
- Keep project-specific names and component variants in the site's `AGENTS.md`; the shared skill should not hardcode universal brand decisions.

## Accessible interaction foundation

Provide visible `:focus-visible`, hover, active, and disabled states; adequate contrast; usable target sizes; and `prefers-reduced-motion` behavior where animation is present. Preserve semantic link/button behavior and keyboard use. Don't use a clickable non-interactive wrapper as a substitute for an anchor or button. Verify reduced motion, keyboard focus, and narrow-screen behavior during visual QA.
