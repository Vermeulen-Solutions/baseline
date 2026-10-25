---
name: emdash-site-setup
description: Scaffold, configure, and deploy Astro sites that use EmDash. Choose Node.js or Cloudflare independently from whether the site needs registry-installed sandboxed plugins.
---

# EmDash site setup

Use this skill when creating or configuring a new EmDash site, especially when the user expects to repeat the process for multiple sites. Treat each site as an ordinary Astro project with EmDash integration; do not assume every site uses Cloudflare Workers or plugins.

## Decide the setup per site

Before scaffolding, inspect the target workspace and installed Node/package-manager tooling. Never overwrite a non-empty project. Confirm only choices that materially affect the project:

- Site/project name and target directory.
- Hosting target: Cloudflare Workers or Node.js (or another explicitly chosen Node host).
- Whether the site is single-language or multilingual. Ask which locales it needs, the default locale, any fallback rules, and desired public URL pattern; do not assume based on the source site's primary language.
- Whether the site needs registry-installed sandboxed plugins.
- Closest current EmDash template and whether GitHub source control/deployment is wanted. When requested, default the site repo to private; a GitHub repo is useful but not required for manual Wrangler deployment.
- Whether the user wants a local preview only or authorizes provisioning/deploying Cloudflare resources.

When starting from this starter, use the checked-in EmDash skills. Run `sync:emdash-skills -- --check` only for an explicitly requested upstream refresh or an older checkout; review staged differences before applying. Keep project-specific guidance intact.

Keep hosting and plugin sandboxing as separate decisions:

| Hosting | Registry sandboxed plugins | Setup |
| --- | --- | --- |
| Node.js | No | Node adapter and the template's database/media setup; omit a sandbox runner. |
| Node.js | Yes | Add `@emdash-cms/sandbox-workerd` and `workerd`; configure `@emdash-cms/sandbox-workerd/sandbox`. |
| Cloudflare Workers | No | Cloudflare adapter, D1, R2, and Wrangler. Omit Worker Loader and `sandboxRunner` to avoid enabling unused sandbox infrastructure. |
| Cloudflare Workers | Yes | Cloudflare adapter, D1, R2, `sandbox()`, Worker Loader binding `LOADER`, and `PluginBridge` export. Cloudflare requires its Workers Paid plan for Worker Loader. |

A Cloudflare-hosted site without registry sandbox plugins does **not** need Worker Loader just because it runs on Workers. Conversely, a Node-hosted site that needs registry plugins still needs a sandbox runner (`workerd`). Do not use `sandbox: false` in production.

### Curated Registry Sandbox Plugins Evaluation

Before spending days building bespoke schemas, complex interactive admin dashboards, or custom backend services from scratch, always evaluate whether an official, curated sandbox plugin exists on the [EmDash Plugin Registry](https://plugins.emdashcms.com/). 

Because EmDash sandbox plugins run in an isolated WebAssembly/V8 worker sandbox (`workerd`), they provide safe, turnkey capabilities without threatening the host application.

| Capability | Recommended Plugin | What it Provides | Registry URL |
|---|---|---|---|
| **Event Management & Ticketing** | `@vermeulen.solutions/eventual` | Comprehensive event lifecycle management, multi-session schedules, venues, speaker profiles, registrations, and calendar exports. Avoids writing custom event schemas and complex datetime logic. | [Eventual on EmDash Registry](https://plugins.emdashcms.com/plugins/@vermeulen.solutions/eventual) |
| **Translation Dashboards & AI Translation** | `@swiss.ky/linguadash` | Multilingual progress overview, side-by-side translation comparison editor, and automated translation drafting (DeepL/OpenAI) using EmDash's native row-per-locale model. | [LinguaDash on EmDash Registry](https://plugins.emdashcms.com/plugins/@swiss.ky/linguadash) |

When an official registry plugin matches the site requirements:
1. Enable the sandbox runner according to the hosting matrix above.
2. Install the plugin via `npx emdash plugins add <plugin-name>`.
3. Query its exposed data endpoints directly in Astro templates rather than reinventing redundant collection schemas.

## Check current documentation

EmDash and Cloudflare interfaces change. Before using commands or configuration, consult the current official docs relevant to the chosen path:

- [Create your first EmDash site](https://docs.emdashcms.com/getting-started/)
- [Create a blog / Cloudflare scaffold](https://docs.emdashcms.com/guides/create-a-blog/)
- [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
- [Deploy to Node.js](https://docs.emdashcms.com/deployment/nodejs/)
- [Configure the plugin sandbox](https://docs.emdashcms.com/deployment/plugin-sandbox/)
- [Install plugins](https://docs.emdashcms.com/plugins/installing/)
- [Internationalization (i18n)](https://docs.emdashcms.com/guides/internationalization/) when the site will have translated content.
- [Site transfer](https://docs.emdashcms.com/guides/site-transfer/) when copying an existing EmDash site between local and hosted environments.
- [Cloudflare agent setup prompt](https://developers.cloudflare.com/agent-setup/prompt.md) only when the user wants Cloudflare skills/MCPs configured for Codex. Those tools are optional agent tooling, not a site dependency; installing them changes Codex-wide configuration and requires a restart.

Check the joint runtime requirements: this starter's Astro 7.4 baseline requires Node.js 22.22 or later, even when EmDash alone advertises 22.16. Prefer one supported package manager consistently within the generated project. Examples in current docs include the interactive `npm create emdash@latest` flow and the Cloudflare blog scaffold `npm create emdash@latest <site-name> -- --template cloudflare:blog --pm pnpm --yes`; verify the desired template and flags before using them. Use `docs/skill-synchronization.md` for staged updates; never overwrite dirty mirrors. Finish a new-site workflow with reviewed private registration or its explicit pending artifact under `docs/site-registry.md`.

## Scaffold and configure

1. Scaffold into a new directory using the current official template command. Preserve the generated project structure and package manager unless there is a concrete reason to change them.
2. If multilingual, configure the chosen `i18n` locales, default locale, and fallback in `astro.config.mjs` before building routes or importing translated content. Use Astro's default `prefix-other-locales` routing unless there is a verified alternative; prefixing the default locale breaks EmDash admin routes. Single-language sites should remain without an `i18n` block. Check the i18n guide for EmDash-specific query, translation, and URL behavior.
3. For Cloudflare, review `astro.config.mjs`, `wrangler.jsonc`, and the Worker entry point. The standard setup uses distinct `DB` (D1) and `MEDIA` (R2) bindings per site. Wrangler can provision named D1/R2 resources on first deploy; keep names unique and stable for that site.
4. Only when registry sandbox plugins are needed, enable `worker_loaders: [{ binding: "LOADER" }]`, configure `sandboxRunner: sandbox()` from `@emdash-cms/cloudflare`, and ensure the configured Worker main exports `PluginBridge`. Verify named Wrangler environments repeat the bindings they need.
5. Keep `EMDASH_ENCRYPTION_KEY` and all credentials out of Git. Escrow its full comma-separated rotation list independently of the database and retain historical keys for retained snapshots; use the platform's runtime secret mechanism. Before importing or creating valuable live data, agree the applicable database/media/key recovery plan in `docs/cloudflare-backup-restore.md` or `docs/node-backup-restore.md`. An empty first deployment does not need a pre-existing backup.
6. Run the generated project's build/typecheck and existing tests. Local setup may use its local origin. A preview needs distinct database/media/keys; first production setup must wait for the protected canonical-domain bootstrap below.

## Enable AI content management (optional, after deployment)

If the user wants an AI assistant or coding agent to create or update CMS content, make connecting to the deployed site's EmDash MCP endpoint an optional post-deployment setup step. This is per site and independent of hosting and registry plugins. EmDash's site MCP is enabled by default at `/_emdash/api/mcp`; it manages CMS data, not Astro source code or deployments. The separate EmDash Docs MCP only searches documentation and cannot access site content.

Give the user the deployed endpoint, `https://<site-domain>/_emdash/api/mcp`, and configure it using the chosen assistant's current instructions for remote Streamable HTTP MCP servers. Client setup syntax and OAuth support vary, so do not write one harness's CLI command as the universal setup. Prefer OAuth when supported; authorize only the scopes needed, normally `content:read` and `content:write` for content editing. A personal access token is another option where the client supports bearer-token configuration; generate one with `npm run mcp:token` (or `--d1=<db>` for Cloudflare). EmDash still enforces the connected user's role. Cloudflare Access, if enabled, is an additional gate and does not replace EmDash authorization. The local EmDash dev bypass works only against localhost and must not be treated as production authentication.

After authorization, verify that the assistant can list collections and read a representative content item. For a create request, inspect the collection schema first, then create a draft and let the user review it before publishing. A CMS write changes stored content immediately; it does not require a code deployment when an existing server-rendered route already displays that collection. New collections, Astro templates, routes, or visual changes are code work and require a deployment.

The EmDash CLI is a harness-independent alternative for precise or repeatable operations. From the site project, authenticate to the deployed instance and check the identity:

```powershell
npx emdash login --url https://<site-domain>
npx emdash whoami --url https://<site-domain>
npx emdash schema list --url https://<site-domain>
npx emdash schema get <collection> --url https://<site-domain>
```

The CLI can create a draft from a JSON file with `npx emdash content create <collection> --file post.json --slug <slug> --draft --url https://<site-domain>`. New content is published by default if `--draft` is omitted, so preserve draft-and-review behavior unless the user explicitly requests publishing. For updates, read the item first and pass its `_rev` token to `content update`. See the current [EmDash AI tools guide](https://docs.emdashcms.com/guides/ai-tools/), [MCP reference](https://docs.emdashcms.com/reference/mcp-server/), and [CLI reference](https://docs.emdashcms.com/reference/cli/) before relying on commands or scopes.

Keep site infrastructure setup separate from site migration and design work. For a WordPress source, use `$wordpress-to-emdash-content` for content/media transfer; for public pages and reusable Astro components, use `$astro-site-design` to inspect references and implement the presentation.

## Copying an existing EmDash site

Deploying Astro code does not copy local CMS data. For a new remote site, use the documented site export/import flow and analyze the package against the target before importing. A site package carries the content model, entries, editorial history, supported settings, and ready media bytes. The target content area must be empty. Review the plan, map origin principals to target users, run the import, and verify its receipt and public routes. Back up any target content before clearing it.

Site packages exclude users, credentials, secrets, plugin state/storage/settings, and some site-specific settings. They are content transfers, not disaster recovery. Inventory exclusions separately and verify each required plugin workflow after import. Use `site export --output file.emdash` and analyze the empty target before confirming a reviewed import plan. A seed initializes a site; it does not update existing production content on deploy. Never clear production to make an import fit.

## Deploy and verify

The deployment agent owns configuration and verification within the user's existing authorization. Use repository configuration, existing Wrangler authentication and supported APIs; complete routine Cloudflare work with available access. Ask for missing inputs only when the requested operation needs them. Run and record the checks applicable to this release.

For an authorized Cloudflare deployment with authenticated Wrangler, first distinguish a routine code release from a migration, first-time production bootstrap or domain cutover:

1. Identify the configured Worker/environment, run its normal verification/build/deploy commands, and smoke-check the changed public behavior. For dependency upgrades, follow the installed EmDash upgrade work order and [official update guide](https://docs.emdashcms.com/deployment/updating/). Preserve supported runtime `auto` migrations where already configured; do not require a new API token or managed migration pipeline merely because the package version changed. Deploying code does not transfer CMS records or local media.
2. Added core migrations, an observed pending migration or a data-changing project action require a database recovery point before startup/deploy, including in `auto` mode. On D1, record a current Time Travel bookmark using existing Wrangler authentication. Reuse existing media/key recovery versions when those resources are unchanged. Use the explicit migration workflow in `docs/cloudflare-backup-restore.md` when the site already uses it or EmDash requires it, such as for a large migration that cannot run in the Worker. Wrangler's site-owned SQL migrations do not replace core migrations. Do not infer pending migrations or the live EmDash version from deployment dates alone.
3. For caching, metadata or CSP changes, apply the relevant contracts in `docs/edge-cache-lifecycle.md` and run their applicable checks. These checks do not turn every release into a full cache, publisher or cron acceptance exercise.
4. For first production setup, protect bootstrap before exposing an uninitialized database. Attach the canonical production domain and set the effective public origin before creating its admin; do not initialize it on an unrelated workers.dev hostname. Never reset/reseed production or delete users to fix login. Verify setup status and fresh mode-specific login for first launch or authentication/bootstrap changes. The actual setup-status JSON must report `success: true`, `data.needsSetup: false`; a 200 setup SPA, 404 or Access redirect is insufficient. Restrict setup paths externally after bootstrap while preserving normal authentication/media callbacks. Access-blocked probes remain unverified until checked through authorized access.
5. Test production publishing, cache isolation, form delivery, exact-case assets or scheduled-post visibility when the release changes those surfaces or during the initial launch acceptance. Compare environment bindings/provider configuration without logging secret values. Preserve established form and email behavior.

For a release that changes Worker output or behavior, consider the optional candidate check in `docs/cloudflare-worker-candidate.md`. It keeps the previous version at 100% and tests the uploaded candidate by version override. The candidate uses configured production resources, so use an isolated Preview for branch or migration rehearsals and observe the D1 recovery and compatibility rules before any production-backed request.

In a Baseline project, use `docs/image-delivery.md` to prepare/ingest media, stage actual CMS storage keys for R2, and run `media:sync-r2` with explicit target, staging receipt and apply journal. Its default is an offline plan. Whole-site transfer into an empty target is separate from code deployment. For an existing site's domain transition, continue with `emdash-production-cutover`; do not repeat initial admin creation.

If a development site should be private, configure Cloudflare Access before sharing its URL. For a single Worker, Worker-level Access can cover its production and preview URLs, custom domains, and `workers.dev` hostname; select the intended scope and allowlist, then verify a signed-out request is blocked and an allowed account can reach both the site and admin. Do not assume EmDash admin login hides the public Astro site. See [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/). This is an optional deployment choice; do not apply it to a site intended to be public.

For registry-installed plugins, verify all three prerequisites before installation: configured storage for downloaded bundles, an available runner, and an admin with `plugins:manage`. In the EmDash Registry, find the plugin by its full public name, review the publisher and declared permissions, install it, and verify it appears under Plugins. Inspect the installed plugin's actual public surface; a JSON route is data, not a visitor-facing page. Implement site presentation in Astro when the sandboxed plugin does not supply it.

After a first site is proven, the user may want a clean GitHub template repository for recurring setups. Keep per-site identifiers, databases, buckets, domains, admin accounts, and secrets separate. Report the chosen hosting/plugin combination, commands actually run, created Cloudflare resources, validation results, and any live checks still outstanding.

## Agent documentation and image setup

For this starter, verify Astro and EmDash docs MCP queries in Codex and Google Antigravity during setup; follow docs/agent-documentation.md. Repository configuration does not imply client activation or Antigravity user-level inheritance. For images follow docs/image-delivery.md: Node uses native Sharp; Cloudflare needs its supported image service/binding for runtime CMS uploads. Do not copy client domains, bindings or billing choices.

## Post-Setup Handoff Prompt

When scaffolding and platform configuration are complete:
> **Platform Setup Complete!**
> The project structure, hosting adapter, and localization configurations are established.
>
> **Recommended Next Step:**
> - Return to `new-site-workflow` and proceed to **Stage 3: Content Structure & Admin Setup**.
>   *Shall we begin setting up the editing forms and collections in your EmDash admin?*

## Engineering verification loop

For the EmDash foundation, preflight with `npm.cmd run doctor`, use
`npm.cmd run verify:fast` during edits, then run `npm.cmd run verify`,
`npm.cmd run build`, and `npm.cmd run audit:html` against that fresh build
before handoff. On Unix use `npm` in place of `npm.cmd`. Set up the local
Git pre-commit hook once with `npm.cmd run setup:hooks`; it runs doctor and
verify:fast and preserves existing hook managers. It supplements the final gate
and CI; Git hooks are local and can be bypassed. The HTML audit checks emitted
HTML or automatically captures linked public SSR responses from the local
production CMS. Missing published content or broken navigation fails the audit;
see `docs/html-integrity.md` for capture limits and snapshot inspection. For generated
static profiles, inspect the installed package scripts and use their verification
commands; do not add CMS tooling to satisfy an unavailable command.
