# Getting started

[Back to Baseline](../README.md) · [Choose a platform](platform-profiles.md) ·
[Command reference](commands.md)

For the agent-first path, follow the [README quickstart](../README.md#quickstart):
prepare the site folder for Static, Sveltia, or EmDash, then open that folder as
a project in your assistant. Paste the matching build prompt and select Express
or Standard. Each prompt asks your assistant to install dependencies, configure
the local environment, build the site, and start a local preview. The commands below are
the manual reference for those operations; you can ask your assistant to run them.

Choose the editing and hosting model before installing dependencies. The full
repository is the EmDash Node/SQLite starter. Static and static-sveltia projects
are generated into their own directories; they use their generated instructions.

## Requirements

Use npm and the supplied lockfile. The supported Node.js engine range is
`^22.22.3 || ^24.16.0 || >=26.3.0`, as declared in [package.json](../package.json).
Node 24 LTS, version 24.16.0 or later within the 24.x line, is the recommended choice.

Setup commands below have separate Windows PowerShell and macOS/Linux blocks.
The PowerShell blocks use `npm.cmd` and `npx.cmd` to avoid script execution-policy
friction. No policy change is needed.

Git is needed to clone a repository and record changes. The GitHub CLI is optional:
the [template button](https://github.com/new?template_name=baseline&template_owner=Vermeulen-Solutions)
also creates an EmDash site repository.

## EmDash local setup

Create your own repository from the template, clone it, and work in that directory.
If you already cloned Baseline for a new EmDash site, continue in that checkout.

You can use the template button linked above, or the GitHub CLI:

```sh
gh repo create my-site --template Vermeulen-Solutions/baseline --private --clone
cd my-site
```

Open this cloned site folder as the project in your coding assistant. You can
now use the README's EmDash prompt, or initialize the local environment manually:

Windows PowerShell:

```powershell
npm.cmd run doctor
npm.cmd ci
npx.cmd emdash secrets generate --write .env
npm.cmd run dev
```

macOS / Linux:

```sh
npm run doctor
npm ci
npx emdash secrets generate --write .env
npm run dev
```

Doctor runs without installed dependencies and checks the runtime and workspace.
Warnings exit successfully; critical failures exit with an error. If npm cannot
start, use `node scripts/doctor.mjs --json`. See [diagnostics](commands.md#discovery-and-diagnostics).

Generate secrets for a fresh local setup; keep .env ignored and preserve existing
keys when resuming an established site. Use the [backup and recovery guidance](node-backup-restore.md)
before changing an instance that already owns content.

Open Astro's printed local origin, then visit `/_emdash/admin` for first-run
administrator setup and starter-content setup. Use the initial seed only for a
fresh instance; [seed/seed.json](../seed/seed.json) is not a deploy-time migration.
Use the actual port printed by Astro rather than assuming port 4321.

This is local setup. Hosted administrator bootstrap and secret/storage configuration
follow the [production deployment runbook](production-deployment.md).

## Static local setup

Use a local Baseline checkout as the generator workspace. Its generator uses
Node built-ins; installing the EmDash dependencies there is unnecessary for generation.

If you do not already have that checkout:

```sh
git clone https://github.com/Vermeulen-Solutions/baseline.git baseline
cd baseline
```

Generate and install the actual site:

Windows PowerShell:

```powershell
npm.cmd run init:profile -- --profile static --out ../my-site
cd ../my-site
npm.cmd install
npm.cmd run dev
```

macOS / Linux:

```sh
npm run init:profile -- --profile static --out ../my-site
cd ../my-site
npm install
npm run dev
```

Open the generated `my-site` folder as the project in your coding assistant,
rather than the Baseline generator checkout. If you use the README's Static or
Sveltia prompt, your assistant can handle installation and preview after generation.

The destination must be new or empty, outside the source checkout, with an existing
parent directory. To include Sveltia, substitute `--profile static-sveltia`.

The generated project has its own package definition, AGENTS.md and README.
Commit its initial package-lock.json and use `npm ci` afterward. The generator
does not initialize Git; initialize or connect the new site's repository deliberately.
Keep baseline.config.json and .baseline/managed-files.json tracked for reviewed
updates. See [platform profiles](platform-profiles.md).

For Sveltia, follow docs/sveltia-cms.md inside the generated project to configure
its GitHub repository and OAuth proxy or personal access token. The editor saves
Git-owned files; rebuilding publishes them. Test real sign-in, upload, save, rebuild,
and sign-out before handing it to editors.

## Shape the site

Read the site's AGENTS.md and use its checked-in skills. Provide purpose, audience,
pages/content, editing needs, and real brand assets or references. The
[prompt library](prompt-library.md) has Express and Standard kickoff examples.

Before client-specific visual implementation, establish the Art Direction Record
in AGENTS.md, initialize the real site tokens, and calibrate production components
on the local styleguide. Your assistant follows the gate and the relevant steps
in [the design workflow](art-direction-workflow.md).
This replaces starter samples with choices based on the actual site brief.
An optional [project brief](project-context.md), starting from
[PROJECT.example.md](../PROJECT.example.md), can hold durable client context.

## Local destinations

Use the origin printed by `npm run dev`.

| Destination | Use |
| --- | --- |
| Public site | Preview the website |
| EmDash `/_emdash/admin` | CMS setup and content editing; EmDash profile only |
| Component calibration path printed by Astro | Review typography, layout and specimens during development |
| Sveltia `/admin/` | Git-based editing after repository/authentication setup; Sveltia profile only |

With default base/slash settings, calibration is at `/_styleguide` for the root
application and `/_styleguide/` for static sites. Use the printed path when those
settings differ. The styleguide is excluded from production; fixture builds are
for testing and must not be deployed.

## Where to work

| Path | Purpose |
| --- | --- |
| src/pages/ | Public route templates |
| src/layouts/Base.astro | Site navigation and platform-specific layout wrapper |
| src/components/ | Reusable components; SiteShell.astro in src/layouts/ supplies the shared document shell |
| src/styles/global.css | Shared design tokens and base styling |
| src/assets/ | Source imagery processed by Astro |
| seed/seed.json and src/live.config.ts | Initial CMS schema/content and live collection registration; EmDash only |
| src/content.config.ts and src/content/ | Typed file-based content; generated static profiles |
| src/config/site.ts | Site identity and navigation in generated static profiles |
| .agents/skills/ | Checked-in specialist guidance |
| docs/ | Detailed workflows and reference material |

Keep CMS editorial content in EmDash and use its content/media APIs and edit
attributes. [Editorial canvas](emdash-editorial-canvas.md) covers rendering and
save/reload verification. Static content uses Astro Content Collections and its
paired Sveltia form when selected. Follow [image delivery](image-delivery.md) for
asset ownership and native processing.

## Verify and publish

Follow the [handoff checks for the installed profile](commands.md#before-handoff),
including browser review. Commands alone do not establish design approval or
production acceptance.

Static sites deploy their verified dist/ to static hosting with correct missing-page
behavior. EmDash requires its configured server runtime and persistent database,
media and secrets. Cloudflare adoption is separately configured and verified.
Use [platform guidance](platform-profiles.md) and the
[production runbook](production-deployment.md); copying code does not move CMS data.

For optional CMS content tools and documentation MCP connections, see
[agent configuration](agent-documentation.md). For starter, dependency or skill
updates, use the [reviewed maintenance procedures](automated-upstream-updates.md).
