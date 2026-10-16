# Art Direction Workflow & The Design Gate

One of the most persistent frustrations when building websites with AI coding assistants is **"aesthetic drift"**—the tendency of models to default to a generic, corporate "AI slop" template:
- Purplish or indigo linear gradients
- Inter or system sans-serif for everything
- Floating rounded-xl cards with oversized drop shadows
- Meaningless decorative icon badges or feature pills
- Low-contrast light gray body text on white backgrounds

Baseline prevents this by instituting an automated **Art Direction Gate** (`npm run check:art-direction`). Before an assistant or developer writes visual code under `src/`, they must establish and record a deliberate aesthetic identity.

---

## 1. The Art Direction Record

Before writing site-specific CSS or template markup, save an `## Art Direction Record` in `AGENTS.md`. 

The record must contain five specific elements:

```markdown
## Art Direction Record

- **Aesthetic Lane:** Warm Heritage / Archival Editorial
- **Narrative Metaphor:** A century-old sports club's printed jubilee gazette meets modern athletic precision.
- **Typography Pairing:** Playfair Display (editorial serif display) + Noto Sans (high-legibility functional body).
- **Token Physics:**
  - *Canvas:* Muted cream ground (`oklch(98% 0.01 80)`) with crisp white elevated surface tiles.
  - *Action/Accent:* Deep racing green (`oklch(38% 0.12 150)`) with antique gold interactive accents.
  - *Borders:* Hairline borders (`1px solid oklch(85% 0.02 80)`) on cards; no heavy drop shadows.
  - *Spatial Density:* Generous editorial breathing room (`--spacing-section` up to 9rem on desktop).
- **Site Anti-Patterns:** No floating SaaS card shadows; no neon or purple gradients; no decorative pill badges; no generic stock photography.
```

---

## 2. Aesthetic Lanes

Select an aesthetic lane that genuinely serves the client's brief and audience. Consult `.agents/skills/site-art-direction/references/aesthetic-lanes.md` for guidance:

| Aesthetic Lane | Characteristics | Suitable For |
| :--- | :--- | :--- |
| **Minimal Editorial** | High typographic contrast, generous white space, stark monochrome palettes with one deliberate accent color, refined reading measures. | Architecture, publishing, law, design agencies, luxury brands |
| **Warm Heritage** | Archival tones, serif display typography, textured surfaces, warm paper grounds, dignified borders, storytelling layout rhythm. | Historic institutions, sports clubs, craftsmanship, cultural centers |
| **Industrial / Technical** | Monospaced metadata, precise grid tracks, structural dividing borders, high-density data tables, muted utilitarian colors. | Engineering, software tools, manufacturing, technical documentation |
| **Kinetic / Modern** | Bold saturated color accents, fluid typography steps, dynamic photo galleries, punchy headlines, active motion toggles. | Youth sports, creative events, music festivals, consumer startups |
| **Brutalist Precision** | Sharp 0px border-radii, stark contrasting lines, bold un-softened borders, raw semantic HTML elements, high information density. | Independent arts, developer tooling, research laboratories |

---

## 3. Token Physics

Translate the aesthetic lane into physical CSS parameters before touching templates:

1. **Canvas & Surfaces:**
   - What is the page ground? (Sterile white, warm paper, slate dark, or subtle pattern?)
   - How do cards sit on the canvas? (Distinct surface color, hairline border, or pure whitespace separation?)
2. **Action & Accent:**
   - What color draws the eye? Verify WCAG AA contrast (minimum 4.5:1 for normal text, 3:1 for large text) against the canvas and dark surfaces.
3. **Borders & Radii:**
   - Define `--radius-control` (buttons/inputs) and `--radius-card`. Are corners sharp (`0px`), tailored (`0.375rem`), or rounded (`0.75rem`)?
4. **Spatial Density:**
   - Is the site compact and data-rich, or spacious and leisurely? Set fluid spacing tokens accordingly.

---

## 4. Site Anti-Patterns

Explicitly defining what **not** to do is often more effective with AI assistants than describing what to do. Always list 2–3 concrete bans:
* *"No floating rounded cards with fuzzy drop shadows."*
* *"No decorative icon pills beside headings."*
* *"No generic purple/blue gradients or glassmorphism."*
* *"No centered body copy longer than two lines."*

---

## 5. Automated Gate Enforcement

Baseline provides automated checking to ensure the art direction record exists and visual code isn't written blindly:

```sh
# Verify the art direction record:
npm run check:art-direction -- --require-record
```

- **In Local Development:** Run this command before implementing new templates or when onboarding a new AI assistant.
- **In CI Pipelines:** Automated CI runs `check:art-direction` against git commits. Commits that add visual CSS or templates without a valid Art Direction Record in `AGENTS.md` are automatically flagged.
- **Exceptions:** Pure infrastructure changes or starter maintenance can be registered as hash-bound exceptions in `audit/design-gate-exceptions.json`.
