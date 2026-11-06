## Answer

**Scope and routing.** A four-route, one-locale greenfield site is Express (new-site-workflow, express-track.md). Art direction is Checkpoint B; no visual implementation starts until the Art Direction Record is saved in AGENTS.md and `npm run check:art-direction -- --require-record` passes. The repo has no existing site decisions to preserve: AGENTS.md has no Art Direction Record, and there is no PROJECT.md, DESIGN.md, audit/ folder, src/styles/global.css or baseline.config.json. Per AGENTS.md, a missing baseline.config.json means the EmDash foundation, but the platform is still a Stage 2 decision (see Open items). The brief has no canvas request, so the default surface is HTML/browser concepts.

**Design problem.** A family bakery with two shops. Visitors mainly need opening hours (per shop) and today's bakes. The owner supplied real bread, oven and staff photos, a hand-drawn logo and a real history. The site should feel warm and hand-made, and the hand-drawn logo is a fixed commitment. The main risk is a generic "artisan" template with stock bread imagery and hours buried below the fold.

**1. Aesthetic lane: Custom / existing brand.** Rationale: the brief is organic, photography-led hospitality, which the lane guide names as a case the four profiles fit poorly. Nearest profile is Editorial Paper. I would borrow its warm bone canvas, reading measure and hairline rules, but not its broadsheet or ink-texture metaphor, which would make a family bakery look like a publication. Lane ids should be checked with `npm run design:tokens -- --list-lanes` before seeding. Specify Custom explicitly in the record.

**2. Narrative metaphor: the bake counter.** A family counter with a daily board: the day's bakes are listed the way a handwritten bake board is, and the two shops sit side by side like two counters. Effect: the daily bakes block uses a ledger layout with hairline row rules and tabular times and prices. Boundary: no chalk, kraft or paper textures on backgrounds, and no treatment of the logo.

**3. Hero visual strategy: Art-directed photography / editorial frame.** Use the owner's photos, prepared with `npm run media:prepare` and framed at a deliberate ratio with hairline borders and real captions (for example, "FIG. 01 — le four, rue X" once the owner confirms the names and places). Reason: craft and physical goods, real material is the strongest proof, and stock or generated bread would be a fabrication. The hero must also carry the decision visitors came for: a compact hours block beside the photo, with the real hours for both shops, not a slogan alone. Do not use the live-coded UI specimen; it reads as software.

**4. Header archetype: Editorial Hairline Masthead.** The hand-drawn logo sits left, four plain text links (Accueil, Pains et viennoiseries, Boutiques et horaires, Histoire) sit right, separated by a 1px rule. No numbered nav indices and no floating glass capsule; both suit technical or product lanes. Mobile: logo plus a single "Horaires" link, with the other links in a native disclosure. Reason: four pages need little navigation, and the hours link is the most-used target.

**5. Levels.**
- Composition: moderately varied. Orderly base with two or three deliberate asymmetric moments: a split hero, the daily-bakes ledger, and a two-shop split. Avoid a run of identical 3-card rows.
- Motion: quiet. Hover and focus feedback only, no scroll-jacking, no entrance choreography. Reduced motion is the default-safe state. Reason: the visitor is in a hurry, and the bakes are the content.
- Density: spacious for home and story; information-rich only for hours and the daily bakes, where visitors scan. Shared responsive spacing with balanced density (no density cue was given; this is a labelled assumption).

**6. Display typography.**
- Display: a warm, slightly soft serif with optical sizing (Fraunces is a candidate, and the license and French coverage must be verified). Require œ, æ, and all French accents (é è ê à ç ù). Hero size fluid with `clamp()`, line-height 1.0–1.08, `text-wrap: balance`, two lines maximum on mobile.
- Tracking: about -0.01 to -0.02em, not the starter's -0.03 to -0.04em. Reason: a warm serif at the default tightness looks cramped; this is a recorded exception.
- Italic accent (`.font-accent`): one focal word in the hero or story heading only (for example, the family name in italic).
- Body: a humanist sans with high x-height and a 60–68ch measure (candidate: Source Sans 3 or Atkinson Hyperlegible Next, licence to verify). Use French typographic spacing (narrow no-break spaces before : ; ! ?) and `hyphens: manual`.
- Labels and numbers: small uppercase tracked labels and `font-variant-numeric: tabular-nums` in the body sans for times and prices. The telemetry monospace voice is dropped because it reads as technical; this is a recorded exception.

**7. Token physics (proposal).**
- Canvas: warm bone/flour, around `oklch(97% 0.012 85)`. One deeper crust-tone band (`data-surface="dark"`, dark brown, not black) for the hours section only, if contrast checks pass.
- Action/Accent: a single oven-crust accent (burnt ochre or brick, around `oklch(48% 0.12 45)`), checked for AA contrast on the canvas. Use it for primary buttons and the hours status. Status text must not rely on colour alone.
- Borders: 1px warm-grey hairlines; 6px radius on buttons and cards; photographs square or 2px at most. No pill-shaped buttons.
- Spatial density: balanced for the site, spacious on home and story, compact tabular on hours and bakes.

**8. Site anti-patterns (semicolon-separated in the record).**
- Stock or generated bread, hands-in-flour or "artisan" imagery, or any photo not supplied by the owner (reason: fabricated proof; real photos are the strongest asset);
- glassmorphism, blurred cards, gradient hero or neon/tech styling, and telemetry labels or monospace data tags (reason: they contradict the warm craft identity and the bakery's physical setting);
- hours or today's bakes hidden behind a carousel, accordion, PDF or image-only panel (reason: these are the two things visitors come for).

Also rule out invented testimonials, awards, prices, daily bakes or staff bios that the owner has not supplied.

**Concept checkpoint.** Offer the design surface once (AGENTS.md; design-iteration.md): HTML/browser concepts by default; Brilliant if the owner wants an editable canvas; OpenPencil for a local canvas; Penpot for shared cloud review; OpenDesign optional. Then compare two or three structurally distinct directions side by side, not three colour skins. Suggested set:
- A: photo-led split hero with an hours block, then the daily-bakes ledger;
- B: the daily bakes as the hero, with the photo as a supporting frame;
- C: a story-led, editorial home with the hours as a sticky band.

Show the reference shortlist (the owner's photos and logo, plus two or three real bakery or artisan sites checked for structure, not branding). Ask once whether the owner is short on references, and offer the prompt libraries only if the answer is yes. Select one direction before broad implementation.

**Open items the owner must answer (consequential, not blocking the record).**
- Which shops, hours and holiday closures apply, and whether the daily bakes list changes every day. This decides whether the daily bakes are a collection or a static block, and whether the platform needs an editor (Stage 2). Recommended static if the owner only edits a few times a week.
- Owner names and places for the photo captions, and photo rights and consent for staff pictures.
- Whether the owner has fonts or preferred colours already. None were supplied.
- Whether open/closed status should show live (needs a small script; without JavaScript, show the weekly hours).

**Draft record for AGENTS.md (proposal, not saved).**
```markdown
## Art Direction Record
- **Aesthetic Lane:** Custom / existing brand: warm, photography-led bakery craft; borrows Editorial Paper's canvas and reading measure, not its broadsheet metaphor.
- **Narrative Metaphor:** The family bake counter and its daily board; ledger rows for bakes, two shop counters side by side.
- **Typography Pairing:** Display: [candidate warm serif, licence and French glyphs to verify], Body: [candidate humanist sans, to verify] (tracking -0.01 to -0.02em; telemetry monospace replaced by tabular labels).
- **Token Physics:**
  - Canvas: warm bone (oklch 97% 0.012 85); crust-tone band for hours only.
  - Action/Accent: oven-crust ochre, AA-checked.
  - Borders: Hairline 1px, 6px radius on controls and cards, photos square.
  - Spatial Density: Balanced (spacious home and story, compact tabular hours and bakes).
- **Site Anti-Patterns:** Stock or generated bread imagery, or any photo not supplied by the owner; glass, neon or telemetry styling; hours or daily bakes hidden behind carousels, accordions or PDFs.
```

**Not done.** No files changed, no tokens seeded, no gate run, nothing implemented. The record is a proposal for the owner to review. The font candidates and colour values are unverified until licences, French glyph coverage and contrast are checked.

## Files read

1. AGENTS.md
2. README.md
3. baseline.config.json (attempted; does not exist, so the root is treated as the EmDash foundation)
4. .agents/skills/new-site-workflow/SKILL.md
5. .agents/skills/site-art-direction/SKILL.md
6. .agents/skills/site-art-direction/references/aesthetic-lanes.md
7. .agents/skills/new-site-workflow/references/express-track.md
8. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
9. .agents/skills/site-art-direction/references/design-iteration.md
10. .agents/skills/site-art-direction/references/capability-routing.md

Directory and pattern searches (Glob) were also run over .agents/, docs/ and the project root to find the skill files and check for PROJECT.md, DESIGN.md, audit/ and src/styles/global.css.
