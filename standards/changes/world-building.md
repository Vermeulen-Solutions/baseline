---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/world-record.test.mjs]
---

# Build the site's world: objects, surfaces, type, motion and a working feature

Trial builds that followed every direction step still came out as templates: measured on their home pages they rendered about 150 elements in one or two type voices, eleven colours, no drawn object and no animation, while sites built by small independent studios for comparable trades render 650 to 1,200 elements, three voices in twenty or more sizes, and every section as an object from the client's world. Several Baseline rules pushed towards that bare result: one accent, one shape, "everything else stays quiet", no labels above headings, no shadows on photographs, no textures.

- New `site-art-direction/references/world-building.md`, required for every new site and direction after the governing idea: inventory at least twelve things from the subject's material culture (inferred from the trade when the owner gives nothing), choose the source object the site is built like, and design the kit before any page: one object per section, two or three surfaces with edges from the materials, three type voices with a display treatment, the objects' physics (hanging, stamped, stacked), frames that turn the owner's phone photographs into a set, generated artefacts where photographs are missing, three to five named motions, and one working feature that does the site's job. Write the easy version and what this site does instead for the look, the feature and the content. It carries CSS and SVG recipes for grain, edges, tickets and tags, stamps and plates, leader lines, generated covers and motion.
- The Art Direction Record gains `World` and `Decisions` blocks. `check:art-direction` validates them whenever it validates the reference research (the Stage 4 gate for a new direction, and every run once the record names its references).
- Rules revised: palettes of four to six colours with roles instead of one accent; shapes that belong to the world's objects; three type voices with the full scale; the signature moment no longer asks the rest of the page to stay quiet; object field labels, a subject's real figures, hard shadows on physical plates and textured grounds from the recorded surfaces are allowed where they are the world's own (Baseline's Impeccable guide states this override of the craft floor); photographs run at full width only when they hold up, otherwise they are framed in the world; the craft, community and club lanes describe objects and materials instead of bare photographs.
- Concepts are built at finished fidelity for the first screen and one more section, with their world working, and the concept gate gains a World row. Reference research searches studio case studies, and the scoring card's top marks describe a made world.

## For sites

Nothing changes on an existing site until it starts a new direction. To take it, copy `scripts/check-art-direction.mjs` and `tests/world-record.test.mjs` (`site:files --files scripts/check-art-direction.mjs,tests/world-record.test.mjs --apply`); the guidance arrives with the usual skill sync.
