# Baseline common-task evaluations — 21 October 2026

Completed ten scored trials across five common scenarios. Sveltia changes, regional spacing and saved-handoff recovery passed in both trials. Both new static sites passed the observed artifact checks, with calibration timing unverified. Both CMS features and editor journeys worked, while full verification remained blocked by reproduced pre-task fixture failures.

## Scope and controls

Five ordinary tasks were selected without further client guidance: a four-page professional-services site; an optional Sveltia article field; an editor-managed EmDash Journal; a regional spacing request; and continuation of a workshop feature from a saved handoff. Each scenario has two intended independent trials. Recovery has two fresh sessions per trial, with a deliberately complete checkpoint between them. It does not simulate an arbitrary crash.

The [protocol](protocol.json) and [client prompts](prompts.json) were saved before trials. Workers received fresh conversation history, their own disposable repository, the ordinary request and installed Baseline instructions. No expected implementation, prior result or corrective hint was supplied. Workers could use local documentation and synthetic local CMS credentials. They were instructed not to delegate or access other trials, production systems or external accounts. Final artifacts were checked separately with actual builds, Chromium, source comparisons and, for EmDash, local UI typing/save/reload/publish. Directory separation isolated authored artifacts; it was not an enforced filesystem sandbox. Package and browser caches may write outside a trial directory, as one worker explicitly reported. Strict process-level write isolation is not claimed.

The [source receipt](source-receipt.json) identifies the original checkout and exact tracked working-tree bytes, including the six earlier instruction/configuration changes. The synthetic snapshot commit `44ed9d438461ba2dc49da8dca6b13356348bf6ae` exists locally; it is not a published upstream release or a remotely fetchable commit. The original MCP configuration was replaced by the docs-only example. No original environment file, working database, uploads or account credentials were copied. Generated profile provenance names the source repository and this local snapshot commit; it does not establish upstream publication.

Fixtures used Windows, npm, Node 24.21.0, Astro 7.4.0 and EmDash 1.3.0 where applicable. Static and Sveltia maintenance fixtures passed verification/build before dispatch. CMS initialization and seed availability passed, but full CMS fixture verification was omitted before its first dispatch; this operator preflight gap is material to interpreting the CMS result below. Exact model resolution, token use and cost are not exposed by the collaboration tools. The account interruption and concurrent local resource use prevent a useful elapsed-time comparison.

## Results

| Common scenario | Independent trial results | Interpretation |
| --- | --- | --- |
| Four-page static services site | [1](trials/static-new-1/report.json): 8 pass, 1 unverified; [2](trials/static-new-2/report.json): 8 pass, 1 unverified | Requested artifacts accepted; calibration chronology unverified in both |
| Optional Sveltia reading time | [1](trials/sveltia-field-3/report.json): 11 pass; [2](trials/sveltia-field-5/report.json): 11 pass | Form/schema pairing, absence, rendered value, valid boundaries and rejection checks passed |
| Regional grid spacing | [1](trials/regional-spacing-1/report.json): 6 pass; [2](trials/regional-spacing-2/report.json): 6 pass | Requested ratio and scope preserved |
| EmDash Journal | [1](trials/cms-journal-1/report.json): 5 pass, 1 fail; [2](trials/cms-journal-3/report.json): 5 pass, 1 fail | Feature/editor accepted; existing calibrated-fixture verification fails |
| Saved-handoff continuation | [1](trials/cold-resume-1/report.json): 8 pass; [2](trials/cold-resume-2/report.json): 8 pass | Fresh continuation preserved decisions/content and completed public delivery |

See [results.json](results.json) for the independent criteria and the per-trial folders for worker notes, source artifacts, logs and selected screenshots. The frozen protocol yields six `pass`, two `partial` and two `fail` outcomes. Those categories should not be collapsed into an agent success rate: the partials lack chronology evidence, and the failures reproduce a pre-task verification problem. A missing observation is not silently converted into a pass.

The evaluator visually inspected both new-site homepages at narrow and wide widths, plus representative Journal and workshop renders. Both new sites used the requested warm/forest palette, legible hierarchy, wrapping mobile navigation and the supplied enquiry action. Their typography, line breaks and whitespace differed within the brief. This is bounded visual judgment, not evidence of conversion performance or human usability. Clean scored sessions required no client clarification or corrective implementation hints. One continuation worker found and fixed narrow overflow during its own text-resizing review before delivery.

## Findings

1. **Verification assumes an untouched starter in several places.** The first Journal implementation passed independent build, published/draft isolation, retained Posts URLs, navigation and a real inline-editor round trip. Full verification failed. A separate committed pre-task tree reproduced the same four unit failures: 141/145 tests passed before any Journal code existed. The failures concern the neutral DESIGN.md mapping, converting already-CRLF calibration input, assuming neutral CSS before applying a lane, and assuming starter exceptions have not already been pruned. This blocks a clean existing-site delivery after normal client token calibration. See the [diagnostic receipt](cms-preflight-diagnostic.json) and [raw verification log](cms-preflight-verify.log). These failures must not be attributed to the worker's Journal implementation; nor can the scenario be called fully verified.

2. **The existing regional composition API handles the spacing request.** Both independent trials used the local Grid gap control with the existing responsive alias. Independent grading found only the requested grid changed; at 1440 CSS pixels its gap went from 36px to 27px. Other measured grids, tokens, copy and links stayed unchanged. No additional spacing configuration layer was needed.

3. **Styleguide access creates avoidable recovery work.** Multiple worker notes describe a development 404, a trailing-slash retry or a separate fixture-build fallback. An independent unchanged static-fixture probe returned 404 for `/_styleguide` and 200 for `/_styleguide/`. This establishes a canonical-URL mismatch, not that every styleguide context is broken. See the [probe receipt](styleguide-diagnostic.json). Document and emit the actual canonical URL, then investigate any remaining dev/fixture differences with that URL.

4. **Final calibration artifacts do not prove execution order.** Both new static sites passed the observed artifact criteria, including saved direction and calibration records, production isolation, content, navigation, enquiry links and responsive checks. Tool-level chronology was not available to the independent grader, so pre-assembly calibration remains unverified. A final file and an agent's report are insufficient evidence of timing. The existing structural gate should not be described as chronology enforcement.

5. **Persisted handoffs carried the agreed brief in both trials.** Both phase-A checkpoints saved the typed collection, exact sample content and a written handoff while deferring the page and navigation. Their receipts preserve the files before fresh continuation sessions. Both fresh continuations passed all eight independent observations, including public/draft policy, unchanged workshop content, existing public content/links, tokens, responsive output, verification and build. Neither restarted client discovery. This supports ordinary durable handoffs; it does not establish arbitrary crash recovery.

## Interpretation and next changes

The strongest supported priority is to make verification usable after client initialization: isolate immutable starter-certification fixtures from current client tokens and exceptions, and normalize line endings before portability transformations. Keep the substantive assertions; do not relax checks merely to obtain green output. Re-run the CMS maintenance scenario against a green prepared fixture after that repair.

Next, make styleguide discovery print or document a working canonical URL and the appropriate development/fixture command. If pre-assembly calibration chronology needs to be measured, collect an execution receipt at that point rather than infer it from the final record.

This sample does not justify a universal schema compiler, a second brief-precedence file, a new MCP abstraction or a component registry. The measured spacing task already uses the shared primitive API. The recovery task tests ordinary durable handoff files. New infrastructure should address a demonstrated obstacle rather than expand the starter by default.

Two trials per scenario are exploratory evidence, not a success-rate estimate, a model benchmark or a before/after comparison. Browser checks used local Chromium, not a full accessibility or cross-browser audit. Sveltia's actual GitHub login/save workflow, deployment, external editors, Workers and production acceptance are outside this evaluation. No claim of production readiness follows from a local pass.

## Corrections and excluded attempts

- The initial Sveltia wrapper ambiguously discouraged changing verification tests. One worker implemented the feature but left an obsolete exact-field-list expectation; a second was stopped by the evaluator before completion. Both are excluded from task-failure rates. Fresh replacements received a neutral instruction allowing relevant regression updates while preserving rigor. They received no prior findings or implementation hints.
- Another Sveltia worker hit an explicit account usage limit. A prior CMS worker was no longer active when work resumed and had no final completion receipt. Their partial artifacts are retained in the disposable workspace; clean fresh replacements were prepared. Infrastructure interruption is not a demonstrated task failure.
- The spacing grader initially compared CRLF and LF inside multiline parsed tokens as different values. The grader was repaired consistently by normalizing line endings, and the original report was retained.
- The first independent CMS browser startup timed out during local dependency optimization. An unchanged-source browser retry passed; its original report and failed verification result were retained. The build was not silently reclassified or the failed gate suppressed.
- The first new-site worker left a preview process running. The evaluator requested cleanup only after freezing its result; no implementation correction was supplied.
- A root verification run under concurrent evaluation load failed a strict one-second HTML-audit performance assertion. An unchanged full rerun passed. A cold root HTML capture also exceeded its startup deadline; the unchanged retry passed. These are recorded as resource-sensitive verification, not demonstrated feature regressions.

[Dispatch history](dispatch.json), [grader amendments](grader-receipt.json) and [fixture receipts](fixture-receipt.json) retain these qualifications. No corrected attempt is presented as an untouched first attempt.

## Original checkout verification

The original Baseline checkout passed a fresh production build, final full verification, and HTML audit. Full verification passed 145 unit tests and 132 rehearsal tests, with zero Astro diagnostics. The HTML audit inspected nine HTML files and captured ten public SSR responses. The existing large-bundle build advisory remains. See the [repository receipt](repository-checks/receipt.json), [full verification log](repository-checks/verify.log) and [HTML audit log](repository-checks/html-audit.log).

The six earlier instruction/configuration edits were preserved byte-for-byte from the frozen source. Trial implementations remain in disposable sites and archived evidence; they were not applied to the root application. This delivery adds evaluation evidence and findings, not fixes for the newly identified calibration and styleguide issues.

## Evidence and reproduction

The `trials/` folders contain independent JSON reports, worker notes, relevant authored files or patches, and selected independent screenshots. Larger worker screenshot sets, local databases and dependency installations remain outside this repository under `C:/dev/baseline-task-evals-20261021-cde21c0d`; they are not delivery artifacts or production data. Reports retain their original absolute paths; corresponding collected logs and screenshots are stored beside each report where selected.

`harness/` archives the historical preparation and grader source. It is not a new supported Baseline command or general benchmark framework. Its imports resolve to repository scripts, and it reads/writes the ignored controller state under `.emdash/checks/agent-task-evals/`. Reproduction requires preparing a fresh disposable workspace, replaying the recorded prompts in fresh sessions, and grading only after workers finish. `continue-prepare.mjs` records this run's replacements and is not an idempotent setup command. Do not point it at production or substitute the original credential-bearing MCP configuration.
