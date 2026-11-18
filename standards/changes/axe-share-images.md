---
bump: minor
platforms: [emdash, static]
areas: [tooling, dependencies, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, tests/check-quality.test.mjs]
---

# Accessibility scan and share-image check in check:quality

`npm run check:quality` gains two checks:

- **`axe`:** an axe scan for WCAG 2.x A/AA (2.2 included), reporting violations of serious or critical impact. It uses the new pinned development dependency `@axe-core/playwright` 4.14.0; `--no-axe` skips the scan.
- **`share-image`:** an indexable page whose `og:image` is missing, fails to load, is not an image, or is over 600 KB (link previews drop larger ones).

On Baseline's own pages axe finds nothing serious. The demo has no default share image.

## For sites

Copy `scripts/check-quality.mjs` and `tests/check-quality.test.mjs`, and install the dependency with `npm install -D --save-exact @axe-core/playwright@4.14.0`. On EmDash sites, set a default share image in the SEO settings.
