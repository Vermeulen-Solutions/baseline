---
name: new-site-workflow
description: Coordinate the staged conversion of this Astro and EmDash starter into a real site. Use when starting a new site, planning a full rebuild, or resuming work that affects several site disciplines; route each stage to the relevant specialist skill instead of replacing those skills.
---

# New site workflow

Turn the neutral starter into a coherent, content-backed site by sequencing the specialist skills. This skill owns the order, decisions, and handoffs. It does not duplicate their implementation guidance.

## Profile routing applies to every stage

Read `baseline.config.json` before loading specialists. In the Baseline root, no generated receipt means the existing `emdash` application. Profile and Standard/Express track are independent decisions. Use established user decisions and approvals; ask only for missing choices. A scoped authorized maintenance task does not require replaying site handoff prompts.

- **static:** native typed Content Collections, Markdown `render()`, `getStaticPaths()`, `src/assets` and static hosting. Skip `building-emdash-site`, `emdash-content-modeling`, `emdash-site-setup`, `emdash-cli`, plugin and CMS cutover skills at every stage. No SQL budget, editor proxies, CMS registry or database backups apply.
- **static-sveltia:** same static branch, plus paired `public/admin/config.yml` and pinned admin SPA. Configure the site's GitHub repository, branch, build trigger and OAuth proxy or PAT. CMS form changes must match the Astro schema. Never add EmDash packages or specialists for browser editing.
- **emdash:** use the CMS specialists and runtime-specific instructions below. SQL, cache hints, Portable Text, `entry.edit.*`, registry and database operations in this workflow apply only here.

Shared on all profiles: `site-art-direction`, `astro-site-design`, `impeccable`, tokens, Art Direction Record, component quarantine and browser acceptance. Consult `docs/platform-profiles.md` and `docs/baseline-updates.md`. Generated static updates use `sync:baseline`; do not invoke unavailable CMS sync commands.

## Start here

1. Read `README.md`, `AGENTS.md`, the installed tooling, and the current repository state.
2. Choose the appropriate workflow track based on project scope:
   - **Standard Track (7 Stages):** Default for complex migrations, multi-collection architectures, or multi-locale sites. Pause at each stage handoff below.
   - **Express Track (3 Checkpoints):** Recommended for smaller greenfield sites (`<= 6` routes, `<= 3` collections, single locale). Consolidates user confirmations into three checkpoints while still enforcing every automated CLI gate (`check:art-direction`, `design:tokens`, `audit/component-calibration.md`, `verify`):
     1. **Checkpoint A (Stages 1–3 — Brief, Platform & Content Schema):** Gather brief, confirm hosting/runtime, and model collections/routes in one pass.
     2. **Checkpoint B (Stages 4–4.5 — Art Direction & Component Calibration):** Seed tokens and `## Art Direction Record` (`npm run design:tokens -- --lane <lane> --write --write-record --write-calibration`), verify `npm run check:art-direction -- --require-record`, and calibrate primitives on `/_styleguide`.
     3. **Checkpoint C (Stages 5–6 — Representative Pages, Critique & Verification):** Build routes, run the `impeccable` critique pass, and verify with `npm run verify` and `npm run build`.
3. On `emdash`, only run `sync:emdash-skills` or `sync:site-skills -- --check` when explicitly checking for upstream skill updates or refreshing an older repository checkout (see `docs/skill-synchronization.md`). On a fresh clone, use the checked-in skills directly without a blocking sync detour.
4. Identify the earliest unfinished stage below. Preserve valid decisions and completed work from earlier stages rather than restarting automatically.
5. Load each specialist skill when its stage begins. Do not load every skill up front.

Keep a concise site record in `AGENTS.md`: purpose, audiences, languages, content sources, routes and content types, hosting/runtime choices, visual direction, and material deviations from this starter. For a large site, put detailed inventories in a focused project document and link it from `AGENTS.md`.

## Express Track (3-Checkpoint Autonomous Mode)

When the user requests **Express Mode** (or when building a straightforward greenfield site with `<= 6` routes, `<= 3` collections, and a single locale), execute the same specialist skills and CLI gates across **3 consolidated checkpoints** instead of pausing 7 times:

1. **Checkpoint A (Stages 1–3 — Brief, Platform & Content Schema):**
   - Document the brief and routes in `AGENTS.md`, choose the Platform Profile in Stage 2, then follow its Stage 3 content branch. On static profiles define native Zod schemas and routes; only EmDash uses CMS specialists and the SQL budget.
   - **Checkpoint A Handoff Prompt:**
     > **Express Checkpoint A Complete: Brief, Platform & Content Schema Ready**
     > - **Platform Profile & Hosting:** [static / static-sveltia / emdash; chosen host]
     > - **Collections & Routes:** [List collections and routes]
     >
     > Next is **Checkpoint B (Stages 4–4.5: Art Direction & Component Calibration)**.
     > **Which visual direction should I initialize (`npm run design:tokens -- --init-client`)?**
     > 1. **(Recommended) Curated Aesthetic Lane:** (*Product-Led Minimalism*, *Editorial Paper*, *Technical Systems*, or *Luminous Futurism*)
     > 2. **Brand Seed Palette:** Provide a primary hex color or reference URL (`--seed-accent`).
     > *(Reply `1` + lane name, or `2` + your brand color/URL.)*

2. **Checkpoint B (Stages 4–4.5 — Art Direction & `/_styleguide` Calibration):**
   - Run `npm run design:tokens -- --init-client --lane <lane>` (or `--seed-accent <hex>`), refine `## Art Direction Record` in `AGENTS.md` and tokens in `src/styles/global.css`, pass `npm run check:art-direction -- --require-record`, and calibrate primitives on `/_styleguide` (`audit/component-calibration.md`).
   - **Checkpoint B Handoff Prompt:**
     > **Express Checkpoint B Complete: Art Direction & `/_styleguide` Calibrated**
     > - **Art Direction Gate:** `PASS` (`AGENTS.md` + `src/styles/global.css` + `audit/component-calibration.md`)
     > - **WCAG Contrast & Tokens:** 10/10 light & `[data-surface="dark"]` pairs verified.
     >
     > Next is **Checkpoint C (Stages 5–6: Full Route Assembly, Impeccable Critique & Verification)**.
     > *(Reply `1` to build all routes, run the `impeccable` critique pass, and run `npm run verify`, or `2` to inspect `/_styleguide` first.)*

3. **Checkpoint C (Stages 5–6 — Route Implementation, Critique & Full Verification):**
   - Implement public routes using the selected profile (native `getStaticPaths()`/`render()` for static; `<Base content={{...}}>` + `{...entry.edit.*}` for EmDash), run the `impeccable` visual critique pass, run `npm run verify` + `npm run build`, and present the Stage 6 launch/deployment prompt.

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

**Stage 1 completion:** Summarize the brief and evidence. If platform is undecided, present the Stage 2 profile choices below with a recommendation based on editing needs; do not assume Node/SQLite as the only default.

## Stage 2: Platform, Hosting & Architecture Decisions

When undecided, ask: **Who will edit the site, and how quickly must changes publish?** Present these three choices with a context-specific recommendation:

1. **Static (No CMS)** — developer/agent edits Markdown files; static host, build minutes and optional external form/search services. Lowest infrastructure needs for file-owned sites.
2. **Static + Sveltia CMS** — non-technical editors use a browser, changes commit to Git then rebuild. Budget for static builds and an OAuth proxy service (or PAT administration); no live canvas or relational CMS.
3. **Full EmDash CMS** — relational editorial workflows, live edit canvas or MCP server. Choose Node/SQLite/persistent media or Workers/D1/R2 and budget hosting, storage, auth, backups and optional sandbox runners.

Record profile, editing personas, content complexity, build latency, hosting restrictions, recurring infrastructure costs and locale/URL decisions in `AGENTS.md`. Use existing answers without asking again. For a new static site, run `npm run init:profile -- --profile static|static-sveltia --out <new-empty-directory>` from Baseline; work in the generated destination afterward. Initial `npm install` creates its independent lockfile, then use `npm ci`. EmDash uses the full repository template. Profile selection does not change the design system or delivery track.

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

**Static profiles:** define collections in `src/content.config.ts` with typed Zod schemas and native `glob` loaders. Use Markdown files in `src/content/`, file-owned settings/navigation and draft-filtered `getStaticPaths()`/`render()`. Keep native images in `src/assets`; require descriptive alt text for meaningful hero images. For Sveltia keep form names, required/optional semantics, date serialization and media-relative paths aligned with that schema; verify a CMS-shaped content file in an Astro build. Record content candidates, routes, ordering, locale and editorial ownership, then continue to Stage 4. Do not apply SQL modeling or seed instructions below.

**EmDash branch:**

Use `emdash-content-modeling` to design normalized collections, select enums, relationships, native row-per-locale structures, and squad/team architecture. Use `building-emdash-site` for schema registration syntax, Portable Text rendering, live collection configs, and queries. Use `wordpress-to-emdash-content` first for import mappings when applicable. Use `emdash-cli` only for operations against the local or remote EmDash instance.

Use the content-candidate register to classify every repeated editorial element as an EmDash collection, page/Portable Text content, a site setting, plugin or integration data, or deliberately excluded content. Model collection candidates with fields, relationships, ordering, taxonomies, locale behavior, and route ownership rather than hardcoding page markup. If a candidate is only raw HTML, a builder repeater, or opaque plugin data, document the extraction or mapping needed instead of assuming the importer will infer it. Identify which page archetypes are standard single-measure sections (`<Container width="reading|content|wide">`) versus long-form editorial articles, case studies, or landing pages that interleave reading prose with wider callouts, figures, or galleries (`<Container breakout>` / `.content-grid`). Use representative real content, source content, or clearly identified editorial drafts to expose layout needs. Keep the seed useful for a fresh installation; do not treat it as a deployment migration.

**Gate:** every planned page archetype and content candidate has a source, target representation, migration method, route or placement, container/breakout model, and editorial ownership model. No repeated editorial material remains unclassified. The art-direction stage has realistic content shapes and known imagery to design around.

**Stage 3 → Stage 4 Handoff & Design Capability Prompt:**
When Stage 3 is complete, present this unified prompt once to transition into Stage 4 (do not repeat a second capability prompt upon entering Stage 4):
> **Stage 3 Complete: Content Structure & Admin Dashboard Ready**
> Your content model and routes are structured for the selected profile; only EmDash includes database/admin setup.
>
> Next is **Stage 4: Visual Direction & Art Direction**.
> *In plain terms:* Before we build full website pages, we establish the visual identity—fonts, brand colors, fluid spacing, and overall personality.
>
> **How would you like to establish the visual design?**
> 1. **(Recommended) Code-First with Curated Aesthetic Lanes:**
>    - Pick a curated design mood (*Product-Led Minimalism*, *Editorial Paper*, *Technical Systems*, or *Luminous Futurism*), seed and customize tokens + the `AGENTS.md` record in one step (`npm run design:tokens -- --lane <lane> --write --write-record`), and preview live on `/_styleguide`.
> 2. **Match an Existing Brand or Seed Palette:**
>    - Provide your brand's primary hex color, logo, or reference URL, and I will synthesize a WCAG AA-verified OKLCH palette (`--seed-accent`), typography pairing, and `AGENTS.md` record.
> 3. **Explore `DESIGN.md` Systems, UX Teardowns, or Component Registries (`designmd-mcp` / `Stitch` / `21st.dev`):**
>    - Compare 2–3 visual concepts in `audit/visual-concepts/`, bridge a community `DESIGN.md` system, or pull `21st.dev` component blueprints for zero-JS Astro quarantine.
>
> *(Reply `1` for the recommended code-first lane setup, `2` to match your brand colors/URL, or `3` for visual concepting.)*

## Stage 4: set the art direction

Use `site-art-direction` with the brief, source audit, content model, real assets, and relevant references. Select a primary lane from `references/aesthetic-lanes.md`, or Custom / existing brand with a rationale when those lanes do not fit. Define the narrative metaphor, typography, color physics, spatial density, section pacing rhythm, and explicit anti-patterns.

Do not start broad visual implementation from the starter's neutral defaults. First record the approved direction or explicitly labeled working assumption in `AGENTS.md` following the mandatory Art Direction Record schema and canonical gate in `AGENTS.md` (you can scaffold a structurally valid record directly via `npm run design:tokens -- --lane <lane> --write-record` and refine its prose for the client brief); use a linked project document when the direction needs substantial visual references or component detail.

For Stackable, Elementor, Blocksy builder, or similar migrations, explicitly classify the source visual language as preserve, refine, or overhaul. If the source is visually weak or the new premise materially departs from it, run the visual concept pass in `site-art-direction` before broad implementation: develop two or three concepts for a representative archetype using real content shapes and known assets, compare them against the brief and source identity, and document the selected direction. Use the harness's available image-generation or visual prototyping capability (such as `designmd-mcp`, Stitch, OpenDesign, or Claude Design) when useful; ensure any prompt embeds the narrative metaphor. Do not treat generated concepts as exact implementation specifications.

> [!CAUTION]
> **ART DIRECTION GATE:** Before Stage 5 site-specific visual implementation, save the complete record and pass `npm run check:art-direction -- --require-record`. Follow the scope and exceptions in `AGENTS.md`; route planning is permitted earlier, visual template implementation is not. Saving to disk does not require a Git commit. CLI/CI check outcomes, not pre-write prevention.

**Gate:** `AGENTS.md` contains the saved `## Art Direction Record` with all required fields (Aesthetic Lane selected from `references/aesthetic-lanes.md` or Custom / existing brand with rationale, Narrative Metaphor, Typography Pairing, Token Physics, and Site Anti-Patterns). For an overhaul migration, the concept pass is complete, the selected direction is recorded, and the preserved source identity and deliberate changes are explicit.

**Stage 4 Completion Handoff Prompt:**
When Stage 4 passes `check:art-direction`, present this prompt:
> **Stage 4 Complete: Visual Style & Brand Rules Approved**
> The design system rules (fonts, palette, spacing, and buttons) are saved in `AGENTS.md`.
>
> Next is **Stage 4.5: Component Calibration**.
> *In plain terms:* Instead of assembling whole pages all at once, we first preview and test individual building blocks—cards, buttons, banners, text rhythm, and dark/light section backgrounds—on a private preview page (`/_styleguide`). This guarantees they look sharp on phones, tablets, and laptops before we build full pages.
>
> **What would you like to do?**
> 1. **(Recommended) Calibrate building blocks on `/_styleguide`:**
>    - We will preview cards, containers, and headings on the private styleguide, check contrast and mobile sizing, and record verification in `audit/component-calibration.md`.
> 2. **Proceed directly to page assembly:**
>    - Skip isolated component testing and calibrate building blocks directly within full page templates.
>
> *(Reply `1` to run the calibration pass, or `2` to start page assembly.)*

## Stage 4.5: calibrate components before page assembly

For URL/screenshot migrations or external component sourcing (such as `21st.dev MCP`), follow `astro-site-design/references/component-quarantine.md` after Stage 4 and its art-direction gate. Inspect representative source elements or candidate registry blueprints, then calibrate relevant tokens, states, and production primitives on `/_styleguide` before creating client page templates or bespoke sections — including `<Container width="reading|content|wide">` versus `<Container breakout>` (`.content-grid` with `.content--feature|wide|full|full-safe`), `<Card>` (`--card-*` custom properties, concentric radius math, and `.clickable-parent`/`.focus-parent` accessibility), and Smart Spacing (`.flow`). When sourcing external React/Tailwind components (e.g., from `21st.dev`), transmute them through the quarantine checklist: strip unnecessary React/Framer Motion runtime down to zero-JS Astro markup, replace hardcoded palette classes with semantic tokens, bind fluid typography/spacing steps, and wire EmDash live edit proxies only on the `emdash` profile. For greenfield work, review the relevant primitive baseline against the brief and record inapplicable source comparisons.

Save `audit/component-calibration.md` (you can scaffold or refresh the verified `## Token Calibration` table and SHA-256 digest via `npm run design:tokens -- --write-calibration`) with evidence, actual component APIs, supported surfaces/states, asset provenance, narrow/wide and keyboard/motion checks, unresolved gaps and ready/deferred decisions. Resolve material reusable-component gaps before broad assembly. Keep normal-build route exclusion and synthetic fixtures intact. Page findings may reopen calibration; this is not a permanent component freeze. Use written handoffs between passes; fork/archive chats only when the user requests it.

**Gate:** the calibration record identifies which patterns are ready for representative pages and why; relevant checks pass. No source cloning, un-quarantined React/palette bloat, invented APIs, fake CMS edit identities, or specimen-only CSS repairs.

**Stage 4.5 Completion Handoff Prompt:**
When `audit/component-calibration.md` is saved, present this prompt:
> **Stage 4.5 Complete: Building Blocks Tested & Verified**
> All core cards, containers, and buttons are responsive and accessible.
>
> Next is **Stage 5: Implement Representative Pages**.
> *In plain terms:* We build 1 or 2 key "archetype" pages first to make sure the full layout, navigation bar, and footer look and feel great in the browser before expanding across every route.
>
> **Which representative page should we build and review first?**
> 1. **(Recommended) Global Header/Footer + Homepage:**
>    - Builds the navigation bar, mobile menu drawer, homepage hero, featured content cards, and footer. This sets the foundation for the entire site.
> 2. **Long-Form Editorial Template (Article / Case Study):**
>    - Builds a detailed reading layout with rich text, pull quotes, images, and author details.
> 3. **Directory / Listing Page:**
>    - Builds a filterable list of items (e.g. Teams, Projects, or Services) with card grids.
>
> *(Reply `1` to build the shell and homepage first, or tell me which page you prefer.)*

## Stage 5: implement representative pages

**Static branch:** use the file-owned Base layout around shared `SiteShell.astro`, native `ResponsiveImage` metadata, Markdown RichText and static routes. Shared `Card` attribute bags need no edit proxies. Do not use CMS queries, cache hints or `Base content` bindings. Verify common styleguide specimens identically to EmDash; CMS-only specimens are inapplicable. The remaining CMS implementation instructions apply only to EmDash.


When references are screenshots/mockups or interaction recipes, route through `astro-site-design/references/visual-mockup-workflow.md`. Keep measured facts, responsive assumptions and editorial ownership explicit. `AGENTS.md` is the project instruction bridge; harness-specific rules are not universal enforcement.

Use `astro-site-design` for the design system, Astro components, responsive behavior, accessibility, and browser review. Use `building-emdash-site` alongside it for EmDash queries, cache hints, media, Portable Text, menus, and editor integration.

Calibrate tokens in `src/styles/global.css` using `npm run design:tokens` (`scripts/design-system.mjs`) and inspect live updates via Vite HMR on `/_styleguide` and representative routes. Verify WCAG AA perceptual contrast across default and `[data-surface="dark"]` contexts, fluid `clamp()` bounds, and actual font faces/weights with `npm run design:tokens` and `npm run test:design`. If `@perkyzz/emvb` was enabled in Stage 2 for visual landing pages, wire `resolveEmVBPage(Astro)` and `<EmVBPage />` in `src/pages/[slug].astro` and sync EmVB site styles with the project's OKLCH palette via `@perkyzz/emvb-mcp`.

Build the shell and one representative page from each materially different archetype before expanding across every route. Feed implementation findings back to the content model or art direction when real content exposes a weak assumption; update the site record when a decision changes.

Once representative pages render, load `impeccable` for a bounded visual critique of those routes. Use its critique and audit guidance to identify hierarchy, typography, spacing, responsive, accessibility, and interaction issues, then fix shared tokens or components before multiplying the pattern across the route inventory. Treat the critique as implementation evidence alongside the brief and source audit; it does not replace those inputs or authorize changing preserved content facts.

**Gate:** representative pages work with real content at mobile, intermediate, and wide viewports, and establish reusable patterns for the remaining routes. The main visual findings from the Impeccable pass are resolved or recorded.

**Stage 5 Completion Handoff Prompt:**
When representative pages are refined, present this prompt:
> **Stage 5 Complete: Core Page Templates Proven & Polished**
> The homepage and shell have been built and refined with the Impeccable critique pass.
>
> Next is **Stage 6: Complete & Verify the Full Site**.
> *In plain terms:* Now that the design patterns are proven, we build all remaining pages from our inventory and perform comprehensive quality checks (making sure links work, mobile layouts don't break, and editors can edit pages in the admin).
>
> **Ready to complete the site?**
> 1. **(Recommended) Build all remaining routes and run full quality checks:**
>    - Build the rest of the pages, verify browser accessibility/mobile views, test admin editing round-trips, and run the automated test suite.
> 2. **Review the current pages in your browser first:**
>    - Take time to click through the homepage and shell locally before generating the remaining pages.
>
> *(Reply `1` to generate and verify all routes, or `2` to inspect the current pages.)*

## Stage 6: complete and verify

**All profiles:** run `npm run verify`, `npm run build` and `npm run check:dev-tools`, inspect routes, responsive images, focus and 404 behavior. Static builds must contain no server adapter/database and exclude `/_styleguide`; never deploy fixture output. Sveltia also needs real-account auth/upload/save/rebuild/logout checks before editorial handoff; a local build does not prove those. Existing Windows screenshot baselines and CMS registry commands are EmDash-only; static projects record browser evidence directly.


Finish the route inventory, content states, interactions, metadata, and accessibility behavior. Follow the visual review and repair passes in `astro-site-design`, and run one final Impeccable critique or audit when the full route set is available. Fix material cross-route findings in shared styles or components, then stop once the review is coherent. Run the repository's requested checks and build. Verify public and editor modes for CMS-rendered content.

Use `emdash-site-setup` again for deployment and site transfer. Treat deployment of code and transfer of CMS data as separate operations.

**Gate:** every required route and distinct state is accounted for; material visual, content, responsive, accessibility, and editor-mode findings are resolved or explicitly documented.

Before declaring a new-site workflow complete, use `npm run site:register` with the actual stable site/repository/runtime/owner and starter version metadata. Follow `docs/site-registry.md`: submit a reviewed private registry change, or retain the ignored pending-registration artifact and record its reason when central access is unavailable. Reuse the same site ID for renames; do not publish private client details in the starter or invent a stable release for an unreleased checkout.

**Stage 6 Completion Handoff Prompt:**
When Stage 6 finishes, present the prompt matching the hosting platform selected in Stage 2:
*If Node.js hosting:*
> **Stage 6 Complete: Site is Built and Fully Verified!**
> All pages, admin features, and visual checks have passed with zero errors.
>
> Next is **Stage 7: Production Deployment & Domain Setup**.
> *In plain terms:* Connecting your custom domain name (e.g., `yourbrand.com`), configuring SSL certificates, and preparing production startup services.
>
> **What is your launch plan?**
> 1. **(Recommended) Prepare production deployment configuration:**
>    - Generate production environment variable templates, systemd or Docker compose startup files, and reverse-proxy instructions (e.g. Nginx / Caddy with automated SSL).
> 2. **Keep the site in local development mode for now:**
>    - Keep testing locally while editors populate initial content before deploying.
>
> *(Reply `1` to prepare production deployment files, or `2` to keep in local mode.)*

*If Cloudflare Workers hosting:*
> **Stage 6 Complete: Site is Built and Fully Verified!**
> All pages, admin features, and visual checks have passed with zero errors.
>
> Next is **Stage 7: Production Cutover (Going Live on Cloudflare)**.
> *In plain terms:* Connecting your custom web address (e.g., `yourbrand.com`), ensuring secure HTTPS locks work, verifying admin passkey/email logins, and ensuring company email DNS is untouched.
>
> **What is your launch plan?**
> 1. **(Recommended) Guide me through connecting my custom domain (`emdash-production-cutover`):**
>    - Safely attach your custom domain via Wrangler, verify SSL certificates, test admin passkey/email login, and verify corporate mail records.
> 2. **Keep the site on the Cloudflare preview / `workers.dev` URL for now:**
>    - Keep the preview URL active so your team can review and populate content before switching the public domain.
>
> *(Reply `1` to begin custom domain cutover, or `2` to keep on preview.)*

## Stage 7: production cutover, email & forms

**Static branch:** deploy verified `dist/`, configure canonical URLs, TLS and 404 status, verify rebuild-on-commit and rollback to the last successful build. For Sveltia verify admin assets, OAuth origins/callbacks or PAT access and fresh sign-in, upload, draft behavior and publication with real accounts. Record static deployment ownership, browser evidence and source/asset backup policy in project notes. Do not run EmDash registry, database backup or CMS cutover commands. Only use external form/mail services required by the brief; preserve existing mail DNS. The remaining cutover instructions are EmDash-only.

Use `emdash-production-cutover` when moving a Cloudflare Workers site from preview/`workers.dev` to its production custom domain. Establish and test admin recovery before changing the authentication origin, configure the canonical hostname and alias redirects, and verify fresh production login. Preserve working email providers and form integrations; configure Cloudflare Email Sending or replace forms only when requested or required by established site requirements.

**Gate:** production custom domain resolves with valid TLS; required aliases preserve paths and queries; fresh admin login works through the configured authentication mode; corporate mail DNS remains intact; applicable email/form delivery checks pass; rollback configuration and observed verification results are recorded.

**Stage 7 Completion Handoff Prompt:**
When Stage 7 cutover or production configuration is verified:
> **Stage 7 Complete: Site is Live & Protected!**
> Production domain resolution, SSL certificates, admin access, and mail delivery checks have succeeded.
>
> **Recommended Post-Launch Actions:**
> 1. **(Recommended) Finalize Site Registry & Backups:**
>    - Record the active production status via `npm run site:register`, verify automated database backup schedules, and archive deployment notes.
> 2. **Monitor Live Production Traffic:**
>    - Keep monitoring error logs (`npx wrangler tail` or server logs) and test the public contact form live.
>
> *(Reply `1` to record the registry entry and wrap up the deployment workflow.)*

## Working with partial requests and ongoing evolution

If the user requests only one stage, perform that stage without forcing a complete site build. Check its upstream inputs, state any consequential assumptions, and revisit downstream stages only when the change invalidates them. A later-stage request does not authorize inventing missing brand, content, or deployment decisions.

### Evolving content on an existing site

For static profiles, evolve file schemas and content together, validate real Markdown and Sveltia output, and keep published URLs stable. The SQL audit/migration and modernization tracks below are EmDash-only.
When modifying, normalizing, or pruning content models on a site that already has content:
- Do not restart from Stage 1 or wipe existing databases.
- Use `emdash-content-modeling` in brownfield evolution mode to perform schema audits, write zero-downtime data migration scripts, implement dual-read template fallbacks, maintain 3-way parity (local SQLite, remote D1, seed), and synchronize menus.

### Brownfield site audit and modernization (`Audit -> Propose Follow-Up -> Execute -> Re-Audit`)
When auditing an existing EmDash site to adopt newer starter standards or design-system practices, **never treat a diagnostic report or a single primitive-backport pass as the end of the workflow**:
1. **Run Read-Only Diagnosis**: Execute `npm run audit:site -- --root <site-path> [--runtime node-sqlite|cloudflare-d1-r2] [--db-snapshot <file>|--d1-dump <file.sql>] --out <private-report-dir>`.
2. **Present Findings & Propose a Phased Follow-Up Plan**: Always synthesize the report's `Recommended follow-up plan` into concrete, user-selectable tracks rather than stopping after printing the table:
   - **Track 1 — Skills & Provenance Sync**: Stage, review, and apply `sync:site-skills` and `sync:emdash-skills` on a feature branch; record intentional drift under `overrides` in `.emdash/site-skills.json`.
   - **Track 2 — Design-System Primitives, Card Accessibility & Token Engine**: Backport `global.css` rhythm/token architecture (`interpolate-size`, consolidated `.flow` with duplicate-margin guard, `.content-grid` subgrid, `[data-surface]`, `.clickable-parent`/`.focus-parent`, tokenized `@theme` `clamp()` scales), semantic `<article>` Card primitives with CMS edit forwarding, `/_styleguide`, and `scripts/design-system.mjs` (`npm run design:tokens`).
   - **Track 3 — Route Template Adoption & `/_styleguide` Calibration**: Inspect actual routes in `src/pages/` to opt long-form editorial templates into `<Container breakout>` (`.content-grid`), apply `data-surface="dark|muted|brand"` to contrasting sections, and save `audit/component-calibration.md`.
   - **Track 4 — Framework, Adapter & Node Policy Alignment**: Evaluate lockfile versions (`astro`, `emdash`, `@astrojs/*`), `engines.node`, and apply `npm run audit:modernize -- --recipe schema-budget-prebuild@1` when needed.
   - **Track 5 — Live Browser, Visual & Editor Verification**: Run the site's test suites, `typecheck`, and `build`, verify `/_styleguide` and key public/editor routes across viewports, and propose branch merge/PR when verified.
3. **Iterate with Explicit Follow-Up Proposals**: After completing any approved track and re-running `audit:site`, always present the before/after delta **and immediately propose the remaining follow-up tracks** so the user can choose what to execute next or explicitly defer.

