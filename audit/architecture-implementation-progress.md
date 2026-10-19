# Architecture hardening progress

Plan: [phased implementation](architecture-implementation-plan-2026-10-19.md). Contracts: [metadata ownership and acceptance](architecture-implementation-contracts.md).

| Phase | Status | Evidence |
| --- | --- | --- |
| 0 — contracts and starting evidence | Complete | Ownership/applicability/upgrade matrix saved; initial verify passed; [before HTML/JS capture](verification/metadata-phase-1-before.json) |
| 1 — CMS metadata | Complete | Eight focused policy/pipeline tests; [nine-case built-site rehearsal](verification/metadata-phase-1-after.json); [verification and reproduction](../docs/verification/metadata-phase-1.md) |
| 2 — static metadata | Complete | [Rendered profiles](verification/metadata-phase-2-profiles.json), [three build variants](verification/metadata-phase-2-variants.json), [final checks/hashes](verification/metadata-phase-2-checks.json) |
| 3 — interaction journeys | Automated slice complete; manual AT pending | [Checks/hashes](verification/interactions-phase-3-checks.json), [scope/reproduction and manual AT limits](../docs/verification/interactions-phase-3.md) |
| 4 — template lint | Complete | [Toolchain, mutation probes and independent profiles](verification/template-lint-phase-4-checks.json); [scope/adoption](../docs/verification/template-lint-phase-4.md) |
| 5 — native composition | Planned | No visual-system changes in this slice |
| 6 — token diagnostics | Planned | Existing calibrated tokens retained |
| 7 — conditional capabilities | Deferred pending requirements | No new modal/navigation/OG runtime |
| 8 — release/adoption | Planned | Phases 1–4 record scoped adoption; final release/manual observations remain pending |

Initial `npm run verify` passed before application edits (177 tests; Astro: 40 files, zero errors/warnings/hints).

## Implemented slice

CMS Base now delegates metadata to EmDashHead; the shared shell preserves its default static behavior. Posts carry article dates/byline, public canonicals use configured origins, and 404 responses have an explicit noindex/no-canonical policy. The existing query cache hints are retained and content routes now register settings hints. No CSS, package dependency, content schema or working database was changed.

The disposable built-site rehearsal passed nine route/mode cases, including a supported API SEO write and a real fixture plugin's metadata override. Before/after home and Post each requested the identical single JS asset (6,078 decoded/body-transfer bytes). Both independently generated static profiles passed installation, clean installation, verify/build, fixture/release separation and HTTP checks. Browser/AT conformance, provider cache invalidation and credentialed Sveltia publishing are outside this slice.

Phase 1's `npm run verify` passed 185 tests and checked 41 Astro files with zero errors, warnings or hints. Root build and both generated-profile checks passed. Full command results and source hashes are recorded in [the check receipt](verification/metadata-phase-1-checks.json). Exact infrastructure exception hashes changed only for the functional starter files listed there. Local debug logs remain ignored; synthetic reviewed receipts are stored under `audit/verification/`.

## Phase 2 implementation

Both generated static profiles now use a pure resolved metadata model and a
`StaticMetadata` head renderer. One routing configuration feeds Astro and public
URL generation. Posts use the existing publication date and native hero metadata;
the Markdown schema and Sveltia form remain unchanged. Missing facts stay omitted.
The 404 opts out of canonical/schema and emits noindex. JSON-LD escapes HTML script
delimiters, with an adversarial parser round-trip test. The ten tests are portable
to generated projects; `parse5` is explicitly development-only in both inventories.

The shared shell keeps its backward-compatible default. Static Base selects
platform ownership, so metadata is emitted once. No CSS/tokens, public interaction
runtime or CMS dependencies were added. OpenGraph locale requires a real territory;
language-only configuration does not fabricate one. The dev HTTP pilot requests
the configured trailing-slash form of the styleguide; release checks retain both.

[Adoption/reproduction](../docs/verification/metadata-phase-2.md) separates the added
files, dependency and client-owned wrapper from bounded shared sync. Additional
[local variant builds](verification/metadata-phase-2-variants.json) verify a
deployment base, file output and absent public URL, with actual asset/link checks.
Those reuse an independently installed static dependency tree and are not hosting
provider certification.

Final root `npm run verify` passed 195/195 tests and checked 41 Astro files with
zero errors, warnings or hints. Root build passed. Independently generated static
and Sveltia projects passed install/clean-install, verify (12 and 13 tests), typecheck
(30 Astro files each), normal/fixture builds, release isolation and HTTP acceptance.
Current model/serializer/renderer/routing/test bytes were compared with both generated
projects and matched exactly. An existing timeout-sensitive migration test failed
during one overlapping run, then passed its isolated 17-test file and the final
quiet full verify; no migration code/assertion was changed. See the
[final receipt](verification/metadata-phase-2-checks.json) for scope and temporary
artifact retention after optional cleanup was blocked by automatic approval review.

## Phase 3 implementation

Checkpoint history: `2d7e88b` commits the evaluation/plan and `cca6a10` commits
the jointly verified Phases 0–2 implementation. Both are local commits.

The existing CMS functional suite and static pilot now share bounded skip-link,
field-error, motion and text-spacing journeys. CMS adds a synthetic developer-only
POST recovery fixture, optional native summary autofocus, repeated-failure/correction
checks, and JS-disabled/session-unavailable variants. Normal artifacts omit its
marker and return 404 for the reserved route. Helper tests retain expiration,
allowlisting, total/field bounds and secret-key exclusions. Static profiles omit
the CMS fixture and gain no server/session handler or new dependency.

The browser tests exposed an error nested inside a label; its description now
sits outside the label while retaining the same specimen spacing. Existing goldens
remain unchanged. Focus checks respect the existing Card focus-parent ring. Public
static verification has its own local-only `--public-browser` mode, separate from
the existing remote Sveltia admin smoke check. Browser flags are rejected in CI.

Manual screen-reader announcements and human keyboard usability review remain
untested. Phase 3's automated scope is distinct from those release observations;
it does not claim WCAG conformance or credentialed Sveltia publishing. See the
[interaction guide](../docs/verification/interactions-phase-3.md) for adoption,
reproduction, controlled session-unavailable scope and the evidence inventory.

Final `npm run verify` passed 197/197 tests and checked 42 Astro files with zero
errors, warnings or hints; root build passed. The final Windows functional run
passed 26 tests, with four intentional placement skips and unchanged goldens.
[Static](verification/interactions-phase-3-static.json) and
[Sveltia](verification/interactions-phase-3-sveltia.json) receipts record public
keyboard/no-JS/motion/text-spacing acceptance from independent installations.
The static artifact was rechecked after a harness-only locator correction;
the Sveltia runner passed its full install/ci/verify/build/fixtures/browser sequence.
The owned CMS server/dependency junction/temp tree were cleaned successfully;
static projects were deliberately retained with `--keep` for review.

## Phase 4 implementation

Phase 3 was committed locally as `ec015ab`. Template accessibility lint now runs
inside existing `verify`, alongside the retained script syntax checker. The root
targets both source foundations; generated sites lint only their own `src`.
Explicit inventories ship the portable ESLint configuration, ten regression tests
and four pinned development dependencies without introducing CMS packages into
static profiles. Only the known `ResponsiveImage` output receives an image mapping.
Existing spread-owned image alternatives are now forwarded explicitly.

Five narrowly explained line exceptions retain optional form-summary autofocus and
Safari list semantics. Unused directives fail, and regression tests prove the
exceptions are bounded. Actual temporary missing-alt templates failed the CLI in
both root source targets; both were removed and clean lint passed. Source analysis
does not catch a bare unlabeled input by itself, validate rendered references or
replace Phase 3's browser journeys and pending manual AT observations.

The maintained Astro plugin requires Node `^22.22.3 || ^24.16.0 || >=26.3.0`.
Package engines, generated requirements and current CI use that floor (CI 24.16.0).
Historical scoped certification and runtime dependency versions are unchanged.
Lint over all 34 Astro source templates and the ten tests passed on all three
minimum Node versions; those probes do not claim a new full runtime certification.
The lockfile adds 88 packages and deduplicates three same-version semver entries,
with no existing package-version changes or new browser code.

Root verify passed 207/207 tests with zero diagnostics across 42 Astro files;
the production build and release assertion passed. Independent static and Sveltia
projects passed install/clean-install, verify (22/23 tests), 30-file Astro checks,
normal/fixture builds and HTTP acceptance with no database packages. Their lint
configuration, tests and changed shared component hashes match current source.
No browsers or screenshot goldens were used in this lint-only slice. Generated
projects remain deliberately retained with `--keep`. The adoption guide separates
new generation from the additive tooling upgrade required by existing sites.

## Next slice

Phase 5: add bounded native composition under component quarantine, with shared
specimens and profile acceptance. Manual AT observations remain a release
follow-up alongside the later planned phases.
