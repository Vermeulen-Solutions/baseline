# Baseline — Static Foundation

Default task: build or maintain this website. Use the user's request and existing
site decisions to establish scope; a local component change is still site work.
Baseline contributor procedures do not become site prerequisites because starter
files or an upstream Git remote are present. This profile ships site guidance;
upstream starter development uses Baseline's own CONTRIBUTING.md in its source
checkout, without changing this project's profile or adding maintainer tooling.

Read `baseline.config.json` and `README.md` first. This project uses Astro static
output, file-owned content and the shared Baseline design system. Keep the npm
lockfile and use `npm ci` once it has been created by the initial `npm install`.

Use the checked-in `new-site-workflow`, `site-art-direction`, `astro-site-design`
and `impeccable` skills for the applicable brief, art direction, calibration and
public Astro implementation stages. Their EmDash-only sections do not apply to
this profile. Do not load CMS setup/modeling/plugin skills or add database,
React, server-adapter or EmDash dependencies. `static-sveltia` adds the pinned
admin SPA and paired form only; read `docs/sveltia-cms.md` for OAuth proxy/PAT setup.

For an audit request, lead with an actionable follow-up plan and meaningful user decisions, using findings as supporting evidence. An audit alone does not authorize implementing the plan. Follow `new-site-workflow`'s **Audit requests and release completion** guidance: agree the implementation/release scope, then complete verification, commit, push and applicable deployment without repeated continuation prompts. Respect explicit audit-only or local-only scope.

Keep site decisions in their established home: here by default, or in an explicitly
adopted optional `PROJECT.md` linked here. Keep working rules and the compact Art
Direction Record in this file. `PROJECT.md` holds brief, scope, ownership and
nonvisual rationale; the selected optional `DESIGN.md` holds visual references
and interchange. CSS and configuration own implemented values. Keep one home per
fact, link actual sources, and resolve disagreements by subject and evidence.
Current progress belongs in the existing tracker or a short handoff when needed.
Missing optional records do not block authorized work. See `docs/project-context.md`
and `PROJECT.example.md`; neither creates an extra checkpoint or approval claim.

During new-site design setup, follow `new-site-workflow`'s **Layout spacing choice**
in either track: briefly explain responsive spacing for sections, content groups,
grids and article text. Express defaults to shared spacing and brief-led density
(balanced when unspecified); ask about custom spacing only for a real unresolved
design decision. Follow the skill's discovery questions and Express defaults,
reuse prior answers and record visual direction, density and exceptions with the
Art Direction Record here. Keep approved/assumed nonvisual decisions and
content/maintenance ownership in the established context home. An
authorized autonomous build may use an explicit recommended assumption. Keep
the current shell policy for both choices; custom layouts use tokens and explicit
primitive controls. No settings panel or external-product terminology is needed.

## WordPress migration

For WordPress migrations, read `docs/wordpress-migration.md` and use the installed `migration:wordpress` capture → assess → plan → apply workflow. Prefer the first-party exporter installed from its official packaged release ZIP through Plugins → Add New → Upload Plugin; a local uploads-directory copy and FTP access are optional fallbacks. For Elementor sites, offer the optional private Website Template kit reference and inspect it with `assess --kit`; the client can skip it when replacing the design. Review source/mapped routes, field dispositions, source exclusions and unsupported widgets. Generate an acceptance manifest with `migration:wordpress acceptance`, then run `migration:verify`; full scope requires actual content/editor/design evidence in addition to HTTP checks. Preserve existing files and finish redirects, navigation, media and publication acceptance. Source captures remain private; the output uses native Markdown/assets and the matching Sveltia form. Do not load CMS migration specialists or add an EmDash runtime to perform this migration.

## Design iteration surface

At the existing new-site/significant-redesign concept checkpoint, recommend a dedicated design canvas and offer **OpenPencil**, **OpenDesign**, **Penpot** and **direct Astro/browser** explicitly. Reuse the user's settled preference and an already working connection: OpenPencil suits local desktop/files, OpenDesign suits a local HTML/CSS canvas with bundled design systems and examples, Penpot suits shared cloud access, and direct Astro suits a preferred real-browser/no-service workflow. Follow `site-art-direction` and its `references/design-iteration.md` for focused visual batches → selected direction → representative Astro proof → rollout. Retain explicitly preferred Pencil, Google Stitch, Claude Design and designmd-mcp references. OpenPencil uses `openpencil-site-design`, OpenDesign uses `opendesign-site-design` and Penpot uses `penpot-site-design`; all canvas options have onboarding guides under `docs/`. Same-agent design/implementation is complete; another agent and portable handoff are optional. Small refinements reuse the accepted world. Preserve native calibration, actual route/browser acceptance and the agreed release endpoint.

## Shared design authority

`src/styles/global.css`, the layout primitives, `SiteShell.astro`, `design:tokens`
and `check:art-direction` are canonical. Before client-specific visual work,
save a complete `## Art Direction Record` with Aesthetic Lane, Narrative Metaphor,
Typography Pairing (Display and Body), Token Physics (Canvas, Action/Accent,
Borders, Spatial Density), and two or three semicolon-separated Site Anti-Patterns.
Run `npm run check:art-direction -- --require-record` before implementing that work.

This reusable foundation has no invented client art direction. Starter infrastructure
exceptions are exact-path, LF-normalized SHA-256 records; any edit invalidates its
exception. Never add broad directory exceptions or exempt client implementations.
The changed-source check also validates all visual files before Git initialization.
Run `npm run design:tokens -- --init-client --lane <lane>` when adapting the starter,
then calibrate real components at the Component calibration path printed by
`npm run dev` (`/_styleguide/` with the default slash policy) and record results in
`audit/component-calibration.md`. A generated calibration checklist is not evidence
that browser verification has been performed.

## Content, assets and rendering

Posts live in `src/content/posts/`, with a typed schema in `src/content.config.ts`.
`draft: true` excludes a post from listings and generated routes. Detail routes use
`getStaticPaths()` and `render()`; render native Markdown through `<RichText><Content /></RichText>`.
All authored CSS must stay in `@layer base` or `@layer components`; use
`<Section>`/`.section` for page vertical rhythm and `RichText` for editorial flow.
Site settings and navigation live in `src/config/site.ts`.

Base explicitly selects `SiteShell spacingPolicy="automatic-v2"`; shared SiteShell defaults to legacy for reviewed upgrades. Section owns block padding and a container gap, Container owns a content stack gap, Grid owns its grid gap, and the shell owns horizontal gutters once. `spacing="none"` removes padding only; nested modes reset. Use `layout="custom"` for caller-owned display/gaps; breakout retains its named grid. Avoid flow/space-y margins on gapped groups. RichText supplies `.flow` and `data-editorial-content`; generic flow only spaces direct siblings. Mark composite internals `data-editorial-island` and establish editorial bodies deliberately. `flow={false}` removes both behaviors, wrapperless unless attributes require a plain wrapper.

For day-2 spacing requests choose the smallest scope: existing `@theme` scale for global density, regular root `--layout-*` alias for a structural relationship, layered regional alias, primitive `gap`, then an explicit utility exception. Preview `npm run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.75)" --json`; review, then add `--write` (and `--write-calibration` for saved-source evidence). Keep CSS authoritative without panels or a second configuration store. See `docs/design-framework.md` and `docs/native-composition.md`; inspect affected pages/styleguide at narrow/intermediate/wide widths after verify/build.

Store content imagery in `src/assets/` and use native Astro image processing with
accurate alt text and native bounds. During initial builds and day-2 maintenance,
prepare incoming images with `npm run media:prepare`, inspect the manifest/output,
and add eligible copies to `src/assets/`. Keep client originals in their source
handoff or ignored `.baseline/backups/` archive. See `docs/media-preparation.md`.
Reserve `public/` for deliberate unchanged
URL assets, including the Sveltia admin SPA when selected. There is no media
storage endpoint or live CMS editing canvas. Sveltia edits the same Markdown files,
requires a rebuild to publish, and must keep its form paired with the native schema.

## Verification and release

Run `npm run verify`, `npm run build` and `npm run check:dev-tools`. Inspect the
public routes, emitted images, keyboard focus and narrow reflow in a browser.
`/_styleguide` exists in development and isolated fixture builds, and is absent
from production. Never deploy `dist-fixtures/`. Deploy only a verified `dist/`.

Generated CI uses clean `npm ci`, token/art checks, tests, typecheck, static build
and production isolation checks. Commit the initial project-specific lockfile.
Stage shared-source/skill updates with `sync:baseline -- --ref <immutable-SHA>`,
review the incoming files, then apply with `--apply <SHA>` and reverify.
Locally modified tokens/components are conflicts for manual review. Routes,
content, settings, site-owned Base layout, admin config and package definitions
are excluded. Read `docs/baseline-updates.md`; keep managed provenance tracked.
Do not invoke EmDash registry/database/screenshot harness commands on this profile.
Record static browser and deployment evidence in project notes. Before Sveltia
editor handoff test real login, upload, save, rebuild and logout on the deployment.

Template verification requires Node `^22.22.3 || ^24.16.0 || >=26.3.0` (Node 24 LTS recommended). Run `npm run lint:templates` for Astro accessibility checks; `npm run verify` also retains script syntax, tokens, tests and type checking.
