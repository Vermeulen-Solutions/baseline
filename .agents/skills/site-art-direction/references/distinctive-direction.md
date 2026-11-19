# Making a direction distinctive

Read at the concept checkpoint of a new site or a significant redesign, before choosing the lane, and again when a rendered page looks competent but forgettable. The lanes, tokens and recipes give a site a consistent surface; they do not give it an idea. Sites built from them alone come out alike: a kicker label, a heading on the left and a lead on the right, a grid of equal cards, a band of a different colour, the same again, a centred closing call to action. Every check passes and nobody remembers the site.

The sites people remember in the same sectors (a school, a church, a sports club, a sculptor, a village association) do not use more effects. They make a few decisions that come from the subject and hold them on every page. This reference turns those decisions into steps. Record their results in the Art Direction Record (see [the record's extra fields](#record-it)).

## 1. Name the governing idea

Write one sentence that says what the site **is**, as an object, for its visitors. Not a mood ("warm and modern") and not a sector ("a club website"): a thing with a known form.

| Subject | A governing idea that decides layouts |
| --- | --- |
| A school or a course provider | The term's course catalogue: a contents page, course codes, covers, a rate card |
| A church or a parish | Its building and its newsletter: the arch as frame, the dated history, issues of the newsletter, the order of service |
| A sports club | The fixtures list and the team sheet: results in tabular figures, squads as line-ups, the season as a table |
| A sculptor, a maker or a workshop | A catalogue of works: numbered plates with captions, the workshop bench, materials named like a label |
| A village or neighbourhood association | The noticeboard: dated notices, pinned announcements, the next meeting first |
| An events product or a venue | The programme: dates and times set large, the running order, the ticket |
| A studio or a consultancy | Its own body of work: real projects at full size, the work order, the process as a schedule |

The idea passes when it changes at least three structural choices (what the home page leads with, how a list is set, how a detail page opens). If it changes only colours or an illustration, it is a mood: try again. A preserve-identity redesign can take its idea from the existing brand.

## 2. Set content as the real object it is

For each content type in the route inventory, ask what that thing looks like in the world, and set it that way instead of as a card:

| Content | As a card grid | As the real object |
| --- | --- | --- |
| Courses, classes, programmes | Equal cards with an image | A contents page: code, title, teacher, day, ruled rows (`IndexList` with `lead`) |
| Works, products, projects | Thumbnail cards | Numbered plates, large, with a caption saying what and when (`MediaStage`, figures with captions) |
| Testimonials | Quote cards with stars | Letters or notes, in the writer's words, signed and dated |
| Prices | Three pricing cards | A rate card or a receipt: items, amounts in tabular figures, what is included |
| Events, fixtures | Cards with a date badge | A programme or fixtures list: date first, large, then time, place, opponent |
| History | A paragraph | A timeline with the years set large |
| Team, committee | Portrait cards | A crew list or credits: role, name, one line |
| Opening hours | A table | The sign on the door (`Hours` with the site's type) |
| Documents, minutes | Download cards | A register: date, title, size, ruled |
| News | A card grid | A dated noticeboard or a front page with one lead story |

Cards remain right for things that really are cards (a member card, a ticket). Rows ruled with hairlines suit most lists; a box around a list makes it look like a card.

## 3. Take one shape, one accent and one or two typefaces from the subject

- **One shape** repeated on every photograph frame: the arch of the church, the leaf of the garden, the folder tab of the archive, the court's rounded corner (`data-shape`). Mixing shapes reads as decoration.
- **One accent colour** used sparingly for actions and emphasis. A client's, partner's or team's colours stay inside their own material (their logo, their kit, their photograph), not in the site's chrome.
- **Type from the subject:** a display face with a reason (an engraved serif for a 19th-century building, a condensed sans for a sports scoreboard, a book face for a course catalogue), and a body face for reading. Set the display face large once per page (`.display-fit`), not every heading.

## 4. Give each page archetype one signature moment

Decide, per page archetype, the one thing a visitor will remember, and spend the page's visual budget there. Everything else stays quiet.

| Signature moment | Fits | Baseline capability |
| --- | --- | --- |
| The work, the place or the people at full width | Craft, hospitality, places, clubs with good photographs | `MediaStage` with real photography |
| One sentence set as large as the column | Associations, studios, statements | `.display-fit` |
| A list that previews what it lists | Portfolios, course lists, teams | `IndexList preview` |
| A timeline or a programme with dates set large | Churches, clubs, festivals, schools | `IndexList` with dated `lead`, large tabular figures |
| Moving between pages as one object | Catalogues, portfolios, programmes | `SiteShell transitionStyle`, `data-arrive`, `heroMedia` |
| A ground that opens or a footer that rises | A long home page that needs a turn | `data-scroll="open"`, `data-scroll="rise"` |

One moment per page. Two moments compete; five are a demo.

## 5. Plan the page's pacing by weight

Write each primary page as a sequence of weights before building it: **heavy** (a full-width stage, a fitted line), **medium** (a split, a figure with text), **light** (a ruled list, a short paragraph). Vary the width (bleed, wide, reading), the ground and the density between neighbours. A page of five medium sections is the template look, however different the cards.

- Example for a club's home page: heavy (team photograph stage with the next fixture) → light (fixtures list) → medium (one story with its photograph) → light (sponsors as a ruled register) → heavy (closing line, fitted).
- Do not open every section the same way. A section heading with a kicker above it and a lead beside it is one option; a heading alone, a heading inside the picture, or no heading at all (a list that explains itself) are others.

## 6. Decide the photographs

- **What they show:** the work, the people, the place. Lead with the strongest real photograph, not with tools or a stock texture.
- **Fewer and larger:** three photographs at full width say more than twelve thumbnails. A gallery belongs on the gallery page.
- **One or two ratios** for the whole site (a portrait and a landscape), applied the same way everywhere, with `focus` set where the stage crops.
- **Captions** that say what the photograph shows, in the site's voice.
- **Weak photographs:** use them smaller and in the shape, or not at all; never cover a weak photograph with text. Ask the owner for the few that matter (the team, the building, the best work) and say why in the brief.

## 7. Check for the template look

Before broad implementation, and on every rendered primary route, run `npm run audit:composition` (when installed) and look at the page from across the room:

- Cover the logo: could this be any organisation's site in the same sector? Name the elements that say whose it is.
- Count the section openings that use kicker + heading + lead. More than two on a page is the template.
- Count equal card grids. More than one on a page, or one on every page, is the template.
- Is there anything at full width other than a coloured band?
- Is there one moment on the page that only this subject would have?

Fix the cause in the direction, not by adding effects.

## Record it

Add two lines to the Art Direction Record, after the required fields:

```markdown
- **Governing Idea:** [One sentence: what the site is as an object, and the three structural choices it decides]
- **Signature Moments:** [Per page archetype: the one moment and the capability that delivers it]
```

`check:art-direction` accepts the record without them, but the site's direction is not complete until they are written.
