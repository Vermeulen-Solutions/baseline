# Preparing images for new sites and maintenance

When asked to add or upload images, prepare suitable stored copies before adding them to the site. This applies to greenfield builds and day-2 maintenance, including sites that were migrated previously. No WordPress export is needed.

`media:prepare` uses the installed Sharp library locally. Source files stay untouched. The stage contains an original archive, a manifest and a separate `upload/` directory containing only eligible images. For EmDash, these prepared files become the stored Media Library images. For static profiles, add selected prepared files to `src/assets/`. Native Astro/EmDash image processing then produces responsive delivery versions from those stored files.

## Normal agent workflow

1. Read the installed profile, intended image use and any existing site policy. Inspect the images; a PNG extension does not tell you whether it is a photo, screenshot or logo.
2. Prepare the selected file/directory with the appropriate preset and any per-file overrides. Inspect the manifest and representative output images.
3. Resolve review/rejected results with suitable exports, adjusted options or a justified preservation/size exception. Record the reason; routine preparation and image review need no separate approval checkpoint when already authorized.
4. Upload only eligible prepared files to the selected EmDash instance, or copy them to `src/assets/` for a static site. Use accurate alt/caption information and preserve source credits/provenance.
5. Verify stored bytes/metadata and the image at its rendered size. Report the source/prepared byte totals, uploaded media IDs or asset paths and exceptions.

This is the agent-assisted workflow. Direct browser uploads in EmDash admin or Sveltia do not run the local preparation command. Existing library objects and content references are not automatically rewritten. A request to replace an image must identify the intended record/field and use the supported revision and content workflow.

## Prepare a file or directory

Use `npm.cmd` in Windows PowerShell; use `npm` on Unix. Output must be a new stage under the installed profile's existing ignored backup directory:

```sh
# EmDash: all files in this selected folder.
npm run media:prepare -- --source ../client-images --out .emdash/backups/images-001

# A single image.
npm run media:prepare -- --source ../client-images/hero.png --out .emdash/backups/hero-001

# static / static-sveltia: same processing, profile-specific ignored staging.
npm run media:prepare -- --source ../client-images --out .baseline/backups/images-001
```

Keep handoff originals outside Git or in the ignored archive. Inspect the generated `manifest.json`, then use its per-entry output paths rather than guessing transformed filenames or uploading the archive. Original download links and zoom viewers will use the prepared stored image; preserve a higher-resolution master deliberately when that use requires it.

## Presets and exceptions

| Option | Default and behavior |
| --- | --- |
| `--preset photo` | Default. When needed, fit inside 2400 × 2400 without enlargement and encode WebP at quality 85 |
| `--preset artwork` | Preserve detail/alpha using lossless WebP encoding when preparation is needed; the same edge limit applies. Resizing changes pixels even when the encoding is lossless |
| `--preset preserve` | Keep the reviewed original's bytes, format and animation; requires `--reason` |
| `--max-edge <pixels>` | Longest-edge limit; integer 64–10000, default 2400. Both portrait and landscape are bounded |
| `--quality <1–100>` | Photo WebP quality, default 85; not a lossless-artwork quality setting |
| `--max-bytes <bytes>` | Review threshold, default 1048576 (1 MiB). It is not a promise that every image can meet that size at acceptable quality |
| `--reason <text>` | Record a deliberate preservation or byte-size exception after inspecting the result |
| `--overrides <file.json>` | Policy overrides keyed by exact source-relative file path; unknown paths/fields fail |
| `--resume` | Verify and resume the identical source selection and policy in the existing stage |

Photographic JPEG/PNG/WebP/AVIF and supported single-frame raster inputs can use the photo preset. Already-compliant files retain their bytes; repeated lossy encoding is avoided. A candidate that is larger than a dimension-compliant source is discarded in favor of the smaller source. A source outside the byte policy still needs a reason or further preparation; it does not silently become an upload candidate.

Transformed files are oriented using EXIF, converted to sRGB and written without unneeded embedded metadata. Preserve required credit/licensing/provenance in the editorial operation record. Artwork needs visual inspection, particularly text, fine lines and transparency. The tool cannot infer image purpose from its extension.

High-bit-depth artwork requires a reviewed preservation decision because WebP lossless encodes 8-bit pixels; lossless compression alone cannot retain a 16-bit source's full precision.

SVG and animation/multiple-page images require an explicit reviewed `preserve` preset. This is a passthrough decision, not SVG sanitization. PDF, video, HEIC and unsupported/corrupt inputs are rejected; provide a suitable source export or use the site's separate document/video workflow.

PNG animation controls are checked explicitly because Sharp can report APNG as a single-frame PNG. Preserved animations keep their source bytes; integrate them with the native image component's `optimize={false}` option and verify playback.

For mixed batches, prepare an override file such as:

```json
{
  "brand/logo.svg": {
    "preset": "preserve",
    "reason": "Reviewed official brand vector; its original paths are required"
  },
  "screenshots/editor.png": { "preset": "artwork" },
  "photos/zoom-detail.jpg": {
    "preset": "preserve",
    "reason": "The visitor must be able to download and inspect the full detail"
  }
}
```

```sh
npm run media:prepare -- --source ../client-images --overrides ../image-policy.json --out .emdash/backups/images-002
```

## Manifest, review and resume

The versioned manifest records source/output hashes, dimensions, MIME type, sizes, policy, treatment and review reasons. It distinguishes:

- `ready`: verified output in `upload/`;
- `review`: an output in `review/` that still exceeds the byte threshold without a recorded exception;
- `rejected`: unsupported, corrupt, excessive or failed input with a reason;
- `pending`: preparation was interrupted before this entry completed.

Exit 0 means every file is ready; exit 1 means the batch needs review; exit 2 means invalid arguments or an unsafe/changed stage prevented the operation. Preparation is sequential and bounded: 32 MiB per input/output, 1 GiB per batch, 1000 files, 40 million combined pixels, 100 frames and 20000 pixels per dimension. Each Sharp worker has a 15-second deadline, a 128 MiB JS heap, a 16 MiB Sharp cache and one processing thread. Pixel/frame limits also bound native decoding work; the JS heap flag does not bound all native memory.

Resume with the original source/options plus `--resume`. Source, policy, archive or output changes are refused. A rejected/review result is retained; fixing the source or changing its policy requires a new stage. If an interrupted encoder left a candidate in `pending/`, inspect that partial stage and use a new output directory. Never delete an active lock or overwrite unexplained partial output. The tool refuses preparation stages as fresh sources; return to the original handoff to change a lossy preparation policy.

## EmDash upload and readback

EmDash installations also provide `media:upload`. It uses the installed EmDash CLI, preserving token, stored-login and proxy-header support. Select the site's actual origin; there is no implicit production target or fixed local port.

Create editorial metadata keyed by the same source-relative paths:

```json
{
  "hero.png": {
    "alt": "People discussing a project around a workshop table",
    "caption": "",
    "credit": "Client-supplied photograph",
    "provenance": "Supplied for this website"
  }
}
```

Alt is required, including `""` for a deliberately decorative image. Caption is optional. Credit/provenance stay in the operation receipt; the command does not invent CMS fields for them.

```sh
npm run media:upload -- --stage .emdash/backups/hero-001 --url https://selected-site.example --metadata ../image-metadata.json
```

Resolve every preparation finding before uploading a batch. The command reads the chosen instance first, then uploads only the manifest's eligible paths. It reads back each returned media item and the actual storage-key URL, checks MIME, size, decoded dimensions/frames, requested metadata and byte hash, then records the verified media ID. Missing CMS dimension fields are reported by the stored image's decoded dimensions; contradictory fields fail. This does not alter or publish page/post content.

Byte readback uses a same-origin request with no redirects. For sites behind Access/proxy protection, supply necessary headers in `EMDASH_HEADERS` as supported by the CLI; stored CLI-only proxy headers are not automatically available to this separate readback request. Credentials are not written to the receipt.

`upload-<target-hash>.json` is bound to the target origin, preparation manifest and metadata. Repeat the same command to reverify existing items without another POST. A deduplicated item whose alt/caption differs is left for reconciliation; another editorial identity is not silently overwritten.

If an upload times out, its POST may already have created a record. The receipt records `needs-reconciliation`; automatic POST retry is blocked. Inspect the selected Media Library and supply a mapping of source path to verified media ID:

```json
{ "hero.png": "01KNOWNMEDIAID" }
```

```sh
npm run media:upload -- --stage .emdash/backups/hero-001 --url https://selected-site.example --metadata ../image-metadata.json --adopt ../reconciled-media.json
```

Adoption still verifies bytes and metadata. If duplicate bytes need different metadata, reconcile with the supported media API and an explicit distinct-item operation, then adopt that ID. Changed metadata or a different preparation requires a new reviewed operation. Upload exits 0 when verified, 1 when any item needs reconciliation, and 2 on preflight refusal.

## Static assets and existing installations

Static profiles have `media:prepare` and omit the CMS uploader. Copy selected `upload/` files into `src/assets/`, import them through native Astro components, and verify build/output at the intended sizes. Sveltia continues editing those Git-owned files; its browser upload behavior is unchanged by a local CLI.

New generated profiles include the preparation tools and this guide. Existing sites need explicit adoption of new scripts, commands and instructions; bounded sync does not add them automatically. See [Baseline updates](baseline-updates.md).
