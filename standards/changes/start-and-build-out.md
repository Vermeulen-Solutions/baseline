---
bump: minor
platforms: [emdash, static]
areas: [skills, docs]
adoption: copy
visible: no
database: no
files: [README.md, docs/prompt-library.md, docs/site-delivery-workflow.md, docs/art-direction-workflow.md, docs/getting-started.md]
---

# A site can be started by one model and built out by another

Baseline's design trials built the same briefs many ways and had an owner mark the pages blind. One arrangement gave better-marked pages each time it was tried: the most capable model made the direction, the design system and the first screen, and a cheaper model built the remaining sections and pages from a written blueprint. The cheaper model kept the design it was handed. Tournaments between starts, model critics and extra passes showed no such gain and are not part of the workflow.

- `new-site-workflow/references/start-and-build-out.md` is new. It says where the start ends (the shell, the home page's first screen with its working feature, two sections, `audit/blueprint.md`), what the blueprint holds, and what the builder may not change. The handoff is files in the site folder, so it works in any coding assistant, with two models in one tool or with two tools.
- `SKILL.md`, the Express track and `AGENTS.md` route to it when the owner asks for the start only or when `audit/blueprint.md` exists with work not yet built. With one model the tracks are unchanged.
- The README and the prompt library carry the two prompts.
- The overview pages were behind the workflow and are brought in line: the delivery workflow page names the current gates of Stages 4 to 6, the art direction page describes the world built from the client's own things, the full Art Direction Record, the three forms of the gate and the commands that look at a built page.

## For sites

Sync the `new-site-workflow` skill. The listed documents are for people; copy them if the site keeps Baseline's docs. An existing site needs nothing else: the split applies to a new site or a new direction.
