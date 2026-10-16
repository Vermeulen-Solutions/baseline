# Baseline Architecture Issue #2: Curated Token Engine, Card Framework & Editorial Content Grid

**Repository:** `Vermeulen-Solutions/emdash-baseline`  
**Status:** Implemented & Verified  
**Target:** Design System (`src/styles/global.css`), Layout Primitives (`Card.astro`, `Container.astro`), Agent Workflow & Skills  
**Date:** 2026-10-17  

---

## 1. Context & Design Philosophy

This specification defines a **curated, high-leverage design token and layout primitive architecture** tailored for `emdash-baseline` (Astro + Tailwind CSS v4 + EmDash CMS).

Rather than generating every possible combinatorial utility permutation, `emdash-baseline` adopts a **curated token and primitive contract**:
- **Curated tokens over combinatorial bloat**: 3 multi-layer elevation shadows, 3 easing curves, and 4 high-contrast fluid bridge (`-to-`) tokens.
- **Zero-JS CSS physics**: Native `calc()`, `min()`, `max()`, `clamp()`, `color-mix(in oklch, ...)`, `:has()`, `@container`, and `interpolate-size: allow-keywords`.
- **Workflow-surfaced primitives**: Every capability (such as `.content-grid` editorial breakouts and `.card` clickable-parent mechanics) is explicitly wired into `new-site-workflow`, `astro-site-design`, `site-art-direction`, and `/_styleguide` so agents automatically apply them when appropriate.

---

## 2. Curated Token Engine (`src/styles/global.css`)

### A. Multi-Layer Elevation Shadows (`@theme`)
Three compound, multi-stop shadows using `oklch(from var(--color-text) l c h / alpha)` blending so they remain crisp across light and tinted surfaces:
- `--shadow-sm` (3-layer subtle contact + ambient shadow for resting cards/surfaces):
  ```css
  0 2px 4px -1px oklch(from var(--color-text) l c h / 0.04),
  0 4px 6px -1px oklch(from var(--color-text) l c h / 0.06),
  0 8px 10px -2px oklch(from var(--color-text) l c h / 0.05)
  ```
- `--shadow-md` (4-layer medium elevation for interactive card hover and floating panels):
  ```css
  0 2px 4px -2px oklch(from var(--color-text) l c h / 0.05),
  0 6px 10px -2px oklch(from var(--color-text) l c h / 0.07),
  0 14px 20px -4px oklch(from var(--color-text) l c h / 0.07),
  0 24px 32px -6px oklch(from var(--color-text) l c h / 0.05)
  ```
- `--shadow-lg` (6-layer deep elevation for modals, drawers, and popovers):
  ```css
  0 2px 4px -2px oklch(from var(--color-text) l c h / 0.04),
  0 6px 12px -2px oklch(from var(--color-text) l c h / 0.06),
  0 16px 24px -4px oklch(from var(--color-text) l c h / 0.07),
  0 28px 36px -6px oklch(from var(--color-text) l c h / 0.07),
  0 44px 52px -8px oklch(from var(--color-text) l c h / 0.06),
  0 64px 72px -12px oklch(from var(--color-text) l c h / 0.05)
  ```

### B. Curated Easing Presets (`@theme`)
Three distinct timing functions:
- `--ease-smooth`: `cubic-bezier(0.22, 1, 0.36, 1)` (general UI state and color/shadow transitions)
- `--ease-snappy`: `cubic-bezier(0.16, 1, 0.3, 1)` (reveals, drawers, popovers)
- `--ease-spring`: `linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)` (tactile micro-interactions)

### C. Curated Fluid Bridge (`-to-`) Tokens (`@theme`)
Four high-contrast fluid compression tokens for layouts that need generous desktop breathing room but tighter mobile density:
- **Spacing Bridges**:
  - `--spacing-2xl-to-md`: `clamp(1.25rem, calc(0.35rem + 4.5vi), 4rem)` (hero/spotlight inner padding)
  - `--spacing-xl-to-sm`: `clamp(0.875rem, calc(0.25rem + 3.125vi), 2.75rem)` (card padding or wide grid gaps)
- **Typography Bridges**:
  - `--text-step-3-to-1`: `clamp(1.2rem, calc(0.85rem + 1.75vi), 2.25rem)` (hero lede / feature callout copy)
  - `--text-step-2-to-0`: `clamp(1rem, calc(0.78rem + 1.1vi), 1.65rem)` (card titles / section subheadings)

### D. Contextual Surface System & Automatic Color Relationships
Extend `[data-surface]` beyond focus-ring switching so sections, banners, or cards can invert or shift their surface context cleanly:
- `[data-surface="dark"]`: Sets `color-scheme: dark` and reassigns local `--color-page`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border` (using `color-mix(in oklch, currentColor 18%, transparent)`), and `--color-focus: var(--color-focus-on-dark)`.
- `[data-surface="light"]`: Sets `color-scheme: light` and restores light surface tokens inside a dark parent.
-On-demand transparencies use `color-mix(in oklch, var(--color-*) X%, transparent)` or `oklch(from var(--color-*) l c h / α)` rather than pre-built `--*-trans-*` token bloat.

### E. Modern CSS Reset & Scroll Mechanics
- `:root { interpolate-size: allow-keywords; }` (enables smooth `height: auto` transitions for native `<details>` disclosures).
- `[id] { scroll-margin-block-start: calc(var(--header-height, 0px) + var(--scroll-offset, 1.5rem)); }` (prevents hash-link targets from hiding under sticky headers).
- Keyboard/find-in-page smooth scroll fix:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
    html:focus-within { scroll-behavior: auto; }
  }
  ```

---

## 3. Upgraded Turnkey `<Card>` Component (`src/components/Card.astro`)

### A. Fix Whole-Card `<a>` Accessibility Bug via `.clickable-parent` + `.focus-parent`
- **Problem Today**: `Card.astro` currently renders `<a href={href} class="card">` around the entire card when `href` is passed, causing screen readers to read the entire card body as a single link label and making inner interactive controls invalid HTML.
- **Solution**:
  - Always render a semantic outer element (`<article class:list={["card", ...]}>`).
  - When `href` is provided, render `<a href={href} class="card__link">{title}</a>` inside the heading (`<HeadingTag class="card__title">`)—or on the action link when explicit—with `.card__link::after { content: ""; position: absolute; inset: 0; z-index: 1; cursor: pointer; }`.
  - **Focus Parent**:
    ```css
    .card:focus-within:has(:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
    .card:focus-within:not(:has(:focus-visible)) {
      outline: none;
    }
    .card:has(.card__link) :focus-visible {
      outline: none;
    }
    ```
  - Any independent interactive element inside a card (if ever used) gets `position: relative; z-index: 2;`.

### B. Full CSS Variable Contract & Concentric Radius Mathematics
Expose local CSS custom properties with sensible defaults so downstream sites can theme cards globally in `@theme` or per-section:
- `--card-bg: var(--color-surface)`
- `--card-text: var(--color-text)`
- `--card-muted: var(--color-muted)`
- `--card-border-width: 1px`
- `--card-border-color: var(--color-border)`
- `--card-radius: var(--radius-surface)`
- `--card-padding: var(--spacing-content)`
- `--card-gap: var(--spacing-content)`
- `--card-shadow: none` (or `var(--shadow-sm)` when elevated)
- **Concentric Inner Media Radius** (Reverse Concentric formula):
  ```css
  --card-media-radius: max(0.25rem, calc(var(--card-radius) - var(--card-padding)));
  ```
  When `.card__media` sits inside padded card content, its corners use `--card-media-radius` so outer and inner curves share the same mathematical center.

### C. Container Query Horizontal Layout & Touch-Safe Hover
- Replace `@media (max-width: 40rem)` on `.card--horizontal` with container query adaptation so horizontal cards automatically stack when placed in a narrow column or grid cell, while falling back cleanly when no container is present.
- Guard hover transitions (`@media (hover: hover) and (pointer: fine)`) so touch devices do not suffer sticky hover states.

---

## 4. Editorial Breakout Grid (`.content-grid` & `<Container breakout>`)

### A. Hybrid Container Architecture
- **Keep `.container-shell` (`width="reading" | "content" | "wide"`) as the default** on `Container.astro` for standard page sections (headers, card grids, split heroes, footers). This preserves simplicity and full compatibility with the Dev HUD Grid Guide (`src/utils/grid-guide.ts`).
- **Add `.content-grid` (and `breakout?: boolean` on `Container.astro`)** for long-form editorial content (`RichText.astro`, blog posts, case studies, documentation) where a single flow of content needs `reading` measure (`65ch`) by default, but allows specific child blocks to break out wider without closing/reopening containers:
  ```css
  .content-grid {
    --full: minmax(var(--spacing-inline), 1fr);
    --feature-track: minmax(0, calc((var(--width-content) - var(--measure-reading)) / 2));
    --wide-track: minmax(0, calc((var(--width-wide) - var(--width-content)) / 2));
    display: grid;
    grid-template-columns:
      [full-start] var(--full)
      [wide-start] var(--wide-track)
      [feature-start] var(--feature-track)
      [content-start] min(var(--measure-reading), 100% - var(--spacing-inline) * 2) [content-end]
      var(--feature-track) [feature-end]
      var(--wide-track) [wide-end]
      var(--full) [full-end];
    padding-inline: 0;
  }
  .content-grid > :where(:not(.content--feature, .content--wide, .content--full, .content--full-safe, .is-bg)) {
    grid-column: content;
    inline-size: 100%;
    min-inline-size: 0;
  }
  .content-grid > .content--feature { grid-column: feature; inline-size: 100%; min-inline-size: 0; }
  .content-grid > .content--wide { grid-column: wide; inline-size: 100%; min-inline-size: 0; }
  .content-grid > .content--full { grid-column: full; inline-size: 100%; min-inline-size: 0; }
  .content-grid > .content--full-safe { grid-column: full; inline-size: 100%; min-inline-size: 0; padding-inline: var(--spacing-inline); }
  ```
- **Content Width Safe Token**:
  `--width-content-safe: min(var(--width-content), calc(100% - var(--spacing-inline) * 2));`

---

## 5. Smart Spacing (`.flow`) & High-Craft Visual Utilities

1. **Smart Spacing Upgrade on `.flow` (`src/styles/global.css`)**:
   - Introduce semantic flow variables (`--flow-space`, `--heading-spacing`, `--list-spacing`, `--list-item-spacing`, `--figure-spacing`, `--blockquote-spacing`).
   - **Duplicate-Margin Prevention**: Ensure block figures, galleries, blockquotes, and lists inside `.flow` do not double-stack their block margins with the following sibling's top margin.
2. **Semantic Background Image Utility (`.is-bg`)**:
   - Allows `<ResponsiveImage class="is-bg" />` to act as an optimized, LCP-discoverable section/card background while `:where(:has(> .is-bg)) { position: relative; isolation: isolate; }` automatically prepares the parent stacking context.
3. **Mask-Based Gradient Fades (`.fade--top`, `.fade--bottom`, `.fade--block`, `.fade--inline`)**:
   - Uses `mask-image: linear-gradient(...)` with `--fade-amount: 25%` so media or overflow containers fade smoothly into *any* underlying surface color or pattern.
4. **Accessible External Link Indication**:
   - Prose links with `target="_blank"` (excluding links wrapping images/SVGs or buttons) append `content: " ↗" / " (opens in a new tab)"` so screen readers announce the destination behavior rather than the raw glyph.

---

## 6. Workflow & Skill Surfacing Plan (Ensuring Agents Use `.content-grid` & New Primitives)

To guarantee that agents actively surface and apply `.content-grid` and the upgraded token/card system whenever appropriate, update the following workflow touchpoints:

1. **`.agents/skills/new-site-workflow/SKILL.md`**:
   - **Stage 3 (Model content and routes)**: Add an explicit decision rule: when modeling long-form editorial routes (posts, case studies, guides, or rich pages with embedded galleries/figures/callouts), plan the article wrapper as `<Container breakout class="flow">` (`.content-grid`) rather than a narrow `.container-shell--reading` box.
   - **Stage 4.5 (Calibrate components on `/_styleguide`)**: Include `.content-grid` breakouts, `<Card>` concentric radius/clickable-parent focus forwarding, `[data-surface]` contrast flips, and shadow/easing tokens in the calibration checklist.
2. **`.agents/skills/astro-site-design/SKILL.md` & References**:
   - **`references/astro-primitives.md`**: Document the exact choice between `<Container width="reading|content|wide">` (default for standard sections) and `<Container breakout>` / `.content-grid` (for editorial streams needing `.content--feature`, `.content--wide`, or `.content--full` child breakouts), plus the upgraded `<Card>` CSS variable API and `.is-bg` pattern.
   - **`references/emdash-content.md`**: Show how `<div class="flow content-grid"><RichText value={...} /></div>` allows `PhotoGallery`, wide `EditorialImage` figures, and pull-quotes to break out to `.content--feature` while keeping prose locked to `--measure-reading`.
   - **`references/fluid-tokens.md`**: Document the curated shadow scale (`--shadow-sm/md/lg`), easing tokens (`--ease-smooth/snappy/spring`), fluid bridge (`-to-`) tokens, and opt-in single-keyframe `animation-timeline: view()` entrance recipe.
   - **`references/component-quarantine.md` & `.agent/rules/astro-composition.md`**: Update the `Container` and `Card` API contracts.
3. **`src/components/dev/Styleguide.astro` & `docs/reusable-public-patterns.md`**:
   - Add a live `.content-grid` breakout specimen on `/_styleguide` (showing reading prose alongside a `.content--feature` callout/gallery inside the same container) and update the `<Card>` documentation in `docs/reusable-public-patterns.md`.
