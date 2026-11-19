---
bump: minor
platforms: [emdash, static]
areas: [styles, components, docs]
adoption: copy
visible: yes
database: no
files: [src/styles/global.css, src/lib/responsive-image.ts, tests/presentation-boundaries.test.mjs]
---

# The starter makes room for built objects and wide photographs

A design trial built its pages as objects from the site's world and found the starter in the way:

- Every list item was held to the reading measure (68ch, about 630px), so a works register, a woodpile or a wall of plates built as a list shrank to a third of its grid, and only a browser inspection found why. Classed list items, the parts of built objects, now take their grid's width; prose list items keep the measure.
- `ResponsiveImage` offered candidates up to 1400px, so a photograph shown at full width on a large or dense screen was stretched and `audit:composition` reported it as `soft-photo`. Candidates now go up to 2800px, never past the file's own width.
- The interaction rule in `AGENTS.md` allowed only opacity, transform, translate and scale, while the world-building recipes draw paths with `stroke-dashoffset` and reveal paint with `clip-path`. It now allows `rotate`, and on the world's drawn objects those two reveals.

## For sites

Copy the files. List items with a class lose the reading-measure cap: check list-built objects once on the preview. Builds produce larger image candidates for wide originals.
