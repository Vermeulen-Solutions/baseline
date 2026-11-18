---
bump: patch
platforms: [emdash, static]
areas: [skills]
adoption: sync
visible: no
database: no
---

# Guidance: content patterns, trust pages and measurement, interaction techniques

Three new skill references, routed from their skills:

- **`new-site-workflow/references/content-patterns.md`:**
  - answer-first fields: a 110–160 character summary, an optional short answer with a real number, and update dates with a "what changed" line;
  - a portfolio and project model: honest outcomes, live links, facts with fallbacks, before pictures only when real, explicit order, contrast-checked client colours, side projects kept apart;
  - quotes and reviews, sections that open with their first entry, and facts that switch features on.
- **`new-site-workflow/references/trust-and-measurement.md`:**
  - analytics in four tiers, from cookie-free aggregate counts (the default, no banner) through marketing tags and session recordings to visitor trails linked to leads, with what each needs (consent for EU visitors, notice, masking, retention, production-only loading, CSP origins);
  - outlines for a privacy notice and an accessibility statement;
  - the AI-crawler decision, separating answer engines from training crawlers, with Cloudflare's own bot settings.
- **`astro-site-design/references/interaction-techniques.md`:** the techniques under distinctive effects Baseline does not ship as components, each with its fallback:
  - motion: springs, a hover lift that cannot jitter, a first screen never hidden, word effects with one accessible sentence, rolling numbers;
  - overlays: a command palette on `<dialog>` with a shortcut that can be turned off, dismissable link previews, a single-press twin for every gesture;
  - texture, light and sound: textures on `background-image`, sound off by default;
  - images cut to their frame at build time.

## For sites

The references arrive with the next skill sync. Use the trust and measurement reference before launch, and whenever a client asks for analytics, recordings or a cookie banner.
