# Issue #7: follow-up implementation and closure plan

Status: **implementation in progress; final replay and issue closure are pending**.

Issue: [Make agent workflow evaluations reproducible before expanding discovery tooling](https://github.com/Vermeulen-Solutions/baseline/issues/7).
Evidence: [2026-10-23 replay report](../audit/workflow-replay-2026-10-23/README.md),
[operator review](../audit/workflow-replay-2026-10-23/operator-review.json),
[toolchain hashes](../audit/workflow-replay-2026-10-23/toolchain.json), and
[current replay instructions](workflow-replay.md).

The goal is a supported replay procedure whose **final implementation** has been
exercised, whose grading and evidence do not depend on operator repair, and whose
cleanup has an honest, verifiable result. Complete the work below, preserve the
existing exploratory conclusions, and then close #7 with committed evidence.
Do not close the issue merely because this plan or the earlier report exists.

Implementation has now added the frozen replay controller, bounded runner,
independent artifact grader, private loopback preview owner, review and archive
receipts, and CMS pre/post snapshots. Focused replay coverage passes (20 replay
tests), and the full repository suite passes (179 unit and 136 rehearsal tests),
with typecheck/build/HTML audit also passing.
The final seven-session replay has not been run against this exact harness. The
previously retained fixture was removed by the owner and its absence was
verified at `C:\dev\baseline-workflow-replay-20261023`; the final archive still
needs to record that removal receipt. The fresh replay and its archived evidence
remain the implementation's main closure gate.

## 1. Starting point and boundaries

### What already works

The previous run used seven fresh sessions: one source/inspection pair for each
of static spacing, Sveltia field/schema editing, and CMS draft creation, plus one
older-profile cold resume. All had independent dependency installs and green
applicable preflights. Independent mechanical checks accepted the artifacts.
The repository's last recorded full verification passed 168 unit tests and 136
rehearsal tests, followed by a successful build and HTML audit. These are
historical results, not proof that subsequent changes pass.

Keep the existing independent installs, immutable npm identities, explicit
unsupported-command responses, error categories, linked-path guards, source
hashes, and optional inspection/context-file policies. Improve the current code
rather than replacing it with a new evaluation framework.

### Why a follow-up is needed

| Finding | Evidence / current behavior | Required resolution |
| --- | --- | --- |
| The measured runtime differs from the supported runtime | `toolchain.json` has different evaluated/final controller and runner hashes | Replay the final frozen implementation after the fixes |
| Export and closeout depend on ignored operator scripts | Receipt collection and semantic review were performed by `.emdash/checks/workflow-replay-*.mjs` scripts | Add supported bounded archive/validation behavior; do not depend on ignored scripts |
| Required rendered checks caused runner bypasses | Static/Sveltia reports record rejected preview/artifact operations followed by direct operations | Provide owned static preview and bounded artifact access; keep remaining browser/web activity explicitly outside measured runner coverage |
| Broad discovery exposed operator material | A CMS search surfaced `docs/workflow-replay.md` | Hide operator/criteria/evidence paths consistently from worker discovery |
| Source equivalence depends on operator inspection | Pair comparison was external; calibration notes contain fixture-specific absolute paths | Enforce pair equivalence and freeze source/harness inputs before dispatch |
| Grading needed an operator filename adjustment | Sveltia helper allowlist was extended after the run began | Grade the frozen behavioral contract, without prescribing helper basenames |
| Some mechanical checks are weaker than the stated criteria | Spacing checks ratio but not baseline copy/navigation/reference geometry; cold resume relies on keywords | Strengthen independent observations and require semantic review where appropriate |
| Failures/retries can overwrite evidence | Fixed `grade-*.log` names; the first root fast-verification log was overwritten | Retain distinct attempt receipts and logs |
| Cleanup has incomplete failure/retry handling | One failed step aborts the loop; metadata is erased on success and a repeat can obscure previous results | Make cleanup incremental, retryable, bounded, and explicit about unknown/pending states |
| The original fixture directory remains | `fixture-removal.json`: both removal commands were rejected by automatic approval review | Resolve the retained directory through an allowed owner action and record the actual result |

The prompt contradiction has already been corrected in the supported task text.
Keep that correction, test it, and independently replay it. Do not claim the
corrected wording was exercised by the old cold-resume session.

### Scope limits

- Keep inspection and `PROJECT.md` optional. Do not change the six-component
  inspection pilot, require new client records, or add a discovery checkpoint.
- Keep this work in repository/operator tooling. Do not alter public `src/`,
  `public/`, `seed/`, global tokens, client art direction, or upstream mirrored
  EmDash skills to accommodate a replay.
  This restriction applies to the original repository/client sources; task
  evaluators may edit their assigned disposable fixtures within the frozen scope.
- No production data, deployment, hosted OAuth/D1/R2, authenticated Sveltia
  login/save, or general architecture review. Those remain outside #7 and, where
  applicable, belong to #6.
- No statistical performance, speed, cost, or token claims. One pair per
  implementation scenario remains exploratory.
- No model API integration, general scheduler, filesystem sandbox, benchmark
  registry, arbitrary shell runner, or generic web proxy.
- Never weaken `noLinks` or introduce dependency junctions. A shared npm download
  cache is acceptable; shared installed dependency directories are not.
- Preserve the existing audit directory as historical evidence. Add a new
  closeout run; do not rewrite frozen prompts, failed attempts, or old results.

## 2. Instructions for the implementing model

1. Read `AGENTS.md`, this plan, the four evidence links above, and the current
   source files in the file map below. Use PowerShell and `npm.cmd` on Windows.
2. Run `git status --short` before editing. The preceding implementation may
   still be uncommitted, including the replay scripts, tests, docs and audit
   folder. Preserve it. Do not run `git reset`, `git clean`, remove untracked
   files, or start from a clean checkout that silently omits that work.
3. Run `npm.cmd run doctor`. Use the checked-in skills when needed; do not take
   an upstream skill-sync detour. This is infrastructure work, not a new site.
4. Implement work packages in order. Each package must have focused behavioral
   tests before moving on. Reuse existing process, path, CLI and auth helpers.
5. Do not execute proposed commands in this plan until they exist. Existing
   commands are listed separately in section 9.
6. Do not pass this plan, the historical report, graders, or previous solutions
   to fresh task evaluators. They receive only the new frozen worker prompt and
   their fixture's ordinary project sources/instructions.
7. Keep failures visible. Fix an operator defect in code, then create a new
   frozen run for affected evaluations. Do not repair an evaluator's artifact,
   change its criteria, or supply corrective hints and retain the old verdict.

### File map

| File | Responsibility |
| --- | --- |
| `scripts/workflow-replay.mjs` | Preparation, frozen protocol, readiness, owned apps, lifecycle, cleanup and CLI routing |
| `scripts/workflow-replay-runner.mjs` | Allowed operations, bounded discovery/output, command execution and telemetry |
| `scripts/workflow-replay-grade.mjs` | Independent artifact/source checks and report persistence |
| `tests/workflow-replay.test.mjs` | Fast behavioral tests for the above contracts |
| `tests/test-tiers.json` | Register every new test file with its real tier/reason |
| `profiles/file-inventory.json` | Explicit classification for any new top-level script/test file |
| `docs/workflow-replay.md` | Supported operator/worker workflow and limitations |
| `package.json` | Existing `workflow:replay` entry point; change only if necessary |
| New `audit/workflow-replay-<unique-closeout-id>/` | Frozen closeout evidence and issue acceptance mapping |

Keep the existing three-script design if practical. A small archive helper or
rehearsal test is acceptable if it makes responsibilities clearer; register it
in both inventories as applicable. Do not copy operator tooling into generated
static profile inventories or add CMS dependencies to those projects.

## 3. WP1 — Freeze inputs and enforce dispatch validity

**Primary file:** `scripts/workflow-replay.mjs`.

### Implement

1. At preparation entry, freeze a versioned protocol containing task prompts,
   criterion IDs, permitted source changes, required gates, metric definitions,
   and the relevant controller/runner/grader hashes. Do this before preparing
   or dispatching the first arm. `SCENARIOS` in the current process is a template;
   later stages must validate against the saved run protocol.
2. Capture one deterministic manifest of the source inputs used by preparation,
   including relevant nonignored uncommitted files. Exclude private/runtime
   files and generated evaluation output from this input manifest. Use the same
   selection rules as the actual copy/generator operations; do not hash an
   unrelated entire working directory and call it the fixture source.
3. Before preparing each arm, verify those inputs have not changed. If they
   changed, write an explicit failed preparation receipt and stop. Never mix
   source revisions within a pair. A full source snapshot is optional if a
   checked manifest provides this guarantee; do not introduce worktrees or
   source archives unnecessarily.
4. For generated static pairs, establish the dependency lockfile once, verify
   both generated `package.json` files match, and use that same lockfile for the
   paired arm's **independent** `npm ci`. Record where the canonical lock came
   from. Do not copy `node_modules`, databases, or mutable caches between arms.
5. Make the generated calibration note's stylesheet reference consistently
   relative **before Git initialization and preflight**, if the existing
   calibration contract permits it. Change only that documented source-path
   field, preserving its stylesheet digest and calculated evidence. Otherwise
   retain the raw files and permit only the exact documented fixture-path
   substitution in pair comparison. Never normalize application CSS/source.
6. Save pair equivalence as a supported receipt. Compare the union of both
   manifests, package locks and versions; detect missing and added files, not
   just differing values for keys present in one arm.
7. Refuse `prompt` for either implementation arm until both arms have green
   required preflights and equivalence passes. The single older-profile trial
   requires its own green preflight. Validate current source, lock, Node version,
   relevant installed versions and linked-directory prohibition against the
   saved receipt. A boolean `ready` flag alone is insufficient.
8. Validate frozen harness/protocol identity before prompt, worker operations,
   and grading. Code or criterion changes mid-run must produce a clear
   `harness-changed`/invalid-run result. They must not silently use a new grader.
9. Mark cleaned/archived runs with explicit lifecycle state. Refuse new dispatch
   or credential provisioning for a terminal cleaned run. Snapshot/archive and
   reading public receipts should remain possible.

### Tests and acceptance

- Changed source, grader, prompt, lockfile, or required preflight result prevents
  dispatch, with the offending category named.
- A mismatched/missing paired file prevents both arms from dispatching.
- An unchanged pair passes; the only permitted path normalization cannot hide
  an edited stylesheet, component, route or criterion.
- Each arm has a real directory for its independent installation; linked input
  tests still fail as before.
- A terminal cleaned run cannot be served or dispatched again.
- Preserve the original failed receipt and logs when preparation stops.

## 4. WP2 — Complete the bounded worker interface and retain telemetry

**Primary files:** controller and runner. Keep this interface identical across
arms except for the explicit `baseline:inspect` treatment.

### Discovery and private/controller paths

Create one shared discovery-path predicate used by `read`, `files`, and `search`.
It must reject traversal, absolute paths where not explicitly supported, linked
inputs, environment/auth/database/runtime files, and operator/criteria/evidence
paths. Explicitly cover `.npmrc`, `.netrc`, SSH material, private replay files,
`scripts/workflow-replay*.mjs`, replay tests, replay operator docs/plans, and replay
audit evidence. Existing CMS verification may require some operator files to
remain on disk; hiding them from the worker discovery interface must not remove
them and break full verification. This remains a convention, not a sandbox.

Apply input limits during inventory/search, not only after constructing a giant
output string. Reuse the regular-file/per-file limit and set documented finite
file/total-byte/result limits. Report partial/truncated discovery explicitly;
do not report a skipped or unreadable tree as an exhaustive “no matches.” Do not
add a general search service or a new runtime dependency merely for this step.

### Operations to add

The following interfaces are **proposed**, not current commands:

- A capability report, e.g. `tool ... -- capabilities`, listing installed and
  permitted verification scripts and whether MCP/preview/artifact operations
  apply to the trial. Distinguish `not-installed`, `outside-bounded-policy`, and
  `withheld-for-source-arm`; preserve the requested name/argv in each response.
- Owned static preview operations, e.g. `tool ... -- preview start|status|stop`.
  Use only the assigned fixture, loopback host and an allocated port. Retain the
  actual executable/argv, readiness result and owned stop handle. Require a
  successful current build before preview. Workers should build and preview
  instead of launching arbitrary persistent `run dev`/`run preview` processes.
- A bounded artifact read, e.g. `tool ... -- artifact <relative-dist-file...>`.
  Limit this to the static release's regular HTML/CSS/JSON artifacts. Verify
  containment and links, enforce byte limits, and refuse server code, credentials,
  DBs and paths outside that trial's build. Do not broadly allow `read dist/**`.
- Focused MCP tool-schema discovery, e.g. `mcp tools content_create`, filtering
  the real `tools/list` result before output bounding. This prevents a truncated
  entire catalog being the only route to a tool's argument schema. A missing or
  still-truncated descriptor must be explicit. This is not a component registry.

Browser inspection and official web documentation can remain outside the runner.
Require explicit result fields identifying those observations and their coverage.
Do not describe runner totals as complete discovery totals when those exist.
Do not build a web proxy or custom browser automation layer to eliminate this
honest limitation. No arbitrary URL or arbitrary executable action is allowed.

### Commands, attempts and output

1. Derive support from the installed profile intersected with the documented
   bounded verification policy. Keep `doctor`, `verify:fast`, `verify`, `build`,
   `audit:html` and `check:dev-tools` available where installed. Do not add a
   missing CMS command to a static project. The source-arm inspection restriction
   remains separately identifiable.
2. Retain immutable request operation/argv and actual executable/argv, npm script
   name, exit code, signal, timeout, process/transport/protocol/tool category,
   capture truncation and output truncation. Do not mutate arguments to prepare
   an execution and then log the mutated array.
3. Allocate unique attempt IDs/log names for preflight, worker and grading
   commands. Repeated attempts must never overwrite the first failure. Return
   the attempt/log reference in the command receipt.
4. Keep observed raw stream byte counts distinct from retained redacted bytes
   and returned payload bytes. Define delimiters/CLI envelopes as included or
   excluded consistently. Respect UTF-8 boundaries when bounding text; decoding
   a cut character must not silently inflate a promised byte limit.
5. An unmatched request remains incomplete. Archive validation must detect it;
   do not synthesize a successful result when the runner is interrupted.
6. Keep raw credential values and private stop capabilities out of all public
   logs, errors and receipts. Redact before publishing capture/output, including
   errors and bounded output. Test values split across chunks/truncation
   boundaries. Private server logs remain excluded from public export.
7. Keep loopback-only MCP with redirects refused. Classify malformed endpoints,
   network errors, HTTP errors, invalid envelopes, JSON-RPC errors and MCP tool
   errors consistently. Do not expand this into a general MCP client.

### Tests and acceptance

Test supported/missing/withheld commands, exact argv including spaces, nonzero
exit, timeout, stdout/stderr limits, multibyte text, interrupted request detection,
and credential redaction. Test each new operation's success and denial cases.
Reading or searching a controller/private path must fail or exclude it through
the same policy. A static worker must be able to build, preview, inspect emitted
HTML, stop its preview, and run the applicable gates through supported actions.

## 5. WP3 — Make grading independent, complete and resistant to false passes

**Primary file:** `scripts/workflow-replay-grade.mjs`.

### Shared grading behavior

- Read and validate frozen criterion/source-policy IDs. Do not extend an
  allowlist after seeing the evaluator's choice. Preserve functionally legitimate
  choices without requiring the historical helper filename.
- Capture source changes before grading and after temporary test mutations are
  restored. Include added and deleted files and actual contents for permitted
  new artifacts. `git diff HEAD` alone omits untracked implementation files.
- A source-preservation failure is a task failure, not permission to run arbitrary
  altered package scripts. Capture evidence and stop the affected execution path.
- Every failure path must flush an acceptance report. Deleted welcome content,
  invalid config, unavailable Chromium, a thrown setup step, or a failed restore
  must result in explicit failed checks, not an absent report.
- Put resource acquisition inside protected `try/finally` scopes. In particular,
  if Chromium launch fails after starting a local static server, still stop that
  owned server. Never kill a guessed PID or an unrelated browser.
- Separate `mechanicalStatus`, `reviewStatus`, and final acceptance status.
  A mechanical pass is not a final pass for criteria requiring semantic review.
  Document command exit semantics; archive/closeout must refuse pending review.

### Spacing

During fixture preflight, capture independent baseline measurements at 600, 1000
and 1500 CSS pixels: services gap, reference gap, relevant column structure,
visible main text and navigation link text/hrefs. Save the browser/tool version
and readiness result. These observations are operator evidence, not worker input
containing a proposed implementation.

After the task, require services gap to equal its baseline times 0.75 within a
documented rounding tolerance. Also require the reference geometry, visible copy
and navigation to match baseline. Keep global-token/component preservation
checks. A ratio alone is insufficient if both grids or page content changed.

Regression counterexamples must reject a correct ratio combined with changed
reference spacing, deleted copy, modified navigation, or global-token changes.

### Sveltia

Freeze exact allowed existing changes: schema, article detail, paired editor
form, relevant field/config tests and field documentation. Permit new focused
helpers/tests by role/location, without requiring `post-fields.ts` or
`reading-minutes.ts`. New helpers need content review; do not exempt all existing
library files or unrelated tests. Reject unrelated edits and all unapproved
deletions. Preserve packages, lockfile, content, global CSS and navigation.

Independently check:

1. Optional whole-number form input with bounds 1 and 60 and no forced default.
2. Strict typed number validation; numeric strings must not be coerced.
3. Real Astro loader/build/render at 1 and 60.
4. Field-specific content validation rejection for 0, 61, 1.5 and `"2"`. A timeout,
   import error or unrelated build failure containing the field name is not a
   successful validation check.
5. Absence remains valid; the legacy article has no reading-time label, and
   listing/home pages do not acquire one.
6. Temporary content is restored byte-for-byte in `finally`; the restored build
   passes and final source/content preservation is checked again.

Inspect rendered text semantically, rather than requiring one exact HTML
serialization such as `>1 min read<`. Use the project's existing HTML parser.
The generated form is JSON-compatible YAML. Either preserve that format as an
explicit frozen fixture constraint or support legitimate YAML with a documented
development-only parser; do not accidentally grade a serialization choice as a
field failure. Prefer the existing fixture format and avoid a new dependency if
it is not needed.

### CMS

Capture an independent baseline of content IDs and the specific public
settings/menu values covered by the task. Use installed supported CMS/auth APIs;
do not guess database column layouts or fingerprint the entire mutable DB.
Exclude runtime auth/session/cache values from business-setting comparisons.

Require exactly one new assigned-owner draft with the requested slug/title/
excerpt/body, null publication date/live revision, unchanged prior content,
unchanged relevant settings/menus, and anonymous 404. Finding one matching draft
while overlooking another unintended creation is insufficient. Keep source,
configuration and seed preservation checks and the final app gates.

The implemented harness now provisions a separate synthetic Editor observer with
only `content:read` and `settings:read`, captures pre-task item hashes and menu
and settings hashes over the installed MCP API, and accepts only the one expected
new posts draft during grading. The evaluator receives only the Contributor
credential. Cleanup independently revokes and disables the observer. This is
mechanically tested; the live CMS replay still needs to exercise the installed
tool schemas end to end.

An independent operator checks the Contributor publishing explanation and the
observed schema-scope denial. A failed schema read is expected permission
evidence, not a transport failure. Do not attempt publication simply to prove a
documented denial. Never give the evaluator the operator's private identity or
broader grant.

### Older-profile cold resume

Keep the corrected instruction forbidding **unperformed** check claims. Make
the generic ending consistent: source-only checks suffice for a handoff; any
executed gates must be reported truthfully, and operator preflight must not be
claimed as worker execution. Freeze this wording before dispatch.

Confirm both optional files are absent, no `PROJECT.md` is created, and only
`HANDOFF.md` changes. Independently review these statements with citations to
the resulting handoff and existing fixture evidence:

- audience, English static scope, exact email registration, and editorial/code
  ownership recovered without renewed discovery;
- quarterly cadence remains assumed; launch date remains unapproved;
- workshop collection and supplied content exist; workshop routes remain absent;
- the stale CMS handoff and **unselected** fixed-spacing DESIGN snapshot are
  resolved against later decisions, real configuration and implemented fluid CSS;
- no CMS installation, invented approval, forced document adoption, external
  action or missing-reference blocker.

Keywords cannot decide these semantic statements: a handoff can contain all
keywords and still recommend installing EmDash or claim an approved date. Keep
mechanical checks, but require a separate operator-review record naming the
criterion, verdict, evidence path/lines, reviewer kind, and limitations. It may
be an independent agent or human; do not label agent review as human acceptance.
The evaluator must not produce its own independent review.

## 6. WP4 — Own process lifetime, retries and cleanup explicitly

**Primary files:** controller and runner.

### Processes and expensive checks

Use owned child handles/capabilities for CMS and static previews. Persist enough
private lifecycle information as resources are acquired to make partial setup
diagnosable. Make readiness and stop waits bounded, handle spawn errors, and
close file descriptors in `finally`. Register stop/error handling before waiting
for readiness. Do not accept a setup/error response as a healthy public fixture.

For the closeout replay, run evaluators and heavy gates sequentially. Within a
trial, reject overlapping verify/build/HTML operations with a traced `busy`
response identifying the active operation. Do not build a general job scheduler.
This addresses the observed audit/verification overlap without loosening the
existing HTML capture deadline. Allow at most one documented deadline-only retry
after the conflicting work ends; retain both attempts. Do not retry schema,
integrity or permission failures until they happen to pass.

### Credential and cleanup state

1. Record owned user creation immediately, before minting a grant. Persist grant
   identity privately as soon as available. Use atomic state writes; never put
   raw tokens or stop URLs into public state/receipts.
2. Cleanup must attempt every trial even if another trial fails. Persist each
   step/attempt result as it happens and return nonzero if required cleanup is
   incomplete. Do not lose earlier successful revocations when a later stop
   request fails.
3. Support cleanup after partial preparation, missing private metadata, stopped
   apps, expired/already-revoked grants, and interrupted provisioning. Missing
   information means `unknown`/`needs-reconciliation`, not presumed success.
4. Revoke only positively identified owned grants, disable only owned synthetic
   users, and stop only owned apps. Resolve an owned partially provisioned user
   through the installed auth/token facilities if grant metadata is missing;
   never reset the DB or broadly revoke unrelated identities.
5. When the owned app is live, verify a revoked grant returns HTTP 401 before
   stopping it. When already stopped, use explicit independent local revocation
   evidence and record that live HTTP was unavailable; do not invent HTTP 401.
6. Do not erase information needed to retry failed cleanup. After successful
   credential/process cleanup, remove secret values and retain a nonsecret
   durable tombstone and cumulative step results. A second cleanup should remain
   safe and preserve prior success rather than replace it with null fields.
7. Cleanup and archive must remain usable for terminal runs. Serving, dispatch
   and new credential provisioning must be refused for those runs.

### Existing directory-removal blocker

The old directory is exactly `C:\dev\baseline-workflow-replay-20261023`.
Automatic approval review rejected both a checked removal and a literal-path
removal as “blocked by policy,” without another reason. Grants and servers were
already cleaned up. Do **not** hide the same removal behind Node/Python, another
shell, a new helper, renaming/moving the directory, or a different tool.

Have the owner remove the verified owned directory through an allowed/manual
action. Then independently verify absence and append a resolution receipt in
the **new** closeout report, linking the old blocked receipt. Preserve the old
receipt's historical truth. If the path still exists or removal remains blocked,
record that and leave issue closure pending unless the maintainer explicitly
changes the issue's cleanup acceptance. Never fabricate a removal success.

For new fixtures, verify resolved absolute path, run ownership marker, contained
trial paths, completed archive and stopped resources before any allowed removal.
Use native PowerShell with literal paths on Windows; do not compose deletion
across shells. Ownership checks do not override approval policy.

### Tests and acceptance

Use tiny owned local fixtures/failure injection to test first/middle/last-step
failure, two cleanup invocations, missing metadata, already-stopped server,
already-revoked token and bounded stop timeout. Confirm all trials get receipts,
no unrelated path/process/identity is touched, and no pending result is called
success. Test browser-launch failure releases the owned static server. Full
native EmDash auth behavior is checked in the real closeout replay.

## 7. WP5 — Add supported evidence export and a closure validator

**Suggested interface:** `workflow:replay -- archive --out <owned-run> --dest
<new-audit-directory>`. This is a proposed addition. Use the existing entry
point, with a small helper if needed. Do not depend on `.emdash/checks/` scripts.

### Public bundle

Export a bounded allowlist containing:

- saved protocol/criteria and worker prompt hashes;
- source/toolchain/harness and pair-equivalence receipts;
- actual dispatch records (fresh-session method, IDs/order, no invented model
  identity/usage, no history or corrective hints);
- installation/preflight/worker/grading attempts with real statuses and retained
  log references, including failed and incomplete attempts;
- traces, before/after source maps, diffs, and permitted added-file contents;
- independent mechanical reports and required semantic operator reviews;
- metric definitions/coverage, declared outside-runner observations and limits;
- cumulative cleanup, old-residual resolution, and new fixture-removal receipts;
- final repository verification receipts and an issue acceptance mapping.

Never copy raw `private.json`, private server/control state, session/cookie data,
environment files, databases, uploads or private server logs. Redact public
output before writing it, validate it again at export, and reject links and
unexpected paths. Test deliberate credential-bearing inputs, not just a regex
search through an already clean report.

Support a provisional archive before credential scrubbing/removal and a final
archive after cleanup. Re-export must accept identical existing files and append
new cleanup/closeout evidence; it must refuse silent replacement of differing
frozen evidence. A simple owned destination marker and manifest are sufficient;
do not create a general artifact versioning system. Mark provisional bundles
clearly. Finalize the bundle's content hashes only after its required contents
are present. Do not delete a fixture before its needed evidence is exported.

Metrics must distinguish observed process bytes, retained redacted bytes and
returned payload bytes. Keep model tokens/cost/comparable elapsed time absent
or explicitly unavailable. Count operator grading separately from worker runner
requests. Outside browser/web operations prevent claiming complete discovery
coverage; they do not automatically invalidate an otherwise honest task result.

### Closure validation

Produce a machine-readable `closure.json` with `readyToClose` and explicit
blocking reasons. Derive it from evidence, not manually assigned pass booleans.
Require all of the following:

1. all planned trials dispatched from applicable green, equivalent fixtures;
2. frozen source/harness/protocol identity consistent through the run;
3. all runner requests accounted for and all executed commands identified;
4. independent outcomes and required semantic reviews present;
5. no unresolved harness errors, unapproved source changes or restoration errors;
6. honest complete cleanup/removal evidence, including the old retained directory;
7. supported final-code verification/build/HTML receipts;
8. final public bundle passes privacy/completeness checks and references no
   missing required files.

Keep task failure separate from harness failure. A failed task must be reported
as failed, not repaired by the operator. The target for this closeout is accepted
outcomes in all seven planned trials, including the corrected older-profile
case. If a worker fails despite a valid harness, document it and obtain a
maintainer acceptance decision; do not silently weaken the target or close #7.

### Tests and acceptance

Export a synthetic complete run without private data. Reject a missing review,
incomplete request, changed frozen input, unexpected file, failed restore, missing
log, false cleanup flag, credential value and changed re-export. Preserve first
attempt failures. Tests may use synthetic command receipts; do not claim those
tests constitute real model, CMS or browser acceptance.

## 8. WP6 — Regression tests and final replay

### Automated checks

Keep fast tests deterministic and local. Add a rehearsal test file only for
actual subprocess/lifecycle/archive behavior that does not belong in the unit
tier. Register it in both required inventories. Do not add seven real installs,
model dispatch or browser regression to `npm test`/CI. The complete replay is an
explicit local operator action, and `test:visual` remains Windows-local only.

Required negative cases, beyond the existing ten focused tests:

| Area | Required regression behavior |
| --- | --- |
| Freeze | Reject source/harness/criteria/lock drift, missing paired files and cleaned-run dispatch |
| Discovery | Refuse controller/private paths and invalid paths/links; explicitly report oversized/partial search |
| Telemetry | Detect missing results/lost identity; preserve first failure; enforce multibyte bounds and redaction |
| Preview | Refuse nonloopback/path escape; report readiness/stop failure; release resources on launch failure |
| Spacing grade | Reject a correct ratio with changed reference geometry, copy, navigation or tokens |
| Sveltia grade | Accept a legitimate third helper basename; reject coercion, unrelated-error false passes and failed restore |
| CMS grade | Reject duplicate extra creation, wrong owner, changed prior content/settings and live/public versions |
| Cold resume | Reject keyword-only false passes and missing independent semantic review |
| Cleanup | Preserve partial failures; safely repeat; refuse unrelated targets; keep unknown/missing metadata explicit |
| Archive | Refuse final acceptance with missing evidence/review, secrets, links, overwritten evidence or pending removal |

### End-to-end closeout procedure

1. Complete the fixes and focused tests. Run the final repository gates below.
   Choose a unique new run/output directory; never reuse or mutate the old run.
2. Freeze the **final** implementation/protocol. Record exact operator code and
   fixture-input hashes. Keep code, criteria and fixture-generation inputs
   unchanged for the entire replay. Documentation changes that affect worker
   discovery/prompt inputs count as input changes too.
3. Prepare all seven independently installed fixtures with applicable preflights
   and enforced pair equivalence. Preserve actual failure attempts. Do not
   dispatch a failed fixture.
4. Dispatch the six representative task arms and corrected older-profile case
   in fresh history-free sessions, sequentially, using only their saved worker
   prompts. Do not override the user's configured model unless instructed.
   Record actual session IDs/method; if fresh-session tooling is unavailable,
   record a blocker rather than simulate independent sessions.
5. Give each worker the same bounded interface, with inspection withheld only
   in source arms. Let it complete without corrective hints. Record unsupported
   operations and declared outside observations.
6. Independently grade each final artifact and complete required semantic
   reviews. Test loader boundaries and restore original content. A grade/runtime
   code defect requires fixing the code and a new affected frozen replay; it is
   not permission to retrofit this run's verdict.
7. Produce the provisional public archive. Revoke grants, verify revocation,
   disable identities and stop all owned previews/apps. Resolve removal of this
   run and the retained old run through allowed actions; record actual absence.
8. Finalize the supported archive and closure validator. Verify no private data
   or missing required file escaped the bundle. Keep all failures/limits.
9. Run the final repository gates against the resulting code, then record those
   actual command receipts in the closeout bundle. If a later fix changes
   evaluated code/input identity, do not call the previous replay final-code
   acceptance; replay the affected scope in a new frozen run.

## 9. Commands and expected handoff

These commands **already exist**:

```powershell
npm.cmd run doctor
node --test tests/workflow-replay.test.mjs
npm.cmd run verify:fast
npm.cmd run verify
npm.cmd run build
npm.cmd run audit:html
git diff --check
```

Use the first three during implementation, then the full gates after fixes.
Add any new rehearsal file to the focused command when appropriate. Do not
repeat the whole suite after a pass without a new change/failure that warrants
it. Preserve per-attempt receipts rather than redirecting every retry to the
same filename. Full model/browser replay is local and separate from CI/tests.

Update `docs/workflow-replay.md` with the **implemented** interfaces and sequence,
including exact proposed-command syntax once it exists, failure behavior,
semantic-review requirements, archive lifecycle and cleanup limits. Remove any
need to consult an ignored local script. Keep historical reports unchanged.

The implementation handoff must include:

- changed files and the concrete behavior each change fixes;
- actual focused/full checks, statuses, warnings and failed attempts;
- new frozen run ID and public archive path;
- seven independent outcome records and semantic-review results;
- code/source/lock/pair consistency and trace-completeness results;
- cleanup/removal state for both the old and new runs;
- `closure.json`, with no unresolved blocker hidden by a general “pass”;
- explicit exclusions: no statistical/model-token/cost/speed, hosted OAuth/D1/R2,
  authenticated Sveltia, deployment or general architecture acceptance.

## 10. Issue closure checklist

| Original #7 requirement | Evidence required before closing |
| --- | --- |
| Disposable source-equivalent fixtures and green applicable gates | Final-run source/toolchain/lock manifests, pair receipt and actual preflight attempts |
| Installed-profile command policy | Capability/policy tests and real per-profile runner receipts, including explicit unsupported/withheld results |
| Immutable identity, status/truncation, failure classification and no credentials | Trace validation, regression tests, redaction/export validation and retained failures |
| Small documented fresh replay entry point | Supported CLI/docs; no dependency on ignored collectors or historical graders |
| Three representative fresh task pairs with frozen criteria and independent grading | Six actual dispatch records, frozen hashes, source/artifact outcomes and operator review where required |
| Older-profile missing-reference behavior | Corrected frozen prompt and fresh independent semantic result; both optional files absent; no CMS/project-record requirement |
| Honest checks, limitations and owned cleanup | Final gate receipts, attempt history, revoked/disabled/stopped evidence and verified old/new fixture removal |

The user intends to close #7 **after** the implementation is done. This planning
task does not authorize claiming the fixes or closure have already happened.
Once implementation, publication of the accepted changes/evidence, and every
closure condition above are satisfied, close #7 with a short evidence-linked
comment. Use committed GitHub file links/commit IDs in that comment, not local
filesystem links. Do not close it while `readyToClose` is false or the removal
blocker remains unresolved. Do not reopen or expand #6 as a substitute.

Suggested closing-comment structure, filled only with real results:

> Implemented the reproducibility follow-up in `<commit/PR>`. The supported
> replay entry point and final frozen run are documented at `<links>`.
> All seven task outcomes have independent evidence; required source/toolchain,
> preflight, trace and review checks passed. Temporary grants were revoked,
> owned processes stopped, and old/new fixtures removed (`<cleanup evidence>`).
> Repository verification/build/HTML gates passed (`<receipts>`).
> Inspection and PROJECT.md remain optional. The result remains exploratory;
> hosted/manual acceptance and broader review remain outside #7.

If a sentence is not supported, omit it and keep the corresponding closure gate
pending. A report with a clearly documented limitation is useful evidence; it
is not automatically permission to declare the unmet requirement complete.
