# ProductCard image-beside-text layout

## Answer

**Blocking finding first.** The project root has no `src/` directory in this copy. A search for `ProductCard`, `Grid`, `Sidebar`, `Container` and `global.css` found no files. I could not read the existing component, its props, or the shared tokens file, so the code below is a design for the component as described, not a patch to the existing file. Also, `AGENTS.md` only mentions the **Art Direction Record**; it does not contain a saved one. The gate in `AGENTS.md` and `docs/site-working-rules.md` says visual implementation must wait until that record exists and `npm run check:art-direction -- --require-record` passes.

**Mechanism: a container query on an ancestor the component owns, with a local threshold.** The `astro-site-design` skill (`responsive-architecture.md`, row 2) describes this case directly. One component has two named arrangements, and its inline space changes independently of the viewport. Viewport media queries would give the same answer at 1440px for the sidebar and the feature band, which is wrong. A flex-wrap or intrinsic approach (row 1) can flip the layout, but the switch point would then depend on flex bases and gaps, not a stated threshold. The skill also says a query should be placed on the slot wrapper, not on the grid, and not on the card itself.

**Wrapper markup.** The component renders a slot wrapper that it owns, and the card sits inside it. Each of the three callers places the component inside its own layout; the wrapper is the element that gets measured.

```astro
---
// ProductCard.astro (sketch; props and Image sizes come from the existing component)
const { product, sizes = "100vw" } = Astro.props;
---
<div class="product-card-slot">
  <article class="product-card">
    <figure class="product-card__media">
      <img src={product.image.src} alt={product.image.alt} width="800" height="600" loading="lazy" sizes={sizes} />
    </figure>
    <div class="product-card__body flow">
      <h3><a class="clickable-parent" href={product.href}>{product.name}</a></h3>
      <p>{product.price}</p>
    </div>
  </article>
</div>
```

**CSS** (layered, zero-specificity defaults, spacing from tokens):

```css
@layer components {
  .product-card-slot {
    container: product-card / inline-size;
    min-inline-size: 0;
  }

  :where(.product-card) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-content);
  }

  :where(.product-card__media) {
    margin: 0;
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }

  :where(.product-card__media img) {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  @container product-card (min-width: 36rem) {
    :where(.product-card) {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: center;
    }
  }
}
```

Reasoning behind the specific choices:

- The stacked layout is the default. A browser without container queries, or a slot with no container, still gets image above text.
- `container: product-card / inline-size` is named, so it cannot be confused with another container the layout might add.
- `minmax(0, 1fr)` and `min-inline-size: 0` stop a long unbroken product name from widening a narrow track.
- The `gap` is the content token. The `.flow` on the body spaces only the children inside the body, so the card does not put a gap and a flow margin on the same relationship.
- `36rem` is a placeholder. It is local to this component, so it should not become a shared breakpoint. The right value is the width at which the longest real product name and price still fit side by side.
- The three placements behave as the request asks:
  - Sidebar: the supporting region gets about a third of the reading measure, roughly 12rem, so the query is false and the card stacks.
  - Shop grid: at a 76rem content container with three columns and the grid gap, each cell is about 380px, below 36rem, so cards stack. This is correct for the request, but if the shop should be side by side, the threshold and the grid column count have to change together.
  - Feature band: the full content width gives each column roughly 600px, so the query is true and the card sits side by side.
- The image uses a fixed `aspect-ratio` and `width`/`height`, so loading does not shift the layout. The `sizes` value must come from the caller, because the image width depends on the placement, not on the viewport.
- The `clickable-parent` on the heading link follows the existing Card contract, so the whole card stays clickable with one link name.

**Alternative to check first.** `astro-primitives.md` says `Card` already handles `layout="horizontal"` with a container query and a media-query fallback. If the existing `Card` has that contract, `ProductCard` should wrap `Card` rather than add a second implementation. I could not check this because `Card.astro` is not in the copy.

## Files read

Searches that found nothing (not opened): `ProductCard`/`product-card` (Grep across the project root), `**/{ProductCard,Sidebar,Grid,Container}.astro` (Glob), `src/components/*` (Glob), `src/**/*` (Glob, no files). `Art Direction Record` matched 35 files by name only, which I did not open.

1. AGENTS.md
2. docs/site-working-rules.md
3. docs/native-composition.md
4. docs/design-framework.md
5. .agents/skills/astro-site-design/SKILL.md
6. .agents/skills/astro-site-design/references/responsive-architecture.md
7. .agents/skills/astro-site-design/references/astro-primitives.md

## What to check before calling it done

1. The threshold, measured: render the longest real product name and price in each of the three placements at 375px, 768px and 1440px, plus widths just below and above 36rem. Confirm that the sidebar stacks, the shop grid cells match the intended layout, and the feature band goes side by side.
2. Narrowest real placement: check the sidebar slot, not only the phone and desktop presets.
3. Fallback: disable the container query in devtools. The stacked layout must still read well.
4. Layout integrity: confirm the wrapper has a definite width in each parent. A shrink-to-fit parent would collapse under `inline-size` containment. Check for horizontal overflow at 320px and 400% zoom, and for clipping at 200% text resizing.
5. Long titles, unbroken URLs, missing images and unusual image ratios.
6. Image: `alt` text, `sizes` per placement, and no layout shift on load.
7. Keyboard and focus: one focus ring on the card through `clickable-parent`/`focus-parent`; DOM order matches the visual order (image first, then text) in both arrangements; RTL puts the image on the expected side.
8. Tokens and layering: no new pixel values beyond the threshold, all CSS in `@layer components`, selectors using `:where()` so utilities override them.
9. Gate and verification: save the real Art Direction Record, run `npm run check:art-direction -- --require-record`, add the three placements to `/_styleguide` for calibration, then run `npm run verify`, `npm run build` and `npm run audit:html` as `AGENTS.md` requires. Record the rendered evidence in `audit/component-calibration.md`.
