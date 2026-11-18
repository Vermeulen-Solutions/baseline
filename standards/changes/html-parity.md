---
bump: minor
platforms: [emdash, static]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/html-parity.mjs, tests/html-parity.test.mjs]
---

# Rendered-HTML parity for updates and refactors

`npm run parity:html -- capture --base <origin> --sitemap --out <dir>`, run before and after a change, followed by `parity:html -- compare <before> <after>`, shows which markup changed on each route. Screenshots miss these changes: a heading level, a link target, an attribute, metadata or JSON-LD.

- **Normalized away** (build noise): hashed asset names, scoped-style and island ids, nonces, integrity and CSP hashes, and whitespace between tags. `--ignore <regex>` covers anything else that changes on every build.
- **Each route fetched twice**, so content that changes between requests is flagged instead of reported as a regression.
- **No browser needed.** It exits 2 on differences.
- **Tested on Baseline's own build:** a CSS-only change left all six routes unchanged.

The update guide now asks for it next to `capture:routes`.

## For sites

Copy `scripts/html-parity.mjs` and `tests/html-parity.test.mjs` (it uses `scripts/audit-ui.mjs` and `scripts/capture-routes.mjs`, which sites already have) and add `"parity:html": "node scripts/html-parity.mjs"` to `package.json`. Use it around every Baseline update.
