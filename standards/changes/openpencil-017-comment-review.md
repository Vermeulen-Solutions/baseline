---
bump: patch
platforms: [emdash, static]
areas: [skills, docs]
adoption: copy
visible: no
database: no
files: [docs/openpencil-onboarding.md]
---

# OpenPencil 0.17: review by comments, and faster boards

The `openpencil-site-design` skill now targets OpenPencil 0.17.0, which renamed every MCP tool and changed design JSX, and it is built around the review loop that worked in Baseline's trial: the owner presses C and pins short notes on the boards, and the agent reads each note, finds the layer under it, fixes the cause, replies with what changed and resolves the thread. The owner never edits the canvas by hand.

The skill walks the owner through setup (app, a bridge of the same version, user-scope registration, the two app settings) and writes down what made boards slow: authoring element by element, redrawing an existing HTML page in the canvas and starting a new bridge for every call. Measured tool times are under a second; the skill asks for one JSX render per board, named layers, one export per look and fixes with `replace_id`. OpenPencil's accessibility lint runs before every hand-over. The specimen, the JSX recipe, the scoped-review and connection references and the bundled upstream skill are updated to 0.17.

## For sites

The skill comes with the skill sync. Copy `docs/openpencil-onboarding.md`. Sites that registered a 0.16 bridge install `@open-pencil/mcp` at the app's version and restart the agent session.
