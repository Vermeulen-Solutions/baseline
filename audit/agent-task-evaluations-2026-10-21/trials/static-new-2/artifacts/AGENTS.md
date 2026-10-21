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

Northline pages and services live in `src/content/pages/` and `src/content/services/`, with typed schemas in `src/content.config.ts`.
`draft: true` excludes entries from listings and generated routes; keep navigation aligned when retiring an established route. Detail routes use
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

## Northline Planning site record
- Profile: static; Express track. Local delivery only, no deployment. English only.
- Audience: independent small businesses assessing premises. Primary action: Discuss your project, via mailto:hello@northline.example.test.
- Ownership: owner and coding assistant edit typed Markdown in Git. Content changes require a static rebuild. No CMS, accounts, tracking, forms or external integrations.
- Content: pages collection for Home, Services, About, Contact; services collection for three ordered services. Routes: /, /services/, /about/, /contact/. Supplied copy is authoritative; no facts, imagery, logos, testimonials or credentials are invented.
- User-supplied choices: forest green #215846, warm light backgrounds, system fonts, typographic name, English only, four routes. Working assumptions: Editorial Paper, Georgia display/system sans body, balanced reading-led density, no motion or imagery.
- Layout spacing: shared section, content and grid gaps adapt to screen width; use token aliases and primitive props for local adjustments. No custom spacing exceptions.
- Delivery: local static dist; SITE_URL intentionally unset until a public origin exists. Future hosting must use genuine 404 responses without an SPA rewrite. No infrastructure or publishing services configured.
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper — restrained reading-led consultancy design with forest ink and warm paper.
- **Narrative Metaphor:** A clear working brief laid on a planning desk; left-aligned headings, measured columns and fine divider rules organise decisions. No literal maps or invented premises imagery.
- **Typography Pairing:** Display: Georgia, Times New Roman, serif; Body: system-ui, Segoe UI, sans-serif. System-served regular display and regular/semibold body weights avoid network dependencies.
- **Token Physics:**
  - Canvas: Warm ivory #F9F6F0 with pale paper surfaces.
  - Action/Accent: Forest green #215846 for email actions, links and editorial accents; white action text.
  - Borders: Hairline rules, square corners, no elevated shadows in client compositions.
  - Spatial Density: Standard — balanced reading-led whitespace with shared fluid spacing.
- **Site Anti-Patterns:** No invented credentials or social proof; no stock office photography or decorative planning diagrams; no floating glass cards or oversized pill actions.
