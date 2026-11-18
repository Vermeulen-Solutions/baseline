---
bump: minor
platforms: [emdash, static]
areas: [tooling, content-model, skills]
adoption: manual
visible: no
database: no
files: [scripts/audit-html-integrity.mjs]
---

# Real update dates in static sitemaps, slashless links flagged, HSTS and security.txt at cutover

Static posts take an optional `updatedAt`, which can never fall before `publishedAt`. The sitemap's `lastmod` uses it, falling back to `publishedAt` and never the build date, and post pages pass it as `dateModified`. The Sveltia profile gains a matching optional Updated field.

On EmDash sites, `audit:html` now flags a link from a prerendered page to a directory page without its trailing slash (`/about` for `about/index.html`). Static hosts answer such a link with a redirect, and Search Console reports the page as "Page with redirect". Static sites don't ship `audit:html`; the static profile already builds every internal URL with its slash through `routePath`.

The cutover skill adds two steps:

- enable HSTS at the TLS terminator in stages, without `preload`;
- publish `/.well-known/security.txt` with a contact and an `Expires` date under a year away.

## For sites

- **Static sites:** add `updatedAt: z.coerce.date().optional()` to the posts schema, with the check that it is not before `publishedAt`. Use `p.data.updatedAt ?? p.data.publishedAt` for the sitemap `lastModified` and pass `modifiedAt={post.data.updatedAt}` from the post page. Sveltia sites also add the optional `updatedAt` datetime field to `public/admin/config.yml`.
- **EmDash sites:** take `scripts/audit-html-integrity.mjs` with the next helper sync and fix any `link-slash` it reports. The cutover steps arrive with the next skill sync.
