---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/design-icons.mjs, tests/design-icons.test.mjs]
---

# Figures come from a drawn set or a photograph, not from hand-written SVG

Every design trial drew its world's figurative subjects as hand-written SVG (an owl, a marmot, a bicycle, a cheese wheel), and they came out as clip-art beside professional photographs: an agent writes the coordinates of a curve it cannot see. Its geometric drawings (schematics, gauges, rings, routes, wheels) were good.

- `npm run design:icons -- search <word> [--sets <set>]` lists the open-licence sets in the Iconify catalogue that have the subject, with their licence; `get <set:name>[,…] --out <folder>` writes each SVG into the site, refuses sets that are not open or ask for share-alike, records the credit in `CREDITS.md` beside the files, says when a licence needs a credit visitors can see, and warns when a second set joins the first.
- World building: code draws geometry; a figurative subject comes from one drawn set per site, recoloured and treated as the world's material (a stencil, a stamp, a brand, a stitch), or from a photograph, or is left to the words. Stage 5 reviewers judge each drawing at full size and do not ask for more drawings as an addition on its own.

## For sites

Copy the files and add `"design:icons": "node scripts/design-icons.mjs"` to `package.json`.
