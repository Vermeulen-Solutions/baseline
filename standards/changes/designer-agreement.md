---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# The composition audit is checked against designers' votes

Baseline's measures were run on 95 public pages that professional designers had ranked in blind pairs: six briefs, each with a page made by a designer and fifteen generated ones. Most measures move with the votes (rotated or masked objects, type sizes, drawn objects, elements). Three things did not hold up, and two habits turned out to mark generated pages.

- **The number of type voices is no longer counted.** It did not move with the votes, and four of the six designer-made pages had fewer than three. `bare-page` now reports when three or more of four things are missing (a surface, drawn objects, depth, motion). World building asks for two voices and a third only when a picture shows the world lettering its small things another way: a third voice added because a rule asked for one is how a mono label ended up over every heading of the trial sites.
- **A small label above three or more section headings** (`kicker-openings`) was on none of the designer-made pages and on every one of the best-ranked generated pages. It is a floor finding for a direction whose record has a `Sources` line and stays an advisory on older sites.
- **One italic word in an upright page heading** (`accent-word`, new) was on none of the designer-made pages and on a third of the best generated ones. It is a floor finding under the same rule. The skills no longer recommend the italic accent for a new direction; the `.font-accent` class stays for sites that use it.

## For sites

Copy the files; the guidance arrives with the usual skill sync. A site whose record has no `Sources` line sees the two findings as advisories. A direction made with sources removes the labels above its headings and sets its page heading in one style before `audit:composition` passes.
