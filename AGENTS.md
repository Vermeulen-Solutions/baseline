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

For an audit request in any Baseline workflow, lead with an actionable follow-up plan and the meaningful decisions it needs, using findings as supporting evidence. An audit alone does not authorize implementing its recommendations. Use `new-site-workflow`'s **Audit requests and release completion** guidance: agree the implementation/release scope, then carry approved changes through verification, commit, push and applicable deployment without repeated continuation prompts. Respect explicit audit-only or local-only scope.

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
- A site can be started by one session and built out by another (for example the
  most capable model for the direction, system and first screen, a cheaper one for
  the rest). The handoff is `audit/blueprint.md`; when it exists and lists work not
  yet built, or the owner asks for the start only, follow new-site-workflow's
  `references/start-and-build-out.md`.
- Follow brief/evidence → platform → content/routes → art direction → representative
  implementation/calibration → visual critique → full review and delivery. Continue
  authorized work without mandatory checkpoint stops; record assumptions explicitly.
- Explain responsive layout spacing during design setup. Express uses shared
  spacing and brief-led density (balanced if unspecified). Discuss custom spacing
  when a material design decision requires it.
- Keep site facts in their established home: here by default, or an explicitly
  adopted optional PRODUCT.md (the one brief). Keep working rules and the compact Art Direction
  Record here. DESIGN.md may hold selected visual references; CSS/configuration
  own implemented values. Use the existing tracker or a short handoff for progress.
  Resolve conflicts by subject and evidence rather than filename precedence.
  Missing optional documents do not block authorized work. See
  [project context](docs/project-context.md) and PRODUCT.example.md.
- Use checked-in skills on a fresh clone. Refresh skills only when intentionally
  checking upstream updates or refreshing an older checkout; follow
  [skill synchronization](docs/skill-synchronization.md).

## Design iteration surface

Reference discovery and adaptation belong to `site-art-direction`, independently of the iteration surface. Read `site-art-direction/references/reference-research.md` before concepts for every new site or direction: it is required, and the agent finds, captures and judges at least eight candidates (real sites, prompt libraries, community systems, OpenDesign systems/templates) itself, selects at least three above the bar builds the site's world from the subject (`site-art-direction/references/world-building.md`: one object per section, surfaces, type treatment, named motions, one working feature) and holds the chosen concept to their level, checked by `check:art-direction -- --require-record --require-references`. Owner references join the candidates. Use local/public reference files without requiring OpenDesign or loading its surface skill; do not add a provider-selection or template-approval checkpoint. The site's material (its ground, lettering, objects and colours) never comes from the references or from a list: gather it first with `npm run design:world` as `site-art-direction/references/world-building.md` step 1 sets out, and name the files on the record's `Sources` line.

At the new-site or significant-redesign concept checkpoint, offer the design surface once using `site-art-direction/references/design-iteration.md`, which holds the full rule, per-tool limits and comparison recipe. Default to **HTML/browser concepts** when no canvas is requested; when the owner wants to review designs by marking them and no tool is settled, recommend **OpenDesign** (HTML concepts, each comment tied to the element clicked, read with `npm run design:comments`); name **OpenDesign**, **OpenPencil** (vector canvas, also reviewed by comments), **Brilliant** (hand editing) and **Penpot** (shared cloud review) explicitly. Reuse a settled preference and working connection, and do not make the tool question a mandatory stop when a default is authorized. Surface choice does not reduce design choice: compare two or three structurally distinct directions side by side, with desktop/mobile views and full-size inspection, and select one before broad implementation. Each canvas has its own skill (`brilliant-site-design`, `openpencil-site-design`, `penpot-site-design`, `opendesign-site-design`) with its export limits; verify the actual canvas, exports and native Astro result. Retain explicitly preferred Pencil, Google Stitch, Claude Design and designmd-mcp references. Same-agent design/implementation is complete; another agent and portable handoff are optional. Small refinements reuse the accepted world. Roll out and redesign by settling one section with the owner first (its facts checked, one considered pass, the owner's marks), recording its treatments under `Settled Treatments` in the Art Direction Record, then carrying them to every page type one section at a time, single templates included, and closing each pass with `audit:ui`; whole screens are not designed in one go, and no autonomous critique rounds replace the owner's marks (`design-iteration.md`, "Settle one section"). Preserve native calibration, actual route/browser acceptance and the agreed release endpoint.

For motion, illustration, charts, editable vectors, 3D, video or another requested capability, follow `site-art-direction/references/capability-routing.md`. Keep the chosen surface and runtime, use relevant installed guidance first, inspect catalogue skills for a concrete gap, and test the actual output before expanding. A motion request does not imply Brilliant; native film and interactive browser behavior require separate acceptance.

## Before client-specific visual implementation

Save one complete Art Direction Record section in this file before site-specific
visual work (replace it by its heading line, or with `design:tokens --write-record`), including Aesthetic Lane, Narrative Metaphor, Typography Pairing,
Token Physics (Canvas, Action/Accent, Borders, Spatial Density), and two or three
semicolon-separated Site Anti-Patterns, and for a new direction the Motion Tier (task,
editorial or impression, with the client's words that decide it). Saving does not require a Git commit.
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
for direction, implementation and rendered critique; run Impeccable by its
commands as new-site-workflow's impeccable-passes.md sets out.

## Implementation essentials

- Use src/styles/global.css tokens and reusable primitives in src/components/.
  Keep CSS in named base or components layers; contextual defaults use :where().
  Preserve the spacing hierarchy and avoid combining layout gaps with flow margins
  for the same relationship. Read the detailed layout contracts before changing them.
- Interaction CSS stays zero-JS and token-bound: hover only inside `@media (hover: hover)`,
  focus never gated, animate opacity/transform/translate/rotate/scale (and, on the world's drawn
  objects, a path drawing with `stroke-dashoffset` or a `clip-path` reveal), new motion inside
  `prefers-reduced-motion: no-preference`, and only defined scale tokens (`--duration-*`,
  `--ease-*`, `--radius-*`, `--focus-ring-*`; `check:css -- --guardrails` flags others).
  Prefer native `<details>`, `<dialog>`, popover and the shell's cross-document page
  transitions over scripts; see design-framework.md section 5. One exception, decided in the
  record: when it says `Motion Tier: impression`, the smoothed scroll, the Interlude page
  transitions and the pinned scene are required and may use scripts, built exactly as
  `astro-site-design/references/impression-motion.md` sets out; everything else stays as above.
- A missing CMS entry returns `Astro.rewrite("/404")`, never a redirect. Keep the
  middleware's security headers, `/llms.txt` sections and RichText block renderers in
  step with new routes, collections and Portable Text types.
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
  removing existing public routes, each path in one place: EmDash Redirects for content,
  `astro.config.mjs` for code-owned paths (docs/site-working-rules.md). Code deployment does not transfer CMS records/media.
- Write documentation with unwrapped paragraphs (soft-wrapped / one line per paragraph)
  or semantic line breaks; avoid artificial hard-wrapping at 80 columns.
- Before changing the relevant behavior, read the task reference below. Detailed
  rules remain required for their scope; they are not optional suggestions.

| Task | Read before editing |
| --- | --- |
| Tokens, layout, components, editorial rendering, images or day-2 visual changes | [Detailed site rules](docs/site-working-rules.md), [design framework](docs/design-framework.md), [native composition](docs/native-composition.md) |
| CMS schema, queries, content or plugins | building-emdash-site, emdash-content-modeling, emdash-cli, or creating-plugins as applicable; verify APIs with configured EmDash docs MCP or live official docs |
| Admin set-up for editors (ordering, select labels, list columns, sidebar, help) | [Editor experience](docs/editor-experience.md) |
| WordPress migration | [Dashboard source capture and profile outputs](docs/wordpress-migration.md), wordpress-to-emdash-content for EmDash, and the migration guidance in new-site-workflow; classify repeated content before routes and link audit/content-candidate-register.md here |
| Languages/locales | [Internationalization](docs/internationalization.md): native row-per-locale groups, no duplicate language fields, prefixDefaultLocale: false |
| Production content on the local dev server (a review against live data, a local copy that drifted) | `npm run db:export-d1`, then `npm run db:local-copy` ([Cloudflare recovery](docs/cloudflare-backup-restore.md#production-content-on-the-local-dev-server)); the CLI login to that server is in emdash-site-setup |
| Hosting, production data, cache or newsletters | emdash-site-setup or emdash-production-cutover as applicable, and [production runtime rules](docs/site-working-rules.md#production-runtime-hardening); never reset production to repair authentication/imports |
| Reviewed starter/skill updates | [Baseline updates](docs/baseline-updates.md), [skill synchronization](docs/skill-synchronization.md); preserve local calibration and review conflicts. For an EmDash version upgrade also use upgrading-emdash and the current `docs/emdash-*-upgrade.md` guide |

## Verify and hand off

For this EmDash foundation, run `npm run doctor` before installing dependencies,
use `npm run verify:fast` during edits, then run `npm run verify`, `npm run build`,
`npm run audit:html` and `npm run check:dev-tools` against that fresh build before handoff. Use npm.cmd
and npx.cmd in Windows PowerShell. In Git Bash, never pass text that contains
backticks through an inline `node -e` or an unquoted heredoc: the shell runs
them as commands and drops them. Write the text or script to a file first. On Windows,
a caret in a Git revision (`git show <sha>^:path`) is eaten by cmd.exe, which Node's
`execSync` uses, so the command silently reads another revision: write `<sha>~1`, or
use `execFileSync` with an argument array. The HTML audit checks emitted HTML and captures
linked public SSR routes; see [HTML integrity](docs/html-integrity.md).

Build success is not runtime acceptance: emitted HTML strings do not prove that browser scripts parse or execute. When modifying client-side scripts, router hooks (`astro:before-preparation`, `astro:before-swap`, `astro:after-swap`, `astro:page-load`), View Transitions, or interactive state machines, launch headless Chromium (via the installed Playwright runner) against the build or rendered route. Listen to `pageerror` and `console.error` to ensure zero syntax or runtime exceptions, and adversarially probe asynchronous state transitions (rapid overlapping clicks, aborted navigation, BFCache restoration).

Set up the local supplemental hook once with `npm run setup:hooks`. Run visual
regression only locally on Windows as described in [visual regression](docs/visual-regression.md),
never in automated CI or production builds. Inspect actual rendered behavior for
affected pages. Report checks actually run and remaining acceptance limits.
Use the local URL printed by Astro for /_emdash/admin; ports can vary.
Complete new EmDash sites with `npm run site:register` ([site registry](docs/site-registry.md)).
