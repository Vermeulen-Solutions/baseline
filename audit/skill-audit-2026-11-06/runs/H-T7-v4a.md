## Answer

Proposed art direction for a five-page English marketing site (home, features, pricing, about, contact) for a two-person company that makes a time-tracking app for freelancers. Nothing is implemented. The decisions below are proposals to be saved in AGENTS.md before any visual work.

### Scope and working assumptions

- Route count is five and the site is one locale, so the Express delivery track applies (AGENTS.md: at most six routes, one locale).
- The supplied logo and brand blue are fixed commitments. The logo is used as supplied and is not redrawn or simplified for this site.
- No usage statistics are published. Client logos, team photos and star ratings are not used because none were supplied.
- The three customer quotes are published only with each person's written permission and an approved name and role. The brief says they "may" be published, so that permission must be confirmed, not assumed.
- Real prices, the trial or sign-up offer, and the exact primary call to action are unknown. Placeholders are marked below and must be confirmed before copy goes live.
- The product screenshots are real, current screens of the app.
- No canvas was requested, so the concept pass defaults to HTML/browser concepts (see the design surface section).

### 1. Aesthetic lane

**Product-Led Minimalism**, with the supplied brand blue as the single restrained accent.

Reasons:
- The offer is a productivity utility for working professionals. The lane's own examples are productivity apps and professional utilities, which matches the task.
- Its optical-white canvas and single cobalt-type accent let the brand blue carry the identity without competing with it.
- Technical Systems (dark, dense, telemetry) would read as developer tooling to freelancers who are not engineers, and it would make the brand blue harder to use.
- Editorial Paper (serifs, warm paper) and Luminous Futurism (glow, glass, gradients) fight the purpose: a freelancer comparing a price and a feature needs calm, legible surfaces.

Site adaptations: the canvas is optical white (about `oklch(99% 0.002 240)`); one dark band is reserved for the closing call to action; brand blue is used for primary actions, links, focus and the selected plan only; no blue gradients.

### 2. Narrative metaphor

A freelancer's running timer and day sheet: a clock that is visibly running, and a list of the day's entries that can be checked at a glance.

Effect: this motif drives the hero specimen (a timer and entry rows) and the sequence of the how-it-works steps. Imagery is the company's own product screenshots, not office or people stock photography. Boundary: the metaphor stays absent from the logo, the functional icons, the feature comparison table and the pricing figures, where meaning must stay literal.

### 3. Hero visual strategy

Option (b) of the hero rule: the offer is software, so the hero is a **live-coded specimen** (`.ui-specimen`) built in HTML/CSS. It recreates the timer and a short day sheet with clearly fictional sample entries (for example, "Client project A") and no invented totals or claims.

Reasons:
- The first proof of a software offer should show the real thing; a built specimen of the real timer does that without blurry raster images.
- The supplied screenshots are better used as sharp, full-resolution proof in the feature sections. Their source must be at least twice the rendered width, so the owner should supply the largest originals available.
- If the specimen cannot match the real interface closely enough, the fallback is the real screenshot in a plain bordered frame, not stock art. Record that choice if it happens.

### 4. Header and navigation

**Floating Glass Capsule**, the default pairing for Product-Led Minimalism: a centred capsule with `.surface-glass`, a 9999px radius on the capsule only, and a `0.75rem` block offset.

Reasons: five top-level items fit a capsule comfortably, and the lane's default pairing matches its lifted-surface physics. Navigation items are Home, Features, Pricing, About and Contact. One primary button sits at the right; its label is confirmed with the owner. On narrow screens the navigation collapses into a native disclosure or a button with `aria-expanded`, with no client accordion script. The glass effect is kept subtle enough that text stays readable over the page.

### 5. Section sequence: home page

1. **Capsule header** (as above).
2. **Hero, split 7/5.** H1 states the outcome for freelancers in plain words, one sentence of subheadline says how and for whom, and one primary call to action. A risk reversal (for example "No card required") appears beside the action only if it is true. Right column: the timer specimen.
3. **Customer quotes as proof.** The three approved quotes sit in a `.grid-hairline` row of cells, with no logos and no numbers. Reason: a skeptical visitor meets proof immediately after the promise, and this is the only real proof available. It is not a repeated card grid.
4. **Problem-to-solution.** A short split that names the friction in plain sentences: hours that go untracked, and invoices that are written from memory. No numbers, since none are supplied.
5. **Feature variance.** Two or three alternating split blocks, each with a sharp product screenshot on alternating sides, and one `.grid-hairline` capability ledger between them. Reason: variation in geometry prevents a run of identical rows, and screenshots show the real product.
6. **How it works, three steps.** Numbered 01 to 03 because the steps are a real sequence (start a timer, review the day, send the invoice). Step names must match the real product flow, confirmed by the owner.
7. **Objection FAQ.** A native `<details>` list of three or four real questions (who it is for, whether it exports, how to cancel). Answers come only from confirmed product facts. FAQPage structured data is added only for answers that are rendered.
8. **Closing band.** One inverted `surface-spotlight` section with the same primary call to action label as the hero. This is the only dark band on the page.
9. **Footer.** Landmarks, privacy and terms links, skip-link target.

Pacing check: no two consecutive sections share the same skeleton. Each section changes geometry, so the page does not read as a stack of identical blocks.

### 6. Section sequence: pricing page

1. **Capsule header.**
2. **Intro.** H1 says what the plans are in plain language. The lead paragraph names who each plan is for. No discount or savings claims.
3. **Plan cards, two or three tiers.** Recorded exception: this is a comparison task, which genuinely needs uniform rows. Cards share one height, and the recommended plan is marked by a blue border, not a glow. A monthly/yearly switch appears only if both billing periods really exist. Prices use tabular figures, so they align in the cards.
4. **Feature comparison.** A native table with hairline rules and clear column headers, so the visitor can compare plans line by line.
5. **One customer quote** from the approved three, placed near the plans as sales proof.
6. **Billing FAQ.** Native disclosures on cancellation, invoices, tax, refunds and currency. Each answer appears only when the company has confirmed the terms; otherwise the question is omitted rather than invented. Objections come after the price comparison, which is when visitors raise them.
7. **Closing band** with the same primary call to action label used on the home page.
8. **Footer.**

### 7. Typography voices and labels

Voices (two required, one optional, one omitted):
- **Display, required:** Geist, weights 600 and 700 in use. Tracking about -0.02em to -0.03em, line-height 1.05 to 1.1, `text-wrap: balance`. Served through Astro's Fonts API.
- **Body, required:** Inter, weights 400 and 500. Line-height 1.6 to 1.68, measure 60ch to 68ch. Both faces must be checked for licence and for the weights actually served.
- **Accent (`.font-accent`), not used.** The site has no editorial voice that its words carry. An italic word in every headline is a generated-site fingerprint.
- **Monospace, limited.** Used only inside the hero timer readout, where durations are real measurements. It is not used for kicker labels, decorative section indices or card labels. Prices and durations elsewhere use `.tabular-nums` in the body face.

Labels and copy rules:
- Sentence case throughout. No uppercase telemetry kickers above headings (for example "01 // FEATURES").
- Buttons use an active verb and the concrete outcome. Generic labels such as "Submit", "Get Started" and "Learn More" are not used. The primary label is one exact phrase, repeated in the hero and the closing band, and confirmed with the owner (for example, "Start your free trial" only if a trial exists).
- Site copy is English only.

### 8. Token physics

- **Canvas:** Optical white page with a slightly lifted surface and one elevated tier for cards and controls. A dark surface only for the closing band.
- **Action/Accent:** Brand blue for primary buttons, text links, focus rings and the recommended plan. One accent only; hover darkens the same blue.
- **Borders:** 1px hairlines, 8px radius on cards and buttons. The 9999px radius is used only for the header capsule. Shadows stay soft and layered, not glowing.
- **Spatial Density:** Standard, with generous section rhythm on the hero and closing band.

### 9. Site anti-patterns

Recorded as the three bans for AGENTS.md:
1. No unconfirmed proof: no usage numbers, client logos, team headshots, star ratings or savings claims, and quotes only with written permission. Reason: none of this is supplied, and the audience decides on trust.
2. No neon, glow, blue gradient backdrops, or glass cards in the hero, pricing or closing band. Reason: heavy glow is the lane's own anti-pattern, and for a price-conscious freelancer it reads as hype.
3. No identical three-card feature grids back to back, and no decorative uppercase labels or numbered section indices. Numbers appear only where order carries meaning, such as the how-it-works steps. Reason: the lane's pacing rule, and decorative numbering is a generated fingerprint.

### 10. Draft Art Direction Record (to save in AGENTS.md)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Product-Led Minimalism; the supplied brand blue is the single accent, because the offer is a productivity utility for working freelancers.
- **Narrative Metaphor:** A freelancer's running timer and day sheet; drives the hero specimen and how-it-works sequence; absent from logo, icons, comparison table and prices.
- **Typography Pairing:** Display: Geist, Body: Inter (licence and served weights to be verified; display tracking -0.02em to -0.03em).
- **Token Physics:**
  - Canvas: Optical white page with one elevated tier; one dark band for the closing call to action only.
  - Action/Accent: Brand blue for primary actions, links, focus and the recommended plan.
  - Borders: 1px hairline, 8px radius; 9999px only on the header capsule.
  - Spatial Density: Standard.
- **Site Anti-Patterns:** No unconfirmed proof (usage numbers, logos, headshots, ratings, savings claims); no neon, glow, blue gradients or glass cards in hero, pricing or closing band; no identical back-to-back three-card grids and no decorative uppercase labels or numbered indices.
```

### 11. Design surface and process

- No canvas was requested, so the default is **HTML/browser concepts** under `audit/visual-concepts/<round>/`. Three structurally different directions within this lane are proposed: (A) timer-first specimen hero, (B) screenshot-led split hero, (C) day-sheet narrative with a stacked how-it-works stage. Each gets a comparison page with desktop (1440 x 900) and mobile (390 x 844) views.
- Offer the surface choice once: HTML is the default, and Brilliant (editable prototyping canvas), OpenPencil (local canvas) and Penpot (shared cloud review) are the named alternatives. Use one only if the owner asks for it.
- Reference research (`site-art-direction/references/reference-research.md`) is still to be read and its shortlist shown at the concept checkpoint. It was not read in this pass.
- Gate: save the record in AGENTS.md, run `npm run check:art-direction -- --require-record`, then initialise tokens with `npm run design:tokens -- --init-client --lane <lane id>` (lane id from `--list-lanes`). Calibrate primitives on `/_styleguide` before page assembly.
- Open items before implementation: the primary call to action and whether a trial exists; real prices and plan names; written permission and attribution for each quote; full-resolution screenshot originals; font licence check; the contact form's handling (a server-side form action, which is a platform decision outside this record).

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/site-art-direction/references/brand-assets.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
