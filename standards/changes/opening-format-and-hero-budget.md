---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs]
---

# Pages that open on their content, a budget for the hero, and lane presets that are seeds

Three gaps in the design guidance, each of which let a built site fall back on a generated-page habit.

- **Opening format.** The hero strategy in `site-art-direction` was a required choice with five branches, and every branch produced a hero. It now starts one step earlier, per page archetype: a page the visitor opens to read, find or do something (a fixtures list, a programme, a news index, an article, a directory, a price list, a form) opens on that content, with the page heading and the first rows on the first screen; a page that introduces the subject opens on a hero. The page brief in `new-site-workflow` has an `Opening` field for the decision.
- **A budget for the hero.** Nothing limited what a hero holds. The rule is now written with its numbers (one or two short lines, 25 words at most; one filled button, a second action only when it is a different job; a row of figures only when it holds what the visitor came for), and `audit:composition` reports three new advisories on the first section when it holds the page heading: `hero-copy`, `hero-actions` and `hero-strip`. A row that holds an hour, a price or a date is not reported, and a first section with no button is not measured for its copy, since it may be the page's own text. The limits are working ones, not measured on ranked pages, so the three stay advisory.
- **Lane presets are seeds.** World building names a cream ground with a display serif and a terracotta accent as the easy version, while the Editorial Paper lane and the OpenDesign design-system file prescribed exactly that. Both now say what the preset seeds and that the ground, the accent and the display face come from the client's own material; the lanes reference says the same of the near-black ground with one bright accent in two other software lanes.

## For sites

Copy `scripts/audit-composition.mjs`; the guidance comes with the skill sync. Nothing changes on a built site until the audit is run: the three new findings are advisory and fail a run only with `--strict`. On a page where one appears, shorten the opening or record the content reason in the page brief.

## Considered and deferred

- The `editorial-paper` token preset itself still seeds the warm paper and the terracotta action colour. Changing a preset's values changes what existing commands write, so it is left for its own change.
- No check tells whether a page that should open on its content does: the audit cannot know a page's archetype from its markup.
