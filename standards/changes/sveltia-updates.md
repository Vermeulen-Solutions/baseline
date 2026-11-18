---
bump: patch
platforms: [static]
areas: [dependencies, tooling, docs]
adoption: manual
visible: no
database: no
---

# Sveltia CMS 0.269.0 and weekly Sveltia pin proposals

The `static-sveltia` profile now loads Sveltia CMS 0.269.0 (from 0.248.0), with a new SHA-384 integrity value computed from the published file and checked against the npm tarball. The editor is loaded from a CDN, so `npm update` never saw it; Baseline's weekly upstream review now reports the pin (`npm run check:upstream`) and proposes new versions through `scripts/sveltia-pin.mjs`, only after `npm run test:profiles` passes. The profile's `docs/sveltia-cms.md` now recommends Sveltia's own authenticator, a Cloudflare Worker, as the default sign-in path, and says exactly what a site changes to fall back to Decap CMS.

## For sites

Static Sveltia sites own `public/admin/index.html`, so `sync:baseline` does not change it. To take the new editor, replace the Sveltia `<script>` tag with the one in Baseline's `profiles/static-sveltia/project/public/admin/index.html`, keeping the version and `integrity` together. If the site's `audit/design-gate-exceptions.json` lists `public/admin/index.html` and the page is otherwise unchanged, copy the new `sha256` from Baseline's entry for that page. Run `npm run verify` and `npm run build`, then test sign-in, save and publish on the deployed editor before handing it back to editors. Copy the updated `docs/sveltia-cms.md` if the site wants the new authentication and Decap fallback guidance.

EmDash and plain static sites: nothing to do.
