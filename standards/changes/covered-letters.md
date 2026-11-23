---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# A label struck through by a drawn part is found

Four trial sites were built with the look pass and the three new legibility findings, each followed by a fresh session that looked at every screen. All four passed with no legibility finding. One of them, at 1440px, carried five service labels each crossed in its middle by the drawn stem of the valve above it, with one letter of each gone. Nothing saw it: `text-covered` read a hidden run from one end of a line only; the builder's look lines and the fresh session both read "none" for that screen.

- **`text-covered`** now also reads each letter and digit of a line (type under 72px). A letter that changes next to nothing in its own box between the page as painted and the page with its text unpainted, while most of the line's letters show, is a candidate; so are two neighbours that are each mostly unchanged. As before, it counts when something else than the line's own element lies on top at that point, and a bar that rides over the page is not a cover. The finding names the line and says "1 letter inside the line".
- The message adds: a drawn part (a stem, a needle, a rule) passes beside a label, never through it. `world-building.md` gives the fix.

Evidence: the read finds all five labels on that site. On the twenty other trial sites still built it adds two places, both seen by eye and both real: a strip of drawn tape over the first words of a caption, and a card over a line of the block above. Twelve public professional home pages give one: a round sticker that floats over a grid of cards hides the ends of four lines on the phone.
