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

All headings apply `text-wrap: balance` by default to prevent awkward single-word typographic orphans.

### Fluid Spatial Density Scale

Spacing grows proportionally with the screen, maintaining balanced visual weight from mobile phones to 4K monitors:

| Token | Formula | 320px Viewport | 1280px Viewport | Intended Role |
| :--- | :--- | :--- | :--- | :--- |
| `--spacing-content` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` | 16px | 24px | Flow margins, card inner padding |
| `--spacing-grid` | `clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem)` | 20px | 36px | Column gaps, figure margins |
| `--spacing-container`| `clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)` | 16px | 32px | Page horizontal gutter padding |
| `--spacing-section` | `clamp(3rem, calc(1rem + 10vi), 9rem)` | 48px | 144px | Vertical section breathing room |

Because `--spacing-section` expands from 48px to 144px naturally, you never need to write `@media (min-width: ...)` rules just to give desktop sections breathing room.

---

## 2. Typographic Measures (Line Lengths)

Unconstrained line lengths make paragraphs exhausting to read on wide screens. Baseline enforces three typographic boundaries:

```css
--measure-reading: 68ch;   /* Ideal line length for body prose (~60-75 characters) */
--measure-content: 76rem;  /* Standard content container (~1216px) */
--measure-wide:    88rem;  /* Wide layouts, navbars, and media galleries (~1408px) */
```

Paragraphs and list items automatically inherit `max-width: var(--measure-reading)` with a comfortable line-height of `1.65`.

---

## 3. Structural Layout Primitives

Baseline provides small, semantic Astro layout primitives located in `src/components/`. They accept standard slots and forward custom class names.

### `<Container width="reading | content | wide" />`

Constrains inner content to one of the three established measures and centers it with `margin-inline: auto`:

```astro
---
import Container from '../components/Container.astro';
---

<!-- Reading column for articles or long-form prose (max-width: 68ch) -->
<Container width="reading">
  <p>Editorial text that stays comfortable to read on any screen.</p>
</Container>

<!-- Standard content container (max-width: 76rem) -->
<Container width="content">
  <Grid minimum="standard"> ... </Grid>
</Container>

<!-- Wide container for hero headers or full-width photo galleries (max-width: 88rem) -->
<Container width="wide">
  <PhotoGallery ... />
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
  <Card title="Article 1" ... />
  <Card title="Article 2" ... />
  <Card title="Article 3" ... />
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

---

## 4. Editorial Flow (`.flow`)

Wrap CMS Portable Text and editorial articles in the `.flow` utility class to automatically establish vertical rhythm:

```astro
<div class="flow">
  <PortableText value={entry.data.body} />
</div>
```

The flow utility applies the "lobotomized owl" selector to insert margins between sibling elements without adding unwanted top/bottom margins to the container:
```css
.flow > :where(* + *) {
  margin-block-start: var(--flow-space, var(--spacing-content));
}

.flow :where(img, figure, table, blockquote) {
  margin-block: var(--spacing-grid);
}
```

---

## 5. Live Calibration via the Dev HUD

Instead of manually editing pixel values and refreshing, calibrate your site's token physics live in the browser:
1. Run `npm run dev`.
2. Press **`T`** to open the TweaksBar drawer.
3. Adjust fluid typography steps, line-heights, tracking, and spatial density with real-time feedback on your actual content.
4. Press **`B`** to A/B toggle against your source CSS baseline.
5. Click **Copy Tokens** to export clean Tailwind `@theme` CSS, paste it into `src/styles/global.css`, and reload.
