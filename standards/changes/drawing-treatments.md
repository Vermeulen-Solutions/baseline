---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/design-icons.mjs, scripts/design-system.mjs, scripts/check-art-direction.mjs, scripts/audit-composition.mjs, tests/design-icons.test.mjs, tests/art-direction.test.mjs, tests/audit-composition.test.mjs]
---

# Drawn figures get the world's medium and a size; lane-default records no longer pass the gate

A design trial tested the drawing rule (figures come from an open-licence set through `design:icons`). The rule fixed the crude hand-drawn figures. But a set figure that was only recoloured still read as "a logo or clip-art". The same owl read as stencil paint once three things were done: a spray filter and stencil bridges were applied, it was shown at about 780px, and it sat on the log it was sprayed on. At 150 to 300px a figure with the same treatment was still judged an icon.

- Site art direction: the Drawings rule in world building now asks for three things. Each figure gets the world's medium as a filter and a mask. It is shown at least 480px on its short side. It is set on the object it marks. The rule also notes that below about 300px a figure stays an icon. A new reference, `drawing-treatments.md`, has the recipes: the spray filter and stencil bridges from the trial, an ink stamp, and a brand burnt into wood. It also covers breaking the set's symmetry, the cost of filters in motion, and the reviewer's question.
- `design:icons search` lists figurative sets first, using Iconify's set category. It marks UI and emoji sets ("read as an interface", "read as a chat") and searches 200 icons by default. For "owl", game-icons now comes first; it used to be at row 24 after about twenty UI sets. `get` ends with the treatment reminder.
- `design:tokens --init-client` (and `--write-record`) mark the record they write as the lane's defaults with a comment under the heading. Every `check:art-direction --require-*` run fails until the record is the site's own and the comment is deleted. A trial's gate passed on the generic lane record before any direction existed.
- `audit:composition` `repeated-run` compares neighbouring tall items by how they are laid out: the picture's share of the width, picture beside or above the text, the number of pictures, and the ground. It no longer compares them by tag and class. A register in five arrangements on three grounds is no longer reported. Identical or only mirrored blocks still are.

## For sites

Copy the files. The skill text arrives with the site's skill sync. A site whose `AGENTS.md` record still has the lane-defaults comment fails `--require-*` checks: write the site's own record, then delete the comment.
