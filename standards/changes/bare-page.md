---
bump: minor
platforms: [emdash, static]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# The composition audit reports a bare page

`audit:composition` passed trial builds whose pages were made only of type, photographs and rules, because it looked for template layouts and not for what a made page has.

- New `bare-page` finding: the page lacks three or more of five things a made world has: a surface (a textured or patterned ground, an edge drawn on a pseudo-element), three or more drawn objects (SVG or canvas at least 32px), three type voices, depth (a rotated or masked object) and motion (an animation running while the page is scrolled, measured with motion allowed before the audit switches to reduced motion). Calibrated on studio-built sites for a race, an embroidery shop and a school (none reported; all five present on two of them, four on the third) and on three trial builds (all reported, three or four missing).
- Each route's summary line now prints the counts: elements, type voices, surfaces, drawings, rotated or masked objects and animations.

## For sites

Copy `scripts/audit-composition.mjs` and `tests/audit-composition.test.mjs` (`site:files --files scripts/audit-composition.mjs,tests/audit-composition.test.mjs --apply`). The audit stays advisory unless run with `--strict`.
