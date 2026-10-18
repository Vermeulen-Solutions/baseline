# EmDash editorial ownership and canvas fields

Use this reference while modeling and implementing public Astro templates. Keep editorial ownership visible from the first query and route, rather than postponing canvas support until the site is otherwise complete.

## Keep collection schemas within budget

Cloudflare D1 documents a maximum of **100 columns per table**. SQLite's default `SQLITE_MAX_COLUMN` is 2000, but local SQLite success does not establish that a D1-targeted schema or query will fit. EmDash queries may select more than the hand-authored fields, so this starter uses a stricter **50 total physical columns per collection table** budget. The budget is a project rule, not Cloudflare's limit. See [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/) and [SQLite limits](https://www.sqlite.org/limits.html).

Count the physical schema in each actual target database, including system, hidden/generated, and retained legacy columns. Inspect `PRAGMA table_info(...)`; use `PRAGMA table_xinfo(...)` when hidden/generated columns may exist. Do not estimate from the number of registered fields or seed definitions: relation fields may be stored separately, and migrations/system metadata may add columns. Record the current width, exact additions/removals, projected width and remaining headroom before schema changes. Recheck after applying a migration. A field-unregistration does not drop its physical column.

Prefer existing Portable Text for narrative and editorial links, or a compact localized section entry when a section needs independent ownership. Use typed private repeaters only for private subordinate rows and relations for independently managed entities. Settings are for truly shared configuration; they do not automatically have a ContentEntry canvas proxy.

Avoid:

- a page column for every button label, paragraph, intro or heading;
- duplicate language-suffixed columns such as `title_en`;
- one untyped JSON field for all page copy;
- unregistering old fields while indefinitely retaining unused columns;
- changing field definitions or dropping columns to meet a budget without backup, rehearsal and a reviewed migration.

Use native row-per-locale entries linked by translation group. A second language adds a row, not a language-specific field column.

## Give each displayed value one owner

Inventory source and newly authored editorial strings before rebuilding a page, including Gutenberg/builder section headings, subtitles, introductions, factual callouts, captions, CTA labels and destinations, and editorial empty states. Keep UI vocabulary such as filters, validation messages, dates and keyboard instructions in the interface layer or locale dictionary. For each editorial value, record its source route/locale, canonical collection/entry/field, translation relationship, editing surface, and seed/database/rendered-value checks.

The public template must read the same stored value that its edit proxy annotates. Do not attach `entry.edit.description` to a hardcoded translation, derived composite or fallback. Fallback copy is transition recovery only; do not count it as populated CMS content.

Pass the page identity through the layout's `content` prop and bind each scalar field to the element displaying that field:

```astro
---
import Base from '../layouts/Base.astro';
const { entry } = Astro.props;
---

<Base
  title={entry.data.title}
  content={{ collection: 'pages', id: entry.data.id, slug: entry.data.slug }}
>
  <h1 {...(entry.edit.title || {})}>{entry.data.title}</h1>
  <p {...(entry.edit.excerpt || {})}>{entry.data.excerpt}</p>
  <a href={entry.data.destination}>
    <span {...(entry.edit.action_label || {})}>{entry.data.action_label}</span>
    <ArrowIcon />
  </a>
</Base>
```

Reusable components should accept field-specific edit props (`titleEdit`, `introEdit`, `actionEdit`, and, where appropriate, `imageEdit`) and forward each proxy to the element that renders that field. An annotation on an outer card or anchor establishes neither title nor description ownership. For a CTA with an icon, bind only the text span; keep the icon and route outside the editable label.

Keep Portable Text's canonical tagged value and identity intact in edit mode. Apply any presentation cleanup to a separate public-only value; never annotate a filtered subset as if it were the complete stored field. Empty rich-text fields may need an explicit verified editor path. Test the installed EmDash release rather than assuming an annotation mounts an editor.

## Acceptance

For EmDash 1.3 toolbar/link controls, revision attribution and restore-host callback
requirements, use the [1.3 adoption review](emdash-1.3-upgrade-review.md). Existing
field annotations do not by themselves verify these interactive behaviors.

For every intended canvas field, verify that it is registered in the active schema and manifest, populated in the target locale, read by the template, and annotated with the same entry and field identity. Test save/reload and the appropriate draft/publish behavior on the authorized local or disposable surface. Verify public output in each required locale and compare canonical stored values—not only route status or record counts. Keep media, references, repeaters, URLs, plugin DTOs and transformed text on their supported structured-editor path unless the installed release demonstrates a reliable inline editor for that field type.

Treat D1 migration, public code deployment and content transfer as separate operations. Build output does not copy local content to a remote database; an inaccessible remote target is unverified, not a parity pass.
