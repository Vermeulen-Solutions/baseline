# Aesthetic Lanes Reference

When setting art direction for a site or landing page, choose a primary lane from the four starting profiles below, or **Custom / existing brand — rationale**. These profiles are hypotheses, not sector rules or universal coverage. Brief, real brand evidence, accessibility, language coverage, and user tasks override their sample fonts, palettes, radii, and anti-patterns.

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

## Custom / existing brand

Use this lane when the profiles force the wrong identity: organic hospitality, playful illustration, photography-led fashion/travel/retail, or civic and multilingual services. Explain why the defaults do not fit and specify typography, palette roles, surfaces, density, and site-specific anti-patterns in the same record. A preserve/refine migration may use the existing brand as its visual anchor without inventing a new decorative motif.

Narrative anchors guide expressive imagery; functional icons and factual diagrams retain semantic accuracy. State where the metaphor changes visible design and where it stays absent. Never choose dark mode, tiny labels, or glass effects solely because a sector appears in a lane description. Verify font licenses, language coverage, available weights, contrast, and reduced-motion behavior in implementation.
