# Workflow fixes following the common-task evaluations

These changes address the concrete failures from the [21 October evaluations](../agent-task-evaluations-2026-10-21/README.md). The original results and source receipts remain historical evidence; the post-fix replay is recorded separately.

## Implemented

- **Client-independent algorithm fixtures.** Neutral mapping/alignment tests use a fixed neutral specimen. Exception-pruning tests use an explicit synthetic list and verify exact retention, deletion and idempotency. Calibration portability starts from LF before constructing CRLF input. Checks of the installed site's actual tokens, contrast, fonts, consumers and CMS edit targets remain active.
- **Separate generator test source.** Generator and update rehearsals assemble an owned synthetic source from the bounded manifests, with a neutral test palette and exact test-only infrastructure hashes. They do not regenerate exemptions in the client site. A regression test verifies that the production generator still refuses a source missing its reviewed CSS exception before writing any destination files.
- **Portable byte-bound fixtures.** `.gitattributes` requires LF for the reviewed importer/migration fixtures. Their contents, expected hashes and acceptance policy are unchanged. A real Git clone test uses `core.autocrlf=true` and compares exact bytes. Existing CRLF working files need a refreshed checkout; changing attributes alone does not rewrite stat-clean files. The design-framework guide explains this boundary.
- **Discoverable canonical styleguide path.** The development integration prints a Component calibration path using Astro's resolved base and slash policy. Generated static sites print `/_styleguide/` by default. Root and generated-site documentation and workflow guidance point to this output. No redirect or release-route activation was added; production isolation remains enforced.

The fixed neutral CSS is a small test specimen, not a second client token configuration. The source helper is test infrastructure, not a new profile-generation mode. No production content, visual tokens or templates were changed.

## Validation

| Context | Verification | Build / runtime acceptance |
| --- | --- | --- |
| Original starter | 145 unit + 135 rehearsal tests; zero Astro diagnostics | Fresh build and release guard passed; HTML audit passed, 9 HTML files / 10 public responses |
| Calibrated Journal fixture | 145 unit + 135 rehearsal tests; zero Astro diagnostics | Fresh build, HTML audit, published Journal and retained Posts routes, draft 404 and development styleguide passed |
| Generated native static profile | 39 tests and typecheck passed | Canonical styleguide startup message and real GET passed; release build and developer-tool isolation passed |

See [root checks](root-checks.json), [root verification](root-verify.log) and
[post-fix replay](replay.json). The replay restores the earlier Journal implementation into a disposable calibrated site, applies these fixes, installs independent CMS dependencies and runs the full verification/build/HTML gates. It also generates a static profile and probes the actual canonical styleguide URL and release isolation. This is a regression replay, not a new blind agent trial or a replacement for the original scores. The earlier four unit and twenty rehearsal failures no longer reproduce. Client CSS and pruned exemptions remained byte-for-byte unchanged. Actual live-editor acceptance was established in the earlier evaluations; the post-fix replay checked public routes rather than repeating editor UI actions.

Focused regression checks, `verify:fast`, skill validation and `git diff --check`
also passed. The existing large-bundle build advisory remains.

Two replay setup corrections are retained: the first checkout did not rewrite existing stat-clean CRLF fixtures after attributes changed; the next used a dependency junction that the importer verifier correctly refused. The final replay explicitly rechecks out the reviewed files and uses a regular CMS `npm ci`. Neither failure was resolved by weakening a product check. Static checks reuse the earlier native profile's dependencies through a junction; no strict dependency/process isolation is claimed for that part.

Calibration timing remains a limitation of the earlier evaluation's observations. This change does not introduce chronology enforcement or a new workflow framework.
