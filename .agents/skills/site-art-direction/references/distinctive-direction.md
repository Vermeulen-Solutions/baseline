# Making a direction distinctive

Read at the concept checkpoint of a new site or a significant redesign, before choosing the lane, and again when a rendered page looks competent but forgettable. The lanes, tokens and recipes give a site a consistent surface; they do not give it an idea. Sites built from them alone come out alike: a kicker label, a heading on the left and a lead on the right, a grid of equal cards, a band of a different colour, the same again, a centred closing call to action. Every check passes and nobody remembers the site.

The sites people remember in the same sectors (a school, a church, a sports club, a sculptor, a village association) make a few decisions that come from the subject, hold them on every page, and then build them out in craft: every section is an object from the subject's world, dressed in its materials, with type, depth and motion of its own. This reference turns the decisions into steps; [world building](world-building.md) builds them. Restraint is not the goal: a page reduced to headings, paragraphs and photographs is the template however tidy it is. Record the results in the Art Direction Record (see [the record's extra fields](#record-it)).

A trial build that followed these steps but took the easy answer at each one (the example idea from the table, a split hero called a "signature moment", every photograph in the same frame) produced a tidier version of the same template. Each step below therefore says what does not count.

## 1. Name the governing idea

Write one sentence that says what the site **is**, as an object, for its visitors. Not a mood ("warm and modern") and not a sector ("a club website"): a thing with a known form.

Write **three** candidate ideas, from the client's own material: their words (what they repeat, what they are proud of, how they describe their work), their photographs (what keeps appearing), their place, their habits. Discard the first one you wrote: it is the one any agent would write for any client in the sector. Choose the one that names something only this client has.

| Subject | The stock idea (do not stop here) | A specific idea from the client's own material |
| --- | --- | --- |
| A school | "A course catalogue" | The term as a timetable on the classroom wall, because the school is known for its Wednesday workshops |
| A church | "The building and its newsletter" | The bell tower that the village sees from everywhere, framing every photograph |
| A rowing club | "Fixtures and team sheets" | The boathouse board where crews are chalked up each morning |
| A potter | "A catalogue of works" | The kiln's firing log: each piece with its firing date, clay and glaze, the way the studio already labels its shelves |
| A village association | "A noticeboard" | The village fountain where neighbours meet, and the dates that bring them there |
| An events product | "The programme" | The door list on the night: the moment the product exists for |

The middle column is what every agent writes; it is only a starting category. The right column shows the kind of specificity to reach, invented here for illustration: never copy it, find the client's own.

The idea passes when it (a) names something no competitor could claim, and (b) changes at least three structural choices (what the home page leads with, how a list is set, how a detail page opens). If it changes only colours or an illustration, it is a mood: try again. A preserve-identity redesign can take its idea from the existing brand.

## 2. Set content as the real object it is

For each content type in the route inventory, ask what that thing looks like in the world, and set it that way instead of as a card:

| Content | As a card grid | As the real object |
| --- | --- | --- |
| Courses, classes, programmes | Equal cards with an image | A contents page or timetable: code, title, teacher, day, ruled rows (`IndexList` with `lead`) |
| Works, products, projects | Thumbnail cards | A few works large, each in its own arrangement (`MediaStage`, `PhotoSet`), and the rest as an index that previews them (`IndexList preview`) |
| Testimonials | Quote cards with stars | Letters or notes, in the writer's words, signed and dated |
| Prices | Three pricing cards | A rate card or a receipt: items, amounts in tabular figures, what is included |
| Events, fixtures | Cards with a date badge | A programme or fixtures list: date first, large, then time, place, opponent |
| History | A paragraph | A timeline with the years set large |
| Team, committee | Portrait cards | A crew list or credits: role, name, one line |
| Opening hours | A table | The sign on the door (`Hours` with the site's type) |
| Documents, minutes | Download cards | A register: date, title, size, ruled |
| News | A card grid | A dated noticeboard or a front page with one lead story |

Cards remain right for things that really are cards (a member card, a ticket). Rows ruled with hairlines suit most lists; a box around a list makes it look like a card. A grid of equal framed thumbnails is a card grid even without card borders.

## 3. Take the shapes, the palette and the type from the subject

- **Shapes from the world's objects:** the arch of the church on its photographs, the ticket's notches, the tag's hole, the folder tab of the archive (`data-shape` for photograph frames). Each shape belongs to one object and means it; shapes that belong to nothing read as decoration.
- **A palette of four to six colours with roles,** sampled from the client's own artefacts (logo, sign, packaging) and the materials: a ground, an ink, one or two materials, an action colour and a mark colour (the stamp, the paint dot). Actions keep one colour so they stay recognisable. A client's, partner's or team's colours stay inside their own material, not in the site's chrome.
- **Type from the subject, in three voices:** a display face with a reason and a treatment from the world (an engraved serif for a 19th-century building, a condensed sans painted like a sign, a stamped face for a label), a reading face, and a utility voice for the objects' labels and figures. Use the scale: one or two display lines a page at six to eight times the body size, section titles clearly smaller, labels at 11 to 13px.

## 4. Give each page archetype one signature moment

The signature moment is what a visitor describes after closing the tab. Decide one per page archetype and make it the largest and most different thing on the page. The other sections are not quiet for it: each is still one of the world's objects, fully made, at a smaller scale.

A signature moment passes **all four** tests:

1. **Only this subject.** It could not appear unchanged on a competitor's site.
2. **Different in scale or kind from everything around it.** At least twice the size of the page's other elements in one dimension (the full width of the screen, most of the first screen, a line set several times the heading size), or a different medium (the page moving as one object between pages, a map or timeline drawn to scale, a before/after comparison).
3. **Recognisable as a thumbnail.** Shrink a screenshot of the page to a quarter of its width: the moment is still the first thing you see.
4. **For the page's main visitor.** It answers the question the visitor this page mostly serves arrives with (the brief's audience for the archetype), and its size matches how many of them need it. A tool for people already inside (a members' timetable, a results table, a rota) is not a home-page moment when the home page is visited mostly by newcomers: give it its own page, link it, and let the home page carry a small piece of it at most. On an item page (one team, one product, one service) the moment shows that item's own data; the overview of every item belongs on the overview page.

A sports club's full-week training board passed the first three tests on its home page, and the owner removed it after launch: the home page is visited mostly by prospective members, and twenty rows of every team's sessions answered a member's question while pushing the ways to join down the page. The same data served both audiences as tonight's sessions on a small sheet in the hero (linking to the schedules page) and each team page opening with its own evenings.

These are **never** signature moments, however they are styled: a heading beside a photograph (the split hero), a row of three steps or cards, a grid of equal thumbnails, a ruled list on its own, a closing call to action, a photograph in the same frame and size as the others, a large heading that is the same size as every other heading on the page.

| Signature moment | Fits | Baseline capability |
| --- | --- | --- |
| The work, the place or the people at full width, words on the picture | Craft, hospitality, places, clubs | `MediaStage` |
| One sentence set as large as the column | Associations, studios, statements | `.display-fit` (once per page) |
| A list that previews what it lists, the preview growing into the page it opens | Portfolios, course lists, teams | `IndexList preview` + `SiteShell transitionStyle` + `MediaStage heroMedia` |
| A timeline or programme with dates set very large | Churches, clubs, festivals, schools | `IndexList` with dated `lead`, `--index-title-size` raised, tabular figures |
| Moving between pages as one object | Catalogues, portfolios, programmes | `SiteShell transitionStyle`, `data-arrive` |
| A ground that opens as it arrives | A long home page that needs a turn | `.bleed` + `data-scroll="open"` |

The home page's moment is in its first two screens. One moment per page: two compete; five are a demo. Check it on the rendered page at 1440px and 390px with the thumbnail test, and with `npm run audit:composition`, whose `no-signature`, `split-hero` and `uniform-gallery` findings name the usual misses.

## 5. Plan the page's pacing by weight

Write each primary page as a sequence of weights before building it: **heavy** (a full-width stage, a fitted line), **medium** (a split, a figure with text), **light** (a ruled list, a short paragraph). Vary the width (bleed, wide, reading), the ground and the density between neighbours. A page of five medium sections is the template look, however different the cards.

- Example for a club's home page: heavy (team photograph stage with the next fixture) → light (fixtures list) → medium (one story with its photograph) → light (sponsors as a ruled register) → heavy (closing line, fitted).
- Do not open every section the same way. A section heading with a kicker above it and a lead beside it is one option; a heading alone, a heading inside the picture, or no heading at all (a list that explains itself) are others.
- Do not end every page the same way. A closing call to action on every page is part of the template; end most pages on their own content and a plain, specific next step.

## 6. Decide the photographs

- **What they show:** the work, the people, the place. Lead with the strongest real photograph, not with tools or a stock texture.
- **Fewer and larger:** three photographs at full width say more than twelve thumbnails. A gallery belongs on the gallery page, and even there a few works can be large and the rest an index.
- **Different arrangements in different sections:** words beside one photograph once a page; elsewhere a pair, an offset trio of three sizes of one subject, a strip of details, a tall picture with a small one (`PhotoSet`), a full-width stage or an index. Neighbouring sections never use the same one.
- **One or two ratios** for the whole site (a portrait and a landscape), and each frame takes its photograph's ratio or a deliberate crop: never pillarbox a portrait inside a landscape frame.
- **Captions** that say what the photograph shows, in the site's voice.

### Weak or mixed photographs

Owner photographs are often phone pictures of different ages, light and colour. Weak photographs are a reason to choose and treat them, not a reason to make everything a small framed thumbnail:

- **Choose three.** Find the three sharpest, best-lit photographs of the strongest subjects; they carry the large moments. The rest go into an index or a gallery page.
- **Size by what the eye sees.** A photograph about 1000px wide looks fine at full width on a phone and at around 1000px on a desktop. Use `MediaStage bleed={false} stage="ratio"` in a wide column, or crop tighter around the subject with `focus`. Judge the result by eye at 1440px before deciding a photograph cannot be shown large.
- **Frame them in the world.** A phone photograph inside one of the world's objects (a hoop, a numbered mount, a label window, a slide) reads as chosen; the same photograph in a bare full-width rectangle shows every flaw. See [world building](world-building.md#2-build-the-kit).
- **Unify them.** One treatment on every photograph makes mismatched pictures read as a set: `data-tone="warm"` (evens out colour casts), `"mono"` (black and white), or `"duotone"` (the site's ink and paper), from the expressive layer. Choose one for the site, not one per photograph.
- **Crop to a detail.** A tight crop (the carved eye, the grain, a hand on the ball) holds up at a large size where the whole photograph does not.
- **Let type carry it.** When no photograph can be large, the page's big moment is a fitted line, and the photographs stay honest at their size.
- **Ask for the few that matter.** Name the three photographs the site needs (the team, the building, the best work) in the handoff, and why.

## 7. Check for the template look

Before broad implementation, and on every rendered primary route, run `npm run audit:composition` and look at the page from across the room:

- Cover the logo: could this be any organisation's site in the same sector? Name the elements that say whose it is.
- Is the hero a heading beside a photograph? That is the template's opening, however good the photograph.
- Count the section openings that use the same generic label + heading + lead. More than two on a page is the template. Field labels that belong to an object (a ticket's `START`, a course code) are part of the object and do not count.
- Name the object each section is. A section that is only a heading, a paragraph and a photograph is bare: one a page at most.
- Count equal grids, framed or not. More than one on a page, or one on every page, is the template.
- Is there anything at full width other than a coloured band?
- Does every page end on the same call to action?
- Does the page pass the thumbnail test of section 4?

Fix the cause in the direction and its world, not with effects that belong to no object. A finding the direction keeps is recorded with its reason in the Art Direction Record; "the photographs are low resolution" is not a reason on its own (see section 6).

## Record it

Add two lines to the Art Direction Record, after the required fields:

```markdown
- **Governing Idea:** [One sentence: what the site is as an object, the three candidates considered, and the three structural choices it decides]
- **Signature Moments:** [Per page archetype: the one moment, the capability that delivers it, and how it passes the four tests]
```

`check:art-direction` accepts the record without them, but the site's direction is not complete until they are written. The `World` and `Decisions` blocks from [world building](world-building.md#record-it) follow them; those two are checked with the reference research.
