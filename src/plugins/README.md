# Trusted in-repo EmDash plugins

Put site-owned native plugins in `src/plugins/<plugin-name>/index.ts`. Import
the plugin explicitly in `astro.config.mjs` and register it in
`emdash({ plugins: [plugin] })`. Use the installed `emdash` native plugin exports
and its `definePlugin`/`createPlugin` contract; follow the factory shape exported
by the plugin. Nothing in this directory is auto-discovered or activated.

Native plugins run with the site's authority. Registry plugins are isolated
sandbox bundles registered through the EmDash sandbox/registry installation
flow, with declared capabilities and a configured runner. Do not import a
registry bundle as trusted code to give it access to host bindings. Consult
`.agents/skills/creating-plugins/` and https://docs.emdashcms.com/plugins/.

`baseline-metadata/index.ts` is the explicitly configured site-owned native
metadata hook. It contributes `breadcrumbs` and `organization` JSON-LD IDs to
EmDashHead at priority 10000, after ordinary priority-100 hooks. Core owns
serialization, ID deduplication, SEO-panel precedence and CSP hashes. This
requires no sandbox runner, registry install, storage or network access. Its
organization-page policy is configured as `options.organizationPaths` in
astro.config.mjs; use an empty array for personal publishers or another owner.
Set `options.breadcrumbs: false` when another plugin owns breadcrumb output.
Different contribution IDs are distinct even when schema types match; share
the IDs to override these fallbacks, or disable the relevant baseline output.

The future media guard can use the typed `media:beforeUpload` and
`media:afterUpload` hooks. Before-upload can modify file information or reject
an upload; after-upload observes the saved media. Verify installed hook/event
types when implementing media metadata updates. That future guard is not
installed; the baseline metadata hook creates no models, AI calls, uploads,
credentials or Cloudflare resources.

`CloudflareBindings` in `src/env.d.ts` describes optional `env.DB`, `env.MEDIA`
and `env.AI` using official Workers types, imported as types only to avoid
polluting the Node/DOM globals. Narrow `env.AI` before use and pass the runtime
environment into trusted plugin code. Node/SQLite has no AI binding. When
adopting the Cloudflare adapter, configure actual binding names in Wrangler,
run `wrangler types`, and use its generated runtime `Env`; the optional
capability interface is not a substitute for deployment configuration.
See https://developers.cloudflare.com/workers/languages/typescript/.

This directory and its binding types/dependency belong exclusively to the
EmDash profile. Static generation uses explicit file/package allowlists;
`sync:baseline` cannot add plugin code to those generated sites.
