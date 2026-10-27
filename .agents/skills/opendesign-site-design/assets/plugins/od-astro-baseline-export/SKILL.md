# Export to Baseline Astro (`od-astro-baseline-export`)

Use this downstream handoff plugin when moving an accepted OpenDesign HTML/CSS artifact into a Baseline Astro project (`static`, `static-sveltia`, or `emdash` profile).

## 5-Step Baseline Transmutation Workflow

1. **Preserve Concept Evidence & Pass the Art Direction Gate:**
   - Save the accepted OpenDesign `.html` artifact and its `1440×900` / `390×844` exported PNGs under `audit/visual-concepts/<concept-name>/`.
   - Record or update the `## Art Direction Record` in `AGENTS.md` and run `npm run check:art-direction -- --require-record`.
2. **Sync Semantic Tokens to `src/styles/global.css`:**
   - Never dump a prototype's raw `<style>` block into a page template.
   - Move palette (`--color-*`), font stack (`--font-*`), radius (`--radius-*`), and fluid scale (`--text-step-*`, `--spacing-*`) updates into `src/styles/global.css` inside `@theme` / `@layer base`.
   - Run `npm run design:tokens` to verify WCAG AA perceptual contrast across default and `[data-surface="dark"]` surfaces and valid `clamp()` bounds.
3. **Decompose into Zero-JS Astro Primitives on `/_styleguide`:**
   - Replace prototype wrapper divs with Baseline's native primitives in `src/components/`:
     - `<Section labelledBy="..." surface="default|dark">` for vertical section rhythm.
     - `<Container width="content|wide|reading">` (or `<Container breakout>` for long-form editorial layouts).
     - `<Grid>` or `.bento-grid` / `.grid-hairline` for multi-column layouts.
     - `<Card>` for surface panels, forwarding `--card-*` custom properties and `.clickable-parent` / `.focus-parent` where appropriate.
     - `.flow` (or `<RichText>`) for vertical sibling rhythm.
   - Keep component CSS in `@layer components` and strip any unnecessary client-side JavaScript in favor of native HTML (`<details>/<summary>`, CSS transitions, `@media (prefers-reduced-motion: no-preference)`).
   - Calibrate the component on `/_styleguide` and update `audit/component-calibration.md`.
4. **Bind Profile Data & Editorial Ownership:**
   - **`static` / `static-sveltia` profiles:** Wire typed Content Collection props (`src/content.config.ts`, `getStaticPaths()`, `render()`) and native `src/assets/` images via `<ResponsiveImage>`.
   - **`emdash` profile:** Wire server-rendered EmDash collection queries, `<RichText>` for Portable Text, `<EmDashImage>` for media, and forward live-editor field attributes (`{...entry.edit.title}`, `{...entry.edit.summary}`).
5. **Verify Route & Build Integrity:**
   - Inspect the rendered Astro route at `390px`, `768px`, and `1440px` viewports.
   - Run `npm run verify`, `npm run build`, and `npm run audit:html` (or `npm run check:dev-tools` on static profiles).
