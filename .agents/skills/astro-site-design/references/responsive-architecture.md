# Responsive architecture for Astro components

Read when building a reusable component, setting responsive rules, or reviewing a migration's mobile behavior. Derive thresholds from the actual content and available space rather than a device list, because the same component lands in slots of very different widths on one device.

## Choose the mechanism

Ask what controls the space the layout depends on, and take the first answer that fits:

| # | If… | Use | Why |
| --- | --- | --- | --- |
| 1 | The browser can reflow the content without a coordinated mode switch: independent items wrapping, a column count that follows width, a readable max measure. Not when one component has two named arrangements, such as image beside text versus image above text — that is row 2 | **Intrinsic layout:** max inline size, `min()`/`max()`/`clamp()`, `flex-wrap`, Grid `auto-fit`/`minmax()`. Tie type and spacing to the tokens in `fluid-tokens.md`. | No threshold to choose or maintain, and it works in every placement. |
| 2 | The component has two distinct layouts **and** its inline space changes independently of the viewport (the same card in a sidebar, a grid cell and a full-width feature) | **Container query** on an ancestor of the elements being restyled. | A viewport query would switch the sidebar card at the same width as the feature card, although the sidebar slot is far narrower. |
| 3 | The behavior follows the viewport itself: the page shell, viewport-anchored UI (sticky headers, drawers), user preferences (reduced motion, contrast), print | **Media query** with a content-driven threshold. | Only the viewport knows these facts; a container has no notion of them. |

Pick the lowest row whose condition matches, not the simplest technique that happens to produce the look. A `flex-wrap` card can flip image and text, but its switch point is the sum of flex bases and gaps rather than a width you tested against real content, and it moves whenever copy or tokens change; a container query states the switch in one reviewable rule. Do not reach for row 2 or 3 to patch a missing fluid token from row 1.

For a media query threshold: make it a shared Tailwind breakpoint only when two or more layouts switch at the same content failure point; otherwise keep a local threshold at the component's actual failure point. A shared name that no longer matches either layout's failure point invites both to break silently.

## Container query rules

- **Query an ancestor, never the element itself.** A card cannot query its own size to restyle itself, because its size would depend on the styles the query applies. Its descendants can query it, or the card can query an ancestor.
- **Put the container on the slot, not the whole grid.** For a list of cards, let the grid use intrinsic columns and make each item wrapper the query container. Querying the grid measures the entire grid, so every card would switch at the grid's width rather than its own. Prefer semantic list markup when the content is a list; the `<li>` can be the wrapper.
- **Use a close, explicit wrapper.** The container need not be the direct parent, but a wrapper owned by the structural Astro component or the caller makes the contract visible in markup.
- **Name containers** (`container: card-slot / inline-size`) whenever query containers can nest. An unnamed query measures the nearest container of any kind, which may be a layout wrapper you did not intend.
- **Keep the narrow layout outside `@container` and enhance at `min-width`.** A browser without the feature, or a slot with no container, then still gets readable content. Check it by temporarily disabling the query.

```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--card-min)), 1fr)); gap: var(--spacing-grid); }
.cards > li { container: card-slot / inline-size; }
.card { display: grid; gap: var(--spacing-content); }
@container card-slot (min-width: 32rem) {
  .card { grid-template-columns: minmax(0, 1fr) auto; }
}
```

`32rem` is an example, not a universal breakpoint: set the value at the width where the real card content stops fitting side by side, measured with the longest expected title. Use `minmax(0, 1fr)` or `min-inline-size: 0` on tracks that hold long content, because the default `auto` minimum lets an unbroken word or URL push the track wider than its slot. Do not set fixed heights to make variable content look uniform; longer translated or edited copy will overflow them.

## Container ownership and CSS boundaries

- Let the structural Astro component or explicit wrapper own `container-type: inline-size` (or `container: name / inline-size`). `inline-size` containment means the box no longer sizes to its content's inline size, so inspect it in the real layout; a shrink-wrapped wrapper can collapse. Use `container-type: size` only when both axes need containment and the wrapper has a defined height, because size containment ignores content height.
- Do not use Kevin Geary's [nested `:has(> &)` selector](https://geary.co/has-me/) as a default way to make a component's parent a container: the component would mutate whichever parent it occupies, including third-party or shared layout wrappers. Use it only for a composition where the parent cannot be named, and then verify the compiled CSS, fallback and layout effects.
- Use `@supports` for optional modern selectors or properties whose absence would break layout, and test the browsers the site's audience uses for navigation, forms and essential content.
- Root horizontal containment (`overflow-x: clip`): Keep `html, body { overflow-x: clip; }` (with `overflow-x: hidden;` fallback) alongside `inline-size: 100%; min-inline-size: 0;` on `body` and `main` in the baseline reset. Unlike `overflow: hidden`, `overflow-x: clip` prevents horizontal blowout and mobile layout zoom-out from subpixel rounding, focus outlines (`outline-offset`), or third-party embeds without creating an unwanted scroll container that breaks `position: sticky`.
- Form controls and embeds: Ensure `input, textarea, select, iframe` have `max-inline-size: 100%; box-sizing: border-box;` in baseline resets so intrinsic defaults (`size="20"`, 300 px iframe defaults) never push grid tracks wider than their slot.
- Avoid coupling `aspect-ratio` with rigid `min-height` on fluid containers: In CSS Box Sizing, `aspect-ratio: W / H` transfers a `min-height` to an implicit `min-width: calc(min-height * W / H)`. When users enlarge browser text (accessibility font scaling), a `min-height: 16rem` grows and transfers to a massive minimum inline size that forces narrow mobile viewports to overflow horizontally. Let fluid aspect-ratio boxes derive height from width rather than enforcing a rigid minimum block size.
- Verify intermediate failure points for fixed-minimum multi-column grids: When using fixed-minimum tracks like `grid-template-columns: minmax(0, 1.25fr) minmax(18rem, .75fr)`, calculate the layout's minimum required width ($\text{sum of minimum tracks} + \text{gaps}$). If that sum exceeds 640 px, collapsing at 640 px is too late: every viewport between 640 px and the failure point (tablets, foldables, landscape phones, and Android devices with non-default display density) will overflow horizontally while already displaying the mobile navigation shell. Multi-column grids must collapse at or above their calculated failure point (matching the primary drawer/navigation threshold, e.g. 900 px).
- Use `cqi` only inside a known query container and with a bounded expression (`clamp()` with `rem` min and max). Without a container, container units fall back to the small viewport size, so the value silently becomes viewport-relative. For fluid text keep a `rem` contribution and check 200% text resizing and 400% zoom; a mathematical scale alone does not establish accessibility.
- Tailwind v4 component `<style>` blocks are separate style contexts. Put these recipes in global component classes or shared CSS variables; if Tailwind directives are required in a scoped style, follow the current `@reference` guidance.

## Review with unpredictable content

Before calling a responsive component done, check each item and record failures by placement and width:

1. A narrow phone and a wide screen.
2. Widths just below and just above each mode change.
3. The component in its narrowest real placement (for example the sidebar slot), not only phone and desktop presets.
4. Long titles, unbroken URLs, more and fewer items, missing media, unusual image ratios and translated strings.
5. RTL, when the site supports it: logical properties, direction and reading order.
6. 400% browser zoom (content reflows without clipping or horizontal page scroll), 200% text resizing and increased text/paragraph spacing.
7. Visible focus and source-order logic when the layout rearranges visually.

For a modern CSS feature, decide from what the fallback leaves usable and from the site's audience and stakes, not from a universal support percentage. A cosmetic enhancement may degrade gracefully; navigation, forms and essential content need a functional fallback. Do not add a polyfill merely to preserve decoration.

## Further reading

- [Kevin Geary: Responsive Development, Era 4](https://geary.co/responsive-development-era-4/) and [container queries vs media queries](https://geary.co/container-queries-vs-media-queries-a-new-era-of-responsive-web-design/)
- [Josh Comeau: Container Queries Unleashed](https://www.joshwcomeau.com/css/container-queries-unleashed/) and [browser support decisions](https://www.joshwcomeau.com/css/browser-support/)
- [Modern CSS: Dynamic component architecture](https://moderncss.dev/modern-css-for-dynamic-component-based-architecture/), [contextual spacing](https://moderncss.dev/contextual-spacing-for-intrinsic-web-design/), and [future-proofing variable content](https://moderncss.dev/developing-for-imperfect-future-proofing-css-styles/)
