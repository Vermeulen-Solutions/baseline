# General media preparation — 25 October 2026

Implemented the approved [plan](../media-preparation-implementation-plan-2026-10-25.md)
for greenfield builds and day-2 maintenance. The shared `media:prepare` command
creates suitable stored image copies with Sharp before Media Library upload or
static asset integration. EmDash additionally has `media:upload`, which uses the
installed CLI and verifies returned media metadata and stored bytes.

Photo defaults are a 2400-pixel longest edge, WebP quality 85 and a 1 MiB review
threshold. Already-compliant sources retain their bytes when suitable; EXIF
orientation is normalized when needed. Lossless artwork and reviewed preservation
presets cover other image uses. Originals remain in source/ignored archives;
only eligible prepared files enter `upload/`. Unresolved/unsupported files do
not silently fall back into the upload batch. No new dependency was added.

Creation and maintenance instructions, command discovery, distribution manifests
and inventories are updated. Both generated static profiles include the portable
preparation tool; the CMS uploader stays EmDash-only. Existing-site adoption is
documented in [Baseline updates](../../docs/baseline-updates.md#general-image-preparation-adoption).
The usage guide is [media preparation](../../docs/media-preparation.md).

## Executed verification

Windows, Node 24.21.0, npm 10.5.0, Sharp 0.35.5. Verification used the recorded
base commit plus working-tree animation fixes. `verification.json` records that
base commit and LF-normalized source hashes for the checked implementation;
the snapshot predates the follow-up commit. The earlier retirement's original
historical receipts remain unchanged.

| Check | Result |
| --- | --- |
| Doctor | Passed, with Windows launcher and dirty-tree reminders |
| Fast verification | Passed, 182 unit tests; accepted full verification repeats these gates |
| Accepted full verification | 328 tests passed: 182 unit and 146 rehearsal; 53 Astro files with zero diagnostics |
| Fresh production build | Passed; existing admin chunk-size warning remains |
| HTML integrity against that build | Passed, 9 HTML files and 10 captured public SSR responses |
| Independent static and static-sveltia installs | Install/clean-install, standalone `media:prepare`, verification, production/fixture builds and HTTP checks all passed; CMS uploader omitted; temporary generated projects removed |
| Actual local EmDash rehearsal | Greenfield upload, repeat verification, real server deduplication mismatch, native responsive rendering and subsequent maintenance upload passed on an owned fresh site |
| Source preservation and output quality | Source hashes retained; synthetic source/output previews inspected; decoded synthetic photographic error bounded; lossless alpha/artwork preserved |
| Diff integrity | `git diff --check` passed |

The actual 3840 × 2160 synthetic photographic PNG was **19,827,263 bytes**. Its
prepared 2400 × 1350 WebP was **484,264 bytes**, a **97.56% reduction**. Readback
matched the prepared SHA-256, and the native image component served a 480-pixel
WebP candidate. The fresh library went from zero items to one after initial
upload and two after the maintenance addition. Repeating the first operation
created no additional record. Reusing identical bytes with different editorial
metadata required reconciliation and left the original metadata unchanged.

`runtime-verification.json` records this local rehearsal. `verification.json`
also records source hashes, presets, resource limits, profile results and scope.
Detailed command logs and synthetic previews remain under ignored
`.emdash/checks/`.

## Resolved failures and boundaries

- The initial focused fixture cleanup hit a Windows file lock. Fixture Sharp
  file caching was disabled and bounded cleanup retries added. One initial
  fixture directory remains for manual cleanup; its exact path is in the ignored
  `.emdash/checks/media-preparation-cleanup.json` note. Accepted fixture, CMS and
  generated-profile cleanup succeeded.
- An initial AVIF comparison fixture was too small to exercise the byte threshold;
  the fixture was adjusted to exercise an actual larger conversion candidate.
- An early runtime GET reset after synchronous CLI children. CLI invocations and
  rehearsal children now run asynchronously; accepted runtime rehearsals passed.
- Final review found that libvips reports APNG as one frame. PNG animation
  controls are now checked explicitly, require reviewed preservation for multiple
  frames and retain original bytes. GIF and APNG preservation regressions pass.
  Full verification, build, HTML audit and both profiles were rerun after that
  fix. Checks before the fix were superseded.

This is agent-assisted preparation/upload, not automatic processing inside
EmDash admin or Sveltia's browser UI. No production data or working database was
copied or mutated. Remote proxy/provider behavior and client-specific visual or
editor acceptance were not certified. Protected stored-byte readback may require
`EMDASH_HEADERS`, as documented in the usage guide. Existing media/content is not
swept or replaced automatically. Preserved animations need original delivery or
`optimize={false}` and actual playback review when integrated.
