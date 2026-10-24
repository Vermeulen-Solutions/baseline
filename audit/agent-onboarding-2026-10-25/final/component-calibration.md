# Stage 4.5 Component & Token Calibration

Record `/_styleguide` verification across mobile (`390px`), tablet (`768px`), and desktop (`1440px`) before assembling full site routes.

## Token Calibration

- **Source stylesheet:** `C:\dev\baseline-onboarding-static-20261025-run1\src\styles\global.css`
- **LF SHA-256:** `45d43ee8b5c3a919bc3800b529cff9e91250f506aadbcfaddd9ebf7e1b2551ab`
- **Validation status:** `PASS` (14 WCAG contrast pairs, 31 `@theme` tokens, 12 `:root` tokens)

### WCAG Relative Luminance Contrast Matrix

| Pair | Foreground | Background | Ratio | Minimum | Status |
| --- | --- | --- | --- | --- | --- |
| `default:text-on-page` | `--color-text` (`oklch(19% 0.0112 90.2349)`) | `--color-page` (`oklch(96.5% 0.015 90.2349)`) | **16.69:1** | 4.5:1 | PASS |
| `default:text-on-surface` | `--color-text` (`oklch(19% 0.0112 90.2349)`) | `--color-surface` (`oklch(99% 0.006 90.2349)`) | **17.95:1** | 4.5:1 | PASS |
| `default:muted-on-page` | `--color-muted` (`oklch(43% 0.0112 90.2349)`) | `--color-page` (`oklch(96.5% 0.015 90.2349)`) | **7.33:1** | 4.5:1 | PASS |
| `default:muted-on-surface` | `--color-muted` (`oklch(43% 0.0112 90.2349)`) | `--color-surface` (`oklch(99% 0.006 90.2349)`) | **7.88:1** | 4.5:1 | PASS |
| `default:on-action-on-action` | `--color-on-action` (`oklch(99.5% 0.003 90.2349)`) | `--color-action` (`oklch(39.1978% 0.08 166.5478)`) | **9.01:1** | 4.5:1 | PASS |
| `default:action-on-page` | `--color-action` (`oklch(39.1978% 0.08 166.5478)`) | `--color-page` (`oklch(96.5% 0.015 90.2349)`) | **8.26:1** | 3:1 | PASS |
| `default:link-on-page` | `--color-link` (`oklch(39.1978% 0.08 166.5478)`) | `--color-page` (`oklch(96.5% 0.015 90.2349)`) | **8.26:1** | 4.5:1 | PASS |
| `default:link-on-surface` | `--color-link` (`oklch(39.1978% 0.08 166.5478)`) | `--color-surface` (`oklch(99% 0.006 90.2349)`) | **8.88:1** | 4.5:1 | PASS |
| `dark:link-on-surface` | `--color-link` (`oklch(79% 0.068 166.5478)`) | `--color-surface` (`oklch(16.5% 0.012 90.2349)`) | **10.26:1** | 4.5:1 | PASS |
| `light:link-on-surface` | `--color-link` (`oklch(39.1978% 0.08 166.5478)`) | `--color-surface` (`oklch(100% 0 0)`) | **9.14:1** | 4.5:1 | PASS |
| `default:focus-on-page` | `--color-focus` (`oklch(46% 0.1 166.5478)`) | `--color-page` (`oklch(96.5% 0.015 90.2349)`) | **6.07:1** | 3:1 | PASS |
| `dark:text-on-surface` | `--color-text` (`oklch(97% 0.006 90.2349)`) | `--color-surface` (`oklch(16.5% 0.012 90.2349)`) | **17.67:1** | 4.5:1 | PASS |
| `dark:muted-on-surface` | `--color-muted` (`oklch(76% 0.008 90.2349)`) | `--color-surface` (`oklch(16.5% 0.012 90.2349)`) | **8.98:1** | 4.5:1 | PASS |
| `dark:focus-on-surface` | `--color-focus` (`oklch(79% 0.068 166.5478)`) | `--color-surface` (`oklch(16.5% 0.012 90.2349)`) | **10.26:1** | 3:1 | PASS |

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
| `--spacing-section` | `clamp(3rem, calc(2rem + 5vi), 6rem)` |
| `--spacing-2xl-to-md` | `clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)` |
| `--spacing-xl-to-sm` | `clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)` |

## Component Specimens To Verify

- **Typography & Measure:** Check fluid steps and `--measure-reading` line lengths on `/_styleguide#typography`.
- **Controls & Focus States:** Check primary, disabled, invalid, and `:focus-visible` states on `/_styleguide#controls`.
- **Layout & Cards:** Check `Section`, `Container` (`reading`, `content`, `wide`, `breakout`), `Grid`, and `Card` (`stacked`, `horizontal`) on `/_styleguide#layout`.
- **Media & Editorial Flow:** Check native `ResponsiveImage`, `PartnersPanel`, `LogoTicker`, and `.flow` Markdown on the common specimens. For EmDash, also check `EditorialImage`, `PhotoGallery` and Portable Text in the platform extension.
- **Evidence:** Record captures and observed results before marking component specimens verified. Token calculations alone do not verify rendered components.

## Rendered calibration — 2026-10-25

Observed the canonical development route http://127.0.0.1:4361/_styleguide/ in the in-app browser before page assembly. IAB visibility is unavailable to this subagent; the hidden tab provides actual browser rendering/screenshots and DOM inspection.

- 1280px: Georgia h1 and system body computed correctly; section padding 96px, warm canvas/forest actions visible, no horizontal document overflow. This is deliberate balanced pacing rather than the preset's larger section maximum.
- 375px: Layout section, stacked/horizontal Card specimens and narrow container visually inspected. Cards were about 326px wide, headings and long prose wrapped, images stayed in their bounds, no horizontal document overflow. Tab from Controls moved to Layout with a visible forest outline. Cards are available but date rows better fit the real workshop list.
- 768px: Native Markdown/editorial specimen inspected; heading, paragraph, quote, lists and internally bounded code/table content remained readable. Reading container about 569px, no document overflow.
- APIs inspected: Section labelledBy/spacing/layout/gap, Container width/layout/gap, RichText native Content slot. Use ordinary Section/Container composition; no breakout or image pattern is needed for supplied client copy.
- Asset provenance: no client imagery supplied or introduced; styleguide geometric fixtures remain development-only. No external font request; local Georgia/system faces.
- Ready: Section/Container, editorial flow, semantic links and visible focus. Grid/Card remain unused for the production list. CMS editing, forms/loading/error states, motion, dark page themes and media delivery are outside this site's public scope; synthetic controls are not delivery evidence.
- Remaining at calibration: real headings, date rows, email labels, site navigation and all public page responsive checks after representative implementation. Automated token/contrast evidence is refreshed below after saved CSS changes; this note is the browser evidence, not the generated table.
