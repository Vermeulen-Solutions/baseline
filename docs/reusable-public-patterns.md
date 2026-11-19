# Reusable public patterns

These are neutral infrastructure, not a client theme. Choose brand tokens and a real art direction before composing site pages. No client assets, sponsor collection, form storage or mail provider is installed by these patterns.

## Component index

Every reusable component Baseline ships, where it is documented, and which profiles receive it (`profiles/file-inventory.json`). "All" means the root EmDash foundation and both static profiles. Props below are read from the component source; when this page and a component disagree, the component wins and this page needs a fix.

| Component | Profiles | Purpose | Documented in |
| --- | --- | --- | --- |
| `SiteShell.astro` (`src/layouts/`) | All | Document, head, landmarks, theme, transitions, prefetch | [Page shell](#page-shell-siteshellastro) |
| `Section`, `Container`, `Grid` | All | Section rhythm, measures, intrinsic grids | [Layout primitives](#layout-primitives-section-container-grid) |
| `Disclosure`, `Cluster`, `Sidebar` | All | Native details, wrapping rows, main-first sidebar | [Native composition](native-composition.md) |
| `Card` | All | Semantic article card with stretched link | [Cards](#cards) |
| `ResponsiveImage` | All | Native Astro `getImage` responsive images | [Responsive media](#responsive-media) |
| `EmDashImage`, `EditorialImage`, `PhotoGallery`, `RichText` | EmDash (static has its own `RichText`) | CMS images, Portable Text, justified galleries | [Responsive media](#responsive-media), [PhotoGallery](#justified-photogallery-css-flexbox-engine) |
| `PartnersPanel`, `CMSPartnersPanel`, `LogoTicker` | All (`CMSPartnersPanel` EmDash) | Partner logos and marquee | [CMS-owned partners](#cms-owned-partners), [LogoTicker](#logoticker-0-kb-client-javascript) |
| `Form`, `FormError` | All | Progressively enhanced forms, error summaries | [Forms](#progressively-enhanced-forms), [Form recovery](#form-recovery-and-error-summaries) |
| `Tabs`, `CopyButton`, `Announcer`, `ThemeSelect` | All | Accessible interactive controls | [Accessible interactive primitives](#accessible-interactive-primitives) |
| `BeforeAfter`, `Stars`, `Hours` | All | Comparison slider, star rating, opening hours | [Before/after](#beforeafter-comparison-beforeafterastro), [Ratings and quotes](#ratings-and-quotes-starsastro-srclibquotests), [Opening hours](#opening-hours-hoursastro) |
| `Analytics`, `ConsentBanner`, `VideoEmbed`, `MapEmbed` | All | Consent-aware analytics, click-to-load embeds | [Analytics, consent and embeds](#analytics-consent-and-embeds) |
| `Heading`, `TableOfContents`, `Callout`, `Steps` | All | Content navigation and structure | [Content navigation](#content-navigation-and-structured-primitives) |
| `MediaStage`, `IndexList`, `src/styles/expressive.css` | All | Image-led stage, ruled index, bleed, frame shapes, photograph treatments, fitted display line, scroll-driven reveals, page-transition styles (opt-in) | [Expressive layer](#expressive-layer-opt-in) |
| `SearchDialog` | All, when search is configured | Pagefind search in a native dialog | [Optional site search](search.md) |
| `PostListItem` | EmDash | Starter blog list row (`post`, `showDate`) | Starter routes |
| `StaticMetadata` (`profiles/static/project/src/components/`) | Static profiles | Build-time title, description, canonical and JSON-LD | [Metadata phase 2](verification/metadata-phase-2.md) |

`PortableTextHeading` and `PortableTextUnknown` are internal RichText block renderers, and `src/components/dev/` holds the development styleguide; neither is a component for site pages.

## Page shell (`SiteShell.astro`)

The site-owned `Base.astro` wraps `SiteShell`, which owns the document, one title, global styles, the skip link and landmarks. Props: `title` (required), `description`, `canonical`, `metadataOwner` (`shell` default, or `platform` when EmDashHead or `StaticMetadata` renders description and canonical), `lang` (default `en`), `dir` (derived from `lang` when omitted), `skipLinkLabel` (default `Skip to content`), `spacingPolicy` (`legacy` default, `automatic-v2` in current Bases; see [design framework](design-framework.md)), `sectionJoins` (`shared` lets two sections on the same ground share one section step; omitted keeps full padding), `surface` (`light`, `dark` or `system` initial surface mode), `darkReaderLock` (opt out of the Dark Reader extension on dark-by-design sites), `pageTransitions` (`none` default, or `cross-document` for the script-free `@view-transition` crossfade; mark the header `data-vt-header`) and `prefetch` (`off` default, `conservative` or `moderate`; see [link prefetch](#navigation-lifecycle-and-warming)) and `transitionStyle` (`fade`, `lift`, `curtain` or `wipe`; omitted changes nothing; see [page-transition styles](#page-transition-styles-and-arrival)). Slots: default, `head`, `header`, `footer`, `body-start` and `body-end`.

## Layout primitives (`Section`, `Container`, `Grid`)

The full spacing contract is in the [design framework](design-framework.md#cascade-and-layout-spacing-contract); this is the prop summary.

- **Section:** `labelledBy` (the heading ID), `spacing` (`section` default, `medium`, `content` or `none`), `gap` and `layout` (`stack` or `custom` when the caller owns display and gaps).
- **Container:** `width` (`content` default, `reading` or `wide`), `breakout` (switch to the `.content-grid` tracks below), `gap` and `layout`.
- **Grid:** `minimum` (`standard` default, `compact` or `wide` column minimum), `gap` and `slots` (default `true`: each item is a named `card-slot` inline-size query container, so cards inside respond to their cell; `false` leaves items as they are).
- **`gap`** takes a token name from `src/lib/layout-style.ts`: `none`, a semantic step (`content`, `grid`, `container`, `section`, `section-m`), a fluid space step (`3xs` … `3xl`) or a pair (`s-m`, `l-2xl` …). It resolves to `var(--spacing-<name>)`. A raw CSS length still works for compatibility, and `check:css` reports it as an advisory.

All three forward other HTML attributes, `class`, `class:list` and `style`.

## Native structural composition

Compose open-slot `Disclosure`, `Cluster` and `Sidebar` alongside `Section`, `Container`, `Grid` and `Card`. Disclosure delegates toggling, grouping and closed-content focus exclusion to native details/summary; Cluster wraps children, and Sidebar preserves main-first DOM order while adapting to its host's width. See [native composition](native-composition.md) for exact slots and semantic limits. Both foundations run the same production specimens; Markdown and Portable Text remain platform-owned. Existing sites follow the explicit [architecture upgrade](architecture-hardening-upgrade.md) before adopting shared specimens that import new paths.

## Responsive media

ResponsiveImage uses native Astro `getImage`; static public originals receive Vite metadata and CMS images use EmDash’s storage-backed image endpoint. No prepared renditions or manifest is required. Pass accurate `sizes`, descriptive `alt`, and eager/high priority only for the primary above-fold image. Use `optimize={false}` for original artwork or animated media. Small originals remain unchanged and candidates never enlarge the source. See [image delivery](image-delivery.md) for hosting, live uploads, failure recovery and verification.

RichText wraps EmDash PortableText with shared image/gallery renderers. Use it inside `.flow`. Public image rendering respects native width, captions, links and alignment. The native PortableText editor remains owned by EmDash. Justified gallery previews receive actual row sizes and open original files in PhotoSwipe. Verify both public/editor contexts before launch.

## Cards

```astro
<Card title="Article title" href="/article/" action="Read article" headingLevel={2}
  image="/media/article.jpg" imageAlt="Describe the actual image"
  sizes="(max-width: 40rem) calc(100vw - 4rem), 50vw">
  <time slot="metadata" datetime="2026-10-05">5 October 2026</time>
  <p>Short introduction.</p>
</Card>
```

`Card.astro` renders a semantic `<article class="card">` rather than wrapping the entire card in an `<a>` tag. When `href` is provided, the heading renders `<a href={href} class="card-link clickable-parent">` whose `::after` pseudo-element stretches across the card while keeping metadata and body copy out of the screen-reader link announcement, paired with `.focus-parent` (`:focus-within:has(:focus-visible)`) so keyboard focus draws a single perimeter outline on `.card` without double inner focus rings or sticky mouse-click outlines. Secondary interactive links, buttons, or EmDash live-edit annotations (`[data-emdash-field]`) inside `.card` automatically sit above the stretched link via `z-index: 2`.

`Card.astro` also supports optional EmDash visual-editor field annotations (`titleEdit`, `descriptionEdit`, `actionEdit`), a `description` string prop alongside the default slot, `<slot name="title-extra" />` and `<slot name="action-icon" />`, and root attribute forwarding (`...rest`) so domain cards (`NewsCard`, `TeamCard`, `GalleryCard`) can compose `<Card>` directly without forking its accessible HTML structure.

Props: `title` (required), `href`, `action`, `description`, `image` (imported image or URL), `imageAlt`, `imageWidth`/`imageHeight` (native size for a URL), `sizes`, `headingLevel` (`2`, `3` or `4`; default `3`), `layout` (`stacked` default or `horizontal`), `imageFit` (`cover` default or `contain`), `imageAspect` (default `3 / 2`), the three edit annotations, `transitionName` (see [list rows](#navigation-lifecycle-and-warming)) and `class`. Slots: default, `media` (replaces the image), `metadata`, `title-extra` and `action-icon`.

Use `layout="horizontal"` for wide rows: the card is its own named query container (`container: card / inline-size`) and goes side by side only when the card itself is at least 32rem wide, so it stays stacked in a narrow grid cell or sidebar wherever it sits. Media and body sit in a `.card-layout` wrapper; give a horizontal card a definite width in a flex row. Use `imageFit="contain"` for full posters/artwork and `imageAspect` for an intentional frame. Customize appearance via CSS custom properties (`--card-bg`, `--card-text`, `--card-muted`, `--card-border-width`, `--card-border-color`, `--card-radius`, `--card-padding`, `--card-frame-padding`, `--card-gap`, `--card-shadow`, `--card-media-hover-scale`) and concentric inner media radius (`--card-media-radius: max(0px, calc(var(--card-radius) - var(--card-frame-padding)))`). Card actions align at the bottom of equal-height grid rows. Stress long/translated titles, absent media, uneven copy and odd final rows; don't force equal slots to fill empty space.

## Editorial breakout grid (`.content-grid`)

Standard sections use `<Container width="reading" | "content" | "wide">` (`.container-shell`). When a long-form article, case study, or editorial page needs body copy constrained to `--measure-reading` (`68ch`) while allowing figures, pull-quotes, tables, or galleries to expand wider without closing and reopening containers, use `<Container breakout class="flow">` (`.content-grid`):
- Unannotated children automatically occupy the `content` track (`--measure-reading`).
- Intermediate `.flow` or `[data-emdash-field]` wrappers inside `.content-grid` automatically propagate named tracks via `grid-template-columns: subgrid`, so rich-text blocks inside `<RichText />` participate in breakout tracks seamlessly.
- `.content--feature` spans `--measure-content` (`76rem`). `PhotoGallery.astro` (`breakout="feature"` by default) and `EditorialImage.astro` (`alignment="wide"`) automatically opt into `.content--feature` when rendered inside `.content-grid`.
- `.content--wide` spans `--measure-wide` (`88rem`).
- `.content--full` spans edge-to-edge (`full`), and `.content--full-safe` (`EditorialImage.astro` with `alignment="full"`) spans edge-to-edge with `--spacing-container` inline padding.

## Upgrading brownfield sites

To audit and modernize a downstream site built on an earlier baseline snapshot:
1. Run `npm run audit:site -- --root ../site --out ../private-reports/site-audit` and inspect `design-system:tokens-and-rhythm`, `design-system:card-and-breakout`, `design-system:quarantine-hud`, and `skills:site` / `skills:emdash`.
2. Synchronize skills (`npm run sync:site-skills` and `npm run sync:emdash-skills`) to upgrade legacy v1 manifests to v2 and pull updated specialist skills.
3. Merge the additive token/reset/rhythm/layout primitives (`interpolate-size: allow-keywords`, cross-step fluid tokens, duplicate-margin `.flow` guards, `.content-grid` + `subgrid`, `.clickable-parent` / `.focus-parent`, `.is-bg` / `.fade--*`, and `[data-surface]`) into `src/styles/global.css` while preserving the site's brand tokens and Art Direction Record.
4. Upgrade `Container.astro` (`breakout` prop), `EditorialImage.astro` / `PhotoGallery.astro` / `RichText.astro`, and refactor whole-card `<a>` components (`EditorialCard.astro`, `*Card.astro`) to semantic `<article>` + `.clickable-parent` + `.focus-parent` + `--card-media-radius`.

To bring in a component a site does not have yet, or replace Baseline-owned components the site never edited, run `npm run site:files -- --site <path>` from a Baseline checkout and adopt with `--apply` (new files named with `--files`); see [Baseline updates](baseline-updates.md#taking-a-standards-release). Site-edited components are never replaced; Baseline's version is written beside them to merge by hand.

## CMS-owned partners

PartnersPanel receives items; partnersFromEntries normalizes structured logo references, active flags and ordering. No collection is added to the seed. When a site needs editor-owned partners, define title, URL, native logo, alt_text, sort_order, active and optional logo_ground fields in its collection, then use one shared querying component for all consuming pages.

```astro
---
import CMSPartnersPanel from '../components/CMSPartnersPanel.astro';
---
<CMSPartnersPanel collection="sponsors" locale={Astro.currentLocale} />
```

CMSPartnersPanel explicitly queries published entries, registers cache hints and applies no limit. The original EmDash 1.3.0 review found that it returns the complete collection when limit is omitted; recheck this contract during upgrades. Choose deliberate shared/translatable collection semantics, not duplicate page lists. Add/remove/unpublish/deactivate in CMS and verify all consuming pages stay in sync. `logo_ground="dark"` places a dark inset behind artwork inside the light tile. Logos keep original colors. Hover changes no layout geometry; motion respects reduced motion. URL fields should use CMS URL validation.

## Form recovery and error summaries

The optional utility is independent of form storage/delivery. Configure Astro sessions (persistent shared storage for multi-instance/Cloudflare hosts) before claiming values can be recovered. In a POST handler, extract text fields and validate on the server; never persist passwords/tokens/files in recovery. Call `await saveFormRecovery(session, formName, {values,fields,reason}, allowedFields)` and redirect to the form with only a nonsensitive status. It returns false without a session: do not tell visitors answers were saved unless it succeeded.

On GET, `await readFormRecovery(session, formName)` consumes the 10-minute state once. Render values through escaped Astro expressions, use `<FormError message={localizedMessage} fields={[{id:'email',label:'Email'}]} />`, and associate field-specific errors with aria-invalid/aria-describedby. Messages/contact address/locales belong to the site. Form names must be fixed server-owned identifiers; recovery is per form/session, not a multi-tab submission store. Limits are 80 allowlisted strings, 2000 characters each and 16000 total; adapt limits and disclose truncation when longer answers are supported. Secret-like keys are omitted even if accidentally allowlisted.

Use native date inputs; birthDate accepts ISO and legacy dates, rejects impossible/future calendar values. Pass the site's current ISO date explicitly if its timezone differs from UTC. Put required fees/documents/process details before the form on mobile. Optional fields may use a native disclosure that opens when recovered answers exist. Preserve factual/consent copy. Provider selection, submission storage and email remain separate decisions.

## Zero-JS interactive primitives

Baseline emphasizes progressive enhancement: interactive widgets should remain functional and performant even without client JavaScript.

### `LogoTicker` (0 KB Client JavaScript)

`LogoTicker.astro` delivers a continuous, smooth infinite marquee animation using pure CSS:
- **Zero Script Hydration:** Requires 0 KB of client JavaScript.
- **Accessible Native Pause Toggle:** Uses a native `<input type="checkbox">` styled as a pause button. Users can pause and resume motion using keyboard (`Space` / `Enter`) or touch, without a single line of script.
- **RTL & Reduced Motion:** Automatically reverses track direction for right-to-left document directions (`dir="rtl"`), pauses on `:hover` and `:focus-within`, and collapses into a static, wrapped grid when `prefers-reduced-motion: reduce` is detected or during printing.
- **Accessible Inert Duplication:** Cloned items needed for seamless infinite looping are marked `aria-hidden="true"` and `inert`, preventing screen readers or keyboard tabbing from encountering duplicate links or images.

### Justified `PhotoGallery` (CSS Flexbox Engine)

`PhotoGallery.astro`, where installed, renders fluid justified photo rows without relying on JavaScript Masonry or Isotope libraries. Its existing `fit="cover"` default keeps fixed-height cropped previews for compatibility. Choose `fit="contain"` when complete portrait/landscape frames must remain visible; it sizes each image from its intrinsic proportions and disables the hover zoom that would crop its edges. The choice also works with `layout="grid"`. It is a template presentation prop, not an extra CMS field or a per-image CSS override:

```astro
<PhotoGallery value={entry.data.gallery} fit="contain" breakout={false} />
```

Props: `value` (Portable Text blocks; the first `gallery` block is used) or `node` (one gallery block), `layout` (`justified` default or `grid`, which honours the block's `columns`, 1 to 6, default 3), `fit` (`cover` default or `contain`), `breakout` (`feature` default, `wide`, `full-safe` or `false`, applied inside a `.content-grid`), `title` (the JSON-LD gallery name; defaults to the block's title) and `locale` (`fr` or `en` for the viewer's labels; defaults from the page locale). The component is EmDash-only.

- **Pure CSS Flexbox Sizing:** Computes proportional `flex-grow` and aspect ratios on the server. Images share equal heights within each row, with leftover space absorbed cleanly by a trailing flex spacer.
- **Progressive Enhancement:** PhotoSwipe 5 (MIT) is loaded only when a visitor clicks an image to open the full-screen touch lightbox. If JavaScript fails or is disabled, clicking simply navigates to the original image.
- **Structured Data:** Generates Schema.org `ImageGallery` JSON-LD automatically for search engine rich results.

Existing sites can adopt the updated component through a reviewed Baseline update, preserving their local calibration, and opt into `fit="contain"` per caller. Omitting the prop retains the previous look. Do not remove purposeful crops globally or paste more-specific host selectors over Astro's scoped component rules. The local browser regression checks rendered proportions for mixed native-media frames at 390/768/1440px, native field readback/rendering, lightbox keyboard/focus return and no-JavaScript original-image links. Offscreen painting can be enabled solely for capture, but actual visible layout/proportions must be tested without screenshot layout overrides. A green image request alone does not prove framing or editor acceptance.

## Focus and contextual surfaces

`data-surface="dark"` and `data-surface="light"` establish contextual surface relationships (`color-scheme`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, and `--color-focus`) Customizable via `--surface-dark-*` and `--surface-light-*` tokens so a dark section inside a light page (or a light card inside a dark hero) automatically adapts its text, muted copy, border, and focus ring. Set surface tokens from the real site palette and verify contrast against their actual grounds. Tables, filters and count/status belong together; deduplicate contacts without hiding distinct roles. Calendar actions should represent a real dated appointment, not imply a recurring schedule from a programme period.

## Expressive layer (opt-in)

Composition, type and motion capabilities for sites whose art direction calls for them: a photograph that takes the whole width, a shape repeated from the subject, one line set as large as its column, a heading that rises into place, a page that turns instead of blinking. They live in `src/styles/expressive.css` and two components. Nothing applies until a page uses an attribute, a class or a component, so importing the stylesheet changes no existing page. The starter Base layouts import it after `global.css`; an existing site adds the same import to its `Base.astro` when it adopts one of them. Every motion runs only with `prefers-reduced-motion: no-preference` and, for scroll effects, only where `animation-timeline: view()` is supported; elsewhere the content is simply in place. The EmDash visual editor keeps everything at rest. Inspect them on `/_expressive` (development and fixture builds only, like `/_styleguide`; add `?router` to see the same pages under `<ClientRouter />`).

Choose them from the Art Direction Record, not to fill a page: the `site-art-direction` skill's **governing idea** and **signature moment** say which ones a site needs, and two or three per site is usually plenty.

### Full bleed (`.bleed`)

`.bleed` makes an element span the viewport whatever gutter and measure its column has, for a photograph or a ground that should run edge to edge. Its parent column must be centred, as the shell's main and Containers are. `100vw` includes a classic scrollbar, so the root clips the few pixels that would otherwise scroll sideways (`:root:has(.bleed) { overflow-x: clip }`). Put text inside a bleed element back in a `Container`.

### `MediaStage.astro`

One photograph at full width (or framed in the column with `bleed={false}`) with the section's words on it. On a wide stage the words sit on a scrim drawn from the dark-surface tokens; on a narrow stage (under 40rem of its own width) they move below the picture onto the page ground, and the picture gets shorter so the heading stays on a phone's first screen.

```astro
---
import MediaStage from '../components/MediaStage.astro';
import workshop from '../assets/workshop.jpg';
---
<MediaStage image={workshop} alt="The workshop at first light, chisels on the bench" priority focus="40% 35%" caption="The workshop, early morning.">
  <h1>Made by hand, one piece at a time.</h1>
  <p>Short lead under the heading.</p>
</MediaStage>
```

Props: `image` (imported image or URL with `width`/`height`), `alt`, `sizes`, `bleed` (default `true`), `stage` (`screen` default, `tall`, or `ratio` to keep the picture's own proportions), `align` (`start`, `center`, `end`), `scrim` (`bottom` default, `full`, `none` for a picture with its own quiet area), `focus` (CSS `object-position`, the part to keep when the stage crops), `priority` (eager and high priority for the first-screen picture), `caption`, `motion` (`recede` or `frame`, see below), `tone` (`warm`, `mono` or `duotone`, see below), `heroMedia` (the destination of a card morph) and `optimize`. The default slot holds the words. Check the rendered contrast of the words over the actual photograph at wide widths, and use `scrim="full"` when a busy picture needs it; `audit:ui` and axe cannot see the picture under the text.

### `IndexList.astro`

A ruled index for things a visitor scans and compares (works, courses, teams, services, programme items, documents): rows separated by hairlines rather than boxed cards. Each row can have a `lead` (a number, a course code or a date, only when it carries information), `meta` facts, a `description` and an `href` that covers the row with one link (`.clickable-parent`, focus drawn on the row). With `preview`, a row's `image` appears beside it on hover and keyboard focus for a fine pointer only; it is decorative (`alt=""`, `aria-hidden`) because the linked page shows the same picture, and it morphs into that page's `MediaStage heroMedia` on cross-document transitions.

Props: `items` (`{ title, href?, lead?, meta?, description?, image?, imageWidth?, imageHeight? }[]`), `ordered` (`ol` when the order means something), `headingLevel` (`2`, `3` default, `4`), `preview`, `optimizePreview` (`false` for SVG artwork) and `class`. Set `--index-title-size` to change the title step.

### Frame shapes (`data-shape`)

`data-shape="arch|round|leaf|tab"` on an image frame gives it one shape taken from the site's subject: a chapel's arch, a pebble, a leaf for a garden, a folder tab for an archive. Repeat one shape on a site's photographs rather than mixing several. `arch` gives any portrait frame a semicircular top; `leaf` and `tab` use `--radius-shape`. Keep faces and subjects away from the rounded edge, and check with `audit:ui`'s `image-cover-cropped`.

### Photograph treatments (`data-tone`)

Owner photographs taken over years, on different phones and in different light, look like a set when they share one treatment. Put `data-tone="warm"` (evens out colour casts), `"mono"` (black and white) or `"duotone"` (the photograph's light and shade printed in `--tone-ink`, the action colour by default, with its highlights held to `--tone-paper`, the page ground) on the frame around an image; `MediaStage` takes it as `tone`. Choose one treatment for the whole site rather than one per photograph, and keep untreated the photographs whose colour is the point (a painting, a product's finish). Duotone draws its inks on the frame with blend modes, so the frame must be a box around the `img`; forced-colors mode drops the inks. It costs no script and no extra image.

### Fitted display line (`.display-fit`)

One large line per page, sized to its column: a statement, a closing line, the site's name over the footer. Put the line in a `.display-fit` box and set `--fit` to the line's width in ems (measure it once in the browser: the line's width at `white-space: nowrap` divided by its font size). The size is `clamp(var(--display-fit-min, 3rem), 100cqi / var(--fit), 2.5 × --display-fit-min)`. A size that follows the container does not grow with browser zoom, so the line is held between a rem floor and a cap of 2.5 times it, the rule `design:tokens` applies to fluid type: zooming far enough always doubles it (WCAG 1.4.4), and at high zoom or with a longer translation it wraps rather than overflowing. Raise `--display-fit-min` for a larger line (the cap follows it), then check 320px. Where `text-box` is supported the box is trimmed to the capitals and the baseline, so the space around it is the space you set. A decorative repeat of the site's name takes `aria-hidden="true"`.

### Scroll-driven reveals

| Attribute | Effect | Use it on |
| --- | --- | --- |
| `data-reveal="frame"` | The frame opens upwards as it arrives and the picture settles from a slight zoom (`--reveal-zoom`, default 1.12) | An image frame below the first screen |
| `data-reveal="mask"` | The heading rises out of its own line: the clip stays where the heading rests while the text moves into it | Section headings below the first screen; never the page's `h1` |
| `data-scroll="open"` | The ground opens from an inset, rounded band to its full width as it arrives (`--open-inset`) | A `.bleed` section with its own background |
| `data-scroll="recede"` | The hero steps back as it scrolls away: a little smaller (`--recede-scale`) with rounded corners | The first-screen `MediaStage` (`motion="recede"`) |
| `data-scroll="rise"` | The children rise into place from below as the element arrives (`--rise-distance`); the element clips its own overflow | A closing band or the footer |

They are CSS only, so content that starts on the first screen is already at its end state and nothing hides the Largest Contentful Paint. In browsers without scroll-driven animations `data-reveal="frame"` and `"mask"` fall back to the shell's IntersectionObserver fade, and the `data-scroll` effects are simply at rest.

### Page-transition styles and arrival

`SiteShell transitionStyle` writes `data-transition-style` on the root. `fade` keeps the crossfade; `lift` steps the old page back while the new one rises in; `curtain` and `wipe` uncover the new page from below or from the side over a dimmed old page. Going back plays the movement the other way. The styles work with `pageTransitions="cross-document"` and with a slotted `<ClientRouter />`, and the shell's header hold (`data-vt-header`) and media morphs keep working on top of them. Durations come from `--duration-base` and `--duration-stage` (560ms).

Any style also turns on **arrival**: elements marked `data-arrive` (`"1"` to `"3"` for stages) come in after the page in short steps. They are named (`view-transition-name: match-element`) only while a transition runs, so they cost nothing at rest. Mark the heading, the lead and one more block, not every element.

With cross-document transitions, a small inline head script (`src/lib/page-transition-script.ts`) supplies what a router otherwise would: the direction (history traversal compares entry indexes; a link compares path depth; `data-vt-direction="back|forward"` on the link or an ancestor overrides it) and the morph of a picked card (`[data-vt-card]` or `.card` with `.card-media` or `[data-vt-media]`) into the arriving page's `[data-vt-hero-media]`. Only the picked card is named. It is emitted only when `transitionStyle` is set, and the EmDash Base leaves transitions off in visual edit mode. Under reduced motion or in browsers without view transitions pages load as before.

### Weight and support

`expressive.css` is about 10 KB before compression (about 2 KB compressed) and has no script; `MediaStage` and `IndexList` ship no script; the transition script is about 3 KB inline and only on sites that set `transitionStyle`. Scroll-driven animations run in Chromium and Safari 26; view-transition types of motion run in Chromium and Safari 18+; `match-element` arrival in Chromium and recent Safari. Firefox and older browsers show the pages at rest, with the ordinary crossfade or a plain page load.

## Tranche coverage

The sections below document the shipped contracts across Tranches 1–5. These capabilities are shared infrastructure; client layouts, branding, endpoint provisioning and deployment remain site-owned.

| Tranche | Public contracts |
| --- | --- |
| 1 | [Navigation lifecycle and warming](#navigation-lifecycle-and-warming), navigation ownership, scroll intent and BFCache cleanup |
| 2 | [Progressively enhanced forms](#progressively-enhanced-forms) and [skeleton loading geometry](#skeleton-loading-geometry) |
| 3 | [Directional transitions](#directional-transitions) and [targeted swaps and persistence](#targeted-swaps-and-persistence) |
| 4 | [Accessible interactive primitives](#accessible-interactive-primitives), theme state and [capabilities](#build-time-capabilities-virtualbaselinecapabilities) |
| 5 | [Content navigation primitives](#content-navigation-and-structured-primitives) and [CMS heading parity](#emdash-cms-heading-ids-richtextastro-emdash-headingsts) |

## Navigation lifecycle and warming

`SiteShell.astro` supplies the browser lifecycle for all three profiles. ClientRouter navigation is opt-in: import `ClientRouter` from `astro:transitions` in the caller and place it in the shell's head slot. Without the router, links retain ordinary document navigation; these enhancements do not add a server runtime to static output.

```astro
---
import { ClientRouter } from 'astro:transitions';
import SiteShell from '../layouts/SiteShell.astro';
---
<SiteShell title="Articles">
  <ClientRouter fallback="swap" slot="head" />
  <main id="main-content">
    <a href="?page=2" data-vt-noscroll>Next page</a>
  </main>
</SiteShell>
```

`data-vt-noscroll` on a navigation source or its ancestor preserves the current window's horizontal and vertical scroll coordinates through the swap. A departure page can opt all its navigations in with `<meta name="vt-noscroll" content="true" slot="head" />` or `[data-vt-noscroll-page]`. This is window scroll preservation, not persistence of form values or nested scroll containers. Failed or aborted navigation discards the saved intent.

Each preparation receives a monotonic ownership token. Superseded loaders and warming work cannot clear the newer navigation's loading state. The `html[data-vt-loading]` progress indicator appears after **600ms**, rather than immediately. Loading clears when the owned preparation completes, on swap, or on failure/abort. Temporary morph names remain until the owning `ViewTransition.finished` settles; page initialization must not clear names before snapshots and animations complete. `pagehide` cancels pending warming/loading work; a persisted `pageshow` clears stale transition names/direction and reconciles theme and sticky-header state.

The shell starts page/image warming after a 20ms pointer hover. Eligible links are same-origin, point to another pathname, have no query or fragment, and are not downloads, alternate-target links, `data-astro-reload`, or paths beginning with `/_`, `/api/` or `/admin`. Warming is skipped for Save-Data/2G connections and EmDash editing contexts, and page warming requires the ClientRouter marker. It parses fetched HTML and warms up to eight images with their `srcset`/`sizes`; image and page maps are each bounded to 30 entries. Active navigation cancels the speculative fetch and takes priority.

Use `data-astro-prefetch="false"` on a link or ancestor to opt out of Baseline warming. Positive Astro prefetch directives remain governed by the site's native Astro configuration. Baseline's warming map is not a shared ClientRouter response cache, so do not promise one fetch per destination or automatic coordination with native prefetch. This eligibility list is a performance policy, not an authorization boundary; keep private routes protected and explicitly exclude additional sensitive links.

**Link prefetch without a router.** `SiteShell prefetch="moderate"` emits a static `<script type="speculationrules">` JSON block (no script runs) from `src/lib/speculation-rules.ts`. Chromium browsers fetch a same-origin page after a short hover (on mobile, also links in view), keep it in memory and use it for the next navigation even though public HTML is `no-cache`; other browsers ignore it. `"conservative"` waits until a click or tap starts. Excluded: the same paths as the warm-up above (`/_*`, `/api/*`, `/admin*`), links with a query or fragment, downloads, alternate targets, `data-astro-reload`, and `data-astro-prefetch="false"` on the link or an ancestor. Chrome tracks candidates by URL, so an opt-out holds only when every link to that URL on the page carries it. It prefetches only; prerendering would run the page's scripts and analytics before the visitor arrives. Both starter Base layouts use `"moderate"`; EmDash's Base turns it off in visual edit mode, and a site that adds ClientRouter sets it to `"off"`. Each prefetch is a server request: on Cloudflare Workers Free (100,000 requests a day) a busy site can drop to `"conservative"`.

Card-to-hero morphing derives intent from the actual navigation source. Shared cards use `.card-media` and `.card-title`; custom markup can opt in with `[data-vt-card]`, `[data-vt-media]` and `[data-vt-title]`. Destination elements can use `[data-vt-hero-media]` and `[data-vt-hero-title]`. The shell assigns temporary `hero-media`/`hero-title` names only to the selected pair and supports a return morph using the departed article URL. Avoid assigning these names to every card in a grid. Existing explicit `Card transitionName` and `.vt-morph` contracts remain available; callers own matching and uniqueness. Reduced-motion preferences suppress motion.

**List rows that do not use `<Card>`.** `mediaTransition(...parts)` from `src/lib/view-transition.ts` returns an inline style with an ident-safe `view-transition-name` and `view-transition-class: vt-media`. Put it on the list photo's wrapper and on the detail photo's wrapper with the same parts:

```astro
---
import { mediaTransition } from '../lib/view-transition';
---
<a class="story-row-photo" style={mediaTransition('story', story.slug)} href={`/stories/${story.slug}/`}>…</a>
<!-- detail page -->
<figure class="story-hero" style={mediaTransition('story', story.slug)}>…</figure>
```

Every character outside `A-Z a-z 0-9 _ -` becomes a hyphen, a leading digit or a reserved keyword gets a `vt-` prefix, and an empty result omits the attribute, so a CMS slug cannot produce invalid CSS. `::view-transition-group(*.vt-media)` clips the morph to `--radius-card`, and both snapshots cover the box while its aspect ratio changes. `<Card transitionName>` uses the same helper: its media is named `<prefix>-media` with the `vt-media` class and its title `<prefix>-title`, so name the detail media with `mediaTransition(prefix, 'media')`. `transitionName(...parts)` returns the bare name. A name may appear once per rendered page, and slugs that differ only in punctuation map to the same name.

### Sticky header

`[data-sticky-header]` makes the header sticky, and the shell maintains two state attributes on it.

| Attribute | Set when | Use for |
| --- | --- | --- |
| `data-scrolled` | `scrollY` is above 16px | Paint only: background, border colour, shadow, backdrop filter |
| `data-compact` | Added above 96px, removed below 24px | Size: padding, height, logo size |

A size change keyed to a single threshold flips every frame at rest: the header shrinks, the content below moves up, scroll anchoring pulls `scrollY` back under the threshold and the header expands again. `data-compact` therefore has hysteresis, and the band between its two offsets (72px by default) must stay wider than the header's height change. For a larger change set `data-compact-after` and `data-expand-below` (pixels) on the header. `npm run check:css` rejects size properties in rules that select `[data-scrolled]`. After changing header height on scroll, rest the page at several positions just past each threshold and confirm that the state does not change between animation frames; `tests/visual/sticky-header.spec.mjs` does this for the starter.

**Slot the header as a direct child of the shell.** A sticky element only travels within its parent. `<div slot="header"><header data-sticky-header>…</header></div>` puts the header in a box exactly as tall as the header and whatever sits above it, so it has nowhere to stick and scrolls away. Nothing fails; it looks like a CSS bug. Put `slot="header"` on the header itself, or group several elements with `<Fragment slot="header">`, which renders no wrapper:

```astro
<SiteShell title={title}>
  <Fragment slot="header">
    <p class="site-notice">…</p>
    <header class="site-header" data-sticky-header>…</header>
  </Fragment>
  <slot />
</SiteShell>
```

`check:css` reports a `data-sticky-header` element nested inside a lowercase element that carries `slot="header"`. A wrapper rendered by a component is not inspected.

**Hold the header during View Transitions.** Under the root transition, a sticky header that changes height between the outgoing and incoming page (compact after scrolling, tall on arrival) shows as a ghosted double header. Add `data-vt-header` to the page's single sticky header: it is named `site-header`, the outgoing snapshot is not drawn and the incoming one appears without a fade. A header that already has its own `view-transition-name` gets the same rules from `view-transition-class: vt-header`. Under reduced motion the header box does not animate either. A transition name must be unique in the document, so use the attribute on one element.

For local fault probes, development builds accept destination query parameters `?_vt_delay=800` and `?_vt_fail=1`. Delay is abortable and bounded to 10 seconds; failure flags accept only `true`/`1` values. The fault hook is excluded from production. Probe aborted and overlapping navigation as well as successful navigation; a clean build alone cannot verify this lifecycle.

## Progressively enhanced forms

`Form.astro` renders a native form with `method="POST"` by default. Its additional props are `action?: FormActionConfig`, `method?: string`, `enhance?: boolean` (default `true`), `successMessage?: string` and `errorMessage?: string`, alongside native form attributes. The default slot contains labelled controls; named `success` and `errors` slots provide feedback content. Supply a unique stable `id` beginning with a letter and containing only word characters, colons, dots or hyphens; otherwise a generated ID is used. The supplied `class` belongs to the outer `.form-container`; the inner form uses `.flow`.

**Inline field errors.** An enhanced form shows a message under a field only after the visitor has touched it and left it invalid (`:user-invalid`, with a blur fallback where that selector is missing), never on load. Write the message in the page's language with `data-error-required`, `data-error-type`, `data-error-pattern`, `data-error-too-short`, `data-error-too-long`, `data-error-range-underflow`, `data-error-range-overflow` or `data-error-step` on the field; without one the browser's own message is used. The message is linked through `aria-describedby` (an existing hint stays) and `aria-invalid`, and both clear as soon as the value is valid. Server errors from `FormError` are left alone.

```astro
---
import Form from '../components/Form.astro';
---
<Form id="contact" action="https://forms.example.test/contact" enhance={false}>
  <label for="contact-email">Email</label>
  <input id="contact-email" name="email" type="email" autocomplete="email" required />
  <button type="submit">Send</button>
</Form>
```

Replace the illustrative endpoint with a provisioned handler. The example uses native submission (`enhance={false}`), which also suits providers that redirect to their own confirmation page. With JavaScript disabled, the native form remains usable. Enabling enhancement adds browser JavaScript for `fetch` and feedback; neither mode provisions mail, storage, server validation, abuse protection or an endpoint.

`FormActionConfig` is a URL string or `{ endpoint?: string; profile?: 'static' | 'static-sveltia' | 'emdash'; actionName?: string; action?: unknown }`. `resolveFormTransport()` returns `{ action: string; rpcAction?: string }`; `resolveFormAction()` returns only the native action string. The installed static profile is authoritative: callers cannot promote it to EmDash through the `profile` property. These utilities inspect installation configuration on the server/build side; do not import the transport module into browser code.

For `static` and `static-sveltia`, external destinations require explicit HTTPS and must not contain credentials. Ordinary relative endpoints are allowed, but the deployment must provide the handler separately; they do not create an Astro server endpoint. Astro Action paths (`/_actions`), normalized traversal into those paths, `_action` query parameters and `actionName` configurations are rejected. Protocol-relative URLs, backslashes, embedded ASCII controls and executable URL schemes are rejected. Invalid configuration resolves to an empty action with no RPC endpoint; treat that as a configuration failure, because an omitted HTML action submits to the current document.

On `emdash`, `action={{ actionName: 'contact' }}` resolves native submission to `?_action=contact` and enhanced submission to `/_actions/contact`. An action object can instead be supplied as `action={{ action: actions.contact }}` after importing the site's defined action. Define the actual handler with Astro's form action contract and verify both submission modes. Normal relative endpoints and HTTP/HTTPS destinations are also supported on this profile. Endpoint paths must respect the deployed site's routing/base configuration.

Enhancement checks native constraints, captures `new FormData(form, submitter)` before disabling submit controls, prevents duplicate in-flight submission, and honors submitter `formaction`, `formmethod` and `formenctype`. GET requests append string fields to the destination query without a body. Multipart requests retain file bodies; `text/plain` serializes filenames and normalizes names/values to CRLF. URL-encoded and GET serialization include string entries only. Use multipart for file uploads. Submitter overrides are browser submission inputs, so keep them within the same reviewed destination policy as the main action.

The enhanced handler sends `Accept: application/json`. Any successful HTTP status produces the success state; it does not interpret a successful Astro RPC response's validation envelope. Non-success responses can provide a JSON `message`; otherwise the configured error message is used. Cross-origin enhanced endpoints need CORS permission. Verify the chosen backend's response contract, or use native submission when it requires redirects, custom validation decoding or another protocol.

During submission the form sets `aria-busy="true"` and disables submit controls. Failure restores each control's prior disabled/ARIA state, reveals a unique `${form.id}-errors` alert summary and focuses it. Success hides the form, reveals a polite status region and moves focus to that region. Form bindings initialize again on `astro:page-load`; outstanding fetch requests are not cancelled on navigation. Do not assume submission persistence or navigation cancellation. The server must still validate every field; `sanitizeFormValue()`, `validateFormField()` and `formatFormErrors()` are optional helpers, not a complete security or persistence layer.

## Skeleton loading geometry

`.skeleton-shimmer` is a CSS primitive driven by `--skeleton-width`, `--skeleton-height`, `--skeleton-aspect-ratio` and `--skeleton-radius`. `.skeleton-shimmer--text` defaults to one text line; `--circle` uses `--skeleton-size` (default `3rem`); `--card` uses `--skeleton-card-height` (default `12rem`) and a nonzero minimum block size. Reserve geometry that matches the eventual content to reduce layout shift; parent layout primitives still own the surrounding spacing.

```html
<section aria-label="Article preview" aria-busy="true">
  <p>Loading article preview…</p>
  <div class="skeleton-shimmer skeleton-shimmer--card" aria-hidden="true"
    style="--skeleton-card-height: 16rem; --skeleton-radius: var(--radius-card)"></div>
</section>
```

The loading controller owns removal of `aria-busy`, replacement of the placeholder and useful failure content. Skeletons are decorative and ignore pointer input; marking a parent busy changes its cursor but does not disable every real control in that parent. Under reduced motion, shimmer stops and uses a static elevated background at 0.85 opacity. Test contrast, geometry and loading failure with the client's actual tokens.

The CSS works in all profiles and introduces no server capability. EmDash routes with an appropriate server runtime may use skeleton markup in a `server:defer` component's `slot="fallback"`; static profiles must retain their static architecture and use an appropriate client-owned loading mechanism if needed. Styling a placeholder does not implement Server Islands, streaming, personalization or cache invalidation.

## Directional transitions

`SiteShell` derives `html[data-vt-direction="forward|back"]` per navigation. History traversal uses the router's direction first. Other navigations use a source/ancestor `data-vt-direction="back|forward"` override, then same-origin pathname depth: shallower paths go back, deeper or equal-depth paths go forward. Trailing slashes do not add depth. Depth is a navigation heuristic, so use an explicit override when route hierarchy does not represent the intended journey.

```html
<a href="/articles/" data-vt-direction="back">All articles</a>
```

The direction is copied to the incoming root before swap and cleared after the owning transition completes, or on error, abort and BFCache restore. The CSS root animations use fluid travel distances, `--ease-smooth`, 180ms exit and 240ms entry durations; reduced-motion rules suppress them. Keep direction declarations on navigation sources rather than treating the transient root attribute as persistent application state. Test same-depth siblings, root/deep routes, explicit overrides and browser Back/Forward separately.

## Targeted swaps and persistence

Normal ClientRouter body swapping remains the default. Use Astro's native `transition:persist` when it satisfies the site's persistence needs. Baseline's `data-vt-persist="stable-key"` aliases a stable key to Astro's persistence attribute on both documents; an element ID supplies the key when the attribute is empty. Matching keys must exist on both pages. The same live DOM node and its state are retained, so incoming markup does not automatically reset an old form value, disclosure state or media source.

Use `[data-vt-replace]` only when surrounding chrome genuinely stays identical across the routes. Its nonempty value is the preferred container key; otherwise matching uses the element ID, then tag name. Use unique explicit keys for multiple targets. Nested replacement targets are pruned to their outermost container. Missing, ambiguous or overlapping incoming matches fall back to the default Astro swap before partial replacement occurs.

```html
<header>Shared site navigation</header>
<main id="main-content" data-vt-replace="article">
  <audio controls data-vt-persist="shared-player" src="/media/preview.mp3"></audio>
  <article>Route-specific content</article>
</main>
```

Repeat the target and persistent player key on the destination page. In targeted mode, nodes outside replaced containers retain identity/listeners; nodes inside survive only when explicitly persisted and matched. Root attributes, head metadata/title/styles and focus handling still synchronize through Astro's swap helpers. Retained header/body wrappers do not receive arbitrary incoming DOM/attribute changes: navigation labels, active links, locale-specific chrome and route-specific body state need their own reconciliation or a normal body swap.

The targeted path keeps persistent nodes in the connected document while moving them, preferring `Element.moveBefore()` when available and falling back to ordinary DOM moves. Media continuity and custom-element lifecycle behavior depend on the browser and move path; confirm playback/time/focus on the actual supported browsers. New media and declarative shadow roots in incoming targets are initialized separately. Do not assume all custom elements or framework islands can be transplanted safely without their own lifecycle contract.

Verify rapid repeated navigation, aborts, default-swap fallback, nested/multiple targets, head synchronization, keyboard focus and BFCache restoration. Unit-tier contracts stay browser-free; `tests/visual/behavior.spec.mjs` provides the explicit local Chromium behavior tier. Shared shell/styles and `Form.astro`/`form-transport.ts` ship through `profiles/manifests/shared.json`; existing sites adopt them through reviewed [Baseline updates](baseline-updates.md), preserving site-owned wrappers, routes and tokens. No capability here adds a CMS dependency or silently enables SSR in a static profile.

## Accessible interactive primitives

These controls use Astro-rendered HTML and small browser modules, with zero framework hydration and zero new runtime npm dependencies. Without JavaScript, tab content remains readable; clipboard feedback and theme controls require JavaScript. Supply unique IDs when rendering multiple instances.

### Accessible Tabs (`Tabs.astro`)

```astro
---
import Tabs from '../components/Tabs.astro';
---

<div data-print-content>
  <Tabs id="cli-tabs" label="Command line package manager" items={[{ label: 'Bash', value: 'bash' }, { label: 'PowerShell', value: 'powershell' }]} syncKey="cli-flavor" persist>
    <div slot="bash"><pre><code>npm run verify</code></pre></div>
    <div slot="powershell"><pre><code>npm.cmd run verify</code></pre></div>
  </Tabs>
</div>
```

- **Props and slots:** `id`, `label`, and a non-empty `items` array are required. Each item has a unique `value` and a `label`; its named slot matches `value`. Optional props are `defaultValue`, `orientation="horizontal|vertical"`, `activation="automatic|manual"`, `syncKey`, and `persist` (default `false`). Item `panelTabIndex` accepts `0` or `-1`.
- **Progressive enhancement:** All panels remain visible without JavaScript. The component does not insert an extra visible heading above each panel; include any headings needed by the content in its slot. Enhancement manages `hidden`, `aria-selected`, and roving `tabindex`.
- **Keyboard behavior:** Horizontal arrows (or vertical Up/Down), Home, and End move between tabs. Automatic activation is the default; manual activation uses Enter or Space to select the focused tab.
- **Peer synchronization:** Selecting an item updates peers with the same `syncKey` and matching item `value`, without stealing focus. Persistence requires both `persist` and `syncKey` and uses `localStorage` under `baseline:tabs:<syncKey>`. Storage failures leave current-page selection usable.
- **Lifecycle and printing:** Controllers clean up during ClientRouter swaps and DOM removal. Wrap the tabset in `[data-print-content]` to reveal inactive panels when printing. Tab buttons are not automatically hidden in print.

### Copy button and live announcer (`CopyButton.astro`, `Announcer.astro`)

```astro
---
import CopyButton from '../components/CopyButton.astro';
import Announcer from '../components/Announcer.astro';
---

<pre id="code-snippet"><code><span data-copy-exclude>$ </span>npm run verify:fast</code></pre>
<CopyButton targetId="code-snippet" label="Copy command" copiedLabel="Copied command!" announcerId="command-announcer" />
<Announcer id="command-announcer" />
```

- **Target and extraction:** `targetId` is a required element ID, not a CSS selector. `source="text"` copies text content; use `source="value"` for an input or textarea value. Text extraction removes explicit decoration selectors, including `[data-copy-exclude]`, `[data-prompt]`, `.prompt`, `.line-number`, `.line-numbers`, `[data-line-number]`, and `[aria-hidden="true"]`. It does not guess which punctuation is decorative. `excludeSelector` can replace that selector contract.
- **Feedback props:** `label`, `copiedLabel`, `copiedMessage`, `errorMessage`, `announcerId`, `timeout` (milliseconds, default `2000`), and optional button `id` control the instance. Feedback changes the text span and `data-state="copied|error"`; there is no generated success icon or `is-copied` class.
- **Copy and cancellation:** The Clipboard API has an `execCommand('copy')` fallback with focus restoration. The component owns cancellation and reset timers on removal or navigation. The separate `copyText(text, { signal })` utility in `src/lib/clipboard.ts` accepts an external AbortSignal; CopyButton has no signal prop.
- **Announcements:** Announcer renders polite and assertive live-region channels under its explicit `id` (default `site-announcer`). It creates no automatic singleton. Mount the matching container once per ID. `announce(announcerId, message, { priority: 'polite' | 'assertive', signal })` from `src/lib/announce.ts` writes plain text to an existing region; missing containers return `false`.

### Before/after comparison (`BeforeAfter.astro`)

Two pictures of the same view on one frame, for renovations, gardens, treatments, restorations and redesigns. Pass `before`, `after` (imported images, or URLs with `width`/`height`), `beforeAlt` and `afterAlt`, and `sizes` when the frame is not full width. `beforeLabel` (`Before`), `afterLabel` (`After`), `sliderLabel`, `valueText` (with `{percent}`), `hint`, `caption` and `start` (0 to 100, default 50) localize and tune it; every default is English, so pass all labels on a page in another language.

- **Native control:** an invisible `<input type="range">` covers the picture, so arrow keys, Home, End and screen readers work without extra code, and the read-out (`aria-valuetext`) says how much of the before picture shows. A click anywhere jumps the divider; on touch screens the script does the same, because iOS Safari does not jump a range to a tap. Dragging works but is never required (WCAG 2.5.7).
- **Without JavaScript** the two pictures stand one after the other with their labels; the slider and its hint stay hidden.
- **Honest use:** only a real before of the same view, ideally the same framing. Keep the labels plain; a product or platform name on the picture reads as something to buy. Size both images alike: the after picture sets the frame and the before picture covers it.
- Focus shows on the handle; forced-colors mode draws the handle in the system text colour.

### Opening hours (`Hours.astro`)

A table of the week from the same `openingHours` list the Organization structured data reads (`src/lib/opening-hours.ts`): keep the list in one module and pass it to both, so the page and search results agree. On EmDash sites the structured data reads `options.organization.openingHours` in the baseline-metadata plugin; `openingHoursSpecification(hours)` builds the schema.org nodes from the same list on any site.

```astro
---
import Hours from '../components/Hours.astro';
import type { OpeningHours } from '../lib/opening-hours';
const hours: OpeningHours[] = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
  { days: ['Saturday'], opens: '09:00', closes: '12:30' },
];
---
<Hours hours={hours} locale="fr-CH" closedLabel="Fermé" caption="Horaires d'ouverture" />
```

Props: `hours` (required; each entry is English weekday names plus 24-hour `HH:MM` times), `locale` (BCP 47, default `en`), `closedLabel` (default `Closed`), `caption` (default `Opening hours`), `hideCaption` (keeps the caption for screen readers only) and `class`. Day names and times follow `locale`; a day without an entry shows `closedLabel`; a split day lists both ranges. Invalid days or times are dropped, never guessed.

### Ratings and quotes (`Stars.astro`, `src/lib/quotes.ts`)

`Stars` draws a rating read as one phrase, "Rated 4.8 out of 5". Props: `rating` (required), `max` (default 5, at most 10), `label` (default `Rated {rating} out of {max}`; both placeholders are replaced, so translate it), `decorative` (hide the stars from screen readers when adjacent text already states the rating) and `class`. Partly filled stars keep their outline, so 4 never reads as 5. The stars take the surrounding text colour: set `color` on a parent for a brand colour that still clears 3:1 against its ground. Show only a rating a visitor can check, such as a public review profile total.

`src/lib/quotes.ts` shows client quotes and public reviews exactly as written. `markedQuote(quote, highlight, markClass?)` returns escaped HTML paragraphs with the key phrase inside `<mark>`; `excerpt(quote, highlight)` returns the sentence holding that phrase, word for word, with an ellipsis where the quote continues; `highlightProblem(quote, highlight)` returns a message when the phrase is not in the quote verbatim (call it where quotes load and stop the build or drop the highlight); `samePerson(a, b)` matches two spellings of one name by first and last word. None of them rewrite the words. The `emdash-content-modeling` skill's testimonials rules cover the content model, and `check:quality` flags a rating or review on the site's own Organization as self-serving JSON-LD.

### Analytics, consent and embeds

Both Base layouts render `Analytics` and `ConsentBanner` at the end of the body; they produce nothing until a measurement id is set in the build environment, and load tags only on the production hostnames in `PUBLIC_ANALYTICS_HOSTS` (comma-separated; empty means nowhere). The loader is one inline script fed by a JSON block, so the computed Content-Security-Policy hashes it; add the tag origins to `CSP_SOURCES`. Cloudflare Web Analytics loads directly (cookie-free). GA4 and GTM set Google Consent Mode v2 defaults (everything denied) before any tag, load the tag after idle (or, in `strict` mode, only after consent), and apply a stored choice at once; choices are stored under `baseline-consent` per consent version, so raising the version asks every visitor again. The `new-site-workflow` skill's trust-and-measurement reference covers choosing a tier with the owner.

- **`Analytics` props** fall back to build environment variables: `gaId` (`PUBLIC_GA_ID`, `G-…`), `gtmId` (`PUBLIC_GTM_ID`, `GTM-…`), `cloudflareToken` (`PUBLIC_CF_BEACON_TOKEN`), `hosts` (`PUBLIC_ANALYTICS_HOSTS`), `mode` (`consent-mode` default, or `strict` through `PUBLIC_CONSENT_MODE`), `version` (`PUBLIC_CONSENT_VERSION`, default 1) and `categories` (`analytics` by default; add `marketing` for ad storage). Malformed ids are ignored. Any element with `data-track="event_name"` sends that event on click, with each `data-track-*` attribute as a parameter.
- **`ConsentBanner`** appears only when GA4 or GTM is configured, the page is on a production hostname and the visitor has not chosen. It is a non-modal region with Accept all, Reject all and Choose (one checkbox per configured category); it never takes focus on load, and any `[data-consent-open]` element (a footer "Cookie settings" link) reopens it with focus on Accept. Props, all with English defaults: `heading`, `text`, `acceptLabel`, `rejectLabel`, `chooseLabel`, `saveLabel`, `privacyHref`, `privacyLabel` and `categoryLabels` (`{ analytics: { label, description }, marketing: … }`). Without JavaScript no tag loads and the banner stays hidden.
- **`VideoEmbed`** props: `provider` (`youtube` or `vimeo`), `id` (the video id; anything else renders no player), `title` (names the button and player), `poster` and `posterAlt`, `playLabel` (`Play video: {title}`), `linkLabel` (`Watch on {provider}`) and `aspectRatio` (default `16 / 9`). YouTube plays from youtube-nocookie.com, Vimeo with `dnt=1`.
- **`MapEmbed`** props: `embed` (the provider's https embed URL, such as an OpenStreetMap export or a Google Maps embed), `href` (the place on the provider), `title`, `address` (shown before the map loads), `showLabel` (`Show map`), `openLabel` (`Open in maps`) and `aspectRatio` (default `4 / 3`). Non-https URLs are dropped.

Both embeds render a stand-in with a real link and insert the provider's frame only on click (`setupLoadOnClick()` in `src/lib/load-on-click.ts`, which moves focus to the new frame); until then the provider receives no request. Without JavaScript the button is a link to the provider. Name each provider in the privacy notice as content loaded on click, and add its origin to `frame-src` in `CSP_SOURCES` when a CSP is on.

### Theme selector and surface controls

```astro
---
import ThemeSelect from '../components/ThemeSelect.astro';
---

<ThemeSelect id="site-theme" label="Theme" />
<button type="button" data-surface-toggle aria-label="Toggle theme">Toggle mode</button>
```

`ThemeSelect.astro` accepts `id`, `label`, and optional translated `labels` for `light`, `dark`, and `system`. SiteShell initializes `initThemeController()` from `src/lib/theme.ts`; standalone shells such as the styleguide must initialize it themselves. The initializer is idempotent.

- **Author defaults:** SiteShell's `surface="light|dark|system"` is recorded in `data-surface-default`. With no preference, an unset default leaves `data-surface` and `data-surface-mode` unset; it does not opt the page into OS dark mode.
- **Explicit choices:** `applyTheme(preference, { persist: false })` applies an in-memory choice without writing storage. A normal selection persists under `baseline:surface` when storage is available. The explicit `system` choice is stored as `system`; `applyTheme(null)` clears the choice and restores the author default.
- **Synchronization:** The controller updates surface attributes, select values, and toggle `aria-pressed` together. It follows OS changes only in system mode, handles cross-tab storage events, and re-synchronizes after ClientRouter swaps. Restricted storage does not prevent current-page theme changes. The CSS surface rules derive `color-scheme` from these attributes.

## Content navigation and structured primitives

### Heading anchors (`Heading.astro`)

```astro
---
import Heading from '../components/Heading.astro';
---

<Heading level={2} id="getting-started" anchor anchorLabel="Direct link to Getting Started">Getting Started</Heading>
```

`id` and `level` (`1` through `6`, default `2`) define the native heading. `anchor` defaults to `false`; opt in for the keyboard-focusable permalink. The link has an `aria-label` (default `Direct link to this section`), while only its decorative `#` span is `aria-hidden`. There is no custom icon prop or automatic heading ID generation. Optional `class` is supported.

Use `slugifyHeading(text)` from `src/lib/headings.ts` when generating explicit IDs. It preserves Unicode marks needed by scripts such as Devanagari, strips Latin combining accents and quoted HTML tags, and normalizes whitespace. It is stateless: use `deduplicateHeadingId(baseId, seenIds)` with a shared Set or Map to reserve emitted IDs within a document. Keep permanent incoming links tied to stable content identities where available.

`.heading-target` supplies `scroll-margin-top: calc(var(--header-height, 4rem) + var(--spacing-content, 1.5rem))`. Set `--header-height` to the real sticky-header height and verify actual anchor placement. The permalink fragment is URL-encoded.

### Table of Contents (`TableOfContents.astro`)

```astro
---
import Heading from '../components/Heading.astro';
import TableOfContents from '../components/TableOfContents.astro';
import type { HeadingRecord } from '../lib/headings';

const headings: HeadingRecord[] = [
  { depth: 2, id: 'intro', text: 'Introduction' },
  { depth: 3, id: 'details', text: 'Technical Details' },
  { depth: 2, id: 'conclusion', text: 'Conclusion' },
];
---

<TableOfContents id="article-toc" contentId="article-content" headings={headings} label="On this page" />
<article id="article-content">
  <Heading level={2} id="intro">Introduction</Heading>
  <p>Introduction text.</p>
  <Heading level={3} id="details">Technical Details</Heading>
  <p>Technical details.</p>
  <Heading level={2} id="conclusion">Conclusion</Heading>
  <p>Conclusion text.</p>
</article>
```

- **Input contract:** `contentId` identifies the content container and `headings` is a readonly array of `{ id, text, depth }`. When mapping Astro Markdown headings, copy `slug` into the record's `id`; the component does not accept `slug` records. Defaults are `minDepth={2}`, `maxDepth={3}`, and `spy={true}`. Depth bounds support `1` through `6`; optional props are `id`, `label`, `offsetIds` (element IDs), and `class`.
- **Native navigation:** Recursive `<ol role="list">` markup retains all eligible levels and works without JavaScript. The component adds no outer margin. Root-scoped global descendant selectors style the injected list inside `@layer components`.
- **Scroll spy:** IntersectionObserver plus scroll/resize updates keep the last heading at the reading threshold active through long sections. Explicit `offsetIds`, `[data-sticky-header]`, and a pixel-valued `--header-height` fallback inform the threshold. Only `aria-current="location"` changes; there is no `is-active` class, history mutation, or focus transfer. At most one link per TOC is current. Controllers tear down on removal and `astro:before-swap`, and initialize on `astro:page-load`.
- **Fragments:** Generated fragments are encoded. Matching decodes once, with raw fallback only for malformed encoding, so IDs such as `100%` and `100%25` remain distinct. `spy={false}` leaves static navigation without scroll tracking.

### Callouts (`Callout.astro`)

```astro
---
import Callout from '../components/Callout.astro';
---

<Callout kind="note" title="Good to know"><p>Contextual guidance.</p></Callout>
<Callout kind="danger" title="Important notice"><p>Read this before proceeding.</p></Callout>
```

`title` is required and must be non-empty. `kind` accepts `note`, `tip`, `caution`, or `danger`, defaulting to `note`. Optional `id` and `class` apply to the root. The default slot holds content. Every kind renders an `<aside class="callout callout--{kind}">` with a styled title paragraph and no alert/status role or live region, including `danger`.

Callout has `margin: 0`; the parent owns its surrounding spacing. Override `--color-callout-note`, `--color-callout-tip`, `--color-callout-caution`, or `--color-callout-danger` for semantic accents, and `--color-callout-bg` / `--color-callout-border` for surfaces and borders. Calibrate colors against the client's actual light/dark surfaces; the kind name is not a contrast certification.

### Steps (`Steps.astro`)

```astro
---
import Steps from '../components/Steps.astro';
---

<Steps id="setup-steps" label="Setup steps" items={[
  { value: 'clone', title: 'Clone the repository' },
  { value: 'install', title: 'Install dependencies' },
  { value: 'verify', title: 'Verify environment' },
]}>
  <p slot="clone">Clone the repository.</p>
  <p slot="install">Run <code>npm ci</code> with the checked-in lockfile.</p>
  <p slot="verify">Run <code>npm run verify:fast</code>.</p>
</Steps>
```

A non-empty `items` array is required. Each item's `value` selects a named slot; optional `title` renders a paragraph. `start` defaults to `1`; `item.number` overrides that item's displayed number and native `<li value>`. Numbers are server-rendered text in decorative, `aria-hidden` markers, not CSS counters. The list uses `<ol role="list">` to preserve list semantics when native markers are suppressed. Optional root props are `id`, `label`, and `class`.

The connector uses logical inset/block properties so it follows `dir="rtl"`. Set the appropriate `lang` as well for translated content. Steps has `margin: 0`; the parent owns sibling spacing. Browser markup checks do not replace Safari/VoiceOver acceptance testing.

## Platform capabilities module and CMS parity

### Build-time capabilities (`virtual:baseline/capabilities`)

```ts
import { capabilities } from 'virtual:baseline/capabilities';

console.log(capabilities.profile);
console.log(capabilities.base);
console.log(capabilities.search !== false);
```

The virtual module exports the named `capabilities` value and the same data as its default export. Public fields are `profile` (`static`, `static-sveltia`, or `emdash`), normalized `base`, `trailingSlash`, `headingLinks`, `callouts`, and `search`. `search` is `false` or `{ engine: 'pagefind', bundlePath: string }`; there is no `isEmDash` field or `features.search` boolean.

`baselineFeatures()` is installed in both configurations and provides Vite resolution plus ambient declarations. Its explicit options set the flags; flags are not automatic component discovery or proof that a search index exists. The module serializes public build facts only. Browser helpers are separate imports from `src/lib/theme.ts`, `clipboard.ts`, `announce.ts`, `tabs.ts`, or `toc.ts`; they are not re-exported by the virtual module. Do not import the filesystem-backed `src/lib/capabilities.ts` resolver into browser scripts.

### EmDash CMS heading IDs (`RichText.astro`, `emdash-headings.ts`)

```astro
---
import RichText from '../components/RichText.astro';
import TableOfContents from '../components/TableOfContents.astro';
import { headingsFromPortableBlocks } from '../lib/emdash-headings';

const blocks = [{ _type: 'block', _key: 'intro', style: 'h2', markDefs: [], children: [{ _type: 'span', text: 'Introduction', marks: [] }] }];
const headings = headingsFromPortableBlocks(blocks, 'article');
---

<TableOfContents id="cms-toc" contentId="article-body" headings={headings} />
<RichText id="article-body" value={blocks} />
```

The adapter allocates IDs on the supplied blocks in place so RichText and the TOC share them. Stable `_key` values use injective hex escaping, including reserved underscores; missing keys fall back to text slugs with collision avoidance. Wrapper HTML IDs do not override previously allocated namespaces. An explicit RichText `scopeId` overrides allocations; use the same scope when extracting the corresponding TOC. Center/right/justify author alignment remains available through the allowlisted `.has-text-align-*` classes. The EmDash renderer remains profile-specific; static projects retain their CMS-free RichText replacement.

### Optional Pagefind search

`SearchDialog.astro`, `src/lib/search.ts` and `npm run search:index` implement the `capabilities.search` contract. Configuration, the pinned Pagefind dev dependency, profile-aware indexing (including the explicit EmDash public snapshot), localization, receipts and browser acceptance are documented in [Optional site search](search.md). The workflow decides search per site at Stage 3 through `astro-site-design/references/shipped-primitives.md`.
