---
bump: patch
platforms: [emdash, static]
areas: [components, docs]
adoption: copy
visible: no
database: no
files: [src/components/PhotoSet.astro]
---

# PhotoSet takes the arrangement that fits the photographs it is given

`PhotoSet` stopped the build when the number of photographs did not suit its layout. The photographs usually come from content an owner edits, and design sprints that halved and doubled their content broke on it in four of seven runs: one build failed on a strip of eight, and the others dropped whole sections to avoid the error.

- A count that suits the layout is shown as before, with the same markup and geometry.
- Otherwise the set shows what is there in the arrangement that fits: one photograph alone (across the set, or on half the width beside the words), two as a pair, three as a trio, four or more as a strip, which wraps into rows of equal length past six.
- An item without an `image` is left out, and a set with no photographs and no words renders nothing.
- The development server prints one line when the count does not suit the layout. A misspelt `layout` is still a build error.

## For sites

Copy the file (`site:files --files src/components/PhotoSet.astro --apply`) on sites that use the component, then refresh its entry in `audit/design-gate-exceptions.json`. Sets whose counts suit their layouts look the same. Remove any code a site wrote to hide a set when its count changes.
