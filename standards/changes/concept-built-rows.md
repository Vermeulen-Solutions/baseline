---
bump: patch
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/reference-research.test.mjs, .agents/skills/site-art-direction/references/reference-research.md, .agents/skills/site-art-direction/SKILL.md]
---

# Built pages are "built" rows in the concepts table

The concepts table allowed one "chosen" row, and the guidance told an agent to move that verdict to each new score of the built page and mark the earlier rows "not chosen: superseded". A trial with two built pages scored over three rounds ended with five rows of the chosen direction marked "not chosen".

- A Stage 5 score of a built page of the chosen direction is a row with the verdict `built: <route> <note>` (`built: / round 1`, `built: /works final`). The concept keeps its `chosen` verdict; exactly one concept is still chosen, and built rows do not count towards the two concepts to score.
- `check:art-direction` judges the bar on the home page's last `built` row, or on the chosen concept before the home page is built. Other pages' last rows are printed as advice (`Advisory: the built page /works scores …`), never failed. A `built` row without a route fails.
- The art-direction skill says to replace the record by its exact heading line or with `design:tokens --write-record`.

## For sites

Copy the script and its test with the skill sync. Existing tables stay valid: rows marked `not chosen: superseded` still pass.
