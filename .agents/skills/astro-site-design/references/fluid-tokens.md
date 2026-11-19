# Fluid token recipes

Read when establishing a new site's design tokens. These are recipes, not fixed brand values.

## Fluid interpolation

Choose a minimum and maximum size and the viewport interval where the value should grow. Express all four bounds in `rem`, calculate `slope = (maxSize - minSize) / (maxViewport - minViewport)` and `intercept = minSize - slope * minViewport`, then emit `clamp(minSize, calc(intercept + slope * 100vi), maxSize)`. `vi` is one percent of the viewport's inline size. Keep the calculated bounds in a comment or nearby scale documentation so future editors know how the token was derived. If vertical writing modes are not a site requirement, still check that inline-axis scaling matches the design intent.

Example: grow from `1rem` at `20rem` viewport width to `2rem` at `80rem` viewport width. Slope is `0.016667`; intercept is `0.6667rem`; multiplying the slope by 100 gives the `vi` coefficient:

```css
@theme {
  --text-step-0: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem);
}
```

This CSS-first interpolation avoids hand-picked unrelated clamps. Round coefficients enough to avoid visible discontinuity, then check the minimum, midpoint, maximum, browser zoom, and very narrow screens. `cqi` is appropriate when a component's own containing width should drive its size; establish `container-type: inline-size` on the intended ancestor. Without an eligible container, `cqi` falls back to a small viewport unit, so test the component in its real container and add a sensible fallback if that behavior is not intended. Do not use container units for global typography whose desired behavior follows the viewport.

Create a compact type and space scale around the actual site's content and inspected visual reference. Baseline ships `--text-step--1` through `--text-step-5`, a fixed `--text-body` (1rem; body text is not fluid and `--text-step-0` is lead text, not body copy), the heading map (h1 step 2, h2 step 1, h3 step 0, h4 body size, h5/h6 step −1), a primitive fluid space scale `--spacing-3xs` … `--spacing-3xl` with space pairs (`--spacing-s-m`, `--spacing-xl-3xl` …), and the semantic `--spacing-content`, `--spacing-grid`, `--spacing-container`, `--spacing-section` and `--spacing-section-m`, which sit on that scale. Reach for a step or pair before inventing a value. Keep every fluid text token's maximum at most 2.5 times its minimum (WCAG 1.4.4); `design:tokens` fails one above it unless a `/* resize-text-exception: <reason> */` comment precedes it (a stylesheet that predates the rule only gets a warning until it adopts the current scale). Layering (`--z-*`), motion durations (`--duration-*`) and the shared breakpoints (`--breakpoint-sm`, `--breakpoint-md`) are tokens too. When a hero display heading or major section transition needs dramatic desktop scale that collapses more aggressively on mobile than a single standard step, use high-contrast fluid bridge (`-to-`) tokens (`--text-step-3-to-1`, `--text-step-2-to-0`, `--spacing-2xl-to-md`, `--spacing-xl-to-sm`). These produce useful Tailwind utilities such as `text-step-1`, `text-step-3-to-1`, `gap-content`, and `px-container`; semantic Astro components may consume the same variables directly.

## Token groups

- **Type:** family, weight, line-height, tracking, measure, standard fluid size steps (`--text-step--1`..`--text-step-2`), and high-contrast bridge steps (`--text-step-3-to-1`, `--text-step-2-to-0`). Include a readable body measure and avoid scaling every text role with viewport width.
- **Space/layout:** content, grid, container, section, high-contrast bridge tokens (`--spacing-2xl-to-md`, `--spacing-xl-to-sm`), and rich-text `.flow` variables (`--heading-spacing`, `--list-spacing`, `--list-item-spacing`, `--figure-spacing`, `--blockquote-spacing`); narrow/wide content widths (`--measure-reading`, `--measure-content`, `--measure-content-safe`, `--measure-wide`); and page gutters.
- **Color & surfaces:** OKLCH palette primitives, semantic roles (`page`, `surface`, `text`, `muted`, `border`, `action`, `on-action`, `focus`), and contextual surface scopes (`[data-surface="dark"]` / `[data-surface="light"]`) that remap surface, text, muted, border, and focus tokens together. Check actual combinations against contrast requirements instead of assuming OKLCH or a mathematically generated tint guarantees contrast.
- **Interaction, elevation & motion:** radii (`--radius-control`, `--radius-card` with concentric inner radius math), multi-layer OKLCH elevation shadows (`--shadow-sm` 3-stop, `--shadow-md` 4-stop, `--shadow-lg` 6-stop derived from `oklch(from var(--color-text) l c h / alpha)`), and curated easing presets (`--ease-smooth`, `--ease-snappy`, `--ease-spring` via CSS `linear()`).

**Section rhythm.** Set one fluid section step once (`--spacing-section`) and let every section use it, as Bricks' fluid spacing does; do not tune section padding per page or per breakpoint. Two sections on the same ground share one step: the second drops its start padding (`SiteShell sectionJoins="shared"`). A ground change (different `data-surface`, `data-ground`, background or surface class) keeps both paddings. Named exceptions are `<Section spacing="medium">` (`--spacing-section-m`), `spacing="content"` and `spacing="none"`. Contextual spacing (space that depends on the neighbouring element) is for content inside text, through the editorial flow controls, never for sections. See `docs/design-framework.md` (Section rhythm).

Use Tailwind's matching `@theme` namespace for values that should create utility classes (`--text-*`, `--spacing-*`, `--color-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--breakpoint-*`). Keep implementation-only aliases as ordinary custom properties. See the current [Tailwind theme variable documentation](https://tailwindcss.com/docs/theme).

## Pure-CSS scroll-driven entrance recipe

Baseline's shipped `data-reveal` already works this way: `global.css` reveals it with `animation-timeline: view()` where supported and SiteShell's IntersectionObserver is only the fallback. Use `data-reveal` first. For a custom entrance beyond it, use a single parameterized `@keyframes` rule driven by CSS `animation-timeline: view()` (supported behind `@supports (animation-timeline: view())` and disabled automatically under `prefers-reduced-motion: reduce`):

```css
@keyframes enter-view {
  from {
    opacity: var(--enter-opacity, 0);
    translate: var(--enter-x, 0) var(--enter-y, 1.5rem);
    scale: var(--enter-scale, 1);
  }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal-on-scroll {
      /* Longhands: the minifier folds a shorthand and a timeline into a value browsers reject. */
      animation-name: enter-view;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: entry 10% cover 28%;
    }
  }
}
```

## Responsive rules

- Prefer fluid values for continuous changes and semantic component variants for known layout modes.
- Use intrinsic Grid/Flex behavior before adding a breakpoint. For a discrete change, choose a container query when the component's placement controls its available space; choose a media query when the viewport controls it. Share a named breakpoint when several layouts intentionally use the same threshold; otherwise use a content-driven local threshold rather than forcing a component into a device preset. See `responsive-architecture.md` for query-container ownership and fallback rules.
- Prefer `min()`, `max()`, and `clamp()` constraints before breakpoint patches, but check for overflow at extreme widths.
- Arbitrary Tailwind values are exceptions for genuine one-offs or values that cannot sensibly become tokens; do not use them to invent a second undocumented scale.
