---
bump: none
---

# Baseline repository URLs on main are checked

`docs/skill-synchronization.md` now explains that skills link to Baseline-only files by URL on `main`, so they show current guidance rather than the release a site installed. Baseline's skill-link test now fails when any such URL names a file that no longer exists. Nothing changes for sites.
