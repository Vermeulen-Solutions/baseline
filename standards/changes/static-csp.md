---
bump: minor
platforms: [static]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/static-csp.mjs, scripts/baseline-features-integration.mjs, src/lib/content-security-policy.ts]
---

# Content-Security-Policy for static sites

Static sites can now have the same computed policy as EmDash sites. With `CSP_MODE=report` or `enforce` set in the build environment or `.env.production`, the build:

- hashes every inline script and style across the built pages into one site-wide policy;
- adds `CSP_SOURCES`;
- writes the policy for `/*` to `dist/_headers`, which Cloudflare and Netlify read, and to `dist/.baseline-csp.txt` for other hosts.

A `public/_headers` file that already sets a policy is left alone. The policy builder is now shared: `src/lib/content-security-policy.ts` ships to static sites, and `scripts/static-csp.mjs` runs from the features integration.

## For sites

Copy the three files, then build with `CSP_MODE=report`. Check a preview deployment for `csp-violation` findings with `npm run check:quality -- --base <preview origin>`, add any third-party origins to `CSP_SOURCES`, and switch to `enforce`.
