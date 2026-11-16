## Answer

### Route through the workflow (context for the decisions)

- Track: **Express** (new site, 5 routes, one locale, no migration or integrations; `new-site-workflow/SKILL.md`). Platform profile is not yet chosen. It is a Stage 2 question about who edits content, and nothing below depends on it.
- This is a new site, so the direction is chosen at the concept checkpoint. No canvas was requested, so the surface is **HTML/browser concepts** under `audit/visual-concepts/<round>/`. Brilliant, OpenPencil and Penpot are named once and not pushed (`design-iteration.md`). I would compare two or three structurally distinct directions side by side with a recommendation, not present one. The proposal below is the recommended direction, A.
  - Alternative B: a catalogue and ledger-led home, quieter and more index-like.
  - Alternative C: a single full-bleed photographic home.
  - They differ in structure, not in colour.
- Nothing visual is built until the Art Direction Record is saved in `AGENTS.md` and `npm run check:art-direction -- --require-record` passes (scaffold with `npm run design:tokens -- --init-client --lane editorial-paper`; check the exact lane id with `--list-lanes`). Real photographs go through `npm run media:prepare` first.
- Working assumptions to label as reversible: the owner works in English, so the site and the working language are both English. Density is "spacious", from the brief's literary tone (the Express default would otherwise be balanced). Shared layout spacing is used.
- Open questions that would change the work (to ask in chat, not assume):
  1. Are prints and stationery sold online (cart, payments), or by enquiry or in person only? This decides whether Prints is a catalogue or a showcase with an enquiry action.
  2. Which of the three offerings is the commercial priority? This decides the home's primary action.
  3. Are workshop dates fixed and bookable, or arranged by request? This changes the Workshops page shape.
  4. Who edits the content later (static vs CMS)?
  5. Are people shown in the photographs, and is that cleared? "Cleared for use" is taken as covering the images, but it should be confirmed for any identifiable person.

### 1. Aesthetic lane: Editorial Paper (primary), with no secondary inflection

- **Choice:** Editorial Paper. Warm unbleached paper canvas, deep carbon ink, hairline ink rules, sharp square corners, spacious reading-led density, one archival spot colour (vermilion or a forest ink; to be settled in the concept comparison).
- **Narrative metaphor:** "Impression on dampened cotton paper": the page is a sheet and the type is struck into it. Where it shows: the paper canvas, ink-black text, hairline rules in place of boxes, generous margins like a printed broadside, and photographs framed as printed plates. Where it stays absent: no fake bite, bleed or distress effects on live text, and no texture over reading areas. The metaphor must not override legibility or navigation semantics.
- **Typography:**
  - Display: a high-contrast or transitional serif (Newsreader, Fraunces or Instrument Serif are the lane's examples).
  - Body: a legible book serif or a restrained neutral sans for UI.
  - Two voices are enough. The mono voice is earned only for real metadata: opening hours, prices, workshop dates and durations. The italic accent is optional and used rarely, on one focal phrase on the home page at most, never in every headline.
  - Fonts must be licensed and reliably served, with the weights and italics actually loaded.
- **Why:**
  - The lane's anchors ("letterpress ink bleed", "unbleached cotton bond paper") are literally this business.
  - The tone is literary and print-led, and the lane is built for reading-led content.
  - Technical Systems, Luminous Futurism and Product-Led Minimalism would all read as generic here.
  - A Custom lane is not needed: the lane fits and its anti-patterns already exclude glass, neon and pills.
- **Expressive range:**
  - Composition: moderately varied. The site has few routes and a strong point of view, so variation is affordable on the home page and on the offering pages. Visit stays orderly because it is a task page.
  - Motion: quiet. There is a soft reveal at most, plus real reduced-motion behaviour. Motion explains nothing on this site, so it does not carry the identity.
  - Density: spacious on the home page and the offerings. Visit is compact and scannable for hours and address.

### 2. Header and navigation archetype: Editorial Hairline Masthead

- A serif wordmark or brand mark above or beside a single hairline ink rule. Five plain-text links: Home, Prints, Stationery, Workshops, Visit.
- On narrow screens the same five links sit in a simple native disclosure or menu.
- Visit is the one item that may be set apart, as a text link with an underline or a plain button, because it carries address and hours.
- **Do not number the nav** (`01 Prints`). The five pages have no order the visitor follows, so a numbered index would be decoration.
- **Not a floating glass capsule**, and not a brutalist multi-cell bar.
- **Why:**
  - This is the default pairing for the Editorial Paper lane, because it reuses the lane's ink rules and square corners.
  - Glass is one of the lane's own anti-patterns.
  - Five short items fit a plain row, so there is no recorded navigation need to depart from the default.
  - Real navigation semantics (landmark, current-page state, skip link) are preserved.

### 3. Hero visual strategy: art-directed photography (strategy 3)

- **Selection rule:** the offer is a place, a craft and physical goods, and usable cleared photography exists. The first matching rule is therefore art-directed photography / editorial frame. The live-coded `.ui-specimen` console is for software offers and is wrong here. The capability stage is for abstract services and would hide the real thing.
- **Treatment:**
  - A single large photograph of the real subject, a press at work or a type case in the bakery, framed as a printed plate. It has a deliberate aspect ratio, a hairline border, paper margin and a caption that says what is shown.
  - The headline is in the display serif beside or beneath the plate, with an asymmetric split or a full-width plate with text below. The concept comparison decides which.
  - The hero image is prepared with `media:prepare` and loaded eagerly (`loading="eager" fetchpriority="high"`), because it is the likely LCP element.
  - The photograph is chosen for what it proves: the real presses, not a posed or generic craft shot.
- **Why:**
  - The hero is the visitor's first proof of the offer, and there are no customer numbers or press coverage to stand in for proof.
  - The work, the presses and the room are the proof, and they exist.
  - The brief also says no stock art and no invented evidence.
- **Primary action (working assumption):** one main action above the fold that routes to the three offerings, with a quieter secondary "Visit the workshop". Revisit once question 2 is answered. If one offering is clearly the priority, it takes the primary action.
- Do not put a testimonial, a metric or a logo strip in or under the hero.

### 4. Home page section sequence

The order follows the visitor's questions (what is this place, what can I get, how is it made, can I see it, where is it). It is deliberately not the generic bento, then metric strip, then dark band, then FAQ sequence.

1. **Hero plate.** What the workshop is, in one or two sentences of real copy, with a framed photograph of the press and the routing action.
2. **The three offerings: "What we make and teach".** The three offerings sit side by side, but not as three identical cards. Use a hairline-separated ledger of three entries, each with its own photograph, a plain label, one sentence and its own next-step link. Allow the photograph crop and weight to differ between entries, since the content differs (a finished print, a stationery suite in progress, a workshop session at the press).
3. **How a piece is made, in order.** Setting type, inking, printing, shown through the work-in-progress and type-case photographs. A numbered or ordered list is allowed here, because this is a real sequence and the order carries information. This section is the proof of craft in place of testimonials. Split layout, with a sticky narrative beside the photographs.
4. **Finished work.** A short run of finished pieces as framed plates with captions (uncropped, using the gallery's contain fit). Its geometry differs from section 2: an editorial run of unequal plates, not a grid of equal cards.
5. **Visit band.** Address and opening hours, with a link to the Visit page. This is the single deliberate rhythm breaker: an ink-dark band (`data-surface="dark"`), or a paper band with a heavy rule if the dark one is judged too heavy in concepts. Hours, dates and prices go in the tabular or mono voice, because they are real metadata. This section closes the page, together with the footer.

- **Left out on purpose:**
  - No proof or metric strip, no logo ticker, no "as seen in", no testimonial block. There is nothing real behind them.
  - No FAQ on the home page. There is no known set of home-page questions. Workshop questions, if the owner has real ones, belong on the Workshops page.
  - No newsletter or duplicate call-to-action banner unless the owner asks for one.
- Never stack two sections with the same geometry, and never use two consecutive 3-column card rows.
- **Other pages (brief):**
  - Prints: a plate-led catalogue.
  - Stationery: the process in sequence, plus an enquiry.
  - Workshops: what a one-day workshop includes, who it suits, and dates or booking.
  - Visit: address, hours, directions and a map or exterior photograph.
  - Each page gets its own task and its own geometry. The home page's section order is not repeated on every page.

### 5. How the three offerings are presented and labelled

- **Labels:** the owner's own plain nouns, used identically everywhere (nav, home ledger, page `<h1>`, footer): **Art prints** (or "Prints" as the nav label), **Wedding stationery**, **Workshops** (with "One-day printing workshops" as the descriptive line). No invented brand names, no tiers or "collections" jargon. The nav label should equal the page title.
- **One presentation system, three jobs.** The same frame, rule, type and caption style for all three, so the site reads as one workshop. What differs is the next step, because the visitor's task differs:
  - Prints: look and choose. Plate-led catalogue; the action ("See the prints") is a purchase or enquiry only if the owner confirms selling.
  - Stationery: understand the process, then start a conversation. Ordered stages (consultation, design, setting, printing) only if the owner confirms them, with an enquiry action.
  - Workshops: understand the day, then book. What is included, duration, group size and dates, and a booking or enquiry action.
- **Equal weight at home.** The three are shown as peers, because they are sold side by side. Neither the colour nor the order implies a sequence, and no numbering. Order them by commercial priority once the owner states it.
- **Honest content only.** Prices, edition sizes, lead times, group sizes and dates are not invented. They are either supplied by the owner or shown as clearly marked draft placeholders. Offer terms (guarantees, returns) are not made up either.
- **Action labels** are specific verb-plus-object, matching what actually happens ("See the prints", "Start a stationery enquiry", "See workshop days"), not "Learn more" or "Get started". The same primary label is repeated consistently.

### 6. How photographs are captioned

- **What a caption does:** it says what the photograph shows, in specific, factual, literary-plain language: the object, the process step and the material. For example: "Setting type by hand from the case", "A cylinder press inking a run of invitations", "A finished print, still drying on the rack". Use real names of presses, typefaces, papers and inks only after the owner confirms them. Until then, label the caption as draft.
- **Where:** a visible caption under each framed plate, in the body serif at a small size, aligned to the frame edge. Use `<figure>` and `<figcaption>`.
- **Alt text is separate from the caption** and describes the image for non-visual use. It does not duplicate the caption.
- **Figure numbers (`FIG. 01`) only if the running text actually refers to the figures.** No decorative figure numbering, and no mono kicker labels.
- **Provenance:** each image has a recorded source, owner and permitted use (cleared), kept in the existing evidence home, so credits can be added where needed.
- **Slot discipline:**
  - A photograph is not reused in two slots on the same page.
  - Every slot has a source at least as wide as the rendered width at 2×.
  - Images are prepared through `media:prepare` and stored in the project's image store, not in the repository as large originals.
  - Text stays HTML, not baked into the images.
- **Why:** the photographs are the proof. A caption that states what is shown turns them into evidence, rather than leaving them as atmosphere, and it supports accessibility.

### 7. Site anti-patterns, each with a reason

For the saved record (three, semicolon-separated):

1. **No fabricated social proof or proof-shaped furniture** (testimonials, client logo tickers, metric strips, "as seen in", review stars, "limited edition" scarcity). Reason: the printers have no customer numbers or press coverage, and inventing evidence is forbidden. The real work is the proof.
2. **No faux-letterpress effects on the interface** (distressed or ink-bleed type filters, paper-grain over body copy, drop-shadowed "pressed" boxes, vintage ornament kits). Reason: the craft is shown by the real photographs and by the typography itself. Effects on live text cost legibility and look like a costume, and the lane calls for hairline rules and flat paper.
3. **No software-site furniture** (glass or pill navigation, live-console or `.ui-specimen` hero, mono kicker labels, numbered section indices, gradient text, the same bento then metric strip then dark band then FAQ sequence, three equal cards for the offerings). Reason: these are the generated-site fingerprints, and the Editorial Paper lane lists glass, neon and rounded pills as its own anti-patterns. The three offerings differ in task, so they should not be rendered as identical cards.

Additional bans worth recording in the concept notes:

- No stock photography, and no photograph repeated in two slots on a page.
- No generic CTA labels.
- No italic accent word in every headline.
- No cropped-to-square gallery that hides the pieces (use contain-fit plates for finished work).
- No dark-mode or colour-theme toggle unless the owner wants it.

### Draft Art Direction Record (proposed, not yet saved or gated)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper. Warm unbleached paper and carbon ink fit a literary, print-led letterpress workshop; the lane's anchors are letterpress and cotton paper.
- **Narrative Metaphor:** Impression on cotton paper: the page as a printed sheet, photographs as framed plates, hairline rules instead of boxes. Absent from live text and navigation, where legibility wins.
- **Typography Pairing:** Display: [transitional or high-contrast serif, to be chosen in concepts], Body: [book serif or neutral sans]. Mono only for hours, dates and prices; weights and italics confirmed as served.
- **Token Physics:**
  - Canvas: Warm bone paper, carbon ink text, no texture over reading areas
  - Action/Accent: One archival spot colour (vermilion or forest ink), used for actions and rules only
  - Borders: Hairline 1px ink rules, sharp square corners
  - Spatial Density: Spacious
- **Site Anti-Patterns:** No fabricated proof, testimonials, logo strips or metrics; no faux-letterpress effects on live text or paper-grain over copy; no software-site furniture (glass or pill nav, console hero, mono kickers, numbered indices, identical three-card rows)
```

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/astro-site-design/SKILL.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/new-site-workflow/references/discovery-and-content.md
- .agents/skills/site-art-direction/references/reference-research.md
