---
bump: none
platforms: [emdash, static]
areas: [docs]
adoption: none
visible: no
database: no
---

# The automation branch gate checks out full history

Baseline's daily gate for the weekly upstream proposal now checks out the branch with full git history, as the producing run does, because some unit tests read older commits of a file. The maintenance doc says so.

## For sites

Nothing.
