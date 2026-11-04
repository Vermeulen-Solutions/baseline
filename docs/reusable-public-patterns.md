# Reusable public patterns

These are neutral infrastructure, not a client theme. Choose brand tokens and a real art direction before composing site pages. No client assets, sponsor collection, form storage or mail provider is installed by these patterns.

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

Use `layout="horizontal"` for wide rows (which stacks automatically via `@container (max-width: 32rem)` and `@media (max-width: 40rem)`), `imageFit="contain"` for full posters/artwork, and `imageAspect` for an intentional frame. Customize appearance via CSS custom properties (`--card-bg`, `--card-text`, `--card-muted`, `--card-border-width`, `--card-border-color`, `--card-radius`, `--card-padding`, `--card-frame-padding`, `--card-gap`, `--card-shadow`) and concentric inner media radius (`--card-media-radius: max(0px, calc(var(--card-radius) - var(--card-frame-padding)))`). Card actions align at the bottom of equal-height grid rows. Stress long/translated titles, absent media, uneven copy and odd final rows; don't force equal slots to fill empty space.

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

- **Pure CSS Flexbox Sizing:** Computes proportional `flex-grow` and aspect ratios on the server. Images share equal heights within each row, with leftover space absorbed cleanly by a trailing flex spacer.
- **Progressive Enhancement:** PhotoSwipe 5 (MIT) is loaded only when a visitor clicks an image to open the full-screen touch lightbox. If JavaScript fails or is disabled, clicking simply navigates to the original image.
- **Structured Data:** Generates Schema.org `ImageGallery` JSON-LD automatically for search engine rich results.

Existing sites can adopt the updated component through a reviewed Baseline update, preserving their local calibration, and opt into `fit="contain"` per caller. Omitting the prop retains the previous look. Do not remove purposeful crops globally or paste more-specific host selectors over Astro's scoped component rules. The local browser regression checks rendered proportions for mixed native-media frames at 390/768/1440px, native field readback/rendering, lightbox keyboard/focus return and no-JavaScript original-image links. Offscreen painting can be enabled solely for capture, but actual visible layout/proportions must be tested without screenshot layout overrides. A green image request alone does not prove framing or editor acceptance.

## Focus and contextual surfaces

`data-surface="dark"` and `data-surface="light"` establish contextual surface relationships (`color-scheme`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, and `--color-focus`) Customizable via `--surface-dark-*` and `--surface-light-*` tokens so a dark section inside a light page (or a light card inside a dark hero) automatically adapts its text, muted copy, border, and focus ring. Set surface tokens from the real site palette and verify contrast against their actual grounds. Tables, filters and count/status belong together; deduplicate contacts without hiding distinct roles. Calendar actions should represent a real dated appointment, not imply a recurring schedule from a programme period.

## Accessible interactive primitives

Baseline's interactive primitives provide zero-framework, progressively enhanced user interface controls following WAI-ARIA authoring practices, with zero external npm dependencies.

### Accessible Tabs (`Tabs.astro`)

`Tabs.astro` provides an accessible, progressive-enhancement tabbed interface that requires zero client script to read all content.

```astro
---
import Tabs from '../components/Tabs.astro';
---

<Tabs id="cli-tabs" label="Command line package manager" items={[{ label: 'Bash', value: 'bash' }, { label: 'PowerShell', value: 'powershell' }]} syncKey="cli-flavor">
  <div slot="bash">
    <pre><code>npm run verify</code></pre>
  </div>
  <div slot="powershell">
    <pre><code>npm.cmd run verify</code></pre>
  </div>
</Tabs>
```

- **Progressive enhancement:** Without JavaScript, all panels render in sequence with visible tab-heading titles so all content remains fully legible and discoverable.
- **WAI-ARIA compliance:** Once initialized, `<div role="tablist">` contains `<button role="tab">` elements paired with `<div role="tabpanel">`. Tab navigation follows WAI-ARIA keyboard guidelines: `ArrowLeft` / `ArrowRight` (or `ArrowUp` / `ArrowDown`), `Home`, and `End` rove focus between tabs with automatic panel activation.
- **Peer synchronization (`syncKey`):** When multiple `<Tabs>` share a `syncKey`, selecting a tab on one switches all tabs with matching item IDs across the page, persisting the choice in `sessionStorage`. If storage is restricted or unavailable (private browsing, sandboxed iframes), selection continues to function gracefully in memory.
- **ClientRouter & Disconnect lifecycle:** Integrates with Astro's ClientRouter lifecycle (`astro:page-load`, `astro:before-swap`). Observer connections clean up on DOM teardown to prevent stale references, memory leaks, or duplicate listener registrations after page transitions.
- **Print media support:** When printing, tab buttons hide and all panels display sequentially with their titles, ensuring printed documentation captures all alternatives.

### Copy button & live announcer (`CopyButton.astro`, `Announcer.astro`)

`CopyButton.astro` provides accessible copy-to-clipboard interactions with clear visual and screen-reader status announcements.

```astro
---
import CopyButton from '../components/CopyButton.astro';
import Announcer from '../Announcer.astro';
---

<pre id="code-snippet"><code>npm run verify:fast</code></pre>
<CopyButton targetId="code-snippet" label="Copy command" copiedLabel="Copied command!" />
<Announcer />
```

- **Target resolution:** Supports an element ID via `targetId` (e.g. `code-snippet`). Target elements can be standard DOM containers (`pre`, `code`, `p`) or form controls (`input`, `textarea`). Leading/trailing decorations are stripped cleanly before copying.
- **Fallback copy support:** When the asynchronous `navigator.clipboard` API is unavailable or denied by browser security permissions, a fallback mechanism safely writes the selection.
- **Visual & Screen-reader feedback:** Changes button text, class (`is-copied`), and icon on success with an automatic reset timer. Integrates with `Announcer` singleton (`announce()` in `src/lib/announce.ts`) to read polite status messages without interrupting active speech.
- **Abort & Teardown safety:** Operations and pending timeouts clean up on element removal, navigation swaps, or explicit `AbortSignal`.

### Theme selector & surface controls (`ThemeSelect.astro`, `[data-surface-toggle]`)

Baseline includes a unified theme engine that coordinates system preferences, author surface defaults, and user choices.

```astro
---
import ThemeSelect from '../components/ThemeSelect.astro';
---

<ThemeSelect label="Theme" />
<button type="button" data-surface-toggle aria-label="Toggle dark mode">Toggle mode</button>
```

- **Zero-FOUC author defaults:** When no stored preference exists, the author-declared default surface (`surface="light"` or `surface="dark"` on `SiteShell.astro`) is preserved without premature overrides, matching both light and dark site branding out of the box.
- **Storage resilience:** Gracefully handles private browsing modes and disabled `localStorage` without thrown exceptions. Theme changes update live document styles and synchronize `<ThemeSelect>` dropdowns and `[data-surface-toggle]` buttons even when storage writes are blocked.
- **ClientRouter persistence:** Listens to `astro:after-swap` to ensure theme attributes (`data-surface`, `color-scheme`) persist across Astro ClientRouter page transitions without flashing.
- **System preference sync:** Automatically synchronizes with OS dark/light mode adjustments when set to "system" (`auto`), adapting in real time via `prefers-color-scheme` media query listeners.

## Content navigation and structured primitives

### Heading anchors & permalinks (`Heading.astro`)

`Heading.astro` renders accessible `<h1>` through `<h6>` headings with self-referencing anchor permalinks.

```astro
---
import Heading from '../components/Heading.astro';
---

<Heading depth={2} id="getting-started">Getting Started</Heading>
```

- **Accessible permalinks:** Renders an internal `<a>` tag with `#` symbol (or custom icon), marked `aria-hidden="true"` visually, accompanied by a visually hidden screen-reader label ("Section titled Getting Started") to prevent redundant link announcements.
- **Deterministic slug generation:** Integrates with `src/lib/headings.ts` for clean, URL-safe slugify generation with unicode mark stripping and collision avoidance.
- **Heading target class:** Renders `.heading-target` on the target heading, supporting `:target` styling and scroll margins for fixed headers (`scroll-margin-top: var(--scroll-margin, 5rem)`).

### Table of Contents & scroll spy (`TableOfContents.astro`)

`TableOfContents.astro` generates a semantic navigation list with pure-DOM scroll-spy tracking.

```astro
---
import TableOfContents from '../components/TableOfContents.astro';

const headings = [
  { depth: 2, slug: 'intro', text: 'Introduction' },
  { depth: 3, slug: 'details', text: 'Technical Details' },
  { depth: 2, slug: 'conclusion', text: 'Conclusion' },
];
---

<TableOfContents headings={headings} label="On this page" minDepth={2} maxDepth={3} />
```

- **Arbitrary depth nesting:** Renders recursive semantic `<nav aria-label="...">` with nested `<ol>` lists inside `@layer components`. Scoped styling preserves correct indentation, typography, and contrast across all 6 heading levels.
- **IntersectionObserver scroll spy:** Tracks active sections on scroll using `src/lib/toc.ts`. Applies `aria-current="true"` and `.is-active` to exactly one active heading at a time, preventing double-activation states.
- **Safe fragment encoding:** Encodes link fragments consistently and isolates malformed or percent-encoded fragment targets (e.g. `100%`) so malformed links cannot crash the scroll-spy observer.
- **Zero-JS navigation:** Fully operable as static anchor links when JavaScript is unavailable.

### Callouts (`Callout.astro`)

`Callout.astro` presents distinct aside callouts for notes, tips, cautions, and danger alerts.

```astro
---
import Callout from '../components/Callout.astro';
---

<Callout variant="note" title="Good to know">
  <p>Callout descriptions appear here.</p>
</Callout>

<Callout variant="danger" title="Important notice">
  <p>Critical warnings use high-contrast danger tokens.</p>
</Callout>
```

- **Semantic HTML:** Renders `<aside class="callout callout--{variant}">` with an optional title. Non-critical variants (`note`, `tip`, `caution`) avoid intrusive `role="alert"` or `role="status"` live regions to prevent interrupting screen readers during normal reading flow.
- **Zero external margin contract:** Features `margin: 0;` so parent layout containers (`Section`, `Container`, `Grid`, or `.flow`) dictate spacing without collapsing-margin issues or unexpected whitespace.
- **Themed variants:** Ships with accessible SVG icons and tokens for `note`, `tip`, `caution`, and `danger`.

### Steps (`Steps.astro`)

`Steps.astro` organizes sequenced workflows, tutorials, or onboarding steps.

```astro
---
import Steps from '../components/Steps.astro';
---

<Steps items={[
  { value: 'clone', title: 'Clone the repository' },
  { value: 'install', title: 'Install dependencies' },
  { value: 'verify', title: 'Verify environment' },
]}>
  <p slot="clone">Clone the baseline repository from GitHub.</p>
  <p slot="install">Install dependencies with <code>npm install</code>.</p>
  <p slot="verify">Run <code>npm run verify:fast</code> to test your environment.</p>
</Steps>
```

- **Semantic list:** Emits an ordered list `<ol class="steps" role="list">` with numbered step markers generated via CSS counters (`counter-increment: step-counter`) or explicit step numbers.
- **Logical properties & RTL support:** Employs CSS logical properties (`margin-inline-start`, `padding-inline-start`, `border-inline-start`) for complete right-to-left (`dir="rtl"`) compatibility without requiring mirrored styles.
- **Layout spacing:** Features `margin: 0;` for predictable integration inside `.flow` editorial rhythms and layout containers.

## Platform capabilities module & CMS parity

### Capabilities module (`virtual:baseline/capabilities`)

The `virtual:baseline/capabilities` module exposes browser-safe environment facts and client runtime helpers across all platform profiles (`static`, `static-sveltia`, `emdash`).

```ts
import {
  capabilities,
  applyTheme,
  subscribeTheme,
  copyToClipboard,
  ensureAnnouncer,
  initTabs,
  initTableOfContents,
} from 'virtual:baseline/capabilities';

console.log(capabilities.profile); // 'emdash' | 'static' | 'static-sveltia'
console.log(capabilities.isEmDash); // true | false
```

- **Multi-profile integration:** In static profiles, `baselineFeatures()` is registered in `astro.config.mjs` and ambient declarations are provided in `src/env.d.ts` (`declare module 'virtual:baseline/capabilities'`).
- **Client runtime helpers:** Bundles re-usable client helpers for theme manipulation, clipboard actions, announcer management, and widget initialization with 0 external npm dependencies.

### EmDash CMS heading parity (`RichText.astro`, `emdash-headings.ts`)

Portable Text headings in EmDash maintain full parity with static `<Heading>` components and `<TableOfContents>`:

- **Deterministic ID generation:** Portable Text headings receive deterministic, URL-safe IDs using `slugifyHeading()` and stable block keys.
- **Scope isolation:** `extractHeadingsFromBlocks()` and `RichText.astro` share heading ID allocations. Providing a custom `id` attribute on `<RichText id="article">` does not invalidate pre-extracted TOC targets unless an explicit `scopeId` override is supplied.
- **Text alignment preservation:** Portable Text headings with `textAlign: "center"`, `"right"`, or `"justify"` map to `.has-text-align-center`, `.has-text-align-right`, and `.has-text-align-justify` utility classes without losing styling or target anchors.
