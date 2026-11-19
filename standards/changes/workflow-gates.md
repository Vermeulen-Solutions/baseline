---
bump: patch
platforms: [emdash, static]
areas: [skills]
adoption: copy
visible: no
database: no
files: [profiles/static/project/AGENTS.md]
---

# The quality check gates Stage 6; critique stops after two rounds; branches named by facts

A trial build reported every gate passing while its pages shifted on load by up to 0.14, loaded over a megabyte of images before scrolling and carried descriptions too long for search results: `check:quality` was in no stage gate, so it never ran. The same build spent nine critique rounds chasing a target score that the owner's phone photographs held down.

- Stage 6 (and Express Checkpoint C) serves the build and runs `npm run check:quality` on the default limits beside `audit:ui`; the gate passes when both pass or each remaining finding is recorded with its reason. After the first clean run, `--init` writes `page-budget.json` from the measured numbers.
- A critique loop runs at most two rounds per page and ends early when a round does not raise the lowest score. No target score and no minimum time: findings design cannot change go to the handoff as owner tasks, and weak photographs are handled once, as content (chosen, framed in the site's world, one treatment, the missing ones listed for the owner).
- Twenty-eight branches left to the agent's judgment in the design, workflow and migration skills now name the fact that decides them, or became required steps ("research three competitors when the brief names none", "every control works without JavaScript; one that cannot says so"). The wording debt list drops from 52 to 24 entries.

## For sites

The guidance arrives with the usual skill sync. Static sites also receive one reworded line in `AGENTS.md`.
