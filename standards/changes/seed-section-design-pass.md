---
bump: minor
platforms: [emdash, static]
areas: [skills, docs]
adoption: sync
visible: no
database: no
---

# Design by settling one section with the owner, then carrying it across the site

On a real club site the step that held was settling one section's styling with the owner, then carrying it to the rest of the site one section at a time: the first section was marked 7.5 and the pages after it about 7, from 6.5, where whole-screen concepts had stalled at about 6.5 over fourteen rounds of trials. One careful pass beat four autonomous critique rounds on the same section (7.5 against 6.5). The rest of the owner's time went on gaps this procedure now closes: wrong facts designed well, a settled treatment replaced later, enlarged text unchecked, and single templates left out.

- `site-art-direction/references/design-iteration.md` gains "Settle one section, then carry it across the site": pick the seed section, check its facts with the owner before designing it, make one considered pass checked for defects only and let the owner mark it, record what was settled, carry it to every page type (single templates included) one section at a time, and close each pass with `audit:ui`.
- The Art Direction Record schema gains an optional `Settled Treatments` field (`site-art-direction`); a different treatment for a settled component needs the owner's say first.
- `astro-site-design/references/accessibility.md`: run `audit:ui`'s enlarged-text cases on every touched page type, stack cards with container queries in `rem`, and the zero-width collapse of `container-type: inline-size` on a box its parent sizes by content.
- `emdash-site-setup`: what changing content on a live EmDash 1.5.0 site needs (token refresh, `_rev`, links through the content API and publishing the staged draft, roles through `taxonomies`, the failing translation of linked entries, the page cache) and how to log the CLI in to a local dev server whose database is a copy of a deployed site.

## For sites

The skill sync delivers the skill changes. In the site's `AGENTS.md`, add the "Roll out and redesign by settling one section…" sentence to the design iteration section by hand (the site owns that file), and add `Settled Treatments` to the Art Direction Record when the owner settles a treatment.
