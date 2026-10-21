# Baseline — Static Foundation

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

Posts live in `src/content/posts/`, with a typed schema in `src/content.config.ts`.
`draft: true` excludes a post from listings and generated routes. Detail routes use
`getStaticPaths()` and `render()`; render native Markdown through `<RichText><Content /></RichText>`.
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
Stage shared-source/skill updates with `sync:baseline -- --ref <immutable-SHA>`,
review the incoming files, then apply with `--apply <SHA>` and reverify.
Locally modified tokens/components are conflicts for manual review. Routes,
content, settings, site-owned Base layout, admin config and package definitions
are excluded. Read `docs/baseline-updates.md`; keep managed provenance tracked.
Do not invoke EmDash registry/database/screenshot harness commands on this profile.
Record static browser and deployment evidence in project notes. Before Sveltia
editor handoff test real login, upload, save, rebuild and logout on the deployment.

Template verification requires Node `^22.22.3 || ^24.16.0 || >=26.3.0` (Node 24 LTS recommended). Run `npm run lint:templates` for Astro accessibility checks; `npm run verify` also retains script syntax, tokens, tests and type checking.

## Art Direction Record
- **Aesthetic Lane:** Editorial Paper
- **Narrative Metaphor:** A practical workshop notebook
- **Typography Pairing:** System serif headings and system sans body
- **Token Physics:** Canvas: warm paper; Action/Accent: forest; Borders: thin; Spatial Density: balanced
- **Site Anti-Patterns:** no generic gradients; no duplicate spacing systems; no stock dashboard chrome

## Existing site brief

Fictional evaluation facts; these approvals describe the synthetic client, not a real customer.
Purpose: help local team leads find and register for practical workshops.
Audience: team leads at small local organizations.
Launch scope: one English locale, native static content, a workshop index and detail pages. No browser CMS or payment integration.
Registration: mailto:workshops@northline.example.test; preserve this endpoint.
Ownership: Studio editor supplies workshop copy; site maintainer handles code/build/deployment.
Decisions: static editing and email registration approved in audit/brief-decision.md; no launch date is approved. Quarterly publication cadence is assumed, not approved.
Source map: baseline.config.json and astro.config.mjs describe the installed platform; src/content.config.ts and src/content/workshops/ own the model/content. AGENTS.md contains the Art Direction Record; DESIGN.md is a visual reference; CSS owns shipped values.
