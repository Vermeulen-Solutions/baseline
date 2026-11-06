# Brilliant canvas pilot — 2026-11-06

## Scope and decision

Recommendation: **add as an optional editable surface** (issue #42's “add as a fourth surface” option), with explicit fixed-viewport translation limits. Live desktop updates, native semantic-colour export and preservation of the owner's independent edit across agent undo now have observed evidence. Responsive CSS round trips fail, and a separate sizing-intent discrepancy appeared during checkpoint undo. The bounded evaluation is complete with those failed criteria documented; it does not certify responsive exports or lossless rollback for every property. Keep Brilliant explicitly available alongside HTML/browser, OpenPencil and Penpot; the browser-first default in #44 does not depend on it. No integration skill, distribution change or GitHub issue update was made during this pilot.

The following sections retain the initial compatibility preflight. The fuller native-token, two-concept, live-desktop and browser results are recorded under “Extended pilot” below.

During the initial preflight, no client content, imagery, credentials, publishing, deployment or subscription purchase was involved. A new local session was bound to an isolated empty project outside the repository. The two conversion calls used `convert_html`, which documents that it creates no persistent canvas elements; no `edit`, `export` or generation tool was called in that phase. The open desktop canvas was not inspected or manually refreshed in that phase.

## Method and retained evidence

The already running local server answered at `http://127.0.0.1:3333/mcp`, reporting server `brilliant` version `1.0.0`; this is the MCP server version, not an independently established desktop release version. Ports 3334 and 3335 refused the discovery connections. The installed `.claude-prod/agent.md` explains that HTML input converts to Blueprint and its design-system token discipline uses `bl` fences. It is installed vendor documentation, not proof of successful round trips.

An initial stateless dry conversion exposed dropped values. It was repeated after a project-bound `init` session with three viewport-sized frames and a constant-value control in one `convert_html` call (`layout: true`). The repeated fixture contains the five current `--color-page`, `--color-surface`, `--color-text`, `--color-action` and `--color-border` values from `src/styles/global.css`, plus actual `var()` uses, `clamp()` typography/gap/padding and `vi`. Chromium computed the original input styles at matching viewport widths as a reference. This measures style interpretation, not full-page overflow or visual acceptance.

- [Input frames](visual-concepts/brilliant-compatibility-2026-11-06/inputs.json) and [viewable 390px input](visual-concepts/brilliant-compatibility-2026-11-06/fluid.html).
- [Bound-session conversion receipt](visual-concepts/brilliant-compatibility-2026-11-06/conversion.json), including Blueprint, bounds, notes and elapsed/payload measurements.
- [Chromium computed-style reference](visual-concepts/brilliant-compatibility-2026-11-06/browser-reference.json), with zero page/console errors for these four isolated inputs.

## Observations

| Expression/use | Chromium reference | Brilliant dry conversion |
| --- | --- | --- |
| `gap: clamp(8px,2vi,24px)` | 8 / 15.36 / 24px at 390 / 768 / 1440 | No gap emitted; children begin consecutively |
| `padding: clamp(12px,3vi,40px)` | 12 / 23.04 / 40px | No outer padding emitted; first child begins at x=0 |
| `font-size: clamp(16px,2vi,32px)` | 16 / 16 / 28.8px | All three frames use size 16; the expression is absent |
| Semantic custom properties and `var()` paint references | Page/text roles resolve to the authored OKLCH values | Declarations/references absent from Blueprint; expected page/action fills absent, text falls back to `#454545` |
| Constant control: `gap:16px; padding:24px; font-size:32px` | 16px gap, 24px padding, 32px type | Preserved as `g(16)`, `pad(24)` and size 32 |
| Constant control: literal hex paint | Authored page/text/action colours | Matching fills emitted |
| Converter warnings | Not applicable | `notes: []` for all four frames, including the unsupported expressions |

Fixed root dimensions, vertical flex structure and the nested constant 12px padding survived. The control distinguishes unsupported fluid/token interpretation from a generally broken conversion endpoint. These results concern this HTML-to-Blueprint path; they do not establish what a separately authored native design system can do or what every export flavour emits.

## Effort and efficiency limits

This preflight made three MCP tool calls: two `convert_html` calls and one project-bound `init`. Discovery also used one successful protocol `initialize` and one `tools/list`, plus two failed connection attempts on the fallback ports. The initial conversion was repeated to bind the session and add a control, not because of a timeout, refusal or tool failure. No knowledge-loading calls were needed for this HTML probe.

The project-bound `init` response was 27,414 transport bytes and took 231ms as observed by the caller. The retained four-frame conversion response was 4,511 transport bytes and took 58ms; its request byte count and the tool's own timings are in the receipt. These are single-call observations, not total pilot wall-clock time or a cold/warm performance benchmark. Model input/output/cached tokens, image accounting, cost and comparable end-to-end effort were unavailable and were not inferred from bytes or call counts. The October 26 trial likewise did not measure token efficiency and did not include Brilliant.

## Next bounded pilot

If continuing issue #42, test native semantic roles and an authored component before rebuilding the two full concepts. Use the actual installed MCP schemas, bound session/project, stable request IDs and named checkpoints. Keep source CSS expressions beside their computed canvas approximations. Test each export flavour separately and inspect `clamp`, `vi`, `var`, gap and padding expression by expression; do not label a reconstruction a preserved expression. Observe agent writes in the live desktop canvas without refresh, then exercise human edits interleaved with undo. If the HTML path requires values to be sampled manually, record that translation effort and evaluate it against the value of owner editing. Proceed to the full 1440/390 composition, iteration and 390/768/1440 export checks only with those limits explicit.

Any future comparative efficiency run must use the same brief, model, assets, direction count, feedback batch and accepted Astro result across HTML/browser, Brilliant, OpenPencil and optionally Penpot. Separate setup/discovery, authoring, screenshots/reads, repairs and translation. Record actual harness usage when exposed, label unavailable values and retain quality/owner-intervention outcomes alongside cost. This preflight leaves issue #42 open.

## Extended pilot

### Review entry, scope and source identity

Open [the two-concept comparison](visual-concepts/brilliant-pilot-2026-11-06/index.html). It contains desktop/mobile canvas captures and links to the actual exported HTML, with the fixed-width limitation stated directly. The comparison entry itself was checked in Chromium at 390/768/1440: both radio controls work, all linked local files and images exist, there is no document overflow and no page/console error.

The isolated local project is `audit/visual-concepts/brilliant-pilot-2026-11-06/project`. Its `Compatibility.bl` canvas holds the native semantic-token/undo probe; `Directions.bl` holds both desktop/mobile concept pairs. The MCP server still reports `brilliant` 1.0.0, which is not a desktop release-version assertion. Work remains local and unpublished, using neutral content only. Vendor knowledge responses and tool-schema documentation were retained privately outside Git; the review artifacts contain authored scenes, exports and measurements rather than redistributing the installed manuals.

The issue's proposed “homepage hero + two sections” is broader than the current `src/pages/index.astro`, which only renders a recent-posts listing. The mechanical fixture therefore uses factual Baseline material from README: an introductory hero, the three content profiles and the verification sequence. It is not a faithful reconstruction of a nonexistent homepage composition, a redesign proposal or client approval. Original OKLCH and fluid expressions are retained in [the token map](visual-concepts/brilliant-pilot-2026-11-06/token-map.json) and [sampled values](visual-concepts/brilliant-pilot-2026-11-06/sampled-values.json). Native colours use browser-resolved sRGB approximations; Arial is a documented canvas substitution for the system stacks.

### Native token and export results

A six-element native probe was authored through one `ds` + `bl` edit. All five semantic colours bound as named native references, and text, gap, padding and radius also retained native bindings in the readback. Its render was inspected. The full-document export contains the five corresponding `--color-*` declarations. Changing `--color-action` once in Chromium changed the rendered action sample from `rgb(0, 81, 152)` to `rgb(31, 111, 80)`; [the receipt](visual-concepts/brilliant-pilot-2026-11-06/css-variable-change.json) records that offline export change. A native design-system colour mutation was not needed for this test and was not claimed.

| Export format | Semantic colour variables | Layout representation | Fluid expressions |
| --- | --- | --- | --- |
| HTML snippet | Flattened to literal colours | Absolute pixel positions | None |
| HTML document | Five declarations, six `var()` uses | Absolute pixel positions | None |
| HTML Flexbox | Flattened to literal colours | Flex rows, literal gap/padding, fixed outer pixel size | None |
| React | Five declarations, six `var()` uses | Flex rows, literal gap/padding, fixed outer pixel size | None |

See `project/Exports/probe-html.html`, `probe-htmlDoc.html`, `probe-htmlFlex.html` and `probe-react.jsx` under the review folder. The React file transpiles as JSX without diagnostics; no React mount/runtime acceptance is claimed. The HTML document supplies useful colour-role handoff data, while its reconstructed positions and exported text `div`s still require native semantic markup and responsive composition in Astro. Native token support must not be generalized into CSS-expression preservation.

### Concepts, repair and iteration

One HTML edit created all four boards: A / Workbench and B / Field notes, each at 1440px and 390px. There were 170 native elements. The first response reported three real layout overflows, so “representative render on the first attempt without repairs” was not established. Two were authored geometry choices (a too-short desktop frame and a 460px panel in a 450px parent); the mobile left-border wrapper also acquired an over-wide hug layout during conversion. One API repair changed the relevant height/fill constraints. No hand-authored canvas repair was used.

This directly corrects the earlier issue comment's suggestion that composition feedback is unavailable to external MCP agents: this MCP session returned bounds/overflow notes with affected references and proposed fixes. Native PNGs and browser exports were visually inspected after repair. A uses a split hero and sequential profile/verification sections; B uses a framed introduction and desktop sidebar, stacked on mobile. These are mechanical layout alternatives, not competing art directions.

A was selected by the agent only for the iteration exercise. One coherent batch changed its headline in both views, changed the mobile frame to content height and widened the desktop hero gap. Before/after material, authoring text and readback receipts remain beside the exports. This selection is not owner aesthetic approval.

### Live desktop freshness

The agent-created project first opened in the background. `switch_canvas` honestly returned `presented: false` because another project tab was in front. The app showed “Agent working in project” with an “Open project” button. Opening that project once through the UI revealed the saved native probe; this is normal target selection, not a manual reload. `Directions` subsequently appeared in its file list without reloading.

With `Compatibility` visibly open, an API edit changed the heading to “Live update verified” and increased the action bar from 24px to 32px. Both changes appeared immediately in the desktop screenshot. No Ctrl+R, reopen or restart was used. This establishes freshness for the observed local edit and file-list update, not an exhaustive guarantee for every write or export path.

### Browser fidelity and responsive limits

[Final measurements](visual-concepts/brilliant-pilot-2026-11-06/browser-checks-final.json) cover all four exports at 390/768/1440: twelve checks, required fixture text present and zero page/console errors. Both 1440px exports overflow at 390 and 768 because they retain a 1440px outer width. The 390px exports avoid overflow at all three widths but stay narrow. Separate desktop/mobile boards are not a responsive page, so the issue's single-export reflow acceptance fails.

The four native PNGs and matching-width Chromium captures have the same section geometry and wrapping on visual inspection, with text rasterization differences. Pixel comparisons cover the shared image extent: approximately 3.6–8.3% of pixels differ by more than 16 levels in at least one RGB channel. These are descriptive differences, not a calibrated pass threshold. A's final mobile canvas rounds up to 1010px while Chromium rounds its 1009.16px content to 1009px; the compared height is explicitly 1009px. Desktop captures are 1440×947 for A and 1440×900 for B; mobile captures include full-page content beyond the 390×844 review viewport. No filename is presented as proof of exact viewport height.

### Undo findings and completed owner check

`undo("selected A iteration")` restored the earlier desktop headline and 36px hero gap. However, the mobile frame's earlier fixed 1400px height returned as fixed 1009.16px, its newer resolved extent, rather than its original fixed height. That sizing-intent discrepancy prevents claiming lossless full-turn rollback. One `redo` restored only the first row-level action; four redo commands were needed to restore the four-row iteration, after which the expected headlines, hug sizing and 48px gap read back correctly. [Undo/redo receipts](visual-concepts/brilliant-pilot-2026-11-06/direction-undo-redo.json) and [final restoration](visual-concepts/brilliant-pilot-2026-11-06/direction-redo-all.json) retain the actual state.

The owner completed the independent edit on `Compatibility`, replacing both the text and layer name with “Owner edit kept”. [The pre-undo readback](visual-concepts/brilliant-pilot-2026-11-06/owner-before-undo.json) confirmed that marker alongside the agent's “Live update verified” heading and 32px action bar. Rolling back `before live turn` restored “Build with Baseline” and the original 24px bar while preserving the owner's text and layer name. [The post-undo receipt](visual-concepts/brilliant-pilot-2026-11-06/owner-undo.json), [acceptance summary](visual-concepts/brilliant-pilot-2026-11-06/owner-acceptance.json) and [inspected native PNG](visual-concepts/brilliant-pilot-2026-11-06/project/Exports/owner-undo-verified.png) record the result. This human-edit preservation case passes, including the two agent changes; it does not resolve the separate fixed-height/hug rollback discrepancy above or establish every edit interleaving. The earlier failed UI-automation text attempt was not counted as the human edit.

### Effort and acceptance limits

At the recorded measurement checkpoint, the extended pilot used **42 MCP tool calls plus 2 protocol requests**, approximately **15.7 elapsed minutes**, **31,696 request bytes** and **192,996 response bytes**. Three knowledge calls contributed **45,113 response bytes**. [The effort receipt](visual-concepts/brilliant-pilot-2026-11-06/effort.json) records per-call timing and bytes; [the summary](visual-concepts/brilliant-pilot-2026-11-06/effort-summary.json) distinguishes transport from model usage. The checkpoint excludes later report-writing time and any future owner action. Model input/output/cached tokens, image accounting and cost remain unavailable, so this is not a token-efficiency benchmark.

The owner-check continuation added five MCP calls (pre-read, rollback, post-read, PNG export and HTML export), bringing the extended-pilot total to **47 tool calls plus 2 protocol requests**, **33,507 request bytes** and **196,475 response bytes**. Wall time at the final export was **20.8 minutes including the owner handoff/wait**; it is not comparable active-authoring time. The earlier checkpoint remains recorded separately rather than silently mixing owner waiting into an efficiency claim. These totals exclude the separately recorded initial dry-conversion preflight.

Four export requests were initially refused because their destination was a sibling of the bound project, outside the app's allowed write roots. The corrected exports went to the project's `Exports/` folder. Those failed requests count in the effort receipt even though the tool encoded refusal as ordinary text rather than `isError`. Other effort included two stale accessibility-index failures before a successful coordinate action, a local module-import correction and two browser-measurement harness corrections (stale comparison metadata and fractional image-height rounding). These are recorded as operational/harness costs rather than silently attributed to canvas design quality. There were no timeout-driven duplicate edits, ambiguous-project loops, image-generation calls, purchases, client uploads or public submissions.

The mechanics evaluation supports keeping Brilliant as an explicitly offered local editing option with an Astro/browser proof. It does not justify making it the CSS runtime, claiming universal state/undo correctness or claiming token savings. The next implementation scope is a bounded skill/onboarding integration that carries the observed limitations, session/project discipline, native-token path, post-batch checks and export-format differences. That packaging remains separate from this pilot. GitHub image attachments/comments and closing the issue were not performed.

## Authorized integration follow-up

After the owner-edit test, the user authorized the skill/onboarding integration and continuous completion. The implementation adds the original Baseline-owned `brilliant-site-design` skill, two focused references, harness metadata and `docs/brilliant-onboarding.md`. It routes the explicit Brilliant choice through that adapter while retaining HTML/browser as the unresolved-preference default and side-by-side direction choice on every surface. Existing OpenPencil, Penpot and optional OpenDesign guidance remains available.

New generated profiles ship the complete skill and onboarding guide without a runtime package. The self-contained static updater recognizes the new skill while retaining historical four-through-seven-skill configurations and their membership ceiling. EmDash skill sync bootstraps the bundled optional skill only in a fresh checkout without an ownership receipt; an existing receipt retains its optional membership and can adopt Brilliant explicitly. Regression coverage exercises complete distribution/link closure, explicit adoption and refusal to widen older sites through retained records or forged stages.

Pilot exports, authored request text and sanitized measurement receipts are retained as maintainer evidence. The live native project, machine-specific app state and bundled default catalog stay local through the concept folder's `.gitignore`; vendor manuals/schema dumps are outside Git. The live native files are not a portable deliverable in this release, while authored batches and exported review files support reproduction. Packaging verification is recorded in the implementation handoff; the pilot receipts above remain their actual earlier observations, not a new cross-model skill or token-efficiency benchmark. The authorized release endpoint is a verified commit pushed on the current `codex/design-review-surfaces` branch; no client-site deployment is applicable.
