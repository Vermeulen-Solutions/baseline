# Stage 7 on a Node.js host

Read this at Stage 7 when the EmDash site launches on Node.js with SQLite and local media (a VPS, a container host or similar). `emdash-production-cutover` covers only a Cloudflare Workers domain cutover and is not loaded here. This file sets the order and the gate; the commands and their details live in the linked guides, which govern. Everything below runs only within authorization that covers deployment, content transfer or DNS.

## Order of work

Take the steps in this order, because each one protects the next: a recovery point before data changes, the canonical origin before the first admin, and sign-in before DNS moves.

1. **Build and check the release artifact.** Run `npm run verify`, `npm run build`, `npm run audit:html` and `npm run check:dev-tools` on the exact commit to deploy. Start the built server with `node ./dist/server/entry.mjs`; `docs/production-deployment.md` (section 1) lists the commands and the required environment: `SITE_URL`, `EMDASH_ENCRYPTION_KEY`, `PORT`, and persistent storage for the database and `./uploads/`.
2. **Keep secrets out of Git.** Generate `EMDASH_ENCRYPTION_KEY` with `npx emdash secrets generate`, store it in the host's secret mechanism and escrow the complete rotation list separately from the database.
3. **Take a recovery point before any data-changing step.** Follow `docs/node-backup-restore.md`: a consistent SQLite snapshot through `.backup` or `VACUUM INTO`, paired with the media directory and the environment configuration. Copying `data.db` while the write-ahead log is active is prohibited, because the copy can be inconsistent. Check a closed snapshot with `npm run db:check-backup -- --config astro.config.mjs --snapshot <closed-backup> --expected <private-counts.json>`. Matching counts do not replace an isolated restore drill.
4. **Put the canonical domain and TLS in front of the server.** Configure the reverse proxy and process supervision the host uses, set the effective public origin, and confirm valid TLS on the canonical hostname and its aliases before creating the first admin. Do not initialize the production database on a temporary hostname.
5. **Check sessions before the owner signs in.** Inspect the complete build log for missing-session-driver warnings; the Node adapter uses filesystem sessions and they must persist. When installed, run `npm run check:hosted-auth -- --url <origin> --emdash-version <version> --build-log <release-log>`. It proves session presence and the expected guards only, not a passkey or a session write.
6. **Owner creates their credential, then lock setup down.** The owner registers their own passkey or sign-in. Then run `npm run check:production-setup -- --url <origin>`: it passes only when the setup-status API returns `success: true` and `data.needsSetup: false`. A reachable setup page, a 404 or a redirect proves nothing. Never reset or reseed production, or delete users, to repair sign-in.
7. **Transfer content as its own operation.** A code deployment does not move CMS records or media. Use the site export/import flow in `emdash-site-setup` (*Copying an existing EmDash site*) into an empty target, or the migration cutover in `docs/migration-cutover.md` for a WordPress source, including its content freeze and rollback triggers.
8. **Preserve corporate mail when DNS changes.** Record the existing MX, SPF, DKIM and DMARC records first and follow the DNS cutover checklist in `docs/production-deployment.md` (section 4). Configure outgoing mail only when the brief requires it, and confirm inbox delivery before relying on it for sign-in or recovery mail.
9. **Go live.** A site created through setup on EmDash 1.5 or later starts in staging and serves `noindex, nofollow` on every page. Select **Go live** in Settings > General > Site Status, then fetch an ordinary public page on the production origin and confirm the robots tag is gone. Leave preview deployments in staging.
10. **Hand over.** Complete `docs/editor-handoff.md`, record backup ownership and cadence, and update the registry with `npm run site:register` (`docs/site-registry.md`).

## Gate

Stage 7 on Node is complete only when these were observed, not assumed:

- valid TLS on the canonical hostname and aliases;
- `check:production-setup` passing and a fresh sign-in by the owner;
- a recovery point taken and checked before the first data-changing step, with its owner and cadence recorded;
- corporate mail records unchanged, and any changed mail or form provider delivering to a real inbox;
- the site status is live and an ordinary public page carries no `noindex`.

Report each item as observed, pending or not applicable. Prepared configuration and a preview deployment are separate results from an observed production launch.
