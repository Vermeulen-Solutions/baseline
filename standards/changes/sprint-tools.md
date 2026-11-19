---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, scripts/capture-routes.mjs, scripts/audit-composition.mjs, tests/audit-composition.test.mjs, tests/design-workflow.test.mjs]
---

# The design gates and captures tell the truth

A design trial built its best home page yet and found the tools in its way:

- `npm run check:art-direction -- --require-references` passed on a fresh site: the npm script adds `--changed`, whose shortcut returns before any check when no visual file changed. Every `--require-*` flag now runs its check.
- `capture:routes` captured 404 pages with exit 0 when another server held the port; an error page is now reported as `SKIPPED` and the run exits 1. Full-page shots showed every scroll-driven object below the first screen in its start pose (invisible rows, flat drawings), and a reviewer judged the page from them; captures now show each finite animation at its end. The consent answer also covers "Refuser les non essentiels".
- `audit:composition` counted colour only in text and backgrounds, so thirty drawn log ends in nine wood tones left its colour measure at 13; SVG fills, strokes and gradient stops now count. A new advisory, `repeated-run`, names four or more sections, or tall items inside one section, built the same way whatever their grounds: the trial's works page set twelve works as twelve identical blocks.
- The Stage 5 comparison adds a whole-page sheet (`--screens 8`) beside the first-impression sheet, and its reviewer no longer asks for facts the owner has not given.

## For sites

Copy the files.
