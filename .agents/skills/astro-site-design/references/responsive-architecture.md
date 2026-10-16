# Responsive architecture for Astro components

Read when building a reusable component, setting responsive rules, or reviewing a migration's mobile behavior. Derive thresholds from the actual content and available space rather than a device list.

## Choose the smallest mechanism that solves the problem

1. **Intrinsic layout:** First try max inline size, `min()`/`max()`/`clamp()`, `flex-wrap`, and Grid `auto-fit`/`minmax()`. Use these when the browser can reflow without a coordinated mode switch. Keep type and spacing tied to the design tokens in `fluid-tokens.md`.
2. **Container query:** Use when a component has two distinct layouts and its inline space changes independently of the viewport, such as the same card in a sidebar, grid cell, and full-width feature. The queried width belongs to a deliberate ancestor of the elements being restyled. A container need not be the direct parent, but a close wrapper usually makes the contract obvious. A card cannot query its own size to restyle itself; its descendants can query it, or the card can query an ancestor.
3. **Media query:** Use for the page shell, viewport-anchored UI, or behavior that truly follows the viewport. Also use media queries for user preferences such as reduced motion and contrast, and for print. Set a content-driven threshold; make it a shared Tailwind breakpoint only if multiple layouts intentionally share it. A local component-specific threshold is acceptable when it expresses that component's actual failure point.

For a list of cards, the list/grid can use intrinsic columns while each item wrapper establishes the card's query container. Querying the grid alone measures the entire grid, not each card's space. Prefer semantic list markup when the content is a list; the item can serve as the wrapper.

```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--card-min)), 1fr)); gap: var(--spacing-grid); }
.cards > li { container: card-slot / inline-size; }
.card { display: grid; gap: var(--spacing-content); }
@container card-slot (min-width: 32rem) {
  .card { grid-template-columns: minmax(0, 1fr) auto; }
}
```

Choose `32rem` only after testing the real card content; it is an example, not a universal breakpoint. Name containers when nested query containers could cause a rule to measure the wrong ancestor. Use `minmax(0, 1fr)` or `min-inline-size: 0` when long content must shrink in a Grid/Flex track. Do not impose fixed heights to make variable content appear uniform.

## Container ownership and CSS boundaries

- Let the structural Astro component or explicit wrapper own `container-type: inline-size` (or `container: name / inline-size`). `inline-size` containment changes how that box participates in sizing, so inspect it in the real layout. Avoid `container-type: size` unless both axes need containment and its height behavior is understood.
- Kevin Geary's [nested `:has(> &)` selector](https://geary.co/has-me/) can make the direct parent of a component a query container automatically. Do not use it as a default here: the component would mutate whichever parent it happens to occupy, including third-party or shared layout wrappers. Prefer an explicit wrapper. Consider the selector only for a constrained composition where the parent cannot be named and verify the compiled CSS, fallback, and layout effects.
- Keep a usable narrow layout outside `@container`; expand it at `min-width` so a browser without the feature still has readable content. Check the fallback by temporarily disabling the query. Use `@supports` for optional modern selectors/properties when needed, and test actual browsers for important behavior.
- Use `cqi` only with a known query container and a bounded, readable expression. Without one, container units fall back to a viewport-relative size. For fluid text, retain a `rem` contribution and check 200% text resizing and 400% zoom; a mathematical scale alone does not establish accessibility.
- Tailwind v4 component `<style>` blocks are separate style contexts. Prefer global component classes or shared CSS variables for these recipes; if Tailwind directives are required in a scoped style, follow the current `@reference` guidance.

## Review with unpredictable content

At minimum inspect a narrow phone, a wide screen, intermediate widths around each mode change, and the component in its narrowest real placement. Check long titles, unbroken URLs, more or fewer cards, missing media, unusual image ratios, and translated strings. If the site supports RTL, check logical properties, direction, and reading order. At 400% browser zoom, confirm that content reflows rather than clipping or forcing horizontal page scroll; also check 200% text resizing and increased text/paragraph spacing. Preserve visible focus and source-order logic when layouts rearrange visually.

For a modern CSS feature, decide from the fallback's usability and the site's actual audience and stakes, rather than a universal support percentage. A cosmetic enhancement may degrade gracefully; navigation, forms, and essential content need a functional fallback. Do not add a polyfill merely to preserve decoration.

## Further reading

- [Kevin Geary: Responsive Development, Era 4](https://geary.co/responsive-development-era-4/) and [container queries vs media queries](https://geary.co/container-queries-vs-media-queries-a-new-era-of-responsive-web-design/)
- [Josh Comeau: Container Queries Unleashed](https://www.joshwcomeau.com/css/container-queries-unleashed/) and [browser support decisions](https://www.joshwcomeau.com/css/browser-support/)
- [Modern CSS: Dynamic component architecture](https://moderncss.dev/modern-css-for-dynamic-component-based-architecture/), [contextual spacing](https://moderncss.dev/contextual-spacing-for-intrinsic-web-design/), and [future-proofing variable content](https://moderncss.dev/developing-for-imperfect-future-proofing-css-styles/)
