# Galleries

Use EmDash's native Media Library and gallery block as the default for modest albums. `PhotoGallery.astro` defaults to uncropped justified rows: photographs share a height within each row, with widths derived from their proportions using a zero-runtime-JS pure CSS flexbox layout (`flex-grow` proportional to aspect ratio, with a trailing flex spacer to prevent incomplete final rows from stretching). PhotoSwipe 5 (MIT) supplies touch zoom, swipe, keyboard navigation, focus return, and plain-text captions. Long galleries take advantage of `content-visibility: auto` to skip offscreen layout, and Schema.org `ImageGallery` JSON-LD is emitted automatically. Album order and intentional duplicates are preserved. It uses `emdash/ui`'s `PTImage` for previews, including provider rendering and responsive images.

This component is available without installing a gallery plugin. A `portableText` field supports gallery blocks; `gallery` is not a standalone schema field type. The current certified baseline pins EmDash 1.3.0; older migration trials used earlier releases and are historical evidence. Verify a target's installed version and native editor roundtrip before changing its schema.

## Rendering

```astro
---
import { PortableText } from 'emdash/ui';
import PhotoGallery from '../components/PhotoGallery.astro';
---
<div class="flow">
  <PortableText value={entry.data.photos || []}
    components={{ type: { gallery: PhotoGallery } }} />
</div>
```

For an album-only array, use `<PhotoGallery value={entry.data.photos} locale="en" />`. Justified rows respond to the container width directly via CSS flexbox, scale fluidly with `clamp()`, and absorb leftover space on unfinished final rows. Captions remain below their images in normal document flow. Stored dimensions reserve image space; missing dimensions use a provisional 4:3 ratio. CSS layout avoids a runtime `ResizeObserver`; stored dimensions reserve space, but fonts, captions and missing dimensions still need layout-shift checks. The first images load eagerly with high fetch priority above the fold, while remaining images lazy-load. Reduced-motion preferences disable PhotoSwipe transitions.

Use `layout="grid"` to opt into the fixed grid; its gallery block `columns` setting is honored on desktop and reduces to two/one columns on narrow screens. The grid also remains supported for fixed-crop arrangements. Native image blocks and surrounding prose remain supported when using PortableText. The default labels follow Astro's current locale (`fr`, otherwise `en`); pass `locale` for direct use or supply a locale wrapper for additional languages. A site can wrap the component to choose a different default without changing its CMS schema.

An optional album collection can use `title` (`string`), `description` (`text`), `cover` (`image`), and `photos` (`portableText`). Keep albums as collections when editors need to create and link them. Keep page-embedded galleries inside the page's own Portable Text. Register the collection in `src/live.config.ts` when adopting it, and register the cache hints of every content/media/menu/settings query used by each route. These decisions belong to the site's content model; the starter does not seed an invented album collection.

## Editing

Open the Photos field and choose Insert Image. Select multiple Media Library images to create a gallery. Gallery settings allows adding/removing images and drag or keyboard reordering (Space to pick up/drop; arrows move across the grid). Select an image to edit its alt text and caption. Save, reload, and publish; verify a newly selected CMS image on the public page.

Full-resolution links require a stored source URL (`asset.url`, `asset.src`, or `asset.meta.storageKey`). Media IDs and storage keys can differ on Cloudflare; never manufacture a file URL from a bare media ID. Native editor selection supplies the source URL. Links accept storage URLs and HTTP(S) URLs. An external provider without a stored source URL retains its native preview but has no lightbox link. Missing dimensions retain an ordinary full-image link. Never manufacture a URL from an external provider ID. Adapt a provider's supported API explicitly if full-resolution external-provider lightboxes are required.

## Migrating an existing gallery

1. Back up content, schema, and media. Record source album membership, ordered image IDs, covers, captions, alt text, and locales.
2. Import real files through EmDash media APIs. Deduplicate by file hash, with a mapping scoped to the target instance; local and remote IDs can differ. Static assets alone are not Media Library records.
3. Add the new native fields through supported schema APIs. Convert albums with revision checks; stop for active drafts, locks, unmapped media, or unexpected source differences. Preserve intentional duplicates.
4. Verify the native editor's bulk selection, reordering, caption save/reload, and publishing. Compare every migrated album against the source and test the actual rendered preview and full-image URLs, not just Media Library API URLs. Test mobile and desktop lightbox/keyboard behavior.
5. Once verified and authorized, retire obsolete fields and update fresh-install seeds to prevent old fields returning. Keep original values/schema in recovery snapshots. Deploy code separately from content migration; do not reimport the whole site to fix albums.

Historical migration lessons are summarized in the [neutral case study](../audit/gallery-migration-case-study.md). Do not copy source attachment maps, album counts or site-specific repair scripts between instances. Verify each large album on the actual editor/public surface. Standards 0.1.1 observed outer gallery-key regeneration during inline editing; child image identities, captions and order were preserved in that bounded trial.
