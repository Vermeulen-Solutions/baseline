# Workflow trust follow-up — batch 1

Scope: improve stage handoffs, configured Node/SQLite backup acceptance and hosted authentication preflight. This is a reusable starter change; no client records, source captures, credentials or identifiable screenshots are included. Client media/design acceptance and efficiency proposals are outside this batch. The release endpoint is a pushed review branch; no site deployment is applicable.

## Implementation and acceptance

The workflow skill and project-context guide now make progress visible at transitions, blocker resolution and completion. They distinguish deployment, owner access, data transfer and publication, reuse answered authorization and retain one existing progress home. Additional overlapping status documents or percentage dashboards are not introduced.

`db:check-backup` checks the effective supported literal SQLite target without executing configuration, opens existing files read-only and compares reviewed/source/snapshot inventories and integrity. It refuses missing sources, unrelated native stores, aliases/hard links, sidecars and ambiguous populated/empty assumptions. Dynamic configurations require an explicitly reviewed target and are labeled operator-explicit. The command does not perform backup/restore, compare all content values or certify recovery. Neutral tests exercise supported online backup plus a separate restored-file readback.

The installed native rehearsal caught two assumptions that small synthetic fixtures missed: the actual registry is `_emdash_collections`, and read-only inspection of a WAL-mode snapshot can create sidecars. The checker now uses the real registry and inspects an owned temporary snapshot copy. The native-seed regression checks repeatability, unchanged snapshot bytes and absent snapshot sidecars. Source SQLite may still manage normal locking sidecars; no application rows are written. This demonstrates why native-version rehearsal is required alongside hand-built fixtures. Earlier interrupted verification attempts are retained privately and are not counted as final passes.

`check:hosted-auth` rejects the native missing-session warning and probes the installed 1.3.0 guard before credential creation, with no cookies/credentials/challenge. Unsupported versions and blocked/ambiguous responses fail closed. It does not prove that a session-store write or owner login succeeds. The maintained setup skill retains that human/native acceptance. The upstream-mirrored API/CLI skills are unchanged.

## Handoff behavior scenarios

| Scenario | Expected chat outcome | What this assessment can establish |
| --- | --- | --- |
| Hosting explicitly deferred | State the completed local result and next authorized local work. No hosting prompt or remote action. | Maintained instruction/example review; fresh-model behavior is not certified. |
| Owner completes review and requests preview | Retire the old review hold, prepare/deploy within scope, then state the exact remaining owner credential step. Do not ask for deployment approval again. | Maintained instruction/example review; not proof of future agent execution. |
| Owner creates passkey and authorizes transfer | Report owner access confirmed, transfer and verify within authorization, then report the populated preview and next task. Do not call code deployment a content migration. | Guidance is explicit; a controlled external owner/login rehearsal is not run by unit tests. |
| Authentication preflight fails | Explain the concrete failed check, continue independent preparation and repair within scope. Preserve users/data and require real owner login afterward. | Neutral native-guard fixtures and installed-route ordering tests; not real provider acceptance. |

The status finding concerned repeated behavior despite existing guidance. Structural tests alone cannot close it. A future observed migration should assess whether owners still have to ask where work stands; keep that behavioral limit visible rather than calling new prose a demonstrated fix.

## Release-blocking hook isolation correction

The first commit attempt exposed a pre-existing test-runner isolation bug specific to inherited Git hook state. A foreign fixture inherited the linked worktree's Git directory/index, changed the shared repository's `core.bare` flag and replaced the worktree index. The commit was stopped; the known non-bare setting was restored and the affected worktree index retained privately before reconstructing that index from its unchanged HEAD. Working files and the separate checkout's pre-existing edits were preserved. No reset of working files or branch history was used.

The runner now strips `GIT_*` variables only from test subprocesses, without changing the hook's own environment or index. This follows [Git's foreign-repository hook guidance](https://git-scm.com/docs/githooks#_description). A regression runs a foreign bare-repository fixture under a real linked-worktree environment and verifies the original HEAD, staged edit, index bytes and non-bare setting remain intact. This small release-blocking correction is included in batch 1 rather than bypassing the hook. Custom hook entrypoints are unchanged.

## Verification record

Ten focused backup/authentication tests and the two new hook-isolation tests passed. After the hook correction, final root `verify` passed 228 unit and 158 rehearsal tests; Astro checked 53 files with zero errors/warnings/hints. The fresh build and release-artifact check passed. `audit:html` passed nine HTML files and ten real public responses. Against that built artifact, the local native authentication command passed with `setupLocked: true`, `sessionGuardReached: true`; the owned acceptance server was then stopped. The actual neutral starter seed also passed backup inspection. No real Worker KV write or owner passkey was exercised by this batch.

Independent generated `static` and `static-sveltia` installs, clean installs, verification, production/fixture builds and HTTP checks passed; both retain zero database packages. Generated receipts bind the reviewed working-tree source based on `25824f0`; they are not represented as clean artifacts of that earlier commit. Final recovery-example documentation uses SQLite's read-only input flag to prevent missing-path creation; documentation format is checked separately. No external Worker, Cloudflare resource or client database was touched. Existing dependency advisories from the checked-in lockfile were not changed by this scoped work and are not reported as zero vulnerabilities.

New clones receive the maintained guidance and EmDash commands; static profiles receive shared handoff guidance without CMS commands. Existing sites need selective reviewed adoption of the commands, inventories and skill/docs changes. This review branch is not a merged release or automatic adoption into any client. A site redeployment is not applicable.
