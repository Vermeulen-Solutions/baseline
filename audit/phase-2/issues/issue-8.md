# Read-only SQLite/D1 parity, supported seed export and isolated remote inspection

## Outcome and baseline correction
Provide explicit inspection/export tools, not bidirectional synchronization. The starter uses ./data.db in astro.config.mjs, not .emdash/data.db. Node/local SQLite remains the default; Wrangler/D1 is optional tooling for sites configured for Cloudflare. The npm package is wrangler, not @cloudflare/wrangler.

Use EmDash APIs/CLI for content/model writes and portable exports. Read-only physical schema introspection is appropriate; generic raw-table copying or editing internal CMS tables is not the public contract. A seed bootstraps content; it is neither a production migration nor a complete backup/site transfer.

All commands below are proposed.

## A. db:diff — structural parity
Require explicit local path plus either a saved schema snapshot or named Cloudflare config/environment/account/database. Resolve and print the non-secret target identity before queries; fail ambiguous binding/environment resolution. Parse JSONC/TOML with supported parsers, not comment-stripping regex. Never fall back to the first DB binding.

Read SQLite schema metadata (including table_xinfo for generated/hidden columns where supported), types/affinity, defaults, nullability, primary keys, indexes, unique constraints, foreign keys and migration versions. Normalize semantically equivalent definitions; do not compare CREATE TABLE strings literally. Separate CMS-managed, plugin, engine/system and custom schemas.

Apply the <=50 total physical-column project budget to actual collection tables, including system/legacy/hidden columns; D1's documented platform cap is 100. Registration count is not physical width. Also rehearse representative expanded queries and check D1 row/statement/binding limits; a column-count pass alone cannot certify runtime safety.

Compare physical schema, CMS field registry/logical model and seed expectations as separate layers. Flag unregistered columns as candidates requiring review, not safe-to-drop orphans. Schema equality never proves content, locale/reference, menu or media parity.

Output deterministic JSON/Markdown with source snapshot times/fingerprints and statuses equal/drift/unverified/not-applicable. Proposed exits: 0 verified equal, 1 verified drift/budget violation, 2 unavailable/invalid/incomplete verification. Required remote targets fail closed on auth/network/unsupported introspection. Local-only mode is explicit.

## B. db:export-seed — supported, privacy-aware bootstrap artifact
Wrap installed emdash export-seed (already available in 1.1.0) rather than dumping raw tables. Verify its help/version; export read-only and refuse incompatible migration state. Default schema-only or explicitly allowlisted collections/fields; private business/editorial fields can contain personal data even when users/sessions/secrets are excluded.

Write a new candidate file first; require an explicit output/replacement choice to replace seed/seed.json. Preserve semantic array order, canonical references and supported values while formatting deterministically. Validate against EmDash's seed schema, not just src/live.config.ts: this starter registers one generic _emdash live collection.

Document media portability: seed export contains no bytes; $media URLs must be reachable when seeded, and Portable Text media IDs/URLs may not be portable. Detect/report unsupported mappings. Rehearse a fresh disposable seed and report what it reproduces; use supported site packages for complete transfer into an empty target.

## C. db:pull-remote — isolated inspection snapshot
Read from an explicit D1 target using supported export/backup facilities and a version-tested local reconstruction adapter. Default destination is a new ignored directory/database, with identity/time/hash receipt and restrictive handling of private content. Never overwrite ./data.db, select a new snapshot if a destination exists, and do not provide a --force path that promotes a remote dump into the working database.

Do not launch the app, seed, migrate or run exported triggers automatically against a reconstructed snapshot. Define handling of D1 engine tables, indexes/triggers, migration metadata, snapshot consistency and unsupported SQL. Prefer a consistent supported export; multi-query metadata scans must disclose drift/consistency limits. Verify integrity/foreign keys and representative read-only queries before reporting success. An optional sanitized test copy is a separate operation.

For a portable site copy, prefer EmDash site export/import into an empty disposable site. A raw D1 export is a private database-shaped inspection/recovery artifact; media bytes, credentials, users and plugins have different transfer rules.

## Acceptance criteria
- [ ] Local/disposable-D1 fixtures detect added/removed/generated columns, index/FK/default drift, registry/physical mismatch, incompatible versions and >50 columns; equivalent schemas normalize without false failures.
- [ ] Offline/unauthorized/ambiguous remote target produces exit 2/unverified, never a pass or target fallback.
- [ ] Seed export preserves order/reference semantics, excludes unselected private content and round-trips supported fixtures; known media limitations are reported.
- [ ] Pull reconstructs a validated new snapshot, never changes developer DB/cloud data and rejects existing/unsafe output paths.
- [ ] Tests cover malformed export, failed reconstruction, partial/offline reads and backup consistency; sanitized fixtures need no credentials in ordinary CI.
- [ ] docs/database-workflow.md distinguishes schema, content parity, seeds, transfers, snapshots, migration preflight and restore drills. db:diff never applies DDL.
- [ ] Separate optional disposable-D1 integration run records target/version, quotas and actual representative query evidence.

## Dependencies
#3 fixes the supported-version/capability matrix. Reuse the existing local column-budget work once reviewed/landed. #2 consumes reports later; #9 uses environment/receipt conventions. No production schema repair, deployment or destructive synchronization is included.

## Sources
[EmDash CLI](https://docs.emdashcms.com/reference/cli/) · [site transfer](https://docs.emdashcms.com/guides/site-transfer/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) · [Wrangler D1 export/execute](https://developers.cloudflare.com/d1/wrangler-commands/).

## Implementation progress — Phase 2 (2026-10-15)

The pre-existing physical SQLite column-budget implementation was reviewed and its tests pass, including generated columns and the 50-column threshold. A consistent local backup/restore rehearsal supports upgrades. This is not db:diff/export-seed/pull-remote or D1 parity; those deliverables and disposable target verification remain outstanding.

Local implementation/evidence: audit/phase-2/README.md, runtime receipts, tests and standards/manifest.json. Changes are uncommitted; no production deployment or stable release is implied.
