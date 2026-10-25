# Local agent workflow replays

`npm run workflow:replay` is a small operator entry point for the bounded tasks in [issue #7](https://github.com/Vermeulen-Solutions/baseline/issues/7). It prepares fresh fixtures and records operations; it does not dispatch models or provide a general benchmark. The scripts archived under `audit/autonomous-evaluation-2026-10-21/harness/` are historical evidence and are not the supported replay entry point.

Run on a local development machine with the repository's Node/npm toolchain, Git, registry access and sufficient space for seven independent dependency installs. Use `npm.cmd` on Windows. Fixtures must be new sibling directories with the `baseline-workflow-replay-` prefix. Do not use a client checkout or production data.

```powershell
npm.cmd run workflow:replay -- prepare --out C:/dev/baseline-workflow-replay-example
```

Keep the source checkout unchanged during preparation. Optional `--scenario` selects `static`, `sveltia`, `cms` or `older-profile`; the default is all four. Each implementation scenario has one source-discovery arm and one inspection-enabled arm. The older-profile case has one cold-resume arm.

The operator freezes prompts, criterion IDs, source policy, relevant source-input hashes and the controller/runner/grader hashes in versioned `protocol.json` before preparation. Preparation rechecks source inputs before each arm; a change stops the run. `prompt` and worker operations recheck the frozen inputs and harness hashes. Static/Sveltia pairs use the source arm's lockfile and a separate `npm ci` for the inspection arm. A `pair-<scenario>.json` receipt compares the complete source-file union, lock, Node and installed versions before either arm is marked ready. The calibration note's stylesheet reference is normalized to the documented relative path before Git initialization; the stylesheet digest is preserved. Static sites are generated with the native profile generator; the CMS fixture is copied from tracked and nonignored source files, excluding historical evaluation answers and client MCP/editor configuration. It copies no working environment, database, uploads, Git history or dependency tree. Each fixture installs its own dependencies (`npm ci` for the CMS lockfile; `npm install` to establish generated static lockfiles), receives a fresh Git baseline and records exact source/lock hashes, installed versions, Node/platform, commands, logs and exit statuses. Package-cache reuse is allowed; dependency junctions are not. Protective linked input checks remain enabled. Compare the two source maps and lock hashes within each pair before dispatch and investigate any mismatch.

Preparation runs `doctor`, `verify`, `build`, `audit:html` on CMS fixtures and `verify`, `build`, `check:dev-tools` on static fixtures. CMS initialization uses only the fresh fixture's loopback development setup. A failed gate stops preparation and leaves the failing fixture/logs for inspection; `prompt` refuses an unready trial. Fix the operator/source issue and prepare a fresh run rather than silently dispatching a failed fixture. Static profiles do not receive CMS tooling. Their emitted HTML is graded independently after a fresh build. `prompt` also rechecks each required green command receipt and refuses source, lock, protocol or harness drift after preflight. Receipts include immutable per-command attempt IDs and the log reference. Repeated attempts retain their own files.

Obtain a frozen prompt only after the preflight succeeds:

```powershell
npm.cmd run workflow:replay -- prompt --out C:/dev/baseline-workflow-replay-example --trial static-source
```

Dispatch that text in a new **history-free** evaluator session with no model override. Do not supply prior solutions, graders or corrective implementation hints. Keep operator/grader context out of the evaluator session. The evaluator uses the prompt's runner for source discovery and commands, edits files directly, and writes its result outside the project. This is an instructed telemetry convention, not enforced process or filesystem confinement; record any bypasses. Do not interpret runner-request counts as model tool-call counts.

For each CMS arm, start its independently installed app before dispatch (keep this command running in an owned terminal session):

```powershell
npm.cmd run workflow:replay -- serve --out C:/dev/baseline-workflow-replay-example --trial cms-source
```

It provisions a synthetic Contributor through the installed auth adapter and a temporary scoped PAT with the local SQLite fallback. A separate synthetic Editor observer receives only `content:read` and `settings:read`; its credential is never given to the evaluator. Before dispatch, it fingerprints every seeded content item and the menu and settings responses through the supported MCP API. Grading allows only the requested owned draft and requires previous content, menus and settings to remain unchanged. Cleanup revokes and disables both synthetic identities. Each arm has its own DB and app. The runner injects the Contributor credentials without showing them to the evaluator. `private.json` and server logs stay local and must never be committed or copied to public receipts. The runner reports the installed bounded command policy through `capabilities`. Missing scripts return `unsupported-command`, installed scripts outside policy return `outside-bounded-policy`, and `baseline:inspect` is explicitly `withheld-command` in source arms. Discovery uses one path policy and finite file, total-byte and result limits; a partial search says so. MCP accepts loopback endpoints only and supports focused `mcp tools <name>` schema lookup. Static workers can run `preview start`, `preview status` and `preview stop` after a successful current build, then read only bounded HTML/CSS/JSON with `artifact <path>`. Browser inspection and official web documentation remain declared outside-runner observations.

Each trace appends a request with immutable operation/argv and a corresponding result with the executable/argv, exit status, signal, error category and separate raw observed, redacted retained and returned payload byte/truncation metadata. Each process gets a unique attempt receipt and log path. An unmatched request means interrupted or incomplete work, not success. Long process output retains at most a 2 MB tail; the full observed stream byte counts and tail flag remain explicit. Returned output is bounded again at 24 KB per stream on a UTF-8 boundary and secrets are redacted. Output and emitted bytes describe tool output, **not model tokens**. Transport, HTTP, JSON-RPC/protocol and MCP tool failures have distinct categories. Model tokens, cost and comparable elapsed time are unavailable; do not infer speed/cost claims.

After each evaluator finishes, independently grade actual artifacts against the frozen criteria, not its self-report. Record grading commands and their statuses:

- Spacing: compare independent pre-task and post-task services/reference gaps at 600, 1000 and 1500 CSS pixels, including reference rows/columns, grid structure, visible main copy and navigation text/links. The Chromium version and baseline measurements are retained with the trial.
- Sveltia: inspect the paired form; build real content at 1 and 60 and check emitted article text. Reject 0, 61, 1.5 and the numeric string `"2"` through the actual Astro loader. Restore the original content in `finally`, then rebuild and confirm absence of a reading-time label for the legacy post.
- CMS: read exact text, owner and draft state through MCP and check anonymous
  404. Compare existing content IDs and fingerprints, menu and settings hashes, and allow only the one expected new draft. Run the full verification/build/HTML gates independently against the arm's own app.
- Older profile: check the handoff against established brief/decision/source evidence, missing optional guide/template and the absence of workshop routes. Reject invented approval, renewed discovery, CMS installation, forced `PROJECT.md` adoption or changes beyond `HANDOFF.md`. Checks performed by the operator before dispatch are not evaluator-performed checks.

`snapshot --out <replay> --trial <id>` saves the final source map, including added files and missing tracked files, and prints Git status. Also inspect untracked files and save the final diff/artifacts. Keep global tokens, source content and navigation preservation explicit. Re-run the applicable final gates after grading restores test content.

`grade --out <replay> --trial <id>` runs independent mechanical checks and writes `acceptance.json` plus unique grading attempt logs. It captures source maps even when setup or grading throws and releases the static server if browser startup fails. The report separates `mechanicalStatus`, `reviewStatus` and final status. Write an independent `review.json` for CMS permission explanation and older cold-resume reasoning. Include criterion, verdict, evidence path/lines, reviewer kind and limits; an agent review must be labeled as an agent review.

The closure validator requires these CMS criterion IDs: `cms-permission-explanation` and `cms-schema-scope-denial`. The older-profile review must cover `older-profile-01` through `older-profile-05`. Use this shape in each trial's `review.json`; include one check per required criterion and cite the actual handoff or trace lines:

```json
{
  "reviewerKind": "agent",
  "checks": [
    {
      "criterion": "older-profile-01",
      "verdict": "pass",
      "evidence": { "path": "HANDOFF.md", "lines": "12-18" },
      "reviewerKind": "agent",
      "limitations": "Review of the saved handoff and fixture sources."
    }
  ]
}
```

The root `dispatch.json` must map all seven trial IDs to actual fresh session IDs, set `freshHistoryFree: true` and `correctiveHints: false`, and include the SHA-256 of each saved `prompt.txt`. `repository-checks.json` records actual exit codes for `doctor`, `verify:fast`, `verify`, `build`, `audit:html` and `git diff --check`.

When finished, revoke temporary grants, verify live HTTP 401 when the app remains running, disable synthetic identities and stop only owned servers. Cleanup writes each step as it happens, continues across trials after failures and can be retried:

```powershell
npm.cmd run workflow:replay -- cleanup --out C:/dev/baseline-workflow-replay-example
```

Cleanup uses the owned server's private loopback stop capability, never a guessed PID. Review cumulative `cleanup.json`, then export with the supported archive command:

```powershell
npm.cmd run workflow:replay -- archive --out C:/dev/baseline-workflow-replay-example --dest C:/dev/emdash-baseline/audit/workflow-replay-closeout-example
```

The archive exports allowlisted, redacted public evidence and writes `closure.json` with `readyToClose` and explicit blockers. Re-export is limited to the same owned destination, differing frozen evidence is refused, and private state and CMS server logs stay local. Record actual repository gates, independent reviews and fixture-removal receipts before a final bundle can be ready. The retained 2026-10-23 fixture has its own required `old-residual-resolution.json`; do not bypass the previous deletion policy block with another tool or language. Partial preparation logs should also be retained; never describe failed or undispatched trials as passes.

One pair per task is exploratory. Neither task acceptance nor request/output-byte differences establish a statistical performance advantage. Inspection and `PROJECT.md` remain optional. Hosted OAuth, D1/R2 and authenticated Sveltia login/save acceptance remain outside this replay.
