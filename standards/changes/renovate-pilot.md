---
bump: none
---

# Renovate pilot for Baseline's pinned packages and GitHub Actions

Baseline's own repository now runs Renovate for exact-pinned npm packages, GitHub Actions and workflow Node versions. Each Renovate pull request carries its own change note, written by the new `scripts/dependency-note.mjs`; the list of paths that reach sites moved to `scripts/standards-paths.mjs` so that script can read it. Both scripts are maintainer tools that sites do not receive; sites have nothing to run or change.
