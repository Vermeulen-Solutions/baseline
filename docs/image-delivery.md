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

The former `media:organize` utility is retired and exits **2** without changing files or the database. It guessed internal tables, renamed originals by filename patterns and rewrote arbitrary content JSON. Use the supported WordPress importer first when it meets the mapping, or the explicit preparation/ingestion workflow below. No raw SQL media hydration is part of this toolkit.

## WordPress media plan and preparation

The default command is read-only inventory. It recursively hashes an explicit uploads source, probes bounded raster pixels, and records ownership, dimensions, source/original/derivative relationships, locale, captions, alt, credit, provenance, aliases and usage. Nothing is deleted or downloaded. Use a stable source ID so retries retain attachment identity.

```sh
npm run media:migrate-wp -- --source ../private-exports/uploads --source-id migration-fixture --metadata ../private-exports/attachments.json --out .emdash/backups/wp-plan-001
```

The version-1 metadata adapter accepts a reviewed attachment projection from importer analysis/export metadata, **not arbitrary raw WXR, serialized PHP or an entire WordPress REST response**:

```json
{
  "metadataVersion": 1,
  "attachments": [
    {
      "id": 101,
      "file": "2025/photo-scaled.jpg",
      "originalFile": "2025/photo.jpg",
      "locale": "en",
      "alt": "Verified source description",
      "caption": "Source caption",
      "credit": "Source credit",
      "provenance": "Permission-cleared source export",
      "sourceURL": "https://example.invalid/uploads/photo-scaled.jpg",
      "aliases": [],
      "uses": ["gallery:example"],
      "usageComplete": true,
      "variants": [{ "file": "2025/photo-300x200.jpg", "kind": "crop", "referenced": true }]
    }
  ]
}
```

Paths are relative to the uploads root. Unknown ownership/relationships remain unknown. A `-scaled` or `-300x200` filename is never sufficient evidence to remove or rename a file. Missing originals retain the surviving file and a finding. Only an explicit complete usage inventory with `referenced: false` marks a derivative archive-only; it is still retained. Unmapped files, missing explicit alt/caption and corrupt/unsupported inputs are quarantined. `alt: ""` intentionally preserves decorative alt.

Identical bytes may share the archival blob, but attachment IDs, locales, captions and gallery occurrences retain separate identities. Proposed content-addressed storage keys in the plan are planning identifiers, never assumed CMS keys. Source imagery stays outside `public/`; use the existing native Astro image service for delivery rather than generating a parallel production rendition system.

```sh
# Preserve originals; archive/prepared files and journals stay ignored/private.
npm run media:migrate-wp -- --source ../private-exports/uploads --source-id migration-fixture --metadata ../private-exports/attachments.json --prepare --out .emdash/backups/wp-prepared-001

# Explicitly resize only oversized static rasters; no upscale or forced AVIF.
npm run media:migrate-wp -- --source ../private-exports/uploads --source-id migration-fixture --metadata ../private-exports/attachments.json --prepare --max-width 2400 --out .emdash/backups/wp-prepared-resize-001

# Repeat only the identical source/metadata/profile into the existing prepared stage.
npm run media:migrate-wp -- --source ../private-exports/uploads --source-id migration-fixture --metadata ../private-exports/attachments.json --prepare --resume --out .emdash/backups/wp-prepared-001
```

Sharp decoding runs in a separate 15-second process with a 128 MiB JS heap, 16 MiB Sharp cache, one processing thread, 32 MiB input/output and 40-million combined-pixel bounds, at most 100 frames and 20,000 pixels per dimension. Native allocations are bounded by pixel/frame limits rather than the JS heap flag. Headers alone do not establish valid pixels. Small originals and all animation frames remain byte-identical. Explicit static resizing auto-orients EXIF, converts to sRGB, retains format and records the source/output hashes and dimensions; source originals remain archived. There is no unconditional size cap, repeated encoding or default AVIF conversion. HEIC is not mislabeled as AVIF.

SVG/PDF/video are review/pass-through cases, never rasterized automatically. A reviewed attachment may declare `passthroughSHA256` equal to the exact source bytes to permit passthrough; an edit invalidates that review. This is an explicit review attestation, not automatic SVG sanitization. Unreviewed files remain quarantined. A preparation interruption may leave an unjournaled output; inspect that private artifact before removing/retrying it. Locks are never deleted automatically while another process may own them.

## Supported local CMS ingestion and references

```sh
# URL must name an explicitly selected local Node instance.
# Supply EMDASH_TOKEN securely; --dev-bypass is only for an owned disposable dev instance.
npm run media:migrate-wp -- --apply-local --stage .emdash/backups/wp-prepared-001 --url http://127.0.0.1:4321

# Create an R2-ready object tree after complete verified ingestion.
npm run media:migrate-wp -- --stage-r2 --stage .emdash/backups/wp-prepared-001 --out .emdash/backups/r2-stage-001
```

The EmDash 1.3.0 REST adapter uses supported multipart upload/get/storage endpoints, explicit auth and CSRF/origin headers. It sets `deduplicate=false` so equal bytes cannot collapse different metadata identities, and preserves empty alt. It verifies the returned media ID, **actual `storageKey`**, metadata, native/oriented dimensions and stored byte SHA-256. Names and media IDs are never substituted for storage keys. Credit, provenance, aliases and locale stay in the manifest/journal; the adapter does not invent unsupported CMS media fields. External CMS origins are refused by this local adapter.

Repeated successful ingestion reads/verifies existing records instead of creating more. The journal is target/plan-bound and locked. An interrupted/failed POST may already have created a record: automatic retry is blocked as `needs-reconciliation`. Inspect the explicit local target, then provide `--adopt ../private-review/adoption.json`, a mapping of manifest entry ID to a verified media ID. Adoption rechecks metadata and bytes. No speculative remote rollback deletes newly created or pre-existing/shared assets. Partial/quarantined ingestion exits 1; missing/unsupported evidence and unsafe arguments exit 2.

`mapPreparedReferences(stage, orderedEntryIds)` in `scripts/media-ingest.mjs` produces canonical native image occurrences from verified mappings, preserving repeated occurrences, captions, decorative alt and explicit order with distinct keys. Apply the result only to an explicitly selected content field/locale through the supported content API with a fresh `_rev`; never regex-rewrite arbitrary JSON, publish unrelated entries or assume a legacy string is an image field. The local rehearsal demonstrates revision-bound gallery save/reload, anonymous public rendering and restoration on a fresh synthetic site. This does not authorize changes to a downstream site's content.

`--stage-r2` writes `objects/<actual-storage-key>` plus a mapping receipt; it performs no cloud upload. The receipt carries MIME/hash facts for the R2 helper. Existing application deployments do not transfer this Media Library database or upload bytes. Prefer supported site transfer into an empty target when moving the whole site.

## Explicit, create-only R2 staging

```sh
# Offline plan: no credential lookup, requests, cache writes or uploads.
npm run media:sync-r2 -- --config wrangler.jsonc --env preview --account <explicit-account-id> --bucket <explicit-bucket> --uploads .emdash/backups/r2-stage-001/objects --manifest .emdash/backups/r2-stage-001/staging.json

# Separately authorized upload; R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in the environment.
npm run media:sync-r2 -- --config wrangler.jsonc --env preview --account <explicit-account-id> --bucket <explicit-bucket> --uploads .emdash/backups/r2-stage-001/objects --manifest .emdash/backups/r2-stage-001/staging.json --apply --journal .emdash/backups/r2-sync-001/journal.json
```

Missing/ambiguous config, environment, account, bucket or credentials fails closed (exit 2); no first-binding, environment-variable bucket or stored-login fallback. JSONC/TOML parsing and explicit identity follow the database runbook. The default global R2 S3 endpoint is the reviewed adapter scope; other jurisdictions need a reviewed endpoint adapter. No live D1/R2 target is configured or certified for this phase.

Recursive traversal retains nested/Unicode storage keys and rejects symlinks/traversal. The helper uses signed S3 HTTP requests with `aws4fetch`; there is no shell command or interpolated subprocess path. Cache/journal keys include account/environment/bucket, actual storage key, SHA-256, MIME and cache profile. A cache hit never replaces a fresh remote byte/hash and metadata read; ETag is not treated as SHA-256. Deleted objects are detected; bucket changes cannot reuse a previous bucket's evidence. With `--manifest`, every staged object's key/hash/MIME must match the CMS staging receipt; raw uploads without it use extension-derived MIME and are not proof of CMS registration.

Writes use atomic `If-None-Match: *`, then read back bytes and MIME/cache headers. Existing conflicting bytes/metadata cause failure; there is no force overwrite. A concurrent matching creation can be verified after 412. Three bounded retries cover selected transient HTTP responses; redirects are refused and secrets never enter reports. Any required failure exits **1**, retains verified progress and can be retried without duplicate writes. Empty apply input is unverified, not a successful remote check. Journals remain ignored/private. No browser CI, production-build dependency, deployment or remote deletion is introduced.

```sh
npm run test:database
npm run test:media-infrastructure
node scripts/rehearse-infrastructure.mjs --out audit/phase-5-2026-10-16/new-rehearsal
```

The runtime rehearsal is local-only and refuses CI. All Cloudflare transports are simulated; only a newly created loopback CMS is contacted. Run the full unit suite, typecheck and normal build before rollout. Real Worker/D1/R2 quotas, endpoint access, custom storage and post-build hosted media optimization still need separately authorized cloud acceptance.

Sources: [Astro images](https://docs.astro.build/en/guides/images/), [Cloudflare adapter images](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#imageservice), [Cloudflare Images binding](https://developers.cloudflare.com/images/optimization/binding/), [EmDash media CLI](https://docs.emdashcms.com/reference/cli/#emdash-media), [R2 S3 conditional operations](https://developers.cloudflare.com/r2/api/s3/api/), [aws4fetch](https://github.com/mhart/aws4fetch).
