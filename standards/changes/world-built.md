---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, scripts/check-art-direction.mjs, tests/audit-composition.test.mjs, tests/world-record.test.mjs]
---

# The composition audit checks that the recorded world is built

A trial site recorded a full world (a source object, its surfaces, four named motions) and built half of it: two of the four motions never ran, the about and contact pages were bare, and the home page opened on a 1,024px phone photograph stretched to 1,440px, which every design reviewer named as the ceiling. The audit already reported the bare pages, as advice, and the trial recorded them and moved on.

- `audit:composition` gains two findings. `soft-photo`: a photograph at least 40% of the screen wide is shown wider than its file (read from the file itself, since a srcset hides the stretch in `naturalWidth`). `world-motion`: an animation named in the record's World › Motion line never runs on the audited routes while scrolling; the record is read from `AGENTS.md` in the working directory, or `--record <file>`.
- `bare-page`, `soft-photo` and `world-motion` are floor findings: the command exits 1 on them. The other findings stay advisory and fail only with `--strict`. On the three studio-built sites used to calibrate the bare page, the floor finds nothing.
- `--json` and `--out` now write `{ routes, site, named }` instead of the bare route list.
- The World › Motion line names each motion by its `@keyframes` name in backticks (`stamp-lands`: the stamp on the label); `check:art-direction` requires three.
- The world-building guidance sets an object in every section of every page, never shows a photograph wider than its pixels (the first screen is carried by an object or a generated artefact with the photograph inside), and builds each motion under its recorded name. Stage 6 and Express Checkpoint C run `audit:composition` on the home page and one page of each kind; the gate needs no floor finding.

## For sites

Copy the two scripts and their tests. A site whose record names motions without backticks fails `check:art-direction` until each motion carries its `@keyframes` name. A site that runs `audit:composition` in a script now gets exit 1 on floor findings.
