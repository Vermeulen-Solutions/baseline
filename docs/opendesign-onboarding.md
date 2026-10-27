# Optional OpenDesign desktop and CLI path

OpenDesign (`nexu-io/open-design`) is a local HTML/CSS design, linting and headless-export surface. For new sites and substantial redesigns, recommend a design canvas and offer **OpenDesign**, **OpenPencil**, **Penpot** and **direct Astro/browser** explicitly. Prefer an already working user-preferred connection; use [opendesign-site-design](../.agents/skills/opendesign-site-design/SKILL.md) and [design-iteration.md](../.agents/skills/site-art-direction/references/design-iteration.md) for focused concept edits followed by a representative Astro proof. Use Baseline's existing art-direction, CSS/component contracts and acceptance gates on every surface.

## Setup

Install OpenDesign Desktop from the [official repository](https://github.com/nexu-io/open-design). The desktop installation includes the prebundled daemon CLI (`resources/app/prebundled/daemon/daemon-cli.mjs`, on Windows typically under `%LOCALAPPDATA%\Programs\Open Design\resources\app\prebundled\daemon\daemon-cli.mjs`) and the local catalog under `resources/open-design/` (154 `DESIGN.md` design systems, 188 HTML/CSS layout examples, 116 templates and 13 workflow atoms). Never add OpenDesign packages to a site's `package.json` or lockfile.

When OpenDesign Desktop is running, it spawns two local loopback servers:

1. **The OpenDesign Daemon** (standalone CLI default `http://127.0.0.1:7456`, or an ephemeral desktop port such as `11285`): serves `/api/projects`, `/api/active`, `/api/plugins/*`, artifact storage, `od lint` and headless Chromium `od export`.
2. **The Next.js Web Sidecar** (for example `http://127.0.0.1:6409` or `http://127.0.0.1:6411`): serves the React workspace UI rendered inside the Electron shell and in standard web browsers.

Register `open-design` as a **stdio** MCP server in your private MCP client configuration (`node "<path-to>/daemon-cli.mjs" mcp --daemon-url http://127.0.0.1:<daemon-port>`). Use your real installed path and current daemon port rather than committing machine-specific paths into tracked repository files. See [connection-and-cli.md](../.agents/skills/opendesign-site-design/references/connection-and-cli.md) for port discovery and CLI commands.

## Bundled Baseline plugins and source token bootstrap

Baseline ships two OpenDesign plugins inside the skill directory that validate cleanly with `od plugin validate` and `od plugin doctor`:

- **[Baseline Astro Design System](../.agents/skills/opendesign-site-design/assets/plugins/baseline-design-system/DESIGN.md) (`design-system-baseline-astro`):** Defines Baseline's 3-tier OKLCH surfaces (`--color-page`, `--color-surface`, `--color-elevated`), 4-voice fluid typography (`--font-display`, `.font-accent`, `--font-body`, `--font-mono`), fluid `clamp()` scales (`--text-step-*`, `--spacing-*`) and structural HTML classes (`.section`, `.container`, `.bento-grid`, `.card`, `.flow`, `.btn`).
- **[Export to Baseline Astro](../.agents/skills/opendesign-site-design/assets/plugins/od-astro-baseline-export/SKILL.md) (`od-astro-baseline-export`):** Wraps OpenDesign's `handoff` atom with Baseline's 5-step transmutation protocol (`AGENTS.md` Art Direction Gate → `src/styles/global.css` token sync → `/_styleguide` zero-JS Astro primitive decomposition → EmDash/static data bindings → route verification).

For an existing Baseline site redesign or component refinement, run `npm.cmd run design:canvas-kit -- --out ../canvas-kit-001` ([canvas-kit.md](canvas-kit.md)) to emit a site-derived `open-design/DESIGN.md`, `open-design/open-design.json` and `open-design/specimen.html` bound to the site's active `src/styles/global.css`.

## Practical Acceptance & The Agent Switch

Follow the [HTML/CSS recipe](../.agents/skills/opendesign-site-design/references/baseline-html-recipe.md) when iterating concepts:

1. **Stage 4A (Inspiration vs. Active Tokens):** For greenfield sites, search OpenDesign's local `design-systems` and `examples` catalog (`od plugin search <query> --json` or MCP `list_plugins`) for layout anatomy and aesthetic direction, then map chosen colors and fonts onto Baseline's `--color-*`, `--text-step-*` and `--spacing-*` custom properties. For existing sites, bind the extracted `design:canvas-kit` tokens.
2. **Stage 4B (Project Creation, `od lint` & `od export`):** Create the project with an explicit lowercase slug `id` (`{ id, name }`). Author self-contained `.html` slices with `data-od-id` section anchors, run `od lint <file.html> --fail-on p1 --json` until `P0`/`P1` findings are `0`, register the artifact (`od artifacts create`), and export `1440×900` and `390×844` renders (`od export --format image`).
3. **Desktop UI Sync:** When creating projects or tabs externally via CLI/MCP while the OpenDesign desktop window is open, press `Ctrl + R` (`View -> Reload`) inside OpenDesign Desktop (or open the local web sidecar URL in a browser) so the React sidebar reloads the updated SQLite/daemon state.
4. **Stage 4C (Handoff & Agent Switch):** Baseline supports both single-agent workflows and multi-agent delegation:
   - **Single-Agent Model:** The same agent runs design iteration in OpenDesign, verifies `od lint`, exports renders, updates `AGENTS.md` and `src/styles/global.css` (`npm run design:tokens`), and implements the Astro templates.
   - **Multi-Agent Model (Agent Switch):** A design agent authors the OpenDesign concept and exports a handoff packet under `audit/visual-concepts/<concept-name>/` (including rendered images, HTML slices, and token mapping). An implementation agent then picks up the folder, seeds the Art Direction Record, calibrates components on `/_styleguide`, and builds the production Astro routes.
