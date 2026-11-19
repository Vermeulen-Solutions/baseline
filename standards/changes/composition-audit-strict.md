---
bump: minor
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs]
---

# audit:composition reports the split hero and uniform galleries, and a signature must stand out

A trial site that followed the art-direction method passed `audit:composition` with one finding while still opening on a heading beside a photograph and showing fifteen works in equal frames. The audit now also reports:

- `split-hero`: the page opens with its heading beside a photograph narrower than 60% of the screen;
- `uniform-gallery`: six or more pictures in equal frames in one grid, none larger than the rest;
- `no-signature` more strictly: a large heading counts as a statement only when it is markedly larger than the page's other headings (or a giant opening line at least twice their size), and a frame shape alone no longer counts.

Recalibrated on real pages: the designed school and church sites from the first calibration report 0 and 2 findings; the trial's home page now reports its split hero and missing signature, and its works page the uniform gallery.

## For sites

Copy `scripts/audit-composition.mjs` (`site:files --files scripts/audit-composition.mjs --apply`).
