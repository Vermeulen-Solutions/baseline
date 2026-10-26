---
name: site-art-direction
description: Turn a site brief, content structure, brand assets, and visual evidence into a distinct art direction before Astro implementation. Use for new public sites, redesigns, and migrations; leave CMS architecture and frontend mechanics to their specialist skills.
---

# Site art direction

`DESIGN.md` is optional reference material; no particular schema, validator or exchange tool is required. `AGENTS.md` retains the direction decision and mandatory record; shipped CSS retains implementation authority and `npm run design:tokens` validates the native tokens. Keep fluid/contextual values and authored rationale explicit when a prototype tool cannot represent them. External `designmd-mcp` ([designmd.ai/explore](https://designmd.ai/explore)), Stitch/OpenDesign, `21st.dev`, and `Nicelydone` access and compatibility are optional accelerators; never block when they are absent. If available, `docs/design-interchange.md` expands the optional exchange guidance.

Define what the site should look and feel like, and why, before applying the direction across templates. Produce decisions that `astro-site-design` can implement and test.

This skill is influenced by the brief-first and variance/motion/density ideas in [Taste Skill](https://github.com/Leonxlnx/taste-skill) (MIT), adapted for evidence-led Astro and EmDash projects.

## Inputs

Read the available brief, audience and task information, content model, route inventory, real copy and imagery, brand assets, and visual references. For a redesign or migration, use the source audit produced by `astro-site-design`; do not infer the source identity from a logo or homepage screenshot alone.

When evidence is incomplete, make reversible working assumptions and label them. Ask only when plausible answers would lead to materially different identities or layouts.

## Ground UX anatomy before styling

When a site includes non-trivial interactive flows, directories, schedules, pricing structures, or multi-step forms, avoid inventing layouts from statistical LLM averages:

- **UX Flow Teardowns (Optional):** If `Nicelydone MCP`, `Refero.design`, or `Kombai Gallery` is available (or via targeted web reference lookup), inspect real production web screens for the target archetype.
- **Extract Structural Anatomy, Not Branding:** Note what secondary metadata (timestamps, status badges, tabular counts, hairline dividers), filter controls, empty states, and disclosure patterns make the interface credible and scannable.
- **Plan Section Pacing Variance:** Map how consecutive sections on a primary route will vary in geometry and density (e.g., alternating an asymmetric split hero with a compact tabular index, a dark-surface editorial spotlight, and a variable-span bento grid) rather than repeating identical 3-column card rows.

## Read the design problem

Summarize the design problem in a few concrete statements:

- what kind of site this is and what visitors need to accomplish;
- who must trust, understand, or enjoy it;
- what the content naturally emphasizes;
- which brand or source characteristics carry meaning;
- which usability, accessibility, sector, or performance constraints shape the expression;
- which weaknesses or generic tendencies the new direction should correct.

Avoid style labels without interpretation. If a brief says “premium,” “playful,” “editorial,” or names another site, translate that signal into relevant choices for this audience and content.

## Set the expressive range

Choose a deliberate level for each dimension and explain it in site-specific terms:

- **Composition:** orderly to highly varied — symmetry, overlap, rhythm, section changes, and use of negative space.
- **Motion:** quiet to expressive — feedback, entrances, scroll behavior, and transitions justified by the content.
- **Density:** spacious to information-rich — how much content appears together and how quickly visitors can scan it.

Use qualitative levels or a small scale as a thinking aid, not as a formula. Accessibility, content volume, audience expectations, and the existing identity can override an aesthetic preference.

## Define the visual system

Read [`references/aesthetic-lanes.md`](references/aesthetic-lanes.md) before defining the visual direction. Select one primary **Aesthetic Lane** (*Technical Systems*, *Product-Led Minimalism*, *Editorial Paper*, *Luminous Futurism*, or *Custom / existing brand* with a rationale) to anchor typography, surfaces, density, and contrast.

Create one coherent direction covering:

Use the concrete defaults and examples below for new or replacement visual work; they give an implementer observable decisions to make and verify. For refinement, preserve calibrated client choices. When the brief or accepted direction conflicts with a default, record the specific exception and rationale instead of silently weakening the recipe. Capability counts alone do not establish visual quality, and illustrative specimens must not invent factual claims.

- **Narrative Metaphor:** A concrete physical or environmental anchor (e.g., "Observatory telescope monitoring storm fronts", "Archival bond paper and letterpress ink"). Explain its concrete effect on composition, imagery, or material treatment and where it stays absent. Never use it to override functional semantics or faithful brand assets.
- **Aesthetic Lane:** Selected lane and specific site adaptations.
- **Typography roles and rationale:** Display and body pairing from fonts the project can legally and reliably serve.
- **Palette and physics:** Contrast hierarchy, 3-tier surfaces (`--color-page`, `--color-surface`, `--color-elevated` / `.surface-elevated`), 2-tier borders (`--color-border`, `--color-border-strong`), `1px` specular top inner highlight (`--surface-highlight`), shadows, and corner treatment.
- **4-Voice typography hierarchy:**
  1. *Monumental Display (`--font-display`)* — Tight tracking (`-0.03em` to `-0.04em`), compressed line-height (`0.95–1.08`), `text-wrap: balance`.
  2. *Inline Editorial Contrast Accent (`.font-accent` / `--font-accent`)* — Italic serif accent used selectively on 1–2 focal words inside a display `<h1>`/`<h2>` (`<em class="font-accent">...</em>`) to create editorial tension against a geometric/grotesk display face.
  3. *Reading & UI Body (`--font-body`)* — High-x-height neutral sans (`1.6–1.68` line-height, `60ch–68ch` measure).
  4. *Telemetry & Coordinate Monospace (`.eyebrow-telemetry` / `--font-mono` + `.tabular-nums`)* — `0.75rem` uppercase with `0.12em` tracking for structural section indices (`[01 // ARCHITECTURE]`, `§ 02 — TELEMETRY`), version badges (`.badge-pill`), dates/times and numeric metrics. Use actual content and meaningful labels; decorative indices are not evidence for invented data.
- **Hero visual specimen strategy (mandatory choice before coding):** Explicitly select how the hero anchors visual authority instead of falling back to generic stock art. Use the examples below to make that choice; preserve a different established treatment when the brief fixes it and record why:
  1. *Live-Coded UI / Telemetry Specimen (`.ui-specimen`)* — For SaaS, developer tools, AI, fintech, and B2B platforms: build an HTML/CSS/SVG architectural console, telemetry ledger, CLI readout, or interactive state switcher using `.ui-specimen`, `.ui-specimen__header`, `.tabular-nums`, and `.status-dot`. Never use blurry raster screenshots or generic futuristic AI stock art.
  2. *Interactive Narrative / Capability Stage* — For agencies, studios, and multi-service brands: an asymmetric split stage pairing the value proposition with a numbered capability matrix (`01`–`04`) or interactive preview panel.
  3. *Art-Directed Photography / Editorial Frame* — For hospitality, architecture, physical goods, and craft brands: prepared photography (`npm run media:prepare`) framed with deliberate aspect ratios, hairline borders, and archival figure captions (`FIG. 01`).
- **Grid, density, and section pacing:** Container behavior, alignment, spacing rhythm, compositional variance across consecutive sections (do not stack consecutive identical 3-column card grids; alternate split hero → `.grid-hairline` ledger → sticky narrative + bento matrix → `data-surface="dark"` spotlight → native `<Disclosure>` FAQ), and responsive composition. Record a specific exception for an accepted existing composition or a comparison task that genuinely requires uniform rows.
- **Signature header & navigation archetype:** Select an intentional masthead pattern matching the lane (*Floating Glass Capsule* via `.surface-glass`, *Exposed Brutalist Multi-Cell Bar* with `1px` cell dividers and top telemetry strip, or *Editorial Hairline Masthead* with numbered nav indices). An established masthead can be the recorded choice during refinement; preserve real navigation semantics.
- **Asset generation pre-flight rule:** Generated expressive imagery must embed the Narrative Metaphor and describe its visible application. Functional icons, factual diagrams, and faithful brand assets are exempt: preserve their meaning. Merely appending the metaphor to a generic prompt is not compliance. Avoid unsupported generic requests such as "modern clean tech", "AI network", or "glowing futuristic background".
- **Interaction and motion character:** Feedback, transitions, and reduced-motion behavior.
- **Navigation, hero, editorial flow, and calls to action:** Core page family layouts.
- **Site-specific anti-patterns:** 2-3 visual cliches to avoid for this specific site.

Do not impose a universal anti-pattern list. A centered hero, card grid, serif, subdued neutral palette, asymmetry, or animation can all be correct when the content and identity justify them. Require a reason for repeated motifs and decorative elements.

Do not invent facts, testimonials, clients, metrics, team members, or pseudo-real stock content to make a composition feel complete. Use real material, honest editorial drafts, or clearly marked placeholders whose shape matches expected content.

## Explore enough to make a choice

When the brief supports substantially different directions, develop two or three compact concepts and compare them against audience fit, brand continuity, content fit, accessibility, maintainability, and distinctiveness. Select one direction or present the meaningful decision to the user.

For a new site, significant overhaul or replacement visual world, read [references/design-iteration.md](references/design-iteration.md) and recommend canvas-led iteration at the existing concept checkpoint. Offer **OpenPencil** (local desktop/file), **Penpot** (shared cloud design) and **direct Astro/browser** explicitly; prefer the user's settled choice and an already working connection. Retain named preferred alternatives **Pencil**, **Google Stitch**, **OpenDesign**, **Claude Design** and `designmd-mcp` references. Inspect actual access and resolve any unavailable-tool fallback with the user. Use `penpot-site-design` for Penpot and the official version-matched upstream skill/API for OpenPencil. The reference defines focused visual batches, direction selection, a representative Astro proof and rollout; it does not claim measured speed/token savings. Same-agent work is complete; another agent/handoff is optional. Reuse answered choices and skip concept discovery for small refinements within an accepted composition.

Use mood boards, community `DESIGN.md` references (`designmd-mcp` / [designmd.ai/explore](https://designmd.ai/explore)), prototyping tools (**Penpot**, **OpenPencil**, **Pencil**, **Google Stitch**, **OpenDesign**, **Claude Design**), or generated visual studies to execute the selected concept approach. When a tool emits a `DESIGN.md` file, store it under `audit/visual-concepts/<concept-name>/DESIGN.md`, review its provenance and intent, and translate the selected decisions into native CSS tokens. Run `npm run design:tokens` and inspect the rendered result on `/_styleguide`. Only select and separately install an external validator when a specific exchange requires it; ordinary site work needs no design-package dependency. Treat generated images as design references until the user intends them as production assets. Record provenance and usage constraints for third-party assets.

### Visual overhaul for existing sites

For an existing Baseline site, a builder migration or another redesign, distinguish refinement, significant overhaul within the brand, and replacement of the visual world. Reuse an explicit choice; resolve only consequential ambiguity. Separate fixed logo, palette, type, content and functionality commitments from permission to change composition or the visual system. An accepted preserve-composition direction stays authoritative until the user supersedes it. Weak hierarchy, generic sections, inconsistent spacing or poor reflow are problems to solve, not a license to discard brand commitments.

For an authorized significant overhaul or materially different visual premise, make a visual concept pass before broad Astro implementation:

1. Choose one representative page archetype and gather its real copy, source imagery, content shapes, and important states.
2. Create two or three compact visual concepts that show composition, hierarchy, typography character, imagery treatment, density, and responsive intent. Use the concept-stage choice above: Penpot, OpenPencil, Pencil, Google Stitch, OpenDesign, Claude Design, `designmd-mcp` references, image generation or a direct Astro/browser prototype. Preserve the user's selected approach; use the agreed fallback if an external tool is unavailable. Keep concept artifacts under `audit/visual-concepts/`.
3. Compare the concepts against the brief, source identity worth preserving, realistic content, accessibility, maintainability, and distinctiveness. Do not choose a concept solely because its generated copy or decorative details look impressive.
4. Resolve the direction decision, then translate it into implementation rules in the art-direction record before building the rest of the route inventory. Record which previous visual decisions are superseded; selecting an overhaul does not authorize new copy, CMS writes, deployment or DNS changes beyond the existing scope.

Generated concepts are references for composition and visual character, not exact CSS or content specifications. Verify typography, text, responsive behavior, interactions, and CMS states in the real Astro implementation. Store substantial concept work under `audit/visual-concepts/` and link it from `AGENTS.md`.

## Produce the handoff

> [!CAUTION]
> **ART DIRECTION GATE:**
> Follow the canonical visual implementation gate in `AGENTS.md` (Implementation rules). Save the complete record before site-specific visual implementation and run `npm run check:art-direction -- --require-record`. The gate covers all visual implementation, not only templates and components. Its documented scoped exceptions permit infrastructure fixes and isolated concept studies. The CLI/CI validate structure and changed-file exceptions; they do not block writes or prove decision quality.

Use an adopted `PROJECT.md` as brief evidence when present, and identify the selected `DESIGN.md` or concept reference when used. Keep the brief, larger visual reference and implemented CSS distinct; do not copy the gate record into competing documents. Write the Art Direction Record directly in `AGENTS.md` using this exact markdown schema:

```markdown
## Art Direction Record
- **Aesthetic Lane:** [Technical Systems | Product-Led Minimalism | Editorial Paper | Luminous Futurism | Custom / existing brand — rationale]
- **Narrative Metaphor:** [Physical/environmental anchor; concrete application and boundaries]
- **Typography Pairing:** Display: [Font family], Body: [Font family] (Rationale and reliably served weights)
- **Token Physics:**
  - Canvas: [Color / texture]
  - Action/Accent: [Color role]
  - Borders: [Hairline 1px / 8px radius / pill / sharp]
  - Spatial Density: [Compact / Standard / Spacious]
- **Site Anti-Patterns:** [First concrete ban; second concrete ban; optional third ban]
```

### Agent-First Token Calibration Protocol (`npm run design:tokens` & `/_styleguide`)

When translating the Art Direction Record into `src/styles/global.css`:
1. Seed the closest canonical Aesthetic Lane preset with `npm run design:tokens -- --lane <lane-id> --write` (or inspect available lanes via `npm run design:tokens -- --list-lanes`), then customize brand hues, typography stacks, and spatial density directly in `src/styles/global.css`.
2. Run `npm run design:tokens` (and `npm run test:design`) to verify that all required `@theme`, `:root`, and `[data-surface="dark"]` tokens are present, fluid `clamp()` scales have valid min/max bounds, and all 10 WCAG AA perceptual contrast pairs pass across light and dark surfaces.
3. Open `/_styleguide` in development (`npm run dev`) to inspect typography, semantic color swatches, native controls, `<Container breakout>`, `<Card>`, and galleries across mobile and wide viewports via Vite HMR.

The record should constrain implementation without prescribing every CSS value. `astro-site-design` turns it into tokens, components, responsive rules, and reviewed pages.

## Review the direction

Before handing off, test the proposal:

- Could it plausibly belong to many unrelated organizations after replacing the logo and accent color? If so, strengthen the connection to the actual content or identity.
- Does the hierarchy support visitor tasks and realistic content lengths?
- Can the direction repeat across all page archetypes without every section using the same composition?
- Do typography, color, imagery, shape, and motion feel like one system?
- Can it remain legible, operable, responsive, and respectful of user preferences?
- For a redesign, is it clear what recognizable character is preserved and what is intentionally improved?

Resolve material weaknesses before broad implementation. Cosmetic variation alone does not make a direction distinctive.

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
