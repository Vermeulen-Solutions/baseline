# Stage 4.5 Component & Token Calibration

## Workshops continuation — 2026-10-21

Before page implementation, the existing `/services/` page was inspected at 1440px
and `/_styleguide/` at 390px, 768px and 1440px in local Chromium. The slashless
styleguide URL returned the site 404 under the installed trailing-slash policy;
the slash URL returned 200 and the real specimen heading. Full-page captures at
`../styleguide-{390,768,1440}.png` show the inherited typography, stacked content,
rules and responsive layout, with no document overflow at those widths. The new
listing reuses the existing Section/Container and collection-list/item stack
rules; no token or primitive changes are needed. This is scoped inherited-layout
review, not a new full styleguide/accessibility certification. Production page
and keyboard evidence is recorded in the trial's `EVALUATION-NOTES-B.md`.

Record `/_styleguide` verification across mobile (`390px`), tablet (`768px`), and desktop (`1440px`) before assembling full site routes.

## Token Calibration

- **Source stylesheet:** `C:\dev\baseline-task-evals-20261021-cde21c0d\fixture-static\src\styles\global.css`
- **LF SHA-256:** `72fc52c1f94cdb429abb80c14e8db9263ea4809bcecdd962fa04602dbdc7963d`
- **Validation status:** `PASS` (14 WCAG contrast pairs, 31 `@theme` tokens, 11 `:root` tokens)

### WCAG Relative Luminance Contrast Matrix

| Pair | Foreground | Background | Ratio | Minimum | Status |
| --- | --- | --- | --- | --- | --- |
| `default:text-on-page` | `--color-text` (`oklch(20% 0.02 55)`) | `--color-page` (`oklch(97.5% 0.012 82)`) | **16.89:1** | 4.5:1 | PASS |
| `default:text-on-surface` | `--color-text` (`oklch(20% 0.02 55)`) | `--color-surface` (`oklch(99.2% 0.006 85)`) | **17.74:1** | 4.5:1 | PASS |
| `default:muted-on-page` | `--color-muted` (`oklch(43% 0.025 58)`) | `--color-page` (`oklch(97.5% 0.012 82)`) | **7.59:1** | 4.5:1 | PASS |
| `default:muted-on-surface` | `--color-muted` (`oklch(43% 0.025 58)`) | `--color-surface` (`oklch(99.2% 0.006 85)`) | **7.98:1** | 4.5:1 | PASS |
| `default:on-action-on-action` | `--color-on-action` (`oklch(99% 0.005 82)`) | `--color-action` (`oklch(42% 0.15 28)`) | **8.87:1** | 4.5:1 | PASS |
| `default:action-on-page` | `--color-action` (`oklch(42% 0.15 28)`) | `--color-page` (`oklch(97.5% 0.012 82)`) | **8.49:1** | 3:1 | PASS |
| `default:link-on-page` | `--color-link` (`oklch(42% 0.15 28)`) | `--color-page` (`oklch(97.5% 0.012 82)`) | **8.49:1** | 4.5:1 | PASS |
| `default:link-on-surface` | `--color-link` (`oklch(42% 0.15 28)`) | `--color-surface` (`oklch(99.2% 0.006 85)`) | **8.92:1** | 4.5:1 | PASS |
| `dark:link-on-surface` | `--color-link` (`oklch(80% 0.12 55)`) | `--color-surface` (`oklch(18% 0.018 55)`) | **9.78:1** | 4.5:1 | PASS |
| `light:link-on-surface` | `--color-link` (`oklch(42% 0.15 28)`) | `--color-surface` (`oklch(100% 0 0)`) | **9.13:1** | 4.5:1 | PASS |
| `default:focus-on-page` | `--color-focus` (`oklch(48% 0.16 28)`) | `--color-page` (`oklch(97.5% 0.012 82)`) | **6.6:1** | 3:1 | PASS |
| `dark:text-on-surface` | `--color-text` (`oklch(96.5% 0.01 82)`) | `--color-surface` (`oklch(18% 0.018 55)`) | **17.03:1** | 4.5:1 | PASS |
| `dark:muted-on-surface` | `--color-muted` (`oklch(77% 0.016 75)`) | `--color-surface` (`oklch(18% 0.018 55)`) | **9.08:1** | 4.5:1 | PASS |
| `dark:focus-on-surface` | `--color-focus` (`oklch(80% 0.12 55)`) | `--color-surface` (`oklch(18% 0.018 55)`) | **9.78:1** | 3:1 | PASS |

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
| `--spacing-section` | `clamp(3.25rem, calc(1.25rem + 10vi), 9.25rem)` |
| `--spacing-2xl-to-md` | `clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)` |
| `--spacing-xl-to-sm` | `clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)` |

## Component Specimens To Verify

- **Typography & Measure:** Check fluid steps and `--measure-reading` line lengths on `/_styleguide#typography`.
- **Controls & Focus States:** Check primary, disabled, invalid, and `:focus-visible` states on `/_styleguide#controls`.
- **Layout & Cards:** Check `Section`, `Container` (`reading`, `content`, `wide`, `breakout`), `Grid`, and `Card` (`stacked`, `horizontal`) on `/_styleguide#layout`.
- **Media & Editorial Flow:** Check native `ResponsiveImage`, `PartnersPanel`, `LogoTicker`, and `.flow` Markdown on the common specimens. For EmDash, also check `EditorialImage`, `PhotoGallery` and Portable Text in the platform extension.
- **Evidence:** Record captures and observed results before marking component specimens verified. Token calculations alone do not verify rendered components.
