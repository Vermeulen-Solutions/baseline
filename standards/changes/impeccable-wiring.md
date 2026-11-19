---
bump: minor
platforms: [emdash, static]
areas: [skills, docs]
adoption: copy
visible: no
database: no
files: [.agents/skills/new-site-workflow/references/impeccable-passes.md, profiles/static/project/AGENTS.md, profiles/static/project/README.md]
---

# Impeccable runs by its commands, with the brief where it can read it

Impeccable is driven by commands (`context`, `critique`, `polish`, `audit`, `bolder`, `typeset`, `layout` and others), each with its own launcher steps and output. The workflow only said "load `impeccable` for a bounded visual critique", and trial builds from a plain brief ran `impeccable detect` and nothing else: no two-assessment critique, no persisted snapshot, no refine commands. Its context loader also reads the brief only from `PRODUCT.md`, while Baseline kept it in `AGENTS.md` by default, so Impeccable judged pages without the brief.

- New `new-site-workflow/references/impeccable-passes.md` sets out the passes stage by stage: load context once; Baseline's art direction stays the one direction process (no second Impeccable new-work flow); `critique` on each representative page with two isolated sub-agent assessments, the snapshot persisted with `critique-storage write`, and the run closed with questions or a `Questions skipped` line (and how to answer them when the owner is away); a table from findings to `bolder`, `typeset`, `layout`, `colorize`, `quieter`, `distill`, `clarify`, `adapt`; `polish` to close the snapshot; at Stage 6 `audit` per route family, `harden`, `detect --changed` once, a final critique and polish.
- The Stage 5 and Stage 6 gates now ask for a persisted critique snapshot per representative page with its P0 and P1 issues closed or recorded; `detect` alone does not count. The express track, site maintenance, design iteration and `astro-site-design` point to the same passes.
- A new site writes its brief in `PRODUCT.md` (from `PRODUCT.example.md`), linked from `AGENTS.md`. Older sites may keep the brief in `AGENTS.md`; the critique's design review then gets it by path.

## For sites

The skills arrive with the usual skill sync. Static sites copy the profile `AGENTS.md` and `README.md` wording if they want it (`site:files --files AGENTS.md,README.md`); nothing else changes, and a site that keeps its brief in `AGENTS.md` keeps working.
