# Reviewed upstream maintenance

Baseline maintenance workflows produce verified proposals for review. The root upstream review runs weekly; when dependency, third-party skill or Sveltia CMS pin updates pass verification, it opens or updates a Pull Request on `automation/upstream-update` (or an Issue if Pull Request creation is restricted by repository policy) pointing to review documentation, package changes, skill diffs and the pin change. A [Renovate pilot](#renovate-pilot-pinned-packages-and-github-actions) proposes the exact-pinned packages, GitHub Actions and workflow Node versions that the weekly review leaves alone. Generated static profile maintenance workflows remain manual and read-only.

## Root Baseline dependency and skill proposals

The root [upstream-update.yml](../.github/workflows/upstream-update.yml) runs every Monday at 08:00 UTC and supports manual dispatch:

```sh
gh workflow run upstream-update.yml --repo Vermeulen-Solutions/baseline
```

It installs the existing lockfile with `npm ci --no-audit --no-fund`, proposes in-range dependency changes with `npm update --save --no-audit --no-fund`, checks third-party skills with `npm run sync:upstream-skills`, moves the Sveltia CMS pin (below), then proves the resulting lockfile with another clean `npm ci`. Exact version pins remain pinned; this is not a major-version or certification upgrade.

The candidate checkout runs `npm run verify`, `npm run build`, and `npm run test:profiles`. Root verification includes script syntax, art direction, token audits, unit tests, Astro typecheck and the applicable schema budget preflight. Both generated static profiles receive independent installation, verification, builds and HTTP checks. The workflow does not fabricate a SQLite dummy table or run screenshot regression.

The final steps upload `upstream-dependency-review` containing `upstream-update.patch` from `git diff --binary`. When all verification checks pass and updates are proposed, the workflow stages the updates on `automation/upstream-update` and opens or updates a Pull Request with verification evidence and review guidelines. If GitHub Actions PR creation is restricted under repository settings, it opens an Issue instead. An unchanged candidate produces an empty patch and creates neither a branch nor a notification.

Inspect the Pull Request (or download the artifact from the Actions run), review changelogs against [starter meta-review](starter-meta-review.md) and [skill synchronization](skill-synchronization.md), and merge when satisfied. Failed candidate runs remain proposals, upload diagnostic artifacts, and do not open a Pull Request.

## Renovate pilot: pinned packages and GitHub Actions

`npm update` moves only packages declared with a range. Most of Baseline's direct dependencies are exact pins, so before this pilot they moved only when someone ran `npm run check:upstream` and acted on it. The same was true of the action versions and the `node-version` in workflows.

[Renovate](https://docs.renovatebot.com/) now proposes those. It runs self-hosted from [renovate.yml](../.github/workflows/renovate.yml) with the repository config in [renovate.json5](../.github/renovate.json5):

- **What it proposes:** exact-pinned npm packages (patch and minor), GitHub Actions and the Node version in workflows, including the workflow templates under `profiles/`. Ranged packages, transitive updates, third-party skills and the Sveltia pin stay with the weekly review above; Renovate only reports the majors of ranged packages. The `engines` range and the reviewed `overrides` are left alone.
- **When:** new pull requests open on Monday mornings (UTC), only for releases at least three days old. The workflow runs daily so open pull requests are rebased and Dependency Dashboard ticks are acted on.
- **What waits for you:** major updates and every EmDash update (`emdash`, `@emdash-cms/*`) are listed on the **Dependency Dashboard** issue and open a pull request only when ticked there. An EmDash pull request carries a reminder to write the upgrade guide and rehearse the database migrations first.
- **Grouping:** EmDash packages move together, the Astro packages move together, lint and type tooling share one pull request, and GitHub Actions share one.
- **Change notes:** CI requires a standards change note for anything sites receive. After updating the files and before committing, Renovate runs `node scripts/dependency-note.mjs`, which writes `standards/changes/deps-<branch>.md`: what moved, the platforms from `profiles/dependency-inventory.json`, and the `npm install --save-exact` command a site runs to follow. Updates that touch only CI workflows get no note, because CI asks for none. The script uses Node built-ins only, because Renovate's clone has no `node_modules`.
- **Checks:** Renovate pushes as a GitHub App, so its branches start the normal `Design and build checks`. Nothing merges automatically; review each pull request and its linked release notes as you would the weekly one.

### One-time setup

The workflow runs only in `Vermeulen-Solutions/baseline`, and only once a repository variable names the App, so merging it before the App exists does nothing. Sites created from the template copy the workflow and config, but neither runs there: the config is written for Baseline's maintainers, not for a site.

1. Create a GitHub App owned by the organization (Settings > Developer settings > GitHub Apps > New GitHub App). Turn off its webhook. Repository permissions: **Contents**, **Pull requests**, **Issues**, **Workflows** and **Commit statuses** read and write; **Checks** and **Dependabot alerts** read; **Metadata** read (always on). Workflows write lets it update action versions; Issues write lets it keep the Dependency Dashboard.
2. Install the App on the `baseline` repository only.
3. Generate a private key. Add its full contents as the repository secret `RENOVATE_APP_PRIVATE_KEY`, and the App's client ID as the repository variable `RENOVATE_APP_CLIENT_ID` (Settings > Secrets and variables > Actions).
4. Run the workflow once as a dry run (`gh workflow run renovate.yml -f dry_run=true`) and read the log for the updates it found. Then run it without `dry_run`, or wait for the next Monday. The first real run opens the Dependency Dashboard issue.

To pause the pilot, disable the workflow (`gh workflow disable renovate.yml`); open pull requests stay until closed.

## Sveltia CMS pin

The `static-sveltia` profile loads the editor from a CDN in `profiles/static-sveltia/project/public/admin/index.html`: an exact `@sveltia/cms@x.y.z` URL with a SHA-384 Subresource Integrity value. It is not an npm dependency, so `npm update` never sees it. `npm run check:upstream` reads the pinned version from that page and reports it under `pins` as `update-available` when npm's latest release is newer.

The weekly job runs `node scripts/sveltia-pin.mjs --apply`. It downloads the exact file the page will load from unpkg, refuses to continue unless jsDelivr serves identical bytes, computes `sha384-<base64>` from those bytes and rewrites three things together: the URL version and `integrity` attribute, the version named in the profile's `docs/sveltia-cms.md`, and the reviewed design-gate hash for the admin page in `audit/design-gate-exceptions.json`. It moves that hash only while it still matches the page it is replacing; a stale or hand-edited exception stops the update for a person to review. Any failure writes nothing. The pin change is then a proposal like every other: it reaches a Pull Request only after `npm run verify`, `npm run build` and `npm run test:profiles` pass, and the Pull Request shows the old and new script lines. Review the [Sveltia CMS releases](https://github.com/sveltia/sveltia-cms/releases) between the two versions before merging; Sveltia is still in beta and minor releases can change behavior.

To check or move the pin by hand:

```sh
node scripts/sveltia-pin.mjs --check
node scripts/sveltia-pin.mjs --apply
node scripts/sveltia-pin.mjs --apply --version 0.269.0
npm run test:profiles
```

Generated sites own their `public/admin/index.html`, so `sync:baseline` does not move their pin. The weekly change note tells a site to copy the new `<script>` tag (version and integrity together) and, when the page is otherwise unchanged, the new gate hash.

## Independent verification of the automation branch

GitHub does not start workflow runs for events caused by `GITHUB_TOKEN`, so a proposal pushed by the scheduled workflow carries no `pull_request` checks. [automation-verification.yml](../.github/workflows/automation-verification.yml) closes that gap: it runs daily at 10:00 UTC and on manual dispatch, resolves the `automation/upstream-update` head, and re-runs `npm run verify`, `npm run build` and `npm run test:profiles` on that exact commit through `actions/checkout` with an explicit `ref` and full history (`fetch-depth: 0`, like the producing run, because some unit tests read older commits of a file). It only acts while an open pull request matches the branch head, so a merged or stale branch costs nothing; dispatch with `force` to verify the branch without a pull request.

The outcome is published as the `automation-branch-gate` commit status, which appears in the proposal's checks list and can be required in branch protection. Commit statuses are per commit, so a new force-push needs a fresh run and an unverified head stays visibly unverified rather than inheriting an earlier pass. The scheduled job is an independent execution of the same gate, not a stronger claim: scheduled workflows pause after 60 days without repository activity and can be delayed under load, and the producing run remains the first gate. Review the diff as before; this evidence does not replace changelog review.

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
