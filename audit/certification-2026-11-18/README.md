# Standards 0.3.0 certification evidence (2026-11-18)

Scope: Node/SQLite/local storage with the pinned Windows Chromium, on the representative starter CMS contracts, as for 0.2.0. The certified source is commit `f87db802d0c2992d618f9ed2f887c91fa0c9634e` (tree `d565e6d38a0f84ab3c2010924dc72de0d056889f`). Machine-readable receipts are in [verification.json](verification.json). Release notes: [standards/releases/0.3.0.md](../../standards/releases/0.3.0.md).

## Version decision

`check:upstream` on 18 November: Astro 7.4.12, EmDash 1.5.0, the official adapters and React are current, so the 0.2.1 runtime carries over unchanged. Deferred: `@cloudflare/workers-types` 5.20261117.1 (daily types), `@typescript-eslint/parser` 8.73.0 (lint tooling, left for the weekly reviewed proposal), and the majors already deferred in 0.2.0 (`@types/node` 26, `parse5` 8, TypeScript 7). A newer EmDash upstream skill commit (`e7608c6`) is left for the weekly reviewed proposal.

What changed is distributed source, tooling and skills: the design-system iteration (tokens, headings, Card and Grid), delivery tools, the editor-experience guide, Impeccable 4.9.2 and the release tooling itself (change notes and distribution pins).

## Clean-checkout rehearsals

A fresh clone of the source commit (with the machine's global `core.autocrlf=true`), `npm ci`, then each check:

| Step | 22.23.4 | 24.22.3 |
| --- | --- | --- |
| `doctor`, `npm ci` | pass | pass |
| `verify` (lint, notes, CSS, art direction, tokens, unit and rehearsal tiers, typecheck) | pass | pass |
| `build`, `check:release-artifact`, `check:schema-budget` | pass | pass |
| `check:dev-tools` | pass | pass |
| `check:ci-fast` | pass, 59 s | pass, 56 s |
| `audit:html` after `npx emdash seed seed/seed.json` | pass | pass |

## Local visual suite (Windows, Node 24.22.3, Playwright 1.65.1, Chromium 1255)

Against the committed reference images (renewed and reviewed with the design-system iteration in `43a16a0`): 112 passed in 7.1 minutes, one run.

## Findings during certification

- The first candidate (`3caf2e0`) failed `verify` in both clean clones. The global `core.autocrlf=true` gave the clones a CRLF `global.css`, and the resize-text token test matched LF line endings only. Fixed in `77a9ae7`; the whole unit tier then passed in a CRLF clone. Contributors on Windows with that default would have hit the same failure.
- On that first candidate `check:dev-tools` (Node 22) failed on a Google font fetch error and `audit:html` (Node 24) hit its SSR snapshot deadline, both while site builds ran on the same machine. Both passed on the certified commit with nothing else running.

## Not covered

- The Workers/D1/R2 profile stays unverified as a certified profile. The four Workers sites' EmDash 1.5 migrations were rehearsed on local copies and deployed one by one; see each site's maintenance record.
- The editor rehearsal, `check:emdash-current` and the existing-database restore drill were not rerun: the runtime dependencies, database schema and editor code are unchanged since 0.2.0, whose receipts ([2026-11-16](../certification-2026-11-16/README.md)) remain valid.
- The visual suite ran once; `--repeat=3` and the sensitivity run were not repeated.

## Standards 0.4.0 (2026-11-18)

Certified source: commit `64f8827e93ecb5bd1095f60cbf1e193d94f8411b`. Machine record: [verification-0.4.0.json](verification-0.4.0.json). Runtime dependencies (Astro 7.4.12, EmDash 1.5.0, the adapters) and the database schema are unchanged from 0.3.1; deferred updates are development tooling only (TypeScript 7.0.2, type packages, a lint parser) and the upstream EmDash skills refresh.

Clean clones on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3: doctor, `npm ci`, verify, build, release artifact, schema budget, dev tools, ci-fast, seed, seeded build and `audit:html` all pass. The first candidate (`37ae0fd`) failed verify and ci-fast in both clones: four tests matched source with LF line endings. Fixed in `64f8827` (tests normalize what they read); verify (343 s and 374 s) and ci-fast then passed in both clones. The two commits differ only in those four tests and a change note.

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1): 111 passed; the gallery root-typecheck behavior test timed out under load (its child process killed) and passed alone in 15.5 s, as during the 0.4.0 work. Not covered: the Workers/D1/R2 profile (unchanged scope), the editor rehearsal and restore drill (editor and schema unchanged), repeated visual runs.

## Standards 0.8.0 (2026-11-24)

Certified source: commit `2fe1b0e9278f988b508e98f8978c8afc9d5b971e`. Machine record: [verification-0.8.0.json](verification-0.8.0.json). A minor release after 0.7.0 that moves the runtime: EmDash and `@emdash-cms/auth` 1.6.0 (Kumo 2.19.0, one migration that adds `users.last_login_at`), with the design rounds since 0.7.0 (PRs #160–#179). Astro 7.4.12 and the adapters are unchanged. `check:upstream` on 24 November also offered Astro 7.4.13 and `@astrojs/node` 11.1.14; both are deferred to keep this release to the EmDash change.

Clean clones on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3: doctor, `npm ci`, verify, build, release artifact, schema budget, dev tools, seed, seeded build and `audit:html` all pass. The full sequence ran on the first candidate `ce8126f`; verify and build were rerun in the same clones on the release commit `7b05a86` after two fixes found here (below). `check:ci-fast` passed all ten checks on both and exceeded its 60 s local budget (101 s and 95 s).

Because the runtime changed, the EmDash rehearsals that 0.3.0–0.7.0 could reuse were rerun against 1.6.0: `check:emdash-current` (roles, edit locks, revision diff and restore, inline toolbar links), forms with 0.2.14, metadata, importer, cache, dev tools, infrastructure and the generated profiles. Existing-database upgrade: a starter database in the 1.5.0 state was backed up and migrated in place by the first 1.6.0 run (`098_user_last_login` applied, row counts unchanged apart from the 404 log and the migration record).

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1): 129 passed and no reference image differed; the sensitivity self-test timed out under load and passed alone, as in 0.4.0–0.7.0.

Found during certification and fixed before the release: a test that matched multi-line source with LF line endings failed in the CRLF clones (`e97252d`), and the visual suite showed that the new `[hidden]` rule kept inactive tab panels from printing (`2fe1b0e`, note "Inactive tab panels print again").

Not covered: the Workers/D1/R2 profile (each Workers site rehearses its own database with `db:export-d1` and `db:rehearse` before deploying 1.6), collaborative editing, the SMTP provider and sandboxed plugins.

## Standards 0.7.0 (2026-11-20)

Certified source: commit `dcf4a99744685eecb98ca74c4e55750452aa1a3c`. Machine record: [verification-0.7.0.json](verification-0.7.0.json). A minor release after 0.6.0 (PRs #156–#158); runtime dependencies, development dependencies and the database schema are unchanged.

Clean clones on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3, on `ca60235` (the tree of the certified merge commit): doctor, `npm ci`, verify, build, release artifact, schema budget, dev tools, seed, seeded build and `audit:html` all pass. `check:ci-fast` passed all ten checks on both and exceeded its 60 s local budget (113 s and 131 s).

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1), now part of the Certify step: 129 passed and no reference image differed; the gallery root-typecheck test timed out under load and passed alone in 18.4 s, as in 0.4.0–0.6.0.

## Standards 0.6.0 (2026-11-20)

Certified source: commit `22948b4ce371e7caff923ea2eeca954cbaa2bdc8`. Machine record: [verification-0.6.0.json](verification-0.6.0.json). A minor release from the design sprints (PRs #130–#154). Runtime dependencies (Astro 7.4.12, EmDash 1.5.0, the adapters), development dependencies and the database schema are unchanged from 0.5.1. `check:upstream` on 20 November found Astro 7.4.13, @astrojs/node 11.1.14, TypeScript 7.0.2 (major) and Impeccable 4.10.0 available; all are deferred.

Clean clones on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3, on `bfd469c` (the certified commit minus PR #154, which only renews local visual reference images): doctor, `npm ci`, verify (358 s and 487 s), build, release artifact, schema budget, dev tools, seed, seeded build and `audit:html` all pass. `check:ci-fast` passed every check on both but exceeded its 60 s local budget (124 s and 114 s) with a design sprint running on the same machine.

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1): against the 0.5.1 references, home, posts and the styleguide differed at 390, because PR #141 moved the reading measure and line height to unclassed list items, and the run stopped at its three-failure limit. The suite does not run in CI, so the sprints' starter changes reached main without renewed references. The references were renewed and reviewed image by image (#154: 17 changed, 18 expressive references added to the hash record); against them 129 passed. The sensitivity self-test timed out once under load and passed alone (8 of 8); the gallery root-typecheck test timed out under load during the renewal and passed alone in 15.7 s, as in 0.4.0–0.5.1.

## Standards 0.5.1 (2026-11-18)

Certified source: commit `377e9a856432531bc96acb2008e0a8ebe0fc7237`. Machine record: [verification-0.5.1.json](verification-0.5.1.json). A patch on 0.5.0 that fixes what taking the visible changes on six built sites found. Runtime and development dependencies and the database schema are unchanged.

Clean clones on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3: doctor, `npm ci`, verify (338 s and 273 s), build, release artifact, schema budget, dev tools, seed, seeded build and `audit:html` all pass. `check:ci-fast` passed every check but exceeded its 60 s local budget again (78 s and 69 s; unit tests 53 s and 48 s). Speeding up the fast tier stays a follow-up.

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1) on the certified commit: 111 passed. The gallery root-typecheck behavior test timed out under load and passed alone in 16.6 s, as in 0.4.0 and 0.5.0. Not covered: the Workers/D1/R2 profile, the editor rehearsal and the restore drill (editor and schema unchanged).

## Standards 0.5.0 (2026-11-18)

Certified source: commit `004e89bc15f7805b91cd335bd08a95a106798510`. Machine record: [verification-0.5.0.json](verification-0.5.0.json). Runtime dependencies (Astro 7.4.12, EmDash 1.5.0, the adapters) and the database schema are unchanged from 0.4.0. One development dependency was added: `@axe-core/playwright` 4.14.0 for the accessibility scan in `check:quality`.

Clean clones on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3: doctor, `npm ci`, verify (274 s and 251 s), build, release artifact, schema budget, dev tools, seed, seeded build and `audit:html` all pass. `check:ci-fast` passed every check it runs but exceeded its 60 s local budget. The first runs shared the machine with site staging work (81 s and 66 s). Run alone, Node 24 took 60 s and passed, and Node 22 took 65 s, with unit tests at 44 s. Speeding up the fast tier is a follow-up.

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1): 111 passed. The gallery root-typecheck behavior test timed out under load (its child process was killed) and passed alone in 15.4 s, as in 0.4.0. The first run failed in setup: the visual stage did not copy the new `scripts/static-csp.mjs`. The harness now copies every module the config imports (PR 108), and the counts above are from that run. Not covered: the Workers/D1/R2 profile (unchanged scope), the editor rehearsal and restore drill (editor and schema unchanged), and repeated visual runs.

## Standards 0.9.0 (2026-11-26)

Certified source: commit `2e333091fe6bc61aea66db1f59d4a57f7c1aeee8` (tree `eca7b627ee442a56764dc0450bfad6c5d9c0f00a`). Machine record: [verification-0.9.0.json](verification-0.9.0.json). A minor release after 0.8.0 with the runtime unchanged (Astro 7.4.12, EmDash 1.6.0, the adapters): design guidance, multilingual facts entered once (`check:i18n-facts`), `db:local-copy`, page-change motion and fixes (PRs #180-#191).

Clean clones from GitHub on Windows with `core.autocrlf=true`, Node 22.23.4 and 24.22.3, one at a time: doctor, `npm ci`, verify, build, release artifact, schema budget, dev tools, seed, seeded build and `audit:html` all pass; `check:ci-fast` passed every check but ran over its 60 s local budget (127 s and 100 s), as since 0.5.0. The certified commit was the first candidate.

Visual suite (Windows, Node 24.22.3, Playwright 1.65.1): 130 passed, none failed, 50 skipped by design (each test runs in one viewport project), in 7.0 minutes; no reference image asked to be renewed.

Version decision (`check:upstream`, 26 November): EmDash 1.6.0 is current; Astro 7.4.13 and `@astrojs/node` 11.1.14, the tooling updates, Kumo 2.19.1 (EmDash's admin pins 2.19.0 exactly), Impeccable 4.11.0 and Sveltia CMS 0.273.1 are left to the weekly upstream refresh.

Not covered: the Workers/D1/R2 profile as a certified profile (the EmDash 1.6 site upgrades were rehearsed on local copies and recorded per site); the editor rehearsal, `check:emdash-current` and the restore drill were not rerun, since the runtime, schema and editor code are unchanged since 0.8.0.
