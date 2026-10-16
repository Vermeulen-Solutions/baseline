# Phased implementation and rollout plan

Reviewed 15 October 2026. This plan implements the refined [ten-issue roadmap](https://github.com/Vermeulen-Solutions/emdash-site-starter/issues). It does not authorize automatic production migrations or client changes. Suggested PR slices are work packages within the existing issues, not new GitHub issues created by this review.

## Delivery principles

- Keep Node/SQLite/local media as the default. Certify Cloudflare/D1/R2 as a separate optional profile.
- Preserve current client content, URLs, locales, editor ownership, providers and identity. Modernize according to evidence and scope.
- Make diagnostics read-only and reproducible; retain unverified states. Selected changes have explicit preconditions, tests and rollback.
- Distinguish code release, CMS migration, site transfer and storage upload. One does not imply the others succeeded.
- Record exact tested versions rather than floating “1.2+” promises. Runtime/package changes precede final harness baselines; preserve a pre-upgrade capture for comparison.
- Evaluate Astro itself at every meta-review, not only EmDash. The current lockfile is a reproducible baseline, not an upgrade ceiling. Record an adopt/defer/not-applicable decision for each relevant stable release and feature, with evidence and a revisit trigger for deferrals.
- Ship small capabilities; do not make the first standards review wait for every future harness. Later capabilities extend certification.

## Phase 1: Quick Wins & Dev Ergonomics

Goal: establish accurate guidance and a usable local verification surface with minimal platform change.

| Order | Work package | Issue | Effort / gate |
| --- | --- | --- | --- |
| 1 | Record runtime/version/capability inventory and review the existing local schema/editorial changes as a separate prerequisite | #3 initial slice | Small; committed/released facts distinguished from local work |
| 2 | Add visual-reference preflight, contextual CSS rules and upstream ownership policy to maintained guidance | #1 | Small; screenshot/source-site examples and unchanged canonical art-direction gate |
| 3 | Add minimal styleguide using actual components and deterministic local fixtures | #5 first slice | Medium; dev 200, normal build 404, real APIs and no invented theme/component variants |
| 4 | Implement G layout guide with existing T/B behavior intact | #6 G slice | Small/medium; selected Container bounds, narrow/wide/RTL checks and no production handlers |
| 4a | Add neutral zero-JS LogoTicker and static/motion/RTL specimens | #10 component slice | Medium; native stop control, inert duplicates, reduced motion and no component script |
| 5 | Capture a representative pre-upgrade public/editor baseline and runtime receipt | #3 preparation | Small; synthetic or permission-cleared evidence, exact source revision/viewport |

Agree #5/#7 fixture mode and capture metadata now, even though the full harness ships in Phase 3. Check default-production exclusion before adding more specimens. Do not bundle O/P, external design tools or a theme redesign into these quick wins.

Exit gate: the existing baseline still passes its appropriate checks; the styleguide is useful locally, inaccessible in a normal release and driven by real component code. Existing uncommitted work is either reviewed/landed or explicitly excluded from the released standard. No source-wide gate exemptions or fabricated client record.

## Phase 2: Upstream Starter Modernization & Standards Baseline

Goal: select a tested modern CMS/runtime baseline and establish safe standard distribution.

1. **#3 safe skill synchronization.** Implement check/stage/apply and local hash/ownership detection before updating mirrors. Include emdash-content-modeling in distribution. Preserve local additions and upstream licenses/provenance. Test same-commit local drift, unknown extra files, missing managed skill and interrupted apply. The isolated sync performed during this review is evidence only; it did not update the working checkout.
2. **#3 joint Astro/EmDash upgrade evaluation.** Evaluate Astro 7.4.0 (and any newer stable candidate at execution time) alongside EmDash 1.2/1.3, official adapters/integrations and Node. The locked Astro 7.3.5 is the comparison baseline, not a version to preserve by default. Follow the dedicated 7.4 evaluation below, select exact tested versions, and update the npm lockfile only as a reviewed implementation change. Rehearse fresh setup and existing-database upgrade on disposable copies. Check admin login, canonical rich text, field saves, locales, galleries, media after upload and route/cache behavior where enabled. Retain a recoverable database/media snapshot; reverting package versions alone is not a database rollback.
3. **#3 native forms decision.** Evaluate @emdash-cms/plugin-forms as an opt-in integration using real validation/Turnstile/storage/notification/recovery cases on Node and disposable Workers. Record the adoption matrix. Keep existing utilities until replacement behavior is proven; no default production provider change.
4. **#4 optional DESIGN.md bridge.** Pin the alpha spec/tooling and test a neutral concept plus token mapping. Keep AGENTS direction/gate and shipped CSS authority explicit. Validate fluid expressions, semantic aliases, color values and contextual surfaces; record losses rather than flattening them. External exchanges stay optional/unverified when the connector is unavailable.
5. **#10 calibration and architecture.** Add Stage 4.5 after art direction and before page assembly: calibrate relevant real components on the #5 styleguide, record source/token/state/asset evidence in audit/component-calibration.md, and revisit when representative pages reveal gaps. Ship LogoTicker as adjacent Phase 1/2 work before #7 goldens. Canonical AGENTS plus maintained astro-site-design and .agent/rules bridges define open wrappers, deliberate semantic composites, surface-aware actions and the src/assets/CMS asset boundary. No universal pre-write enforcement, fabricated themes or automatic chat management.
6. **#3 standards/registry contract.** Define the versioned standards manifest and required versus advisory checks. Implement idempotent new-site registration with private-storage and pending-registration paths. Initial release notes must state which later checks have not shipped yet.

Exit gate: supported runtime/API matrix, successful fresh/upgrade rehearsal, tested restore instructions, reviewed skill diffs and a documented forms/design-interchange decision. Node remains usable without cloud accounts. A narrowly scoped candidate standards release can exist before #7; broad downstream remediation waits for Phase 3 certification.

### Astro 7.4 evaluation and recurring framework review

The [Astro 7.4 announcement](https://astro.build/blog/astro-740/) is required input, together with the changelog, [upgrade guidance](https://docs.astro.build/en/upgrade-astro/) and installed-version API checks. This evaluation was implemented in Phase 2: the current candidate is Astro 7.4.0 / EmDash 1.3.0. The historical comparison below explains the original selection; see audit/phase-2/README.md and standards/manifest.json for tested scopes and pending certification.

**Historical baseline before Phase 2 (7.3.5):** package.json has retained `astro: ^7.3.2` since initial scaffolding; package-lock.json resolves 7.3.5. The range admits 7.4.0. EmDash 1.1.0 declares Astro >=6.0.0-beta.0 and the installed Node adapter declares ^7.2.1, both admitting 7.4. No documented intentional 7.3 hold was found. These declared ranges are eligibility evidence, not runtime verification. Astro as a framework is a deliberate architectural dependency of the EmDash integration and .astro templates; replacing it would be a separate CMS/frontend architecture change.

| Astro 7.4 change | Evaluation / expected disposition | Evidence before adoption |
| --- | --- | --- |
| Node minimum becomes 22.22.0 | Required upgrade prerequisite; current project advertises >=22.16. Local Node 24.21 satisfies it, but supported environments must agree | Align package engines, CI image/minor, README/setup skills and downstream build/runtime requirements; test the selected supported Node version |
| Separate build and runtime image services | High relevance to native images, SSR CMS uploads and optional Workers; assess without forcing a split where one service suffices | Test dev/build/runtime separately, fresh upload after build, storage endpoint, native-width limits, captions/editor and image URL allowlists. Check integrations that read image.service.entrypoint/config, which are absent on the split-service shape |
| Cloudflare image/prerender pipeline changes | Evaluate with the selected Cloudflare adapter, not Astro alone | Review compatible adapter/Wrangler versions; current registry candidate @astrojs/cloudflare 14.4.0 requires Astro ^7.4.0 and Wrangler ^4.125.0. Prove disposable Worker delivery and any prerendered asset behavior; do not install this profile into the Node default merely for review |
| astro build --timings | Useful diagnostic for #3/#7; adopt measurement when available | Compare build phases/images/integrations on representative fixtures. Do not confuse build timings with request-time CMS/SSR performance or introduce noisy hard timing gates |
| Font configuration warnings | Useful where Astro font providers are configured; preserve existing local-font paths | Exercise supported weights/styles/subsets and unsupported requests; record provider applicability. Track custom getFontProperties becoming required in Astro 8 |
| notFound() for composable entrypoints | Conditional on custom astro/fetch or astro/hono handler composition | Inspect actual entrypoint; test custom 404 content/status and styleguide exclusion on Node/Workers. The all-in-one handler already includes this behavior |
| Experimental parallel prerendering | Off by default; limited relevance to SSR CMS routes | Benchmark CPU-heavy prerendered pages, memory and worker counts only if such routes exist. The announcement says the Cloudflare adapter's own prerenderer ignores this flag |
| Experimental custom static redirect page | Off by default / not applicable to ordinary SSR redirects | Evaluate only for a demonstrated static/prerender redirect requirement; preserve real HTTP status/Location behavior and locale/SEO rules |

Every future meta-review must compare declared, locked, installed, newest stable and latest relevant patch versions for Astro, official integrations/adapters, EmDash, Node and affected tooling. Read the intervening changelog and major-version migration guide, identify deprecations/security/support changes, assess useful features against this starter, and record a dated decision with owner, benefit/risk, compatibility evidence, required code/docs/skill changes and revisit trigger. New stable Astro releases are review triggers; major versions require a migration spike, while prereleases and experimental features remain opt-in.

The #3 read-only upstream checker must surface Astro/adapter drift independently of EmDash updates and report unavailable evidence as unverified. Each release certification must name the Astro version actually tested. This defines the future review process; it does not create a scheduled automation or automatically upgrade dependencies.

## Phase 3: Automated Quality & Visual Safety Harness

Goal: make shared token, component and dependency changes reviewable and regression-sensitive.

1. **#5 fixture completion.** Complete the coverage manifest for primitives and stress states. Add the explicit build-time loopback fixture mode with a separate/default-off release artifact. Static specimens carry no fake CMS write identities. Include #10 LogoTicker motion/static/RTL/empty specimens and its no-script contract. This #5 slice is the next scheduled package; #7 capture automation follows it.
2. **#7 capture/bootstrap.** Pin the local Windows Playwright/browser/Node/fonts renderer. No Linux/Docker baseline is required. Start the real built Node server against a disposable seeded DB/media tree. Capture actual route slugs at 390, 768 and 1440 CSS-pixel widths plus 320px/reflow and focused interaction states. Prove content/readiness/assets before taking a screenshot.
3. **#7 failure sensitivity and local verification.** Repeat unchanged runs, calibrate pixel tolerance separately from allowed pixel count/ratio and demonstrate deliberate global and small targeted defects. Fail missing baselines/assets/routes/setup-page responses. Retain local reports/diffs/traces; baseline updates remain explicit reviewed local actions. Visual tests never run on push/PR, in production builds or deployments. Keep the design-checks workflow to one Node 22.22.0 job with fast lint/schema/unit checks and a normal build, aiming below 60 seconds. Keep a full pre-commit suite optional until its measured cost is acceptable.
4. **#6 O/P.** Implement local screenshot alignment with capture metadata, scoped keyboard handling and teardown. Add the version-aware proxy inspector only after inspecting the upgraded package. Test unknown annotations and ordinary UI text; actual editor save/reload remains separate. These tools aid human diagnosis and never become capture dependencies.
5. **#3 release certification.** Re-run appropriate existing tests/typecheck/build, capture comparison, editor tests and target-specific runtime checks. Record Node evidence separately from disposable Worker evidence. Publish a reviewed standards release/tag and migration notes.

Exit gate: repeatable local Windows captures, useful controlled failures, clean production artifact (`/_styleguide` returns 404; no active HUD), explicit supported coverage and a certified standards release. Screenshots do not substitute for keyboard/accessibility/editor checks. Chromium can be the canonical golden renderer; any Firefox/WebKit behavior coverage and omissions must be stated, not implied by desktop/mobile screenshots.

## Phase 4: Client Site Audit & Modernization Pipeline

Goal: adopt proven improvements on an authorized downstream site without forcing a redesign.

1. **#2 diagnostic engine/runbook.** Consume the Phase 3 standards release. Emit versioned JSON and Markdown with evidence, confidence, applicability and pass/fail/warning/unverified/not-applicable. Wrap current checks carefully: absent DB/offline service is unverified even if a legacy helper exits zero. Diagnosis never syncs, migrates or uploads.
2. **#2 selected remediation recipes.** Start with one deterministic code recipe and establish preconditions, repeat-run behavior, tests and rollback on a disposable copy. Design/CMS/data/provider changes require their own applicable evidence and scope. URL-based visual retrofits use #10 Stage 4.5 for affected primitives; a scoped audit does not force a full redesign. Do not auto-add Lenis, hover effects or trimming.
3. **Pilot.** Choose one authorized legacy client site; establish its brief/route/content/locale/hosting inventory and baseline. Open a small reviewable branch/PR, apply selected recipes and verify public routes, keyboard/reflow, editor saves and working integrations. Record remaining unknowns and rollback.
4. **Expand gradually.** Update the registry's audited standards version. Roll out by site/runtime/complexity, avoiding simultaneous bulk upgrades. Optional scheduled diagnostics can follow a successful manual pilot; unchanged results should not create duplicate findings or mandatory status noise.

Exit gate: current/degraded/offline fixtures report correctly; diagnosis is mutation-free; one authorized pilot has before/after evidence and a selected-recipe rollback. Database/media scopes may remain explicitly unverified until Phase 5. Do not mark a full infrastructure audit complete or accept dependent data remediation while those checks are missing.

## Phase 5: Database & Media Infrastructure

Goal: extend the standards/audit lifecycle with trustworthy D1 and R2 adapters.

| Order | Work package | Issue | Exit evidence |
| --- | --- | --- | --- |
| 1 | Local/snapshot schema normalization and physical budget report | #8 A | Generated/hidden/legacy columns, defaults/indexes/FKs/registry drift and unavailable-state fixtures |
| 2 | Explicit target resolver and read-only disposable D1 comparison | #8 A | Account/env/database receipt, no first-binding fallback, actual expanded-query and quota checks |
| 3 | Supported export-seed wrapper with schema/content allowlists | #8 B | Candidate artifact, private-field exclusion, semantic order/reference preservation and fresh seed rehearsal |
| 4 | Private remote inspection snapshot reconstruction | #8 C | Consistency/integrity receipt, unsupported SQL handling, no working-DB replacement and no automatic app/migration launch |
| 5 | Source/reference inventory, immutable-original archive and manifest | #9 inventory | Deterministic classification of crops/scaled-only/missing sources; no filename-only deletion |
| 6 | Supported importer/media mapping and optional bounded preparation | #9 local apply | API/version proof, preserved IDs/locale metadata/gallery order, safe reruns and failure journal |
| 7 | Target-aware nested-key R2 staging/upload verification | #9 remote integration | Cache bound to account/env/bucket/key/hash, collision policy, interrupted/retried upload receipt and nonzero failures |
| 8 | Worker delivery/editor verification and audit recertification | #8/#9 → #2/#3 | New upload works without rebuild; media/locale/references/editor behavior checked; downstream report updates only verified scopes |

Local schema analysis and source-media inventory can be researched earlier, but remote integration follows the validated version/target contracts. #9 must not rely on the present R2 helper unchanged: fix top-level-only traversal, target-independent mtime caching, shell-interpolated paths and missing failure exit status. Prefer supported site transfer when it already supplies required content/media movement.

Exit gate: offline/local fixtures pass without cloud credentials; explicit disposable D1/R2 integration passes with recoverable receipts; seeds/snapshots/transfers have accurate limits; partial storage/CMS failure is recoverable without deleting shared/pre-existing assets. No production synchronization or cloud provisioning occurs merely because an audit runs.

## Rollout ownership and completion

The starter maintainer owns #1/#3/#4/#10 policy and supported standards. Frontend work owns #5/#6/#7; the client maintainer owns #2 adoption; CMS/infrastructure work owns #8/#9. One person can hold several roles, but evidence and target authority remain explicit.

Close issues against their own acceptance criteria, not merely because a later phase starts. #3 spans early inventory through certification; #6 closes after G/O/P; #2 gains additional DB/media coverage after Phase 5. Keep the ten issue threads as review history and attach implementation PRs there.

The practical critical path is: accurate baseline and #1 → #3 upgrade + #5 fixture contract → #7 → certified #3 release → #2 pilot. #8 → #9 extends the infrastructure track and then recertifies #2/#3. #4 and #6 are useful adjacent capabilities, not artificial blockers for the visual harness.

See [assessment.md](assessment.md) for the cross-issue critique, evidence limits and primary sources. Original/refined/verified issue artifacts in this directory make the GitHub edits reviewable and recoverable. Phase 1 code is now implemented in the working tree; see [the implementation receipt](../phase-1/README.md) for checks, captures and remaining editor-baseline limitations. Phase 2 candidate implementation is recorded in [its receipt](../phase-2/README.md); issue #4 is complete/closed, while #3 remains open for Phase 3 certification and stable publication. Later phases remain outstanding.


## Issue #10 integration (15 October 2026)

[Issue #10](https://github.com/Vermeulen-Solutions/emdash-site-starter/issues/10) adds recorded component calibration between workflow Stages 4 and 5. It depends on #1 evidence policy and #5 real-component specimens, uses #4 interchange optionally, and supplies the neutral ticker before #7 visual baselines. It is not blocked by #9: local src/assets imagery works now; CMS ingestion remains Phase 5. Calibration supports iteration rather than locking every future component. Astro Docs MCP verifies slots/Fragment; the video could not be fetched, so supplied notes remain attributed inspiration rather than independently verified claims.


## Phase 3 package 1 implementation receipt

The #10 playbook/LogoTicker and #5 expanded deterministic fixtures/build profile are implemented; see [receipt](../phase-3/README.md). All 31 tests, typecheck, clean build and isolated HTTP profiles pass. Four browser widths, native control keyboard behavior and actual reduced-motion fallback pass. #5 remains open for zoom/text-spacing acceptance; #10 remains open for active motion/pause/seam and no-JS verification, carried into #7. No issue was closed with pending acceptance. Next scheduled package is #7 capture/bootstrap; no Linux goldens are claimed yet.


## Local-first visual verification policy — 16 October 2026

The maintainer superseded the earlier Linux/container/browser-CI proposal: Windows goldens are authoritative, screenshot checks are strictly local, and no visual job runs in GitHub Actions. The automated workflow uses only Node 22.22.0 LTS for fast linting, schema checks, unit tests and a normal build. Visual Node 24.21.0 remains a separate pinned local renderer input. Screenshot failures cannot fail a production build/deploy. This policy preserves the 2,000 minute/month account budget. See docs/visual-regression.md and audit/visual-regression-2026-10-16/ for implementation receipts.


## Phase 3 package 2 completion — 16 October 2026

#7 is implemented and verified as local-only Windows tooling under the maintainer's revised policy. Three unchanged repetitions pass (153 tests, 54 intentional skips, zero failures/flaky results), with 51 unchanged baseline hashes. Active animation/no-JS/text-spacing/actual zoom acceptance now resolves #5/#10. Capture review found and fixed real gallery-caption clipping and RTL animation direction bugs, with containment/viewport coverage assertions. No pixel-count allowance was relaxed. Fast single-Node-22.22.0 command rehearsal passed in 14.701s, excluding setup/install/network; visual checks are absent from Actions/build/deployments. See [dated receipts](../visual-regression-2026-10-16/README.md). All work remains uncommitted.

Next scheduled package: #6 screenshot overlay and version-aware proxy inspector. #3 stable standards publication/full CMS-editor and Worker certification remain pending; no release/tag/deployment is authorized or implied by local visual completion.

GitHub reconciliation: #5, #7 and #10 were updated, read back and closed as completed; [state receipt](../visual-regression-2026-10-16/issue-completion.json). #3 remains open for certification/publication.

## Phase 3 package 3 completion — 16 October 2026

The preceding roadmap milestone is now committed locally as `6c1c412` (`Complete Phase 3 fixtures and local visual verification`), including its reviewed runtime/tooling prerequisites. Unrelated editorial skill work was excluded and preserved. The new #6 package remains uncommitted for review.

#6 G/O/P is implemented. O supports bounded local raster files, revocable in-memory URLs, explicit DPR/scale, CSS-pixel offsets, document/fixed positioning and mismatch diagnostics. P decodes the actual EmDash 1.3.0 annotation format, distinguishes field ownership from entry context and unknown UI text, and makes no editing/saveability claim. T/B/export/reset, shortcut exclusions, navigation cleanup and production exclusion remain verified. See [dated receipts](../dev-hud-2026-10-16/README.md) and [the developer runbook](../../docs/dev-hud.md).

Local verification: 15 HUD browser cases passed at 390/768/1440, including 320px resize; 35 unit tests passed; typecheck and normal build passed; 51 visual tests passed with 18 intentional suite-mode skips and unchanged goldens. Node 22.22.0 fast CI commands passed in 20.152 seconds, excluding setup/install/network. Browser checks remain local-only and independent of production/deployment.

Next scheduled package: **#3 final certification**, following [the certification sequence](../../docs/phase-3-certification.md). Review/commit the HUD, refresh dated upstream adopt/defer decisions, rehearse clean checkout and the remaining editor/content matrix, then publish a reviewed immutable standards reference and prove #2 can select it. The candidate remains unreleased; Workers/D1/R2 and real providers retain explicit pending scopes. This completion does not publish, push, deploy or certify those scopes.

## Phase 3 certification — 16 October 2026

The maintainer requested execution of #3's certification sequence. The HUD milestone is committed as `ac92dac`. Fresh-install evidence raised the compatibility floor from Node 22.22.0 to **22.22.2**, with **Node 24 LTS recommended** and **one CI pin at 22.23.3**, explicitly selected by the maintainer. Commits `6424ab5` and `31c72ec` record policy alignment and two repaired clean-checkout probes. No browser CI was added.

Scoped standards **0.1.1** covers Node/SQLite/local media and the pinned Windows Chromium profile. Clean install/unit/schema/typecheck/build/HTTP, real CMS save/reload/publish, native media after build, 51 unchanged visual baselines, 15 HUD tests and 10 failure-sensitivity tests pass. A fresh DB measures 17/19 physical collection columns. Exact evidence, source/dependency equivalence, adopt/defer decisions, reused historical upgrade/restore limits and the observed gallery outer-key regeneration are in [the certification receipt](../certification-2026-10-16/README.md). Publication and downstream immutable selection are read back into separate JSON receipts; #3 closes only after those readbacks succeed.

**Phase 3 exit:** consume `standards-v0.1.1` by resolved commit/manifest digest, with [versioned scope/upgrade/recovery notes](../../standards/releases/0.1.1.md). The immutable 0.1.0 reference is retained: its branch CI passed, but tag creation exposed a duplicate tag-push/empty-base gate failure. The 0.1.1 workflow patch selects branch pushes explicitly; all runtime/browser evidence remains applicable. Worker/D1/R2 parity, live forms providers and optional multilingual/cache/admin/plugin scopes remain unverified or inapplicable to the default starter. This is a scoped private standards release; no visibility change, public launch, client rollout or production deployment follows.

**Next scheduled implementation:** Phase 4 / **#2 Client Site Audit & Diagnostic Engine**. Start with read-only diagnosis against the immutable manifest, explicit evidence/confidence/applicability and offline/unknown fixtures; add one reversible remediation recipe before an authorized client pilot. Missing DB/cloud measurements cannot become passes. Phase 5 (#8/#9) later extends the target-specific baseline.

**Adjacent readiness track:** **#11 Open-Source Packaging & Community Release** can start from this certified Node baseline. Audit secrets/history and generic seeds/registry, select/check licensing and provenance, prepare accurate README/showcase/contribution/conduct docs, then review visibility/public-release/outreach actions separately. Current claims of completed D1 parity or universal dual-runtime certification must be corrected before launch. The private standards tag is distinct from #11's community release. No community messages are sent by this handoff.

Final reconciliation: #3 is closed as completed after immutable **0.1.1** publication, exact commit/manifest-digest selection and GitHub/Linux branch CI success (50 seconds including setup/install). #6's committed status is reconciled. See [publication/issue readbacks](../certification-2026-10-16/completion.json). No duplicate tag job was observed for 0.1.1; the earlier immutable 0.1.0 tag failure remains recorded, not overwritten. Phase 3 is complete within the stated scope.


## Sanitized Baseline packaging and Phase 4 entry — 16 October 2026

Privacy sanitization removes requested client identifiers, client paths and deployment metadata from current source/evidence; edited historical receipts are redacted copies. Existing private history contains identifier-bearing blobs, so the maintainer authorized a new repository with a fresh root snapshot: https://github.com/Vermeulen-Solutions/emdash-baseline. Old refs, tags, releases, runtime data and unreviewed dirty mirror/skill work are excluded. The old repository stays private.

#11 closes for packaging only after the reviewed root snapshot is committed: MIT license, accurate README/showcase/quickstart, CONTRIBUTING, Contributor Covenant and third-party notices. Visibility/community distribution moves to https://github.com/Vermeulen-Solutions/emdash-baseline/issues/1. Worker/D1/R2 parity remains Phase 5 and is never advertised as completed. The maintained skill source now points at Baseline.

#1 completes its missing rendered-reference evidence with the neutral isolated workflow replay under audit/visual-concepts/reference-workflow/: flat reference and source-site refinement, semantic address break, valid bounded 1fr, multicolor mark and full localized long copy, six clean-reload Astro captures at 390/768/1440. These are constructed examples; CMS save/reload is separate scoped Phase 3 evidence.

#2 now starts with audit:site, an offline diagnostic scaffold consuming the digest-pinned standalone standards 0.1.1 manifest. Six focused tests cover current/degraded/missing evidence, no mutation/leaks, strict exits and explicit offline snapshot column limits. Complete capability/skill-membership adapters, reversible twice-safe recipe and an authorized downstream pilot remain scheduled. No client site has been modified. See docs/site-standards-audit.md and audit/phase-4-2026-10-16/.


## Phase 4 coverage and first reversible recipe — 16 October 2026

README milestone f132745 is committed separately. The current work package implements AST-based supported capabilities, complete managed skill membership/hash inventory comparison, physical schema metadata and report schema v2 validation. The self-audit preserves unknown DB/legacy receipt states; fixture passes are not full site certification.

The first recipe, schema-budget-prebuild@1, supports the pinned source profile and exact schema helpers. It plans read-only, binds a clean feature-branch revision and bytes, preserves one simple prebuild hook, and supports explicit twice-safe apply/rollback through private outside-target artifacts. Disposable tests prove actual npm lifecycle gating with a synthetic build executable; no client scripts run as a diagnostic side effect.

See docs/site-standards-audit.md and audit/phase-4-2026-10-16/coverage-and-recipe.md for receipts and limits. Phase 4 changes remain uncommitted for review. #2 stays open: implement route/editor evidence ingestion and select an authorized pilot before rollout. No workflow/browser-CI, src/public, visual-golden, client or remote data change was made.

## Phase 4 completion and Phase 5 handoff — 16 October 2026

Milestone 1 is committed as `4b955e2`. Route/state/locale/viewport captures and supported editor save/reload/public-read receipts now enter validated v2 reports through `--evidence`. Hashes bind the checkout, revision, actual source bytes and bounded external artifacts; missing, stale or partial evidence cannot pass. Marker counts remain observations, not save verification.

The maintainer authorized an older-site or fixture-repository pilot. The completed synthetic older-workflow clone stays on `codex/phase4-pilot`, retains the supported 7.4.0/1.3.0 framework profile and demonstrates the missing schema prebuild guard. Both strict diagnoses pass within implemented scope; apply twice preserves the existing hook, measured 17/19-column schema and real Astro builds pass, and all 12 route/editor captures remain identical. Real inline title save/publish/reload/anonymous-read/restoration passes before and after. Rollback twice restores exact package bytes and source inventory on a clean branch. No real client or production certification is implied.

Completion receipts: `audit/phase-4-2026-10-16/pilot-and-evidence.md`, `completion-verification.json` and `pilot-finalized/`. Final verification has 60 passing unit tests, syntax/typecheck/build/release isolation success. README and the documentation pass through `71b79ab` are preserved; only the allowed audit runbook changes. #2 can close for this bounded pipeline and authorized fixture scope.

Next scheduled: Phase 5 / #8 read-only SQLite/D1 schema/registry parity, safe seed export and isolated snapshots, followed by #9 provenance-based media ingestion and named-target R2 staging. Local fixtures/inventory can start now. Worker/D1/R2, providers, real site acceptance and public launch retain their explicit gates; no browser CI or automatic migration is introduced.
