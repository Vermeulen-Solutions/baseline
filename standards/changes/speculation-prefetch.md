---
bump: minor
platforms: [emdash, static]
areas: [components, docs, skills]
adoption: manual
visible: no
database: no
files: [src/lib/speculation-rules.ts, src/layouts/SiteShell.astro, src/layouts/Base.astro]
---

# Link prefetch through speculation rules

`SiteShell` takes a new `prefetch` setting (`'off'` by default, `'conservative'` or `'moderate'`). When it is on, the page carries a static `<script type="speculationrules">` JSON block, so Chromium browsers fetch a likely next page ahead of the click with no script. The prefetched page is used for that navigation even though public HTML is sent `no-cache`, so pages stay fresh after every publish and still open quickly; other browsers ignore the block. It prefetches only and never prerenders. Internals (`/_*`), `/api/`, `/admin`, links with a query or fragment, downloads, other targets, `data-astro-reload` and `data-astro-prefetch="false"` are left alone. Until now no prefetch ran at all on sites without ClientRouter, because the hover warm-up only works with the router. Both starter Base layouts now pass `prefetch="moderate"`, and EmDash's Base turns it off in visual edit mode.

## For sites

Copy `src/lib/speculation-rules.ts` and take the new `SiteShell.astro`. Then pass `prefetch="moderate"` to `<SiteShell>` in your `Base.astro` (EmDash sites: `'off'` when `getRequestContext()?.editMode` is true, as the starter does). Sites that added `<ClientRouter />` keep `prefetch` off. If `astro.config.mjs` turns on Astro's own `prefetch` or `experimental.clientPrerender`, remove them so only one prefetcher runs. On Cloudflare Workers Free, every prefetch counts toward the 100,000 daily requests; a busy site can use `"conservative"`, which waits until a click starts.
