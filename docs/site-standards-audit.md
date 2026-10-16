# Read-only downstream standards diagnosis

Phase 4 starts with `scripts/audit-site.mjs`. This is a diagnostic scaffold, not a certification engine or modernization command. It never executes a target's package scripts/configuration, installs dependencies, synchronizes skills, opens its live database, writes CMS content, uploads media or deploys. No network is used.

```sh
npm run audit:site -- --root ../my-site
npm run audit:site -- --root ../my-site --out ../private-reports/run-001
npm run audit:site -- --root ../my-site --db-snapshot ../private-backups/closed.sqlite --strict
```

Without `--out`, JSON goes to stdout. With it, a new report directory receives JSON and Markdown. Output must be outside the audited target, including through symlinks, and an existing directory is never overwritten. Choose private storage for reports; no real downstream reports belong in this template. No scheduler or Actions job is installed.

The default source is `standards/baselines/0.1.1.json`, an exact standalone copy of the manifest at private immutable commit `28ccf82b3047eb615cd57ca55141751e0d29af11`. Its SHA-256 must equal `a30dfde700dac0ead090ca19f743312d5bb4cd886aa51facd387c372db56b2c4`. `--standards-file` accepts an offline copy only with that same digest. Missing/tampered standards abort; mutable main and a matching version label are insufficient. Consumers do not need old private Git objects. Supporting other standards versions/commits needs a reviewed resolver extension.

Each rule has ID/version, status, required/recommendation severity, evidence paths, expected/observed facts, confidence, applicability, remediation reference and verification bounds. Static version equality is a comparison fact, not runtime compatibility; a newer version is a review warning rather than an automatic downgrade recommendation. Source files are hashed without evaluating configuration. Raw config, env, package names outside the baseline allowlist, private Git paths/remotes and database rows are withheld.

`--runtime node-sqlite` is the default; `cloudflare-d1-r2` explicitly reports its uncertified standards profile as unverified. Node engine declarations are observed, not evaluated as deployment runtimes. Missing/invalid/symlinked evidence remains unverified. Skill checks compare available normalized manifest hashes; missing legacy hash manifests, complete managed membership, local overrides and upstream currency remain unverified. They never trigger a sync.

Schema measurement requires an explicitly supplied **closed, consistent offline SQLite snapshot**, without WAL/SHM/journal sidecars and at most 64 MiB. Only a temporary private copy is opened read-only/query-only; it is removed afterward. Generated/hidden columns are counted through table_xinfo. No collection tables or a missing/refused snapshot is unverified; 51 physical columns fails the 50-column budget. Never copy a live database file alone to manufacture a snapshot. D1 comparison and consistency/export acquisition belong to #8. The caller is responsible for obtaining the supported snapshot before diagnosis.

Ordinary invocation exits 0 when it can produce findings, even when findings need work. `--strict` exits 1 for required fail/unverified rules; invalid usage, missing standards or unsafe output exits 2. Strict policy covers only rules implemented as required by this scaffold. It is **not full site acceptance**; visual, accessibility, actual editor, locale/cache/forms, managed skill membership and cloud checks remain explicit unverified recommendations pending adapters.

## Next packages

1. Complete capability/schema/skill membership adapters and stable report schema tests; distinguish inapplicable scopes with explicit evidence.
2. Import route/state capture evidence and actual editor acceptance without mistaking annotations for successful edits. Use local browser tooling, never target script execution during diagnosis.
3. Add one deterministic, revision-bound code recipe with preconditions, twice-run safety, tests and rollback on a disposable copy. Do not create an automatic aesthetic retrofit.
4. Select an explicitly authorized downstream pilot and record original requirements, public/editor checks and before/after evidence in a reviewable branch.
5. Extend D1/R2/media scopes after #8/#9. Until then, #2 remains open and no full infrastructure pass is implied.
