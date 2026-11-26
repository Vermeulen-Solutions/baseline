---
bump: patch
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/dev-tools-integration.mjs]
---

# `astro dev` starts on a site without the expressive layer

Since standards 0.8.0 the developer-tools integration injected the `/_expressive`, `/_expressive-detail`, `/_expressive-before` and `/_expressive-after` review pages on every development server, pointing at `src/dev/Expressive*.astro`. A site that never adopted the opt-in expressive layer has none of those files, so `astro dev` stopped at once with `ENOENT`. Builds and `check:dev-tools` were unaffected, so no check caught it; a static site taking 0.9.0 found it.

The integration now injects each expressive page only when its file exists in the project. A test covers a project without the files (no expressive routes) and one with them (all four).

## For sites

Copy `scripts/dev-tools-integration.mjs` (a static site's `sync:baseline` replaces it). A site that patched its copy with its own `existsSync` guard can take Baseline's file whole. Run `npm run dev` once and open `/_styleguide`.
