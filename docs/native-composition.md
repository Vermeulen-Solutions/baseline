# Native composition contract

These presentation primitives use the existing Tailwind v4 semantic tokens. They
have no queries, content schema, hydration, custom keyboard controller or automatic
structured data. Import their Astro components and compose authored content in slots.
Root and generated profiles share the implementations and calibration specimens.

## Automatic-v2 contract

The site-owned Base explicitly selects `spacingPolicy="automatic-v2"` on SiteShell; shared SiteShell defaults legacy for installed-site compatibility. Standard Sections and Containers provide structural stack gaps; `layout="custom"` relinquishes display/direction/gap. Breakout retains named tracks. RichText owns bounded editorial rhythm; structural collections own their alignment. CSS and the existing token CLI remain authoritative without a settings panel or second token store. See [implementation progress](../audit/automatic-spacing-progress.md) for evidence and limits.

## Cascade layers and spacing ownership

Owned styles use `@layer base` or `@layer components`, after vendor/framework ownership and before utilities in the declared document order. Contextual defaults use `:where()`; `py-0`, `mt-0` and `gap-0` can override them without `!important`. Keyframes stay outside these rule layers. The parsed check covers owned standalone CSS, Astro styles, local imports and static overlays; third-party editor/admin styles have a separate boundary.

Section owns block padding and a stack's container gap. `spacing="section|content|none"` controls padding only, with none equal to zero. Ordinary Container owns content gap; Grid owns grid gap. Each primitive resets its local defaults from inherited root-context aliases. The shell pays horizontal gutters once and has no inferred block rhythm under v2. Intentionally scoped aliases inherit; local mode values do not.

RichText establishes `.flow` and `data-editorial-content`; generic flow only spaces visible direct siblings. Editorial controls include heading/list/item/figure/quote/base flow spacing. Native CSS scope stops recursive list/quote defaults at islands and nested editorial boundaries. `flow={false}` removes both defaults, wrapperless unless attributes require a plain wrapper. Empty public content is omitted while real CMS edit metadata retains selectable empty fields.

## Section, Grid and RichText

```astro
<Section labelledBy="post-title">
  <article class="article-stack">
    <h1 id="post-title">Title</h1>
    <div class="article-body"><RichText value={entry.data.body} /></div>
  </article>
  <aside aria-label="Article facts">...</aside>
</Section>
```

`Section` renders a native section with `aria-labelledby`, `data-spacing` and a merged
class list; its global contextual rules own the spacing. `Grid` accepts `minimum` and `gap`. `RichText`
accepts `flow` and forwards other attributes to its wrapper. These APIs preserve
zero-specificity contextual defaults while leaving every utility escape hatch open.

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
slot and a default body slot. A missing summary slot falls back to “Details” so
incomplete editor input cannot crash rendering. Supply a meaningful summary;
a supplied-but-empty slot is still the author's responsibility.
Use meaningful plain text or noninteractive phrasing markup; do not nest another
summary, link, button, form field or whole rich-text document in the label. Avoid
headings in summaries: native summary accessibility mappings vary across platforms.
Put the section heading outside the disclosure and appropriate subheadings inside.
Keep editor annotations on the caller's text/content; no slot is cloned or serialized.

Ordinary details attributes, class, style and `data-*` attributes pass through.
Native `open` is opt-in; omitted is closed. Pass a boolean, not `open="false"`, which
HTML treats as present. The component adds no default-open policy. Do not override
the native role or tabindex. Valid authored IDs are retained; missing or malformed
IDs get unique generated values. The summary's `aria-controls` points to its body.
Without JavaScript, expanded state stays browser-owned. A small enhancement adds
`aria-expanded` and synchronizes it on native `toggle` events and Astro navigation.
Native Enter/Space activation, grouping and the marker stay browser-owned.
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
pass through. Its only contextual tuning property is `--cluster-gap`; `gap-*`
utilities override the default because the component CSS is layered. Wrap related
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
client-calibrated `@theme` values to adopt them. `gap-*` utilities override the
component gap because the styles are layered. Intrinsic minimums, wrapping and
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

## Automatic spacing and day-2 maintenance

The shipped `automatic-v2` contract is detailed in [design framework](design-framework.md). New Bases explicitly enable it on SiteShell; shared SiteShell defaults legacy. Section's padding and container stack gap are separate, Container stacks with content gap, Grid owns its gap, and breakout retains named tracks. `spacing="none"` removes padding only. `layout="custom"` transfers display/direction/gap to the caller. Local mode values reset; regional `--layout-*` aliases intentionally inherit. A gap prop wins over the same passed style variable; a utility wins through the utilities layer. HTML attributes and unrelated classes/styles persist.

Use CSS as the only spacing configuration. Pick an existing scale for a global density change, a root alias for one relationship, a regional alias for local density, a primitive gap for one composition, or an explicit utility for an exception. Keep generic flow to direct siblings and editorial behavior to RichText or explicitly marked prose; do not add child margins to a gapped group. Preview CLI changes, review the diff, write explicitly, verify/build and inspect actual affected placements. The token report is a bounded reference evaluation, not a browser or universal downstream consumer inventory.

An older generated site must adopt new helpers, parser packages/checks, contextual aliases and editorial callers together through a reviewed migration before Base activation. Bounded sync now reports missing dependencies/aliases as migration conflicts and preserves local files. Adopt that self-contained sync helper first; older copies cannot anticipate new import requirements. Preserve calibrated theme values and rollback activation plus composition changes together. See [baseline updates](baseline-updates.md).
