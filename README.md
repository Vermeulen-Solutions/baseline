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
  <a href="#choose-your-setup">Choose your setup</a> ·
  <a href="#quickstart">Start a website</a> ·
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

<a id="platform-profiles"></a>

## Choose your setup

Choose how the site will be edited and hosted:

| Setup | How content is edited | Hosting |
| --- | --- | --- |
| **Static** | You or your assistant edit Markdown files | Static hosting |
| **Static + Sveltia** | A browser editor saves content to Git | Static hosting; GitHub authentication for editors |
| **EmDash CMS** | CMS forms and live page editing | Node.js, SQLite, and persistent media by default |

**The repository template is the EmDash setup.** Static sites are generated into
a separate directory. [Compare the options and requirements →](docs/platform-profiles.md)

<a id="-quickstart"></a>

## Quickstart

Use **Node.js 24 LTS (24.16.0+)** and npm.
[Other supported versions and Windows instructions](docs/getting-started.md#requirements).

### With EmDash CMS

[Create a repository from this template](https://github.com/new?template_name=baseline&template_owner=Vermeulen-Solutions),
then clone and open your new repository.

Or, with the GitHub CLI installed:

```sh
gh repo create my-site --template Vermeulen-Solutions/baseline --private --clone
cd my-site
```

Continue with the assistant prompt below, or follow the
[manual local setup](docs/getting-started.md#emdash-local-setup).

### With static content or Sveltia

Clone Baseline as a generator workspace, then create your site separately:

```sh
git clone https://github.com/Vermeulen-Solutions/baseline.git baseline
cd baseline
npm run init:profile -- --profile static --out ../my-site
cd ../my-site
npm install
```

For browser editing, use `--profile static-sveltia` instead of `--profile static`.
Then follow your generated site's README and Sveltia setup guide. Commit its new
lockfile before enabling CI. [Static setup details](docs/getting-started.md#static-local-setup).

<a id="the-7-stage-site-delivery-workflow"></a>

### Build with your assistant

Open your assistant in the **site's directory** and give it your brief:

```text
Read AGENTS.md and follow the relevant site workflow.

Build a website for [name / organization].
Its purpose is [goal], and its audience is [people].
It needs [pages or content] and will be edited by [who / how].
Available brand assets and references: [locations or links].

Complete the local implementation and verification.
Record assumptions, checks performed, and decisions still needed.
```

The checked-in instructions guide the assistant through content, design,
implementation, and review. Smaller sites use three checkpoints; complex builds
and migrations use the fuller seven-stage workflow.

[More prompt examples](docs/prompt-library.md) ·
[Delivery workflow](docs/site-delivery-workflow.md) ·
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

## Daily commands

Run commands from your site directory:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run verify` | Run your project's verification suite |
| `npm run build` | Build the production output |

Use the local URL printed by Astro. EmDash adds `/_emdash/admin`; the development
styleguide's path is printed at startup. Sveltia sites have a separate `/admin/`
interface that needs repository and authentication setup.

Final delivery includes additional checks for your setup and browser review.
See the [command reference](docs/commands.md#before-handoff) for the complete loop.

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
