---
bump: minor
platforms: [emdash]
areas: [delivery, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/d1-export.mjs, scripts/d1-rehearse.mjs, scripts/check-live.mjs, scripts/workers-rules.mjs]
---

# Verified D1 copies, local upgrade rehearsal and live checks for Workers sites

Lessons from moving four live Workers sites to EmDash 1.5. `db:export-d1` now keeps the FTS5 search rows, creates every table before any row, writes to `.emdash/backups/` and refuses a destination Git would track, and writes the copy only when row counts, integrity and foreign keys match a scratch load. New `db:rehearse` loads that copy into a fresh local D1, copies active registry plugin code from R2 and prints the `wrangler dev` command, so a core upgrade runs its migrations on a copy instead of on production (a Cloudflare preview version is bound to the production database). New `check:live` requests every sitemap page on a deployed origin and checks stylesheets, scripts and status codes; it also warns on redirecting sitemap URLs, non-self canonicals, missing or repeated meta descriptions and hreflang that disagrees with the sitemap (`--strict-seo` makes those fail). `audit:site` and `fleet:status` check the Workers rules: `@astrojs/cloudflare` 14.4 or newer on EmDash 1.5, every imported `@emdash-cms/*` package declared, and HTML edge-cache keys per build.

## For sites

Run the commands from a current Baseline checkout inside the site folder (`node <baseline>/scripts/d1-rehearse.mjs`, `node <baseline>/scripts/check-live.mjs`), or copy the four scripts and add `db:export-d1`, `db:rehearse` and `check:live` to the package scripts. Before the next deploy of a Workers site, fix any Workers rule `fleet:status` reports. After a deploy, run `check:live` against every exposed hostname.
