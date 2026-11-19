# Aesthetic Lanes Reference

When setting art direction for a site or landing page, choose a primary lane from the seven starting profiles below (four for software and product sites, three for organisations, places and makers), or **Custom / existing brand — rationale**. These profiles are hypotheses, not sector rules or universal coverage. Brief, real brand evidence, accessibility, language coverage, and user tasks override their sample fonts, palettes, radii, and anti-patterns.

---

## 1. Technical Systems

High-density instrument panels, telemetry readouts, terminal precision, and industrial laboratory clarity. Ideal for developer tools, real-time data feeds, fintech infrastructure, and engineering platforms.

- **Narrative Anchors:** Radar sweeps, space observatory telemetry, server racks, high-precision laboratory calipers, airfield instrument HUDs.
- **Typography:**
  - *Display / Metrics:* Strict monospace (`JetBrains Mono`, `Geist Mono`, `IBM Plex Mono`).
  - *UI Labels:* Crisp geometric or neutral sans (`Space Grotesk`, `Inter`).
  - *Details:* Uppercase tracking (`0.06em` to `0.12em`), small font steps (11px–13px) for data tags and metadata.
- **Color Physics:**
  - *Canvas:* Dark slate or charcoal foundations (`oklch(16% 0.01 260)` to `oklch(22% 0.015 260)`).
  - *Borders:* Hairline 1px zinc/slate rules (`oklch(32% 0.01 260)`).
  - *Accents / Status:* High-visibility functional colors — phosphor amber (`oklch(75% 0.18 65)`), telemetry green (`oklch(78% 0.20 145)`), or radar cyan (`oklch(80% 0.14 210)`).
- **Surfaces & Borders:** Sharp corners (`0px` or `2px` radius), micro-dot or hairline grid overlays, crosshair markers, corner bracket ticks, zero-blur drop shadows.
- **Density:** Compact / High (`--spacing-content: 0.875rem`, `--spacing-grid: 1.25rem`).
- **Anti-Patterns:** Pastel gradients, soft pill buttons with 9999px radius, playful bouncy motion, vague stock photos of people in glass offices.

---

## 2. Product-Led Minimalism

Quiet, confident clarity with high functional readability, purposeful negative space, and crisp micro-interactions. Ideal for modern SaaS, productivity apps, creator tools, and professional utilities (e.g. Linear, Stripe, Apple).

- **Narrative Anchors:** Architectural drafting tables, Swiss mechanical watch faces, precision optical lenses, uncluttered studios.
- **Typography:**
  - *Display & Body:* Modern grotesque sans (`Inter Display`, `Geist`, `Plus Jakarta Sans`, `SF Pro`).
  - *Details:* Subtle negative tracking on large display headings (`-0.02em` to `-0.03em`), neutral letter spacing on body copy.
- **Color Physics:**
  - *Canvas:* Clean optical white (`oklch(99% 0.002 240)`) or deep neutral dark (`oklch(14% 0.01 250)`).
  - *Surfaces:* Pure flat planes with crisp 1px borders (`rgba(0, 0, 0, 0.08)` on light, `rgba(255, 255, 255, 0.1)` on dark).
  - *Accents:* Purposeful, restrained single accent (e.g. cobalt blue, neutral graphite, or deep indigo).
- **Surfaces & Borders:** Balanced rounded corners (`6px` to `10px` radius), multi-layered soft drop shadows to create a lifted feel, zero gratuitous noise.
- **Density:** Standard (`--spacing-content: 1.25rem`, `--spacing-grid: 1.75rem`).
- **Anti-Patterns:** Cluttered tables without visual hierarchy, busy decorative badges, heavy neon glows, dither patterns.

---

## 3. Editorial Paper

Swiss editorial craftsmanship meets technical journalism. Rich typography, physical ink texture, and deep intellectual authority. Ideal for publications, research institutions, bookshops, longform content, law/consulting firms, and architecture studios.

- **Narrative Anchors:** Broadside newspapers, unbleached cotton bond paper, letterpress ink bleed, bookbinding, archival library indices.
- **Typography:**
  - *Display:* High-contrast transitional or modern serifs (`Newsreader`, `Instrument Serif`, `Fraunces`, `Playfair Display`).
  - *Body / UI:* Legible book serifs or clean contrasting grotesque/monospace (`DM Mono`, `Geist Mono`, `Inter`).
  - *Details:* Generous line-height (`1.2` for headings, `1.7` for body), italic accents for emphasis.
- **Color Physics:**
  - *Canvas:* Warm unbleached paper or warm bone (`#F9F6F0` / `oklch(97% 0.01 85)`).
  - *Ink:* Deep carbon black (`#141414` / `oklch(18% 0.01 260)`).
  - *Accents:* Archival spot colors — vermilion red (`oklch(58% 0.22 25)`), warm terracotta, or forest ink.
- **Surfaces & Borders:** Hairline solid ink divider rules, sharp square corners (`0px` radius), optional subtle paper grain texture.
- **Density:** Spacious / Reading-led (`--spacing-content: 1.5rem`, `--measure-reading: 65ch`).
- **Anti-Patterns:** Floating glassmorphism cards, bright neon buttons, rounded cartoon pills, dark mode with neon gradients.

---

## 4. Luminous Futurism

Deep cosmos, refractive glass, glowing edge highlights, dynamic gradients, and high dynamic range lighting. Ideal for next-generation AI platforms, gaming hardware, immersive entertainment, and spatial computing.

- **Narrative Anchors:** Deep space telescopes, fiber-optic conduits, laser optics, iridescent prism reflections, night sky horizons.
- **Typography:**
  - *Display:* Bold geometric or futuristic sans (`Syne`, `Space Grotesk`, `Uncut Sans`).
  - *Body:* Neutral clean sans (`Inter`, `Geist`).
  - *Details:* Monumental light headings paired with micro tracking labels.
- **Color Physics:**
  - *Canvas:* Pitch obsidian or deep cosmic violet (`oklch(8% 0.01 270)`).
  - *Gradients:* Controlled luminescent accents (electric violet, laser cyan, cyber magenta).
- **Surfaces & Borders:** Frosted glassmorphism (`backdrop-filter: blur(16px)`), luminous edge borders (`box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.2)`), ambient radial backdrops.
- **Density:** Varied / Cinematic (`--spacing-section: clamp(4rem, 12vi, 10rem)`).
- **Anti-Patterns:** Flat washed-out light mode, warm parchment paper, retro serif fonts, low-contrast muddy grays.

---

The three lanes below are for organisations, places and makers: the clubs, associations, schools, churches, workshops and local businesses most Baseline sites serve. The four above suit software, data and product sites. Do not pick a technical lane for an organisation because its palette looks modern; pick the lane whose physical world the visitor recognises, then take the governing idea from [distinctive direction](distinctive-direction.md). These three have no `design:tokens` preset yet: seed with the closest one named in each (`--lane editorial-paper` or `--lane neutral`), then set the values the lane describes.

## 5. Atelier & Craft

The maker's bench and the finished piece. For artists, sculptors, craftspeople, restorers, small producers and workshops whose work is physical and photographs well.

- **Narrative Anchors:** A catalogue of works with numbered plates, a workshop bench with tools laid out, material labels and offcuts, an exhibition wall with captions.
- **Typography:**
  - *Display:* A serif or a humanist sans with visible craft (`Fraunces`, `Newsreader`, `Cormorant`, `Instrument Serif`, or a grotesk with character such as `Bricolage Grotesque`).
  - *Body:* A calm reading face (`Source Serif 4`, `Inter`, `Atkinson Hyperlegible`).
  - *Details:* Captions in the body face at a small step, with the material, size and year as facts.
- **Color Physics:**
  - *Canvas:* The material's own ground: unbleached paper, plaster, linen (`oklch(96% 0.012 80)`), or a deep workshop shade for night views.
  - *Palette:* Four to six colours from the material and the maker's own things (oxidised copper, ochre, oak, clay, the ink of their stamp), each with a role; one of them for actions.
- **Surfaces & Borders:** Grounds from the workshop's materials (paper labels, end grain, linen, plaster) with edges from the craft (a cut line, a torn label, a stitched seam); photographs framed as the workshop frames things (mounts with numbers, labels, tags), with the shadow the object would cast; hairline rules for lists.
- **Composition:** Object-led. Each section is one of the workshop's objects (the order slip, the price label, the record of a piece, the plate in a catalogue of works); the work at full width (`MediaStage`) when the photograph is strong, otherwise framed; works as plates or an index with previews (`IndexList preview`); one working feature from the craft (a request composed the way the maker prices).
- **Density:** Spacious; few, large pictures.
- **Token preset to seed:** `editorial-paper`.
- **Anti-Patterns:** Tools in the hero instead of the finished work; thumbnail grids on the home page; stock photographs of hands; a page of headings, paragraphs and bare photographs with no object, surface or motion from the craft.

---

## 6. Civic & Community

The noticeboard, the newsletter and the programme. For associations, municipalities, schools, churches, parishes, cultural centres and charities whose visitors come for dates, people and how to take part.

- **Narrative Anchors:** A village noticeboard with dated notices, a parish newsletter in issues, a school's course catalogue, a building with its history, a programme of events.
- **Typography:**
  - *Display:* A face with civic warmth (`Bricolage Grotesque`, `Fraunces`, `Literata`, `Public Sans` heavy, or a titling serif for an old institution).
  - *Body:* Highly legible for every age (`Atkinson Hyperlegible`, `Source Sans 3`, `Public Sans`), at least 1.0625rem.
  - *Details:* Dates and times large and in tabular figures; names of people and places as plain text.
- **Color Physics:**
  - *Canvas:* Light and friendly; two to four colours from the organisation's logo or place, used as grounds for distinct kinds of content (agenda, appeals, news), never all on one screen.
  - *Accent:* The strongest logo colour for actions, checked at 4.5:1.
- **Surfaces & Borders:** Notices as the organisation's own objects (pinned notices, a programme sheet, a register, a reply card), a frame shape from the place (a window arch, a doorway, a leaf), grounds from its printed matter (paper, card), soft corners.
- **Composition:** The next date first. Programmes and registers as `IndexList` with dated leads; one photograph of the people or the place at full width; ways to take part as a short, specific list rather than three cards.
- **Density:** Standard; scannable lists, generous type.
- **Token preset to seed:** `neutral`.
- **Anti-Patterns:** A corporate hero with a slogan and two buttons; three equal "Our mission / Our values / Our team" cards; dates hidden inside cards.

---

## 7. Club & Fixture

The scoreboard, the team sheet and the season. For sports clubs, leagues, venues and event series whose visitors come for fixtures, results, teams and how to join.

- **Narrative Anchors:** A fixtures list on the clubhouse wall, a team sheet with numbers and positions, a scoreboard, a season table, kit colours.
- **Typography:**
  - *Display:* Condensed and loud (`Oswald`, `Big Shoulders Display`, `Barlow Condensed`, `Anton`), set large once per page.
  - *Body:* A sturdy sans (`Barlow`, `Inter`, `Nunito Sans`).
  - *Details:* Scores, dates and numbers in tabular figures, set larger than labels.
- **Color Physics:**
  - *Canvas:* The club colours: often a dark ground with one kit colour, or a light ground with two.
  - *Accent:* The kit's brightest colour for actions and live states, checked for contrast on both grounds.
- **Surfaces & Borders:** The club's objects (the fixture board, the team sheet, the ticket, the scoreboard) with the sport's marks (pitch lines, a court corner), sharp or slightly rounded, hairline rules for tables.
- **Composition:** The next fixture and the last result first; teams as line-ups or ruled lists; one team photograph at full width; sponsors as a register, not a logo wall of equal tiles.
- **Density:** Standard to compact for fixtures and results; spacious for the club's story.
- **Token preset to seed:** `neutral`.
- **Anti-Patterns:** Fixtures as cards with a date badge; a stock stadium photograph; numbered section indices that are not shirt numbers or ranks.

## Custom / existing brand

Use this lane when the profiles force the wrong identity: organic hospitality, playful illustration, photography-led fashion/travel/retail, or civic and multilingual services. Explain why the defaults do not fit and specify typography, palette roles, surfaces, density, and site-specific anti-patterns in the same record. A preserve/refine migration may use the existing brand as its visual anchor without inventing a new decorative motif.

## Composing Lanes with 4-Voice Typography & Surface Physics

1. **Pick a Primary Lane (70% weight)** for your canvas physics, border rules, and spatial density, and an optional **Secondary Inflection (30% weight)** for typography or structural tension (for example, *Editorial Paper* canvas paired with exposed `.grid-hairline` cell walls for an architecture practice).
2. **Orchestrate the 4-Voice Typographic Hierarchy** (display and body required; accent and mono only where the content earns them):
   - **Display (`--font-display`):** Primary structural headline voice (`-0.03em` to `-0.04em` tracking, `0.95–1.08` line-height).
   - **Inline Editorial Contrast Accent (`.font-accent` / `--font-accent`, optional):** Selective italic serif accent (`<em class="font-accent">...</em>`) on 1–2 focal words inside a display heading to introduce human warmth or editorial contrast against a geometric/grotesk display face.
   - **Body (`--font-body`):** High-legibility reading and UI copy (`1.6–1.68` line-height, `60ch–68ch` measure).
   - **Telemetry Monospace (`.eyebrow-telemetry` / `--font-mono` + `.tabular-nums`, optional):** Uppercase `0.75rem` labels (`0.12em` tracking) for real metadata: version pills (`.badge-pill`), dates, status and aligned numeric metrics. Not for kicker labels above headings or decorative section coordinates (`[01 // ARCHITECTURE]`).
3. **Choose the Hero Visual Specimen & Surface Architecture:**
   - Select a **Live-Coded UI Specimen** (`.ui-specimen` + `.ui-specimen__header` with real HTML/SVG telemetry and `.tabular-nums` for SaaS/developer/AI/B2B sites), an **Interactive Capability Stage** (for studios/agencies), or **Prepared Editorial Photography** (for craft/hospitality/architecture).
   - Combine 3 surface tiers (`--color-page`, `--color-surface`, `.surface-elevated`) with `1px` top specular highlights (`--surface-highlight`) or exposed hairline cell walls (`.grid-hairline`, `.frame-crosshair`, `.bg-grid-blueprint`).

Narrative anchors guide expressive imagery; functional icons and factual diagrams retain semantic accuracy. State where the metaphor changes visible design and where it stays absent. Never choose dark mode, tiny labels, or glass effects solely because a sector appears in a lane description. Verify font licenses, language coverage, available weights, contrast, and reduced-motion behavior in implementation.
