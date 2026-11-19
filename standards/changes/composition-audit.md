---
bump: minor
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs]
---

# audit:composition reports the template look on rendered pages

`npm run audit:composition -- --base <origin> --routes <list>` reads a rendered page's top-level sections in Chromium and reports, as advisories: three or more sections opening with a kicker label, three or more opening with the heading on one side and a lead beside it, two or more grids of equal boxed items, structural repeats between neighbours, photographs without one at full width, a centred closing band, no signature moment, and a phone heading below the first screen. It prints the measurements behind them (largest h1 and h2, body size, image cover, full-width media). Calibrated on real pages: the most templated pages of a six-site fleet scored five findings, designed sites in the same sectors zero to two. `--strict` exits 1 on findings; `--json` and `--out` keep the evidence.

## For sites

Copy `scripts/audit-composition.mjs` and add `"audit:composition": "node scripts/audit-composition.mjs"` to `package.json`, or run it from a Baseline checkout against the site's preview. Run it on representative routes during visual critique; resolve the findings through the art direction (see `site-art-direction/references/distinctive-direction.md`) or record why they stay.
