# Automatic spacing and agent-first maintenance: consolidated implementation plan

Implementation completed on 2026-10-20 in eight phases. See [the progress and closure register](automatic-spacing-progress.md) for commits, original-finding mapping, actual verification and scope limits. The work orders below retain the approved plan and historical findings.


Status: implementation authorized on 2026-10-20; Phase 1 in progress. Track verified outcomes and phase commits in [the progress register](automatic-spacing-progress.md).

Updated: 2026-10-20.

Review basis: `9873b08..c3d965c` on `main`, the subsequent architectural discussion, the ACSS reference, and additional source/computed-style probes. This document consolidates the plan from that discussion; it does not replace the separate architecture-hardening plan from 2026-10-19.

Reading guide: the architectural contracts explain the intended outcome; the F01-F16 table is the observation index; **Original audit findings A01-A07** preserves the earlier audit's severity, source evidence, impact and regression requirements; **Implementation work orders W01-W12** turns the phases into file-level tasks. The browser case matrix and closure register define completion. A phase summary or green screenshot alone cannot close a finding.

## Objective and architectural judgment

Keep automatic spacing as a core feature. Normal pages built from Baseline primitives should have appropriate spacing before authors add spacing utilities. Preserve cascade layers, fluid tokens, section-owned padding, intrinsic layouts, and default RichText flow. Complete the automatic model instead of replacing it with repetitive manual spacing classes.

Use CSS as the configuration authority and the existing token CLI as the agent's maintenance interface. Git diffs and rendered evidence make changes reviewable. Do not introduce a settings panel, runtime configuration service, CMS spacing fields, or a second writable JSON token store.

The ACSS inspiration is contextual defaults, a standard composition model, independent controls, and easy overrides:

- [Automatic Spacing](https://docs.automaticcss.com/spacing/automatic-spacing)
- [Contextual Spacing](https://docs.automaticcss.com/spacing/contextual-spacing)
- [Smart Spacing](https://docs.automaticcss.com/spacing/smart-spacing)

The Astro implementation should use its controlled components and class equivalents to express these contexts. Avoid guessing layout relationships through an expanding HTML-element allowlist.

## Governing contracts

| Context | Responsibility |
| --- | --- |
| SiteShell | Document structure, landmarks, horizontal page gutters; no extra rhythm on section-owned pages |
| Section | Its own padding and the structural gap between immediate children |
| Ordinary Container | Width/centering and a default vertical content layout with content gap |
| Grid / managed public grid classes | Intrinsic or authored grid layout and default grid gap |
| Cluster / Sidebar | Their own specialized layout gaps |
| RichText / editorial context | Internal paragraph, heading, list, media and quote relationships |
| Breakout Container | Named tracks, reading measure and subgrid propagation; no automatic conversion to flex |
| Semantic composites | Own internal presentation; outer flow must not reach inside cards, tickers, controls or galleries |

One relationship has one spacing owner. Layout parents use gap; editorial content uses intentional flow rules. Containers may contain RichText, but the parent spaces the RichText block while RichText spaces its own content.

### Configuration hierarchy

Keep `src/styles/global.css` authoritative:

1. Existing `@theme` base tokens define the spatial scale and fluid bounds.
2. Regular CSS aliases under `:root` define independent site-wide spacing contexts.
3. Local component variables, props and named variants override a specific composition.

Initial contextual aliases, inside the base layer:

```css
:root {
  --layout-section-padding: var(--spacing-section);
  --layout-container-gap: var(--spacing-grid);
  --layout-content-gap: var(--spacing-content);
  --layout-grid-gap: var(--spacing-grid);
}
```

`--spacing-container` remains the horizontal gutter token. Do not confuse gutters with the gap between containers. Do not add a new `@theme` scale for contextual aliases.

Each primitive initializes local spacing from the contextual defaults. Local component overrides and internal flow calculations must not accidentally become defaults for nested primitives. Deliberately scoped `--layout-*` overrides may affect an entire region. Preserve this distinction in documentation and tests.

### Overrides and semantic boundaries

- Keep `Section.spacing="section | content | none"`. Default uses the section context; content uses the existing compact spacing token; none removes only that Section's padding.
- Section/container gaps remain separately adjustable. Zeroing a contextual gap disables that category's defaults, while explicit local overrides remain possible.
- Provide a small custom-layout escape hatch for ordinary Sections/Containers. It relinquishes automatic display/gap behavior without discarding width or padding responsibilities.
- Preserve `Grid.gap`, class equivalents, and predictable utility overrides. Keep managed grid defaults within the public styling policy.
- Forward ordinary HTML attributes where needed. Merge classes and supported style forms. A gap prop wins over the same local variable in the passed style; a utility that sets the actual gap wins through the utility layer.
- Do not equate an unstyled collection list with editorial bullet/numbered content. Preserve list semantics while keeping listing content aligned with its container.
- Do not require a named section landmark solely to obtain presentation spacing. Use meaningful grouping and appropriate article/aside/list semantics.
- Do not automatically collapse adjacent section padding. Calibrate full bands versus related groups intentionally.

## Evidence to address

These are historical observations from this review, not claims about an implementation of this plan. Some issues predate the reviewed refactor.

| ID | Observation | Required response |
| --- | --- | --- |
| F01 | Unlayered EmDash figure margins beat the newly layered fallback reset. A 400x300 frame's inner figure became 252px high with 24px margins. A rendered ID-only asset reference confirmed the margins. | Correct vendor/fallback boundary and test actual media geometry. |
| F02 | Nested default Sections inherited compact (~24px) or zero padding instead of the 144px desktop default. | Initialize local section modes independently. |
| F03 | Shell sibling margins add spacing to adjacent sections; grid-plus-flow can combine gap and child margins. | Remove competing ownership in the new policy. |
| F04 | Gallery important declarations prevent ordinary margin/other utilities from overriding defaults. | Remove unnecessary important defaults; document narrowly necessary exceptions. |
| F05 | `src/dev/visual-fonts.css` contains an unlayered author rule; the source gate omits other CSS/profile inputs. | Cover all authored inputs with parsed checks. |
| F06 | The brace counter accepts unlayered rules after quoted braces and accepts anonymous layers. | Replace heuristic rule detection. |
| F07 | `.flow-legacy` can falsely satisfy the flow duplicate-margin guard. | Parse and match actual selectors and declarations. |
| F08 | Calibration claims component/grid-auto coverage absent from the maintained spacing fixture. | Render actual components and correct evidence claims. |
| F09 | New structural flow targeting indents homepage listing content by 24px; heading stayed at x=48 while post content moved to x=72 at 1440px. | Separate collection list presentation from prose lists and assert alignment. |
| F10 | Descendant editorial media rules apply 36px margins to nested images, including a card-media fixture and images inside figures. | Establish editorial/component boundaries; avoid reaching into composite internals. |
| F11 | `--figure-spacing:80px` still resulted in 36px figure margins. | Prove each documented spacing control changes its intended relationship. |
| F12 | A figure as the only flow child retained 36px outer margins; a hidden first paragraph gave the first visible paragraph ~24px start margin. | Define and test outer-edge/hidden-content behavior. |
| F13 | Blockquote flow state leaked into nested flow, producing 36px paragraph spacing instead of ~24px. | Isolate internal calculation state from intentionally inherited context settings. |
| F14 | An update to a misspelled token returned unchanged CSS without error. | Reject unknown names/scopes and report applied versus unchanged declarations. |
| F15 | Static RichText always retains a wrapper; EmDash can omit it for an unannotated flow opt-out. | Align opt-out behavior where possible and test both profiles. |
| F16 | Inline metadata cannot obtain visible vertical separation from margin rules alone. | Give dates and metadata deliberate block/layout ownership. |

The last complete review verification passed 251 tests and Astro diagnostics, root build/HTML audit, both generated profiles, and 75 local visual tests with 18 intentional skips. Those results establish the starting point only. An initial concurrent importer timeout passed in isolation and on the complete verification rerun. Do not treat old receipts as final implementation evidence.

## Original audit findings A01-A07

This section carries forward all seven findings from the original review in this chat. Locations refer to the reviewed source at `c3d965c`; implementation must use current locations and record its new revision. Severity uses the original review's categories. Probe results below are prior observations, not fresh implementation results. Some probes were in-memory and do not have retained standalone receipts; reproduce them in maintained tests rather than inventing evidence links.

### A01 — P0: cascade layering breaks the EmDash image fallback

Observation index: F01. Introduced by `dec989d`.

Source evidence:

- `src/components/EditorialImage.astro:25` renders a PTImage inside the reserved fallback frame for references without a usable direct URL.
- `src/components/EditorialImage.astro:29` moves the following reset into `components`; line 33 sets the inner `.emdash-image` to absolute positioning, inset zero and margin zero.
- The installed EmDash `src/components/Image.astro:258` supplies an unlayered `.emdash-image` margin of `1.5rem 0`.
- Reviewed production output contained both the unlayered EmDash rule in `Section.CkWLJNF3.css` and the layered reset in `RichText.DUQajbu_.css`. These are historical generated names, not stable filenames to hardcode in tests.

Emitted rule relationship, abbreviated only for generated scope attributes:

```css
/* Unlayered vendor rule wins over normal declarations in a named layer. */
.emdash-image[data-astro-cid-…] { margin: 1.5rem 0; }
@layer components {
  .editorial-image__fallback[data-astro-cid-…] .emdash-image {
    position: absolute;
    inset: 0;
    margin: 0;
  }
}
```

Reproduction and observed result: an ID-only reference takes the fallback path. Under production CSS, a controlled 400x300px frame's figure had 24px top/bottom margins and a 252px inner height. Removing the component layer from the same CSS restored zero margins and 300px height. A separately rendered EditorialImage also confirmed 24px margins.

Impact: the layer migration changed fallback media geometry even though the owned reset still exists. More specificity in the same layer cannot solve the precedence problem.

Required correction: W02 must either introduce a dependable lower-priority vendor boundary or replace this fallback with owned presentation that resolves the media reference correctly. No blanket important override or source edit in `node_modules`.

Closure test: V01 uses real seeded local media referenced by ID only, real component output, both dev and built public CSS, successful image loading, zero inner margins, correct bounds and containment. Verify 320/390/1280 placements and preserved alt/link behavior.

### A02 — P1: nested Section defaults inherit a parent's mode

Observation index: F02. Relevant change: `6ca88c4` and removal of scoped Section spacing.

Source evidence: `src/components/Section.astro:15` omits `data-spacing` for default mode; `src/styles/global.css:118-128` reads the inherited public custom property while content/none modes assign it.

Reproduction: nest a default Section inside one with `spacing="content"`, then inside one with `spacing="none"`, at a 1280px viewport. Observed default child padding was approximately 24px and 0px respectively, rather than the 144px section default. The previous `.section--section` rule directly selected the full token.

Impact: a component's default changes with its ancestor's incidental mode. Inherited container-gap suppression can likewise reach nested sections.

Required correction: W04 initializes each primitive's local padding/gap values from the site-level aliases. Section enums affect their own component, while intentionally scoped `--layout-*` aliases remain inheritable. Test local zero and custom values separately from scoped site policy.

Closure test: V02 covers all nine parent/child Section mode pairs plus nested Grid, content-gap and local override cases, comparing with independently resolved reference tokens.

### A03 — P1: shell and flow rules compete with layout spacing

Observation index: F03.

Source evidence: `src/styles/global.css:354` still applies sibling margins to every later direct shell child; line 140 only zeroes the structural container-gap variable; line 364 separately applies flow margins. `profiles/static/project/src/pages/index.astro:13-21` has adjacent Sections affected by shell sibling spacing.

Observed cases at 1280px:

- A later direct Section receives approximately 24px shell margin in addition to section padding, including when its own padding is disabled.
- `.section.grid.flow` combines a 36px row gap with approximately 24px child start margin.
- `space-y-0` on a section did not clear its last child's 36px automatic start margin.
- `data-spacing="none"` plus flow preserves editorial flow margins. This last case needs a clarified contract; it is not evidence that editorial content should lose all spacing when section padding is disabled.

Impact: spacing depends on intersecting owners, and a utility may target a different spacing property from the automatic rule. More cancellation selectors would increase the maintenance burden.

Required correction: W04 and W07 remove the competing relationships in the new policy, provide gap-based primitive defaults, make shell ownership explicit, and document the independent meaning of padding/gap/editorial controls. Do not promise that a margin utility replaces a layout gap.

Closure tests: V03-V05 measure adjacent bands, structural child distances, gap utilities, local zero controls and compatibility-mode behavior. Expected additive section edges are retained and distinguished from unwanted shell margins.

### A04 — P1: gallery important defaults defeat utilities

Observation index: F04. This is a retained limitation exposed by the new override promise, not a newly introduced 32px value.

Source evidence: `src/components/PhotoGallery.astro:153-155` uses important margins/padding/list styles; lines 229-230 use important image margin/max-width defaults.

Reproduction: assign `mt-0 mb-0` to the emitted gallery element under production CSS. Observed top and bottom margins remain 32px. Ordinary utility-layer declarations cannot override the important component declarations.

Impact: the claim that component defaults yield to ordinary utilities is false. Moving important rules into a named layer does not remove this exception.

Required correction: W02 audits each declaration and removes unnecessary important defaults after external precedence is addressed. Preserve deliberate layout invariants or necessary vendor containment only if documented and tested. Do not add a new gallery prop solely to avoid correcting CSS precedence.

Closure test: V06 operates on real rendered gallery/image elements. Test zero margins, nonzero utility padding, image max-width and gap independently; preserve justified gallery sizing, caption fit and lightbox focus behavior. Where the public API has no class passthrough, the CSS-precedence probe may add classes to emitted DOM; do not falsely claim a new component API was exercised.

### A05 — P1: the layer test misses files and accepts false passes

Observation index: F05-F06. Relevant addition: `5c9e1d1`.

Source evidence: `src/dev/visual-fonts.css:4` remains unlayered. `tests/design-workflow.test.mjs:145` uses a brace counter with no string handling; its walk at approximately line 203 only checks Astro blocks under `src` in addition to global.css. Other CSS and profile overlays are omitted.

Reproduced false-pass inputs:

```css
@layer components { .x::after { content: "}"; } }
.unlayered { color: red; }
```

```css
@layer components {}
@layer { .anonymous { color: red; } }
```

The old test accepted both; an independent CSS parser identified the outside/anonymous rules.

Impact: a passing test cannot establish the named-layer contract. Finding one layer substring in a block does not establish where its other rules reside.

Required correction: W03 replaces the scanner with parsed rules/ancestors and selector handling; W02 layers the current font override. Include all applicable author inputs, profile overlays, file imports and syntax-error handling. Vendor/framework classification must be explicit and distinct from design-gate exceptions.

Closure test: M01-M06 mutate files and CSS text, including quoted braces, comments, nested at-rules, anonymous/incorrect layers, newly added CSS files and generated-profile inputs. Correct code must pass without pinning formatting or a single selector spelling.

### A06 — P1: the design audit accepts a lookalike flow guard

Observation index: F07. Changed by `c3d965c`.

Source evidence: `scripts/audit-design-system.mjs:24-28` permits arbitrary text after `.flow` in the guard check.

Reproduction: remove the real duplicate-margin guard from an in-memory baseline stylesheet and append:

```css
.flow-legacy > :where(img) + * { margin-block-start: 0; }
```

Observed: current logic reports `flowDuplicateMarginGuard: true` and `flowRuleCount: 1`, leaving the other healthy baseline conditions able to produce a pass although the real flow context lacks its guard.

Impact: a brownfield audit can falsely certify a missing spacing safeguard.

Required correction: W03 uses parsed selectors/declarations and recognizes actual supported flow strategies. If the revised editorial model uses one-sided internal margins, recognize that valid strategy rather than requiring an obsolete reset snippet. Unsupported structures return an honest warning/unverified result rather than a false pass.

Closure test: M07-M10 cover lookalike names, comments, missing/duplicate rules, valid legacy guarded flow and the new canonical flow strategy. Preserve the existing audit's documented result severity; this plan does not silently turn every advisory into a blocking rule.

### A07 — P2: calibration overstates browser coverage

Observation index: F08.

Source evidence: `audit/component-calibration.md:81-86` claims Section.py-0 and both grid forms. `tests/visual/setup.mjs` creates raw sections and `.grid` elements, and `tests/visual/spacing.spec.mjs` tests those nodes. It does not render Section or Grid/grid-auto in that fixture.

Impact: the maintained proof is narrower than its written description. Separate review probes established actual Grid override behavior, but are not a replacement for a maintained regression test.

Required correction: W08 renders production primitives and checks real props/markup. W10 rewrites the calibration report to match named assertions, viewport/profile applicability, source hashes and manual observations.

Closure test: V02-V06 and V11-V12 exercise Section, Container, Grid and both RichText branches. Link results to the calibration record, distinguishing token arithmetic, browser geometry, screenshots and CMS save/reload proof.

### Explicit traceability of later findings and coverage additions

| Observation | Source / prior proof | Work order | Required maintained proof |
| --- | --- | --- | --- |
| F09 listing indentation | `global.css:392`; `src/pages/index.astro:16,24`; 1440px heading x=48 / listing x=72 / list padding=24px | W05, W07 | V07 alignment on home/posts/category/tag, with real editorial lists retaining indentation |
| F10 composite/media leakage | `global.css:396`; source-matching Chromium fixture computed 36px margins on card-media and nested figure images | W05 | V08 using actual Card, LogoTicker, Disclosure, PhotoGallery and editorial figure output |
| F11 ineffective media controls | `global.css:380-397`; requested figure spacing 80px, observed 36px | W05, W06 | V09 individually changes each documented editorial spacing variable |
| F12 outer edges / hidden content | `global.css:364,396`; only figure has 36px outer margins; first visible paragraph after hidden sibling has ~24px margin | W05 | V10 first/last/only/hidden-first and media transition cases |
| F13 nested flow state | `global.css:364-385`; nested quote paragraphs use 36px instead of ~24px | W05 | V10 nested flow independence plus intentional inherited public controls |
| F14 silent token typo | `scripts/design-system.mjs:552`; `applyTokenOverrides` with an unknown root key returns unchanged source without error | W06 | T01 unknown names/scopes fail; known equal values report an intentional no-op |
| F15 RichText branch mismatch | root `RichText.astro:12`; static overlay `RichText.astro:8` | W05 | V11 both platforms, with/without annotations/classes and flow false |
| F16 inline dates | `src/pages/posts/[slug].astro:66`; inline time receives no visible vertical separation from block margins | W07 | V12 date/metadata bounds and spacing for present/absent values |
| Empty or optional content | EmDash and static RichText currently retain wrappers by default; extra-gap effect under the proposed flex layout is a risk to test, not a claimed current regression | W05, W08 | V13 empty content before/between/after visible children, editor placeholders retained where required |
| Actual CMS editing | prior evidence established attribute forwarding, not an end-to-end save | W09 | E01 disposable-entry selection/edit/save/reload/public render |
| Public reflow/zoom | existing `behavior.spec.mjs:128,146` targets the styleguide | W08 | V14 listing and article at 320px/text-spacing and actual 200%/400% zoom |
| Horizontal geometry / image delivery | gutters and breakout tracks are separate owners; image sizes currently contain fixed placement assumptions | W08 | V15 measured track/gutter bounds, focus visibility and selected image resources |

Do not merge the distinction between confirmed findings and future-layout acceptance risks. The latter need proof before shipping the new defaults but must not be reported as existing regressions without reproduction.

## Execution and checkpoints

The sections below describe planned work; implementation and verification status lives in the progress register. Work sequentially through dependencies. Add focused regression tests with the fixes they protect; Phase 6 completes cross-cutting gates. The user authorized a commit between phases. Commit verified phase changes; do not push or deploy.

This is reusable starter infrastructure. Preserve existing art-direction policy: use justified exact path/hash exceptions for eligible infrastructure, not a fictional client Art Direction Record. Client-specific visual work still requires its actual saved record and gate.

### Phase 1 — Contracts, caller inventory and migration boundary

Scope:

- Inventory root routes, profile overlays, shared styleguide/composition specimens and primitive callers: Section, Container, Grid, flow, section classes, and shell wrappers.
- Identify redundant flow owners, collection lists, nested components, custom flex/grid layouts, breakout wrappers, optional content and editor-owned wrappers.
- Finalize the small gap/custom-layout API and class equivalents before modifying consumers. Preserve existing APIs unless this plan explicitly migrates their behavior.
- Classify changes as existing shared-file edits, new shared paths, package/script changes or client-owned route/Base changes.
- Inventory downstream consumers. Introduce explicit versioned activation from the site-owned Base wrapper for changed automatic layout behavior when existing-site compatibility requires it. New profiles opt in; old site-owned wrappers keep compatibility until migrated.
- Ensure a shared SiteShell/global/component update alone does not activate a behavioral migration in an old site. Avoid unconditional activation in an automatically updated shared file.
- Record a baseline and the fixture matrix. Do not run upstream skill synchronization as an unrelated prerequisite.

Acceptance:

- Every caller has a migration disposition.
- Default, nested, custom, zero-spacing, editorial and breakout behavior is written down.
- Existing-site activation and rollback are concrete; ordinary bounded sync cannot silently perform the migration.

### Phase 2 — Cascade and media correctness

Scope:

- Inspect public emitted CSS, actual stylesheet order, framework-injected layers and vendor imports against installed versions and documentation.
- Establish a reliable vendor/import boundary. Prefer vendor precedence below owned components and utilities; do not rewrite CSS by guessing selector prefixes.
- If EmDash generated component CSS cannot be isolated reliably, use an owned fallback implementation rather than a brittle rewrite. Preserve the media/storage presentation boundary and verify ID-only references.
- Account for Astro's image layer so native image rules do not unexpectedly outrank documented overrides.
- Correct F01 and layer the visual-font author rule.
- Remove unnecessary gallery important declarations after resolving external precedence. Keep justified accessibility exceptions such as reduced-motion protection.
- Preserve public/admin isolation and ticker keyframes.

Acceptance:

- A real ID-only media reference fits its reserved frame; verify bounds and image containment under production CSS.
- Gallery margin/padding/width overrides behave as documented.
- Layer order works for component-first and global-first loading scenarios, or the shell guarantees ordering with an enforced test.
- Vendor exceptions are explicit; admin and reduced-motion behavior remain healthy.

### Phase 3 — CSS policy and trustworthy token maintenance

Scope:

- Add the contextual aliases without changing unrelated base values, palette, type or gutter calibration.
- Extend the existing `design:tokens` interface, rather than introducing a parallel configuration engine.
- Report authored values, dependencies, consumers and reference results at representative viewport/root-size inputs. Label unsupported evaluation as unverified rather than a pass.
- Validate a bounded grammar: supported base references, lengths, zero and simple proportional expressions. Detect missing references, cycles, invalid negatives and ambiguous declarations.
- Use reliable declaration targeting for layered CSS. Preserve unrelated declarations, comments and formatting.
- Reject unknown token names and wrong scopes. Distinguish changed, already-matching and rejected requests. Do not silently ignore a typo.
- Preview the complete candidate and affected contexts without writes. Validate before any source, record, exception or calibration mutation.
- When explicitly writing multiple derived outputs, keep them bound to the same validated CSS candidate. Do not calibrate the old on-disk stylesheet during a proposed change.
- Document that lane/space-scale generation is broad recalibration, not the tool for a narrow gap request.

Example command shape, usable once the aliases are declared:

```powershell
# Preview only
npm.cmd run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.8)"
# Explicit application
npm.cmd run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.8)" --write
```

Acceptance:

- Inspect/preview/apply/verify works for one context without unrelated changes.
- Misspelled, unsupported and invalid requests fail with actionable diagnostics and no partial writes.
- Every documented spacing control changes its intended computed relationship; test figure, quote, heading, list and base-flow controls, not just the four new aliases.

### Phase 4 — Automatic structural composition

Scope:

- Make ordinary Section padding and structural gaps local to that Section. Compact/none modes must not poison nested defaults.
- Give ordinary Container a vertical layout/content gap while preserving width and centering. Provide the explicit custom-layout escape hatch.
- Keep breakout containers on named tracks/subgrid; never turn them into ordinary flex stacks through a broad selector.
- Retain Grid's intrinsic variants/gap prop and automatic managed-grid gap. Keep Cluster/Sidebar ownership intact.
- Add needed HTML attribute/style passthrough without discarding IDs, ARIA, classes or existing styles. Normalize optional invalid values consistently with the primitives' resilience contract.
- Remove the structural block-child allowlist, layout cancellation rules and competing shell sibling margins from the new policy. Keep only the bounded compatibility behavior required for unmigrated sites.
- Test ordinary and custom row/grid layouts, responsive utility changes, nested defaults, zero values, single items and long unbroken content. Preserve intrinsic shrinking and reading order.

Acceptance:

- Standard Section/Container/content/Grid pages need no routine spacing classes.
- Each relationship has one owner; no gap-plus-margin compensation is required.
- Per-instance overrides do not leak, while intentional regional defaults work.
- Empty/optional items and hidden children have defined behavior. Do not hide editable empty nodes indiscriminately to remove gaps.

### Phase 5 — Editorial boundaries, route migration and editing

Scope:

- Separate structural collection lists from editorial lists. Keep real bullet/numbered indentation; keep listing titles, excerpts and metadata aligned with their container. Preserve accessible list semantics when markers are removed.
- Scope editorial rules to intentional content relationships. Do not propagate image/list/media styling into nested composites. Preserve controlled nested-list behavior.
- Isolate local flow calculations so nested flow initializes its own rhythm. Intentionally inherited public contextual controls remain supported.
- Resolve media spacing overrides, figure-plus-image double spacing, first/last media margins, media-to-media transitions and hidden-first-child cases.
- Keep RichText flow by default and article-body margin-only. Align both profiles' wrapperless/annotated opt-outs where practical; preserve breakout propagation.
- Handle empty RichText and optional slots deliberately. Distinguish public omission from editor-required placeholders/annotations.
- Migrate root routes, static overlays and specimens. Remove redundant structural flow wrappers and use explicit layout for inline dates/metadata.
- Replace DOM-sensitive shell padding inference with explicit ownership under the new policy. Preserve sensible compatibility for old callers.
- Review headings, unique naming targets, article/aside/list semantics and focus order. Do not add landmarks solely for spacing.
- Exercise real EmDash edit mode on disposable content: selection, actual injected wrappers, edit annotations, save, reload and resulting public render. Attribute inspection alone is not editing acceptance. Verify cache/edit/live configuration as applicable without introducing CMS dependencies into static profiles.

Acceptance:

- Listings align; editorial lists remain indented; component internals retain their own spacing.
- Nested flow and media boundaries obey the documented values without unwanted outer whitespace.
- All route archetypes preserve content, accessibility and metadata.
- Static/native Markdown and EmDash editing/public output each have explicit acceptance evidence.

### Phase 6 — Parsed gates and complete behavioral coverage

Scope:

- Replace brace counting and regex flow identification with CSS/selector-aware checks. Declare needed parser dependencies explicitly in applicable profiles.
- Inspect all authored CSS and Astro style inputs, including profile copies. Classify vendor/framework styles separately from owned author rules.
- Reject unlayered author rules, anonymous/incorrect layers and malformed CSS while retaining permitted at-rules and documented exceptions.
- Add mutation cases for comments, quoted braces, nesting, lookalike selectors, additional CSS files, missing/duplicate flow guards and duplicate/ambiguous token declarations.
- Render actual Section, Container, Grid and RichText components in fixtures. Test classes/props/styles and variable/utility precedence, including documented space-y interactions.
- Use resolved token values and bounding rectangles, not only positive-value assertions or source-string matches.
- Cover structural and editorial nesting, empty/hidden/optional content, composite isolation, responsive custom layouts, RTL logical indentation, overflow and real media geometry.
- Extend explicit 320px/text-spacing and actual zoom checks to representative public listing and article routes, not only the styleguide. Keep route-specific assertions where semantics/layout differ.
- Check horizontal geometry separately: shell versus breakout gutters, reading/wide tracks, narrow flex/grid minimums, focus outline visibility, and actual image placement versus `sizes`/selected source candidates.
- Keep browser/screenshot runs local-only. Source/unit/build checks may run in CI; do not add browser installation or screenshot comparison to CI or production builds.

Acceptance:

- All F01-F16 cases have an appropriate source, unit, rendered or manual acceptance check with honest applicability.
- Known false-pass mutations fail. Primitive fixtures assert their real API output.
- Public-page alignment and spacing cannot regress unnoticed behind a styleguide-only pass.
- No screenshot is updated automatically merely to make a test green.

### Phase 7 — Visual calibration and acceptance

Scope:

- Calibrate actual primitives on `/_styleguide`: hero/actions; introduction plus grid; multiple containers; same/contrasting-surface adjacent sections; article/support; nested compact/flush groups; breakout media; cards/tickers/disclosures inside content; empty/long content.
- Inspect narrow/intermediate/wide layouts, RTL, text spacing, actual 200%/400% zoom, keyboard paths, reduced motion and applicable no-JS behavior.
- Review public route archetypes as well as specimens, including lower-page content and footer alignment.
- Check practical content-to-content distance. Preserve additive section edges, but deliberately compose related groups instead of using extreme token changes to compensate for duplicate ownership.
- Review full images and diffs. Update only intentional baselines after visual assessment, preserving historical failure evidence where useful.
- Update `audit/component-calibration.md` with actual coverage, stylesheet hash, observed results, deliberate choices and remaining limits. Do not equate token contrast checks or screenshots with full accessibility conformance.

Acceptance:

- Ordinary compositions look properly spaced before overrides.
- Alignment, outer edges and component isolation are visually reviewed, not merely numerically positive.
- Calibration statements correspond to maintained assertions and actual observations.

### Phase 8 — Agent guidance, profiles, upgrade rehearsal and handoff

Scope:

- Update AGENTS, static profile guidance, design/native-composition documentation and applicable custom project-local skill references. Leave upstream mirror skills alone.
- Document the day-two decision tree: base scale for intentional global recalibration; contextual alias for site-wide relationship changes; component/variant for repeated-pattern changes; local override for a deliberate placement; diagnose competing owners before adding offsets.
- Include recipes: tighten grids without changing gutters; change section fluid bounds; make one card variant denser; disable one automatic spacing category; preserve editorial lists while styling collection lists.
- Describe exact commands, changed contexts, rendered samples and verification scope. Keep CSS authoritative and reports derived.
- Update package/script/test-tier inventories, profile manifests and fixtures where needed. Maintain zero CMS dependencies in generated static foundations and production exclusion of developer tools.
- Document and rehearse explicit adoption of new files/dependencies/scripts and site-owned Base/routes. Bounded sync does not add these automatically.
- Rehearse an older generated site with customized tokens and routes: stage/review upstream changes, preserve calibrated values, activate/migrate deliberately, verify, then demonstrate rollback. Never replace client values with starter defaults or exempt client code through starter hashes.
- Update justified exact design-gate hashes and review them with the implementation.

Final verification:

```powershell
npm.cmd run doctor
npm.cmd run verify
npm.cmd run build
npm.cmd run audit:html
npm.cmd run test:profiles
npm.cmd run test:visual
npm.cmd run test:visual:functional
```

Use `verify:fast` during edits. Build before auditing emitted HTML. Run independent generated-profile public-browser acceptance locally as applicable. The functional visual subset may be evidenced by the complete suite when the actual selection and outcomes are recorded; repeat only for a changed concern or failure. Use generated projects' installed commands rather than adding CMS tooling to satisfy an unavailable check.

Acceptance:

- Root and both profiles pass their applicable verification/build/release checks.
- Local rendered, CMS editing and downstream migration evidence is recorded separately, with any unverified browser/assistive-technology scope explicit.
- The implementation is reviewable as ordered commits/diffs; no unrelated content, branding, deployment, database transfer, commit or push is implied.
- Reconcile F01-F16 and every phase as implemented, verified or explicitly deferred before declaring completion.

## Implementation work orders W01-W12

These are the actionable units behind the eight phase summaries. Paths marked **new** are proposed artifacts, not existing files. A work order is complete only after its listed evidence exists. The implementation may split a work order into smaller commits, but must preserve the dependency order and finding coverage.

### W01 — Freeze contracts and build the actual caller manifest

Phase: 1. Depends on: this plan. Proposed commit: `docs(spacing): define automatic composition and migration contracts`.

Files:

- **New:** `audit/automatic-spacing-progress.md`, with W01-W12 state, current source revision, case IDs, commands/results, evidence paths and remaining limits.
- **New:** `audit/automatic-spacing-callers.md`, listing each real source caller and its chosen migration.
- This plan and `docs/native-composition.md` for the accepted API contract; do not change implementation yet.

Tasks:

1. Enumerate imports/classes with rg and inspect actual slot output, not just import counts. Include all root routes, the static route overlay, `Styleguide.astro`, `EmDashStyleguide.astro`, `CompositionSpecimens.astro`, Disclosure bodies and composite consumers.
2. Give each caller a row: path; current layout owner; current flow owner; list/media role; target mode; affected editor annotations; migration task; case ID.
3. Use a small proposed API: Section retains labelledBy/spacing and gains optional gap plus `layout="stack | custom"`; ordinary Container retains width/breakout and gains optional gap plus the same ordinary-layout switch; Grid retains minimum/gap. These are implementation targets, not already shipped props.
4. Define `breakout` as its existing editorial-grid mode: it does not gain the ordinary flex stack. Document the outcome of incompatible inputs and normalize malformed enum/gap values rather than crashing.
5. Define policy activation through a SiteShell prop passed by the site-owned Base, emitting `data-spacing-policy="automatic-v2"` on the public document root. Default shared-shell behavior for callers that have not opted in remains the documented compatibility policy. Both new-profile Bases and the root Base opt in during migration. The styleguide activates its own specimen policy explicitly.
6. Capture a fresh root baseline with doctor/verify and note available local public content. An empty DB is a fixture/setup condition, not a refactor regression. Do not reseed or overwrite working content merely to simplify tests.

Done when: every known caller has a target mode, proposed public API/precedence is written down, and compatibility activation is testable without adding imports of unavailable new files to old sites.

### W02 — Repair vendor precedence and media geometry

Phase: 2. Depends on: W01. Closes: A01, A04, the current unlayered rule in A05.
Proposed commit: `fix(css): restore media geometry and bounded vendor precedence`.

Files:

- `src/components/EditorialImage.astro`, `PhotoGallery.astro`, `EmDashImage.astro` and `src/lib/image-source.ts` only where the chosen fallback needs them.
- `src/styles/global.css`, `src/layouts/SiteShell.astro`, `src/dev/visual-fonts.css`.
- `astro.config.mjs` only if a reliable build boundary is actually required.
- `tests/visual/setup.mjs`, `tests/visual/primitives.spec.mjs`, `tests/visual/spacing.spec.mjs`; `tests/presentation-boundaries.test.mjs` for applicable compilation/attribute coverage.

Tasks:

1. Build once and inventory CSS assets actually linked by representative public routes; classify EmDash, PhotoSwipe, Astro image and owned author rules. Store generated names in the receipt, not in maintained assertions.
2. Verify whether vendor CSS can be layered at its real import/build boundary without rewriting EmDash admin styles. Choose this only if dev/build behavior is supported and stable under the installed tooling.
3. If that boundary is unreliable, use owned fallback presentation for ID-only images through the supported media/storage API. Verify the API against installed EmDash/docs; do not infer media DB table shapes. Do not combine a fragile transform with another specificity patch.
4. Establish ordered layers before owned rules become active. Classify any framework layer explicitly. Verify actual generated head/style ordering and utilities, including a synthetic component-first ordering case.
5. Review each gallery important declaration individually. Remove redundant ones; retain an exception only with its precise external conflict and a test. Make no changes to third-party source files under node_modules.
6. Wrap the authored visual-font override in the appropriate named layer; preserve fixture-only font activation and allowed font-face imports.
7. Add V01 and V06 using real rendered components. Recheck lightbox keyboard/focus, caption bounds, reduced motion and no-JS image links after CSS changes.

Done when: the fallback regression is reproduced by a maintained test and fixed in both serving modes, gallery precedence is honest, and there is no public/admin or accessibility regression. Record the selected vendor/fallback approach and why the alternative was rejected.

### W03 — Replace false-pass source and audit checks

Phases: 2 and 6. Depends on: W01; does not depend on broader layout migration.
Closes: scanner portion of A05 and A06. Proposed commit: `test(css): parse layer and flow contracts without regex false passes`.

Files:

- **New:** `scripts/css-contracts.mjs`, a pure reusable parser/analysis helper.
- **New:** `scripts/check-css-contracts.mjs`, a bounded local CLI for applicable author inputs.
- **New:** `tests/css-contracts.test.mjs`, portable positive/mutation cases.
- `tests/design-workflow.test.mjs`, removing the superseded brace-counting assertions without removing meaningful behavior coverage.
- `scripts/audit-design-system.mjs`, `tests/audit-modernize.test.mjs` (or the existing test that owns this rule).
- `package.json`, `package-lock.json`, `tests/test-tiers.json` for the explicit parser dependencies, command and unit classification. Profile distribution is completed by W11.

Tasks:

1. Use a declared CSS parser and selector parser; do not rely on an incidental transitive installation. Report syntax failures with source path/line and remediation.
2. Discover standalone author CSS and Astro style blocks under applicable source roots and profile overlays. Ignore strings/comments that resemble style tags by using a suitable Astro/source extraction method, not another unrestricted regex approximation.
3. For every normal rule, inspect layer ancestors and permitted names. Distinguish keyframes/font-face/property/framework/vendor provenance from author selectors. No wildcard exemption for a directory or all emitted CSS.
4. Preserve equivalent valid selector strategies; reject the actual missing/misplaced rules. Implement M01-M10.
5. Make the design audit understand both supported legacy flow and the new one-sided editorial strategy. Do not require a literal old guard after its purpose is achieved differently. Keep advisory versus required semantics intact and unsupported input honest.
6. Wire the source check into verify:fast and verify at an appropriate point, keeping browser work out of CI. Make the applicable shared check work without CMS installation.

Done when: all demonstrated false passes fail, valid alternative formatting/nesting passes, and errors identify the actual location rather than requiring source-text conformity.

### W04 — Implement scoped structural defaults and local overrides

Phase: 4. Depends on: W01, W02, W03 and the alias declaration portion of W06.
Closes: A02; structural portion of A03. Proposed commit: `feat(layout): complete scoped automatic section and container spacing`.

Files: `src/styles/global.css`; `Section.astro`, `Container.astro`, `Grid.astro`, `Cluster.astro`, `Sidebar.astro`; `SiteShell.astro` policy plumbing; shared attribute/style helper only if actually needed and explicitly inventoried; spacing fixtures/tests.

Tasks:

1. Scope changed defaults to the activated public policy using zero-specificity contextual selectors. Preserve the compatible behavior of unactivated callers; isolate that compatibility section for eventual explicit retirement.
2. Initialize each component's local values from the four site aliases. Section compact mode selects the existing compact token; none sets only its own padding to zero. Keep gap independent. Set stack display/direction/gap only for the ordinary stack mode.
3. Keep standard Container width/centering and introduce content gap. Keep breakout tracks/subgrid unchanged by ordinary-stack rules. The custom-layout mode must not silently retain a content/container gap.
4. Preserve Grid's intrinsic variants and gap prop. Test default aliases, gap prop, passed style and actual gap utility precedence. Managed raw grid classes receive the grid default within the policy; inspect responsive changes and custom column definitions.
5. Preserve Cluster and Sidebar's internal layout contracts. Do not assign the container/content gap to their descendants through an ancestor selector.
6. Add HTML attribute passthrough, with class/style merging tested for both supported string and object inputs. Preserve slot ownership and IDs/ARIA. Unknown enums use a safe default; non-string/empty optional gap input is handled consistently.
7. Remove new-policy child allowlists, margin cancellation rules and implicit shell spacing. Add V02-V05 including full-mode cross products, intentionally scoped site defaults and local-zero cases.

Done when: new-policy normal composition is automatic, nested primitives use their own defaults, compatibility callers do not acquire flex layouts, and no structural relationship relies on cancelling an inherited margin.

### W05 — Isolate editorial flow and align RichText contracts

Phase: 5. Depends on: W02 and W03; integrate with W04 before route rollout.
Closes: F10-F13, F15 and editorial behavior implicated by F09.
Proposed commit: `fix(content): bound editorial spacing and nested flow state`.

Files: `src/styles/global.css`; root and static-overlay `RichText.astro`; `Disclosure.astro`; editorial rendering adapters only where actual output requires them; `src/dev/styleguide-prose.md`, `src/dev/emdash-styleguide-fixtures.ts` and maintained browser fixtures.

Tasks:

1. Split generic sibling rhythm from editorial descendant presentation. Use an explicit editorial-root marker, proposed `data-editorial-content`, on automatic RichText wrappers. Generic structural flow must not indent lists or put margins on arbitrary nested images.
2. Implement media/list presentation on owned editorial relationships, not all descendants under a distant ancestor. Verify the actual rendered nested-list tree; use controlled paths or editorial list rendering markers, not a blacklist of every component class.
3. Keep public contextual settings intentionally inheritable. Calculate each child's effective spacing locally so quote/list/heading calculation state does not leak into a nested flow root.
4. Prefer internal one-sided sibling spacing for the outer editorial sequence. Define first/last/only-block edges and figures/captions, tables/wrappers, quotes, and media-to-media transitions. An image inside a figure does not independently receive the outer figure margin.
5. Ensure figure/blockquote/list/heading/item overrides are used by the final effective declaration. Do not expose a control that a later shorthand overrides.
6. Implement default, wrapperless opt-out, attributed opt-out and custom-class behavior in both RichText profiles. `flow=false` does not silently retain automatic editorial-spacing classes/markers; caller attributes must still reach a wrapper when required.
7. Define empty-input output separately from editing placeholders. Avoid empty public layout items where optional content is absent; do not strip a node required for real field editing. Check native Markdown whitespace/comments and CMS empty values.
8. Ensure Disclosure's default editorial body does not double-own RichText spacing. Preserve its script-free usable disclosure and live expanded state.

Done when: V08-V13 pass with real components and both content renderers, prose still has readable list/media rhythm, and component internals are unchanged by where the component is placed.

### W06 — Make contextual configuration and token writes trustworthy

Phase: 3. Depends on: W01 and W03 parser support. Alias declarations precede W04; full effective-value proofs integrate after W05.
Closes: F14 and the maintenance-control portion of F11.
Proposed commit: `feat(tokens): expose validated contextual spacing maintenance`.

Files: `src/styles/global.css`, `scripts/design-system.mjs`, `tests/design-workflow.test.mjs`, `tests/token-coverage.test.mjs`, `tests/fluid-tokens.test.mjs`, `tests/design-interchange.test.mjs`, `docs/design-framework.md`; optional dedicated token CLI test if warranted, with a tier entry.

Tasks:

1. Declare the four aliases using the current neutral values. Do not use the CLI to invent undeclared aliases while its behavior only updates existing declarations.
2. Parse/target exact intended token scopes. Reject unknown/misspelled names, duplicate ambiguous declarations and wrong namespace requests. Already-equal known values are an explicit no-op, not an error or a claimed modification.
3. Add a bounded dependency resolver with cycle/missing-reference diagnostics. Reuse existing fluid evaluation where valid; unsupported expressions remain unverified. Validate zero, supported positive length values and proportional calculations without claiming universal CSS evaluation.
4. Expose context values/consumers through the existing JSON output and a readable spacing report. Distinguish changed relationship scope from all transitive consumers; do not claim a complete downstream site inventory from scanning the starter.
5. Construct and validate the complete candidate before writing CSS, AGENTS records, exceptions or calibration. Audit all relevant candidate checks; the current early record write and old-source calibration path must not survive this workflow.
6. Keep preview read-only even when output/report flags are combined, unless a specific output-write mode is explicitly requested and clearly documented. Calibration of a preview must be labeled proposed or refused rather than masquerading as saved-source evidence.
7. Preserve unrelated source formatting and custom calibrated values. Provide expected/received errors, token paths and affected contexts. Implement T01-T06.

Done when: the command cannot silently ignore an instruction, invalid requests leave exact bytes intact, and saved CSS/calibration share a source hash. Day-two examples work on an independent generated profile as well as the root.

### W07 — Migrate public routes and remove shell ambiguity

Phase: 5. Depends on: W04 and W05. Closes: route portion of A03, F09 and F16.
Proposed commit: `refactor(pages): adopt automatic contexts and aligned collection lists`.

Files:

- Root `src/pages/index.astro`, `posts/index.astro`, `category/[slug].astro`, `tag/[slug].astro`, `[slug].astro`, `posts/[slug].astro`, `404.astro`.
- `src/layouts/Base.astro`, `src/layouts/SiteShell.astro`.
- `profiles/static/project/src/layouts/Base.astro` and its index/posts/post/404 route overlays.
- Styleguide, EmDashStyleguide and CompositionSpecimens consumers.

Tasks:

1. Apply the W01 caller manifest rather than broad text replacement. Activate the new policy from each site-owned Base; preserve metadata/head/body slots.
2. Use a named structural collection-list class/recipe for home/posts/category/tag lists. Keep a native list and explicit accessibility treatment where necessary; reset editorial indentation at its source rather than adding per-excerpt negative offsets.
3. Remove redundant flow ownership on ordinary stacked Containers. Retain explicit editorial flow on handwritten prose and use actual layout wrappers for metadata/actions.
4. Ensure date and taxonomy groups have appropriate block/row spacing for present/absent fields. No hardcoded date examples in product output and no new CMS schema for a presentation concern.
5. Use Section landmarks only for meaningful groups. Preserve one main landmark, meaningful IDs and heading order, article/aside ownership, content order, SEO metadata and live field attributes.
6. Remove new-policy shell sibling margins and structural :has inference. Provide an explicit documented layout for any non-section page that previously depended on shell fallback. No spacer elements.
7. Add route assertions V07/V12/V14. Home/posts/category/tag should align title/excerpt/date to the listing container at each tested width, not to an arbitrary viewport pixel copied from the old baseline.

Done when: all caller rows are migrated, no route relies on shell DOM inference, and real listings retain semantics and alignment without losing prose list indentation elsewhere.

### W08 — Build maintained geometry, public-route and horizontal tests

Phase: 6. Depends on: W02-W07 as relevant. Closes: A07 proof gap and additional coverage risks.
Proposed commit: `test(layout): cover automatic spacing across components and public routes`.

Files: `tests/visual/setup.mjs`, `spacing.spec.mjs`, `primitives.spec.mjs`, `behavior.spec.mjs`, `composition.spec.mjs`; `tests/visual/contract.mjs` only where fixture identity genuinely changes; `tests/presentation-boundaries.test.mjs`; shared developer specimens and profile integration checks where applicable.

Tasks:

1. Implement V01-V15 below with actual primitive imports. Put synthetic cases in the owned temporary fixture tree or production-hidden developer specimens; never ship fixture pages or fake writable editor IDs.
2. Resolve expected token values independently in reference elements. Use approximately one CSS-pixel tolerance for intended geometric equality, with a tighter justified tolerance for zero values; do not compare unresolved var strings.
3. For each override, assert the resulting box distance as well as the relevant computed property where collapse, inline formatting or layout gaps can change the visible result.
4. Measure horizontal edges relative to the intended container/track. Test shell+Container+breakout nesting without assuming two gutters are always wrong; distinguish intended full-safe content from unintended double inset.
5. Exercise public listing and article routes at 320/390 and wide placement; include actual browser zoom and text spacing. Reuse the real zoom mechanism rather than substituting viewport resizing.
6. Check loaded/decoded image output, reserved geometry, natural dimensions and sizes/currentSrc suitability. Record engine, DPR and placement. Treat resource-selection checks separately from spacing assertions.
7. Verify long text/minimum sizing, focus outlines and RTL logical edges. Keep script/no-script/print/motion cases already maintained unless a scoped applicability reason is recorded.
8. Preserve local-only policy and cleanup. Update a fixture identity only with corresponding contract/readiness checks, not to bypass baseline comparison.

Done when: the matrix runs at applicable viewports/profiles, every skipped cell has a reason, and the report distinguishes CSS properties, actual geometry, screenshots and application interaction.

### W09 — Verify real editor behavior without touching working content

Phase: 5 acceptance and Phase 8 delivery. Depends on: W05 and W07.
Proposed commit boundary: include supporting fixture code with the owning content/layout change; keep evidence distinct from a claim of general CMS certification.

Files: an existing disposable CMS rehearsal/visual harness where suitable, plus `audit/automatic-spacing-progress.md` and the calibration evidence index. Do not copy working DB, credentials or private media into test artifacts.

Tasks:

1. Seed a disposable public page/post with headings, nested lists, empty editable text, ID-only media and a breakout example where supported.
2. Enter the actual editor, verify selection/field target and injected wrappers, modify content, save, reload editor and public page, and verify persisted content and layout.
3. Check that gap/flow rules neither create editor-only blank spaces nor hide empty edit targets or duplicate field identities.
4. Record API/content-write versus actual editor-save evidence separately. If editor access is unavailable, report E01 unverified with the specific missing prerequisite; do not close it through attribute/source checks.

Done when: E01 has real saved/reloaded evidence or an explicit unresolved acceptance status. Static profiles report this CMS-specific case inapplicable and still prove native Markdown behavior.

### W10 — Review visual quality and synchronize calibration claims

Phase: 7. Depends on: W07-W09 applicability and W08 results.
Proposed commit: `docs(design): record reviewed automatic spacing calibration` with any approved screenshot changes.

Files: common developer styleguide/specimens, `audit/component-calibration.md`, applicable `tests/visual/baselines/win32` images/manifest, progress/evidence index.

Tasks:

1. Inspect all compositions listed in Phase 7 and actual listing/article/footer output. Prioritize alignment, section pacing, image containment, meaningful grouping and lower-page content.
2. Critique the rendered outcome using local Impeccable guidance, preserving the neutral starter identity. Fix defects in primitives or shared rules, not specimen-only override CSS.
3. Compare changed captures against both intended behavior and previous output. Do not accept the 24px listing indentation merely because a new golden matches it.
4. Record each intended baseline change and its reason. Keep failures and before/after evidence inspectable. Re-run relevant checks after fixes, then finalize hashes and statements.

Implementation review additions (2026-10-20): rendered captures exposed crowded footer widgets and duplicate article/footer rendering of the same area (R01). Keep Base as its single owner, preserve CMS configuration and add grouped spacing with the existing intrinsic grid. The real editor rehearsal also exposed a client chunk initialization failure (R02): a generic forced vendor split constructed ProseMirror history before PluginKey initialized. Remove that generic split, retain entry ownership and require actual editor save/reload evidence. These findings extend W09/W10; neither is accepted through screenshot matching alone.

Done when: visual concerns are resolved or explicitly deferred, every calibration claim names its proof, and screenshot updates reflect reviewed decisions rather than broad baseline regeneration.

### W11 — Ship the same contract in both profiles and rehearse upgrades

Phase: 8. Depends on: W03-W10.
Proposed commit: `feat(profiles): distribute automatic spacing checks and safe adoption`.

Files: `profiles/manifests/shared.json`, applicable static/Sveltia manifest/overlays, `profiles/file-inventory.json`, `profiles/contract.mjs`, `scripts/init-profile.mjs` only if the generator contract changes, `scripts/sync-baseline.mjs` only if its bounded update behavior actually changes, profile tests, root/shared package metadata, upgrade documentation.

Tasks:

1. Explicitly inventory every added helper/test/document/script and direct development dependency. Ensure new imports have their complete closure in an independently installed generated project.
2. Keep the parser/source checks portable and CMS-free. Sveltia has the same public spacing contract and unchanged content ownership/auth setup.
3. Generate both profiles independently; verify their real scripts, build/release isolation, fixture rendering and public browser behavior locally. Do not treat shared node_modules as an independent-install proof.
4. Rehearse an older generated project with existing width-only Containers, flow classes, customized token values and a client-owned Base. Update eligible shared files without activating v2; confirm its existing behavior first.
5. Rehearse the explicit migration: install reviewed additions, update only the relevant route/Base compositions, preserve site values, enable the policy, run checks and review output. Demonstrate reverting activation and related route changes restores compatibility behavior.
6. Confirm partial sync/conflicts cannot be mistaken for complete adoption. Older synchronization helpers cannot be assumed to honor new metadata; document their actual limits rather than claiming a guard they do not possess.

Done when: both clean generated sites and the customized upgrade/rollback pilot have recorded outcomes; no CSS values, client routes or provenance receipts are silently replaced.

### W12 — Finish agent recipes and close the evidence register

Phase: 8. Depends on: all applicable work orders.
Proposed commit: `docs(agents): document spacing maintenance and verified migration`.

Files: root and profile `AGENTS.md`; `docs/design-framework.md`, `docs/native-composition.md`, `docs/baseline-updates.md`, optional focused upgrade guide; project-local Astro/impeccable workflow references only where useful; calibration/progress/exception records.

Tasks:

1. Document the API, policy activation, local versus scoped inheritance, editorial boundary, compatibility mode, and intentionally unsupported combinations. Preserve source authority in CSS rather than duplicating editable values in prose.
2. Provide executable command examples with known token names for global context changes, and markup examples for local/custom layout overrides. Show the expected diff scope and browser samples for each day-two recipe.
3. Explain that gap and space-y utilities control different relationships, empty editable nodes require care, and a successful token update is not rendered acceptance.
4. Run the final command sequence in Phase 8 against fresh artifacts; inspect cleanup, profile results and untracked files. Refresh only legitimate exact infrastructure exceptions and review their diff.
5. Reconcile A01-A07, F01-F16, V01-V15, M01-M10, T01-T06 and E01 in the progress register. Do not mark unverified editor/browser cases complete. Record platform limits and commands actually run.

Done when: another agent can apply a narrow client spacing request with the correct control, limited diff and appropriate proof, and every finding has a verifiable outcome.

## Behavioral and mutation case matrix

Reference values below come from the active configured tokens. Historical 24/36/144px observations are reproduction evidence, not universal fixed expectations.

| Case | Fixture/action | Required result |
| --- | --- | --- |
| V01 | Actual EditorialImage with real ID-only seeded media, local frame at narrow/wide widths | Successful load, intended inner margins and frame containment; preserve alt/link; dev and built CSS agree |
| V02 | Section parent/child section/content/none 3x3 matrix; nested grid and scoped context | Each child matches its own mode; local values do not leak; scoped site context intentionally applies |
| V03 | Two and three adjacent Sections; same/different surfaces; later none mode | Only declared section edges/gaps; no extra shell-owned margin; compatibility mode separately verified |
| V04 | Section with two Containers; Container with heading/text/actions; one/empty/custom child cases | Container/content gap follows the right context exactly once; no allowlist dependence |
| V05 | Grid gap prop/style/utility; raw managed grid; Cluster/Sidebar; custom row/grid and responsive utility changes | One appropriate gap; correct utility precedence; no child compensation margins; custom mode relinquishes defaults |
| V06 | Real gallery/image output plus margin/padding/width/gap utility probes | Overrides promised by contract work; justified geometry, captions, lightbox focus and no-JS links remain healthy |
| V07 | Home/posts/category/tag populated and empty listings; real prose lists in a separate fixture | Listing edges align with their container; bullet/numbered/nested list indentation and accessible list semantics remain intentional |
| V08 | Card, LogoTicker, Disclosure and gallery inside an editorial host; image inside a figure | No unrequested margins/padding on component internals; component's own gaps and image bounds unchanged by host placement |
| V09 | Change each heading/list/item/figure/quote/base-flow control independently, including a distinctive non-default value | Intended visible relationship changes; unrelated relationships remain; final shorthand does not erase the requested value |
| V10 | First/last/only media, media-to-media, hidden-first sibling, nested quote/flow | No unintended outer rhythm; no duplicate figure/image space; nested flow uses its own baseline and intentional public settings |
| V11 | RichText default, false without attrs, false with attrs/classes; root CMS and static Markdown; breakout placement | Wrapper semantics match documented contract, attributes persist and grid track propagation remains valid |
| V12 | Post/page/list metadata with date/excerpt/taxonomy present/absent | Visible metadata separation comes from layout, not ineffective inline margins; no empty wrappers with unintended gap |
| V13 | Empty RichText/value/slot, comments/whitespace, optional wrapper before/between/after content; real edit placeholder | No unintended public gap; editor-required targets remain selectable; no blanket hide rule |
| V14 | Public listing/article plus styleguide at 320px text spacing and actual 200%/400% zoom; 390/intermediate/wide and RTL | No unintended page overflow or lost controls; alignment/readability holds; actual zoom API/DPR evidence remains distinct from reflow |
| V15 | Shell + ordinary/breakout Container, reading/feature/wide/full-safe media, long content and focused links | Intended gutter/track bounds, no accidental double inset/clipping, visible focus and suitable image resource delivery |
| M01 | Quoted closing/opening braces followed by outside selectors | Unlayered author rule detected at the correct source location |
| M02 | Comments and strings containing selector/layer-looking text | No false rule/guard detection |
| M03 | Anonymous/wrong layer and valid base/components nested at-rules | Invalid ownership fails; valid nesting passes |
| M04 | New standalone CSS file and profile overlay violation | Discovery and profile checks include the new applicable input |
| M05 | Allowed keyframes/font-face/property plus malformed CSS | Allowed forms pass; syntax failures are actionable; no directory exemption |
| M06 | Imported author style and classified vendor/framework style | Author contract enforced through supported imports; third-party boundary documented rather than hidden |
| M07 | Missing real guard plus `.flow-legacy` lookalike | Cannot produce a passing real-flow guard result |
| M08 | Duplicate valid flow definitions across layers | Duplicate conflict is detected or reported according to audit policy |
| M09 | Valid supported legacy guarded flow and revised one-sided flow | Both are evaluated semantically; obsolete source spelling is not required |
| M10 | Unsupported/ambiguous flow strategy | Honest unverified/warning outcome, never a false pass |
| T01 | Unknown/misspelled key, wrong scope, known equal key | Unknown/wrong requests fail without writes; intentional equal value is a reported no-op |
| T02 | Missing ref, cycle, unsupported expression, invalid negative, valid zero/proportional value | Bounded resolver gives correct pass/fail/unverified result with dependency/source diagnostics |
| T03 | Invalid candidate with record/calibration/write-related flags | All source/record/exception bytes remain unchanged |
| T04 | Valid preview versus explicit write | Preview has no mutations; written diff is the intended declaration set with preserved unrelated source |
| T05 | Write plus calibration; preview plus calibration request | Saved evidence uses saved candidate hash; proposed evidence is clearly marked or refused, never old-source certification |
| T06 | Alias change compared with base-scale/lane operation | Narrow context request affects only its intended configuration; report explains broader operations without invoking them |
| E01 | Disposable actual CMS field selection, edit, save, editor reload and public reload | Stored values, edit targets and rendered spacing verified; API-only writes or attributes cannot substitute |

## Delivery dependencies and completion ledger

Suggested integration order: W01 -> W02 -> W03 -> W06 alias/CLI foundation -> W04 -> W05 -> W07 -> W08 -> W09 -> W10 -> W11 -> W12. W06's effective-value browser checks complete with W05/W08. This ordering is intentional: W03 provides trustworthy parsed checks before broad edits, and the defects receive targeted regression tests with their fixes rather than waiting for W08.

Do not let the implementation expand into a new token framework, site redesign, CMS schema migration or general vendor/admin CSS rewrite. If a prerequisite invalidates a chosen approach, record the concrete evidence, revised bounded approach and affected acceptance cases before proceeding.

The progress register must retain this closure mapping:

| Original audit finding | Individual observations | Work orders | Minimum closure evidence |
| --- | --- | --- | --- |
| A01 P0 image fallback | F01 | W02, W08 | V01, emitted CSS classification, loaded actual media geometry |
| A02 P1 nested Section inheritance | F02 | W04, W08 | V02 all mode pairs and local/scoped override tests |
| A03 P1 competing spacing ownership | F03 | W04, W07, W08 | V03-V05 plus documented gap/space-y/none behavior |
| A04 P1 important gallery defaults | F04 | W02, W08 | V06 and preserved gallery interaction/geometry checks |
| A05 P1 unsound layer gate | F05-F06 | W02, W03, W11 | Current violation fixed, M01-M06 and independent profile check distribution |
| A06 P1 false-pass audit regex | F07 | W03 | M07-M10 and preserved audit status semantics |
| A07 P2 overstated calibration | F08 | W08, W10 | Actual component tests linked to corrected calibration claims |
| Later findings | F09-F16 | W05-W08 | V07-V13, T01-T06 and route/content renderer assertions |
| Additional acceptance risks | Empty content, editor mode, public resize, horizontal geometry | W08-W11 | V13-V15, E01 and upgrade pilot evidence |

For each row, record: implementation revision/diff, tests/commands and actual result, evidence path where retained, applicable profiles/viewports, remaining limitation, and final status. A phase label, source substring, screenshot filename or historical pass count is not closure evidence.

## Ready-to-begin checkpoint

The agreed direction is automatic defaults, CSS authority, an existing-CLI maintenance workflow, bounded component contexts, and explicit upgrade safety. The original seven audit findings are preserved in A01-A07 and mapped to work orders and closure evidence; later findings and acceptance risks are separate. Implementation was authorized after this plan was expanded; follow the progress register for actual completion. Commit between phases as requested, without pushing or deploying.
