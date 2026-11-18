---
bump: minor
platforms: [emdash, static]
areas: [skills, docs, tooling]
adoption: manual
visible: no
database: no
---

# One brief: PRODUCT.md

Baseline's optional brief was `PROJECT.md`, while the `impeccable` skill reads and writes `PRODUCT.md`. Sites that used both had two briefs that drifted apart.

There is now one brief, `PRODUCT.md`. `PRODUCT.example.md` follows Impeccable's product schema and adds Baseline's decisions table and source map:

- **Ownership:** goes under Operating Context.
- **Claims:** go under Evidence on Hand.
- **Page briefs:** stay in the page notes.

`PROJECT.example.md` is retired. `baseline:inspect` still reports a legacy `PROJECT.md` so it can be found and merged, and `docs/project-context.md` gives the merge, section by section. Skills, `AGENTS.md` templates and docs now name `PRODUCT.md`.

## For sites

On a site with both `PROJECT.md` and `PRODUCT.md`:

1. Merge `PROJECT.md` into `PRODUCT.md` following "One brief" in `docs/project-context.md`.
2. Delete `PROJECT.md`.
3. Update the link in `AGENTS.md`.

A site with only `PROJECT.md` renames it after mapping its sections. Delete `PROJECT.example.md`; `doctor` and `update:plan` report it as retired.
