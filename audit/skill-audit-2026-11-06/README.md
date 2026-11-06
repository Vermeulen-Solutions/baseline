# Skill audit pilot evidence

Supporting files for [skill-audit-2026-11-06.md](../skill-audit-2026-11-06.md).

- `protocol.json` holds the prompts and acceptance criteria. They were frozen before any skill edit, and the Haiku addendum was recorded before any Haiku run.
- `runs/` holds each worker's answer and its self-reported files-read list. The fixture names were neutral during the runs:
  - `k7` is the base commit (before).
  - `m2` is this branch's first skill edits (after).
  - `r5` is `m2` plus the revised `responsive-architecture.md` (after, revised).
  - Files prefixed `H-` are Haiku runs; the others are Sonnet.
  - A trailing `b` marks a second trial.
- `measure-wording.mjs` counts words and the soft, strict and "why" markers per skill file. Run it as `node audit/skill-audit-2026-11-06/measure-wording.mjs .agents/skills <skill…>`.
- `estimate-words-read.mjs` estimates the words each run loaded from its files-read list. It expects the fixtures beside a `runs/` folder, and the fixtures were temporary, so it is kept as a record of the method rather than as a rerunnable check.

All site briefs in the prompts are fictional.
