---
bump: patch
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [tests/fluid-tokens.test.mjs, tests/token-contract.test.mjs]
---

# Token tests pass on a site with its own lane

Two token tests compared the site's stylesheet with the starter's exact values: the default spacing scale, the starter page colour, and the text-resize sample. A site that ran `design:tokens --init-client` has the strict theme and its own lane values, so its `verify` failed. Those exact-value checks now run only on the starter stylesheet. A client stylesheet is still checked for the token names, types and the text-resize rule.

## For sites

Copy `tests/fluid-tokens.test.mjs` and `tests/token-contract.test.mjs` if `npm test` fails on them after a lane was initialised.
