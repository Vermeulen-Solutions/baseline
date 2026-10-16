# TweaksBar visual inspection modes with accurate ownership diagnostics

## Outcome and corrected baseline
Extend the existing development-only TweaksBar with G (layout guide), O (reference overlay) and P (CMS ownership inspection), without changing source styles or disrupting editing.

T opens/closes the scalar calibration panel; B compares the original source styles while the panel is open. B is not a vertical-rhythm grid. Existing scalar changes are transient and reload clears them. Preserve this behavior.

## Shared lifecycle and accessibility contract
Keep the Base dev-only mount and compile-time DEV guards around processed client scripts. Verify production bundles/network behavior rather than assuming conditional markup tree-shakes all scripts. No production hotkeys, screenshot bytes or inspector payload.

Provide labeled buttons for each mode plus keyboard shortcuts. Ignore prevented/repeated/composing/modifier events and input/textarea/select/contenteditable targets, including composed event paths where relevant. Do not steal EmDash editor shortcuts; scope diagnostic shortcuts to an explicitly enabled HUD and yield to active editor input. Escape dismisses the active tool with appropriate focus return, without consuming unrelated editor dialogs.

One instance/listener set per document. On Astro navigation/page teardown, clean listeners/observers/object URLs and cancel drag state. Positioning overlays must not shift layout or intercept underlying pointer interaction except while deliberately manipulating overlay controls.

Persist no token overrides, screenshot files or proxy/content data. Default all modes off on reload. V1 persists nothing, including grid preferences; no storage API is used. A clear Reset action restores clean source rendering.

## G — layout guide
Use Container's actual content/wide/reading bounds, padding and computed grid gap; do not treat --spacing-container as a max-width. Select a real container when several nested containers exist. Recompute on resize/zoom/scroll as needed.

Allow configurable column counts (10/12 presets are diagnostic choices, not an assertion the site's intrinsic Grid uses those columns). Show inner content bounds, gutters and tracks accurately at mobile/intermediate/wide widths; honor RTL and do not introduce horizontal overflow.

## O — reference overlay
Accept a user-selected local raster screenshot using a file picker and optional drop target. Validate type/size/dimensions and decode errors. Keep bytes in memory using revocable object URLs; do not upload, persist or fetch arbitrary reference URLs in v1.

Record reference capture width/height, DPR and viewport/full-page mode. Overlay alignment is in CSS pixels, with opacity and X/Y controls, reset and scale only when explicitly selected. A full-page reference must scroll in document coordinates; a viewport capture can be fixed. Resizing flags a viewport mismatch instead of silently stretching to match.

Provide pointer and keyboard alignment controls only while that tool has focus. Label this as visual comparison, not a numerical diff or fidelity pass; #7 owns automated diffing.

## P — ownership inspection
Inspect the actual installed EmDash attributes. The installed EmDash 1.3.0 emits JSON data-emdash-ref in src/visual-editing/editable.ts; data-emdash-proxy in the original draft was an assumption. Isolate attribute decoding in a version-aware adapter with fixtures and fail visibly on unsupported formats.

Show annotated entry/collection/field/locale information where the installed format supplies it. Green means "annotation observed", not "editable/saveable verified". Missing attributes mean "unannotated/unknown" unless an explicit editorial-ownership inventory says a binding is required. UI dictionary text, composite/derived content and deliberate fallbacks are valid cases. In public mode markers may be absent; show that limitation.

Keep inspection read-only. No registration, CMS requests that mutate content, automatic field repair or export of private values. Real acceptance checks separately verify registration, stored value, manifest and editor save/reload on disposable content.

## Acceptance criteria
- [x] Existing T/B/export behavior and clean reload remain intact; G/O/P have accessible controls, independent state and predictable Escape behavior.
- [x] G aligns with selected Container bounds and gaps across widths, nested containers, resize and RTL.
- [x] O handles full-page scrolling, viewport/DPR mismatch, keyboard alignment, invalid/oversized input, reset and object-URL cleanup; no reference data reaches storage/network.
- [x] P covers observed marker, unsupported format, no-marker public mode and intentional UI text without claiming editing success.
- [x] Typing, composition and shortcuts in forms/EmDash editor are unaffected; navigation does not duplicate handlers.
- [x] Normal production build/browser check finds no active HUD controls, diagnostic listeners, inspector data or reference assets; a harmless empty script stub is not counted as functional HUD leakage.
- [x] #7 can capture clean source rendering with no HUD modes or token overrides active.

## Dependencies and slices
#1 defines guidance. G can ship first; O follows the capture metadata agreement with #7; P follows installed-version/editor-format verification under #3. #5 is a useful playground, not a hard dependency. DESIGN.md export is deferred to #4's proven mapping.

## Completed implementation — 16 October 2026

G/O/P and the shared lifecycle are implemented and locally verified on Windows. O supports local PNG/JPEG/WebP picker/drop, opacity/X/Y/reset, explicit reference DPR/scale and document/fixed positioning. Raster headers are validated before decode: 10 MiB, 32 MP, 16000px width and 60000px height limits; malformed, MIME-mismatched, SVG, remote URI and inconsistent decoded dimensions are rejected. Reference URLs are revoked on replacement/clear/close/reset/stale load/abort. Hiding O retains the current reference only in memory. Resize reports mismatches without stretching. The focusable alignment pad supports 1px arrows and Shift+arrow 10px.

P strictly adapts the installed 1.3.0 collection/id/optional field/status/hasDraft annotation shape; unknown versions/shapes fail visibly. The current format supplies no locale, which the UI states explicitly. Field and entry-context annotations have distinct outlines; unannotated UI text remains unknown. A persistent textual legend accompanies colors. Metadata updates/removals, public no-marker mode and real authenticated disposable edit-mode field annotations are covered. No CMS reads/writes or save-verification claim is added by inspection.

T/B/token export/reset and independent G/O/P controls remain intact. Escape dismisses the most recently enabled tool, then the drawer. Inputs, composition, modifiers, dialogs and active EmDash editing retain their shortcuts; tool buttons work while the editor owns keys. Navigation/pagehide restores original inline tokens, aborts listeners/observers/frames, revokes references and reinitializes once. Narrow-width HUD controls clear the native EmDash toolbar.

## Verification receipts

- Local Windows HUD suite: **15 passed**, zero skips/failures/flaky cases; 390/768/1440 plus 320px resize. Includes real EmDash markers, unknown UI/unsupported formats, G geometry/RTL, O scrolling/DPR/reset/drop/invalid files and lifecycle/shortcut coverage.
- Reference privacy probes at each width: **zero HTTP requests and zero storage writes** after readiness; both created object URLs revoked. Normal application/EmDash traffic is independent.
- Node 22.22.0: **35 unit tests passed**, including execution of the installed EmDash proxy/no-op implementation and raster header cases. Fast CI command rehearsal passed in **20.152s**, excluding checkout/setup/install/network/queue; no browser tests.
- Astro typecheck: **41 files, zero errors/warnings/hints**. Normal build/release profile passed. Existing large-chunk build advisory remains.
- Final dev/fixture/normal isolation check passed: normal styleguide GET/HEAD and query variants return 404; public page returns healthy content; all emitted client JS/CSS is free of functional G/O/P payload. Fixture output has no HUD and is rejected by the release guard. Harmless empty script stubs are permitted.
- Existing local visual suite: **51 passed, 18 intentional suite-mode skips**, zero failures/flaky cases; **51 unchanged baseline hashes**, no update flag. Capture readiness rejects HUD overlays/token overrides.

Evidence is saved in the local working tree at audit/dev-hud-2026-10-16/README.md and verification.json, with native reviewed screenshots, CI/typecheck/HTTP receipts and cleanup reports. Runbook: docs/dev-hud.md. Local browser checks remain excluded from Actions, git hooks and production build/deployment dependencies.

The preceding #5/#7/#10 milestone and reviewed runtime/tooling prerequisites are committed locally as **6c1c412**. This new HUD package is **uncommitted for review**, with unrelated skill/editorial edits preserved. No push, release/tag or deployment occurred. Issue #6 acceptance is complete; #3 remains open for the scoped final standards certification described in docs/phase-3-certification.md. Ownership diagnostics do not certify registration/save/publish; Workers/D1/R2/providers and the remaining CMS matrix stay explicitly pending.

## Milestone committed / standards certified — 16 October 2026

The HUD milestone is committed as **ac92dac** and included in [immutable standards 0.1.1](https://github.com/Vermeulen-Solutions/emdash-site-starter/releases/tag/standards-v0.1.1) at 28ccf82b3047eb615cd57ca55141751e0d29af11. Issue #3 certification now records the clean-checkout runtime/browser evidence and explicit Node/SQLite/Windows scope. This supersedes the earlier uncommitted status note; unrelated editorial edits remain preserved.
