---
bump: patch
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [tests/fluid-tokens.test.mjs, tests/token-contract.test.mjs]
---

# Token tests pass on a site with its own palette

0.5.0 limited the exact-value token checks to stylesheets without the strict theme. A site with its own palette but no strict theme still failed: it was held to the starter's page colour, spacing scale and motion tokens. The exact values are now checked only on the untouched starter stylesheet, recognised by its page colour. Any other stylesheet is checked for its shapes: a typed oklch page colour and the spacing token names.

## For sites

Copy `tests/fluid-tokens.test.mjs` and `tests/token-contract.test.mjs` when the site has not edited them (`npm run site:files -- --site <path>` from Baseline says so).
