---
name: new-site-workflow
description: Coordinate new sites, full rebuilds, and maintenance spanning content models, templates or shared design in this Astro and EmDash starter. Use profile-aware stages and existing decisions; route implementation to the relevant specialist skills. Isolated component or content edits can use their specialist directly.
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

1. Read `README.md`, `AGENTS.md`, an adopted `PROJECT.md` and current handoff if present, the installed tooling, and the current repository state. Missing optional records do not block work; consult the selected `DESIGN.md` only when visual decisions matter.
   Read the profile receipt and package scripts directly before dependencies are installed. Optional `baseline:inspect` requires the installed dependencies; run it after installation when it helps discovery. Use the project's existing lockfile with `npm ci`, or the first `npm install` in a newly generated static project to create its independent lockfile.
2. Choose the appropriate workflow track based on project scope:
   - **Standard Track (7 Stages):** Default for complex migrations, multi-collection architectures, or multi-locale sites. Report each stage handoff; pause only for a missing consequential decision or required external-action approval.
   - **Express Track (3 Checkpoints):** Recommended for smaller greenfield sites (`<= 6` routes, `<= 3` collections, single locale). Consolidates unresolved decisions into up to three checkpoints while still enforcing every automated CLI gate (`check:art-direction`, `design:tokens`, `audit/component-calibration.md`, `verify`):
     1. **Checkpoint A (Stages 1–3 — Brief, Platform & Content Schema):** Gather brief, confirm hosting/runtime, and model collections/routes in one pass.
     2. **Checkpoint B (Stages 4–4.5 — Art Direction & Component Calibration):** Seed tokens and `## Art Direction Record` (`npm run design:tokens -- --lane <lane> --write --write-record --write-calibration`), verify `npm run check:art-direction -- --require-record`, and calibrate primitives on `/_styleguide`.
     3. **Checkpoint C (Stages 5–6 — Representative Pages, Critique & Verification):** Build routes, run the `impeccable` critique pass, and verify with `npm run verify` and `npm run build`.
3. On `emdash`, only run `sync:emdash-skills` or `sync:site-skills -- --check` when explicitly checking for upstream skill updates or refreshing an older repository checkout (see `docs/skill-synchronization.md`). On a fresh clone, use the checked-in skills directly without a blocking sync detour.
4. Identify the earliest unfinished stage below. On resume, compare saved progress with actual source and acceptance records: a successful starter sanity build does not mean the requested site is implemented. Preserve valid decisions and completed work from earlier stages rather than restarting automatically.
5. Load each specialist skill when its stage begins. Do not load every skill up front.

Keep business context in its established home: `AGENTS.md` by default, or an explicitly adopted optional `PROJECT.md` linked there. The brief covers purpose, audiences, scope, ownership and decision rationale; link actual models, routes and configuration instead of copying their current values. Working rules and the compact Art Direction Record stay in `AGENTS.md`; selected `DESIGN.md` references support that record while CSS owns shipped values. Put current progress and next actions in the existing tracker or a short handoff when needed. Use one home per fact and resolve conflicts by subject and evidence, not a blanket filename hierarchy. Do not relocate established facts or create missing records merely to complete a template. When installed, `docs/project-context.md` expands this guidance and `PROJECT.example.md` offers an optional starting point; older installed profiles can use this scope summary without adding those files.

## Decision and question policy

Use supplied evidence and prior answers before asking. Treat the handoff prompts below as adaptable examples, not mandatory scripts or permission requests. When work is already authorized, report the outcome and continue. Ask only unresolved questions whose answers change the work; combine related decisions and use plain language with a recommendation. Express has **up to three consolidated checkpoints**, not three mandatory stops. Do not ask “ready to build?” repeatedly or require users to choose implementation details the agent can derive.

Each handoff reports the completed scope, observed evidence, unresolved decisions and next authorized action. Label working assumptions explicitly; a saved record or passing check does not establish user approval. If the user requested only a stage, stop at that scope. For a complete build, continue through local verification; deployment, content transfer, DNS changes and external submissions require authorization covering those actions. Reuse existing authorization rather than asking again at each stage.

Discover the following in small groups, omitting known answers:

1. **Purpose and visitor:** Who is the site for, what should visitors do, and what must that journey accomplish? Which pages/content are essential?
2. **Content and identity:** New build or migration? Which content, logo, imagery and brand/source references are authoritative and available to use, what is missing, who supplies it, and which languages must launch?
3. **Operation and constraints:** Who edits and maintains it? Is browser editing or immediate publication needed? Are there required forms, bookings, services, hosting/cost constraints or a target date?

Ask conditional details when relevant: preserve/refine/overhaul and URL redirects for a migration; form destination, recovery, integration/data owner and handling requirements for enquiries; roles and review/publishing workflow for editors; translation ownership for multiple locales; actual measurement needs before analytics; existing SEO/search/social requirements; approved privacy/legal copy where needed. Do not invent policy copy or request secrets in chat; use the project's supported secret storage. Keep deployment, CMS data transfer and DNS changes separate, with the existing authorization rules.

### Audit requests and release completion

Across design, content/schema, dependency, configuration and workflow audits, an unqualified request to audit normally asks for evidence and an actionable follow-up plan before implementation. Lead with the recommended next actions and consequential user decisions; keep the detailed report as supporting evidence when useful. Respect an explicit report-only request. Do not mistake an audit request for permission to apply all findings in one pass.

Recommend a coherent sequence with the problem/impact, proposed changes, preserved boundaries, tradeoffs, dependencies and acceptance evidence. Offer a few meaningful alternatives where the user's choice matters, rather than a catalogue of every possible improvement. If only diagnosis was authorized, present the plan for selection before implementation. If the user already selected the work or asked to audit and implement within defined bounds, reuse that authorization and continue once consequential open decisions are resolved; do not manufacture a new approval checkpoint.

Include release completion in the proposed implementation plan: verified changes committed, pushed to the agreed repository/branch and deployed to the agreed target where applicable, followed by live acceptance. Establish the release destination and whether these actions are authorized during planning, using existing decisions first. A standalone audit or approval of a local implementation is not blanket deployment permission. Resolve missing release scope at plan selection, or request only the still-missing final action after preparing a reviewable result. Once release is authorized, carry it through without waiting for separate commit/push/deploy prompts. Report actual commit, remote branch, deployed version/URL and observed acceptance; do not call a local diff the released result.

Match the endpoint to the work. An explicitly local-only task ends locally; a template/library/docs change may require commit and push with no site deployment. State that applicability rather than deploying an unrelated site. Release authority does not imply permission for content imports, production data writes, messages or DNS cutover.

### Express defaults

Present the material defaults briefly at the relevant checkpoint and record approved versus assumed decisions in the established context home; keep the selected visual direction and density with the Art Direction Record in `AGENTS.md`. Defaults are revisable, not approval claims:

- Recommend `static` when developers/agents own file edits. Ask about editing needs before selecting a browser CMS or relational platform; record the selected profile.
- Use the brief/content language as a labeled assumption. Resolve ambiguity or extra locales before committing to URL/schema structure.
- Recommend one brief-led visual direction, preserving supplied identity. Offer alternatives when needed to resolve a material design uncertainty. Explain lane names in everyday terms.
- Use **shared layout spacing** and calibrate density from the brief/reference; assume **balanced** density when no cue exists. Explain that the gaps adapt to screen size and remain locally adjustable. Do not ask users to opt into a CSS policy. Ask about compact/balanced/spacious feel only if it affects an unresolved visual decision.
- Compose native primitives, editorial flow and progressive enhancement. Add browser JavaScript only for a required interaction. No third-party tracking by default; discuss it when measurement is requested.
- Use real supplied content or explicitly marked local drafts. Identify the owner of missing material; do not publish filler or assume draft/legal approval.
- Keep all verification gates and honest evidence. A local verified build is the delivery default until deployment is authorized; deferred manual/editor acceptance stays recorded.

Assess complexity beyond the `<= 6` route / `<= 3` collection / single-locale heuristic: count route archetypes separately from repeated entries and consider migrations, roles, relationships, integrations, authentication/payments and translation. Move to Standard when these warrant it and explain why. Express consolidates decisions; it does not waive modeling, quality or editor acceptance.

## Express Track (3-Checkpoint Autonomous Mode)

When the user requests **Express Mode** (or when building a straightforward greenfield site with `<= 6` routes, `<= 3` collections, and a single locale), execute the same specialist skills and CLI gates with **up to 3 consolidated checkpoints**, using the decision policy and defaults above:

1. **Checkpoint A (Stages 1–3 — Brief, Platform & Content Schema):**
   - Document the brief and route rationale in the established context home, choose the Platform Profile in Stage 2, then follow its Stage 3 content branch. Link the actual route inventory. On static profiles define native Zod schemas and routes; only EmDash uses CMS specialists and the SQL budget.
   - **Checkpoint A Handoff Prompt:**
     > **Express Checkpoint A Complete: Brief, Platform & Content Schema Ready**
     > - **Platform Profile & Hosting:** [static / static-sveltia / emdash; chosen host]
     > - **Collections & Routes:** [List collections and routes]
     >
     > Next is **Checkpoint B (Stages 4–4.5: Art Direction & Component Calibration)**.
     > **Visual direction:** [Recommend one direction from the brief in plain language, with its density and shared spacing defaults. Ask for missing identity/reference information only if needed.]
     > - **Look and feel:** [For example: clear and restrained, warm and editorial, or bold and technical; connect the recommendation to this site's audience.]
     > - **Spacing:** Shared responsive defaults, with [brief-led density; balanced if unspecified] and [any deliberate layout exceptions].
     > - **Missing input:** [Ask only an unresolved brand/reference or density question; otherwise record the recommendation/assumption and continue.]

   Include the **Layout spacing choice** explanation below in this same handoff. Express uses shared defaults unless the brief or user calls for custom spacing; do not add a separate technical question or checkpoint.

2. **Checkpoint B (Stages 4–4.5 — Art Direction & `/_styleguide` Calibration):**
   - Run `npm run design:tokens -- --init-client --lane <lane>` (or `--seed-accent <hex>`), refine `## Art Direction Record` in `AGENTS.md` and tokens in `src/styles/global.css`, pass `npm run check:art-direction -- --require-record`, and calibrate primitives on `/_styleguide` (`audit/component-calibration.md`).
   - **Checkpoint B Handoff Prompt:**
     > **Express Checkpoint B Complete: Art Direction & `/_styleguide` Calibrated**
     > - **Art Direction Gate:** [Actual command and result; the saved record and passing gate do not imply user approval.]
     > - **Contrast, tokens and specimens:** [Report the actual checks, results and unresolved limitations; automated checks are not accessibility certification.]
     >
     > Next is **Checkpoint C (Stages 5–6: Full Route Assembly, Impeccable Critique & Verification)**.
     > [Continue authorized implementation; offer the preview for inspection without requiring a continuation reply.]

3. **Checkpoint C (Stages 5–6 — Route Implementation, Critique & Full Verification):**
   - Implement public routes using the selected profile (native `getStaticPaths()`/`render()` for static; `<Base content={{...}}>` + `{...entry.edit.*}` for EmDash), run the `impeccable` visual critique pass, run `npm run verify` + `npm run build`, and report the Stage 6 handoff with actual acceptance and any remaining launch work.

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

**Static profiles:** define collections in `src/content.config.ts` with typed Zod schemas and native `glob` loaders. Use Markdown files in `src/content/`, file-owned settings/navigation and draft-filtered `getStaticPaths()`/`render()`. Keep native images in `src/assets`; require descriptive alt text for meaningful hero images. For Sveltia keep form names, required/optional semantics, date serialization and media-relative paths aligned with that schema; verify a CMS-shaped content file in an Astro build. Record content candidates, routes, ordering, locale and editorial ownership, then continue to Stage 4. Do not apply SQL modeling or seed instructions below.

**EmDash branch:**

Use `emdash-content-modeling` to design normalized collections, select enums, relationships, native row-per-locale structures, and squad/team architecture. Use `building-emdash-site` for schema registration syntax, Portable Text rendering, live collection configs, and queries. Use `wordpress-to-emdash-content` first for import mappings when applicable. Use `emdash-cli` only for operations against the local or remote EmDash instance.

Use the content-candidate register to classify every repeated editorial element as an EmDash collection, page/Portable Text content, a site setting, plugin or integration data, or deliberately excluded content. Model collection candidates with fields, relationships, ordering, taxonomies, locale behavior, and route ownership rather than hardcoding page markup. If a candidate is only raw HTML, a builder repeater, or opaque plugin data, document the extraction or mapping needed instead of assuming the importer will infer it. Identify which page archetypes are standard single-measure sections (`<Container width="reading|content|wide">`) versus long-form editorial articles, case studies, or landing pages that interleave reading prose with wider callouts, figures, or galleries (`<Container breakout>` / `.content-grid`). Use representative real content, source content, or clearly identified editorial drafts to expose layout needs. Keep the seed useful for a fresh installation; do not treat it as a deployment migration.

**Gate:** every planned page archetype and content candidate has a source, target representation, migration method, route or placement, container/breakout model, and editorial ownership model. No repeated editorial material remains unclassified. The art-direction stage has realistic content shapes and known imagery to design around.

**Stage 3 → Stage 4 handoff:**
Report the content model, route archetypes and editorial ownership established for the selected profile, including actual admin/schema status on EmDash. Recommend a visual direction from the supplied identity and evidence, using `site-art-direction`'s canonical lanes or Custom / existing brand with a rationale. Explain the intended typography, density and layout spacing in plain language; distinguish user decisions from working assumptions.

Continue authorized design setup with existing assets and local token tooling. Ask about identity/reference gaps only when they materially change the direction. At the existing concept checkpoint for a new site or significant overhaul, recommend canvas-led iteration and offer OpenPencil, Penpot and direct Astro/browser as first-class choices. Reuse the user's preference and working connections; retain explicitly preferred Pencil, Google Stitch, OpenDesign and Claude Design. Follow `site-art-direction`'s `references/design-iteration.md` rather than repeating tool discovery. Use `penpot-site-design` when Penpot is selected. Same-agent design and implementation are complete paths; a different design agent is optional. Do not repeat setup or add a mandatory second-agent checkpoint. Small refinements reuse the accepted world. Continue independent preparation while a consequential surface choice is pending.

## Stage 4: set the art direction

Use `site-art-direction` and its [shared iteration loop](../site-art-direction/references/design-iteration.md): recommend a canvas for substantial design work, resolve one surface choice, iterate a representative slice in focused visual batches, select the direction, then prove it in Astro before broad rollout. For Penpot load `penpot-site-design`; OpenPencil uses its official version-matched skill/API. The same agent can complete the flow. Only when changing agents/sessions, save a portable brief/handoff with target IDs, approval evidence, source token expressions, native component mapping, responsive/states intent and open questions; never include a credential or depend on hidden MCP storage. Direct Astro concepts under `audit/visual-concepts/` use the same review/selection criteria without a design-service requirement. Penpot boards do not replace the Stage 4.5 styleguide or real-route browser acceptance.

Use `site-art-direction` with the brief, source audit, content model, real assets, and relevant references. Select a primary lane from `references/aesthetic-lanes.md`, or Custom / existing brand with a rationale when those lanes do not fit. Define the narrative metaphor, 4-voice typography hierarchy (display, inline `.font-accent` contrast voice, reading body, and `.eyebrow-telemetry` monospace coordinates), 3-tier surface and border physics, hero visual specimen strategy (live-coded `.ui-specimen` console vs interactive capability stage vs prepared editorial photography), signature header archetype, spatial density, section pacing rhythm, and explicit anti-patterns. These are concrete defaults for new or replacement visual work. When a fixed brief or accepted existing direction requires an exception, record that specific exception and its visual rationale; do not silently omit the design checks or replace the examples with generic styling advice.

### Layout spacing choice (Standard and Express)

During the design handoff, explain briefly. Express uses the shared defaults above; Standard asks once when the spacing approach is a material unresolved decision. Reuse existing answers:

> **Layout spacing:** Sections, content groups, and grids get consistent spacing that adapts to screen size. Shared settings keep changes consistent across the site, while individual layouts can have their own spacing. Article text uses flow spacing between headings, paragraphs, lists, and media.
>
> **Which approach suits this site?**
> 1. **Shared spacing defaults (recommended):** Calibrate the site's overall density, then use the layout components' defaults with deliberate local exceptions.
> 2. **Custom layout spacing:** Plan explicit spacing for the affected layouts, useful when matching a tightly specified composition. Shared tokens still keep those values maintainable.

For Standard, include any needed choice in the Stage 3 → Stage 4 handoff; for Express, include the explanation and recommended shared default in Checkpoint A's design handoff. Do not paste the two-choice question into Express unless the brief/user makes the architecture a real decision. Bundle any answer with visual direction, without a separate blocking approval. If the user has authorized autonomous design, state the recommended working assumption and proceed. Do not replay this prompt for scoped maintenance or existing-site updates.

Record the selected approach, density, intended exceptions and whether the choice was approved or assumed in `AGENTS.md`; record actual calibrated values/evidence in `audit/component-calibration.md`. Use neutral terms: **layout spacing**, **spacing tokens**, **stack/grid gaps**, **fluid spacing**, and **flow spacing**. These describe the architecture, not a named CSS feature or external product. Do not introduce product comparisons or a settings panel.

Both choices use the current `SiteShell` policy (`automatic-v2` is an internal compatibility identifier). A custom choice uses contextual aliases, explicit primitive gap/padding controls and `layout="custom"` where the caller owns display/gap. Do not switch a new site to `legacy`, disable editorial boundaries, remove gutters, or scatter arbitrary values to implement that choice. Verify the chosen relationship owners on `/_styleguide` before broad page assembly; see `docs/design-framework.md`.

Do not start broad visual implementation from the starter's neutral defaults. First record the approved direction or explicitly labeled working assumption in `AGENTS.md` following the mandatory Art Direction Record schema and canonical gate in `AGENTS.md` (you can scaffold a structurally valid record directly via `npm run design:tokens -- --lane <lane> --write-record` and refine its prose for the client brief); use a linked project document when the direction needs substantial visual references or component detail.

For any existing-site redesign, including an earlier Baseline site or a builder migration, distinguish refinement, significant overhaul within the brand, and replacement of the visual world. State which identity elements and compositions are fixed versus open to change; reuse an explicit user choice. For a significant overhaul or materially different premise, run the visual concept pass in `site-art-direction` before broad implementation: develop two or three concepts for a representative archetype using real content shapes and known assets, compare them against the brief and source identity, and resolve the direction decision. Record which previous visual decisions are superseded. Reuse the single canvas-led choice in `site-art-direction`'s `references/design-iteration.md`, including OpenPencil, Penpot, direct Astro and explicitly preferred named alternatives; do not repeat a settled checkpoint or silently skip an unresolved choice because implementation is generally authorized. Embed the narrative metaphor in generation prompts and treat concepts as references rather than exact implementation specifications.

> [!CAUTION]
> **ART DIRECTION GATE:** Before Stage 5 site-specific visual implementation, save the complete record and pass `npm run check:art-direction -- --require-record`. Follow the scope and exceptions in `AGENTS.md`; route planning is permitted earlier, visual template implementation is not. Saving to disk does not require a Git commit. CLI/CI check outcomes, not pre-write prevention.

**Gate:** `AGENTS.md` contains the saved `## Art Direction Record` with all required fields (Aesthetic Lane selected from `references/aesthetic-lanes.md` or Custom / existing brand with rationale, Narrative Metaphor, Typography Pairing, Token Physics, and Site Anti-Patterns). For an overhaul migration, the concept pass is complete, the selected direction is recorded, and the preserved source identity and deliberate changes are explicit.

**Stage 4 handoff:**
Report the saved Art Direction Record, which choices are approved versus assumed, and the actual `check:art-direction -- --require-record` result. Continue to Stage 4.5 within the authorized scope: preview the relevant building blocks on `/_styleguide`, check their surfaces, responsive behavior and interaction states, and record evidence before broad page assembly. Calibration is a required stage, not a skip/proceed choice.

## Stage 4.5: calibrate components before page assembly

Open the **Component calibration** path printed by `npm run dev` on Astro's local
origin. It respects base/slash policy: generated static sites default to
`/_styleguide/`, including the slash; their slashless URL returns 404. Release
previews intentionally omit it. Use the documented fixture build/serve commands
only when a separate specimen artifact is needed, not to recover a missing slash.

For URL/screenshot migrations or external component sourcing (such as `21st.dev MCP`), follow `astro-site-design/references/component-quarantine.md` after Stage 4 and its art-direction gate. Inspect representative source elements or candidate registry blueprints, then calibrate relevant tokens, states, and production primitives on `/_styleguide` before creating client page templates or bespoke sections — including `<Container width="reading|content|wide">` versus `<Container breakout>` (`.content-grid` with `.content--feature|wide|full|full-safe`), `<Card>` (`--card-*` custom properties, concentric radius math, and `.clickable-parent`/`.focus-parent` accessibility), and flow spacing (`.flow`). When sourcing external React/Tailwind components (e.g., from `21st.dev`), transmute them through the quarantine checklist: strip unnecessary React/Framer Motion runtime down to zero-JS Astro markup, replace hardcoded palette classes with semantic tokens, bind fluid typography/spacing steps, and wire EmDash live edit proxies only on the `emdash` profile. For greenfield work, review the relevant primitive baseline against the brief and record inapplicable source comparisons.

Save `audit/component-calibration.md` (you can scaffold or refresh the verified `## Token Calibration` table and SHA-256 digest via `npm run design:tokens -- --write-calibration`) with evidence, actual component APIs, supported surfaces/states, asset provenance, narrow/wide and keyboard/motion checks, unresolved gaps and ready/deferred decisions. Resolve material reusable-component gaps before broad assembly. Keep normal-build route exclusion and synthetic fixtures intact. Page findings may reopen calibration; this is not a permanent component freeze. Use written handoffs between passes; fork/archive chats only when the user requests it.

**Gate:** the calibration record identifies which patterns are ready for representative pages and why; relevant checks pass. No source cloning, un-quarantined React/palette bloat, invented APIs, fake CMS edit identities, or specimen-only CSS repairs.

**Stage 4.5 handoff:**
Report the checked components, viewports, surfaces/states and unresolved limitations from `audit/component-calibration.md`. A saved token table alone does not establish rendered acceptance. When the calibration gate passes, continue to the shell and the representative page archetypes that best exercise the actual route/content model. Use an established page priority; otherwise explain the selection and proceed without requiring the user to choose an implementation order.

## Stage 5: implement representative pages

Before writing a representative page's markup, outline its **section-by-section pacing blueprint** so no two adjacent sections repeat the same 3-column card grid (for example: Asymmetric Hero with live-coded `.ui-specimen` or framed focal media → `.grid-hairline` proof/metrics ledger or `<LogoTicker>` → `<Sidebar>` sticky narrative + bento/capability matrix → `<Section data-surface="dark" class="surface-spotlight">` showcase band → native `<Disclosure>` FAQ). Use Baseline's 4-voice typography helpers (`.eyebrow-telemetry`, `.font-accent`, `.tabular-nums`), 3-tier surface utilities (`.surface-elevated`, `.surface-glass`, `.surface-spotlight`), and architectural grids (`.grid-hairline`, `.bg-grid-blueprint`, `.frame-crosshair`). For a preserved composition or a comparison layout that needs uniform rows, record the concrete exception rather than treating the pacing checklist as optional. Use real content; do not invent factual metadata or controls to populate a specimen.

Before adding incoming images, use the installed `media:prepare` workflow in
`docs/media-preparation.md`; inspect eligible stored copies before static asset
integration or EmDash upload/readback. Keep full-size originals outside the
library and Git. Use this for greenfield content as well as later maintenance.

**Static branch:** use the file-owned Base layout around shared `SiteShell.astro`, native `ResponsiveImage` metadata, Markdown RichText and static routes. Shared `Card` attribute bags need no edit proxies. Do not use CMS queries, cache hints or `Base content` bindings. Verify common styleguide specimens identically to EmDash; CMS-only specimens are inapplicable. The remaining CMS implementation instructions apply only to EmDash.


When references are screenshots/mockups or interaction recipes, route through `astro-site-design/references/visual-mockup-workflow.md`. Keep measured facts, responsive assumptions and editorial ownership explicit. `AGENTS.md` is the project instruction bridge; harness-specific rules are not universal enforcement.

Use `astro-site-design` for the design system, Astro components, responsive behavior, accessibility, and browser review. Use `building-emdash-site` alongside it for EmDash queries, cache hints, media, Portable Text, menus, and editor integration.

Calibrate tokens in `src/styles/global.css` using `npm run design:tokens` (`scripts/design-system.mjs`) and inspect live updates via Vite HMR on `/_styleguide` and representative routes. Verify WCAG AA perceptual contrast across default and `[data-surface="dark"]` contexts, fluid `clamp()` bounds, and actual font faces/weights with `npm run design:tokens` and `npm run test:design`. If `@perkyzz/emvb` was enabled in Stage 2 for visual landing pages, wire `resolveEmVBPage(Astro)` and `<EmVBPage />` in `src/pages/[slug].astro` and sync EmVB site styles with the project's OKLCH palette via `@perkyzz/emvb-mcp`.

Build the shell and one representative page from each materially different archetype before expanding across every route. Feed implementation findings back to the content model or art direction when real content exposes a weak assumption; update the site record when a decision changes.

Once representative pages render, load `impeccable` for a bounded visual critique of those routes. Use its critique and audit guidance to identify hierarchy, typography, spacing, responsive, accessibility, and interaction issues, then fix shared tokens or components before multiplying the pattern across the route inventory. Treat the critique as implementation evidence alongside the brief and source audit; it does not replace those inputs or authorize changing preserved content facts.

**Gate:** representative pages work with real content at mobile, intermediate, and wide viewports, and establish reusable patterns for the remaining routes. The main visual findings from the Impeccable pass are resolved or recorded.

**Stage 5 handoff:**
Report which representative routes render, the browser/Impeccable findings addressed, and any remaining content or interaction gaps. Offer the preview for inspection while continuing the remaining authorized routes and Stage 6 checks. Pause for a user review only when requested or when a consequential unresolved decision prevents further work.

## Stage 6: complete and verify

**All profiles:** run `npm run verify`, `npm run build` and `npm run check:dev-tools`, inspect routes, responsive images, focus and 404 behavior. Static builds must contain no server adapter/database and exclude `/_styleguide`; never deploy fixture output. Sveltia also needs real-account auth/upload/save/rebuild/logout checks before editorial handoff; a local build does not prove those. Existing Windows screenshot baselines and CMS registry commands are EmDash-only; static projects record browser evidence directly.


Finish the route inventory, content states, interactions, metadata, and accessibility behavior. Follow the visual review and repair passes in `astro-site-design`, and run one final Impeccable critique or audit when the full route set is available. Fix material cross-route findings in shared styles or components, then stop once the review is coherent. Run the repository's requested checks and build. Verify public and editor modes for CMS-rendered content.

Use `astro-site-design/references/rollout-verification.md` for browser availability, valid capture evidence and route coverage. If a native browser fails, discover supported built-in or connector alternatives before declaring browser acceptance unavailable; an actual permission/policy denial must not be bypassed. Before ending a multi-deliverable request, reconcile its completion register using [the maintenance closeout guidance](references/site-maintenance.md#reconcile-completion-before-handoff). Continue required, authorized work while it is possible; an attempted check or saved checklist is not a completed acceptance step.

Use `emdash-site-setup` again for deployment and site transfer. Treat deployment of code and transfer of CMS data as separate operations.

**Gate:** every required route and distinct state is accounted for; material visual, content, responsive, accessibility, and editor-mode findings are resolved or explicitly documented. For migrations, run `npm run migration:verify -- --scope full --manifest audit/url-inventory.json` to verify HTTP statuses, 301 redirect chains without loops, SEO tags, link/image integrity, and content inventory reconciliation (`docs/migration-acceptance.md`).

On EmDash, before declaring a new-site workflow complete, use `npm run site:register` with the actual stable site/repository/runtime/owner and starter version metadata. Follow `docs/site-registry.md`: submit a reviewed private registry change within existing authorization, or retain the ignored pending-registration artifact and record its reason when central access or submission authorization is unavailable. Reuse the same site ID for renames; do not publish private client details in the starter or invent a stable release for an unreleased checkout.

**Stage 6 handoff:**
Report actual route coverage, automated results, browser/editor acceptance and pending checks. Distinguish a verified local build from deployment and launch acceptance; avoid blanket claims of full verification when required evidence is missing.

Use the selected profile and hosting decision for any Stage 7 preparation: static `dist/` and build/404 configuration; Node startup, persistence and reverse proxy configuration; or Workers bindings, preview and cutover configuration. Complete authorized local preparation before requesting any missing external-action authorization, and identify the concrete deployment/content-transfer/DNS action it would cover. If deployment is already authorized, continue without asking again. If the requested scope ends at a local build, deliver that result with remaining launch work recorded.

## Stage 7: production cutover, email & forms

**Static branch:** deploy verified `dist/`, configure canonical URLs, TLS and 404 status, verify rebuild-on-commit and rollback to the last successful build. For Sveltia verify admin assets, OAuth origins/callbacks or PAT access and fresh sign-in, upload, draft behavior and publication with real accounts. Record static deployment ownership, browser evidence and source/asset backup policy in project notes. Do not run EmDash registry, database backup or CMS cutover commands. Only use external form/mail services required by the brief; preserve existing mail DNS. The remaining cutover instructions are EmDash-only.

For migrations, follow `docs/migration-cutover.md` to enforce the pre-cutover content freeze (`T_freeze`), reconcile late source edits/deletions/slug shifts, and establish rollback triggers. For Node.js targets, acquire a consistent SQLite backup via `.backup` or `VACUUM INTO` paired with media and `.env` secrets per `docs/node-backup-restore.md` (naive copying during active WAL is prohibited). Complete the `docs/editor-handoff.md` guide covering editor roles and the peripheral integrations checklist.

Use `emdash-production-cutover` when moving a Cloudflare Workers site from preview/`workers.dev` to its production custom domain. Establish and test admin recovery before changing the authentication origin, configure the canonical hostname and alias redirects, and verify fresh production login. Preserve working email providers and form integrations; configure Cloudflare Email Sending or replace forms only when requested or required by established site requirements.

**Gate:** complete applicable setup/cutover checks within existing authorization using repository configuration and supported tools. First launch and domain changes require valid TLS/aliases, fresh mode-specific login, preserved corporate mail and applicable form delivery. Use the site's normal deployment and supported migration mode. Added/pending core migrations or data-changing actions need a database recovery point before startup/deploy; on D1, record a Time Travel bookmark using existing Wrangler access. Reuse existing media/key recovery versions when unchanged. Do not require a new API token, managed migration pipeline or fresh full backup bundle merely for a version upgrade or ordinary redeploy. Use docs/cloudflare-backup-restore.md for actual migration/recovery operations and docs/edge-cache-lifecycle.md for affected cache behavior. Run publish/purge/provider/cron acceptance when launching the site or changing those surfaces. Node targets use their applicable recovery runbook. Leave unobserved checks pending; request only consequential missing access/inputs or actions unavailable to the agent.

**Stage 7 handoff:**
State whether the result is prepared configuration, a preview deployment or an observed production launch. Report only the TLS/domain, profile-specific login/publication, mail/form and recovery checks actually performed; retain missing evidence as pending. For EmDash, finalize the required registry record or pending-registration artifact within the existing submission authorization. Static profiles record ownership and acceptance in project notes. Record backup/restore ownership and any agreed follow-up; do not start ongoing monitoring without a request.

## Working with partial requests and ongoing evolution

If the user requests only one stage, perform that stage without forcing a complete site build. Check its upstream inputs, state any consequential assumptions, and revisit downstream stages only when the change invalidates them. A later-stage request does not authorize inventing missing brand, content, or deployment decisions.

For initial content imagery and later additions, follow the installed general `docs/media-preparation.md` workflow: prepare appropriate stored copies with `media:prepare`, inspect results, then add them to static `src/assets/` or upload eligible copies to the selected EmDash Media Library with verified readback. Preserve source archives outside the library and Git. This applies to greenfield sites and day-2 maintenance independently of WordPress migration; older sites need explicit tooling adoption before these commands are available.

### Scoped maintenance across site surfaces

For "bring this site up to date with Baseline" or a full starter catch-up, follow
the existing-site update workflow in `docs/baseline-updates.md` from the selected
current published Baseline reference. It compares packages, skills/instructions
and starter capabilities; neither a skill refresh nor an audit alone completes
the request. Older sites may need the guide from a separate Baseline checkout.
Continue compatible authorized local updates, preserve client decisions and
provenance, and record adopted/deferred capabilities and actual acceptance.

For a change spanning several files or disciplines, use this compact loop:

1. Recover the installed profile, current implementation and requested outcome. Identify what must stay unchanged: for example other grid gaps, existing entries, navigation or edit ownership.
2. Trace the affected surfaces before editing: a content field can involve schema, stored entries, editor form, queries and templates; a shared component can affect several routes. Choose the smallest change that fulfills the request and load only the relevant specialists.
3. Apply within the existing authorization, keeping client-owned content/design and compatible omitted-field behavior. Use the established art-direction gate for visual changes; distinguish live CMS changes from seed defaults.
4. Verify the requested outcome and preservation with the installed commands and relevant rendered/editor checks. A passing build does not prove an editor save, and an earlier check does not cover later edits.
5. When work remains or will resume later, update the existing tracker or handoff with changed surfaces, checks actually completed, unresolved acceptance and the next concrete action. Link authoritative decisions rather than copying them into a new required record.

When installed, [references/site-maintenance.md](references/site-maintenance.md)
expands this loop for spacing, fields, shared components and routes. Older
installations can use the summary above without adding that optional reference,
changing profile or restarting discovery.

### Evolving content on an existing site

For static profiles, evolve file schemas and content together, validate real Markdown and Sveltia output, and keep published URLs stable. The SQL audit/migration and modernization tracks below are EmDash-only.
When modifying, normalizing, or pruning content models on a site that already has content:
- Do not restart from Stage 1 or wipe existing databases.
- Use `emdash-content-modeling` in brownfield evolution mode to perform schema audits, write zero-downtime data migration scripts, implement dual-read template fallbacks, maintain 3-way parity (local SQLite, remote D1, seed), and synchronize menus.

### Brownfield site audit and modernization (`Audit -> Propose Follow-Up -> Execute -> Re-Audit`)
When auditing an existing EmDash site to adopt newer starter standards or design-system practices, **never treat a diagnostic report or a single primitive-backport pass as the end of the workflow**:

Apply the common audit/decision policy above. The plan is the primary handoff; implementation awaits selection unless already authorized. Include verification and the applicable commit/push/deploy phase in that plan, with known targets and any genuinely missing authority.
1. **Run Read-Only Diagnosis**: Execute `npm run audit:site -- --root <site-path> [--runtime node-sqlite|cloudflare-d1-r2] [--db-snapshot <file>|--d1-dump <file.sql>] --out <private-report-dir>`.
2. **Present Findings & Propose a Phased Follow-Up Plan**: Always synthesize the report's `Recommended follow-up plan` into concrete, user-selectable tracks rather than stopping after printing the table:
   - **Track 1 — Skills & Provenance Sync**: Stage, review, and apply `sync:site-skills` and `sync:emdash-skills` on a feature branch; record intentional drift under `overrides` in `.emdash/site-skills.json`.
   - **Track 2 — Design-System Primitives, Card Accessibility & Token Engine**: Backport `global.css` rhythm/token architecture (`interpolate-size`, consolidated `.flow` with duplicate-margin guard, `.content-grid` subgrid, `[data-surface]`, 4-voice typography `--font-mono`/`--font-accent`, 3-tier surfaces `--color-elevated`/`--surface-glass`, `.bento-grid`/`.ui-specimen`, tactile `.btn--secondary`/`.btn--ghost`, `.clickable-parent`/`.focus-parent`, tokenized `@theme` `clamp()` scales), semantic `<article>` Card primitives with `transitionName` morphing and CMS edit forwarding, `SiteShell.astro` choreography (`data-surface-toggle`, `data-sticky-header`, `data-vt-loading`), `/_styleguide`, and `scripts/design-system.mjs` (`npm run design:tokens`). See [references/site-maintenance.md](references/site-maintenance.md) for the early-Baseline visual upgrade playbook.
   - **Track 3 — Route Template Adoption, Visual Redesign & `/_styleguide` Calibration**: Inspect actual routes in `src/pages/` and live rendered pages against the **5-Point Visual Self-Critique Rubric** and the **Early-Baseline & Legacy Pattern → Modern Baseline Upgrade Matrix** in `astro-site-design/references/migration-visual-audit.md` — opting long-form editorial templates into `<Container breakout>` (`.content-grid`), applying `data-surface="dark|muted|brand"` and 3-tier surfaces, upgrading uniform card rows or flat heroes with 4-voice typography and asymmetric layouts (`.bento-grid`, `.grid-hairline`, `<Sidebar>`, `.ui-specimen`), and saving `audit/component-calibration.md`.
   - **Track 4 — Framework, Adapter & Node Policy Alignment**: Evaluate lockfile versions (`astro`, `emdash`, `@astrojs/*`), `engines.node`, and apply `npm run audit:modernize -- --recipe schema-budget-prebuild@1` when needed.
   - **Track 5 — Live Browser, Visual & Editor Verification**: Run the site's test suites, `typecheck`, and `build`, verify `/_styleguide` and key public/editor routes across viewports, and propose branch merge/PR when verified.
3. **Iterate with Explicit Follow-Up Proposals**: After completing any approved track and re-running `audit:site`, always present the before/after delta **and immediately propose the remaining follow-up tracks** so the user can choose what to execute next or explicitly defer.


## Engineering verification loop

For the EmDash foundation, preflight with `npm.cmd run doctor`, use
`npm.cmd run verify:fast` during edits, then run `npm.cmd run verify`,
`npm.cmd run build`, and `npm.cmd run audit:html` against that fresh build
before handoff. On Unix use `npm` in place of `npm.cmd`. Set up the local
Git pre-commit hook once with `npm.cmd run setup:hooks`; it runs doctor and
verify:fast and preserves existing hook managers. It supplements the final gate
and CI; Git hooks are local and can be bypassed. The HTML audit checks emitted
HTML or automatically captures linked public SSR responses from the local
production CMS. Missing published content or broken navigation fails the audit;
see `docs/html-integrity.md` for capture limits and snapshot inspection. For generated
static profiles, inspect the installed package scripts and use their verification
commands; do not add CMS tooling to satisfy an unavailable command.
