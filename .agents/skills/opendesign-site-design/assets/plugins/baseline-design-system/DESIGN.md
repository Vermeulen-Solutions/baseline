# Baseline Astro Design System

> Category: Architecture · Editorial · Product · Technical
> Baseline's canonical CSS custom property contract, 4-voice fluid typography, 3-tier OKLCH surface physics, Smart Spacing (`.flow`), and zero-JS structural primitives (`Section`, `Container`, `Grid`, `Card`).

## 1. Visual Theme & Architecture Philosophy

Baseline separates **structural token architecture** from **client aesthetic lane**. Every prototype authored with this design system MUST use Baseline's exact CSS custom property names (`--color-*`, `--font-*`, `--text-step-*`, `--spacing-*`, `--radius-*`) and structural class vocabulary so that approved OpenDesign HTML/CSS artifacts translate 1:1 into production Astro components without renaming variables or rewriting layout math.

### The 4 Canonical Aesthetic Lanes

Select one primary lane (70% weight) and an optional secondary inflection (30% weight), or bind an existing site's extracted `global.css` tokens:

1. **Editorial Paper:** Warm unbleached cotton paper (`oklch(97% 0.01 85)`), deep carbon ink (`oklch(18% 0.01 260)`), archival vermilion or terracotta accents, high-contrast transitional/modern display serifs (`Instrument Serif`, `Newsreader`, `Fraunces`), hairline `1px` rules, and generous reading measure (`65ch`).
2. **Product-Led Minimalism:** Optical white (`oklch(99% 0.002 240)`) or deep neutral dark (`oklch(14% 0.01 250)`), crisp `1px` borders, restrained cobalt/indigo/graphite accent, modern grotesque sans (`Plus Jakarta Sans`, `Inter`, `Geist`), and balanced `6px–10px` radii.
3. **Technical Systems:** Dark slate or laboratory light canvas, `1px` exposed cell dividers (`.grid-hairline`), phosphor amber or telemetry green status accents, monospace metrics (`JetBrains Mono`, `IBM Plex Mono`), sharp `0px–2px` radii, and compact density.
4. **Luminous Futurism:** Deep obsidian canvas (`oklch(8% 0.01 270)`), frosted glass surfaces (`.surface-glass`), top `1px` specular inner highlights (`--surface-highlight`), geometric display headings (`Space Grotesk`, `Syne`), and cinematic section spacing.

## 2. Color & 3-Tier Surface Physics

Never hardcode raw hex values inside component rules. Declare all colors in `:root` (and optional `[data-surface="dark"]`) using these semantic roles:

- `--color-page`: Primary background canvas.
- `--color-surface`: Default card, panel, or callout surface.
- `--color-elevated`: Lifted interactive surface, modal, or floating bar (`.surface-elevated`).
- `--surface-highlight`: `1px` top inner specular highlight (`rgba(255, 255, 255, 0.7)` on light, `rgba(255, 255, 255, 0.08)` on dark).
- `--color-text`: Primary body and heading ink (must pass WCAG AA `>= 4.5:1` against `--color-page` and `--color-surface`).
- `--color-muted`: Secondary descriptions, captions, and metadata ink (`>= 4.5:1` contrast).
- `--color-action`: Primary interactive CTA fill and focal accent.
- `--color-on-action`: High-contrast label ink on top of `--color-action`.
- `--color-border`: Default subtle `1px` structural rule.
- `--color-border-strong`: Emphasized border for active/hover cards and inputs.

## 3. 4-Voice Fluid Typography

Every composition orchestrates four distinct typographic voices:

1. **Monumental Display (`--font-display`):** Tight tracking (`-0.03em` to `-0.04em`), compressed line-height (`0.98–1.12`), `text-wrap: balance`.
2. **Inline Editorial Contrast Accent (`.font-accent` / `--font-accent`):** Selective italic serif (`<em class="font-accent">...</em>`) on 1–2 focal words inside a display heading to create tension.
3. **Reading & UI Body (`--font-body`):** High-legibility copy (`line-height: 1.6–1.68`, measure `60ch–68ch`).
4. **Telemetry & Coordinate Monospace (`.eyebrow-telemetry` / `--font-mono` + `.tabular-nums`):** `0.75rem` (`12px`) uppercase labels with mandatory `letter-spacing: 0.08em` to `0.12em` for structural coordinates (`[01 // ARCHITECTURE]`), version pills (`.badge-pill`), dates, and tabular counts.

### Fluid Typographic Scale (`clamp()`)

- `--text-step--1`: `clamp(0.8125rem, calc(0.79rem + 0.11vi), 0.875rem)`
- `--text-step-0`: `clamp(1rem, calc(0.96rem + 0.22vi), 1.125rem)`
- `--text-step-1`: `clamp(1.25rem, calc(1.16rem + 0.43vi), 1.5rem)`
- `--text-step-2`: `clamp(1.625rem, calc(1.45rem + 0.87vi), 2.125rem)`
- `--text-step-3`: `clamp(2.125rem, calc(1.82rem + 1.52vi), 3rem)`
- `--text-step-4`: `clamp(2.75rem, calc(2.26rem + 2.45vi), 4.125rem)`

## 4. Spacing Hierarchy & Layout Primitives

Do not combine layout gaps with flow margins on the same relationship. Each primitive owns one spatial relationship:

- **Section (`.section`):** Owns vertical block padding (`--spacing-section: clamp(3rem, calc(2.13rem + 4.35vi), 5.5rem)`). Every `<section>` MUST carry a `data-od-id="<slug>"` attribute.
- **Container (`.container`):** Owns horizontal page gutter (`--spacing-container: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)`), max-width (`75rem` content, `85rem` wide, `65ch` reading), and vertical stack gap between section header and body. Never pay the page gutter twice.
- **Grid / Bento Grid (`.grid`, `.bento-grid`):** Owns collection gap (`--spacing-grid: clamp(1.25rem, calc(1.08rem + 0.87vi), 1.75rem)`). Vary section pacing across a route (e.g., asymmetric `7fr 5fr` split hero → `.grid-hairline` ledger → sticky narrative + bento matrix → `[data-surface="dark"]` spotlight).
- **Card (`.card`):** Owns surface (`var(--color-surface)`), `1px solid var(--color-border)`, `--radius-card`, and internal padding (`--spacing-content: clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)`).
- **Editorial Flow (`.flow > * + *`):** Spaces direct vertical siblings inside prose or cards using `margin-block-start: var(--flow-space, 1em)`.

## 5. Tactile Actions & States

Support three semantic action roles with visible `:hover` and `:focus-visible` states (`2px solid var(--color-action)` with `2px` offset):

- **Primary (`.btn`):** Background `var(--color-action)`, ink `var(--color-on-action)`, radius `var(--radius-control)`, padding `0.75rem 1.25rem`, font-weight `600`.
- **Secondary (`.btn.btn--secondary`):** Background `var(--color-surface)`, ink `var(--color-text)`, border `1px solid var(--color-border-strong)`.
- **Ghost (`.btn.btn--ghost`):** Transparent background, ink `var(--color-text)`, inline trailing arrow `.icon-nudge` that translates `2px` on hover.

## 6. Anti-Patterns (`od lint` & Baseline Gate)

- ❌ Never use `text-transform: uppercase` without `letter-spacing >= 0.06em` (`od lint` `all-caps-no-tracking`).
- ❌ Never omit `data-od-id` on top-level `<section>` elements (`od lint` `missing-section-anchor`).
- ❌ Never stack consecutive identical 3-column card grids without varying geometry and density.
- ❌ Never invent fake testimonials, unverified metrics, or `lorem ipsum` filler; use real brief copy or honest structural drafts.
- ❌ Wrap all hover transforms and entrance transitions in `@media (prefers-reduced-motion: no-preference)`.
