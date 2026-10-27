# OpenDesign daemon connection, CLI and desktop synchronization

## Daemon discovery and MCP setup

Discover an existing `open-design` MCP server or running local daemon before prompting for setup. Otherwise follow [docs/opendesign-onboarding.md](../../../../docs/opendesign-onboarding.md) when present:

1. **Daemon CLI entrypoint:** The OpenDesign desktop app bundles its CLI and MCP server inside `resources/app/prebundled/daemon/daemon-cli.mjs` (on Windows typically `C:\Users\<user>\AppData\Local\Programs\Open Design\resources\app\prebundled\daemon\daemon-cli.mjs`) alongside its bundled `resources/open-design/` catalog. Never add OpenDesign packages to a site's `package.json` or lockfile.
2. **Ephemeral desktop port vs. standalone default:** Standalone `od` defaults to `http://127.0.0.1:7456`, whereas the running OpenDesign desktop app allocates an ephemeral loopback port for its daemon (for example `11285`) and pairs it with a local Next.js web sidecar (for example `6409` or `6411`). Discover the active daemon port from the running `Open Design` process listening sockets or pass `--daemon-url http://127.0.0.1:<port>` (or set `OD_DAEMON_URL=http://127.0.0.1:<port>`).
3. **Registering the stdio MCP bridge:** Configure `open-design` in the user's private MCP client config as a `stdio` server invoking Node with `daemon-cli.mjs` and `mcp --daemon-url http://127.0.0.1:<port>`. Do not commit user-specific paths or alter global settings outside the user's setup scope.
4. **Read-only smoke check:** Call MCP `list_projects` and `get_active_context` (or `GET /api/projects` and `GET /api/active` with header `Origin: http://127.0.0.1:<port>`) to confirm connectivity before writing.

## Querying the local catalog and installing Baseline plugins

OpenDesign bundles 154 `DESIGN.md` design systems (`plugins/_official/design-systems/`), 188 HTML/CSS examples (`plugins/_official/examples/`), 116 design templates (`design-templates/`) and 13 workflow atoms (`plugins/_official/atoms/`).

```powershell
$env:OD_DAEMON_URL = "http://127.0.0.1:<port>"
node "<path-to>/daemon-cli.mjs" plugin search "editorial" --json
node "<path-to>/daemon-cli.mjs" tools directions --json
```

To validate and register Baseline's bundled OpenDesign plugins ([Baseline Design System](../assets/plugins/baseline-design-system/DESIGN.md) and [Handoff to Baseline Astro](../assets/plugins/od-astro-baseline-export/SKILL.md)) or a site-derived `open-design/` folder from `npm run design:canvas-kit`:

```powershell
node "<path-to>/daemon-cli.mjs" plugin validate ".agents/skills/opendesign-site-design/assets/plugins/baseline-design-system" --json
# Note: on Windows, /api/plugins/install classifies local paths by leading '/' or './' (omit the drive letter 'C:'):
node "<path-to>/daemon-cli.mjs" plugin install --source "/dev/emdash-baseline/.agents/skills/opendesign-site-design/assets/plugins/baseline-design-system"
node "<path-to>/daemon-cli.mjs" plugin install --source "/dev/emdash-baseline/.agents/skills/opendesign-site-design/assets/plugins/od-astro-baseline-export"
node "<path-to>/daemon-cli.mjs" plugin doctor design-system-baseline-astro --json
node "<path-to>/daemon-cli.mjs" plugin doctor od-astro-baseline-export --json
```

## Project creation, artifact linting and headless export

1. **Explicit project slug ID:** When creating a project via `POST /api/projects` or MCP `create_project`, always supply an explicit lowercase slug `id` alongside `name` (`{ "id": "client-concept-a", "name": "Client Concept A" }`). Omitting `id` returns `400 BAD_REQUEST: invalid project id`.
2. **Deterministic anti-slop linter (`od lint`):** Run `od lint` on every HTML artifact before review or export:
   ```powershell
   node "<path-to>/daemon-cli.mjs" lint C:/path/to/concept.html --fail-on p1 --json
   ```
   Resolve all `P0` and `P1` findings (`all-caps-no-tracking`, contrast failures, layout clipping) and add `data-od-id="<section-slug>"` to top-level sections to satisfy `missing-section-anchor`.
3. **Register artifact and export (`od artifacts create` & `od export`):**
   ```powershell
   node "<path-to>/daemon-cli.mjs" artifacts create --project client-concept-a --name concept-preview.html --input C:/path/to/concept.html
   node "<path-to>/daemon-cli.mjs" export concept-preview.html --project client-concept-a --format image --out C:/path/to/default-viewport.png
   node "<path-to>/daemon-cli.mjs" export concept-preview.html --project client-concept-a --format pdf --out C:/path/to/concept-preview.pdf
   ```

### Explicit desktop and mobile captures

OpenDesign Desktop 0.26.1's `od export --help` offers format/output flags but no viewport width or height flags. For requested desktop/mobile viewports, call the daemon export endpoint with explicit `width` and `height`. Register the artifact first and keep Desktop running: visual exports use its bundled Chromium. The installed daemon accepts these dimensions in `POST /api/projects/<id>/export` and forwards them to the visual exporter.

```powershell
$designDaemon = $env:OD_DAEMON_URL.TrimEnd('/')
$exportHeaders = @{ Origin = $designDaemon }
if ($env:OD_TOOL_TOKEN) { $exportHeaders.Authorization = "Bearer $env:OD_TOOL_TOKEN" }
foreach ($viewport in @(@{ width = 1440; height = 900 }, @{ width = 390; height = 844 })) {
  $exportBody = @{
    fileName = 'concept-preview.html'
    format = 'image'
    imageFormat = 'png'
    deck = $false
    width = $viewport.width
    height = $viewport.height
  } | ConvertTo-Json -Compress
  Invoke-WebRequest -UseBasicParsing -Uri "$designDaemon/api/projects/client-concept-a/export" -Method Post -ContentType 'application/json' -Headers $exportHeaders -Body $exportBody -OutFile ("C:/path/to/preview-{0}x{1}.png" -f $viewport.width, $viewport.height)
}
```

Use the actual daemon origin, owned project ID and output paths. Inspect each returned PNG and record its actual dimensions; a filename is not proof of a mobile capture. If the installed export API differs or visual export is unavailable, export standalone HTML with `od export ... --format html --out ...` and capture that HTML with an available browser at the requested viewport. Keep original fluid expressions, fonts and asset access consistent when comparing captures.

## Synchronizing external CLI projects with the OpenDesign Desktop UI

When an external agent creates a project via the daemon API or CLI while the OpenDesign Electron window is already open, the desktop UI may not display the project immediately for three reasons:

| Cause | Resolution |
| --- | --- |
| `POST /api/active` rejected with CSRF / same-origin error | Include `Origin: http://127.0.0.1:<daemon-port>` in the HTTP headers when calling `/api/active` |
| Desktop sidebar filters out projects without a conversation title or active tab | Ensure `conversations` has a row with a non-null `title` for `project_id`, and `tabs` / `tabs_state` list the active `.html` artifact |
| Electron React frontend caches project state in memory | Ask the user to focus the OpenDesign desktop window and press `Ctrl + R` (`View -> Reload`), or open the local Next.js web sidecar URL (`http://127.0.0.1:<web-port>`) in any browser |
