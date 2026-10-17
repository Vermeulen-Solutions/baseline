# Settings-to-output patterns — study conclusions and agent-first token engine

**Date:** 2026-10-17
**Subject:** a third-party settings-driven CSS framework, studied locally
**Companion:** [`implementation-plan.md`](./implementation-plan.md) records the phased exploration and final consolidation into `scripts/design-system.mjs`.
**Evidence log:** `reference-notes.local.md` (gitignored via `*.local.md`; never commit).

---

## 0. Method and limits

The study traced representative settings through five layers of a third-party framework: a declarative settings schema, a server-side settings store, a compile step that turns settings into stylesheet variables, the stylesheets themselves, and a browser-side settings panel that previews changes live.

Limits worth stating plainly:

- The reference implementation is **not part of this repository**. Its internal paths and line numbers live only in the gitignored local evidence log.
- Where a conclusion can be checked against **our** files, it is cited with a path in this repository.

---

## 1. The architecture, in five layers

The shape of the studied framework, described generically:

1. **Declarative settings schema.** Screens and inputs are data files, not code.
2. **Settings store with a server-side allow-list.** Only keys present in the schema may be saved.
3. **Compile step.** Stored settings become stylesheet variables through a chain of small transformers: colour expansion (hex/OKLCH and shade variants), unit conversion, fluid `clamp()` calculation, and dependent variable resolution.
4. **Stylesheets.** Derived families are computed with fluid `clamp()` maths across a fixed viewport span rather than fixed media-query breakpoints.
5. **Live browser panel.** The panel recomputes derived families in JavaScript and writes inline custom properties on the page.

Two observations about this arrangement were decisive for our architecture:

- **The valuable part is not an in-browser settings UI. It is that one authoritative source feeds validation, parametric derivation, and specimen coverage.**
- **Duplicating token math between a browser preview panel and the stylesheet is an inherent divergence hazard.** In an agent-first Astro/Tailwind v4 starter where `src/styles/global.css` is the source of truth and Vite provides instant HMR on `/_styleguide`, a custom in-browser Dev HUD (`TweaksBar`) adds runtime/test maintenance baggage while remaining inferior to a true visual builder (`@perkyzz/emvb`) for visual page editing and inferior to a deterministic CLI engine (`scripts/design-system.mjs`) for agent token calibration.

---

## 2. Lessons: where configuration described more than the code did

Seven failure modes observed in the studied framework and how our agent-first design engine (`scripts/design-system.mjs` + `tests/token-coverage.test.mjs`) prevents them:

| # | Lesson | Countermeasure in `emdash-baseline` |
| --- | --- | --- |
| 1 | **A documented property with no consumer.** | `tests/token-coverage.test.mjs` verifies that every authored token in `src/styles/global.css` is either consumed in `src/` or explicitly listed in `PUBLIC_CONTRACT_TOKENS`. |
| 2 | **Settings with no UI and no default.** | `REQUIRED_THEME_TOKENS`, `REQUIRED_ROOT_TOKENS`, and `REQUIRED_DARK_SURFACE_TOKENS` in `scripts/design-system.mjs` enforce that every required token has an authored value in `src/styles/global.css`. |
| 3 | **The same calculation implemented twice.** | Retiring `TweaksBar` and `design-tweaks.mjs` eliminated duplicate client-side token scaling. `scripts/design-system.mjs` is the single mathematical engine for fluid `clamp()` and OKLCH derivation. |
| 4 | **Validation that exists but is switched off by default.** | `npm run design:tokens` and `npm run test:design` run perceptual WCAG AA contrast and fluid `clamp()` checks unconditionally in local workflow and CI. |
| 5 | **Two competing answers to "what was generated?"** | `parseDesignTokens()` in `scripts/design-system.mjs` parses `src/styles/global.css` directly — no intermediate generated catalog module can drift from the stylesheet. |
| 6 | **Computed error state that is never rendered.** | All contrast and fluid-scale violations fail closed with actionable error messages and nonzero exit codes. |
| 7 | **A schema type defined but used by no screen.** | Every `@theme` `--color-*` role is verified against `specimenTokens` on `/_styleguide`. |

---

## 3. Adopted patterns in `scripts/design-system.mjs` (`npm run design:tokens`)

| ID | Pattern | Implementation in `emdash-baseline` |
| --- | --- | --- |
| P1 | **Verify declarations against real output (`src/styles/global.css`) and `/_styleguide` specimens.** | `scripts/design-system.mjs` (`auditDesignTokens`) + `tests/token-coverage.test.mjs` verify `@theme`, `:root`, `[data-surface="dark"]`, `/_styleguide` swatches, and `src/` consumers. |
| P2 | **Single source of truth without hand-maintained duplicate catalogs.** | `src/styles/global.css` is parsed directly; no separate `token-catalog.generated.mjs` or `design-tweaks.mjs` is maintained. |
| P3 | **Parametric base + ratio fluid families and seeded OKLCH palettes.** | `generateTypeScale` (`--type-scale`), `generateSpaceScale` (`--space-scale`), and `generateSeededPalette` (`--seed-accent` / `--seed-canvas`) derive fluid `clamp()` scales and WCAG-verified OKLCH ramps directly into `src/styles/global.css`. |
| P4 / W-A / W-B | **Machine-readable calibration I/O and SHA-256 Stage 4.5 verification.** | `npm run design:tokens -- --write-calibration` (`upsertCalibrationRecord`) writes a deterministic `## Token Calibration` section with LF-normalised SHA-256, 10 WCAG AA contrast pairs, and fluid scale table into `audit/component-calibration.md`. |

---

## 4. Verifiable repository index

- Design token CLI & programmatic engine: `scripts/design-system.mjs` (`npm run design:tokens`)
- Authored tokens and consumers: `src/styles/global.css`
- Styleguide specimens and coverage: `src/dev/styleguide-fixtures.ts`, `src/components/dev/Styleguide.astro`
- Automated coverage, contrast, and parametric generator tests: `tests/token-coverage.test.mjs`, `tests/design-workflow.test.mjs`
- Workflow and gates: `scripts/check-art-direction.mjs`, `scripts/audit-design-system.mjs`, `AGENTS.md`, `docs/design-framework.md`
