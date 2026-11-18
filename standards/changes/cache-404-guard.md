---
bump: patch
platforms: [emdash]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [tests/cache.integration.mjs]
---

# The cache rehearsal proves a missing page is never cached

`npm run check:cache` now requests a missing post, page and tag twice each and requires a 404 that is not a route-cache hit, then publishes a post under the missing slug and requires it to render at once. Astro's memory cache stores any response that carries a lifetime, whatever its status, so a cached 404 would hide an entry published later; today the 404 rewrite is not stored, and this check keeps it that way across Astro and EmDash upgrades.

## For sites

Copy `tests/cache.integration.mjs` when the site has not changed it, and run `npm run check:cache` after an Astro or EmDash upgrade or a new route rule. A site that customised the rehearsal adds the missing-entry block by hand.
