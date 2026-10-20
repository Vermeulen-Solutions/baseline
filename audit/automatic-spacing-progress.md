# Automatic spacing implementation progress

Started: 2026-10-20. Starting revision: `c3d965c`. Scope: [consolidated plan](automatic-spacing-followup-plan.md). The user authorized implementation and a commit between phases; no push or deployment is authorized by that instruction.

## Phase register

| Phase | Work | State | Evidence / next step |
| --- | --- | --- | --- |
| 1 | W01 contracts, caller inventory, baseline | Verified | [Caller inventory](automatic-spacing-callers.md); 251 tests; 46 Astro files, zero diagnostics |
| 2 | W02 media/cascade and W03 parsed-check foundation | Verified foundation | 126 fast tests; parsed CSS/selector mutations; real uploaded ID-only media in dev and built Chromium at 390px; broader matrix remains Phase 6 |
| 3 | W06 contextual aliases and token CLI | Planned | Known-name targeting, candidate validation, bounded resolver |
| 4 | W04 scoped structural defaults | Planned | Activation and attribute/style API contract below |
| 5 | W05/W07 editorial boundaries, routes; W09 editing preparation | Planned | Keep collection lists distinct from editorial lists |
| 6 | W08 complete maintained behavioral/mutation cases | Planned | Complete V/M/T matrix; retain local-only browser policy |
| 7 | W10 visual review/calibration | Planned | Review intentional screenshot changes before accepting |
| 8 | W09/W11/W12 profiles, editing, upgrades and handoff | Planned | Independent installs, custom-token upgrade pilot, final verification |

## Frozen implementation contract

- CSS is authoritative. `--layout-section-padding`, `--layout-container-gap`, `--layout-content-gap`, `--layout-grid-gap` are regular root aliases of existing scales.
- SiteShell accepts `spacingPolicy="legacy|automatic-v2"`, default legacy; only client-owned Base explicitly enables v2. New profile Bases enable it. Specimens explicitly enable it independently.
- Section keeps labelledBy/spacing and gains gap plus layout stack/custom. Container keeps width/breakout and gains gap plus layout stack/custom. Grid keeps minimum/gap and gains ordinary div attribute passthrough.
- Component enum/optional gap inputs normalize safely. Breakout remains named-grid mode and takes precedence over ordinary layout. Custom mode does not establish an automatic layout/gap.
- Gap props override the same local variable in passed string/object style; actual gap utilities win through utilities. Unrelated classes, style, IDs and ARIA persist.
- New policy resets local primitive defaults at each boundary; intentionally scoped root-context aliases inherit. No implicit inheritance of a parent's none/compact mode.
- Ordinary composition uses layout gaps. Generic flow spaces direct siblings; explicit editorial boundaries own list/media presentation and do not style composite internals.
- RichText opt-out does not silently retain automatic editorial behavior. Empty public content and editor placeholders are separate cases.
- Current public routes migrate without changing their content model, metadata ownership, links or localization assumptions.

## Closure register

All A01-A07 / F01-F16 findings remain open. V01-V15, M01-M10, T01-T06 and E01 are pending maintained implementation evidence. Historical review probes are described in the plan; they are not new verification receipts.

## Phase 1 observations

- `npm.cmd run doctor`: pass with Windows launcher advisory and expected untracked-plan warning.
- `npm.cmd run setup:hooks`: installed the native local pre-commit hook. It runs doctor and verify:fast; it does not replace the final verification gates.
- Inventory: 16 source files have matched structural/editorial callers; affected shell/composite roots are recorded separately. No external client checkout was accessed or changed.
- Baseline `npm.cmd run verify`: PASS, 251 tests; 46 Astro files, zero errors/warnings/hints. Output: ignored `.emdash/visual/spacing-baseline-verify.log`.

## Evidence policy

Record phase commit IDs, exact commands, results and applicability here. Keep large synthetic local logs/screenshots under ignored `.emdash/visual/`; retain concise reviewable results and approved goldens. Do not claim editor-save verification from attributes/API writes or cross-browser conformance from Chromium.

## Phase 2 evidence

- Phase 1 commit: `6eb12c2`.
- `npm.cmd run verify:fast`: PASS, 126 tests; `npm.cmd run typecheck`: PASS, 46 files with zero diagnostics. Presentation dependency-boundary smoke: 3 passed.
- `npm.cmd exec playwright test tests/visual/spacing.spec.mjs -- --project=chromium-390`: PASS, 2 tests against fresh built fixtures. Dev bootstrap separately loaded the same actual uploaded 400×300 ID-only media, with no nested vendor figure. Logs: `.emdash/visual/spacing-phase2-*`, `media-dev.json`, `cleanup.json`.
- Native image rendering resolves local IDs through the supported MediaRepository/getDb APIs. Anonymous requests cannot use a provider requiring an editor context. Missing media retains a placeholder; ID-based resolution disables route caching when enabled because the installed media API exposes no cache hint.
- Vendor styles are bounded at the PhotoSwipe import; the document establishes the shared order before component styles. Gallery probes exercise emitted DOM utility precedence, not a new public class prop.
- CSS and Astro parsing cover standalone files, static overlays and local imports, strings/comments, malformed/anonymous/wrong layers and real flow selectors. The full M/V matrix and visual review remain later work.
