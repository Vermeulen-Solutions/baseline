# Pattern adoption & agent-first consolidation plan

**Date:** 2026-10-17
**Companion:** [`README.md`](./README.md)

## Architectural evolution on 2026-10-17

1. **Initial exploration (`commits a134205..d09c34b`):** Tested applying patterns P1/P2/P4 to the legacy in-browser `TweaksBar` Dev HUD (`src/components/TweaksBar.astro`, `src/utils/design-tweaks.mjs`, `scripts/generate-token-catalog.mjs`, `scripts/check-token-calibration.mjs`).
2. **Architectural review & consolidation:** Evaluated `TweaksBar` from a 1,000-foot perspective against the agent-first workflow and native visual page builders (`@perkyzz/emvb`). Concluded that an in-browser slider HUD is out of place in `emdash-baseline`: it duplicates token math in client JS, adds HUD/Playwright maintenance overhead, and is strictly worse than a direct CLI token engine for AI agents and strictly worse than `@perkyzz/emvb` for drag-and-drop visual editing.
3. **Final implementation (landed):**
   - **Removed all `TweaksBar` & Dev HUD runtime/test files:** Deleted `TweaksBar.astro`, `design-tweaks.mjs`, `token-catalog.generated.mjs`, `generate-token-catalog.mjs`, `token-catalog-overrides.mjs`, `check-token-calibration.mjs`, `clipboard.mjs`, `grid-guide.ts`, `reference-overlay.ts`, `reference-image.mjs`, `ownership-inspector.ts`, `emdash-ownership.mjs`, `playwright.dev-tools.config.mjs`, `tests/dev-tools/`, and `docs/dev-hud.md`.
   - **Built `scripts/design-system.mjs` (`npm run design:tokens`):**
     - Direct CSS parser for `@theme`, `:root`, `[data-surface="dark"]`, and `[data-surface="light"]` in `src/styles/global.css`.
     - Perceptual OKLCH & Hex luminance engine verifying 10 WCAG AA contrast pairs across default and dark surfaces.
     - Fluid `clamp()` validator and parametric generators (`--type-scale`, `--space-scale`, `--seed-accent`, `--seed-canvas`, `--lane`, `--set`).
     - Deterministic Stage 4.5 `## Token Calibration` Markdown generator (`--write-calibration`) bound to the LF-normalised SHA-256 digest of `src/styles/global.css`.
   - **Integrated optional `@perkyzz/emvb` (`EmVB` + `@perkyzz/emvb-mcp`)** into Stage 2 / Stage 5 of `new-site-workflow` and `docs/design-framework.md`.

## Status tracker

| ID | Capability | Target | Status |
| --- | --- | --- | --- |
| P1 | Direct `global.css` ↔ `/_styleguide` specimen & `src/` consumer coverage guard | `tests/token-coverage.test.mjs` | **Done** |
| P2 | Single source of truth (`src/styles/global.css` parsed directly; zero generated catalog files) | `scripts/design-system.mjs` | **Done** |
| P3 | Parametric fluid `--type-scale` / `--space-scale` and WCAG-safe `--seed-accent` OKLCH generator | `scripts/design-system.mjs` | **Done** |
| P4 / W-A / W-B | Stage 4.5 `## Token Calibration` Markdown generator with LF SHA-256 binding (`--write-calibration`) | `scripts/design-system.mjs` | **Done** |
| EmVB | Optional `@perkyzz/emvb` + `@perkyzz/emvb-mcp` guidance wired to `canvasStyles: ['/src/styles/global.css']` | `AGENTS.md`, `docs/design-framework.md`, `.agents/skills/new-site-workflow/SKILL.md` | **Done** |
