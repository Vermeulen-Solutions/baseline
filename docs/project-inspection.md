# Optional project inspection

Run `npm run baseline:inspect -- --json` after installing dependencies to discover
the installed foundation, available verification commands, skills, source entry
points and declared props for six core components. PowerShell uses `npm.cmd`.
Human-readable output is the default. `--root <directory>` inspects another local
project without executing its scripts or configuration.

The report reads package script names, the installed `baseline.config.json` when
present, source paths and component frontmatter. Without a receipt, an EmDash
dependency identifies the CMS foundation; other projects remain unknown. Receipt
fields describe the installed profile, not the deployed runtime. Runtime
observations come from literal configuration and recognized imports in
`astro.config.mjs`; dynamic expressions remain unknown. This is not a complete
profile receipt/provenance validator.

Optional root `PROJECT.md`, `DESIGN.md` and `HANDOFF.md` entries report presence
only; their text is not read, interpreted or granted authority. The selected
design reference may instead live at a path linked from the site's instructions.
See [document scope](project-context.md) for the brief/rules/design boundaries.

Generated static configurations spread their routing settings into the config.
The pilot conservatively reports runtime observations as unknown for that whole
object; the receipt still identifies the declared static profile/runtime.

Use the returned paths to read the authoritative sources. For example, Grid's
declared `gap` prop points to `src/components/Grid.astro`; global layout spacing
belongs in `src/styles/global.css`, with policy in `docs/design-framework.md`.
Section, Container, Grid, Card, RichText and ResponsiveImage are a bounded pilot,
not a component registry. Imported and inherited props, defaults, slots, allowed
nesting, editorial boundaries and surface behavior still require source and
styleguide review. The command does not invent a second editable API catalog.

The version-1 JSON is read-only. It refuses linked or oversized inputs, reads no
environment files, credentials or database contents, and never executes target
code. Available commands have not necessarily passed. Seed files are initial
schema/content inputs and do not describe live CMS state. Inspection does not
replace AGENTS.md, applicable skills, calibration or verification, and adds no
mandatory checkpoint. Functional discovery checks do not establish a measured
improvement in agent task performance; expansion should follow task evidence.

An exploratory matched-task comparison found mixed request counts and emitted
bytes across spacing, Sveltia and CMS tasks (recorded in the Baseline source
repository under `audit/autonomous-evaluation-2026-10-21/`).
Functional outcomes passed in both conditions; a general performance advantage
was not established. Keep inspection optional rather than adding it as a required
step for every task.

For a fresh bounded replay, use the source repository's
[local workflow replay entry point](https://github.com/Vermeulen-Solutions/baseline/blob/main/docs/workflow-replay.md).
Historical graders depend on their archived fixtures and are not a supported benchmark.
