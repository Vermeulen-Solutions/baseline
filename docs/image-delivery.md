# Native image delivery

Use Astro `Image`, `Picture` or `getImage` rather than preparing a parallel set of rendition files. This starter's `ResponsiveImage` wraps `getImage` for photographic sources, source-width limits and browser fallback. It preserves originals smaller than 800 pixels and produces quality-90 WebP candidates for larger sources. `optimize={false}` retains original artwork/animated media. No resizing can restore detail absent from the source.

Site imagery belongs in `src/assets/` through explicit imports or in EmDash Media Library. Keep unchanged-URL public passthrough exceptions documented; do not download migration imagery straight into `public/`. CMS images use field dimensions or bounded metadata probing through EmDash's Storage API. The certified EmDash 1.3.0 profile supplies a storage-backed image endpoint, allowing local uploads after build. Preserve original URLs for downloads/PhotoSwipe and keep Portable Text/editor semantics intact. If transformation fails, the browser restores the original image.

## Hosting

The baseline is Node/SQLite/local storage with native Sharp. Local development authorizes only localhost media-file paths. For a hosted site set `SITE_URL=https://your-site.example` in the build environment; the config uses that canonical origin for Astro `site` and the restricted CMS media pattern. Set it at build time, rebuild when changing domains, and verify custom storage base URLs separately. Do not authorize arbitrary remote URLs. Unapproved external sources retain originals.

When converting a site to Cloudflare, verify the installed adapter and EmDash versions, use `cloudflare({ imageService: 'cloudflare-binding' })`, and add `images: { binding: 'IMAGES' }` to Wrangler. Keep the site's own D1/R2/session/plugin bindings. Compilation alone does not optimize new SSR CMS uploads. Verify the account's Images plan/limits before release or any paid change; originals provide fallback on service failures. No Cloudflare account, plan or resources are provisioned by this Node starter.

## Acceptance

Check actual HTTP responses: candidates decode in the requested format, dimensions stay within original width, intrinsic ratio is preserved, small/animated/selected originals remain original, and rejected remote sources are not fetched. Upload new Media Library photography after building and prove optimization without rebuilding. Inspect desktop/mobile, high-density candidates, captions, links, gallery enlargement, editor rendering and service-failure recovery. Run typecheck, build, design/gallery/utility tests. Remove disposable fixtures/uploads and retain bounded evidence. Historical client hosting checks are not starter certification. Worker/D1/R2 hosting targets remain unverified pending cloud infrastructure adapter work.

`npm run check:native-images` creates guarded disposable fixtures, checks development and built Node responses, adds a source through the Storage API after the build, then removes its sources and rebuilds clean output. It does not create CMS records or modify editorial content. It uses port 4332 and writes bounded audit evidence.

## Media Library organization & sanitation

When importing media from WordPress or another source, assets are deposited into an unfiled flat pool with legacy filenames (e.g. `3206-Photo-team-scaled.jpg`). Run the organization utility to tidy the media pool for editors and ensure content references are structured:

```bash
npm run media:organize
# or with dry-run inspection:
node scripts/organize-media.mjs --dry-run
```

This utility:
1. **Creates folders in `media_folders`:** Automatically establishes standard folders (`Pages`, `Articles`, `Documents`, `Media`) and collection-matching folders (e.g. `Teams`, `People`, `Sponsors`, `Galleries`), filing assets by their actual content references.
2. **Slugifies filenames:** Strips leading IDs, WordPress `-scaled` and `-150x150` resizing suffixes, URL encodings, and normalizes characters into clean lowercase slugs (`photo-team.jpg`).
3. **Synchronizes & hydrates content fields:** Updates renamed filenames across all `ec_*` content collections, and hydrates raw string attachment pointers into valid EmDash structured media objects (`{ id, provider: 'local', filename, url, width, height, ... }`) so the CMS Media Picker can render thumbnails.

## Cloudflare R2 storage synchronization

`npm run deploy:cloudflare` (`wrangler deploy`) uploads application code and client bundles, but **never** syncs local `./uploads/` to Cloudflare R2. After migrating or uploading media locally, push missing files to the remote bucket before release:

```bash
npm run media:sync-r2
# or specify bucket explicitly:
npm run media:sync-r2 -- --bucket=my-site-media
```

This helper is an uncertified synchronization utility. Future updates will address nested-key traversal, target-independent mtime caching, and robust error handling before recommended use on production buckets. Prefer supported site transfer where applicable; no remote upload is part of the local diagnostic engine.

Sources: [Astro images](https://docs.astro.build/en/guides/images/), [Cloudflare adapter images](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#imageservice), [Cloudflare Images binding](https://developers.cloudflare.com/images/optimization/binding/).
