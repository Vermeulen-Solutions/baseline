---
bump: none
platforms: [emdash, static]
areas: [tooling, docs]
adoption: none
visible: no
database: no
---

# Adopting Baseline-owned code in a built site

`npm run site:files -- --site <path>` compares a site's Baseline-owned code (components, lib, layouts, scripts and tests it does not own) with this checkout. Each file comes out as current, behind, edited, missing or blocked.

- **Behind:** a version Baseline once committed, or the version this tool last adopted. Only these files are replaced, and only with `--apply`.
- **Edited:** the site changed the file. It is never replaced; Baseline's version goes to `.baseline/incoming/<commit>/` for a hand merge.
- **Missing:** the site lacks the file. It is adopted only when named with `--files`.
- **Blocked:** the incoming version imports something the site does not have.

Replaced originals are kept under `.baseline/backups/<commit>/`. Adopted and current files are recorded in `.baseline/owned-files.json`, so the next run knows the site never touched them. This is the generic part of the fleet update tool; skills stay with `sync:site-skills`.

## For sites

Nothing to install: the tool runs from the Baseline checkout.
