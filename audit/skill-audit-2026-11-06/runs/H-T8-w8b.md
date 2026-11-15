## Answer

**Scope.** Four routes (home, work, services, contact) in one locale is the Express track. No canvas was requested, so the default surface is HTML/browser concepts. Nothing is implemented here. The record in section 10 is a proposal to save in `AGENTS.md` before any visual work.

**Working assumptions (labelled, revisable).**
- The studio name is the wordmark. No logo, palette or typefaces were supplied.
- She is a solo practitioner, so copy speaks in first person ("I") or uses the studio name. It never says "we" or "our team".
- Client names appear only where her permission covers them.
- English is the only locale.
- No photograph of her appears anywhere. The hero and the about text are built from work and text.

### 1. Aesthetic lane

**Editorial Paper**, with a hairline-grid inflection for the work index.

Reason: the site has to show other people's finished work (packaging, identity, illustration) at full strength. The chrome should be quiet, reading-led and flat, with ink rules and a warm neutral ground. Technical Systems and Luminous Futurism would compete with the colours of the work. Product-Led Minimalism reads as software marketing.

Adaptation: the canvas is warm off-white, kept neutral enough that project colour is not contested. Photographs and illustrations are never tinted, filtered or put on textured paper.

Switch to **Custom / existing brand** if her studio already has a palette or typefaces. Her identity would then decide, and the record would list the commitments to preserve.

### 2. Narrative metaphor

A printer's proof sheet: pages set out with trim and crop marks. The 1px ink rules divide sections and projects the way trim marks do, and the layout stays flat and sheet-like.

The metaphor stays absent from the imagery. Work is shown unfiltered and uncropped unless a crop is deliberate.

### 3. Typography

- **Display:** a transitional or modern serif (candidates: Newsreader, Instrument Serif). Verify the licence and the weights before self-hosting.
- **Body:** a neutral grotesque (Inter is a candidate) for service descriptions, captions and navigation.
- **Two voices only.** No italic accent word, because the work carries the expression and an italic word in every headline is a generated-site tell. No monospace voice, because there is no code or data on the site, and year and format metadata read better as tabular figures in the body face.

### 4. Header and navigation

**Editorial Hairline Masthead.** The studio wordmark sits at left and also links home. Three links follow: Work, Services, Contact. A 1px ink rule closes the bar.

- No numbers on the links, because the order does not carry information.
- Three items fit in one row at 390px, so no drawer or JavaScript is needed.
- Not a floating glass capsule. Glass is an Editorial Paper anti-pattern and reads as generated on this site.

### 5. Hero visual strategy

Decision path, first match: the brief does not fix a treatment; the offer is not software; the offer is several services from one studio, so the choice is **(c) capability stage**. Her photography then serves as the stage's real proof and is not replaced by stock art.

Proposal:
- An asymmetric split. Left: one-sentence value statement (what she designs and for whom), the h1, and one primary action, "See the work", pointing to `/work`.
- Under the statement, three service labels as a plain matrix: Identity design, Packaging design, Illustration. Each selects a real project image for the stage. Use buttons with `aria-pressed` and keyboard support. The strongest project is shown by default.
- Right: one project image in a frame whose aspect ratio follows the photograph.
- No autoplay and no timed rotation.
- If a service has no permitted project yet, show no stand-in. The stage then shows the services that have real work and says so in the copy.

### 6. Home section sequence

1. **Capability stage hero** (split, matrix, one real image). Opens with the offer.
2. **Selected work** (asymmetric 8/4: one large project, two smaller beside it, each with a hairline caption). Not a card grid.
3. **Services ledger** (three full-width rows with hairline dividers: name, one-sentence outcome, what is delivered). Text-led, so its geometry differs from the image block above.
4. **Studio note** (narrow reading column at about 62ch, first person, no photo). Included only if real text is supplied; otherwise omitted.
5. **Closing contact line** on a plain ground with a hairline top rule and the same primary action label used in the hero. No inverted dark band: that would recreate the generic bento-to-dark-spotlight sequence without a content reason.

No FAQ yet. Add a native `<details>` list only when real objections exist (timelines, fees, licensing of illustration).

Each block differs in geometry from the one before it. No two consecutive sections share a card row.

### 7. Work page section sequence

1. **Intro:** the h1 "Work" with one lead sentence.
2. **Filter by service:** All, Identity, Packaging, Illustration, as plain buttons with `aria-pressed`. Visitors compare by discipline, which is the decision they are making, so the filter earns its place even at six projects. With JavaScript off, all six remain visible.
3. **Six project entries,** in one vertical sequence. The lead project runs full width with its strongest image. Each following entry takes its width from the photograph's orientation: landscape runs wide, portrait sits in about five columns beside a seven-column text block. This variation follows real image shapes, not a default alternation. On mobile the entries stack with the image first.
4. **Each entry:** the image, a caption (client if permitted, service, year), a title, two sentences on what was asked and what was made, and a hairline rule.
5. **Closing:** a "Start a project" link to contact.

No pagination, no "load more", no slider.

### 8. Labelling

**Services.** Name each service by the discipline a buyer searches for: "Identity design", "Packaging design", "Illustration". Each gets one sentence on the outcome for the buyer, then a plain list of what she delivers. List only deliverables she actually provides. Mark the others as to be confirmed. No numbers, no marketing nouns such as "solutions" or "craft", and no "we".

**Project images.**
- The caption states what the photograph shows, for example "Folding carton, front and side panels", followed by service and year.
- Alt text describes the object and its role in the work, not its mood.
- Client names appear in labels only where permission covers them.
- No FIG numbers, because no text refers to figures.
- Captions sit beneath the image, not over it.

**Image sources.** Each image slot lists the field it reads and its source width. The source is at least twice the rendered width, and a full-bleed image needs a large original. Prepare images with `media:prepare` at implementation time.

### 9. Site anti-patterns

Record three in the Art Direction Record. Further site-specific bans apply in the review.

1. **No glass or blurred navigation and surfaces.** Reason: Editorial Paper's surfaces are flat planes, and glass reads as generated here and dims the work.
2. **No kicker labels, numbered section indices or monospace costume.** Reason: no section is a sequence the visitor needs, and there is no code or data to justify monospace.
3. **No identical card grids for work or services, no autoplaying hero or work sliders.** Reason: equal rows flatten six different projects, and autoplay hides proof while adding motion that explains nothing.

Further bans, without the record slot: no stock imagery or generated hero art (the hero must show the real work); no invented testimonials, logos, metrics or clients; no photograph of the designer; no "we" or team language.

### 10. Art Direction Record (proposed, not yet saved)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper, with a hairline-grid inflection for the work index. Chosen so that the chrome stays quiet and the photographed work carries the colour.
- **Narrative Metaphor:** A printer's proof sheet. 1px ink rules act as trim marks between sections and projects. Absent from imagery, which is never tinted or textured.
- **Typography Pairing:** Display: a transitional or modern serif (Newsreader or Instrument Serif, licence and weights to verify), Body: Inter or a comparable neutral grotesque. Two voices; no accent italic; no monospace.
- **Token Physics:**
  - Canvas: warm off-white paper, near-neutral, flat; no grain on images.
  - Action/Accent: near-black ink for actions and rules; project colour is the only accent.
  - Borders: 1px ink hairlines, sharp corners (0 radius).
  - Spatial Density: Spacious, because the work needs room and there are few items per page.
- **Site Anti-Patterns:** No glass or blurred navigation or surfaces; no kicker labels, numbered section indices or monospace costume; no identical card grids for work or services and no autoplaying sliders.
```

### 11. Surface and checkpoints

- **Surface:** HTML/browser concepts (the default without a canvas request). Offer the canvas options once and do not make the answer a stop. Brilliant is the recommendation if she wants an editable prototyping canvas. OpenPencil is a local alternative and Penpot suits shared review.
- **Compare before selecting.** Build three structurally distinct directions, not three colourways:
  - **A, Editorial proof sheet (recommended):** capability stage hero, the sequence above.
  - **B, Photo-led gallery:** the lead project is the home hero, with minimal chrome and a work index on the home page. Custom lane.
  - **C, Illustration-led field:** illustration sets the page ground and the services are drawn as a field of plates. Custom lane.
- **Express checkpoints:** A covers the brief, the static or CMS profile decision and the route list. B covers this direction, its tokens (`design:tokens --init-client --lane <Editorial Paper id from --list-lanes>`) and `/_styleguide` calibration. C covers route assembly and verification.
- **Spacing:** shared layout spacing with spacious density, explained to her briefly.

### 12. Questions that would change the lane, type, hero or layout

- Does a studio identity already exist (logo, palette, typefaces)? If yes, the lane moves to Custom / existing brand.
- Which projects does her permission cover for client names?
- Which project should lead the work page and the home hero?
- Which deliverables does each service actually include?

Everything else proceeds on the labelled assumptions above.

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/new-site-workflow/references/copywriting.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/astro-site-design/SKILL.md
