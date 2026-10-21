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
Record site decisions here as they are established.

During new-site design setup, follow `new-site-workflow`'s **Layout spacing choice**
in either track: briefly explain responsive spacing for sections, content groups,
grids and article text. Express defaults to shared spacing and brief-led density
(balanced when unspecified); ask about custom spacing only for a real unresolved
design decision. Follow the skill's discovery questions and Express defaults,
reuse prior answers and record approved versus assumed decisions, density,
exceptions and content/maintenance ownership here. An
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
then calibrate real components on `/_styleguide` and record the observed results in
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

- **Aesthetic Lane:** Editorial Paper — warm archival print craft with high serif/sans typographic contrast
- **Narrative Metaphor:** Archival cotton bond paper, deep espresso letterpress ink, and engraved column rules
- **Typography Pairing:** Display: Georgia, Body: System Sans (high-contrast editorial serif headlines paired with clean humanist sans body)
- **Token Physics:**
  - Canvas: Warm archival paper ground (oklch(97.5% 0.012 82)) with cream card surfaces (oklch(99.2% 0.006 85))
  - Action/Accent: Editorial terracotta action (oklch(42% 0.15 28)) with warm ivory label ink
  - Borders: Crisp 1px editorial rules (oklch(86% 0.018 78)) and tailored 0.25rem card corners without drop shadows
  - Spatial Density: Generous editorial pacing (clamp(3.25rem, calc(1.25rem + 10vi), 9.25rem)) and 64ch reading measure
- **Site Anti-Patterns:** No floating SaaS card shadows; no neon or purple gradients; no uncaptioned decorative stock widgets

## Existing synthetic site decisions
This is a disposable local evaluation fixture. Developer-maintained English content; no external writes or deployment. The existing editorial-paper design and automatic-v2 spacing are established for this fixture. Existing routes and copy are authoritative. No real client approval is claimed.

## Workshops — public listing

User-settled decisions: keep the static profile, Git-owned English Markdown and
existing presentation/content/routes. Workshops live in `src/content/workshops/`
and use the typed `workshops` collection in `src/content.config.ts`: title, explicit
lowercase hyphenated slug, summary, date, venue and draft status. Dates are
calendar dates authored as `YYYY-MM-DD`, parsed as Date values; no time or timezone
has been supplied. Both supplied entries explicitly declare their draft status.

The original content-stage [handoff](HANDOFF.md) is retained as history.
`/workshops/` now queries only non-drafts in development and production and uses
the existing Base, Section, Container and collection list styles. Workshop anchors
use explicit slugs; no detail routes are requested. Ascending date ordering with a
slug tie-break is an implementation assumption from the handoff's recommendation.
Dates display in English with explicit UTC formatting to preserve calendar days.
The shared navigation includes Workshops. The enquiry is a simple
`mailto:hello@northline.example.test` action labeled **Ask about a place**. No CMS,
registration backend, browser editor or external integration is required.

Responsive spacing continues to come from the established shared section,
container and collection stack tokens; no visual tokens or spacing policy changed.
`npm run build` retains the release artifact gate and now also runs the focused
`test:workshops` production-output acceptance. Keep that coverage when adding
future public workshops, and update its known fixture/route expectations deliberately.
