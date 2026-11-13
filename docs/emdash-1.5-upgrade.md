# EmDash 1.5 upgrade

The EmDash foundation now pins `emdash` and its directly used `@emdash-cms/auth` to **1.5.0**. Core brings matching admin, blocks and Gutenberg conversion packages, and `@cloudflare/kumo` 2.15.0. Astro remains 7.4.0. Static/Sveltia projects do not acquire CMS or forms dependencies. The [1.4 guide](emdash-1.4-upgrade.md) is retained as history; its caching, origin and conflict rules still apply unless this page says otherwise.

## Existing sites

Adopt this as a reviewed dependency and source update, preserving site-owned configuration, content, translations, plugins and calibration. Unlike 1.3 to 1.4, **this release migrates the database**: six migrations (`092_plugin_kv_options` to `097_room_storage`), two new tables (`_emdash_rooms`, `_emdash_room_updates`) and two nullable `revisions` columns (`kind`, `edited_by`). Capture the configured database with its media and encryption-key recovery references first, and rehearse against an isolated restore. Never reset a database to repair upgrade or authentication issues.

- **Update the whole graph together.** Workers sites pin `@emdash-cms/cloudflare@1.5.0`; the adapter now requires the exactly matching core, and a mismatch stops the install with `ERESOLVE`. Any `@emdash-cms/sandbox-workerd` runner moves with core. Confirm one installed core copy with `npm ls emdash` or `pnpm why emdash`.
- **Plugins that render admin UI need Kumo exactly 2.15.0.** Forms, Field Kit, AI Moderation and AI Search must be updated with core.
- **Sandboxed plugins with KV data, or plugins declaring storage `uniqueIndexes`, need a planned window.** Do not roll the upgrade: back up, stop every instance, upgrade core with the sandbox runner, run `emdash migrate` from the new build and review logged conflicts before starting. The neutral starter has neither; its `baseline-metadata` plugin is native, with no storage.
- **Review menus after the upgrade.** Migration 093 moves menu items orphaned by earlier deletes to the top level, where the site was already showing them. Delete the ones that are no longer wanted.
- **Upgrade both ends of a site transfer.** Once a site has run these migrations, an earlier EmDash version cannot export from it or import into it. Bring a local copy and its hosted counterpart to 1.5.0 before relying on Settings > Transfer between them.
- **`emdash()` options are now type-checked.** A wrong-typed value stops `astro dev`, `astro build` and `astro sync` with an error naming the option; an unknown option logs a warning. Fix what the error names rather than removing the option.
- **Type checking is stricter in templates.** `emdash/ui` now resolves from package declarations, so `<PortableText>`, `Blocks` and other component props are checked, and `MediaItem` fields such as `alt` and `width` are `T | null`. A block component whose `Props` carries a string index signature is no longer assignable to the Portable Text component map; declare the props it actually reads.

After deployment, `GET /_emdash/api/health` reports the running version. Record a D1 Time Travel bookmark before a Workers deployment as before; see [Cloudflare recovery](cloudflare-backup-restore.md).

## Staging and going live

Sites created through the setup wizard, or by a script that calls the setup API, now start in **staging**. While in staging, every page that renders `<EmDashHead>` gets `noindex, nofollow`, overriding SEO panel and plugin robots values, `/robots.txt` is not cached, and the admin header shows a Staging badge. Baseline's `Base.astro` renders `<EmDashHead>`, so this applies to every new Baseline site.

- Existing sites are live and do not change. A site without the setting is live.
- The development-only `setup/dev-bypass` route does not set staging, so local rehearsals and the checks in this repository render as live sites.
- Site transfer and `emdash export-seed` do not carry the staging status.
- Baseline's middleware caps the native `/robots.txt` cache at one hour. It now leaves the staging `no-store` response alone, so crawlers see the change when the site goes live; before this change it replaced `no-store` with a one-hour public cache.
- A separate staging environment (see [production deployment](production-deployment.md)) should stay in staging permanently and keep its edge `X-Robots-Tag` rule: the native tag covers only pages that render `<EmDashHead>`.
- Going live is an explicit launch step: **Settings > General > Site Status > Go live**, `{ "staging": false }` to the settings API, or the MCP `settings_update` tool. A production site that still returns `noindex, nofollow` on ordinary pages after cutover is most likely still in staging.

## Collaborative editing

`coEditing` is off by default upstream and stays off in the neutral starter. Without it, the edit lock behaves as before. Turn it on per site only when several editors work in the same entries and the host meets the requirements:

- Collections need `revisions` in `supports`; elsewhere the editor keeps the edit lock.
- On Node.js the reverse proxy must forward WebSocket upgrades on `/_emdash/api/content/{collection}/{id}/room`. Several processes on one database must route each room path to one process; `node:cluster` and PM2 cluster mode keep the edit lock.
- While rooms are open EmDash handles `SIGTERM`/`SIGINT` and stops up to 5 seconds later. Give the process manager a kill timeout above 5 seconds.
- An existing Workers site also needs the `EMDASH_ROOMS` Durable Object binding and the room class exports.

With co-editing on, API writers see different conflicts: a co-edited entry has no edit lock, `_rev` writers get `409 CONFLICT` more often, and MCP publish/unpublish/schedule/discard conflict while a room holds unsaved edits.

## API, content and media behavior

- **REST saves normalize rich text media references.** Saving rich text through the REST API, MCP or the CLI now stores the media ID in `asset._ref` when the URL matches a library file. Imported content that held a URL-shaped `_ref` changes shape on its first API save. Compare such content by resolved media identity, not by the literal `_ref` string.
- **List conflicts.** Content updates accept an optional `expected` object (bylines and reference selections) and term updates an `expected` list. A stale list fails with `409 LIST_CONFLICT` and writes nothing: read again, reapply, retry. Requests without `expected` work as before.
- **Hooks receive `editedBy`.** A `content:beforeSave` hook that checks the actor's role should check everyone in `editedBy`. The revisions API and MCP `revision_list` return `editedBy` per version; existing versions name only their author.
- **Revisions keep manual saves.** Autosave replaces only earlier autosaves, and the first save of an entry keeps its starting content as the oldest version.
- **Scheduling.** The `scheduling` value in `supports` never disabled scheduling and is deprecated. To disable it, add `no-scheduling`. Existing schedules still run.
- **Date column.** A collection's `dateField` can be `publishedAt`, `createdAt` or `updatedAt`; a duplicate custom date field is no longer needed just to list by publication date.
- **Local seed images.** Seeds can use `{ "$media": { "file": "assets/photo.jpg" } }`, resolved next to the seed file, read when the seed is applied with Node.js and not bundled for deployment.
- **Image placeholders.** The admin sends a small thumbnail with each upload and placeholders come from it. Clients that upload without a thumbnail, including Baseline's prepared-media upload, WordPress imports and MCP, still have originals decoded. New transparent images get no placeholder. `imagePlaceholders: false` turns generation off site-wide for CPU-constrained hosts.
- **Email.** Core has a built-in SMTP provider (Settings > Email, or `EMAIL_SMTP_HOST`/`EMAIL_SMTP_USER`/`EMAIL_SMTP_PASS`). Saving credentials in the admin requires `EMDASH_ENCRYPTION_KEY`. Port 25 is refused. A working provider or email plugin does not need replacing.
- **WordPress imports.** WXR imports now bring menus, one byline per author and classic-editor paragraphs, and password-protected posts import as drafts. Imports made before this release are not repaired: unpublish any protected posts that should stay private, and re-add menu links to custom post types.

## Browser tests against the admin

Dialogs no longer have a separate close button: click Cancel or press Escape. Label locators such as `getByLabel("Slug")` may also match the new info buttons, so pass `{ exact: true }`. The editor sidebar's "Drag to reorder" buttons are gone.

## Reviewed adapters

Baseline's version-bound adapters refuse an EmDash release they were not reviewed against. That release is now named once, in `scripts/emdash-reviewed.mjs`, and read by the SQLite metadata adapter, the seed-export projection, the REST media adapter, the hosted-auth probe and their tests. Bumping it is a review, not a rename: add `standards/emdash-<version>-database-tables.json` from the installed `src/database/types.ts`, re-read each importer against the installed routes and CLI it depends on, then change the constant. Snapshots, ledgers and receipts written by a 1.4.0 adapter carry that identity and are refused by the 1.5.0 adapter; regenerate them rather than editing the identity.

For 1.5.0 the reviewed facts are: the table catalog gains exactly the two room tables; `setup/admin/verify` keeps the session, nonce, parse, create guard order; `export-seed` keeps `--database`, `--with-content` and `--media-base-url`; and multipart `POST /_emdash/api/media` keeps `deduplicate`, `ensureUniqueFilename`, `alt`, `caption`, `width` and `height`.

## Optional forms

The evaluated target is `@emdash-cms/plugin-forms@0.2.13`, which requires Kumo 2.15.0 and therefore core 1.5.0. It remains opt-in: install the exact version, add `formsPlugin()` to the existing plugins array and render `<Form>` from `@emdash-cms/plugin-forms/ui`. See [forms adoption](forms-adoption.md) for acceptance and unresolved provider/runtime limits.

## Evidence for this upgrade

Run locally on Windows, Node.js 24.21.0, Node/SQLite/local media, against the installed 1.5.0 packages: `npm run verify`, `npm run build`, `npm run audit:html`, the compatibility-named `npm run check:emdash13` (role boundaries, edit locks, revision diff and restore, inline toolbar), `node tests/forms.integration.mjs` with forms 0.2.13, `node tests/metadata.integration.mjs`, `npm run rehearse:importer`, `npm run check:cache` and `npm run check:dev-tools`. Each rehearsal uses a disposable site with synthetic content. Staging was also observed end to end on a disposable built site: after the real setup route, the home page and a post served `noindex, nofollow` and `/robots.txt` answered `no-store`; after `{ "staging": false }` through the settings API both pages carried no robots tag and `/robots.txt` returned to the one-hour public cache. Separately, the starter's own seeded local development database, created on 1.4.0, was migrated in place through 092 to 097 by the first 1.5.0 build and HTML audit run, and the audit then served its public routes from it. That run was not preceded by a backup; treat it as an observation, not as the procedure.

Not covered: an in-place upgrade of a database with real content, menus, plugins or plugin storage, collaborative editing, the SMTP provider, sandboxed plugins, and any Workers/D1/R2 or Durable Object behavior. Verify those on the site that uses them.

Sources: [EmDash 1.5 announcement](https://emdashcms.com/blog/emdash-1-5), [core 1.5.0 release](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.5.0), [update guide](https://docs.emdashcms.com/deployment/updating/). Package pins and API behavior must be rechecked for later upgrades.
