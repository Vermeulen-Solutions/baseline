# Where Baseline overlaps EmDash

Baseline's own code that intercepts, replaces or depends on EmDash behaviour: routes under `/_emdash/`, media URLs, response headers EmDash also sets, and settings EmDash manages. An EmDash release can change that behaviour without breaking a single Baseline test, because the tests check Baseline's side only. EmDash 1.6 did this: it made media replaceable under the same URL with purgeable caching, and Baseline's middleware still marked every media URL immutable for a year.

**On every EmDash upgrade**, read the release notes item by item against this table. For each row an item touches, read the installed EmDash source the row names, decide whether Baseline's code is still right, and exercise the changed behaviour itself in a rehearsal (replace an image, publish a slug that answered 404, sign in), not only the test suite. Record the outcome in the upgrade guide (`docs/emdash-<version>-upgrade.md`).

`tests/emdash-overlap.test.mjs` fails when a file under `src/` starts using `/_emdash/` paths, `/_image`, `Cache-Control`, `robots.txt` or EmDash's exclusive hooks without a row here, and when a row names a file that no longer exists. Development fixtures (`src/dev/`) and the styleguide page are exempt.

| File | What it does with EmDash | Re-check on an upgrade |
| --- | --- | --- |
| `src/middleware.ts` | Edge copy of media (through `media-edge-cache.mjs`), caps the native `/robots.txt` cache, sets `no-cache` on public HTML without a policy, adds security headers and the optional CSP. | Media and robots headers EmDash sends (`src/astro/routes/api/media/file/[...key].ts`, `src/astro/image-endpoint.ts`, the robots route); staging status. |
| `src/lib/media-edge-cache.mjs` | Keeps a one-hour edge copy of `/_image`, `/_emdash/api/media/file/*` and `/publicEventImage`, never overriding EmDash's browser header. | Whether media can still be replaced under the same URL; EmDash's media cache headers and route-cache tags (`src/media/image-endpoint.ts`). |
| `src/lib/cloudflare-cache-provider.mjs` | Route-cache provider: per-build HTML edge keys, private-request bypass, media through `media-edge-cache.mjs`, never into the in-isolate memory cache. | What EmDash asks the route cache to keep (`cache.set` calls, `routeCacheProvider` name checks) and how it purges (`invalidateRouteCache`). |
| `src/lib/private-safe-memory-cache.mjs` | Node route-cache provider with a private-request bypass; must be named `memory` in the site config. | EmDash's checks on the provider name (`virtualConfig.routeCacheProvider`). |
| `src/lib/robots-cache.ts` | Caps the native `/robots.txt` cache at one hour and keeps the staging `no-store`. | The headers of EmDash's robots route and of the staging status. |
| `src/lib/content-security-policy.ts` | Skips the admin and API (`/_emdash/*`) and editing sessions when computing the public CSP. | Admin and visual-editing scripts and inline code EmDash injects. |
| `src/lib/speculation-rules.ts` | Prefetch rules that exclude `/_emdash/` and editing sessions. | New admin or API paths, and the visual editor's query parameters. |
| `src/lib/image-source.ts` | Recognises EmDash media URLs (`/_emdash/api/media/file/`) for responsive images. | Media URL shape and `getPublicMediaUrl`. |
| `src/lib/photo-gallery.ts` | Builds media URLs from gallery blocks and storage keys. | Gallery block shape and media URL shape. |
| `src/components/EditorialImage.astro` | Builds media URLs from storage keys and opts the page out of the route cache. | Media URL shape, `getPublicMediaUrl`, cache hints. |
| `src/pages/llms.txt.ts` | Sets its own `Cache-Control` on a public text route. | Whether EmDash starts serving `/llms.txt` itself. |
| `src/pages/site.webmanifest.ts` | Sets its own `Cache-Control`; reads site settings with a cache hint. | Site settings shape (logo, favicon, title). |
| `src/plugins/editor-ui/admin.tsx` | Admin dashboard card linking to admin routes (`/_emdash/admin/...`). | Admin routes and the plugin admin API. |
| `src/plugins/editor-ui/config.ts` | The admin routes the editor's task card links to. | Admin route names. |
| `src/plugins/editorial-order/admin.tsx` | Calls the content API (`/_emdash/api/...`) from a plugin admin page; imports `@cloudflare/kumo`. | Content API shape, `_rev` conflicts, the Kumo version EmDash's admin pins. |
| `src/layouts/Base.astro` | Renders `<EmDashHead>`, reads the menu and site settings with cache hints, owns the canonical link. | Head output (metadata, staging robots), menu and settings APIs, locale handling. |
| `src/pages/posts/[slug].astro`, `src/pages/[slug].astro`, `src/pages/category/[slug].astro`, `src/pages/tag/[slug].astro` | Detail and term pages: cache hint before the 404 rewrite. | 404 caching and cache-hint tags. |
| `scripts/emdash-reviewed.mjs` | The EmDash release the version-bound adapters were reviewed against (SQLite metadata, seed export, REST media, hosted-auth probe). | Follow its own comment: table catalog, `setup/admin/verify`, `export-seed`, media REST routes. |
