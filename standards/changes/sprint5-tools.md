---
bump: patch
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/reference-research.test.mjs, scripts/css-contracts.mjs, tests/css-contracts.test.mjs, scripts/audit-composition.mjs, scripts/prepare-images.mjs]
---

# Small tool fixes from a design trial for an association

- `check:css` fails on a component class named like a Tailwind display, position or visibility utility (`.contents`, `.hidden`, `.table`, `.container`, `.sticky` and others): the utility applies wherever the class is used, and a trial's `.contents` section collapsed to nothing with no warning.
- `check:art-direction`: a concept verdict may carry its reason after a colon (`chosen: <why>`), as candidate verdicts do; the record template and the skill give Typography Pairing room for the World's third voice (`Utility: <family>`).
- `audit:composition` counts a drawn object at stage size (an SVG or canvas across most of the width, or half a screen tall) as a page's signature; a drawn year band did not count.
- `media:prepare --help` prints its usage instead of failing.

## For sites

Copy the files. Rename any component class that `check:css` now names.
