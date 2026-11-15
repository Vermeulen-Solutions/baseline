## Answer

Proposal only. Nothing is implemented, no file in the site was changed, and the Art Direction Record is not yet saved to `AGENTS.md`, so `npm run check:art-direction -- --require-record` has not been run.

**Track and setup (assumed, to confirm).** Express track: five routes, one locale, no content collections (a contact form is not a collection). Profile `static`, because no CMS editing need was stated. Surface: no canvas was requested, so HTML/browser concepts are the default. The contact form needs a delivery decision (service or endpoint), which is a platform question, not an art-direction one.

### Art Direction Record (proposed)

- **Aesthetic Lane:** Product-Led Minimalism. A time-tracking tool for freelancers is a productivity utility, where quiet clarity and the real product screens carry trust. The supplied brand blue fits the lane's single restrained accent. Technical Systems suits developer tools and would make the product look like an instrument panel. Editorial Paper and Luminous Futurism would compete with the screenshots and the blue. Custom is not needed unless the logo's own geometry clashes with a grotesque display face; check that at the concept stage.
- **Narrative Metaphor:** A squared-off paper timesheet on a desk. It shows in column alignment, hairline row rules in the feature ledger, and the brand blue used as the one "active timer" mark. It stays absent from hero imagery (the product itself is the image), from decorative backgrounds, and from stock photos of people at laptops.
- **Typography Pairing:** Display: Geist (600/700). Body: Inter (400/500). Assumed, because no brand font was supplied. Both are open-licence faces; confirm licence and served weights through the Astro Fonts API at implementation.
- **Token Physics:**
  - Canvas: optical near-white page; flat surfaces; cards on a solid lifted surface with no backdrop blur.
  - Action/Accent: brand blue for primary buttons, the active navigation item, text links and the timer mark. Confirm white text on the blue passes 4.5:1 for button labels; if it does not, darken only the button fill, not the accent everywhere.
  - Borders: 1px hairline at about 8% ink; 8px radius on cards and buttons; no pills.
  - Spatial Density: Standard (balanced). Assumed, because the brief gives no density cue. Shared responsive spacing applies, as the Express track requires.
- **Site Anti-Patterns:** (1) No invented proof: no usage numbers, "trusted by" logo strips, ratings or guarantee claims, because none were supplied for publication; the three quotes are the only proof, published only with the owner's clearance and the names/roles they supply. (2) No glass or blurred navigation and no neon or gradient surfaces, because the lane's surfaces are flat planes. (3) No decorative kicker labels, mono text, numbered section indices, italic accent words in headlines, or stock imagery of people at laptops, because the site has no code or data to justify them.

### Header and navigation

Floating capsule geometry on a solid elevated surface (`.surface-elevated` with a 1px border, no backdrop blur). Brand mark on the left, unchanged from the supplied master; four items (Features, Pricing, About, Contact) and one primary action on the right. Five items fit the capsule, so no override is needed. Below 768px the items collapse into a native disclosure menu. Reason: the capsule is the lane's default masthead and suits a short navigation; a flat solid surface keeps it consistent with the product.

### Hero visual strategy

The offer is software, so the rule selects a **live-coded specimen**: an HTML/CSS timer card and the day's entries, built from the real interface's labels and layout, checked against the supplied screenshots. Do not use a blurry raster screenshot in the hero. The supplied screenshots go in the features section, and only if they are sharp at 2x; run `media:prepare` and inspect the result first. If they are too small, request the original files. Draft headline (outcome formula): "Know what you billed this week, without stopping to track it." Draft copy, to be checked against the product's real behaviour.

### Home page section sequence

1. **Hero** (split 7/5): single H1, one-sentence lead, primary action, the live-coded specimen. Risk-reversal text ("no card required" and similar) only if the owner confirms the terms.
2. **Quote band:** the three customer quotes on a hairline ledger, with attribution as cleared. No numbers.
3. **Problem to solution:** short prose beside the weekly-view screenshot.
4. **Features:** asymmetric split (sticky narrative about 5/7, with a ledger of three or four benefit-first items, each tied to a visible screen).
5. **How it works:** three numbered steps. Numbers are allowed here because the order carries information, but only if the steps are real.
6. **FAQ:** native `details` disclosures answering owner-supplied objections (pricing changes, exports, devices, privacy).
7. **Closing band:** the same primary label as the hero, on the brand-blue accent surface if contrast passes, otherwise on an elevated surface. A dark band is not needed; the page should have one rhythm breaker at most.
8. **Footer:** privacy, contact, skip link target.

Reason for this order: it follows the visitor's questions (what is it, who trusts it, does it fit my work, how does it work, what could stop me, act). It avoids the generated-site fingerprint of bento, then metric strip, then dark band, then FAQ, because there is no metric strip and no dark spotlight.

### Pricing page section sequence

1. **Short intro:** H1 plus one sentence on how plans are billed. No hero specimen.
2. **Plan cards:** a grid of two or three cards. This is the one place a card row is correct, because the comparison task needs it. Prices use the body face with tabular numerals; no mono.
3. **Feature comparison ledger:** uniform rows, which is a recorded exception because comparison genuinely needs them.
4. **One customer quote** beside the plan decision.
5. **Pricing FAQ** (disclosures): billing, cancellation, data export, invoices.
6. **Closing action** with the same primary label as the home page, plus a contact link for questions.

Do not add a "most popular" badge unless the owner confirms a real choice, a monthly/yearly toggle unless billing periods exist, or struck-through discounts. Plan names, prices and trial terms were not supplied, so mark them as placeholders to confirm.

### Typography voices and labels

- **Voice 1, Display (Geist):** used. Tight tracking (about -0.02 to -0.03em), line-height 1.05 to 1.15, `text-wrap: balance`.
- **Voice 2, Body (Inter):** used. Line-height about 1.6, measure 60 to 68ch.
- **Voice 3, Italic accent:** not used. The brand has no editorial voice for it to carry, and an italic word in every headline is a generated-site tell.
- **Voice 4, Mono:** not used. The site has no code or data to justify it; timings and prices use tabular numerals in the body face.
- **Labels:** sentence-case section headings; no eyebrow labels above headings; navigation uses plain nouns (Features, Pricing, About, Contact). Action labels use a verb and outcome, and avoid "Submit", "Get started" and "Learn more". Examples: "See pricing", "Send your question". "Start tracking time" is usable only after the trial terms are confirmed. The site is English only.

### Other decisions

- **About page:** the company has two people, so "we" is an accurate voice. Do not invent team photos or titles; add names only if the owner supplies them.
- **Logo:** keep the supplied master unchanged. Check it at header size and in one colour; do not create a new mark.
- **Analytics:** none by default, because no measurement was requested.
- **Next step:** save this record in `AGENTS.md`, run the art-direction gate, then build two or three structurally distinct HTML concepts side by side (for example this ledger direction against a brand-led direction with the blue as a large ground), apply the concept quality gate, and select one before any implementation. The reference-research step belongs at the concept checkpoint and was not run here. If the owner wants an editable canvas, Brilliant, OpenPencil and Penpot are the named options; the open-design and pencil MCP servers failed to connect in this session, so those routes are unavailable until reconnected.

## Files read

- AGENTS.md
- README.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/brand-assets.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/astro-site-design/SKILL.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/new-site-workflow/references/discovery-and-content.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
