# Independent Audit — emdashnow.com Production Findings vs. `emdash-baseline`

**Date:** 2026-10-20  
**Scope:** Read-only audit. No source, scripts, or project documentation were modified while investigating.  
**Repository state:** `emdash` 1.3.0, Astro 7.4.0 (root Node/SQLite foundation).  
**Verification limits:** No live Cloudflare account, D1/R2 binding, or browser was exercised. Deployment findings are source/documentation findings, not cloud certification.

**URL correction:** three requested slugs return HTTP 404. The live site uses:

| Requested | Actual canonical URL |
|---|---|
| `/emdash-seo-in-practice` | `/emdash-seo-built-in-and-gaps` |
| `/emdash-forms-reviewed` | `/emdash-forms-review` |
| `/owning-your-newsletter-list-on-emdash` | `/own-your-newsletter-list-emdash` |
| `/emdash-1-3-governance` | `/emdash-1-3-released` |

---

## Verdict Summary

| # | Topic | Baseline assessment | Highest-risk gap |
|---|---|---|---|
| 1 | Edge caching, SWR, asset retention, placement | **[DEFICIENT / MISSING]** | No cache policy, no SWR prohibition, no previous-build asset retention, no placement guidance |
| 2 | Disaster recovery vs. `site export` | **[DEFICIENT / MISSING]** | Export is labeled a backup and used under `.emdash/backups/`; Cloudflare DR is absent; `EMDASH_SECRET` is wrong |
| 3 | Production DB reset / setup wizard / cutover ordering | **[PARTIALLY ALIGNED]** | Passkey-origin risk is covered; public setup-wizard reopening and first-run domain ordering are not |
| 4 | Boolean `1`/`0` coercion | **[PARTIALLY ALIGNED]** | One defensive reader exists; no shared helper or rule; raw repository reads return `0/1` |
| 5 | URL normalization and asset case | **[DEFICIENT / MISSING]** | No warning to exclude `/_astro`, media, or CMS storage keys from lowercasing |
| 6 | Forms, CSRF, scanners, webhook domain filtering | **[PARTIALLY ALIGNED]** for CSRF/spam; **[DEFICIENT / MISSING]** for scanner/double-opt-in/domain filtering | No click-to-confirm rule; no shared-provider domain filter |
| 7 | Scheduler verification | **[DEFICIENT / MISSING]** | Cron is configured in a reference file but never verified after deploy |
| 8 | SEO and structured data | **[PARTIALLY ALIGNED]** | No BreadcrumbList, standalone Organization, NewsArticle, news sitemap, empty-taxonomy noindex, canonical redirects, or robots cache rule |

---

# 1. Edge Caching, SWR, Asset Retention, and Placement

## 1.1 Real-world hazard

From [“What we learned running emDash in production”](https://emdashnow.com/running-emdash-in-production):

> “**27 ms** median response for a cached page (19 of 20 requests served from the edge)”
>
> “**5 min** maximum age of a cached page; a publish purges the affected pages immediately”
>
> “With no edge caching, every edit was visible immediately, but every visit paid for a full render: on emDash 1.2, the median article took 1.29 seconds to start arriving, and one request in twenty took more than four.”

Two specific traps:

> “**Serving stale while refreshing.** A common caching setting returns the old page while fetching a new one in the background. Combined with a deployment, it kept serving pages that referenced the previous build's stylesheet for minutes after the new version was live. We turned that setting off.”

> “**Deployments delete old files.** A cached page from before a deploy still points to the previous build's assets, which no longer exist. We now carry the previous build's files forward for seven days, and the deploy fails if any page references a file that does not load.”

Placement and coalescing:

> “Worker location | Pinned next to the database (Targeted Placement) | Every page render makes many database round trips; distance multiplies them”

> “the documentation moved during the build: it now says emDash's query batching (“coalescing”) is compatible with pinned placement. We measured it rather than adopting it. Render times overlapped the default configuration within run-to-run noise, and one write was not visible to a read that followed it, so we kept the default.”

Previews are not production:

> “Preview deployments have no edge cache and no purge, so anything that depends on caching can only be proven on the live site.”

## 1.2 Current baseline state

**Cache hints exist; cache policy does not.**

- `src/layouts/Base.astro:37-41` registers settings and menu hints:
  ```astro
  const { data: menu, cacheHint: menuCacheHint } = await getMenuWithCacheHint("primary");
  if (Astro.cache?.enabled) {
      Astro.cache.set(settingsCacheHint);
      Astro.cache.set(menuCacheHint);
  }
  ```
- Content routes register entry/collection hints, e.g. `src/pages/posts/[slug].astro:22-26`, `src/pages/category/[slug].astro:18`.
- `astro.config.mjs:18-54` contains **no** `cache` configuration, no route rules, no `redirects`, and no edge-cache policy. It is the Node/SQLite foundation; Cloudflare is only an optional documented target (`docs/production-deployment.md:5`).
- `docs/site-standards-audit.md:43` explicitly says cache-hint completeness “stays required/unverified” when caching is configured.

**No cache/purge/SWR guidance in the Cloudflare deployment section.**

`docs/production-deployment.md:39-80` lists only four “Critical Edge Gotchas”: D1 column limit, media upload disconnect, persistent sessions, and Images binding. A search of that file and the cutover skill finds **no** `stale-while-revalidate`, `purge`, `Workers Cache`, `Targeted Placement`, or `Smart Placement` guidance.

The only `stale-while-revalidate` occurrence in the repository is an unrelated plugin *JSON route* example:

- `.agents/skills/creating-plugins/references/api-routes.md:151`
  ```ts
  cacheControl: "public, max-age=60, stale-while-revalidate=300",
  ```
  This is not HTML guidance and does not warn against SWR on rendered pages.

**Coalescing is partially covered; placement is not.**

- `docs/emdash-1.3-upgrade-review.md:97-101`:
  > “On a D1 target evaluate `d1({ binding: "DB", session: "auto", coalesce: true })` against that adapter's installed API. Coalescing needs a session and remains experimental; explicitly await a read before any concurrent write that must not affect it. Measure actual request/query latency on Workers…”
- No occurrence of “Targeted Placement” or “Smart Placement” anywhere in `docs` or `.agents/skills`.

**No asset-retention mechanism or deploy check.**

`docs/production-deployment.md:174-183` promotes staging to production with migrations and `wrangler deploy`; there is no previous-build asset copy, no 7-day retention, and no post-deploy broken-asset gate. No `_astro` retention guidance exists in the deployment docs.

**Platform source confirms the asset/cache interaction the article describes.**

- `node_modules/emdash/src/astro/middleware.ts:696-721`:
  > “`CacheHint.lastModified` describes the content, but the response also depends on the build: `/_astro/*` names are content-hashed, and a deployment only serves its own. Without the build dimension a code-only deploy answers a returning visitor's conditional request with 304, leaving them on HTML whose assets 404.”
- `node_modules/emdash/src/astro/integration/runtime.ts:673-695` documents that the default `toolbar: "server"` injects editor HTML server-side; behind a shared cache, “editors often receive the cached anonymous variant — without the toolbar”. Baseline does not set `toolbar: "client"` in `astro.config.mjs:47-53`.

## 1.3 Assessment

**[DEFICIENT / MISSING]** for the operational cache policy, SWR prohibition, asset retention, placement, and preview-parity guidance.

Cache-hint instrumentation itself is **[ALIGNED]** and is the strongest part of the current baseline.

## 1.4 Remediation specification

Add a new section to `docs/production-deployment.md` (after §2D) titled **“E. Edge cache policy, SWR and asset retention”** with these exact rules:

1. **Pick one HTML policy and record it.**
   - Recommended starting point: `Cache-Control: public, max-age=300` (or the equivalent Workers Cache TTL), purge affected URLs on publish.
   - Verify purge on the live custom domain, not staging/preview. State: “Preview deployments have no edge cache and no purge.”
2. **Never use `stale-while-revalidate` for HTML.** Add an explicit line:
   > Do not set `stale-while-revalidate` for rendered HTML. A deploy plus SWR can serve HTML that references deleted content-hashed assets.
   - Scope this to HTML only; plugin JSON routes may use SWR.
3. **Retain previous build assets for 7 days.**
   - Before deploy, copy the previous build's `dist/_astro/` into the new `dist/_astro/` (`rsync --ignore-existing` or equivalent); content-hashed names make this additive.
   - Or retain the previous Worker version's assets under the platform's version/asset-retention mechanism, if available.
   - Retain at least the last 7 daily builds.
4. **Fail the deploy on a broken reference.**
   - Add `scripts/check-live-assets.mjs` (or a `verify:deploy` script) that:
     - fetches `/`, a content page, and a listing page from production;
     - extracts every `src`/`href` beginning `/_astro/` and `/_emdash/api/media/file/`;
     - issues `GET` (not only `HEAD`) and fails on non-2xx/3xx;
     - runs after deploy and before promotion is declared complete.
5. **Set the editor toolbar mode when full-page caching is enabled.**
   - In `astro.config.mjs`, inside `emdash({...})`, add:
     ```js
     toolbar: "client",
     ```
   - Document why: server-injected editor chrome is session-specific and must not be cached; the client bootstrap keeps anonymous HTML identical.
6. **Add placement/coalescing guidance.**
   - State: default placement is not automatically wrong; “Targeted Placement” can reduce DB round-trip latency but must be measured.
   - Test with cache-miss renders, not cached hits; record p50/p95 server time, query count, and a write-then-read canary.
   - If enabling coalescing: `d1({ binding: "DB", session: "auto", coalesce: true })`; await a read before a concurrent write that must observe it. Keep it opt-in until measured.
7. **Add an acceptance checklist item:**
   - cached response `age`/`cf-cache-status` observed;
   - publish purge observed;
   - old deploy's HTML still resolves its assets;
   - editor toolbar appears only for authenticated editors after anonymous traffic warms the cache.

---

# 2. Disaster Recovery vs. Site Export

## 2.1 Real-world hazard

From the production article:

> “One finding from that work changes how owners should think about backups: emDash's built-in export is not a restore. A site comes back from the database's own recovery point or from a full database dump, together with the media and the encryption key — so those three, not the export file, are what a backup plan has to protect.”

Operations table:

> “**Backups** — Point-in-time recovery for 30 days, plus a weekly encrypted copy stored outside Cloudflare. A full restore was rehearsed.”

> “**Migrations** — Database changes run in the deploy pipeline after a recovery point is recorded; the live site refuses to serve rather than change its schema mid-request.”

## 2.2 Current baseline state

**The export is presented as a backup artifact.**

- `docs/production-deployment.md:164-171`:
  ```bash
  # 1. Export production snapshot into a self-contained package (entries, media, schema, settings)
  npx emdash site export ... > .emdash/backups/prod-clone.zip
  # 2. Import into the staging environment ...
  ```
  It is under `.emdash/backups/` and described as a “snapshot”, with no warning that it is not a restore.
- `docs/prompt-library.md:368-371` and `:413-416` repeat the same pattern (`prod-clone.zip`, `prod-latest.zip`) under backup paths.

**The only exclusion warning is buried in the setup skill.**

- `.agents/skills/emdash-site-setup/SKILL.md:98-100`:
  > “A site package carries the content model, entries, editorial history, supported settings, and ready media bytes. The target content area must be empty.”
  > “Site packages exclude users, credentials, secrets, plugin state/storage/settings, and some site-specific settings.”

  This is accurate but says “excludes”, not “therefore not disaster recovery”.

**The Node DR runbook is good, but only for Node.**

- `docs/node-backup-restore.md:11-25` defines the triple set: consistent SQLite snapshot, complete `uploads/`, and `.env.production` “Authentication secrets, encryption keys, port configuration”.
- `docs/node-backup-restore.md:90-93` defines hourly/daily/weekly retention and off-site transfer.
- `docs/node-backup-restore.md:142-149` compares snapshots/seeds/schema/debug pulls — but **does not list `emdash site export` at all**.
- `docs/node-backup-restore.md:146` claims the DR bundle restores “full production state”; that is only true for the Node deployment and only if the encryption key is present.

**Cloudflare has no DR runbook.**

- `docs/production-deployment.md:39-80` covers Cloudflare deployment but has no backup/PITR section.
- `.agents/skills/emdash-production-cutover/SKILL.md:134` only says:
  > “Confirm Backup Schedule: Verify automated daily Cloudflare D1/R2 or SQLite backups.”

  No D1 Time Travel, no R2 media restore, no key escrow, no restore rehearsal.
- `docs/prompt-library.md:400-401` mentions D1 Time Travel only inside the emergency rollback prompt:
  ```bash
  npx wrangler d1 time-travel restore <database-binding> --timestamp="..."
  ```
  It is not part of a backup/restore plan.

**Platform source states the actual scope.**

- `node_modules/emdash/src/api/handlers/backup.ts:9-18`:
  > “Deliberately NOT included: Users, sessions, credentials, API/OAuth tokens … Secrets … Media binaries (metadata only …).”
  > “For full point-in-time database recovery on Cloudflare, D1 Time Travel covers the last 30 days out of the box; these backups complement it with user-holdable, longer-lived archives.”
- `.agents/skills/creating-plugins/references/storage.md:211-213`:
  > “`EMDASH_ENCRYPTION_KEY` may contain a comma-separated rotation list… Restoring the database without every key referenced by its encrypted settings leaves those values unreadable.”

**Documentation defect: the wrong secret name.**

- `docs/production-deployment.md:32`:
  ```text
  - `EMDASH_SECRET`: Generated via `npx emdash secrets generate`.
  ```
- The installed CLI generates `EMDASH_ENCRYPTION_KEY`:
  `node_modules/emdash/src/cli/commands/secrets.ts:6`:
  > “`emdash secrets generate` — emits a fresh `EMDASH_ENCRYPTION_KEY`.”
- `EMDASH_SECRET` does not appear anywhere in the installed `emdash` package. Following this line leaves plugin-secret encryption unconfigured or uses an unrecognized variable.
- `.agents/skills/emdash-site-setup/SKILL.md:72` correctly names `EMDASH_ENCRYPTION_KEY`.

## 2.3 Assessment

**[DEFICIENT / MISSING]** for:
- an explicit “site export is not DR” statement;
- Cloudflare D1 PITR/R2/key triad;
- a Cloudflare restore rehearsal;
- correct key naming.

**[PARTIALLY ALIGNED]** for the Node triple-set and factual exclusion list.

## 2.4 Remediation specification

1. **Fix the key name immediately.**
   - Replace `docs/production-deployment.md:32` with:
     ```text
     - `EMDASH_ENCRYPTION_KEY`: Generated via `npx emdash secrets generate`.
     ```
   - Add a note: “`EMDASH_AUTH_SECRET` is a separate optional secret; do not substitute `EMDASH_SECRET`.”
   - Search all docs for `EMDASH_SECRET` and remove it.

2. **Add an explicit export warning.**
   - In `docs/production-deployment.md` §3C, before the commands:
     > `emdash site export` is a content/transfer package, not a disaster-recovery backup. It excludes users, passkeys, credentials, plugin secrets/state, and some settings; the import target must be empty. Restore production from D1 Time Travel/full D1 dump + R2 media + `EMDASH_ENCRYPTION_KEY`, not from this file.
   - Rename the output path from `.emdash/backups/prod-clone.zip` to `.emdash/transfers/prod-clone.zip` in `production-deployment.md` and `prompt-library.md`.
   - Add a row to `docs/node-backup-restore.md:142-149`:

     | `emdash site export` | Staging/content transfer | Entries, media, schema, supported settings | **NO** — excludes auth, users, plugin secrets/state; target must be empty |

3. **Create `docs/cloudflare-backup-restore.md`** with the three pillars:
   - **Database:** D1 Time Travel (30-day recovery point) + scheduled D1 export or snapshot; record the bookmark/timestamp before migrations.
   - **Media:** R2 copy/sync (including versioning if enabled) into a separate bucket/account; verify object keys match CMS storage keys.
   - **Key:** the full comma-separated `EMDASH_ENCRYPTION_KEY` rotation list in a secret manager and offline escrow. State that losing every key makes plugin secrets unreadable.
   - **Rehearsal:** restore into a disposable D1/R2 environment; verify admin login, media delivery, plugin-secret reads, scheduled publishing, and a public route.
   - **Order:** record recovery point → apply migrations → deploy; on failure, restore DB + media + key, not just Worker code.

4. **Add the missing gate to the promotion workflow.**
   - `docs/production-deployment.md:180-183` currently applies production migrations first. Insert:
     ```text
     0. Record a D1 Time Travel bookmark/timestamp and confirm the media/key backup is current.
     ```
   - Fail the pipeline if the recovery point is missing.

5. **Add the key rotation procedure to the Cloudflare runbook**, mirroring `storage.md:211-213`: prepend the new key, keep old keys for reads, re-save secrets, then remove old keys only after verification.

---

# 3. Database Security and Initial Setup Wizard

## 3.1 Real-world hazard

From the production article’s day-one decisions:

> “Production setup | Only on the real domain | emDash's first-run setup binds sign-in to the address it runs on”

> “Production database | Never reset | An empty database reopens the public setup wizard”

## 3.2 Current baseline state

**First-run setup is mentioned, but not the domain-order rule.**

- `.agents/skills/emdash-site-setup/SKILL.md:104`:
  > “A first request may apply core migrations and show the setup wizard. Create the site's first admin account, then verify the public site and `/_emdash/admin`.”

  This can be read as “deploy to the preview/workers.dev URL, then run setup”, which is exactly the trap.

- `docs/production-deployment.md:225-233` performs DNS cutover first, then:
  > “Log in to `/_emdash/admin` on the production URL to verify CMS administration…”

  It does not say when the first admin account should be created or that setup on a preview URL binds the stored site URL.

- `.agents/skills/emdash-production-cutover/SKILL.md:61-72` correctly warns about passkeys and origin changes:
  > “Passkeys are scoped to a relying-party ID, and authentication also checks the browser origin… Do not reseed, delete users, or reset authentication automatically.”

  But it does not warn that an empty database re-opens the public setup wizard.

**Platform behavior confirms the hazard.**

- `node_modules/emdash/src/astro/middleware/setup.ts:19-56` redirects admin routes to `/_emdash/admin/setup` when `emdash:setup_complete` is absent/false.
- `node_modules/emdash/src/astro/middleware/auth.ts:94-95` lists `/_emdash/api/setup` among `PUBLIC_API_PREFIXES` — setup API routes skip auth.
- `node_modules/emdash/src/astro/routes/api/setup/index.ts:132-137` stores the canonical site URL from the setup request, write-once:
  > “Store the canonical site URL from the setup request. Write-once at the DB level… A spoofed Host header on a later call during the wizard window must not be able to replace the first value.”

## 3.3 Assessment

**[PARTIALLY ALIGNED]**.

The passkey/origin problem is documented well in the cutover skill. The following are missing:
- “never complete first-run setup on a preview/`workers.dev` host”;
- “never reset/empty a production database”;
- “an empty DB with no users reopens the public setup wizard”;
- an acceptance check that `/_emdash/admin/setup` is no longer reachable after go-live.

## 3.4 Remediation specification

1. **Add a preflight gate to `emdash-production-cutover/SKILL.md`.**
   > Do not complete EmDash’s first-run setup on a preview or `workers.dev` hostname. Attach the production custom domain and set `siteUrl`/`EMDASH_SITE_URL` before creating the first admin. If setup was already completed on a preview host, update the stored `site:url`, re-register passkeys, and verify magic-link recovery; do not delete users or reset the database.
2. **Add a production warning to `docs/production-deployment.md`.**
   > Never reset, drop, or replace a live production database. An empty database, or one with `emdash:setup_complete` absent, redirects admin traffic to the public setup wizard and allows a new admin to be created. Take a D1 Time Travel bookmark or SQLite backup first; if reset is intentional, remove public access until setup is complete.
3. **Add an acceptance check after cutover.**
   - `GET https://<domain>/_emdash/admin/setup` must not render a usable wizard; it should redirect to login or 404.
   - `emdash:setup_complete` is true and the user count is > 0.
   - The stored `site:url`/`emdash:site_url` matches production.
4. **Update `emdash-site-setup/SKILL.md:104`** to say setup is performed on the target production origin (or an access-protected staging origin with the final site URL configured), not on an arbitrary preview host.

---

# 4. Boolean Flag Coercion in SQLite/D1

## 4.1 Real-world hazard

From the production article:

> “A sponsored post published without its sponsor's name | The database stores yes/no values as 1 and 0, and a check expected true | Treat both forms as set wherever a flag is read”

## 4.2 Current baseline state

**Storage contract says 0/1.**

- `.agents/skills/building-emdash-site/references/schema-and-seed.md:69`:
  ```text
  | `boolean` | INTEGER | `boolean` | Stored as 0/1 |
  ```

**Raw repository reads do not restore booleans.**

- `node_modules/emdash/src/database/repositories/content.ts:315-322` serializes booleans to 1/0.
- `node_modules/emdash/src/database/repositories/content.ts:344-356` `deserializeValue` only parses JSON-looking strings; it does not convert 1/0 back to boolean.
- `node_modules/emdash/src/database/repositories/content.ts:2931-2937` `mapRow` copies the raw value into `data`.

**The normal collection loader does restore booleans.**

- `node_modules/emdash/src/loader.ts:201-210` folds boolean field slugs into `_emdash_boolean_fields`.
- `node_modules/emdash/src/loader.ts:547-548`:
  ```ts
  if (booleanFields.has(key) && (typeof value === "boolean" || value === 0 || value === 1)) {
      data[key] = Boolean(value);
  ```
  
  So `getEmDashCollection`/`getEmDashEntry` are protected. The article’s failure mode applies to raw-row access, plugin SQL, custom loaders, or paths that bypass this mapping.

**Baseline has one defensive read and one strict CMS-derived check.**

- `src/lib/partners.ts:7`:
  ```ts
  return entries.filter(e=>e.data.active!==false && e.data.active!==0)
  ```
  This correctly treats both `false` and `0` as disabled.
- `src/components/EditorialImage.astro:50`:
  ```astro
  const blank = href && !href.startsWith('#') && link.blank === true;
  ```
  `link.blank` is Portable Text link data, not a top-level SQLite boolean column. EmDash normalizes the canonical shape with the same strict check in `node_modules/emdash/src/content/converters/image-link.ts:26`, so current editor/import data is safe. A raw `1` fed into this component would fail.
- Other strict checks are component props, not database values:
  - `src/components/Container.astro:14` (`rawBreakout === true`)
  - `src/components/Disclosure.astro:9` (`open === true`)
  - `src/components/LogoTicker.astro:19` (`animate === true`)
  - `src/components/ResponsiveImage.astro:18` (`optimize === true`)

## 4.3 Assessment

**[PARTIALLY ALIGNED]**.

No current baseline template reads a top-level CMS boolean strictly, and the normal collection API returns booleans. The risk is inconsistent handling: `partners.ts` knows about 0/1; `EditorialImage` does not use a shared helper; there is no documented rule or regression test. The article’s exact failure is not currently demonstrable in baseline source.

## 4.4 Remediation specification

1. **Add `src/lib/cms-flag.ts`:**
   ```ts
   /** SQLite/D1 stores booleans as 0/1; plugins and raw rows may leak either. */
   export function isCmsFlagSet(value: unknown): boolean {
     return value === true || value === 1 || value === "true";
   }
   ```
   Or, for “enabled unless explicitly disabled”:
   ```ts
   export function isCmsFlagEnabled(value: unknown): boolean {
     return value !== false && value !== 0 && value !== "false";
   }
   ```
2. **Use the helper at every CMS-derived flag read.**
   - Replace `src/components/EditorialImage.astro:50` with `isCmsFlagSet(link.blank)`.
   - Replace `src/lib/partners.ts:7` with `isCmsFlagEnabled(e.data.active)`.
3. **Document the rule** in `docs/site-standards-audit.md` or `AGENTS.md`:
   > Never compare a CMS/raw database boolean with `=== true` or `=== false`. Use `isCmsFlagSet`/`isCmsFlagEnabled`; EmDash’s normal loader returns booleans, but raw repository/plugin/SQL reads return 0/1.
4. **Add a unit test** covering `true`, `false`, `1`, `0`, `"true"`, `"false"`, `null`, and `undefined`.
5. **Audit any future collection boolean** (sponsored, featured, pinned, active) for this pattern before shipping.

---

# 5. URL Normalization and Asset Case-Sensitivity

## 5.1 Real-world hazard

From the production article:

> “A page rendered without its styles after a deploy | A redirect that lower-cased URLs also lower-cased the build's file names | Exclude build assets from URL normalisation”

## 5.2 Current baseline state

**Cutover guidance covers host aliases only.**

- `.agents/skills/emdash-production-cutover/SKILL.md:55-57`:
  > “For an apex canonical hostname, configure proxied DNS for `www` and an edge redirect matching only `www.example.com`… Verify HTTP/HTTPS aliases, nested paths, and query parameters.”

  No lowercase rule, no trailing-slash rule, no asset exclusion.

- `docs/production-deployment.md:220-233` covers DNS/mail records and post-cutover verification; no URL normalization.
- `docs/migration-cutover.md:54-55` covers 301 redirects for deleted/slug-shifted WordPress URLs; no case or trailing-slash policy.

**EmDash’s own redirect middleware already skips assets, but an edge rule does not.**

- `node_modules/emdash/src/astro/middleware/redirect.ts:29-33`:
  ```ts
  const SKIP_PREFIXES = ["/_emdash", "/_image"];
  /** Static asset extensions -- don't redirect file requests */
  const ASSET_EXTENSION = /\.\w{1,10}$/;
  ```
  This protects redirect-manager rules. A Cloudflare URL-normalization/redirect rule applied before the Worker bypasses this and can rewrite `/_astro/...`, `/_emdash/api/media/file/...`, `/uploads/...`, or `/_image/...`.

**Baseline canonical generation strips trailing slashes, but does not redirect.**

- `src/utils/page-metadata.ts:15-21`:
  ```ts
  url.pathname = pathname.replace(/\/$/, '') || '/';
  ```
- `src/pages/posts/[slug].astro:34` and `src/pages/[slug].astro:33` pass `path: Astro.url.pathname.replace(/\/$/, "")` to `getSeoMeta`.
- `astro.config.mjs` has no `redirects` and no middleware; `src/pages` only redirects missing content to `/404`.
- Therefore `/posts/foo/` may serve 200 with a slash-free canonical, and `/Posts/foo` is not normalized by any baseline rule.

## 5.3 Assessment

**[DEFICIENT / MISSING]**.

The baseline mitigates duplicate canonicals but does not redirect them, and it gives no warning about edge lowercasing breaking content-hashed assets or CMS storage keys.

## 5.4 Remediation specification

1. **Add a URL-normalization policy to `docs/production-deployment.md` and the cutover skill:**
   - Normalize **HTML page paths only**: lowercase and strip a single trailing slash.
   - Exclude, at minimum:
     - `/_astro/*` (content-hashed build assets)
     - `/_emdash/*` (admin, API, media route)
     - `/_image/*` (Astro image endpoint)
     - `/uploads/*` (Node local media)
     - `/media/*` or any configured media base
     - any path whose final segment contains a file extension
   - Preserve the query string.
   - Use 301 for `GET`/`HEAD` page requests; do not rewrite `POST`/API requests blindly.
2. **Implement a portable `src/middleware.ts`** (or document the equivalent Cloudflare rule) with this order:
   ```ts
   // pseudo-contract
   if (pathname.startsWith('/_astro/') || pathname.startsWith('/_emdash/') ||
       pathname.startsWith('/_image/') || pathname.startsWith('/uploads/') ||
       /\.[a-z0-9]{1,10}$/i.test(pathname)) return next();
   const canonical = pathname.replace(/\/+$/, '').toLowerCase();
   if (canonical !== pathname) return context.redirect(canonical + search, 301);
   ```
   Ensure this does not conflict with EmDash’s redirect middleware; run it before route rendering and skip preview/edit requests.
3. **Add acceptance checks:**
   - `GET /_astro/<real-hash>.css` returns 200/304, not 301/404.
   - `GET /Photos/<CamelCaseKey>` for a CMS media object returns the object, not a lowercased 404.
   - `GET /Foo/` → 301 `/foo`; `GET /foo/` → 301 `/foo`; canonical is self-referential.
   - Query strings survive all redirects.
   - No redirect loop on `www`/apex.

---

# 6. Forms, CSRF, Email Scanners, and Webhook Domain Filtering

## 6.1 Real-world hazard

From [“emDash Forms, reviewed”](https://emdashnow.com/emdash-forms-review):

> “It is sent once, without retries, so if the receiving service is down the submission is still safe in emDash but the CRM will not hear about it”
>
> “it carries no signature, so the receiving address should be a long, unguessable one… and the receiver should check the form identifier before acting”

From [“Owning your newsletter list”](https://emdashnow.com/own-your-newsletter-list-emdash):

> “A visitor enters an address, receives a confirmation email and confirms on a page with a button”
>
> “Corporate security tools open links before people do; requiring a click keeps consent genuine and the list clean”
>
> “Every incoming notification is checked against the site's own sending domain first, because an email provider account often serves several websites and its notifications can cover all of them.”
>
> “a notification may only update people already on the list; adding someone is always the site's decision.”

From the production article:

> “A webhook could have acted on other sites' subscribers | Email-provider webhooks fire for every domain in a shared account | Filter every event by the sending domain before acting on it”

## 6.2 Current baseline state

**CSRF/session handling is partially covered.**

- `docs/production-deployment.md:66-69`:
  > “Astro in-memory sessions vanish between isolates, causing form recovery and CSRF tokens to fail. Configure Astro persistent session storage (using Cloudflare KV or D1) before enabling public form recovery.”

  This explains the session dependency, but does not state how to enforce CSRF on a custom form endpoint, nor document Astro’s `security.checkOrigin` default.
- `.agents/skills/emdash-production-cutover/references/contact-forms.md:21`:
  > “Check browser Origin against the configured site origin when present… Origin/CORS checks do not stop bots or replace abuse controls.”

  Good, but not a CSRF token contract.

**Spam and retention are covered.**

- `contact-forms.md:20`: honeypot is one signal; add rate limit or server-verified challenge; in-memory counters insufficient.
- `docs/forms-adoption.md:12-16`: honeypot, Turnstile failures, recovery, retention (`retentionDays` defaults to 0 and cleanup skips it — choose a deliberate period).

**No double opt-in / scanner guidance.**

A search across `docs` and `.agents/skills` finds no occurrence of “double opt-in”, “email security scanner”, or “click-to-confirm” in a newsletter/subscription context.

- `docs/editor-handoff.md:58` says:
  > “Newsletter Signup | … | Client Embed / Direct API Webhook | Replaced | Connected directly to client's newsletter provider API.”

  No requirement for confirmed consent or POST-only confirmation.
- `docs/forms-adoption.md` has no subscriber/confirmation flow at all.
- `docs/support-boundaries.md:51-52` says newsletters must be “inventoried and preserved, replaced or deliberately excluded”, but sets no security contract.

**Webhook verification is generic; shared-domain filtering is missing.**

- `.agents/skills/creating-plugins/references/api-routes.md:105`:
  > “A public route skips authentication… verify webhook signatures or shared tokens where applicable.”

  Good baseline, but no rule to validate the event’s sending domain/from domain, and no “update-only, never create” rule.

## 6.3 Assessment

**[PARTIALLY ALIGNED]** for CSRF/origin/honeypot/retention.

**[DEFICIENT / MISSING]** for:
- double opt-in with a POST button click;
- scanner-safe GET confirmation;
- shared-provider webhook domain filtering;
- at-most-once webhook reconciliation.

## 6.4 Remediation specification

1. **Add `docs/newsletter-architecture.md`** (or a section in `docs/forms-adoption.md`) with this contract:
   - **Double opt-in only.** The confirmation email links to a page; that page must require a `POST` button click to confirm. A `GET` must only render the page and must not mutate subscriber state.
   - Token is single-use, expiring, bound to the subscriber/email, and invalidated after confirmation.
   - The subscriber record stores status, confirmation timestamp, sign-up source, and consent text/version.
   - Provider webhooks may only **update** an existing subscriber; they may never create one.
   - Unsubscribe sync is two-way; provider unsubscribe updates the site record.
2. **Add a webhook section to `contact-forms.md` and plugin docs:**
   - Verify the provider signature or shared secret.
   - Read the event’s sending domain / `from` domain; compare against an explicit allowlist for this site. Ignore events for other domains in a shared account.
   - Check the form identifier before acting.
   - Treat delivery as at-most-once; use the submission ID as an idempotency key; do not retry ambiguous sends automatically.
   - Reconcile via scheduled CSV/JSON export; do not treat the webhook as the source of truth.
3. **Add a CSRF requirement:**
   - Document Astro’s `security.checkOrigin` behavior for server output.
   - For any session-mutating form endpoint that is not an Astro Action, require an origin check plus a session-bound CSRF token; return `403` on mismatch.
   - Test a cross-origin POST and a missing-token POST.
4. **Add acceptance checks:**
   - `GET` confirmation URL → page renders, subscriber remains `pending`.
   - `POST` confirmation with valid token → `confirmed`.
   - Replayed token → no second confirmation.
   - Webhook from a different sending domain → ignored.
   - Webhook replay → no duplicate subscriber/update.
   - Cross-origin POST → rejected before CMS query/send.

---

# 7. Scheduled Publishing Verification

## 7.1 Real-world hazard

From the production article:

> “Scheduled posts did not publish at first | The platform's scheduler took about an hour to begin firing after the first deploy, well past the documented window | Verify the scheduler in the logs after launch, with a test post scheduled a few minutes ahead”

Checklist item:

> “Verify the scheduler — Schedule a test post a few minutes ahead and confirm it publishes after launch.”

## 7.2 Current baseline state

**The Worker cron is configured in a reference, but not verified anywhere.**

- `.agents/skills/building-emdash-site/references/configuration.md:108-124`:
  ```jsonc
  "triggers": { "crons": ["* * * * *"] }
  ```
  ```ts
  import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";
  export default { ...handler, scheduled: createScheduledHandler() } satisfies ExportedHandler;
  ```
- The root `astro.config.mjs` is Node-only; no `wrangler.jsonc` exists, so this is guidance for the Cloudflare target, not a wired root configuration.
- `.agents/skills/emdash-production-cutover/SKILL.md:109-120` acceptance list has TLS, canonicals, mail, admin login, forms — **no scheduler check**.
- `docs/production-deployment.md` has no scheduler check.
- `docs/migration-cutover.md` has no scheduler check.

**Platform cache can delay scheduled visibility even when cron fires.**

- `node_modules/emdash/src/astro/integration/runtime.ts:220-224`:
  > “Scheduled content becomes visible at query time (no write event fires when its publish time passes), so a cached list/entry won't surface a newly-due scheduled item until the next write to that collection or until the entry's TTL lapses (`defaultTtl`, default 1h). Sites that rely on precise scheduled publishing should lower `defaultTtl` accordingly.”

  Baseline docs do not mention this interaction.

## 7.3 Assessment

**[DEFICIENT / MISSING]** for deployment verification; configuration guidance itself is **[ALIGNED]**.

## 7.4 Remediation specification

1. **Add a cutover acceptance item:**
   > Schedule a disposable post 5 minutes ahead. After deploy, confirm the `scheduled` handler fires in `wrangler tail`, the entry becomes published at the expected minute, and the public route serves it. Delete the test entry afterward.
2. **Add a preflight check** in the cutover skill:
   - `triggers.crons` exists in the selected Wrangler environment;
   - the Worker entry exports `scheduled: createScheduledHandler()`;
   - the environment has the correct D1/R2 bindings;
   - if `objectCache` is enabled, `defaultTtl` is appropriate for publishing precision, or an explicit purge/invalidation path exists.
3. **Add the same gate to `new-site-workflow` Stage 7** and `docs/production-deployment.md` §2.
4. **Record the observed result** (timestamp, entry ID, log line) in `audit/production-cutover.md`.

---

# 8. SEO and Structured Data Gaps

## 8.1 Real-world hazard

From [“emDash SEO in practice”](https://emdashnow.com/emdash-seo-built-in-and-gaps):

> “Structured data | BlogPosting and WebSite | Extra types are the template's job”

> “Extra structured data | No breadcrumb, organisation or review data… | Added all three, without duplicating what emDash already emits”

> “Canonical URLs | Trailing slashes and capital letters produced duplicate URLs | Redirected both to one lowercase, slash-free form”

> “News sitemap | Not part of emDash | Added a Google News sitemap of the last 48 hours”

> “robots.txt caching | The generated file was cached for a day and not refreshed when settings changed | Capped it at an hour and linked it to settings changes”

> “if you write a custom robots.txt that mentions any sitemap, emDash stops adding its own sitemap line, so every sitemap you want crawlers to find has to be listed by hand.”

> “emDash's sitemaps cover content entries, not the home page, categories or author pages.”

## 8.2 Current baseline state

**What is aligned:**

- `src/pages/posts/[slug].astro:43` uses `seo.title` for the document title, so the “full headline in browser title” gap is closed.
- `src/pages/index.astro:17` has an `<h1>` (“Recent Posts”), so the “home page has no h1” gap is not present.
- `src/layouts/Base.astro:44-56` delegates head/JSON-LD to `EmDashHead`.
- EmDash emits `BlogPosting` for `pageType="article"` and `WebSite` otherwise:
  - `node_modules/emdash/src/page/seo-contributions.ts:142-151`
  - `node_modules/emdash/src/page/jsonld.ts:52-77` (BlogPosting), `:84-105` (WebSite).

**What is missing:**

- **No BreadcrumbList.** `Base.astro:43-57` builds `createPublicPageContext({...})` without `breadcrumbs`, even though the platform supports it:
  `node_modules/emdash/src/page/context.ts:35-40`:
  > “Optional breadcrumb trail for this page, root first…”
  No `BreadcrumbList` appears in baseline source.
- **No standalone Organization.** EmDash’s BlogPosting has only a nested `publisher` with `name`:
  `node_modules/emdash/src/page/jsonld.ts:67-72`.
  No `Organization` node with `url`, `logo`, `sameAs`, or `@id`.
- **No NewsArticle.** The platform selects BlogPosting for article pages; no NewsArticle builder exists in baseline or EmDash.
- **No news sitemap.** `src/pages` has no news sitemap; EmDash’s index only lists collection sitemaps:
  `node_modules/emdash/src/astro/routes/sitemap.xml.ts:1-10`.
- **Empty categories and tags remain indexable.**
  - `src/pages/category/[slug].astro:21` renders `<Base title=...>` with no `seo.robots`; the empty branch is only a message at `:27-28`.
  - `src/pages/tag/[slug].astro:21-31` does the same.
  - The 404 page demonstrates the existing noindex pattern: `src/pages/404.astro:7` uses `seo={{ robots: 'noindex, nofollow' }}`.
- **Canonical URLs are slash-free but not redirected.**
  - `src/utils/page-metadata.ts:15-21` strips the trailing slash for default canonicals.
  - `src/pages/posts/[slug].astro:34` and `src/pages/[slug].astro:33` strip it for `getSeoMeta`.
  - There is no middleware or `redirects` configuration; `/foo/` can still return 200.
- **Robots.txt caches for 24 hours.**
  - `node_modules/emdash/src/astro/routes/robots.txt.ts:81` and `:103` set `Cache-Control: public, max-age=86400`.
  - Baseline only says to inspect CDN/cache shadows in `docs/emdash-1.3-upgrade-review.md:18`; it does not cap or purge.
- **Custom robots sitemap behavior is undocumented in baseline.**
  - Platform: `node_modules/emdash/src/astro/routes/robots.txt.ts:72-75` only appends `Sitemap:` if the custom content does not already contain one.
  - Baseline docs do not mention this.
- **Hub pages are outside EmDash sitemaps.**
  - `sitemap.xml.ts:1-10` lists only collection child sitemaps.
  - No baseline custom sitemap for home/categories/tags/authors.

## 8.3 Assessment

**[PARTIALLY ALIGNED]**.

Titles, h1, canonical generation, and platform BlogPosting/WebSite are aligned. Missing: BreadcrumbList, standalone Organization, NewsArticle/news sitemap, empty-taxonomy noindex, canonical redirects, robots cache handling, and documented custom-robots sitemap behavior.

## 8.4 Remediation specification

1. **Add a `breadcrumbs` prop to `Base.astro` and pass it through.**
   - Extend the `Props` interface and destructure `breadcrumbs`.
   - Add `breadcrumbs` to `createPublicPageContext({...})` at `Base.astro:43-57`.
   - Per route:
     - Home: `breadcrumbs={[]}` (explicit opt-out).
     - Post: Home → Category/Parent → Post.
     - Category/tag: Home → Taxonomy.
   - Emit `BreadcrumbList` JSON-LD in a small `src/components/StructuredData.astro` (or an EmDash SEO plugin), using `safeJsonLdSerialize` or escaped JSON. Do not duplicate EmDash’s `primary` graph.
2. **Add standalone Organization JSON-LD once.**
   - On the home page (or site-wide), emit:
     ```json
     {
       "@context": "https://schema.org",
       "@type": "Organization",
       "@id": "https://example.com/#organization",
       "name": "...",
       "url": "https://example.com",
       "logo": "https://example.com/...",
       "sameAs": ["..."]
     }
     ```
   - Avoid a second standalone Organization on article pages; EmDash already emits a nested publisher.
3. **Add NewsArticle and a news sitemap only if the site is a news publication.**
   - `src/pages/news-sitemap.xml.ts`: query posts published in the last 48 hours, emit Google News `<urlset>` with `<news:news>`.
   - Add `Sitemap: https://example.com/news-sitemap.xml` to custom robots content.
   - For NewsArticle, add a per-article JSON-LD override or a template-specific script; keep BlogPosting as the fallback.
4. **Noindex empty taxonomy pages.**
   - In `src/pages/category/[slug].astro:21` and `src/pages/tag/[slug].astro:21`:
     ```astro
     <Base
       ...
       seo={{ robots: posts.length === 0 ? 'noindex, follow' : undefined }}
     >
     ```
   - Consider noindex for tags below a content threshold.
5. **Add canonical redirects.**
   - Implement the URL-normalization middleware from §5, or a Cloudflare rule that lowercases/strips trailing slash for HTML routes only.
   - Verify `/Foo/` and `/foo/` both 301 to `/foo`.
6. **Handle robots.txt caching.**
   - Add a Cloudflare Cache Rule for `/robots.txt` with a 1-hour edge TTL, or purge it on settings changes.
   - Document that the native route defaults to 24 hours.
7. **Document custom robots.txt behavior.**
   - Add to `docs/production-deployment.md`:
     > If `seo.robotsTxt` contains any `Sitemap:` line, EmDash will not append `/sitemap.xml`. List every sitemap manually.
8. **Add SEO acceptance:**
   - one page per template in Google Rich Results Test;
   - Breadcrumb/Organization/NewsArticle validity;
   - canonical self-reference after redirects;
   - sitemap parity for all indexable routes;
   - `robots.txt` reflects settings within the chosen TTL.

---

# Additional Findings

## A. `EMDASH_SECRET` is not a valid EmDash 1.3 variable — P0

Covered in §2.2/§2.4. This is a direct documentation defect with data-recovery consequences: an operator following `docs/production-deployment.md:32` will not configure `EMDASH_ENCRYPTION_KEY`, and may lose access to encrypted plugin settings after a restore.

## B. Editor toolbar under a shared cache — P1

`node_modules/emdash/src/astro/integration/runtime.ts:673-695` states that the default `toolbar: "server"` causes editors to receive cached anonymous HTML behind a shared cache. Baseline `astro.config.mjs:47-53` does not set `toolbar: "client"`. Any site enabling the article’s 5-minute edge cache will see the editor toolbar appear/disappear depending on cache state. Add `toolbar: "client"` when caching HTML, and document the tradeoff.

## C. Cloudflare migrations run without a recorded recovery point — P1

`docs/production-deployment.md:180-183` applies production D1 migrations before deploy, with no backup/recovery-point step. The article explicitly records a recovery point first. Add the gate from §2.4(4).

## D. Forms webhook is at-most-once and unsigned — P2

The forms review documents this, but `docs/forms-adoption.md` and `contact-forms.md` do not. Add the operational contract from §6.4(2). A CRM integration that assumes retries will silently lose leads.

## E. Plugin API example normalizes SWR — P2

`.agents/skills/creating-plugins/references/api-routes.md:151` uses `stale-while-revalidate` without a scope warning. Add “JSON/data routes only; never HTML” to prevent copy-paste into a page route.

## F. Cache-hint coverage is asserted, not tested — P2

`docs/site-standards-audit.md:43` admits cache-hint completeness is “required/unverified”. `src/pages/index.astro:11` uses `getSiteSettings()` (not `getSiteSettingsWithCacheHint`) while `Base.astro:29` separately fetches settings with a hint. That is not a correctness bug, but it is redundant query work on a cache miss and weakens the “all queries registered” claim. Consolidate on the `WithCacheHint` helper for routes that render settings.

---

# Recommended Remediation Order

| Priority | Work | Files |
|---|---|---|
| **P0** | Fix `EMDASH_SECRET` → `EMDASH_ENCRYPTION_KEY`; add export-is-not-DR warning; add Cloudflare D1/R2/key DR runbook; add pre-migration recovery-point gate | `docs/production-deployment.md`, `docs/node-backup-restore.md`, new `docs/cloudflare-backup-restore.md`, `docs/prompt-library.md` |
| **P0** | Add production DB reset warning + first-run setup domain rule + post-cutover setup-wizard check | `docs/production-deployment.md`, `.agents/skills/emdash-production-cutover/SKILL.md`, `.agents/skills/emdash-site-setup/SKILL.md` |
| **P1** | Add edge-cache policy, SWR prohibition, asset retention, broken-asset deploy gate, `toolbar: "client"`, placement/coalescing measurement | `docs/production-deployment.md`, `astro.config.mjs` (when Cloudflare), new deploy check script |
| **P1** | Add URL-normalization rules with asset/media exclusions and acceptance tests | `docs/production-deployment.md`, cutover skill, optional `src/middleware.ts` |
| **P1** | Add scheduler acceptance check + object-cache TTL note | cutover skill, `docs/production-deployment.md`, `new-site-workflow` |
| **P2** | Add CMS boolean helper, replace strict checks, add unit test and rule | `src/lib/cms-flag.ts`, `src/lib/partners.ts`, `src/components/EditorialImage.astro`, docs |
| **P2** | Add double opt-in / scanner-safe confirmation / webhook domain filtering | `docs/forms-adoption.md`, `contact-forms.md`, new newsletter doc |
| **P2** | Add BreadcrumbList, Organization, empty-taxonomy noindex, canonical redirects, news sitemap, robots cache | `src/layouts/Base.astro`, category/tag routes, new SEO component/route, docs |

---

# Evidence and Limits

**Live articles read:** `/running-emdash-in-production`, `/emdash-seo-built-in-and-gaps`, `/emdash-forms-review`, `/own-your-newsletter-list-emdash`, `/emdash-1-3-released`, `/is-emdash-production-ready`, `/what-emdash-costs`.

**Repository files inspected:** `astro.config.mjs`; `src/layouts/Base.astro`, `SiteShell.astro`; `src/pages/{index,[slug],404}.astro`, `src/pages/posts/[slug].astro`, `src/pages/category/[slug].astro`, `src/pages/tag/[slug].astro`; `src/components/{EditorialImage,Container,Disclosure,LogoTicker,ResponsiveImage,CMSPartnersPanel}.astro`; `src/lib/partners.ts`; `src/utils/page-metadata.ts`; `docs/{production-deployment,migration-cutover,node-backup-restore,database-workflow,forms-adoption,site-standards-audit,emdash-1.3-upgrade-review,support-boundaries,editor-handoff,prompt-library}.md`; `.agents/skills/{emdash-site-setup,emdash-production-cutover,building-emdash-site,creating-plugins}`; installed `emdash` 1.3.0 source under `node_modules/emdash/src`.

**Verification limits:**
- No Cloudflare account, D1/R2 binding, or live deployment was exercised; Cloudflare findings are documentation/source audits.
- No browser/visual verification was performed; this is a documentation and code-contract audit.
- The boolean finding distinguishes the normal loader path (safe) from raw repository/plugin paths (0/1). It does not claim a current production failure in baseline.
- The article’s specific sponsored-post failure could not be reproduced in baseline because no baseline template reads a top-level CMS boolean strictly.

**No repository source files were created, edited, or deleted during the investigation.** This report is the only artifact saved.
