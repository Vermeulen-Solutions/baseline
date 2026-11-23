---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, scripts/capture-routes.mjs, scripts/design-sheet.mjs, tests/audit-composition.test.mjs, tests/design-sheet.test.mjs]
---

# Impression scenes must carry the subject; faster audits; fixes from four more design sprints

Four design sprints tested the motion tier with a weaker agent. All four chose the right tier from the client's words, and the three impression sites built a smoothed scroll, page transitions and a pinned scene. They also showed what the first version left open.

- **A scene must carry the subject.** Two sites built from one brief both passed: one told the club's night through five full-screen photographs (58% of the screen changes through the scene), the other turned one clock hand beside three lines of text (0.2%). `audit:composition` now takes frames near the start, middle and end of the first pinned scene and reports `impression-motion` when less than a quarter of the screen changes. The impression reference says what a scene shows and gives the two cases.
- **The impression reference reaches generated sites.** A static site's `AGENTS.md` pointed at `astro-site-design/references/impression-motion.md`, which the profile did not install.
- **The motion tier is narrower.** A client who asks only that the site be inviting or show the atmosphere is `editorial`; `impression` needs a request for impact or movement, or a club, a concert or event venue, a festival, or a studio or artist showing visual work.
- **A motion that plays once at load has run.** `world-motion` counted animations only while scrolling, so an arrival was reported as never run and sites turned their arrivals into scroll-driven entrances to pass. Animation starts are now recorded from the first paint.
- **Audits are faster.** With `--references`, each reference's live page is measured once and kept in `reference-measures.json` beside the references file (57 seconds a pass became 10); `--refresh-references` measures again.
- **`capture:routes`** waits four seconds at most for an image to decode (a lazy image with `sizes="auto, …"` held a route until its three-minute timeout), and `OVERFLOW-X` names the element that reaches furthest past the edge.
- **`design:sheet`** accepts a single image, as the Stage 5 step that asks for a page-only sheet needs.
- World building says an arrival starts visible, which the first-screen check already required.

## For sites

Copy the files; the guidance arrives with the usual skill sync. An impression site whose pinned scene changes less than a quarter of the screen now fails `audit:composition` until the scene shows the site's photographs or content at stage size. A site whose record says `impression` only because the client asked for atmosphere may record `editorial` and remove the three pieces, or keep them.
