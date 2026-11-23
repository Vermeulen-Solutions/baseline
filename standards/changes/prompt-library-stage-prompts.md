---
bump: patch
platforms: [emdash, static]
areas: [docs]
adoption: copy
visible: no
database: no
files: [docs/prompt-library.md]
---

# Three prompts in the prompt library follow the workflow again

Three prompts listed their own steps, and those steps had fallen behind the workflow. An agent that does what a prompt lists and stops there skipped the rest.

- **Art direction (section 3).** The prompt described choosing a lane, a metaphor and a palette, and named a gate that checks only that a record exists. It now sends the agent to Stage 4 and the `site-art-direction` skill, names the stage's five parts with their references (reference research, the distinctive direction, the world, concepts held against the references, the record), and names the gate with `--require-references`.
- **A public route (section 5).** The prompt listed decorative utilities to use and a five-point rubric to finish with. It now asks for the Stage 5 pacing blueprint before any markup, builds each section from the recorded World, treats decorative utilities as available and not required, and ends with the Stage 5 passes.
- **Critique (section 6).** The prompt said to activate the Impeccable skill and then applied a rubric from another skill, with no critique command, no saved snapshot and no fixes. It is now two prompts: one runs the three Stage 5 passes on a rendered page as `impeccable-passes.md` sets out (the comparison pass, the look pass, the craft pass, then the composition audit), and one runs the Impeccable `critique` for a report only.

The kickoff prompts, the README's build prompts and the Express track are not changed here.

## For sites

Nothing to do. A site that keeps its own copy of the prompt library can copy `docs/prompt-library.md`.
