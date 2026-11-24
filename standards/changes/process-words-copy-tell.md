---
bump: patch
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/copy-tells.mjs, scripts/check-quality.mjs]
---

# The design process's own words on a page are a copy tell

A page built from a recorded world can start naming its machinery: a heading that repeats a rule, a caption that calls a photograph "the source object". On another project such a page was marked among the lowest of ten scored rounds, and none of its forty checks read the words.

`check:quality` now reports `copy-tell process word "<phrase>"` for the workflow's two-word phrases in English and French (source object, signature moment, governing idea, pinned scene, named motion, made world, the world's objects, working feature, easy version, first screen; *objet source*, *idée directrice*, *scène épinglée*, *objets du monde*, *premier écran* and a few more). Single words such as "world" or "object" are not read. `copy-voice.md` lists the tell.

## For sites

Copy `scripts/copy-tells.mjs` and `scripts/check-quality.mjs`; the guide comes with the skill sync. A design studio that uses one of the phrases about its own work adds it to `copyAllow` in `page-budget.json`.
