# Edge caching and deployment lifecycle

The Node/SQLite starter enables no cache provider by default. This is the optional Workers blueprint, verified against EmDash 1.3.0 source and [official route caching](https://docs.emdashcms.com/deployment/route-caching/). Query hints, object-cache TTL, browser caching and edge HTML caching are separate contracts.

## Explicit route policy

Use `cacheCloudflare()` from `@astrojs/cloudflare/cache`, not the removed `cloudflareCache()`. In a Cloudflare site, configure `cache: { provider: cacheCloudflare() }`, `toolbar: 'client'` inside `emdash(...)`, and an explicit rule for **every** public route. For example:

```js
routeRules: {
  '/': { maxAge: 300, swr: 0, tags: ['posts', 'pages', 'all'] },
  '/posts': { maxAge: 300, swr: 0, tags: ['posts', 'all'] },
  '/posts/[slug]': { maxAge: 300, swr: 0, tags: ['posts', 'all'] },
  '/category/[slug]': { maxAge: 300, swr: 0, tags: ['posts', 'all'] },
  '/tag/[slug]': { maxAge: 300, swr: 0, tags: ['posts', 'all'] },
  '/[slug]': { maxAge: 300, swr: 0, tags: ['pages', 'all'] },
  '/robots.txt': { maxAge: 3600, swr: 0, tags: ['emdash:settings', 'all'] },
}
```

Adapt rules to the site's inventory, including sitemaps and locale routes. Never use a root catch-all (`/[...slug]`) that catches admin/API paths. An EmDash settings/menu hint alone can make an unruled response cacheable with the provider's default lifetime (currently two hours for 200). Hints do not set a TTL. Register all entry, collection, settings, menu, taxonomy and widget hints; if a lookup has no supported hint, opt out with `Astro.cache.set(false)`.

**No stale-while-revalidate for HTML:** `swr: 0`, no `stale-if-error` fallback to old HTML, and no independent Cache Everything rule reintroducing staleness. Use browser `Cache-Control: no-cache` for public HTML so returning visitors revalidate. Asset hashes change on deploy; the installed middleware makes validators build-aware, but this alone cannot preserve previously referenced assets. JSON/data routes may make a separate SWR decision; never copy that policy into HTML.

EmDash invalidates built-in tags on live content/settings/menu/taxonomy changes. Matching hints are essential. `all` is a custom emergency tag and requires an authenticated invalidation path; do not expose a public purge endpoint. Purges can fail/rate-limit: 300 seconds is an accepted edge lifetime, not an instant freshness guarantee. Confirm published edits and shared navigation changes on the real domain. Keep deployment-version cache keys; do not enable cross-version caching without a separately verified purge strategy.

Never cache admin, auth/setup, API mutations, form/confirmation responses, session-specific pages, previews or edit mode (`_edit`). Preserve private/no-store and Set-Cookie handling. `toolbar: 'client'` lets signed-in editors enter uncached editing from shared anonymous HTML. Test anonymous warm → editor → anonymous, including HTML bodies and session artifacts. Do not assume a Worker can inspect cookies before a front-of-Worker cache hit.

## Seven-day asset retention

Workers deploys versioned asset manifests; keeping old Worker versions is **not** proof that the current version serves every old asset URL. Preserve exact filenames/bytes from recent builds in the current asset manifest, or serve an immutable object-storage/CDN fallback under the same public URLs. Never lowercase hashes/storage keys.

The repository's offline tool supports the first strategy:

```sh
npm run build
npm run assets:retain -- --assets dist/client/_astro --archive <persistent-private-site-and-environment-archive>
# Review receipt, run asset checks, then deploy this merged artifact.
```

Use the actual adapter output directory. Run **once per freshly cleaned build**, after building and before uploading. The archive must persist across CI jobs; a disposable runner directory is insufficient. Serialize access per site/environment; concurrent runs are unsupported. It archives only the new build, verifies SHA-256 of recent archived files, carries forward the preceding seven days without refreshing their ages, and fails on filename/byte collisions or corrupt archives. It does not delete archives, upload to R2 or configure hosting. Store archives privately and prune releases older than the retention/rollback window through a separately reviewed storage policy. If retention exceeds host asset-count/size limits, use the immutable fallback strategy rather than silently shortening the window. Retained JS may contain superseded code: emergency security removals require a deliberate purge/reload plan.

Before promotion and after deploy, load representative HTML plus its same-origin styles/scripts/preloads and CSS imports/fonts/images; require 200 and correct content types. Also fetch asset URLs captured from the **previous** release. Check nested JS imports and lazy chunks in a real browser; an HTML crawl alone cannot prove these. A failed asset check blocks promotion or triggers rollback. `npm run audit:html` and the migration URL/media audit cover structural checks, not full browser asset certification.

## URL and robots boundaries

`src/middleware.ts` offers build-time `NORMALIZE_PAGE_URLS=1`. Enable only after confirming lowercase ASCII slugs/routes and preserving old links with redirects. GET/HEAD pages redirect 301 to lowercase/slash-free URLs while retaining query bytes. The helper skips reserved underscore paths (`/_astro`, `/_emdash`, `/_image`, etc.), `/api`, `/uploads`, any dot/extension-bearing or percent-encoded path, repeated slashes, and preview/edit queries. Other case-sensitive custom endpoints must be excluded before enabling. Never install a global Cloudflare lowercase/trailing-slash transform: it runs before this middleware and can corrupt assets regardless of these guards. For an edge implementation use an explicit public page allowlist, with the same exclusions.

The middleware caps native `/robots.txt` browser freshness at one hour; configure the edge rule above too. EmDash's native route uses 24 hours. Link robots to settings invalidation and test an actual change. If custom `seo.robotsTxt` contains any `Sitemap:` directive, EmDash stops appending its own: list `/sitemap.xml` and every custom sitemap manually. Core sitemaps cover collection entries; inventory home/taxonomy/author hubs separately.

## Placement, scheduling and parity

The starter emits additive BreadcrumbList graphs for posts and taxonomy pages, and a standalone Organization on the home page. `Base` passes typed breadcrumbs into EmDash's page context and serializes additional graphs with `safeJsonLdSerialize`; EmDash retains WebSite/BlogPosting and editor/plugin metadata ownership. A personal publisher should disable the homepage `organization` prop; add verified logo/social identities only when known. If a metadata plugin owns these additional types, pass `breadcrumbs={[]}`/`organization={false}` to avoid duplicates. NewsArticle, review markup and a 48-hour news sitemap are site-specific publication features, not starter defaults. Validate one page per real template with the Rich Results Test; schema.org validity alone does not establish Google's eligibility. For a strict CSP, register the final extra JSON-LD script hashes through Astro's CSP API when integrating that policy, alongside other dynamic scripts.

Avoid an unmeasured Targeted Placement pin. Start from the adapter default; evaluate Smart Placement using site latency/CPU and read-after-write tests. Smart Placement is an explicit option, not another name for default placement. The field article contains conflicting placement statements, and its coalescing experiment does not isolate a platform defect. D1 sessions/coalescing remain a measured site decision; coalescing requires a session. Record configuration, concurrency, cold/warm samples and consistency observations before adopting either optimization. Keep the Node foundation independent of Cloudflare cost or binding assumptions.

Check the selected environment's `triggers.crons`, `scheduled: createScheduledHandler()` from `@emdash-cms/cloudflare/worker`, and D1/R2/secret parity. Schedule a disposable post 5–10 minutes ahead and confirm the trigger in `wrangler tail`, publication/query visibility, and public lists/detail pages after their cache budget. Official [cron documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/) warns of propagation delay; the field report observed longer. Record real UTC times/log IDs and leave acceptance pending until observed, then remove the test content. No inferred pass from config alone.

`objectCache.defaultTtl` defaults to 3600 seconds (KV minimum 60). Due entries become visible at query time without necessarily writing the collection; cached query results can delay visibility. Cron publication purges route tags, but that does not make every cached query instantly fresh. Choose TTL and HTML lifetime to meet the site's publishing SLA and test both. Preview caching/purge/auth origins may differ from production: check forms, sender settings, webhook domain allowlists, bindings, key availability and publish/purge separately after deploy. Record presence/version IDs without dumping secrets.
