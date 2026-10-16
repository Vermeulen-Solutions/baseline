# EmDash Portable Text and layout flow

Read when rendering EmDash Portable Text, blog bodies, or other CMS-generated rich content.

## Boundary and wrapper

Treat CMS content as a content model rendered inside a presentation-owned wrapper, for example `<div class="flow prose"><PortableText value={entry.data.content} /></div>`. Keep querying/normalizing content outside visual styles. Inspect the actual tags emitted by the installed EmDash renderer and any custom blocks before writing selectors; Portable Text may include paragraphs, headings, lists, quotes, images, tables, embeds, and plugin blocks.

## Rhythm and Smart Spacing (`.flow`)

Reset browser heading/paragraph margins in the base layer so layout gaps are deliberate. Scope rich-text rhythm to `.flow` instead of putting flow margins on every site's `p` and heading. Baseline's `.flow` rule differentiates element rhythm via customizable variables and prevents duplicate margin stacking after block figures/quotes/tables:

```css
.flow > :where(* + *) {
  margin-block-start: var(--flow-space, var(--spacing-content));
}

.flow > :where(h2, h3, h4) {
  --flow-space: var(--heading-spacing, 1.5em);
}

.flow > :where(ul, ol) {
  --flow-space: var(--list-spacing, var(--spacing-content));
}

.flow :where(li + li) {
  margin-block-start: var(--list-item-spacing, 0.35em);
}

.flow > :where(figure, img, table) {
  --flow-space: var(--figure-spacing, var(--spacing-grid));
}

.flow > :where(blockquote) {
  --flow-space: var(--blockquote-spacing, var(--spacing-grid));
}

.flow > :where(img, figure, table, blockquote) + * {
  margin-block-start: 0;
}
```

Tune `--heading-spacing`, `--list-spacing`, `--list-item-spacing`, `--figure-spacing`, and `--blockquote-spacing` per site direction. Avoid adding both parent `gap` and child margins for the same rhythm.

## Editorial breakout grid (`.content-grid`)

When a long-form article, case study, or editorial page needs prose constrained to `--measure-reading` (`68ch`) while allowing figures, pull-quotes, tables, or galleries to break out wider without closing and reopening containers, use `<Container breakout class="flow">` (`.content-grid`):
- Default children automatically occupy the `content` track (`--measure-reading`).
- Add `.content--feature` to span `--measure-content` (`76rem`), `.content--wide` to span `--measure-wide` (`88rem`), `.content--full` for edge-to-edge viewport bleed, or `.content--full-safe` for full bleed with inline container padding.

Check the EmDash inline edit mode as well as public output. Inline editing may replace normal Portable Text HTML with editor controls, so scope typography rules to rendered content and ensure reset/flow rules do not interfere with editor affordances. Don't assume the component's own styles define the host site's type or spacing.

## Content safety and presentation

- Keep global type defaults predictable, but don't force article measure or heading sizes onto navigation, cards, forms, and other non-prose UI.
- Images need responsive sizing, an appropriate crop/aspect ratio, and useful alternative text handling. Tables and embeds need overflow/keyboard checks at mobile widths.
- Prefer semantic selectors inside the wrapper over utility class names stored in CMS data; Tailwind's build-time scanner cannot infer arbitrary runtime content.
- Keep style overrides local to the rich-text wrapper so EmDash admin editing and unrelated site components retain their own behavior.
