# Baseline — Static Foundation

## Fieldnote project context

The adopted durable brief is [PROJECT.md](PROJECT.md). Supplied copy and the
planned content model/routes live in [audit/content-route-plan.md](audit/content-route-plan.md).
Read [HANDOFF.md](HANDOFF.md) for current progress, checks and the resume point.
The resumed local build implements the three planned routes and typed Markdown content.
The local preview, rendered evidence, verification and remaining acceptance are in HANDOFF.md.

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

Pages live in src/content/pages/ and workshops in src/content/workshops/, with typed schemas in src/content.config.ts. Explicit route mapping publishes Home, Workshops and Contact only; draft pages are excluded from routes/navigation and draft workshops from the list. Native Markdown uses render() inside RichText; no workshop detail routes are generated.
All authored CSS must stay in `@layer base` or `@layer components`; use
`<Section>`/`.section` for page vertical rhythm and `RichText` for editorial flow.
Site settings and navigation live in `src/config/site.ts`.

Base explicitly selects `SiteShell spacingPolicy="automatic-v2"`; shared SiteShell defaults to legacy for reviewed upgrades. Section owns block padding and a container gap, Container owns a content stack gap, Grid owns its grid gap, and the shell owns horizontal gutters once. `spacing="none"` removes padding only; nested modes reset. Use `layout="custom"` for caller-owned display/gaps; breakout retains its named grid. Avoid flow/space-y margins on gapped groups. RichText supplies `.flow` and `data-editorial-content`; generic flow only spaces direct siblings. Mark composite internals `data-editorial-island` and establish editorial bodies deliberately. `flow={false}` removes both behaviors, wrapperless unless attributes require a plain wrapper.

For day-2 spacing requests choose the smallest scope: existing `@theme` scale for global density, regular root `--layout-*` alias for a structural relationship, layered regional alias, primitive `gap`, then an explicit utility exception. Preview `npm run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.75)" --json`; review, then add `--write` (and `--write-calibration` for saved-source evidence). Keep CSS authoritative without panels or a second configuration store. See `docs/design-framework.md` and `docs/native-composition.md`; inspect affected pages/styleguide at narrow/intermediate/wide widths after verify/build.

Store content imagery in `src/assets/` and use native Astro image processing with
accurate alt text and native bounds. Reserve `public/` for deliberate unchanged
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
Stage shared-source/skill updates with
`sync:baseline -- --ref <immutable-SHA>`, review the incoming files, then apply with
`--apply <SHA>` and reverify. Locally modified tokens/components are conflicts for
manual review. Routes, content, settings, site-owned Base layout, admin config and
package definitions are excluded. Read `docs/baseline-updates.md`; keep managed
provenance tracked. Do not invoke EmDash registry/database/screenshot harness
commands on this profile. Record static browser and deployment evidence in project
notes. Before Sveltia editor handoff test real login, upload, save, rebuild and logout
on the deployment.

Template verification requires Node `^22.22.3 || ^24.16.0 || >=26.3.0` (Node 24 LTS recommended). Run `npm run lint:templates` for Astro accessibility checks; `npm run verify` also retains script syntax, tokens, tests and type checking.

## Art Direction Record

- **Aesthetic Lane:** Editorial Paper — a calm, warm workshop programme with balanced density; reversible implementation assumption from the supplied brief.
- **Narrative Metaphor:** A carefully typeset community workshop programme on warm paper; date columns and fine horizontal rules organize sessions. No paper texture, simulated stationery or decorative illustrations.
- **Typography Pairing:** Display: Georgia, Body: system-ui (local platform fonts only; regular serif headings and wordmark, regular/semibold sans body and navigation).
- **Token Physics:**
  - Canvas: Warm unbleached paper with dark ink and a lighter surface.
  - Action/Accent: Dark forest green for email and navigation actions; contrasting focus rings.
  - Borders: Fine 1px rules, sharp list rows, restrained square controls, no ornamental shadows.
  - Spatial Density: Standard / balanced; shared fluid spacing for sections, content groups and grids. Section owns vertical padding, Container owns content gaps, rows own internal gaps and RichText owns article flow. Shell pays horizontal gutters once.
- **Site Anti-Patterns:** Generic stock photography or fabricated workshop details; floating rounded card grids and decorative badges; oversized empty heroes or decorative motion.

These are authorized local design assumptions, not claims of client approval. PROJECT.md and audit/content-route-plan.md retain the supplied brief and copy. Impeccable is applied as a bounded rendered review; settled discovery is not reopened or duplicated into a competing context document.
