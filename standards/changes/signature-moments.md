---
bump: minor
platforms: [emdash, static]
areas: [skills, styles, components, docs]
adoption: copy
visible: no
database: no
files: [src/styles/expressive.css, src/components/MediaStage.astro, .agents/skills/site-art-direction/references/distinctive-direction.md]
---

# Signature moments that are signatures, and one treatment for mixed photographs

A trial build of a maker's site from a plain brief followed the art-direction method step by step and still produced a tidier template: it took the example governing idea from the table word for word, called a heading beside a photograph and a row of three steps its "signature moments", and kept every phone photograph small in the same frame because they were low resolution.

- `distinctive-direction.md` now asks for three candidate governing ideas taken from the client's own material and discards the first; the examples show the stock idea next to a specific one so they cannot be copied as answers. A signature moment must pass three tests (only this subject; twice the scale or a different kind; still recognisable as a thumbnail), and a split hero, a step row, an equal grid, a ruled list on its own or a closing call to action never counts. A new section covers weak and mixed photographs: choose three, judge size by eye, crop to a detail, unify with one treatment, let type carry the big moment, and never pillarbox a portrait in a landscape frame. "The photographs are low resolution" is no longer a reason on its own to record an exception.
- `expressive.css` adds `data-tone="warm|mono|duotone"` on a frame (or `warm`/`mono` on an image): one photograph treatment for the whole site, so owner photographs of different ages and light read as a set. Duotone prints in `--tone-ink` (the action colour) with highlights held to `--tone-paper` (the page ground). `MediaStage` takes it as `tone`.
- `site-art-direction` and `shipped-primitives` carry the same tests.

## For sites

Nothing changes until a site opts in. Sites that already took the expressive layer copy the new `src/styles/expressive.css` and `src/components/MediaStage.astro` (`site:files --files ... --apply`); the skills arrive with the usual skill sync.
