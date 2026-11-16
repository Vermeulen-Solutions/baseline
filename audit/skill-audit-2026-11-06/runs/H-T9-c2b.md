# Art direction proposal: letterpress workshop, five-page English site

## Answer

### Track, surface and status

- **Track: Express.** Five routes (home, prints, stationery, workshops, visit), one language and no collections beyond a possible prints list, so the Express defaults apply. Express still runs the art-direction gate, `/_styleguide` calibration and verification.
- **Design surface: HTML/browser concepts.** No canvas was requested, so the default applies. Offer the surface once: two or three directions side by side as HTML concepts, with Brilliant named for an editable canvas and OpenPencil or Penpot as alternatives. The `open-design` and `pencil` MCP servers failed to connect in this session. That does not matter for the HTML default, but it would matter if the owners chose one of those canvases.
- **Status of everything below:** working proposal, not owner-approved. Nothing has been implemented, and no Art Direction Record has been saved.

### Aesthetic lane

**Editorial Paper**, with no secondary inflection.

Reason: the offers are printed objects, and the tone is literary and print-led. The lane's warm paper, 1px ink rules, square corners and reading measure carry the identity without decoration. Its anti-patterns (glass, neon, rounded pills) would contradict the subject, so they are banned explicitly.

### Narrative metaphor

**The printer's proof sheet.** The page behaves like a proof pulled before the run: ink rules divide sections, photographs sit inside hairline frames, captions are set like a printer's notes, and the masthead is a single rule.

- Where it applies: section dividers, photo frames, caption style, masthead rule.
- Where it stays absent: navigation labels, forms, prices, hours and the address. These are functional and stay plain.

### Typography

- **Display:** a high-contrast serif. Candidates are Newsreader or Instrument Serif. Choose after checking the licence, the weights actually served and how the face holds at about 1.0 line-height in large sizes.
- **Body and UI:** a plain grotesque or sans. It is clearer for hours, addresses, form labels and dense stationery details.
- **Accent:** the display family's italic, used on at most one focal word in the hero. The brief's literary voice earns it, but an italic word in every heading would be a generated-site fingerprint.
- **Mono:** not used. There is no code or measured data to justify it, so monospace would be a costume. Hours and prices use tabular figures in the body font instead.
- **Voices:** two required voices plus the optional accent. A two-voice system is valid.

### Token physics

- **Canvas:** warm bone or unbleached paper, one flat tone. No gradients. Paper grain stays off unless the supplied photographs need it.
- **Action and accent:** ink (near-black) for text and links. One spot colour, sampled from the workshop's real ink or taken from the lane default (vermilion), is reserved for the single primary action and the masthead rule. Use it at most once per view.
- **Borders:** 1px ink hairlines and 0px radius on every control, card and frame. No pills.
- **Spatial density:** spacious and reading-led. Hairline ledger rows use standard density. The brief gives a clear cue here, so this is not the balanced default assumed without one. Layout spacing uses the shared responsive defaults, and this choice is recorded as an assumption for the owners to confirm.

### Header and navigation

**Editorial Hairline Masthead, without numerals.**

- Wordmark on the left. The name and wordmark come from the owners; do not invent a logo.
- Five text links (Home, Prints, Stationery, Workshops, Visit) sit above a single 1px ink rule. The current page gets `aria-current` and an underline, not a pill or a filled state.
- The lane's default archetype numbers its links (01 Index and so on). I am recording that as an exception. The five pages have no sequence, so numbers would be decoration.
- Not sticky. Keep the header plain and static, with no glass, blur or floating capsule.
- Mobile: the five links wrap onto two lines, or sit in a native `<details>` disclosure. No JavaScript menu.

### Hero visual strategy

**Option 3: art-directed photography in an editorial frame.** The offer is a place and a craft, and the owners have cleared photographs.

- Use one real photograph of the presses or the type case in use. Do not use stock, generated or illustrated press imagery.
- Frame it with a hairline border and a factual caption. Do not use a live-coded specimen, which would suit software rather than a workshop.
- Mark it as the above-the-fold image: `loading="eager"` and `fetchpriority="high"`. Keep the press's working parts inside the crop at mobile width. Alt text describes what is visible.
- The owners choose which photograph carries the hero. That choice changes the first impression, so it is a decision to ask them, not a working assumption.

### Home section sequence

Each section changes geometry from the one before. There are no identical card rows, and no metric, logo or testimonial strip, because the owners supplied none of that proof.

1. **Hero** (7/5 asymmetric split): one `h1` stating what the workshop makes, with a draft line such as "Letterpress prints, wedding stationery and one-day workshops, pressed by hand in a converted bakery." Framed photograph with caption on the right.
2. **Three offers as a stacked ledger.** Three full-width rows divided by 1px rules, not a three-column card grid. Each row gives the label, one line of description and a text link. The rows carry equal weight, and none is featured.
3. **The press room** (5/7 split): a photograph of the presses or type cases with a short passage on how the work is made.
4. **From type case to sheet**: a four-step ledger for setting, proofing, printing and finishing. Numbers are allowed here because the sequence is real and the steps are genuinely ordered. Only use steps the owners confirm.
5. **Finished work**: an uncropped gallery (`PhotoGallery fit="contain"`) of three to five finished pieces, each with a caption. Keep it on the paper ground, with no dark band.
6. **Visit**: a hairline ledger with address and opening hours in tabular figures, and a link to the visit page. Link out for directions rather than embedding a third-party map by default.
7. **Closing**: a plain ink rule, one sentence and one primary action. Repeat the same action label used elsewhere on the page.

Omitted on purpose: a dark spotlight band, a FAQ, a newsletter, and any metric or logo strip. A calm single-tone page passes the rubric. Adding a dark band or a bento-metric-FAQ run to complete it would be the generated-site pattern.

### Presenting the three offers

- **Labels:** use the owners' own nouns, without umbrella terms such as "Shop", "Services" or "Creations". Nav labels are Prints, Stationery and Workshops. The offer heading and page title can carry the full phrases: "Art prints", "Wedding stationery" and "One-day printing workshops". Use the same words in the home ledger, the nav and the page headings.
- **Equal status.** All three appear on the home page with identical structure and weight. None is hidden behind a tab or a dropdown.
- **Same reading order on each offer page**: what it is, who it is for, how to start. The order is shared so the three read side by side. The geometry differs, because each offer has a different job:
  - **Prints** is image-led: an uncropped gallery with title, size and paper or ink details, but only where the owners supply them.
  - **Stationery** is sample-led: a few sample pieces, the proof-and-paper process, and an enquiry route.
  - **Workshops** is a dated ledger: what is included, dates or how to ask about dates, and how to book.
- **No invented facts.** Prices, edition sizes, lead times, minimum orders and booking methods stay unset until the owners supply them. Show "price on enquiry" only if they confirm that.

### Photograph captions

- Captions sit directly below the image, in the body sans at a smaller size. They are not placed over the image and are not styled as a label.
- Form: one factual sentence saying what is shown and where or how it was made, for example "Setting type by hand at the case." A credit line follows a dash only if the licence requires one.
- Do not use "FIG. 01", numbering, kicker labels or decorative terms. The lane's figure-caption habit is a costume here.
- Alt text describes what is visible. The caption adds context and never repeats the alt text.
- Name a press, a paper or an ink only when the owners supply it. Do not guess machine models, dates or materials.

### Site anti-patterns

1. **Glass, blur, floating capsule navigation and frosted cards.** They contradict the paper and ink physics of the lane and read as a generic app shell.
2. **Monospace, kicker labels above headings, decorative numbered section indices, and an italic word in every headline.** They are the generated-site fingerprints in the skill, and monospace is a costume on a site with no code or measured data. The only numbered sequence is the real process ledger.
3. **Invented proof or imagery.** No testimonials, press logos, customer counts or stock or generated pictures of presses, people or "craft". Every image must be a cleared photograph of this workshop. A gap is shown honestly or left out.

### Open decisions for the owners

These change the work, so they are questions rather than assumptions:

1. Which photograph carries the hero.
2. Whether prints are sold online. This changes the prints page and whether a shop flow is needed.
3. How workshops are booked, which sets the single primary action.
4. The spot ink colour, sampled from the workshop's ink if available.
5. Confirmation of the display face, after licence checks.

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/site-art-direction/SKILL.md
4. .agents/skills/new-site-workflow/SKILL.md
5. .agents/skills/site-art-direction/references/aesthetic-lanes.md
6. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
7. .agents/skills/new-site-workflow/references/express-track.md
8. .agents/skills/site-art-direction/references/design-iteration.md
9. .agents/skills/astro-site-design/SKILL.md
10. .agents/skills/site-art-direction/references/reference-research.md
11. .agents/skills/new-site-workflow/references/brief-platform-content.md
12. .agents/skills/astro-site-design/references/landing-page-archetypes.md
