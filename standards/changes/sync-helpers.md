---
bump: patch
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/skill-sync.mjs, scripts/sync-impeccable-skill.mjs]
---

# Skill sync helpers list new files for static profiles and know upgrading-emdash

`sync-impeccable-skill.mjs` now adds files new in an Impeccable release to the shared profile manifest, so static profiles ship every file the skill links to; the manifest lists the six files from 4.9.2 and `engine-checksums.txt`, which the launcher needs to verify engine downloads. `skill-sync.mjs` manages `upgrading-emdash` with the other EmDash mirrors.

## For sites

Skill sync never replaces its own helper. Copy both scripts whole before running the skill sync; `sync:site-skills -- --check` reports `helper: differs` until `skill-sync.mjs` matches.
