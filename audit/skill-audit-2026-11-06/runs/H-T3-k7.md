## Answer

### What the repository contains

- There is no `ProductCard` component, no `src/` directory, and no shop, article or homepage caller in this folder. It holds `AGENTS.md`, `README.md`, `package.json`, `docs/` and `.agents/`. The markup and CSS below are a proposal written against the documented primitive contracts, not an edit to existing code.
- `AGENTS.md` has no `## Art Direction Record`. This is client visual work, so the gate in `AGENTS.md` and `docs/site-working-rules.md` applies. Save a complete record (lane, narrative metaphor, typography pairing, token physics, 2–3 anti-patterns) and pass `npm run check:art-direction -- --require-record` before writing this CSS into `src/`.
- The root has no `baseline.config.json`, so this is the EmDash Node.js + SQLite profile. On Windows, run `npm.cmd` commands.

### Mechanism: container query on a component-owned wrapper

The three placements differ in width for reasons unrelated to the viewport: a grid cell, a narrow sidebar third, and a full-width band. `astro-site-design/references/responsive-architecture.md` names this exact case ("the same card in a sidebar, grid cell, and full-width feature") as the one that calls for a container query. A media query would key off the viewport and get both the grid and the sidebar wrong at 1440px.

- The wrapper is owned by the component, not by callers, so the rule is identical in all three placements. Querying the grid would measure the whole grid, so the query container sits on the card's own slot.
- The narrow layout is the default outside `@container`, and the wide layout expands at `min-width`. A browser or CSS path without container queries still gets a readable stacked card.
- Intrinsic CSS comes first in the skill's order. A `flex-wrap` version was the alternative. I rejected it because it gives no explicit two-layout contract and leaves the switch point implicit.
- `Sidebar` is not the card's layout. It is a page-level two-region primitive (main plus supporting content), so the article page uses it and the card sits inside its `<aside>`.
- The `:has(> &)` parent-query trick is not used. It would silently make whatever parent the card lands in a query container.

Proposed `ProductCard.astro` markup:

```astro
---
import { Image } from 'astro:assets';
const { name, href, summary, price, image, alt, imageSizes = '100vw' } = Astro.props;
---
<div class="product-slot">
  <article class="product-card">
    <figure class="product-card__media">
      <Image src={image} alt={alt} sizes={imageSizes} />
    </figure>
    <div class="product-card__body flow">
      <h3><a class="card-link clickable-parent" href={href}>{name}</a></h3>
      <p>{summary}</p>
      <p class="tabular-nums">{price}</p>
    </div>
  </article>
</div>
```

For CMS-backed images, pass the EmDash image field whole to `Image` from `emdash/ui` instead of `astro:assets`, as the skill requires. Use `alt=""` only for decorative images.

Proposed CSS (in a `components` layer):

```css
@layer components {
  .product-slot {
    container: product-card / inline-size;
    min-inline-size: 0;
  }

  .product-card {
    display: grid;
    gap: var(--spacing-content);
    min-inline-size: 0;
  }

  .product-card__media {
    margin: 0;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: var(--radius-card);
  }

  .product-card__media img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .product-card__body {
    min-inline-size: 0;
    overflow-wrap: break-word;
  }

  @container product-card (min-width: 36rem) {
    .product-card {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: center;
    }

    .product-card__media {
      aspect-ratio: 1 / 1;
    }
  }
}
```

The `36rem` threshold is a placeholder. It must be chosen from real content at the real placement widths.

Caller usage:

- **Shop grid:** `Grid` with `minimum="standard"`, one `ProductCard` per item, and `imageSizes` set for the column width. Note that at the 76rem content measure with the default grid gap, each of three columns is roughly 24rem. This is an estimate, not a measurement. A 36rem threshold keeps shop cards stacked. Side-by-side in the shop grid needs a threshold near or below the column width, which may be too cramped. Decide that from rendered cards, and accept stacked cards if that is the honest result.
- **Article sidebar:** `Sidebar` with the article in main and `<aside aria-label="…">` holding the card. The aside is about a third of the reading measure, so the card will almost always stack. That is the intended result.
- **Homepage band:** `Section` with `Container width="wide"`. This is the placement most likely to go side-by-side. Use eager loading and high fetch priority only if the band is above the fold.

### Checks before calling it done

1. Art Direction Record saved and `npm run check:art-direction -- --require-record` passes. Also run `npm run design:tokens` and `npm run test:design`.
2. Calibrate on `/_styleguide` with the card in each of the three real placements, and record observations in `audit/component-calibration.md`. A generated checklist is not browser evidence.
3. Render at 375px, 768px, 1440px, and at widths just either side of the threshold in each placement. Confirm zero horizontal overflow and no clipped text.
4. Stress the content: long titles, unbroken strings, missing or odd-ratio images, empty summary, and one or many cards in the shop grid.
5. Disable the container query and confirm the stacked fallback still reads correctly.
6. Check 200% text resize and 400% zoom for reflow.
7. Check keyboard focus (one visible focus ring at card level via `.focus-parent`), link name (heading text only), and reading order when the card is side-by-side.
8. Check `sizes` per placement against the rendered image width, and that width/height or aspect-ratio prevents layout shift.
9. If product data comes from EmDash, verify the edit proxies, save and reload, and that media resolves through the EmDash API.
10. Run `npm.cmd run verify:fast` during edits, then `npm.cmd run verify`, `npm.cmd run build` and `npm.cmd run audit:html` against that fresh build. Run `npm.cmd run doctor` before installing dependencies.

### Not read

I did not open `site-art-direction` (lane and metaphor), `component-quarantine.md`, `impeccable`, or `docs/visual-regression.md`. Each is relevant to steps 1, 2 and 4 above and should be read before the work starts.

## Files read

1. AGENTS.md
2. README.md
3. docs/site-working-rules.md
4. docs/native-composition.md
5. .agents/skills/astro-site-design/SKILL.md
6. .agents/skills/astro-site-design/references/responsive-architecture.md
7. docs/design-framework.md
8. .agents/skills/astro-site-design/references/astro-primitives.md

Glob and Grep were used to search the folder for `ProductCard`, `src/`, and container-query usage. Those were searches, not opened files.
