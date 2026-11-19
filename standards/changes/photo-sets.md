---
bump: minor
platforms: [emdash, static]
areas: [components, skills, docs]
adoption: copy
visible: no
database: no
files: [src/components/PhotoSet.astro]
---

# Photo sets: a different arrangement in each photographed section

A trial site built with the expressive layer still showed its works as fifteen rows of the same shape (words on one side, one photograph on the other) and put words beside a single photograph in section after section. Baseline offered a full-width stage and an index, but nothing between them for a section built round several photographs.

- New `PhotoSet` component with four arrangements: `pair` (one ratio, tops level), an offset `trio` of three sizes of one subject, a `strip` of three to six square details, and `tallSmall` (a tall photograph with the section's words and a small square at its foot). Each has a planned phone layout, crops by design around a `focus` point, takes the site's `tone` treatment, and makes a linked photograph come a little closer under a fine pointer. The build stops with the reason when the number of photographs does not suit the layout.
- Guidance: words beside one photograph happen once a page, the other photographed sections each take a different arrangement, and neighbours never repeat one (`shipped-primitives.md`, `distinctive-direction.md`, `docs/reusable-public-patterns.md`).
- `/_expressive` shows the four arrangements; the visual suite checks their geometry at 390, 768 and 1440 and captures them.

## For sites

Nothing changes until a site uses it. To use it, copy `src/components/PhotoSet.astro` (`site:files --files src/components/PhotoSet.astro --apply`); the guidance arrives with the usual skill sync.
