# Art Direction Workflow & The Design Gate

One of the most persistent frustrations when building websites with AI coding assistants is **"aesthetic drift"**—the tendency of models to default to a generic, corporate "AI slop" template:
- Purplish or indigo linear gradients
- Inter or system sans-serif for everything
- Floating rounded-xl cards with oversized drop shadows
- Meaningless decorative icon badges or feature pills
- Low-contrast light gray body text on white backgrounds
- Monotonous page pacing (repeating the same 3-column card grid four times down the page)

Baseline addresses this with an **Art Direction Gate** (`npm run check:art-direction`) and optional design tools ([designmd.ai](https://designmd.ai/explore), `Brilliant`, `OpenPencil`, `Penpot`, optional `OpenDesign`, `Nicelydone`, and `21st.dev MCP`). `AGENTS.md` requires saving a complete Art Direction Record before site-specific visual implementation, then verifying it with `npm run check:art-direction -- --require-record`.

---

## 1. Choosing a Design Surface (Stage 4)

Reference research is shared across all surfaces through [reference research](../.agents/skills/site-art-direction/references/reference-research.md). The agent starts from the brief and supplied references, offers inspiration once when needed, and presents a relevant shortlist from websites, prompt libraries, community systems and OpenDesign's public/local system/template files. HTML/browser and Brilliant have the same source access; OpenDesign's app, MCP and surface skill are unnecessary for reading those references. The existing [adaptation pass](../.agents/skills/site-art-direction/references/external-prompt-adaptation.md) covers selected prompts, systems and templates before concept comparison. The owner chooses useful visual directions, without a mandatory provider or template-selection step.

When entering **Stage 4 (Art Direction)** for a new site or major redesign, recommend Brilliant when an editable prototyping canvas is requested and no tool is settled; default to HTML/browser concepts when no canvas is requested. Explicitly present Brilliant, OpenPencil and Penpot as choices. Reuse an established preference and working connection; name the alternatives once when unresolved without imposing a new setup checkpoint. [The shared iteration loop](../.agents/skills/site-art-direction/references/design-iteration.md) owns the choice and review recipe. Every surface retains two or three structurally distinct concepts, side-by-side desktop/mobile comparison, direction selection and a representative Astro proof.

- **HTML/browser (Default without a canvas request):** Agent-authored concept files under `audit/visual-concepts/<round>/`, with one `index.html` comparing A/B/C directions and full-size links. Render each at 390/768/1440; thumbnails do not replace mobile reflow or full-page inspection. `design:watch -- --dir <round>` opens changed HTML files; it is not live reload.
- **Brilliant (Recommended editable prototyping canvas):** Uses [brilliant-site-design](../.agents/skills/brilliant-site-design/SKILL.md) and [Brilliant onboarding](brilliant-onboarding.md). Native trials exercised shared components, variants, slots, composite styles, modes and longer-copy edits; use those native relationships for concept work in one named project. Check overrides, cross-canvas persistence and post-undo state. Fixed-width/semantic export limits require translation and native Astro acceptance; no comparative token/speed advantage is established.
- **OpenDesign (Optional HTML/CSS canvas):** Use `opendesign-site-design` and [OpenDesign onboarding](opendesign-onboarding.md) for an explicitly selected canvas/export workflow or an existing project. Its reference material remains available through shared research on every surface.
- **OpenPencil (Local desktop canvas):** Uses the `openpencil-site-design` skill and [OpenPencil onboarding](openpencil-onboarding.md). Iterates vector shapes, component nodes, and variable bindings in local `.fig` files.
- **Penpot (Shared cloud canvas):** Uses the `penpot-site-design` skill and [Penpot onboarding](penpot-onboarding.md). Provides a collaborative web workspace ideal for client reviews.
- **Direct Astro (Browser-native proof):** Use an early bounded route spike when browser behavior could invalidate a concept. After saving and checking the Art Direction Record, translate the selected concept into `src/styles/global.css`, `/_styleguide` and production routes. Requires no external tools or accounts.

For motion, illustration, charts, editable vectors, 3D, video or another requested capability, use the shared [capability routing](../.agents/skills/site-art-direction/references/capability-routing.md). It keeps the chosen surface, combines installed craft guidance with the correct runtime adapter, inspects targeted catalogue skills only when needed, and requires an actual representative test. Motion can use Impeccable guidance on every surface; native film export and interactive browser behavior have separate acceptance checks.

Baseline supports two execution models across all surfaces:
- **Single-Agent Model:** The same agent iterates concepts on the canvas and translates the approved direction into Astro.
- **Multi-Agent Model (Agent Switch):** A specialized design agent receives the [portable design brief](../.agents/skills/penpot-site-design/assets/design-brief.md), iterates on the canvas, and passes the [design handoff](../.agents/skills/penpot-site-design/assets/design-handoff.md) to an implementation agent that translates the design into Astro primitives and routes.

The core workflow proceeds through five focused steps:

1. **Iterate concepts on your chosen surface:** Explore visual directions for a representative page slice (hero, card, typography), get feedback, and select the final direction.
2. **Establish the native foundation:** Pick an Aesthetic Lane, write the Art Direction Record in `AGENTS.md`, set up tokens in `src/styles/global.css` via `npm run design:tokens`, and verify on `/_styleguide`.
3. **Inspect real-world UX patterns (optional):** Extract structural layout patterns (timestamps, status badges, filter bars, section pacing) using `Nicelydone MCP` or `Refero.design`.
4. **Explore design systems (optional):** Query OpenDesign's bundled offline systems (`od plugin search`) or community references via `designmd-mcp`, saving exploratory sandboxes to `audit/visual-concepts/`.
5. **Source reusable components (optional):** Find high-craft patterns via `21st.dev MCP` and transmute them into zero-JS Astro components on `/_styleguide`.

See [AI-Native Visual Design & DESIGN.md Interchange](design-interchange.md) and [AI Agent & Harness Configuration](agent-documentation.md) for tool configuration.

---

## 2. The Art Direction Record

Before writing site-specific CSS or template markup, save an `## Art Direction Record` in `AGENTS.md`.

The record must contain five specific elements:

```markdown
## Art Direction Record

- **Aesthetic Lane:** Editorial Paper — century-old sports club jubilee gazette meets modern athletic precision
- **Narrative Metaphor:** Archival bond paper, engraved match timetables, and crisp turf chalk lines.
- **Typography Pairing:** Display: Playfair Display, Body: Noto Sans (600/700 display contrast with 400/500 tabular-numeral body).
- **Token Physics:**
  - Canvas: Muted cream ground (`oklch(98% 0.01 80)`) with crisp white elevated surface tiles.
  - Action/Accent: Deep racing green (`oklch(38% 0.12 150)`) with antique gold interactive accents.
  - Borders: Hairline borders (`1px solid oklch(85% 0.02 80)`) on cards; no heavy drop shadows.
  - Spatial Density: Spacious editorial breathing room (`--space-section` fluidly scaling to `9rem` on desktop).
- **Site Anti-Patterns:** No floating SaaS card shadows; no neon or purple gradients; no consecutive 3-column icon card rows.
```

---

## 3. Aesthetic Lanes

Select an aesthetic lane that genuinely serves the client's brief and audience. Consult [`.agents/skills/site-art-direction/references/aesthetic-lanes.md`](../.agents/skills/site-art-direction/references/aesthetic-lanes.md) for full token physics and guidance:

| Aesthetic Lane | Characteristics | Suitable For |
| :--- | :--- | :--- |
| **Technical Systems** | Monospaced metadata, exposed `1px` structural hairlines, tabular numerals, high-density data indexes, utilitarian precision. | Engineering, developer tools, architecture, data platforms, athletic schedules |
| **Product-Led Minimalism** | Daylight-first neutral surfaces, tight display tracking, generous whitespace, high-clarity interactive states, restrained accents. | SaaS products, modern services, professional consultancies, design studios |
| **Editorial Paper** | High typographic contrast (serif display + humanist sans), warm archival paper grounds, hairline rules, `65ch` reading measures. | Publishing, cultural institutions, heritage clubs, law, long-form journalism |
| **Luminous Futurism** | Deep obsidian canvas, subtle border luminance, high-contrast display headlines, disciplined neon/cyan functional accents. | AI/ML platforms, creative technology, audio/video tools, nighttime events |
| **Custom / Existing Brand** | Grounded in an established client brand manual or verified source audit with an explicit written rationale. | Brand-mandated enterprise rebuilds and faithful WordPress migrations |

---

## 4. Token Physics & Section Pacing Variance

Translate the aesthetic lane into physical CSS parameters and compositional rhythm before touching templates:

1. **Canvas & Surfaces:**
   - What is the page ground? (Warm paper, crisp daylight, or deep obsidian?)
   - How do cards sit on the canvas? (Hairline border, subtle surface luminance shift, or pure negative space?)
2. **Action & Accent:**
   - What color draws the eye? Verify WCAG AA contrast (minimum `4.5:1` for normal text, `3:1` for large text) against both light and dark surfaces.
3. **Borders & Radii:**
   - Define `--radius-control` and `--radius-card`. Are corners architectural (`0px`), tailored (`0.375rem`), or soft (`0.75rem`)?
4. **Section Pacing & Compositional Variance:**
   - Never stack three identical centered sections or 3-column card grids in a row.
   - Alternate density and geometry down the page: e.g., **Asymmetric Split Hero** $\rightarrow$ **High-Density Hairline Index / Ticker** $\rightarrow$ **Editorial Feature Spotlight (`data-surface="dark"`)** $\rightarrow$ **Bento / Variable-Span Grid**.

---

## 5. Site Anti-Patterns

Explicitly defining what **not** to do is often more effective with AI assistants than describing what to do. Always list 2–3 concrete, semicolon-separated bans in the Art Direction Record:
- *"No floating rounded cards with fuzzy drop shadows; no decorative icon pills beside headings; no generic purple/blue gradients."*
- *"No centered body copy longer than two lines; no consecutive 3-column card grids; no uncaptioned stock photography."*

---

## 6. Automated Gate Validation

Baseline validates the required record and checks changed visual source against Git, subject to exact hash-bound infrastructure exceptions:

```sh
# Verify the art direction record:
npm run check:art-direction -- --require-record
```

- **In Local Development:** Run this command before implementing new templates or when onboarding a new AI assistant.
- **In CI Pipelines:** Automated CI runs `check:art-direction` against git commits. Commits that add visual CSS or templates under `src/` or `public/` without a valid Art Direction Record in `AGENTS.md` are automatically flagged.
- **Exceptions:** Pure infrastructure changes or starter maintenance can be registered as hash-bound exceptions in `audit/design-gate-exceptions.json`.

Saving the record to `AGENTS.md` satisfies the gate for local development; a git commit is not required.
