# Building the site's world

Read after [distinctive direction](distinctive-direction.md) names the governing idea, and before concepts. The governing idea says what the site is; this step builds it. Required for every new site and new direction; the Art Direction Record's `World` and `Decisions` fields hold the result, and `check:art-direction` checks them with the reference research.

## Why

Measured on their home pages, sites built by small independent studios for a race, an embroidery shop and a school render 650 to 1,200 elements, three type voices in 20 or more sizes with a display line up to eight times the body size, 30 to 45 colours, 13 to 120 drawn SVG objects, rotated and shadowed pieces, and 7 to 80 running animations. Three trial builds from Baseline rendered 150 elements, one or two voices in 9 sizes, 11 colours, no drawn object, no rotation and no animation. The trials were tidy and correct and looked like templates: every section was a heading, a paragraph, a photograph and a ruled list.

The studio sites are made of **objects from the subject's world**: race tickets with a perforated tear line, a timetable board, a records board with names stamped on it, an elevation chart over layered hills; embroidery hoops framing the photographs, hang tags, a rack of thread spools, a linen swatch on which the visitor's initials stitch themselves; a printed term catalogue with a cover, a contents page with leader lines, generated course covers and a reply card. Every section is a thing, dressed in its material, and every thing comes from the client's trade. That is the level this step aims at.

## 1. Inventory the world (infer it; never wait for the owner)

From the brief, the photographs, the place and the trade's reference research, list at least **twelve** things from the subject's material culture, in five kinds:

| Kind | Ask | A beekeeper, for illustration |
| --- | --- | --- |
| Objects | What does the trade make, use, hand over, hang up, wear? | the frame of comb, the smoker, the jar with its lid paper, the veil |
| Documents | What does it write, print, stamp, file, post? | the hive record card, the harvest label with batch number, the market price board |
| Surfaces | What are its materials and grounds? | wax, kraft paper, the honeycomb's hexagons, linen |
| Marks | What does it leave behind, measure, number? | the queen's paint dot, the batch stamp, the hive number painted on the box |
| Motion | What moves, and how? | bees tracing a path, honey running, the lid twisted, the stamp landing |

The owner's own things come first when they exist (their sign, logo, van, card, packaging, the labels on their shelves); otherwise the trade's. Never ask the owner to supply this: it is design work, and a real owner rarely has an answer. Facts are different: dates, prices, names and numbers come from the owner or stay marked placeholders.

Then choose the **source object**: the one thing the whole site is built like (the trade's own document, sign or tool), named in the governing idea. Sample the palette from it and from the photographs: four to six colours with roles (ground, ink, one or two materials, an action colour, a mark colour), not one accent on neutral.

## 2. Build the kit

Design these before any page, in the concept, and record them in `World`:

1. **Objects, one per section, on every page.** Each section of every page (the about page and the contact page too, not only the home page) is set as one object from the inventory: the programme as a ticket or a board, the services as labels or record cards, the contact as a slip to fill in, the works as plates or tags. A bare section (heading, paragraph, photograph) is allowed once per page, for a story that needs only words. Objects carry the trade's real fields as the object prints them (`BATCH 12` on a jar label, the hive number painted on a box, the stub of a ticket), in the object's own lettering. Small capitals, a mono face, middle dots and arrows are neither good nor bad in themselves: the studio sites use dozens of each, as the printing of their bibs, tickets and boards. They read as a generated page when they are chrome laid over every section of any subject: the same tracked label above every heading, a meta line of dots under every title, an arrow on every link.
2. **Surfaces, two or three.** Grounds from the materials (paper with a fine grain, linen weave, wax, contour lines, a grid only when the trade draws on one), and edges between grounds that belong to the world (a torn paper edge, a wavy line of terrain, a stitched seam, a cut line). A flat colour band between sections is the template's edge.
3. **Type in three voices.** A display face with a treatment from the world (painted, stamped, engraved, stencilled, printed; for example an offset second colour, an outline letter, a slight rotation of a stamp), a reading face, and a utility voice for labels, codes and numbers chosen from the world's own lettering (the stencil on a crate, the numerals of a price label, the typewriter of a record card, a stamp; a mono or a condensed face when that is what the world prints). Use the whole scale: labels at 11 to 13px up to a display line at six to eight times the body size on a desktop, once or twice a page (past the craft floor's 6rem cap, which the recorded World overrides; cap it at `17vi` so it fits a 320px screen with the text enlarged). Keep the other headings at half the display line or less, so it reads as the page's statement: `audit:composition` looks for an opening line at least twice the median heading.
4. **Depth and physics.** Objects behave like objects: tags hang and swing a little, stamps sit at 2 to 4 degrees, cards stack and fan, plates have a hard shadow when the world's objects are painted plates. One light direction for every shadow. Rotation and shadow are the object's physics, never a style applied to everything.
5. **Photographs framed by the world, never stretched.** Photographs go into the world's frames (a hoop, a mount with a number, a tag, a jar label window, a slide), with one tone treatment (`data-tone`), so they read as a designed set. A photograph is never shown wider than its own pixels: an owner's phone photograph 600 to 1,500px wide sits in an object at that width or smaller, or is cropped to a detail, and the first screen is carried by an object or a generated artefact from the world with the photograph inside it. A trial home page opened on a 1,024px photograph stretched to 1,440px, and every reviewer named it as the ceiling of the design. Full width is for a photograph whose file is at least as wide as the screen it fills; prepare it with `media:prepare -- --max-edge 2880` so a dense screen gets enough pixels (the default edge is 2400). Look at what each photograph shows before placing or captioning it: a supplied or stand-in picture can show the wrong country, trade or season (a trial's stand-in of a leak repair carried a sign in another language, which only a reviewer noticed).
6. **Generated artefacts where photographs are missing.** Make one per item from its data: a cover per course, a ring pattern per tree from its age, a hive card per colony, a route line per walk. A geometric glyph system in the site's palette is better than a stock photograph.

   **Drawings: code draws geometry; figures come from a drawn set or a photograph.** Written as SVG coordinates, an agent draws circles, rules, gauges, schematics, maps, routes, rings, labels and patterns well, and animals, food, plants, people and tools badly: it cannot see the curve it writes, and every trial's hand-drawn owl, marmot, bicycle or cheese came out as clip-art beside professional photographs. So code the geometric objects; take a figurative subject from one open-licence drawn set, `npm run design:icons -- search owl` then `npm run design:icons -- get game-icons:owl --out src/assets/drawn` (search lists figurative sets first and marks UI and emoji sets, which read as an interface or a chat; the command refuses sets that are not open, writes the credit, and warns when a second set joins the first), or show it in a photograph (cut out, framed, toned). One set per site, so every drawing has one hand. Recolouring alone leaves a set figure a logo: a trial's owl, recoloured flat, was called clip-art, and read as stencil paint only once a spray filter and stencil bridges were applied and it was shown at 780px on the log it was sprayed on. So give each figure the world's medium as a filter and a mask (a stencil sprayed on a log, an ink stamp, a brand burnt into a board, a cross-stitch, an enamel sign), show it at least 480px on its short side, and set it on the object it marks; below about 300px it stays an icon whatever the treatment ([drawing treatments](drawing-treatments.md) has the recipes). A set under CC BY needs a credit visitors can see (a credits line in the footer). Emoji sets read as chat, not as a made world; leave them for sites whose world is playful. When no set has the subject (no marmot anywhere), use the photograph or leave the subject to the words: a crude drawing lowers the page more than a missing one. Judge every drawing at full size before keeping it.
7. **Motion from the world, in four layers.** The studio sites run 70 to 140 CSS animations on a home page, with no animation library, and the page feels alive because its motion belongs to the subject: mud lands on the page, words are stamped, a route draws itself, contour lines drift with the scroll.
   - *One arrival:* the first screen arrives as a short orchestrated sequence of the world's own motions (the plate is hung, the number is painted, the display line is stamped), in at most three stages and under a second.
   - *World motions:* three to five named motions from the world (the stamp lands, the route draws itself, the thread stitches, the label is torn off, the board flips), each on the object it belongs to, bringing the objects in as the visitor scrolls. A shared quiet entrance (`data-reveal`) can carry the plain text and lists between them, as it does on the studio sites. Each world motion is a CSS animation whose `@keyframes` name is the name in the record (`stamp-lands`), so the audit can see it run; a trial recorded four motions and built two.
   - *Ambient:* one or two slow loops that keep the world alive (a ticker of the trade's words, drifting contour lines, sawdust settling), 8 seconds or longer per cycle, on a decorative layer, paused on hover and focus.
   - *Feedback:* motion that answers the visitor (opening, choosing, confirming) shows what changed, and the feature's own state changes carry most of it ([interaction motion](../../astro-site-design/references/interaction-motion.md)).

   Two more carry the world across the site. *Between pages:* set `SiteShell transitionStyle` (fade, lift, curtain, wipe) or a page's `data-arrive` to the one that matches the world (a curtain for a stage, a wipe for a sign being repainted), so a page change is part of the world, not a cut; trials that built rich pages left every page change a plain cut. *The scroll itself:* when the site's job is the impression and its sections are staged on the scroll, smooth the wheel scroll ([smooth scroll](../../astro-site-design/references/smooth-scroll.md)); when the visitor comes to do something, leave it native.

   Everything holds still under `prefers-reduced-motion`, with the final state shown, and text the visitor is reading never moves once it has arrived.
8. **One working feature from the client's own material that does the site's job.** A tool, not a decoration: a form that composes the request the way the trade prices it, a finder that suggests where to start, a record or map built from the client's data, a configurator that shows the result before the visitor asks. Infer it from the job and the trade; build it with real behaviour and an honest fallback.

## 3. Write the decisions down

For the look, the signature feature and the content, write the **easy version** (what any agent or template would do for this trade) and **what this site does instead**, at least three entries. The easy version for a craft is a dark or cream ground, one earthy accent, a soft serif and full-width photographs; for any site, the current defaults of generated pages: a warm cream ground with a serif display and a terracotta accent, near-black with one acid accent, a broadsheet of hairline rules, identical rounded cards with one soft shadow; for a school, a hero photograph of an empty classroom and course cards; for an event, black and a loud orange. A direction whose look is the easy version is not finished, however well it is built.

## 4. Recipes

The CSS and SVG techniques below build the kit without dependencies. Decorative layers are `aria-hidden="true"`, add no layout shift (reserve their space), and keep text contrast against the actual ground.

- **Paper or fabric grain:** a small tiling texture (a 256px WebP or an inline SVG pattern of a few hundred bytes) as `background-image` on the ground, at low contrast; set `background-color` separately so a later shorthand does not wipe it. A scanned real material beats a generated noise filter.
- **Torn, wavy or stitched edges:** an SVG path as a `mask-image` or a pseudo-element at the section's top edge, in the next section's colour; stitches as a dashed `border` or a `repeating-linear-gradient` with round caps.
- **Tickets, tags and cards:** a `radial-gradient` mask for the punched notches or the hole; a dashed rule for the perforation; a ribbon as a rotated band clipped by `overflow: clip`; the string of a tag as a thin SVG curve.
- **Stamps and painted plates:** text with `text-shadow: 0.06em 0.06em 0 var(--color-mark)` for a two-colour print, `-webkit-text-stroke` for an outline letter, a 2 to 4 degree `rotate`, an inner border, and a rough mask for ink coverage when the world is printed.
- **Leader lines** in a contents page or price list: a flex row with a dotted `border-bottom` on the growing middle item.
- **Generated covers and patterns:** an Astro component that turns an item's data (code, topic, age, length) into an SVG: rings, bars, a glyph, a route.
- **Full-width objects in the shell:** the page sits in the shell's main column (capped at `--measure-wide` with a gutter) and the automatic section padding. A ground, a photograph or a band that runs edge to edge takes `class="bleed"` (expressive layer), which leaves the column and gives the gutter back to the content inside; do not widen the main column for the whole page, and do not zero section padding with a selector that outranks each section's own (a trial's flush headings came from `.page > section { padding: 0 }`). Self-hosted fonts follow [day-2 recipes](../../new-site-workflow/references/day-2-recipes.md) (files in `src/styles/fonts/` with `@font-face`, or a Fontsource package).
- **World entrances on scroll:** the object's own motion on a view timeline, inside `@supports (animation-timeline: view())`: `animation-name: plate-hangs; animation-timing-function: linear; animation-fill-mode: both; animation-timeline: view(); animation-range: entry 0% entry 45%;`, always as longhands: the production minifier folds an `animation` shorthand and an `animation-timeline` of one rule into a value browsers reject, so the motion runs on the dev server and never on the built site (`check:css` fails on it). Items of a register arrive one after another with a growing range end (45%, 53%, 61% …). Browsers without scroll-driven animations show the final state. For the plain text between objects, the starter's `data-reveal` gives the quiet shared entrance.
- **Ambient loops:** an `@keyframes` cycle of 8 seconds or longer with `animation-iteration-count: infinite` on a decorative layer, `animation-play-state: paused` on `:hover` and `:focus-within` of its section.
- **Motion:** a stamp lands with `scale(1.15) → 1` and `opacity` over 200 to 300ms; a path draws itself with `stroke-dasharray` and `stroke-dashoffset`, on scroll with `animation-timeline: view()` inside `@supports`; a ticker is a duplicated track translated by `-50%` on a loop, paused on hover and focus; a hanging tag swings with a small `rotate` from its hole on hover. Wrap all of it in `@media (prefers-reduced-motion: no-preference)`.

## 5. Check it

- On the rendered home page at 1440px, name the object every section is. A section you can only call "a heading with a photograph" is a bare section; one per page.
- Cover the logo. The world (its objects, surfaces and marks) should still say whose site it is.
- Count the voices, surfaces, named motions and drawn objects: three voices, two surfaces, three motions and the objects of the inventory. `audit:composition` prints the most animations running at once on each page and checks that each named motion runs.
- On the served build, run `npm run audit:composition -- --base <origin> --routes <the home page and one page of each kind>` from the site. It reads the record from `AGENTS.md` and exits 1 on three floor findings, which are fixed, not recorded: `bare-page` (three or more of surface, drawn objects, three voices, depth and motion missing), `soft-photo` (a wide photograph shown wider than its file) and `world-motion` (a motion named in the record that never runs). The studio sites measured above have none.
- Score the concepts beside the selected references on the [reference card](reference-research.md#3-judge-every-candidate-on-one-card).

## Record it

```markdown
- **World:**
  - Source object: <the thing the site is built like, and why it is this client's>
  - Inventory: <twelve or more, separated by semicolons>
  - Objects: <per page, the object each section is set as>
  - Surfaces: <two or three grounds and the edges between them>
  - Type: <display with its treatment; reading face; utility voice; largest size>
  - Motion: <three to five motions, each its @keyframes name in backticks, a colon and the object it belongs to: `stamp-lands`: the batch stamp on the label; ... Name the page transition, the scroll library and other starter words after them without that form: only a backticked name followed by a colon or a bracket is checked as an animation that must run>
  - Photographs: <the frames and the tone treatment>
  - Feature: <the working feature, the job it does and the material it is built from>
- **Decisions:**
  - Look. Easy: <the sector default>. Ours: <what this site does>
  - Feature. Easy: <...>. Ours: <...>
  - Content. Easy: <...>. Ours: <...>
```
