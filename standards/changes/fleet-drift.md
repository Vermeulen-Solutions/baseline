---
bump: none
---

# fleet:drift lists what sites changed in Baseline-owned files

A maintainer command, `npm run fleet:drift`, reads every site in the private fleet list and sorts each file in its Baseline-owned skills and pinned helpers:

- **known:** matches a version from Baseline's history;
- **changed:** Baseline has the path, but never with this content;
- **added:** Baseline never had the path.

For each changed or added file it writes a patch against the site's adopted release, plus a summary, to a private folder outside Baseline and the sites. It never opens a pull request. Nothing changes for sites.
