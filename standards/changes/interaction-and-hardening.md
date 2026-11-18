---
bump: minor
platforms: [emdash, static]
areas: [styles, components]
adoption: manual
visible: yes
database: no
files: [src/styles/global.css, src/layouts/SiteShell.astro, src/layouts/Base.astro, src/components/Card.astro, src/components/Heading.astro, src/components/PhotoGallery.astro, scripts/css-contracts.mjs, scripts/design-system.mjs]
---

# Zero-JS interaction choreography: page transitions, dialog exits, hover gating

SiteShell takes an opt-in `pageTransitions="cross-document"` prop that turns on native cross-document view transitions (CSS only, skipped with reduced motion); the starter Base layouts use it and hold the header with `data-vt-header`. Dialogs now animate out as well as in (`allow-discrete` display/overlay, backdrop fade), the phone Menu panel settles in with `@starting-style`, every `:hover` rule in `global.css` sits behind `@media (hover: hover)` so tapped controls do not stay highlighted, and clickable Cards zoom their media by `--card-media-hover-scale` on hover and keyboard focus. The motion and radius scales gain `--ease-exit` and `--radius-pill`, focus rings read `--focus-ring-width` and `--focus-ring-offset`, and references to names no stylesheet defined (`--ease-out`, `--radius-sm`, `--radius-container`, `--ease-standard`) now use real tokens; the documented `--duration-normal` hook still overrides the card entrance and reveal timings. `check:css` reports any `var()` naming an undefined duration, ease, radius, shadow, z or focus-ring token (`undefined-token`, advisory).

## For sites

`global.css` and Base are site-owned, so nothing moves until a site merges them; decide per site because hover, dialog and transition behaviour changes. Merge the new `@theme` tokens first (`--ease-exit`, `--radius-pill`, `--focus-ring-width`, `--focus-ring-offset`), then the hover-gated and dialog blocks. To adopt page transitions, add `pageTransitions="cross-document"` to the site's `SiteShell` (on EmDash, `getRequestContext()?.editMode ? 'none' : 'cross-document'` as the starter Base does, so the visual editor keeps plain navigation) and `data-vt-header` to its single sticky header, then check navigation in Chromium with and without reduced motion; a site that already uses `<ClientRouter />` keeps its router and does not need the prop. A site that does not want the card zoom sets `--card-media-hover-scale: 1`. Run `npm run check:css -- --guardrails` and replace any `undefined-token` names it lists.
