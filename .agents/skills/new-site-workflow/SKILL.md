---
name: new-site-workflow
description: Coordinate the staged conversion of this Astro and EmDash starter into a real site. Use when starting a new site, planning a full rebuild, or resuming work that affects several site disciplines; route each stage to the relevant specialist skill instead of replacing those skills.
---

# New site workflow

Turn the neutral starter into a coherent, content-backed site by sequencing the specialist skills. This skill owns the order, decisions, and handoffs. It does not duplicate their implementation guidance.

## Start here

1. Read `README.md`, `AGENTS.md`, the installed tooling, and the current repository state.
2. Use the package manager matching the lockfile to run `sync:emdash-skills` (defaults to staging), and review the staged diff before relying on the mirrored `building-emdash-site`, `creating-plugins`, or `emdash-cli` skills. Follow `docs/skill-synchronization.md`: check/stage/apply, preserve local drift and licenses, and never replace dirty mirrors merely to satisfy a refresh. Use the checked-in snapshot with an explicit pending-sync note when resolution is not yet reviewed.
3. Check that the shared skill sync is available before relying on it. If `sync:site-skills` exists in `package.json`, run it when the starter's shared Vermeulen-maintained skills need updating. If the package script is absent but `scripts/sync-site-skills.mjs` exists, run that helper directly and repair the package script. If both are absent, this repository predates the sync mechanism: use the checked-in skill snapshot for the current task, record that the repository needs bootstrapping from the canonical starter, and do not claim that the shared skills are synchronized.
4. Identify the earliest unfinished stage below. Preserve valid decisions and completed work from earlier stages rather than restarting automatically.
5. Load each specialist skill when its stage begins. Do not load every skill up front.

Keep a concise site record in `AGENTS.md`: purpose, audiences, languages, content sources, routes and content types, hosting/runtime choices, visual direction, and material deviations from this starter. For a large site, put detailed inventories in a focused project document and link it from `AGENTS.md`.

## Stage 1: establish the brief and evidence

Determine what is being built before changing the starter:

- site purpose, primary audiences, and important user tasks;
- greenfield build, redesign, or migration;
- required locales and default locale;
- known routes, content sources, editorial needs, integrations, and behaviors;
- existing identity, imagery, source sites, competitors, and other visual references;
- delivery constraints, including hosting or runtime requirements already decided by the user.

For a rebuild or migration, use `wordpress-to-emdash-content` when WordPress content, media, forms, or builder behavior is in scope. Use the migration audit required by `astro-site-design` to inspect the rendered source and record what to preserve or improve. Do this before designing replacements.

For WordPress migrations, the evidence inventory must include a content-candidate register for repeated or independently managed material that is not necessarily a registered custom post type. Record the source evidence, proposed model, migration method, confidence, and open questions for each candidate. Keep a substantial register in `audit/content-candidate-register.md` and link it from `AGENTS.md`; a small migration may keep it directly in `AGENTS.md`.

**Gate:** the repository contains a brief, an evidence inventory, and—when migration is in scope—a content-candidate register sufficient to distinguish facts, user decisions, and open assumptions.

## Stage 2: decide the platform shape

Use `emdash-site-setup` for runtime, hosting, storage, localization, deployment, and site-transfer decisions. Decide these independently from plugin needs. Use `creating-plugins` only when requirements demonstrate that a plugin is needed.

Record decisions that constrain later stages, especially locale URL behavior, deployment target, media storage, and whether content will be imported or authored fresh.

**Gate:** later work has a known runtime and localization model. Deferred deployment details are explicitly marked and do not block local design work unless they affect architecture.

## Stage 3: model content and routes

Use `emdash-content-modeling` to design normalized collections, select enums, relationships, native row-per-locale structures, and squad/team architecture. Use `building-emdash-site` for schema registration syntax, Portable Text rendering, live collection configs, and queries. Use `wordpress-to-emdash-content` first for import mappings when applicable. Use `emdash-cli` only for operations against the local or remote EmDash instance.

Use the content-candidate register to classify every repeated editorial element as an EmDash collection, page/Portable Text content, a site setting, plugin or integration data, or deliberately excluded content. Model collection candidates with fields, relationships, ordering, taxonomies, locale behavior, and route ownership rather than hardcoding page markup. If a candidate is only raw HTML, a builder repeater, or opaque plugin data, document the extraction or mapping needed instead of assuming the importer will infer it. Identify which page archetypes are standard single-measure sections (`<Container width="reading|content|wide">`) versus long-form editorial articles, case studies, or landing pages that interleave reading prose with wider callouts, figures, or galleries (`<Container breakout>` / `.content-grid`). Use representative real content, source content, or clearly identified editorial drafts to expose layout needs. Keep the seed useful for a fresh installation; do not treat it as a deployment migration.

**Gate:** every planned page archetype and content candidate has a source, target representation, migration method, route or placement, container/breakout model, and editorial ownership model. No repeated editorial material remains unclassified. The art-direction stage has realistic content shapes and known imagery to design around.

## Stage 4: set the art direction

When entering Stage 4, present a brief, one-time **Design Superpowers Capability Prompt** before authoring visual styles (unless the user has already chosen a workflow):

> **Stage 4: Visual Direction & Concepting**
> How would you like to explore visual concepts and component patterns for this site?
> 1. **(Default) Code-First & In-Browser:** Pick a curated Aesthetic Lane and tune tokens live on `/_styleguide` with the Dev HUD (`T` / `B` / `G`). *(Zero extra setup)*
> 2. **UX Flow & Anatomy Teardowns (`Nicelydone` / `Refero` / `Kombai`):** Inspect real production web screens to extract authentic UX details and section pacing before styling.
> 3. **Community `DESIGN.md` Systems & Visual Concepting (`designmd-mcp` + `Google Stitch` / `OpenDesign` / `Claude Design`):** Search 420+ free `DESIGN.md` design systems on [designmd.ai/explore](https://designmd.ai/explore), generate 2–3 screen concepts in `audit/visual-concepts/`, and bridge tokens via `@google/design.md`.
> 4. **High-Craft Component Registry (`21st.dev MCP`):** Pull tested Tailwind component blueprints into `/_styleguide` for zero-JS Astro transmutation in Stage 4.5.
> *(Reply with `1` or "skip" to proceed immediately in code, or ask for `.mcp.example.json` setup snippets.)*

Use `site-art-direction` with the brief, source audit, content model, real assets, and relevant references. Select a primary lane from `references/aesthetic-lanes.md`, or Custom / existing brand with a rationale when those lanes do not fit. Define the narrative metaphor, typography, color physics, spatial density, section pacing rhythm, and explicit anti-patterns.

Do not start broad visual implementation from the starter's neutral defaults. First record the approved direction or explicitly labeled working assumption in `AGENTS.md` following the mandatory Art Direction Record schema and canonical gate in `AGENTS.md`; use a linked project document when the direction needs substantial visual references or component detail.

For Stackable, Elementor, Blocksy builder, or similar migrations, explicitly classify the source visual language as preserve, refine, or overhaul. If the source is visually weak or the new premise materially departs from it, run the visual concept pass in `site-art-direction` before broad implementation: develop two or three concepts for a representative archetype using real content shapes and known assets, compare them against the brief and source identity, and document the selected direction. Use the harness's available image-generation or visual prototyping capability (such as `designmd-mcp`, Stitch, OpenDesign, or Claude Design) when useful; ensure any prompt embeds the narrative metaphor. Do not treat generated concepts as exact implementation specifications.

> [!CAUTION]
> **ART DIRECTION GATE:** Before Stage 5 site-specific visual implementation, save the complete record and pass `npm run check:art-direction -- --require-record`. Follow the scope and exceptions in `AGENTS.md`; route planning is permitted earlier, visual template implementation is not. Saving to disk does not require a Git commit. CLI/CI check outcomes, not pre-write prevention.

**Gate:** `AGENTS.md` contains the saved `## Art Direction Record` with all required fields (Aesthetic Lane selected from `references/aesthetic-lanes.md` or Custom / existing brand with rationale, Narrative Metaphor, Typography Pairing, Token Physics, and Site Anti-Patterns). For an overhaul migration, the concept pass is complete, the selected direction is recorded, and the preserved source identity and deliberate changes are explicit.

## Stage 4.5: calibrate components before page assembly

For URL/screenshot migrations or external component sourcing (such as `21st.dev MCP`), follow `astro-site-design/references/component-quarantine.md` after Stage 4 and its art-direction gate. Inspect representative source elements or candidate registry blueprints, then calibrate relevant tokens, states, and production primitives on `/_styleguide` before creating client page templates or bespoke sections — including `<Container width="reading|content|wide">` versus `<Container breakout>` (`.content-grid` with `.content--feature|wide|full|full-safe`), `<Card>` (`--card-*` custom properties, concentric radius math, and `.clickable-parent`/`.focus-parent` accessibility), and Smart Spacing (`.flow`). When sourcing external React/Tailwind components (e.g., from `21st.dev`), transmute them through the quarantine checklist: strip unnecessary React/Framer Motion runtime down to zero-JS Astro markup, replace hardcoded palette classes with semantic tokens, bind fluid typography/spacing steps, and wire EmDash live edit proxies. For greenfield work, review the relevant primitive baseline against the brief and record inapplicable source comparisons.

Save `audit/component-calibration.md` with evidence, actual component APIs, supported surfaces/states, asset provenance, narrow/wide and keyboard/motion checks, unresolved gaps and ready/deferred decisions. Resolve material reusable-component gaps before broad assembly. Keep normal-build route exclusion and synthetic fixtures intact. Page findings may reopen calibration; this is not a permanent component freeze. Use written handoffs between passes; fork/archive chats only when the user requests it.

**Gate:** the calibration record identifies which patterns are ready for representative pages and why; relevant checks pass. No source cloning, un-quarantined React/palette bloat, invented APIs, fake CMS edit identities, or specimen-only CSS repairs.

## Stage 5: implement representative pages

When references are screenshots/mockups or interaction recipes, route through `astro-site-design/references/visual-mockup-workflow.md`. Keep measured facts, responsive assumptions and editorial ownership explicit. `AGENTS.md` is the project instruction bridge; harness-specific rules are not universal enforcement.

Use `astro-site-design` for the design system, Astro components, responsive behavior, accessibility, and browser review. Use `building-emdash-site` alongside it for EmDash queries, cache hints, media, Portable Text, menus, and editor integration.

Mount `<TweaksBar />` in `src/layouts/Base.astro` during development. Use it to calibrate display font scale, weights, density, and colors live in the browser rather than generating multi-turn CSS prompt churn. Merge exported CSS tokens into `src/styles/global.css`, reload to clear preview overrides, and verify typography, contrast, and responsiveness against source styles. The bar is optional when unavailable and does not replace layout or hierarchy work.

Build the shell and one representative page from each materially different archetype before expanding across every route. Feed implementation findings back to the content model or art direction when real content exposes a weak assumption; update the site record when a decision changes.

Once representative pages render, load `impeccable` for a bounded visual critique of those routes. Use its critique and audit guidance to identify hierarchy, typography, spacing, responsive, accessibility, and interaction issues, then fix shared tokens or components before multiplying the pattern across the route inventory. Treat the critique as implementation evidence alongside the brief and source audit; it does not replace those inputs or authorize changing preserved content facts.

**Gate:** representative pages work with real content at mobile, intermediate, and wide viewports, and establish reusable patterns for the remaining routes. The main visual findings from the Impeccable pass are resolved or recorded.

## Stage 6: complete and verify

Finish the route inventory, content states, interactions, metadata, and accessibility behavior. Follow the visual review and repair passes in `astro-site-design`, and run one final Impeccable critique or audit when the full route set is available. Fix material cross-route findings in shared styles or components, then stop once the review is coherent. Run the repository's requested checks and build. Verify public and editor modes for CMS-rendered content.

Use `emdash-site-setup` again for deployment and site transfer. Treat deployment of code and transfer of CMS data as separate operations.

**Gate:** every required route and distinct state is accounted for; material visual, content, responsive, accessibility, and editor-mode findings are resolved or explicitly documented.

Before declaring a new-site workflow complete, use `npm run site:register` with the actual stable site/repository/runtime/owner and starter version metadata. Follow `docs/site-registry.md`: submit a reviewed private registry change, or retain the ignored pending-registration artifact and record its reason when central access is unavailable. Reuse the same site ID for renames; do not publish private client details in the starter or invent a stable release for an unreleased checkout.

## Stage 7: production cutover, email & forms

Use `emdash-production-cutover` when moving a Cloudflare Workers site from preview/`workers.dev` to its production custom domain. Establish and test admin recovery before changing the authentication origin, configure the canonical hostname and alias redirects, and verify fresh production login. Preserve working email providers and form integrations; configure Cloudflare Email Sending or replace forms only when requested or required by established site requirements.

**Gate:** production custom domain resolves with valid TLS; required aliases preserve paths and queries; fresh admin login works through the configured authentication mode; corporate mail DNS remains intact; applicable email/form delivery checks pass; rollback configuration and observed verification results are recorded.

## Working with partial requests and ongoing evolution

If the user requests only one stage, perform that stage without forcing a complete site build. Check its upstream inputs, state any consequential assumptions, and revisit downstream stages only when the change invalidates them. A later-stage request does not authorize inventing missing brand, content, or deployment decisions.

### Evolving content on an existing site
When modifying, normalizing, or pruning content models on a site that already has content:
- Do not restart from Stage 1 or wipe existing databases.
- Use `emdash-content-modeling` in brownfield evolution mode to perform schema audits, write zero-downtime data migration scripts, implement dual-read template fallbacks, maintain 3-way parity (local SQLite, remote D1, seed), and synchronize menus.
