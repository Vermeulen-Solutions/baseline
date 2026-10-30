# Editor-facing migration review and safe resumption

Use the captured source, candidate register and existing migration receipts. Do not start discovery or import again merely because a later acceptance item was missed. Native locale/groups, complete content inventory, file bytes and real editing/publication remain separate checks. The commands here are EmDash-only read-only diagnostics; they perform no API writes, uploads or normalization.

## Library organization and repeated links

Before uploading, agree descriptive filenames and useful folders, retain full-size originals privately and use eligible prepared copies. Include partner/sponsor URLs, club/contact destinations, downloads and other repeated records in the source mapping, even when they are not separate WordPress post types. A rendered logo is not proof of its link, and an upload receipt is not proof of an organized library.

Read native MediaItem/MediaFolder and ContentItem records after changes. `filename`, `folderId`, `alt` and `caption` belong to native media; partner-like links normally live in `item.data.url`. See the [official media library](https://docs.emdashcms.com/guides/media-library/). Library metadata does not rewrite per-use captions cached in entries; verify those uses separately. Do not infer rename support from an ignored API field. Before declaring an operation impossible, inspect supported installed APIs and established project patterns. A controlled version-specific metadata migration requires its own plan, preconditions, database/media recovery, rehearsal, rollback and native/public readback; the retired raw-SQL organizer is not an approved generic repair tool.

```sh
npm run migration:check-library -- --input .emdash/backups/library-review.json
```

The input has `reviewVersion: 1` and `media`, `folders`, `links` arrays of explicit `{expected, actual}` pairs. Each array permits up to 1000 unique expected IDs. `actual` is a native item, or null when unavailable. Media expectations require `id`, `filename`, `folderId`, `alt`, `caption`; a null folder requires a documented `organizationReason`. Folder expectations require `id`, `name`; every planned media folder must have a pair. Link expectations require `id`, `url`, compared with the native item's `data.url`. For example:

```json
{"reviewVersion":1,"media":[{"expected":{"id":"photo-1","filename":"team-training.webp","folderId":"training","alt":"Training session","caption":""},"actual":{"id":"photo-1","filename":"team-training.webp","folderId":"training","alt":"Training session","caption":"","key":"unchanged-storage-key"}}],"folders":[{"expected":{"id":"training","name":"Training"},"actual":{"id":"training","name":"Training"}}],"links":[{"expected":{"id":"supporter-1","url":"https://support.example.test/"},"actual":{"id":"supporter-1","data":{"url":"https://support.example.test/"}}}]}
```

The command prints counts only: exit 0 matches supplied expectations, 1 identifies mismatches/missing items, 2 means malformed/unverified input. JSON is limited to 4 MiB. It does not prove completeness, descriptive quality, fresh collection, bytes, effective public URLs or actual library usability. Inspect native folder browsing/search and sample photos/PDFs, then verify public supporter links and native image delivery. Keep pagination/completeness and byte/hash receipts with the existing migration inventory. Report preparation, stored-byte savings and responsive delivery separately; larger prepared totals are not compression savings.

## Imported editorial structure

Inspect a representative article, page and repeated entry in the native editor and real route. Preserved words alone do not establish meaningful headings, paragraphs, lists, credits, galleries or blank-block cleanup. Use the optional diagnostic on one native Portable Text field or captured HTML field:

```sh
npm run migration:check-editorial -- --input .emdash/backups/editorial-review.json
```

Input: `{"reviewVersion":1,"format":"portable-text","value":[...],"baseline":[...],"intentionalLineBreaks":false}`. HTML uses `format: "html"` and string values. `baseline` is optional; whitespace-normalized text comparison catches lost/changed wording. HTML is limited to 2 MiB, JSON to 4 MiB, native arrays to 5000 blocks/20000 spans and HTML traversal to 20000 nodes. Findings give block indices/codes without prose: empty blocks, repeated embedded breaks and a possible flattened bold heading. Explicit intentional poetry breaks suppress break heuristics, not lost-text comparison. Images and non-text blocks are preserved; the tool never invents headings or rewrites content. Exit 0 means no mechanical finding, 1 requires review, 2 means unsupported/unverified input.

Review each advisory in context. A deliberate normalization needs a before/after structural diff and text comparison, retained source/history, unchanged dates/bylines/credits/gallery order, then actual native typing/save/reload/publication and public readback. A clear mechanical scan is not semantic or editor acceptance. Static profiles use equivalent rendered Markdown review without adding EmDash tools or dependencies.

## One existing plan, separate phase receipts

Keep one operator plan in the project's established progress/evidence home. Link the source capture/digest, candidate register, native locale proof, routes/mappings, exclusions/conflicts, target runtime/origin and reviewed native import plan. Identify who owns native importer media versus supplemental prepared-media mapping; do not let both upload the same source by accident. Link immutable operation IDs and phase receipts rather than copying credentials or a second inventory into the plan.

| Phase | Before resuming after interruption |
| --- | --- |
| Capture and assessment | Reuse the bound capture; reconcile an actual source delta separately. Do not replace its recovery archive. |
| Native site import | Read the native operation status/receipt. Resume the existing operation using the matching package when supported; never reset a populated target to make a new import fit. |
| Static apply | Inspect `apply-started.json`/`apply-complete.json` and guarded original bytes; use the existing command's recovery rules. Do not blindly apply over reviewed edits. |
| Supplemental mapping/media | Read destination-bound receipts and current IDs/revisions first. Reconcile ambiguous writes before retrying. A missing completion receipt is unknown, not permission to duplicate uploads/records. |
| Review and promotion | Refresh native library/editor/public evidence and current repository/runtime/registry state. Retire superseded blockers in chat and the existing checkpoint. |

The existing [WordPress tooling](wordpress-migration.md), [content inventories](migration-content-inventories.md), [prepared-media upload](media-preparation.md) and native CLI transfer status/resume own these operations. This guide adds no transaction manager or automatic synchronization. Native save/publish semantics are installed-version-bound; verify the actual route/CLI lifecycle rather than relying solely on an OpenAPI description.
