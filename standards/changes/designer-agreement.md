---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, scripts/check-art-direction.mjs, tests/audit-composition.test.mjs, tests/world-record.test.mjs]
---

# The composition audit is checked against designers' votes

Baseline's measures were run on 95 public pages that professional designers had ranked in blind pairs: six briefs, each with a page made by a designer and fifteen generated ones. Most measures move with the votes (rotated or masked objects, type sizes, drawn objects, elements). Three things did not hold up, and two habits turned out to mark generated pages.

- **The number of type voices is no longer counted.** It did not move with the votes, and four of the six designer-made pages had fewer than three. `bare-page` now reports when three or more of four things are missing (a surface, drawn objects, depth, motion). World building asks for two voices and a third only when a picture shows the world lettering its small things another way: a third voice added because a rule asked for one is how a mono label ended up over every heading of the trial sites.
- **A small label above three or more section headings** (`kicker-openings`) was on none of the designer-made pages and on every one of the best-ranked generated pages. It is a floor finding for a direction whose record has a `Sources` line and stays an advisory on older sites.
- **One italic word in an upright page heading** (`accent-word`, new) was on none of the designer-made pages and on a third of the best generated ones. It is a floor finding under the same rule. The skills no longer recommend the italic accent for a new direction; the `.font-accent` class stays for sites that use it.

Four sites built with sources then showed three more things, each now checked.

- **The label rule sees a label in any dress.** A line of a few words under half the heading's size counts in lower case or a handwritten face too: one site wrote five chalk labels above five headings and passed. The wider rule gives the same shares on the 95 pages (none of the designer-made, all of the best generated).
- **One line of text lying over another** (`text-collision`, new) is a floor finding for a direction with a `Sources` line: at the wide width, on a phone and at three depths of a pinned scene. Faint text, a fixed header, a turned object, text on a path and words printed twice in one place are left out; on 43 earlier trial sites it reports five places.
- **A third type voice is chosen from a specimen sheet** like the display face, or left out. `check:art-direction` reports a `Utility`, `Mono`, `Labels` or `Third` face in the Typography Pairing that is on no sheet in `audit/world/faces.md`. Three of four sites had added the same mono face from memory.

## For sites

Copy the files; the guidance arrives with the usual skill sync. A site whose record has no `Sources` line sees the two findings as advisories. A direction made with sources removes the labels above its headings, sets its page heading in one style and gives every line of text its own space before `audit:composition` passes, and puts a third voice on a specimen sheet before `check:art-direction` does.
