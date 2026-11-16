# Art direction proposal: letterpress workshop site (five pages, English)

## Answer

**Track and stage.** Express. The site has five routes, one locale and no collections beyond the offerings, and no editor roles, integrations or migration are stated. Route planning may proceed now; visual implementation waits for the Art Direction Record to be saved and `check:art-direction -- --require-record` to pass (AGENTS.md, ART DIRECTION GATE). Platform is not settled: recommend the `static` profile unless the printers need to edit copy in a browser. This is the one question that changes the stack rather than the direction.

**Design surface.** No canvas was requested, so propose HTML/browser concepts under `audit/visual-concepts/`, with a single offer of Brilliant, OpenPencil or Penpot if the owner wants an editable canvas. The `open-design` and `pencil` MCP servers failed to connect this session, so those surfaces are not currently usable. This matters only if one of them is chosen.

**1. Aesthetic lane: Editorial Paper.** The product is printed paper, and the lane's anchors (letterpress ink, bond paper, bookbinding, broadsides) are the workshop's own practice. Its typography and surfaces suit a literary, print-led voice. Light mode only: the lane's dark mode is not earned by the brief.

**2. Narrative metaphor: the type case and the proof sheet.** Effects: section breaks are printer's rules (one hairline between ordinary sections, a double rule at major ones); photographs are set as proofs with a thin mat and a keyline; captions are set like a colophon. Absent from buttons, navigation shape, backgrounds and any simulated texture. Reason: the metaphor should change how real work is shown, not how the interface decorates itself.

**3. Typography.** Display and body both in one serif family with optical sizes (Newsreader is a candidate; confirm the licence and served weights before use). Display tracking -0.03em, line-height about 1.02, `text-wrap: balance`. Body at 1.65 line-height and a 65ch measure. Accent: italic is allowed on one word in the home hero only, because the literary voice earns it there. Monospace is not used as a label voice; it appears only for prices, dates and opening times on the Visit and Workshops pages, where it is real metadata.

**4. Hero strategy: art-directed photography (option d).** The offer is a place, craft and physical goods, and the owner has cleared usable photography. The hero is one large framed photograph of a press or type case in use, with a mat, a hairline keyline and a caption that says what is shown. Use the strongest real photograph, not a posed still life. Do not use stock, generated art or a UI specimen. The headline sits beside or below the image and names all three offerings in one sentence. The three offerings are linked as text in the hero, so no single call to action dominates.

**5. Header and navigation: Editorial Hairline Masthead.** Wordmark in the display serif at left. Five links, in the requested order, labelled with the page names exactly: Home, Prints, Stationery, Workshops, Visit. No numeric indices, because the five items have no sequence. A single 1px ink rule under the masthead. At phone width the five links collapse into one disclosure control with visible text, not an icon alone. No floating capsule, no glass, no sticky bar that hides the wordmark.

**6. Home section sequence.**
1. Hero: framed press photograph, one sentence, three offering links.
2. Offerings ledger: Prints, Stationery and Workshops (see item 7).
3. Work-in-progress band: three or four captioned photographs in process order (type case, forme, press, finished sheet). The order carries information, so the captions can name the stage; no numerals.
4. Short essay on the presses and the former bakery, two or three paragraphs at reading measure, using only facts the owner has supplied.
5. Visit strip: address, opening hours and a link to the Visit page.
6. Footer: navigation repeated, contact and a colophon line.

Omitted by design: proof strip, metrics, client logos, testimonials, press band, newsletter band, dark closing spotlight, FAQ. The owner has no customer numbers or press coverage, so those sections would be invented. The default landing-page order (proof strip, feature grid, FAQ, dark closing band) is rejected here. Workshop questions belong on the Workshops page, if they recur.

**7. Presenting and labelling the three offerings.** Give them equal weight, side by side, in a hairline-ruled three-column ledger with no shadowed boxes, which avoids the generic card grid. Each entry has one real photograph of work, one plain sentence saying what it is, and one link. Labels are the owner's own nouns: "Art prints", "Wedding stationery", "One-day printing workshops". Do not use clever names. Equal weight is a working assumption; if stationery is the commercial lead, the owner should say so and it can take the larger first row. Do not show prices, "book now" or enquiry buttons until the owner supplies the terms and the route for enquiries.

**8. Photograph captions.** Captions are visible text under the image, never tooltips. Sentence case. Each caption says what the photograph shows: the press, the stage of work, or, for finished pieces, the title, medium and paper from the owner's supplied data. No adjectives, no invented credits, no model names for presses unless supplied. Missing data is marked as a draft placeholder such as "[caption to be supplied]". Do not name workshop participants unless consent is recorded. Figure numbers ("FIG. 01") only where the text refers to them, which is not expected here. Alt text describes what is visible; the caption carries the meaning.

**9. Site anti-patterns (in the record).** Three bans, each with its reason:
- No glass or floating capsule navigation and no frosted cards: the lane's surfaces are flat paper, and glass would import a different material.
- No faux letterpress effects (embossed text-shadow, grunge or paper-noise overlays on every section): the real printing is the proof; a simulated impression reads as a costume.
- No kicker labels above headings, numbered indices, or an italic word in every headline, and no stock, generated imagery or invented testimonials, metrics or press logos: these are the generic fingerprints of a generated site, and unsupplied proof would be false.

Also avoid, by lane: pill buttons, neon accents, the bento and dark spotlight sequence, and three identical bordered cards.

**10. Spacing and tokens.** Spacious, reading-led spacing on the home and essay pages. Balanced density on Prints, Stationery, Workshops and Visit so details scan. Shared layout spacing with local exceptions. Radius 0. Hairlines 1px. Verify the vermilion action colour against the bone canvas with `design:tokens` (contrast is not assumed from the values below).

**Draft Art Direction Record** (working assumption until the owner approves it; the gate needs it saved in AGENTS.md):

## Art Direction Record
- **Aesthetic Lane:** Editorial Paper. The workshop is printed paper; the lane's anchors (letterpress ink, bond paper, bookbinding) are its own practice.
- **Narrative Metaphor:** Type case and proof sheet. Sets section rules, photo mats and caption form; absent from buttons, navigation shape and simulated texture.
- **Typography Pairing:** Display: Newsreader (display optical size), Body: Newsreader (text optical size). Confirm licence and served weights.
- **Token Physics:**
  - Canvas: warm bone paper (oklch(97% 0.01 85)), ink text (oklch(18% 0.01 260)); light only.
  - Action/Accent: one letterpress vermilion (oklch(58% 0.22 25)) for links and actions only; verify contrast.
  - Borders: 1px ink hairlines, 0px radius.
  - Spatial Density: Spacious on reading pages; Balanced on Prints, Stationery, Workshops and Visit.
- **Site Anti-Patterns:** No glass or floating capsule navigation or frosted cards; no faux letterpress effects such as embossed text, grunge or noise overlays; no kicker labels, numbered indices, italic word in every headline, stock or generated imagery, or invented testimonials, metrics or press logos.

**Open owner decisions** (ask in chat, one at a time when the work reaches them): platform (static or editable), the enquiry route for workshops and stationery, and whether one offering should lead.

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/new-site-workflow/SKILL.md
4. .agents/skills/site-art-direction/SKILL.md
5. .agents/skills/site-art-direction/references/aesthetic-lanes.md
6. .agents/skills/new-site-workflow/references/express-track.md
7. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
8. .agents/skills/astro-site-design/references/landing-page-archetypes.md
9. .agents/skills/site-art-direction/references/design-iteration.md
10. .agents/skills/new-site-workflow/references/copywriting.md
11. .agents/skills/new-site-workflow/references/discovery-and-content.md
12. .agents/skills/site-art-direction/references/reference-research.md
13. .agents/skills/astro-site-design/SKILL.md (lines 96-107 only)
