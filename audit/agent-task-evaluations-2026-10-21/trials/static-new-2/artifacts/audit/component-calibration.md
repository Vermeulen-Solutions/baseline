# Stage 4.5 Component & Token Calibration

Record `/_styleguide` verification across mobile (`390px`), tablet (`768px`), and desktop (`1440px`) before assembling full site routes.

## Token Calibration

- **Source stylesheet:** `C:\dev\baseline-task-evals-20261021-cde21c0d\static-new-2\site\src\styles\global.css`
- **LF SHA-256:** `f9df7cddf48ad0bf737a7f8442c51c9affebab497fdfb4f7eacc08e06c18330d`
- **Validation status:** `PASS` (14 WCAG contrast pairs, 31 `@theme` tokens, 13 `:root` tokens)

### WCAG Relative Luminance Contrast Matrix

| Pair | Foreground | Background | Ratio | Minimum | Status |
| --- | --- | --- | --- | --- | --- |
| `default:text-on-page` | `--color-text` (`oklch(20% 0.02 55)`) | `--color-page` (`#f9f6f0`) | **16.83:1** | 4.5:1 | PASS |
| `default:text-on-surface` | `--color-text` (`oklch(20% 0.02 55)`) | `--color-surface` (`oklch(99.2% 0.006 85)`) | **17.74:1** | 4.5:1 | PASS |
| `default:muted-on-page` | `--color-muted` (`oklch(43% 0.025 58)`) | `--color-page` (`#f9f6f0`) | **7.57:1** | 4.5:1 | PASS |
| `default:muted-on-surface` | `--color-muted` (`oklch(43% 0.025 58)`) | `--color-surface` (`oklch(99.2% 0.006 85)`) | **7.98:1** | 4.5:1 | PASS |
| `default:on-action-on-action` | `--color-on-action` (`#ffffff`) | `--color-action` (`#215846`) | **8.24:1** | 4.5:1 | PASS |
| `default:action-on-page` | `--color-action` (`#215846`) | `--color-page` (`#f9f6f0`) | **7.64:1** | 3:1 | PASS |
| `default:link-on-page` | `--color-link` (`#215846`) | `--color-page` (`#f9f6f0`) | **7.64:1** | 4.5:1 | PASS |
| `default:link-on-surface` | `--color-link` (`#215846`) | `--color-surface` (`oklch(99.2% 0.006 85)`) | **8.05:1** | 4.5:1 | PASS |
| `dark:link-on-surface` | `--color-link` (`oklch(80% 0.12 55)`) | `--color-surface` (`oklch(18% 0.018 55)`) | **9.78:1** | 4.5:1 | PASS |
| `light:link-on-surface` | `--color-link` (`#215846`) | `--color-surface` (`oklch(100% 0 0)`) | **8.24:1** | 4.5:1 | PASS |
| `default:focus-on-page` | `--color-focus` (`#215846`) | `--color-page` (`#f9f6f0`) | **7.64:1** | 3:1 | PASS |
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
| `--text-step-3-to-1` | `clamp(2.5rem, calc(1.8333rem + 3.3333vi), 4.5rem)` |
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

## Observed Stage 4.5 review — 2026-10-21
- Brief-led greenfield site; no source-site comparison or third-party assets.
- Art direction passed after seeding Editorial Paper and replacing its accent with supplied #215846. Token test suite: 19/19 passed.
- Development /_styleguide/ returned 404; no baseline scripts changed. The supported `fixtures:build` + `fixtures:serve` path rendered the styleguide correctly at http://127.0.0.1:4349/_styleguide/.
- Chromium captures: audit/styleguide-390.png, styleguide-768.png, styleguide-1440.png; viewport crops audit/styleguide-top-{390,1440}.png and styleguide-layout-{390,1440}.png. All three widths had no horizontal document overflow.
- Inspected typography, paper/forest color swatches, native controls, container/grid composition and dark surface examples. Shared Section/Container spacing and narrow stacking are ready for site assembly. Cards/images/galleries remain unused on the client pages; no image source or CMS/edit proxy requirement applies.
- User required system fonts; Georgia and system sans are retained even though Impeccable's general preference suggests sourced display fonts. No imagery is generated.
- Native links retain visible focus; full site keyboard, reduced-motion and text-resizing checks follow route assembly. This is local browser evidence, not accessibility certification.
## Observed Stage 4.5 review — 2026-10-21
- Brief-led greenfield site; no source-site comparison or third-party assets.
- Art direction passed after seeding Editorial Paper and replacing its accent with supplied #215846. Token test suite: 19/19 passed.
- Development /_styleguide/ returned 404; no baseline scripts changed. The supported `fixtures:build` + `fixtures:serve` path rendered the styleguide correctly at http://127.0.0.1:4349/_styleguide/.
- Chromium captures: audit/styleguide-390.png, styleguide-768.png, styleguide-1440.png; viewport crops audit/styleguide-top-{390,1440}.png and styleguide-layout-{390,1440}.png. All three widths had no horizontal document overflow.
- Inspected typography, paper/forest color swatches, native controls, container/grid composition and dark surface examples. Shared Section/Container spacing and narrow stacking are ready for site assembly. Cards/images/galleries remain unused on the client pages; no image source or CMS/edit proxy requirement applies.
- User required system fonts; Georgia and system sans are retained even though Impeccable's general preference suggests sourced display fonts. No imagery is generated.
- Native links retain visible focus; full site keyboard, reduced-motion and text-resizing checks follow route assembly. This is local browser evidence, not accessibility certification.


## Final acceptance
Final source token table above reflects the delivered stylesheet. The initial styleguide captures preceded page assembly and the final heading/footer adjustments. Final page captures and text stress results are in audit/browser-review.json, with home/services/about/contact-{390,1440}.png. All four routes passed at 320, 390, 768 and 1440 CSS pixels; 200% root text size with increased text spacing passed at 390 CSS pixels. The shared footer gutter and page-title wrapping fixes were rechecked in these captures. No public asset or CMS states apply.
