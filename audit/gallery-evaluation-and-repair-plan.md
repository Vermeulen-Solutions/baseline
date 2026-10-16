# Gallery evaluation and repair plan

Reviewed 2 October 2026. Status: recommendation for a pilot, not an implemented gallery system.

## Recommendation

Use native EmDash gallery content where it meets the editorial need, a reusable Astro renderer for public presentation, and PhotoSwipe for enlargement. Add a native admin extension only for a demonstrated workflow gap. Do not install either community gallery plugin as the starter default yet.

The backend and frontend solve different problems. A better lightbox does not fix album management, and a media-picker widget does not provide a finished public gallery.

## Evidence and limits

Read the three repositories' source, package manifests, and test files in temporary checkouts, alongside the installed EmDash and admin code. No third-party code was installed or executed. This is a source assessment, not a hands-on editor usability test, package-release verification, or certification of production compatibility. The existing client repositories and databases have not been identified or inspected.

| Source | Reviewed revision | Manifest version |
| --- | --- | --- |
| [astro-photo-grid](https://github.com/kydecker/astro-photo-grid) | `f42a8cb75df907b1f42e02296df12141c88409e1` | 0.0.1; Astro ^7.2.0; Fancyapps ^6.1.14 |
| [gallery-images](https://github.com/marcusbellamyshaw-cell/emdash-plugin-gallery-images) | `db7bb865cbb6c2502f22800bcbcc3ebe2a9e22e2` | 1.4.0; EmDash >=0.16.0 |
| [media-gallery](https://github.com/gg3orgiev/emdash-plugin-media-gallery) | `4573017ad88b8f40e099aab3873ea4fd85516411` | 0.3.0; EmDash/admin >=0.30.0 |
| Local starter | installed packages and checked-in configuration | EmDash/admin 0.40.1; Astro ^7.3.2; Node + SQLite + local media |

The required EmDash skill synchronization was run and its diff reviewed. It updated the three mirrors and upstream metadata to `54aa0758c3bae5ab4a873aea0ae937c49362c065`. Those mirrors now include guidance for EmDash 1.0; they must not be mistaken for the installed version. No dependency upgrade was made.

## What core already provides

There is **no standalone `gallery` schema field type** in the current field-type reference. The media-library guide's phrase “gallery fields” should not be read as a new schema type.

Installed 0.40.1 already provides a Portable Text `_type: "gallery"` block, its editor, converters, and Astro renderer. Its bundled `GalleryDetailPanel` uses multi-selection, per-position alt/caption, replacement/removal, and pointer/keyboard sorting with screen-reader announcements. Its `RepeaterField` also renders `image` sub-fields, and `REPEATER_SUB_FIELD_TYPES` includes `image`. Therefore the June community claim that repeaters cannot contain images is outdated for this starter. The first version introducing each feature was not established; verify each older site's installed code rather than assuming an upgrade threshold.

Core's public `Gallery.astro` remains a basic grid: square image crops, captions, and two columns on small screens, without a lightbox. This explains why native editing support alone cannot deliver the desired frontend.

Sources: [media library](https://docs.emdashcms.com/guides/media-library/), [field types](https://docs.emdashcms.com/reference/field-types/), [gallery editor source](https://github.com/emdash-cms/emdash/blob/main/packages/admin/src/components/editor/GalleryDetailPanel.tsx). Local checks: `node_modules/@emdash-cms/admin/dist/index.js`, `node_modules/emdash/src/schema/types.ts`, `node_modules/emdash/src/components/Gallery.astro`.

### Follow-up: exact EmDash 1.0.1 check

Downloaded and unpacked the published `emdash@1.0.1` and `@emdash-cms/admin@1.0.1` npm archives into a temporary directory without installing dependencies or running package scripts. Compared them with installed 0.40.1. `Gallery.astro` and `content/converters/gallery.ts` have no source differences. The bundled GalleryNode, GalleryDetailPanel, and RepeaterField regions are identical. The 1.0.1 schema still has no standalone gallery type; image repeaters and Portable Text gallery blocks remain the available native approaches.

Thus 1.0.1 does not add an album-management system or enhanced public gallery to this baseline. In a Portable Text editor, choose Gallery from the block menu, select images, and edit/order the resulting block. Albums, archive routes, covers, filtering, and lightbox behavior are site architecture and presentation decisions.

The [1.0.1 release](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.0.1), published 28 September 2026, contains the 1.0 API transition, a fix for recreating deleted collections with media-usage cleanup pending, and a WordPress media URL rewrite fix preventing attachment query-string keys from matching unrelated base URLs. These fixes matter to migration reliability, but are not new gallery functionality. Follow the [1.0 upgrade guide](https://docs.emdashcms.com/upgrade-to-v1/) when changing dependencies. No site dependency was changed by this review.

As of this review, [1.1.0](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.1.0) was published on 1 October 2026; 1.0.1 is no longer the newest release. This follow-up's exact package comparison targets 1.0.1 only.

## Package assessments

### Astro Photo Grid

Good reference for a responsive justified layout that respects mixed image proportions. It uses CSS flex layout with dimension-derived ratios and Fancybox enlargement. It is a whole site template, not an EmDash gallery package. Images come from `import.meta.glob` over `src/images`; ordering and updates belong to the code/build workflow. CMS uploads require a different data source and runtime image delivery.

The inspected page assigns every image `alt=""`, has no editorial captions or album model, eagerly loads the first 20 images, and opens the original source asset in the lightbox. Those choices need deliberate replacement for client galleries. No LICENSE file was present in the reviewed checkout; clarify permission before copying its implementation. Fancybox v6 additionally has a paid production license: [Fancyapps license](https://fancyapps.com/license/).

Verdict: visual reference, not a migration or backend solution. Reimplement the layout from requirements with shared site tokens, and use PhotoSwipe unless a site's needs justify Fancybox licensing.

Evidence: [reviewed page](https://github.com/kydecker/astro-photo-grid/blob/f42a8cb75df907b1f42e02296df12141c88409e1/src/pages/index.astro).

### Gallery Images

Useful editorial ideas: batch upload, library selection, per-photo caption/alt, visible ordering controls, and an overview linking into entries. MIT licensed. However, it is tailored to its author's Cloudflare site. Admin thumbnails hardcode `/cdn-cgi/image/...`; `mediaId` actually stores a storage key. That makes conversion to canonical media references necessary for reuse or transfer.

Source differs from the README: the reviewed widget uses up/down buttons rather than drag reordering, and the package is named `emdash-plugin-gallery-images` while installation prose names `ebt-plugin-gallery-images`. Its overview is fixed to `posts`, `pages`, and the `images` field, capped at 200 posts and 100 pages without pagination. It is not an album manager for arbitrary collections. Picker and overview fetch errors can appear as empty results. No authoritative gallery save validator is declared. Direct admin imports and broad peer ranges need an integration test on the actual host version.

Verdict: not suitable unchanged for this Node starter. Borrow workflow ideas; adapting its storage assumptions, picker, manager, and validation would create significant maintenance.

Evidence: [admin code](https://github.com/marcusbellamyshaw-cell/emdash-plugin-gallery-images/blob/db7bb865cbb6c2502f22800bcbcc3ebe2a9e22e2/src/admin.tsx), [runtime](https://github.com/marcusbellamyshaw-cell/emdash-plugin-gallery-images/blob/db7bb865cbb6c2502f22800bcbcc3ebe2a9e22e2/src/runtime.ts).

### Media Gallery

The stronger of the two dedicated field-widget foundations: real media IDs, ordered items, primary image, configurable text metadata, reuse of the host multi-picker, hydration helper, and pure validation tests. MIT licensed. The picker is explicitly local-only; external media providers need separate consideration. It supplies neither a complete album manager nor a public grid/lightbox.

Material source findings:

1. **Save validation is not wired for this host.** The plugin declares only legacy `read:media`. Installed EmDash 0.40.1 requires `content:write` to register `content:beforeSave`, and skips the hook without it. `read:media` itself is normalized during the deprecation window; the missing write capability is the consequential issue. Simply granting it is insufficient: prove rejection behavior through the host's error-policy mechanism.
2. Even with the hook active, `looksLikeGallery` requires every item to already contain a string `mediaId`. Mixed malformed arrays can bypass it. Validation must identify owned fields by schema/widget, not by guessing the value's shape. Field min/max and MIME constraints also need authoritative enforcement; currently min/max are UI rules apart from the hard cap.
3. Hydration looks up only items **without** an embedded `storageKey`. Items with cached keys are not checked for deletion/trash or current metadata. The README's broad claim about dropping unavailable media does not cover that common path.
4. The default URL is `/api/media/<storageKey>`, unlike this starter's configured media base. Its D1 helper directly queries `media` table columns. Use supported media/provider APIs and the site's actual URL configuration rather than adopting that SQL helper.
5. Reordering uses HTML5 drag events without a keyboard alternative in the reviewed widget. Package version 0.3.0 and exported plugin VERSION 0.2.0 also disagree. These are integration and usability review items.

Verdict: best plugin candidate if a pilot proves native editing insufficient, but requires fixes and host integration tests before adoption. The findings are source-derived; the plugin was not installed into a running site.

Evidence: [plugin registration](https://github.com/gg3orgiev/emdash-plugin-media-gallery/blob/4573017ad88b8f40e099aab3873ea4fd85516411/src/plugin.ts), [hook](https://github.com/gg3orgiev/emdash-plugin-media-gallery/blob/4573017ad88b8f40e099aab3873ea4fd85516411/src/hook.ts), [validation](https://github.com/gg3orgiev/emdash-plugin-media-gallery/blob/4573017ad88b8f40e099aab3873ea4fd85516411/src/validate.ts), [hydration](https://github.com/gg3orgiev/emdash-plugin-media-gallery/blob/4573017ad88b8f40e099aab3873ea4fd85516411/src/runtime.ts). Host comparison: `node_modules/emdash/src/plugins/hooks.ts`, `HOOK_REQUIRED_CAPABILITY` and `registerPluginHook`.

## Additional resources

| Resource | Role and recommendation |
| --- | --- |
| [PhotoSwipe](https://photoswipe.com/getting-started/) | Preferred lightbox. Framework independent, dynamic loading, image dimensions and responsive sources. [MIT license](https://github.com/dimsemenov/PhotoSwipe/blob/master/LICENSE). Captions need deliberate integration; [caption guidance](https://photoswipe.com/caption/) explains the screen-reader implications. |
| [flickr-justified-gallery](https://github.com/nk-o/flickr-justified-gallery) | MIT alternative when precise row sizing, last-row control, or caption-aware layout exceeds a CSS solution. Adds JS layout/reflow; evaluate only if needed. |
| [EmDash modern-images](https://github.com/adrianoamalfi/emdash-plugin-modern-images) | Potential Node/local-media delivery helper using Sharp and a disk cache. Not a gallery backend. README-only assessment here; compare against native Astro/EmDash image delivery first. Cloudflare needs its own delivery path. |
| [EmDash theme porting](https://docs.emdashcms.com/themes/porting-wp-themes/) | Official explanation of replacing gallery shortcodes with structured content and a custom renderer. Verify importer output for each source pattern. |

## Proposed architecture

### Content and editorial workflow

| Need | Default model |
| --- | --- |
| Images embedded in a page/article | Native Portable Text gallery in its original editorial position. |
| Named albums with archive/detail URLs, categories, dates, cover, and status | `galleries` collection. Native `cover` image, title/description, optional date/taxonomy, and a Portable Text photos field containing a gallery block. Prototype this workflow with editors before standardizing it. |
| Per-image credit, custom link, or other structured item fields | Image repeater with caption/credit/link sub-fields. Core repeaters add rows individually; do not claim this supplies bulk gallery editing. |
| Large independent image catalogue needing image-level querying | Separate photo records and explicit ordered memberships, only after proving scale/editorial need and verifying relation ordering. Avoid forcing every ordinary album into hundreds of records. |

Prefer the native block first because bulk selection and ordering address the original usability complaint. A dedicated widget remains a fallback when editors need bulk operations plus richer per-item fields. Such a widget would be a trusted native React extension installed with the site, not a sandbox registry plugin. Choose an explicit maintenance owner and supported EmDash version range.

Assets belong to the Media Library. Albums own selection, order, cover, and contextual captions/alt. Keep canonical media IDs/provider references; storage keys and dimensions are derived hints. Preserve intentional reuse of an image at more than one gallery position. Specify shared versus translated selection and metadata per site; do not globally overwrite asset alt text to change one album's description.

### Public presentation

Use a common read adapter to normalize native gallery blocks, image repeaters, and temporary legacy shapes into one renderer input. Keep this a presentation contract, not another persisted CMS database. Resolve media through supported APIs/provider helpers and record unresolved references for migration review.

Build one shared Astro gallery with two initial layouts: justified rows for photographs and a regular grid for projects/products. Preserve natural proportions unless cropping is part of the site's recorded direction. Provide visible captions where needed, configurable gaps/row height through existing tokens, and a cover-led album archive. Layout selection must be a known enum.

Render semantic linked images on the server so images remain usable without JS. Enhance with dynamically loaded PhotoSwipe: scoped galleries, swipe/zoom, keyboard navigation, Escape, focus return, localized control labels, and safe text captions. Provide intrinsic dimensions, container-correct `sizes`, optimized thumbnails and bounded enlargement sizes. Lazy-load offscreen images; preload only a measured LCP candidate. Large albums need explicit paging/load-more and a defined lightbox scope, not an enormous eager DOM.

When route caching is enabled, register hints for every content/settings/menu query and verify media changes cannot leave stale references. Inspect editor preview and public output. Respect each site's art-direction gate before visual source implementation.

## New WordPress migrations

1. Inventory gallery locations and ownership: Gutenberg, `[gallery]` shortcodes, ACF galleries/repeaters, builders, NextGEN/Envira/FooGallery or other plugin records. Record album/image counts, source IDs, order, captions, alt, covers, locales, routes, links, and interactions in the content-candidate register.
2. Choose inline block versus album collection before import. Do not assume all repeated image markup means independent photo records.
3. Trial the official importer on representative examples. Core supports gallery shapes, but arbitrary plugin storage and builder widgets need explicit extraction. Preserve original payloads and source-to-target mappings.
4. Resolve attachment IDs/URLs to canonical target media references. Optimize media with a recorded mapping; confirm download failures and duplicates. Preserve contextual metadata and gallery position.
5. Test a representative editor task and render with the shared component before scaling. Migration acceptance includes editor usability as well as content counts and visual review.

## Repairing already-migrated sites

This is a per-site additive migration. Re-importing all WordPress content would risk losing post-migration edits. The current CMS is the authoritative starting point; use WordPress exports/backups only to recover identified losses.

1. **Inventory and recoverability.** Record repository, installed versions, hosting/storage, current schema/widgets, raw values, public routes, locale rules, and specific editor pain. Back up database, media, and keys; verify restoration in staging. Include drafts, scheduled content, and retained revisions in the compatibility assessment.
2. **Frontend pilot.** If current data is complete, introduce a legacy read adapter and the common gallery renderer first. Keep the editor unchanged during this step so presentation improvements can be evaluated independently.
3. **Add the target model.** Use the supported schema/admin/CLI migration path for the pinned EmDash version. Editing `seed/seed.json` alone does not update an existing site's schema. Separate an EmDash core upgrade, if required, from gallery data conversion; prove each in staging.
4. **Dry-run conversion.** Write an idempotent converter keyed by site + source record + field/position. Resolve each old ID/key/URL, retain order, captions, covers, links, and locale/status. Produce before/after manifests and unresolved-item reports. Do not silently drop unmatched images or merge intentional duplicate positions. Reuse existing media where possible.
5. **Editor pilot.** A real editor uploads a batch, finds library images, reorders, edits captions/alt, changes covSer, saves, reloads, previews, and publishes. Check keyboard and touch use. Also test entry switching, aborted uploads, deleted images, and draft/public separation.
6. **Controlled switch.** Choose one canonical write location; avoid two independently editable versions. Keep the old payload as a recoverable snapshot and legacy read fallback. Fence conversion against concurrent edits or use a short editing pause with final delta reconciliation. Cut over only after all unresolved items are resolved or explicitly accepted.
7. **Rollback and cleanup.** Keep old schema/data and compatible code until acceptance. Rollback must include data and new edits, not only a code redeploy; core database migrations are not automatically reversed. Retire legacy fields/widgets only after restoration rehearsal and editor acceptance. Repeat the proven process site by site.

## Pilot deliverables and acceptance

Start with one affected site containing mixed portrait/landscape photos and enough images to exercise bulk editing. Its repository/URL and data model remain inputs to be supplied.

- Version-specific content/editor decision and a sample album that survives save/reload/publish.
- Shared rendering adapter, Astro component, and PhotoSwipe enhancement styled to that site's recorded art direction.
- Dry-run migration manifest and source/target counts by album, status, and locale; every unresolved media reference reported.
- Keyboard/touch and narrow/wide visual review, focus return, no-JS links, caption escaping, and no draft leakage.
- Performance evidence for representative and large albums: thumbnail bytes, full-image requests, layout shift, and server query behavior. Set budgets against actual source media and hosting.
- Backup/rollback rehearsal; deployment and remote CMS content changes verified separately.

After the pilot passes, promote the component and migration/editor decision rules into the reusable starter and custom migration/design skills. Keep upstream mirrored skills untouched except through synchronization. Do not make a speculative gallery plugin mandatory across every site.
