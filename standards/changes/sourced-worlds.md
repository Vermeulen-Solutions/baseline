---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/design-world.mjs, tests/design-world.test.mjs, scripts/check-art-direction.mjs, scripts/design-icons.mjs, scripts/design-system.mjs, scripts/audit-composition.mjs, tests/world-record.test.mjs]
---

# A site's world comes from sources, not from a list of devices

Twenty-one trial sites for unrelated trades (a plumber, a restaurant, a night club, a sculptor, a village association) shared one look: a paper ground, a condensed display face, labels in a mono face, a stamp set at an angle and a running band of words. The cause was Baseline's own guidance. World building listed ready devices, two lanes named a paper seed palette and condensed faces, and every example in a template or a check message was a stamp. A later reference named one example of a pinned scene, and all three sites built from it afterwards made that scene.

- **World building lists no devices.** The recipes section, the illustration column and every example of a device are gone. Step 1 is now gathering: look at each of the client's photographs, read their colours, find and save pictures of the trade's real things, write what each shows, and take the inventory, the materials, the source object and the palette from those notes. The kit's eight parts each say where their answer comes from. What remains under "Techniques" is build rules that hold for any world.
- **`npm run design:world`** (new). `search "<thing>"` lists pictures on Wikimedia Commons with their licence; `get <numbers>` saves the chosen ones into `audit/world/` and records the source, the author and whether each may be shown on the site; `palette <folder>` prints the large colours and the small vivid colours of the client's photographs as hex and oklch.
- **The record names its sources.** The World block has a `Sources` line: at least two of the client's photographs and at least two pictures saved under `audit/world/`, each as a file in backticks with what the site builds from it. `check:art-direction -- --require-references` asks for the line and checks that every file exists. An older record without the line stays valid.
- **The three lanes for organisations, places and makers no longer describe a look.** They seed from `neutral` and take every colour from the photographs; the named typefaces and grounds are gone. A lane says what the visitor comes for and how the page is composed.
- **Concepts start from different sources.** Each of the two or three concepts starts from a different source object, shown in a different picture, on a different material.
- **The impression reference gives no example of a scene.** It gives three steps for finding the scene in the client's own material.
- **Reference research** lists sources that were read with a plain fetch and whose licence was read in November 2026, says which need a browser, and says that references set the level and never give the site its material. The technique sources are plain CSS, so nothing is rewritten from React.

## For sites

Copy the files; the guidance arrives with the usual skill sync. Nothing changes for a site whose direction is settled. A new direction, or a redesign that runs `check:art-direction -- --require-references`, gathers its sources first and writes the `Sources` line.
