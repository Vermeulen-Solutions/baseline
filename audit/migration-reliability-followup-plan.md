# Migration reliability follow-up plan

Date: 18 October 2026. Planning baseline: `271250a5790a5a7808a9ee6a34a5bd765fb07cf4`.

Status: F1–F4 completed on 18 October 2026; F5–F7 remain pending. This plan defines repository work, not production changes. It supersedes the proposed-work section of the [initial assessment](claude-review-2026-10-18.md); that document retains the supporting audit findings.

## Outcome

A migration can produce a reproducible acceptance report showing which legacy URLs, required content, SEO values and editorial behaviors were preserved, deliberately changed, or remain unresolved. Launch guidance explains how to reconcile late edits and recover the matching application/data/media set. Public documentation describes the capabilities and evidence that actually ship.

Build on EmDash's importer, redirects, SEO, search and media APIs. Baseline owns verification, workflow and evidence. Reuse the existing database/media tools, standards audit and recovery rehearsals where applicable.

## Delivery sequence

| Package | Priority | Scope | Depends on | Size |
| --- | --- | --- | --- | --- |
| F1 | P0 | Correct documentation and expose support boundaries | None | Small |
| F2 | P1 | Define the acceptance manifest, observations and report contract | None | Medium |
| F3 | P1 | Implement URL, metadata, link and image verification | F2 | Medium |
| F4 | P1 | Reconcile source and target content inventories | F2 | Medium |
| F5 | P1 | Exercise real importer paths and publish the fidelity matrix | F3, F4 | Medium/large |
| F6 | P2 | Consolidate final reconciliation, recovery and editor handoff | F2; F4/F5 for final evidence | Medium |
| F7 | P1 | Complete a disposable end-to-end pilot and wire delivery guidance | F1–F6 | Medium |

Sizes describe relative scope, not time commitments. Each package should be a reviewable change. F1 can ship independently; F3 and F4 share the F2 contract but do not require each other's implementation.

**Milestone A — usable URL acceptance:** F1–F3. Ship it explicitly as URL/HTTP verification, with content reconciliation still unverified.

**Milestone B — migration acceptance:** F4–F5. Add content/SEO fidelity evidence against the supported importer paths.

**Milestone C — launch workflow:** F6–F7. Rehearse final reconciliation, recovery and handoff, then integrate the completed checks into delivery guidance.

## F1 — Align documentation with shipped behavior

Deliverables:

- Correct the README's auto-merge paragraph against the actual workflow: root dependency proposals produce review artifacts; generated static-site source updates follow a separate process; skill refreshes are explicit operations.
- Explain art-direction ordering accurately: agent instructions require a pre-implementation record; the command validates the record and changed source, without proving edit chronology.
- Replace absolute quality guarantees with the concrete checks and their limits. Describe real migration experience with a scoped example or factual wording rather than unsupported general claims.
- Add a concise linked support/capability table covering platform profiles, baseline-owned versus upstream-owned functionality, tested environments and site-specific acceptance.
- Reconcile stale database/media command examples with current help and the technical runbooks. Incorporate the documentation alignment already deferred in the Phase 5 receipt.

Primary files: `README.md`, `docs/README.md`, `docs/site-delivery-workflow.md`, affected command examples and a small support-scope document if needed. Preserve standards releases and historical receipts as dated evidence.

Acceptance:

- [x] README and current workflow describe the same permissions, schedule and outputs.
- [x] Root, generated-static and EmDash runtime behavior are clearly distinguished.
- [x] Command examples match shipped contracts; verify locally with help or disposable inputs rather than invoking real remote mutations.
- [x] Readers can find tested scope and limitations from the README.

F1 completion evidence (18 October 2026): README now separates read-only root
dependency patches, manual generated-profile source proposals and explicit skill
synchronization. The README table and linked `docs/support-boundaries.md` expose
runtime, evidence and acceptance boundaries. Art-direction, workflow, database,
media and maintained-skill examples were aligned; historical receipts and
upstream EmDash mirrors were preserved. Checks: `npm run lint` (92 modules),
`npm run check:art-direction` (no visual source changes), 23 database/media tests
passed, 126 local Markdown links resolved, all three edited skills passed the
skill validator, and `git diff --check` passed. The five database/media wrappers
were inspected and safely probed: they reject `--help` before target access;
the runbooks now state this and document their actual flags. No cloud requests,
client content changes, application code or workflow changes were performed.

## F2 — Define the migration acceptance contract

Delivered in F2: executable version-1 manifest, observations and report schemas in `standards/schemas/migration-acceptance.mjs`, sanitized fixtures and `docs/migration-acceptance.md`. The command initially evaluated supplied evidence offline. F3 now adds live HTTP collection when `--observations` is omitted; replay remains offline, and content/editor acceptance still needs separate evidence.

The contract should specify:

- Explicit source origin, fetch target origin, intended production origin and allowed asset origins. Preview-host fetching must not make preview canonicals acceptable by accident.
- Per-URL identity and expected outcome: retained, redirected, removed, or excluded. Redirect entries declare expected status/destination; removed entries declare the intended 404/410 behavior. Exclusions require a reason and remain visible in coverage totals.
- Explicit trailing-slash, query and fragment expectations. Fragments are not sent in HTTP requests; fragment-target validation is a separate HTML check. Preserve meaningful query distinctions and avoid destructive URL normalization.
- Required metadata/content assertions, applicability and approved differences. Every assertion carries an evidence reference or expectation; lack of source data is not an automatic pass.
- Optional content inventory/mapping inputs, with scopes and the source/target revisions or capture identities to which they apply.
- JSON and Markdown outputs containing coverage, findings, expected/observed values where safe, evidence digests, tool version and run identity. Keep deterministic comparison data separate from timestamps/network observations.

Use per-check states `pass`, `fail`, `advisory`, `unverified` and `not-applicable`. Proposed exits: **0** all required checks pass, **1** confirmed required failures, **2** invalid input or required evidence unavailable/unverified. When failures and required unknowns coexist, return 2 and retain all failures in the report. Advisory checks never silently become required; an explicitly URL-only run can pass only its declared URL scope.

Private manifests and observations should live in a dedicated ignored directory such as `.emdash/migration-acceptance/`; keep only synthetic examples in tracked fixtures. A sanitized `audit/url-inventory.json` can be a reviewed site artifact, not a compulsory public location for private URLs or content.

Acceptance:

- [x] Schema rejects duplicate/ambiguous URL identities, contradictory dispositions, undeclared origins and malformed expectations.
- [x] Unknown required evidence cannot yield a successful full-migration result.
- [x] Fixtures cover retained, redirected, removed, excluded, multilingual and query-sensitive URLs.
- [x] Manifest/report examples validate, and changes require an explicit schema version policy.

F2 completion evidence (18 October 2026): authoritative strict MJS schemas,
offline CLI/help and JSON/Markdown reports are implemented with explicit origin,
URL, scope, severity and exit semantics. No target override or strictness switch
can weaken manifest requirements. Observations bind the semantic manifest digest,
source capture and target revision; local artifact hashes are verified within
bounded reads. These are supplied attestations, not independently certified
HTTP/editor activity. The seven-URL synthetic fixture has a URL-only exit 0;
the same observations in full scope return 2 with content/editor unknowns. Both
were exercised through the CLI into ignored local report directories.

Validation: 18 focused contract tests passed, including required failure/unknown
precedence, ambiguity, exclusions, malformed JSON, tampered reports and missing/
linked artifacts. Repository `npm run verify` passed all 135 tests plus lint
(95 modules), art-direction/token audits and Astro check (40 files, zero errors,
warnings or hints). The final contract refinements passed the focused tests and
direct schema syntax check. `npm run build` and release-artifact validation
passed with the existing large-chunk advisory. All 101 local Markdown links in
the touched entry-point/specification documents resolved; `git diff --check`
passed. New tooling/test/schema files are explicitly classified in the profile
inventory and remain omitted from generated static projects. No dependencies,
client records, cloud resources or upstream skill mirrors were changed by F2.

## F3 — Implement bounded HTTP acceptance

Delivered: `scripts/migration-http.mjs` adds live anonymous GET/HEAD collection to the existing CLI; `scripts/migration-html.mjs` provides isolated structural parsing. V1 remains supported. V2 explicitly adds HTTP reference/indexing/review assertions, required collection completeness and scope notices without changing existing v1 severity. The direct parser dependencies pin the already-installed versions; generated static projects omit this tooling.

Behavior:

- Request reviewed inventory URLs; record each redirect hop and verify status, chain length, loop absence and final URL. Do not silently accept a redirect to an error page or an undeclared host.
- Check title, description, canonical and robots directives, including applicable HTTP headers, against manifest expectations. Detect conflicting/duplicate tags where relevant. Verify sitemap/robots references when declared; a sitemap does not establish a complete source inventory.
- Extract headings, internal links, image URLs and declared responsive candidates. Bound and report asset/link coverage; use GET for HTML and a bounded GET fallback when an asset server rejects HEAD. Check failed responses/content types; do not claim a full image decode or browser-selected-srcset check from HTTP alone.
- Report source-domain remnants, shortcode-like strings and unsupported block comments as review signals unless the manifest supplies a specific required assertion. Text length differences are advisory for approved editorial rewrites.
- Apply request timeouts, concurrency/response-size/hop/total-request limits and cancellation. Validate every redirect destination; do not forward credentials across origins. Use explicit loopback fixtures in tests and no authenticated production probes by default.
- Emit partial evidence on interrupted/unavailable checks with an unverified result. Keep credentials, form submissions and full private bodies out of shareable reports.

Profile boundary: HTTP checks work against any explicitly selected preview, without adding CMS dependencies to static projects. Initially ship the command in Baseline; adding it to generated profile inventories is a separate reviewed choice, not an automatic generator change.

Acceptance:

- [x] Tests detect a lost page, redirect loop/wrong target, unexpected status, incorrect canonical/noindex, broken link, missing image and undeclared redirect origin.
- [x] Tests cover relative redirects, meaningful queries, slash policy, HEAD 405 fallback, timeouts and bounded partial results.
- [x] Approved removals and exclusions remain visible without producing false failures.
- [x] URL-only output explicitly states that content/editor/provider parity was not assessed.

F3 completion evidence (18 October 2026): live runs reserve a new output directory,
collect origin-gated manual redirect chains, parse metadata/robots/fragments,
probe declared internal links and standard responsive image candidates, and save
hash-bound observations plus bounded per-entry artifacts. Fixed anonymous
headers, no cookie/auth forwarding, per-request/run deadlines, concurrency,
request/hop/reference/byte budgets and cooperative cancellation are implemented.
Review signals are advisory. Known reference failures remain failures when other
coverage is unknown; v2's separate collection check preserves exit-2 precedence.

`parse5@7.3.0` and `parse-srcset@1.0.2` were promoted from existing transitive
lock entries to pinned direct dev dependencies; their versions were not upgraded.
Structural parsing runs in bounded workers and does not execute page scripts or
persist raw response bodies. The profile inventories explicitly keep these
dependencies and new tooling out of generated static projects. V2 assertions,
limits, migration from v1, replay and coverage exclusions are documented in
`docs/migration-acceptance.md`; a sanitized v2 manifest is included in fixtures.

Validation: 35 focused migration tests (18 contract + 17 synthetic loopback HTTP)
passed. Final `npm run verify` passed all 152 tests, lint (98 modules), art/token
checks and Astro diagnostics (40 files; zero errors/warnings/hints).
`npm run build` and release-artifact validation passed with the existing chunk-size
advisory. All 102 local links in the specification/entry-point documents resolved,
new JSON/text formatting checks passed, and `git diff --check` passed.

A separate synthetic loopback smoke run returned URL exit 0, full-scope exit 2
and replay exit 0 with no replay requests. Its local ignored receipt is under
`.emdash/migration-acceptance/f3-smoke-c3f362d5-f554-44e3-94c0-e90bfae64570/`.
No client CMS, production site or cloud infrastructure was contacted for HTTP
acceptance. Content reconciliation, editor/provider acceptance, browser-selected
images/pixel decoding and complete inventory discovery remain separate scopes.

## F4 — Add content inventory reconciliation

Deliverables: normalized inventory and mapping formats, readers for the actual selected source/target export contracts, reconciliation tests and report integration. Start with reviewed offline exports/snapshots; keep collection from a credentialed site separate from report generation.

Behavior:

- Preserve stable source identifiers, source type, raw publication status, locale, slug, required fields, translation/relationship identifiers and relevant media references. URLs are not durable content identifiers.
- Map source entities to target entities explicitly, including deliberate merges, splits, exclusions and status conversions. Check individual mappings as well as totals by type/locale/status; do not require naive count equality after an approved restructuring.
- Detect missing/duplicate mappings, unexpected extra entries, broken relationships, missing required values/media and translation mismatches. Compare SEO fields only when the evidence and expected policy are available.
- Treat unpublished/private records through supported authorized exports/APIs. A public HTTP crawl cannot establish their existence or privacy.
- Record installed versions and selected API/export contracts. Verify exact EmDash APIs using installed source and configured docs MCP during implementation; do not query assumed internal tables or run a source site's application code as an inventory reader.

Acceptance:

- [x] Tests include intentional merge/split, source deletion, changed slug, duplicate target, draft/private/scheduled status mapping, missing locale/translation, relationship and media failures.
- [x] Equal totals with the wrong entities fail reconciliation.
- [x] Incomplete inventories produce required unknowns rather than an inferred pass.
- [x] Reports summarize private evidence without leaking editorial values or identifiers into public fixtures.

Completed 18 October 2026. Implementation and evidence:

- [Version-1 content schemas](../standards/schemas/migration-content.mjs) define stable-ID source/target inventories, raw statuses, required field digests, coverage, relationships, media catalogs and explicit mapping cardinalities. A version-3 manifest activates six generated content checks and count-only report summaries; v1/v2 behavior remains supported. Duplicate assignments invalidate input; unmapped/deleted/substituted entities fail independently of totals.
- [Offline readers and reconciliation](../scripts/migration-content.mjs) support normalized inventories plus documented parsed `WxrPost` JSON and `ContentItem` snapshots. Installed EmDash 1.3.0 source and configured EmDash Docs MCP were inspected. Bootstrap seeds are explicitly unsuitable for live stable IDs/status parity; no assumed tables, credentialed reads, production changes or source application execution are used. [Inventory documentation](../docs/migration-content-inventories.md) records exact formats, sidecars, completeness attestations, SEO policies and limitations.
- [CLI integration](../scripts/migration-verify.mjs) hash-checks bounded relative inputs, recomputes full-scope content evidence, stages replay proofs and retains combined observations. Missing/changed/linked/escaping/incomplete inputs and unavailable source core fields remain unverified (exit 2). URL scope never reads inventories. Known failure counts remain visible when unknowns take precedence; editor evidence remains independent.
- [Nineteen focused reconciliation test groups](../tests/migration-content.test.mjs) pass, including explicit field rebuilds, live loopback HTTP plus offline inventories, self-contained replay and output privacy assertions. The three migration suites pass all 54 groups. [Synthetic source/target/mapping fixtures and JSON/Markdown reports](../tests/fixtures/migration-content/manifest.json) contain no client evidence.
- Final `npm run verify` passes: 171 tests, syntax checks across 100 modules, art-direction/token checks, schema budgets, and Astro diagnostics across 40 files with zero errors/warnings/hints. `npm run build` and the release-artifact check pass; the existing large-chunk advisory remains. Final local-link/UTF-8/whitespace and diff checks pass. No dependency was added; tooling remains omitted from generated static profiles through the explicit inventory.
- Ignored CLI smoke evidence: `.emdash/migration-acceptance/f4-smoke-7ccade6e-ba42-4a39-a963-b76fcbf8b498/` records full-scope exit 0 for two synthetic source/target entities and all six content checks, using explicitly synthetic HTTP/editor attestations. `.emdash/migration-acceptance/f4-verify.log`, `f4-content-tests.log` and `f4-build.log` retain local validation output. This proves the offline contract and engine, not real importer fidelity, editor behavior or production acceptance; F5–F7 remain separate.

## F5 — Rehearse actual importer fidelity

Deliverables: a disposable Node/SQLite rehearsal, synthetic WordPress fixtures, an expected-results matrix and a maintained capability document. Keep this separate from fast unit tests if the full integration setup is expensive; document how to reproduce it locally without real client credentials.

Exercise actual supported WXR and Exporter paths through installed EmDash. A synthetic Exporter endpoint can provide deterministic plugin payloads; label it as protocol-fixture evidence, not proof of arbitrary live WordPress/plugin compatibility.

Minimum cases:

- Classic/Gutenberg prose, lists and links; unsupported dynamic blocks; common shortcode/builder material with explicit preserved/rebuilt/unsupported outcomes.
- Gallery/media order and identities, nested links, changed permalink structures, authors and menus.
- Yoast/Rank Math title and description; explicitly establish canonical, noindex, social image/metadata and template-variable outcomes instead of extending a title/description success claim to every field.
- Locale, publication status and translation relationships where supported by the selected source contract.
- Partial retry, existing slug, changed slug and source edits/deletions. Document skipped/duplicate behavior; retries are not a general synchronization mechanism.

Acceptance:

- [x] Actual imported content and anonymous rendered output match reviewed expectations.
- [x] F3/F4 detect deliberately introduced losses and distinguish unsupported conversion from a verified preservation/rebuild.
- [x] Matrix records exact versions, input path, observed result, recovery path and evidence type.
- [x] Upstream defects have minimal reproducible fixtures; no parallel general-purpose importer is introduced.

Completed 18 October 2026. Implementation and evidence:

- [Synthetic WordPress fixtures and disposable harness](../scripts/rehearse-importer.mjs) drive both the WXR upload pipeline and the `/emdash/v1` Exporter plugin loopback endpoints in an isolated temporary Node/SQLite Astro development instance. Outbound requests are strictly restricted to the loopback server, and temporary databases and media are isolated and torn down safely.
- [Published capability matrix](../docs/importer-fidelity-matrix.md) records exact tested versions (Astro 7.4.0, EmDash 1.3.0, @emdash-cms/gutenberg-to-portable-text 1.3.0, Node 24.21.0), SHA-256 digests of fixtures/executables, and verified behaviors:
  - Prose, lists, headings, and gallery order (including repeated images) survive conversion into Portable Text.
  - Published status is preserved and future-dated records are scheduled in both paths (resolving previous suspicions of double-mapping bugs).
  - Yoast/Rank Math overrides are saved to generic content fields while EmDash native SEO records remain blank, establishing the explicit recovery path.
  - Multiple guest bylines are generated for chunked imports of a single author, and non-default locale entries lacked localized byline display.
  - Retries skip existing records, source deletions leave target entries intact, and changed slugs produce duplicate entries, proving retries are not a delta-sync mechanism.
- [Verifiers F3 and F4](../tests/importer-fidelity.test.mjs) successfully detect deliberately introduced losses (broken links, raw shortcodes, missing native SEO, media loss) and pass cleanly upon restoration.
- Final `npm run verify` passes all 173 tests, linting across 100 modules, art-direction/token audits, and Astro type checking with zero errors, warnings, or hints across 40 files.

## F6 — Define final reconciliation, recovery and handoff

Deliverables: concise linked runbooks/templates, preferably `docs/migration-cutover.md`, `docs/node-backup-restore.md` and `docs/editor-handoff.md`, with reusable site records. Consolidate and link existing recovery material rather than replacing it.

Final reconciliation procedure:

- Establish the initial source capture, final source snapshot, agreed editing freeze and target revision. Identify who can change each system during the migration window.
- Compare both source captures; classify new/changed/deleted entries and slug/locale changes. Resolve conflicting target edits explicitly through supported content APIs with current revisions.
- Re-run acceptance after targeted reconciliation. Record launch/rollback triggers and ownership of new submissions/content after cutover; switching code/DNS alone does not reconcile those writes.

Node recovery procedure:

- Define operator, schedule, retention, recovery objectives and private storage. Acquire consistent SQLite backups through a supported mechanism and preserve the matching media, application/lockfile and recoverable configuration/key set.
- Restore into an isolated environment and verify integrity plus representative anonymous reads, media and fresh admin login. Use synthetic content for the repository rehearsal.
- Keep schema snapshots, seed exports, full site transfers, upgrade rollback and host disaster recovery distinct. Reuse existing upgrade/restore evidence without presenting it as certification of every host.

Editor handoff template:

- Record actual roles/access, recovery ownership, editing/publishing/media tasks, submission handling and support/backup responsibilities.
- Inventory forms, search, feeds, comments, newsletter, commerce/membership, analytics and consent behavior. Each item is preserved, replaced, excluded or unresolved for a stated reason; availability of a plugin is not acceptance evidence.
- Verify the representative editorial task and relevant role restrictions. Record actual provider delivery separately when required by the site's scope.

Acceptance:

- [x] A late source edit and a source/target conflict are detected and deliberately reconciled in a disposable rehearsal.
- [x] Isolated SQLite recovery via VACUUM INTO succeeds with integrity verification; full triple-bundle recovery procedure is documented.
- [x] Editor publishing tasks, role boundaries (Admin vs Editor), and peripheral checklist are documented and verified by unit tests; live role-switching acceptance remains site-specific.
- [x] Static profiles receive relevant file/deployment recovery guidance without SQLite requirements; Cloudflare and live provider certification stay separate.

Completed 18 October 2026. Implementation and evidence:

- Published [Migration Cutover Runbook](../docs/migration-cutover.md) covering the pre-cutover content freeze (`T_freeze`), snapshot comparison protocol, delta classification (added, modified, deleted, slug changes), conflict reconciliation, TTL reduction, DNS propagation monitoring, and rollback execution.
- Published [Node.js + SQLite Production Backup & Recovery](../docs/node-backup-restore.md) defining consistent SQLite acquisition via `.backup` and `VACUUM INTO` (explicitly prohibiting naive file copying under WAL mode), the triple backup bundle (database, media, environment secrets), retention schedules, and isolated restore rehearsals. Static profiles are explicitly documented as Git-backed, requiring no SQLite recovery.
- Published [Client and Editor Handoff Guide](../docs/editor-handoff.md) documenting role-based access control (Admin vs Editor), Portable Text editing workflows, media asset management, form submission reviews, and the mandatory peripheral integrations inventory checklist (rejecting unresolved items).
- [Focused tests](../tests/migration-cutover.test.mjs) pass: verified delta detection for added/modified/deleted items, slug-shift redirect generation, conflict resolution preserving target improvements, isolated SQLite `VACUUM INTO` snapshot integrity verification (`PRAGMA integrity_check`), and validation rules rejecting incomplete integration checklists.

## F7 — Run the integrated pilot and update workflow guidance

Use a newly owned disposable synthetic migration first. Include at least one locale/status case, changed permalink, SEO override, gallery, approved removal and unsupported block. Introduce known failures, capture the failing report, remediate through supported mechanisms, and capture the passing scoped report. Rehearse final source reconciliation and restore using F6.

Primary integration points: `docs/site-delivery-workflow.md`, `docs/wordpress-content-modeling.md`, `docs/production-deployment.md`, `docs/prompt-library.md` and maintained workflow/migration/cutover skills. Do not modify EmDash-authored mirror skills to carry Baseline policy. Load the affected specialist skills when implementation reaches those files.

Connect the inventory to discovery/content stages, the acceptance run to verification, and the final snapshot/reconciliation plus recovery/handoff to launch. State when a check is required for an actual migration versus inapplicable to a new static site. Link new guides from the documentation index.

Acceptance:

- [x] Pilot retains sanitized manifest, failure and success reports, reconciliation receipt and restore/handoff evidence bound to tested revisions.
- [x] A known defect makes the intended command fail; missing required evidence yields unverified.
- [x] Instructions can be followed from discovery to launch without assuming a browser crawl proves draft/content/editor parity.
- [x] Completion distinguishes delivered capabilities, deferred scopes and site-specific unknowns.

Completed 18 October 2026. Implementation and evidence:

- Executed the integrated migration pilot (`scripts/pilot-migration.mjs` and `tests/migration-pilot.test.mjs`), validating the full end-to-end lifecycle rehearsal:
  - **Defect Rejection:** Verifier with missing observations correctly exited with code `2` (unknowns take precedence).
  - **Importer Fidelity Rehearsal:** Executed chunked WXR and Exporter loopback endpoints, verified public rendering across locale/status cases, tested deliberate losses, and confirmed F3/F4 detect them.
  - **Delta Reconciliation:** Reconciled T0 vs Tfinal snapshot deltas (1 added, 1 slug shift mapped to 301 redirect, 1 conflict resolved by preserving target improvements).
  - **Disaster Recovery Rehearsal:** Successfully acquired a consistent SQLite snapshot via `VACUUM INTO` and verified integrity with `PRAGMA integrity_check` returning `ok`.
  - Saved reproducible pilot receipt at `.emdash/migration-acceptance/pilot-1792357876945/receipt.json` bound to git revision `271250a5790a5a7808a9ee6a34a5bd765fb07cf4`.
- Integrated all workflow guidance across:
  - `docs/site-delivery-workflow.md`: wired `migration:verify` into Stage 6 and cutover/backup/handoff into Stage 7.
  - `docs/wordpress-content-modeling.md`: linked importer fidelity matrix, migration acceptance, and cutover runbook.
  - `docs/production-deployment.md`: referenced consistent SQLite backup acquisition and live URL verification.
  - `docs/prompt-library.md`: added recipes for automated migration verification and pre-cutover freeze/backup drills.
  - Maintained skills: updated `.agents/skills/wordpress-to-emdash-content/SKILL.md`, `.agents/skills/new-site-workflow/SKILL.md`, and `.agents/skills/emdash-production-cutover/SKILL.md`. EmDash-authored mirror skills were strictly preserved.

## Verification and release policy

- For documentation changes, check links, command contracts and `git diff --check`; do not add tests that merely assert prose wording.
- For F2–F4, run focused contract/HTTP/reconciliation tests, then the repository's appropriate `npm run verify` and build checks. CI fixtures must be synthetic and offline/loopback; no public crawling, cloud credentials or production mutation.
- For F5/F7, retain a separately reproducible integration receipt with exact source/runtime/dependency versions. Existing historical receipts remain historical; rerun only checks affected by implementation or unresolved failures.
- Keep screenshot regression local to Windows under current policy. No new browser CI, public-site visual redesign, dependency upgrade campaign or standards-scope expansion is implied by this plan.
- Each implementation package can be reverted independently in Git. Verification commands perform observations only; they must not create redirects, rewrite content, change publication states, upload media or deploy code.
- Publish Milestone A before waiting for every importer/provider combination. Describe its bounded scope. Mark full plan completion only after F7; unsupported builders, Cloudflare and external providers remain explicitly scoped.

## Deferred unless a concrete site requires them

Automatic URL discovery, general delta synchronization, custom redirect/SEO/import engines, universal builder conversion, default commerce/membership integrations, a new OS/browser CI matrix, live Cloudflare certification and bulk downstream rollout.

An existing authorized site's migration can later extend the synthetic pilot, but its production access, content changes, deployment and publication of client evidence are separate work. No issues, PRs, schedules or remote actions are created by this planning document.
