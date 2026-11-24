---
bump: patch
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/design-system.mjs, scripts/check-art-direction.mjs, tests/spacing-tokens.test.mjs, tests/world-record.test.mjs]
---

# `npm run verify` stays green in a site with its own typeface, and a dark ground has a way through the token tool

Two sites were started from the current standards by a strong model, and both reported the same faults in Baseline itself.

- **`npm run verify` was red in a site with its own typeface.** Two of the starter's spacing-token tests hand the site's stylesheet to the token tool in a temporary folder. A site that loads a typeface from a package has no `package.json` there, so the tool refused the stylesheet for a face it could not find, and the tests failed for a reason that had nothing to do with them. The tests now put the font roles back to system stacks first. A site that sees `verify` red before its first edit learns to ignore it.
- **"No third voice: …" was read as a typeface.** The art-direction check took the words after that colon as the family of a third voice and asked for a specimen sheet. A role that is denied is no longer read, and the reading face used again for labels is not a third voice.
- **A dark canvas was turned into a pale page.** `design:tokens --seed-canvas <dark colour>` kept the page near white and said nothing. It now refuses, with the command that sets a dark ground.
- **The surface values can be set through the tool.** `--set "--root:--surface-light-link=<colour>"` (and the other `--surface-light-*` and `--surface-dark-*` values) is added to `:root` when the site has not set it yet, instead of being refused as an unknown name. A dark theme and the values of its light sections can so be saved in one command.
- **A failing contrast pair says where its colours come from.** A pair on a light or dark section names the `--surface-*` values it reads and their fallbacks; a failing link says that it takes the action colour and where `--color-link` is declared. On a dark theme the first failure is nearly always the light section's link on the starter's white, which the old message did not explain.
- `token-handoff.md` has a short section, "A site whose ground is dark".

## For sites

Copy the two scripts, the two tests and the `site-art-direction` skill.
