---
bump: patch
platforms: [emdash]
areas: [tooling, dependencies, docs]
adoption: copy
visible: no
database: no
files: [scripts/d1-rehearse.mjs, scripts/workers-rules.mjs]
---

# Upgrade rehearsals refuse a tracked folder; Kumo counts as a declared import

Lessons from taking EmDash 1.6 to five sites.

- `db:rehearse` refuses a `--persist-to` folder Git would track: the copy holds users, sessions and content, and a scratch folder under `.emdash/` was staged for commit on a live site. Keep it under `.emdash/backups/`.
- The rehearsal guide asks for the deploy's own build and environment. A plugin a rehearsal build leaves out is forgotten on start: an email provider included only when a variable was set cleared the site's `email:deliver` selection, which a production build without the variable would have done too.
- The `declared-imports` rule (`audit:site`, `fleet:status`) also reports an undeclared `@cloudflare/kumo`, which EmDash's admin and blocks pin exactly. Baseline declares Kumo 2.19.0 for its `editorial-order` admin page.
- Git Bash rewrites any argument starting with `/` into a Windows path, including URL patterns passed to `node` scripts; set `MSYS_NO_PATHCONV=1`.
- `docs/emdash-overlap.md` lists the Baseline files that overlap EmDash behaviour, with what to re-check on each EmDash upgrade; a test keeps it complete.

## For sites

Copy `scripts/d1-rehearse.mjs` and `scripts/workers-rules.mjs` (or run them from a Baseline checkout). A site whose own plugins import `@cloudflare/kumo` declares it at the version its EmDash admin pins (2.19.0 with EmDash 1.6).
