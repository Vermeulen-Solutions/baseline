# Documentation Directory

Welcome to the Baseline documentation. This repository provides an agency-grade, visual-first Astro foundation built specifically for **AI-assisted developers working with EmDash CMS**.

Explore the documentation guides below, organized by task and domain:

---

## 🚀 1. Site Building & Core Architecture

*Core concepts for querying content, structuring templates, and composing reusable components.*

- **[Editorial Canvas & Content Binding](emdash-editorial-canvas.md)**  
  How to query EmDash collections in Astro templates and bind live editing field proxies (`entry.edit.title`) so clients can visually edit content. Also details the **50-column physical schema budget** for Cloudflare D1 safety.
- **[Reusable Public Patterns](reusable-public-patterns.md)**  
  Production-tested primitives included out of the box: `Card`, `CMSPartnersPanel`, `ResponsiveImage`, `EditorialImage`, `RichText` (Portable Text flow), and form recovery utilities.
- **[Internationalization (i18n)](internationalization.md)**  
  Native row-per-locale multilingual architecture linked by translation groups, avoiding anti-pattern duplicate language columns (e.g. `title_en`).
- **[Forms & Verification](forms-adoption.md)**  
  Form handling, server-side recovery validation, and Cloudflare Turnstile spam protection.

---

## 🎨 2. Visual Development & The Dev HUD

*In-browser tools for fast, pixel-perfect visual calibration and component quarantine.*

- **[Local Visual Dev Tools (Dev HUD)](dev-hud.md)**  
  Complete runbook for the development-mode `<TweaksBar />`:
  - **`T` / `B`:** Live design token calibration and A/B source baseline comparison.
  - **`G`:** Container grid guide showing computed bounds and 10/12-column responsive tracks.
  - **`O`:** Mockup reference overlay with opacity, X/Y offsets, and scroll modes.
  - **`P`:** Read-only EmDash CMS ownership and field-binding inspector.
- **[Component Quarantine & Styleguide Fixtures](styleguide-fixtures.md)**  
  How `/_styleguide` renders components and responsive stress cases in isolation before page assembly, and how the route is automatically excluded (404) from production builds.
- **[Local Visual Regression Testing](visual-regression.md)**  
  Local-first Windows Chromium screenshot regression testing harness (`npm run test:visual`). Catch unintended layout reflows without Docker or consuming GitHub Actions runner quotas.
- **[Design Interchange (DESIGN.md)](design-interchange.md)**  
  Optional token bridge connecting Google Stitch, OpenDesign, and `DESIGN.md` tokens with Tailwind v4.

---

## 🖼️ 3. Media & Galleries

*Performant, responsive image delivery and interactive galleries.*

- **[Native Image Delivery](image-delivery.md)**  
  Native Astro 7.4 image optimization backed by EmDash's storage endpoint. Covers responsive WebP/AVIF generation, aspect ratio preservation, and Cloudflare R2 staging.
- **[Gallery Workflow](gallery-workflow.md)**  
  Progressively enhanced PhotoSwipe lightboxes embedded directly within Portable Text and custom gallery sections.

---

## 🤖 4. AI Coding Agent Workflows

*Harnesses and tools for pairing with AI assistants (Claude Code, Antigravity, Cursor).*

- **[Agent Documentation & MCP Setup](agent-documentation.md)**  
  Connecting coding assistants to official Astro and EmDash documentation via Model Context Protocol (MCP), and generating site-level access tokens with `npm run mcp:token`.
- **[Skill Synchronization](skill-synchronization.md)**  
  Managing staged updates for mirrored EmDash skills (`sync:emdash-skills`) and shared Vermeulen-maintained skills (`sync:site-skills`) while protecting local customizations.

---

## 🛡️ 5. Standards, Preflights & Auditing

*Tools to inspect, verify, and maintain site quality over time.*

- **[Site Standards Diagnostic Engine](site-standards-audit.md)**  
  Using `npm run audit:site` to diagnose existing sites against the certified `standards-v0.1.1` baseline, and applying deterministic modernization recipes.
- **[Starter Meta-Review Process](starter-meta-review.md)**  
  Methodology for recurring evaluation of upstream Astro, adapter, and EmDash releases.
- **[Site Registry Contract](site-registry.md)**  
  Private site registry conventions for agencies managing multiple client deployments.

---

## 📦 6. Starter Provenance & Historical Receipts

*Background records for maintainers and auditors.*

- **[Clean-History Public Release](public-release.md)**  
  How this repository was sanitized and extracted from internal development history.
- **[Phase 3 Standards Certification](phase-3-certification.md)**  
  Release certification notes and tested scopes for the `standards-v0.1.1` baseline.
- **[Third-Party Licenses](licenses/)**  
  Attributions for included upstream libraries (EmDash, Noto Sans OFL, PhotoSwipe, Impeccable).
