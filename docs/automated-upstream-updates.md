# Reviewed upstream maintenance

Baseline maintenance workflows produce patches for review. They run with
`contents: read`; they do not push commits, open or merge pull requests, or create
failure-notification issues. No workflow write permissions or automatic PR
approval settings are required. Follow the corresponding Actions run for failures.

## Root Baseline dependency proposals

The root [upstream-update.yml](../.github/workflows/upstream-update.yml) runs every
Monday at 08:00 UTC and supports manual dispatch:

```sh
gh workflow run upstream-update.yml --repo Vermeulen-Solutions/baseline
```

It installs the existing lockfile with `npm ci --no-audit --no-fund`, proposes
in-range dependency changes with `npm update --save --no-audit --no-fund`, then
proves the resulting lockfile with another clean `npm ci`. Exact version pins
remain pinned; this is not a major-version or certification upgrade.

The candidate checkout runs `npm run verify`, `npm run build`, and
`npm run test:profiles`. Root verification includes script syntax, art direction,
token audits, unit tests, Astro typecheck and the applicable schema budget
preflight. Both generated static profiles receive independent installation,
verification, builds and HTTP checks. The workflow does not fabricate a SQLite
dummy table or run screenshot regression.

The final steps attempt to upload `upstream-dependency-review`, containing
`upstream-update.patch` from `git diff --binary`, even when an earlier step fails.
An artifact's existence is not a passing result: inspect every verification step
and the proposed diff. An unchanged candidate can produce an empty patch.
Download artifacts from the corresponding Actions run.

On a clean maintenance branch, inspect the patch, check its applicability with
`git apply --check <patch>`, and apply reviewed changes with `git apply <patch>`.
Run clean installation and the same checks locally before committing. Review the
package and lockfile together; use the repository's normal commit/PR process.
Failed candidates remain proposals and require investigation before adoption.

## Generated static-site source proposals

Generated `static` and `static-sveltia` projects have a different
[workflow template](../profiles/static/project/.github/workflows/upstream-update.yml).
It is manual only and takes a full immutable 40-character Baseline commit SHA.
It stages `sync:baseline`, applies eligible files in its disposable checkout, and
runs `npm run verify`, `npm run build`, and `npm run check:dev-tools`.

Its `baseline-update-review` artifact contains the proposed patch, staged files
and conflict report, and managed-file receipt. Local customizations remain
conflicts; a green run can mean only the nonconflicting subset passed. Inspect
`stage.json` and the receipt's applied/conflicting paths, then reproduce the
review locally before committing. These workflows update bounded shared source
and selected skills, not dependencies, client routes, content or admin settings.
Review dependency upgrades separately with the site's own lockfile.

See [Baseline updates](baseline-updates.md) for staging, conflict handling,
repository-rename compatibility and verification commands. Neither static profile
runs EmDash skill synchronization, schema budgets or database fixtures.

## Explicit skill updates

The root dependency workflow does not refresh EmDash, site or Impeccable skills.
Use the checked-in skills unless you are deliberately reviewing upstream changes:

```sh
npm run sync:emdash-skills -- --check
npm run sync:site-skills -- --check
node scripts/sync-impeccable-skill.mjs --check
```

The EmDash/site helpers default to staging when invoked without `--check`; they
do not silently replace managed skills. Follow [reviewed skill synchronization](skill-synchronization.md)
for candidate review, exact-path conflict resolution, apply and recovery. Review
Impeccable's provenance and license when intentionally refreshing its curated
distribution. Static sites use their profile-filtered `sync:baseline` instead.
