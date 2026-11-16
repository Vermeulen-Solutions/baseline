# Standards 0.2.0 certification evidence (2026-11-16)

Scope: Node/SQLite/local storage with the pinned Windows Chromium, on the representative starter CMS contracts. The certified source is commit `38dc55f6d8f2330bedaf53c807cb35167a696b6c` (tree `41474a82eb7d260b0c1cd6e1b9ce4f677adf3772`). Machine-readable receipts are in [verification.json](verification.json). Release notes: [standards/releases/0.2.0.md](../../standards/releases/0.2.0.md).

## Version decision

`audit:baseline` showed no drift between declared, locked and installed versions. `check:upstream` reported 14 updates. Every non-major one was adopted: Astro 7.4.12, `@astrojs/node` 11.1.13, `@astrojs/react` 7.1.9, React and React DOM 19.3.1, and five development tools. EmDash 1.5.0 is current.

Deferred, with a plan in [docs/plans/playwright-1.65-and-typescript-7.md](../../docs/plans/playwright-1.65-and-typescript-7.md):

- `@playwright/test` 1.65.1, because it moves the pinned Chromium from revision 1248 to 1255 and every reference image would need review;
- TypeScript 7, a major version that `@astrojs/check` 0.9.12 and `@typescript-eslint/parser` 8.72.2 do not accept yet;
- `@types/node` 26 and `parse5` 8 (majors; the installed 24.19.2 and 7.3.0 are the latest in their current majors).

Astro 7.4.2 and `@astrojs/react` 7.1.1 raised their minimum Node to 22.23.4, the October 2026 security release. The engine range became `^22.23.4 || ^24.22.1 || >=26.12.1` (the matching security release on each line), and CI and the visual renderer moved to Node 24.22.3. The upstream release notes from 7.4.1 to 7.4.12 were read for the areas Baseline depends on: the image endpoint, View Transitions, CSP hashes, `memoryCache()`, i18n fallback and `security.allowedDomains` header validation (7.4.11).

## Clean-checkout rehearsals

A fresh clone of the source commit, `npm ci`, then each check, on Node 22.23.4 (the engine minimum) and Node 24.22.3 (the CI pin and renderer):

| Step | 22.23.4 | 24.22.3 |
| --- | --- | --- |
| `doctor`, `npm ci` | pass | pass |
| `verify` (lint, CSS, art direction, tokens, unit and rehearsal tiers, typecheck) | pass | pass |
| `build`, `check:release-artifact`, `check:schema-budget` | pass | pass |
| `check:dev-tools` | pass | pass |
| `check:ci-fast` | pass, 49 s | pass, 45 s |
| `audit:html` after `npx emdash seed seed/seed.json` | pass, 9 files, 10 SSR responses | pass, 9 files, 10 SSR responses |

`audit:html` on the unseeded clones reported the starter's `/about` link as a 404. That is the documented contract: the audit checks published content and does not seed it. The certification sequence now says to seed the clean checkout first.

## Local suites (Windows, Node 24.22.3, Playwright 1.64.1, Chromium 1248)

All in the clean 24.22.3 clone, one at a time:

- visual suite against the unchanged reference images: pass; `--repeat=3`: 336 passed, none flaky (17.6 min); sensitivity, functional and cleanup: pass;
- editor rehearsal (disposable CMS: edit targets, save, reload, publish): pass;
- `check:emdash-current` (roles, edit locks, revision diff and restore, inline toolbar): pass;
- metadata integration (12 routes), forms integration, `check:cache`, `check:native-images`: pass;
- database and local CMS/media rehearsal with mocked R2 (`rehearse-infrastructure`): pass.

Two harness problems surfaced and are recorded in the receipt. The first `--repeat=3` attempt stopped at Playwright's 600-second global timeout after 214 passes, because three passes of the current suite take about 18 minutes; `scripts/test-visual.mjs` now gives each repeat its own budget. The first metadata and infrastructure attempts were started without their required `--out` argument and were rerun correctly.

## Existing database and restore drill

A clean clone of the previous release (`cb46caf`, Astro 7.4.0) seeded the starter content plus one uploaded image. Its database was backed up closed (`VACUUM INTO`) with the media files, then restored into the certified clone:

- the backup and the restore match the source inventory and pass `PRAGMA integrity_check`;
- `check:schema-budget` passes and `emdash migrate --from-config --check` finds no pending or unknown migration;
- the candidate builds and boots on the restored database: `/`, `/posts/welcome` and `/about` return 200, the restored image is served as `image/webp`, and `/_emdash/admin` redirects to sign-in (sign-in itself was not attempted).

Finding: the first restore went over a target that still had `data.db-wal` and `data.db-shm` from earlier runs. SQLite replayed them and the first query reported a malformed database. The restore runbook ([docs/node-backup-restore.md](../../docs/node-backup-restore.md)) now removes those files before copying.

## Not covered

- The Workers/D1/R2 profile stays unverified (Phase 5).
- An upgrade across an EmDash release within this certification: the previous Baseline release already ran EmDash 1.5.0, so the database schema does not change. The 1.3 to 1.5 database upgrade after standards 0.1.1 has its own evidence in [docs/emdash-1.5-upgrade.md](../../docs/emdash-1.5-upgrade.md). The drill covers a database written by the previous Baseline release.
- Admin sign-in, live notification providers, browsers other than the pinned Windows Chromium.
