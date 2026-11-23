---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/design-look.mjs, tests/design-look.test.mjs, scripts/audit-composition.mjs, tests/audit-composition.test.mjs, package.json]
---

# A look pass: every screen, one line each, and a score

The agents that built thirteen scored trial sites opened their own screenshots fifteen to thirty-eight times a run. The logs show where they looked: nearly always the wide page, and on the phone the first screen or one full-page picture (390px by about 7000px, shown so small that nothing in it can be read). Seven runs opened one phone screen below the first between them. None wrote down what it saw. The faults that cost these sites their craft score were further down the phone page.

- **`npm run design:look`** (new) cuts each page at 390px and 1440px into the screens a visitor scrolls through, sets them side by side at full size on sheets in `audit/look/`, and writes `audit/look/look.md` with one line per screen to fill: what is read first, and what is wrong (cut off, over something else, against an edge, too small, lost in a picture, out of line, an empty stretch, a placeholder). A second run keeps the lines of the screens that did not change. Two more sections hold what was fixed and the pages' score. `--check` passes when every screen has its line, every fault its answer and the six scores are written, on screens taken after the last change under `src/`.
- **A scorecard** (`site-art-direction/references/scorecard.md`, new): six questions scored 0 to 3 from the screens (the look from the client's own thing, a feature that answers the visitor's question, the job on a phone, craft, the made things, one idea carried through), with what usually holds each one at 2. The agent names its lowest question and improves the page for it.
- **The first screen and the working feature are built first and finished**, at 390px and then at 1440px, before any other section. Trial sites spread their effort evenly over six to eight sections.
- **`text-against-edge`** (new, in `audit:composition`): a line that begins or ends at the side of the ground it stands on or of the screen, confirmed in a picture of the page taken with its text unpainted. Eight scored sites give twenty places, each one seen by eye before.
- **`text-covered`** (new): a line partly or wholly behind something laid over it, read from two pictures of the page (text painted and unpainted) and confirmed by what lies on top at that point. Of four trial sites built with the legibility checks, two shipped a caption running under the photograph laid over its neighbour on the phone, and one a row of facts wholly behind a panel at 1440px; twelve public professional home pages give none.
- **`placeholder-text`** (new): "à confirmer", a "bientôt" tag on its own, digits followed by a row of dashes. Guidance: leave the element out and list the missing fact; build the page's main action with the example the brief gives.

The three findings are floor findings for a direction whose record has a `Sources` line and advisories otherwise.

## For sites

Copy the files and add the `design:look` script; the guidance arrives with the usual skill sync. A new direction, or a visible change, goes through the look pass at Stage 5 after the comparison with its references (`new-site-workflow/references/impeccable-passes.md`).
