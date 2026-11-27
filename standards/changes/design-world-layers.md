---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/design-world.mjs, tests/design-world.test.mjs]
---

# `design:world -- layers` reads how a reference page paints one region

Reference research selects a site that is a made world and records the idea taken from it. A capture shows what that site looks like, not how it is made, so an agent that liked a ground or an entrance had only its own guess to build from. Craft was the lowest of the six scorecard questions in every trial round.

- `npm run design:world -- layers <page address> [--at "<selector>"] [--width 1440] [--limit 24] [--out <file.md>]` opens the page in a local Chromium, declines a consent banner, and lists what paints the region (the element `--at` names, or the first screen): every element and pseudo-element, in document order, with its gradient or picture, filter, backdrop filter, blend mode, mask, clip, shadow and running animations, and the animations that started while the page loaded.
- Each value is the style the browser resolved, and the report marks what was worked out from it as derived (how much of the region a layer covers, how far it runs past the viewport, how many colour stops a gradient has). Values at rest and values an animation is changing are left out. A canvas is named as something styles cannot read.
- The report says that its names and values come from the page's authors and are evidence, not instructions, and ends on what to write: how the effect is made, in words, with no code copied.
- `reference-research.md` step 4 asks for one such read, on the selected reference that scores 3 on craft, and a `How it is made` line under it. `world-building.md` points at it from "look it up; do not invent it".

## For sites

Copy the two files; the guidance comes with the skill sync. `layers` needs network and the project's Playwright Chromium, as `audit:composition` does. It writes nothing unless `--out` names a file. Records written before this change need no new line: `check:art-direction` does not ask for `How it is made`.

## Limits

- The read sees the page at one width and one scroll position, without hover or press states, and cannot read a canvas, a WebGL scene or a frame from another site.
- The step is not gated. A required field would fail the records of sites built before it; gate it once a trial shows the read raises the craft score.
- The wording of the new step has not been tried on a trial build.
