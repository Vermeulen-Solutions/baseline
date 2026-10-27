# Art Direction Workflow & The Design Gate

One of the most persistent frustrations when building websites with AI coding assistants is **"aesthetic drift"**—the tendency of models to default to a generic, corporate "AI slop" template:
- Purplish or indigo linear gradients
- Inter or system sans-serif for everything
- Floating rounded-xl cards with oversized drop shadows
- Meaningless decorative icon badges or feature pills
- Low-contrast light gray body text on white backgrounds
- Monotonous page pacing (repeating the same 3-column card grid four times down the page)

Baseline addresses this with an **Art Direction Gate** (`npm run check:art-direction`) and optional design tools ([designmd.ai](https://designmd.ai/explore), `OpenDesign`, `OpenPencil`, `Penpot`, `Nicelydone`, and `21st.dev MCP`). `AGENTS.md` requires saving a complete Art Direction Record before site-specific visual implementation, then verifying it with `npm run check:art-direction -- --require-record`.

---

## 1. Choosing a Design Surface (Stage 4)

When entering **Stage 4 (Art Direction)** for a new site or major redesign, choose a design iteration surface that matches the project's workflow:

- **OpenDesign (Local HTML/CSS canvas):** Uses the `opendesign-site-design` skill and [OpenDesign onboarding](opendesign-onboarding.md). Bundles 154 offline `DESIGN.md` systems, 188 layout examples, `od lint` validation, and native export to Baseline Astro.
- **OpenPencil (Local desktop canvas):** Uses the `openpencil-site-design` skill and [OpenPencil onboarding](openpencil-onboarding.md). Iterates vector shapes, component nodes, and variable bindings in local `.fig` files.
- **Penpot (Shared cloud canvas):** Uses the `penpot-site-design` skill and [Penpot onboarding](penpot-onboarding.md). Provides a collaborative web workspace ideal for client reviews.
- **Direct Astro (Browser-native):** Work directly in `src/pages/`, `src/styles/global.css`, and `/_styleguide` using live browser reloading. Requires no external tools or accounts.

Baseline supports two execution models across all surfaces:
- **Single-Agent Model:** The same agent iterates concepts on the canvas and translates the approved direction into Astro.
- **Multi-Agent Model (Agent Switch):** A specialized design agent iterates on the canvas, produces a structured handoff packet (`handoff-packet-template.md`), and passes it to an implementation agent that translates the design into Astro primitives and routes.

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
