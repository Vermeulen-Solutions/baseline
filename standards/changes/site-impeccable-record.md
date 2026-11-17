---
bump: patch
platforms: [emdash]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/skill-sync.mjs, scripts/sync-impeccable-skill.mjs]
---

# Impeccable in a site comes only from the site skill sync

In an EmDash site both `sync:site-skills` and `sync:impeccable` wrote the Impeccable folder. The second rewrote files the site-skill receipt owned, so every later site sync reported eight Impeccable files as local drift. The site skill sync now writes `.emdash/impeccable-source.json` from the applied `PROVENANCE.json`, and `sync:impeccable` refuses to apply where the site-skill receipt manages Impeccable (a read-only `--check` still reports).

## For sites

Copy both helpers whole, then use `sync:site-skills` for Impeccable. If the next site sync lists Impeccable files as conflicts, they are this drift: review that the incoming files are the release's, and accept them.
