# Stage 4.5 Component & Token Calibration

Record `/_styleguide` verification across mobile (`390px`), tablet (`768px`), and desktop (`1440px`) before assembling full site routes.

## Token Calibration

- **Source stylesheet:** `C:\dev\baseline-task-evals-20261021-cde21c0d\static-new-1\site\src\styles\global.css`
- **LF SHA-256:** `1dba1fab2ac9504e287de7359370a19507630155460ccbb2879b7ec0a46a5287`
- **Validation status:** `PASS` (14 WCAG contrast pairs, 31 `@theme` tokens, 12 `:root` tokens)

### WCAG Relative Luminance Contrast Matrix

| Pair | Foreground | Background | Ratio | Minimum | Status |
| --- | --- | --- | --- | --- | --- |
| `default:text-on-page` | `--color-text` (`#203c32`) | `--color-page` (`#f9f6f0`) | **11.1:1** | 4.5:1 | PASS |
| `default:text-on-surface` | `--color-text` (`#203c32`) | `--color-surface` (`#f1eee5`) | **10.32:1** | 4.5:1 | PASS |
| `default:muted-on-page` | `--color-muted` (`#4c6157`) | `--color-page` (`#f9f6f0`) | **6.17:1** | 4.5:1 | PASS |
| `default:muted-on-surface` | `--color-muted` (`#4c6157`) | `--color-surface` (`#f1eee5`) | **5.74:1** | 4.5:1 | PASS |
| `default:on-action-on-action` | `--color-on-action` (`#fffdf8`) | `--color-action` (`#215846`) | **8.1:1** | 4.5:1 | PASS |
| `default:action-on-page` | `--color-action` (`#215846`) | `--color-page` (`#f9f6f0`) | **7.64:1** | 3:1 | PASS |
| `default:link-on-page` | `--color-link` (`#215846`) | `--color-page` (`#f9f6f0`) | **7.64:1** | 4.5:1 | PASS |
| `default:link-on-surface` | `--color-link` (`#215846`) | `--color-surface` (`#f1eee5`) | **7.1:1** | 4.5:1 | PASS |
| `dark:link-on-surface` | `--color-link` (`#bdd9ba`) | `--color-surface` (`#173b30`) | **8.09:1** | 4.5:1 | PASS |
| `light:link-on-surface` | `--color-link` (`#215846`) | `--color-surface` (`#f9f6f0`) | **7.64:1** | 4.5:1 | PASS |
| `default:focus-on-page` | `--color-focus` (`#215846`) | `--color-page` (`#f9f6f0`) | **7.64:1** | 3:1 | PASS |
| `dark:text-on-surface` | `--color-text` (`#f9f6f0`) | `--color-surface` (`#173b30`) | **11.42:1** | 4.5:1 | PASS |
| `dark:muted-on-surface` | `--color-muted` (`#c4d3c2`) | `--color-surface` (`#173b30`) | **7.89:1** | 4.5:1 | PASS |
| `dark:focus-on-surface` | `--color-focus` (`#bdd9ba`) | `--color-surface` (`#173b30`) | **8.09:1** | 3:1 | PASS |

### Fluid Typography & Spatial Scale

| Token | Authored Value |
| --- | --- |
| `--text-step--1` | `clamp(0.875rem, calc(0.8333rem + 0.2083vi), 1rem)` |
| `--text-step-0` | `clamp(1rem, calc(0.9167rem + 0.4167vi), 1.25rem)` |
| `--text-step-1` | `clamp(1.25rem, calc(1rem + 1.25vi), 2rem)` |
| `--text-step-2` | `clamp(2.5rem, calc(1.8333rem + 3.3333vi), 4.5rem)` |
| `--text-step-3-to-1` | `clamp(1.25rem, calc(0.25rem + 5vi), 4.25rem)` |
| `--text-step-2-to-0` | `clamp(1rem, calc(0.25rem + 3.75vi), 3.25rem)` |
| `--spacing-content` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` |
| `--spacing-grid` | `clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem)` |
| `--spacing-container` | `clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)` |
| `--spacing-section` | `clamp(3rem, calc(1.6667rem + 6.6667vi), 7rem)` |
| `--spacing-2xl-to-md` | `clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)` |
| `--spacing-xl-to-sm` | `clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)` |

## Component Specimens To Verify

- **Typography & Measure:** Check fluid steps and `--measure-reading` line lengths on `/_styleguide#typography`.
- **Controls & Focus States:** Check primary, disabled, invalid, and `:focus-visible` states on `/_styleguide#controls`.
- **Layout & Cards:** Check `Section`, `Container` (`reading`, `content`, `wide`, `breakout`), `Grid`, and `Card` (`stacked`, `horizontal`) on `/_styleguide#layout`.
- **Media & Editorial Flow:** Check native `ResponsiveImage`, `PartnersPanel`, `LogoTicker`, and `.flow` Markdown on the common specimens. For EmDash, also check `EditorialImage`, `PhotoGallery` and Portable Text in the platform extension.
- **Evidence:** Record captures and observed results before marking component specimens verified. Token calculations alone do not verify rendered components.

## Observed component review — 21 October 2026
- Art direction record and design checks passed before page templates. The initial gate rejected the neutral palette; initialization and Northline calibration resolved it. No checker was changed.
- Dev /_styleguide redirected to a slash URL and returned 404. Used unmodified fixtures:build and fixtures:serve instead: http://127.0.0.1:4350/_styleguide/ returned 200 at 390, 768 and 1440px. Evidence: audit/styleguide-browser.json and audit/screenshots/styleguide-*.png.
- Visually opened typography, controls and full narrow specimen captures. Warm surfaces, green actions, fine rules, wrapping long strings and stacked primitive specimens rendered without horizontal overflow. The fixture build deliberately pins Noto Sans; final production review must verify actual system Georgia/sans fonts separately.
- Relevant production mapping: Section owns vertical pacing; Container owns content measure and gaps; RichText owns native Markdown prose; service definition-list rows form the repeated semantic composite. Primary email anchor has a solid green light-surface style. No dark public section or additional action variants required.
- Ready for full route assembly. Keyboard and final production font checks remain for the final route browser pass. No source-site comparison or image provenance needed: brief-led greenfield, no visual assets.
## Observed component review — 21 October 2026
- Art direction record and design checks passed before page templates. The initial gate rejected the neutral palette; initialization and Northline calibration resolved it. No checker was changed.
- Dev /_styleguide redirected to a slash URL and returned 404. Used unmodified fixtures:build and fixtures:serve instead: http://127.0.0.1:4350/_styleguide/ returned 200 at 390, 768 and 1440px. Evidence: audit/styleguide-browser.json and audit/screenshots/styleguide-*.png.
- Visually opened typography, controls and full narrow specimen captures. Warm surfaces, green actions, fine rules, wrapping long strings and stacked primitive specimens rendered without horizontal overflow. The fixture build deliberately pins Noto Sans; final production review must verify actual system Georgia/sans fonts separately.
- Relevant production mapping: Section owns vertical pacing; Container owns content measure and gaps; RichText owns native Markdown prose; service definition-list rows form the repeated semantic composite. Primary email anchor has a solid green light-surface style. No dark public section or additional action variants required.
- Ready for full route assembly. Keyboard and final production font checks remain for the final route browser pass. No source-site comparison or image provenance needed: brief-led greenfield, no visual assets.

## Final production acceptance
- Production Chromium review at http://127.0.0.1:4312 checked all four routes at 320, 390, 768 and 1440px. Native system Georgia and sans stacks were confirmed through computed styles; production output loads no custom font assets.
- Keyboard Tab/Enter exercised skip link and focus transfer, brand focus outline and all four navigation links. Primary actions have the exact supplied mailto destination. No email message was sent.
- First pass found forced brand nonwrapping at 320px with 200% root text and added text spacing; removed nowrap and bounded the name. Primary actions now size to their label consistently; header alignment uses the shared content/gutter tokens.
- Final browser evidence is in audit/browser-review.json; final route and keyboard screenshots in audit/screenshots/. No page errors, normal viewport overflow, forms or executable public scripts found. Actual browser zoom and assistive technology testing were not performed; narrow reflow and 200% root text stress are separately identified.
