# Cloudflare recovery: database, media and encryption keys

Applies to the optional EmDash Workers/D1/R2 target. The root remains Node/SQLite; use [Node recovery](node-backup-restore.md) there. Assign an owner, RPO (maximum lost writes), RTO (time to restore), backup cadence and quarterly restore drill per site.

`emdash site export` is a portable content transfer, **not disaster recovery**. It omits users, passkeys, sessions, credentials, plugin settings/state and secrets. Its target must have an administrator and an empty content area. The admin's logical backup also omits operational state. Neither substitutes for these three pillars.

## 1. Database recovery

[D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) is automatic on supported production databases. Its retention is **7 days on Free, 30 days on Paid**; verify the actual plan and storage generation. A bookmark names a recovery point; it is not an independently retained backup. Keep encrypted full SQL exports off-platform for account loss and longer retention. Schedule at least daily exports for a one-day RPO, weekly full off-platform copies, and verify restoreability and checksums. If account-loss RPO is one day, the daily exports must also leave the Cloudflare account daily. Exports can affect D1 query availability: use a maintenance window appropriate to the site's size.

Before each migration, including first deployment, upgrading EmDash or changing content schema:

1. Identify account ID, database UUID, Wrangler config/environment, deployed commit and release. Review `emdash migrate --status --json` against that exact target and save its fingerprint.
2. Freeze relevant writes or record an explicit consistent recovery window spanning the three pillars. Record UTC time and a **current** Time Travel bookmark in a private release receipt. Check command success and nonempty bookmark, not merely existence of a log file.
3. Verify the media snapshot and key-vault version below exist and can be read by the recovery operator. A missing/stale receipt fails the release before any mutation.
4. Serialize releases by account + database UUID. Apply core migrations with the reviewed fingerprint, deploy, then run `migrate --check`. Wrangler SQL migrations are a separate mechanism for site-owned SQL; they do not replace EmDash core migrations.

These are separate commands for a reviewed deployment runner (PowerShell uses `npx.cmd`). Set `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` securely; replace all placeholders. Stop on any nonzero exit. Do not paste secrets or SQL content into tracked receipts.

```sh
npx wrangler d1 time-travel info <database-uuid> --config wrangler.jsonc --env production --json
npx emdash migrate --status --json --account-id <account-id> --d1 <database-uuid>
# Save/review bookmark, target fingerprint and media/key receipts BEFORE this apply:
npx emdash migrate --account-id <account-id> --d1 <database-uuid> --expected-target-fingerprint <reviewed-fingerprint>
npx wrangler deploy --config wrangler.jsonc --env production
npx emdash migrate --check --account-id <account-id> --d1 <database-uuid>
```

Set `migrations: { runtime: 'check', dev: 'auto' }` in a deployment-managed Cloudflare site's EmDash configuration. Production then refuses requests with pending migrations instead of applying them during traffic. Inspect `EMDASH_MIGRATIONS_MODE` overrides too. Build first to generate `.emdash/migrations.json`; provision D1 separately before migrating it. See the [official core migration contract](https://docs.emdashcms.com/deployment/core-migrations/).

## 2. Media and immutable releases

Replicate R2 objects into a separate restricted backup bucket/account, plus an off-platform encrypted copy. Keep dated manifests of exact storage keys, SHA-256 checksums, sizes, content types and metadata. Include plugin bundle storage if used. Do not propagate source deletes into the only backup; retain deleted/replaced objects for the agreed recovery window. Do not assume R2 has S3 object versioning or that `wrangler deploy` backs up media.

Pair each database recovery receipt with a media manifest from the same freeze/window. D1 and R2 have no shared transaction: a later media copy is acceptable only if every referenced key/byte version is preserved. Verify restored images against real CMS storage keys, including mixed case. Keep release code, lockfile, bindings, redirects and DNS/Access configuration separately. The seven-day `/_astro` archive in [edge lifecycle](edge-cache-lifecycle.md) protects cached/open pages; it is distinct from media DR.

## 3. Secret escrow and rotation

`EMDASH_ENCRYPTION_KEY` is operator-provided and absent from database backups. Store the **entire comma-separated rotation list** in a secret manager and independent encrypted offline escrow. Record vault version IDs/access ownership in recovery receipts, never key values. Other runtime/provider credentials and environment configuration also need recovery procedures.

Generate with `npx emdash secrets generate`; set the Worker secret using `wrangler secret put EMDASH_ENCRYPTION_KEY` for the selected environment. Follow the [official secrets guide](https://docs.emdashcms.com/deployment/secrets/): prepend the new key, retain previous keys for reads, re-save each plugin secret, inventory every integration and verify with only the new key before removing old keys from the live list. Retain historical keys in escrow as long as retained database snapshots reference them. There is no complete built-in key-ID usage report. Losing every matching key makes encrypted values unreadable; rotate affected provider credentials and re-enter replacements if escrow is unavailable.

## Restore drill and incident order

Quarterly, import a full D1 SQL export into a **disposable** database, copy its matching media into a disposable bucket, restore the matching key list and deploy the recorded compatible code/config. Restrict traffic, disable real mail/webhooks/cron side effects, then verify fresh admin login, setup-status lockdown, a content route, exact media bytes and plugin-secret decryption with a safe provider test. Separately rehearse cron in the test environment. Record observed RPO/RTO and evidence; restore success means working application state, not a successful import command. Time Travel restores the selected database in place; a drill against another DB needs an exported copy, not a production restore command.

During an incident: restrict public setup/admin paths and writes, capture current state, select a compatible recovery point, then restore DB + matching media + key/config + code. Time Travel restore is destructive to later writes; record their reconciliation plan first. Only then run the deliberately targeted command:

```sh
npx wrangler d1 time-travel restore <database-uuid> --bookmark <recorded-bookmark> --config wrangler.jsonc --env production
```

Verify migrations without mutating, setup status, login, content, media and integrations before reopening traffic. Purge affected HTML/robots and verify cron after restoring. Never reset/reseed production or delete users to fix login; an empty/half-reset database can reopen public administrator creation. A Worker rollback alone does not restore CMS data, secrets, media or edge rules.
