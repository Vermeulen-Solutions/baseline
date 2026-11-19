---
bump: patch
platforms: [static]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [src/pages/sitemap.xml.ts, src/pages/rss.xml.ts, README.md]
---

# A static build without SITE_URL leaves the sitemap and feed out instead of failing

The static profile's README and `.env.example` say that without `SITE_URL` the URL-dependent output is omitted, but the sitemap and RSS routes threw, so `npm run build` failed on every local build that had no public origin yet. Four trial builds in a row worked around it by hand.

- Without `SITE_URL`, `sitemap.xml` and `rss.xml` answer an empty 404 and Astro skips writing them, logging each as skipped; the rest of the build is unchanged. With `SITE_URL`, both are generated as before.
- The generated-profile verification now also builds without `SITE_URL` and checks that the site builds and the two files are absent.
- A deploy still needs `SITE_URL`: `check:quality -- --sitemap` finds no sitemap without it.

## For sites

Copy the two routes and refresh their entries in `audit/design-gate-exceptions.json` (the hashes change).
