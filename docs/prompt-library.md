# AI Developer Prompt Library

This prompt library provides ready-to-copy, battle-tested prompt recipes for developers pairing with AI coding assistants (Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Aider, OpenCode, or local LLMs).

Use these prompts to invoke specific Baseline features and workflows without having to remember internal commands or skill names.

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

### Express / Autonomous Mode Kickoff (3 Checkpoints — For Smaller Sites)
Use this prompt when building a straightforward greenfield site (`<= 6` routes, `<= 3` collections, single locale) and you want the agent to move through discovery, platform setup, and content modeling in one consolidated pass before pausing.

```markdown
Read AGENTS.md, follow new-site-workflow under .agents/skills/ in **Express Track (3 Checkpoints)**, and build this site using consolidated checkpoints:

- Client / Brand: [Insert Brand Name]
- Purpose & Routes: [E.g., 5-page architecture studio site: Home, Projects, Studio, Journal, Contact]
- Primary Audience: [E.g., Residential and cultural architecture clients]
- Aesthetic Lane / Palette: [E.g., Editorial Paper / Product-Led Minimalism, or seed accent #1B4332]
- Hosting & Locale: [E.g., Node.js + SQLite, single language (en)]

Please complete **Checkpoint A (Stages 1–3: Brief, Platform & Content Schema)** and present the Checkpoint A handoff.
```

### Standard Agency Mode Kickoff (Full 7 Stages — For Complex Sites & Migrations)
Use this prompt when starting a complex multi-collection build, multi-locale site, or legacy migration with step-by-step stage approvals.

```markdown
Read AGENTS.md, follow new-site-workflow under .agents/skills/, and guide me through the staged delivery workflow.

Here is the context for this project:
- Client / Brand: [Insert Brand Name]
- Purpose / Goal: [E.g., B2B SaaS marketing site / Architecture studio portfolio]
- Primary Audience: [E.g., Prospective enterprise buyers / Creative directors]
- Brand Assets Available: [E.g., SVGs in src/assets/, brand colors: #1A1A1A and #0055FF, typography: Inter + Newsreader]
- Required Locales: [E.g., Single language (en) or Multilingual (en, de)]

Please begin with Stage 1 (Brief & Evidence Discovery) and present the Stage 1 handoff choices once complete.
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
- Target storage: [Local SQLite / Cloudflare R2]

Please run the migration helper in prepare mode first, verify the generated JSON manifest and image dimensions, and then guide me through running ingestion through supported EmDash APIs.
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

---

## 9. Brownfield Site Maintenance & Upgrades

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
Please run `npm run sync:site-skills` and `npm run sync:emdash-skills` to check for upstream updates to our skills under .agents/skills/.

Review the staged diff, verify that any intentional local customizations are preserved, and guide me through applying or deferring the candidate updates.
```
