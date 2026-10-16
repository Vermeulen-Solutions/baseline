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

Create a compact type and space scale around the actual site's content and inspected visual reference. Example names can be `--text-step--1` through `--text-step-5` and `--spacing-content`, `--spacing-grid`, `--spacing-container`, and `--spacing-section`. These produce useful Tailwind utilities such as `text-step-1`, `gap-content`, and `px-container`; semantic Astro components may consume the same variables directly.

## Token groups

- **Type:** family, weight, line-height, tracking, measure, and fluid size steps. Include a readable body measure and avoid scaling every text role with viewport width.
- **Space/layout:** content, grid, container, section, and rich-text flow gaps; narrow/wide content widths; page gutters; and any deliberate grid minimums.
- **Color:** OKLCH palette primitives and semantic roles (`surface`, `surface-raised`, `text`, `text-muted`, `border`, `action`, `on-action`, `focus`, and status roles). Derive shades with care, and check actual combinations against contrast requirements instead of assuming OKLCH or a mathematically generated tint guarantees contrast.
- **Interaction/shape:** radii, border widths, shadows, focus ring, motion durations/easing, and layer levels. Add dark/high-contrast themes only when required by the brief, but keep semantic roles as the seam for them.

Use Tailwind's matching `@theme` namespace for values that should create utility classes (`--text-*`, `--spacing-*`, `--color-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`). Keep implementation-only aliases as ordinary custom properties. See the current [Tailwind theme variable documentation](https://tailwindcss.com/docs/theme).

## Responsive rules

- Prefer fluid values for continuous changes and semantic component variants for known layout modes.
- Use intrinsic Grid/Flex behavior before adding a breakpoint. For a discrete change, choose a container query when the component's placement controls its available space; choose a media query when the viewport controls it. Share a named breakpoint when several layouts intentionally use the same threshold; otherwise use a content-driven local threshold rather than forcing a component into a device preset. See `responsive-architecture.md` for query-container ownership and fallback rules.
- Prefer `min()`, `max()`, and `clamp()` constraints before breakpoint patches, but check for overflow at extreme widths.
- Arbitrary Tailwind values are exceptions for genuine one-offs or values that cannot sensibly become tokens; do not use them to invent a second undocumented scale.
