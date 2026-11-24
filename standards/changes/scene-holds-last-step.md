---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: yes
database: no
files: [scripts/audit-composition.mjs]
---

# A pinned scene holds its finished last step before the stage leaves

The pinned-scene recipe for the impression tier ended its last step at `contain 90%`, and the variant whose steps replace one another at `contain 100%`. The scene was complete 0.2 of a screen, or not at all, before its stage scrolled away: the visitor never sees it finished. On another project's owner-scored page built that way, the owner's remark was that everything finished opening just as the section left.

- `impression-motion.md`: the example's ranges are now `contain 0% 25%`, `25% 50%`, `50% 70%` on its `300svh` track, and a rule says why and how to work out the hold on other track lengths (`(1 − the last step's end) × (screens − 1)` of at least 0.6).
- `audit:composition` measures it on impression sites: it scrolls through the first pinned scene's range, notes where its scroll-driven animations stop changing, and reports `impression-motion` with "a pinned scene that holds its last step" when less than 0.6 of a screen is left. Scripted (GSAP) scenes are not read.

## For sites

Impression-tier sites only. Copy `scripts/audit-composition.mjs`; the guide comes with the skill sync. Run `npm run audit:composition` on the page with the scene: if it reports the hold, change the last step's `animation-range` end (by `contain 70%` on a `300svh` track) and move the earlier steps' ranges to match. This changes when the scene's steps arrive, so look at it in a browser with motion allowed.
