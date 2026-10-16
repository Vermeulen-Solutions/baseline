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

Create a compact type and space scale around the actual site's content and inspected visual reference. Example names can be `--text-step--1` through `--text-step-5` and `--spacing-content`, `--spacing-grid`, `--spacing-container`, and `--spacing-section`. When a hero display heading or major section transition needs dramatic desktop scale that collapses more aggressively on mobile than a single standard step, use high-contrast fluid bridge (`-to-`) tokens (`--text-step-3-to-1`, `--text-step-2-to-0`, `--spacing-2xl-to-md`, `--spacing-xl-to-sm`). These produce useful Tailwind utilities such as `text-step-1`, `text-step-3-to-1`, `gap-content`, and `px-container`; semantic Astro components may consume the same variables directly.

## Token groups

- **Type:** family, weight, line-height, tracking, measure, standard fluid size steps (`--text-step--1`..`--text-step-2`), and high-contrast bridge steps (`--text-step-3-to-1`, `--text-step-2-to-0`). Include a readable body measure and avoid scaling every text role with viewport width.
- **Space/layout:** content, grid, container, section, high-contrast bridge tokens (`--spacing-2xl-to-md`, `--spacing-xl-to-sm`), and rich-text `.flow` variables (`--heading-spacing`, `--list-spacing`, `--list-item-spacing`, `--figure-spacing`, `--blockquote-spacing`); narrow/wide content widths (`--measure-reading`, `--measure-content`, `--measure-content-safe`, `--measure-wide`); and page gutters.
- **Color & surfaces:** OKLCH palette primitives, semantic roles (`page`, `surface`, `text`, `muted`, `border`, `action`, `on-action`, `focus`), and contextual surface scopes (`[data-surface="dark"]` / `[data-surface="light"]`) that remap surface, text, muted, border, and focus tokens together. Check actual combinations against contrast requirements instead of assuming OKLCH or a mathematically generated tint guarantees contrast.
- **Interaction, elevation & motion:** radii (`--radius-control`, `--radius-card` with concentric inner radius math), multi-layer OKLCH elevation shadows (`--shadow-sm` 3-stop, `--shadow-md` 4-stop, `--shadow-lg` 6-stop derived from `oklch(from var(--color-text) l c h / alpha)`), and curated easing presets (`--ease-smooth`, `--ease-snappy`, `--ease-spring` via CSS `linear()`).

Use Tailwind's matching `@theme` namespace for values that should create utility classes (`--text-*`, `--spacing-*`, `--color-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--breakpoint-*`). Keep implementation-only aliases as ordinary custom properties. See the current [Tailwind theme variable documentation](https://tailwindcss.com/docs/theme).

## Pure-CSS scroll-driven entrance recipe

When an art direction calls for subtle scroll-triggered entrance reveals without client JavaScript, use a single parameterized `@keyframes` rule driven by CSS `animation-timeline: view()` (supported behind `@supports (animation-timeline: view())` and disabled automatically under `prefers-reduced-motion: reduce`):

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
      animation: enter-view linear both;
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
