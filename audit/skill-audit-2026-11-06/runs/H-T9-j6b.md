## Answer

These are proposals for owner review before any visual implementation. No canvas was requested, so the surface is HTML/browser concepts under `audit/visual-concepts/`, with a Direct Astro proof after selection. The site is English. Copy is written in the printers' own voice, and no proof is invented.

### Working assumptions

- No customer numbers, press, testimonials or logos exist, so no proof strip, metric ledger, quote block or "as seen in" row is planned. The work itself is the proof.
- The shop and its photographs are cleared. Captions and alt text still need the printers' facts (titles, techniques, paper, dates). Anything not supplied stays out of the copy.
- The owner's other sites are not recorded. The concept quality gate row "Distinct from the owner's other sites" must read "not checked: no list of the owner's other sites is recorded" until they say whether a motif looks familiar.

### Aesthetic lane

**Editorial Paper**, with no secondary inflection. Literary, print-led work on warm paper matches the lane's narrative anchors (letterpress ink, bond paper, type and bookbinding) and its spacious, reading-led density. No other lane fits. Luminous Futurism and Technical Systems would contradict the craft.

- Canvas: warm bone paper, about `oklch(97% 0.01 85)`, with a slightly lighter surface tier for product and photo frames. Do not use a grain texture unless the photographs need it.
- Ink: near-black carbon, about `oklch(18% 0.01 260)`, for text and the masthead rule.
- Action: one restrained letterpress red (oxblood-vermilion, to be tuned in `design:tokens` against the WCAG pairs). Used for links and primary actions only.
- Borders: 1px ink hairlines and 0 radius. Frames for photographs use a hairline, not a shadow.
- Density: spacious on Home and Workshops; standard on Prints and Stationery, where visitors compare items.

### Narrative metaphor

Letterpress composition: type cases, a locked forme, a proof pulled on bond paper. It shows in the page's structure (hairline rules that read like furniture, captions set like printer's labels) and in the photography, which stays real. It does not appear as decorative textures, ink splatter or fake wood type. It stops at the navigation and at the purchase or booking actions, which stay plain.

### Typography

- Display: Newsreader (variable, with its display optical size), tight tracking, line-height about 1.02 to 1.08.
- Body: Newsreader at its text optical size for reading copy, 1.65 line-height, about 66ch measure.
- Accent: an italic Newsreader word is allowed on at most one focal word per page, and not in every headline. Its use is a content choice, not a default.
- Mono: none. The site has no code or measurements, so monospace would be a costume.
- Labels and captions: small Newsreader in ink at reduced contrast, not uppercase tracked kickers.

Both faces are on Google Fonts with a weight range that covers the design. Confirm the licence and a complete weight set in the Astro font setup.

### Hero visual strategy

The brief names three offerings from one studio, which is the first match in the decision order: an **interactive capability stage** (the studio branch, option 2). This stage uses real photographs, not an interactive matrix. The hero is a split at 7/5: a headline and one-sentence lead on the left, and a single large framed photograph of a press on the right. The photograph is the first proof and must be a real, large original. Stock imagery and generic "craft" stock (hands, linen, flat-lays) are excluded.

This is a precedence decision: the photographic treatment in option 3 is used inside the stage. Record it as such in the Art Direction Record.

### Navigation and header

**Editorial Hairline Masthead**: the wordmark in display type, then five plain labels (Home as the wordmark, Prints, Stationery, Workshops, Visit), and a crisp 1px ink rule beneath. Labels are not numbered, because the order does not carry information. Below about 40em, use a native `<details>` disclosure, with no JavaScript drawer. No glass capsule, since the lane's surfaces are not glass.

### Home page section sequence

1. **Hero stage** (split, press photograph, headline, lead).
2. **Three offerings**, side by side, equal weight, using the three labels below. Each has a real photograph, a name, two lines of description, and one link. Use a hairline ledger, not floating cards.
3. **From type to sheet**: real photographs of the type cases, work in progress and the press, with factual captions. An asymmetric 7/5 split that reverses the hero's weight. Sequence markers only if they are true steps in the workshop's order.
4. **Finished pieces**: a single wide breakout frame of finished work, linked to Prints and Stationery. Not a product grid.
5. **Visit**: address, opening hours and a photograph of the shop front or press room. This is the only place a single ink-surface band may be used, and only if it reads as a rhythm change rather than a default.

Omit: FAQ (move any real questions to Workshops once the printers supply them), logo ticker, metric ledger, testimonials, newsletter band, pricing cards. Do not repeat the bento, metric, dark-band, FAQ sequence.

### The three offerings: presentation and labels

Use the words the studio uses, not marketing labels:

- **Art prints** (link: "See the prints").
- **Wedding stationery** (link: "Ask about stationery"; a commission is a conversation, so do not claim an order button or prices that were not supplied).
- **One-day printing workshops** (link: "See workshop dates"; use "Workshops" in the navigation).

Each offering has the same structure: name, one-sentence description of what it is, who it is for, and one link. Equal weight, because the brief gives equal weight. Avoid "Shop", "Get started", "Learn more" and "Explore".

### Photo captions and alt text

- Captions are sentence case, one line, and say what is shown: the press, the object, the place. Example pattern: "Platen press in the back room, with a forme locked up for proofing." Facts come from the printers, not from appearance.
- No adjectives such as "beautiful" or "handmade". No `FIG. 01` labels unless the text refers to figure numbers.
- Work pieces carry a title, technique and paper if the printers supply them. A credit line only if the agreement requires it.
- Alt text describes what is visible in the photograph. Decorative images get empty alt text. Captions do not repeat alt text.

### Copy direction

Literary and concrete: type, paper, impression, proof, forme. Short sentences, first-person plural as the two printers, and no generic studio language. Headlines follow the outcome pattern only where it is true. Do not add claims about volume, years in business, clients or press.

### Site anti-patterns (for the record)

1. No stock or generic craft imagery, and no invented proof: no customer counts, quotes, press logos, star ratings or metric strips without supplied facts.
2. No glass or floating capsule navigation, gradient text, neon accents, rounded pill buttons or dark-mode neon, because each contradicts the Editorial Paper surfaces.
3. No kicker labels above headings, decorative section numbers, or an italic accent word in every headline; these are generated-site tells.

### Process before the first render

- Make two or three structurally distinct HTML concepts (for example: a photograph-led hero with a ledger offering row; a text-led masthead with a full-width press frame; a catalogue-led Home that leads with Prints). Compare them at 1440x900 and 390x844 with the fixed concept gate table.
- Ask once whether the owner wants inspiration references. If not, work from the brief and the photographs.
- Save the Art Direction Record in `AGENTS.md` with the schema below, then run `npm run check:art-direction -- --require-record` before any visual work. Calibrate on `/_styleguide`.

```markdown
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper — literary, print-led work on warm paper; letterpress and bond-paper anchors fit the craft.
- **Narrative Metaphor:** Letterpress composition (type cases, locked forme, pulled proof) shown in hairline structure and real photography only; absent from textures, navigation chrome and actions.
- **Typography Pairing:** Display: Newsreader, Body: Newsreader (text optical size). Italic accent optional, at most one focal word per page; no mono.
- **Token Physics:**
  - Canvas: warm bone paper, oklch(97% 0.01 85); lighter surface tier for frames.
  - Action/Accent: restrained letterpress red, used for links and primary actions only.
  - Borders: 1px ink hairline, 0 radius.
  - Spatial Density: Spacious on Home and Visit; Standard on Prints and Stationery.
- **Site Anti-Patterns:** No stock or generic craft imagery and no invented proof (counts, quotes, press logos); no glass navigation, gradient text, neon or pill buttons; no kicker labels, decorative numbers or italic word in every headline.
```

## Files read

1. AGENTS.md
2. .agents/skills/site-art-direction/SKILL.md
3. .agents/skills/site-art-direction/references/aesthetic-lanes.md
4. .agents/skills/new-site-workflow/SKILL.md
5. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
6. .agents/skills/astro-site-design/references/landing-page-archetypes.md
7. .agents/skills/site-art-direction/references/design-iteration.md
8. .agents/skills/site-art-direction/references/reference-research.md
9. .agents/skills/new-site-workflow/references/copywriting.md
10. .agents/skills/new-site-workflow/references/brief-platform-content.md
11. .agents/skills/astro-site-design/SKILL.md

(A Glob listed the contents of `.agents/` to find the skill files; no file content was opened from that listing beyond the files above.)
