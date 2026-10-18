# Baseline Platform Profiles

This repository maintains two technical foundations with one shared design system. The root application is the **EmDash Node.js + SQLite** foundation. Generated static projects use native Astro Content Collections and static output. All profiles use npm, Tailwind CSS v4, `src/styles/global.css`, token checks, layout primitives and `/_styleguide` calibration. Adapt the content model, visual language and this file for each real site.

## Platform Profile routing

| Profile ID | Editing | Hosting/runtime |
| --- | --- | --- |
| `static` | Developer/agent edits typed Markdown files | Astro static build; no database or server adapter |
| `static-sveltia` | Sveltia SPA edits the same Git-owned files | Same static build; OAuth proxy or PAT for GitHub authentication |
| `emdash` | Relational CMS, Portable Text, live canvas and MCP | Node/SQLite/local media, or separately configured Workers/D1/R2 |

Read `baseline.config.json` in generated sites; absence in this root means the existing EmDash application. Profile is independent of Standard/Express track. Generate static sites with `npm run init:profile -- --profile static|static-sveltia --out <new-directory>`; do not prune a cloned CMS project in place. EmDash uses the existing full repository template. See `docs/platform-profiles.md`.

Static profiles use `new-site-workflow`, `site-art-direction`, `astro-site-design` and `impeccable`; skip EmDash setup, modeling, building, CLI and plugin specialists. Do not add CMS dependencies to satisfy an inapplicable check. Generated CI and `sync:baseline` use the installed profile's bounded inventory. Review staged updates before applying, preserve locally calibrated tokens, and verify afterward (`docs/baseline-updates.md`). EmDash-specific commands and rules below apply only to `emdash`.

`SiteShell.astro` is the shared document/landmark shell; platform `Base.astro` wrappers supply navigation and contributions. `ResponsiveImage.astro` is native Astro presentation; `EmDashImage.astro` alone resolves CMS storage. Common styleguide specimens run on both foundations, with EmDash extensions kept separate. Static routes use native `getStaticPaths()`/`render()` and the typed schema in `src/content.config.ts`. Sveltia's paired admin form must match that schema.

## First steps in a new site repository

1. Read `README.md`, inspect the installed tooling and existing files, and use the package manager matching the lockfile (`npm`).
2. Use `new-site-workflow` as the entry point when adapting this starter into a site or carrying out a full rebuild. Choose either the **Standard Track (7 Stages)** for complex migrations/multi-locale builds or the **Express Track (3 Checkpoints)** for smaller greenfield sites (`<= 6` routes, single locale), and load each specialist skill when its stage begins.
3. Record site-specific content types, routes, design decisions, hosting, and localization here as they become known. Do not carry the starter's sample content or English text into a client site by default; use `npm run design:tokens -- --init-client --lane <lane>` when initializing a client site to seed tokens, write the `## Art Direction Record`, and prune starter sample-page gate exceptions.
4. Only run `npm run sync:emdash-skills` or `npm run sync:site-skills -- --check` when explicitly checking for upstream skill updates or refreshing an older checkout (`docs/skill-synchronization.md`). On a fresh clone, use the checked-in skills under `.agents/skills/` directly without a blocking sync detour.


## Where to work

| Path | Purpose |
| --- | --- |
| `astro.config.mjs` | Node adapter, EmDash SQLite/local-media setup, Tailwind v4 |
| `seed/seed.json` | Initial Posts/Pages schema and sample content; a seed is not a deploy-time content migration |
| `src/live.config.ts` | EmDash live collection registration |
| `src/styles/global.css` | Neutral `@theme` tokens, base rules, Smart Spacing `.flow`, `.content-grid`, and shared layout classes |
| `src/components/` | `Section`, `Container` (including `breakout`), `Grid`, and `Card` layout primitives |
| `src/layouts/Base.astro` | Site shell, EmDash page contributions, menu, and widgets |
| `src/pages/` | Server-rendered public routes |
| `.agents/skills/` | Project-local EmDash and Vermeulen Solutions workflows |

## Skills and documentation

- `new-site-workflow`: required sequencing and handoffs for a complete new site or rebuild.
- `site-art-direction`: brief-led visual direction before frontend implementation. Consult `references/aesthetic-lanes.md` to select an aesthetic lane and define the narrative metaphor.
- `impeccable`: bounded visual critique and UI refinement after rendered pages are available.
- `building-emdash-site`: content queries, schema, Portable Text, site features.
- `emdash-cli`: current CLI operations and editing flow.
- `creating-plugins`: plugin implementation when a site actually needs one.
- `emdash-site-setup`: hosting and sandbox runner selection, deployment, and site transfer.
- `wordpress-to-emdash-content`: WordPress import, media, and form behavior.
- `astro-site-design`: visual inspection and maintainable public Astro presentation. For existing-site rebuilds, read its migration visual-audit reference before implementing pages.

For complete site work, the normal sequence is: brief and evidence → platform decisions → content and routes → art direction → representative Astro/EmDash implementation → Impeccable visual critique and refinement → full review and delivery. A scoped task may begin at the earliest affected stage, but must check whether its inputs are already established and update downstream decisions when they are invalidated.

For WordPress migrations, classify repeated material that is not a registered custom post type before implementing routes. Keep a substantial content-candidate register in `audit/content-candidate-register.md` and link it here; classify each candidate as a collection, page content, site setting, plugin/integration data, or deliberate exclusion.

Use the live [EmDash docs](https://docs.emdashcms.com/) or configured docs MCP to verify APIs and commands. The three EmDash-authored skills are upstream mirrors; change custom guidance in the other skill directories, not in those mirrors.

## Implementation rules

- Before site-specific visual implementation anywhere under `src/` or `public/`, save one complete `## Art Direction Record` in this file with Aesthetic Lane, Narrative Metaphor, Typography Pairing, Token Physics (Canvas, Action/Accent, Borders, Spatial Density), and 2–3 Site Anti-Patterns separated by semicolons. “Save” means write to disk; a Git commit is not required or implied. Run `npm run check:art-direction -- --require-record` before implementing. Route inventory and content modeling may precede this gate; visual route templates may not.
- The gate applies to site visual work regardless of file extension or directory relocation. Functional fixes that preserve the visual system, backend/platform setup, starter infrastructure maintenance, and isolated concept studies under `audit/visual-concepts/` are scoped exceptions. Document source-file exceptions in `audit/design-gate-exceptions.json` with an exact path, concrete reason, and SHA-256 of UTF-8 content normalized to LF; an edit invalidates its exception. Never exempt a directory or client page implementation. Exception changes require the same review as code changes.
- `npm run check:art-direction` checks changed visual source against HEAD (or `--base <revision>`) and validates the record unless exact infrastructure exceptions cover it. CI runs this check. This is structural outcome validation, not prevention of writes, proof of decision chronology, human approval, or design quality. True pre-write enforcement requires a guard in the agent tool runner. Keep evidence and approved versus assumed decisions explicit; revisit the record when the brief changes.
- The reusable starter intentionally has no invented client Art Direction Record. When adapting it to a client site, create the real record and retain only applicable exceptions.
- Use `npm run design:tokens` (`scripts/design-system.mjs`) for agent-first token calibration and validation. Seed a canonical Aesthetic Lane preset, `## Art Direction Record`, and Stage 4.5 calibration table (`npm run design:tokens -- --lane <lane> --write --write-record --write-calibration` or `--seed-accent <color> --type-scale <ratio>`), refine brand tokens in `src/styles/global.css`, and run `npm run design:tokens` + `npm run test:design` to verify WCAG AA perceptual contrast across default and `[data-surface="dark"]` contexts, fluid `clamp()` bounds, custom font loading, EmDash `.edit.` proxy bindings, and `/_styleguide` specimen coverage. Apply `[data-hero-asset]` to media itself.
- Keep CMS routes server-rendered. Use EmDash's content and media APIs rather than assuming database table shapes or string image fields. When a site requires drag-and-drop visual landing pages or popups, evaluate the optional native EmVB plugin (`@perkyzz/emvb` + `@perkyzz/emvb-mcp`) during Stage 2 and pass `canvasStyles` so the visual builder inherits `src/styles/global.css`.
- When Astro route caching is enabled, register cache hints for every EmDash query used to render a route, including shared settings and menus. Check the installed EmDash version for the current `*WithCacheHint` helpers.
- Render editorial Portable Text inside the `.flow` wrapper and inspect the output in public and editor modes.
- Use the existing neutral tokens and structural components as a starting API; derive brand values from the site's actual brief and visual evidence. Keep repeated content types in collections and reusable Astro templates when editors need to add entries.
- Treat WordPress imports, public page design, and deployed site transfer as distinct operations. A code deployment does not copy local CMS content to a remote database.
- For multilingual sites, use EmDash's native row-per-locale model linked by translation groups. Never create duplicate language fields (e.g. title_en, content_en) on a single collection row. Set prefixDefaultLocale: false in astro.config.mjs to keep the EmDash admin functional. See docs/internationalization.md.

## Starter standards and optional design interchange

- **Stage 4.5 component calibration:** After saving the art direction and before broad page assembly, calibrate primitives on `/_styleguide` and record evidence in `audit/component-calibration.md` (`npm run design:tokens -- --write-calibration`). Follow `.agents/skills/astro-site-design/references/component-quarantine.md` for open structural slots, semantic composites, and surface-aware actions.
- **Asset provenance & native image delivery:** Download site content imagery to `src/assets/` or the EmDash Media Library — never directly to `public/`. Document unchanged-URL passthrough exceptions (favicons, `robots.txt`, fonts) and prefer Astro `<Image>` / `<Picture>` / `getImage()` with EmDash's storage-backed media endpoint (`docs/image-delivery.md`).
- **Partner & gallery primitives:** Compose `Card`, `PartnersPanel`, `LogoTicker`, `ResponsiveImage`, `EditorialImage`, `PhotoGallery`, `RichText`, and bounded form recovery (`docs/reusable-public-patterns.md`). `LogoTicker` accepts only trusted, noninteractive, ID-free list items without scripts, islands, or edit proxies; linked/editor-owned partners use an unduplicated list.
- **Certified baseline & registry:** Scoped certified baseline is Astro `7.4.0` / EmDash `1.3.0` on Node `22.22.2+` or `24.15+` (Node 24 LTS recommended; see `standards/manifest.json` and `docs/starter-meta-review.md`). `docs/design-interchange.md` defines the optional `DESIGN.md` bridge; `AGENTS.md` and `src/styles/global.css` retain authority. Complete new sites with `npm run site:register` (`docs/site-registry.md`).
- **Framework docs MCP & local visual regression:** Consult Astro Docs MCP and EmDash Docs MCP against installed versions (`docs/agent-documentation.md`). Run `npm run test:visual` locally on Windows only (`docs/visual-regression.md`); never run visual regression in automated CI or production builds.

## Commands

```bash
npm run dev
npm run verify
npm test
npm run check:art-direction
npm run design:tokens
npm run test:design
npm run typecheck
npm run build
npm run sync:emdash-skills
npm run sync:site-skills
```

Use the local URL printed by Astro for `/_emdash/admin`; the port may differ from 4321.

