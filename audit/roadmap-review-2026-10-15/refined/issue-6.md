# TweaksBar visual inspection modes with accurate ownership diagnostics

## Outcome and corrected baseline
Extend the existing development-only TweaksBar with G (layout guide), O (reference overlay) and P (CMS ownership inspection), without changing source styles or disrupting editing.

T opens/closes the scalar calibration panel; B compares the original source styles while the panel is open. B is not a vertical-rhythm grid. Existing scalar changes are transient and reload clears them. Preserve this behavior.

## Shared lifecycle and accessibility contract
Keep the Base dev-only mount and compile-time DEV guards around processed client scripts. Verify production bundles/network behavior rather than assuming conditional markup tree-shakes all scripts. No production hotkeys, screenshot bytes or inspector payload.

Provide labeled buttons for each mode plus keyboard shortcuts. Ignore prevented/repeated/composing/modifier events and input/textarea/select/contenteditable targets, including composed event paths where relevant. Do not steal EmDash editor shortcuts; scope diagnostic shortcuts to an explicitly enabled HUD and yield to active editor input. Escape dismisses the active tool with appropriate focus return, without consuming unrelated editor dialogs.

One instance/listener set per document. On Astro navigation/page teardown, clean listeners/observers/object URLs and cancel drag state. Positioning overlays must not shift layout or intercept underlying pointer interaction except while deliberately manipulating overlay controls.

Persist no token overrides, screenshot files or proxy/content data. Default all modes off on reload; optional namespaced sessionStorage may retain grid preferences (column count/gutter choice), never active capture modes. A clear Reset action restores clean source rendering.

## G — layout guide
Use Container's actual content/wide/reading bounds, padding and computed grid gap; do not treat --spacing-container as a max-width. Select a real container when several nested containers exist. Recompute on resize/zoom/scroll as needed.

Allow configurable column counts (10/12 presets are diagnostic choices, not an assertion the site's intrinsic Grid uses those columns). Show inner content bounds, gutters and tracks accurately at mobile/intermediate/wide widths; honor RTL and do not introduce horizontal overflow.

## O — reference overlay
Accept a user-selected local raster screenshot using a file picker and optional drop target. Validate type/size/dimensions and decode errors. Keep bytes in memory using revocable object URLs; do not upload, persist or fetch arbitrary reference URLs in v1.

Record reference capture width/height, DPR and viewport/full-page mode. Overlay alignment is in CSS pixels, with opacity and X/Y controls, reset and scale only when explicitly selected. A full-page reference must scroll in document coordinates; a viewport capture can be fixed. Resizing flags a viewport mismatch instead of silently stretching to match.

Provide pointer and keyboard alignment controls only while that tool has focus. Label this as visual comparison, not a numerical diff or fidelity pass; #7 owns automated diffing.

## P — ownership inspection
Inspect the actual installed EmDash attributes. EmDash 1.1.0 emits data-emdash-ref in src/visual-editing/editable.ts; data-emdash-proxy in the original draft was an assumption. Isolate attribute decoding in a version-aware adapter with fixtures and fail visibly on unsupported formats.

Show annotated entry/collection/field/locale information where the installed format supplies it. Green means "annotation observed", not "editable/saveable verified". Missing attributes mean "unannotated/unknown" unless an explicit editorial-ownership inventory says a binding is required. UI dictionary text, composite/derived content and deliberate fallbacks are valid cases. In public mode markers may be absent; show that limitation.

Keep inspection read-only. No registration, CMS requests that mutate content, automatic field repair or export of private values. Real acceptance checks separately verify registration, stored value, manifest and editor save/reload on disposable content.

## Acceptance criteria
- [ ] Existing T/B/export behavior and clean reload remain intact; G/O/P have accessible controls, independent state and predictable Escape behavior.
- [ ] G aligns with selected Container bounds and gaps across widths, nested containers, resize and RTL.
- [ ] O handles full-page scrolling, viewport/DPR mismatch, keyboard alignment, invalid/oversized input, reset and object-URL cleanup; no reference data reaches storage/network.
- [ ] P covers observed marker, unsupported format, no-marker public mode and intentional UI text without claiming editing success.
- [ ] Typing, composition and shortcuts in forms/EmDash editor are unaffected; navigation does not duplicate handlers.
- [ ] Normal production build/browser check finds no active HUD controls, diagnostic listeners, inspector data or reference assets; a harmless empty script stub is not counted as functional HUD leakage.
- [ ] #7 can capture clean source rendering with no HUD modes or token overrides active.

## Dependencies and slices
#1 defines guidance. G can ship first; O follows the capture metadata agreement with #7; P follows installed-version/editor-format verification under #3. #5 is a useful playground, not a hard dependency. DESIGN.md export is deferred to #4's proven mapping.
