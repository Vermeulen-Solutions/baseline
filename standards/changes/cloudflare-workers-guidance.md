---
bump: patch
platforms: [emdash]
areas: [tooling, skills, docs]
adoption: sync
visible: no
database: no
files: [scripts/check-live.mjs]
---

# Cloudflare Workers guidance: admin hostname, bot protection, redirects, plan limits and timing

`check:live --timing` measures each page cold (every page cache bypassed with a unique query string) and warm, and reports the cache and placement headers, so Smart Placement and cache lifetimes can be decided from numbers. The cutover skill now covers keeping `/_emdash/` and `/_astro/` on the admin's hostname when an alias redirect is in place, and running post-deploy checks locally because Bot Fight Mode challenges data-centre callers such as GitHub runners and cannot be skipped by WAF rules. The site rules give each redirect one home: EmDash's Redirects screen for content, `astro.config.mjs` for code-owned paths. The deployment guide states that EmDash runs on the Workers Free plan (only sandboxed plugins need Paid), lists the Free limits, and explains that Baseline's in-Worker cache provider counts every page view as a Worker request.

## For sites

Take `scripts/check-live.mjs` with the next skill and helper sync (or copy it from Baseline), then run `npm run check:live -- --origin <url> --timing` from your own machine and keep the numbers in the project notes. If a `www`↔apex redirect sends admin traffic away from the hostname editors' passkeys use, add the `/_emdash/` and `/_astro/` exceptions. Move any redirect for a content URL from `astro.config.mjs` into EmDash's Redirects screen, keeping each path in one place.
