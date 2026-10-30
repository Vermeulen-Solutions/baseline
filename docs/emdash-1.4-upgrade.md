# EmDash 1.4 upgrade

The EmDash foundation now pins `emdash` and its directly used `@emdash-cms/auth` to **1.4.0**. Core brings matching admin, blocks and Gutenberg conversion packages. Astro remains 7.4.0. Static/Sveltia projects do not acquire CMS or forms dependencies. Historical standards certification and earlier audit receipts retain their original versions; this upgrade does not rewrite that evidence.

## Existing sites

Adopt this as a reviewed dependency and source update, preserving site-owned configuration, content, translations, plugins and calibration. Capture the configured database with its actual media and encryption-key recovery references before starting an upgraded application. Rehearse against an isolated restore. Never reset a database to repair upgrade or authentication issues. A successful code build does not migrate hosted records.

Node sites retain SQLite/local media and the Node adapter. Workers sites must pin `@emdash-cms/cloudflare@1.4.0` alongside core 1.4.0: the adapter depends on that exact core version. Do not add it to the Node foundation. At review time the latest Astro Cloudflare adapter is 14.4.3 (Astro `^7.4.0`, Wrangler `^4.125.0`). Choose and verify a site's joint versions rather than upgrading every adapter implicitly. For the adapter-15 configuration path, `@emdash-cms/cloudflare` 1.4.0 supports its `cloudflare.config.ts` Worker Loader setup; that is not a claim of adapter-15 acceptance here.

Workers `auto` migrations now refuse service with 503 when migrations cannot finish, rather than silently returning empty content with 200 as 1.3.0 could. Large migrations can require explicit `emdash migrate` before promotion. Retain the site's normal supported migration mode; use the native status/recovery instructions when required instead of inventing a parallel migration service. No live D1/R2 migration is certified by the Node checks.

## Caching and content behavior

- EmDash hints provide cache tags, without automatic `Last-Modified`. The old timestamp did not cover settings, related lists, deletes or unpublishes. Baseline explicitly supplies `Cache-Control: no-cache` on successful public HTML that has no existing cache policy or session cookie. Private/no-store and deliberate site policies remain authoritative. This browser policy is independent of an optional route cache. Do not manufacture a validator from one entry's date; displayed dates use `entry.data.updatedAt`.
- Cached settings refill and linked menu invalidation fixes supersede the 1.3.0 caveats. Public `getMenu()` omits unavailable targets and their children; edit mode retains unpublished targets. Check real menus when upgrading an existing site.
- Empty optional image/file strings now normalize to `null`; required empty strings fail validation. Imports should use the canonical empty shape. Image-field captions are retained from 1.3.1; media-library captions and per-use captions still have different ownership.
- A second concurrent save against the same revision returns `409 CONFLICT`, including D1/DO/PostgreSQL. Read fresh raw state, preserve unrelated values and reconcile before retrying. Do not remove `_rev` to force a write.
- Media usage with reference fields named `title`/`name` may need the native Settings → Media usage tracking repair. If attention is reported, use `emdash media repair-usage --collection <collection>` once per affected collection. Do not rebuild usage through custom SQL.
- WordPress custom types containing hyphens map to supported underscore collection names. Recheck the importer preview/mapping instead of reusing an old source slug as a destination collection.
- `admin.hiddenNavItems` can hide unused built-in areas. It is navigation configuration, not access control; underlying routes/APIs remain available to permitted roles. The neutral starter does not hide them by default.
- Sandboxed plugin mutations must be awaited within their invocation. Publication after-hooks remain deferred; runtime-host tests can await `host.waitForDeferredTasks()` before inspecting effects or starting another same-entry action. This does not wait for arbitrary unawaited work.

Draft-visibility fixes in 1.3.1 cover terms/translations and MCP unpublished changes for accounts without `content:read_drafts`. Earlier 1.3.0 role receipts did not certify all those paths. Keep least-privilege grants and verify the site's actual native role/MCP journeys; upgrading is not permission to share administrator tokens.

## Optional forms

Set the actual canonical public origin through `SITE_URL`; Baseline passes it to both Astro and EmDash. Native public submissions use the normal browser Origin guard, unlike API probes that explicitly send the custom EmDash header. Do not disable origin checks to make an incorrectly configured preview submit.

The current evaluated target is `@emdash-cms/plugin-forms@0.2.12`, registered through `formsPlugin()` in the EmDash integration. It remains optional, with native `Form`/`FormEmbed` presentation and the native inbox. See [forms adoption](forms-adoption.md) for the exact acceptance and unresolved provider/runtime limits. The latest published package does not contain the proposed registration caps; keep the existing stop condition and source workflow when capacity is required.

For a site opting in, install the exact evaluated version with `npm install --save-exact @emdash-cms/plugin-forms@0.2.12`, add `formsPlugin()` to the existing EmDash plugins array, and render `<Form id="form-id-or-slug" />` from `@emdash-cms/plugin-forms/ui`. Preserve other plugins and complete site-specific acceptance.

The compatibility-named `npm run check:emdash13` now rehearses the installed version and writes a fresh private receipt, preserving historical evidence. The name does not certify a different version.

The explicit local `node tests/forms.integration.mjs` rehearsal installs that exact plugin only into an owned temporary dependency tree, creates synthetic data in a separate app, tests built SSR/client/admin and native role boundaries, and cleans both trees. It is not a build, CI or deployment dependency and never installs the plugin into root `package.json`.

Sources: [core 1.4.0 release](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.4.0), [core 1.3.1 release](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.3.1), [forms 0.2.12 release](https://github.com/emdash-cms/emdash/releases/tag/%40emdash-cms%2Fplugin-forms%400.2.12), [route caching](https://docs.emdashcms.com/deployment/route-caching/). Package pins and API behavior must be rechecked for later upgrades.
