---
bump: minor
platforms: [emdash, static]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/serve-static.mjs, tests/serve-static.test.mjs]
---

# A static server for local captures

Three design trials in a row each wrote their own small server, because `capture:routes`, `audit:composition` and the comparison sheets need a URL, `astro preview` serves only `dist/`, and concept HTML in `audit/visual-concepts/` had nothing.

- `npm run serve:static -- --dir <folder> [--port 4400]` serves a folder on `127.0.0.1` for captures: files inside the folder only, a folder's `index.html`, no caching. Stage 5 names it beside `npm run preview`.

## For sites

Copy the files and add `"serve:static": "node scripts/serve-static.mjs"` to `package.json`.
