---
name: site-art-direction
description: Turn a site brief, content structure, brand assets, and visual evidence into a distinct art direction before Astro implementation. Use for new public sites, redesigns, and migrations; leave CMS architecture and frontend mechanics to their specialist skills.
---

# Site art direction

For optional DESIGN.md exchange use `docs/design-interchange.md` and the pinned local validation path. AGENTS.md retains the direction decision and mandatory record; shipped CSS retains implementation authority. Keep fluid/contextual values and authored rationale explicit when a prototype tool cannot represent them. External Stitch/OpenDesign access and compatibility require an actual recorded exchange.

Define what the site should look and feel like, and why, before applying the direction across templates. Produce decisions that `astro-site-design` can implement and test.

This skill is influenced by the brief-first and variance/motion/density ideas in [Taste Skill](https://github.com/Leonxlnx/taste-skill) (MIT), adapted for evidence-led Astro and EmDash projects.

## Inputs

Read the available brief, audience and task information, content model, route inventory, real copy and imagery, brand assets, and visual references. For a redesign or migration, use the source audit produced by `astro-site-design`; do not infer the source identity from a logo or homepage screenshot alone.

When evidence is incomplete, make reversible working assumptions and label them. Ask only when plausible answers would lead to materially different identities or layouts.

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
- **Grid and density:** Container behavior, alignment, spacing rhythm, and responsive composition.
- **Asset generation pre-flight rule:** Generated expressive imagery must embed the Narrative Metaphor and describe its visible application. Functional icons, factual diagrams, and faithful brand assets are exempt: preserve their meaning. Merely appending the metaphor to a generic prompt is not compliance. Avoid unsupported generic requests such as "modern clean tech", "AI network", or "glowing futuristic background".
- **Interaction and motion character:** Feedback, transitions, and reduced-motion behavior.
- **Navigation, hero, editorial flow, and calls to action:** Core page family layouts.
- **Site-specific anti-patterns:** 2-3 visual cliches to avoid for this specific site.

Do not impose a universal anti-pattern list. A centered hero, card grid, serif, subdued neutral palette, asymmetry, or animation can all be correct when the content and identity justify them. Require a reason for repeated motifs and decorative elements.

Do not invent facts, testimonials, clients, metrics, team members, or pseudo-real stock content to make a composition feel complete. Use real material, honest editorial drafts, or clearly marked placeholders whose shape matches expected content.

## Explore enough to make a choice

When the brief supports substantially different directions, develop two or three compact concepts and compare them against audience fit, brand continuity, content fit, accessibility, maintainability, and distinctiveness. Select one direction or present the meaningful decision to the user.

Use mood boards or generated visual studies when words cannot resolve composition, imagery, or material treatment. Treat generated images as design references until the user intends them as production assets. Record provenance and usage constraints for third-party assets.

### Visual overhaul for builder migrations

For migrations from Stackable, Elementor, Blocksy builder templates, or similar systems, first decide whether the source visual language is worth preserving. Treat weak hierarchy, generic section patterns, dated typography, inconsistent spacing, excessive card layouts, and poor responsive composition as evidence for a redesign rather than constraints to reproduce. Preserve meaningful identity, content, photography, user tasks, URLs, accessibility requirements, and behavior unless the brief explicitly changes them.

When the source design is weak or the new visual premise is materially different, make a visual concept pass before broad Astro implementation:

1. Choose one representative page archetype and gather its real copy, source imagery, content shapes, and important states.
2. Create two or three compact visual concepts that show composition, hierarchy, typography character, imagery treatment, density, and responsive intent. Use the harness's available image-generation capability when it can clarify the visual world; do not require a particular provider or model. If image generation is unavailable, use a mood board, annotated reference sheet, or small HTML/CSS prototype.
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

### Micro-Refinement Protocol (In-Browser Tweaks Bar)

When testing or refining the rendered design:
1. In development mode, ensure `<TweaksBar />` is active in `src/layouts/Base.astro`.
2. Use the bar for scalar adjustments; use source edits for layout, hierarchy, font sourcing, and responsive rules.
3. Press `T` to open, `B` to toggle the actual source baseline, or Escape to close. Controls start without overrides; reload restores source styles. Hero sliders append to the baseline filter. Surface “Source” restores the stylesheet treatment.
4. Click **"Copy Tokens (CSS)"**, merge the exported overrides into `src/styles/global.css`, and reload. Preview and export share one token map, including fluid heading sizes, spacing, and surface declarations.
5. Verify the result in a clean session at mobile and wide viewports. Check the full palette contrast, actual font faces/weights, and hero media treatment. Do not regard a live preview as delivery evidence.

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
