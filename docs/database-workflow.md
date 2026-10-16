# Database inspection, seed candidates and isolated D1 snapshots

These tools inspect structure and produce review artifacts. They never apply migrations, synchronize content, seed an existing site, select a Cloudflare binding implicitly or replace `./data.db`. The supported metadata adapter targets installed EmDash 1.3.0; unknown/pending migration names are unverified. Run against a closed, consistent offline SQLite snapshot, not a live-file copy. Sources over 64 MiB or accompanied by WAL/SHM/journal files are refused. Inspection uses a temporary read-only/query-only copy and reads schema/registry/migration metadata, not content rows.

## Inspect and compare

```sh
# Save the reference metadata first. Capture does not assert equality.
npm run db:diff -- --local ../private-backups/reference.sqlite --capture --out ../private-reports/reference

# Compare actual local schema against saved metadata.
npm run db:diff -- --local ../private-backups/candidate.sqlite --snapshot ../private-reports/reference/schema.json --out ../private-reports/comparison

# Optional: check the reviewed seed's logical schema subset separately.
npm run db:diff -- --local ../private-backups/candidate.sqlite --snapshot ../private-reports/reference/schema.json --seed seed/seed.json
```

Every destination must be new. Reports include deterministic JSON and Markdown, source/schema SHA-256 fingerprints, physical table ownership, registry alignment and migration state. No generated timestamps enter parity comparison. Exits: **0** verified equal (or a successful explicit reference capture); **1** structural/registry/seed drift or budget violation; **2** unverified, missing, malformed, unsupported or ambiguous evidence. Identical schemas above budget still fail. Required unknowns take precedence over drift.

`table_xinfo` counts include retained, generated and hidden columns. Every `ec_*` collection table must stay at or below **50 physical columns**, including system columns. Registered field counts are a separate logical layer; a seed is never a column counter. Unregistered columns are review candidates, never safe-to-drop instructions. Relation-backed reference fields can be storageless; retained unwired references still own columns.

Normalization covers affinity, scalar/default parentheses, nullability, ordered PKs, index uniqueness/order/collation/expressions/predicates, grouped foreign keys, contextual generation/check/collation/conflict clauses, rowid/strict flags, views/triggers, registry and exact applied migration names. Registry JSON object keys normalize recursively; array order and scalar values remain significant. Uncertain SQL expression equivalence is treated conservatively. Known FTS5/shadow metadata is inspected read-only and classified as engine-owned; unknown virtual modules require another reviewed adapter and yield exit 2. Engine tables are reported separately and excluded from application table comparison. CMS table ownership uses a reviewed catalog bound to the installed EmDash source digest. Equal metadata does not prove equal content, locale links, references, menus, media, D1 expanded-query limits or application behavior.

## Export a privacy-reviewed bootstrap candidate

The wrapper invokes the installed `emdash export-seed` CLI on an isolated copy. That CLI checks migration compatibility and exports read-only. No raw-table dump substitutes for the supported seed format. Help and the pinned package contract are checked; raw export payloads and diagnostics are not published.

Create a private allowlist:

```json
{
  "policyVersion": 1,
  "collections": {
    "pages": { "fields": ["title", "content"], "content": false },
    "posts": { "fields": ["title", "excerpt"], "content": true }
  }
}
```

Content is excluded unless `content: true` is explicitly set per collection. Selected fields authorize their values and schema metadata, including defaults/options; review those for personal/business data. The wrapper excludes settings, menus, bylines, taxonomies, widgets, sections, redirects and unselected collections/fields. Array order, selected values, entry identifiers and translation grouping are preserved. References to excluded entries, relation-backed fields without a reviewed mapping and block-type schema gaps are refused rather than silently stripped or expanded to private collections.

```sh
npm run db:export-seed -- --database ../private-backups/closed.sqlite --policy ../private-policy/seed.json --out .emdash/backups/seed-candidate-001
```

The new ignored directory receives `candidate.json` and a hash/policy/exclusion receipt. Candidate validation uses installed EmDash `validateSeed`, independently of `src/live.config.ts`. `$media` URL/bytes and opaque Portable Text media identities are flagged as portability-unverified, with exit 2 and a staged candidate for review. No media bytes are exported or fetched. A reachable source URL is not established by an offline run. Preserve media order/captions and map identities through supported APIs; use site export/import into an empty target when a full transfer is needed.

This command **never replaces `seed/seed.json`** and rejects existing/unsafe staging paths. After reviewing candidate and receipt, explicitly choose that repository file in your editor, replace it, inspect the Git diff and commit. Rehearse the candidate with supported `emdash seed` in a fresh disposable database; do not use a seed as a migration against existing content. Git restores the reviewed source seed; database recovery needs a supported backup/restore drill, not a seed file. Synthetic tests exercise the actual CLI round trip and exclusion of a private field.

## Explicit D1 target and snapshot reconstruction

No live target is configured or certified in this phase. Remote adapters are tested with synthetic HTTP fixtures. Missing config/environment/account/database/token fails closed with exit 2 and does not search other projects or stored login contexts.

```sh
npm run db:pull-remote -- --config ./wrangler.jsonc --env preview --account <explicit-account-id> --database <explicit-database-uuid> --out .emdash/backups/d1-inspection-001

npm run db:diff -- --local ../private-backups/closed.sqlite --config ./wrangler.toml --env preview --account <explicit-account-id> --database <explicit-database-uuid> --remote-out .emdash/backups/d1-comparison-001 --out ../private-reports/d1-comparison
```

JSON/JSONC and TOML use real parsers. Duplicate JSON keys, duplicate matching bindings, missing named environments, account mismatches and preview-binding ambiguity are refused. `--env top-level` explicitly selects root bindings; named environments never inherit a first/default database. Credentials come only from `CLOUDFLARE_API_TOKEN`. The non-secret selected identity/config digest is printed before remote queries. No real target is contacted by ordinary tests or builds.

The adapter uses Cloudflare's official polling export API, preserving a bookmark fingerprint. **An export can temporarily make the selected D1 unavailable to queries**; schedule live acceptance against a disposable target. Downloaded signed URLs/credentials never enter receipts; credentials are not forwarded to the download host. Redirects and unrecognized download hosts are refused. Requests, payloads, polling duration and reconstruction are bounded.

Only a new directory inside ignored `.emdash/backups/` is accepted. `export.sql` and reconstructed `inspection.sqlite` are private data-shaped artifacts, not public fixtures. `./data.db`, existing files, unsafe paths and symlink destinations are refused. Reconstruction runs in a separate bounded Node process; it permits bounded table/index definitions and literal INSERTs, validates integrity/foreign keys and publishes exclusively. It never runs application code, migrations, seeds, exported triggers, virtual modules, ATTACH or arbitrary SQL functions. Unsupported exports are quarantined with an unverified receipt; partial private output is retained, never promoted into a working database. There is no force/restore option.

Keep the account/environment/database identity, acquisition time, bookmark/export/snapshot hashes and consistency limits in private receipts. A consistent D1 export is stronger than a multi-query metadata scan, which cannot assert atomic parity. Actual D1 row/statement/binding limits, representative expanded queries, Workers/R2 adapters and restore behavior still require a separately authorized disposable-cloud integration run. Offline success does not certify those services.

Sources: [EmDash CLI](https://docs.emdashcms.com/reference/cli/), [site transfer](https://docs.emdashcms.com/guides/site-transfer/), [D1 export API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
