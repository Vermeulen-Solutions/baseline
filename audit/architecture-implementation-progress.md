# Architecture hardening progress

Plan: [phased implementation](architecture-implementation-plan-2026-10-19.md). Contracts: [metadata ownership and acceptance](architecture-implementation-contracts.md).

| Phase | Status | Evidence |
| --- | --- | --- |
| 0 — contracts and starting evidence | Complete | Ownership/applicability/upgrade matrix saved; initial verify passed; [before HTML/JS capture](verification/metadata-phase-1-before.json) |
| 1 — CMS metadata | Complete | Eight focused policy/pipeline tests; [nine-case built-site rehearsal](verification/metadata-phase-1-after.json); [verification and reproduction](../docs/verification/metadata-phase-1.md) |
| 2 — static metadata | Complete | [Rendered profiles](verification/metadata-phase-2-profiles.json), [three build variants](verification/metadata-phase-2-variants.json), [final checks/hashes](verification/metadata-phase-2-checks.json) |
| 3 — interaction journeys | Planned | Existing CMS and static harnesses retained |
| 4 — template lint | Planned | No dependency changes in this slice |
| 5 — native composition | Planned | No visual-system changes in this slice |
| 6 — token diagnostics | Planned | Existing calibrated tokens retained |
| 7 — conditional capabilities | Deferred pending requirements | No new modal/navigation/OG runtime |
| 8 — release/adoption | Planned | Phase 1 records its scoped upgrade boundary |

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

## Next slice

Phase 3: establish foundational keyboard, focus and form-recovery journeys using
the existing local harnesses and profile applicability contracts. Keep shared
native interactions separate from CMS-only submission/session recovery and
credentialed Sveltia publishing. Later phases remain planned work; no new modal,
drawer, OG image generator or public framework runtime is part of Phase 2.
