---
bump: none
platforms: [emdash, static]
areas: [tooling]
adoption: manual
visible: no
database: no
---

# site:files --files writes only the named files

`npm run site:files -- --site <path> --files a,b --apply` now writes exactly the named files, behind or missing, and leaves every other file alone. Before, `--files` only added missing files to the run and `--apply` still replaced every behind file, so on a site that is a full Baseline fork it also replaced Baseline's own repository tests, which fail without Baseline's data. Without `--files` nothing changes. `site:files` is a maintainer tool run from a Baseline checkout and does not ship to sites.

## For sites

Nothing.
