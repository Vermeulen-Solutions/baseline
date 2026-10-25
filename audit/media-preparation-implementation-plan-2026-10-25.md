# General image preparation for initial builds and day-2 maintenance

Status: proposed implementation plan, 25 October 2026. This document does not
implement the commands below or change any Media Library records.

## Intended behavior

When an agent is asked to add or upload images, it inspects the supplied files,
prepares sensible stored copies locally with Sharp, and uses those prepared
copies for the selected destination. This is the normal workflow for greenfield
sites and ongoing maintenance, including sites whose WordPress migration has
already finished. No WordPress export, attachment ID or migration metadata is
required.

For EmDash, the prepared copy becomes the Media Library's stored image. Full-size
client originals stay in the source handoff or an ignored local archive. Astro
and EmDash continue generating responsive delivery versions from the stored
image. Preparing the stored image and generating delivery versions solve
different size problems.

For static and static-sveltia sites, use the same preparation tool before adding
the selected files to `src/assets/`. This also avoids committing unnecessarily
large client originals to Git.

This phase covers agent-assisted file handling. A client dragging files directly
into EmDash admin or Sveltia will not invoke a local Node command. Automatic
optimization for those browser uploads would require a separate CMS/editor
integration. Existing Media Library objects are not swept or rewritten by this
change; replacements follow an explicitly requested content operation.

## Proposed defaults

These are initial implementation defaults, subject to representative image
review. Per-task flags and established site decisions can override them without
adding another mandatory approval checkpoint.

| Input or requirement | Preparation policy |
| --- | --- |
| Clearly photographic JPEG/PNG/WebP/AVIF | Fit inside 2400 × 2400 pixels, preserving aspect ratio with no enlargement; create WebP at quality 85 when preparation is needed |
| Existing image already within the dimension and byte policy | Retain its bytes when recompression offers no worthwhile benefit; avoid repeatedly applying lossy encoding |
| Logos, screenshots, illustrations and transparency-sensitive artwork | Select an explicit lossless/preserve policy after inspection; preserve alpha and text/edge detail rather than treating every PNG as a photograph |
| SVG, animated images, PDF/video, unsupported inputs | Preserve or flag for review according to type; do not rasterize, flatten animation or upload an unprocessed large file under the photographic default |
| Orientation, color and metadata | Apply EXIF orientation to transformed pixels, convert transformed images to sRGB, remove unneeded embedded metadata, retain required credits/provenance in the preparation record |
| Stored image size | Use 1 MiB as an initial review threshold for normal photographs; report exceptions rather than claiming every image can meet a fixed byte limit at acceptable quality |

The agent selects a photographic or artwork policy from the actual material;
filename extension alone does not establish image purpose. A high-resolution
download, zoomable artwork or other deliberate original can use a documented
preservation exception. The policy is a useful stored master, not the smallest
possible file or a replacement for responsive image delivery.

Files that remain above the policy threshold need an explicit recorded decision:
an adjusted size/quality suitable for the use, or a justified exception. The
default upload sequence must not silently fall back to the oversized source.

## 1. Add a portable local preparation command

Add a proposed `npm run media:prepare` command accepting one file or an explicitly
selected directory. A normal example would be:

```sh
# Proposed interface, not available yet.
npm run media:prepare -- --source ../client-images --out .emdash/backups/media-prepared-001 --preset photo

# Static profiles use their existing ignored backup location.
npm run media:prepare -- --source ../client-images --out .baseline/backups/media-prepared-001 --preset photo
```

Use a small coordinator and bounded Sharp worker, for example
`scripts/prepare-images.mjs` and `scripts/prepare-image.mjs`. Support photo,
lossless-artwork and preserve presets, plus explicit maximum edge/quality
overrides. The interface should handle mixed batches through explicit per-file
selection/overrides without forcing every file through the same lossy preset.
Inspect the final option design during implementation and document only shipped
flags.

- Keep inputs untouched; require a new output stage outside the selected source.
- Place source archives separately from a clearly identified upload directory.
  Only prepared output paths are eligible for upload.
- Write a versioned manifest containing relative source/output paths, hashes,
  dimensions, MIME type, byte counts, policy, treatment and any exception/review
  reason. Keep source names and provenance available without inventing alt text.
- Use content hashes plus policy identity for safe repeated preparation; refuse
  changed source/policy on resume. Never treat previously generated lossy output
  as a fresh original by default.
- Retain the current bounded-decoding approach: separate process, timeout,
  pixel/frame/input/output limits and bounded parallelism. Reject malformed,
  excessive or unsupported files with actionable per-file results.
- Compare source/candidate size where appropriate and decode prepared files to
  verify the reported format, dimensions, orientation and animation policy.
- Keep this command local: it creates no CMS records and requires no CMS auth.

Sharp is already a declared dependency in every profile, so no ImageMagick
installation, new image library or separate token/configuration framework is
needed. Reuse established decoding constraints from `scripts/media-probe.mjs`
where practical, but do not copy the migration command's import chain into
static projects. `infrastructure-io.mjs` currently also imports root-only
JSONC/TOML and audit helpers. Extract only small portable helpers if that reduces
duplication; retain migration behavior and its existing interfaces.

## 2. Make preparation part of the agent's normal upload sequence

Document one sequence for new sites and maintenance:

1. Resolve the installed profile and requested destination. Inspect supplied
   images, intended use and any existing site image policy.
2. Prepare the selected files with the appropriate presets. Inspect representative
   results, including text/transparency and high-detail photographs, and resolve
   any per-file findings within the task's existing authorization.
3. For EmDash, identify the selected instance with a supported read command, then
   upload only prepared files through the installed EmDash CLI or supported
   media API. Use the actual prepared MIME type/extension and accurate supplied
   or inspected metadata. Preparation itself does not need fabricated captions
   or WordPress attachment identities.
4. Save an operation receipt mapping source/output hashes to the destination and
   returned media IDs/storage keys. Read the media item and stored bytes back
   where permitted; verify MIME, byte size, dimensions and requested metadata.
5. For static profiles, add only selected prepared files to `src/assets/` and
   use native Astro images. Update content references only when requested;
   EmDash changes use the supported API and fresh revision information.
6. Report uploaded/copied files, total source/prepared bytes, savings and any
   justified exceptions or unresolved files.

The installed EmDash 1.3.0 CLI was checked during planning and supports local
file upload with `--url`, `--alt`, `--caption` and JSON output. Preserve its
supported authentication and proxy-header behavior. Verify target identity and
capabilities during implementation rather than inferring a production instance
from the existence of a local development server.

Handle deduplication explicitly: an existing item may be returned without
applying the incoming alt/caption. Verify the returned metadata and preserve
different editorial identities. Do not silently overwrite an existing record.
If the CLI cannot express required behavior, use the documented media API for
that narrow case after checking the installed version.

For a batch, use a destination-bound receipt to skip verified completed uploads.
An interrupted POST may already have created an item; reconcile it before
retrying rather than automatically creating duplicate records. Start with the
existing supported CLI/API and a small receipt mechanism; do not introduce a
second general CMS uploader unless implementation demonstrates a need.

## 3. Update instructions and ship the shared tool

| Surface | Planned change |
| --- | --- |
| Root `AGENTS.md` and `docs/site-working-rules.md` | Require preparation of new image uploads during initial creation and day-2 maintenance; link the normal workflow |
| `profiles/static/project/AGENTS.md` | Apply the same preparation policy before adding file-owned assets; retain static content/runtime boundaries |
| New `docs/media-preparation.md` | Shared usage, presets, examples, exceptions, manifest and resume behavior |
| `docs/image-delivery.md`, `docs/editor-handoff.md`, `docs/commands.md` | Explain stored-image preparation versus responsive delivery; expose the general command independently of WordPress migration |
| Maintained `new-site-workflow` skill and its `references/site-maintenance.md` | Include the same process for first content population and regular image additions |
| Maintained `astro-site-design` skill | Route incoming imagery through preparation before integration/rendered acceptance |
| `package.json`, `profiles/manifests/shared.json`, inventories | Add the command, portable scripts/docs and applicable regression coverage to every profile; reuse existing Sharp dependency |
| `scripts/inspect-project.mjs` | Make the new installed command and workflow reference discoverable |

Keep upstream EmDash skill mirrors unchanged. Leave `media:migrate-wp` available
for its attachment/relationship/import responsibilities. Normal uploads must
not depend on that command or use WordPress-specific proposed storage keys.
Shared documentation must work with only generated installed files.

## 4. Verify the behavior and distribution

Use synthetic fixtures and an owned disposable EmDash instance; no client images
or production records are required for acceptance.

- Prepare a roughly 5 MiB 4K photographic PNG: show reduced stored bytes, correct
  output MIME/extension, an at-most-2400-pixel longest edge and acceptable rendered
  detail. Check portrait and landscape cases so a width-only cap cannot miss
  oversized tall images.
- Cover EXIF rotation, transparency, crisp artwork, already-small/optimized
  images, animation, corrupt files, oversized inputs and output-larger-than-input
  cases. Confirm no enlargement, original mutation or silent animation loss.
- Verify source/output hash checks, policy changes on resume, linked paths,
  source/output overlap and interrupted preparation. Test preservation/refusal
  behavior, not merely the implementation's option strings.
- Exercise the complete agent-requested path on a greenfield local EmDash
  instance and then on the same instance as a maintenance task. Verify stored
  bytes are the prepared file, IDs/metadata are correct and unrelated records
  remain unchanged. Rehearse deduplicated results and interrupted-upload recovery.
- Confirm prepared images still work in responsive components, galleries and
  original-download paths. Inspect representative images at rendered sizes.
- Independently generate/install both static profiles; run the shared preparation
  command and integrate its output using native assets. Verify their lockfiles
  contain no CMS packages or newly required root-only parser/audit dependencies.
- Classify meaningful new tests in `tests/test-tiers.json`; update file inventories
  and generated-profile checks. Run doctor, `verify:fast`, full `verify`, build,
  fresh HTML audit and independent `test:profiles` as applicable. Browser work
  remains local and separate from automated CI/builds.

Keep new media work separate from the existing uncommitted DESIGN.md dependency
retirement. Its saved verification describes the earlier source bytes and must
not be presented as evidence for this future implementation.

## 5. Existing-site adoption and completion

Add explicit adoption instructions in `docs/baseline-updates.md`. Existing sites
need the new command/scripts/docs and maintained workflow guidance from a chosen
revision. Bounded sync does not automatically add new managed files or npm
commands. Review the site's installed Sharp version and regenerate its own
lockfile only if dependency changes are actually needed; preserve client tokens,
content, source archives and original generation provenance.

Completion means that an agent given "upload these images" can follow the same
documented process on a greenfield or maintained site, upload prepared copies,
verify what was stored and explain any exceptions. No knowledge of a prior
WordPress migration should be needed.

## Planning evidence

Inspected local `scripts/media-probe.mjs`, `scripts/media-migrate-wp.mjs`,
`scripts/media-ingest.mjs`, profile manifests, generated instructions and
maintenance references. Checked the installed CLI using read-only `media upload
--help` and `media get --help`.

- [EmDash CLI media reference](https://docs.emdashcms.com/reference/cli/#emdash-media)
- [EmDash REST media reference](https://docs.emdashcms.com/reference/rest-api/#media-endpoints)
- [Sharp output options](https://sharp.pixelplumbing.com/api-output/)

Live docs can describe capabilities newer than the installed version; confirm
each upload, metadata and deduplication behavior against the pinned package while
implementing. No implementation tests or uploads were run to prepare this plan.
