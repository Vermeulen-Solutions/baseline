---
bump: patch
platforms: [emdash, static]
areas: [components]
adoption: copy
visible: no
database: no
files: [src/components/Card.astro, src/components/CopyButton.astro, src/components/PhotoGallery.astro, src/components/SearchDialog.astro, src/components/TableOfContents.astro, src/components/Tabs.astro]
---

# Hover effects in shared components only where a pointer can hover

`global.css` gated its hover styles in 0.4.0, but six shared components still had bare `:hover` rules, so a tapped tab, copy button, search result, table-of-contents link or gallery image kept its hover look on touch screens. Those rules now sit behind `@media (hover: hover)`. Rules that pair hover with focus are unchanged, and nothing changes with a mouse.

## For sites

Unedited copies arrive with `npm run site:files -- --site <path> --apply` (static sites: `sync:baseline`). Sites that edited a component gate its hover-only rules the same way.
