---
bump: none
platforms: [emdash, static]
areas: [tooling]
adoption: none
visible: no
database: no
---

# site:files blocks dependents of blocked files in any order

`site:files` checked each adoption once, in path order, so a file importing a blocked file that sorted after it was still adopted. Blocking now repeats until nothing changes.

## For sites

Nothing to do: the tool runs from the Baseline checkout.
