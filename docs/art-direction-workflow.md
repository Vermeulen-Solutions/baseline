# Art Direction Workflow & The Design Gate

One of the most persistent frustrations when building websites with AI coding assistants is **"aesthetic drift"**—the tendency of models to default to a generic, corporate "AI slop" template:
- Purplish or indigo linear gradients
- Inter or system sans-serif for everything
- Floating rounded-xl cards with oversized drop shadows
- Meaningless decorative icon badges or feature pills
- Low-contrast light gray body text on white backgrounds
- Monotonous page pacing (repeating the same 3-column card grid four times down the page)

Baseline addresses this with an **Art Direction Gate** (`npm run check:art-direction`) and optional design tools ([designmd.ai](https://designmd.ai/explore), `Nicelydone`, `Google Stitch / OpenDesign`, and `21st.dev MCP`). `AGENTS.md` requires saving a complete Art Direction Record before site-specific visual implementation, then checking it with `--require-record`. The command validates the record and changed visual source; it does not enforce the timing of writes or certify design quality.

---

## 1. The Stage 4 Capability Prompt (Code-First or MCP-Assisted)

When transitioning from **Stage 3 (Content Architecture)** into **Stage 4 (Art Direction)** for a new site or significant overhaul, resolve the surface choice once: direct Astro/browser or Penpot, retaining a named alternative such as OpenPencil, Pencil, Google Stitch, OpenDesign or Claude Design when preferred. Reuse prior answers and the accepted world for small refinements. Continue independent preparation while a consequential choice is pending; do not silently substitute another tool. These are alternative surfaces, not a mandatory multi-tool pipeline. Same-agent design and implementation are complete; another agent/session is an optional handoff with a portable brief and saved design evidence.

**Penpot:** use the installed `penpot-site-design` skill and [hosted onboarding](penpot-onboarding.md). Confirm file/page identity, iterate bounded desktop/mobile concepts, inspect structure and exports, then translate the selected direction into real Astro components. **OpenPencil desktop:** use its official version-matched `open-pencil/open-pencil` skill/API and [MCP guidance](https://openpencil.dev/programmable/mcp-server), verify the document target, save a local artifact and inspect it again after reopening. Both retain Baseline's exact CSS recipes and source authority; canvas exports do not replace browser, content-binding or release acceptance.

The following research and implementation aids remain optional:

1. **Code-First & Aesthetic Lane Presets (Default — Zero Setup):** Pick an Aesthetic Lane below, record the Art Direction Record in `AGENTS.md`, apply and audit tokens in `src/styles/global.css` via `npm run design:tokens`, and inspect live on `/_styleguide`.
2. **UX Flow & Anatomy Teardowns (`Nicelydone MCP` / `Refero.design`):** Inspect real production web screens to extract authentic UX details (secondary metadata, filter bars, dense tables, and varied section pacing) before styling.
3. **Community `DESIGN.md` Systems & Visual Concepting (`designmd-mcp` + `Google Stitch` / `OpenDesign` / `Claude Design`):** Browse community design references, generate 2–3 visual screen concepts in `audit/visual-concepts/`, and translate the selected direction into native CSS. `DESIGN.md` is optional; validate implemented tokens with `npm run design:tokens` and inspect `/_styleguide`.
4. **Component Sourcing (`21st.dev MCP`):** Evaluate external Tailwind patterns on `/_styleguide` and adapt suitable ones to token-bound Astro components.

See [AI-Native Visual Design & DESIGN.md Interchange](design-interchange.md) and [AI Agent & Harness Configuration](agent-documentation.md) for 30-second MCP setup snippets.

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

The pre-implementation order is an agent/developer instruction in `AGENTS.md`. CLI and CI inspect outcomes; they cannot prove the record existed before an edit, prevent writes, or establish human approval or visual quality. Saving the record means writing it to disk and does not require a commit.
