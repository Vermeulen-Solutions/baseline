# H-T3-k7b

## Answer

**What the folder contains.** The site folder has no `src/` tree. There is no `ProductCard`, `Card.astro`, `Grid.astro`, `Sidebar.astro` or `global.css` to read. The proposal below is written against the documented primitives and rules in `docs/native-composition.md`, `docs/design-framework.md` and `.agents/skills/astro-site-design/references/responsive-architecture.md`. It must be matched to the real component before use.

**Blocking gate.** `AGENTS.md` has no `## Art Direction Record`. Visual work under `src/` is blocked until a complete record is saved and `npm run check:art-direction -- --require-record` passes.

**Mechanism: a container query on a per-placement wrapper, with the narrow layout as the default.**

- The card's width is set by where it is placed, not by the viewport. The same viewport width gives different card widths in the shop grid, the article sidebar and the homepage band. A media query would give one answer per viewport, so it is the wrong tool.
- `responsive-architecture.md` names this exact case (one card in a sidebar, a grid cell and a full-width feature) as the container-query case.
- Intrinsic `flex-wrap` is the first option in the skill's order and could work. I reject it here because it switches on text minimum width rather than a deliberate two-mode layout with a fixed media ratio. If the real card cannot meet that brief, fall back to flex-wrap.
- The query must measure a wrapper, not the card. A card cannot query its own size to restyle itself. So each placement wraps the card in a slot element that owns the container.

**Wrapper markup.** Use the same slot element in all three placements, inside whatever region already exists.

```astro
<!-- shop grid: inside the existing Grid -->
<div class="product-slot"><ProductCard ... /></div>

<!-- article sidebar: inside the existing supporting region -->
<div class="product-slot"><ProductCard ... /></div>

<!-- homepage band: inside the existing Container -->
<div class="product-slot"><ProductCard ... /></div>
```

**CSS (named layer, zero-specificity defaults, no `!important`):**

```css
@layer components {
  :where(.product-slot) {
    container: product-slot / inline-size;
    min-inline-size: 0;
  }

  :where(.product-card) {
    display: grid;
    gap: var(--card-gap);
  }

  :where(.product-card__media) {
    aspect-ratio: 4 / 3;      /* ratio from the brief */
    object-fit: cover;
    min-inline-size: 0;
  }

  /* 36rem is a placeholder. Measure the real card and set the switch point from it. */
  @container product-slot (min-width: 36rem) {
    :where(.product-card) {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); /* or the brief's ratio */
      align-items: center;
    }
  }
}
```

Notes on the wrapper and CSS:

- `container-type: inline-size` means the slot's own inline size no longer depends on its content. The slot must get its width from its grid or flex parent. Grid items do; check the sidebar region.
- Use logical properties throughout so RTL works.
- Use gap, not margins, for the image-to-text relationship (`AGENTS.md`: do not mix gaps with flow margins for the same relationship).

**Expected placement behavior.**

- Homepage band: full width, so it goes side by side on desktop and stacks on a phone, with no separate media queries.
- Article sidebar: the supporting region is about one third of the reading measure, so the card stays stacked. That is the intended result.
- Shop grid: each column is roughly 24rem at desktop, so the card probably stays stacked at a 36rem switch point. That is correct by the rule. If the brief wants side by side in the grid, that is a design decision (lower the threshold or change the grid), not a CSS fix. Measure before deciding.

## Files read

Paths are relative to the project root (`site-k7`).

1. `AGENTS.md`
2. `docs/site-working-rules.md`
3. `docs/native-composition.md`
4. `docs/design-framework.md`
5. `.agents/skills/astro-site-design/SKILL.md`
6. `.agents/skills/astro-site-design/references/responsive-architecture.md`

Searches only (not opened): Glob for `src/**`, `**/*.astro`, `src/components/*.astro`, and Grep for `ProductCard` and `Art Direction Record`. The Grep overflow output was saved outside the project and was not opened.

## Checks before calling it done

1. **Gate.** A complete `## Art Direction Record` is saved in `AGENTS.md`. `npm run check:art-direction -- --require-record` passes. The edited files are not covered by an exception.
2. **Layers.** Every authored rule sits in `@layer components` or `base`. Defaults use `:where()`. `gap-*` utilities can still override. No `!important`. Run `npm run verify`, which covers lint, art direction, token audits, typecheck and tests, and check the CSS contract.
3. **Measure the switch.** In the browser, read each slot's real width at 375, 768, 1024 and 1440px in all three placements. Set the threshold from the real content. Test just below and just above it.
4. **Fallback.** Temporarily disable the `@container` rule. The stacked layout must stay readable.
5. **Content stress.** Long titles, long unbroken URLs or prices, a missing image, portrait and panoramic images, and translated strings. No horizontal overflow at 375px. `min-inline-size: 0` holds in grid and flex tracks.
6. **Zoom.** Check 200% text resize and 400% zoom in Chromium. Content must reflow with no clipping and no horizontal page scroll.
7. **Semantics and order.** The image comes first in the DOM. Check reading order in RTL. The clickable-parent and focus-parent link still gives one focus ring on the card.
8. **Images.** Use `src/assets` with Astro `<Image>` and a set aspect ratio to avoid layout shift. Alt text is meaningful, or empty when decorative. The homepage band image is probably above the fold, so give it eager loading and high fetch priority.
9. **Calibration.** Add narrow and wide placements to `/_styleguide`. Run `npm run design:tokens` and `npm run test:design`. Record evidence in `audit/component-calibration.md`.
10. **Shared component.** Check that no page-level overrides leaked into the three placements and that other `Card` uses are unchanged.
11. **Not verified.** Nothing was rendered or run. No code exists in this folder, so no browser evidence supports this proposal.
