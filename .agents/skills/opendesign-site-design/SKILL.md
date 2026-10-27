---
name: opendesign-site-design
description: Design and iterate Baseline site concepts in OpenDesign through MCP and CLI, query bundled DESIGN.md systems and HTML examples, map Baseline tokens and Astro primitives, lint and export headless renders, and translate approved artifacts into Astro. Use when the user chooses OpenDesign; direct Astro design does not require it.
---

# OpenDesign site design

Use OpenDesign (`nexu-io/open-design`) as a local HTML/CSS design, linting and headless-export surface inside Baseline's workflow. Unlike vector scene tools that flatten fluid CSS into static coordinates, OpenDesign authors directly in standard HTML and CSS (`clamp()`, CSS Grid, Flexbox, semantic custom properties and interactive states) while providing a 154-system `DESIGN.md` catalog, 188 zero-JS HTML layout examples, a deterministic anti-slop linter (`od lint`) and headless Chromium exports (`od export`). The same agent can design and implement; switching to another model or using OpenDesign's internal chat agent is optional. For OpenPencil, use [openpencil-site-design](../openpencil-site-design/SKILL.md); for Penpot, use [penpot-site-design](../penpot-site-design/SKILL.md).

## Establish the task and workflow order

1. Read the site's `AGENTS.md`, installed profile, existing brief/route decisions and relevant source CSS/components. Preserve accepted branding and content ownership. Use `site-art-direction` for direction and `astro-site-design` for production implementation. An audit first produces an actionable recommended plan and meaningful choices; it does not authorize broad design writes.
2. Reuse the selected surface and agent arrangement. At a new-site or significant-redesign concept checkpoint, follow [the shared design-iteration loop](../site-art-direction/references/design-iteration.md): recommend a design canvas, offer **OpenDesign**, **OpenPencil**, **Penpot** and **direct Astro/browser** explicitly, and prefer an already working user-preferred connection. Once OpenDesign is selected, continue its design work without repeatedly reopening the tool menu.
3. Reconcile OpenDesign's built-in `direction-picker` atom with Baseline's workflow track:
   - **Express Track or Scoped Refinement within an Accepted Brand:** Resolve and bind the single active visual direction directly (`direction-picker` behavior) without pausing for a multi-concept comparison.
   - **Standard Track (New Site or Visual Overhaul with Open Identity):** Develop two or three compact visual concepts for one representative slice, export renders, and present the direction choice before broad Astro rollout.
4. Define fixed versus changeable brand commitments, representative route/content, audience, direction, important states and review scope. Use [penpot-site-design/assets/design-brief.md](../penpot-site-design/assets/design-brief.md) only when a portable brief is needed across sessions.

## Stage 4A: Inspiration discovery vs. existing-site token bootstrap

Follow this exact sequence before writing prototype HTML so OpenDesign artifacts never invent ad-hoc CSS variable names that conflict with `src/styles/global.css`:

1. **Path A — Greenfield build or visual overhaul (exploring directions):**
   - Query OpenDesign's local catalog of 154 `DESIGN.md` design systems (`plugins/_official/design-systems/`) and 188 HTML/CSS layout examples (`plugins/_official/examples/` and `design-templates/`) first via `od plugin search <query> --json` or MCP `list_plugins` / `list_skills` before reaching for external network MCPs (`Nicelydone`, `designmd-mcp`, `21st.dev`).
   - Extract structural UX anatomy (secondary metadata, filter bars, section pacing) and palette/typography rules from the shortlisted OpenDesign references.
   - Map the candidate palette, font pairings and surface rules onto Baseline's canonical CSS custom properties (`--color-page`, `--color-surface`, `--color-elevated`, `--color-text`, `--color-muted`, `--color-action`, `--color-on-action`, `--color-border`, `--font-display`, `--font-body`, `--font-accent`, `--font-mono`, `--text-step-*`, `--spacing-*`, `--radius-*`) using the bundled [Baseline Design System specification](assets/plugins/baseline-design-system/DESIGN.md). Do not keep third-party variable names such as `--paper` or `--coral` as the primary contract in the prototype.
2. **Path B — Existing Baseline site redesign or component refinement:**
   - Run the optional source bootstrapper `npm run design:canvas-kit -- --out <new-external-directory>` as documented in [canvas-kit.md](../../../docs/canvas-kit.md).
   - Inspect the emitted `open-design/DESIGN.md` and `open-design/specimen.html`, which contain the site's exact `src/styles/global.css` expressions (`oklch()`, `clamp()`, `color-mix()`), sampled `390×844` and `1440×900` values, context risks and declared Astro component contracts.
   - Optionally install the generated `open-design/` folder or the bundled [baseline-design-system plugin](assets/plugins/baseline-design-system/DESIGN.md) into OpenDesign's local *My plugins* via `od plugin install --source <folder>`.

## Connect, create the project and sync Desktop UI

Read [references/connection-and-cli.md](references/connection-and-cli.md) before connecting or running CLI commands. Follow [docs/opendesign-onboarding.md](../../../docs/opendesign-onboarding.md) when setting up a new connection.

1. Discover the running OpenDesign daemon URL (`OD_DAEMON_URL`, default `http://127.0.0.1:7456` for standalone CLI or the desktop app's allocated loopback port, paired with its Next.js web sidecar).
2. Confirm access via MCP (`list_projects`, `get_active_context`) or `daemon-cli.mjs`. When creating a project over HTTP/CLI, always supply an explicit lowercase slug `id` alongside `name` (`{ id: "<slug>", name: "<Title>" }`).
3. When an external coding agent creates a project or artifact via CLI/MCP while the Electron desktop window is open, synchronize the conversation and active tab state and remind the user to press `Ctrl + R` (or `View -> Reload`) in OpenDesign Desktop—or open the local web sidecar URL in a browser—so React state refreshes the project sidebar immediately.

## Stage 4B: Iterate HTML/CSS slices, lint and export

Read [penpot-site-design/references/baseline-recipes.md](../penpot-site-design/references/baseline-recipes.md) and [references/baseline-html-recipe.md](references/baseline-html-recipe.md) before authoring an artifact.

1. Build self-contained HTML/CSS artifacts (`.html`) inside the OpenDesign project for a representative page or section slice. Use fluid `clamp()` typography and spacing, native CSS Grid/Flexbox, semantic HTML landmarks (`<section data-od-id="...">`, `<article>`, `<header>`) and Baseline's class vocabulary (`.container`, `.bento-grid`, `.card`, `.flow`, `.btn`, `.btn--secondary`, `.btn--ghost`, `.eyebrow-telemetry`, `.font-accent`, `.tabular-nums`, `.ui-specimen`).
2. Apply the five-point rubric: three-tier surface depth (`--color-page`, `--color-surface`, `--color-elevated` / `[data-surface="dark"]`); four-voice typography (`--font-display`, `.font-accent`, `--font-body`, `--font-mono`); asymmetric grid rhythm; tactile action hierarchy with `:hover` and `:focus-visible`; and `prefers-reduced-motion` safeguards.
3. Run the deterministic anti-slop linter after every edit batch:
   `od lint <artifact.html> --json`
   Fix all `P0` and `P1` findings before presenting the work—including uppercase labels without tracking (`all-caps-no-tracking`, require `letter-spacing >= 0.06em`), missing section anchors (`missing-section-anchor`, add `data-od-id` to top-level sections), contrast failures or unconstrained line lengths.
4. Register the artifact in the project (`od artifacts create` or MCP `create_artifact`), then capture desktop (`1440×900`) and mobile (`390×844` or extended height) renders using the explicit-viewport procedure in [connection-and-cli.md](references/connection-and-cli.md#explicit-desktop-and-mobile-captures). The tested `od export` CLI does not expose viewport-size flags. Inspect the rendered PNGs for wrapping, alignment and visual hierarchy, and record their actual dimensions.

## Stage 4C: Handoff and translate to Astro

Read [assets/plugins/od-astro-baseline-export/SKILL.md](assets/plugins/od-astro-baseline-export/SKILL.md) and [penpot-site-design/references/handoff-and-astro.md](../penpot-site-design/references/handoff-and-astro.md) before moving an approved OpenDesign artifact into production code. Use [penpot-site-design/assets/design-handoff.md](../penpot-site-design/assets/design-handoff.md) when handing off to another session or agent.

1. Never copy raw full-page prototype HTML or inline `<style>` blocks directly into `src/pages/`. Store substantial concept artifacts and exported PNGs under `audit/visual-concepts/<concept-name>/`.
2. Save and validate the `## Art Direction Record` in `AGENTS.md` (`npm run check:art-direction -- --require-record`), then translate any new or refined palette, font or scale tokens into `src/styles/global.css` and verify `npm run design:tokens`.
3. Decompose the approved HTML/CSS structure into zero-JS Astro primitives (`<Section>`, `<Container>`, `<Grid>`, `<Card>`, `<Disclosure>`, `.flow`) and calibrate them on `/_styleguide` (`audit/component-calibration.md`).
4. Wire profile-specific content and editorial ownership: typed Content Collections (`getStaticPaths()`/`render()`) on `static` and `static-sveltia`, or server-rendered queries and live-editor attribute forwarding (`{...entry.edit.*}`) on `emdash`.
5. Verify real routes in a browser at `390px`, `768px` and `1440px`, then complete `npm run verify`, `npm run build` and `npm run audit:html` (or `npm run check:dev-tools` on static profiles).

## Sources and boundaries

Baseline-owned guidance, complementary to [nexu-io/open-design](https://github.com/nexu-io/open-design). Bundled Baseline OpenDesign plugins (`baseline-design-system` and `od-astro-baseline-export`) live under `assets/plugins/`. No OpenDesign package, daemon or cloud account is required by a generated site's runtime, build or CI.
