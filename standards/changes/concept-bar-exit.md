---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/reference-research.test.mjs, scripts/capture-routes.mjs, tests/capture-routes.test.mjs, scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# The concept bar has an exit, and case studies can be found

A design trial for a small restaurant built a rich, specific direction and still could not pass the concept bar: it re-scored its built page eight times, plateaued at 15 and 16 of 21 against the references' 17.5, and every reviewer named the stand-in photographs, which no layout change can fix. Its research spent twelve minutes satisfying the case-study rule, because studio pages rarely link the live client site, and it ended on a chain's site.

- `check:art-direction --require-references`: after three scored rounds, a chosen concept within two points of the bar stands when the references file has a `### Gap to the bar` section naming what holds it down outside the layout and what would close it.
- Once the chosen concept is built, one reviewer gives the card score and the Stage 5 additions in the same review, instead of two loops over the same sheets.
- A case study may be captured from the case-study page itself when the studio does not link the live site; a chain or a big-budget brand is not a small client. Gallery guidance names listings that exist (award galleries' business categories) rather than categories the smaller galleries lack.
- `capture:routes --wait <ms>` lets a preloader settle; `audit:composition --references` reads the first URL of a source cell that carries a note.

## For sites

Copy the files.
