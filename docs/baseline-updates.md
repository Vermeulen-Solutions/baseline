# Updating generated static sites

`npm run sync:baseline` updates shared primitives, tokens, verification tools and
the four selected shared skills in generated `static` and `static-sveltia` sites.
It reads upstream files as data from Baseline's fixed GitHub repository at an
explicit immutable commit. It never executes an upstream generator or imports
remote scripts during synchronization. The root EmDash source checkout continues
using its existing CMS skill synchronization tools; it has no generated static
managed-file receipt.

New projects record `https://github.com/Vermeulen-Solutions/baseline` as their
source. The current generator contract and synchronization helper also accept
the exact historical URL `https://github.com/Vermeulen-Solutions/emdash-baseline`.
These are two names for the same trusted upstream, not configurable repositories;
forks, other owners/hosts, URL suffixes and query strings are not accepted.
Downloads always use the canonical `baseline` path at the requested immutable
commit, regardless of the recorded name. Validation and updates preserve the
original provenance record rather than rewriting generation history.

Existing sites should review and adopt the updated self-contained
`scripts/sync-baseline.mjs` through their normal staged update process. The helper
adds no new module/file requirement. Older helper copies still use the historical
download path; if that path is unavailable, a reviewed manual helper update is
needed first. Do not change an older site's provenance URL alone and expect its
older validator to understand the new name.

```sh
npm run sync:baseline -- --ref <40-character-Baseline-commit-SHA>
# Review .baseline/updates/<SHA>/stage.json and files/ against your working tree.
npm run sync:baseline -- --apply <same-SHA>
npm run verify
npm run build
npm run check:dev-tools
```

Stage before applying. Files are eligible only if present in the site's installed
managed-file inventory and classified as shared or client-calibrated. New upstream
paths, packages, npm scripts, profile IDs and specialist skills cannot enter via
this command. Routes, content, site settings, the site-owned Base layout and
Sveltia's repository/auth configuration are excluded. Structural additions require
a reviewed generator migration; dependency changes require a separate package and
lockfile review. This ceiling intentionally favors bounded updates over silently
adopting future upstream capabilities.

Apply preflights all paths and hashes. Symlinks, traversal, altered staged bytes,
metadata drift or local edits made after staging stop the apply. A file changed
locally since generation or its last successful update is a conflict: the local
file remains, and the incoming version stays under `files/` for manual comparison.
Other eligible files can apply. There is no force-overwrite or automatic text
merge. Keep your calibrated `global.css`; merge only relevant upstream changes
and run token audits. A deleted local file is also a conflict, not resurrected.

The comparison is whole-file base/local/incoming hashes, not a textual three-way
merge: even edits on different lines of the same shared component are proposed
for manual review. These proposals live in `.baseline/updates/<SHA>/`, not the Git
index. Apply can exit successfully with conflicts preserved; check the returned
conflict list before treating an update as fully adopted.

The tracked managed-file receipt records per-file update commits and `lastSync`
with applied/conflicting paths. The original generation source remains intact in
`baseline.config.json`. Exact starter art-gate exceptions are advanced only for
unchanged infrastructure files whose old hashes matched; local client changes
never receive new exemptions. Review those exception changes alongside source.

Commit the source changes, managed receipt and applicable exception updates after
verification. `.baseline/updates/` is ignored local review material; it contains
no credentials. To retry a revision after manual reconciliation, remove only its
specific staging directory and stage again; unchanged conflicts continue to be
reported because their recorded base hash is intentionally preserved.
`lastSync` records the latest operation, not cumulative adoption: a repeated sync
can have no newly applied files while earlier per-file update commits remain
recorded. Retain the original proposal/review evidence when restaging.

The generated `upstream-update.yml` is a manual, read-only workflow: supply a SHA,
then download the proposed patch and stage/conflict report. It applies eligible
files only in its disposable checkout and runs full verification. It never pushes
or opens a PR automatically. Review conflicts even when the verified subset passes;
a green run does not imply every proposed file was applied. Run local synchronization
to reproduce and inspect the proposal before committing. Normal CI checks all visual
source so newly committed visual work cannot bypass the Art Direction Record.

The root Baseline weekly update workflow similarly produces a dependency patch
after verification, rather than directly pushing to `main` or suppressing failures.
CMS skill updates remain explicit, staged operations documented in
`docs/skill-synchronization.md` in the full EmDash repository.

Template accessibility lint is an additive tooling upgrade for older generated
sites. Current generation includes `eslint.config.mjs`, portable regression tests,
four development dependencies and `lint:scripts`/`lint:templates`; bounded sync
does not add those package entries, scripts or new managed-file membership to an
existing installation. Review the configuration and exact development versions
from the selected Baseline revision, use Node `^22.22.3 || ^24.16.0 || >=26.3.0`,
and regenerate the site's npm lockfile after installing. The installed-site
template command is `eslint src --max-warnings 0`; the additional overlay target
belongs only to the Baseline source repository. Resolve diagnostics with reviewed
source fixes or narrowly justified line exceptions, then run full verify/build
before committing. A reviewed generator migration is needed to expand managed
membership; do not silently edit the receipt or adopt starter art-gate exemptions
for client components.

Fluid-token diagnostics are another bounded upgrade: an already-managed
`scripts/design-system.mjs` can be proposed through sync, preserving the site's
calibrated `global.css`. Review newly rejected expressions against the documented
affine grammar before changing client values. The additive JSON `fluid` report
has advisory resize estimates; these do not change the audit's pass/fail policy.
Current generation also ships `tests/fluid-tokens.test.mjs` and
`docs/design-framework.md`, and includes the mathematical suite in `test:design`.
Older receipts and package scripts do not acquire those additions through sync.
Adopt them explicitly in a reviewed generator migration, or copy the portable
suite/document as locally owned files and add the suite to the existing design
test command. Retain existing tests and perform verify/build plus local rendered
resize acceptance before committing. No new dependency is required.
