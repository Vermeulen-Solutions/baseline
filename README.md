<p align="center">
  <img src="docs/images/baseline-logo.svg?v=2" alt="Baseline" width="400" />
</p>

<p align="center">
  <strong>Build an Astro website with a clear path from brief to launch.</strong>
</p>

<p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-7.4.0-BC52EE" alt="Astro 7.4.0" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-06B6D4" alt="Tailwind CSS v4" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT license" /></a>
</p>

<p align="center">
  <a href="#quickstart">Start a website</a> ·
  <a href="#choose-your-setup">Choose your setup</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

---

Baseline is an Astro starter for building websites with an AI coding assistant.
It brings together reusable components, responsive design tools, content editing,
and checks that help keep a site consistent as it grows.

Start with a static site, add Git-based editing with Sveltia, or use EmDash CMS
for structured content and live editing. Each option shares the same design
foundation.

<a id="-quickstart"></a>

## Quickstart

Prepare a local site folder, open it as a project in your coding assistant, then
paste a build prompt. Choose your content setup below to create the right folder.
If you already have a prepared site, open its folder and skip to the prompts.

<a id="platform-profiles"></a>
<a id="choose-your-setup"></a>

**How should content be edited?**

| You want… | Use this prompt |
| --- | --- |
| Markdown files edited by you or your agent | [Static](#static-site) |
| A browser editor that saves to GitHub | [Static + Sveltia](#static-site-with-sveltia) |
| CMS forms, structured content, and live page editing | [EmDash CMS](#emdash-cms-site) |

[Compare editing and hosting requirements](docs/platform-profiles.md).

### 1. Prepare the site folder

You need Git and a supported Node.js version; see [requirements](docs/getting-started.md#requirements).
Run the commands below in a terminal, using your own folder name instead of `my-site`.
In Windows PowerShell, use `npm.cmd` wherever an example shows `npm`.

**Static or Static + Sveltia:** clone Baseline as a generator, then generate your
site into a separate folder. For Sveltia, replace `static` with `static-sveltia`.

```sh
git clone https://github.com/Vermeulen-Solutions/baseline.git baseline
cd baseline
npm run init:profile -- --profile static --out ../my-site
cd ../my-site
```

No dependency installation is needed in the generator checkout. The generated
`my-site` folder is your project; open that folder in your assistant. The destination
must be new or empty. [Static setup details](docs/getting-started.md#static-local-setup).

**EmDash CMS:** [create your own repository from the template](https://github.com/new?template_name=baseline&template_owner=Vermeulen-Solutions),
then clone your new repository. With the optional GitHub CLI, both steps are:

```sh
gh repo create my-site --template Vermeulen-Solutions/baseline --private --clone
cd my-site
```

Open the cloned `my-site` folder in your assistant. If it accepts a GitHub repository
instead of a local folder, select your new repository. For a local-only start, you
can also clone Baseline directly into `my-site` and use that checkout for EmDash.
[EmDash setup details](docs/getting-started.md#emdash-local-setup).

### 2. Open the project and give your assistant the brief

Use a coding assistant that can edit project files and run terminal commands.
Select the site folder prepared above when it asks you to open or create a project.
Then choose a workflow and paste the matching profile prompt below, replacing its
bracketed fields. Your assistant handles dependency installation and local setup
inside that project.

<a id="the-7-stage-site-delivery-workflow"></a>

**How should the project run?**

| Workflow | Suitable projects | How work is organized |
| --- | --- | --- |
| **Express** | Small greenfield sites: up to six routes, three collections, and one language | Up to three consolidated checkpoints |
| **Standard** | Larger sites, migrations, multilingual builds, or complex requirements | The full seven-stage workflow |

Both tracks cover content planning, art direction, component calibration,
implementation, and verification. Express consolidates the handoffs; checkpoints
are progress reports, not mandatory stops. Set the workflow field in your prompt;
if unsure, write “recommend” and let the agent assess the brief. The prompts finish
the local site and identify remaining editor or launch steps.
[Workflow details](docs/site-delivery-workflow.md).

### Static site

```text
Build a website in this prepared Baseline project (static profile).

Site and purpose: [name / goal]
Audience: [people]
Pages and content: [what the site needs]
Brand assets and references: [locations or links]
Workflow: [Express (3 checkpoints) / Standard (7 stages)]

Read AGENTS.md and follow the selected new-site-workflow track.
Work in the current project folder, preserve existing work, and install
its dependencies. Use typed Markdown content; this site does not need a
CMS or database.

Complete the local site, design calibration, and applicable verification.
Start its preview and report the URL, checks, assumptions, and pending steps.
```

### Static site with Sveltia

```text
Build a website in this prepared Baseline project (static-sveltia profile).

Site and purpose: [name / goal]
Audience: [people]
Pages and content: [what the site needs]
Brand assets and references: [locations or links]
GitHub repository: [owner/repo, or not set up yet]
Workflow: [Express (3 checkpoints) / Standard (7 stages)]

Read AGENTS.md and follow the selected new-site-workflow track.
Work in the current project folder, preserve existing work, install its
dependencies, and follow its Sveltia setup guide.

Build the site and prepare the Git-backed editor for my repository.
Guide me through authentication. Verify editor login, upload, save,
rebuild, and sign-out when access is available; report any pending editor
setup separately while completing the local site.

Complete design calibration and applicable verification, start the
preview, and report the URL, checks, assumptions, and remaining steps.
```

### EmDash CMS site

```text
Build a website in this prepared Baseline project (emdash profile).

Site and purpose: [name / goal]
Audience: [people]
Pages and content: [what the site needs]
Brand assets and references: [locations or links]
Workflow: [Express (3 checkpoints) / Standard (7 stages)]

Read AGENTS.md and follow the selected new-site-workflow track.
Work in the current project folder. Run doctor, install dependencies, and
configure local Node.js, SQLite, media, and missing secrets, preserving
existing content and keys.
Guide me through first-run CMS administrator setup where needed.

Build the content model, CMS content, and public pages. Complete design
calibration, applicable verification, and editing checks when access is
available. Start the preview and report the site/admin URLs, checks,
assumptions, and any steps still needing my involvement.
```

The agent checks local requirements and handles the remaining setup commands. It should
guide you through any machine setup or editor sign-in that needs your involvement.

[More prompt examples](docs/prompt-library.md) ·
[Manual setup and requirements](docs/getting-started.md) ·
[Optional project brief](docs/project-context.md)

## Why Baseline?

- **A design foundation you can make your own.** Shared colors, typography, and
  spacing adapt across screen sizes. [Design tools](docs/design-framework.md)
- **Reusable Astro components.** Layout, images, galleries, navigation patterns,
  and forms give you a starting vocabulary. [Components and patterns](docs/reusable-public-patterns.md)
- **A place to refine the details.** The development styleguide lets you review
  components before assembling pages. [Design workflow](docs/art-direction-workflow.md)
- **Checks alongside the build.** Checks cover code, types,
  design tokens, and other implementation contracts. [Checks and tested scope](docs/support-boundaries.md)

<a id="daily-commands"></a>

## Everyday requests

Keep working through your assistant:

| You want to… | Ask your assistant |
| --- | --- |
| Preview the site | “Start the local preview and give me its URL.” |
| Make a change | “Update [page or feature], following the site's existing design and content model.” |
| Review the result | “Check the changed pages, run the applicable verification, and report anything still pending.” |

Your assistant can also open the component styleguide and guide you to the content
editor when your setup includes one. The [command reference](docs/commands.md)
documents the underlying tools and the [handoff checks](docs/commands.md#before-handoff)
for manual use, scripting, and troubleshooting.

<a id="where-to-work-project-layout"></a>

## Find your next step

| I want to… | Guide |
| --- | --- |
| Set up locally or find the right project files | [Getting started](docs/getting-started.md) |
| Change the visual direction or layout | [Art direction](docs/art-direction-workflow.md) · [Design framework](docs/design-framework.md) |
| Work with CMS content or move from WordPress | [Editorial editing](docs/emdash-editorial-canvas.md) · [WordPress content](docs/wordpress-content-modeling.md) |
| Publish the site | [Platform and hosting choices](docs/platform-profiles.md) · [EmDash deployment](docs/production-deployment.md) |
| Review Baseline or skill updates | [Site updates](docs/baseline-updates.md) · [Reviewed maintenance](docs/automated-upstream-updates.md) |

[Browse all documentation →](docs/README.md)

<a id="capability-and-support-boundaries"></a>

EmDash runs locally with SQLite and local media; no cloud account is needed to
start. Static content changes require a rebuild to publish. Hosting, authentication,
and launch acceptance depend on the chosen setup. Cloudflare requires separate
configuration and verification, and deploying CMS code does not transfer its
database or media. [Tested scope and limitations](docs/support-boundaries.md).

---

## Contribute

Improving Baseline itself? Start with [CONTRIBUTING.md](CONTRIBUTING.md) for
architecture, compatibility, verification, and skill ownership.

Baseline is [MIT licensed](LICENSE). Bundled materials retain their
[third-party notices](THIRD_PARTY_NOTICES.md); participation follows the
[Code of Conduct](CODE_OF_CONDUCT.md).
