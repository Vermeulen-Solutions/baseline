# Automatic spacing implementation progress

Started: 2026-10-20. Starting revision: `c3d965c`. Scope: [consolidated plan](automatic-spacing-followup-plan.md). The user authorized implementation and a commit between phases; no push or deployment is authorized by that instruction.

## Phase register

| Phase | Work | State | Evidence / next step |
| --- | --- | --- | --- |
| 1 | W01 contracts, caller inventory, baseline | Verified | [Caller inventory](automatic-spacing-callers.md); 251 tests; 46 Astro files, zero diagnostics |
| 2 | W02 media/cascade and W03 parsed-check foundation | Verified foundation | 126 fast tests; parsed CSS/selector mutations; real uploaded ID-only media in dev and built Chromium at 390px; broader matrix remains Phase 6 |
| 3 | W06 contextual aliases and token CLI | Verified | Commit `30233e7`; 129 fast tests; T01-T06 maintained cases |
| 4 | W04 scoped structural defaults | Verified foundation | V02-V05 actual primitives at 390px; full width/content matrix follows in Phase 6 |
| 5 | W05/W07 editorial boundaries, routes; W09 editing preparation | Verified foundation | 5 built Chromium spacing tests at 390px; public routes and both real RichText renderers |
| 6 | W08 complete maintained behavioral/mutation cases | Verified bounded browser/parser scope | 13 built tests passed, 3 deliberate viewport exclusions; four actual empty routes; M01-M10/T01-T06 maintained groups |
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

Phase evidence below records implemented corrections. Final closure still requires the broader V/M matrix, visual acceptance, independent profile verification and explicit E01 status. Historical review probes are described in the plan; they are not new verification receipts.

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

## Phase 3 evidence

- Phase 2 commit: `3848991`.
- Four root aliases preserve the incumbent neutral scales; their structural consumption follows in Phase 4. The context report names starter relationships and does not claim a complete downstream inventory.
- T01-T06: three maintained test groups exercise typo/wrong scope/duplicates/no-op, narrow context writes, missing/cyclic references, zero/negative/unsupported/proportional values, read-only previews, invalid companion-file requests and saved calibration hash identity.
- Existing token/workflow suite: 23 passed. The CLI diagnostic suite also checks that failed audits retain machine-readable JSON. Fast verification is required by the phase commit hook.
- Candidate token, font and applicable CMS proxy validation precedes all writes. Supported expressions are deliberately bounded; unknown CSS evaluation is an error, not a green certification. Parser-based edits preserve unrelated source and comments.

## Phase 4 evidence

- `npm.cmd run verify:fast`: PASS, 129 tests. `npm.cmd run typecheck`: PASS, 47 files, zero diagnostics. Native presentation build: 3 tests passed.
- `npm.cmd exec playwright test tests/visual/spacing.spec.mjs -- --project=chromium-390`: PASS, 3 tests. V02-V05 measure the actual Section/Container/Grid implementations, all nine nested Section modes, intentionally inherited aliases, local zero controls, gap prop over string/object style, utility over gap prop, retained IDs/ARIA/classes/style, custom mode and breakout grid.
- Legacy structural rules are explicitly scoped away from activated roots. SiteShell defaults to legacy; site-owned Base activation is Phase 5. No Section child allowlist or shell inference is used by the new policy. Cluster and Sidebar keep their own contracts.
- Shared style helper and dependencies are explicitly inventoried; exact starter infrastructure exceptions were refreshed, without creating a client Art Direction Record.

## Phase 5 evidence

- Phase 4 commit: `90b88b9`.
- `npm.cmd run verify:fast`: PASS, 129 tests. Astro check during this phase: 47 files, zero diagnostics. Built Chromium spacing suite at 390px: 5 passed (`.emdash/visual/spacing-phase5-browser.log`).
- V07/V12 inspect home/posts/category/tag and the actual welcome article. Collection lists retain explicit native list semantics after removing visual markers; titles/items share one edge and date/body bounds are separated by layout gaps.
- V08-V13 import both production RichText implementations. They verify nested lists, each of six distinct public prose controls, first visible/only media edges, independent nested flow calculations, composite image/list isolation, wrapperless and attributed opt-outs, and empty CMS/native slots within a real Container.
- Editorial defaults use one-sided sibling margins and a private value reset at each direct-child boundary. Native CSS scope bounds recursive list presentation at explicit editorial islands/nested editorial roots; utility layers still take precedence. Media defaults reset in base so they cannot defeat the parent flow relationship. Controls use retrying computed-style assertions to measure their applied result after rendering.
- The empty native slot check caught an undefined slot result; it now normalizes to an empty string. EditorialImage uses owned class names so an emitted vendor image selector cannot target its frame. Gallery ID fallbacks use the same owned image presentation.
- Current site Bases explicitly activate v2; shared SiteShell remains compatibility-default. Static caller overlays, public CMS routes and specimen policy are migrated. E01 remains pending actual save/reload proof in the disposable harness; attributes are not counted as that proof.

## Phase 6 evidence

- Phase 5 commit: `4cdb05f`.
- Built spacing suite (`chromium-390` + `chromium-1440`): 13 passed / 3 intentionally inapplicable project cases. Narrow image/track cases explicitly iterate 320/390/1280. Public listing/article use actual extension-controlled 200%/400% browser zoom, checked via zoom API, CSS viewport and DPR. Public 320px text-spacing reflow also passes. See `.emdash/visual/spacing-phase6-browser.log` and attached geometry/resource JSON.
- The public zoom case re-enters focused content using native Shift+Tab/Tab after each zoom; refocusing an already focused element alone does not request a new browser scroll. Floating-point zoom/DPR comparisons use eight-place tolerance, not relaxed layout bounds.
- `node tests/visual/empty-listings.mjs`: PASS, four actual empty public routes in an independently seeded temporary DB. No empty list wrapper or horizontal overflow. Receipt: `.emdash/visual/empty-listings/receipt.json`.
- V15 exposed a second gutter owner: the named breakout grid retained its own gutter inside the already padded shell. New-policy contextual defaults now pay the shell gutter once, with reading/feature/wide/full-safe tracks retained. Lazy responsive images use `sizes=auto` plus a fallback; actual selected renditions are checked against rendered bounds/native limits. Eager placement hints remain caller-owned.
- M01-M10 cover exact source positions, strings/comments, invalid/anonymous layers, new files/overlays/imports, malformed CSS, missing imports, fake/negated/target-only flow classes, partial guards, duplicated layered definitions and both supported flow strategies. Unrecognized strategies remain unverified. T02 also has a shared expansion budget, preventing exponential dependency expansion from defeating the depth bound.
- Fast verification: 129 tests passed. The final visual suite adds the intermediate viewport and existing gallery/no-JS/focus/RTL behavior. Live editor and independent generated profile delivery remain separately tracked.
