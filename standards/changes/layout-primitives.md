---
bump: minor
platforms: [emdash, static]
areas: [components, styles]
adoption: manual
visible: yes
database: no
files: [src/components/Card.astro, src/components/Grid.astro, src/components/Section.astro, src/components/Container.astro, src/lib/layout-style.ts, src/layouts/SiteShell.astro, src/styles/registry-aliases.css]
---

# Container-query Card and Grid, opt-in section joins and CSS-first reveal

A horizontal Card switches on its own width (side by side from 32rem) instead of the viewport, with media and body in a `.card-layout` wrapper. Grid items become named `card-slot` query containers (`slots={false}` opts out). Section, Container and Grid accept token names for `gap`. Same-ground section joins are available under `SiteShell sectionJoins="shared"`, with `<Section spacing="medium">`. `data-reveal` animates with scroll-driven CSS where supported; the observer runs only as the fallback. `src/styles/registry-aliases.css` (not imported by default) maps registry component utilities onto Baseline tokens.

## For sites

Adopt these together with the matching `global.css` rules, not file by file. Site CSS that selects `.card > .card-media` or `.card > .card-body` must drop the child combinator; a horizontal Card in a flex row and a Grid item with `justify-self` other than stretch need an explicit width. Section joins are opt-in: add the prop, then inspect each stacked join and mark sections that paint their own background with `data-ground`. Static sites receive the managed components through `sync:baseline`; their site-owned Base and `global.css` stay a manual merge.
