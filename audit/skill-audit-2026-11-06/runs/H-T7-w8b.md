## Answer

These are the art-direction decisions I would propose for the five-page English marketing site for the freelancer time-tracking app. Nothing is implemented. They are proposals and working assumptions until the owner approves them, and they become the Art Direction Record in `AGENTS.md` before any visual implementation.

### Track and surface

- **Track: Express.** Five routes, one locale, no collections or CMS relations. Express still runs the same specialist skills and gates (`check:art-direction`, `design:tokens`, `audit/component-calibration.md`, `verify`).
- **Working platform assumption:** the `static` profile, because no CMS or browser editing was requested and the site is typed Markdown. The owner should confirm who edits copy. This is labelled as an assumption, not an approval.
- **Design surface:** no canvas was requested, so the default is **HTML/browser concepts** under `audit/visual-concepts/`. Offer the alternatives once, not as a gate: Brilliant (editable prototyping canvas, recommended if they later ask for one), OpenPencil (local editable canvas) and Penpot (shared cloud review). The `open-design` and `pencil` MCP servers failed to connect in this session, so those two surfaces are not available right now.
- **Concept comparison (required for a new site under Express Checkpoint B):** compare two or three structurally distinct directions side by side before tokens are written. Proposed comparison below.

### Aesthetic lane

**Recommended: Product-Led Minimalism.** A time-tracking tool for freelancers is a productivity product. The lane's calm, precise, flat-plane character fits a tool people use all day, and it lets the supplied brand blue act as the single restrained accent. The lane's own anti-patterns (neon glows, decorative badges, dither patterns) also match what this audience will distrust.

Proposed comparison, one direction per file:

- **A. Product-Led Minimalism (recommended):** flat planes, single blue accent, product screenshot as the proof.
- **B. Editorial Paper:** warm paper canvas and a serif display, with the offer framed as a freelancer's ledger. Distinct, but it risks reading as a bookkeeping or consultancy brand and clashes with the product's own screenshots.
- **C. Technical Systems:** dark slate, monospace metrics, hairline cells. Strong for developer tools, but it reads as an engineering console for a non-technical freelancer audience and needs more dark UI than the brand blue suggests.

Compare them with the same hero, the same features proof and the same mobile width (390px and 1440px), then select A unless the comparison shows a clear reason otherwise.

### Narrative metaphor

**A freelancer's ruled working day:** the hairline rules of a daily timesheet, with each hour line as a faint horizontal rule.

- **Effect on composition:** hairline 1px rules structure the features page and the home "how it works" steps. The timer and the day's entries sit on the ruled grid.
- **Where it stays absent:** no paper texture, no notebook imagery, no handwritten type. It must not override the product screenshots, the logo or the brand blue.

### Typography

- **Display: Geist** (tight tracking around -0.03em, line-height 1.0 to 1.08, `text-wrap: balance`). Used for H1 and H2 only.
- **Body: Inter** (line-height about 1.6, measure 60 to 68ch). Used for all reading and UI copy.
- **Monospace: Geist Mono, earned and restricted.** Used only for durations, timer readings, hourly rates and prices, with `tabular-nums` where figures align. This is real measurement, so it is not a costume.
- **Accent (italic serif): not used.** The brand has no editorial voice to carry an italic focal word, and an italic word in every headline is a generated-site tell.

Two families, one of them mono for measurements only. Verify font licences, weights and coverage for English and for the glyphs in the screenshots during implementation. Both families are open-licence faces, but confirm this against the files actually served.

Labels:

- Sentence case for navigation and section labels. Plain verbs for CTAs (for example "Start tracking" or "See pricing"; final wording to be confirmed with the owner).
- No uppercase telemetry kickers and no decorative section indices such as "01 // FEATURES". A numbered sequence is allowed only for the three "how it works" steps, because the order carries meaning.

### Token physics

- **Canvas:** warm-neutral or cool off-white (about `oklch(99% 0.002 240)`) for the page, with a slightly tinted `--color-surface` for alternating bands. Light mode is the default. Dark mode is handled by the tokens, not designed in this pass.
- **Action/Accent:** the supplied brand blue, used only for primary CTAs, links, focus and the active nav state. The exact hex was not in the brief; take it from the brand file. Check contrast for text and link use. If the brand blue fails WCAG AA as text on the canvas, darken it for text only and keep the original for filled buttons.
- **Borders:** 1px hairline borders (`--color-border`, `--color-border-strong`), 8px radius on cards and screenshot frames, 6px on buttons. No pills (9999px). No glass.
- **Spatial density:** Standard (balanced) with shared layout spacing. Express uses shared defaults, so this is recorded as an assumption, not as a question to the owner. Pricing is the one place where density rises (see below).
- **Surfaces:** three tiers (`--color-page`, `--color-surface`, `.surface-elevated`). The header uses the elevated tier, not blur.

Layout spacing, for the owner: sections and grids adapt to screen size through shared settings, and individual layouts can have their own spacing. This is the recommended default.

### Header and navigation

**Floating capsule on a solid lifted surface.** That means the Product-Led lane's default: the same capsule geometry as the glass archetype, but on `.surface-elevated` with a 1px border and no `backdrop-filter`. Glass is not used because this lane's surfaces are flat planes.

- Items: wordmark (links to Home), Features, Pricing, About, Contact. Five items fit a capsule, so no mega menu.
- Optional primary CTA in the capsule (wording to confirm). Avoid duplicating the Contact link as a CTA if the CTA points to Contact.
- On mobile: the capsule collapses to a native disclosure menu with a visible label, not an icon-only control.

### Hero visual strategy

The offer is software, so the hero rule's branch (b) applies: **a live-coded specimen** built from HTML, CSS and SVG (`.ui-specimen`, `.ui-specimen__header`, `.tabular-nums`, `.status-dot`). It is a small interactive timer and day view that shows real product states, using the same labels and layout as the screenshots. It must never be a blurry raster.

- **Supplied screenshots are not the hero.** They are the proof further down (features and pricing). They must be prepared with `npm run media:prepare`, with source resolution at least 2x the rendered width, and captioned with what they show.
- If the owner prefers the real screenshot as the hero, record it as a specific exception. It is acceptable only as a sharp, prepared, full-resolution image.
- The hero copy names the outcome for a freelancer (tracking time, knowing what is billable, getting paid for it). Do not claim figures.

### Home page section sequence

Each section needs real material behind it. Where material is missing, the section is omitted, not filled. There are no usage statistics, so there is no metric strip.

1. **Split hero:** headline, one supporting sentence, primary CTA, live-coded specimen on the right at desktop and stacked below at mobile.
2. **Ledger of three steps:** start, review, send (or the three steps the product actually supports, confirmed against the screenshots). Hairline-ruled rows, numbered because the sequence carries meaning.
3. **Feature spotlight:** a sticky narrative column on one side with a large prepared screenshot on the other. This is a real product proof, and it breaks the card-grid pattern.
4. **Second feature spotlight, mirrored:** the same split with the reverse alignment, showing a different screen. Keep it to one or two extra spotlights, not a grid of six.
5. **Customer quotes:** the three supplied quotes in an asymmetric block, one large and two smaller, not three identical cards. Use names and roles only as the customers approved them. If permission for names is unclear, ask before publishing.
6. **Closing CTA:** full-width hairline band, not a dark band. One sentence, one button.
7. Footer with contact pointer.

No FAQ until the owner supplies real questions. No pricing table on home; a single link to Pricing is enough.

### Pricing page section sequence

Pricing is a comparison task, so the composition is more orderly and the density rises. This follows the density table in the skill: visitors compare items, so variation costs scanning speed.

1. **Short intro:** a plain headline and one sentence, no hero specimen. Plain statement of what is included.
2. **Plan comparison table:** uniform rows, the one place in the site where identical rows are correct, because the task is comparison. Prices are not supplied in the brief, so the table is a clearly marked draft structure with placeholder cells until the owner supplies real plan details. Do not invent prices.
3. **Feature inclusion detail:** a compact list of what each plan includes, drawn from the real product.
4. **One customer quote:** placed near the table as proof. Use only a supplied quote.
5. **Billing questions:** only if the owner supplies the real answers, for example cancellation or invoicing. Otherwise omitted.
6. **Closing CTA to Contact.**

### Other pages (for the record)

- **Features:** a richer sequence of screenshot-led sections alternating left and right, with the hairline ledger motif.
- **About:** a short narrative plus the two-person team. Use a real portrait only if one is supplied. No invented team photos.
- **Contact:** a plain form and the company's real contact details. Form and submission behaviour are a separate decision.

### Site anti-patterns (with reasons)

1. **No invented proof: no metric strip, "trusted by" logo wall, user counts or star ratings.** The owner has no usage statistics to publish and only three quotes. Invented proof is the first thing a freelancer will distrust, and it breaks the art-direction rule against stand-in content.
2. **No glass header, glow gradients or neon accents.** Glass and luminous treatments belong to the Luminous Futurism lane. On a calm productivity tool they read as an AI-product cliché, and the brand blue should carry the accent alone.
3. **No identical three-column feature card grid repeated across Home and Features, and no decorative mono kickers or numbered section indices.** Identical cards are the generated-site tell, and the screenshots are the real content that should carry the page. Mono is earned only for durations and prices.

### Open items for the owner (one question at a time, in chat)

- Confirm the three to five feature facts that the screenshots show and the three steps for "how it works".
- Provide the exact brand blue hex and the logo files, and say whether the customer quotes may carry names and roles.
- Supply plan names and prices for the Pricing table, or confirm the table stays a draft until then.
- Confirm who will edit copy after launch, since that decides whether the platform stays static.

### Checks before implementation

- Save the complete Art Direction Record in `AGENTS.md`, then run `npm run check:art-direction -- --require-record`. The lane, metaphor, typography, token physics and anti-patterns above map to that schema.
- Run `npm run design:tokens` and `npm run test:design`, including the contrast pairs for the brand blue on the canvas.
- Calibrate primitives on `/_styleguide` before page assembly, and record the results in `audit/component-calibration.md`.
- Preview at 390px, 768px and 1440px. Check the header collapse, the specimen stacking and the pricing table's overflow on mobile.

### Art Direction Record (proposed, not yet saved)

```markdown
## Art Direction Record
- **Aesthetic Lane:** Product-Led Minimalism — productivity tool for freelancers; calm flat planes, single brand-blue accent, real screenshots as proof.
- **Narrative Metaphor:** A freelancer's ruled working day — 1px hairline rules as timesheet lines; no paper texture, notebook imagery or handwriting; never overrides screenshots, logo or brand blue.
- **Typography Pairing:** Display: Geist, Body: Inter (Monospace Geist Mono restricted to durations, prices and timers; accent italic not used). Rationale: neutral modern grotesque pairing suited to a tool; weights and English glyph coverage to verify in implementation.
- **Token Physics:**
  - Canvas: off-white page (about oklch(99% 0.002 240)) with tinted surface bands; light mode default.
  - Action/Accent: supplied brand blue for CTAs, links, focus and active nav only; darken for text if contrast fails.
  - Borders: 1px hairline, 8px radius on cards and frames, 6px on buttons; no pills, no glass.
  - Spatial Density: Standard (balanced), shared layout spacing; pricing comparison rises in density.
- **Site Anti-Patterns:** No invented metrics, logo walls, user counts or ratings; no glass header, glow gradients or neon accents; no identical three-column card grids or decorative mono kickers and numbered section indices.
```

## Files read

- AGENTS.md
- README.md
- .agents/skills/site-art-direction/SKILL.md
- .agents/skills/new-site-workflow/SKILL.md
- .agents/skills/site-art-direction/references/aesthetic-lanes.md
- .agents/skills/site-art-direction/references/design-iteration.md
- .agents/skills/site-art-direction/references/brand-assets.md
- .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
- .agents/skills/new-site-workflow/references/express-track.md
