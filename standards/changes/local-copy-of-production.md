---
bump: minor
platforms: [emdash]
areas: [tooling, docs, skills]
adoption: copy
visible: no
database: no
files: [scripts/d1-local-copy.mjs]
---

# `db:local-copy`: production content on the local dev server

The live site's content could already be exported (`db:export-d1`) and served by `wrangler dev` for an upgrade rehearsal (`db:rehearse`), but nothing fed it to `astro dev`. During a design review on a real site the local database had drifted from production, and the agent did not find the existing export at all, because the tools are named and routed by their first purpose (recovery, upgrade rehearsal). `npm run db:local-copy -- --from <export.sql> --to <dir> --origin <https://live-site>` loads the export into a separate SQLite file, fetches every media file (111 of 153 were missing locally on that site) and the active plugin bundles, and prints the `npm run dev` command that serves it; the site's own `./data.db` and `./uploads` are not touched. The starter's `astro.config.mjs` reads `EMDASH_SQLITE_URL` and `EMDASH_LOCAL_MEDIA_DIR`, falling back to `./data.db` and `./uploads`. `AGENTS.md`'s task table, the command reference and `emdash-site-setup` route "production content on the local dev server" to it.

## For sites

Copy `scripts/d1-local-copy.mjs` and add the `db:local-copy` script to `package.json`. In `astro.config.mjs`, change the database URL to `process.env.EMDASH_SQLITE_URL || "file:./data.db"` and the local media directory to `process.env.EMDASH_LOCAL_MEDIA_DIR || "./uploads"` (by hand: the site owns that file). Add the `AGENTS.md` task-table row by hand. The skill sync delivers the `emdash-site-setup` pointer.
