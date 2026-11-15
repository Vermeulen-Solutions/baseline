## Answer

These are proposed art-direction decisions for a four-page English site for a solo brand designer trading under a studio name (identity design, packaging, illustration; six finished projects with permitted photography; no owner portrait). Nothing has been implemented or saved to `AGENTS.md`. Every decision below is a working assumption until the owner reviews it at the concept checkpoint.

### Track and assumptions

- **Track: Express.** Four routes, one locale, greenfield, so `new-site-workflow` selects Express. Express consolidates decisions into up to three checkpoints but keeps every CLI gate.
- **Platform: recommend `static`** if she or an agent will edit files. Ask about her editing needs before choosing a browser CMS. This is a platform decision and is outside this art-direction pass.
- **Design surface: HTML/browser concepts.** No canvas was requested, so the default is HTML/browser concepts. Name Brilliant, OpenPencil and Penpot once at the checkpoint, in case she wants an editable canvas.
- **Inspiration: offer once.** Ask: "Are you short on visual references or inspiration?" Do not repeat the offer if she has already answered.
- **Layout spacing: shared defaults, spacious density.** Explain that gaps adapt to screen size and stay locally adjustable. Do not present a CSS policy as a choice.
- **Studio name, logotype and owner's other sites are not supplied.** Use a placeholder studio name. Record the "distinct from the owner's other sites" row as "not checked: no list of the owner's other sites is recorded" until she answers.

### 1. Aesthetic lane: Editorial Paper (primary)

Reason: the work is print-rooted (identity, packaging, illustration). A warm paper canvas and ink rules let her photographs carry the colour, and the lane suits a studio that sells structure and typography. Lane anti-patterns (glass, neon, rounded pills) match what a craft portfolio should avoid.

Condition: if the studio name already has a logotype or a typeface, switch to **Custom / existing brand** with that identity as the anchor. This is the one owner question that would change the lane. Confirm the lane id with `npm run design:tokens -- --list-lanes` before seeding tokens.

### 2. Narrative metaphor: a printer's proof sheet

The site reads as proofs pulled from the press: ink rules, generous margins, each project laid out as a sheet with its trim and captions. Effect on the composition: hairline rules divide sections and project pages; project images keep margin around them.

Boundaries: no paper grain or texture laid over photographs, and no generated press artwork. The metaphor stays out of the illustration work itself, which must be shown as she made it.

### 3. Typography pairing

- **Display:** a high-contrast text serif (for example Newsreader, or another serif whose licence and weights can be served). Tracking -0.02em to -0.03em; line-height about 1.05 for headings.
- **Body:** a neutral grotesque (for example Inter or Hanken Grotesk), 1.6 line-height, 60–68ch measure.
- **Accent (italic serif):** off by default. Use it only on one or two focal words if her own voice carries that tone; an italic word in every headline is a generated-site fingerprint.
- **Mono:** not used as decoration. Allowed only for real metadata in the work index (year, dimensions, print run) if she supplies that data.

### 4. Token physics

- **Canvas:** warm bone off-white, about oklch(97% 0.01 85), with ink text about oklch(18% 0.01 260). Keep a single deeper tier for project backgrounds and the closing band. Check text contrast at every tier.
- **Action/Accent:** the primary action is ink (ink fill, paper text). No spot colour in UI chrome; the work supplies the colour. Use a restrained focus ring for keyboard focus.
- **Borders:** 1px ink hairlines, 0px radius, no shadows, no glass.
- **Spatial density:** spacious, reading-led. The photographs need space around them.

### 5. Header and navigation archetype: Editorial Hairline Masthead

- Studio name as a wordmark in the display serif at left (it links home).
- Three links in a row at right: Work, Services, Contact. Mark the current page with `aria-current`.
- A 1px ink rule under the masthead.
- No numbered indices. Four pages have no sequence the visitor needs, so numbers would be decoration. This departs from the lane's default numbered nav; record it as the exception.
- No hamburger. Three links fit at 375px.
- No floating glass capsule. It is an Editorial Paper anti-pattern.

### 6. Hero visual strategy: Capability stage (option c), using real work

The rule order matters here. The offer is several services from one studio, which matches option (c) before the photography option (d). So the hero is an asymmetric capability stage, not a photograph alone and not a live-coded console (this is not software, so a console would read as generated).

Proposed layout (7/5 split on wide screens, stacked on mobile):
- Left column: an outcome-led h1 that names the studio and the three services in plain words. Use placeholder copy until she supplies the real line. Do not invent claims. One supporting sentence about who the work is for. A single primary action, "See the work" or "Send a project brief".
- Right column: one real project photograph (her strongest packaging or identity image), framed at a deliberate aspect ratio, with a caption: client, project, discipline, year.
- Below the split: three service rows (Identity design, Packaging design, Illustration) separated by hairline rules. Each row has the service name, one line of scope, and a link to the services page.

Not her photograph. Static by default. A hover or focus swap of the stage image is optional; if she wants it, it must work by keyboard and under reduced motion. Defer it until the concept round.

### 7. Home page section sequence

1. **Capability stage hero** (7/5 split, real image, three service rows).
2. **Featured project** (one large uncropped photograph spanning most of the width, with caption and a text column beside it). This changes the geometry after the hero.
3. **Services ledger** (three hairline rows, same order as the hero; name, scope, link). Rows, not cards.
4. **Paired proof** (two projects side by side at 6/6, one offset vertically, one packaging and one illustration). Shows range without a card grid.
5. **Studio statement** (conditional). One short paragraph written from her facts, with no portrait. Omit if she has no statement she is willing to publish.
6. **Closing contact band** on an ink surface (the one rhythm breaker, justified because the page asks for one decision). One primary action, "Send a project brief", then the footer with the studio name, email and legal line.

Avoid the default fingerprint sequence (bento, metric strip, dark spotlight, FAQ on every page). There are no verified metrics, so no metric strip.

### 8. Work page section sequence

1. **Page intro:** h1 "Work" plus one sentence stating scope (six projects across identity, packaging and illustration). No photograph.
2. **Index ledger:** hairline rows with project title, client, discipline and year. Each row links to its project anchor. This is the only place the mono voice can appear, if the year data is real.
3. **Project features, one per project, varying geometry:**
   - Project 1: full-width image, caption beside.
   - Project 2: 7/5 split, image with text.
   - Project 3: two portrait images side by side.
   - Project 4: one wide image.
   - Project 5: a row of detail shots at different sizes (for example packaging panels).
   - Project 6: a two-up illustration series.
   Each project has an h2, client, discipline, year, a two-to-three sentence brief from real material, and a short list of what was delivered.
4. **Closing contact band:** the same band as the home page, shorter.

No filter toolbar. Six projects do not justify filtering, and a discipline filter would hide the mixed projects.

### 9. Labelling services and project images

**Services:**
- Name each service as a plain noun phrase: Identity design, Packaging design, Illustration. No numbers, no kicker labels.
- Under each name: what it covers (three to four real deliverables she offers) and one linked project image as proof, captioned with client and project.
- Do not state prices, timescales or process steps she has not supplied.
- Use an active CTA per service with the outcome, for example "Ask about an identity project". Not "Learn more".

**Project images:**
- Caption format: client, project, discipline, year. For detail shots, add what is shown, for example "Front and side panels, printed carton".
- Alt text describes the object and its role in the project, not "project image 1". All project images are meaningful, so none get empty alt.
- Keep the full frame where the work needs it. Do not crop an identity mark or a packaging front to fit a grid.
- Check photo credit and licence terms. If a photographer or client must be credited, the caption carries the credit.
- Use prepared copies (`npm run media:prepare`) and keep full-size originals out of Git.

**Contact page:** no photograph. Short intro, the studio email, and one form: name, email, project type (identity, packaging, illustration, not sure), optional budget range, message. Server-validated with status messages. Primary action "Send project brief". Form backend is a platform decision.

### 10. Site anti-patterns

- No portrait or headshot of the owner anywhere, including the statement, bylines and the footer; the studio name is the subject.
- No stock or generated imagery, mock-up devices, invented client logos, testimonials or metrics; the six projects are the only proof.
- No equal three-column card grid of thumbnails or services, and no default generated-site devices (glass nav, gradient text, mono kicker labels, numbered section indices, italic word in every headline).

Reasons: the owner asked for no personal photo, so the work and the studio carry the site. Invented proof breaks trust with clients who check. Repeated card grids and generated devices bury the photographs and read as a template.

### Art Direction Record (proposed, not saved)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper. Print-rooted craft portfolio; warm paper canvas lets the work carry colour. Switch to Custom / existing brand if the studio name has an existing logotype or typeface.
- **Narrative Metaphor:** A printer's proof sheet. Ink rules and margins frame each project; no paper texture on photographs and no generated press artwork.
- **Typography Pairing:** Display: a high-contrast text serif (for example Newsreader), Body: a neutral grotesque (for example Inter). Italic accent off by default; mono only for real project metadata.
- **Token Physics:**
  - Canvas: warm bone off-white with ink text; one deeper tier for project backgrounds and the closing band.
  - Action/Accent: ink primary action; no spot colour in UI chrome.
  - Borders: 1px ink hairlines, 0px radius, no shadows.
  - Spatial Density: Spacious.
- **Site Anti-Patterns:** No portrait or headshot of the owner anywhere; no stock, generated, invented-metric or invented-testimonial material; no equal three-column card grids or generated-site devices such as glass nav, gradient text, kicker labels and numbered indices.
```

### Open items before implementation

- Ask the inspiration offer once.
- Ask whether the studio name has a logotype or typeface (this changes the lane).
- Ask whether she has other sites to check for distinctness.
- Run the concept round as HTML/browser: two or three structurally distinct directions, not colour skins of one layout. Suggested set: A, the proposed proof-sheet ledger; B, work-first full-bleed gallery with sans-only type; C, service-led typographic statement with a small image set.
- Complete the concept quality gate for each direction, with two rows as a pre-flight: "Recorded invariants" and "Ground, depth and atmosphere".
- After the owner selects a direction: save the record in `AGENTS.md`, run `npm run check:art-direction -- --require-record`, seed tokens with `npm run design:tokens -- --lane <lane-id>`, and calibrate on `/_styleguide` before page assembly.

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/site-art-direction/references/reference-research.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/astro-site-design/SKILL.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills (directory listing only, via Glob)
