# Edge caching and deployment lifecycle

The Node/SQLite starter enables no cache provider by default. This is the optional Workers blueprint, reviewed against EmDash 1.4.0 source and [official route caching](https://docs.emdashcms.com/deployment/route-caching/). Query hints, object-cache TTL, browser caching and edge HTML caching are separate contracts.

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

**No stale-while-revalidate for HTML:** `swr: 0`, no `stale-if-error` fallback to old HTML, and no independent Cache Everything rule reintroducing staleness. Use browser `Cache-Control: no-cache` for public HTML so returning visitors revalidate. EmDash 1.4 hints no longer supply automatic modification validators or implicit browser revalidation. Baseline supplies no-cache on successful public HTML without an existing policy or session cookie. Asset hashes change on deploy; browser policy alone cannot preserve previously referenced assets. JSON/data routes may make a separate SWR decision; never copy that policy into HTML.

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

Use the actual adapter output directory. Run **once per freshly cleaned build**, after building and before uploading. The archive must persist across CI jobs; a disposable runner directory is insufficient. The tool takes an exclusive .retention.lock per archive and fails a concurrent invocation before output changes. It archives only the new build, verifies SHA-256 of recent archived files, carries forward the preceding seven days without refreshing their ages, and fails on filename/byte collisions or corrupt archives. It publishes each complete generation by an atomic same-filesystem rename. Failed normal runs remove only their generated staging tree; committed generations are never deleted by this tool. It does not upload to R2 or configure hosting. Store archives privately and prune releases older than the retention/rollback window through a separately reviewed storage policy. If retention exceeds host asset-count/size limits, use the immutable fallback strategy rather than silently shortening the window. Retained JS may contain superseded code: emergency security removals require a deliberate purge/reload plan.

A killed process can leave a lock and .pending-<uuid> staging tree. Never expire a lock based only on age. Inspect its owner and ensure the old job has stopped; on the same host the recovery command refuses a live PID. With deployment jobs paused, run `npm run assets:retain -- --recover-lock <recorded-token> --archive <same-archive>`. For another host, independently establish that its job stopped before recovery; the CLI cannot infer cross-host liveness. Recovery is a serialized agent/operator step. Pending trees are quarantined and reported, never treated as completed generations; prune them separately after inspection.

The output contains a small non-secret .baseline-retention.json marker. An existing marker means processed or interrupted output: rebuild the whole artifact cleanly, then rerun retention. Do not delete just the marker or archive merged output as a fresh generation. This keeps inherited asset ages bounded after retries.

Before promotion and after deploy, load representative HTML plus its same-origin styles/scripts/preloads and CSS imports/fonts/images; require 200 and correct content types. Also fetch asset URLs captured from the **previous** release. Check nested JS imports and lazy chunks in a real browser; an HTML crawl alone cannot prove these. A failed asset check blocks promotion or triggers rollback. `npm run audit:html` and the migration URL/media audit cover structural checks, not full browser asset certification.

## URL and robots boundaries

`src/middleware.ts` offers build-time `NORMALIZE_PAGE_URLS=1`. Enable only after confirming lowercase ASCII slugs/routes and preserving old links with redirects. GET/HEAD pages redirect 301 to lowercase/slash-free URLs while retaining query bytes. The helper skips reserved underscore paths (`/_astro`, `/_emdash`, `/_image`, etc.), `/api`, `/uploads`, any dot/extension-bearing or percent-encoded path, repeated slashes, and preview/edit queries. Other case-sensitive custom endpoints must be excluded before enabling. Never install a global Cloudflare lowercase/trailing-slash transform: it runs before this middleware and can corrupt assets regardless of these guards. For an edge implementation use an explicit public page allowlist, with the same exclusions.

The middleware caps native `/robots.txt` browser freshness at one hour; configure the edge rule above too. EmDash's native route uses 24 hours. Link robots to settings invalidation and test an actual change. If custom `seo.robotsTxt` contains any `Sitemap:` directive, EmDash stops appending its own: list `/sitemap.xml` and every custom sitemap manually. Core sitemaps cover collection entries; inventory home/taxonomy/author hubs separately.

## Placement, scheduling and parity

The starter's site-owned native baseline-metadata hook contributes BreadcrumbList and homepage Organization through EmDashHead. Core applies safe JSON-LD serialization, contribution-ID deduplication and Astro CSP hashes; there is no separate script renderer. WebSite/BlogPosting remain core-owned and the entry SEO panel still overlays the page context before hooks. In astro.config.mjs, configure options.organizationPaths (empty for a personal publisher/another owner) and options.breadcrumbs (false for another owner); include actual localized home paths when needed. Hooks run at priority 10000 so ordinary plugin hooks can override the stable breadcrumbs/organization IDs. Deduplication is first-wins by ID, not schema type: use shared IDs or explicit ownership options for third-party plugins with different IDs. Sandboxed and native page:metadata contributions use the same core pipeline; this built-in site hook needs no sandbox/registry installation.

NewsArticle, reviews and a 48-hour news sitemap remain publication-specific. Validate real templates in Rich Results Test; schema validity alone does not establish eligibility. The local metadata rehearsal enables Astro CSP with buffered Node SSR and checks hashes on the exact final emitted JSON-LD, including a hostile string and a competing fixture hook. It does not install or certify any registry plugin.

**Strict CSP and streaming:** on the installed Astro 7.4.0 / Node adapter 11.1.8, the default streamed response can finalize its CSP header before asynchronous EmDashHead hashes settle. Enabling security.csp alone did not pass the actual-response hash test. For a Node site adopting strict CSP, pair it with node({ mode: 'standalone', experimentalDisableStreaming: true }) and rerun the production metadata rehearsal; measure the buffering cost. This adapter option is verified in its installed types/runtime. Run `node tests/metadata.integration.mjs --out .emdash/checks/metadata-runtime.json` locally for that rehearsal. The starter enables neither strict public CSP nor this buffering option by default. Other adapters/streaming layouts need their own response-level verification. Core hash registration is not by itself proof that a deployed header contains the final hashes, and JSON-LD hash coverage is not whole-site CSP conformance.

Run `npm run check:cache` locally after cache-contract changes. It builds a disposable Node/SQLite site with Astro memory route caching, exercises real cache HIT/MISS responses and authenticated publish/menu/taxonomy/settings invalidation, checks editor isolation and the non-consuming native auth preflight, then rebuilds code to verify absent automatic validators, obsolete conditional-date handling and old/current retained CSS. It never changes the working CMS, sends provider mail or accesses a cloud account. Receipts stay under ignored .emdash/checks/cache-*; a pass establishes Node memory-provider behavior, not Workers Cache/purge certification.

Avoid an unmeasured Targeted Placement pin. Start from the adapter default; evaluate Smart Placement using site latency/CPU and read-after-write tests. Smart Placement is an explicit option, not another name for default placement. The field article contains conflicting placement statements, and its coalescing experiment does not isolate a platform defect. D1 sessions/coalescing remain a measured site decision; coalescing requires a session. Record configuration, concurrency, cold/warm samples and consistency observations before adopting either optimization. Keep the Node foundation independent of Cloudflare cost or binding assumptions.

Check the selected environment's `triggers.crons`, `scheduled: createScheduledHandler()` from `@emdash-cms/cloudflare/worker`, and D1/R2/secret parity. Schedule a disposable post 5–10 minutes ahead and confirm the trigger in `wrangler tail`, publication/query visibility, and public lists/detail pages after their cache budget. Official [cron documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/) warns of propagation delay; the field report observed longer. Record real UTC times/log IDs and leave acceptance pending until observed, then remove the test content. No inferred pass from config alone.

`objectCache.defaultTtl` defaults to 3600 seconds (KV minimum 60). Due entries become visible at query time without necessarily writing the collection; cached query results can delay visibility. Cron publication purges route tags, but that does not make every cached query instantly fresh. Choose TTL and HTML lifetime to meet the site's publishing SLA and test both. Preview caching/purge/auth origins may differ from production: check forms, sender settings, webhook domain allowlists, bindings, key availability and publish/purge separately after deploy. Record presence/version IDs without dumping secrets.
