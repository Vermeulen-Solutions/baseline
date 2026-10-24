# AI Developer Prompt Library

This prompt library provides adaptable recipes for the documented Baseline workflows when pairing with AI coding assistants (Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Aider, OpenCode, or local LLMs). See [Support Boundaries](support-boundaries.md) for scoped evidence and site-specific acceptance.

Use these prompts to invoke specific Baseline features and workflows without having to remember internal commands or skill names.

Check the installed profile and `package.json` before choosing commands. Handoffs report evidence and next steps; they do not require a reply unless a consequential decision or external-action authorization is missing. The kickoff prompts below request a complete local build. For a discovery-only or review-at-each-stage task, state that scope explicitly.

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

---

## 1. Starting a New Site Project

Start with the [README quickstart](../README.md#quickstart) to prepare a site
folder and open it as a project in your assistant. Then use the matching profile
prompt and choose Express or Standard. The track-specific prompts below expand
the brief once your assistant has access to the project.

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

Determine the profile first and work in its project directory. Complete the local site and verification, reporting Checkpoints A–C as you go. Continue authorized work without waiting for a reply at each checkpoint; ask only for consequential missing decisions or external actions not already authorized. Record approved versus assumed choices and any acceptance still pending. Save and check the Art Direction Record, then calibrate on /_styleguide before broad page assembly.
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

Begin with Stage 1 (Brief & Evidence Discovery), determine the profile, and complete the requested local site and verification. Report stage handoffs and continue authorized work; ask only for consequential missing decisions or external actions not already authorized. Record approved versus assumed choices and any acceptance still pending. Save and check the Art Direction Record, then calibrate on /_styleguide before broad page assembly.
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
Use this prompt to prepare and ingest legacy media attachments.

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
1. Use our layout primitives (<Section>, <Container>, <Grid>, and <Card>) according to our design tokens.
2. Query the EmDash collection server-side.
3. Pass page identity to Base.astro and spread visual editing proxies ({...entry.edit.field}) onto editable elements.
4. If this is an editorial article with wide pull-quotes or galleries, use `<Container breakout>` and `.content-grid`.
5. Ensure 0 KB of unnecessary client-side JavaScript.
```

---

## 6. Visual Polish & The Impeccable Critique

### Bounded UI / UX Critique Pass
Use this prompt once a representative page is rendering in the browser.

```markdown
Activate the impeccable skill and perform a visual critique pass on our rendered [Homepage / About / Case Study] page.

Please evaluate:
1. Visual hierarchy and typography contrast (are headings distinct, is body measure constrained to ~68ch?).
2. Spatial pacing and rhythm between sections (does the layout feel repetitive or dynamic?).
3. Surface contrast and action styling across light, muted, and dark backgrounds.
4. Focus states and keyboard accessibility on cards (.clickable-parent / .focus-parent).
5. Mobile viewports (320px–480px) and tablet transitions.

Provide a concise list of high-impact refinements, and propose concrete token or markup edits to resolve them.
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

Start from the installed profile, `package.json`, the site's instructions and its
existing decisions. Use the applicable checked-in skills and commands, and keep
optional project records optional. A scoped maintenance request can proceed from
its affected stage without restarting discovery. For changes spanning several
surfaces, use `new-site-workflow`'s scoped maintenance guidance; isolated edits
can use their specialist directly. These recipes reuse the
[spacing contracts](design-framework.md#8-contextual-spacing-maintenance),
[reviewed static updates](baseline-updates.md) and
[EmDash skill synchronization](skill-synchronization.md).

### Running a Diagnostic Site Standards Audit
Use this prompt to diagnose an existing downstream EmDash project against Baseline standards.

```markdown
Please run a read-only site standards audit on our downstream repository:
`npm run audit:site -- --root [path/to/downstream-repo] --out ./audit-report`

Once the diagnosis completes:
1. Summarize any failing scopes (design system tokens, schema budget, skill drift, adapter compatibility).
2. Propose a phased, user-selectable modernization plan following Tracks 1 through 5.
3. Wait for my selection before modifying any files in the target repository.
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
3. Record staging recovery bookmark/media/key receipts, then inspect/apply EmDash core migrations to the explicit staging database with the reviewed target fingerprint (docs/cloudflare-backup-restore.md). Use Wrangler migrations only for site-owned SQL.
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
3. Record the production recovery bookmark, media snapshot and key-vault version; fail before migration if any is missing. Inspect/apply EmDash core migrations using the exact account/database UUID and reviewed fingerprint (docs/cloudflare-backup-restore.md).
4. Deploy the updated worker and assets:
   `npx wrangler deploy`
5. Verify production setup status, previous/current asset URLs, publish/purge, environment parity and an observed scheduled post per docs/edge-cache-lifecycle.md.
```

### Day-2 Emergency Deployment Rollback (Cloudflare Workers & D1)
Use this prompt when a newly deployed change causes production errors and must be reverted immediately.

```markdown
An emergency occurred on our live Cloudflare Workers deployment: [Describe issue, e.g., "Contact form broken" or "500 error on service pages"]. Revert production immediately.

Please:
1. Roll back the Cloudflare Worker to the previous stable release:
   `npx wrangler rollback`
2. Restrict writes/setup paths and capture current state. Review loss of later writes, then follow docs/cloudflare-backup-restore.md to restore DB + matching media + encryption-key list + compatible code/config. Deliberately select the account/config/environment/database before restoring:
   `npx wrangler d1 time-travel restore <database-binding> --timestamp="YYYY-MM-DDTHH:MM:SSZ"`
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






