# Reviewed upstream maintenance

Baseline maintenance workflows produce verified proposals for review. The root upstream review runs weekly; when dependency or third-party skill updates pass verification, it opens or updates a Pull Request on `automation/upstream-update` (or an Issue if Pull Request creation is restricted by repository policy) pointing to review documentation, package changes and skill diffs. Generated static profile maintenance workflows remain manual and read-only.

## Root Baseline dependency and skill proposals

The root [upstream-update.yml](../.github/workflows/upstream-update.yml) runs every Monday at 08:00 UTC and supports manual dispatch:

```sh
gh workflow run upstream-update.yml --repo Vermeulen-Solutions/baseline
```

It installs the existing lockfile with `npm ci --no-audit --no-fund`, proposes in-range dependency changes with `npm update --save --no-audit --no-fund`, checks third-party skills with `npm run sync:upstream-skills`, then proves the resulting lockfile with another clean `npm ci`. Exact version pins remain pinned; this is not a major-version or certification upgrade.

The candidate checkout runs `npm run verify`, `npm run build`, and `npm run test:profiles`. Root verification includes script syntax, art direction, token audits, unit tests, Astro typecheck and the applicable schema budget preflight. Both generated static profiles receive independent installation, verification, builds and HTTP checks. The workflow does not fabricate a SQLite dummy table or run screenshot regression.

The final steps upload `upstream-dependency-review` containing `upstream-update.patch` from `git diff --binary`. When all verification checks pass and updates are proposed, the workflow stages the updates on `automation/upstream-update` and opens or updates a Pull Request with verification evidence and review guidelines. If GitHub Actions PR creation is restricted under repository settings, it opens an Issue instead. An unchanged candidate produces an empty patch and creates neither a branch nor a notification.

Inspect the Pull Request (or download the artifact from the Actions run), review changelogs against [starter meta-review](starter-meta-review.md) and [skill synchronization](skill-synchronization.md), and merge when satisfied. Failed candidate runs remain proposals, upload diagnostic artifacts, and do not open a Pull Request.

## Generated static-site source proposals

Generated `static` and `static-sveltia` projects have a different [workflow template](../profiles/static/project/.github/workflows/upstream-update.yml). It is manual only and takes a full immutable 40-character Baseline commit SHA. It stages `sync:baseline`, applies eligible files in its disposable checkout, and runs `npm run verify`, `npm run build`, and `npm run check:dev-tools`.

Its `baseline-update-review` artifact contains the proposed patch, staged files and conflict report, and managed-file receipt. Local customizations remain conflicts; a green run can mean only the nonconflicting subset passed. Inspect `stage.json` and the receipt's applied/conflicting paths, then reproduce the review locally before committing. These workflows update bounded shared source and selected skills, not dependencies, client routes, content or admin settings. Review dependency upgrades separately with the site's own lockfile.

See [Baseline updates](baseline-updates.md) for staging, conflict handling, repository-rename compatibility and verification commands. Neither static profile runs EmDash skill synchronization, schema budgets or database fixtures.

## Explicit skill updates

Third-party skill updates (Impeccable and upstream EmDash mirrors) can also be checked and synced explicitly:

```sh
npm run sync:upstream-skills -- --check
npm run sync:upstream-skills
npm run sync:emdash-skills -- --check
npm run sync:site-skills -- --check
node scripts/sync-impeccable-skill.mjs --check
```

The EmDash/site helpers default to staging when invoked without `--check`; they do not silently replace managed skills. Follow [reviewed skill synchronization](skill-synchronization.md) for candidate review, exact-path conflict resolution, apply and recovery. Review Impeccable's provenance and license when intentionally refreshing its curated distribution. Static sites use their profile-filtered `sync:baseline` instead.
