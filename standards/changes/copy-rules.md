---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, tests/check-quality.test.mjs]
---

# Wording rules checked on the text visitors read

`page-budget.json` takes a `copy` list of wording rules, each with a `pattern`, `flags` (default `i`) and a `why`. `npm run check:quality` checks each rule on every route's rendered text and reports `copy-rule` with the match, its count and the surrounding words. It skips:

- code and quotations;
- hidden text;
- anything under `data-copy-ignore`, such as a client's own words.

Typical rules: a one-person studio says "I", never "we"; banned phrases from the art direction. `--init` keeps existing rules. Page text never appears in the saved report.

## For sites

Copy `scripts/check-quality.mjs` and `tests/check-quality.test.mjs`. Then add the site's wording rules from its art direction to `page-budget.json` under `copy`.
