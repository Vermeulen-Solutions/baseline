---
bump: patch
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/prepare-images.mjs, tests/media-preparation.test.mjs]
---

# `media:prepare` says the form that works when it is written wrongly

Six sites were started from the current standards, and five of the six builders gave `media:prepare` the photographs' folder as a plain argument. The answer was `Unknown image option: <folder>`, and the form that works was only in `--help`; it took up to three tries.

- A refusal that comes from how the command was written (a plain argument, a flag without its value, no `--source` or `--out`) now carries a `usage` line: `npm run media:prepare -- --source <folder or file> --out .baseline/backups/<stage name>`.
- `world-building.md` showed the command with `--max-edge` alone. It now shows the whole form.

## For sites

Copy the script and its test, and sync the `site-art-direction` skill.
