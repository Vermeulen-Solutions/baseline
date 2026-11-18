---
bump: patch
platforms: [emdash, static]
areas: [skills, docs]
adoption: sync
visible: no
database: no
---

# Voice rules become copy rules

The copywriting reference now asks for voice rules a machine can check (a solo practitioner's "we", banned generic phrases) to become `copy` rules in `page-budget.json`, so `npm run check:quality` holds every page to them, while the decision stays recorded in `AGENTS.md`, `PROJECT.md` or Impeccable's `PRODUCT.md`. `docs/project-context.md` adds that visual direction belongs in `DESIGN.md` and the Art Direction Record, not in `PRODUCT.md`.

## For sites

Arrives with the next skill sync. When a site's brand commitments include wording rules, add them to `page-budget.json` under `copy`.
