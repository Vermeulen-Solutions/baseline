---
bump: patch
platforms: [emdash, static]
areas: [dependencies, skills]
adoption: manual
visible: no
database: no
---

# Weekly upstream refresh (building-emdash-site, creating-plugins, emdash-cli, impeccable, Sveltia CMS 0.271.2)

Third-party skills refreshed from upstream: building-emdash-site, creating-plugins, emdash-cli, impeccable. Impeccable moves from 4.9.2 to 4.10.0.

Baseline's lockfile takes in-range dependency updates; certified top-level versions are unchanged unless the release notes say otherwise.

Sveltia CMS, which the static-sveltia profile loads from a CDN, moves from 0.269.0 to 0.271.2. Its SRI value was recomputed from the published file, and both generated static profiles were rebuilt and served against it.

## For sites

Run the site's skill sync (`npm run sync:site-skills -- --stage`, review, `--apply`; static sites use `sync:baseline`) to receive the refreshed skills.

Nothing is required for dependencies: each site keeps its own lockfile and updates it in its own maintenance.

Static Sveltia sites own `public/admin/index.html`, so the sync does not touch it. Copy the Sveltia `<script>` tag from Baseline's `profiles/static-sveltia/project/public/admin/index.html`, keeping its version and `integrity` together. If the site's `audit/design-gate-exceptions.json` lists that page and the page is otherwise unchanged, copy the new `sha256` from Baseline's entry for it. Run `npm run verify` and `npm run build`, then test sign-in, save and publish on the deployed editor. Other sites: nothing.
