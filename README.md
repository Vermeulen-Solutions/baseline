<p align="center">
  <img src="docs/images/baseline-logo.svg?v=2" alt="Baseline — Agent-First Web Starter for Astro & EmDash CMS" width="468" />
</p>

<p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-7.4.0-BC52EE" alt="Astro 7.4.0" /></a>
  <a href="https://docs.emdashcms.com/"><img src="https://img.shields.io/badge/EmDash-1.3.0-2563EB" alt="EmDash 1.3.0" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-06B6D4" alt="Tailwind v4" /></a>
  <a href="#-60-second-quickstart"><img src="https://img.shields.io/badge/Node-LTS-339933" alt="Node LTS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="#-quickstart"><strong>Quickstart</strong></a> ·
  <a href="docs/prompt-library.md"><strong>Prompt Library</strong></a> ·
  <a href="#-where-to-look-in-your-browser"><strong>Browser Dev URLs</strong></a> ·
  <a href="#the-7-stage-site-delivery-workflow"><strong>7-Stage Workflow</strong></a> ·
  <a href="#why-baseline"><strong>Why Baseline?</strong></a> ·
  <a href="docs/README.md"><strong>Documentation</strong></a>
</p>

---

**Baseline is the agent-first frontend foundation and development guardrail system for Astro**, designed ground-up for developers pairing with AI coding assistants—whether using **Claude Code**, **OpenAI Codex**, **Google Antigravity**, **OpenCode / OMP**, **Hermes**, **Cursor**, **Windsurf**, **Aider**, or local LLM runners.

By default, Baseline powers full-scale applications with **EmDash CMS**—a lightweight headless CMS featuring live visual page editing, relational SQLite/D1, and native Model Context Protocol (MCP) server integration. When a database or server runtime isn't required, Baseline's **Platform Profiles** let you output pure static Astro sites or Git-backed Sveltia CMS sites while sharing the exact same fluid design tokens, WCAG contrast checks, layout primitives, and component quarantine (`/_styleguide`).

---

## Platform Profiles

| Profile | Editing | Foundation |
| --- | --- | --- |
| `static` | Developer/agent edits typed Markdown collections | Native Astro static output |
| `static-sveltia` | Sveltia browser editor commits the same files | Same static output plus `/admin/`; OAuth proxy or PAT |
| `emdash` | Relational CMS, live edit canvas and MCP | Existing Node/SQLite or configured Workers/D1/R2 |

All profiles share tokens, layout primitives, `SiteShell.astro`, native image
presentation and `/_styleguide` calibration. Choose the editing and operational
model independently from the Standard/Express delivery track. See
[Platform Profiles](docs/platform-profiles.md) and [staged updates](docs/baseline-updates.md).

## ⚡ Quickstart

For a pure static project without a CMS, run
`npm run init:profile -- --profile static --out C:/dev/my-static-site` from this
checkout, then install and verify in the generated directory. See the
[Platform Profiles guide](profiles/README.md) for the allowlists, provenance,
static and Sveltia generation. Use `--profile static-sveltia` for the browser editor,
then follow its generated `docs/sveltia-cms.md` to configure the site's repository
and authentication. Commit the new lockfile after the first `npm install`;
generated CI uses `npm ci`. The root quickstart below continues
to use EmDash.

**Requirements:** Node 22.22.2 minimum (Node 24 LTS recommended) and `npm`.

### 🚀 Starting a New Site Project (Recommended)

This repository is a **GitHub Template**. To build a new website:

1. Click the green **[Use this template](https://github.com/new?template_name=baseline&template_owner=Vermeulen-Solutions)** button at the top of this repository (or use the GitHub CLI):
   ```sh
   gh repo create my-site --template Vermeulen-Solutions/baseline --private --clone
   cd my-site
   ```
2. Install dependencies & initialize secrets:
   ```sh
   npm install
   npx emdash secrets generate --write .env
   npm run dev
   ```
3. Initialize client tokens and seed your aesthetic lane:
   ```sh
   # Seed an aesthetic lane (e.g. editorial-paper, product-minimalism, technical-data, warm-editorial)
   npm run design:tokens -- --init-client --lane editorial-paper
   ```

---

### 🛠️ Contributing to the Baseline Starter Itself

If you are developing or maintaining the Baseline template engine, specialist skills, or testing suites:

```sh
git clone https://github.com/Vermeulen-Solutions/baseline.git
cd baseline
npm install
npm run verify
```

### 🖥️ Where to look in your browser

Once `npm run dev` is running, open these local URLs:

| Destination | Local URL | What it's for |
| --- | --- | --- |
| 🌐 **Public Site** | [`http://localhost:4321/`](http://localhost:4321/) | Live website rendered by Astro |
| ✏️ **CMS Admin** | [`http://localhost:4321/_emdash/admin`](http://localhost:4321/_emdash/admin) | Create your admin account, manage collections, and edit content |
| 🧪 **Component Styleguide** | [`http://localhost:4321/_styleguide`](http://localhost:4321/_styleguide) | Stress-test layout primitives and calibrate typography/spacing (404 in production) |

---

## 🤖 Pairing with Your AI Assistant

Baseline is harness-agnostic. Whether pairing with **Claude Code**, **OpenAI Codex**, **Google Antigravity**, **Cursor**, **Windsurf**, or **Aider**, you never have to guess what to prompt.

### 📋 Starter Prompts: Kick Off a New Site

Choose **Standard Mode (7 Stages)** for complex migrations and multi-locale sites, or **Express Mode (3 Checkpoints)** for smaller greenfield builds (`<= 6` routes):

**Option A — Express / Autonomous Mode (3 Checkpoints):**
```markdown
Read AGENTS.md, follow new-site-workflow under .agents/skills/ in **Express Track (3 Checkpoints)**, and build this site with consolidated checkpoints:
- Client / Brand: [Brand Name]
- Purpose & Routes: [E.g., 5-page B2B studio site: Home, Work, About, Blog, Contact]
- Aesthetic Lane / Palette: [E.g., Editorial Paper / Product-Led Minimalism, or seed accent #1B4332]

Complete Checkpoint A (Brief, Platform & Content Schema) and present the Checkpoint A handoff.
```

**Option B — Standard Agency Mode (Full 7 Stages):**
```markdown
Read AGENTS.md, follow new-site-workflow under .agents/skills/, and guide me through the staged delivery workflow.

Here is the context for this project:
- Client / Brand: [Brand Name]
- Purpose: [E.g., B2B marketing site / Portfolio / Directory]
- Target Audience: [E.g., Enterprise buyers / General public]
- Locales: [E.g., Single language (en) or Multilingual (en, fr)]

Please begin with Stage 1 (Brief & Evidence Discovery) and present the Stage 1 handoff choices once complete.
```

### 📚 Ready-to-Copy Prompt Recipes
Need to run a specific task? Copy battle-tested prompt templates directly from our prompt playbook:

👉 **[Open the AI Developer Prompt Library (`docs/prompt-library.md`)](docs/prompt-library.md)**

- 🚀 [Kickstarting a Greenfield Site (Express 3-Checkpoint or Full 7-Stage)](docs/prompt-library.md#1-starting-a-new-site-project)
- 🗄️ [Auditing WordPress Content & Finding Hidden Entities](docs/prompt-library.md#2-wordpress-migration--content-modeling)
- 🖼️ [Manifest-Driven WordPress Media Ingestion](docs/prompt-library.md#2-wordpress-migration--content-modeling)
- 🎨 [Art Direction & The Design Gate](docs/prompt-library.md#3-art-direction--the-design-gate)
- 📦 [Quarantining Tailwind Blueprints (21st.dev to Zero-JS Astro)](docs/prompt-library.md#4-component-sourcing--styleguide-quarantine)
- ✏️ [Wiring EmDash Live Edit Proxies](docs/prompt-library.md#5-public-pages--emdash-editorial-canvas)
- 🔍 [Bounded UI/UX Polish with Impeccable Critique](docs/prompt-library.md#6-visual-polish--the-impeccable-critique)
- 📸 [Local Visual Regression Testing (`npm run test:visual`)](docs/prompt-library.md#7-local-visual-regression--pre-launch-checks)
- 🛡️ [Cloudflare Cutover & Corporate Email DNS Safety](docs/prompt-library.md#8-production-cutover--corporate-email-safety)

To connect your coding assistant directly to EmDash's built-in Model Context Protocol (MCP) server for managing content and schema, generate a token in one step:
```sh
npm run mcp:token
```
See [agent documentation](docs/agent-documentation.md) for harness integration, specialist skill syncing (`npm run sync:site-skills`), and MCP setup across all major tools.

---

## The 7-stage site delivery workflow

Pairing with an AI coding assistant without a structured process usually results in "one-shot prompt chaos"—where an assistant attempts to do discovery, database schema, responsive layouts, and copy all at once, resulting in broken schemas and generic styling.

Baseline organizes projects into an explicit 7-stage agency workflow (available as the **Standard 7-Stage Track** for complex migrations or the **Express 3-Checkpoint Track** for smaller greenfield builds):

1. **Brief & Evidence:** Gather real brand assets, photography, client requirements, and existing site screenshots before touching code.
2. **Platform, Plugins & Hosting:** Choose Node/SQLite or Cloudflare Workers/D1/R2 (keeping Cloudflare's 100-column table limits in mind) and evaluate optional native EmDash plugins (`@eventual/emdash`, `@linguadash/emdash`, `@perkyzz/emvb`).
3. **Content Architecture & Candidate Discovery:** Model EmDash collections before writing templates. Hunt for implicit entities trapped in page bodies or ACF repeaters using the [Content Candidate Register](docs/wordpress-content-modeling.md).
4. **The Art Direction Gate:** Initialize a client site in one command (`npm run design:tokens -- --init-client --lane <lane>`) to record an aesthetic lane, typography pairings, token physics, and explicit anti-patterns in `AGENTS.md` (`npm run check:art-direction`) and calibrate tokens in `src/styles/global.css`. [Art Direction Guide](docs/art-direction-workflow.md).
5. **Component Sourcing & Quarantine (`/_styleguide`):** Calibrate reusable components—or transmute external Tailwind blueprints from `21st.dev MCP` into zero-JS, token-bound Astro—in isolation before page assembly (`docs/styleguide-fixtures.md`).
6. **Representative Implementation & Verification:** Build public routes, bind CMS visual edit proxies (`{...entry.edit.title}`), and verify with `npm run verify` and local visual tests.
7. **Production Cutover, Email & Launch:** Connect custom domains, verify HTTPS/TLS certificates, test admin passkey/email authentication, and preserve corporate mail DNS (Google Workspace / Microsoft 365).

Read the complete [Site Delivery Workflow runbook](docs/site-delivery-workflow.md).

---

## How EmDash & Astro connect

EmDash stores your structured content in local SQLite; Astro renders your server-rendered pages. Binding an entry's data and visual editing proxies takes only a few lines in your `.astro` template:

```astro
---
import Base from '../layouts/Base.astro';

// 1. Receive or query the content entry
const { entry } = Astro.props;
---

<!-- 2. Pass collection identity to Base layout for live editing overlay -->
<Base title={entry.data.title} content={{ collection: 'pages', id: entry.data.id, slug: entry.data.slug }}>
  <!-- 3. Spread field proxies so clients can edit visually in EmDash -->
  <h1 {...(entry.edit.title || {})}>{entry.data.title}</h1>
  <p {...(entry.edit.excerpt || {})}>{entry.data.excerpt}</p>
</Base>
```

See [editorial canvas guide](docs/emdash-editorial-canvas.md) for full field proxy and schema budget rules.

---

## Why Baseline?

### 📐 Fluid design tokens & automated WCAG contrast (`npm run design:tokens`)
Stop writing dozens of arbitrary responsive utility classes (`p-4 md:p-8 lg:p-12 xl:p-16`). Baseline uses continuous mathematical `clamp()` scales anchored between 320px and 1280px viewports in `src/styles/global.css`:
- **Agent-First Token Engine:** Seed canonical Aesthetic Lane presets (`--lane`), generate parametric fluid type/space scales (`--type-scale`, `--space-scale`), or synthesize WCAG-compliant light and `[data-surface="dark"]` OKLCH palettes from brand hex colors (`--seed-accent`), verified across 10 WCAG AA contrast pairs (`npm run design:tokens`).
- **Continuous Typography & Spatial Density:** `--text-step--1` through `--text-step-2` (plus `--text-step-3-to-1` and `--text-step-2-to-0` bridges) and section spacing (`--spacing-section`) scale smoothly with viewport inline size (`vi`).
- **Typographic Measures & Editorial Breakouts:** Built-in line-length bounds (`--measure-reading: 68ch`, `--measure-content: 76rem`, `--measure-wide: 88rem`) and `<Container breakout>` (`.content-grid`) keep body prose readable while allowing figures, pull-quotes, and galleries to break out to wider tracks.
- **Self-Responsive Layout Primitives:** `<Section>`, `<Container>`, auto-fit `<Grid>`, and accessible `<Card>` (`--card-*` tokens, concentric radii, and `.clickable-parent`/`.focus-parent`) adapt to any screen width without media queries. [Design Framework Guide](docs/design-framework.md).

### 🎨 The Art Direction Gate & `/_styleguide` Quarantine
AI coding assistants notoriously default to generic "SaaS template" aesthetics. Baseline enforces an automated pre-implementation check (`npm run check:art-direction`): before writing visual CSS, the assistant must record a distinct **Aesthetic Lane**, **Typography Pairing**, **Token Physics**, and 2–3 explicit **Site Anti-Patterns** in `AGENTS.md`. Reusable primitives, controls, and responsive stress cases are calibrated in isolation on **`/_styleguide`** (which returns **404** in production builds) before page assembly multiplies defects. Pair with `DESIGN.md` interchange (`npm run design:check` / `design:export`) or optional `@perkyzz/emvb` visual landing pages as needed ([Design Interchange Guide](docs/design-interchange.md) · [Art Direction Workflow](docs/art-direction-workflow.md)).

### 🗄️ Intelligent content modeling & WordPress migration
Don't copy WordPress's legacy mess into your clean CMS. Baseline provides a structured methodology for converting legacy sites to EmDash:
- **The Content Candidate Register:** Uncover implicit operational entities trapped in page builder accordions or ACF repeaters (e.g. rosters, schedules, venues, sponsors) and elevate them to first-class collections.
- **Relational Normalization vs 50-Column Budget:** Model 1:N relations and shared master data instead of bloated JSON dumps, staying comfortably within Cloudflare D1's 100-column limits.
- **Admin Polish & Non-Routable Collections:** Designate `routable: false` for internal entities, use standardized ASCII slugs in code, and author display labels in the client's working language.
- **Automated Media Migration:** Use `npm run media:migrate-wp` for manifest-driven WordPress attachment preparation, EmDash ingestion, and Cloudflare R2 staging ([Image Delivery Guide](docs/image-delivery.md) · [Content Modeling Guide](docs/wordpress-content-modeling.md)).

### 🛡️ Catch wide schemas before they reach production
Local SQLite can accept models that exceed Cloudflare D1's [100-column table limit](https://developers.cloudflare.com/d1/platform/limits/). Baseline's automatic `check:schema-budget` preflight measures physical collection columns, including generated and retained legacy columns, against a conservative **50-column budget** before build/typecheck. For offline structural diffing, allowlisted seed exports, and isolated D1 snapshot reconstruction, use `npm run db:diff`, `npm run db:export-seed`, and `npm run db:pull-remote` ([Database parity workflow](docs/database-workflow.md)).

### 🚀 Zero-JS progressive enhancement & local visual regression
- **Ship Less JavaScript:** `LogoTicker` renders on the server and animates with CSS (**0 KB of component client JS**, native checkbox pause toggle, reduced-motion fallback, and RTL support). `PhotoGallery` uses pure CSS flexbox to compute proportional justified photo rows without JS Masonry, loading PhotoSwipe only on click.
- **Keep CI Lean:** `npm run test:visual` compares mobile, tablet, and desktop captures with pinned Windows Chromium—exercising active motion, no-JS rendering, zoom, and text spacing locally so browser tests consume **zero GitHub Actions minutes**.

---

## Where to work (project layout)

| Path | Purpose |
| --- | --- |
| `src/pages/` | Server-rendered public routes (`/`, `/about`, `/posts/[slug]`, `/_styleguide`) |
| `src/layouts/Base.astro` | Core layout shell, EmDash live-editing script, and header/footer |
| `src/components/` | Reusable layout primitives (`Section`, `Container`, `Grid`, `Card`, `LogoTicker`) |
| `src/styles/global.css` | Neutral Tailwind v4 `@theme` tokens, typography, and base rules |
| `seed/seed.json` | Initial Posts/Pages schema and starter content |
| `src/live.config.ts` | EmDash live collection registration |
| `astro.config.mjs` | Astro configuration (Node adapter, EmDash SQLite setup, Tailwind v4) |
| `.agents/skills/` | Modular specialist skills for AI coding agents |
| `docs/` | Complete documentation guides (see [docs/README.md](docs/README.md)) |

---

## Daily commands

| Command | Use it for |
| --- | --- |
| `npm run dev` | Develop the site and open `/_styleguide` |
| `npm run verify` | Run all fast local checks in one command (`lint`, `check:art-direction`, `design:tokens`, `test`, `typecheck`) |
| `npm run design:tokens` | Audit tokens, WCAG contrast, font loading & edit proxies (or pass `--init-client --lane <lane>` to initialize a client site) |
| `npm test` | Run the full unit and tooling test suite (`tests/*.test.mjs`) |
| `npm run test:design` | Validate art direction record, token coverage, and `DESIGN.md` interchange |
| `npm run typecheck` | Astro/TypeScript diagnostics and schema preflight |
| `npm run check:schema-budget` | Measure the local database's physical collection widths |
| `npm run db:diff` | Compare offline SQLite/D1 schema parity and column budgets |
| `npm run media:migrate-wp` | Manifest-driven WordPress media preparation, CMS ingestion, and R2 staging |
| `npm run test:visual` | Compare local Windows captures with reviewed baselines |
| `npm run check:dev-tools` | Verify `/_styleguide` and fixture markers stay out of production |
| `npm run build` | Build the Node production artifact |
| `npm run start:local` | Run that artifact with your local `.env` |
| `npm run audit:site -- --root ../my-site` | Diagnose a downstream repository without changing it |
| `npm run check:upstream` | Review Astro, adapters, EmDash and Node version updates |

Browser tests need the exact renderer described in [visual regression setup](docs/visual-regression.md). CI uses one Node version for fast checks and a normal build; screenshot comparisons remain local.

### 🔄 Automated Weekly Upstream Updates
Every site template includes [`.github/workflows/upstream-update.yml`](docs/automated-upstream-updates.md), which runs every Monday at 08:00 UTC (and on-demand). It syncs official EmDash and Impeccable skills, applies safe in-range dependency updates, executes tests and production builds, and safely auto-merges to `main` with alert issues on test failure. See [Automated Upstream Updates](docs/automated-upstream-updates.md).

---

## Build with content, not around it

Use the neutral Tailwind v4 tokens and small `Section`, `Container` and `Grid` primitives as your starting API. Keep editorial content in EmDash, forward field attributes to the stored value being rendered, and verify save/reload before handoff. Put site imagery in `src/assets/` or EmDash Media Library so native processing and ownership stay clear.

[Component quarantine](.agents/skills/astro-site-design/references/component-quarantine.md) · [Editorial canvas](docs/emdash-editorial-canvas.md) · [Gallery workflow](docs/gallery-workflow.md) · [Image delivery](docs/image-delivery.md).

The default runtime is **Node + SQLite + local media**, with no cloud account needed. Cloudflare Workers is an optional site-specific target; its adapter, D1/R2 bindings and image delivery need separate setup and verification. When deploying to Cloudflare or switching nameservers, always follow the DNS checklist to preserve client corporate email. [Production Deployment & DNS Checklist](docs/production-deployment.md) · [Hosting setup](.agents/skills/emdash-site-setup/SKILL.md) · [Supported standards and roadmap](standards/releases/0.1.1.md) · [Downstream audits](docs/site-standards-audit.md).

---

## Contribute

[Contributing](CONTRIBUTING.md) explains verification and upstream skill ownership. Baseline's own contributions use the [MIT license](LICENSE); bundled materials retain their [third-party notices](THIRD_PARTY_NOTICES.md). Participation follows the [Code of Conduct](CODE_OF_CONDUCT.md).
