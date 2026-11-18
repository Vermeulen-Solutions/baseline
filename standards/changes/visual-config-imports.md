---
bump: none
platforms: [emdash]
areas: [tooling]
adoption: none
visible: no
database: no
---

# The visual suite copies every module the config imports

The visual suite stages its own copy of the site from a fixed file list, which did not include `scripts/static-csp.mjs`. Astro could not load the config, so no visual test ran. The stage now copies every local module the config reaches, as `check:dev-tools` already did.

## For sites

Nothing to do.
