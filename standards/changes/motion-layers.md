---
bump: patch
platforms: [emdash, static]
areas: [skills]
adoption: sync
visible: no
database: no
---

# The world's motion comes in four layers

Measured on studio-built sites for a race and an embroidery shop, both built with Astro and plain CSS, no animation library: their home pages run 70 to 140 animations, in four layers. Nearly every part of every section arrives as it enters the screen (50 to 110 entrances, a list item by item); seven or eight motions belong to the subject (mud lands, words are stamped, a route draws itself, contour lines drift with the scroll); one or two slow loops keep the page alive (a ticker, a floating hero, a breathing display line); and every control answers. The trial builds ran two world motions and nothing else, although the starter ships the entrance layer (`data-reveal`).

- World building's motion step names the four layers: entrances with `data-reveal` on each part of a section, three to five named world motions, one or two ambient loops of 8 seconds or more, and feedback. Recipes show a list arriving item by item through a growing `--reveal-range` (and `data-reveal-delay` for the observer fallback) and an ambient loop paused on hover and focus.
- The interaction motion reference keeps its restraint for controls and for text being read, and points to world building for the site's motion. Impeccable's question of whether the site moves is answered by the recorded world.
- The Impeccable passes keep the four layers: `animate` and `quieter` tune their timing rather than removing them.

## For sites

The guidance arrives with the usual skill sync.
