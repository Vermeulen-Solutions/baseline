---
bump: patch
platforms: [emdash]
areas: [delivery]
adoption: manual
visible: no
database: no
files: [src/lib/media-edge-cache.mjs, src/middleware.ts, src/lib/cloudflare-cache-provider.mjs, tests/cloudflare-cache-provider.test.mjs]
---

# A replaced image is no longer kept for a year

Baseline's middleware and Cloudflare cache provider marked every `/_image` variant and media file `public, max-age=31536000, immutable` and kept an edge copy with no limit. EmDash's Replace original writes new bytes under the same storage key, so a replaced photo could stay old in visitors' browsers for a year; EmDash 1.6 sends `public, max-age=0, must-revalidate` for these files and purges its own route-cache tag, which Baseline's header defeated. Both now go through `src/lib/media-edge-cache.mjs`: the browser receives EmDash's header, the edge copy lives one hour (it still saves the image transform), and media never enters the in-isolate memory cache that EmDash 1.6 asks the route cache to fill.

On Node.js, a site that uses `src/lib/private-safe-memory-cache.mjs` names the provider `memory` in its config (or spreads `memoryCache()`): otherwise EmDash 1.6 keeps images in process memory.

## For sites

Workers sites that carry Baseline's media caching (look for `immutable` in `src/middleware.ts` or `src/lib/cloudflare-cache-provider.mjs`): copy `src/lib/media-edge-cache.mjs`, then replace the media block in `src/middleware.ts` and the media branch in the provider with the calls to `serveMedia` from Baseline's versions (`site:files` replaces them when the site never edited them). Deploy, then request an image twice and confirm the second answer carries `X-Astro-Cache: HIT` and `Cache-Control: public, max-age=0, must-revalidate`. Images already in visitors' browsers keep the old header until it expires; replaced images show for new visitors within the hour. Node sites with the memory provider: add `name: 'memory'` to the provider entry in `astro.config.mjs`.
