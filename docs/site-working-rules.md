# Detailed site working rules

These rules supplement [AGENTS.md](../AGENTS.md). Read the relevant sections before
changing site presentation, content rendering or production behavior. The root
instructions contain the essential first steps and route tasks here; this guide
keeps detailed contracts out of that initial context.

Common design rules apply to both foundations. EmDash, CMS, database and server
operations apply only to the EmDash profile. Generated static projects have their
own profile-specific AGENTS.md and installed references.

For improvements to Baseline as a reusable starter, also read
[CONTRIBUTING.md](../CONTRIBUTING.md). Maintainer work retains these implementation
contracts; the client discovery process applies when building or redesigning a
client site.

## Where to work

| Path | Purpose |
| --- | --- |
| `astro.config.mjs` | Node adapter, EmDash SQLite/local-media setup, Tailwind v4 |
| `seed/seed.json` | Initial Posts/Pages schema and sample content; a seed is not a deploy-time content migration |
| `src/live.config.ts` | EmDash live collection registration |
| `src/styles/global.css` | Neutral `@theme` tokens, base rules, flow spacing `.flow`, `.content-grid`, and shared layout classes |
| `src/components/` | `Section`, `Container` (including `breakout`), `Grid`, `Card`, native `Disclosure`, wrapping `Cluster` and intrinsic `Sidebar` primitives (`docs/native-composition.md`) |
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

During new-site design setup, explain **layout spacing**. Express defaults to shared responsive spacing and brief-led density (balanced when unspecified), without a separate CSS-policy question. Standard asks about shared versus custom spacing only when it is a material unresolved decision. Use `new-site-workflow`'s persona-informed discovery questions and defaults, reuse prior answers and continue authorized work without mandatory checkpoint stops. Record visual density, exceptions and approved/assumed direction with the Art Direction Record here; keep nonvisual decisions and content/maintenance ownership in the established context home. No settings panel or external-product terminology is needed.

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
- All authored CSS lives in `@layer base` or `@layer components`; contextual defaults use zero-specificity `:where()` selectors so `@layer utilities` overrides them without `!important`. Never leave normal selector rules outside a named layer. Component `<style>` blocks follow the same contract; keyframes stay outside the layer.
- Site-owned Base explicitly selects `SiteShell spacingPolicy="automatic-v2"`; the shared shell defaults to legacy for installed-site compatibility. Under v2, Section owns block padding and a container stack gap, ordinary Container owns a content stack gap, Grid owns its grid gap, and `.site-main` owns horizontal gutters once without inferring block rhythm. `spacing="none"` removes padding only; nested primitive defaults reset independently. Use `layout="custom"` when the caller owns display/gap. Breakout retains its named grid. Keep local `--section-padding`, `--container-gap`, `--grid-gap` separate from inherited root-context aliases `--layout-section-padding`, `--layout-container-gap`, `--layout-content-gap`, `--layout-grid-gap`. These regular aliases reuse existing scales; do not add another `@theme` scale.
- Render editorial Portable Text through `RichText`, which establishes `.flow` and `data-editorial-content`. Generic `.flow` only spaces visible direct siblings; handwritten prose needs the editorial marker. Composite internals are bounded by `data-editorial-island`; nested editorial bodies own their controls. `flow={false}` relinquishes rhythm and prose defaults (wrapperless unless attributes require a plain wrapper). `.article-body` is a margin wrapper. Do not combine flow/space-y child margins and a layout gap for the same relationship. Verify actual CMS typing/save/reload when changing renderer/edit targets; attributes alone are not proof.
- Use the existing neutral tokens and structural components as a starting API; derive brand values from the site's actual brief and visual evidence. Keep repeated content types in collections and reusable Astro templates when editors need to add entries.
- Treat WordPress imports, public page design, and deployed site transfer as distinct operations. A code deployment does not copy local CMS content to a remote database.
- For multilingual sites, use EmDash's native row-per-locale model linked by translation groups. Never create duplicate language fields (e.g. title_en, content_en) on a single collection row. Set prefixDefaultLocale: false in astro.config.mjs to keep the EmDash admin functional. See docs/internationalization.md.

## Starter standards and optional design interchange

- **Stage 4.5 component calibration:** After saving the art direction and before broad page assembly, calibrate primitives on `/_styleguide` and record evidence in `audit/component-calibration.md` (`npm run design:tokens -- --write-calibration`). Follow `.agents/skills/astro-site-design/references/component-quarantine.md` for open structural slots, semantic composites, and surface-aware actions.
- **Asset provenance & native image delivery:** Download site content imagery to `src/assets/` or the EmDash Media Library — never directly to `public/`. Document unchanged-URL passthrough exceptions (favicons, `robots.txt`, fonts) and prefer Astro `<Image>` / `<Picture>` / `getImage()` with EmDash's storage-backed media endpoint (`docs/image-delivery.md`).
- **Partner & gallery primitives:** Compose `Card`, `PartnersPanel`, `LogoTicker`, `ResponsiveImage`, `EditorialImage`, `PhotoGallery`, `RichText`, and bounded form recovery (`docs/reusable-public-patterns.md`). `LogoTicker` accepts only trusted, noninteractive, ID-free list items without scripts, islands, or edit proxies; linked/editor-owned partners use an unduplicated list.
- **Certified baseline & registry:** Scoped certified baseline is Astro `7.4.0` / EmDash `1.3.0` on Node `22.22.2+` or `24.15+` (Node 24 LTS recommended; see `standards/manifest.json` and `docs/starter-meta-review.md`). Current development tooling requires Node `^22.22.3 || ^24.16.0 || >=26.3.0`; the older scoped certification is historical evidence, not a claim that the new lint tool runs below this floor. `docs/design-interchange.md` defines the optional `DESIGN.md` bridge; `AGENTS.md` and `src/styles/global.css` retain authority. Complete new sites with `npm run site:register` (`docs/site-registry.md`).
- **Framework docs MCP & local visual regression:** Consult Astro Docs MCP and EmDash Docs MCP against installed versions (`docs/agent-documentation.md`). Run `npm run test:visual` locally on Windows only (`docs/visual-regression.md`); never run visual regression in automated CI or production builds.

## Day-2 client changes and maintenance

When modifying an existing, deployed site in response to client change requests, preserve the token and primitive hierarchy:

- **Global visual changes** (radii, brand colors, typography, fluid spacing): update existing `@theme` scales for a deliberate whole-site change. For structural spacing relationships use regular `:root --layout-*` aliases; for a regional request use a layered contextual alias, then a primitive gap prop or utility for a single instance. Preview `npm run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.75)" --json`; add `--write` only after reviewing the candidate, or `--write --write-calibration` for saved-source evidence. CSS is the sole configuration store; no spacing admin panel is needed. Run token checks and rendered acceptance; align the client's Art Direction Record if core physics shift. See `docs/design-framework.md` for scope recipes and bounded expression support.
- **Component styling and variants** (cards, media frames, buttons, tickers): modify primitives in `src/components/` (e.g. `Card.astro`, `Grid.astro`) rather than scattering one-off overrides in page templates. Verify styleguide specimens via `npm run test:design` or on `/_styleguide`.
- **Layout and section refactoring** (e.g., converting a grid into a bento or timeline): compose using existing layout primitives (`<Section>`, `<Container>`, `<Grid>`) and semantic CSS referencing existing tokens (`--spacing-grid`, `--radius-card`). Do not introduce arbitrary pixel values or breakpoint soup.
- **New pages and section additions**: Distinguish editor-managed content (add entries to existing CMS collections or Markdown content) from structural routes (create in `src/pages/`). For new routes and sections, wrap in `Base.astro`, compose with layout primitives (`<Section>`, `<Container>`, `<Grid>`), vary section pacing and background surfaces to avoid repetitive stacking, and bind CMS edit proxies (`{...entry.edit.*}`) when EmDash-backed.
- **Navigation & menu sync**: When adding, renaming, or removing routes, update site navigation links in `Base.astro`, shared navigation configs, or EmDash CMS menus and `seed/seed.json`.
- **Asset placement**: Place new photographic or vector assets in `src/assets/` using `<ResponsiveImage>` or native Astro `<Image>`, or upload them into the EmDash Media Library. Never place site content imagery directly into `public/`.
- **Renaming or removing routes**: Always preserve SEO and existing links by adding 301 redirects (via `redirects` in `astro.config.mjs` for static sites or EmDash redirect middleware for CMS sites).
- **Verification:** Always run `npm run verify` (lint, art direction, token audits, typecheck, tests) before submitting changes.

## Production runtime hardening

- CMS/raw/plugin/nested flags use `src/lib/cms-flag.ts`: `isCmsFlagSet` accepts true/1; `isCmsFlagEnabled` defaults nullish optional opt-outs on and otherwise requires true/1. Avoid strict true checks or general truthiness at these boundaries. Declared loader booleans are normalized in EmDash 1.3; arbitrary nested/plugin/raw values are not. Malformed strings fail closed.
- Follow `docs/cloudflare-backup-restore.md` before production mutations: record a D1 recovery bookmark (plan-specific retention), media snapshot and full encryption-key escrow receipt. `site export --output file.emdash` transfers content into an empty target; it is not DR. Never reset production to fix authentication/imports.
- Follow `docs/edge-cache-lifecycle.md` for explicit HTML TTLs, no HTML SWR, client toolbar, seven-day immutable asset carry-forward, URL exclusions and real publish/purge/scheduler checks. URL normalization is opt-in after checking public slugs. Keep Node/SQLite and static profiles independent from Cloudflare.
- Follow `docs/newsletter-architecture.md` for POST-only consent, scanner-safe GET/HEAD, signature-first exact domain isolation, known-subscriber-only updates and idempotency. Preserve optional providers/plugins until site acceptance.
- Starter functional/metadata changes preserve visual tokens and presentation; exact LF hash exceptions in `audit/design-gate-exceptions.json` document infrastructure scope. No client art direction is invented for this hardening.
