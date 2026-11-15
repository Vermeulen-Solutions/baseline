## Answer

Proposed art direction for the five-page English marketing site (home, features, pricing, about, contact). Nothing is implemented. These decisions are proposals for the Art Direction Record in `AGENTS.md`; saving that record and passing `npm run check:art-direction -- --require-record` happens before any site-specific visual work.

### Track and platform

- **Track: Express.** Greenfield, five route archetypes (at most six), one locale, at most three collections (the three customer quotes at most). Express still runs the same specialists and CLI gates.
- **Platform default: `static`.** Recommend it unless the owner needs to edit copy in a browser. Ask that question once, because it decides between static and a CMS.
- **Contact form.** It needs a submission handler. If that handler sends mail or pushes to a CRM or other third party, reassess whether this is an integration and therefore Standard.
- **Layout spacing (explain once, Express default).** Gaps and section spacing adapt to screen size through shared tokens. The owner can adjust them locally later. Use balanced density unless the brief says otherwise.

### 1. Aesthetic lane: Product-Led Minimalism (working assumption)

Reason: a time-tracking app for freelancers is a productivity utility for solo professionals. Quiet clarity, hairline structure and a single accent suit it, and the lane avoids the gimmicks that would make a small product look like a generic AI template.

- The brand supplied a logo and a brand blue, not a full brand manual. Keep the logo file and the blue unchanged as fixed commitments.
- If the logo carries its own typographic or graphic system beyond the blue, switch to **Custom / existing brand** and record that rationale instead.
- If the supplied blue fails 4.5:1 for text on the canvas, keep the exact blue for large fills and the logo, and use a deeper shade of the same hue for text links. Verify the contrast on the real hex value.

### 2. Narrative metaphor

A freelancer's working day as a clean timesheet ledger: one running timer, hairline rules between entries, tabular timestamps.

- **Visible effect:** hairline dividers in the layout, tabular figures for times and amounts, and a timer-and-ledger motif in the hero specimen.
- **Boundaries:** no desk or laptop stock photography and no decorative clock icons. The metaphor never overrides the logo or the real product screens.

### 3. Typography

- **Display (`--font-display`), required:** Plus Jakarta Sans, weights 600 and 700, tracking -0.03em, line-height about 1.05, `text-wrap: balance`. Check the font licence and serve it through the Astro Fonts API.
- **Body (`--font-body`), required:** Inter, weights 400 and 500, line-height 1.6, measure 60–68ch. If the logo already uses a specific typeface, it replaces the display choice; record that as a fixed commitment.
- **Accent (italic serif), not used.** The brand has no editorial voice to carry an italic word, and an italic word in every headline reads as a generated-site fingerprint.
- **Mono (`.eyebrow-telemetry` / `--font-mono`), optional and limited.** Use it only for real measurements: timer readouts, durations, prices and amounts, with `.tabular-nums`. Do not use it as a kicker label above headings and do not use decorative section numbers. The reason is that the site has no code or data of its own to justify a costume voice.

### 4. Token physics

- **Canvas:** cool off-white page (about `oklch(98.5% 0.004 250)`) with white `--color-surface` cards and `--color-elevated` controls. One deep neutral band (about `oklch(18% 0.02 250)`) is used only for the closing CTA.
- **Action/Accent:** the brand blue is the single accent. It is the primary button fill and the active navigation state. It is not used for body text.
- **Borders:** 1px hairline borders (`--color-border`), 8px card and button radius, no pill buttons, no fuzzy drop shadows. Use the 1px top specular highlight only on glass elements.
- **Spatial density:** Standard (balanced), matching the shared defaults.

### 5. Header and navigation archetype

**Floating Glass Capsule** (`.surface-glass`), the default for this lane. Five top-level items (Features, Pricing, About, Contact, and one primary action) fit comfortably in a centered capsule.

- The primary action label is a verb with the outcome, for example "Start tracking". Confirm the real sign-up path before using it. Do not promise a free trial unless it exists.
- On narrow screens the capsule collapses into a disclosure button with keyboard-accessible focus.

### 6. Hero visual strategy

Choice (b) from the rule set: the offer is software, so use a **live-coded UI specimen** (`.ui-specimen`).

- Build the specimen from HTML and CSS, reproducing the real timer and day-view states and labels from the supplied screenshots. Do not use a blurry raster screenshot in the hero.
- Use clearly fictional sample entries (for example "Example client") and never present sample figures as customer data or results.
- The supplied screenshots are not wasted. Use them at full resolution lower on the page (features and pricing), once each source is confirmed to be at least 2x the rendered width.

### 7. Home page section sequence

1. **Header:** Floating Glass Capsule.
2. **Hero, asymmetric split (7/5):** a single `<h1>` stating the outcome (for example, a sentence about logging time as work happens), a one- or two-sentence subheadline naming freelancers as the audience, one primary CTA, and the live-coded specimen. No kicker above the heading.
3. **Quote proof band on the elevated surface:** the three quotes, each with attribution. No logo wall and no numbers. Publish a quote only after written consent from the person named, and check the exact wording and role that the consent covers. Quotes without confirmed consent are omitted, not anonymised silently.
4. **Problem-to-solution contrast:** two columns separated by a hairline, contrasting month-end reconstruction of hours with logging as work happens. Copy stays concrete and makes no time-saving claim.
5. **Feature bento with a real screenshot:** a variable-span grid pairing one framed, full-resolution product screen with two or three smaller feature blocks. Each feature uses an outcome-first pair, with the mechanism stated plainly.
6. **How it works, three steps:** start a timer, review the week, send an invoice. Numbering `01`–`03` is allowed here only because the sequence is real.
7. **FAQ disclosure (native `<details>`):** questions ordered by objection severity (pricing, data export, client invoicing, leaving the product). Answers come only from confirmed product facts. Emit `FAQPage` JSON-LD only for answers that are published.
8. **Closing CTA band:** `data-surface="dark"` spotlight using the same primary action label as the hero.
9. **Footer:** landmarks, privacy and terms links, skip-link target.

The pacing alternates a split hero, an elevated quote band, a two-column contrast, a variable-span bento, an ordered list, a disclosure and an inverted band. No two consecutive sections share a three-column card row.

### 8. Pricing page section sequence

1. **Header.**
2. **Intro:** a plain headline stating what the plans include, and one sentence on who each plan is for. No discount language and no invented urgency.
3. **Plan cards:** two or three plans in a uniform grid. This is a comparison task, so uniform rows are a recorded exception. Prices use display type with tabular figures. The plan names and prices must come from the owner.
4. **Comparison matrix:** a native table with a caption, using `.grid-hairline` styling. Use the same rows for every plan.
5. **Billing facts:** currency, VAT and tax handling, how plans change, and cancellation. State only the terms the owner confirms.
6. **One quote** near the decision point, subject to the same consent rule.
7. **FAQ disclosure:** billing questions, plan changes, refunds only if a refund policy exists, and data export.
8. **Closing CTA band** (dark spotlight) repeating the plan action label.

The grid exception is the one place where the rule "no identical card rows" is relaxed, because comparing plans needs equal columns. Record that exception with its reason.

### 9. Typography voices and labels

- **Voices in use:** display and body only. Mono appears only for timer readouts, durations and amounts. No accent italic.
- **Labels:** navigation uses plain nouns (Features, Pricing, About, Contact). Actions use an active verb with the outcome (for example "Start tracking", "See plans", "Send an invoice" if the product supports it). Avoid "Submit", "Get started" and "Learn more".
- **Eyebrows:** no mono kicker labels above headings and no section numbering outside the process steps.

### 10. Site anti-patterns

Three semicolon-separated bans, recorded in the Art Direction Record:

1. No usage statistics, hours-saved claims, customer counts, logo wall or quote published without the named person's written consent, because the owner has no statistics to publish and an unsupported number is a false claim.
2. No stock photography of people at laptops, no floating cards with fuzzy shadows, no purple or neon gradients, because they make a small product look like a generic AI template.
3. No consecutive identical three-column feature-card rows, no decorative icon pills beside headings, and no mono kicker labels above headings, because they repeat the default SaaS page and the telemetry costume.

### 11. Art Direction Record (proposed text)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Product-Led Minimalism — quiet clarity for a solo-freelancer productivity tool; brand blue as the single accent (working assumption; switch to Custom / existing brand if the logo carries its own system).
- **Narrative Metaphor:** A freelancer's working day as a clean timesheet ledger: hairline rules between entries, tabular timestamps, one running timer. Applies to layout rules and the hero specimen only; no desk or laptop stock imagery.
- **Typography Pairing:** Display: Plus Jakarta Sans (600/700, -0.03em), Body: Inter (400/500, 1.6). Accent unused; mono limited to timer readouts, durations and amounts.
- **Token Physics:**
  - Canvas: cool off-white page with white surfaces; deep neutral band for the closing CTA only.
  - Action/Accent: brand blue for the primary fill; deeper shade of the same hue for text links.
  - Borders: 1px hairline, 8px radius, no pill buttons, no heavy shadows.
  - Spatial Density: Standard (balanced).
- **Site Anti-Patterns:** No usage statistics, hours-saved claims, logo wall or unconsented quotes; no people-at-laptop stock photos, fuzzy-shadow cards or neon gradients; no identical three-column card rows, icon pills beside headings or mono kicker labels.
```

### 12. Design surface and next steps

- **No canvas was requested,** so the default is **HTML/browser concepts** under `audit/visual-concepts/<round>/`. Present **Brilliant**, **OpenPencil** and **Penpot** once, at the concept checkpoint, as editable-canvas alternatives.
- Compare two or three structurally distinct directions side by side at `1440×900` and `390×844` before selecting one. The recommended direction above is one of them. A reasonable structurally different alternative is a Technical Systems ledger-first hero, to be compared rather than assumed.
- Run the concept quality gate before the owner sees the comparison. The fixed table covers hero idea, real proof, imagery, section variety, typography, recorded invariants, source quality per slot and the owner's other sites.
- Owner questions that change the work, asked once in chat: the real sign-up and plan facts, written consent for each quote, whether a browser CMS is needed, and the logo's own typographic system.

### Open assumptions to confirm

- Brand blue hex passes the contrast check for its intended text and fill roles.
- Logo is used unchanged, and no further identity work is in scope.
- Plan names, prices and billing terms come from the owner.
- The product has a real sign-up path, and the CTA labels describe it accurately.
- Written consent exists, or will be obtained, for each quote and its attribution.

## Files read

- AGENTS.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/brand-assets.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/new-site-workflow/references/express-track.md
- .agents/skills/astro-site-design/references/landing-page-archetypes.md
- docs/art-direction-workflow.md
