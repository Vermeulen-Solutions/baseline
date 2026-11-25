# Cloudflare recovery: database, media and encryption keys

For EmDash 1.4.0, failed Workers auto migrations return 503 instead of the potentially empty 200 responses in 1.3.0. Large migrations may require explicit native `emdash migrate` before promotion; follow the actual migration status/error and preserve a recovery point. See [the 1.4 upgrade guide](emdash-1.4-upgrade.md).

Applies to disaster-recovery planning and operations that change or restore EmDash Workers/D1/R2 data. The root remains Node/SQLite; use [Node recovery](node-backup-restore.md) there. Assign an owner, RPO (maximum lost writes), RTO (time to restore), backup cadence and restore-drill cadence when the site's data needs a recovery plan.

For normal deployments and dependency upgrades, follow the site's configured deployment workflow and EmDash's [update guide](https://docs.emdashcms.com/deployment/updating/) or [v1 upgrade guide](https://docs.emdashcms.com/upgrade-to-v1/). Keep the supported `auto` migration mode when that is how the site operates. A separate `emdash migrate` pipeline and its API token are optional unless the site's configuration, upgrade work order or an actual migration error requires them. Do not introduce a managed migration pipeline merely because an EmDash version changed.

An upgrade work order that lists added core migrations, an observed pending migration, or a data-changing project action needs a database recovery point before the upgraded application starts or deploys, including in `auto` mode. For D1, a current Time Travel bookmark is the normal short-term recovery point and can be obtained with existing Wrangler authentication. A version number or a Worker rollback date alone does not establish the deployed migration state. An ordinary code release without these changes needs the normal build, deployment and smoke checks.

Retain existing media backups and key-list recovery copies as site operations. Reuse their existing versions when an upgrade leaves those resources unchanged; a fresh R2 copy, new backup bucket, independent offline escrow or full SQL export is not a blanket release prerequisite. An operation that replaces/deletes media or rotates keys needs recovery for those specific changes. A Worker rollback changes code only and cannot undo database or media changes.

`emdash site export` is a portable content transfer, **not disaster recovery**. It omits users, passkeys, sessions, credentials, plugin settings/state and secrets. Its target must have an administrator and an empty content area. The admin's logical backup also omits operational state. Neither substitutes for these three pillars.

## 1. Database recovery

[D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) is automatic on supported production databases. Its retention is **7 days on Free, 30 days on Paid**; verify the actual plan and storage generation. A bookmark names a recovery point. An off-platform SQL export is useful for longer retention, account loss or an isolated restore rehearsal; choose its cadence from the site's recovery goals rather than requiring it for every deployment. Exports can affect D1 query availability, so plan an appropriate window for large databases. `wrangler d1 export` cannot dump a database containing FTS5 virtual tables, which EmDash creates. Do not drop FTS tables or treat the export error as a missing recovery point; use Time Travel for the short-term point and an FTS-aware copy path only when longer retention requires one.

For a site that already uses an explicit migration command, or when the installed EmDash release requires one:

1. Identify account ID, database UUID, Wrangler config/environment, deployed commit and release. Review `emdash migrate --status --json` against that exact target and save its fingerprint.
2. Before applying pending migrations, record a current D1 Time Travel bookmark and UTC time in a private release note. Check command success and a nonempty bookmark. Keep the matching application artifact available. The same recovery requirement applies when pending migrations run automatically on the first request.
3. Retain matching media/key recovery versions; copy them again when this operation changes those resources. A core migration that leaves media and keys untouched does not require a fresh R2 snapshot or a new key-vault receipt.
4. Serialize migrations by account + database UUID. Apply core migrations with the reviewed fingerprint, deploy, then run `migrate --check`. Wrangler SQL migrations are a separate mechanism for site-owned SQL; they do not replace EmDash core migrations.

The explicit migration CLI requires the selected account ID and a scoped `CLOUDFLARE_API_TOKEN` with D1 Edit permission. Normal `wrangler deploy` uses Wrangler's configured authentication and does not require that separate migration token. Use this sequence only for the explicit migration workflow. Set tokens securely; replace placeholders and never put secrets or SQL content in tracked receipts. `wrangler d1 time-travel info` acts on remote databases; do not add a `--remote` flag. PowerShell uses `npx.cmd`.

```sh
npx wrangler d1 time-travel info <database-uuid> --config wrangler.jsonc --env production --json
npx emdash migrate --status --json --account-id <account-id> --d1 <database-uuid>
# Save/review the bookmark and target fingerprint BEFORE this apply:
npx emdash migrate --account-id <account-id> --d1 <database-uuid> --expected-target-fingerprint <reviewed-fingerprint>
npx wrangler deploy --config wrangler.jsonc --env production
npx emdash migrate --check --account-id <account-id> --d1 <database-uuid>
```

For a site that deliberately uses a deployment-managed migration pipeline, set `migrations: { runtime: 'check', dev: 'auto' }` so production refuses requests while migrations are pending. Do not change runtime migration policy as a prerequisite for an unrelated code deploy. Inspect `EMDASH_MIGRATIONS_MODE` overrides. Build first to generate `.emdash/migrations.json`; provision D1 separately before migrating it. See the [official core migration contract](https://docs.emdashcms.com/deployment/core-migrations/).

### Portable copy and a local upgrade rehearsal

`wrangler d1 export` refuses any database with FTS5 virtual tables ("cannot export databases with virtual tables"), and EmDash creates one for every collection with Search enabled. `npm run db:export-d1` (read-only; `--database <name>` when `wrangler.jsonc` has several) exports the ordinary tables with `--table`, adds the search tables with their rows and every index and trigger, and orders the file so all tables exist before any row is inserted. It then counts every table in D1, loads the file into a scratch SQLite database, and writes the export and `<file>.manifest.json` only when row counts, object counts, `integrity_check` and `foreign_key_check` all match. It is a portable copy for rehearsal and inspection, not the recovery point; that remains the Time Travel bookmark.

The copy contains users, sessions and settings. It is written to `.emdash/backups/` by default, and inside a Git repository the command refuses any destination Git would track. Sites created before this rule may not ignore that folder: add `.emdash/backups/` (and `*.sql`) to `.gitignore` first. The manifest also lists statements longer than D1's 100 KB limit (large gallery entries and revisions); `wrangler d1 execute --file` cannot load such an export, which is why the rehearsal command loads it directly.

Rehearse a core upgrade on that copy before deploying. **Do not use a Cloudflare preview version for this:** any Worker version bound to the production D1 runs the new release's migrations against production on its first request. Instead, serve a local copy with the updated build:

```sh
npm run db:export-d1
npm run db:rehearse -- --from .emdash/backups/<export.sql> --persist-to .emdash/backups/rehearse-<date> [--media-sample 20]
# build exactly as the deploy builds (same script, same environment), then run the command it prints:
npx wrangler dev --persist-to .emdash/backups/rehearse-<date> --port 8790 --ip 127.0.0.1
# request pages, stop the server, then:
npm run db:rehearse -- --compare --persist-to .emdash/backups/rehearse-<date>
```

`db:rehearse` lets Wrangler create the local D1 file and loads the export into it. It copies the code of every active registry and marketplace plugin from R2 (`registry/<id>/<version>/`, `marketplace/<id>/<version>/`). Without those objects, pages that call a sandboxed plugin fail with "Plugin route not found", which looks like an upgrade defect. `--media-sample <n>` copies the newest media files; a whole library takes seconds per object, and a sample is enough to see images on the checked pages. Use a fresh, empty `--persist-to` folder for every rehearsal so the copy starts unmigrated. The copy holds users, sessions and content, so `db:rehearse` refuses a folder Git would track; keep it under `.emdash/backups/`.

**Build the rehearsal like the deploy.** Use the deploy's own build script and every variable its build environment sets. A plugin a build leaves out is a plugin EmDash forgets on start: on one site the email provider was only included when a sender variable was set, the rehearsal build lacked it, and the first start cleared the site's `emdash:exclusive_hook:email:deliver` selection. A production deploy built the same way would have stopped all mail without an error. Prefer settings that live in code; and when `--compare` reports a row lost from `options`, find which setting it was before deploying.

The first request applies the pending migrations to the copy. Before trusting what you see, make sure the requests appear in that server's own log: stopping a background `wrangler dev` can leave its `workerd` child serving the port, and a new rehearsal then silently answers from the previous one. `db:rehearse` checks the port before printing the command, and `--compare` refuses to run while the port is still in use. The comparison reports the migrations applied, every table whose row count changed, new and dropped tables, `integrity_check` and `foreign_key_check`, and fails when a table lost rows. Also check public routes, media, the admin sign-in redirect and `/_emdash/api/health` on the rehearsal server.

### Production content on the local dev server

To preview or judge work locally against what the live site holds (an owner reviewing a design, content corrections made in production, a local copy that has drifted), serve the same export with `astro dev`. Nothing is written to Cloudflare or to the site's own `./data.db`:

```sh
npm run db:export-d1
npm run db:local-copy -- --from .emdash/backups/<export.sql> --to .emdash/backups/local-<date> --origin https://<live-site>
# then run the command it prints, for example in PowerShell:
$env:EMDASH_SQLITE_URL = 'file:./.emdash/backups/local-<date>/data.db'; $env:EMDASH_LOCAL_MEDIA_DIR = './.emdash/backups/local-<date>/uploads'; npm.cmd run dev
```

`db:local-copy` loads the export into `<to>/data.db` (foreign keys checked after loading, as `db:rehearse` does) and refuses a copy that fails `integrity_check` or `foreign_key_check`. Media files are not in the database: with `--origin` it fetches every file from the live site's public media route, which takes seconds for a few hundred files; without it, from R2 one object at a time. It copies the code of active registry and marketplace plugins from R2 too (`--bucket <name>` when `wrangler.jsonc` does not name it). Astro runs one dev server per project, so stop the running one first (or pass `--force`). The dev server reads `EMDASH_SQLITE_URL` and `EMDASH_LOCAL_MEDIA_DIR` in `astro.config.mjs`; a site created before they existed adds the two `process.env` fallbacks there by hand. The copy holds users, sessions and content, so the command refuses a folder Git would track. Its settings keep the live address, so logging the CLI in to this local server needs the steps in `emdash-site-setup` ("The local dev server").

After the production deploy, `npm run check:live -- --origin <https://site>` requests every sitemap page and every stylesheet those pages use. A page passes when it answers 200 or redirects to a page that does, and every stylesheet must answer 200; the sitemap's own host is ignored, so a workers.dev origin is checked even when the sitemap names the final domain.

## 2. Media and immutable releases

For ongoing media recovery, keep a copy outside the production failure domain, such as a restricted backup account or protected off-platform storage. Choose encryption, retention and copy cadence from the site's recovery goals. Keep dated manifests of exact storage keys, SHA-256 checksums, sizes, content types and metadata, including plugin bundle storage if used. Do not propagate source deletes into the only backup. Do not assume R2 has S3 object versioning or that `wrangler deploy` backs up media. Reuse a verified snapshot for an upgrade that leaves its referenced bytes unchanged.

Pair each database recovery receipt with a media manifest from the same freeze/window. D1 and R2 have no shared transaction: a later media copy is acceptable only if every referenced key/byte version is preserved. Verify restored images against real CMS storage keys, including mixed case. Keep release code, lockfile, bindings, redirects and DNS/Access configuration separately. The seven-day `/_astro` archive in [edge lifecycle](edge-cache-lifecycle.md) protects cached/open pages; it is distinct from media DR.

## 3. Secret escrow and rotation

`EMDASH_ENCRYPTION_KEY` is operator-provided and absent from database backups. Keep the **entire comma-separated rotation list** in a secret-manager recovery copy. Add independent offline escrow when the site's recovery goals require it. Reuse the existing key-list version for releases that do not change it; never put key values in release notes or Git. Other runtime/provider credentials and environment configuration also need appropriate recovery procedures.

Generate with `npx emdash secrets generate`; set the Worker secret using `wrangler secret put EMDASH_ENCRYPTION_KEY` for the selected environment. Follow the [official secrets guide](https://docs.emdashcms.com/deployment/secrets/): prepend the new key, retain previous keys for reads, re-save each plugin secret, inventory every integration and verify with only the new key before removing old keys from the live list. Retain historical keys in escrow as long as retained database snapshots reference them. There is no complete built-in key-ID usage report. Losing every matching key makes encrypted values unreadable; rotate affected provider credentials and re-enter replacements if escrow is unavailable.

## Restore drill and incident order

Quarterly, import a full D1 SQL export into a **disposable** database, copy its matching media into a disposable bucket, restore the matching key list and deploy the recorded compatible code/config. Restrict traffic, disable real mail/webhooks/cron side effects, then verify fresh admin login, setup-status lockdown, a content route, exact media bytes and plugin-secret decryption with a safe provider test. Separately rehearse cron in the test environment. Record observed RPO/RTO and evidence; restore success means working application state, not a successful import command. Time Travel restores the selected database in place; a drill against another DB needs an exported copy, not a production restore command.

During an incident: restrict public setup/admin paths and writes, capture current state, select a compatible recovery point, then restore DB + matching media + key/config + code. Time Travel restore is destructive to later writes; record their reconciliation plan first. Only then run the deliberately targeted command:

```sh
npx wrangler d1 time-travel restore <database-uuid> --bookmark <recorded-bookmark> --config wrangler.jsonc --env production
```

Verify migrations without mutating, setup status, login, content, media and integrations before reopening traffic. Purge affected HTML/robots and verify cron after restoring. Never reset/reseed production or delete users to fix login; an empty/half-reset database can reopen public administrator creation. A Worker rollback alone does not restore CMS data, secrets, media or edge rules.
