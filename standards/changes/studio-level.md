---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, tests/audit-composition.test.mjs, scripts/check-art-direction.mjs, tests/reference-research.test.mjs]
---

# Quiet references no longer set the level

A trial on the comparison pass built its best pages yet, but its four selected references were quiet, well-set sites: measured, they had a median of 1 drawn object, 5.5 running animations and 12.5 colours, and its only studio case study was one face in four sizes. The measures against them were passed before the pass began; the reviewer of the sheets did the work, and the site's narrow palette (11 colours against 30 to 44 on studio-built sites) was never marked.

- A selected studio case study must score 3 on craft, a made world: `check:art-direction --require-references` fails otherwise.
- `audit:composition --references` prints the studio level beside the references' median (the median of three studio-built home pages, `STUDIO_LEVEL`) and marks each measure where the page has under half of the higher of the two.

## For sites

Copy the files. A references file whose only selected case study scores under 3 on craft now fails `--require-references`: search again for a studio-built site that shows a made world.
