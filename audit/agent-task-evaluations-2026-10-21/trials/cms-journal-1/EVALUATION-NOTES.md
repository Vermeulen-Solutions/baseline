# Journal change — local delivery notes

Scope: only this trial's `site/` and disposable Node/SQLite CMS. No production access, remote authentication, external writes, deployment, delegation, or messages to others. Initial tracked difference `emdash-env.d.ts` was already present; generated types remain generated. npm/Node 24.21.0, Astro 7.4.0, EmDash 1.3.0.

## Implementation

- Added server-rendered `/journal/` and `/journal/[slug]/` backed by the existing Posts collection. No new content collection or database columns.
- Archive explicitly requests published posts, newest first, 20 per cursor page; real titles and excerpts link to Journal entries. Detail uses `getEmDashEntry`, SEO/page identity, original `RichText` value, field-specific title/excerpt/image proxies, cache hints, and a Journal breadcrumb/back link.
- Unknown/unpublished anonymous entry requests rewrite to the real 404 page with status 404. EmDash controls authenticated draft and preview access.
- Added Journal to the disposable CMS primary menu through the supported authenticated API and to the seed. Set Posts' URL pattern to `/journal/{slug}/` through the supported schema API and seed so admin View/preview/generated URLs know Journal. Existing `/posts` and `/posts/[slug]` implementation remains untouched and working.
- Added maintenance notes to AGENTS.md, classified new CMS-only routes in the existing profile inventory, and added opt-in anonymous browser regression coverage at `site/tests/journal.integration.mjs`.
- Preserved all tokens, CSS, existing routes, content fields, and checks. Existing saved art direction passed its pre-write gate; existing component calibration and rendered Posts reference informed the extension. No new exception hashes or weakened checks.

## Commands and results

Commands ran from `site/` with PowerShell npm.cmd/npx.cmd unless explicitly noted. Detailed outputs are sibling log files.

| Command/check | Actual result |
| --- | --- |
| `npm.cmd run doctor` | Passed critical checks; expected Windows launcher/dirty-tree warnings |
| `npm.cmd run setup:hooks` | Installed local pre-commit hook |
| `npm.cmd run check:art-direction -- --require-record` before implementation | PASS |
| `npm.cmd run verify:fast` | FAILED: initial new-route inventory gap fixed; four unrelated design fixture failures remain (`verify-fast.log`) |
| `npm.cmd run verify` | FAILED: 141/145 unit tests pass; four unchanged design fixture tests fail (`verify.log`). Command short-circuits before rehearsal/typecheck |
| `npm.cmd run test:rehearsal` separately | FAILED: 112/132 tests pass, 20 fail (`rehearsal.log`). Includes starter profile generation/sync expecting a neutral global.css exception, importer/audit fixture integrity/oracle assertions. No checks removed, disabled, or relaxed |
| `npm.cmd run typecheck` separately | PASS: 55 files, 0 errors/warnings/hints (`typecheck.log`) |
| `npm.cmd run build` | PASS, clean release artifact assertion (`build.log`) |
| `npm.cmd run audit:html` | PASS: 7 HTML files, 8 anonymous public responses, 2781.9ms (`audit-html.log`). Snapshots `site/.emdash/snapshots/capture-YPBBy9/` |
| `node --test tests/platform-profiles.test.mjs` after explicit route classification | PASS 6/6 (`profiles-check.log`) |
| final `npm.cmd run lint`, art direction, design tokens | PASS (`lint-final.log`; token contrasts all pass) |
| `git diff --check` | PASS |
| `JOURNAL_TEST_URL=http://127.0.0.1:53321 node tests/journal.integration.mjs` | PASS development anonymous acceptance (`journal-acceptance.log`) |
| Same browser regression against built `start:local` on 53322 | PASS production anonymous acceptance (`journal-production-acceptance.log`) |
| `node editor-acceptance.mjs` from trial directory | PASS actual UI journey (`editor-acceptance.log`, `evidence/editor-acceptance.json`) |
| Installed Impeccable `context --target src/pages/journal/index.astro`, then `detect --json` on both Journal templates | Incumbent visual system is authority; detector PASS with `[]` (`impeccable-detect.json`) |

The four unit failures are: neutral DESIGN.md mapping expects current despite calibrated site tokens; calibration test double-converts existing CRLF; neutral CSS alignment assertion assumes an uncalibrated starter; prune-starter-exceptions assertion assumes sample exceptions still exist. Their source inputs (CSS, exceptions, test files and neutral mapping) are unchanged against HEAD (`git diff --quiet` exit 0). The trial is an existing calibrated site; this feature does not restore neutral starter fixtures or alter unrelated infrastructure assertions. Verification is therefore **not fully green**. Rehearsal failures are retained in full for review; they must not be interpreted as feature passes.

## Actual editor acceptance

Used the authorized localhost dev bypass only. In the Journal detail page, toggled real Edit mode and mounted the installed inline Portable Text editor. Clicked, typed, blurred to save (HTTP 200), reloaded the editor, confirmed saved unpublished content stayed private in a separate anonymous context, published through the toolbar (HTTP 200), and confirmed anonymous reload displayed the published edit. Restored the original body via the same UI and republished. Title and excerpt were each clicked into plaintext editing, typed, saved (200), reloaded, checked for anonymous draft privacy, then restored and published through UI. All canonical title/excerpt/body values are restored; the disposable CMS revision history records these rehearsals. `Unannounced workshop` remains draft.

Early probes hit Vite's outdated optimized dependency cache when typecheck refreshed the cache beside a running dev server; a clean server restart resolved hydration. An initial scalar-restoration script ran before hydration and timed out; waiting for the actual mounted editor resolved it. The final successful receipt has no page errors. Attributes alone were not counted as editor acceptance. No claim is made about a deployed editor, external auth, Workers, image editing, or every toolbar command.

## Visual evidence and assumptions

- Before reference: `evidence/posts-before-desktop.png`.
- Final built public screenshots: `evidence/journal-index-390.png`, `journal-index-1440.png`, `journal-article-390.png`, `journal-article-1440.png`.
- Actual edit mode/restored journey: `evidence/journal-edit-mode.png`, `evidence/editor-accepted-restored.png`, `evidence/editor-acceptance.json`.
- Manual visual review inspected the existing Posts reference, mobile archive and desktop article. Read-mode hierarchy, paper/ink typography, generous existing spacing, footer and wrapping navigation are preserved; browser assertions establish no horizontal overflow at 390/1440. A full accessibility conformance audit or full screenshot regression suite was not run.
- Impeccable guidance was used as a bounded existing-interface review. **Degraded single-context review:** the trial explicitly prohibits delegation; no independent formal multi-agent critique or live detector overlay was claimed. Source detector was clean.
- Assumed Journal is an additional public presentation of all published Posts; Posts remains the CMS collection label. English interface labels match this existing single-locale site. No schema/content migration was necessary.
- Pagination is implemented but beyond-20-entry navigation is unverified with the supplied two-entry dataset. No clarification was required for this scope.

## Shutdown

Development server on 53321 and built production server on 53322 were stopped after acceptance. HTML audit managed and stopped its own reserved-port server. Final shutdown verification is recorded below.
