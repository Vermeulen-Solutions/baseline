---
bump: patch
platforms: [emdash, static]
areas: [skills]
adoption: sync
visible: no
database: no
---

# Skills link to Baseline's docs by URL instead of paths sites do not have

Baseline-owned skills linked to `docs/` and `audit/` files and to the optional design-surface skills with relative paths. Sites receive only the skills, so in an EmDash site those links led nowhere (27 dead links in one site). A shared skill also linked to an EmDash-only skill that static sites never receive. The 30 links now point to the file on Baseline's repository, with the local path beside them for a Baseline checkout, and a test keeps new skill links inside what every site installs.

## For sites

Run the site's skill sync (`sync:site-skills`; static sites `sync:baseline`). Files a site copied in by hand to satisfy these links can stay.
