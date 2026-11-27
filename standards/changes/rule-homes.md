---
bump: patch
platforms: [emdash, static]
areas: [docs, tooling, skills]
adoption: copy
visible: no
database: no
files: [docs/skill-writing.md, scripts/check-skill-wording.mjs, tests/skill-wording.test.mjs]
---

# Each design rule has one home, listed in a table that `check:skills` keeps true

The same rule was stated in full in several skill files, and the copies drifted. Two cases came out of one review: a lane and the OpenDesign design-system file prescribed a look that world building names as the easy version, and the design-system file described the accent voice as an italic on one or two focal words after `accent-word` had made that a finding.

- `docs/skill-writing.md` has a new section 6 with a table of 22 rules: the file and words where each is stated in full, and the script or finding that checks it. Other files may name a rule in a clause and give the home's file name; a restatement is removed when its file is next edited, not in one pass.
- `check:skills` reads the table as rule `rule-home`. A row fails when its file is gone, the quoted words are no longer in it, a script it names is not in `package.json`, or a finding name appears in no script. The check does not find restatements.
- The OpenDesign design-system file now states the accent rule as its home does.

## For sites

EmDash sites carry these maintainer files with the repository. Copy the three files in the same update that syncs the skills: the table quotes words from the current skills, so a site whose skills are older reports `rule-home` findings in `npm run lint` until the skills are synced. Static sites do not receive these files.

## Considered and deferred

- Removing the existing restatements. It would rewrite much of the design skills at once, which needs a trial build first.
- A check that finds a rule restated outside its home. Telling a restatement from a permitted mention needs judgment a pattern does not have.
