---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, scripts/audit-composition.mjs, tests/world-record.test.mjs, tests/audit-composition.test.mjs]
---

# A motion tier in the record; the impression tier requires scripted motion

Seven design sprints on three briefs, from a plumber to a club whose client asked for a site that strikes, all came out with the same motion: entrances on scroll, a ticker and a slow loop. Measured, the club's pages ran 14 to 29 animations with 15 to 34 KB of script; studio-built sites of the level Baseline aims at run about 140 with several hundred. Baseline's rules kept interaction without JavaScript for every site, and the brief's permission to do more was never used.

- The Art Direction Record gains **Motion Tier**: `task`, `editorial` or `impression`, written with the client's words that decide it. `site-art-direction` ("Record the motion tier") says which facts choose each tier. `check:art-direction -- --require-references` requires the line for a new direction; an older record without it stays valid, and a line that is present is always checked.
- On the **impression** tier three scripted pieces are required: a smoothed scroll (Lenis), page transitions with Interlude on Astro's client router, and at least one pinned scene. The new reference `astro-site-design/references/impression-motion.md` gives one path for each, with a check after each. The steps were run on a generated static site: the transitions play inside the starter's shell, focus moves to the new page, reduced motion swaps pages at once and shows the scene as an ordinary block, and scripts stay under the default 120 KB budget.
- `audit:composition` reads the tier from the record and reports the floor finding `impression-motion`, naming each missing piece, until an impression site's built pages have all three.
- The interaction rule in `AGENTS.md` names this one exception; every other site, and everything else on an impression site, stays as before. The smooth-scroll component stays still under a page transition's cover.

Not tested: Interlude in the EmDash visual editor. The reference says to leave the client router and the transition layer out in edit mode.

## For sites

Copy the files; the guidance arrives with the usual skill sync. Nothing changes on a built site. A site that starts a new direction records its Motion Tier; a site whose record says `impression` then fails `audit:composition` until the three pieces are built, and installs `lenis@1.3.27` and `gsap@3.15.1` as the reference sets out.
