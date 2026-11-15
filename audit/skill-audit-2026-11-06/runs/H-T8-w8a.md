## Answer

Proposed art direction for a four-page English portfolio site (home, work, services, contact) for a solo brand designer trading under a studio name. These are proposals for the owner to confirm before any visual implementation. Assumptions are labelled. Nothing is implemented here.

### Platform and track (context for the decisions below)

- **Profile: `static`.** Four routes, one locale, no collections that need browser editing, and the owner has not asked to edit content herself. Recommend static (Typed Content Collections, native `src/assets`); ask about editing needs before choosing a CMS profile. Labelled assumption until she confirms.
- **Track: Express.** Four routes and one locale sit inside the Express limits (at most six routes, one locale, at most three collections). Checkpoint A covers brief and content, B covers art direction and calibration, C covers the full routes and verification.
- **Design surface: HTML/browser concepts.** No canvas was requested, so the default surface applies. Offer the design surface once (HTML/browser by default; Brilliant, OpenPencil or Penpot only if she asks for an editable canvas). Do not make the tool question a stop.
- **Shared layout spacing** (Express default), with density set by the brief (see Token Physics).
- **Concept comparison.** This is a new site, so compare two or three structurally distinct directions side by side before tokens are written. The recommended lane is Editorial Paper. The runner-up is Product-Led Minimalism on a flat near-white canvas, which is the main alternative to test. Do not write tokens until one direction is selected.

### 1. Aesthetic lane

**Editorial Paper**, with a hairline-grid secondary inflection for the work index.

Reason: the site sells judgement in identity, packaging and illustration. Editorial craft (type-led, ruled, reading-led) is the closest match to a studio whose product is visual decisions and typography. The lane's rules keep the site quiet so that the project photographs carry the colour and the detail.

Why not the others:
- Technical Systems and Luminous Futurism do not fit the offer or the audience and would make the work look like a product.
- Product-Led Minimalism is the honest runner-up. It would also work, but its generic sans-led neutral reads closer to any freelancer's site. It stays in the concept comparison.

The lane is a hypothesis. It is confirmed only after the side-by-side comparison and the owner's choice.

### 2. Narrative metaphor

Archival print studio: a proof sheet and a ruled index card. Concretely:
- Work is presented as a ruled index of proofs, with hairline rules between entries and captions set like a printer's proof sheet.
- The metaphor affects composition and captions only. It does not add paper textures, letterpress effects or grain over the photographs.
- It stays absent from the services and contact pages beyond the rules and the spacing.

Reason for the limit: photographs of packaging and identity work must keep their true colour and must not be filtered by a texture.

### 3. Typography pairing

- **Display: Newsreader** (serif, display sizes). Tight tracking (-0.02em to -0.03em) and line-height 1.0 to 1.08 for headings. Reason: a serif with clear contrast suits editorial craft and lets the studio sound authored without a decorative face.
- **Body and UI: Inter** (neutral grotesque). Line-height 1.6 to 1.68 and a 60 to 68ch measure. Reason: a plain, legible sans keeps captions, service descriptions and the contact form neutral against the display serif.
- **Accent (italic serif): not used.** Reason: the owner's voice is not a brand gimmick, and an italic word in every headline is a generated-site fingerprint.
- **Mono (telemetry): not used.** Reason: there is no code, data or measurement on the site. Monospace here would be a costume.

Licence and weights: both are open-licence families on Google Fonts. Confirm the served weights (for example Newsreader 400, 500 and 600; Inter 400, 500 and 600) and the licence during implementation. Font loading is not verified by this proposal.

### 4. Token physics

- **Canvas:** warm bone off-white, roughly `oklch(97% 0.01 85)`, with no tint stronger than that. Reason: a warm but near-neutral canvas lets the photographs keep their colour. A stronger tint would shift how packaging colours read.
- **Surfaces:** one page plane and one surface tone close to it. Three-tier depth is not needed because the lane's surfaces are flat planes.
- **Action and accent:** ink (near-black, roughly `oklch(18% 0.01 260)`) for text, links and primary actions. One accent (vermilion, roughly `oklch(58% 0.22 25)`) used only for focus rings and the active nav state. Reason: the accent must not compete with project colour; it appears only where the visitor needs a signal.
- **Borders:** 1px solid ink hairlines, 0px radius, no drop shadows. Photographs sit inside a hairline frame, not a card. Reason: the lane's borders are hairline and square, and cards would make the work look like product tiles.
- **Spatial density:** spacious and reading-led (generous section spacing, measure 60 to 68ch). Reason: image-led portfolio pages need room; a compact layout would crowd the photographs. Labelled assumption: the brief gives no density cue, so the Express default is balanced. Recommend spacious for image-led pages; confirm with the owner only if it changes the visual result.

### 5. Header and navigation archetype

**Editorial Hairline Masthead.** Studio name as a serif wordmark on the left. Four plain text links on the right: Home, Work, Services, Contact. A single 1px ink rule under the masthead.

Decisions:
- **No numbered nav indices** (for example `01 Work`). The four pages have no order the visitor follows, so numbers would be decoration. Reason: the lane allows numbers only when the order carries information.
- **No glass capsule.** The Floating Glass Capsule is the lane default for Luminous Futurism. It is a lane anti-pattern here, and glass is a generated-site tell in this lane.
- **No hamburger at phone width.** Four short labels fit inline at 375px with a 16px gutter. Reason: a menu button hides navigation that fits on screen. Check this in the rendered build.
- **Contact link** is a plain text link in the nav, not a button. Reason: there is one contact path, and a styled button in the masthead would compete with the project photographs.

Reason for the masthead choice: the masthead is the lane's signature. It reads as printed matter, which suits the studio and is distinct from a SaaS-style bar.

### 6. Hero visual strategy

**Interactive Narrative / Capability Stage**, with real project photography inside it. Not a stock hero, not a portrait, not a generated image.

Selection path (first match in the record rules): the offer is several services from one studio, so rule (c) applies before rule (d) (craft with usable photography). A capability stage is therefore the rule-based choice.

What the stage shows:
- Left column: the studio name as the H1 or a clear positioning line (one sentence: who the studio is for and what it makes). Then the three services as plain labels, each linking to the services page.
- Right column: one real photograph from the best project, framed on a hairline with a caption that names the project, the service and what the photograph shows. Example caption pattern: "Packaging for [product], [substrate and format]. Packaging." Use the caption pattern in section 9.
- Primary action: a verb with the deliverable, for example "See the identity work" or "View the work". Not "Get started" or "Learn more". The action goes to the work page.
- No counters, no testimonials, no logo strip unless the owner supplies real, permitted client names or quotes. Omit them rather than fill them.

No owner portrait. See section 10.

Zero JavaScript in the hero. A service switcher is optional; if used, it must remain usable without script and only switch between real photographs.

### 7. Section sequence: home page

Four sections, each with different geometry. Do not repeat the same card grid.

1. **Hero (capability stage).** Asymmetric split, one real photograph, three service labels, one action (see section 6).
2. **Selected work (index).** Three featured projects in an asymmetric arrangement: one large full-width photograph with title, service label, year and one scope line; then two smaller entries side by side. Hairline rules between entries. Not an equal three-card row.
3. **Services in brief.** A hairline ledger with the three services as rows: name, one sentence on what the client receives, link to the services page. Plain labels, no numbers. This is the one section that repeats services, so keep it to a sentence each and let the services page carry detail.
4. **Closing contact band.** Inverted ink surface (the lane's spotlight) with one sentence and one action, for example "Send a project brief" linking to the contact page. Reason: a single focal close that does not repeat the hero.

Omitted, and why:
- **Process or "how I work"**: omitted until the owner supplies a real process. Do not write a generic process to fill the page.
- **Testimonials, metrics, client logos**: omitted until she provides permitted, real material with the client's consent.
- **Blog or news**: not in scope.

### 8. Section sequence: work page

The work page is the proof page. It has one heading and a sequence of six project entries, each with a different geometry, then one closing action.

1. **Page intro.** One H1 ("Work") and one sentence describing what is shown, for example the three services and the period covered. No filter bar: six projects can be read as a single index, and a filter would add a control the page does not need. Revisit only if the owner adds more projects.
2. **Project entries (six).** Vary the geometry in sequence:
   - Project 1: full-width photograph, title, service, year, a two-line scope note.
   - Project 2: split 7/5, text on the right, photograph on the left (reverse of the next).
   - Project 3: two photographs side by side from one identity project (for example a mark on two grounds), with one shared text block.
   - Project 4: full-width packaging photograph with a short caption block below.
   - Project 5: illustration, shown as a strip or a 2-up with the illustration at its real size relative to the page.
   - Project 6: split 5/7, text left, photograph right.
   Each entry has: project title, service label, year, a one-to-two sentence scope line (what she did), and the photographs with captions. Anchor each entry so the services page can link to it.
3. **Closing action.** A single line linking to the contact page with a verb and deliverable, for example "Start a project brief". Reason: the work page should end on the next step, not on a footer of unrelated links.

Why no detail pages: the site has four pages by brief. Project detail lives in the entries, not in separate routes.

### 9. Labelling services and project images

**Services.** Use the owner's own plain service names: "Identity design", "Packaging", "Illustration". Each has one sentence describing what the client receives and, optionally, a link to the work entries that show it. No numbers, no telemetry labels, no icons used as decoration. Reason: the names are the offer, and decorative labels would add a generated-site tell without adding information.

**Project images.** Each photograph carries:
- **Alt text** that describes the visible content, not the project label. Example: "Folding carton for a tea brand, front panel in deep green with a hand-drawn leaf mark." It must be true to the photograph. Do not write "image of project".
- **Caption** with three parts, set in the body sans: project title, service, and what the photograph shows (format, substrate or view). Example: "Tea packaging, folding carton, front and back panels."
- **Figure numbers** (FIG. 01) only if the text refers to them. Default: no figure numbers.
- **Photographer credit** if the photographs are not hers. Ask the owner.
- **Client names** are shown only if she confirms she may name each client on the public site. She has permission to show the work; the naming question is separate. Default is descriptive project titles without client names.

Process rule for images: prepare every new image with `npm run media:prepare` and inspect the results before using them. Store prepared copies in `src/assets/`. Keep full-size source archives outside the library and out of Git.

### 10. No photograph of the owner

Decision: the site has no portrait or personal photograph of the owner, on any page.

Reason: she asked for it, and the work carries the site. Two practical consequences:
- The contact page gives the studio name, a contact address, the location as a town, and the contact form. No photograph.
- The home page does not gain a "meet the designer" block. If a short "about" paragraph is wanted later, it is text only.

### 11. Site anti-patterns (each with its reason)

Record line for AGENTS.md (three semicolon-separated bans, as the gate requires):

"No stock, generated or invented imagery, mockups or client claims presented as real work; no glass capsule navigation, neon or gradient accents, or drop-shadow product cards; no identical three-column card grids or numbered section kickers for services and projects."

Reasons:
1. **No stock, generated or invented imagery, mockups or claims.** The site must show the real work. Stock or generated images would fake the proof a portfolio exists to provide, and invented testimonials or metrics would be false claims. The hero and captions depend on real photographs.
2. **No glass capsule nav, neon or gradient accents, or drop-shadow cards.** These are the lane's anti-patterns and the generated-site fingerprints. Glass and shadows make the site look like a SaaS product and fight the photographs; neon and gradients compete with project colour.
3. **No identical three-column card grids, and no numbered `01 //` labels on services or projects.** Repeated card rows are the most common generated-site layout and would flatten six very different projects into one look. Numbers imply an order that the visitor does not follow here.

Additional bans to consider (optional, not in the record line):
- No personal portrait or "meet the designer" hero (section 10).
- No filter bar or sort control for six projects (section 8).
- No decorative icons on the services list.

### Open questions for the owner

Only the questions whose answers change the work:
1. Does she confirm the static profile and that she will not edit content in a browser?
2. May the site name clients on project entries, or should titles be descriptive only?
3. Who took each photograph, and does any credit line apply?
4. Which project is strongest for the hero, and which three are the featured projects on the home page?
5. Does she have any real, permitted testimonials or measurable outcomes? If not, they stay out.
6. Is the warm, paper-like lane acceptable, or does she want the concept comparison with the flat neutral alternative?

### Verification still required (not done here)

- Side-by-side concept comparison of two or three directions, with desktop and mobile views.
- Art Direction Record saved in AGENTS.md and `npm run check:art-direction -- --require-record` passing before any visual implementation.
- Rendered acceptance at phone, intermediate and wide widths, including the four-item masthead at 375px.
- Font licence and served weights confirmed.
- Alt text and captions checked against the actual photographs.

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/brand-assets.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
