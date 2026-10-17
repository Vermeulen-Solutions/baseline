# Reusable public patterns

These are neutral infrastructure, not a client theme. Choose brand tokens and a real art direction before composing site pages. No client assets, sponsor collection, form storage or mail provider is installed by these patterns.

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

CMSPartnersPanel explicitly queries published entries, registers cache hints and applies no limit. Installed EmDash 1.3.0 returns the complete collection when limit is omitted; recheck this contract during upgrades. Choose deliberate shared/translatable collection semantics, not duplicate page lists. Add/remove/unpublish/deactivate in CMS and verify all consuming pages stay in sync. `logo_ground="dark"` places a dark inset behind artwork inside the light tile. Logos keep original colors. Hover changes no layout geometry; motion respects reduced motion. URL fields should use CMS URL validation.

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

`PhotoGallery.astro` renders fluid, uncropped justified photo rows without relying on JavaScript Masonry or Isotope libraries:
- **Pure CSS Flexbox Sizing:** Computes proportional `flex-grow` and aspect ratios on the server. Images share equal heights within each row, with leftover space absorbed cleanly by a trailing flex spacer.
- **Progressive Enhancement:** PhotoSwipe 5 (MIT) is loaded only when a visitor clicks an image to open the full-screen touch lightbox. If JavaScript fails or is disabled, clicking simply navigates to the original image.
- **Structured Data:** Generates Schema.org `ImageGallery` JSON-LD automatically for search engine rich results.

## Focus and contextual surfaces

`data-surface="dark"` and `data-surface="light"` establish contextual surface relationships (`color-scheme`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, and `--color-focus`) Customizable via `--surface-dark-*` and `--surface-light-*` tokens so a dark section inside a light page (or a light card inside a dark hero) automatically adapts its text, muted copy, border, and focus ring. Set surface tokens from the real site palette and verify contrast against their actual grounds. Tables, filters and count/status belong together; deduplicate contacts without hiding distinct roles. Calendar actions should represent a real dated appointment, not imply a recurring schedule from a programme period.
