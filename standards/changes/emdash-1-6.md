---
bump: minor
platforms: [emdash]
areas: [dependencies, components, docs]
adoption: manual
visible: no
database: yes
---

# EmDash 1.6.0

Baseline pins `emdash` and `@emdash-cms/auth` at 1.6.0 (Kumo 2.19.0, one migration that adds `users.last_login_at`) and moves the evaluated forms target to 0.2.14. The starter pages set the entry or taxonomy cache hint before a 404, so a cached miss is purged on publish, and pass the page locale to menu and taxonomy reads. The reviewed adapters now name 1.6.0; the hosted-auth probe also accepts 1.5.0.

## For sites

Follow [EmDash 1.6 upgrade](../../docs/emdash-1.6-upgrade.md): back up and rehearse the database, update core, auth, Kumo-pinned plugins (Forms 0.2.14) and, on Workers, `@emdash-cms/cloudflare@1.6.0` and any `sandbox-workerd` runner (0.9.8) together. Apply the template changes in its "Template changes" section to the site's own pages and `Base.astro`. After the deploy, run `npx emdash media repair-usage --all` once and check `GET /_emdash/api/health` reports 1.6.0.
