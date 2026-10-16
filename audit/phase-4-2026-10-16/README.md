# Phase 4 diagnostic scaffold — 2026-10-16

Implemented `audit:site` as an offline, read-only diagnostic scaffold against the digest-pinned standards 0.1.1 manifest. It reads bounded package/lock/config evidence, compares available normalized skill hashes, records redacted Git state and optionally measures an explicit offline SQLite snapshot through a temporary read-only copy. Source configuration and target scripts are never executed. JSON/Markdown reports must be outside the audited target.

Six focused tests cover offline current/degraded/malformed evidence, tampered standards, absent schema, cloud-profile unknowns, physical/generated/over-budget columns, sidecar refusal, target byte/tree preservation, symlink/output protections, skill drift and strict CLI exits. Private env/path data is absent from reports. The default self-audit intentionally leaves physical schema unverified without an explicit snapshot; it cannot turn a missing DB into a pass.

This begins #2; it does **not** complete it. Managed skill membership/override analysis, complete capability adapters, real route/editor evidence, one twice-safe reversible recipe and an authorized downstream pilot remain outstanding. Worker/D1/R2 remains Phase 5. No downstream site, remote account, production content or deployment was modified.

See [usage and next packages](../../docs/site-standards-audit.md). Example report JSON/Markdown in this folder is a sanitized self-audit, not client data or full certification.
