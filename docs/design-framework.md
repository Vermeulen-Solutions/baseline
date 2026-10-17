# Design Framework & Token Physics

Baseline includes a complete, mathematically grounded design framework built on **fluid responsive scales** and **structural layout primitives**.

Traditional websites often suffer from **"breakpoint soup"**: dozens of arbitrary media queries (`p-4 md:p-8 lg:p-12 xl:p-16`) that create jarring layout jumps at arbitrary screen widths and look broken on intermediate screens (small laptops, tablets in split view, or foldable devices).

Baseline eliminates breakpoint soup by using continuous mathematical clamp functions anchored to the viewport width, combined with self-responsive layout components.

---

## 1. Continuous Fluid Scaling

All typographic and spatial scales are calculated using CSS `clamp()` functions that grow continuously between a minimum viewport width of **`20rem` (320px)** and a maximum of **`80rem` (1280px)**.

Below 320px, values lock at their minimum. Above 1280px, values lock at their maximum. In between, values scale smoothly with the viewport inline size (`vi`).

### Fluid Typography Scale

Defined in `src/styles/global.css` under Tailwind v4's `@theme`:

| Token | Formula | 320px Viewport | 1280px Viewport | Intended Role |
| :--- | :--- | :--- | :--- | :--- |
| `--text-step--1` | `clamp(0.875rem, calc(0.8333rem + 0.2083vi), 1rem)` | 14px | 16px | Captions, metadata, fine print |
| `--text-step-0` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` | 16px | 24px | Body copy, default interface text |
| `--text-step-1` | `clamp(1.25rem, calc(1rem + 1.25vi), 2rem)` | 20px | 32px | Section headings (`<h2>`), cards |
| `--text-step-2` | `clamp(1.75rem, calc(1.25rem + 2.5vi), 3.25rem)` | 28px | 52px | Page titles (`<h1>`), hero display |
| `--text-step-2-to-0` | `clamp(1rem, calc(0.25rem + 3.75vi), 3.25rem)` | 16px | 52px | High-contrast display bridge |
| `--text-step-3-to-1` | `clamp(1.25rem, calc(0.25rem + 5vi), 4.25rem)` | 20px | 68px | Dramatic hero display bridge |

All headings apply `text-wrap: balance` by default to prevent awkward single-word typographic orphans.

### Fluid Spatial Density Scale

Spacing grows proportionally with the screen, maintaining balanced visual weight from mobile phones to 4K monitors:

| Token | Formula | 320px Viewport | 1280px Viewport | Intended Role |
| :--- | :--- | :--- | :--- | :--- |
| `--spacing-content` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` | 16px | 24px | Flow margins, card inner padding |
| `--spacing-grid` | `clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem)` | 20px | 36px | Column gaps, figure margins |
| `--spacing-container`| `clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)` | 16px | 32px | Page horizontal gutter padding |
| `--spacing-section` | `clamp(3rem, calc(1rem + 10vi), 9rem)` | 48px | 144px | Vertical section breathing room |
| `--spacing-xl-to-sm` | `clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)` | 12px | 64px | High-contrast padding/gap bridge |
| `--spacing-2xl-to-md` | `clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)` | 20px | 104px | Hero/spotlight padding bridge |

Because `--spacing-section` expands from 48px to 144px naturally, you never need to write `@media (min-width: ...)` rules just to give desktop sections breathing room.

---

## 2. Typographic Measures (Line Lengths)

Unconstrained line lengths make paragraphs exhausting to read on wide screens. Baseline enforces three typographic boundaries plus a gutter-safe content measure:

```css
--measure-reading: 68ch;   /* Ideal line length for body prose (~60-75 characters) */
--measure-content: 76rem;  /* Standard content container (~1216px) */
--measure-content-safe: min(var(--measure-content), calc(100% - var(--spacing-container) * 2));
--measure-wide:    88rem;  /* Wide layouts, navbars, and media galleries (~1408px) */
```

Paragraphs and list items automatically inherit `max-width: var(--measure-reading)` with a comfortable line-height of `1.65`.

---

## 3. Structural Layout Primitives

Baseline provides small, semantic Astro layout primitives located in `src/components/`. They accept standard slots and forward custom class names.

### `<Container width="reading | content | wide" breakout />`

For standard sections, `<Container>` constrains inner content to one of the three established measures and centers it with `margin-inline: auto`. When `breakout` is enabled (`<Container breakout>`), it renders `.content-grid`—a multi-track CSS Grid where default children remain constrained to `--measure-reading` while specific child blocks can break out to wider named tracks (`feature`, `wide`, `full`) without closing and reopening the container:

```astro
---
import Container from '../components/Container.astro';
---

<!-- Standard content container (max-width: 76rem) -->
<Container width="content">
  <Grid minimum="standard"> ... </Grid>
</Container>

<!-- Editorial breakout container (.content-grid) for long-form articles & case studies -->
<Container breakout class="flow">
  <p>Default children stay in the comfortable reading column (68ch).</p>
  <figure class="content--feature">
    <!-- Expands to --measure-content (76rem) -->
  </figure>
  <div class="content--wide">
    <!-- Expands to --measure-wide (88rem) -->
  </div>
</Container>
```

### `<Section spacing="content | section" labelledBy="..." />`

Provides semantic `<section>` wrapping with consistent vertical rhythm and accessibility:

```astro
---
import Section from '../components/Section.astro';
import Container from '../components/Container.astro';
---

<Section labelledBy="news-heading" spacing="section">
  <Container width="content">
    <h2 id="news-heading">Latest Club News</h2>
    <!-- Content -->
  </Container>
</Section>
```
* `spacing="section"` (default): Applies fluid `padding-block: var(--spacing-section)`.
* `spacing="content"`: Applies compact `padding-block: var(--spacing-content)` for secondary panels or callouts.

### `<Grid minimum="compact | standard | wide" />`

A self-responsive CSS grid that automatically fits items across columns without media queries:

```astro
---
import Grid from '../components/Grid.astro';
import Card from '../components/Card.astro';
---

<Grid minimum="standard">
  <Card title="Article 1" href="/article-1" ... />
  <Card title="Article 2" href="/article-2" ... />
  <Card title="Article 3" href="/article-3" ... />
</Grid>
```

Under the hood, `<Grid>` uses CSS `minmax()` and `auto-fit`:
```css
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr));
  gap: var(--spacing-grid);
}

.grid-auto--compact  { --grid-min: 14rem; } /* 224px cards (e.g. badges, team avatars) */
.grid-auto--standard { --grid-min: 17rem; } /* 272px cards (e.g. standard article cards) */
.grid-auto--wide     { --grid-min: 21rem; } /* 336px cards (e.g. featured posts, complex items) */
```
Columns wrap naturally when screen space narrows, with zero layout shift or overlapping cards.

### `<Card />` (Turnkey Accessible Card & Concentric Radius)

`<Card>` renders a semantic `<article class="card">` and uses `.clickable-parent` on the heading's `<a>` tag so the entire card is clickable while screen readers announce only the heading as the link name. Paired with `.focus-parent` (`:focus-within:has(:focus-visible)`), keyboard navigation draws a single focus ring on the card perimeter without sticky mouse outlines. Customize cards via `--card-bg`, `--card-text`, `--card-muted`, `--card-border-color`, `--card-radius`, `--card-padding`, `--card-frame-padding`, `--card-gap`, `--card-shadow`, and automatic concentric media radius (`--card-media-radius: max(0px, calc(var(--card-radius) - var(--card-frame-padding)))`).

---

## 4. Editorial Smart Spacing (`.flow`)

Wrap CMS Portable Text and editorial articles in the `.flow` utility class to automatically establish vertical rhythm:

```astro
<div class="flow">
  <PortableText value={entry.data.body} />
</div>
```

The flow utility differentiates rhythm across headings, lists, figures, and blockquotes via CSS custom properties while preventing duplicate margin stacking after block elements:
```css
.flow > :where(* + *) {
  margin-block-start: var(--flow-space, var(--spacing-content));
}

.flow > :where(h2, h3, h4) {
  --flow-space: var(--heading-spacing, 1.5em);
}

.flow :where(li + li) {
  margin-block-start: var(--list-item-spacing, 0.35em);
}

.flow :where(img, figure, table, blockquote) {
  margin-block: var(--spacing-grid);
}

.flow > :where(img, figure, table, blockquote) + * {
  margin-block-start: 0;
}
```

---

## 5. Elevation Shadows, Easing, Masks & Contextual Surfaces

- **Multi-Layer OKLCH Shadows (`@theme`):** `--shadow-sm` (3-stop), `--shadow-md` (4-stop), and `--shadow-lg` (6-stop) derived from `oklch(from var(--color-text) l c h / alpha)`.
- **Curated Easing Curves (`@theme`):** `--ease-smooth`, `--ease-snappy`, and physics-inspired `--ease-spring` (via CSS `linear()`).
- **Background & Mask Helpers:** Mark background media with `.is-bg` (its parent automatically becomes `position: relative; isolation: isolate` via `:where(:has(> .is-bg))`), and apply `.fade--bottom`, `.fade--top`, `.fade--block`, or `.fade--inline` (`--fade-amount: 25%`) for surface-independent `mask-image` fades.
- **Contextual Surface Scopes:** Apply `data-surface="dark"` or `data-surface="light"` to any section or card to remap `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, and `--color-focus` together.

---

## 6. Agent-First Token Calibration & WCAG Contrast Audit (`npm run design:tokens`)

Baseline treats `src/styles/global.css` as the single source of truth for tokens, backed by an automated CLI engine (`scripts/design-system.mjs`) and live Vite HMR on `/_styleguide`:

1. **List or seed a canonical Aesthetic Lane preset:**
   ```sh
   npm run design:tokens -- --list-lanes
   npm run design:tokens -- --lane editorial-paper --write
   ```
   Available presets: `neutral`, `technical-systems`, `product-led-minimalism`, `editorial-paper`, and `luminous-futurism`.
2. **Generate parametric fluid scales or WCAG-safe OKLCH brand palettes:**
   ```sh
   # Derive all --text-step-* and --spacing-* fluid clamp() tokens from mathematical ratios
   npm run design:tokens -- --type-scale major-third --space-scale 1.5 --write

   # Synthesize a complete light + [data-surface="dark"] OKLCH palette from brand hex/OKLCH seeds
   npm run design:tokens -- --seed-accent "#1B4332" --seed-canvas "#FAF8F5" --write

   # Set individual @theme, :root (--root:...), or dark-surface (--dark:...) tokens
   npm run design:tokens -- --set "--radius-card=0.5rem" --set "--root:--measure-reading=64ch" --write
   ```
3. **Run the automated token & WCAG contrast audit and record Stage 4.5 evidence:**
   ```sh
   npm run design:tokens
   npm run design:tokens -- --write-calibration
   npm run test:design
   ```
   This directly parses `src/styles/global.css`, verifies all 10 perceptual WCAG AA contrast pairs across default and `[data-surface="dark"]` contexts, checks fluid `clamp()` bounds, confirms `/_styleguide` swatch and `src/` consumer coverage, and writes a deterministic `## Token Calibration` section (bound to the LF-normalised SHA-256 of `src/styles/global.css`) into `audit/component-calibration.md`.

---

## 7. Optional Visual Page Builder Integration (`@perkyzz/emvb`)

Core routes, collections, and long-form articles should use Baseline's zero-JS Astro primitives (`<Section>`, `<Container>`, `<Grid>`, `<Card>`, `.flow`). When a client also needs a drag-and-drop visual editor for bespoke marketing landing pages or popups, integrate **[EmVB](https://emvb.dev/)** (`@perkyzz/emvb`) as an optional Stage 2 native plugin:

1. **Install EmVB (and optional MCP server):**
   ```sh
   npm install @perkyzz/emvb
   ```
2. **Register in `astro.config.mjs` and pass `canvasStyles`:**
   Pass your global stylesheet so the EmVB editor iframe and rendered blocks inherit Baseline's typography and CSS custom properties:
   ```js
   import { emvb } from "@perkyzz/emvb";

   // Inside emdash({ plugins: [...] }):
   emvb({
     canvasStyles: ["/src/styles/global.css"],
   })
   ```
3. **Resolve EmVB pages in `src/pages/[slug].astro`:**
   ```astro
   ---
   import { resolveEmVBPage } from "@perkyzz/emvb/runtime";
   import EmVBPage from "@perkyzz/emvb/astro/EmVBPage.astro";

   const emvb = await resolveEmVBPage(Astro);
   ---
   {emvb ? <EmVBPage page={emvb} /> : (
     <!-- Standard Astro template fallback -->
   )}
   ```
4. **Synchronize tokens via MCP (`@perkyzz/emvb-mcp`):**
   Agents can use `emvb_get_styles` and `emvb_update_styles` to align EmVB's site-styles palette and fluid typography scale with the OKLCH and `clamp()` tokens defined in `src/styles/global.css`.
