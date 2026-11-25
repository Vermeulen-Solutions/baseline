---
bump: patch
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/opendesign-comments.mjs, tests/opendesign-comments.test.mjs]
---

# OpenDesign comments show the element's box: check at the owner's width

The first comment left by an owner in the OpenDesign app ("too much empty space") sat on empty space, so it attached to `main`. Its stored box was 1955 px wide: the owner's preview was wider than any width the agent checks, and the hero's two columns had drifted to opposite edges there.

`npm run design:comments` now prints each element's box (`box: 1955×784 at 0,81`, and `box` in `--json`). The `opendesign-site-design` review loop explains notes on empty space and asks for before and after renders at the owner's preview width when it differs from 1440 and 390.

## For sites

Copy the two files; the skill comes with the sync.
