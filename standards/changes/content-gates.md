---
bump: minor
platforms: [emdash, static]
areas: [components, tooling, skills, docs]
adoption: manual
visible: yes
database: no
files: [scripts/audit-ui.mjs]
---

# Sections open with their first entry; folded content gets audited

**Sections open with their first entry.** In the static profile, `gatedRoutes()` in `src/lib/posts.ts` lists sections with nothing published yet (the posts index until its first post). The navigation, the sitemap and the index's `noindex, follow` all read that one rule, so no link points at an empty page. The site working rules describe the same practice for EmDash sites.

**Folded content gets audited.** `audit:ui --open-details` opens every closed `<details>` outside the header and navigation before measuring, so folded content gets checked. The rollout reference asks for one pass with it at phone widths.

## For sites

- **Static sites:** add `gatedRoutes()` to `src/lib/posts.ts` (with a site's own sections), filter the Base layout's navigation by it, use it in `sitemap.xml.ts`, and pass `robots: 'noindex, follow'` from an empty index.
- **EmDash sites:** add menu items only for sections with content.
- **All sites:** take `scripts/audit-ui.mjs` with the next helper sync.
