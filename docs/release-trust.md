# Backup identity and hosted sign-in checks

These opt-in checks apply to EmDash, not static profiles. They do not migrate content, reset accounts, create credentials, deploy or restore a database. Keep private inventories, paths and logs in ignored storage. A pass has a limited scope; retain real owner login, native publication and isolated recovery evidence separately.

## Check an existing Node/SQLite backup

Run from the project root, after supported consistent acquisition in [Node recovery](node-backup-restore.md). Do not copy an active WAL database as an ordinary file. Pause editorial writes during the source/snapshot comparison, or reconcile intentional later writes before accepting an inventory mismatch.

```sh
npm run db:check-backup -- --config astro.config.mjs --snapshot .emdash/backups/reviewed.db --expected .emdash/backups/expected-counts.json
```

The private expected JSON contains reviewed table counts, for example `{"ec_pages":12,"media":20}`. Include at least one content collection, and media/other collection counts when relevant. The checker also compares the full registered collection/media inventory between source and snapshot. It requires native `_emdash_collections`/`media` tables and registered `ec_*` tables, integrity checks, distinct existing regular files and a closed standalone snapshot without WAL/SHM/journal sidecars. Missing paths, symlinks, hard links, unexpected tables or count mismatches fail without creating or repairing anything. Inputs are bounded to 64 MiB per database and 100 collections. Larger sites need a separately reviewed inspection approach.

The checker statically recognizes a literal `sqlite({url:'file:./data.db'})` imported from `emdash/db`, inside the directly exported EmDash integration object, optionally wrapped in imported Astro `defineConfig`. It never imports/executes target configuration or reads content values. Relative file URLs resolve from the project working directory, as in the root application. Dynamic, spread or imported configurations need operator inspection of the effective target and an explicit `--database <path>`; output then says `operator-explicit`, not automatically verified configuration. A supplied database cannot contradict a supported literal target. `--allow-empty` is only for an intentionally empty native site, with reviewed zero counts; it does not waive identity/integrity checks.

Output includes private resolved source/snapshot paths, counts and snapshot digest. It certifies identity, integrity and inventory only. Equal counts can conceal changed text, missing relationships or swapped bytes. Native application readback, matching media/key recovery and an isolated restore exercise remain required for a recoverability claim. This checker does not replace the metadata-only offline database tools or D1 Time Travel.

SQLite may manage locking/WAL sidecars for a read-only connection to the live source. No application rows are written. The closed snapshot is inspected through an owned disposable copy so read-only WAL-mode inspection cannot add sidecars to the retained backup; that copy is cleaned up afterward. Missing source/snapshot files are never created. This does not use immutable mode against a changing source or ignore a nonempty source WAL.

## Check hosted sign-in before owner setup

EmDash uses Astro's session store; supported adapters provide a filesystem store on Node or KV on Cloudflare. See [official session guidance](https://docs.emdashcms.com/deployment/secrets/#session-and-api-tokens). Inspect the effective release config and generated Worker bindings before deployment: do not set `session: false`, omit the configured session KV namespace or substitute a different environment's binding. Protect bootstrap as required by the setup/cutover skill.

Retain the entire successful Astro build log and check the command's exit status. The tool requires the Astro 7.4 completion marker and rejects the specific native missing/disabled-session warning; unrelated chunk-size warnings remain advisories. A log marker alone cannot establish that a subsequent deploy succeeded or that the log belongs to the requested origin: bind the log, source revision, deployed version and URL in the release receipt.

```sh
npm run check:hosted-auth -- --url https://preview.example.test --emdash-version 1.4.0 --build-log .emdash/backups/release-build.log
```

This probe is explicitly reviewed against EmDash 1.3.0 and installed 1.4.0. For another version, review the native verification route and extend tests before changing the supported version. It accepts only HTTPS or loopback HTTP, refuses origin paths/credentials and follows no redirects. It fetches native setup status, then POSTs exactly `{}` to `/_emdash/api/setup/admin/verify` without cookies, tokens, a nonce or challenge. On both reviewed versions, session presence is checked before setup state and credential writes; a missing setup nonce prevents credential creation. An empty target must reach HTTP 400 `INVALID_STATE`; a completed target must reach HTTP 400 `SETUP_COMPLETE`. `SESSION_UNAVAILABLE`, Access blocks, SPA HTML, wrong error/status, oversized JSON and unknown responses are unverified failures. Requests have ten-second deadlines and JSON is bounded to 32 KiB. No setup-start, options, finish or dev-bypass endpoint is called.

The pass proves session presence and expected native guards. It does not exercise a session-store write, passkey registration, email delivery or a real authenticated browser. The owner creates their passkey and confirms login; then `check:production-setup -- --url <origin>` must verify `success: true`, `data.needsSetup: false`. Keep setup protection in place and preserve existing accounts/data during any repair. [Official authentication guidance](https://docs.emdashcms.com/guides/authentication/) describes the human credential step. A blocked probe is not permission to disable Access or reset setup.
