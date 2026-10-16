# EmDash site starter

This repository is a reusable **Node.js + SQLite** Astro/EmDash starting point. It uses npm, Tailwind CSS v4, a neutral token system in `src/styles/global.css`, and small Astro layout components. Adapt the content model, visual language, and this file for each new site; the starter is not a finished theme.

## First steps in a new site repository

1. Read `README.md`, inspect the installed tooling and existing files, and use the package manager matching the lockfile (`npm`).
2. Run `npm run sync:emdash-skills` and review the diff before relying on the mirrored EmDash guidance. That command stages an immutable candidate by default; review and explicitly apply it under `docs/skill-synchronization.md`, preserving local drift and backups. Its ownership scope includes only `building-emdash-site`, `creating-plugins`, and `emdash-cli` under `.agents/skills/`.
3. Use `new-site-workflow` as the entry point when adapting this starter into a site or carrying out a full rebuild. Follow its stage gates and load each specialist skill when that stage begins; do not collapse discovery, platform setup, content architecture, art direction, implementation, and final review into one undifferentiated pass.
4. Record site-specific content types, routes, design decisions, hosting, and localization here as they become known. Do not carry the starter's sample content or English text into a client site by default.

`sync:site-skills` stages reviewed updates to the shared Vermeulen-maintained skills from the canonical starter repository. It does not modify this file, site content, or the mirrored EmDash skills. Run it with the package manager matching the lockfile; use `sync:site-skills -- --check` to check for an update without changing files.

If a repository predates this helper, follow `new-site-workflow`'s bootstrap rule: use the checked-in skill snapshot for the current task, record that synchronization is pending, and repair the helper before treating future shared-skill updates as synchronized.

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
- Use the dev-mode `<TweaksBar />` (press `T` to open, `B` to toggle the source baseline, Escape to close) for scalar calibration. It starts without overrides and does not persist browser settings. Merge exported tokens into `src/styles/global.css`, reload without overrides, and verify mobile/wide layouts, contrast, and available font weights. Layout and hierarchy changes still belong in source. Apply `[data-hero-asset]` to media itself.
- Keep CMS routes server-rendered. Use EmDash's content and media APIs rather than assuming database table shapes or string image fields.
- When Astro route caching is enabled, register cache hints for every EmDash query used to render a route, including shared settings and menus. Check the installed EmDash version for the current `*WithCacheHint` helpers.
- Render editorial Portable Text inside the `.flow` wrapper and inspect the output in public and editor modes.
- Use the existing neutral tokens and structural components as a starting API; derive brand values from the site's actual brief and visual evidence. Keep repeated content types in collections and reusable Astro templates when editors need to add entries.
- Treat WordPress imports, public page design, and deployed site transfer as distinct operations. A code deployment does not copy local CMS content to a remote database.
- For multilingual sites, use EmDash's native row-per-locale model linked by translation groups. Never create duplicate language fields (e.g. title_en, content_en) on a single collection row. Set prefixDefaultLocale: false in astro.config.mjs to keep the EmDash admin functional. See docs/internationalization.md.

## Starter standards and optional design interchange

URL-to-Astro migrations pass Stage 4.5 component calibration on `/_styleguide` after the saved art direction and before broad page assembly; record evidence/readiness in `audit/component-calibration.md`. Follow `.agents/skills/astro-site-design/references/component-quarantine.md` for open structural slots, deliberate semantic composites and surface-aware actions. Download site imagery to `src/assets/` or EmDash Media Library, never directly to `public/`; document unchanged-URL passthrough exceptions and verify native image processing. `.agent/rules/astro-composition.md` bridges rule-aware harnesses; this AGENTS guidance is canonical across tools. LogoTicker accepts only trusted noninteractive ID-free list items without scripts/islands/edit proxies; linked/editor-owned partners use an unduplicated list.

The scoped certified baseline is Astro 7.4.0 / EmDash 1.3.0 with Node 22.22.2+ or 24.15+; Node 24 LTS recommended; use the exact tested matrix and pending scopes in `standards/manifest.json`. Evaluate Astro and its adapters/integrations on every meta-review with `check:upstream`. `docs/design-interchange.md` defines an optional curated DESIGN.md bridge; AGENTS direction and shipped CSS retain authority. New-site completion requires reviewed private registration or an explicit pending artifact under `docs/site-registry.md`. No real client registry belongs in this public template.

## Commands

```bash
npm run dev
npm run check:art-direction
npm run test:design
npm run typecheck
npm run build
npm run sync:emdash-skills
npm run sync:site-skills
```

Use the local URL printed by Astro for `/_emdash/admin`; the port may differ from 4321.

## Reusable audit improvements (2026-10-05)

The reusable gallery backport provides neutral Card/PartnersPanel, ResponsiveImage/EditorialImage/RichText, native Astro image delivery and optional bounded form recovery. See docs/reusable-public-patterns.md. Client themes, assets, seeds, contact addresses and deployment bindings are excluded. New sites should compose these primitives, verify image provenance/native dimensions and runtime/editor behavior, and adapt tokens/content models. Use Astro’s image service and EmDash’s storage-backed endpoint; CMS uploads require no rebuild. Configure SITE_URL for hosted media and follow docs/image-delivery.md. Run test:utilities, existing gallery/design tests, typecheck and build.

## Framework documentation and native images

For screenshot/mockup translation use `.agents/skills/astro-site-design/references/visual-mockup-workflow.md`; preserve upstream skill content and keep project policy in maintained guidance. Stage and review syncs in a disposable copy when mirrored files contain local edits. Do not overwrite dirty mirrors to satisfy a refresh instruction. `npm run audit:baseline` records read-only local facts; follow `docs/starter-meta-review.md` for recurring Astro/adapter/Node/EmDash evaluation and explicit adopt/defer decisions. A lockfile version is a comparison baseline, not an upgrade ceiling.

Consult Astro Docs MCP for framework/image/adapter APIs and EmDash Docs MCP for CMS APIs, checking installed versions. Verify both through actual client queries; use official docs and report unavailable connections. Codex project configuration travels with the template; Antigravity user-level connections require per-machine setup and Refresh. Follow docs/agent-documentation.md during new-site setup. Prefer native Astro Image/Picture/getImage over custom rendition generation; preserve originals, native width, captions, editor behavior and host-specific storage integration.

## Local visual regression policy

Run `npm run test:visual` locally on Windows with the pinned renderer in docs/visual-regression.md. Goldens under tests/visual/baselines/win32 are authoritative; updates require explicit local `--update` and reviewed PNG/manifest diffs. Visual tests must never run automatically on push/PR or be dependencies of production builds/deployments. CI stays on Node 22.23.3 LTS with fast lint/schema/unit checks and a normal build, targeting <60 seconds and protecting the 2,000 minute/month budget. Actual browser zoom, no-JS, text spacing and active-motion behavior remain distinct from still-image comparison.


## Developer reference and ownership modes

With TweaksBar open, O compares one local raster reference and P inspects observed EmDash annotations; see docs/dev-hud.md. References stay in memory through revocable object URLs, with explicit DPR/scale and CSS-pixel alignment. Never add uploads, URL fetching or persistent storage to this tool. Ownership is read-only and version-aware: data-emdash-ref indicates an observed annotation, not registration or successful editing/saving; missing markers and UI text remain unannotated/unknown. Keep G/O/P state, shortcut exclusions and abort/navigation cleanup intact. Use test:dev-hud locally; no browser Actions dependency.
