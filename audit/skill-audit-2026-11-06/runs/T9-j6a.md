## Answer

### Routing and working assumptions

- **Track:** Express. There are five routes, one locale and no integrations, which is under the Standard thresholds in `new-site-workflow`. Platform is assumed `static` (file-owned Markdown, editors are developers/agents) until the owners say they need a browser CMS. This is a labelled, reversible assumption.
- **Gate:** No site-specific visual work happens until the `## Art Direction Record` is saved in `AGENTS.md` and `npm run check:art-direction -- --require-record` passes. This answer is the content of that record plus the reasoning behind it.
- **Design surface:** No canvas was mentioned, so use HTML/browser concepts under `audit/visual-concepts/<round>/`. Offer Brilliant, OpenPencil and Penpot once, and do not make that a blocking question.
- **Concepts:** Still compare two or three structurally distinct directions side by side before tokens are written. Express shortens the decision, not the comparison. The directions should differ in hero idea and home composition, not in colour. The proposal below is the one I would recommend.
  - A: a printed-sheet / contents-page layout built around one large photograph (recommended).
  - B: a type-case layout of unequal compartments, each holding a real photograph.
  - C: a quiet, text-led layout with small framed plates.
  - Each is checked against the concept quality gate table in `design-iteration.md`.
- **Inspiration:** Ask the single "short on references?" question once. Ask for the owners' own sites, and for any print or bookshop sites they admire.
- **Questions that would change the work, to ask in chat with a recommendation:**
  1. How does each offering convert? I assume prints are bought or enquired about, stationery is commissioned by enquiry, and workshops are booked on fixed dates. This sets the CTA verbs, forms and any shop or booking integration. If there is real checkout, reconsider Express and the static profile.
  2. Are the address, opening hours, prices, workshop dates and edition details real and supplied? Nothing is invented. Missing material is a marked placeholder with an owner.
  3. Which typefaces can be legally served?

### Design problem in brief

- This is a physical craft business with three parallel offers.
- Visitors are art-print buyers, couples planning a wedding, and people deciding whether to spend a day at a press.
- Strong real photography exists and is cleared.
- There is no proof of the usual kind: no customer numbers, no press coverage, no testimonials.
- The tone is literary and print-led.
- Trust has to come from the work, the process and the place, not from claims.

### Aesthetic lane

**Editorial Paper** as the primary lane. Its own narrative anchors include letterpress ink bleed and archival paper, so the lane already matches the content.

- **Why:** The lane fits a print-led business whose product is paper, ink and type. It also keeps density spacious and reading-led, which suits a five-page site with little text.
- **Narrative metaphor:** "The locked-up forme and the type case."
  - The page reads as a sheet pulled from a press: warm paper, ink-black type, one spot colour.
  - Hairline rules act as brass rules between compartments.
  - The metaphor shows up in composition (ruled compartments, generous margins) and in the real photographs.
  - It stays absent from functional UI, from navigation semantics and from any imitation of ink texture.
- **Typography:**
  - Display is a high-contrast book serif (Newsreader, Fraunces or Instrument Serif class). Tracking is tightened modestly and line height is about 1.05-1.15.
  - Body is a legible book serif or a neutral sans at roughly 1.65-1.7 line height and 60-68ch.
  - Two voices are required and sufficient.
  - The italic `.font-accent` is optional. This brand does have a literary voice, so it may appear on at most one or two words, for example once on the home h1. It must not appear in every headline.
  - Mono and `.eyebrow-telemetry` are not used as labels. The only candidate use is genuinely tabular data: workshop dates, durations, prices and opening hours, set with `.tabular-nums`. A site with no code or measurement gets no mono costume.
  - Faces must be fonts the project can serve, with licences and weights checked.
- **Token physics:**
  - Canvas: warm bone paper, about `#F9F6F0` / `oklch(97% 0.01 85)`, with ink near `#141414`.
  - Action/accent: one pigment-like spot colour (vermilion, oxblood or forest ink), used for links, buttons and small marks only, with contrast checked.
  - Borders: 1px ink hairline rules, square corners (0 radius), no soft drop shadows.
  - Surfaces: three tiers are kept (page, surface, elevated), but they are shifts of paper tone separated by rules, not floating cards.
  - Spatial density: Spacious on the home and long-form pages. The visit and workshops pages are more compact where the task is reading times and prices.
  - A small paper-grain texture is optional. It is applied to the ground only and never over the photographs.
- **Expressive range:**
  - Composition: moderately varied. There are few routes and a strong point of view, so variety is earned.
  - Motion: quiet. At most a gentle reveal or a hover state on clickable elements, with reduced-motion honoured.
  - Density: spacious, with the exception above.

### Header and navigation archetype

**Editorial Hairline Masthead.** This is the lane's default pairing. It is a serif wordmark or logotype on the left, a single ink hairline rule beneath, and plain text links.

- **Items:** Prints, Stationery, Workshops, Visit. The wordmark links home, so the five pages are reachable and every label matches the page H1 and the home-page labels.
- **No numbering:** The order of the pages carries no sequence information, so no "01 Prints" indices.
- **No glass capsule:** Glass is one of the Editorial Paper anti-patterns and would make this look like any generated site.
- **Visit:** It is a text link in the same list, with at most a distinct style on the one primary action. Opening hours stay on the Visit page and in the footer. Do not add a status strip unless a real "open today" fact is maintained.
- **Mobile:** Four short items can use a simple disclosure or an inline row that wraps, with focus and keyboard behaviour preserved.

### Hero visual strategy

**Art-directed photography in an editorial frame.** This is the first matching rule: the offer is a place, a craft and physical goods, and usable photography exists.

- **Not used:** A live-coded console (not software), a capability stage (they sell three things, but they are a single workshop, not an agency), stock art, or generated imagery.
- **Picture:** One strong real photograph, ideally the press in the converted bakery so that the place and the craft are both visible. The first thing a visitor sees is therefore the real thing being bought.
- **Framing:** A deliberate aspect ratio, a hairline border, and a caption that says what the photograph shows. It is prepared with `npm run media:prepare`.
  - It loads eagerly with `fetchpriority="high"` and a source at least the rendered width at 2x.
  - The text stays HTML, not baked into the image.
- **Layout:** An asymmetric split (roughly 7/5), or a photograph that runs wide with the heading set beside or below it. It is not a centred headline over a full-bleed darkened image.
- **Copy and action:** A literary but concrete H1, a one-or-two-sentence subheading, and one primary action. I propose "See what we print" (to the offerings below) with a quiet text link "Plan your visit". This is an assumption pending the owners' answer on how each offering converts.

### Home page section sequence

Section order follows the visitor questions: What is this? What do they make? How is it made? Where is it? How do I take part? No metrics strip, logo ticker, testimonial band or FAQ is invented, because there is nothing real behind them.

1. **Hero:** An asymmetric split with one framed photograph, the H1 and a single primary action (see above).
2. **The three offerings as a ruled index:** Full-width rows separated by hairlines, in the order Prints, Stationery, Workshops. Each row has a finished-piece or work photograph, the name, one plain sentence and a link with its own verb. This reads like a printed contents page, so it is deliberately not a row of three equal cards.
3. **How a piece is made:** A short process section using real work-in-progress photographs (the type case, composing, inking, the pull). Numbering is acceptable here only because the sequence is real and the order carries meaning. This is the honest substitute for a proof strip.
4. **The bakery and the press:** A longer editorial block with text at reading measure and photographs that break out wider (a `.content-grid` breakout). The text is the owners' own words or a clearly marked draft. It carries the literary voice and says why the workshop is in a converted bakery, without invented history.
5. **A workshop date, only if one is real:** Next date, duration and price in tabular figures with a booking link. If no real dates exist, omit the section and let the offerings row carry the workshops.
6. **Closing visit band:** One inverted ink band, used once as the page's rhythm breaker where the content changes register from showing to visiting. It holds the address, opening hours and one "Plan your visit" action. The hours are repeated here from the same source as the Visit page.

Rhythm: no two consecutive sections share a geometry. The hero is a split, the offerings are a ruled ledger, the process is a horizontal sequence, the story is a breakout editorial block, and the closing is a single band.

### How the three offerings are presented and labelled

- **Labels:** Use the same plain names everywhere: Prints, Stationery, Workshops. These appear in the navigation, the home index, the page H1 and the footer. Do not invent brand names for the lines. "Stationery" can carry the descriptor "wedding stationery" in its first sentence.
- **Peers:** The three are shown as equals on the home page. They share one row template but each has its own photograph, so they read as three different things sold in one place. They are not coloured or iconified differently, and not numbered, because there is no sequence.
- **Each has a different job, so each page has a different composition, not a repeated card grid:**
  - **Prints:** A catalogue-style gallery. Use the uncropped gallery treatment (`PhotoGallery fit="contain"`) because a print is an object whose edges and proportions matter. Each print has a caption with title, size, paper and edition, but only where the owners supply them. The action is to enquire about or buy a print, according to the answer on conversion.
  - **Stationery:** A commissioning page. It is process-led: what a suite contains, how a commission proceeds, lead time, and how to start. Photography shows finished suites, with work in progress as evidence of the craft. It ends in an enquiry. It is not shown as a shop grid, so couples are not asked to browse it like prints.
  - **Workshops:** An information-first page: the date, duration, price, group size, what you take home, where, and a booking action. Facts are set in tabular figures, in a compact, scannable layout. A native disclosure FAQ appears only if real questions exist, in which case FAQ structured data can accompany it.
- **Actions:** One primary action per page, with a verb tied to the outcome ("Enquire about a print", "Start a stationery enquiry", "Book a workshop"), not "Learn more" or "Submit". Labels stay the same on repeats. No invented guarantees or risk-reversal claims.

### How photographs are captioned

- **Form:** A semantic `<figure>` with a `<figcaption>` under the image, in the body serif at a smaller size, in sentence case. Captions never sit over the image, which protects contrast and the picture.
- **Content:** A caption says what the photograph shows, in plain factual language with a little voice, for example the stage of the work, the press or typeface, and the paper. It uses only facts the owners supply. Finished prints carry title, size, paper and edition. Work-in-progress images name the stage. Place images name the room or object. Where a fact is missing, the caption is shorter, not invented.
- **No decorative labelling:** No "FIG. 01" numbering unless the running text actually refers to the figures. No mono kicker on captions.
- **Alt text:** Alt text is written separately. It describes the picture for someone who cannot see it, while the caption adds context. A purely decorative repeat gets empty alt.
- **Provenance:** Record that the photographs are cleared, with source and usage, in the asset notes. Stored copies come from `media:prepare`, and full-size originals stay outside the repository.
- **Source quality:** Every slot lists its source width, and the same photograph is not reused elsewhere on a page.

### Site anti-patterns, with reasons

For the saved record (three, semicolon-separated):

1. **No stand-in proof or invented credibility** (no testimonials, customer counts, "as seen in" logos, press quotes, ratings or stock/generated imagery of presses). *Reason:* none of this exists, and for a craft business whose product is trust in real work, a made-up number or logo would be dishonest. Real photographs and a documented process carry the argument.
2. **No digital-product costume** (no mono kickers or bracketed section coordinates, no numbered section indices, no "FIG." labels without references, no italic accent word in every heading, no gradient text, no glass or neon surfaces, no rounded pills or soft-shadow floating cards). *Reason:* these are the generated-site fingerprints the skills flag. Editorial Paper lists glass, neon, pills and dark gradients as its own anti-patterns, and a letterpress shop would look like a SaaS product with them.
3. **No faux-letterpress effects and no repeated card rows** (no ink-bleed filters, distressed fonts or texture laid over photographs; no run of identical three-column card grids, including for the three offerings). *Reason:* the real photographs already carry the ink and impression, and imitated effects cheapen them. The three offerings are better as a ruled index and three differently composed pages.

Review checks that follow from these: cover the logo and ask whether the page could belong to any generated site; check the hero photograph's crop and caption at 390, 768 and 1440 widths; confirm hours and address come from one source; and confirm reduced-motion behaviour.

### Handoff after approval

Write the Art Direction Record to `AGENTS.md`, run `npm run design:tokens -- --init-client --lane editorial-paper` (checking the lane identifier with `--list-lanes`), pass `npm run check:art-direction -- --require-record`, calibrate primitives on `/_styleguide` in `audit/component-calibration.md`, then build the home page and one offering page as representative routes before the rest. Nothing is implemented in this step.

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/astro-site-design/SKILL.md
- .agents/skills/site-art-direction/references/reference-research.md
