# Engineering maintenance verification

Completed 2026-10-19 on Windows x64 with Node 24.21.0. The four tracked scopes, dependencies and acceptance criteria are in [the maintenance plan](engineering-maintenance-plan.md); per-file retention evidence is in [the inventory](engineering-inventory.md). Changes are grouped into plan, test tiers, process portability, diagnostics and script hygiene commits.

## Final results

| Check | Result | Measured runtime |
| --- | --- | --- |
| `npm run verify` | PASS: lint, art direction, token audits, all 227 tests, schema preflight and Astro typecheck | Complete test tier: 56.092s |
| Unit/contract tier | PASS: 100 tests across 18 files | 4.035s in fast CI; 4.213s in Restricted PowerShell smoke |
| `npm run check:ci-fast` | PASS: all eight steps exit 0; `under60Seconds: true` | 19.243s |
| Normal production build, release validation | PASS, included in fast CI | Build: 10.401s |
| Script syntax | PASS: 126 JavaScript modules | 2.343s in fast CI |
| Astro typecheck | PASS: 46 files; 0 errors, 0 warnings, 0 hints | Outside the fast CI budget |
| `npm.cmd run verify:fast` under Restricted PowerShell | PASS, exit 0 | 16.271s including PowerShell startup, lint, gates and unit tests |
| Independent `static` and `static-sveltia` verification | PASS for both: install, clean reinstall, full verification, production build, developer-tool exclusion, fixture build and HTTP checks | Not a fast-budget benchmark |

The PowerShell policy was tightened only inside a disposable child process; no machine/user policy or bypass was used. Use `npm.cmd`/`npx.cmd` at a PowerShell prompt. Nested repository npm calls use Node plus the resolved JavaScript CLI. Unix prefix resolution is fixture-tested; an actual Unix/GitHub Actions execution was not observed in this session. The updated Ubuntu workflow runs both test tiers and independent profile jobs.

Fast CI excludes checkout, Node setup, installation, queue time, typecheck and lifecycle rehearsals; it includes syntax/template lint, art direction, tokens, schema, unit tests, a normal build and release validation. Both test tiers remain mandatory workflow jobs, and unchanged `npm test`/`verify` still run the whole suite. Browser captures were not run for these infrastructure changes.

## Baseline and intermediate evidence

| Run | Tests | Test-runner duration | Context |
| --- | --- | --- | --- |
| Original baseline | 218/218 | 60.675s | Unmodified repository |
| Phase 1 | 219/219 | 79.734s | Competing fast CI/build run; fast CI 32.700s, unit step 5.982s |
| Phase 2 | 221/221 | 62.432s | Full verification passed |
| Phase 3 clean rerun | 225/225 | 56.366s | Full verification passed with source fixed |
| Phase 4 | 227/227 | 115.510s | Competing independent profile installs/builds; full verification passed |
| Final | 227/227 | 56.092s | Committed phase implementation; full verification passed |

These are observations on this host, not a cross-platform timing guarantee. The first attempted unit grouping took 13.950s; repeated Git/capture evidence fixtures moved to rehearsal. The final isolated grouping meets the <10s acceptance limit and <8s target.

An initial Phase 3 run caught an in-flight source edit invalidating a sync snapshot, plus a loopback HTTP unknown that did not reproduce in isolation or subsequent complete runs. The HTTP assertion now includes its report; verification runs keep source files fixed. No production HTTP behavior was altered.

## Coverage, pruning and compatibility

No script or test file was deleted: the audit established active consumers for all 58 original scripts and 34 original test entry points. The current inventory is 60 scripts and 35 test entry points. The nine additional tests cover eight infrastructure contracts plus reviewed legacy schema-plan compatibility.

Removed dead implementation details include seven subprocess source-file reads, duplicate CLI argument loops, the registry JSON writer/lookup, the importer JSON reader and unused imports. The retired media organizer remains an exit-2 refusal command because deleting it would break a supported package command and its safety contract.

Deliberate invalid SQLite/record/token fixtures verify Expected vs Received diagnostics, physical overflow names, source locations, actual/minimum contrast, clean failure exits and JSON compatibility. Process fixtures verify argv integrity, npm failure propagation, Unix prefix lookup, D1 cleanup and operational validation before output. Existing reviewed legacy schema helpers and their exact plan hashes remain supported. Existing 3:1 non-text and 4.5:1 text contrast requirements, privacy-sensitive unverified exits and static-profile dependency boundaries are preserved.

Machine-readable final metrics and all eight fast CI receipts: [engineering-verification.json](engineering-verification.json). Full local logs remain under ignored `.emdash/checks/`.
