# Scoped site maintenance

Use the sections relevant to the request. This reference maps changes across
site surfaces; the existing specialists own implementation. An isolated edit
does not need a new workflow track or a separate planning document.

## Establish the change and its owner

Read the installed profile, instructions, relevant source and current progress.
Use `baseline:inspect` when its source-derived paths help; its presence and output
are optional. Read the actual sources before treating them as current facts.
On EmDash, source and seed files do not establish the live schema or content.

Turn the request into an observable result and identify what must be preserved.
For example, “make Services 25% tighter” changes that region's gap while the
reference grid, copy and navigation stay unchanged. “Add an optional field”
keeps older entries valid and defines the public behavior when it is absent.
Resolve only consequential missing choices; continue useful independent work.

## Follow the affected surfaces

| Request | Inspect before changing | Evidence for completion |
| --- | --- | --- |
| Spacing or visual tokens | Target route, primitive controls, `global.css`, shell policy and the existing Art Direction Record | Requested geometry at several widths; unchanged reference composition, copy and navigation; applicable token diagnostics |
| Content field or type | Actual schema, existing entries, editor form, queries, detail/list templates and draft behavior | Valid/invalid values through the real loader or CMS; legacy entries still work; correct form/rendering and publication state |
| Shared component | Component, imports/consumers, wrapper defaults, slots, editorial boundaries and edit attributes | Representative consumers and styleguide states; retained accessibility, content ownership and compatible defaults |
| Public route | Route/content source, links, navigation owner, metadata and previous URL | Correct destination, discoverability, metadata and draft exclusion; 301 for a renamed or removed public URL |
| Add or upload images | Installed profile, selected destination, source files, intended use, image policy and `docs/media-preparation.md` when installed | Prepared stored copies; source archive outside the library/Git; accurate metadata and verified stored bytes or static asset paths |

Trace dependencies rather than changing every listed surface by default. State
why a surface is unaffected when that matters to understanding the result.

## Spacing and shared components

Use `astro-site-design` for implementation and the established visual gate and
bounded `impeccable` critique when applicable. Preserve the site's selected
direction and shell policy. `docs/design-framework.md` and
`docs/native-composition.md` describe the installed controls.

Choose a primitive prop for one instance, regional aliases for a composition,
root aliases for structural spacing across the site, and the base scale only
for a global recalibration. A local Grid can use
`gap="calc(var(--layout-grid-gap) * 0.75)"`; other grids then retain their gaps.
Keep layered CSS and avoid adding flow margins to an already gapped relationship.
Preview token CLI changes before writing. A new lane preset is a broad change,
not a convenient way to adjust one section.

For a shared component, search its consumers and inspect representative uses
before changing defaults. Preserve editorial rendering, forwarded attributes,
slots and live edit targets. Prefer an instance control when the request is
local; test a shared default across the consumers it actually changes.

## Content changes by profile

- **static:** pair the typed schema with the file content, queries and templates.
  Exercise the real Astro loader, not only a separate validator. Keep existing
  entries valid when a new field is optional; omit its display when absent if
  that is the requested behavior. Preserve static routing and draft filtering.
- **static-sveltia:** follow the static path and pair the browser form in
  `public/admin/config.yml` with the schema's name, type, requiredness, bounds
  and empty-value behavior. Verify actual accepted and rejected content values.
  Rendered output and form configuration checks leave authenticated
  upload/save/commit/rebuild acceptance pending until it is observed.
- **emdash:** use `emdash-content-modeling` and the relevant building/CLI skills.
  Inspect the selected instance's schema and existing entries through supported
  tools. Preserve records with an appropriate compatible migration; use dual
  reads/backfills when needed. Update queries, forms/live edit targets and
  templates together. Seed changes describe new installs and do not migrate
  live records. Include remote databases only when they are configured and in
  scope; source edits do not transfer CMS content or media.

Use request-specific boundary cases. For a requested integer from 1 through 60,
for example, accept both endpoints and reject out-of-range, fractional and
string values through the actual loader. Also build an existing entry with the
field omitted. Those boundaries are an example, not defaults for every field.

Navigation follows its actual owner: static site configuration or the selected
CMS menu records. Keep new-install seed defaults separate from those live edits.
Verify typing, save, reload and public/draft behavior when CMS edit targets change.

## Verification and a resumable handoff

For a full Baseline catch-up, use the existing-site update workflow in
`docs/baseline-updates.md` from a current published reference. Compare packages,
skills/instructions and starter capabilities separately. Bounded sync cannot add
new packages, scripts or managed paths, and EmDash skill synchronization does not
update CMS site source. Older sites without helpers/receipts need reviewed manual
integration, preserving original provenance. The versioned EmDash standards audit
is useful diagnosis but does not enumerate every current Baseline capability.
Record adopted, deferred and conflicting changes alongside actual acceptance.

For image additions, use the general `media:prepare` workflow when installed;
no WordPress source metadata is needed. Inspect photographic/artwork/preserve
presets and any review findings before using eligible `upload/` copies. Static
sites add prepared files to `src/assets/`; EmDash's `media:upload` records and
verifies the selected instance's returned media IDs and stored bytes. Reconcile
an ambiguous POST before retrying. This local workflow does not intercept client
browser uploads or sweep existing media records. Older installed sites need the
explicit tooling adoption in `docs/baseline-updates.md`.

Use the installed instructions and `package.json` to select commands. Current
static profiles provide `verify`, `build` and `check:dev-tools`; EmDash uses its
doctor, verification, build and HTML-audit workflow. Older installs may differ.
Keep CMS tooling out of static projects. For upstream updates, static profiles
use reviewed `sync:baseline` candidates; EmDash uses its installed skill helpers.
Preserve provenance, local edits, conflicts and the authorized application scope.

Match acceptance to the change: inspect affected and reference compositions at
narrow/intermediate/wide widths for layout work; check real content validation,
legacy entries and editor behavior for content work. Record failed attempts and
remaining limits. A generated checklist, typecheck or build cannot establish
all rendered, editor, provider or accessibility acceptance.

If an approval or policy review rejects cleanup, keep the owned paths or process
IDs and the exact rejection in the handoff. Continue independent permitted work.
Retry only when a permitted change addresses the review's stated concern;
switching shells or APIs alone does not address a rejection. Otherwise report
cleanup as pending. Ordinary command errors, such as an unavailable executable,
can use safe recovery within the task's existing authorization.

If another session needs to continue, update the existing progress record with
the requested outcome, changed paths, exact checks/results, pending decisions
or acceptance, and the next executable action. Keep brief/design facts in their
established home. Completed local preparation can be handed off with live
acceptance pending; that status does not imply deployment or publication.
