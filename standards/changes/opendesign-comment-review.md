---
bump: minor
platforms: [emdash, static]
areas: [skills, docs, tooling]
adoption: copy
visible: no
database: no
files: [scripts/opendesign-comments.mjs, tests/opendesign-comments.test.mjs, docs/opendesign-onboarding.md, docs/commands.md]
---

# Review by comments: OpenDesign is the recommended canvas

An owner who will not edit a canvas by hand still needs to point at what should change. OpenDesign stores each comment with the element clicked: its `data-od-id`, a selector, its label and its own text. So the agent reads a note, edits that element, checks the render and marks the note resolved, with no matching by position. In Baseline's trial two notes went from reading to resolved, both checked at 1440 and 390, in about thirty seconds of tool time; the same loop on a vector canvas took three to four minutes a note.

- New `npm run design:comments -- --project <id>` lists the open comments with their element; `--resolve <id>` and `--status needs_review <id>` mark them. It finds the running desktop daemon by itself. OpenDesign's MCP server has no comment tools, so the script reads the daemon's local HTTP API, checks the answers' shape, and stops with a clear message if an update changes them.
- The concept checkpoint now recommends OpenDesign when the owner wants to review by marking the design. HTML/browser concepts remain the default without a canvas request; OpenPencil (vector boards, also reviewed by comments), Brilliant (hand editing) and Penpot (shared cloud review) remain explicit choices.
- `opendesign-site-design` gains a "Review by comments" section; the onboarding guide covers the MCP command copied from the app's settings and a review round.

## For sites

Copy the files above and add the `design:comments` script to `package.json`. The skills and `AGENTS.md` guidance come with the sync.
