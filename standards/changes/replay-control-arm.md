---
bump: patch
platforms: [emdash]
areas: [tooling, docs]
adoption: none
visible: no
database: no
---

# Workflow replay control arm without agent guidance

`npm run workflow:replay -- prepare --without-skills` adds a control arm to each implementation scenario. The control arm is the same fixture and lock without the skills, the agent configuration or the `AGENTS.md` instructions. `AGENTS.md` keeps only its Art Direction Record, which the design gate reads.

A `control-<scenario>.json` receipt proves that only those files differ from the source arm. Dispatch and closure refuse a control arm without it. Comparing the source arm with the control arm shows what the skills and agent instructions add.

## For sites

Nothing to do: this is Baseline's own evaluation harness.
