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
