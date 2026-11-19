---
bump: minor
platforms: [emdash, static]
areas: [skills]
adoption: copy
visible: no
database: no
files: [.agents/skills/site-art-direction/references/distinctive-direction.md, .agents/skills/site-art-direction/references/aesthetic-lanes.md, .agents/skills/site-art-direction/SKILL.md, .agents/skills/astro-site-design/SKILL.md, scripts/check-art-direction.mjs]
---

# Art direction for organisations, places and makers: governing idea, content as object, signature moments

Sites built from Baseline's primitives and recipes passed every check and still came out alike: a kicker above every heading, the heading on one side and a lead on the other, grids of equal cards, a coloured band, a centred closing call to action. The guidance was shaped by software marketing (three of four lanes, the hero strategies and the default section order) while most sites are clubs, associations, schools, churches, workshops and local businesses.

- New `site-art-direction/references/distinctive-direction.md`, read before choosing a lane: name the **governing idea** (what the site is as an object, deciding at least three structural choices), set each content type as the real object it is (a contents page, a fixtures list, a register, letters, a rate card) rather than as cards, take one shape, one accent and one or two typefaces from the subject, give each page archetype one **signature moment**, plan pacing by weight, and decide the photographs.
- Three lanes for organisations, places and makers: **Atelier & Craft**, **Civic & Community** and **Club & Fixture**. `check:art-direction` accepts them; they seed from the `editorial-paper` or `neutral` token presets.
- The Art Direction Record gains two optional fields, **Governing Idea** and **Signature Moments**; existing records stay valid.
- `site-art-direction` and `astro-site-design` point organisation sites at the method and the expressive layer, keep the conversion engine for software and product pages, add a signature and content-as-object check to the visual rubric, and name four more template tells seen across real sites.

## For sites

Nothing changes on a built site. The next redesign or new page archetype uses the updated skills: refresh them with `npm run sync:site-skills` (and `sync:emdash-skills` on EmDash sites), and copy `scripts/check-art-direction.mjs` if the record should use one of the new lanes.
