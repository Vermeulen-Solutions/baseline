# Baseline downstream sync receipts — 2026-10-18

Four synthetic disposable Git sites, two profiles and two provenance forms,
actual GitHub raw downloads at immutable SHAs. See the
[verification report](../../docs/verification/baseline-sync-rehearsal.md) and
[summary](verification.json).

- `commits.json`: real generation, released bridge and controlled candidate SHAs.
- `candidate.bundle`: verified Git bundle preserving the controlled candidate
  commit and changed objects after disposable-branch cleanup; its prerequisite
  is released commit `24ea16fa2144c8691605082aec0c36f18fd282e5`.
- `receipts/<case>/original-*`: generated provenance and managed inventory.
- `receipts/<case>/base/`, `local-*`, `incoming/`: three-way source evidence.
- `design-stage.json`, `*-proposal.log`, `design-apply.log`, `managed-after.json`:
  initial clean update plus preserved conflicts.
- `integrity.json`: original byte hashes, bounded membership and exact exception
  handling; locally edited files did not gain infrastructure exemptions.
- `install.log`, `ci.log`, `verify.log`, `build.log`, `check-dev-tools.log`,
  `fixtures-build.log`, `http-browser.log`, `verification.json`: independent
  dependency/build/HTTP/local Chromium checks.
- `restage-*`: repeat network sync after installation; package/lock and source
  preservation; both unresolved conflicts remain proposed.
- `network-probes.json`: both exact repository names served identical helper
  bytes with HTTP 200, without an observed redirect.
- `candidate-ci.json`, `baseline-unit-tests.log`: separate green candidate CI
  and 117/117 root tests.
- `harness/`: the executed local Windows harness snapshot, including resumable
  preparation after harness assertion corrections. This is audit evidence with
  run-specific paths, not an installed product command. Its preparation publishes
  a controlled candidate branch; use the report's existing immutable commits to
  reproduce, rather than rerunning branch creation.
- `manifest.json`: byte lengths and SHA-256 for every other file in this directory.

The controlled design candidate is intentionally not merged into `main`. The four
sites retain two unresolved file conflicts each; green verification covers the
cleanly applied subset and preserved local design. Publishing/authentication and
cross-platform line-ending conversion are outside this receipt's scope.
