# AI Developer Prompt Library

This prompt library provides adaptable recipes for the documented Baseline workflows when pairing with AI coding assistants (Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Aider, OpenCode, or local LLMs). See [Support Boundaries](support-boundaries.md) for scoped evidence and site-specific acceptance.

Use these prompts to invoke specific Baseline features and workflows without having to remember internal commands or skill names.

Check the installed profile and `package.json` before choosing commands. Handoffs report evidence and next steps; they do not require a reply unless a consequential decision or external-action authorization is missing. The kickoff prompts below declare implementation and release scope; establish repository/branch, deployment target and authority during planning. For a local-only, discovery-only or review-at-each-stage task, state that scope explicitly.

Audit requests should produce a recommended follow-up plan with meaningful user decisions, supported by findings; they do not authorize applying every recommendation. For implementation, agree the release endpoint early: verified changes committed, pushed and deployed to named targets where applicable. Carry authorized release steps through without another continuation prompt; retain any recipe's explicit audit-only or local-only boundary. Template/library changes can end at commit/push without a site deployment.

---

## 🧭 Navigation Quick Links

- [1. Starting a New Site Project (Stage 1–4)](#1-starting-a-new-site-project)
- [2. WordPress Migration & Candidate Register (Stage 1 & 3)](#2-wordpress-migration--content-modeling)
- [3. Art Direction & The Design Gate (Stage 4)](#3-art-direction--the-design-gate)
- [4. Component Sourcing & Styleguide Quarantine (Stage 4.5)](#4-component-sourcing--styleguide-quarantine)
- [5. Public Pages & EmDash Editorial Canvas (Stage 5)](#5-public-pages--emdash-editorial-canvas)
- [6. Visual Polish & The Impeccable Critique (Stage 5–6)](#6-visual-polish--the-impeccable-critique)
- [7. Local Visual Regression & Pre-Launch Checks (Stage 6)](#7-local-visual-regression--pre-launch-checks)
- [8. Production Cutover & Corporate Email Safety (Stage 7)](#8-production-cutover--corporate-email-safety)
- [9. Brownfield Site Maintenance & Upgrades](#9-brownfield-site-maintenance--upgrades)
- [10. Design Iteration: OpenDesign, OpenPencil, Penpot or Astro](#10-design-iteration-opendesign-openpencil-penpot-or-astro)

---

## 1. Starting a New Site Project

Start with the [README quickstart](../README.md#quickstart) to prepare a site folder and open it as a project in your assistant. Then use the matching profile prompt and choose Express or Standard. The track-specific prompts below expand the brief once your assistant has access to the project.

### Express / Autonomous Mode Kickoff (3 Checkpoints — For Smaller Sites)
Use this prompt for a straightforward greenfield site (`<= 6` routes, `<= 3` collections, single locale), consolidating decisions into up to three checkpoints while continuing the authorized build.

```markdown
Read AGENTS.md, follow new-site-workflow under .agents/skills/ in **Express Track (3 Checkpoints)**, and build this site using consolidated checkpoints:

Detect the host OS and shell before running commands. In Windows PowerShell,
use npm.cmd and npx.cmd for all npm and npx commands.

- Client / Brand: [Insert Brand Name]
- Purpose & Routes: [E.g., 5-page architecture studio site: Home, Projects, Studio, Journal, Contact]
- Primary Audience: [E.g., Residential and cultural architecture clients]
- Aesthetic Lane / Palette: [E.g., Editorial Paper / Product-Led Minimalism, or seed accent #1B4332]
- Hosting & Locale: [E.g., Node.js + SQLite, single language (en)]
- Release scope: [Repository/branch, deployment target and authorized commit/push/deploy actions, or explicitly local-only]

Determine the profile first and work in its project directory. Complete the site and verification, then the agreed commit/push/deploy steps and live acceptance, reporting Checkpoints A–C as you go. Continue authorized work without waiting for a reply at each checkpoint; ask only for consequential missing decisions or external actions not already authorized. Record approved versus assumed choices and any acceptance still pending. Save and check the Art Direction Record, then calibrate on /_styleguide before broad page assembly.
```

### Standard Agency Mode Kickoff (Full 7 Stages — For Complex Sites & Migrations)
Use this prompt for a complex multi-collection build, multi-locale site or legacy migration with detailed stage handoffs and decisions resolved when they become material.

```markdown
Read AGENTS.md, follow new-site-workflow under .agents/skills/, and guide me through the staged delivery workflow.

Detect the host OS and shell before running commands. In Windows PowerShell,
use npm.cmd and npx.cmd for all npm and npx commands.

Here is the context for this project:
- Client / Brand: [Insert Brand Name]
- Purpose / Goal: [E.g., B2B SaaS marketing site / Architecture studio portfolio]
- Primary Audience: [E.g., Prospective enterprise buyers / Creative directors]
- Brand Assets Available: [E.g., SVGs in src/assets/, brand colors: #1A1A1A and #0055FF, typography: Inter + Newsreader]
- Required Locales: [E.g., Single language (en) or Multilingual (en, de)]
- Release scope: [Repository/branch, deployment target and authorized commit/push/deploy actions, or explicitly local-only]

Begin with Stage 1 (Brief & Evidence Discovery), determine the profile, and complete the requested site and verification, then the agreed commit/push/deploy steps and live acceptance. Report stage handoffs and continue authorized work; ask only for consequential missing decisions or external actions not already authorized. Record approved versus assumed choices and any acceptance still pending. Save and check the Art Direction Record, then calibrate on /_styleguide before broad page assembly.
```

### Resuming a Prepared or Partly Built Site

Open the existing site folder and use this prompt after an interruption. The agent should recover the brief and completed work from the project; the optional context records do not need to be created just to resume.

```text
Continue the authorized local website build in this project.

Read AGENTS.md, the installed profile and scripts, current source, and the
existing brief and handoff when present. Reconcile saved progress with what
is actually implemented and checked, then continue the earliest unfinished
stage using the applicable checked-in skills.

Preserve established scope, supplied content, editing ownership and design
decisions. Use the current project and its lockfile. Ask only for consequential
missing decisions, and label reversible working assumptions.

Complete the remaining implementation and applicable verification, start the
preview, and finish the agreed commit/push/deploy and live checks within existing
authorization. Report the actual revisions/URLs, observed acceptance and any
concrete remaining decision or action. Respect an explicitly local-only scope.
```

### Evaluating & Installing Sandboxed Registry Plugins (Stage 2)
Use this prompt when your site requires specialized functionality (e.g. event management, registration, or translation dashboards) before writing custom code.

```markdown
We are planning specialized site capabilities. Before we build custom code or relational schemas from scratch, check the curated EmDash Plugin Registry (https://plugins.emdashcms.com/) for official sandboxed plugins.

Desired capability: [E.g., Event management & ticketing / Multilingual translation dashboard]

Please:
1. Check whether an existing registry plugin matches (e.g. @vermeulen.solutions/eventual for events or @swiss.ky/linguadash for translations).
2. Advise whether our hosting target (Node.js vs Cloudflare Workers) needs a sandbox runner configured (workerd or LOADER).
3. Guide me through installing the plugin via `npx emdash plugins add <name>` and integrating its published data into our Astro pages.
```

---

## 2. WordPress Migration & Content Modeling

### Migrate with WordPress dashboard access

Use this prompt when the client can access WordPress but has no FTP or hosting-panel access:

```markdown
Migrate [WordPress URL] into this Baseline project's installed profile. Follow docs/wordpress-migration.md and the migration stages in new-site-workflow. Guide me through installing the first-party EmDash Exporter and generating its migration key entirely in WordPress; use a private environment/secret channel for the key. If it cannot be installed, guide me through Tools → Export → All content. If the site uses Elementor, offer an Elementor Website Template kit export as an optional private design-reference handoff; skip it if I do not want to retain or reuse the design. Do not imply Baseline automatically imports the kit or require it for content/media migration. Do not require FTP or a separate media-download plugin for normal source capture.

Capture content/media with migration:wordpress, inspect source coverage and plan the installed profile's output. On EmDash use the native wizard; on static/static-sveltia use the native Markdown/assets plan and matching editor form without adding a CMS runtime. Preserve local files and identify homepage/dynamic-route conflicts, unsupported blocks, custom content models, redirects, navigation, metadata and unpublished-content handling before application. Complete the authorized local migration and applicable rendered/verification checks; deployment and source retirement are separate scope.
```

### Auditing Legacy Content & Finding Hidden Entities
Use this prompt when migrating from a WordPress or legacy CMS export.

```markdown
We are migrating our site from WordPress to EmDash. Activate the wordpress-to-emdash-content and emdash-content-modeling skills.

Here is the source export / URL: [Insert path or URL]

Please:
1. Perform a content candidate discovery audit.
2. Identify implicit operational entities trapped in ACF repeaters or page builder blocks (e.g., rosters, schedules, venues, testimonials, team members).
3. Populate audit/content-candidate-register.md classifying each candidate as a Collection, Page Content, Site Setting, or Deliberate Exclusion.
4. Ensure physical collection schema designs stay within the 50-column limit (Cloudflare D1 safety).
```

### Manifest-Driven Media Ingestion
Use this supplemental prompt to prepare and ingest an explicit offline media batch or repair. Start ordinary migrations with the dashboard workflow above.

```markdown
Help me migrate our WordPress media uploads to EmDash using npm run media:migrate-wp.

- Uploads directory: [Insert path, e.g., ../wp-content/uploads]
- Stable source ID: [Identifier retained across retries]
- Reviewed attachment metadata: [Path to metadataVersion: 1 JSON per docs/image-delivery.md]
- Local EmDash URL: [Actual loopback URL printed by Astro]
- Eventual storage: [Local media / Cloudflare R2]

Please follow docs/image-delivery.md: run read-only inventory with --source, --source-id and --metadata first. Review manifest.json, then prepare into a new ignored --out directory and inspect plan.json/prepared.json and dimensions. Use --apply-local with --stage and --url only for the selected local ingestion, with credentials supplied securely. Preserve source identity and originals; do not rename or drop files based on WordPress suffixes. Content-reference updates and --stage-r2 / media:sync-r2 plan/apply are distinct operations; retain their verification results separately.
```

### Running Migration Acceptance Verification
Use this prompt to verify that all legacy URLs, redirects, SEO tags, links, and content inventories were preserved without error.

```markdown
Run the automated migration acceptance verifier against our target site:
`npm run migration:verify -- --manifest audit/url-inventory.json --scope full`

Please:
1. Review the generated report in `.emdash/migration-acceptance/`.
2. Verify that all 301 redirects resolve without loops and preserve trailing slash / query parameters.
3. Check that canonical tags, meta descriptions, and robots tags match manifest expectations.
4. Flag any broken internal links, missing images, unrendered Gutenberg comments (`<!-- wp:... -->`), or raw shortcodes.
5. Review content inventory reconciliation totals (by type, status, and locale). If there are any missing mappings or target conflicts, explain the resolution steps before cutover.
```

---

## 3. Art Direction & The Design Gate

### Exploring Aesthetic Directions (Before Code)
Use this prompt to define a visual identity and satisfy the `npm run check:art-direction` gate before any CSS is written.

```markdown
We are ready for Stage 4: Art Direction. Activate the site-art-direction skill.

Brand goals and personality: [E.g., Editorial craftsmanship, technical precision, high-contrast typography, restrained color palette].

Please:
Before choosing the direction, recommend a design iteration surface (OpenDesign, OpenPencil, Penpot, or direct Astro in the browser) and follow `site-art-direction/references/design-iteration.md`. Use `opendesign-site-design` for OpenDesign, `openpencil-site-design` for OpenPencil, or `penpot-site-design` for Penpot.

1. Review .agents/skills/site-art-direction/references/aesthetic-lanes.md and propose 2-3 suitable Aesthetic Lanes.
2. Formulate a Narrative Metaphor, Typography Pairing, and Token Physics (Canvas ground, Action/Accent colors, Borders, and Spatial Density).
3. Propose 2-3 explicit Site Anti-Patterns (e.g., "No floating cards; no generic purple gradients; no icon pills").
4. Once we agree, initialize the client site record and tokens via `npm run design:tokens -- --init-client --lane <lane>`, customize `AGENTS.md` and `src/styles/global.css` for our brief, and verify with `npm run check:art-direction -- --require-record`.
```

---

## 4. Component Sourcing & Styleguide Quarantine

### Quarantining External Tailwind Blueprints (21st.dev or Community Code)
Use this prompt when bringing external React/Tailwind components into Baseline.

```markdown
I want to adapt an external component blueprint into our site. Follow the 5-step Component Quarantine Protocol in .agents/skills/astro-site-design/references/component-quarantine.md and stage it on /_styleguide.

Here is the component source / blueprint:
[Paste JSX / Tailwind markup or 21st.dev reference]

Please:
1. Strip all unnecessary React / Framer Motion runtime down to zero-JS Astro markup.
2. Replace hardcoded Tailwind palette classes (e.g., bg-zinc-900, text-blue-500) with semantic tokens (var(--color-surface), var(--color-action)).
3. Upgrade fixed pixel utilities to fluid typographic steps (--text-step-*) and layout primitives (<Container>, <Grid>, or <Card>).
4. Wire EmDash live editing proxies ({...entry.edit.title}).
5. Add a test specimen to src/pages/_styleguide.astro and verify it across viewports.
```

### Agent-First Token Calibration & WCAG Contrast Audit
Use this prompt to seed an Aesthetic Lane preset or brand hex color, customize tokens in `src/styles/global.css`, and verify WCAG AA contrast, font loading, and edit proxies.

```markdown
Let's calibrate our design tokens in src/styles/global.css to match our Art Direction Record in AGENTS.md:

1. Initialize or update from the closest Aesthetic Lane preset or brand seed (`npm run design:tokens -- --init-client --lane <lane-id>` or `--seed-accent <hex> --type-scale <ratio> --write`).
2. Customize the `@theme`, `:root`, and `[data-surface="dark"]` tokens in `src/styles/global.css` for our brand palette, loaded font families, and spatial density.
3. Run `npm run design:tokens -- --write-calibration` and `npm run verify` to verify all 10 WCAG AA contrast pairs across light and dark surfaces, fluid `clamp()` bounds, custom font loading, EmDash edit proxies, and `/_styleguide` swatch coverage.
```

---

## 5. Public Pages & EmDash Editorial Canvas

### Implementing a Public Route with Live CMS Editing
Use this prompt to build a new page template connected to EmDash.

```markdown
Let's implement the public template for the [Page Name, e.g., Case Studies / Blog Post / Team Directory] route at src/pages/[route].astro.

Requirements:
1. Use our layout primitives (<Section>, <Container>, <Grid>, and <Card>) and expressive CSS utilities (`.bento-grid`, `.grid-hairline`, `.ui-specimen`, `.surface-elevated`, `.surface-glass`, `.surface-spotlight`, `.eyebrow-telemetry`, `.font-accent`, `.tabular-nums`, `.btn--secondary`, `.btn--ghost` with `.icon-nudge`) according to our design tokens and `.agents/skills/astro-site-design/references/astro-primitives.md`.
2. Query the EmDash collection server-side.
3. Pass page identity to Base.astro, spread visual editing proxies ({...entry.edit.field}) onto editable elements, and pass `transitionName` on `<Card>` where list-to-detail morphing applies.
4. If this is an editorial article with wide pull-quotes or galleries, use `<Container breakout>` and `.content-grid`.
5. Run the 5-Point Visual Self-Critique Rubric and ensure 0 KB of unnecessary client-side JavaScript.
```

---

## 6. Visual Polish & The Impeccable Critique

### Bounded UI / UX Critique Pass
Use this prompt once a representative page is rendering in the browser.

```markdown
Activate the impeccable skill and perform a visual critique pass on our rendered [Homepage / About / Case Study] page.

Apply the **5-Point Visual Self-Critique Rubric** in astro-site-design/SKILL.md:
1. 3-Tier Surface Depth: Base (--color-page) -> Surface (--color-surface) ->
   Elevated/Glass (--color-elevated, .surface-elevated, .surface-glass) with 1px
   --color-border hairlines. Check a contrasting mid-page band/rhythm breaker.
2. 4-Voice Typography: tracked --font-display headings, --font-body around 68ch,
   selective italic .font-accent, .eyebrow-telemetry and .tabular-nums metadata.
   On new landing pages, check at least three distinct roles above the fold.
3. Grid Rhythm & Asymmetry: avoid consecutive equal 3-column card rows; inspect
   12-column .bento-grid (8/4 or 7/5), .grid-hairline and Sidebar alternatives.
4. Tactile Action Hierarchy: .btn, .btn--secondary, .btn--ghost, .icon-nudge and
   .clickable-parent / .focus-parent keyboard accessibility.
5. Motion & Polish: data-reveal, data-sticky-header, Card transitionName,
   zero FOUC on surface controls, reduced motion and ordinary navigation fallback.

Use these concrete defaults for new/replacement work. Evaluate every check
against real content; document specific exceptions for an accepted existing
direction or route function. Capability counts alone are not quality scores.

Inspect mobile (390x844), desktop (1440x900) and relevant intermediate widths.
Verify saved capture dimensions, loaded content and live geometry. Exercise
adopted controls/transitions, keyboard focus and reduced motion; surface switching
is in scope only when the site offers it. Use a supported available browser if
the preferred native browser fails, without bypassing a permission/policy denial.

Provide high-impact findings with route/viewport evidence and concrete edits.
This request is a critique/proposal; do not assume permission for a redesign.
```

---

## 7. Local Visual Regression & Pre-Launch Checks

### Running Local Screenshot Tests
Use this prompt to run and review visual regression tests without burning CI minutes.

```markdown
Please run our local visual regression test suite with `npm run test:visual`.

If there are any diffs:
1. Explain what changed visually in the captured viewports (mobile, tablet, desktop).
2. Distinguish intentional design changes from unintended layout breaks.
3. If the changes are intentional and approved, update the baselines with `npm run test:visual -- --update`.
4. Run `npm run typecheck` and `npm run check:dev-tools` to ensure dev tools remain excluded from production builds.
```

---

## 8. Production Cutover & Corporate Email Safety

### Cloudflare Custom Domain Cutover & Corporate Mail DNS Check
Use this prompt when taking an EmDash site live on Cloudflare Workers.

```markdown
We are ready to cut over our site from the preview environment to our custom production domain: [Insert Domain, e.g., example.com]. Activate the emdash-production-cutover skill.

Critical Constraints:
1. Do NOT disrupt existing corporate email (Google Workspace / Microsoft 365).
2. Audit existing DNS records (MX, SPF, DKIM, DMARC) before changing any nameservers or root records.
3. Guide me through attaching the custom domain in Cloudflare Wrangler.
4. Verify HTTPS/TLS certificate issuance, canonical redirects (www vs apex), and test fresh admin login at /_emdash/admin.
```

### Pre-Cutover Content Freeze, Delta Reconciliation & Disaster Recovery
Use this prompt to execute the final pre-launch content synchronization and safe backup before domain DNS switch.

```markdown
We are preparing for final DNS cutover. Follow docs/migration-cutover.md and docs/node-backup-restore.md.

Please:
1. Announce the content freeze (T_freeze) and compare our final source export against the initial baseline capture.
2. Identify any added, modified, deleted, or slug-shifted posts/pages. Reconcile them deliberately into EmDash without blindly re-running the importer (since retries skip existing records).
3. If deploying Node.js + SQLite: acquire a verified SQLite backup snapshot using `.backup` or `VACUUM INTO` (never copy live WAL files directly) and ensure media and `.env` secrets are bundled.
4. Run `npm run migration:verify -- --manifest audit/url-inventory.json --scope full` to ensure clean exit 0 before we switch DNS.
5. Review the rollback plan and lower DNS TTL to 300 seconds.
```

---

## 9. Brownfield Site Maintenance & Upgrades

Start from the installed profile, `package.json`, the site's instructions and its existing decisions. Use the applicable checked-in skills and commands, and keep optional project records optional. A scoped maintenance request can proceed from its affected stage without restarting discovery. For changes spanning several surfaces, use `new-site-workflow`'s scoped maintenance guidance; isolated edits can use their specialist directly. These recipes reuse the [spacing contracts](design-framework.md#8-contextual-spacing-maintenance), [reviewed static updates](baseline-updates.md) and [EmDash skill synchronization](skill-synchronization.md).

Choose visual intensity separately from preservation and release authority: [primitive modernization and refinement](#modernizing-an-earlier-baseline-site-primitives--refinement) keeps the accepted visual direction; [significant redesign](#significant-redesign-of-an-existing-site) explores new composition or a replacement world within explicit brand limits. For multi-deliverable work, use the existing tracker to map each requested result to source, observed evidence and current status. Continue required authorized work before final delivery; report real blockers and named external acceptance separately.

### Audit First, Then Choose the Follow-Up

Use this across design, content/schema, dependencies, configuration or workflow reviews when you want informed choices before changes. The outcome is an actionable plan; detailed audit output supports it.

```text
Audit [aspect] of [project/site] before implementing changes.

Inspect the actual source, installed setup and relevant runtime evidence.
Lead with your recommended follow-up plan: what to change, why it matters,
what to preserve, dependencies/tradeoffs and how each phase will be verified.
Give me a few meaningful decisions or alternatives, with a recommendation.
Keep the detailed report as supporting evidence; do not stop at findings.

Wait for my selection before applying recommendations. Once selected, continue
the agreed work through implementation and acceptance without repeated prompts
to continue. Include commit, push and applicable deployment in the plan; establish
the repository/branch, deployment target and release authority when we select it.
Respect any explicit local-only scope. Report the actual released revision and
live checks, or name the concrete remaining decision/action.
```

### Bringing an Existing Site Up to Date

Use this for a complete catch-up, covering packages, agent guidance and Baseline capabilities through the agreed release endpoint. Open the target site or a current Baseline checkout with access to it. The [existing-site update workflow](baseline-updates.md#existing-site-update-workflow) owns the process, including sites too old to have today's helpers or receipts. For a read-only assessment, replace the request to apply updates with "diagnose and propose only; do not modify the target."

```text
Bring this existing site up to date with applicable current Baseline capabilities.

Target site: [absolute path, or the current project]
Baseline reference: [current Baseline checkout path, or resolve the published
https://github.com/Vermeulen-Solutions/baseline repository]
Release scope: [repository/branch, deployment target and authorized actions;
or explicitly local-only]

Follow the existing-site update workflow in docs/baseline-updates.md from the
current Baseline reference. Resolve and record the published immutable commit
used. Read the target's AGENTS.md, profile/receipts when present, package and
lockfile, existing design/content decisions and local changes.

Compare framework/package dependencies, agent skills and working instructions,
and Baseline components, tooling, checks and newer capabilities. Record an
adoption plan, then complete compatible local updates within this request.
Use the installed platform's update path; explicitly integrate missing files,
scripts and dependencies. Review conflicts and manually adapt client code.
If an old site lacks update tools or provenance, compare source directly and
review helper adoption without inventing receipts or replacing the template.

Work on a maintenance branch or isolated checkout and preserve uncommitted work.
Preserve branding, calibrated tokens, routes, content, CMS data/media, edit
bindings, secrets and deployment/editor configuration. Establish separate data
recovery before any required CMS migration. Keep optional or incompatible
features deferred with reasons rather than changing the site's scope.

Run applicable verification, build and HTML or production-isolation checks.
Inspect affected pages in the browser and test editing/publication when affected
and access permits. Record the Baseline revision, adopted changes, deferrals,
conflicts, actual checks, pending acceptance and recovery point in the existing
tracker or a short handoff. Complete the agreed commit/push/deploy steps after
verification, or retain a reviewable local diff when the scope is local-only.
Do not infer release authority, production content writes or DNS cutover.
```

### Running a Diagnostic Site Standards Audit
Use this prompt to diagnose an existing downstream EmDash project against Baseline standards.

```markdown
Please run a read-only site standards audit on our downstream repository:
`npm run audit:site -- --root [path/to/downstream-repo] --out ./audit-report`

Once the diagnosis completes:
1. Summarize any failing scopes (design system tokens, schema budget, skill drift, adapter compatibility).
2. Propose a phased, user-selectable modernization plan following Tracks 1 through 5.
3. Wait for my selection before modifying any files in the target repository.
4. Include verification, commit/push and applicable deployment in the selected
   plan. Resolve the repository/branch, deployment target and release authority
   at selection; then complete authorized release steps without another prompt.
```

### Significant Redesign of an Existing Site

Use this for a substantial visual overhaul of an existing Baseline or other site. The concept pass defines the new composition before broad implementation. Specify fixed identity elements independently of the permitted visual change; use a local-only release unless broader actions are authorized.

```text
Significantly redesign this existing site using new-site-workflow,
site-art-direction, astro-site-design and the applicable Impeccable flow.

Target site: [folder and preview URL]
Baseline reference: [checkout path or immutable published revision]
Visual intensity: [significant overhaul within the brand / replacement world]
Preserve: [logo, palette/fonts if fixed, content, URLs, CMS/edit bindings,
forms, integrations and hosting configuration]
May change: [composition, hierarchy, navigation presentation, typography,
surfaces, image treatment and motion; state the brand limits]
Release scope: [repository/branch, deployment target and authorized actions;
or explicitly local-only]

Read installed instructions, profile, package scripts, lockfile, existing design
decisions and current content. Use the site's package manager and supported tools.
Inventory route archetypes and inspect the actual source at desktop and mobile.
Preserve product truth and editing ownership. Do not treat the old composition
as fixed unless listed above or mistake utility adoption for a redesign.

Develop two or three materially different concepts for a representative page
using real copy and available assets, including mobile intent. Compare audience
fit, identity continuity, readability, function and maintainability. Resolve the
direction decision before broad implementation; ask only consequential questions
not already answered. Record which previous visual decisions are superseded.

At the concept checkpoint, recommend a design iteration surface (OpenDesign, OpenPencil, Penpot, or direct Astro in the browser) and follow `site-art-direction/references/design-iteration.md` to iterate focused representative concepts before proving the direction in Astro. Use `opendesign-site-design` for OpenDesign, `openpencil-site-design` for OpenPencil, or `penpot-site-design` for Penpot.

Calibrate the selected system on the installed styleguide, implement one real
page per archetype and critique it in the browser before rolling it out. Keep
one requirement-to-evidence register in the existing tracker. Present requested
route proposals before their implementation. Validate saved capture dimensions,
loaded content, narrow/intermediate/wide layouts and changed interactions.
If native-browser access fails, discover supported built-in/connector options;
never bypass a policy denial. Test CMS save/reload when edit targets change,
using an authorized isolated copy where appropriate.

Run installed verification, build and release-isolation/HTML checks. Reconcile
every deliverable before ending: distinguish implementation, automated checks,
rendered behavior, editorial acceptance and deployment. Continue required work
within existing authorization; name real blockers and unobserved acceptance.
Finish the agreed commit/push/deploy steps and live acceptance; respect an
explicitly local-only scope and identify when no site deployment applies.
Keep content imports, production edits and DNS cutover separately authorized.
```

<a id="auditing--redesigning-an-earlier-baseline-site-visual--primitive-upgrade"></a>

### Modernizing an Earlier Baseline Site (Primitives & Refinement)

Use this to backport compatible primitives, audit rendered quality and refine routes within the accepted brand and composition. The legacy “Auditing & Redesigning” anchor above is retained for existing links. Use the significant-redesign recipe when the visual direction itself should change.

```markdown
Audit and modernize the design of this earlier Baseline site while preserving its brand identity, content, and CMS bindings.

- Target site folder: [path/to/site, or current project]
- Live / preview URL (optional): [e.g., https://my-site.workers.dev]
- Baseline reference: [path/to/current-baseline, or https://github.com/Vermeulen-Solutions/baseline]
- Release scope: [Repository/branch, deployment target and authorized commit/push/deploy actions, or explicitly local-only]

Use the installed profile, scripts, package manager and lockfile. Preserve the
accepted visual direction and record each requested deliverable in the existing
tracker with its implementation, evidence and current status.

Please follow the Early-Baseline upgrade playbook in `.agents/skills/new-site-workflow/references/site-maintenance.md` and `.agents/skills/astro-site-design/references/migration-visual-audit.md`:

1. **Diagnose Installed Primitives**:
   - On EmDash sites, run `npm run audit:site -- --root <site-path> --out <private-report-dir>` and inspect `design-system:tokens-and-rhythm` and `design-system:card-and-breakout` (`fourVoiceTypography`, `threeTierSurfaces`, `bentoAndSpecimenPrimitives`, `tactileActionVariants`, `cardTransitionMorphing`, `siteShellChoreography`, `expressivePrimitiveUsageCount`).
   - On static sites, inspect `src/styles/global.css`, `src/layouts/SiteShell.astro`, `src/layouts/Base.astro`, and `src/components/Card.astro` (or stage `npm run sync:baseline`).
2. **Backport Modern Primitives Non-Destructively**:
   - Preserve the site's calibrated `@theme` palette, `--font-display`, `--font-body`, and `AGENTS.md` `## Art Direction Record`.
   - Add missing `--font-mono` and `--font-accent`; merge compatible `@layer base` / `@layer components` primitives: `--color-elevated` / `--surface-glass`, `.eyebrow-telemetry` / `.font-accent` / `.tabular-nums`, `.btn--secondary` / `.btn--ghost` / `.icon-nudge`, `.bento-grid`, `.grid-hairline`, `.ui-specimen`, `[data-reveal]`, `[data-sticky-header]` and View Transition rules. Review/adapt `SiteShell.astro`, `Base.astro` and `Card.astro` without overwriting client wrappers or calibration. Use the concrete checklist; record specific brand/function exceptions. Audit flags/counts are diagnostic cues, not quality scores.
3. **Visual Audit & Route-by-Route Upgrade Proposal**:
   - Inspect the rendered pages at desktop (`1440x900`) and mobile (`390x844`) against the **5-Point Visual Self-Critique Rubric** and the **Early-Baseline & Legacy Pattern -> Modern Baseline Upgrade Matrix**.
   - Present a concise **Preserve / Improve / Upgrade** table per route before editing routes. Identify actual problems, proposed remedies and reasons to retain or decline capabilities. Reuse settled decisions; resolve only consequential open choices before implementation.
4. **Execute & Verify**:
   - Apply the approved route upgrades, calibrate applicable primitives on `/_styleguide` (`audit/component-calibration.md`), preserve all EmDash `{...entry.edit.*}` proxies and URLs, and run the installed verification/build and HTML/release-isolation checks.
   - Browser-test affected routes at the requested and relevant intermediate widths. Validate actual tab/capture dimensions and inspect saved pixels; exercise changed interactions and editor behavior when affected. If a native browser fails, discover supported built-in/connector alternatives without bypassing a policy denial.
   - Reconcile every requested result with observed evidence before final delivery. Continue required authorized work; distinguish implemented, verified and explicitly deferred scope. Complete the agreed commit/push/deploy steps and live acceptance, or leave a local diff for explicitly local-only scope. Report concrete blockers and actual revisions/URLs; do not infer missing release authority or unrelated data/DNS permissions.
```

### Synchronizing Upstream Skills
Use this prompt to pull updated AI guidance into your project.

```markdown
Review upstream skill updates for this installed project. Read AGENTS.md,
baseline.config.json when present, package.json and the applicable update guide.

For static/static-sveltia, use the installed sync:baseline command with an
immutable Baseline commit, following docs/baseline-updates.md. Its reviewed
candidates include the installed shared skills; report other proposed files
as part of the full candidate scope. When that scope includes unrelated shared
source updates, leave it staged until the broader update is authorized. Preserve
the managed update path and its provenance records.

For emdash, use the installed sync:site-skills and sync:emdash-skills helpers
with --check for comparisons, then stage applicable candidates following
docs/skill-synchronization.md. If an older installation lacks a helper or guide,
report the available update path before attempting changes.

Review candidate diffs, provenance, licenses, local customizations and conflicts.
Report the proposed application scope and apply within the existing
authorization; leave unresolved ownership or conflicts for review. Report
staged, applied and deferred changes accurately, then run applicable installed
checks. Preserve client-owned content, calibrated design and configuration.
```

### Day-2 Design System & Token Updates (Client Request)
Use this prompt when a client requests system-wide styling changes (e.g., border radii, brand colors, typography pairings, or spacing density).

```markdown
We need to update our design system tokens based on client feedback: [Insert request, e.g., "Change our card corner radius to be sharper / softer" or "Update the primary brand accent to #0066CC"].

Please:
1. Inspect the current token consumers and establish whether the request affects the whole site, one region or one primitive. Reuse the site's approved design and existing content.
2. Before visual implementation, align the existing `## Art Direction Record` in `AGENTS.md` with the requested change and run `npm run check:art-direction -- --require-record`.
3. Change the smallest appropriate scope in `src/styles/global.css` or the affected composition. Global scales belong in `@theme`; structural spacing aliases such as `--layout-grid-gap` belong in regular `:root`. A local spacing request should use the region's alias or primitive gap control. Preview token CLI changes before writing; reserve lane/space-scale resets for an explicitly requested global recalibration.
4. Run `npm run design:tokens` for the supported token diagnostics. Inspect affected components and the styleguide at narrow, intermediate and wide widths, including an unaffected reference composition. Record actual observations separately from generated calibration data; token diagnostics do not establish complete accessibility or visual acceptance.
5. Run the installed verification, build and release checks, and report changed scope, preservation checks and remaining acceptance. Refresh source-bound calibration after saving the final CSS when applicable.
```

### Day-2 Section Layout Refactoring (e.g., Bento, Split, Timeline)
Use this prompt when a client requests restructuring a specific section on a page into a different layout pattern.

```markdown
We need to refactor a section layout based on client feedback:
- Page / Route: [Insert path, e.g., src/pages/index.astro]
- Section to update: [Insert section, e.g., "Features / Services grid"]
- Desired layout: [Insert pattern, e.g., Bento grid / Alternating split feature / Timeline]

Please:
1. Inspect the target composition and its content/editing owner. Preserve the established design, copy, navigation and unaffected sections. Check the existing Art Direction Record with `npm run check:art-direction -- --require-record` before visual implementation.
2. Recompose the section using the existing semantic primitives (`<Section>`, `<Container>`, `<Grid>`). For a local grid-gap change, use that Grid's `gap` prop, for example `gap="calc(var(--layout-grid-gap) * 0.75)"`; use regional aliases for changes spanning several primitives. Keep CSS in named layers and avoid combining gap with flow margins for the same relationship.
3. Reuse existing tokens and component controls. If a new reusable component is needed, follow the installed component-quarantine guidance and calibrate it on the styleguide.
4. Compare the changed section and an unaffected reference at narrow, intermediate and wide widths. Check intended geometry, responsive reflow, copy, navigation and relevant keyboard behavior. Run the installed verification, build and release checks, and report actual rendered observations.
```

### Day-2 Adding a New Page or Section (Client Request)
Use this prompt when a client asks to build a new page or add a new section to an existing route.

```markdown
We need to add a new [page / section] based on client feedback:
- Type: [New standalone route, e.g., src/pages/pricing.astro / New section on existing page]
- Goal & Content: [Describe purpose, headings, content, and call-to-actions]
- Content Source: [Editor-managed via CMS or Content Collections / Static code template]

Please:
1. Inspect the installed profile and reuse an existing content type when it fits. Static profiles use typed Markdown; static-sveltia also needs a paired editor form when fields change. EmDash uses live content APIs. Change schemas only when needed, preserving existing entries; a seed is not a content migration.
2. Before visual implementation, check the existing Art Direction Record with `npm run check:art-direction -- --require-record`. Wrap new routes with the existing `Base.astro` or site shell and compose with layout primitives. Preserve the installed static/server rendering behavior.
3. Fit new sections into the established page rhythm, spacing and editorial rendering. Preserve unaffected sections and existing copy.
4. For assets: place photographic/vector images in `src/assets/` using `<ResponsiveImage>` or native Astro `<Image>`, or upload to the CMS Media Library (never put content images in `public/`).
5. If the page should be discoverable, update the actual navigation owner: for example `src/config/site.ts` in static profiles or live EmDash menus. Update seeds separately only when changing new-install defaults; editing a seed does not update an existing site's menu records.
6. On EmDash sites, preserve live editing with the correct `{...entry.edit.*}` field proxies. Verify typing, save and reload when edit targets change, reporting any acceptance that access prevents.
7. Run the installed verification, build and release checks. Inspect the route/section, links, draft exclusion where applicable, keyboard behavior and responsive reflow; report remaining editorial or launch acceptance.
```

### Day-2 Renaming, Moving, or Deprecating Routes (Client Request)
Use this prompt when a client asks to rename an existing page or remove an obsolete route.

```markdown
We need to [rename / move / remove] an existing route based on client feedback:
- Existing route: [Insert path, e.g., /our-team or /faq]
- Action: [Rename to /team / Remove and consolidate into /contact]

Please:
1. Move or remove the target route template/content.
2. Set up a permanent 301 redirect from the old URL to the new destination (in `astro.config.mjs` `redirects` for static sites, or EmDash redirect middleware for CMS sites) to protect SEO and backlinks.
3. Update all internal links across existing pages and site menus (header, footer, CMS menus).
4. Run `npm run verify` to confirm all checks and link integrity pass.
```

### Day-2 Deploying Changes to Staging (Cloudflare Workers)
Use this prompt when changes are ready for client review or pre-production testing on staging.

```markdown
We want to deploy our latest changes to our Cloudflare Workers staging environment for review.

Please:
1. Run `npm run verify` to confirm all lint, art direction, and typechecks pass.
2. Run `npm run build` to compile the production edge bundle.
3. Follow the site's existing migration mode and EmDash upgrade work order. Added/pending migrations or data-changing actions need a database recovery point before startup/deploy; on D1, record a Time Travel bookmark with existing Wrangler access. Use a separate migration command/token only if the site already uses that workflow or the migration requires it. Reuse existing media/key recovery versions when unchanged (docs/cloudflare-backup-restore.md).
4. Deploy to the staging environment:
   `npx wrangler deploy --env staging`
5. Verify the live staging URL (e.g. https://staging.client-site.com) and confirm `X-Robots-Tag: noindex` or `<meta name="robots" content="noindex">` is present.
```

### Day-2 Cloning Production Content to Staging (EmDash Site Transfer)
Use this prompt for content transfer into empty staging. Site export is not DR; it omits auth and plugin operational state. Follow docs/cloudflare-backup-restore.md for D1 + media + key recovery. Authenticate each CLI origin with emdash login and create the ignored transfers directory first.

```markdown
We need to clone current production content into our staging environment so we can test against realistic data.

Please:
1. Export the production site snapshot:
   `npx emdash site export --url https://client-site.com --output .emdash/transfers/prod-clone.emdash`
2. Prepare an empty staging content target with an administrator, analyze the package, then execute with the reviewed --plan <digest> --confirm:
   `npx emdash site import .emdash/transfers/prod-clone.emdash --analyze --url https://staging.client-site.com`
3. Verify that staging has loaded the collections, media, and menus.
```

### Day-2 Deploying Changes to Cloudflare Workers (Production)
Use this prompt when code, styling, or template changes are approved and ready to go live.

```markdown
We are ready to deploy our latest changes to Cloudflare Workers production.

Please:
1. Run `npm run verify` to confirm all lint, art direction, and typechecks pass.
2. Run `npm run build` to compile the production edge bundle.
3. Follow the site's existing migration mode and EmDash upgrade work order. Added/pending migrations or data-changing actions need a database recovery point before startup/deploy; on D1, record a Time Travel bookmark with existing Wrangler access. Use a separate migration command/token only if the site already uses that workflow or the migration requires it. Reuse existing media/key recovery versions when unchanged (docs/cloudflare-backup-restore.md).
4. Deploy the updated worker and assets:
   `npx wrangler deploy`
5. Smoke-check changed production routes, assets and required bindings. Verify setup status when launching/changing authentication, and publish/purge or scheduled tasks when this release changes those features. Record unobserved acceptance honestly.
```

### Day-2 Emergency Deployment Rollback (Cloudflare Workers & D1)
Use this prompt when a newly deployed change causes production errors and must be reverted immediately.

```markdown
An emergency occurred on our live Cloudflare Workers deployment: [Describe issue, e.g., "Contact form broken" or "500 error on service pages"]. Revert production immediately.

Please:
1. Roll back the Cloudflare Worker to the previous stable release:
   `npx wrangler rollback`
2. Determine whether the release changed database/media state and whether the previous Worker can use the current database. If code rollback restores service, retain the current data. A database restore overwrites later writes: prepare the exact target, recovery bookmark and reconciliation plan before any separately authorized restore under docs/cloudflare-backup-restore.md. Restore media/keys only when their state also needs recovery.
3. Verify that the production site has returned to stable operation.
4. Report the rollback status and preserve local error logs for post-mortem debugging.
```

### Day-2 Pulling Production Content to Local Development
Use this prompt when you need to sync your local development environment with fresh content, media, or schema created by editors in production.

```markdown
We need to sync our local development environment with latest production content and media before developing new features.

Please:
1. Export the current production site package:
   `npx emdash site export --url https://client-site.com --output .emdash/transfers/prod-latest.emdash`
2. Prepare a separate empty local content target with an administrator, analyze the package, then execute with the reviewed --plan <digest> --confirm:
   `npx emdash site import .emdash/transfers/prod-latest.emdash --analyze`
3. If only D1 database schema inspection is needed without media, pull a D1 snapshot:
   `npm run db:pull-remote -- --config wrangler.jsonc --env production --account <account-id> --database <database-uuid> --out .emdash/backups/d1-inspection-001`
4. Run `npm run dev` and confirm that local routes display the latest production content.
```

---

## 10. Design Iteration: OpenDesign, OpenPencil, Penpot or Astro

For a new site or substantial overhaul, recommend a design iteration surface and offer OpenDesign, OpenPencil, Penpot, and direct Astro in the browser explicitly. Use the shared `site-art-direction/references/design-iteration.md` at the concept checkpoint. See [OpenDesign onboarding](opendesign-onboarding.md), [OpenPencil onboarding](openpencil-onboarding.md), [Penpot onboarding](penpot-onboarding.md), and their respective specialist skills (`opendesign-site-design`, `openpencil-site-design`, `penpot-site-design`).

### Canvas-led kickoff, one agent

```markdown
Follow new-site-workflow and site-art-direction/references/design-iteration.md. I want to iterate visually before broad implementation. Recommend OpenDesign, OpenPencil, or Penpot based on my preferences and access, and offer direct Astro/browser as an explicit choice. Reuse settled choices and onboard me only for a missing connection step. Preserve [fixed brand/content/features]; explore [changeable scope] using a representative real route. For a new direction, compare two or three compact concepts with desktop/mobile intent. Show the render and recommend a meaningful next change; incorporate feedback in focused batches without recreating every route or the component library. Resolve direction selection, then calibrate native primitives, prove one real Astro route and roll out with browser acceptance. Keep one agent unless I request a handoff. Finish [authorized commit/push/applicable deployment, or local-only].
```

### Direct Astro/browser, one agent

```markdown
Follow new-site-workflow, site-art-direction and astro-site-design. I want to iterate directly in Astro/browser with this agent. Preserve [fixed branding/content/features], and explore [changeable scope] for [representative route]. For a substantial overhaul, show two or three materially different native concepts under audit/visual-concepts/ using real copy or labeled drafts, at 1440×900 and 390×844. Compare them with an actionable recommendation and the choice you need from me before broad implementation. Keep the concrete surface/type/rhythm/action/motion recipes and record justified exceptions. After selection, calibrate production primitives on /_styleguide and test real routes, intermediate reflow, keyboard and content states. Finish [authorized commit/push/deploy targets, or local-only].
```

### OpenDesign design and implementation, same agent

```markdown
Use opendesign-site-design and Baseline's design-iteration workflow. Keep this task in one agent unless I request a handoff. Confirm the local OpenDesign daemon is running; search bundled design systems and examples during Stage 4A research. Author zero-JS HTML/CSS slices with data-od-id section anchors, validate with `od lint --fail-on p1`, export 1440×900 and 390×844 renders, and iterate based on my feedback. Resolve the direction selection, translate components into Baseline Astro primitives, calibrate on /_styleguide, and complete the routes. Finish [authorized commit/push/deploy targets, or local-only].
```

### OpenPencil design and implementation, same agent

```markdown
Use openpencil-site-design, the official open-pencil/open-pencil skill matching my desktop app/MCP release, and Baseline's shared design-iteration loop. Keep one agent unless I request a handoff. Confirm document identity and live schemas; preserve existing designs and [fixed commitments]. Use native layout and reusable variables/components for representative concepts, show renders and iterate my feedback in focused batches. Check exact font availability and long-copy/mobile constraints. Resolve the direction choice and save to an agreed local .fig path; verify recovery when needed. Apply the actual Baseline token/component APIs, prove one native Astro route, then roll out with styleguide/browser acceptance and [authorized release endpoint]. Exported design JSX is not production Astro. Avoid a duplicate full site or repeated library rebuilds during canvas iteration.
```

### Penpot design and implementation, same agent

```markdown
Use penpot-site-design and Baseline's shared design-iteration loop. Keep this task in one agent. Confirm the connected file/page matches [target]; onboard me only for the missing step. Read source CSS/component APIs and preserve [fixed commitments]. Develop representative concepts for [scope], show exports and iterate my feedback in focused batches using existing nodes/tokens/components. Preserve fluid expressions and real content ownership. Resolve the meaningful direction choice, then prove it in native Astro, calibrate /_styleguide and roll out. Browser-test affected routes at 390/768/1440 including important states, run installed checks and finish [authorized release endpoint]. Do not maintain a duplicate full Astro site during canvas edits or require a redundant same-agent handoff packet.
```

### Optional design-agent handoff

```markdown
Prepare a portable design brief for another agent to iterate in [OpenDesign / OpenPencil / Penpot] using Baseline's design framework. Include the actual direction, source token expressions/components, fixed/changeable commitments, representative real content/assets, 1440×900 and 390×844 intent, important states, concrete five-point recipes and accepted exceptions. Include or attach the relevant skill/reference files so the other agent has the instructions. Keep source copy/CMS, CSS and visual proposals distinct. No credentials. Do not message or launch another agent; I will transfer the brief. That agent should save selected/draft board IDs, dated evidence, approval status, native mapping and open questions in a portable handoff.
```

### Implement a reviewed canvas design

```markdown
Read the attached Baseline handoff and relevant installed tool skill/API. Reconnect privately and inspect the saved file/page/board IDs and current state against dated evidence. Reuse [approved choice and scope]; resolve any material newer-draft difference. Translate through actual Section/Container/Grid/Sidebar/Card APIs, source fluid tokens and the installed profile's real content bindings. Never paste absolute canvas markup into public routes. Calibrate on /_styleguide, implement one representative route, compare/fix browser output before rollout, then verify every affected route and relevant state. Finish [authorized commit/push/deploy endpoint]. Report any concrete acceptance limits rather than treating canvas exports or a successful build as browser proof.
```

