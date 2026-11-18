---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, tests/check-quality.test.mjs, PRODUCT.example.md]
---

# Launch readiness in check:quality, and placeholders instead of inventions

`npm run check:quality` reports what an unattended build leaves behind:

- `placeholder`: a `[[placeholder: …]]` marker, or an empty slot marked `data-placeholder`;
- `default-identity`: the starter's title, site name or tagline, or an example.com, `.test` or `.invalid` address;
- `multiple-h1`;
- `inline-handler`: `onclick=` and friends, which a CSP blocks;
- `javascript-url`;
- `form-no-destination`: a form with `action="#"`.

The content-patterns reference makes the marker the rule when a fact is missing. `PRODUCT.example.md` gains Facts (only what the owner said), Placeholders, Assumptions and page status.

## For sites

Copy `scripts/check-quality.mjs` and `tests/check-quality.test.mjs`, run the check, and replace any starter identity and placeholders it lists. Add the new sections to the site's `PRODUCT.md` when useful.
