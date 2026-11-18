---
bump: patch
platforms: [static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/sync-baseline.mjs]
---

# sync:baseline ignores imports in comments

The static sync's import preflight read a JSDoc type such as `{import('./x.mjs').Options}` as a real import and refused an otherwise clean update of `scripts/baseline-features-integration.mjs`. It now removes comments before scanning. `//` after a colon, as in a URL, is not treated as a comment.

## For sites

Copy `scripts/sync-baseline.mjs` before the next sync.
