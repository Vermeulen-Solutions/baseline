---
trigger: always_on
---
# Astro composition and assets

Follow the canonical `AGENTS.md` and `.agents/skills/astro-site-design/references/component-quarantine.md`. This file bridges rule-aware harnesses; tools that do not load `.agent/rules/` still use AGENTS. These instructions are not universal pre-write enforcement.

- After source/content/art-direction decisions, calibrate relevant production components on `/_styleguide` and save `audit/component-calibration.md` before broad page assembly. Preserve normal-production exclusion.
- Compose open Section/Container/Grid slots using their actual APIs and shared tokens (`<Container width="reading|content|wide">` for standard sections, `<Container breakout>` / `.content-grid` with `.content--feature|wide|full|full-safe` when long-form editorial prose interleaves wider callouts/media). Use gap/padding/flow (`.flow` Smart Spacing variables) for rhythm, and `<Card>` (`--card-*` custom properties, concentric `--card-media-radius`, `.clickable-parent`/`.focus-parent`) for accessible cards. Repeated semantic composites are allowed; avoid hardcoded page monoliths and hidden layout policy. Preserve CMS ownership and field attribute forwarding.
- Place downloaded site imagery in `src/assets/` or the EmDash Media Library. Do not download site content images into `public/`. Document unchanged-URL passthrough exceptions (favicon/robots/fonts), provenance, dimensions and processing choices. Verify native image delivery; a folder alone proves no optimization.
- Document primary, secondary and inverted action roles only for supported surfaces; verify focus and all implemented states. Do not invent a theme or Button API.
- LogoTicker slots are trusted, noninteractive, ID-free list items without scripts, islands or edit proxies. Preserve its motion toggle, reduced-motion static fallback and hidden inert duplicate.
