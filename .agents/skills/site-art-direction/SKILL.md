---
name: site-art-direction
description: Turn a site brief, content structure, brand assets, and visual evidence into a distinct art direction before Astro implementation. Use for new public sites, redesigns, migrations, and requested website logo/icon or illustration work; leave CMS architecture and frontend mechanics to their specialist skills.
---

# Site art direction

`DESIGN.md` is optional reference material; no particular schema, validator or exchange tool is required. `AGENTS.md` retains the direction decision and mandatory record; shipped CSS retains implementation authority and `npm run design:tokens` validates the native tokens. Keep fluid/contextual values and authored rationale explicit when a prototype tool cannot represent them. External `designmd-mcp` ([designmd.ai/explore](https://designmd.ai/explore)), Stitch/OpenDesign, `21st.dev`, and `Nicelydone` access and compatibility are optional accelerators; their reference material enters through the shared research step below, never as a required connection. `21st.dev` and other component blueprints additionally follow [component quarantine](../astro-site-design/references/component-quarantine.md) after direction selection. Never block when a source is absent. If available, `docs/design-interchange.md` expands the optional exchange guidance. On a site without these commands, check `package.json` `scripts` first and follow the command-availability rule in `new-site-workflow` (Start here): use the site's own equivalent or a reported manual check, and never install Baseline tooling just to match a command name. An incomplete token set reports a `Contract gap`; see `references/token-handoff.md`.

Define what the site should look and feel like, and why, before applying the direction across templates. Produce decisions that `astro-site-design` can implement and test.

This skill is influenced by the brief-first and variance/motion/density ideas in [Taste Skill](https://github.com/Leonxlnx/taste-skill) (MIT), adapted for evidence-led Astro and EmDash projects.

## Inputs

Read the available brief, audience and task information, content model, route inventory, real copy and imagery, brand assets, and visual references. For a redesign or migration, use the source audit produced by `astro-site-design`; do not infer the source identity from a logo or homepage screenshot alone.

Reuse the strategic synthesis and priority page briefs from `new-site-workflow` when present. Let visitor questions, actual copy length, available proof and its permitted use inform the composition. A missing testimonial or metric calls for an honest alternative or omitted section, not invented evidence. Reopen discovery only when an open question would change the lane, typography or hero strategy; do not repeat a settled interview.

When evidence is incomplete, make reversible working assumptions and label them. Ask only when plausible answers would lead to a different lane, typography pairing, hero strategy or page layout.

For a new site, a new direction or a substantial overhaul, [reference research](references/reference-research.md) is required before concepts, whether or not the owner supplies references: find at least eight candidates, capture them, score each on one card (by a fresh reviewer when a sub-agent exists), select at least three above the bar, and hold the chosen concept to their median. `npm run check:art-direction -- --require-record --require-references` checks `audit/references/references.md`. This shared step covers supplied sites, prompt libraries (`open-design.ai/prompts`, `superdesign.dev`, `designprompts.dev`), community `DESIGN.md` sources and OpenDesign systems/templates on every surface, including HTML/browser and Brilliant. Read local/public reference files without requiring the OpenDesign app or its surface skill. Use [external reference adaptation](references/external-prompt-adaptation.md) for selected prompts, systems and templates: preserve structural intent, map roles, retain approved typography and require real proof. Run `npm run design:prompt-check -- <file>` on textual instructions; findings require review, and a clean report does not establish approval or rendered acceptance.

Then read [distinctive direction](references/distinctive-direction.md) before choosing a lane: name the **governing idea** (what the site is as an object, deciding at least three structural choices), set each content type as the real object it is rather than as a card, take one shape, one accent and one or two typefaces from the subject, give each page archetype one **signature moment**, and plan each page's pacing by weight. Lanes, tokens and recipes give a site a consistent surface; this step gives it an idea. Without it, sites built from the same primitives come out alike however different their colours.

Then build the idea with [world building](references/world-building.md): inventory at least twelve things from the subject's material culture (inferred from the trade when the owner gives nothing), choose the source object the site is built like, and design the kit before any page: one object per section, two or three surfaces from the materials, three type voices with a display treatment, the objects' physics, frames that make the owner's photographs a set, generated artefacts where photographs are missing, three to five named motions and one working feature that does the site's job. Write the easy version and what this site does instead for the look, the feature and the content. An idea that is built only in type, photographs and rules is still the template.

## Ground UX anatomy before styling

When a site includes non-trivial interactive flows, directories, schedules, pricing structures, or multi-step forms, avoid inventing layouts from statistical LLM averages:

- **Conversion & Funnel Qualification:** When designing marketing, product, or landing pages, anchor intake in the four core vectors (purpose & single primary action, target ICP objections, verifiable proof inventory, and indexing intent) detailed in `astro-site-design/references/landing-page-archetypes.md`.
- **UX Flow Teardowns (Optional):** If `Nicelydone MCP`, `Refero.design`, or `Kombai Gallery` is available (or via targeted web reference lookup), inspect real production web screens for the target archetype through the shared [reference research](references/reference-research.md) step. Inspect actual responsive states and carry the structural lesson, not the brand styling, into the brief-led shortlist and concepts.
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

Choose a level for each dimension and explain it in site-specific terms:

- **Composition:** orderly to highly varied — symmetry, overlap, rhythm, section changes, and use of negative space.
- **Motion:** quiet to expressive — feedback, entrances, scroll behavior, and transitions justified by the content.
- **Density:** spacious to information-rich — how much content appears together and how quickly visitors can scan it.

Set each level from the strongest signal in the brief:

| Dimension | Toward the lower end when… | Toward the upper end when… | Why |
| --- | --- | --- | --- |
| Composition | Visitors complete tasks or compare items (booking, pricing, timetables, documentation), or most pages are repeated records | The site sells a point of view or portfolio, has few routes, and its identity is distinctive | Variation costs scanning speed; spend it where the visitor came to be persuaded, not to find something |
| Motion | The audience is task-focused, includes many older or motion-sensitive visitors, or the performance budget is tight | Motion explains a product, process or sequence, the identity is kinetic, or the site's job is the impression (a portfolio, a place, food, an event): there the scroll itself can be smoothed to carry scroll-linked staging ([smooth scroll](../astro-site-design/references/smooth-scroll.md)) | Motion that neither explains nor gives feedback is load and distraction; reduced-motion behaviour is required at every level |
| Density | There are few high-value actions and the copy carries the brand | Visitors scan many comparable items (schedules, catalogues, data, listings) | Density should match the scanning task: spacious layouts slow comparison, dense ones bury a single message |

When a request needs motion or another specialist capability, follow [capability routing](references/capability-routing.md): keep the chosen surface, combine craft guidance with the correct runtime adapter, and demonstrate actual behavior. Installed Impeccable motion guidance applies across surfaces; Brilliant's timeline is one execution path. Discover external skills only when the installed guidance leaves a concrete gap.

For logo/icon variants or refinement, read [website brand assets](references/brand-assets.md). For a related illustration set or explanatory artwork, read [editorial illustration](references/editorial-illustration.md), which preserves the requested native/vector medium and resolves upstream picture-format defaults for that scope. These are conditional asset tasks, not a new identity workshop on every site.

Use qualitative levels or a small scale as a thinking aid, not as a formula. Accessibility, content volume, audience expectations, and the existing identity can override an aesthetic preference.

## Define the visual system

Read [`references/aesthetic-lanes.md`](references/aesthetic-lanes.md) before defining the visual direction. Select one primary **Aesthetic Lane** (for software and product sites *Technical Systems*, *Product-Led Minimalism*, *Editorial Paper* or *Luminous Futurism*; for organisations, places and makers *Atelier & Craft*, *Civic & Community* or *Club & Fixture*; or *Custom / existing brand* with a rationale) to anchor typography, surfaces, density, and contrast.

Create one coherent direction covering:

Use the concrete defaults and examples below for new or replacement visual work; they give an implementer observable decisions to make and verify. For refinement, preserve calibrated client choices. When the brief or accepted direction conflicts with a default, record the specific exception and rationale instead of silently weakening the recipe. Capability counts alone do not establish visual quality, and illustrative specimens must not invent factual claims.

- **Narrative Metaphor:** A concrete physical or environmental anchor (e.g., "Observatory telescope monitoring storm fronts", "Archival bond paper and letterpress ink"). Explain its concrete effect on composition, imagery, or material treatment and where it stays absent. Never use it to override functional semantics or faithful brand assets.
- **Aesthetic Lane:** Selected lane and specific site adaptations.
- **Typography roles and rationale:** Display and body pairing from fonts the project can legally and reliably serve.
- **Palette and physics:** Contrast hierarchy, 3-tier surfaces (`--color-page`, `--color-surface`, `--color-elevated` / `.surface-elevated`), 2-tier borders (`--color-border`, `--color-border-strong`), `1px` specular top inner highlight (`--surface-highlight`), shadows, and corner treatment.
- **4-Voice typography hierarchy:** four available voices. Display and body are required; accent and mono are earned by the content, and a two-voice system is a valid direction. Record which voices the site uses and why.
  1. *Monumental Display (`--font-display`)* — Tight tracking (`-0.03em` to `-0.04em`), compressed line-height (`0.95–1.08`), `text-wrap: balance`. Large type looks loosely spaced at default tracking and leading because both scale with font size; tighten less for a face that is already narrow or tightly fitted, and check that descenders and accents do not collide at the compressed line-height.
  2. *Inline Editorial Contrast Accent (`.font-accent` / `--font-accent`)* — Optional. Italic serif accent used selectively on 1–2 focal words inside a display `<h1>`/`<h2>` (`<em class="font-accent">...</em>`) to create editorial tension against a geometric/grotesk display face. Use it only when the brand has an editorial voice that the words themselves carry; an italic word in every headline is a generated-site fingerprint.
  3. *Reading & UI Body (`--font-body`)* — High-x-height neutral sans (`1.6–1.68` line-height, `60ch–68ch` measure).
  4. *Telemetry & Coordinate Monospace (`.eyebrow-telemetry` / `--font-mono` + `.tabular-nums`)* — Optional. `0.75rem` uppercase with `0.12em` tracking for real metadata: version badges (`.badge-pill`), dates/times, prices, counts, status and numeric metrics, and the field labels of the world's objects (a ticket's `START`, a catalogue's course code, a label's batch number). The same generic label above every section heading, and decorative section indices (`[01 // ARCHITECTURE]`, `§ 02 — TELEMETRY`), are template habits; a numbered index is acceptable when the sequence itself carries information, such as process steps. Monospace with no code, data, measurement or object field behind it is a costume.
- **Hero visual specimen strategy (mandatory choice before coding):** Explicitly select how the hero anchors visual authority instead of falling back to generic stock art. The hero is the visitor's first proof of the offer, so it must show the real thing. Take the first match: (a) the brief or accepted identity fixes a hero treatment → keep it and record why; (b) the offer is software, data or a developer tool → 1, live-coded specimen; (c) the offer is several services or capabilities from one studio or agency → 2, capability stage; (d) the offer is a place, physical product, person, team or craft and usable photography exists → 3, art-directed photography set in the site's world: the work inside one of the world's objects (a frame, a mount, a label, a sign) with the display line, or one photograph at full width with the words on it (`MediaStage`) when its file is at least as wide as the screen, never a stretched phone photograph and never a small photograph beside the text; (e) nothing fits, or the photography is unusable → record a Custom treatment built from real copy and supplied assets, never stock art. Use the examples below to make that choice; preserve a different established treatment when the brief fixes it and record why:
  1. *Live-Coded UI / Telemetry Specimen (`.ui-specimen`)* — For SaaS, developer tools, AI, fintech, and B2B platforms: build an HTML/CSS/SVG architectural console, telemetry ledger, CLI readout, or interactive state switcher using `.ui-specimen`, `.ui-specimen__header`, `.tabular-nums`, and `.status-dot`. Never use blurry raster screenshots or generic futuristic AI stock art.
  2. *Interactive Narrative / Capability Stage* — For agencies, studios, and multi-service brands: an asymmetric split stage pairing the value proposition with a capability matrix or interactive preview panel. Number the matrix (`01`–`04`) only when the capabilities are steps in an order the visitor follows; otherwise use plain labels, because a decorative index is one of the generated-site tells in the review below.
  3. *Art-Directed Photography / Editorial Frame* — For hospitality, architecture, physical goods, and craft brands: prepared photography (`npm run media:prepare`) framed with deliberate aspect ratios, hairline borders, and captions that say what the photograph shows. Add figure numbers (`FIG. 01`) only when the text refers to the figures.
- **Grid, density, and section pacing:** Container behavior, alignment, spacing rhythm, compositional variance across consecutive sections planned by weight (heavy, medium, light; see [distinctive direction](references/distinctive-direction.md)), and responsive composition. Do not stack consecutive identical card grids, and do not open every section with a kicker, a heading on one side and a lead on the other. For an organisation, a place or a maker, one workable sequence is a full-width photograph stage → a ruled index or dated programme → one story with its photograph → a fitted closing line; for a software product, split hero → `.grid-hairline` ledger → sticky narrative + bento matrix → `data-surface="dark"` spotlight → native `<Disclosure>` FAQ. Take the order from each page brief's section argument and vary it between page archetypes: this exact sequence on every page is itself a generated-site tell, and a section with no real content behind it (no metrics, no questions) is omitted, not filled. Record a specific exception for an accepted existing composition or a comparison task that genuinely requires uniform rows.
- **Signature header & navigation archetype:** Select an intentional masthead pattern matching the lane (*Floating Glass Capsule* via `.surface-glass`, *Exposed Brutalist Multi-Cell Bar* with `1px` cell dividers and a top telemetry strip when the site has real status or metadata to show there, or *Editorial Hairline Masthead*, with numbered nav indices only when the order carries information). An established masthead can be the recorded choice during refinement; preserve real navigation semantics. Default pairing, because each archetype reuses its lane's surface and border physics: *Technical Systems* → Exposed Brutalist Multi-Cell Bar (hairline cells, sharp corners); *Editorial Paper* → Editorial Hairline Masthead (ink rules; glass is one of that lane's anti-patterns); *Luminous Futurism* → Floating Glass Capsule (the lane's surfaces are already frosted); *Product-Led Minimalism* → the same floating capsule geometry on a solid lifted surface (`.surface-elevated` with a `1px` border, no backdrop blur), because that lane's surfaces are flat planes and a glass bar chosen by default is a generated-site tell; *Custom / existing brand* → whichever archetype matches its recorded borders and surfaces. Choose against the default only for a recorded navigation need, such as many top-level items that will not fit a capsule.
- **Asset generation pre-flight rule:** Generated expressive imagery must embed the Narrative Metaphor and describe its visible application. Functional icons, factual diagrams, and faithful brand assets are exempt: preserve their meaning. Merely appending the metaphor to a generic prompt is not compliance. Avoid unsupported generic requests such as "modern clean tech", "AI network", or "glowing futuristic background".
- **Interaction and motion character:** Feedback, transitions, and reduced-motion behavior.
- **Navigation, hero, editorial flow, and calls to action:** Core page family layouts.
- **Site-specific anti-patterns:** 2-3 visual cliches to avoid for this specific site.

Do not impose a universal anti-pattern list. A centered hero, card grid, serif, subdued neutral palette, asymmetry, or animation can all be correct when the content and identity justify them. Require a reason for repeated motifs and decorative elements.

Do not invent facts, testimonials, clients, metrics, team members, or pseudo-real stock content to make a composition feel complete. Use real material, honest editorial drafts, or clearly marked placeholders whose shape matches expected content.

## Explore enough to make a choice

When the brief supports substantially different directions, develop two or three compact concepts and compare them against audience fit, brand continuity, content fit, accessibility, maintainability, and distinctiveness. Select one direction, or present the choice to the user when the directions differ in lane, hero strategy or density. When you select, choose for distinctiveness and fix the bolder concept's gaps rather than falling back on the safest one; see the selection step in [design iteration](references/design-iteration.md).

For a new site, significant overhaul or replacement visual world, read [references/design-iteration.md](references/design-iteration.md) before offering a design surface. It holds the surface rule (HTML/browser concepts by default; Brilliant when an editable canvas is requested and no tool is settled; Brilliant, OpenPencil and Penpot named once; OpenDesign optional for an explicitly selected canvas/export workflow or an existing project), the skill and limits for each tool, the side-by-side comparison of two or three structurally distinct directions, and honest efficiency measurement. Reuse a settled surface and working connection rather than repeating the offer; resolve an unavailable chosen surface with the user. Same-agent work is complete; another agent/handoff is optional.

Use mood boards, community `DESIGN.md` references (`designmd-mcp` / [designmd.ai/explore](https://designmd.ai/explore)), prototyping tools (**Brilliant**, **Penpot**, **OpenPencil**, **Pencil**, **Google Stitch**, **OpenDesign**, **Claude Design**), or generated visual studies to execute the selected concept approach. Reference sources are shared across surfaces through [reference research](references/reference-research.md); reading a public/local prompt, system, template or website requires neither its app nor an MCP connection, and a connector is only transport. Component blueprints from `21st.dev` or another registry are Stage 4.5 inputs after direction selection and follow [component quarantine](../astro-site-design/references/component-quarantine.md). When a tool emits a `DESIGN.md` file, store it under `audit/visual-concepts/<concept-name>/DESIGN.md`, review its provenance and intent, and translate the selected decisions into native CSS tokens. Run `npm run design:tokens` and inspect the rendered result on `/_styleguide`. Only select and separately install an external validator when a specific exchange requires it; ordinary site work needs no design-package dependency. Treat generated images as design references until the user intends them as production assets. Record provenance and usage constraints for third-party assets.

### Visual overhaul for existing sites

For an existing Baseline site, a builder migration or another redesign, distinguish refinement, significant overhaul within the brand, and replacement of the visual world. Reuse an explicit choice; resolve only consequential ambiguity. Separate fixed logo, palette, type, content and functionality commitments from permission to change composition or the visual system. An accepted preserve-composition direction stays authoritative until the user supersedes it. Weak hierarchy, generic sections, inconsistent spacing or poor reflow are problems to solve, not a license to discard brand commitments.

For an authorized significant overhaul or a different visual premise (new lane, metaphor or hero strategy), make a visual concept pass before broad Astro implementation:

1. Choose one representative page archetype and gather its real copy, source imagery, content shapes, and important states.
2. Create two or three compact visual concepts that show composition, hierarchy, typography character, imagery treatment, density, and responsive intent. Use the selected concept-stage surface, references from [reference research](references/reference-research.md), generated visual studies or a direct Astro/browser prototype. Preserve the user's selected approach; use the agreed fallback if an external tool is unavailable. Keep concept artifacts under `audit/visual-concepts/`.
3. Compare the concepts against the brief, source identity worth preserving, realistic content, accessibility, maintainability, and distinctiveness. Do not choose a concept solely because its generated copy or decorative details look impressive.
4. Resolve the direction decision, then translate it into implementation rules in the art-direction record before building the rest of the route inventory. Record which previous visual decisions are superseded; selecting an overhaul does not authorize new copy, CMS writes, deployment or DNS changes beyond the existing scope.

Generated concepts are references for composition and visual character, not exact CSS or content specifications. Verify typography, text, responsive behavior, interactions, and CMS states in the real Astro implementation. Store substantial concept work under `audit/visual-concepts/` and link it from `AGENTS.md`.

### Build a chosen direction as a layer, and keep every concept

Implement a selected overhaul so it can be replaced. On a real site the owner changed direction after release, when a second stakeholder preferred another concept mixed with parts of the earlier site, and the switch took hours rather than days because of three habits:

- **Keep the sources and renders of every concept**, not only the chosen one, under `audit/visual-concepts/<concept>/`. A rejected concept is the most likely next direction, and rebuilding it from a screenshot loses its decisions.
- **Put each direction in its own stylesheet, loaded after the historical one.** Write it in `@layer components` in a separate file (for example `src/styles/direction-<name>.css`) imported by the site's `Base.astro` after `SiteShell`, so it wins over the earlier rules of equal specificity by order. First check that the site's existing stylesheets are layered: on an older site whose `global.css` or direction stylesheet is unlayered, every layered rule loses to them, so write the new direction unlayered too, scoped under a class on the pages it raises (`.direction-<name>`). Do not use a nested layer such as `@layer components.direction`: rules written directly in `@layer components` beat its nested layers, so the direction would lose to the stylesheet it should override, and the CSS contract allows only `base` and `components` as outer layers. Check the order in the built CSS. Rewrite only the page templates that need a new composition; the rest keep their markup and change through the stylesheet.
- **List the safeguards that do not depend on the direction** in the art-direction record or the tracker, so they carry over when a direction is replaced: the enlarged-text behaviour, the one-row phone header, focus rings, rendered contrast, framed-photo shapes, Dark Reader opt-out on dark sites, and any `audit:ui` exceptions with their reasons. Rerun `audit:ui` (with `--widths auto`) after the switch.

When a direction is replaced, update the Art Direction Record, record which decisions are superseded, and keep the previous direction's stylesheet in history (or under `audit/visual-concepts/`) rather than mixing its rules into the new one. Keep the previous record in `AGENTS.md` under a `## Superseded Art Direction Record (<date>)` heading: `check:art-direction` reads it as history, not as a second decision.

### Redesigning an existing site: what the site has already decided

An existing site carries decisions a new one does not, and a redesign starts from them:

- **Read its record first:** the brief's brand commitments, the Art Direction Record's `Site Anti-Patterns`, and the owner's recorded rules (`PRODUCT.md`, `DESIGN.md`, `audit/art-direction.md`). A world-building recipe the owner banned (labels over headings, tilted plates, a ticker) is out however well it fits the world; give the bans to every concept and Stage 5 reviewer with the brief, or they will ask for them back.
- **A recorded owner rule outranks an advisory and a reviewer's suggestion.** When a rule ("team photographs are always shown whole") keeps an `audit:composition` advisory such as `split-hero`, or holds a reviewer's score down, keep the rule, say so in the reviewer's prompt, and name it in the `### Gap to the bar` section; ask the owner whether to revisit it rather than breaking it.
- **Raise a direction inside the one in place.** When the redesign keeps the current direction's world and adds to it, rewrite the page templates it raises, scope the new rules to those pages (`.direction-<name>` on their root), and list the shared parts (header, footer, heading marks, the image component) that serve both directions, deciding each one explicitly.
- **Inherited components meet the new floor checks.** An older site's shared components (an image component that caps its candidates, a list rule that caps width) can trip `soft-photo` or squeeze objects on the pages being raised; fix them in the shared component and say so, since other pages change with them.
- **Capture the current pages before changing anything** (`before-*.png` at 1440 and 390), so the owner can compare.
- **A redesign rehearsed on a copy is taken into the site, not copied over it.** Confirm the copy started from the site's current code; leave out what the copy generated from its own data (`emdash-env.d.ts`, built output) and its captures; correct the record to what the owner chose after the review; and check every touched page in every locale against production data, since the copy's database can be older. The recipe is "Rehearse the redesign on a copy, then take it live" in Baseline's prompt library.

## Produce the handoff

> [!CAUTION]
> **ART DIRECTION GATE:**
> Follow the canonical visual implementation gate in `AGENTS.md` (*Before client-specific visual implementation* on the EmDash foundation, *Shared design authority* on generated static sites). Save the complete record before site-specific visual implementation and run `npm run check:art-direction -- --require-record`. The gate covers all visual implementation, not only templates and components. Its documented scoped exceptions permit infrastructure fixes and isolated concept studies. The CLI/CI validate structure and changed-file exceptions; they do not block writes or prove decision quality.

Use an adopted `PRODUCT.md` as brief evidence when present, and identify the selected `DESIGN.md` or concept reference when used. Keep the brief, larger visual reference and implemented CSS distinct; do not copy the gate record into competing documents. Write the Art Direction Record directly in `AGENTS.md` using this exact markdown schema:

```markdown
## Art Direction Record
- **Aesthetic Lane:** [Technical Systems | Product-Led Minimalism | Editorial Paper | Luminous Futurism | Custom / existing brand — rationale]
- **Narrative Metaphor:** [Physical/environmental anchor; concrete application and boundaries]
- **Typography Pairing:** Display: [Font family], Body: [Font family], Utility: [Font family] (the World's third voice for labels and fields; rationale and reliably served weights)
- **Token Physics:**
  - Canvas: [Color / texture]
  - Action/Accent: [Color role]
  - Borders: [Hairline 1px / 8px radius / pill / sharp]
  - Spatial Density: [Compact / Standard / Spacious]
- **Site Anti-Patterns:** [First concrete ban; second concrete ban; optional third ban]
- **Governing Idea:** [Optional for the gate, expected for a new direction: what the site is as an object, and the structural choices it decides]
- **Signature Moments:** [Optional for the gate, expected for a new direction: per page archetype, the one moment and the capability that delivers it]
- **References:** audit/references/references.md [Required for a new direction; once named, every check:art-direction run validates the file]
- **World:** [Required with the references: the source object, inventory, objects, surfaces, type, motion, photographs and feature, as nested items; see references/world-building.md]
- **Decisions:** [Required with the references: at least three nested "Easy: … Ours: …" entries for the look, the feature and the content]
```

### Agent-First Token Calibration Protocol (`npm run design:tokens` & `/_styleguide`)

When translating the Art Direction Record into `src/styles/global.css`:
1. Seed the closest canonical Aesthetic Lane preset with `npm run design:tokens -- --lane <lane-id> --write` (or inspect available lanes via `npm run design:tokens -- --list-lanes`), then customize brand hues, typography stacks, and spatial density directly in `src/styles/global.css`.
2. Run `npm run design:tokens` (and `npm run test:design`) to verify that all required `@theme`, `:root`, and `[data-surface="dark"]` tokens are present, fluid `clamp()` scales have valid min/max bounds, and all 10 WCAG AA perceptual contrast pairs pass across light and dark surfaces.
3. Open `/_styleguide` in development (`npm run dev`) to inspect typography, semantic color swatches, native controls, `<Container breakout>`, `<Card>`, and galleries across mobile and wide viewports via Vite HMR.

The record should constrain implementation without prescribing every CSS value. `astro-site-design` turns it into tokens, components, responsive rules, and reviewed pages.

## Review the direction

Before handing off, test the proposal:

- Does the governing idea name something only this client has (not the stock idea for the sector), and change at least three structural choices? Does each page archetype have one signature moment that passes the four tests in [distinctive direction](references/distinctive-direction.md): only this subject, twice the scale or a different kind, still recognisable as a thumbnail? A split hero, a step row, an equal grid or a closing call to action never counts. Run `npm run audit:composition` on the rendered home page and one page of each kind; its advisory findings point at the template look, and its floor findings (`bare-page`, `soft-photo`, `world-motion`) mean the recorded world is not built yet.
- Could it plausibly belong to many unrelated organizations after replacing the logo and accent color? If so, strengthen the connection to the actual content or identity. Baseline's own recipes count here too: the same mono label above every heading, numbered section indices, an italic accent word in every headline, glass navigation and the bento → metric strip → dark band sequence read as generated when used by default (see the generic-fingerprint check in `astro-site-design`). The same devices are right when they are the world's own objects: a ticket's field labels, a race's real figures on its board, a painted plate's hard shadow.
- Is every section one of the world's objects, dressed in its surface, with the display treatment, the named motions and the working feature on the page ([world building](references/world-building.md))? A page of headings, paragraphs, photographs and rules is bare, however well spaced.
- Does the hierarchy support visitor tasks and realistic content lengths?
- Can the direction repeat across all page archetypes without every section using the same composition?
- Do typography, color, imagery, shape, and motion feel like one system?
- Can it remain legible, operable, responsive, and respectful of user preferences?
- For a redesign, is it clear what recognizable character is preserved and what is intentionally improved?

Resolve every check above that fails before broad implementation. Cosmetic variation alone does not make a direction distinctive.

## Engineering verification loop

Run the verification sequence in the site's `AGENTS.md` (*Verify and hand off* on the EmDash foundation, *Verification and release* on generated static sites) before handoff; `new-site-workflow` holds the full sequence and its reasons. Check each command against `package.json` first, and do not add CMS tooling to satisfy an unavailable command.
