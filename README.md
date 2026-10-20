<p align="center">
  <img src="docs/images/baseline-logo.svg?v=2" alt="Baseline — Agent-First Web Starter for Astro & EmDash CMS" width="468" />
</p>

<p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-7.4.0-BC52EE" alt="Astro 7.4.0" /></a>
  <a href="https://docs.emdashcms.com/"><img src="https://img.shields.io/badge/EmDash-1.3.0-2563EB" alt="EmDash 1.3.0" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-06B6D4" alt="Tailwind v4" /></a>
  <a href="#-quickstart"><img src="https://img.shields.io/badge/Node-LTS-339933" alt="Node LTS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="#why-baseline"><strong>Why Baseline?</strong></a> ·
  <a href="#-quickstart"><strong>Quickstart</strong></a> ·
  <a href="#platform-profiles"><strong>Platform Profiles</strong></a> ·
  <a href="#the-7-stage-site-delivery-workflow"><strong>7-Stage Workflow</strong></a> ·
  <a href="docs/prompt-library.md"><strong>Prompt Library</strong></a> ·
  <a href="#where-to-work-project-layout"><strong>Where to Work</strong></a> ·
  <a href="#daily-commands"><strong>Commands</strong></a> ·
  <a href="docs/README.md"><strong>Documentation</strong></a>
</p>

---

**Baseline is the agent-first frontend foundation and development guardrail system for Astro**, designed ground-up for developers pairing with AI coding assistants—whether using **Claude Code**, **OpenAI Codex**, **Google Antigravity**, **OpenCode / OMP**, **Hermes**, **Cursor**, **Windsurf**, **Aider**, or local LLM runners.

By default, Baseline powers full-scale applications with **EmDash CMS**—a lightweight headless CMS featuring live visual page editing, relational SQLite/D1, and native Model Context Protocol (MCP) server integration. When a database or server runtime isn't required, Baseline's **Platform Profiles** let you output pure static Astro sites or Git-backed Sveltia CMS sites while sharing the exact same fluid design tokens, WCAG contrast checks, layout primitives, and component quarantine (`/_styleguide`).

---

## Why Baseline?

Pairing with an AI coding assistant without structural guardrails usually leads to "prompt drift"—generic styling, arbitrary responsive breakpoint soup (`p-4 md:p-8 lg:p-12`), broken CMS schemas, and bloated client JavaScript. Baseline provides **five architectural guardrails**:

### 📐 1. Fluid design tokens & automated WCAG contrast (`npm run design:tokens`)
Use continuous `clamp()` scales in `src/styles/global.css`. The generator defaults to 20–80rem of viewport inline size (320–1280 CSS pixels at a 16px root in horizontal writing); authored presets retain their own transition ranges:
- **Agent-First Token Engine:** Seed canonical Aesthetic Lane presets (`--lane`), generate parametric fluid type/space scales (`--type-scale`, `--space-scale`), or synthesize light and `[data-surface="dark"]` OKLCH palettes from brand hex colors (`--seed-accent`). The audit checks 14 semantic WCAG relative-luminance contrast pairs and reports advisory fluid resize diagnostics (`npm run design:tokens -- --json`); this is not a claim of whole-site conformance.
- **Continuous Typography & Spatial Density:** `--text-step--1` through `--text-step-2` (plus `--text-step-3-to-1` and `--text-step-2-to-0` bridges) and section spacing (`--spacing-section`) scale smoothly with viewport inline size (`vi`).
- **Typographic Measures & Editorial Breakouts:** Built-in line-length bounds (`--measure-reading: 68ch`, `--measure-content: 76rem`, `--measure-wide: 88rem`) and `<Container breakout>` (`.content-grid`) keep body prose readable while allowing figures, pull-quotes, and galleries to break out to wider tracks.
- **Self-Responsive Layout Primitives:** `<Section>`, `<Container>`, auto-fit `<Grid>`, and `<Card>` compose with native `<Disclosure>`, wrapping `<Cluster>` and intrinsic `<Sidebar>`. Open slots preserve content ownership. [Design Framework](docs/design-framework.md) · [Native Composition](docs/native-composition.md).
- **Layout spacing:** New-site design setup explains responsive spacing. Express uses shared defaults and brief-led density; custom spacing is discussed when the design calls for it. Both use CSS tokens and component controls, with no settings panel. [Setup explanation](docs/design-framework.md#explaining-layout-spacing-during-new-site-setup).

### 🎨 2. The Art Direction Gate & `/_styleguide` Quarantine
`AGENTS.md` requires the assistant to save a complete **Art Direction Record** to disk before site-specific visual implementation, then run `npm run check:art-direction -- --require-record`. The record defines the aesthetic lane, narrative metaphor, typography, token physics and site anti-patterns. The normal `npm run check:art-direction` validates changed visual source and the required record against Git, subject to exact hash-bound infrastructure exceptions. Reusable primitives and responsive stress cases are calibrated on **`/_styleguide`** (which returns **404** in production builds) before broad page assembly. Pair with `DESIGN.md` interchange (`npm run design:check` / `design:export`) or optional `@perkyzz/emvb` visual landing pages as needed ([Design Interchange Guide](docs/design-interchange.md) · [Art Direction Workflow](docs/art-direction-workflow.md)).

### 🗄️ 3. Intelligent content modeling & WordPress migration
Don't copy WordPress's legacy mess into your clean CMS. Baseline provides a structured methodology for converting legacy sites to EmDash:
- **The Content Candidate Register:** Uncover implicit operational entities trapped in page builder accordions or ACF repeaters (e.g. rosters, schedules, venues, sponsors) and elevate them to first-class collections.
- **Relational Normalization vs 50-Column Budget:** Model 1:N relations and shared master data instead of bloated JSON dumps, staying comfortably within Cloudflare D1's 100-column limits.
- **Admin Polish & Non-Routable Collections:** Designate `routable: false` for internal entities, use standardized ASCII slugs in code, and author display labels in the client's working language.
- **Automated Media Migration:** Use `npm run media:migrate-wp` for manifest-driven WordPress attachment preparation, EmDash ingestion, and Cloudflare R2 staging ([Image Delivery Guide](docs/image-delivery.md) · [Content Modeling Guide](docs/wordpress-content-modeling.md)).
- **Acceptance-Driven Verification & Cutover Safety:** Run `npm run migration:verify -- --manifest <file>` for bounded HTTP structural audits (status, redirects, canonicals, headings, links, media) and inventory reconciliation. Rehearse importer fidelity with synthetic fixtures (`npm run rehearse:importer` · [Importer Fidelity Matrix](docs/importer-fidelity-matrix.md)), execute cutover with pre-freeze delta reconciliation ([Migration Cutover Runbook](docs/migration-cutover.md)), and protect production data with atomic SQLite backups ([Node Backup & Restore](docs/node-backup-restore.md)).

### 🛡️ 4. Catch wide schemas before they reach production
Local SQLite can accept models that exceed Cloudflare D1's [100-column table limit](https://developers.cloudflare.com/d1/platform/limits/). Baseline's automatic `check:schema-budget` preflight measures physical collection columns, including generated and retained legacy columns, against a conservative **50-column budget** before build/typecheck. For offline structural diffing, allowlisted seed exports, and isolated D1 snapshot reconstruction, use `npm run db:diff`, `npm run db:export-seed`, and `npm run db:pull-remote` ([Database parity workflow](docs/database-workflow.md)).

### 🚀 5. Zero-JS progressive enhancement & local visual regression
- **Ship Less JavaScript:** `LogoTicker` renders on the server and animates with CSS (**0 KB of component client JS**, native checkbox pause toggle, reduced-motion fallback, and RTL support). `PhotoGallery` uses pure CSS flexbox to compute proportional justified photo rows without JS Masonry, loading PhotoSwipe only on click.
- **Keep CI Lean:** `npm run test:visual` compares mobile, tablet, and desktop captures with pinned Windows Chromium—exercising active motion, no-JS rendering, zoom, and text spacing locally so browser tests consume **zero GitHub Actions minutes**.

---

## ⚡ Quickstart

Baseline is designed ground-up for an **agent-first workflow** pairing with **Claude Code**, **Google Antigravity**, **Cursor**, **Windsurf**, **OpenAI Codex**, **Aider**, or local LLM runners. Instead of manually typing setup commands, you hand off initialization and build steps to your coding assistant. The agent reads `AGENTS.md`, installs dependencies, generates `.env` secrets, seeds design tokens, and guides or executes the build.

**Requirements:** Node ^22.22.3 or ^24.16.0 or >=26.3.0 (Node 24 LTS recommended; includes the template lint tooling floor) and `npm`.

On Windows PowerShell, use `npm.cmd` wherever these instructions show `npm` (for example, `npm.cmd run verify:fast`), and `npx.cmd` for `npx`. These launchers work with the default execution policy without loading `npm.ps1`. Nested repository tooling invokes npm's JavaScript CLI with the current Node executable and preserves argument boundaries on Windows and Unix; no execution-policy change is needed.

Run `npm run doctor` before installing dependencies to check this EmDash foundation's Node engine, built-in SQLite, shell guidance, required files, `.emdash/` write access and Git status. It uses Node built-ins only, creates and removes a unique write probe, and bounds the Git subprocess to 200ms to target a preflight under 500ms. Warnings exit 0; critical failures exit 1. Use `npm run doctor -- --json` for structured output (`npm --silent run doctor -- --json` for JSON-only stdout), or `node scripts/doctor.mjs --json` if npm cannot start. `NO_COLOR` disables terminal colors. On Windows the outer `.cmd`/`.ps1` launcher may be unobservable; the doctor reports that uncertainty with the safe PowerShell command.

### 🚀 Starting a New Site (Agent-First Workflow)

1. **Create your repository** from this **GitHub Template**:
   ```sh
   gh repo create my-site --template Vermeulen-Solutions/baseline --private --clone
   cd my-site
   ```
   *(Or click the green **[Use this template](https://github.com/new?template_name=baseline&template_owner=Vermeulen-Solutions)** button on GitHub).*

2. **Open your coding assistant in the repository and paste a kickoff prompt:**

   **Option A — Express Track (Consolidated 3 Checkpoints, recommended for greenfield sites <= 6 routes):**
   ```markdown
   Read AGENTS.md, follow new-site-workflow under .agents/skills/ in **Express Track (3 Checkpoints)**, and build this site with consolidated checkpoints:
   - Client / Brand: [Brand Name]
   - Purpose & Routes: [E.g., 5-page studio site: Home, Work, About, Blog, Contact]
   - Aesthetic Lane / Palette: [E.g., Editorial Paper / Product-Led Minimalism, or seed accent #1B4332]

   Install dependencies, generate .env secrets, complete Checkpoint A (Brief, Platform & Content Schema), and present the Checkpoint A handoff.
   ```

   **Option B — Standard Agency Track (Full 7 Stages, for migrations or complex multi-locale sites):**
   ```markdown
   Read AGENTS.md, follow new-site-workflow under .agents/skills/, and guide me through the staged delivery workflow.

   Here is the context for this project:
   - Client / Brand: [Brand Name]
   - Purpose: [E.g., B2B marketing site / Portfolio / Directory]
   - Target Audience: [E.g., Enterprise buyers / General public]
   - Locales: [E.g., Single language (en) or Multilingual (en, fr)]

   Install dependencies, generate .env secrets, begin with Stage 1 (Brief & Evidence Discovery), and present the Stage 1 handoff choices once complete.
   *(Canonical lanes: `editorial-paper`, `product-minimalism`, `technical-data`, `warm-editorial`; see [Art Direction Guide](docs/art-direction-workflow.md))*

3. **Explore your local dev destinations:**

### 🖥️ Where to look in your browser

Once the assistant runs `npm run dev`, open these local URLs:

| Destination | Local URL | What it's for |
| --- | --- | --- |
| 🌐 **Public Site** | [`http://localhost:4321/`](http://localhost:4321/) | Live website rendered by Astro |
| ✏️ **CMS Admin** | [`http://localhost:4321/_emdash/admin`](http://localhost:4321/_emdash/admin) | Create your admin account, manage collections, and edit content |
| 🧪 **Component Styleguide** | [`http://localhost:4321/_styleguide`](http://localhost:4321/_styleguide) | Stress-test layout primitives and calibrate typography/spacing (404 in production) |

---

### 💻 Manual CLI Setup (Alternative)

If you are setting up without an AI assistant or scripting a CI pipeline, you can run the commands directly:

```sh
# 1. Install dependencies & initialize secrets
npm install
npx emdash secrets generate --write .env

# 2. Seed brand tokens and an aesthetic lane
npm run design:tokens -- --init-client --lane editorial-paper

# 3. Start the dev server
npm run dev
```

> [!TIP]
> **Need prompt templates or MCP tools?**
> Adapt ready-to-copy recipes for day-2 maintenance, migrations, and layout polish from the **[AI Developer Prompt Library (`docs/prompt-library.md`)](docs/prompt-library.md)**.
> To connect your assistant directly to EmDash's Model Context Protocol server, run `npm run mcp:token` (see [agent documentation](docs/agent-documentation.md)).

---

## Platform Profiles

Baseline supports three foundation profiles to match your editing and operational needs:

| Profile | Editing | Foundation |
| --- | --- | --- |
| `emdash` (default) | Relational CMS, live edit canvas and MCP | Existing Node/SQLite or configured Workers/D1/R2 |
| `static` | Developer/agent edits typed Markdown collections | Native Astro static output |
| `static-sveltia` | Sveltia browser editor commits the same files | Same static output plus `/admin/`; OAuth proxy or PAT |

All profiles share fluid tokens, layout primitives, `SiteShell.astro`, native image delivery, and `/_styleguide` calibration. Choose the editing and operational model independently from the Standard/Express delivery track.

### Generating a static project
If your project does not need a relational CMS database or server adapter, generate an unencumbered static Astro project from this checkout:

```sh
# Pure static (Markdown / Content Collections)
npm run init:profile -- --profile static --out ../my-static-site

# Static + Sveltia CMS (Git-backed browser editor)
npm run init:profile -- --profile static-sveltia --out ../my-static-site
```

After generating, `cd` into the new directory, run `npm install`, and commit the generated lockfile (`generated CI uses npm ci`). Sveltia sites follow the generated `docs/sveltia-cms.md` to configure repository and GitHub authentication. See [Platform Profiles](docs/platform-profiles.md) and [staged updates](docs/baseline-updates.md).

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
| `npm run doctor` | Dependency-free Node/SQLite, shell and workspace preflight (`-- --json` for automation) |
| `npm run dev` | Develop the site and open `/_styleguide` |
| `npm run verify` | Run all fast local checks in one command (`lint`, `check:art-direction`, `design:tokens`, `test`, `typecheck`) |
| `npm run design:tokens` | Audit tokens, WCAG contrast, font loading & edit proxies (or pass `--init-client --lane <lane>` to initialize a client site) |
| `npm test` | Run the full unit and tooling test suite (`tests/*.test.mjs`) |
| `npm run test:design` | Validate art direction record, token coverage, and `DESIGN.md` interchange |
| `npm run typecheck` | Astro/TypeScript diagnostics and schema preflight |
| `npm run check:schema-budget` | Measure the local database's physical collection widths |
| `npm run db:diff` | Compare offline SQLite/D1 schema parity and column budgets |
| `npm run media:migrate-wp` | Manifest-driven WordPress media preparation, CMS ingestion, and R2 staging |
| `npm run migration:verify -- --manifest <file>` | Collect bounded HTTP evidence and reconcile v3 offline inventories, or replay with `--observations`; [declared scope and acceptance contract](docs/migration-acceptance.md) |
| `npm run rehearse:importer` | Rehearse WordPress WXR and Exporter fidelity against synthetic fixtures |
| `npm run test:visual` | Compare local Windows captures with reviewed baselines |
| `npm run check:dev-tools` | Verify `/_styleguide` and fixture markers stay out of production |
| `npm run build` | Build the Node production artifact |
| `npm run start:local` | Run that artifact with your local `.env` |
| `npm run audit:site -- --root ../my-site` | Diagnose a downstream repository without changing it |
| `npm run check:upstream` | Review Astro, adapters, EmDash and Node version updates |

Browser tests need the exact renderer described in [visual regression setup](docs/visual-regression.md). CI runs root fast checks and a normal build on Ubuntu, plus separate generated-profile jobs; screenshot comparisons remain local.

For daily changes, `npm run verify:fast` runs lint, art direction, token audits and the unit/contract tier. `npm run test:unit` targets less than 8 seconds (acceptance limit 10); `npm run test:rehearsal` runs database, HTTP, importer and generated-project lifecycles. `npm test` and `npm run verify` continue to include the entire suite. CI requires both tiers and independent generated-profile verification. `npm run check:ci-fast` additionally measures the fast checks plus a normal production build and release gate, fails at 60 seconds, and writes `.emdash/checks/ci-fast.{json,log}`. Classify new tests with a reason in `tests/test-tiers.json`. See [engineering maintenance evidence](audit/engineering-maintenance-plan.md).

The root full suite runs bounded unit checks before sequential lifecycle rehearsals, with unchanged performance assertions. Inspect CMS JavaScript ownership with `npm run build:analyze`; its local report distinguishes the inline editor from the admin bundle. See [client bundle maintenance](docs/client-bundles.md) and [HTML/loopback verification](docs/html-integrity.md).

### 🔄 Reviewed upstream updates

- **Root dependency proposals:** [`.github/workflows/upstream-update.yml`](.github/workflows/upstream-update.yml) runs Mondays at 08:00 UTC and on manual dispatch with `contents: read`. It proposes in-range dependency updates in the runner checkout, verifies clean installation, runs verification/build/profile checks, and attempts to upload `upstream-dependency-review` containing `upstream-update.patch`, including on failure. It does not push commits, open or merge PRs, or create alert issues. Review the run results and patch before applying; an artifact alone is not a passing check.
- **Generated static-site source updates:** the `static` and `static-sveltia` workflow is manual, takes an immutable Baseline commit SHA, and stages bounded shared-source/selected-skill updates for review in `baseline-update-review`. It preserves local conflicts and does not update dependencies or client content. See [Baseline updates](docs/baseline-updates.md).
- **Explicit skill synchronization:** root dependency proposals do not refresh skills. Use checked-in skills until intentionally reviewing an update; `sync:emdash-skills -- --check` and `sync:site-skills -- --check` diagnose drift, while their stage/apply flow requires reviewing the candidate. Impeccable has its own explicit refresh procedure. See [Skill synchronization](docs/skill-synchronization.md).

[Reviewed maintenance details](docs/automated-upstream-updates.md) explain artifacts, conflicts and local adoption.

---

## Build with content, not around it

Use the neutral Tailwind v4 tokens and small `Section`, `Container` and `Grid` primitives as your starting API. Keep editorial content in EmDash, forward field attributes to the stored value being rendered, and verify save/reload before handoff. Put site imagery in `src/assets/` or EmDash Media Library so native processing and ownership stay clear.

[Component quarantine](.agents/skills/astro-site-design/references/component-quarantine.md) · [Editorial canvas](docs/emdash-editorial-canvas.md) · [Gallery workflow](docs/gallery-workflow.md) · [Image delivery](docs/image-delivery.md).

The default runtime is **Node + SQLite + local media**, with no cloud account needed. Cloudflare Workers is an optional site-specific target; its adapter, D1/R2 bindings and image delivery need separate setup and verification. When deploying to Cloudflare or switching nameservers, always follow the DNS checklist to preserve client corporate email. [Production Deployment & DNS Checklist](docs/production-deployment.md) · [Hosting setup](.agents/skills/emdash-site-setup/SKILL.md) · [Supported standards and roadmap](standards/releases/0.1.1.md) · [Downstream audits](docs/site-standards-audit.md).

---

## Capability and support boundaries

Baseline supplies Astro foundations, fluid design tokens, layout primitives, and agent guardrails. Scoped evidence covers Node/SQLite and local Windows Chromium; fast CI runs on Ubuntu and verifies both generated static profiles (`static` and `static-sveltia`).

Production hosting (Cloudflare Workers/D1/R2, email delivery, static CDN caching) and migration inventory reconciliation require site-specific acceptance. Code deployment does not transfer remote database records or media. See the complete [tested scope, evidence and limitations](docs/support-boundaries.md), [production deployment runbook](docs/production-deployment.md), and [database parity workflow](docs/database-workflow.md).

---

## Contribute

If you are developing or maintaining the Baseline template engine, specialist skills, or test suites:

```sh
git clone https://github.com/Vermeulen-Solutions/baseline.git
cd baseline
npm install
npm run verify
```

[Contributing](CONTRIBUTING.md) explains verification and upstream skill ownership. Baseline's own contributions use the [MIT license](LICENSE); bundled materials retain their [third-party notices](THIRD_PARTY_NOTICES.md). Participation follows the [Code of Conduct](CODE_OF_CONDUCT.md).

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
