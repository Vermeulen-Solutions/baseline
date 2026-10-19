# Native composition contract

These presentation primitives use the existing Tailwind v4 semantic tokens. They
have no queries, content schema, hydration, custom keyboard controller or automatic
structured data. Import their Astro components and compose authored content in slots.
Root and generated profiles share the implementations and calibration specimens.

## Disclosure

```astro
<Disclosure id="delivery-notes">
  <span slot="summary" {...entry.edit.title}>{entry.title}</span>
  <RichText value={entry.body} />
</Disclosure>
```

This is the EmDash caller shape: imports, query and edit attributes belong to that
caller. Static callers put a native Markdown `<Content />` in the default slot and
omit EmDash imports/attributes. The body is already wrapped in `.flow`.

The component emits `<details>` with a first-child `<summary>`, one named summary
slot and a default body slot. Supply the summary slot or rendering fails with an
actionable error. A supplied-but-empty slot is still the author's responsibility.
Use meaningful plain text or noninteractive phrasing markup; do not nest another
summary, link, button, form field or whole rich-text document in the label. Avoid
headings in summaries: native summary accessibility mappings vary across platforms.
Put the section heading outside the disclosure and appropriate subheadings inside.
Keep editor annotations on the caller's text/content; no slot is cloned or serialized.

Ordinary details attributes, class, style and `data-*` attributes pass through.
Native `open` is opt-in; omitted is closed. Pass a boolean, not `open="false"`, which
HTML treats as present. The component adds no default-open policy. Do not override
the native role or manually track `aria-expanded`, `aria-controls` or tabindex.
Native Enter/Space activation, expanded state and the marker stay browser-owned.
Spacing and focus are inherited from the existing semantic tokens and focus rules.

Text links use the shared `--color-link` alias. The default retains action ink;
dark surfaces use the existing light focus ink and a nested light surface restores
action ink. Optional `--surface-dark-link` / `--surface-light-link` overrides permit
site-specific link calibration without changing solid-action backgrounds or labels.
`design:tokens` gates default, dark and restored-light text-link pairs at 4.5:1.
This fixes the dark specimen's observed 2.34:1 inherited action ink; the current
dark link is 8.79:1. No `@theme` palette, fluid scale or lane preset was changed.

An optional shared `name` creates a native exclusive group in supporting browsers.
Names are document-wide, including nonadjacent details, so namespace them per group;
do not assign the same name to every disclosure on a site. Only use exclusivity when
readers benefit from it; independent panels allow comparison. Older browsers can
retain independently usable panels without a group polyfill. There is no arrow-key
accordion controller or modal focus trap.

Keep essential instructions and required action controls outside collapsed panels.
Browser fragment reveal and find behavior vary; test the browsers you support.
Automated keyboard/fragment checks do not prove screen-reader announcements or the
browser toolbar's Find behavior. Test those manually before claiming support.
Disclosure does not imply FAQ content and emits no FAQ schema.

See [native details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)
and [summary accessibility notes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary).

## Cluster

```astro
<Cluster class="article-actions" style="--cluster-gap: var(--spacing-grid)">
  <a href="/posts">All articles</a>
  <button type="button">Copy this address</button>
</Cluster>
```

Cluster is a `div` with wrapping flex siblings, centered cross-axis alignment and
a content-token gap. It replaces the existing repeated action-row relationship;
it is not a menu or a toolbar and supplies no extra role. Native div attributes
pass through. Its only contextual tuning property is `--cluster-gap`. Wrap related
editor-owned inline content in a stable child when it should remain one flex item.
DOM order controls keyboard order; `dir="rtl"` follows writing direction without
`order`, `row-reverse` or a duplicate localized tree.

## Sidebar

```astro
<Sidebar style="--sidebar-basis: calc(var(--measure-reading) / 3)">
  <div class="flow"><Content /></div>
  <aside aria-label="Article facts"><p>Caller-owned supporting content</p></aside>
</Sidebar>
```

Use at most two direct elements: main content first, optional supporting content
second. The component is a `div`, not another document `main`. The caller supplies
appropriate section/aside semantics and any accessible name. Keep CMS/editor
wrappers *inside* these stable region elements, so the layout still sees two items.
Do not place Fragment-expanded arbitrary region lists here; use Grid for collections.

The main region grows into remaining space and requires 60% of the available inline
size before wrapping. Supporting content uses one third of the reading measure as
its initial basis; both regions can shrink and wrap long text inside narrow hosts.
When wrapped, each region fills its line, in DOM order. A single main child fills
the host without a phantom second column. Logical properties respect RTL; this API
does not visually reverse the order of meaningful content.

`--sidebar-gap`, `--sidebar-basis` and `--sidebar-main-min` are contextual CSS tuning
properties, defaulting to the grid gap, reading-measure fraction and 60%. Keep the
last value between 0% and 100%; smaller shares allow a narrower main region.
These are layout relationships, not new global brand tokens. Do not overwrite
client-calibrated `@theme` values to adopt them. Intrinsic minimums, wrapping and
normal HTML are the fallback; there are no viewport breakpoints or query containers.
Existing Grid narrow-host containment is unchanged.

The unequal-region relationship follows the intrinsic flexbox principle described
by [Every Layout](https://every-layout.dev/layouts/sidebar/) and the
[W3C design system](https://design-system.w3.org/layouts/sidebar.html). It solves a
different need from Grid's equal flexible columns and Card's semantic article API.

## Calibration and adoption

`/_styleguide` renders production primitives with independent/grouped disclosures,
long German summaries, a dark surface, native Markdown or the platform Portable
Text adapter, RTL wrapped siblings, wide/narrow unequal regions, stable editorial
wrappers, intrinsic images and missing supporting content. The route and fixtures
remain excluded from normal release artifacts.

New generation receives these files through explicit manifests. Older installed
sites need reviewed additive adoption: bounded sync does not expand their managed
inventory. Copy the components, preserve the site's calibrated tokens, review any
specimens/docs desired, and use a reviewed inventory migration or record the files
as separately adopted. Run `npm run verify`, build and affected rendered journeys.
Do not apply starter infrastructure exemptions to client page implementations.
When adopting the updated token checker, merge the link alias, anchor rule and
dark/light alias declarations together while preserving calibrated palette values.
The updated checker deliberately rejects a stylesheet missing the link contract;
installing only the new script is not a complete update. A sync conflict on a
locally calibrated stylesheet requires this manual merge before verification passes.
