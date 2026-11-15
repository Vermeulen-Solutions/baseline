## Answer

These are the art-direction decisions I would propose for the four-page English site of the solo brand designer (home, work, services, contact). Nothing is implemented. The decisions follow the site-art-direction skill, the aesthetic lanes, and the landing and calibration guidance in this repository's skills.

### Scope and track

- **Track: Express.** Four routes, one locale, and three services that can sit in one collection. This is inside the Express limits (at most six routes, one locale). Checkpoint B covers the art direction below.
- **Design surface: HTML/browser concepts by default.** No canvas was requested, so concepts are written as files under `audit/visual-concepts/<round>/`. At the concept checkpoint, name Brilliant, OpenPencil and Penpot once in a single offer, and keep the offer optional. Do not make the tool choice a stop.
- **Voice (assumption to confirm).** The site speaks for the studio name, with "I" allowed in contact copy. A solo practitioner must not imply a team that does not exist. Because she does not want her photo, no personal portrait appears anywhere, including an about block. This decision does not change the lane or the hero, so record it as a labelled assumption and proceed.
- **Evidence.** The six projects have good photographs and permission to show them. Each project must carry a verified caption (service, year, what the image shows). Client names appear only where the permission covers them. Prepare the photographs with the site's media preparation step before they are used.

### 1. Aesthetic lane

**Editorial Paper**, with an optional hairline inflection from the Technical Systems lane (exposed `1px` cell walls for the project index only).

Reason: a brand designer's site has to make her work the colour. Warm, unbleached paper with ink-black type lets packaging photographs and illustrations carry the palette, and it matches print-led identity and packaging work. Rejected lanes:

- **Technical Systems** would turn a portfolio into a costume (monospace telemetry on a site with no data or code).
- **Luminous Futurism** and glass surfaces would compete with the work.
- **Product-Led Minimalism** is clean but generic for a craft practice, and its cool neutrals would flatten the warm photographs.

### 2. Narrative metaphor

A **proof sheet pinned to a studio wall**: work shown at true size with generous margins, hairline trim marks as rules, and captions set in the margin.

Effect on composition: images sit on the paper with deliberate margins instead of filling cards; rules act as trim and crop marks between sections; captions run in the margin beside each image. Boundaries: the metaphor does not add literal registration marks, print textures or decorative grain on every page. It never edits a client's own artwork.

### 3. Typography pairing

- **Display:** a high-contrast serif for headlines (for example Newsreader or Instrument Serif). Tight tracking, `1.0 to 1.08` leading, balanced wrapping.
- **Body and UI:** a legible neutral sans or book serif at `1.6 to 1.68` line height and about `65ch` measure.
- **Voices:** two voices only. Skip the italic accent (a single italic word in every headline is a generated-site fingerprint), and skip monospace (there is no data or code to justify it).
- Confirm font licences and that the chosen weights are reliably served.

### 4. Token physics

- **Canvas:** warm bone, roughly `oklch(97% 0.01 85)`. Work images stay on it at their true colour.
- **Action and accent:** ink-black text and rules. One spot accent, such as a vermilion `oklch(58% 0.22 25)`, used only for the primary action and focus states. Every other colour comes from the work itself.
- **Borders:** `1px` ink hairlines, `0px` radius. No pills, no rounded cards, no drop shadows.
- **Spatial density:** spacious and reading-led. Photographs need room to read.
- **Dark surface:** at most one dark closing band, used once on the home page. It is not a dark mode for the whole site.

### 5. Hero visual strategy

**Capability stage (strategy c), using the real work as proof.** The offer is three services from one studio, and that choice comes before the photography option in the skill's decision order.

- The hero is an asymmetric split. One side holds the statement of what the studio does: identity, packaging and illustration. The other side shows one or two real project images at a large size.
- Services are listed as a matrix, not as numbered steps. Three services are not a sequence, so `01`, `02`, `03` would be decorative. Use plain labels.
- No stock art, no abstract gradient, no generated illustration as hero. The first proof the visitor sees must be her actual work.
- Preparation: check that each hero image's source is at least twice the rendered width before using it.

### 6. Header and navigation archetype

**Editorial Hairline Masthead.** The studio name sits as a wordmark on the left. Four links (Home, Work, Services, Contact) sit on the right above a crisp `1px` ink rule.

- Do not number the links. The lane's numbered index is for a sequence, and four destinations are not one.
- Reason for the lane default: Editorial Paper's canvas and rules come from the masthead itself. A floating glass capsule is an anti-pattern for this lane.
- The contact link is a plain text link, not a button, so the header does not compete with the hero.

### 7. Section sequence: home page

1. **Hero (capability stage).** The studio statement, the three services and one or two real project images. Primary action in the hero: a verb with an outcome, such as "Start a project brief". Avoid "Get Started" and "Learn More".
2. **Selected work (hairline ledger).** Three of the six projects at varied sizes: one large image, one medium, one small. Captions in the margin. This is a deliberately different geometry from the services list below it.
3. **Services (ledger rows, not cards).** Each service is a row with its name, one sentence on what is included, and one representative image. Three identical cards in a row would repeat the card grid the lane rules out.
4. **Practice note.** A short first-person or studio-voice paragraph on how the work is approached, with real facts only. Do not invent a process, a client count or testimonials. If there is no quote, leave the section out.
5. **Closing band (the one dark surface).** A single line and one primary action, for example "Send a brief for your next project". It repeats the hero action exactly.

Pacing: light, light, light, light, dark. Consecutive sections do not share the same skeleton (eyebrow, heading, side intro).

### 8. Section sequence: work page

1. **Intro.** One short paragraph and a single line on which services the work covers. No hero image, because the work list is the content.
2. **Service filter.** Three text toggles (Identity, Packaging, Illustration) plus "All", using the filter pattern from the archetype guidance. Use text buttons with `aria-pressed`, not pills. A project can carry more than one service tag.
3. **Project index (hairline ledger).** Six projects, each as a full-width editorial frame with its image at a deliberate aspect ratio and a margin caption. The image sizes vary across the list so the page does not become six identical tiles. Each caption names the project, the service and what the image shows.
4. **Closing band.** The same single action as the home page. Do not repeat a full section of services on this page.

Pacing: project frames alternate between a wide image and a split image with text, so the list does not repeat one composition six times.

### 9. How services and project images are labelled

**Services.** Use the service name as the heading (Identity design, Packaging, Illustration), followed by one plain sentence of what is included and one sentence on who it is for. Do not use generic labels such as "Creative solutions" or "Brand excellence", and do not add numbering.

**Project images.** Each image has:

- a visible caption in the margin: project name, service, year, and what the image shows (for example "Carton front, seed range, 2025");
- alt text that describes the item shown, not the layout;
- an optional "FIG." number only if the numbering orders a sequence, such as a multi-image project. Otherwise no number.

Projects that show a client name use it only where the permission covers it. A project without a permitted name is captioned by its service and year.

### 10. Site anti-patterns (with reasons)

1. **No glass, gradients, drop shadows or pill buttons.** They clash with the paper canvas and the hairline physics, and they compete with the photographs. Each one is a generated-site fingerprint in this lane.
2. **No identical three-column card grids** for services or work. They repeat one skeleton and flatten the difference between the work and the offer.
3. **No stock imagery, placeholder images or a portrait of the designer.** Stock contradicts the proof-first hero; a portrait conflicts with her explicit request. Any gap in the work is filled by a clearly labelled note, not a stand-in.
4. **No monospace kicker labels or decorative numbering** (`01 // SERVICES`). There is no data or code to justify them, and the numbers would imply a sequence that does not exist.
5. **No invented team, testimonials, metrics or process steps.** The site has to match the evidence the owner can actually publish.

The first three go into the record as the required two or three anti-patterns, with the fourth and fifth kept as backups.

### 11. Art Direction Record (proposed, to save in AGENTS.md before visual work)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper, with an exposed hairline cell inflection for the project index only. Makes the warm paper and ink type let the work carry the colour; rejects Technical Systems (costume without data) and Luminous Futurism (competes with the photographs).
- **Narrative Metaphor:** A proof sheet pinned to a studio wall. Shown at true size with margins, hairline trim marks as rules, captions in the margin. No registration marks or grain on every page.
- **Typography Pairing:** Display: a high-contrast serif (for example Newsreader or Instrument Serif), Body: a legible neutral sans or book serif. Two voices only; no italic accent, no monospace. Confirm licences and weights before use.
- **Token Physics:**
  - Canvas: warm bone, about oklch(97% 0.01 85); one dark closing band on the home page only.
  - Action/Accent: ink-black text and rules; one vermilion spot accent for the primary action and focus only.
  - Borders: 1px ink hairlines, 0px radius.
  - Spatial Density: Spacious, reading-led.
- **Site Anti-Patterns:** Glass, gradients, drop shadows and pill buttons; identical three-column card grids for services or work; stock imagery, placeholder images or any portrait of the designer.
```

### 12. Open points before implementation

- Confirm the voice (studio name with "I" in contact copy) and the lane. Both are working assumptions and do not block design setup.
- Confirm the permitted client names and captions for each of the six projects.
- Choose the design surface once at the concept checkpoint (HTML/browser unless she prefers a canvas).
- Run the art-direction gate (`check:art-direction -- --require-record`) after saving the record, and only then start visual implementation.
- Not verified: no concepts were rendered, no reference research was read for this answer, and no commands were run.

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/site-art-direction/references/brand-assets.md
- .agents/skills/site-art-direction/references/editorial-illustration.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/new-site-workflow/references/discovery-and-content.md
- Directory listing (Glob) of .agents/skills (file names only, no contents)
