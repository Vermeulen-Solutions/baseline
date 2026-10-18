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
`getStaticPaths()` and `render()`; wrap native Markdown output in `.flow`.
Site settings and navigation live in `src/config/site.ts`.

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
