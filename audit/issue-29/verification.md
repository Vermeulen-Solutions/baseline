# Issue #29 audit verification

Run on 27 October 2026 in `C:/dev/emdash-baseline`, Windows, Node **24.21.0**, with the installed dependencies and checked-in lockfile. Base commit: `e2992d098613f5466bb232a73d22acf21dec5f06`. These checks cover the local audit/prototype state; there is no released commit or deployment.

| Check | Actual result |
| --- | --- |
| `npm.cmd run doctor` | Passed critical checks; warnings for Windows npm-launcher observability and the dirty/untracked workspace. No dependency installation was needed. |
| `npm.cmd run setup:hooks` | Installed the repository's supplemental `.git/hooks/pre-commit` hook. |
| `node --test audit/issue-29/design-gate-prototype.test.mjs` | **8 passed**, zero failures/skips. These isolated research tests are intentionally not shipped or added to the root test tiers. |
| `node --check` on both prototype modules | Passed. |
| Read-only prototype scan of `src` and `profiles/static/project/src` | **38 files**, 4 warnings, 14 deferred observations, zero parse errors. Three scan-only timings: 72.54 / 75.67 / 69.50 ms. Cold PowerShell pipeline timings: 436.49 / 368.75 / 337.76 ms. |
| `npm.cmd run verify:fast` | Passed, including **195 unit tests**, zero failures/skips. |
| `npm.cmd run verify` | Passed: **195 unit + 152 rehearsal = 347 tests**, zero failures/skips. Astro checked **53 files** with zero errors/warnings/hints. Unit duration 17.49 s; rehearsal duration 180.37 s (not total command times). |
| `npm.cmd run build` | Passed, including release-artifact validation. Vite emitted its greater-than-500-kB chunk warning; bundle optimization was outside this audit. |
| `npm.cmd run audit:html`, after the fresh build | **Passed**: 9 HTML documents, 10 public SSR responses; 1919.8 ms. Representative linked routes only; build reports 224 runtime route patterns. |
| Read-only prototype scan of the resulting SSR capture | 9 HTML documents in 35.17 ms; 3 heading-order advisories across main/footer landmarks on `/about`, `/category/updates` and `/404`. These advisory findings are outside the existing integrity audit, not contradictions of its narrower pass. |
| `git diff --check` | Passed; no tracked application/workflow files changed. |

Local raw logs and JSON diagnostics are retained under ignored `.emdash/checks/issue-29/`: `verify-fast.log`, `verify.log`, `build.log`, `audit-html.log`, `source-scan.json` and `rendered-scan.json`. The read-only SSR audit retained its ordinary ignored capture under `.emdash/snapshots/capture-iYuKni/`. No CMS content, authentication, production data or media was changed for acceptance.

The pre-existing untracked `audit/issue-design-pipeline-ecosystem-audit.md` was preserved. New research files are `audit/issue-29-ecosystem-review.md` and the three files in `audit/issue-29/`. No package/lockfile, distributed source, profile inventory, skill or CI policy changed. Independent `test:profiles`, visual regression, Linux/Docker certification, third-party tool execution and authenticated editor saves were not run; this audit does not change shipped profile behavior or presentation. Production integration would require the additional acceptance described in the [implementation specification](../issue-29-ecosystem-review.md#implementation-specification-for-the-top-two-priorities).

No commit, push, PR, issue comment or deployment was made. Select implementation and release scope from the report before integrating recommendations.
