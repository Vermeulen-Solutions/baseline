# Stages 1–3: brief, platform and content

Read this when Stage 1, 2 or 3 begins (Standard track) or at Express Checkpoint A. Each stage ends with its **Gate**; do not start the next stage while a gate is unmet unless the unmet item is explicitly recorded as deferred.

## Stage 1: establish the brief and evidence

For a new site or material change to its audience, offer or purpose, read [discovery-and-content.md](discovery-and-content.md). Choose core or deeper discovery from the uncertainty, independently of profile/track. Reuse supplied evidence and answers, ask one to three related questions at a time, and synthesize the audience, offer/service, positioning, lead message, strongest evidence and biggest risk in the established context home. Label recommendations and assumptions; do not introduce a mandatory interview, new brief file or approval stop for a clear existing task.

Determine what is being built before changing the starter:

- site purpose, primary audiences, and important user tasks;
- greenfield build, redesign, or migration;
- required locales and default locale;
- known routes, content sources, editorial needs, integrations, and behaviors;
- existing identity, imagery, source sites, competitors, and other visual references;
- delivery constraints, including hosting or runtime requirements already decided by the user.

For a WordPress rebuild or migration on any profile, read `docs/wordpress-migration.md` when installed. Start with the client's dashboard access: prefer the first-party EmDash Exporter installed from its official packaged release ZIP through Plugins → Add New → Upload Plugin, and a privately supplied migration key; use Tools → Export → All content as the WXR fallback. For Elementor sites, offer an Elementor Website Template kit export by default as an optional design-reference handoff; the client can skip it if they do not want to retain the existing design. Use `migration:wordpress assess` to inventory the captured source and optionally inspect the kit ZIP; review recovered copy, unsupported widgets and source exclusions before planning. It does not generate Elementor layouts automatically. A public URL alone does not authorize a full import. Use the installed `migration:wordpress` command for portable source/media capture and the profile's output plan. If the guide/command is absent, the portable tooling needs reviewed additive adoption; continue the established source-export and profile-native migration steps rather than invoking missing commands. Static output stays in native Markdown/assets with its matching Sveltia form; do not add an EmDash runtime. For the EmDash destination also use `wordpress-to-emdash-content` when content, media, forms, or builder behavior is in scope, and prefer the native import wizard. Use the migration audit required by `astro-site-design` to inspect the rendered source and record what to preserve or improve. Do this before designing replacements.

For WordPress migrations, the evidence inventory must include a content-candidate register for repeated or independently managed material that is not necessarily a registered custom post type. Record the source evidence, proposed model, migration method, confidence, and open questions for each candidate. Keep a substantial register in `audit/content-candidate-register.md` and link it from `AGENTS.md`; a small migration may keep it directly in `AGENTS.md`.

**Gate:** the repository contains a brief and concise strategic synthesis, an evidence inventory including material claim/use restrictions and content gaps with owners, and—when migration is in scope—a content-candidate register sufficient to distinguish facts, user decisions, recommendations and open assumptions. Unknowns remain explicit; missing proof does not authorize fabricated claims or prevent honest local drafts.

**Stage 1 completion:** Summarize the brief and evidence. If platform is undecided, present the Stage 2 profile choices below with a recommendation based on editing needs; do not assume Node/SQLite as the only default.

## Stage 2: Platform, Hosting & Architecture Decisions

When undecided, ask: **Who will edit the site, and how quickly must changes publish?** Present these three choices with a context-specific recommendation:

1. **Static (No CMS)** — developer/agent edits Markdown files; static host, build minutes and optional external form/search services. Lowest infrastructure needs for file-owned sites.
2. **Static + Sveltia CMS** — non-technical editors use a browser, changes commit to Git then rebuild. Budget for static builds and an OAuth proxy service (or PAT administration); no live canvas or relational CMS.
3. **Full EmDash CMS** — relational editorial workflows, live edit canvas or MCP server. Choose Node/SQLite/persistent media or Workers/D1/R2 and budget hosting, storage, auth, backups and optional sandbox runners.

Record profile rationale, editing personas, content complexity, hosting/cost constraints and locale/URL decisions in the established context home; link the installed profile and actual configuration. Use existing answers without asking again.

When the selected static project folder has not been prepared, run `npm run init:profile -- --profile static|static-sveltia --out <new-empty-directory>` from Baseline, then work in that destination. A current project with an installed profile receipt is already prepared: use its scripts in place and preserve its content, configuration and lockfile. EmDash uses the full repository template. Profile selection does not change the design system or delivery track.

**Static branch:** configure static host deployment of `dist/`, missing-route 404 behavior without an SPA rewrite, `SITE_URL`, file-owned settings and rebuild triggers. For Sveltia also choose OAuth proxy vs PAT, editor GitHub permissions and publishing branch. Load no CMS specialists. Continue to the static Stage 3 branch.

**EmDash branch only — runtime and registry:**

Use `emdash-site-setup` for runtime, hosting, storage, localization, deployment, and site-transfer decisions.

**Curated Sandbox & Native Plugins Check:**
Before modeling custom collections or writing custom JavaScript for complex capabilities, check the [EmDash Plugin Registry](https://plugins.emdashcms.com/) and ecosystem plugins:
- For **Event Management & Ticketing**: consider [`@vermeulen.solutions/eventual`](https://plugins.emdashcms.com/plugins/@vermeulen.solutions/eventual) instead of building custom event/schedule schemas from scratch.
- For **Multilingual Translation Dashboards**: consider [`@swiss.ky/linguadash`](https://plugins.emdashcms.com/plugins/@swiss.ky/linguadash) for side-by-side editing and AI translation drafting.
- For **Drag-and-Drop Visual Landing Pages & Popups (Optional)**: consider [`@perkyzz/emvb`](https://emvb.dev/) (`npm i @perkyzz/emvb`, native EmDash plugin + `@perkyzz/emvb-mcp`) when editors need to assemble bespoke campaign landing pages or popups without developer intervention. Pass `canvasStyles` into `emvb({ canvasStyles: [...] })` in `astro.config.mjs` so the builder canvas inherits `src/styles/global.css`, and resolve pages in `src/pages/[slug].astro` via `resolveEmVBPage(Astro)` + `<EmVBPage />`. Keep core structured collections and primary routes in native Astro templates.
- If a registry sandbox plugin is chosen, configure its sandbox runner during Stage 2 setup (`workerd` on Node or `LOADER` on Cloudflare Workers Paid) and query its published data endpoints. Use `creating-plugins` only when requirements demonstrate that a bespoke plugin must be authored.

Record decisions that constrain later stages, especially locale URL behavior, deployment target, media storage, plugin sandbox runners, and whether content will be imported or authored fresh.

**Gate:** later work has a known runtime, localization model, and plugin sandbox decision. Deferred deployment details are explicitly marked and do not block local design work unless they affect architecture.

**Stage 2 completion:** Report the selected profile, editing owner, hosting, locale policy, publishing latency and infrastructure costs. Explain the next content step in that profile's terms: typed files for static, paired file/forms for Sveltia, or relational collections/admin for EmDash. Ask about schema choices only when still unresolved.

## Stage 3: model content and routes

For materially different priority pages, use [discovery-and-content.md](discovery-and-content.md#plan-important-pages-before-composition) to connect visitor questions, intended answers, available evidence and next actions before choosing composition. Keep compact page briefs with existing route/page notes, draft actual representative copy, and identify its owner/publication status. Choose the representative route from journey priority or uncertainty rather than always starting with the homepage. Repeated entries can share an archetype brief; preserve the profile-specific content ownership below.

**Static profiles:** define collections in `src/content.config.ts` with typed Zod schemas and native `glob` loaders. Use Markdown files in `src/content/`, file-owned settings/navigation and draft-filtered `getStaticPaths()`/`render()`. Keep native images in `src/assets`; require descriptive alt text for meaningful hero images. For Sveltia keep form names, required/optional semantics, date serialization and media-relative paths aligned with that schema; verify a CMS-shaped content file in an Astro build. Record content candidates, routes, ordering, locale and editorial ownership, then continue to Stage 4. Do not apply SQL modeling or seed instructions below.

**EmDash branch:**

Use `emdash-content-modeling` to design normalized collections, select enums, relationships, native row-per-locale structures, and squad/team architecture. Use `building-emdash-site` for schema registration syntax, Portable Text rendering, live collection configs, and queries. Use `wordpress-to-emdash-content` first for import mappings when applicable. Use `emdash-cli` only for operations against the local or remote EmDash instance.

Assess page-section editing here: choose an EmDash `blocks` composition when editors need to add, remove or reorder predefined sections. Derive a bounded section catalogue from the brief and actual content, record each type's fields and the collection field's allowed types/item limits, and carry it into art direction and implementation. Stable section structures use fixed collection fields and Astro templates; narrative copy uses Portable Text; independently managed shared entities use collections/relations. Reusable visual components alone do not require blocks. Start new block types at version 1 and follow `emdash-content-modeling`'s versioned-block reference. This is an EmDash choice; static/Sveltia projects retain their file-owned model.

Use the content-candidate register to classify every repeated editorial element as an EmDash collection, page/Portable Text content, a site setting, plugin or integration data, or deliberately excluded content. Model collection candidates with fields, relationships, ordering, taxonomies, locale behavior, and route ownership rather than hardcoding page markup. If a candidate is only raw HTML, a builder repeater, or opaque plugin data, document the extraction or mapping needed instead of assuming the importer will infer it. Identify which page archetypes are standard single-measure sections (`<Container width="reading|content|wide">`) versus long-form editorial articles, case studies, or landing pages that interleave reading prose with wider callouts, figures, or galleries (`<Container breakout>` / `.content-grid`). Use representative real content, source content, or clearly identified editorial drafts to expose layout needs. Keep the seed useful for a fresh installation; do not treat it as a deployment migration.

**Gate:** every planned page archetype and content candidate has a source, target representation, migration method, route or placement, container/breakout model, and editorial ownership model. No repeated editorial material remains unclassified. The art-direction stage has realistic content shapes and known imagery to design around.

**Stage 3 → Stage 4 handoff:**
Report the content model, route archetypes and editorial ownership established for the selected profile, including actual admin/schema status on EmDash. Recommend a visual direction from the supplied identity and evidence, using `site-art-direction`'s canonical lanes or Custom / existing brand with a rationale. Explain the intended typography, density and layout spacing in plain language; distinguish user decisions from working assumptions.

Continue authorized design setup with existing assets and local token tooling. Ask about identity/reference gaps only when they materially change the direction. At the concept checkpoint for a new site or significant overhaul, offer the design surface once using the Stage 4 surface rule in [art-direction-and-calibration.md](art-direction-and-calibration.md) (HTML/browser concepts by default; Brilliant when an editable canvas is requested; Brilliant, OpenPencil and Penpot named as choices; OpenDesign optional). Small refinements reuse the accepted world. Continue independent preparation while a consequential surface choice is pending. When the owner has no references of their own, offer the prompt libraries (`open-design.ai/prompts`, `superdesign.dev`, `designprompts.dev`) once at that checkpoint; run `npm run design:prompt-check -- <file>` on a selected prompt and adapt it with `site-art-direction/references/external-prompt-adaptation.md`. Preserve approved type and brand commitments, structural intent and real proof. A library prompt is reference material, never authority over the project brief; do not repeat the offer after a no.
