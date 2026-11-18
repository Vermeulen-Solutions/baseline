---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, tests/check-quality.test.mjs]
---

# Route quality gates with a per-site page budget

`npm run check:quality -- --base <built origin> --sitemap` fails a route that has quietly got worse, where `audit:page` only observes. On every route, in a fresh browser context, it checks:

- the weight of the HTML, inline CSS, scripts, images, the largest-paint image and font preloads;
- layout shift while the page loads and is scrolled;
- a heading or image on the first screen that starts transparent or clipped;
- hydrated `<astro-island>` components;
- JSON-LD that does not parse, or lacks the types the budget lists;
- tap targets under 24px that crowd a neighbour (WCAG 2.5.8);
- a Tab stop hidden behind a sticky bar (WCAG 2.4.11).

Limits come from the site's own `page-budget.json`, which Baseline never ships or syncs; without it the defaults apply. `--init` writes the file from the current numbers plus 25%, giving any heavier route its own entry with a `_why` to fill in. The cutover skill runs it before cutover and after every deploy, and the rollout reference describes it.

## For sites

Copy `scripts/check-quality.mjs` and `tests/check-quality.test.mjs` (it also needs `scripts/audit-ui.mjs` and `scripts/capture-routes.mjs`, which sites already have), and add `"check:quality": "node scripts/check-quality.mjs"` to `package.json`. Build the site, serve it, run `npm run check:quality -- --base <origin> --sitemap --init`, fill in each `_why` and commit `page-budget.json`. From then on, run it without `--init` after every deploy.
