---
bump: minor
platforms: [emdash, static]
areas: [skills]
adoption: sync
visible: no
database: no
---

# Skill refresh: Impeccable 4.9.2, upgrade and delivery routing, plugin selection

Impeccable moves from 4.8.1 to 4.9.2 (a critique rubric split out of `critique.md`, a motion reviewer, `foundations`, comp-led new-work references; launcher 0.1.25 with checksum-verified engine downloads). The EmDash mirrors refresh `creating-plugins` (a repeater can hold a `media_picker`), and `upgrading-emdash` becomes a built-in mirrored skill. Baseline's own skills now route upgrades and deploys through `db:rehearse` and `check:live` (`emdash-production-cutover` maintenance and launch references, `emdash-content-modeling`), add the Registry plugin selection guide where plugins are chosen (`emdash-site-setup`, `new-site-workflow`), document contact-form mail and bilingual URLs, and carry the design-system vocabulary in `astro-site-design`.

## For sites

EmDash sites: `npm run sync:site-skills -- --stage`, review the staged diff, `--apply <id>`; then the same with `sync:emdash-skills` (add `upgrading-emdash` with `--add-skill upgrading-emdash` while the site's helper predates it). Impeccable arrives with the site skills; do not run `sync:impeccable` in a site. Adopt the updated helpers first (see the helper notes). Static sites receive the skills their profile ships through `sync:baseline`, and must copy the six new Impeccable files and `scripts/engine-checksums.txt` by hand, because bounded sync cannot add files the site did not already have.
