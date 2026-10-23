# Reproducible local workflow replay — 2026-10-23

All six implementation replays passed independent artifact checks after green
fixture preflights. The focused missing-reference cold resume also passed its
platform, decision recovery and source-preservation checks. Inspection and
`PROJECT.md` remain optional. This exploratory run does not establish a general
performance advantage or justify expanding the component inspection pilot.

Use the [supported replay entry point](../../docs/workflow-replay.md) for a new
run. The [evaluated harness snapshot](evaluated-harness/) records the runtime
used here; it is not a standalone benchmark or a replacement for the supported
scripts. [Toolchain hashes](toolchain.json) distinguish that snapshot from the
final supported scripts, which received the bounded post-run fixes listed below.

## Fixture and dispatch evidence

Seven disposable sites had independent dependency installs, fresh Git baselines,
no original database, uploads, environment secrets or dependency junctions, and
no original Git history. npm's package cache was reusable. CMS fixtures used
separate databases, Contributor accounts, scoped PATs and loopback apps.
Protective linked-input checks were preserved.

Each trial's `receipt.json` contains exact source and lockfile hashes, versions,
installation command and actual applicable preflight command statuses. CMS arms
passed `doctor`, full `verify`, `build` and `audit:html`, including the previously
blocked importer/migration rehearsals. Static arms and the older-profile case
passed their installed `verify`, `build` and `check:dev-tools` commands.

[Pair equivalence](pair-equivalence.json) confirms matching lockfiles. CMS sources
were byte-identical. The only static/Sveltia pair difference was the generated
calibration note's absolute fixture path; replacing each exact local site path
with the same marker made that document identical. No application source or
tokens were normalized to hide differences.

[Protocol and criteria](protocol.json) were frozen before preparation/dispatch.
[Dispatch](dispatch.json) used seven `fork_turns=none` sessions with only the
frozen prompt, no model override and no corrective implementation hints. Cleanup
followups occurred after results and changed no project source or task result.
The configured/resolved model and model token usage were not exposed as metrics.

## Independent outcomes

| Trial | Independent result |
| --- | --- |
| `static-source` | Pass: only homepage changed; services/reference gap ratio 0.75 at 600, 1000 and 1500 CSS px; verify/build/production isolation/HTML pass |
| `static-inspect` | Pass: same bounded outcome and independent gates |
| `sveltia-source` | Pass: optional paired integer field; real builds/render at 1 and 60; reject 0, 61, 1.5 and `"2"`; restored legacy content builds without label |
| `sveltia-inspect` | Pass: same loader/form/render boundaries and source preservation |
| `cms-source` | Pass: exact supplied text, assigned owner, draft with no live revision/publication date, anonymous 404; source unchanged; independent verify/build/HTML pass |
| `cms-inspect` | Pass: same owned draft and independent application checks |
| `older-profile-source` | Scoped pass: missing guide/template did not block; static decisions, ownership, registration endpoint and assumptions recovered; only HANDOFF.md changed |

Per-trial `acceptance.json`, `grade-*.log`, `changes.patch`, source maps and
authored artifacts are under `trials/`. New helper/test files are also captured in
`untracked-source.json` and `artifacts/`; they are not silently omitted from the
patch evidence. [Operator review](operator-review.json) supplements mechanical
checks with the permission explanations and cold-resume judgment.

## Trace interpretation and actual limits

[Trace completeness](trace-completeness.json) has a matching result for every
runner request and no executed npm command missing its script identity. Requests
preserve operation and argv, including npm script names; results preserve actual
command/argv, exit status, signals, truncation and separate stdout/stderr counts.
Unsupported commands are explicit. Transport, HTTP, protocol/JSON-RPC and MCP tool
errors are distinct. Expected scope denials and failed attempts remain recorded.

| Scenario | Runner requests: source / inspect | Returned payload bytes: source / inspect |
| --- | --- | --- |
| Spacing | 11 / 14 | 86,029 / 107,548 |
| Sveltia | 16 / 19 | 87,199 / 98,274 |
| CMS | 21 / 27 | 152,602 / 196,093 |

The older-profile session used 10 runner requests and 70,239 returned payload
bytes. These are bounded, redacted stdout/stderr payload bytes, excluding CLI
delimiters, model/tool UI envelopes and outside-runner operations. They are not
model tokens or costs. Requests are runner invocations, including batching and
retries, not model tool-call counts. No comparable elapsed-time claim is made.

- Static evaluators used direct local preview/browser operations after the
  bounded runner rejected `dev`/`preview` or artifact reads. Sveltia evaluators
  consulted official field documentation outside the runner. Their reports list
  those operations; those observations are not complete instrumented discovery
  totals. The convention does not enforce filesystem/process confinement.
- `cms-inspect` initially supplied the wrong schema-read argument and received
  input validation, then the correct request received the expected scope denial.
  Its first HTML audit, overlapping verification, hit the SSR deadline; the retry
  after verification passed. Both attempts remain in the trace. Independent
  operator HTML audits passed for both arms without a fixture source change.
- One evaluator's initial Edge browser launch failed because that executable was
  absent; its installed Chromium run passed. A Sveltia preview navigation also
  preceded readiness and was retried. No failed attempt was recast as a pass.
- Before Sveltia grading, the operator allowed `reading-minutes.ts` as well as the
  historical `post-fields.ts` helper name. The frozen criteria did not prescribe
  a filename; behavior and preservation criteria were unchanged. No evaluator
  received an implementation retry or hint.
- The older-profile prompt combined a generic instruction to run relevant
  checks with wording saying not to claim tests occurred. That evaluator actually
  ran the installed gates and accurately reported them. Its fallback/platform
  observations passed; this is not evidence of obeying that conflicting sentence.
  Future prompts now prohibit **unperformed** check claims instead. The frozen
  prompt here is unchanged.
- The older fixture simulates missing optional references on the current static
  toolchain; it is not acceptance of every historical installation. Its handoff
  could identify the unselected DESIGN snapshot more explicitly, but preserved
  implemented fluid CSS and the actual static platform instead of applying old
  fixed-spacing/CMS notes. No PROJECT.md, dependency or source implementation was
  added, and no customer rediscovery or clarification was requested.

Post-run supported-script fixes add byte-bounded process tails, loopback-only MCP
requests without redirects, recorded harness hashes, dispatch receipt/source
revalidation, added/deleted source-map coverage, missing-private-file handling in
partial cleanup, live HTTP-401 revocation evidence and the clearer future prompt.
Focused tests cover these changes; the evaluated snapshot keeps the distinction
reviewable. Archived prompts/results are not rewritten to match those fixes.

## Cleanup and repository checks

[Cleanup](cleanup.json) records both PAT revocations, live HTTP 401 after each
revocation, disabled synthetic Contributor accounts and stopped owned CMS
servers. Per-static/Sveltia cleanup receipts confirm evaluator-owned previews
were stopped. Final repository gates are in `repository-checks.json`.

Fixture deletion remains incomplete: automatic approval review rejected both the
ownership-checked removal command and the narrower literal-path removal with
“blocked by policy.” It supplied no more specific reason. The exact owned
directory `C:\dev\baseline-workflow-replay-20261023` remains, with its private
configuration files replaced by revocation markers. No alternate deletion
mechanism was attempted after the narrower command was rejected. See
[fixture removal receipt](fixture-removal.json). Tokens are revoked and the owned
servers are stopped; only directory removal remains.

No production data, hosted OAuth, D1/R2, authenticated Sveltia login/save or
deployment was involved. The original repository's `src/`, `public/` and `seed/`
remain unchanged. One pair per scenario remains exploratory, without statistical,
cost or speed conclusions. Broader review and hosted/manual acceptance remain
outside this issue, as tracked in issue #6.
