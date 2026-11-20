---
bump: patch
platforms: [emdash, static]
areas: [skills, docs]
adoption: copy
visible: no
database: no
files: [.agents/skills/site-art-direction/references/distinctive-direction.md, .agents/skills/site-art-direction/SKILL.md, .agents/skills/site-art-direction/references/design-iteration.md, .agents/skills/astro-site-design/SKILL.md, .agents/skills/astro-site-design/references/shipped-primitives.md]
---

# Taking a rehearsed redesign live: the main visitor, each locale's data, and the recipe

A redesign rehearsed on a copy of a launched site was taken live, and three things surfaced after launch that the design workflow had not asked about.

- **A fourth signature-moment test: for the page's main visitor.** The site's signature, a full-week board of every team's sessions on the home page, passed the first three tests; the owner removed it because the home page is visited mostly by prospective members and the board answered a member's question while pushing the ways to join down the page. The moment must answer the question the page's main visitor arrives with, at a size that matches how many of them need it; a tool for people already inside gets its own page. On an item page (one team, one product), the moment shows that item's own data.
- **Values written per locale.** The English rows wrote training times as `19:30`, the French ones as `19h30`; a parser that knew one form dropped every English session, and the English pages showed no times. Code that reads a value from a text field reads every locale's form and prints it back in the page's locale, and it is tested against each locale's real rows from production, since a rehearsal copy can hold older translations.
- **The recipe.** The prompt library gains "Rehearse the redesign on a copy, then take it live": confirm the copy's starting point, leave out what the copy generated from its own data (`emdash-env.d.ts`) and its captures, correct the record to the owner's choices, check every touched page in every locale against production data, then deploy, check, record. The README's everyday requests link it, and the redesign section of `site-art-direction` points to it.

## For sites

Take the skill files with the next skill sync. A record whose Signature Moments are judged at Stage 5 is now also judged for the page's main visitor.
