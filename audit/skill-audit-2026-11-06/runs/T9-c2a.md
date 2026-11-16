## Answer

### Route and process (what the repository requires first)

- Five routes (home, prints, stationery, workshops, visit), one locale (English), no integrations named: this is the **Express track** (`new-site-workflow`). Art direction sits at Express Checkpoint B (Stages 4 to 4.5). Nothing visual is built until the Art Direction Record is saved in `AGENTS.md` and `npm run check:art-direction -- --require-record` passes. Then tokens are seeded (`npm run design:tokens -- --init-client --lane <lane>`) and primitives are calibrated on `/_styleguide`, with notes in `audit/component-calibration.md`.
- **Design surface: HTML/browser concepts.** No canvas has been mentioned, and the repository says to default to HTML/browser in that case. Brilliant, OpenPencil and Penpot are named once as optional, and the offer is not a blocking stop. Two or three *structurally distinct* directions go under `audit/visual-concepts/<round>/` with one comparison page. Colour skins of one layout do not count. I would recommend the direction below and say why. The concept quality gate table (hero idea, real proof, ground and atmosphere, imagery, section variety, source quality per slot and the rest) is filled before the owners see anything.
- All photographs go through `npm run media:prepare` and into `src/assets/` or the media library. Originals stay out of Git.
- Working assumptions, labelled as reversible: the profile is `static` (the printers or an agent edit files; ask about editing needs before choosing a CMS). Density is balanced to spacious, because the brief gives no cue and the lane is reading-led. The prints, stationery and workshops routes each need a real next step (see the offerings section). How a print is bought, how stationery is commissioned and how a workshop is booked are open questions for the owners. I would not invent prices, dates, terms or a shop.

### 1. Aesthetic lane: Editorial Paper

**Reason.** The lane's own narrative anchors include letterpress ink bleed, bookbinding and unbleached cotton bond paper. The lane suits a literary, print-led voice, reading-led density, hairline ink rules and square corners. A bakery-and-presses workshop with good photography has no use for Technical Systems (monospace telemetry), Luminous Futurism (glass, dark glow) or Product-Led Minimalism (a SaaS feel). The lane is a hypothesis, so it is adapted rather than copied.

- **Narrative metaphor:** a proof sheet pulled on the press. The page is cotton paper. Photographs sit like tipped-in plates, with a wide margin, a thin rule and a caption beneath. One spot colour, such as a vermilion or oxblood ink, is the "second pass" and appears only on actions and one or two marks. Concrete effects: wide paper margins, rule-based dividers (brass rules between sections), photographs that are never full-bleed wallpaper behind text, and a slight "impression" feel from a restrained grain on the page ground. It stays absent from functional semantics: form controls, focus rings, the address and the opening hours stay plain and legible.
- **Typography:** two voices. A high-contrast transitional or modern serif for display (for example Newsreader, Fraunces or Instrument Serif) and a legible book serif or quiet grotesque for body. Fonts must be self-served through the Astro fonts API and checked for licence, weights and language coverage. No monospace voice (the site has no code, data or measurement, so mono would be a costume). The italic accent voice is not used by default. The brand voice is literary, so it could carry one italic emphasis in a body pull-quote, not in every headline.
- **Tokens:** warm unbleached canvas, ink-black text, one spot accent, 1px ink hairlines, 0px radius, spacious reading-led density, about 65ch measure. Check WCAG AA contrast, because the spot colour on paper must still pass.
- **Expressive range:** composition is moderately varied (few routes, a strong point of view, so it can spend variety on the home page). Motion is quiet (a slow reveal at most, with reduced-motion honoured). Density is spacious, because there are few high-value actions and the copy and photographs carry the brand.

### 2. Header and navigation archetype: Editorial Hairline Masthead (with one recorded deviation)

- A serif wordmark on the left, five plain text links (Home is the wordmark; Prints, Stationery, Workshops, Visit), and one ink rule beneath. The Visit link may carry a small hours note ("Open today until 5") only when the owners confirm real hours. It is a plain text link, not a button.
- **Reason for the archetype.** It is the default pairing for Editorial Paper in `site-art-direction`. Floating glass is explicitly one of the lane's anti-patterns. Five items fit comfortably, so no capsule or burger is needed on desktop. Keep real `<nav>` semantics, a visible current page marker and a keyboard-friendly collapse on narrow screens.
- **Deviation from the archetype's example:** no numbered indices (`01 Prints`, `02 Stationery`). The repository's own generic-fingerprint check lists numbered section indices as a generated-site tell, allowed only when the sequence carries information. The five pages are not a sequence, so numbers would be decoration. Record this as a specific exception.
- **Call to action in the header:** none competing with the nav. The three offerings have different next steps, so one global "Book now" button would be wrong for two of them.

### 3. Hero visual strategy: art-directed photography

Following the first-match rule in `site-art-direction`: the brief fixes no treatment, the offer is not software, not a multi-service studio capability stage (the three offerings are one craft, and a "capability matrix" would be agency framing), and it is a place and a craft with cleared, good photography. So: **Art-Directed Photography / Editorial Frame**.

- One real photograph, chosen for the strongest single image of the workshop: a press in the bakery, or hands at the type case. Not a collage or a slider. It is shown as a framed plate with a deliberate aspect ratio, a hairline border and a caption. The hero image is prepared with `media:prepare` and passed `loading="eager" fetchpriority="high"` (it is likely the LCP element).
- Composition: asymmetric split (copy about 5 columns, plate about 7), headline and one short literary standfirst. The photograph must be a source wide enough for 2x at its rendered width. A source that is too small is replaced, not stretched.
- The headline says what they do and where in plain language, with no outcome formula and no invented numbers. The hero action is "See the prints", with the two other offerings reached from the very next section. Do not give the hero three buttons.
- **Reason.** The hero is the visitor's first proof of the offer, so it must show the real thing: the presses. A live-coded console, stock art or an illustration would be a stand-in. The skill says stand-in visuals block a direction review.

### 4. Home page section sequence

Each consecutive section changes geometry (no two identical 3-column card rows), and only one rhythm breaker is used.

1. **Masthead and hero.** Asymmetric split: headline, standfirst, one action, one framed plate with caption.
2. **The three trades.** A hairline ledger of three rows, not three equal cards. Each row has its own photograph (a print, a stationery suite, a workshop in progress), a plain label, one sentence and its own next step. See section 5. The rows can alternate image side. This is the section that answers "what do you sell?" within the first scroll.
3. **The bakery and the presses.** A narrative band with a sticky or side-set text column and two or three photographs of the presses and type cases (a real story: why a bakery, which presses). This replaces the proof strip, because there are no customer numbers and no press coverage.
4. **Work in progress.** A short run of plates in an asymmetric layout showing a piece going from composing stick to forme to press to finished sheet, captioned with real production facts. This is the honest alternative to testimonials. It documents process and craft, and it is the one place where numbered plates are earned, because the order is a real sequence.
5. **Next steps by intent.** A compact band with the next workshop date (only when the owners supply a real date), a stationery enquiry route and a link to the visit page. This is the single "rhythm breaker": an ink-dark (`data-surface="dark"`) or deeper-paper closing band with the address and opening hours, because the content changes register from showing to going. If no workshop date exists yet, say how dates are announced instead of inventing one.
6. **Footer.** Address, hours, contact and navigation, plus privacy and legal links as needed.

Left out on purpose: a logo ticker, a metrics strip, testimonials, an FAQ with schema (add it only to the workshops page if the owners have real recurring questions), and a "how it works" funnel. The default landing-page build order in `landing-page-archetypes.md` explicitly allows omitting unsupported proof, and says never to invent it. LocalBusiness structured data can go on the home or visit page with the real address and hours.

### 5. How the three offerings are presented and labelled

- **Labels.** Use the same plain words everywhere (nav, home row, page H1, button, breadcrumb, title tag): **Art prints**, **Wedding stationery**, **Workshops** (the page name can be "Workshops", with "One-day letterpress workshops" in the heading). Do not invent cute names. The brand voice lives in the sentence under the label, not in the label itself, so the visitor can find each offering.
- **Equal standing, different jobs.** The three are sold side by side, so they get equal weight on the home page and in the nav, but each one gets its own call to action because the actions differ: browse prints, enquire about stationery, book a workshop day. The wording of the actions is verb plus concrete deliverable, for example "See the prints", "Ask about your invitations", "See workshop dates". Not "Learn more". Confirm the real mechanism with the owners before writing the buttons (shop, email or form, booking system), and do not invent terms or a guarantee.
- **Each inner page has a different composition,** because the content differs:
  - *Prints:* an image-led index (a grid of plates with irregular spans, filterable only if there are enough works to need it). Each print is captioned with title, size, paper and edition if real.
  - *Stationery:* a commission-led page: the suite types they print, a short process from enquiry to proof to print (this sequence is real, so numbered steps are earned here), paper and ink choices, and an enquiry route.
  - *Workshops:* a practical page: what happens in the day, who it is for, what to bring, group size, date list and a booking action. Facts that are not supplied are labelled as owner-to-supply, not invented.
- **Visit page:** address, opening hours (as real text and a table, not an image), how to find the bakery, access notes, a map link and a photograph of the entrance. Keep it task-first and plain; this is where density drops to "tell me quickly".
- **Cross-linking:** each inner page ends with a quiet link to the other two offerings (not a repeated large band), so a visitor who came for prints can discover stationery and workshops.
- **Reason.** The audience arrives with one of three different intents. Equal cards would hide the different next steps, and a funnel-style single CTA would suit only one offering. A ledger with alternating image side avoids repeated card geometry and fits the lane's rule-based surfaces.

### 6. How photographs are captioned

- Every plate gets a real caption in the body voice or a small italic, beneath the image, in a `<figure>`/`<figcaption>`. A caption says what it is and how it was made, drawn from facts the printers can confirm: the press (for example "Platen press, 1950s" only if true), the typeface and size, the paper, the ink colour, what stage the piece is at, and for a finished print its title and edition. Captions are written with the owners, not guessed.
- Distinguish stage in the caption text: "work in progress", "proof", "finished". Visitors can then tell what they can buy from what shows craft.
- **Numbering.** The skill's photography recipe suggests archival "FIG. 01" captions. I would use numbered plates only where order is real (the process run on the home page and the stationery process). Everywhere else captions are unnumbered sentences. The repository warns against decorative section indices and mono labels, so the caption is not set in monospace or tracked-out uppercase.
- **Alt text** is separate from the caption and describes the image for someone who cannot see it. A caption is not a substitute. Where the caption already says everything, alt text stays short, not duplicated.
- **Consistency of frame:** one frame treatment (hairline border, margin, consistent caption position) across the site. A few crops may vary in aspect ratio for rhythm, but a photograph is never repeated in two slots on the same page. Source widths are checked against rendered width at 2x.
- **Reason.** Captions are the site's substitute for testimonials and press: they give evidence of real work and make the literary tone concrete. A caption that only repeats the page title adds nothing.

### 7. Site anti-patterns (for the Art Direction Record; two or three are required, I propose three)

1. **No fabricated proof: no invented customer numbers, testimonials, "as featured in" logos, ratings or "since" claims.** Reason: the printers have none to publish, and the repository forbids inventing facts, clients or metrics to fill a layout. Process, real work and real captions replace them.
2. **No generated-site fingerprints: no mono kicker labels above headings, no numbered section indices on unsequenced content, no italic accent word in every headline, no floating glass nav, no bento then metric strip then dark band then FAQ default sequence, no gradient text.** Reason: the lane's own anti-patterns exclude glassmorphism, neon and rounded pills, and the repository's generic-fingerprint check says each of these needs a content reason or must go. Letterpress is physical and reading-led, so decoration of this kind would contradict the brief.
3. **No fake or stand-in imagery and no letterpress clichés: no stock photos, no AI-rendered presses, no skeuomorphic wood grain, drop shadows or "distressed" textures laid over the whole page, no photographs used as full-bleed wallpaper behind body text.** Reason: the hero strategy depends on the real photographs, which are cleared and good. Heavy faux-vintage dressing would turn a working print shop into a costume, and a light grain is enough to carry the paper metaphor.

(Additional constraint, not a fourth ban: three offerings must not be shown as three identical equal cards, and the three offerings must not share a single call to action. They differ in how they are bought.)

### Open questions to put to the owners (only those that change the work)

- How is each offering transacted: online shop, enquiry by email or form, or a booking system? This changes the routes and the platform profile (static is enough for enquiry-only; a shop or booking is a separate integration and moves the work out of Express).
- Real opening hours, address, workshop dates and group sizes, and whether any prices may be shown.
- Which two or three photographs are the strongest, and who can supply captions facts.

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
- .agents/skills/astro-site-design/references/baseline-utilities.md
