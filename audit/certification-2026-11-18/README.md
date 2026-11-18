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
