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

1. **Objects, one per section.** Each section of each primary page is set as one object from the inventory: the programme as a ticket or a board, the services as labels or record cards, the contact as a slip to fill in, the works as plates or tags. A bare section (heading, paragraph, photograph) is allowed once per page, for a story that needs only words. Objects carry the trade's real field labels in a small utility voice (`BATCH`, `HIVE 12`, `HARVESTED`): those labels are part of the object, not the kicker labels the template uses above every heading.
2. **Surfaces, two or three.** Grounds from the materials (paper with a fine grain, linen weave, wax, contour lines, a grid only when the trade draws on one), and edges between grounds that belong to the world (a torn paper edge, a wavy line of terrain, a stitched seam, a cut line). A flat colour band between sections is the template's edge.
3. **Type in three voices.** A display face with a treatment from the world (painted, stamped, engraved, stencilled, printed; for example an offset second colour, an outline letter, a slight rotation of a stamp), a reading face, and a utility voice for labels, codes and numbers (a mono or a condensed face). Use the whole scale: labels at 11 to 13px up to a display line at six to eight times the body size on a desktop, once or twice a page.
4. **Depth and physics.** Objects behave like objects: tags hang and swing a little, stamps sit at 2 to 4 degrees, cards stack and fan, plates have a hard shadow when the world's objects are painted plates. One light direction for every shadow. Rotation and shadow are the object's physics, never a style applied to everything.
5. **Photographs framed by the world.** Weak or mixed photographs go into the world's frames (a hoop, a mount with a number, a tag, a jar label window, a slide), with one tone treatment (`data-tone`), so they read as a designed set. A photograph runs at full width only when it is sharp and strong at that size.
6. **Generated artefacts where photographs are missing.** Make one per item from its data: a cover per course, a ring pattern per tree from its age, a hive card per colony, a route line per walk. A geometric glyph system in the site's palette is better than a stock photograph.
7. **A motion vocabulary of three to five named motions** from the world (the stamp lands, the route draws itself, the thread stitches, the label is torn off, the board flips), each on the object it belongs to, plus a hover state on every interactive object. Everything holds still under `prefers-reduced-motion`, with the final state shown.
8. **One working feature from the client's own material that does the site's job.** A tool, not a decoration: a form that composes the request the way the trade prices it, a finder that suggests where to start, a record or map built from the client's data, a configurator that shows the result before the visitor asks. Infer it from the job and the trade; build it with real behaviour and an honest fallback.

## 3. Write the decisions down

For the look, the signature feature and the content, write the **easy version** (what any agent or template would do for this trade) and **what this site does instead**, at least three entries. The easy version for a craft is a dark or cream ground, one earthy accent, a soft serif and full-width photographs; for a school, a hero photograph of an empty classroom and course cards; for an event, black and a loud orange. A direction whose look is the easy version is not finished, however well it is built.

## 4. Recipes

The CSS and SVG techniques below build the kit without dependencies. Decorative layers are `aria-hidden="true"`, add no layout shift (reserve their space), and keep text contrast against the actual ground.

- **Paper or fabric grain:** a small tiling texture (a 256px WebP or an inline SVG pattern of a few hundred bytes) as `background-image` on the ground, at low contrast; set `background-color` separately so a later shorthand does not wipe it. A scanned real material beats a generated noise filter.
- **Torn, wavy or stitched edges:** an SVG path as a `mask-image` or a pseudo-element at the section's top edge, in the next section's colour; stitches as a dashed `border` or a `repeating-linear-gradient` with round caps.
- **Tickets, tags and cards:** a `radial-gradient` mask for the punched notches or the hole; a dashed rule for the perforation; a ribbon as a rotated band clipped by `overflow: clip`; the string of a tag as a thin SVG curve.
- **Stamps and painted plates:** text with `text-shadow: 0.06em 0.06em 0 var(--color-mark)` for a two-colour print, `-webkit-text-stroke` for an outline letter, a 2 to 4 degree `rotate`, an inner border, and a rough mask for ink coverage when the world is printed.
- **Leader lines** in a contents page or price list: a flex row with a dotted `border-bottom` on the growing middle item.
- **Generated covers and patterns:** an Astro component that turns an item's data (code, topic, age, length) into an SVG: rings, bars, a glyph, a route.
- **Motion:** a stamp lands with `scale(1.15) → 1` and `opacity` over 200 to 300ms; a path draws itself with `stroke-dasharray` and `stroke-dashoffset`, on scroll with `animation-timeline: view()` inside `@supports`; a ticker is a duplicated track translated by `-50%` on a loop, paused on hover and focus; a hanging tag swings with a small `rotate` from its hole on hover. Wrap all of it in `@media (prefers-reduced-motion: no-preference)`.

## 5. Check it

- On the rendered home page at 1440px, name the object every section is. A section you can only call "a heading with a photograph" is a bare section; one per page.
- Cover the logo. The world (its objects, surfaces and marks) should still say whose site it is.
- Count the voices, surfaces, named motions and drawn objects: three voices, two surfaces, three motions and the objects of the inventory, or a recorded reason for fewer. `npm run audit:composition` reports a page with no surface, no drawn object, one voice and no motion as `bare-page`.
- Score the concepts beside the selected references on the [reference card](reference-research.md#3-judge-every-candidate-on-one-card).

## Record it

```markdown
- **World:**
  - Source object: <the thing the site is built like, and why it is this client's>
  - Inventory: <twelve or more, separated by semicolons>
  - Objects: <per page, the object each section is set as>
  - Surfaces: <two or three grounds and the edges between them>
  - Type: <display with its treatment; reading face; utility voice; largest size>
  - Motion: <three to five named motions and the objects they belong to>
  - Photographs: <the frames and the tone treatment>
  - Feature: <the working feature, the job it does and the material it is built from>
- **Decisions:**
  - Look. Easy: <the sector default>. Ours: <what this site does>
  - Feature. Easy: <...>. Ours: <...>
  - Content. Easy: <...>. Ours: <...>
```
