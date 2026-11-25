---
bump: patch
platforms: [emdash, static]
areas: [skills, docs]
adoption: copy
visible: no
database: no
files: [docs/opendesign-onboarding.md]
---

# OpenDesign review: the owner's steps, every round

In the first review of a real site, the owner had to find the new files without being told where they were (the project's **Design Files** tab) and to know that the desktop window needs `Ctrl + R` after every upload.

`opendesign-site-design` now has the agent give the owner numbered steps in chat every round, with the real project and file names: reload, open the project's Design Files tab, open the named file, comment (not Send to chat), then say done or name the version picked. A pick with no notes is a complete answer. A note on a line inside a box is read against the component it sits in.

For a page that already exists, the first round is a self-contained copy of the live page that the owner marks before any new direction is drawn; CSS animations still run in it.

## For sites

Copy the onboarding guide; the skill comes with the sync.
