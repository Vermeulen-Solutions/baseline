# EmDash Portable Text and layout flow

Read when rendering EmDash Portable Text, blog bodies, or other CMS-generated rich content.

## Boundary and wrapper

Treat CMS content as a content model rendered inside a presentation-owned wrapper, for example `<div class="flow prose"><PortableText value={entry.data.content} /></div>`. Keep querying/normalizing content outside visual styles. Inspect the actual tags emitted by the installed EmDash renderer and any custom blocks before writing selectors; Portable Text may include paragraphs, headings, lists, quotes, images, tables, embeds, and plugin blocks.

## Rhythm

Reset browser heading/paragraph margins in the base layer so layout gaps are deliberate. Scope rich-text rhythm to `.flow` / `.prose` instead of putting flow margins on every site's `p` and heading. A simple sibling-flow pattern is:

```css
.flow > :where(*) + :where(*) {
  margin-block-start: var(--spacing-content);
}

.flow :where(h2, h3, h4) {
  margin-block-start: var(--spacing-section);
}
```

Tune headings, lists, nested list items, quotes, figures, tables, embeds, and captions deliberately. Avoid adding both parent `gap` and child margins for the same rhythm. Rich content in a hero may use a compact flow token; ordinary articles can use a wider one.

Check the EmDash inline edit mode as well as public output. Inline editing may replace normal Portable Text HTML with editor controls, so scope typography rules to rendered content and ensure reset/flow rules do not interfere with editor affordances. Don't assume the component's own styles define the host site's type or spacing.

## Content safety and presentation

- Keep global type defaults predictable, but don't force article measure or heading sizes onto navigation, cards, forms, and other non-prose UI.
- Images need responsive sizing, an appropriate crop/aspect ratio, and useful alternative text handling. Tables and embeds need overflow/keyboard checks at mobile widths.
- Prefer semantic selectors inside the wrapper over utility class names stored in CMS data; Tailwind's build-time scanner cannot infer arbitrary runtime content.
- Keep style overrides local to the rich-text wrapper so EmDash admin editing and unrelated site components retain their own behavior.
