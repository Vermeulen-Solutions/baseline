# Automatic spacing and native composition calibration

Reviewed: 2026-10-20. Scope: reusable neutral Baseline, shared Astro primitives and the Node/SQLite public renderer. Existing colors, fonts, fluid scales and radii remain the visual authority. Site-specific art direction remains a separate task.

## Accepted ownership

| Relationship | Owner | Configuration |
| --- | --- | --- |
| Section block edges | Section | --layout-section-padding; content/none padding modes |
| Section children | Section stack | --layout-container-gap; gap prop or local --container-gap |
| Ordinary Container children | Container stack | --layout-content-gap; gap prop or local --content-gap |
| Grid tracks | Grid / managed grid | --layout-grid-gap; gap prop or local --grid-gap |
| Editorial blocks | RichText / explicit editorial boundary | One-sided flow; heading/list/item/figure/quote controls |
| Public horizontal gutters | SiteShell main | --spacing-container, paid once inside breakout tracks |
| Composite interiors | Card, Disclosure, Gallery, Ticker, Cluster, Sidebar | Their own primitive contract; editorial scopes stop at islands |

SiteShell defaults to legacy. The site-owned Bases explicitly enable automatic-v2. Custom layout mode relinquishes automatic display/gap. None padding does not erase child gaps. A gap utility replaces a layout gap; a margin utility controls a margin. The named breakout grid retains its tracks/subgrid; it is not converted into a flex stack.

## Rendered decisions

- The home/posts/category/tag listing is structural content. Heading, linked title, excerpt and date share the container edge. Removing the editorial ancestor and using a named native collection-list recipe fixes the observed side inset without negative offsets. Markerless lists retain explicit list roles for Safari semantics.
- Dates occupy a block in the article stack. RichText has one editorial boundary, independent of article metadata. Empty public values/slots do not create extra flex items; query-attached empty editor targets are retained.
- Owned image frames avoid nested vendor figures and vendor image class collisions. Real ID-only uploaded media loads through supported CMS repository/runtime APIs. Gallery margins/padding/image width/gap can yield to utilities without important declarations.
- Native scope keeps nested prose lists readable while protecting Card, Gallery, Ticker and Disclosure interiors. Each direct child resets private flow calculation state, so a quote/media interval cannot become a nested paragraph default. Each documented public prose control is checked with a distinctive 67px value.
- Final review caught Tailwind's reset still hiding editorial list markers. `list-style: revert` now restores default bullets/numbers inside the bounded editorial scope. Utility overrides and composite list isolation remain intentional. Maintained CMS/native/profile browser assertions check markers as well as indentation; custom marker types remain caller-owned CSS.
- Public main owns gutters. A breakout grid inside it no longer adds a second gutter; standalone breakout grids retain their own safe tracks. Lazy responsive images use actual rendered size with a fallback hint. Eager callers retain their authored placement hints.
- Rendered review exposed crowded widget content and duplicate article/footer use of the same CMS area. Base remains the single owner of the existing sidebar-named area, rendered in the footer. The duplicate article aside is removed; CMS settings/content are preserved. The area uses the existing intrinsic grid and bounded internal groups, with separation between category counts and recent-post dates. This is an explicit refinement of the earlier caller inventory's preserve-aside assumption.
- Full and targeted captures retain neutral section pacing, native disclosure markers, dark focus, wrapped actions, RTL reading order, constrained media, readable captions and visible form focus. An empty starter homepage still fills the available viewport; no filler content is introduced to disguise its size.

Manual inspection opened narrow home/article captures, intermediate home, wide composition-open, gallery-open and controls-focus images. The full suite checks all public routes and styleguide states at 390/768/1440. Additional geometry cases explicitly cover 320/390/1280. Source changes and candidate baselines are reviewed together before the phase commit.

## Maintained proof

| Cases | Actual implementation exercised | Evidence |
| --- | --- | --- |
| V01/V06 | Uploaded media by ID only, native frame and real Gallery output; emitted-DOM utility probes | spacing.spec.mjs; dev loading receipt; built geometry and preserved image link/alt |
| V02-V05 | Imported Section/Container/Grid, all nine mode pairs, local/scoped overrides, style/attribute merges, custom/breakout/raw grid | Real-primitives browser test; legacy raw fixture remains separately labelled |
| V07/V12 | Actual home/posts/category/tag and welcome article; four actual empty routes in a fresh DB | spacing.spec.mjs; empty-listings.mjs; widget area count |
| V08-V13 | CMS RichText and the copied real static RichText, nested lists, six independent controls, composites, hidden/only/empty content and opt-outs | Editorial browser test; no fixture-only repair stylesheet |
| V14/V15 | Public 320px text spacing, actual 200/400% zoom API + viewport + DPR, gutters/tracks/focus and selected image rendition | Attached JSON measurements; existing no-JS/RTL/gallery/controls journeys |
| M01-M10 | Parsed CSS/Astro inputs and supported flow strategies, adversarial names, partial guards, duplicates and syntax errors | css-contracts.test.mjs; installed check:css in each profile |
| T01-T06 | Exact scopes, bounded resolution, typo/no-op, read-only preview and saved-candidate calibration identity | spacing-tokens.test.mjs |
| E01 | Actual CMS field selection, typing, save, editor/public reload and empty field | Separately recorded editor-rehearsal receipt; never inferred from source attributes |

Execution counts, source revisions, phase commits, profile/upgrade checks and the final E01 outcome are recorded in [implementation progress](automatic-spacing-progress.md). Older calibration counts and raw-section assertions are superseded by this register. Token arithmetic, geometry assertions, screenshot comparison and editor writes are distinct evidence.

## Cascade and applicability

Authored rules belong to base/components; utilities remain later. The document establishes theme/base/vendor/astro/components/utilities order before imports. PhotoSwipe has an explicit vendor import boundary. The source check parses owned CSS/Astro, standalone files, overlays and supported local imports; it does not certify arbitrary third-party/admin/plugin CSS. Computed-style and media checks verify the rendered public boundary.

Manual assistive-technology announcements, Firefox/WebKit, physical devices, provider/Workers rendering and remote Sveltia authentication remain outside these local receipts. Native summary is not a heading-navigation guarantee. The synthetic pinned-font screenshots do not certify a future client's brand font or art direction.

## Token Calibration

- **Source stylesheet:** `C:\dev\emdash-baseline\src\styles\global.css`
- **LF SHA-256:** `735a233f3d62815611945b43fe138c59e1065e99beb5239ce52686da09e58db8`
- **Validation status:** `PASS` (14 WCAG contrast pairs, 31 `@theme` tokens, 11 `:root` tokens)

### WCAG Relative Luminance Contrast Matrix

| Pair | Foreground | Background | Ratio | Minimum | Status |
| --- | --- | --- | --- | --- | --- |
| `default:text-on-page` | `--color-text` (`oklch(24% 0.02 260)`) | `--color-page` (`oklch(99% 0.004 250)`) | **15.99:1** | 4.5:1 | PASS |
| `default:text-on-surface` | `--color-text` (`oklch(24% 0.02 260)`) | `--color-surface` (`oklch(100% 0 0)`) | **16.45:1** | 4.5:1 | PASS |
| `default:muted-on-page` | `--color-muted` (`oklch(46% 0.02 260)`) | `--color-page` (`oklch(99% 0.004 250)`) | **6.92:1** | 4.5:1 | PASS |
| `default:muted-on-surface` | `--color-muted` (`oklch(46% 0.02 260)`) | `--color-surface` (`oklch(100% 0 0)`) | **7.12:1** | 4.5:1 | PASS |
| `default:on-action-on-action` | `--color-on-action` (`oklch(100% 0 0)`) | `--color-action` (`oklch(43% 0.14 250)`) | **8.02:1** | 4.5:1 | PASS |
| `default:action-on-page` | `--color-action` (`oklch(43% 0.14 250)`) | `--color-page` (`oklch(99% 0.004 250)`) | **7.8:1** | 3:1 | PASS |
| `default:link-on-page` | `--color-link` (`oklch(43% 0.14 250)`) | `--color-page` (`oklch(99% 0.004 250)`) | **7.8:1** | 4.5:1 | PASS |
| `default:link-on-surface` | `--color-link` (`oklch(43% 0.14 250)`) | `--color-surface` (`oklch(100% 0 0)`) | **8.02:1** | 4.5:1 | PASS |
| `dark:link-on-surface` | `--color-link` (`oklch(76% 0.13 250)`) | `--color-surface` (`oklch(18% 0.02 260)`) | **8.79:1** | 4.5:1 | PASS |
| `light:link-on-surface` | `--color-link` (`oklch(43% 0.14 250)`) | `--color-surface` (`oklch(100% 0 0)`) | **8.02:1** | 4.5:1 | PASS |
| `default:focus-on-page` | `--color-focus` (`oklch(52% 0.18 250)`) | `--color-page` (`oklch(99% 0.004 250)`) | **5.26:1** | 3:1 | PASS |
| `dark:text-on-surface` | `--color-text` (`oklch(96% 0.005 250)`) | `--color-surface` (`oklch(18% 0.02 260)`) | **16.75:1** | 4.5:1 | PASS |
| `dark:muted-on-surface` | `--color-muted` (`oklch(72% 0.015 260)`) | `--color-surface` (`oklch(18% 0.02 260)`) | **7.58:1** | 4.5:1 | PASS |
| `dark:focus-on-surface` | `--color-focus` (`oklch(76% 0.13 250)`) | `--color-surface` (`oklch(18% 0.02 260)`) | **8.79:1** | 3:1 | PASS |

### Fluid Typography & Spatial Scale

| Token | Authored Value |
| --- | --- |
| `--text-step--1` | `clamp(0.875rem, calc(0.8333rem + 0.2083vi), 1rem)` |
| `--text-step-0` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` |
| `--text-step-1` | `clamp(1.25rem, calc(1rem + 1.25vi), 2rem)` |
| `--text-step-2` | `clamp(1.75rem, calc(1.25rem + 2.5vi), 3.25rem)` |
| `--text-step-3-to-1` | `clamp(1.25rem, calc(0.25rem + 5vi), 4.25rem)` |
| `--text-step-2-to-0` | `clamp(1rem, calc(0.25rem + 3.75vi), 3.25rem)` |
| `--spacing-content` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` |
| `--spacing-grid` | `clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem)` |
| `--spacing-container` | `clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)` |
| `--spacing-section` | `clamp(3rem, calc(1rem + 10vi), 9rem)` |
| `--spacing-2xl-to-md` | `clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)` |
| `--spacing-xl-to-sm` | `clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)` |
