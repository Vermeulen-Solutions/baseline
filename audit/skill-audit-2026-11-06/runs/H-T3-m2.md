## Answer

**Mechanism: intrinsic flex-wrap on the card itself.** No viewport media query, no container query and no per-placement variant class.

Why: `astro-site-design/references/responsive-architecture.md` says to pick the lowest-numbered mechanism that solves the problem. Row 1 is intrinsic reflow, and a wrapping flex row switches on the space the card actually receives. That is exactly the rule requested ("beside if there is room, otherwise above"), and it applies unchanged in the grid cell, the article sidebar and the homepage band, with no threshold to maintain. A viewport query is wrong here because one viewport width gives three different slot widths. A container query (row 2) is the fallback if the design later needs a fixed switch width that does not depend on content (see below).

CSS, in a named components layer as `docs/site-working-rules.md` requires:

```css
@layer components {
  .product-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-content);
  }
  .product-card__media {
    flex: 1 1 12rem;   /* minimum useful image width */
    min-inline-size: 0;
    margin: 0;
  }
  .product-card__media img {
    display: block;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
  .product-card__body {
    flex: 3 1 16rem;   /* minimum readable text width */
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
}
```

The wrap point is about 12rem + 16rem + the gap (roughly 29rem). Below it, each item grows to a full line, so the image sits above the text. At or above it, they sit side by side. Expected placements, to be confirmed in the browser and not measured here: shop grid cells (about 24rem in a 76rem container) stack; the article sidebar stacks; the homepage band goes side by side.

Wrapper markup: the component root is the flex row, so the caller adds no wrapper.

```astro
<article class="product-card">
  <div class="product-card__media">
    <Image src={image} alt={alt} sizes={sizesForThisPlacement} />
  </div>
  <div class="product-card__body flow">
    <h3><a href={href}>{title}</a></h3>
    <p>{price}</p>
  </div>
</article>
```

Source order is image first, so reading order matches the visual order in LTR. `dir="rtl"` flips the row automatically. Do not use `order`, `row-reverse` or a second markup tree. The `gap` owns the image/text relationship and `.flow` owns the spacing inside the body, so no margins fight the gap.

Why not the other primitives: `Grid` (auto-fit columns) arranges cards, not the parts of one card. `Sidebar` is a page-level two-region layout (main and aside), and the card sits inside its aside. Neither controls the card's internal arrangement.

Do not copy `Card`'s `layout="horizontal"` pattern as described in `astro-primitives.md`: it uses `@container (max-width: 32rem)` plus a viewport `@media (max-width: 40rem)` fallback. A max-width query and a viewport fallback both go against `responsive-architecture.md`, which says to enhance at min-width and not to use viewport queries for slot-driven behavior. Reconcile it if ProductCard is built on Card.

Fallback if a deterministic switch is required (for example, side-by-side only from a fixed width regardless of title length). Put the container on a block-level wrapper inside the grid cell, sidebar or band, not on the grid, and name it:

```css
.product-card-slot { container: product-card / inline-size; }
.product-card { display: grid; gap: var(--spacing-content); }  /* stacked default */
@container product-card (min-width: 36rem) {  /* example value: measure the longest title */
  .product-card { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: center; }
}
```

Inline-size containment collapses a shrink-to-fit wrapper, so the wrapper must be block-level.

Limits of this answer: the project folder has no `src/` directory and no ProductCard, Grid, Sidebar, Card or global.css. I took the component contracts from the docs, not from code. `AGENTS.md` has no `## Art Direction Record`, so visual implementation is gated: save the record and pass `npm run check:art-direction -- --require-record` in the real project before writing this CSS. I ran no commands and changed no files.

## Checks before calling it done

1. Art Direction Record saved in `AGENTS.md`, `check:art-direction` passes, and the ProductCard is calibrated on `/_styleguide` with evidence in `audit/component-calibration.md`.
2. Measure the real slot widths at 320, 768, 1024 and 1440 CSS px: the grid column, the narrowest sidebar and the full band. Confirm the flip point by testing just below and just above about 29rem, and confirm side-by-side appears only when both minimums fit.
3. Stress the card: longest title, a long unbroken SKU or URL, no image, tall and wide image ratios, longer translated copy and price variants. Check for no horizontal overflow at 320, 375, 768 and 1440 px and for no clipped text.
4. Browser text resize at 200%, 400% zoom reflow and the text-spacing override, with no clipping and no horizontal page scroll.
5. Image: use Astro `Image` from `src/assets/` with `sizes` that match each placement (side-by-side media is narrower than a full band), and keep `aspect-ratio` to avoid layout shift. Give the above-the-fold band image eager loading.
6. Semantics: one link name per card (the heading link), visible focus, reading order image then text, and an RTL check with `dir="rtl"`.
7. Rules: CSS in `@layer components`, no `!important`, no viewport media query, no per-placement class, and no margins fighting the gap.
8. Run `npm.cmd run verify:fast` during edits, then `npm.cmd run verify`, `npm.cmd run build` and `npm.cmd run audit:html` on a fresh build. Run visual regression only locally on Windows.

## Files read

1. AGENTS.md
2. docs/site-working-rules.md
3. docs/design-framework.md
4. docs/native-composition.md
5. .agents/skills/astro-site-design/SKILL.md
6. .agents/skills/astro-site-design/references/responsive-architecture.md
7. .agents/skills/astro-site-design/references/astro-primitives.md
