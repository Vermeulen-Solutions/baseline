# Build with Baseline

## Choose the guidance for this task

**Default: build or maintain this website.** Read README.md, inspect the installed
profile and existing site decisions, then follow the site instructions below.

**Maintaining Baseline itself:** when the user asks to improve the reusable starter,
generators, distributed components, tooling, checks or skills, read
[CONTRIBUTING.md](CONTRIBUTING.md) before editing. It is the maintainer entry point
and adds compatibility, distribution and verification requirements. Client-site
discovery and design setup apply when the task includes client-specific design.
Shared implementation contracts still apply to maintainer work.

Determine the task from the user's request and existing conversation. A local
component adjustment for one website is still site work. Do not infer maintainer
intent from a Git remote, branch, package name or the presence of starter files.
There is no persistent mode switch. Ask only if unresolved intent would materially
change the work; continue authorized work when the intent is already clear.

## Establish the platform

Use npm and the checked-in lockfile. Read baseline.config.json in generated sites;
its absence in this root means the existing **EmDash Node.js + SQLite** application.

| Profile | Content editing | Runtime |
| --- | --- | --- |
| static | Typed Markdown files | Astro static output |
| static-sveltia | Sveltia edits the same Git-owned files | Static output; authentication configured separately |
| emdash | Relational CMS, Portable Text, live canvas and MCP | Node/SQLite/local media; Workers/D1/R2 require separate setup |

Generate static sites with
`npm run init:profile -- --profile static|static-sveltia --out <new-directory>`;
do not prune a cloned CMS project in place. EmDash uses the full repository template.
Profile and Standard/Express delivery track are separate choices. See
[platform profiles](docs/platform-profiles.md).

Static projects use their generated AGENTS.md and installed commands. Skip EmDash
specialists and never add CMS dependencies to satisfy an inapplicable check.

## Start or resume site work

- For a complete new site or rebuild, use new-site-workflow: Express for smaller
  greenfield sites (at most six routes, one locale), Standard for complex sites or
  migrations. Load specialist skills as their stages begin. Scoped changes start
  at the earliest affected stage and reuse established decisions.
- Follow brief/evidence → platform → content/routes → art direction → representative
  implementation/calibration → visual critique → full review and delivery. Continue
  authorized work without mandatory checkpoint stops; record assumptions explicitly.
- Explain responsive layout spacing during design setup. Express uses shared
  spacing and brief-led density (balanced if unspecified). Discuss custom spacing
  when a material design decision requires it.
- Keep site facts in their established home: here by default, or an explicitly
  adopted optional PROJECT.md. Keep working rules and the compact Art Direction
  Record here. DESIGN.md may hold selected visual references; CSS/configuration
  own implemented values. Use the existing tracker or a short handoff for progress.
  Resolve conflicts by subject and evidence rather than filename precedence.
  Missing optional documents do not block authorized work. See
  [project context](docs/project-context.md) and PROJECT.example.md.
- Use checked-in skills on a fresh clone. Refresh skills only when intentionally
  checking upstream updates or refreshing an older checkout; follow
  [skill synchronization](docs/skill-synchronization.md).

## Before client-specific visual implementation

Save one complete `## Art Direction Record` in this file before site-specific
visual work, including Aesthetic Lane, Narrative Metaphor, Typography Pairing,
Token Physics (Canvas, Action/Accent, Borders, Spatial Density), and two or three
semicolon-separated Site Anti-Patterns. Saving does not require a Git commit.
Run `npm run check:art-direction -- --require-record` before implementation.

The gate applies to visual work regardless of extension or directory. Route
inventory and content modeling may precede it. Functional fixes that preserve
presentation, platform setup, starter infrastructure maintenance and isolated
concepts under audit/visual-concepts/ are scoped exceptions. Source exceptions
must have an exact path, concrete reason and current LF-normalized SHA-256 in
audit/design-gate-exceptions.json; never exempt directories or client pages.
Maintainer intent alone does not waive the gate or validate an exception.

This starter has no invented client art direction. Initialize real site tokens
with `npm run design:tokens -- --init-client --lane <lane>`, replace sample content,
and calibrate primitives on /_styleguide before broad page assembly. Record
observations in audit/component-calibration.md; a generated checklist is not
browser evidence. Use site-art-direction, astro-site-design and impeccable
for direction, implementation and rendered critique.

## Implementation essentials

- Use src/styles/global.css tokens and reusable primitives in src/components/.
  Keep CSS in named base or components layers; contextual defaults use :where().
  Preserve the spacing hierarchy and avoid combining layout gaps with flow margins
  for the same relationship. Read the detailed layout contracts before changing them.
- Store content images in src/assets/ or the EmDash Media Library; use native
  Astro processing. Before adding/uploading new imagery in a greenfield build
  or day-2 maintenance, use `npm run media:prepare`, inspect its results and use
  eligible prepared copies. Keep full-size source archives outside the library
  and Git. See [media preparation](docs/media-preparation.md); EmDash also has
  `media:upload` for destination-bound upload/readback. public/ is for deliberate
  unchanged-URL assets.
- Keep CMS routes server-rendered. Use EmDash content/media APIs and field edit
  proxies; verify actual typing, save and reload when changing edit targets.
  Render editorial content through RichText. A seed is not a content migration.
- Preserve navigation when adding routes, and use 301 redirects when renaming or
  removing existing public routes. Code deployment does not transfer CMS records/media.
- Before changing the relevant behavior, read the task reference below. Detailed
  rules remain required for their scope; they are not optional suggestions.

| Task | Read before editing |
| --- | --- |
| Tokens, layout, components, editorial rendering, images or day-2 visual changes | [Detailed site rules](docs/site-working-rules.md), [design framework](docs/design-framework.md), [native composition](docs/native-composition.md) |
| CMS schema, queries, content or plugins | building-emdash-site, emdash-content-modeling, emdash-cli, or creating-plugins as applicable; verify APIs with configured EmDash docs MCP or live official docs |
| WordPress migration | wordpress-to-emdash-content and the migration guidance in new-site-workflow; classify repeated content before routes and link audit/content-candidate-register.md here |
| Languages/locales | [Internationalization](docs/internationalization.md): native row-per-locale groups, no duplicate language fields, prefixDefaultLocale: false |
| Hosting, production data, cache or newsletters | emdash-site-setup or emdash-production-cutover as applicable, and [production runtime rules](docs/site-working-rules.md#production-runtime-hardening); never reset production to repair authentication/imports |
| Reviewed starter/skill updates | [Baseline updates](docs/baseline-updates.md), [skill synchronization](docs/skill-synchronization.md); preserve local calibration and review conflicts |

## Verify and hand off

For this EmDash foundation, run `npm run doctor` before installing dependencies,
use `npm run verify:fast` during edits, then run `npm run verify`, `npm run build`
and `npm run audit:html` against that fresh build before handoff. Use npm.cmd
and npx.cmd in Windows PowerShell. The HTML audit checks emitted HTML and captures
linked public SSR routes; see [HTML integrity](docs/html-integrity.md).

Set up the local supplemental hook once with `npm run setup:hooks`. Run visual
regression only locally on Windows as described in [visual regression](docs/visual-regression.md),
never in automated CI or production builds. Inspect actual rendered behavior for
affected pages. Report checks actually run and remaining acceptance limits.
Use the local URL printed by Astro for /_emdash/admin; ports can vary.
Complete new EmDash sites with `npm run site:register` ([site registry](docs/site-registry.md)).
