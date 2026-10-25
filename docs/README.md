<p align="center">
  <img src="images/baseline-logo.svg?v=2" alt="Baseline — Agent-First Astro & EmDash CMS Starter" width="420" />
</p>

# Documentation Directory

## Start here

| You want to… | Read |
| --- | --- |
| Choose a setup and run your first local site | [Getting started](getting-started.md) |
| Find a command or the final verification steps | [Command reference](commands.md) |
| Build a site with your assistant | [Prompt library](prompt-library.md) · [Delivery workflow](site-delivery-workflow.md) |
| Bring an older site up to date | [Update workflow](baseline-updates.md#existing-site-update-workflow) · [Copy-paste prompt](prompt-library.md#bringing-an-existing-site-up-to-date) |
| Improve Baseline itself | [Contributor guide](../CONTRIBUTING.md) |

## Reference guides

Baseline provides two Astro foundations and three Platform Profiles: **`static`** (developer/agent edits files), **`static-sveltia`** (browser editing of the same files), and **`emdash`** (relational CMS, live canvas and MCP). Shared tokens, layout primitives and component quarantine serve all three.

- **[Platform Profiles](platform-profiles.md):** compare content editing, hosting, infrastructure costs and project generation.
- **[Capability and Support Boundaries](support-boundaries.md):** upstream versus Baseline responsibilities, runtime expectations, tested scopes and site-specific acceptance.
- **[Baseline Updates](baseline-updates.md):** existing-site catch-up across dependencies, skills and starter capabilities, plus bounded static synchronization and explicit migrations that preserve client changes.
- **[Architecture Hardening Upgrade](architecture-hardening-upgrade.md):** generator 0.4.0, explicit existing-site additions, reviewed static patch and preservation/rollback contracts.
- **[Release and Adoption Acceptance](verification/architecture-hardening-phase-8.md):** current CMS/static rehearsals, downstream preservation evidence and explicit manual limits.
- **[Real Downstream Update Rehearsal](verification/baseline-sync-rehearsal.md):** immutable GitHub updates, rename bridging and preserved design conflicts across both static profiles and provenance forms.
- **[Generation Manifests](../profiles/README.md):** explicit file/dependency inventories and independent profile verification.
- **[Optional Project Inspection](project-inspection.md):** source-derived profile facts, available commands, entry points and a bounded declared-props pilot.
- **[Project Context and Document Scope](project-context.md):** optional client brief, AGENTS.md working rules, DESIGN.md references and focused handoffs.
- **[Detailed Site Working Rules](site-working-rules.md):** task-specific implementation, rendering, layout and production contracts for the root foundation.
- **[Maintaining Baseline](../CONTRIBUTING.md):** contributor and agent guidance for improving the reusable starter, generators, distribution and checks.
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
  Agent instructions require saving the art-direction record before visual implementation; `npm run check:art-direction` validates changed source and the record, without proving write order.

---

## 📐 2. Design System & Layout Architecture

*Mathematical consistency over arbitrary utility classes.*

- **[Design Framework & Token Physics](design-framework.md)**  
  Bounded fluid scales, root-font/inline-axis assumptions and diagnostics, reading measures (`68ch`), and structural layout primitives.
- **[Native Composition](native-composition.md)**
  Open-slot Disclosure, Cluster and Sidebar contracts, intrinsic wrapping, CMS/static content ownership and manual acceptance limits.
- **[Reusable Public Patterns & Primitives](reusable-public-patterns.md)**  
  Production-tested components: `Card`, `CMSPartnersPanel`, `ResponsiveImage`, `EditorialImage`, and zero-JS interactive primitives (`LogoTicker` CSS infinite marquee, pure CSS flexbox `PhotoGallery`, and surface-aware focus).
- **[CMS Metadata Ownership Verification](verification/metadata-phase-1.md)**
  Shared-shell compatibility, article semantics, public-origin defaults, editor/plugin precedence, and the disposable local metadata rehearsal.
- **[Static Metadata and Safe JSON-LD](verification/metadata-phase-2.md)**
  Static/Sveltia ownership, public URL and image policy, independent profile verification, and explicit existing-site adoption.
- **[Foundational Interaction Journeys](verification/interactions-phase-3.md)**
  Local keyboard, error recovery, no-JS and motion checks across CMS/static profiles, with explicit manual AT limits.
- **[Astro Accessibility Lint](verification/template-lint-phase-4.md)**
  Portable parser/rules, regression probes, runtime floor and additive adoption.
- **[Native Composition Verification](verification/native-composition-phase-5.md)**
  Shared production specimens, real browser focus/fragment behavior and calibrated reference comparisons.
- **[Fluid Mathematics Verification](verification/fluid-tokens-phase-6.md)**
  Independent numerical contracts, preserved scale values and advisory resize estimates.

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
- **[Migration Acceptance Contract](migration-acceptance.md)**
  Versioned schemas, bounded live HTTP checks and offline replay.
- **[Offline Content Inventory Contracts](migration-content-inventories.md)**
  Explicit entity mappings, private offline snapshots and count-only reconciliation reports; editor acceptance remains separate.
- **[WordPress Importer Fidelity Matrix](importer-fidelity-matrix.md)**
  Runtime-tested behavior for WXR and Exporter paths across blocks, galleries, SEO, bylines, and retry non-synchronization.
- **[Migration Cutover: Content Freeze & Delta Reconciliation](migration-cutover.md)**
  Pre-cutover editorial freeze, snapshot-driven delta classification, slug-shift redirects, DNS switchover and rollback safety.
- **[Client and Editor Handoff Guide](editor-handoff.md)**
  CMS roles/permissions, Portable Text daily publishing workflows, form submission handling, and peripheral service inventory checklist.

---

## 🎨 4. Agent-First Design Calibration & Visual Testing

*Code-first token calibration, component quarantine, and local visual verification.*

- **[Design Framework, Token Presets & Optional EmVB](design-framework.md)**  
  How `npm run design:tokens` seeds lane presets, checks 14 semantic WCAG relative-luminance contrast pairs across default/dark/restored-light surfaces, validates bounded fluid math, and bridges optional `@perkyzz/emvb` visual landing pages.
- **[Component Quarantine & Styleguide Fixtures](styleguide-fixtures.md)**  
  How `/_styleguide` renders components and responsive stress cases in isolation before page assembly, and how the route is automatically excluded (404) from production builds.
- **[Local Visual Regression Testing](visual-regression.md)**  
  Local-first Windows Chromium screenshot regression testing harness (`npm run test:visual`). Catch unintended layout reflows without Docker or consuming GitHub Actions runner quotas.
- **[AI-Native Visual Design, Component Sourcing & DESIGN.md Interchange](design-interchange.md)**  
  Optional UX references, `DESIGN.md` exchange, visual concepts and component sourcing, followed by native CSS token validation and rendered calibration. No external design package is required.

---

## 🖼️ 5. Media & Galleries

*Performant, responsive image delivery and interactive galleries.*

- **[Native Image Delivery](image-delivery.md)**  
  Native Astro 7.4 image optimization backed by EmDash's storage endpoint. Covers responsive WebP/AVIF generation, aspect ratio preservation, resumable WordPress media preparation (`media:migrate-wp`), and Cloudflare R2 staging.
- **[Prepare Incoming Images](media-preparation.md)**
  Local Sharp preparation for greenfield builds and day-2 additions on every profile, with prepared EmDash uploads and stored-byte verification.
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
- **[Dependency Advisory Review — October 2026](dependency-review-2026-10-25.md)**
  Compatible Sharp/transitive patches, remaining Zod paths, profile audit results and existing-site adoption.

---

## 🛡️ 7. Standards, Deployment & Auditing

*Tools to inspect, verify, deploy, and maintain site quality over time.*

- **[Database Parity, Seed Export & Snapshot Workflow](database-workflow.md)**  
  Read-only SQLite vs. Cloudflare D1 structural parity (`db:diff`), 50-column physical budget inspection, allowlisted privacy-aware seed export (`db:export-seed`), and isolated remote inspection snapshots (`db:pull-remote`).
- **[Production Deployment & Cloudflare Cutover](production-deployment.md)**  
  Standalone Node.js deployment, Cloudflare Workers/D1/R2 setup, R2 media sync, serverless sessions, and the critical corporate mail DNS preservation checklist (protecting Google Workspace / Microsoft 365).
- **[Node.js + SQLite Production Backup & Disaster Recovery](node-backup-restore.md)**
  Consistent SQLite acquisition (.backup / VACUUM INTO), synchronized media/secret bundles, retention schedules, and isolated restore drills.
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

- **[Cloudflare Backup & Restore](cloudflare-backup-restore.md):** D1/media/key recovery, migration gates and isolated drills.
- **[Edge Cache & Asset Lifecycle](edge-cache-lifecycle.md):** explicit freshness, seven-day asset carry-forward, normalization and scheduler verification.
- **[Scanner-safe Newsletter & Webhooks](newsletter-architecture.md):** deliberate confirmation and domain-isolated idempotent events.
