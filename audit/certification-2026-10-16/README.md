# Phase 3 standards certification — 16 October 2026

Standards **0.1.1** certifies the stated **Node + SQLite/local storage + pinned Windows Chromium** profile. The standards reference is `standards-v0.1.1`; `release-publication.json` and `downstream-selection.json` record the actual published reference, commit and manifest digest. Public/community packaging remains Issue #11. No client rollout, production deployment, visibility change or community message is part of this certification.

## Milestones and clean rehearsal

- `6c1c412`: preceding roadmap/styleguide/LogoTicker/local visual milestone and reviewed prerequisites.
- `ac92dac`: Issue #6 G/O/P HUD, tests and dated receipts committed; unrelated editorial skills/docs excluded.
- `6424ab5`: maintainer-selected Node policy: **22.22.2 minimum**, **Node 24 LTS recommended**, **one CI job on 22.23.3**. The exact engine range follows EmDash's locked registry-verification requirement. A compatibility floor is not a recommendation to retain old security patches.
- `31c72ec`: fresh-checkout probe repairs: create the missing empty `public/` directory in the image test and retrieve small immutable Git refs rather than oversized commit diffs. Valid/malformed-ref unit cases pass.

Two local clones were created from committed Git state, with no working database/media/environment/credentials copied. Fresh `npm ci --engine-strict` on Node 22.22.2 succeeded without engine warnings. All source inputs used in the browser suites match the certified `src` tree, Astro config, dev-tools integration and dependency graph; only root Node-engine metadata changed after the first browser run. `verification.json` records this Git/hash proof. The helper fixes were subsequently tested in the clean clones. Generated CMS data/media stayed inside the isolated clone; temporary browser fixtures report complete cleanup. A CRLF-only generated type-file stat change has no semantic diff.

The isolated clones and their synthetic data are retained under ignored `.emdash/checks/` for reproducibility; owned servers/browser processes were stopped. No database, environment key or media-upload directory is included in the certification commit or release assets.

## Verification receipts

| Check | Evidence/result |
| --- | --- |
| Node 22.22.2 fresh install | `npm-ci-minimum.log`: engine-strict success; no EBADENGINE |
| Unit/schema/design/syntax/build/release, Node 22.22.2 | 35 unit tests; all command steps pass; 23.667s command rehearsal |
| Unit/schema/design/syntax/build/release, Node 22.23.3 | 35 unit tests; all command steps pass; 21.593s final command rehearsal |
| Unit/schema/design/syntax/build/release, Node 24.21.0 | 35 unit tests; all command steps pass; 31.265s command rehearsal |
| Astro typecheck | 41 files; zero errors/warnings/hints on minimum and Node 24 profiles |
| Windows visual suite | 51 passed, 18 intentional suite-mode skips; zero failures/flaky cases; 51 unchanged baseline hashes |
| Windows HUD suite | 15 passed; zero skips/failures/flaky cases; 390/768/1440 and 320px resize |
| Windows sensitivity suite | 10 passed, 14 intentional duplicate-viewport skips; global/small defects caught; clean reverts pass; missing baseline/route/setup/image/font fail correctly |
| Fresh CMS editor/content | Registered seed fields; canonical table/gallery publish/public render; actual inline edit/blur-save/reload/publish; built Node content preserved |
| Actual physical schema | Pages 17 / Posts 19 columns; below 50-column local budget; no remote D1 inference |
| Native images | Dev/built Node responsive dimensions/formats/native limits, unauthorized origin rejected, new storage-backed media works after build |
| Production isolation, minimum Node | Healthy public content; normal styleguide GET/HEAD/query variants 404; G/O/P absent from emitted client JS/CSS; fixture output separate and release-rejected |

Command timings exclude clone/setup/npm ci/network/queue time and are not observed GitHub/Linux execution times. The existing large admin bundle advisory and deprecated transitive packages remain visible. No browser Actions job, matrix, git hook or production/deployment screenshot dependency was added. Native screenshots `cms-public.png` and `cms-editor.png` were visually reviewed; they show the disposable dev public/editor surfaces, not a production HUD leak.

`audit:baseline` and `check:upstream` were run with npm; their logs and parsed JSON are retained. [Version decisions](version-decisions.md) cover current stable/patch availability, independent Astro/adapter triggers, Node policy, deferred React/Sharp changes and revisit conditions. The initial upstream ENOBUFS and image-test empty-directory failures were tooling defects; they were repaired and rerun. Early receipt-driver setup/API fixture mistakes were corrected before the final fresh-DB CMS run. The driver uses supported CSRF headers and the media API's returned storage URL; a bare media ID is not a filename.

## Honest certification limits

EmDash 1.3.0 regenerates the gallery block's outer `_key` during the exercised inline conversion. Asset IDs, image keys, dimensions, columns, captions and order remain exact; table content remains exact. External systems must not assume outer gallery-key stability. The table and gallery appear as read-only inline placeholders; full admin block editing is a separate scope. Marker observation is never treated as registration/saveability proof.

The starter does not enable i18n or route caching, so translated routes/menus/translation groups and complete shared-query cache hints are **not applicable to this profile**, not implicitly certified. Opting into them requires their matrix. Live forms providers/Turnstile/email, Worker delivery, D1 parity/R2 ingestion, Firefox/WebKit and broad accessibility conformance remain **unverified**. Phase 5 owns remote infrastructure proof.

Existing Phase 2 title/rich-text, 1.1→1.3 upgrade, old-lock/database restore and opt-in forms receipts are reused only within their recorded limits. This certification changes no CMS migration/storage target; current clean setup, inline/public content and post-build images were rerun. No production backup/restore or live provider delivery is newly claimed. [Release/upgrade/recovery notes](../../standards/releases/0.1.1.md) explain matching package/database/media/key restoration.

The EmDash skill update was staged in the clean clone at immutable source `c95804553d01deba84f2dfc0015e5a63cb4b90a2`; its inventory and reviewed building-skill diff are retained. Locale-ID and Cloudflare coalescing guidance are noted, but the refresh was not applied over the checked-in snapshot or dirty local work. The four pre-existing skill edits remain byte-for-byte unchanged. The release excludes those edits, the pre-existing AGENTS editorial section and unrelated untracked editorial/#11 draft files. Upstream skill currency is a separate pending review; current runtime certification does not claim all skills are synchronized.

## Next work

Post-publication observation: the original 0.1.0 **branch** CI passed on GitHub/Linux (job approximately 56 seconds including setup/install). Tag creation then started a duplicate workflow with an all-zero previous SHA; its empty-tree art-direction comparison failed. The **0.1.1** patch excludes tag pushes while retaining PR/branch checks. Both original outcomes are preserved in `ci-branch-0.1.0.json` / `ci-tag-0.1.0.json`; the immutable original release/selection are retained under versioned filenames. Runtime/browser/dependency inputs are unchanged. Current publication/selection receipts refer to 0.1.1 after its readback.

Final readback: **0.1.1 is published, immutable and targets `28ccf82b3047eb615cd57ca55141751e0d29af11`**. Its GitHub/Linux branch job passed in **50 seconds including setup/install** (`ci-branch-0.1.1.json`); tag publication produced no duplicate job in the observed readback. Actions reports advisory checkout/setup action-runtime deprecation and an upcoming ubuntu-latest image change; review those during #11 packaging, independently of the selected site Node version. The downstream rehearsal pins the full commit and manifest digest, accepts Node/SQLite and rejects Cloudflare. Issue #3 is updated/read back and **closed as completed**; #6's commit/publication status is updated. The repository remains private. These post-publication receipts are recorded in a follow-up commit because an immutable release cannot contain its own later readback.

**Phase 4 / #2** can consume the immutable standards manifest as a read-only diagnostic baseline. Implement evidence/applicability/pass/fail/warning/unverified reporting, offline fixtures and a deterministic reversible recipe before an authorized client pilot. Missing DB/cloud evidence must remain unverified; diagnosis must not sync/migrate/upload. No client repository is selected or modified here.

**#11** can begin public packaging against this tested baseline: secrets and full-history audit, generic seed/registry verification, licensing/provenance, truthful feature matrix, contribution/conduct docs and reviewed showcase assets. Cloudflare/D1 parity must remain labelled planned until Phase 5. Visibility, public release and community distribution remain separate explicit actions after that work; no unlimited-CI or complete cloud-certification claim follows from this standards release.
