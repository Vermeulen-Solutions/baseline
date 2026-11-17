# Choosing EmDash Registry Plugins

This guide applies to the `emdash` profile. It records what a full review of the [EmDash Plugin Registry](https://plugins.emdashcms.com/) (321 plugins from 121 publishers, November 2026) taught us about choosing plugins for a client site. Most listings were small single-purpose review tools, e-commerce or AI article writing; few matched the needs of a typical brochure, club or association site. Many of those needs are better met in the site itself.

Recommendations below rest on the registry listing as published on the review date, unless the table says the source or manifest was read. Note the version you install in the site's decisions. Re-check the listing before installing: versions, permissions and Cloudflare support change.

## Review a plugin before installing it

Read the registry page first:

- **Permissions.** Each one is something the plugin can do on the site. Compare them with what the plugin claims to do.
- **Allowed network hosts.** A plugin should list the hosts it talks to. Prefer a short, named list.
- **Cloudflare support statement.** Some publishers state they verified only Node, or that Cloudflare is not supported.
- **Minimum EmDash version** and the site's pinned version (see `docs/README.md` for the current pin).
- **Last update** and whether the publisher answers issues.
- **Source.** When the page links a repository, read the manifest and the routes that use the risky permissions.

Red flags, each a reason to look harder or decline:

- `network:request:unrestricted`: the plugin may send site data anywhere.
- Broad content write or publish rights for a plugin that should only read.
- No public source.
- Verified only on Node, or only on an older EmDash than the site runs.
- All-in-one suites asking for around ten permissions to cover features the site does not need.

Try the plugin on a local copy of the site first (Node with the `workerd` sandbox runner, see the hosting matrix in the `emdash-site-setup` skill). A Registry install on the deployed site is a production change: it runs third-party code against live content, so it needs the owner's approval like any other production change. Record the plugin, version, permissions and reason in the site's decisions.

## Cloudflare constraints

- **Worker Loader.** Sandboxed Registry plugins on Workers need the Worker Loader binding (`LOADER`), `sandboxRunner: sandbox()` and the `PluginBridge` export. Worker Loader requires the Workers Paid plan. A site with no Registry plugins should not enable it.
- **Calls back to the site.** A sandboxed plugin may make only about 10 calls back to the site per request. Plugins that walk many entries per request (link checkers, bulk SEO tools) can hit this limit on a real site even if they pass on a small fixture.
- **Scheduled work.** Plugins that run on a schedule need a cron trigger in the Wrangler configuration; without one they install but never run.
- **One owner for JSON-LD.** EmDash keeps the first structured-data contribution for a page. If the layout and an SEO plugin both contribute JSON-LD, only one survives. Decide which one owns structured data and turn the other off.

## Needs that should not be a Registry plugin

- **Site mail on Cloudflare.** Use EmDash's native `cloudflareEmail` provider from `@emdash-cms/cloudflare/plugins` with a `send_email` binding; it is configured in `astro.config.mjs`, not installed from the Registry. The `emdash-production-cutover` skill has the setup, and its `references/contact-forms.md` explains why public forms must send through the binding: anonymous requests have no `locals.emdash.email`.
- **Structured data.** A site can emit `Organization`, `SportsClub`, `Place`, `Event` and similar JSON-LD from its layout, using its own settings and collections, in every locale it serves. This is usually more accurate than a generic plugin.
- **Spam protection for the site's own forms.** Use Cloudflare Turnstile with server-side verification and a rate-limit binding in the site's form endpoint, as the contact-forms reference above describes. A form-builder plugin is not needed for that.
- **Bilingual sitemaps and hreflang.** SEO plugins inherit EmDash's single `urlPattern` per collection, so they produce wrong URLs when localized slugs differ. Follow [Search-facing URLs when locale paths differ](internationalization.md#search-facing-urls-when-locale-paths-differ).

## Worth considering

| Plugin | Reviewed | Use it when | Notes |
| --- | --- | --- | --- |
| `audit-log` (`@plugins.emdashcms.com`, official, also on npm as `@emdash-cms/plugin-audit-log`) | Listing and source (0.2.4), 2026-11-17 | Several people edit the site | Change history for content and media uploads (not settings). Every save stores a full before/after copy of the entry in plugin storage, with no retention limit and no way to exclude a collection. Decide first whether collections holding personal data (form submissions, members) may be copied that way; if not, keep them out of the admin's editing path or wait for a filtered version. Otherwise the one plugin worth installing before launch on a multi-editor site. |
| Cloudflare Web Analytics (`@chiji.tech/cloudflare-analytics`) | Listing and source, 2026-11-17 | The site is live and has real traffic | Uses a read-only Account Analytics token and is visible to admins only. Cloudflare Web Analytics is cookieless, so it needs no consent banner. Install at launch, not before. |
| Site Health & Broken Links (`@moorage.dev/site-health`) | Listing and manifest, 2026-11-17 | After the domain cutover | Manifest asks for unrestricted network, `email:send` and redirects. Needs a cron trigger and a mail transport. Mind the per-request call limit on large sites. |
| SEO & Schema Markup (`@moorage.dev/seo`) | Listing and source, 2026-11-17 | The site does not write its own structured data | Limits found: one location only, no sports-club or `Event` type, English-only breadcrumbs. Do not combine with layout JSON-LD. |

Watch: moorage Restore offers point-in-time D1 restore. It needs an API token that can write to D1, and it was not yet in the Registry when reviewed. Until it is, follow [Cloudflare Backup & Restore](cloudflare-backup-restore.md).

## Not recommended by default

- **All-in-one SEO suites** asking for around ten permissions. At least one states it does not support Cloudflare. They duplicate what the layout, the SEO panel and `check:live` already cover.
- **Social auto-posting plugins** that need paid accounts with outside services. They add credentials and cost for little gain on small sites.
- **Cookie-consent plugins** when the site uses only cookieless analytics and has no third-party embeds. With nothing to consent to, a banner only adds friction. Revisit if the site adds tracking or embeds.
