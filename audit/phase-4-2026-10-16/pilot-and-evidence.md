# Phase 4 completion — 16 October 2026

Milestone 1 is committed as `4b955e2f3ff9fa52f04980225c2ea17191894977`: capability/schema/managed-skill diagnostics, validated report v2 and the revision-bound `schema-budget-prebuild@1` recipe. The preserved 54-test suite passed before that commit. Earlier receipts describe their historical working-tree status.

This milestone adds `--evidence` ingestion and a repeatable local Windows pilot. Route observations and supported editor round trips are separate findings. Revision, exact source inventory, checkout identity, timestamp and artifact hashes bind the supplied evidence. Missing/partial/stale/tampered/linked evidence stays unverified; markers and API-only writes cannot verify editor saving. Reports preserve route/state/locale/viewport and tested field scope. Supplied attestations are bounded evidence, not independent certification or accessibility conformance.

## Disposable pilot

The maintainer explicitly authorized an older-site **or fixture-repository** rehearsal. This run uses a synthetic older-workflow fixture on `codex/phase4-pilot`, cloned from a local fixture commit. It retains Astro 7.4.0 / EmDash 1.3.0 and starts with an existing prebuild hook but no schema guard. It is not an upgrade recipe for arbitrary older framework versions and does not certify any real client site.

The complete run is in [pilot-finalized/verification.json](pilot-finalized/verification.json), with the reviewed [plan](pilot-finalized/reviewed-plan.json), [before report](pilot-finalized/before-report/report.json), [before Markdown](pilot-finalized/before-report/report.md), [after report](pilot-finalized/after-report/report.json) and [after Markdown](pilot-finalized/after-report/report.md). `sourceCommit` in the runner receipt is the fixture's Baseline base; final tooling hashes and documentation preservation facts are in [completion-verification.json](completion-verification.json).

| Check | Verified result |
| --- | --- |
| Renderer | Windows, Node 24.21.0, Playwright 1.64.1, Chromium revision 1248 / 156.0.8078.4 |
| Runtime | Fresh synthetic SQLite seed; normal built Node server; development setup used only to seed/authenticate |
| Captures | Public `/`, `/about`, `/posts/welcome`; editor `/about`; each at 390×844, 768×1024, 1440×900 |
| Readiness | Fonts/images plus actual seeded article body, including editor rich-text hydration |
| Editor | Actual inline `title` edit, successful save/publish, editor reload, anonymous read, original value restored; repeated before/after remediation |
| Read-only diagnosis | Both strict runs exit 0; source inventory, offline snapshot and fixture DB/sidecar bytes unchanged during diagnosis |
| Physical schema | Actual collection widths 17 and 19; new consistent snapshots acquired with `node:sqlite.backup`, not a live-file copy |
| Before findings | 19 pass, 1 warning (missing guard), 4 unverified recommendations, 2 inapplicable |
| After findings | 20 pass, 0 warning/failure, same 4 unverified recommendations and 2 inapplicable |
| Apply | Plan inspected; apply twice changes only package.json, preserves the existing prebuild hook |
| Preflight/build | Measured schema check passes; real normal Astro build passes before and after; existing hook runs after preflight |
| Visual preservation | All 12 before/after viewport PNGs are byte-identical; no golden updates |
| Rollback | Twice-safe; exact original package SHA-256 `41f9b24f174dcdcc01f80158cf89a6b6bfbe283ba19119551de812cc0ff2e5fb`, source inventory restored, feature branch clean |
| Cleanup | Owned servers stopped, dependency junction removed, disposable Git trees and private DB removed |

The four unverified recommendations are upstream currency, visual/accessibility conformance, form-provider delivery and Cloudflare D1/R2. Matching fixture skill inventories establishes only equality to a declared local snapshot. Native rich text was checked for readiness/preservation, but this pilot's save acceptance covers the title field, not rich-text/media editing, every role/locale or external integrations. Code rollback restores package/source bytes; editorial restore verifies the original value and does not promise byte-identical CMS revision history.

During rehearsal development the checks exposed bootstrap readiness, SQLite sidecars and Windows generated-type line endings. Those guards were retained; consistent backup acquisition and settled fixture types resolved them. Screenshot review also exposed premature editor captures; explicit body readiness now prevents blank hydrated content from passing. Superseded attempts and failed server logs are retained only in ignored local storage.

## Verification and preservation

- Final `node --test tests/*.test.mjs`: **60 passed**, zero failures/skips.
- `npm run lint`: 62 JavaScript modules pass.
- `npm run typecheck`: 41 Astro files, zero errors/warnings/hints.
- Normal `npm run build` and release-artifact guard pass. Existing admin bundle-size advisory remains; no new production component code changed.
- `npm run check:dev-tools`: dev/fixture specimens, release rejection and clean production GET/HEAD/HUD isolation pass.
- Art-direction gate: no visual source changes. No visual baseline, browser CI or production build/deployment dependency changed.
- Against documentation commit `71b79ab`, README and every other docs file retain their Git blob identities. Only `docs/site-standards-audit.md` changes for CLI/evidence/pilot usage. No mirrored skill content changed.

Phase 4 is complete for this bounded offline diagnostic/recipe pipeline and the authorized fixture rehearsal. The repository remains private. No production resources, client repositories, real content, remote databases or media buckets were modified.

## Phase 5 handoff

Begin #8 with read-only SQLite schema normalization, version/registry/physical parity and explicit D1 target/snapshot identity; retain unknown/offline handling and no apply-DDL behavior. Prove supported seed export/round-trip separately from full site transfer. Disposable D1 integration requires an explicitly selected test account/database.

Then #9 can build content-addressed media inventory/provenance fixtures and supported EmDash upload/reference mapping. Replace or harden the existing organize/R2 helpers before orchestration: no direct CMS table hydration, filename-only crop deletion, shell-interpolated upload paths or filename/mtime-only remote caches. R2 upload/verification remains a separate named-target action. Local inventory work can start before remote credentials; Worker/D1/R2 certification stays open until those integrations are exercised.

Per-client pilots still need the client's brief, revision, content/locales, explicit permissions, evidence matrix and provider/editor acceptance. The synthetic pilot is the reusable rehearsal, not a substitute for those site-specific decisions.

API references checked: [EmDash save/publish lifecycle](https://docs.emdashcms.com/guides/working-with-content/), installed EmDash 1.3.0 inline toolbar implementation, and [Node SQLite backup](https://nodejs.org/download/release/latest-jod/docs/api/sqlite.html#sqlitebackupsourceDb-destination-options).
