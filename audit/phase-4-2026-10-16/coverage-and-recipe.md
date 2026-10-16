# Phase 4 coverage and first recipe — 2026-10-16

README milestone `f132745` leads with the developer workflow, links compact HUD/styleguide thumbnails to full images, adds daily commands and removes internal release-audit prose. The image added alongside it is an unchanged neutral controls capture, not a modified golden or client image.

Implemented static diagnostic coverage:

- AST-based supported configuration: server output, adapter/runtime, React/EmDash calls, explicit Node SQLite/local storage, locale/default-prefix policy and conditional cache-hint applicability. Aliases work; comments, computed/spread/function configurations and unsupported evidence cannot become passes.
- Complete bounded managed-skill inventory versus version-2 receipts: declared membership, required entries, normalized hashes, missing/extra/changed files and symlink refusal. Legacy/missing receipts stay unverified. Local drift is preserved and counted without exporting private filenames. Equality is not upstream authenticity/currency.
- Physical SQLite metadata counts include generated/hidden and retained columns; definition and snapshot digests supplement widths. No seed-width inference, CMS content rows or remote DB access.
- Report schema v2 is checked by generation and serialization. Tests reject invalid versions, unknown/prototype-like fields, invalid statuses/evidence, duplicate IDs, inconsistent totals and non-JSON values. Historical v1 reports are not relabeled.

First recipe `schema-budget-prebuild@1` is revision/branch/target/hash-bound, supports the known Astro 7.4.0/EmDash 1.3.0 profile and exact schema helpers, preserves a supported existing prebuild hook and changes only package.json. Planning never applies. Apply/rollback are explicit, outside-target artifacts retain exact original bytes, and lock/journal plus atomic replacement support a safe retry. Main/master, unsupported hooks/helpers/versions, stale plans, unrelated changes and edited recovery bytes are refused.

Verification uses disposable repositories: apply twice, rollback twice, reapply, zero-write already-current behavior, stale revision/staged edits, modified helper, unsupported shell chain, tampered plan/backup, linked artifacts and prepared-journal recovery. A real npm lifecycle with the actual schema helper and a synthetic build executable demonstrates 51 columns stops both the existing hook and build; a valid schema allows both. The synthetic executable proves gating/order, not Astro rendering. The normal application build is verified separately.

No source under src/public or browser contracts/goldens changed. Browser suites were not repeated for this backend/tooling package. Local-only browser policy and the single-Node fast workflow remain unchanged. TypeScript 6.0.3 was already locked; it is now declared directly because the diagnostic parser imports it.

The self-audit correctly retains required unknowns for its legacy/missing skill receipts and absent DB. Passing fixture policy is not self-certification. No actual downstream site has been selected or changed. #2 remains open for capture/editor evidence ingestion and an explicitly authorized pilot; D1/R2/registry/media parity remains Phase 5.

See [verification.json](coverage-and-recipe-verification.json), the v2 [self-report](static-report-v2.json) and [usage/recipe guide](../../docs/site-standards-audit.md). README is committed separately; Phase 4 implementation is left in the working tree for review.
