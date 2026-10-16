# Existing-site standards audit and guided modernization

## Outcome and review decision
Create a versioned, evidence-based Diagnose → Prescribe → Remediate workflow for downstream sites. A read-only audit must be useful before remediation tooling exists. Modernization preserves the site's requirements, identity, content and integrations unless its brief explicitly changes them.

Do not equate newer models, more motion or pixel equality with better design. Remove automatic Lenis, magnetic hover and text-box-trim retrofits. Native images, forms and proxies require runtime/editor verification, not regex replacement.

## Ownership and scope
#3 publishes a tested starter standards release and downstream registry. This issue consumes that release for a particular client repository. #1 owns implementation guidance; #4 design interchange; #5/#6 local inspection; #7 capture/diff infrastructure; #8/#9 database/media adapters.

Start with docs/site-standards-audit.md plus scripts/audit-site.mjs. Add a focused agent skill only if the runbook needs an agent entry point; register it in shared-skill distribution rather than duplicating specialist instructions.

All commands below are proposed deliverables, not present capabilities.

## Diagnostic contract
- npm run audit:site is read-only by default. Accept a target standards version/commit, runtime, scope and output directory. Never sync skills, run migrations, seed, install packages, write CMS content or upload media during diagnosis.
- Produce Markdown and versioned JSON under audit/site-standards/<run-id>/. Report rule ID/version, severity, evidence file/line or route/state, expected/observed behavior, confidence, applicability, remediation reference and verification. Status is pass, fail, warning, unverified or not-applicable. Unknown/offline/unauthorized is never pass.
- Capture repository/lockfile revision and dirty state, Node/framework/adapter versions, target hosting, locales, source standard, configuration hashes and capabilities. Secrets, private content and database dumps do not belong in the report.
- Reuse existing checks with adapters. The current check:schema-budget may exit zero when no DB exists: normalize that result to unverified. Distinguish actual physical table widths from seed expectations. Remote checks are opt-in and require an explicit named target.
- Read-only skill drift compares manifests AND normalized file hashes, managed skill membership and local overrides. Existing sync:site-skills --check only compares source commits; sync:emdash-skills currently mutates and has no --check mode. #3 supplies safe replacements.
- Use parsed code/CSS where justified; flag suspicious heading breaks, intrinsic grid overflow and semantic-color bypass as review candidates. Never automatically rewrite every br, 1fr, raw color or img.
- Inventory content candidates, locales, menus, cache hints (if enabled), .flow rendering, image storage/services and forms. Inspect field ownership against real schema/value/editor behavior. Neither source text matching nor missing proxy attributes proves a defect.
- Reuse #7 capture manifests and artifacts for route/archetype/state coverage. Before #7, accept documented manual captures. Include keyboard, focus, reduced motion, zoom/reflow, long content, missing assets and representative translations. Automated accessibility checks and vision critique supplement human review; neither establishes conformance.
- Database/media audits may initially be unverified pending #8/#9. Re-run those scopes before accepting any dependent data remediation.

## Remediation contract
npm run audit:modernize initially creates a prioritized plan; applying changes requires explicit selected recipe IDs and a reviewed plan bound to the target revision. Separate reproducible code recipes from editorial, data and deployment operations. If preconditions changed, regenerate the plan.

Each recipe states supported source/target versions, affected files/data, preconditions, intended behavior, backup/rollback, tests, content/editor checks and deferred risks. Codemods need fixtures and repeat-run safety. Reviewable code changes use a branch/PR; deployment and remote content writes are separate scoped actions.

Prefer shared causes in tokens/components. Keep existing accessibility, factual copy, URLs, locale ownership and working providers. A form recovery helper is not a submission handler. Design changes require the site's art-direction process, not automatic replacement of its design record. Baseline updates never silently approve regressions.

## Acceptance criteria
- [ ] Clean current starter, deliberately degraded legacy fixture and missing/offline service cases yield expected JSON/Markdown findings.
- [ ] Diagnosis leaves tracked files, DB/media and skill files unchanged; no network writes occur.
- [ ] Report distinguishes required failures, recommendations and unverifiable scopes; CI policy fails required unverified checks.
- [ ] At least one deterministic code recipe is applied twice safely on a disposable copy, with tests and rollback evidence.
- [ ] Pilot one authorized downstream site in a reviewable branch, recording original requirements, before/after route evidence and public/editor acceptance.
- [ ] No production data/deployment or aesthetic retrofit runs as a diagnostic side effect.
- [ ] Manual invocation is documented first; optional scheduled diagnostics report meaningful changes without opening duplicate findings.

## Dependencies and rollout
Standards/report contract can start alongside #3. Production remediation follows a validated #3 release and #7 safety harness. #8/#9 add later audit capabilities; their absence is explicit, not a reason to claim a full parity audit. Reuse existing migration and content-modeling guidance.
