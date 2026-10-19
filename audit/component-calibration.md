# Shared native composition calibration

Scope: reusable Baseline infrastructure, 2026-10-19. This is not a client art
direction or a client page implementation. Existing neutral tokens and production
components are the visual authority. Exact source exceptions are reviewed with
the code; no directory/client-page exemption is introduced.

## Evidence and decisions

The incumbent narrow styleguide was inspected from the committed Windows reference
before implementation. Its repeated control-row CSS supplies Cluster's concrete
use case. Equal-column Grid cannot express a main region retaining a minimum share
beside supporting content; the wide/narrow editorial specimens establish Sidebar's
separate relationship. Grid, Card and their existing containment behavior remain.

Disclosure uses native details/summary with a required named summary slot, native
attributes and a default `.flow` body slot. Cluster and Sidebar are open div wrappers
with native attributes and contextual CSS properties. No content query, heading/CTA
prop bundle, clone, runtime controller or automatic FAQ schema is introduced.
Native Markdown and CMS Portable Text are supplied by their own callers.

Token mapping: border/control radius, text/surface/focus and content spacing for
Disclosure; content gap for Cluster; reading-measure basis and grid gap for Sidebar.
Main content stays first in DOM/keyboard order. The supporting region is optional;
editorial/editor wrappers sit inside stable region elements. No visual reversal or
viewport breakpoint is added. Long text wraps rather than truncates.

The first opened dark specimen exposed action-colored links at 2.34:1. This was a
shared surface defect, corrected in global semantic CSS rather than specimen-only
styles. `--color-link` aliases existing action/light focus values per surface.
Default/dark/restored-light link pairs are now gated at 4.5:1; the neutral dark link
is 8.79:1. The regression test reproduces the prior inheritance failure. All 31
`@theme` values, fluid scales and lane presets remain unchanged.

## Rendered review

Review uses Impeccable's scoped hardening guidance and the incumbent implementation,
not a new visual-world workflow or a formal dual-assessment critique command.
Opened/closed native markers, long summaries, dark focus, wrapping actions and
DOM-ordered unequal regions are inspected at narrow and wide sizes. Mechanical
source scanning reports one advisory about existing styleguide punctuation; no
component changes are justified by that advisory. The contrast issue above was
found in rendered inspection and is now covered by a computed-color browser check.
The Arabic heading declares `lang="ar"`; its language-sensitive font fallback was
reviewed from an expected/actual/diff crop before accepting revised captures.

Capture paths are under `tests/visual/baselines/win32/chromium-{390,768,1440}/`:
`composition.png` and `composition-open.png`, plus affected full-page styleguide,
text-spacing and actual-zoom captures. The final execution receipt records hashes,
comparison results, independent generated profiles and cleanup.

## Acceptance boundary

Automated acceptance covers Enter/Space, hidden body links excluded from tab order,
native exclusive groups and independent panels, focus visibility, real fragment
reveal, no document JavaScript, long German/RTL sibling content, intrinsic media,
wide/narrow hosts, missing supporting content, text spacing and actual 200%/400%
Chromium zoom. These checks exercise production primitives, not copies with repaired
specimen CSS. The styleguide remains excluded from normal release artifacts.

Manual assistive-technology announcements, browser toolbar Find, Firefox/WebKit,
physical devices and real CMS editor save/reload remain unverified. A native summary
is not a heading-navigation guarantee; callers keep meaningful headings outside it.
Ready/deferred status and exact executed results are recorded in the Phase 5
verification receipt before this calibration is accepted for starter reuse.

**Accepted automated scope:** root verify 208 tests/46 Astro files, 23 design tests,
normal build, 69 final CMS browser comparisons and independent static/Sveltia
verification plus browser journeys all pass. Components are ready for reuse within
the documented contract; the manual observations above remain deferred. See
[current execution evidence](verification/native-composition-phase-5-checks.json).

## Token Calibration

- **Source stylesheet:** `src/styles/global.css`
- **LF SHA-256:** `af3e535ba352ca908362f7afc2991feff0d6f830c62f7451613d05e6b784d325`
- **Validation status:** `PASS` (14 WCAG contrast pairs, 31 `@theme` tokens, 7 `:root` tokens)

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
