# Art direction proposal: family bakery, two shops, four pages

## Answer

**Track and surface.** Four routes, one locale and a greenfield build fit the Express track (`new-site-workflow`). No canvas was requested, so the default surface is HTML/browser concepts under `audit/visual-concepts/`. Brilliant, OpenPencil and Penpot should be named once as optional canvases, not required. Nothing is implemented here.

**Design problem.** Visitors arrive to check opening hours and what is baked today, and they need to trust that the shops are real. The supplied photos of bread, ovens and staff are the strongest proof, and the hand-drawn logo is a fixed identity commitment. The generic tendency to avoid is the stock "artisan bakery" template: kraft paper, wheat, wood tables and gradient overlays.

**Assumption on language.** The brief does not name the site language. I assume the Latin-script language of the brief and will confirm it. The chosen serif and sans both cover common accents, so this does not change the pairing. If the site is non-Latin, reopen typography.

### 1. Aesthetic lane: Custom / existing brand, anchored on Editorial Paper physics

- Warm bone canvas, ink hairline rules, square or near-square corners, no glass.
- Reason: the Custom clause covers organic hospitality and photography-led craft retail, which this is. The hand-drawn logo is fixed, so the lane must frame it rather than replace it. The Editorial Paper lane is the closest physics, but its Swiss austerity and reading-led density are wrong for a scan-heavy hours and daily-bake task.

### 2. Narrative metaphor: the morning bake board

- The daily bake list and opening hours are set like a ruled ledger, the kind a baker writes on a board by the oven: hairline rows, tabular times, short labels.
- Effect: it shapes the Today and Hours modules and the shop-hours tables. Photos carry the oven and bench.
- Absent: no chalkboard texture, no handwriting display font that competes with the logo, no decorative illustration. The metaphor never alters the logo or the accuracy of hours.

### 3. Hero visual strategy: art-directed photography (option d)

- The offer is a place, craft and people, and usable photography exists. The hero is a supplied oven or bread photo, framed with a deliberate crop (tall on mobile, wide on desktop), with a small figure caption.
- The first viewport also carries a Today and Hours panel for both shops, so the top visitor tasks are visible without scrolling.
- Conditions: run `npm run media:prepare` and check the results. A full-bleed band needs a source at least 2x its rendered width. Confirm usage rights and staff consent for the photos of people before publishing.

### 4. Header archetype: Editorial Hairline Masthead

- The default for the Editorial Paper physics. Use ink rules and optional numbered nav indices (01 Breads and pastries, 02 Shops and hours, 03 Story).
- Show a compact "open today" line for each shop in the masthead or first viewport, sourced from structured hours data. Do not invent hours; use marked placeholders until the owner supplies them.
- Reason: four routes fit easily in a hairline bar. The Floating Glass Capsule is an anti-pattern for this physics and would blur the warm, hand-made feel.

### 5. Composition: orderly (lower end), one controlled variation

- Home order: split hero, then Today ledger, then two shop blocks, then a story teaser. The Story page carries the one asymmetric photo spread.
- Reason: visitors complete hours and daily-bake tasks, and variation slows scanning. Spend variation on the Story page, where the visitor is persuaded.
- Avoid a repeated three-column card grid.

### 6. Motion: quiet

- Only hover and focus feedback (underline or rule movement) and no scroll-triggered reveals on hours or bake data.
- Reason: the audience is task-focused and may include older visitors. Reduced-motion must still show the same content, which is easy when motion is this small.

### 7. Density: balanced (shared layout spacing)

- Shared spacing defaults, with balanced density. The bake and hours rows are a comparison task, so they need steady rhythm without airy editorial gaps.
- Reason: this is the brief-led default. Compact would feel clinical for a bakery. Record that layout spacing is assumed, not approved.

### 8. Display typography settings

- **Display:** a warm serif with optical sizing, such as Fraunces, served from Google Fonts. Use 500 to 600 weight and its italic only for the accent.
  - Reason: it suits bread and craft and sits beside a hand-drawn mark without a second script. Confirm the served weights before use.
- **Body and UI:** a humanist sans with a high x-height, such as Source Sans 3, at 1.6 to 1.68 line-height and a 60 to 68ch measure.
  - Reason: it is legible for older visitors and pairs with a soft serif.
- **Tracking:** -0.01em to -0.02em on the display face. Do not use the lane's -0.03em to -0.04em. Tight tracking strips the softness of a warm serif; the lane itself says to tighten less on fitted faces.
- **Line-height:** 1.05 to 1.1 for h1 and 1.15 for h2. Check that accented capitals (É, À) do not collide with the line above.
- **Wrapping:** `text-wrap: balance` on h1 and h2, with a maximum of three lines on mobile.
- **Accent voice:** `.font-accent` (the italic of the same family) on at most one focal word in the home h1. Do not use it on other headings.
- **Telemetry voice (deliberate exception):** replace the uppercase monospace `.eyebrow-telemetry` with a small uppercase sans (0.75rem, 0.08em tracking). Keep `.tabular-nums` for times and any prices.
  - Reason: a monospace instrument voice reads as lab or tech and works against the bakery feel. Record this exception.

### 9. Token physics

- **Canvas:** warm bone or flour tone, a light warm tint on the page, and no grain texture by default because the photos carry the texture. Any dark mode should be a warm crust brown, not neon.
- **Action and accent:** deep ink-brown text, and one oven or crust red-brown accent for actions, checked for WCAG AA on the bone canvas. Open or closed status uses text as well as colour.
- **Borders:** 1px ink hairlines, 0 to 2px radius on photos and buttons, no pills.
- **Spatial density:** Standard (balanced).
- Verify exact values with `npm run design:tokens` after seeding from the `editorial-paper` preset and customising, and check the contrast pairs on `/_styleguide`.

### 10. Site anti-patterns

1. Stock or generic "artisan" imagery such as wheat fields, kraft paper, wood tables and gradient overlays. Reason: the supplied photos are the proof, and generic images would contradict the real shops.
2. Hours or today's bake placed below a generic card grid or hidden behind a menu. Reason: they are the two highest-value visitor tasks.
3. Glass capsules, pastel gradients, pill buttons or a handwriting display face that competes with the logo. Reason: these are Editorial Paper anti-patterns and clash with the hand-made warmth.

### Surface and comparison

- Build two or three structurally distinct HTML concepts under `audit/visual-concepts/<round>/`, with a comparison `index.html` at 1440x900 and 390x844. Suggested directions:
  - **A. Morning board:** hours and today's bake lead the hero beside the oven photo. This is the recommendation.
  - **B. Oven frame:** a full-bleed photo hero with an hours bar below.
  - **C. Story spread:** an editorial photo spread leads the home page.
- Run the concept quality gate table from `site-art-direction/references/design-iteration.md` on each concept.
- Offer the canvas options once: "If you want an editable canvas, I recommend Brilliant; OpenPencil and Penpot are also available."

### Logo handling

- Keep the supplied logo file unchanged. Do not redraw it. Check whether it is vector or raster. Test it at the real header size and at 16, 24 and 32px for favicon use, and prepare it with `media:prepare` if it is raster.

### Gate before visual work

- Save the Art Direction Record in `AGENTS.md` using the exact schema, with the lane recorded as Custom / existing brand plus rationale.
- Run `npm run check:art-direction -- --require-record` before any site-specific visual implementation.
- Record each decision above as approved or assumed. Approval of the direction comes from the owner's chosen concept, not from the saved record.

### Connection note

- The open-design and pencil MCP servers failed to connect during this session. This proposal does not depend on them because the default surface is HTML. If the owner later wants Pencil or OpenDesign, the connection needs fixing first.

## Files read

1. AGENTS.md
2. .agents/skills/site-art-direction/SKILL.md
3. .agents/skills/site-art-direction/references/aesthetic-lanes.md
4. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
5. .agents/skills/site-art-direction/references/design-iteration.md
6. .agents/skills/new-site-workflow/SKILL.md
7. .agents/skills/new-site-workflow/references/express-track.md
8. .agents/skills/site-art-direction/references/brand-assets.md
9. .agents/skills/new-site-workflow/references/visitor-research.md
10. README.md
