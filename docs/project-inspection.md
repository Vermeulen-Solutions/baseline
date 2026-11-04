# Optional project inspection

Run `npm run baseline:inspect -- --json` after installing dependencies to discover the installed foundation, available verification commands, skills, source entry points and declared props for six core components. PowerShell uses `npm.cmd`. Human-readable output is the default. `--root <directory>` inspects another local project without executing its scripts or configuration.

The report reads package script names, the installed `baseline.config.json` when present, source paths and component frontmatter. Without a receipt, an EmDash dependency identifies the CMS foundation; other projects remain unknown. Receipt fields describe the installed profile, not the deployed runtime. Runtime observations come from literal configuration and recognized imports in `astro.config.mjs`; dynamic expressions remain unknown. This is not a complete profile receipt/provenance validator.

Optional root `PROJECT.md`, `DESIGN.md` and `HANDOFF.md` entries report presence only; their text is not read, interpreted or granted authority. The selected design reference may instead live at a path linked from the site's instructions. See [document scope](project-context.md) for the brief/rules/design boundaries.

Generated static configurations spread their routing settings into the config. The pilot conservatively reports runtime observations as unknown for that whole object; the receipt still identifies the declared static profile/runtime.

Use the returned paths to read the authoritative sources. For example, Grid's declared `gap` prop points to `src/components/Grid.astro`; global layout spacing belongs in `src/styles/global.css`, with policy in `docs/design-framework.md`. Section, Container, Grid, Card, RichText and ResponsiveImage are a bounded pilot, not a component registry. Imported and inherited props, defaults, slots, allowed nesting, editorial boundaries and surface behavior still require source and styleguide review. The command does not invent a second editable API catalog.

The version-1 JSON is read-only. It refuses linked or oversized inputs, reads no environment files, credentials or database contents, and never executes target code. Available commands have not necessarily passed. Seed files are initial schema/content inputs and do not describe live CMS state. Inspection does not replace AGENTS.md, applicable skills, calibration or verification, and adds no mandatory checkpoint. Functional discovery checks do not establish a measured improvement in agent task performance; expansion should follow task evidence.

An exploratory matched-task comparison found mixed request counts and emitted bytes across spacing, Sveltia and CMS tasks (recorded in the Baseline source repository under `audit/autonomous-evaluation-2026-10-21/`). Functional outcomes passed in both conditions; a general performance advantage was not established. Keep inspection optional rather than adding it as a required step for every task.

For a fresh bounded replay, use the source repository's [local workflow replay entry point](https://github.com/Vermeulen-Solutions/baseline/blob/main/docs/workflow-replay.md). Historical graders depend on their archived fixtures and are not a supported benchmark.

## Optional route and component structure

Use `npm run baseline:inspect -- --structure --json` for a source-derived overview of how Astro route files refer to components and content. On Windows use `npm.cmd`. The exported `inspectProject(root, { structure: true })` API requests the same optional `structure` field; omitting the option preserves the default version-1 output shape. `--root <directory>` remains supported. Human-readable mode reports the number of route/component sources and the interpretation limits; JSON contains the detailed observations.

The extension uses the installed Astro/TypeScript ESLint parsers without executing target code or loading target dependencies. It starts with `.astro` files under `src/pages`, follows relative local `.astro` imports inside `src`, and reports each source with line and column locations:

- Import declarations and their local source resolution, separately from component tags observed in markup. An unused imported component can appear in the source inventory without appearing in a route's rendered-component observations.
- Markup-producing `map`, `flatMap` and `Array.from` expressions, their source input names when syntactically available, and component tags occurring inside those expressions. Data-only mapping is not counted as repeated markup.
- Multiple component occurrences outside the observed repeated expressions and literal list-item counts. These are observations for review, not automatic duplication defects or instructions to abstract every list.
- Literal collection arguments to imported `astro:content` `getCollection`/`getEntry` and `emdash` `getEmDashCollection`/`getEmDashEntry` calls, including their directly assigned binding names. Dynamic arguments remain unresolved; shadowed function/component names are not silently attributed to an outer import.
- `entry.data.field` and `entry.edit.field` source-access hints. Computed dynamic fields remain unresolved. These hints do not establish a canonical field owner or prove that an edit attribute annotates the value being rendered.

Use the overview to explain a route's template/component path and identify the sources that need inspection. Confirm actual collection-backed repetition by adding or changing a record in the authorized disposable/local instance, then inspecting the rendered item count and content. Verify component reuse through a bounded shared change and the intended rendered instances. Retain normal save/reload/publish checks and the site's owner-task evidence. Finding a source loop alone proves none of those runtime outcomes.

Limits are explicit in the JSON. The scan reads at most 300 sources, 1 MiB per source, 8 MiB total and 12,000 observations, with a bounded route-directory walk; exceeding a bound fails rather than returning a partial success. Linked inputs and source-boundary escapes are refused. Invalid/unsupported Astro syntax is recorded as an unresolved source with no inferred relationships. Hidden paths, script modules, path aliases, plugin/generated routes, runtime query results, stored CMS records, inherited props and actual component behavior remain outside this source report. There is no deletion recommendation or live-content access. An observed import graph must not be presented as complete route coverage or a measured efficiency improvement.
