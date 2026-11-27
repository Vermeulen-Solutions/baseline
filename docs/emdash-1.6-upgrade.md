# EmDash 1.6 upgrade

The EmDash foundation now pins `emdash` and its directly used `@emdash-cms/auth` to **1.6.0**. Core brings matching admin, blocks and Gutenberg conversion packages, and `@cloudflare/kumo` 2.19.0. Astro stays on the 7.4 line. Static/Sveltia projects do not acquire CMS or forms dependencies. The [1.5 guide](emdash-1.5-upgrade.md) is retained as history; its rules still apply unless this page says otherwise.

## Existing sites

Adopt this as a reviewed dependency and source update, preserving site-owned configuration, content, translations, plugins and calibration. **This release migrates the database once**: `098_user_last_login` adds a nullable `last_login_at` column to `users`. It runs under the default `auto` migration mode, and no table is added or removed. Capture the configured database with its media and encryption-key recovery references first, and rehearse against an isolated restore as for 1.5. Never reset a database to repair upgrade or authentication issues.

- **Update the whole graph together.** Pin `emdash` and `@emdash-cms/auth` at 1.6.0. Workers sites pin `@emdash-cms/cloudflare@1.6.0`, which requires exactly core 1.6.0 and Kumo 2.19.0; any `@emdash-cms/sandbox-workerd` runner moves to 0.9.8, which depends on core 1.6.0. Core and the adapter must move in one deploy: plugin state is now committed atomically across both. Confirm one installed core copy with `npm ls emdash`. The 1.5 note on npm refusing with `ERESOLVE` from an installed graph still applies: uninstall the adapter, install core, then reinstall the adapter.
- **Plugins that render admin UI need Kumo exactly 2.19.0.** Forms (0.2.14), Field Kit, AI Moderation and AI Search must be updated with core. A site that declares `@cloudflare/kumo` itself moves it to 2.19.0. Plugin admin pages may need changes to `Radio.Group` tests, `DatePicker` style overrides and `Dialog` maximum heights.
- **Run the media usage repair once after the deploy.** "Used in" now also counts links to `/_emdash/api/media/file/` in rich text links, HTML blocks and whole string or URL fields. Existing entries are not re-indexed by themselves: run `npx emdash media repair-usage --all` (with `--url` for a hosted site), the MCP `media_usage_repair` tool with `{ "scope": "all" }`, or `POST /_emdash/api/admin/media-usage/repair`. Full URLs only count when they match the site origin, so set `siteUrl` (or `EMDASH_SITE_URL`) on sites that are not HTTPS or loopback.
- **Apply the template changes below.** Site pages are site-owned, so `sync:baseline` and `site:files` do not bring them.
- **Database reset scripts delete the `-wal` and `-shm` files too.** EmDash now refuses to open a database whose main file is missing while either remains. Baseline's own scripts already handle all three.
- **External sign-in (for example Cloudflare Access) refuses undefined role levels.** Only 10, 20, 30, 40 and 50 are accepted. A user saved with another level cannot sign in until their `role` column is set to one of these.
- **A custom Worker that calls `runScheduledTasks()`** from `emdash/middleware` passes `{ publishUpcomingWithinMs: 70 * 1000 }`. Sites using `createScheduledHandler()` from `@emdash-cms/cloudflare/worker` get this by themselves. On Node.js the scheduler now runs at the start of every minute.

After deployment, `GET /_emdash/api/health` reports the running version. Record a D1 Time Travel bookmark before a Workers deployment as before; see [Cloudflare recovery](cloudflare-backup-restore.md), and rehearse with `npm run db:export-d1` and `npm run db:rehearse`.

## Template changes

Baseline's starter pages carry these changes. A site that built its pages from an earlier Baseline applies them by hand:

- **Set the entry's cache hint before handling a miss.** With a route cache configured, a 404 for missing content can now be cached for up to 60 seconds. `getEmDashEntry()` returns the collection tag in `cacheHint` even when no entry is found, so `if (Astro.cache?.enabled) Astro.cache.set(cacheHint);` placed before `return Astro.rewrite("/404")` purges the cached 404 when the entry is published. Term pages set the taxonomy hint before looking up the term, for the same reason. To keep 404s out of the cache entirely, call `Astro.cache.set(false)` in the 404 page. Cached 404s no longer reach the origin, so they are missing from the admin's 404 counts.
- **Pass the page locale to menus and terms.** On a page in a non-default locale, `getMenu()`, `getMenuWithCacheHint()`, `getTaxonomyTerms()` and their cache-hint forms return default-locale data unless they are given a locale. Pass `{ locale: Astro.currentLocale }`. It is `undefined` while i18n is off, so the call is unchanged on single-language sites.
- **Copy entry data before changing it.** Identical `getEmDashEntry()` calls in one request now return the same object, as `getEmDashCollection()` already did.
- **Type checks.** `Astro.locals.emdash` handler types now match what they return: `delete item.draftRevisionId` no longer type-checks, so destructure instead. `handleMediaUpload` requires `base64` and `contentType` and no longer accepts `url`.

## Behavior to know

- **Media caching.** On sites with a route-cache provider such as `cacheCloudflare()`, media files and eligible resized images are cached for a year and purged when the image is replaced or deleted. Baseline's own middleware and Cloudflare provider used to mark media `immutable` for a year, which kept a replaced image old in browsers; the release after standards 0.8.0 replaces both with a one-hour edge copy that keeps EmDash's header (see [edge cache lifecycle](edge-cache-lifecycle.md)). A Node site with `private-safe-memory-cache.mjs` names its provider `memory`, or EmDash 1.6 puts images in process memory. This applies only to Astro's stock image services (sharp on Node, `image-service-workerd` on Cloudflare); for those, non-canonical `/_image` URLs for EmDash media answer `301`. Astro's `memoryCache()` and custom image services get no automatic media entries.
- **Search.** `search()` scores are normalized to 0–1 within each collection and title matches rank first; keep the returned order and review any score threshold. Partly filled search indexes are no longer repaired by themselves: rebuild one with `POST /_emdash/api/search/rebuild` as an Admin, header `X-EmDash-Request: 1`, body `{"collection":"<name>"}`. Built-in search still needs SQLite or D1.
- **Comment dates** use the site's Timezone setting, or UTC, instead of the server's timezone.
- **Sitemap** `lastmod` moves when SEO metadata changes, and exact redirects now match paths with file extensions such as `/old/report.pdf`.
- **Repeater image sub-fields** respect `validation.allowedMimeTypes`, so a repeater can accept SVG without widening the site's allowlist.
- **Plugins.** Trusted content-editor panels receive `editorDraft`, which reads and patches the unsaved form; see the mirrored `creating-plugins` skill. `media:afterUpload` now fires on replacements too, and sandboxed plugins stop when the host process exits.

## For editors

- **Distraction-free mode is gone**, with its Ctrl+Shift+\\ shortcut. On screens 1024 pixels and wider, **Hide settings** hides the editor's settings panel; the choice is kept per browser.
- **Breadcrumbs** in the admin header replace the back buttons on nested pages, for example Settings > General.
- **More confirmations.** Unpublish, and bulk Publish and Set to draft, now ask first. Enter confirms an action that can be undone and cancels one that cannot.
- **Users** shows the last sign-in for every sign-in method, not only passkeys.
- **Italian, Lithuanian and Vietnamese** join the admin languages. Italian is chosen automatically for browsers that prefer it; leave `it` out of `admin.locales` to exclude it.

Update a site's editor guide where it mentions distraction-free mode; see [editor experience](editor-experience.md).

## Browser tests against the admin

Unpublish and bulk status changes open a confirmation dialog, and Publish and plugin Uninstall dialogs no longer close on an outside click. Tests that clicked through these need the extra confirmation.

## Reviewed adapters

Baseline code that overlaps EmDash behaviour is listed in [the overlap register](emdash-overlap.md). Reviewing it against 1.6 after the release found the media caching above, fixed in the release after 0.8.0.

`scripts/emdash-reviewed.mjs` now names 1.6.0. For 1.6.0 the reviewed facts are: the table catalog is unchanged from 1.5.0 (`users` gains a column, which the catalog does not record); `setup/admin/verify` keeps the session, setup-complete, state and nonce guard order, and only the session start after a successful passkey changed; `export-seed` is unchanged; and multipart `POST /_emdash/api/media` and `GET /_emdash/api/media/{id}` are unchanged, with media deletes now purging the route cache and file reads now cached. The hosted-auth probe accepts 1.5.0 as well, because its route did not change between the two. Snapshots, ledgers and receipts written by a 1.5.0 adapter carry that identity and are refused by the 1.6.0 adapter; regenerate them rather than editing the identity.

## Optional forms

The evaluated target is `@emdash-cms/plugin-forms@0.2.14`, which requires Kumo 2.19.0 and therefore core 1.6.0. It remains opt-in: install the exact version, add `formsPlugin()` to the existing plugins array and render `<Form>` from `@emdash-cms/plugin-forms/ui`. See [forms adoption](forms-adoption.md).

## Evidence for this upgrade

EVIDENCE

Sources: [EmDash 1.6 announcement](https://emdashcms.com/blog/emdash-1-6), [core 1.6.0 release](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.6.0), [update guide](https://docs.emdashcms.com/deployment/updating/). Package pins and API behavior must be rechecked for later upgrades.
