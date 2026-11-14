# Multi-page rollout verification

Use this reference for an established-site redesign that spans several templates or locales. Scale evidence to the change; do not impose a full-site audit on a small local edit.

## Make completion inspectable

Maintain one execution register with task IDs, named routes/locales, evidence paths and checkpoints. Distinguish implemented, verified and deferred. Enumerate generated records from current content, not only source manifests or route files. Treat representative visual review and sibling coverage as separate checks. When a later batch resolves an earlier blocker, update the current status while retaining its historical failure evidence.

Before release, show the owner a route treatment table: every route (or route family) marked **rebuilt** (new composition), **restyled** (markup unchanged, new shared styles) or **unchanged**, with one line on why. A redesign that rebuilds the archetype pages and only restyles the rest is a legitimate plan, but the owner must see that split before the release, not discover it after. On a real site the remaining pages needed a second pass because the first release never stated which routes had only inherited shared classes.

Map every requested deliverable, including a route proposal or editor acceptance, to this register. Before final delivery reconcile it with actual source and observations using `new-site-workflow/references/site-maintenance.md` when installed. Do not count an attempted check, a generated report or a source-only annotation as the corresponding observed result.

Separate public presentation, editorial accuracy, CMS editing, mail/integration operation and deployment. A source fact awaiting the owner is an explicit editorial follow-up; do not invent its replacement or label the whole site verified without naming the limit. User-approved concepts and existing scope remain authoritative when work resumes.

## Capture the rendered result

Discover the browser capabilities available in the current harness. A native application failure does not establish that its built-in browser or a supported connector is unavailable. Use an available authorized alternative, following its documented APIs; do not install a new browser stack merely because a preferred surface failed. Distinguish ordinary tool errors from permission/policy denials. Never bypass a denial by switching APIs; continue independent permitted work and report an actual access blocker precisely.

Before full-page capture, inspect actual font readiness and render a viewport frame. Scroll through lazy sections using supported browser actions, observe after each scroll, and return to the top. Check capture dimensions, claimed route/content, top and footer, loaded imagery and overflow. A screenshot filename is not evidence that its contents are valid.

In Git Bash on Windows, a bare `/` argument (the home route) is rewritten to `C:/Program Files/Git/` before the capture command sees it. Prefix the command with `MSYS_NO_PATHCONV=1`, for `npm run capture:routes`, `record:motion`, `audit:ui` and any capture script written for the task. Baseline's commands refuse a converted route; a hand-written script gets it silently, so confirm the captured URL and content for `/`. Capture at a wide viewport (1440px) as well as the working pane's width: a list of layout rows held to the prose measure only shows where the container is wider than that measure.

Distinguish the requested CSS viewport, the usable document width after scrollbars, and the saved image's physical dimensions/device scale. Verify the target tab's actual size after setting it; a browser-wide control may affect only the active tab. Compare layout before and after capture: some tools hide a scrollbar or resize the viewport during full-page capture, causing reflow or a right-clipped image. If those values change unexpectedly, settle the viewport and recapture, then validate file dimensions and inspect the saved pixels. Explain legitimate scale/rounding differences. Do not prescribe an unconditional double capture or change site gutters to compensate for a capture defect. Measure intended centered wrappers against their containing viewport/content area, separately from deliberate asymmetric children.

Persist full accessibility snapshots when recording evidence; transient diff snapshots are useful during interaction but incomplete as standalone records. Keep capture batches within the tool timeout and save progress between batches. Recapture only evidence invalidated by changes or failures, rather than repeating the entire audit without cause.

Check intermediate and narrow widths, long translated content and unusual/missing images. Record actual browser zoom/text-spacing checks separately from narrow-viewport reflow; one does not prove the other.

**Enlarged phone text is a required check, not an extra.** Many visitors raise their phone's text size, and a layout that passes at 390px with default text can fail completely: on a real site 20 of 20 enlarged-text cases failed on pages whose normal-size checks were all green. From a Baseline checkout, `npm run audit:ui -- --base <origin> --routes /,/pricing/ --widths 390,320` runs both kinds of enlargement at widths up to 500px by default: a larger root size (`root:1.6`, `root:2`, which scales a rem-based layout along with the text, as page zoom does) and text-only scaling (`text:1.5`, `text:2`, which multiplies every font size and leaves px-sized boxes alone, as Android's font-size setting does). It reports `large-text-offscreen` (text whose box leaves the viewport) and `large-text-squeezed` (a column narrowed to a few characters per line). Narrow the matrix with `--text-scale text:2` or switch it off with `--text-scale off`. On a site without the tooling checkout, apply the same two enlargements by hand in the browser and look at every archetype.

Do not trust "no horizontal overflow" for this. A shell that clips sideways overflow (`overflow-x: clip` or `hidden` on the page) reports `scrollWidth === clientWidth` while headings and buttons are cut off at the edge; measure the text elements themselves, which `audit:ui` does at every width (`text-offscreen`, `text-squeezed`).

The fixes that held up, in order of how often they were needed:

- Auto-fit grids must never demand more width than their container: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr))`, not `minmax(17rem, 1fr)`. A rem minimum grows with the text and pushes the track past the screen.
- A single-column grid needs a track that can shrink: `grid-template-columns: minmax(0, 1fr)`. With the default `auto` track, one long word widens the whole column and every sibling with it.
- Let words break only when they must (`overflow-wrap: anywhere` on headings and copy inside the main content), and let buttons wrap (`white-space: normal; max-inline-size: 100%`), with `overflow-wrap: break-word` on the button itself so its label wraps between words.
- Cap panel padding, list indents and icon sizes by the viewport when they are set in rem: `padding: clamp(min(1.25rem, 6vw), 3vw, 2rem)`, `padding-inline-start: min(1.5em, 7vw)`. Otherwise doubled text also doubles the padding and leaves a column one letter wide (seen on a 404 panel at 320px and 200%).
- A `vw` cap on a headline (`min(11.5vw, …)`) keeps the longest word on screen at the default size only; text-only scaling multiplies it again. Accept a mid-word break in the longest headline word at 1.5× and above, or shorten the headline; do not shrink body text to compensate.

State the result honestly: which widths and factors pass, and where a column is tight rather than broken. 320px at a 200% root size is in effect a 160px page; record it as a limit instead of chasing it at the cost of the normal layout.

## Verify live enhancements after tooling

A passing server response and SSR screenshot do not establish that JavaScript works. After a build or typecheck, exercise key hydrated interactions on the still-running dev server. If dependency optimization invalidates live imports, diagnose the module/runtime failure; separate dev and tool cache directories where the installed framework supports it rather than treating missing enhancement as a CSS issue.

For geometry driven by JavaScript, inspect computed layout after final fonts and styles settle. Changes in CSS gaps can require recalculation even when container width stays constant. Unit tests of the geometry algorithm complement, but do not replace, browser checks of its real inputs.

Test real keyboard paths, including moving focus into a disclosure, activation and Escape from its contents. Programmatically focusing a control can trigger focus handlers before the activation event; verify the visible expanded state and focus return rather than assuming a successful click means the task passed.

## Preserve contracts and label evidence honestly

Compare original and final meaningful text, images/order, local destinations, dates, form names/types/required states and handlers. Keep imported cleanup narrowly grounded in observed artifacts and preserve substantive editorial content. Local HTTP audits should distinguish redirects from trailing-slash normalization, expected 404 states from failures, and unsupported HEAD from a failed GET. When deploying under an Astro sub-path (`base`), verify emitted HTML doesn't double-prefix links or assets (`grep -r "/base/base" dist`); internal paths already prefixed by Astro (`Astro.url.pathname`, pagination URLs) must not be passed through manual prefix helpers again.

A feedback query is a presentation preview, not successful storage or mail delivery. Native invalid-form checks and early server validation can verify failure handling without creating records. Read-only CMS checks establish loading/field compatibility; they do not establish save round trips. Keep production tests within explicit authorization and avoid polluting content with visual fixtures.

Use explicit UTF-8 for source/evidence read and write operations, especially on Windows. Check diffs for unintended encoding changes before a checkpoint.

## Close with bounded review

Follow the selected design skill's existing review contract rather than adding another review loop. Give fresh reviewers valid captures, the accepted design authority, known exceptions and exact scope. Apply material findings in a batch, recapture the same views and score those fixes. Keep detector advisories distinct from failures and do not claim full accessibility conformance from automated checks alone.

Finish by reconciling the execution register, plan and evidence. Reports should say what changed, what was tested, what remains owner-dependent, and what was committed or deployed. Update reusable process guidance only where observed failures justify a useful decision rule; keep project facts and individual incidents in the project's audit records.

## Reusable audit acceptance lessons

Use docs/reusable-public-patterns.md where the starter provides image/card/partner/form primitives. Check practical density: compact filter/count groups, repeated contacts/roles, long preview dates, odd grid rows, footer hierarchy and membership prerequisites before forms. Verify both locale metadata and readable gallery alternatives. Inspect actual loaded lazy images; blank unscrolled full-page captures are not broken-image evidence. Check actual selected srcset/sizes against native dimensions; distinguish low-resolution source media from processing artifacts. Verify light/dark focus contrast and reduced-motion/logo hover without tile-edge movement. Forms must preserve permitted answers securely and show reason-specific errors with matching native/server date validation. No form delivery test is implied by a visual review.

Lessons from a 2026-11 redesign rollout:

- **Rendered contrast, not only token pairs.** A token-pair calculation passed while a cascade slip (`.band p` setting a muted colour on a price inside a paper card) left text nearly invisible. `npm run audit:ui -- … --contrast` compares each text element's computed colour with the solid backgrounds composited behind it. It skips text over images and gradients and cannot see grounds painted by pseudo-elements or shadows, so those still need a look.
- **Restyling a shipped component from site CSS.** A component's scoped rule (for example `Callout.astro`'s `.callout`) carries the scoping attribute and loads after `global.css`, so a site rule of equal weight loses on source order. Match it deliberately, for example `.site-main .callout.callout`, and say why in a comment. Do not edit the shared component for one client's look.
- **Full-width bands under `automatic-v2`.** The shell owns the horizontal gutter, so a `Section` with a background is inset. To run a band's colour to the viewport edges without touching the gutter, paint it outward: `box-shadow: 0 0 0 100vmax <colour>; clip-path: inset(0 -100vmax);`. Content keeps its alignment and nothing overflows.
- **Strict font policy and inlined fonts.** With `font-src 'self'` in a site's headers, a small font subset that the bundler inlines as a `data:` URI is blocked on every page and shows up only as a console message (`audit:ui` reports it as `console-error`). Find the real source before changing the policy: on one site it was first blamed on a payment provider's stylesheet when it was the site's own inlined Fontsource subset. Either stop the bundler inlining fonts (Vite `build.assetsInlineLimit`) or allow `data:` in `font-src` on purpose.
- **A record pasted into a sentence.** `check:art-direction` now rejects a second record body and a record heading that sits in the middle of a line. Before that, a newer record spliced into prose left the gate validating a stale one.
- **Waiting on a long check.** Run a long capture matrix in the foreground in bounded batches (a few routes or cases per run) rather than as one background job; a job that outlives its time limit loses its summary, and ending the turn to wait for it stalls the release.

Route checks must preserve full query URLs in results and retry image HEAD=405 with GET. Compare visible page identity with the accepted design rather than obsolete imported titles. Serialized admin translation strings do not prove a setup wizard is visible. A deployment is incomplete until code, required CMS edits and media references are verified independently; never assume local media IDs equal production storage keys.
