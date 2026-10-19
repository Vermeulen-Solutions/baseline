# Internal engineering maintenance

Tracking issues are local, reviewable records; no external issue or message has been published. Scope is infrastructure and developer experience only. Preserve every existing package command, public source, CMS behavior and generated-profile boundary. Execute issues in order, with a separate commit and verification receipt per phase.

## ENG-1 — Test inventory and fast feedback

Status: complete. Dependency: inventory review.

Targets: `package.json`, `scripts/run-tests.mjs`, `scripts/check-ci-fast.mjs`, `tests/test-tiers.json`, `tests/engineering-tooling.test.mjs`, `.github/workflows/design-checks.yml`, `profiles/file-inventory.json`, README and verification documentation.

Inventory all 34 current test files, retain active coverage, explicitly classify unit/contract tests versus lifecycle, server, database and generated-project rehearsals. Keep `npm test` and `verify` complete. Add `test:unit`, `test:rehearsal`, `verify:fast` and a discoverable fast CI command. Fail classification when a test is added without a tier. Full rehearsals remain mandatory in CI, separately from the fast job.

Acceptance: unit tier below 10 seconds (target 8); complete suite passes; fast CI records and enforces under 60 seconds including normal build/release validation. Record actual timings and machine context. Prune only proven obsolete coverage.

## ENG-2 — Shell-independent process execution

Status: complete. Dependency: ENG-1 passed.

Targets: new `scripts/process-runner.mjs`, `scripts/auto-update.mjs`, `scripts/d1-export.mjs`, `scripts/pilot-migration.mjs`, `scripts/verify-profiles.mjs`, `tests/audit-modernize.test.mjs`, process contract tests and Windows command documentation.

Inspect all spawn sites. Retain direct `process.execPath` calls and argv-based native git/gh calls. Replace shell-string npm/npx calls with Node plus resolved npm CLI; pass arguments separately, including spaces/metacharacters. Distinguish launching npm from PowerShell (use `npm.cmd`, which does not invoke npm.ps1) from nested process portability. Never change machine execution policy.

Acceptance: Windows smoke checks run without policy bypass; child exit/error propagation preserved; offline tests prove argument integrity, missing launcher diagnostics and npm lifecycle behavior. Unix branches covered by portable contracts; do not claim an actual Unix run locally.

## ENG-3 — Actionable CLI gate failures

Status: planned. Dependency: ENG-2 passed.

Targets: `scripts/check-schema-budget.mjs`, `scripts/schema-column-budget.mjs`, `scripts/check-art-direction.mjs`, `scripts/design-system.mjs`, schema/design tests and engineering CLI fixtures.

Show Expected vs Received and a remediation file/command for schema overruns (physical table, actual versus 50, ordinal overflow columns including generated/retained columns), invalid art records (exact fields and required structure diff), and contrast failures (scoped token pair, measured ratio, required ratio). Preserve JSON output and existing 3:1 non-text versus 4.5:1 text thresholds. Avoid changing privacy-sensitive audit output.

Acceptance: deliberate invalid SQLite, AGENTS.md and CSS fixtures return failure with actionable, stack-free output; healthy gates and full verification pass.

## ENG-4 — Script inventory and shared helpers

Status: planned. Dependency: ENG-3 passed.

Targets: `audit/engineering-inventory.md`, active infrastructure CLIs, `scripts/infrastructure-io.mjs`, syntax gate and profile manifests where required by import closure.

Review all 58 current script bodies and graph edges. Resolve orphan candidates using package commands, workflows, docs and imports. Consolidate compatible argument/JSON/main-guard logic using the existing bounded helpers. Preserve optional JSON semantics, async I/O, redaction and established exit-2 unverified protocols where they are intentional compatibility contracts. Use exitCode 1 for ordinary operational CLI failures and allow cleanup to finish. Do not drag CMS-only helper dependencies into shared static tools.

Acceptance: every retained script has a maintenance purpose or consumer; every deletion has recorded evidence; no duplicate compatible helpers in touched CLIs; script syntax and full `npm run verify` pass.

## Verification log

Windows x64, Node 24.21.0. Baseline: 218/218 tests, 60.675s. Phase 1: 219/219 tests, 79.734s while fast CI/build also ran; full verify passed, Astro 46 files with zero errors/warnings/hints. Fast CI: 32.700s, unit step 5.982s, under60Seconds true, all eight steps exit 0. A competing-load unit run reached 10.052s; final isolated benchmark required. No tests removed: no obsolete coverage established. See [file inventory](engineering-inventory.md).

Phase 2: 221/221 tests (62.432s), complete verify passed; zero Astro diagnostics. Process/lifecycle subset 10/10 passed; final resolver contracts 3/3 passed after Unix launcher symlink support. Syntax checked 125 modules. No shell-string process invocations remain in scripts or test harnesses. Windows commands ran via npm.cmd under the existing policy. Unix prefix resolution is fixture-tested; no Unix host run claimed.
