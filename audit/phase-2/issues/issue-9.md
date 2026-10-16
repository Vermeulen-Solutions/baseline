# Resumable WordPress media preparation, supported EmDash ingestion and explicit R2 staging

## Outcome and review decision
Build a manifest-driven pipeline around the native WordPress importer/media API and storage-backed native Astro image delivery. Preserve canonical original bytes and editorial identity; do not directly insert media rows or generate a second production rendition system.

The existing organize-media.mjs and sync-r2-media.mjs are implementation inputs, not trusted infrastructure contracts. The former creates/updates assumed internal tables and has a raw file-copy backup; the latter scans only top-level files, caches by filename/mtime/size without bucket identity, uses shell-interpolated paths, and does not set a failure exit code for failed uploads. Audit/harden or replace these behaviors before orchestration.

## Pipeline and command boundaries
Proposed npm run media:migrate-wp accepts an explicit uploads path plus WXR/exporter attachment metadata when available. Default is read-only inventory/plan. Separate apply-local (explicit supported EmDash target), stage and upload operations; no default remote writes. CLI names/flags are finalized with the implementation and documented as capabilities.

1. Inventory → content-addressed manifest.
2. Reference-aware canonical/crop classification and optional preparation.
3. Supported local/disposable EmDash import/upload and reference mapping.
4. Storage staging using actual media storage keys.
5. Explicit target-specific R2 upload/verification receipt, or supported site transfer if that already carries the media.

## Identity/reference contract
Manifest records source origin/site ID, attachment ID, relative path/original URL and aliases, source checksum/size/MIME/native dimensions, WordPress original/scaled/crop relationships, usage, locale, alt/caption/credit/provenance, selected operation and reason, output checksum/profile, destination media ID/storage key, stage/error and verification receipt.

Use WordPress attachment metadata and actual usage to classify renditions. A filename matching -300x200 or -scaled is insufficient evidence to delete it: it may be the only surviving file, a referenced intentional crop, or a legitimate original filename. Missing metadata yields retain/unknown. Preserve originals in immutable external/ignored archival storage; never delete the source directory. Keep crop semantics, redirect/alias mappings and missing-original findings explicit.

Hash deduplication may share identical bytes, but must not collapse distinct locale metadata, captions, gallery occurrences/order or editorial identities without a supported mapping decision. Names are collision-safe and deterministic from verified source context/hash; do not invent descriptive names or alt text from an opaque camera filename. Preserve intentionally empty decorative alt.

## Optimization and delivery contract
Use installed pinned Sharp only in a controlled local/offline preparation stage. Probe/decode with file-size/pixel/time/concurrency bounds and report corrupt/unsupported inputs. Normalize EXIF orientation and profile/color behavior before stripping metadata from any prepared copy; preserve credits/licensing separately. Do not upscale.

No unconditional 2560px cap, AVIF conversion or repeated lossy re-encoding. Opt-in profiles may prepare an oversized-source copy when required, preserving the archived original and an exact source/output map. Keep SVG logos as vetted vectors, animated images with their frames, and PDFs/video/documents as appropriate passthrough/quarantine cases.

Serve responsive variants through existing ResponsiveImage/EditorialImage/PhotoGallery and Astro's configured native image service. Node and Workers have different runtime services; test R2-backed endpoint access, native dimensions, captions and uploads after deployment without a rebuild. Generated files in public/ or an R2 object alone are not CMS media registration.

## Ingestion and storage contract
Use the supported WordPress importer first where it meets the mapping. If prepared local bytes require an additional media upload/mapping adapter, prove the installed API/CLI contract in a disposable spike. Preserve returned canonical media shape/IDs and update references through supported content APIs/revision controls. Never create media/media_folders tables, infer columns from filenames or rewrite arbitrary JSON/Portable Text with regex. An unsupported API gap is a documented blocker/spike, not permission for direct SQL hydration.

Filesystem/R2 and DB writes cannot be one transaction. Use a durable stage journal with checksums, resumable operations, partial-failure receipts and a bounded compensation plan. Reruns reuse verified work; do not delete pre-existing/shared objects on rollback.

R2 staging uses actual storage_key and correct MIME/cache metadata, including nested keys; display names are not keys. Resolve explicit account/environment/bucket and record that identity. Scope caches by target+key+content hash+profile, revalidate remote objects, handle stale cache/deleted objects, collision/no-overwrite policy and bounded retries/concurrency. R2 ETag is not assumed equal to a content SHA-256. Use argument-array subprocess/API calls, never shell-interpolated filenames. Any failed required upload yields a nonzero exit.

## Acceptance criteria
- [ ] Read-only inventory changes no source bytes, DB or remote storage and produces deterministic decisions for a fixed input.
- [ ] Synthetic/permission-cleared fixtures cover referenced crops, scaled-only originals, duplicate bytes with differing metadata, localized captions/order, Unicode/nested/colliding filenames, EXIF orientation, small images, animation, SVG/PDF and corrupt/oversized inputs.
- [ ] No canonical source is discarded by filename heuristic, mandatory resizing or repeated encoding.
- [ ] Supported ingestion produces real Media Library entries and rewrites scoped references correctly; gallery selection/order/captions survive save/reload and public rendering.
- [ ] Interrupt/retry and repeated apply do not duplicate records/objects; failure receipts and rollback leave pre-existing assets intact.
- [ ] Nested-key/bucket-switch/deleted-remote-object/partial-upload tests catch the current sync helper's blind spots; required failures exit nonzero.
- [ ] Disposable R2/Worker integration verifies storage-backed fetch and newly uploaded media without a rebuild; ordinary CI uses local fixtures.
- [ ] Update image-delivery docs and the maintained migration/setup skills; never patch upstream mirrors for local policy or commit private client exports.

## Dependencies
#3 establishes installed API/runtime support; #8 supplies explicit target/snapshot conventions before remote integration. Inventory/provenance fixtures can start earlier. #7 supplies rendered verification. #2 consumes reports; it must not invoke migration as an audit test.

## Sources
[WordPress import contract](https://docs.emdashcms.com/migration/content-import/) · [site transfer](https://docs.emdashcms.com/guides/site-transfer/) · repository docs/image-delivery.md and supported native media APIs.

## Implementation progress — Phase 2 (2026-10-15)

Native Astro/EmDash image delivery passed on the candidate Node runtime, including storage media added after build and native-width/remote-source checks. This is prerequisite evidence only. WordPress ingestion/optimization manifests, supported CMS mapping and target-aware R2 staging remain outstanding; no remote media upload occurred.

Local implementation/evidence: audit/phase-2/README.md, runtime receipts, tests and standards/manifest.json. Changes are uncommitted; no production deployment or stable release is implied.
