<p align="center">
  <img src="images/baseline-logo.svg?v=2" alt="Baseline — Agent-First Astro & EmDash CMS Starter" width="420" />
</p>

# Documentation Directory

Baseline provides two Astro foundations and three Platform Profiles: **`static`** (developer/agent edits files), **`static-sveltia`** (browser editing of the same files), and **`emdash`** (relational CMS, live canvas and MCP). Shared tokens, layout primitives and component quarantine serve all three.

- **[Platform Profiles](platform-profiles.md):** choose editing personas, hosting, infrastructure costs and the generation path.
- **[Baseline Updates](baseline-updates.md):** stage profile-filtered shared source/skill updates while preserving client changes.
- **[Real Downstream Update Rehearsal](verification/baseline-sync-rehearsal.md):** immutable GitHub updates, rename bridging and preserved design conflicts across both static profiles and provenance forms.
- **[Generation Manifests](../profiles/README.md):** explicit file/dependency inventories and independent profile verification.
- **[Platform Profile Verification](verification/platform-profiles.md):** milestone test results, reproduction commands and verification scope.

CMS modeling, deployment, registry and migration guides below apply to `emdash` unless stated otherwise. Static Sveltia projects include their own `docs/sveltia-cms.md` for repository configuration, OAuth proxy/PAT options and native media paths.

Explore the documentation guides below, organized by workflow, design architecture, and tooling:

---

## 🚀 1. The Site Delivery Workflow

*The structured process for building client sites with AI coding assistants without chaos or drift.*

- **[Site Delivery Workflow](site-delivery-workflow.md)**  
  The core 7-stage agency build process: Brief & Evidence → Platform Decisions → Content Architecture → Art Direction Gate → Component Quarantine (`/_styleguide`) → Public Implementation & Verification → Production Cutover & Launch.
- **[AI Developer Prompt Library](prompt-library.md)**  
  Copy-pasteable prompt recipes for AI coding assistants to execute each workflow stage, quarantine components, bind CMS data, run local visual tests, and execute domain cutovers safely.
- **[Art Direction Workflow & The Design Gate](art-direction-workflow.md)**  
  Establishing distinct visual identities (aesthetic lanes, narrative metaphors, typography pairings, and anti-patterns) before writing code, enforced automatically via `npm run check:art-direction`.

---

## 📐 2. Design System & Layout Architecture

*Mathematical consistency over arbitrary utility classes.*

- **[Design Framework & Token Physics](design-framework.md)**  
  Continuous mathematical fluid typography scales (`clamp()`) between 320px and 1280px, fluid spatial density, typographic reading measures (`68ch`), and self-responsive layout primitives (`<Section>`, `<Container>`, `<Grid>`, `.flow`).
- **[Reusable Public Patterns & Primitives](reusable-public-patterns.md)**  
  Production-tested components: `Card`, `CMSPartnersPanel`, `ResponsiveImage`, `EditorialImage`, and zero-JS interactive primitives (`LogoTicker` CSS infinite marquee, pure CSS flexbox `PhotoGallery`, and surface-aware focus).

---

## 🗄️ 3. Content Architecture & WordPress Migration

*Relational modeling, schema safety, and client-friendly CMS administration.*

- **[WordPress Content Modeling & Candidate Register](wordpress-content-modeling.md)**  
  Methodology for migrating WordPress sites: hunting for implicit content entities buried in page builder blocks or ACF repeaters, relational normalization, `routable: false`, admin language strategy, and manifest-driven media preparation (`npm run media:migrate-wp`).
- **[Editorial Canvas & Content Binding](emdash-editorial-canvas.md)**  
  How to query EmDash collections in Astro templates and bind live editing field proxies (`entry.edit.title`) so clients can visually edit content. Also details the **50-column physical schema budget** for Cloudflare D1 safety.
- **[EmDash 1.3 Adoption Review](emdash-1.3-upgrade-review.md)**
  Native AI-training policy, contributor permissions, revisions/custom editor callbacks, scoped MCP names, guest bylines and focused runtime verification.
- **[Internationalization (i18n)](internationalization.md)**  
  Native row-per-locale multilingual architecture linked by translation groups, avoiding anti-pattern duplicate language columns (e.g. `title_en`).
- **[Forms & Verification](forms-adoption.md)**  
  Form handling, server-side recovery validation, and Cloudflare Turnstile spam protection.

---

## 🎨 4. Agent-First Design Calibration & Visual Testing

*Code-first token calibration, component quarantine, and local visual verification.*

- **[Design Framework, Token Presets & Optional EmVB](design-framework.md)**  
  How `npm run design:tokens` seeds canonical Aesthetic Lane presets, audits 10 WCAG AA perceptual contrast pairs across default and `[data-surface="dark"]` contexts, validates fluid `clamp()` bounds, and bridges optional `@perkyzz/emvb` visual landing pages.
- **[Component Quarantine & Styleguide Fixtures](styleguide-fixtures.md)**  
  How `/_styleguide` renders components and responsive stress cases in isolation before page assembly, and how the route is automatically excluded (404) from production builds.
- **[Local Visual Regression Testing](visual-regression.md)**  
  Local-first Windows Chromium screenshot regression testing harness (`npm run test:visual`). Catch unintended layout reflows without Docker or consuming GitHub Actions runner quotas.
- **[AI-Native Visual Design, Component Sourcing & DESIGN.md Interchange](design-interchange.md)**  
  The 5-stage design pipeline: UX flow teardowns (`Nicelydone` / `Refero`), 420+ community `DESIGN.md` systems ([designmd.ai](https://designmd.ai/explore)), visual screen prototyping (`Google Stitch` / `Claude Design` / `OpenDesign`), high-craft component sourcing (`21st.dev MCP` → `/_styleguide` zero-JS transmutation), and offline `@google/design.md` token validation.

---

## 🖼️ 5. Media & Galleries

*Performant, responsive image delivery and interactive galleries.*

- **[Native Image Delivery](image-delivery.md)**  
  Native Astro 7.4 image optimization backed by EmDash's storage endpoint. Covers responsive WebP/AVIF generation, aspect ratio preservation, resumable WordPress media preparation (`media:migrate-wp`), and Cloudflare R2 staging.
- **[Gallery Workflow](gallery-workflow.md)**  
  Progressively enhanced PhotoSwipe lightboxes embedded directly within Portable Text and custom gallery sections.

---

## 🤖 6. AI Coding Agent Workflows

*Harness-agnostic workflows for pairing with AI assistants (Claude Code, OpenAI Codex, Antigravity, OpenCode, Hermes, Cursor, Windsurf, Aider, and local LLM runners).*

- **[AI Developer Prompt Library](prompt-library.md)**  
  Curated prompts for new sites, component quarantine, WP migrations, live token tuning, and domain cutovers.
- **[Agent Documentation & MCP Setup](agent-documentation.md)**  
  Connecting coding assistants to official Astro/EmDash docs, optional design MCP superpowers (`designmd-mcp`, `21st.dev`, `Nicelydone`, `Stitch`), and generating site-level access tokens with `npm run mcp:token`.
- **[Skill Synchronization](skill-synchronization.md)**  
  Managing staged updates for mirrored EmDash skills (`sync:emdash-skills`) and shared Vermeulen-maintained skills (`sync:site-skills`) while protecting local customizations.
- **[Automated Upstream Updates & CI Maintenance](automated-upstream-updates.md)**  
  Reviewed maintenance patches: weekly root dependency proposals, manual profile-filtered static source proposals, verification artifacts and explicit skill updates.

---

## 🛡️ 7. Standards, Deployment & Auditing

*Tools to inspect, verify, deploy, and maintain site quality over time.*

- **[Database Parity, Seed Export & Snapshot Workflow](database-workflow.md)**  
  Read-only SQLite vs. Cloudflare D1 structural parity (`db:diff`), 50-column physical budget inspection, allowlisted privacy-aware seed export (`db:export-seed`), and isolated remote inspection snapshots (`db:pull-remote`).
- **[Production Deployment & Cloudflare Cutover](production-deployment.md)**  
  Standalone Node.js deployment, Cloudflare Workers/D1/R2 setup, R2 media sync, serverless sessions, and the critical corporate mail DNS preservation checklist (protecting Google Workspace / Microsoft 365).
- **[Site Standards Diagnostic Engine](site-standards-audit.md)**  
  Using `npm run audit:site` to diagnose existing sites against the certified `standards-v0.1.1` baseline, and applying deterministic modernization recipes.
- **[Starter Meta-Review Process](starter-meta-review.md)**  
  Methodology for recurring evaluation of upstream Astro, adapter, and EmDash releases.
- **[Site Registry Contract](site-registry.md)**  
  Private site registry conventions for agencies managing multiple client deployments.

---

## 📦 8. Starter Provenance & Historical Receipts

*Background records for maintainers and auditors.*

- **[Clean-History Public Release](public-release.md)**  
  How this repository was sanitized and extracted from internal development history.
- **[Phase 3 Standards Certification](phase-3-certification.md)**  
  Release certification notes and tested scopes for the `standards-v0.1.1` baseline.
- **[Third-Party Licenses](licenses/)**  
  Attributions for included upstream libraries (EmDash, Noto Sans OFL, PhotoSwipe, Impeccable).
