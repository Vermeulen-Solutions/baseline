# Scoped site maintenance

Audit JSON v3 classifies findings as `bounded_recipe`, `design_judgment`, `verification_required` or `review_required`; current readers also accept legacy v2. Classification is not authorization or proof that a recipe's source/lock/revision preconditions hold. Treat zero expressive counts and fluid advisories as contextual leads; preserve suitable restrained layouts and explicit exceptions. Missing evidence calls for inspection, not invented data, replacement themes or automatic dependency/skill upgrades. Group the actionable plan accordingly while retaining the concrete recipes below and the user's existing implementation/release scope.

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

### Turn an audit into a delivery plan

For an audit request, use `new-site-workflow`'s **Audit requests and release completion** policy. Lead with a recommended follow-up sequence, why it matters, the changes and boundaries, meaningful decisions and how success will be verified. Keep diagnostic detail behind those actions; producing a report is not a substitute for proposing what to do next. An audit-only request ends with that actionable plan for user selection, not unrequested code or CMS changes. Reuse any implementation scope already approved.

Plan through release where applicable: verified changes, commit, push to the named branch, deployment to the named environment and live checks. Establish those targets and authority early; carry out authorized release steps after verification without another continuation prompt. Respect local-only scope and report genuinely missing authority precisely. A reusable-template or documentation change need not have a site deployment.

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

### Framework upgrade checks

When a site upgrade changes EmDash, Astro or the Cloudflare adapter, apply the
installed release notes and verify:

- The core package, its exact companions, the Cloudflare adapter and any
  `@emdash-cms/sandbox-workerd` install resolve one `emdash` version
  (`npm ls emdash` / `pnpm why emdash`). The sandbox runner vendors its own core.
- Every Astro config, including a separate Worker config, passes the canonical
  origin through `emdash({ siteUrl })`; runtime `EMDASH_SITE_URL` is not enough.
- The release's public-HTML cache policy is present. EmDash 1.4 removed
  automatic page validators; preserve private/no-store and site policies.
- Site-owned version guards and format assumptions were re-read. A helper written
  for the old core version is not automatically compatible.
- Starter-derived rehearsals are treated as templates. Readiness text, collection
  slugs and expected content may not exist in a replaced site.
- A D1 Time Travel bookmark is recorded before deployment; `wrangler d1 export`
  cannot dump EmDash FTS5 databases. Explicit local rehearsals that refuse
  `CI`/`GITHUB_ACTIONS` are run with the variable unset, not with a weakened guard.
- The exact branch, build/deploy command, deployed version and
  `/_emdash/api/health` result are recorded; every exposed hostname is checked.

See `docs/emdash-1.4-upgrade.md` for current version behavior and
`docs/cloudflare-backup-restore.md` for recovery.

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

### Reconcile completion before handoff

For a request with several deliverables, keep a compact requirement-to-evidence register in the existing tracker or handoff. Reuse its route inventory instead of creating a second required document. An isolated edit needs only a short equivalent record.

| Requested result | Route / state / scope | Implementation or decision | Observed evidence | Status / remaining action |
| --- | --- | --- | --- | --- |
| Each user deliverable, including proposals and acceptance | Named URL, viewport, editor or provider state as applicable | Changed source or preserved decision | Actual check result, capture or round trip; distinguish attempted/failed checks | Planned, implemented, verified, blocked or explicitly deferred with reason and owner |

Before a final response, reconcile every requested result against source and evidence. A proposal reconstructed after route edits does not satisfy a requested pre-implementation review. A passing build does not close browser, editorial or provider rows. Continue unfinished required work within existing authorization when supported tools/access remain available. Do not silently narrow the scope or label remaining acceptance as complete; if a real blocker requires user input or an external change, state it precisely and retain the next executable action. An agreed local-only deliverable may be complete with separately named launch acceptance pending.

When resuming, reconcile historical limitations with later results: retain failed-attempt evidence, mark superseded captures/checks and update current status. Report implementation, local automated checks, rendered behavior, CMS acceptance and deployment separately. Keep brief/design facts in their established home; record what was committed, pushed or deployed only when observed.

## Upgrading an earlier Baseline site (design & primitive modernization)

When asked to review, audit, or improve the design of a site built on an earlier version of Baseline (whether EmDash or static):

First establish whether this is primitive modernization/refinement or a significant visual overhaul. Preserve the accepted direction for refinement. A larger redesign uses the concept pass in `site-art-direction` and stages 4–6 of `new-site-workflow`; backporting utilities alone is not an overhaul. Primitive flags and usage counts diagnose installed capabilities, not visual quality or mandatory per-route adoption.

Use the implementation steps below only within the selected scope. When the request is to audit first, diagnose and present the follow-up plan before backporting primitives or editing routes.

1. **Diagnose the installed primitive generation**:
   - On EmDash sites, run `npm run audit:site -- --root <site-path> --out <private-report-dir>` and inspect `design-system:tokens-and-rhythm` and `design-system:card-and-breakout` (`fourVoiceTypography`, `threeTierSurfaces`, `bentoAndSpecimenPrimitives`, `tactileActionVariants`, `cardTransitionMorphing`, `siteShellChoreography`, `expressivePrimitiveUsageCount`).
   - On static/Sveltia sites, run `npm run sync:baseline -- --ref <SHA>` (or inspect `src/styles/global.css`, `src/layouts/SiteShell.astro`, `src/layouts/Base.astro`, and `src/components/Card.astro`) to see which shared primitives are missing.
2. **Backport shared primitives without overwriting client identity**:
   - Preserve the site's calibrated `@theme` palette, `--font-display`, `--font-body`, and `AGENTS.md` `## Art Direction Record`.
   - Add `--font-mono` and `--font-accent` to `@theme` in `src/styles/global.css`, and merge the modern `@layer base` and `@layer components` blocks (3-tier surface derivations `--color-elevated` / `--surface-glass`, 4-voice typography `.eyebrow-telemetry` / `.font-accent` / `.tabular-nums`, tactile `.btn--secondary` / `.btn--ghost` / `.icon-nudge`, `.bento-grid`, `.grid-hairline`, `.ui-specimen`, `[data-reveal]`, `[data-sticky-header]`, and View Transition rules).
   - Review and adapt `src/layouts/SiteShell.astro`, `src/layouts/Base.astro` (`surface` prop + `data-sticky-header`), and `src/components/Card.astro` (`transitionName` prop). Preserve client wrappers and installed defaults; do not overwrite them solely to make an audit flag pass.
3. **Conduct a live visual & layout critique before editing routes**:
   - Capture or inspect the live site (or local preview) at desktop (`1440x900`) and mobile (`390x844`).
   - Evaluate each key route against the **5-Point Visual Self-Critique Rubric** in `astro-site-design/SKILL.md` and the **Early-Baseline & Legacy Pattern -> Modern Baseline Upgrade Matrix** (`astro-site-design/references/migration-visual-audit.md`) — explicitly checking flat 1-surface pages for `.surface-elevated` / `.surface-glass`, 2-voice typography for `.eyebrow-telemetry` / `.font-accent` / `.tabular-nums`, repeated 3-column rows for `.bento-grid` / `.grid-hairline` / `<Sidebar>` pacing, and list/detail pairs for `<Card transitionName>` morphing. Use these concrete defaults to diagnose and propose improvements; document a specific accepted-brand or route-function exception rather than silently skipping a check.
   - Present the concise **Preserve / Improve / Upgrade** proposal per route before route changes. Reuse settled decisions and authorization; resolve only consequential open choices, then implement the approved scope. Calibrate applicable components on `/_styleguide` (`audit/component-calibration.md`), run installed verification/build commands, complete the affected browser/editor checks and reconcile the register above before delivery.
