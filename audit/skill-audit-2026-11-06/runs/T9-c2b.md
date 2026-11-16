## Answer

### Route and process framing
- **Track:** Express. It is a greenfield site with five routes, one locale (English) and no collections beyond a few repeated records. Express still runs every gate: the Art Direction Record saved in AGENTS.md, `npm run check:art-direction -- --require-record`, `/_styleguide` calibration and `audit/component-calibration.md`. Nothing visual is built until that record exists.
- **Profile:** I would recommend `static`, with Sveltia only if the printers want to edit in a browser. Ask about editing needs before choosing a CMS profile. This is a working assumption to confirm.
- **Design surface:** No canvas was mentioned, so the default is HTML/browser concepts under `audit/visual-concepts/<round>/`. I would still offer Brilliant, OpenPencil and Penpot once, in one line, without making it a blocking question.
- **Directions to compare:** Compare two or three structurally distinct directions side by side at 1440x900 and 390x844, with a recommendation. The directions should differ in hero idea and section composition, not just in palette. For example:
  - A: a single large press photograph with a broadsheet-style text column.
  - B: a "type case" grid of small work-in-progress photographs.
  - C: a tall, specimen-sheet layout with a pinned offerings index.
- **Concept quality gate:** Run the gate table on every concept. Two rows go first as a pre-flight: recorded invariants (the anti-patterns below) and ground, depth and atmosphere.
- **Assumptions to label:** English only. Photographs are cleared and in hand, so they are real and not stock. Opening hours and address come from the printers. Nothing else is invented.

### 1. Aesthetic lane
**Editorial Paper**, as the primary lane (about 70% weight). A light secondary inflection of exposed hairline cell walls (`.grid-hairline`) can be used only in the visit page's hours table, where it carries tabular data.

Why:
- The lane's own narrative anchors are letterpress ink bleed, unbleached cotton bond paper and bookbinding. That matches a letterpress workshop and a literary, print-led tone directly. Choosing it needs no stretching.
- Warm bone canvas, deep carbon ink and one archival spot colour (vermilion or terracotta, used for actions and small marks only) are the lane's palette. The lane also gives sharp square corners, 1px ink rules and spacious, reading-led density.
- The page can use the lane's "optional subtle paper grain". If it is used, `.surface-grain` should be applied to the ground. A flat single-colour ground is named in the concept gate as a weakness.

Narrative metaphor, with boundaries:
- **Metaphor:** a printer's proof sheet pulled from the press in a former bakery.
- **Where it shows:** ink-rule dividers, generous paper margins, photographs set like plates on the sheet, and captions in the margin.
- **Where it stays absent:** navigation labels, form controls and the opening-hours table stay plain and functional. The bakery is a fact for the visit page, not a decorative theme (no flour or bread motifs).

Typography:
- Display: a high-contrast book or transitional serif (Newsreader or Fraunces class), with tight tracking and balanced wrapping.
- Body: a legible book serif or a quiet grotesque, at roughly 1.7 line-height and a 60-68ch measure.
- Use two voices. Display and body are required. The mono voice is earned only for real metadata, such as the hours table, prices and workshop dates, and not as kicker labels. An italic accent word is optional: use it at most once, on the home page, and only if the words carry it.
- Verify that the fonts can be served legally, and their weights, before recording them.

Density is spacious. Composition is varied but orderly, because the site is small and sells a point of view. Motion is quiet: the only motion is a gentle reveal, with reduced-motion honoured, and no scroll-jacking.

### 2. Header and navigation archetype
**Editorial Hairline Masthead.** This is the default pairing for Editorial Paper. It uses a serif workshop wordmark on the left, five plain text links (Home, Prints, Stationery, Workshops, Visit) and a 1px ink rule beneath.

Reasons:
- Five items fit one row, so there is no need to depart from the default for a navigation-capacity reason.
- Floating glass capsules are explicitly an anti-pattern of this lane, and glass navigation is a generated-site fingerprint.
- **Do not number the links** (01 Index, 02 Archive). The archetype's recipe suggests numbering, but the site's own check says numbered indices read as generated unless the sequence carries information. Five pages in a fixed order carry none.
- **Mark the current page** with an ink underline or a heavier weight, and keep it keyboard-focusable with a visible focus state.
- **Make Visit visually distinct** as a quiet action link (spot colour), because finding the address and hours is a main visitor task.
- **Mobile:** collapse to a single menu button, with the same five words in a full-width list. Keep the wordmark visible.

### 3. Hero visual strategy
**Art-directed photography / editorial frame.** This is branch (d) of the first-match rule: the offer is a place, a physical craft and a set of physical products, and usable cleared photography exists. It is not a live-coded console (software only) and not a capability stage (several services from one agency).

How to apply it:
- Use one real photograph of a press or the type cases at a large size, with a deliberate aspect ratio and a hairline border or paper margin. It should look like a plate on the page.
- Choose the one photograph that best shows the craft at a glance. A close view of inked type or the press bed is stronger than a wide shot of the room. Prepare it with `npm run media:prepare`, and check the source width is at least the rendered width at 2x.
- Put a literary headline in the display serif beside or above the photograph. It should say what they make in concrete terms (for example prints, stationery and workshops from a converted bakery), and not a generic slogan. A caption sits beside the photograph (see section 6).
- One primary action only. The single most useful action is probably "See the workshops" or "Visit the press". Confirm which with the printers, since the three offerings are equal and the choice is a business decision. Do not add competing buttons above the fold.
- No stock art, no illustration standing in for photographs, no gradient wash behind the photograph.
- Only one photograph in the hero. Do not repeat it elsewhere on the page.

### 4. Home page section sequence
The brief has no customer numbers, no press coverage and no testimonials. So the usual "proof strip" (logo ticker, metric ledger) and testimonial sections are omitted. They are not replaced with invented figures. The skills say thin proof should be replaced by an actual sample, a documented process or a qualification, or the strip should be dropped.

Proposed order, with the geometry changing at each step so no two consecutive sections share a skeleton:

1. **Masthead and hero (asymmetric split).** Display headline, a one- or two-sentence intro, one action, and the framed press photograph with its caption.
2. **The workshop in a paragraph (single reading column with a drop cap).** A short literary introduction to the two printers and the converted bakery, in prose, at reading measure. This is the lane's `.prose-dropcap` territory. It is the "why trust us" section, and it is done by voice and by place, not by claims. Only facts the printers supply.
3. **Three kinds of work (varied geometry, see section 5).** Prints, stationery and workshops, presented as three distinct entries, each with its own photograph and its own next step.
4. **How a piece is made (process, photographs in sequence).** Four or five photographs of the actual stages (setting type, inking, pressing, finished piece), with real captions. This is the documented-process substitute for proof. Numbering is allowed here only if the order is real; it is, because setting type comes before printing. Keep labels in words and use numerals only if the sequence matters to the reader.
5. **Finished work (asymmetric gallery).** An uneven set of finished pieces on paper-coloured ground. Use a variable-span arrangement rather than an even grid, and do not crop the pieces.
6. **Visit (compact closing band).** Address, opening hours in brief and a link to the Visit page. This is the single repeated call to action. A restrained inverted ink band is acceptable here as the one rhythm breaker, because the content changes register from showing work to practical information. It is not a mandatory spotlight band, and it should be dropped if the page already feels paced.
7. **Footer.** Address, hours in short form, a contact route (the means must be supplied by the printers) and landmarks. No newsletter band unless they want one.

Omitted on purpose: logo ticker, metric strip, testimonial carousel, "trusted by" row, FAQ band, "as seen in". The Schema.org `LocalBusiness` data should be emitted on the Visit page and carry only supplied facts. An FAQ is not needed on the home page, and it would add `FAQPage` markup only if real questions exist.

### 5. How the three offerings are presented and labelled
Principles: the three offerings are sold side by side, so none should be hidden in a menu or ranked by size. They also differ in how someone buys them, so they should not be identical cards.

- **Labels.** Use their own plain names on a single noun: Prints, Stationery, Workshops. These match the navigation exactly, so the visitor meets the same word everywhere. Add one verb-led line under each that says what the visitor does (for example browse and buy prints, commission wedding stationery, book a one-day workshop). Do not invent product names or taglines.
- **Different geometry, equal weight.** On the home page, show the three as a hairline-ruled row of three entries only if each has a different photograph and a different closing action. A better option, if the content is long enough, is an asymmetric 7/5 split for the first and a reversed split for the second and third, so the home page does not become a row of three identical cards. Treat equal weight as an equal amount of space across the whole section, not as three identical boxes.
- **Each entry has:** one photograph (never repeated elsewhere on the page), the name, the one-line description and one link with an action label that names the next step ("See the prints", "Ask about wedding stationery", "Choose a workshop date"). Avoid "Learn more".
- **Labelling by buying mode, not by category tags.** Prints are bought as finished objects, stationery is commissioned, and workshops are booked on a date. Use that difference to give each entry a plain, factual note (for example "ready to buy", "made to order", "one day"). These are descriptions only. Do not add prices, lead times, capacities or dates unless the printers supply them. Where a figure is missing, use a clearly marked placeholder of the right shape and name its owner.
- **On the offering pages:**
  - Prints: a gallery of finished prints, with the edition, paper and press in the caption, and a purchase route.
  - Stationery: a process-led page (enquiry, proofs, printing), with real examples, and an enquiry route as the main action.
  - Workshops: a plain schedule of dates, with what is covered, what to bring and how to book. Use tabular figures for dates and prices if they are supplied.
- **Cross-linking:** each offering page ends with links to the other two and to Visit, so the side-by-side promise holds.
- **No filter pills, tabs or toggles** between the three. There are only three, and they all have their own page.

### 6. How photographs are captioned
- **Caption with facts, not mood.** Each caption states what is in the picture and one true detail: the press or type case being used, the typeface or paper, or the stage of the work. Example shape: "Setting a line of 24-point type by hand." The printers must supply or confirm the specifics. Do not invent press names, dates, paper stocks or edition sizes.
- **Place:** set in a small body-serif italic (or a small roman), in the margin beside or directly below the photograph, in the muted ink colour that passes 4.5:1 contrast. The caption belongs to the photograph through semantic `<figure>`/`<figcaption>`.
- **Figure numbers only where the sequence is the information.** The site skill suggests archival "FIG. 01" captions for craft photography. Use them on the process section and on any numbered plate series, where order is real. Do not apply them to every photograph, and do not use them as decorative labels. Elsewhere use plain captions with no numbers.
- **Alt text is separate from the caption.** Alt text describes the image for someone who cannot see it; the caption adds the fact. Do not repeat one in the other. Decorative duplicates are marked as such.
- **Credits and permission.** The photographs are cleared for use. Record provenance (who took them, what they are cleared for) once in the existing context home. Add a credit line only if the clearance requires it.
- **Editing:** captions are a content field on each image, so the printers can change them without touching code.
- **Frames:** use hairline borders or a paper margin, fixed aspect ratios and uncropped finished work. Check crops at 390, 768 and 1440 px.

### 7. Site anti-patterns (for the Art Direction Record)
Record these as semicolon-separated items (two or three in the record, with the rest as supporting notes here):

1. **No glass, no floating capsule navigation, no rounded pills or soft shadows.** Reason: they are on the Editorial Paper lane's own anti-pattern list, and they would make a letterpress workshop look like a software product. Use ink rules, square corners and flat paper surfaces.
2. **No invented proof: no fake testimonials, customer counts, "trusted by" logos or press quotes.** Reason: the printers have none to publish, and the skills forbid fabricating clients, metrics or reviews. The honest replacements are the documented process, real finished work and a plain account of the workshop.
3. **No generated-site fingerprints: no mono kicker labels above headings, no numbered section indices (`01 //`), no italic accent word in every heading, no gradient text, no bento to metric strip to dark band to FAQ sequence.** Reason: the site's generic-fingerprint check says these read as generated unless the content earns them, and a literary, print-led brand depends on a voice that does not look templated.

Supporting notes, not part of the three-item record:
- **No stock photography and no live-coded console hero.** The real photographs are the proof, and a console hero belongs to software offers.
- **No three identical card rows for the three offerings.** Equal weight comes from equal space and a common label pattern, with different geometry from section to section.
- **No decorative bakery motifs** (flour, wheat, bread). The metaphor is the proof sheet, and the bakery is a fact on the Visit page.
- **No cropping of finished prints** and no repeating one photograph in two slots.

### Record to be saved before any visual work (draft, for confirmation)
- **Aesthetic Lane:** Editorial Paper (hairline masthead, paper ground, ink rules, spot colour for actions only).
- **Narrative Metaphor:** a printer's proof sheet pulled from the press in a converted bakery, applied to margins, plate-style photographs and captions, and absent from navigation, forms and the hours table.
- **Typography Pairing:** Display: a high-contrast book serif; Body: a legible book serif or quiet grotesque (to be confirmed for licence, weights and English coverage).
- **Token Physics:** Canvas: warm unbleached paper with optional subtle grain; Action/Accent: one archival vermilion or terracotta; Borders: 1px ink hairlines, square corners; Spatial Density: Spacious.
- **Site Anti-Patterns:** the three items above.

Assumed versus approved: everything above is a proposal and a working assumption until the printers confirm it. A saved record and a passing gate do not establish their approval. The first action, the exact captions, prices, opening hours and the address are the printers' to supply.

## Files read
- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/astro-site-design/SKILL.md (lines 85-124 only)
