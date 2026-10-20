# EmDash Portable Text and layout flow

Read when rendering EmDash Portable Text, blog bodies, or other CMS-generated rich content.

## Boundary and wrapper

Render Portable Text with the platform `RichText` component: `<RichText value={entry.data.content} />`. It supplies `.flow` and `data-editorial-content` and preserves actual edit targets, including empty editable fields. Keep querying/normalizing content separate. Inspect tags emitted by the installed renderer and custom blocks before writing selectors.

## Rhythm and editorial boundaries

Generic `.flow` / `[data-flow]` applies one-sided leading margins between visible direct siblings only. Element-aware prose belongs to `data-editorial-content`, with six controls: `--flow-space`, `--heading-spacing`, `--list-spacing`, `--list-item-spacing`, `--figure-spacing`, `--blockquote-spacing`. Private child values reset at each boundary; heading or figure settings do not leak into nested flows. Do not restore two-sided media margins or a compensating next-sibling reset.

Nested list and internal quote presentation uses native CSS scope, ending at `data-editorial-island` and nested editorial roots. Composite roots must be islands; their real prose bodies can establish a separate editorial boundary. Card, LogoTicker, Gallery and Disclosure already use this contract. Structural listing lists own their layout and indentation independently.

Do not combine parent gap and child flow margins for the same relationship. `.article-body` is a margin wrapper. `flow={false}` removes both flow and prose defaults: wrapperless without attributes, plain wrapper when attributes require one. Empty public content is omitted; real empty CMS fields remain selectable in edit mode. Verify selection, typing, save, editor reload and published anonymous reload; API writes or data attributes cannot stand in for that journey. See `docs/design-framework.md` for primitive ownership, maintenance recipes and parser limits.

## Editorial breakout grid (`.content-grid`)

When a long-form article, case study, or editorial page needs prose constrained to `--measure-reading` (`68ch`) while allowing figures, pull-quotes, tables, or galleries to break out wider without closing and reopening containers, use `<Container breakout class="flow" data-editorial-content>` (`.content-grid`):
- Default children automatically occupy the `content` track (`--measure-reading`).
- Add `.content--feature` to span `--measure-content` (`76rem`), `.content--wide` to span `--measure-wide` (`88rem`), `.content--full` or `.content--full-safe` for the available full track. In the padded site shell these stop at the shell content edge without paying another gutter; viewport-edge bleed needs a caller-owned shell composition.

Check the EmDash inline edit mode as well as public output. Inline editing may replace normal Portable Text HTML with editor controls, so scope typography rules to rendered content and ensure reset/flow rules do not interfere with editor affordances. Don't assume the component's own styles define the host site's type or spacing.

## Content safety and presentation

- Keep global type defaults predictable, but don't force article measure or heading sizes onto navigation, cards, forms, and other non-prose UI.
- Images need responsive sizing, an appropriate crop/aspect ratio, and useful alternative text handling. Tables and embeds need overflow/keyboard checks at mobile widths.
- Prefer semantic selectors inside the wrapper over utility class names stored in CMS data; Tailwind's build-time scanner cannot infer arbitrary runtime content.
- Keep style overrides local to the rich-text wrapper so EmDash admin editing and unrelated site components retain their own behavior.
