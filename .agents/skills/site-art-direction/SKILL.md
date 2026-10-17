---
name: site-art-direction
description: Turn a site brief, content structure, brand assets, and visual evidence into a distinct art direction before Astro implementation. Use for new public sites, redesigns, and migrations; leave CMS architecture and frontend mechanics to their specialist skills.
---

# Site art direction

For optional DESIGN.md exchange and external visual tooling, use `docs/design-interchange.md` and the pinned local validation path (`npm run design:check` using `@google/design.md`). `AGENTS.md` retains the direction decision and mandatory record; shipped CSS retains implementation authority. Keep fluid/contextual values and authored rationale explicit when a prototype tool cannot represent them. External `designmd-mcp` ([designmd.ai/explore](https://designmd.ai/explore)), Stitch/OpenDesign, `21st.dev`, and `Nicelydone` access and compatibility are optional accelerators; never block when they are absent.

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

- **Narrative Metaphor:** A concrete physical or environmental anchor (e.g., "Observatory telescope monitoring storm fronts", "Archival bond paper and letterpress ink"). Explain its concrete effect on composition, imagery, or material treatment and where it stays absent. Never use it to override functional semantics or faithful brand assets.
- **Aesthetic Lane:** Selected lane and specific site adaptations.
- **Typography roles and rationale:** Display and body pairing from fonts the project can legally and reliably serve.
- **Palette and physics:** Contrast hierarchy, surfaces, borders, shadows, and corner treatment.
- **Grid, density, and section pacing:** Container behavior, alignment, spacing rhythm, compositional variance across consecutive sections, and responsive composition.
- **Asset generation pre-flight rule:** Generated expressive imagery must embed the Narrative Metaphor and describe its visible application. Functional icons, factual diagrams, and faithful brand assets are exempt: preserve their meaning. Merely appending the metaphor to a generic prompt is not compliance. Avoid unsupported generic requests such as "modern clean tech", "AI network", or "glowing futuristic background".
- **Interaction and motion character:** Feedback, transitions, and reduced-motion behavior.
- **Navigation, hero, editorial flow, and calls to action:** Core page family layouts.
- **Site-specific anti-patterns:** 2-3 visual cliches to avoid for this specific site.

Do not impose a universal anti-pattern list. A centered hero, card grid, serif, subdued neutral palette, asymmetry, or animation can all be correct when the content and identity justify them. Require a reason for repeated motifs and decorative elements.

Do not invent facts, testimonials, clients, metrics, team members, or pseudo-real stock content to make a composition feel complete. Use real material, honest editorial drafts, or clearly marked placeholders whose shape matches expected content.

## Explore enough to make a choice

When the brief supports substantially different directions, develop two or three compact concepts and compare them against audience fit, brand continuity, content fit, accessibility, maintainability, and distinctiveness. Select one direction or present the meaningful decision to the user.

Use mood boards, community `DESIGN.md` references (`designmd-mcp` / [designmd.ai/explore](https://designmd.ai/explore)), generative prototyping tools (**Google Stitch**, **OpenDesign**, **Claude Design**), or generated visual studies when words cannot resolve composition, imagery, or material treatment. When a prototyping tool or `designmd.ai` emits a `DESIGN.md` file, store it under `audit/visual-concepts/<concept-name>/DESIGN.md` and validate normative token frontmatter via `npm run design:check` (`docs/design-interchange.md`) before translating into fluid CSS tokens. Do not install the npm `designmd` CLI package into `package.json` (which would shadow the pinned `@google/design.md` binary); use `designmd-mcp` or `npx --package=designmd` for community registry queries. Treat generated images as design references until the user intends them as production assets. Record provenance and usage constraints for third-party assets.

### Visual overhaul for builder migrations

For migrations from Stackable, Elementor, Blocksy builder templates, or similar systems, first decide whether the source visual language is worth preserving. Treat weak hierarchy, generic section patterns, dated typography, inconsistent spacing, excessive card layouts, and poor responsive composition as evidence for a redesign rather than constraints to reproduce. Preserve meaningful identity, content, photography, user tasks, URLs, accessibility requirements, and behavior unless the brief explicitly changes them.

When the source design is weak or the new visual premise is materially different, make a visual concept pass before broad Astro implementation:

1. Choose one representative page archetype and gather its real copy, source imagery, content shapes, and important states.
2. Create two or three compact visual concepts that show composition, hierarchy, typography character, imagery treatment, density, and responsive intent. Use the harness's available visual prototyping or image-generation capability (`designmd-mcp`, Stitch, OpenDesign, Claude Design, or image generation) when it can clarify the visual world; do not require a particular provider or model. If external generation is unavailable, use a mood board, annotated reference sheet, or small HTML/CSS prototype in `audit/visual-concepts/`.
3. Compare the concepts against the brief, source identity worth preserving, realistic content, accessibility, maintainability, and distinctiveness. Do not choose a concept solely because its generated copy or decorative details look impressive.
4. Select one direction and translate it into implementation rules in the art-direction record before building the rest of the route inventory.

Generated concepts are references for composition and visual character, not exact CSS or content specifications. Verify typography, text, responsive behavior, interactions, and CMS states in the real Astro implementation. Store substantial concept work under `audit/visual-concepts/` and link it from `AGENTS.md`.

## Produce the handoff

> [!CAUTION]
> **ART DIRECTION GATE:**
> Follow the canonical visual implementation gate in `AGENTS.md` (Implementation rules). Save the complete record before site-specific visual implementation and run `npm run check:art-direction -- --require-record`. The gate covers all visual implementation, not only templates and components. Its documented scoped exceptions permit infrastructure fixes and isolated concept studies. The CLI/CI validate structure and changed-file exceptions; they do not block writes or prove decision quality.

Write the Art Direction Record directly in `AGENTS.md` using this exact markdown schema:

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
