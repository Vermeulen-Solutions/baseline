# Art direction proposal: letterpress workshop site

## Answer

### Track, surface and gate

- **Track: Express.** Five routes (home, prints, stationery, workshops, visit), one language and no collections beyond simple listings. Express covers the planning stages in three checkpoints but keeps every CLI gate (`new-site-workflow`, `express-track.md`).
- **Profile: static, as a labelled assumption.** Typed Markdown fits a five-page brochure site. Ask one question only if the owners will edit prices, workshop dates or prints themselves; that answer would move the site to `static-sveltia`. It does not change the art direction.
- **Design surface: HTML/browser concepts.** No canvas was requested, so `site-art-direction/references/design-iteration.md` defaults to HTML concepts. Offer the canvas choice once, naming Brilliant (editable prototyping), OpenPencil (local canvas) and Penpot (shared cloud review). The open-design and pencil MCP servers failed to connect in this session; they are not needed for the HTML default.
- **Compare directions before choosing.** Show two or three structurally distinct directions side by side (`design-iteration.md`). The direction below is my recommendation, not a finished choice. Differences must be in structure, not only palette.
- **Gate status.** `AGENTS.md` has no Art Direction Record yet. Nothing site-specific and visual may be built until the record is saved and `npm run check:art-direction -- --require-record` passes. Routing, copy and content modelling may proceed first.
- **Missing skill.** `AGENTS.md` names `impeccable` for rendered critique, but no `impeccable` skill is present under `.agents/skills/`. The critique pass needs an available equivalent, or it must be reported as manual.
- **Owner questions that change the work.** (1) Are prints sold online with a checkout? That changes the prints page and the navigation. (2) Who will edit and how often? (3) Do the owners speak as "we", as the studio name, or as named makers, and do they want to appear in the site? Everything else is a labelled working assumption.

### 1. Aesthetic lane

**Primary: Editorial Paper (about 70 percent).** The site is printed matter about printed matter, with a literary tone. The lane's anchors are letterpress ink, bookbinding and archival indices, which match the presses, type cases and finished pieces the client supplied.

**Secondary inflection (about 30 percent): exposed hairline cells for the prints index only.** A catalogue of prints is compared item by item, so a hairline-ruled grid helps there. It stays off the other pages.

Reason: the lane sets canvas, rules and density together. Editorial Paper is also the one lane whose anti-patterns (glass, neon, pills) would be most obviously wrong for this studio.

### 2. Narrative metaphor

**A proof pulled on the press.** The site is set like a printed sheet. Ink rules separate blocks, the way type-high furniture and rules do on a forme. Photographs sit in hairline frames like pulled proofs, with a caption set in the margin. Margins are generous, like paper.

Effect on composition: section breaks are rules, not colour bands. Effect on imagery: the photographs are framed as proofs, not dropped onto gradients.

Boundaries: no faux letterpress texture, debossed or distressed type, or decorative dingbats. The metaphor changes no navigation semantics and no reading order.

### 3. Typography pairing

- **Display: Newsreader** (high-contrast serif). Check that the chosen cut includes the optical sizes and weights used. Verify licence and that the Fonts API can serve them.
- **Body: Newsreader at text size.** One family, two voices, which is a valid direction. It suits a literary, print-led tone and gives a reading measure of about 65ch.
- **Mono voice: DM Mono, only for real data.** Opening hours, workshop dates, prices and edition counts. Not for kicker labels, section indices or decoration.
- **Accent voice: none by default.** An italic accent word is allowed only if the approved hero copy earns it. Do not put an italic word in every headline.

Reason: display and body are required; the accent and mono voices must be earned. Hours and dates are real metadata, so mono is earned there and nowhere else.

### 4. Token physics

- **Canvas:** warm bone paper in one tone, about `oklch(97% 0.01 85)`. No gradients. Paper grain is optional and off by default, because the photographs already carry the texture.
- **Action/Accent:** ink (near-black, about `oklch(18% 0.01 260)`) for text and primary actions. Vermilion (about `oklch(58% 0.22 25)`) is reserved for focus rings and one or two non-text rules. Do not use vermilion for small text unless it passes AA on the paper tone, which needs checking.
- **Borders:** 1px ink hairlines, 0px radius, no shadows. Two tiers: a light hairline for ordinary rules and a stronger ink rule for the masthead and section breaks.
- **Spatial density:** spacious and reading-led (shared layout defaults, brief-led density). Visitors come to read and look, not to scan rows of data.
- **Surfaces:** one page tone with at most one slightly lighter surface for the prints index. Dark slabs are not used by default; a rhythm change comes from a full-bleed photograph instead.

### 5. Header and navigation archetype

**Editorial Hairline Masthead, without numbers.** The wordmark sits at left in the display serif (studio name to be supplied). Five text links run at right: Prints, Stationery, Workshops, Visit. A 1px ink rule sits beneath. The current page is marked with `aria-current` and an ink underline.

Deliberate deviation from the default: the archetype usually carries numbered indices (01 Index). Here the five pages are not a sequence, so numbers would be decoration and the craft floor forbids them.

- Below about 40rem, collapse the links into a native `details`/`summary` menu. No JavaScript. Verify at 375px that the five labels fit or collapse without overflow.
- No sticky header and no floating glass capsule.
- The skip link and landmarks come from the shared shell.

### 6. Hero visual strategy

**Art-directed photography in an editorial frame** (rule d: a craft with real, cleared photography).

The rule order technically matches "several services from one studio" (rule c), which is a capability stage. I decline that reading. The three offers share one medium, letterpress, and the first proof a visitor needs is the press itself. A numbered capability matrix would also repeat the generic-fingerprint pattern.

Hero composition: the headline and one deck sentence at the full content measure, then a wide framed photograph of a press or work in progress, with one caption line. The photograph is loaded eager with `fetchpriority="high"` because it is the likely LCP element.

No button in the hero. The three offers are equal, and a button would favour one. A quiet text link to the visit page is the only action above the fold.

### 7. Home section sequence

Each section changes geometry from the one before. Consecutive card grids are avoided.

1. **Hero:** headline, deck, and a wide hairline-framed photograph with one caption.
2. **Three offers as an index of rows, not cards:** each row has a photograph on one side and, on the other, the name, one sentence and one text link. Rules separate the rows. Image sides may alternate.
3. **How a piece is made:** four steps (set, proof, print, finish) with a narrative column at left and work-in-progress photographs at right. Step numbers are allowed here because the steps are a real sequence.
4. **Breakout photograph:** full-bleed photograph of the workshop room with a caption and no overlaid text.
5. **Visit close:** address, opening hours (mono for times) and one text link to the visit page. The closing stays on paper; it does not use a dark spotlight band.

Deliberately omitted: logo strip, metrics ledger, testimonials, press band, newsletter block and FAQ. The client has no customer numbers or press coverage, so any of these would be invented proof. The work itself is the proof. A FAQ, if needed, belongs on the workshops page.

Other pages, briefly: the prints index may use a uniform grid because comparing prints is the task (a recorded exception). Stationery is a narrative page with sample spreads. Workshops is a dated ledger with mono dates and prices. Visit is plain facts.

### 8. How the three offerings are presented and labelled

- **Use the client's own nouns.** Home rows read "Art prints", "Wedding stationery" and "One-day workshops". Navigation reads "Prints", "Stationery", "Workshops" and "Visit". Each home row name matches its nav label.
- **Equal treatment.** Same sub-structure, same photograph size and no "featured" badge. Each row has three parts: what it is (one sentence), who it is for, and the next step.
- **Action labels are specific.** Examples: "Browse prints", "Enquire about stationery", "See workshop dates". Avoid "Services", "Solutions", "Shop now", "Get started" and "Learn more".
- **Prices only when supplied.** Stationery is bespoke, so "by enquiry" is the honest label unless the owner gives starting prices. Workshop prices appear only from owner-supplied figures.
- **Each offer answers a different visitor question.** Prints answers "what can I buy?". Stationery answers "can you make my invitations?". Workshops answers "can I make something myself in a day?". Keep these questions separate on the home page.

### 9. Photograph captions

- **Pattern:** one factual line under the frame, stating what is shown and where it sits in the process. For example: "Proof of a two-colour letterhead, before the second pass." Owners supply each fact.
- **No invention.** Press names, edition sizes and client names appear only when the owner confirms them. No adjectives and no claims about results.
- **Numbers only in sequences.** Fig. 01 style numbering appears in the process section, where order carries information. Elsewhere captions have no numbers.
- **Mono for real metadata only.** Edition counts and dates may use the mono voice. Captions in body text otherwise.
- **Alt text describes the image.** Meaningful photographs never get empty alt text. A full caption may let alt text stay shorter, but not empty.
- **Clearance and use.** Record each photograph's clearance and permitted use in the evidence inventory. Do not repeat the same photograph on one page.

### 10. Site anti-patterns

- Stock or generic craft imagery such as hands with coffee, ink-splash textures or bokeh shots of machines; use only the studio's own cleared photographs, because the offer is physical and stock would undermine the proof.
- Numbered section indices, kicker labels above headings, telemetry-style "01 //" labels and monospace used as decoration; mono is for hours, dates, prices and edition counts, and numbers appear only where a process sequence exists, because these are generated-site fingerprints that carry no information here.
- Glass surfaces, gradients, drop-shadow cards, pill buttons and neon or dark-mode slabs; the material is ink on paper, and these are the Editorial Paper anti-patterns.

### 11. Draft Art Direction Record (proposed, not saved to AGENTS.md)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Editorial Paper, with an exposed hairline-cell inflection on the prints index only. Print-led literary studio whose products are printed matter.
- **Narrative Metaphor:** A proof pulled on the press. Ink rules as type-high furniture, photographs framed as pulled proofs with margin captions; no faux letterpress texture.
- **Typography Pairing:** Display: Newsreader, Body: Newsreader at text size (optical sizes and licence to verify); mono voice for hours, dates and prices only.
- **Token Physics:**
  - Canvas: warm bone paper, single tone, no gradients
  - Action/Accent: ink for text and primary actions; vermilion only for focus and non-text rules
  - Borders: Hairline 1px, 0px radius, no shadows
  - Spatial Density: Spacious
- **Site Anti-Patterns:** Stock or generic craft imagery, only the studio's own cleared photographs; numbered indices, kicker labels or decorative mono outside real sequences and data; glass, gradients, pill buttons, drop-shadow cards or neon dark slabs.
```

### Items not verified in this pass

- No file in the project was changed, and no build or check was run.
- Font licences, served weights and the vermilion contrast on the paper tone are unverified.
- The existence of `npm run check:art-direction` and the other scripts named in `AGENTS.md` was not checked against a `package.json`, because it was out of scope for this read.

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/new-site-workflow/SKILL.md
4. .agents/skills/site-art-direction/SKILL.md
5. .agents/skills/site-art-direction/references/aesthetic-lanes.md
6. .agents/skills/new-site-workflow/references/express-track.md
7. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
8. .agents/skills/site-art-direction/references/design-iteration.md
9. .agents/skills/astro-site-design/SKILL.md
10. .agents/skills/astro-site-design/references/landing-page-archetypes.md
11. .agents/skills/new-site-workflow/references/brief-platform-content.md
12. .agents/skills/new-site-workflow/references/copywriting.md
13. .agents/skills/site-art-direction/references/reference-research.md
14. .agents/skills/new-site-workflow/references/discovery-and-content.md
