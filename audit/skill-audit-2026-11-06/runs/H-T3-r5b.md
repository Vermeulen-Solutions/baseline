## Answer

**Finding first: the ProductCard component is not in this folder.** The project root has no `src/` directory and no `.astro` files, so there is no ProductCard, no shop/article/homepage pages, and no `src/styles/global.css`. A file search for `ProductCard` and `product-card` found nothing. The CSS and markup below are the design I would apply against Baseline's primitives and contracts. I have not checked them against the real component, and the threshold value must be measured on real content.

**Mechanism: a container query on a wrapper around each placement, not a viewport media query and not flex-wrap.**

- `responsive-architecture.md` row 2 applies. The card has two distinct layouts (image beside text, image above text), and its inline space changes independently of the viewport. The same card is a narrow sidebar slot at 1440px, a grid cell, and a full-width band. A viewport media query would switch all three at the same width, which is wrong for the sidebar.
- Row 1 (intrinsic `flex-wrap`) is excluded because the component has two named arrangements. A flex-wrap switch point would be the sum of flex bases and gaps, not a tested width, and it moves whenever copy or tokens change.
- Row 3 (media query) is excluded because the viewport does not know the slot width.
- The rule "query an ancestor, never the element itself" applies, so the container is a wrapper, not the `<article>`.
- The rule "put the container on the slot, not the whole grid" applies, so each card gets its own wrapper and the grid is not the container.
- The narrow layout stays outside `@container`, and the side-by-side layout is enhanced at `min-width`. A browser without container queries, or a slot with no container, gets the stacked layout (image above text).

**Wrapper markup.** The ProductCard component owns its slot wrapper, so callers do not repeat the contract. Image comes first in DOM order in both layouts, so no `order` or `row-reverse` is needed.

```astro
<div class="product-card-slot">
  <article class="product-card">
    <Image class="product-card__media" src={image} alt={alt}
           sizes="(min-width: 64rem) 33vi, 100vi" width={w} height={h} />
    <div class="product-card__body flow">
      <h3 class="product-card__title clickable-parent"><a href={href}>{title}</a></h3>
      <p>{price}</p>
    </div>
  </article>
</div>
```

The `sizes` value must match each real placement. Set it per placement or pass a prop from the caller, because the sidebar and the feature band render at very different widths.

**CSS** (in a named components layer, no `!important`, zero-specificity contextual defaults):

```css
@layer components {
  .product-card-slot {
    container: product-card / inline-size;
    min-inline-size: 0;
  }
  .product-card {
    display: grid;
    gap: var(--spacing-content);
  }
  .product-card__media {
    display: block;
    inline-size: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
  @container product-card (min-width: 36rem) {
    .product-card {
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      align-items: start;
    }
  }
}
```

The `36rem` value is a placeholder. Set it where the longest real title and price stop fitting side by side. Use `minmax(0, …)` tracks so long unbroken words do not widen the track. Adjust the 2fr/3fr ratio to the real image and text content.

**Per placement:**

- **Shop grid (three columns):** Grid owns the column count and gap through its intrinsic `auto-fit` columns, and the slot wrapper inside each cell is the container. Most cells will stay stacked. Check whether any cell crosses the threshold at the widths where the grid has three columns.
- **Article sidebar:** Use the `Sidebar` primitive's supporting region (`aside`) as the caller. The slot wrapper is still the container. The sidebar's supporting basis is about one third of the reading measure, so the card should stay stacked. If it does not, the threshold is too low.
- **Homepage feature band:** Place the card inside a `Container` within a `Section`. The slot is wide, so the side-by-side layout applies. Do not add a viewport media query for the band.

**Why not a wrapper-free approach.** `Card` already has a `layout="horizontal"` variant with a container query plus a `@media (max-width: 40rem)` fallback. A viewport fallback reintroduces the failure this design avoids, so check that variant before reusing it. Extend it through the container rule or build ProductCard separately.

## Files read

1. AGENTS.md
2. README.md
3. docs/site-working-rules.md
4. docs/native-composition.md
5. docs/design-framework.md
6. .agents/skills/astro-site-design/SKILL.md
7. .agents/skills/astro-site-design/references/responsive-architecture.md
8. .agents/skills/astro-site-design/references/astro-primitives.md

Directory searches (listings only, no content opened): `**/*ProductCard*`, `src/components/**/*.astro`, `.agents/skills/astro-site-design/**/*.md`, a content search for `ProductCard|product-card`, `src/**/*`, `**/*.astro`, and the project root listing.

## What I would check before calling it done

1. The real ProductCard source exists and is the one the three placements use. Confirm the wrapper and class names match the code above.
2. An Art Direction Record is saved in AGENTS.md, and `npm run check:art-direction -- --require-record` passes before visual edits under `src/`. AGENTS.md currently has no record, so this gate blocks the work.
3. Measure the threshold with the longest real title and price in the narrowest real placement (the sidebar). Test just below and just above it.
4. Check each placement at 375px, 768px, and 1440px, plus the widths where the shop grid changes column count. Check for horizontal overflow and clipped text.
5. Disable the container query in devtools and confirm the stacked layout is readable in every placement.
6. Check the grid with 2, 3, and 4 cards, including an incomplete last row, and confirm the container is the per-card wrapper, not the grid.
7. Check RTL: grid columns follow the writing direction, so the image should move to the inline-end side without extra CSS. Confirm the logical properties are used.
8. Check the image: `sizes` matches each placement, `aspect-ratio` or `width`/`height` prevents layout shift, alt text is set, and the file comes from `src/assets/` or the media library, not `public/`.
9. Check the focus and link behavior: the heading link is the only link name, the whole card is clickable through the existing `clickable-parent` pattern, and the focus ring is visible.
10. Check 200% text resize and 400% zoom for reflow without clipping.
11. Run the checks in AGENTS.md on a fresh build: `npm.cmd run verify:fast` during edits, then `npm.cmd run verify`, `npm.cmd run build`, and `npm.cmd run audit:html`. Run `npm run test:design` if styleguide specimens change. Run visual regression only locally on Windows.
12. Add ProductCard to `/_styleguide` as a calibration specimen with the stacked and side-by-side states, and record it in `audit/component-calibration.md`.
