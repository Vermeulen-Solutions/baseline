---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/design-sheet.mjs, tests/design-sheet.test.mjs, scripts/check-art-direction.mjs, tests/reference-research.test.mjs]
---

# Stage 5 raises each page to its references before critiquing it

The design passes after the build looked for what was wrong (Impeccable's critique, the composition audit's template signs), and the trial builds came out clean and still far below the studio-built sites they were meant to reach. The lists of generated-page tells do not separate the two: measured on three studio-built sites, small capitals, mono labels, middle dots and arrows appear more often there than in the trials. And the references a trial selected were tidy shops in the trade, captured one screen deep, so the bar it worked to was low.

- Stage 5 starts with a comparison pass. Each representative page is captured beside its selected references on one sheet (`npm run design:sheet`); one fresh reviewer, given only the sheets, the brief and the World, names the five biggest things the references do that the page does not, as additions built from the site's own world; those are built and recorded under `### Built against the references` in the references file, for one or two rounds. `check:art-direction -- --require-comparison` checks the table (a sheet that exists and five additions per page in round 1), and every later run checks it once the table exists.
- The Impeccable critique follows as the craft pass: one round per page, a second only when the first leaves a P0 or P1 issue open.
- Reference research selects at least one studio case study (new kind `study`): the live site a small independent studio built for a small client and shows as a case study. It sets the level the concept and the built pages are compared with.
- `design:sheet` scales each image to one column, cuts each at the same number of screens (2.5 by default) and labels it.

## For sites

Copy the files and add `"design:sheet": "node scripts/design-sheet.mjs"` to `package.json`. A references file without a selected `study` now fails `--require-references`: add a studio case study to the research.
