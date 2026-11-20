---
bump: patch
platforms: [emdash, static]
areas: [docs]
adoption: manual
visible: no
database: no
---

# The record heading appears only as the heading in AGENTS.md

AGENTS.md's gate paragraph named the record as `## Art Direction Record` in the middle of a sentence. A trial's script that searched for that text found the sentence before the real heading and pasted the record into it; `check:art-direction` caught it afterwards. The paragraph (EmDash and static profiles) now says "Art Direction Record section", so the heading text appears only where the heading is.

## For sites

Optional: in your AGENTS.md, reword the gate paragraph the same way. Nothing else changes.
