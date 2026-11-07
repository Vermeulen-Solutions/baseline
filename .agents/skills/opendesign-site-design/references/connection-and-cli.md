# OpenDesign daemon connection, CLI and desktop synchronization

## Daemon discovery and MCP setup

Discover an existing `open-design` MCP server or running local daemon before prompting for setup. Otherwise follow [docs/opendesign-onboarding.md](../../../../docs/opendesign-onboarding.md) when present:

1. **Daemon CLI entrypoint:** The OpenDesign desktop app bundles its CLI and MCP server inside `resources/app/prebundled/daemon/daemon-cli.mjs` (on Windows typically `C:\Users\<user>\AppData\Local\Programs\Open Design\resources\app\prebundled\daemon\daemon-cli.mjs`) alongside its bundled `resources/open-design/` catalog. Never add OpenDesign packages to a site's `package.json` or lockfile.
2. **Ephemeral desktop port vs. standalone default:** Standalone `od` defaults to `http://127.0.0.1:7456`, whereas the running OpenDesign desktop app allocates an ephemeral loopback port for its daemon (for example `11285`) and pairs it with a local Next.js web sidecar (for example `6409` or `6411`). Discover the active daemon port from the running `Open Design` process listening sockets or pass `--daemon-url http://127.0.0.1:<port>` (or set `OD_DAEMON_URL=http://127.0.0.1:<port>`).
3. **Registering the stdio MCP bridge:** Configure `open-design` in the user's private MCP client config as a `stdio` server invoking Node with `daemon-cli.mjs` and `mcp --daemon-url http://127.0.0.1:<port>`. Do not commit user-specific paths or alter global settings outside the user's setup scope.
4. **Re-discover before every write batch.** The desktop app moves its daemon to new ephemeral ports when it restarts, and a configured MCP bridge may point at a stale port (it then times out at session start). Find the live daemon and use HTTP when the bridge is stale:

   ```powershell
   $ids = (Get-Process | Where-Object ProcessName -eq 'Open Design').Id
   (Get-NetTCPConnection -State Listen | Where-Object { $ids -contains $_.OwningProcess }).LocalPort |
     ForEach-Object { try { Invoke-RestMethod "http://127.0.0.1:$_/api/projects" -Headers @{ Origin = "http://127.0.0.1:$_" } -TimeoutSec 4 | Out-Null; "daemon: $_" } catch {} }
   ```

   Two ports may answer (daemon and a proxy); either works for `/api/projects`.
5. **Read-only smoke check:** Call MCP `list_projects` and `get_active_context` (or `GET /api/projects` and `GET /api/active` with header `Origin: http://127.0.0.1:<port>`) to confirm connectivity before writing.

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

1. **UTF-8 bodies and renames.** Send JSON from a UTF-8 file (`curl --data-binary @body.json`) or Node `fetch`, not an inline `-d` string from Git Bash, which can mangle characters such as an em dash in a project name. Rename a project with `PATCH /api/projects/<id>` and a `{"name": …}` body; `PUT` is not supported.
1. **Explicit project slug ID:** When creating a project via `POST /api/projects` or MCP `create_project`, always supply an explicit lowercase slug `id` alongside `name` (`{ "id": "client-concept-a", "name": "Client Concept A" }`). Omitting `id` returns `400 BAD_REQUEST: invalid project id`.
2. **Artifact preflight:** Prefer the standalone `npm run design:artifact-check -- <artifact.html> --opendesign --json` when installed; it needs no daemon. Native `od lint` remains available for app/seed-specific policy or older sites:
   ```powershell
   node "<path-to>/daemon-cli.mjs" lint C:/path/to/concept.html --fail-on p1 --json
   ```
   Resolve confirmed defects and reconcile native aesthetic rules with the accepted direction. Add `data-od-id="<section-slug>"` to sections to satisfy `missing-section-anchor`. Both linters inspect source; neither measures contrast or layout clipping. Verify those in the actual rendered artifact. See [artifact lint](../../../../docs/artifact-lint.md) for the portable rule selection and limits.
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

### Overwriting an existing artifact

`od artifacts create` and MCP `create_artifact` reject an existing path, and the tested CLI has no update command. To iterate on a registered artifact in place, keep the same file name and either call MCP `write_file` (fine for small files) or post the file to the daemon's multipart endpoint, which replaces it and records a new version:

```powershell
curl.exe -s -H "Origin: $env:OD_DAEMON_URL" -F "file=@concept.html;type=text/html" -F "name=concept.html" "$env:OD_DAEMON_URL/api/projects/<project-id>/files"
```

Discover the daemon port first (see above); the response lists the new version. Review the file itself (next section) rather than the desktop artifact panel.

## Reviewing an artifact without the desktop UI

The Electron window is a cache of the daemon; the artifact is a plain file. Everything below works with the window closed, and it is the default review surface for agent-driven iterations.

- **Where the files are:** `%APPDATA%\Open Design\namespaces\<channel>\data\projects\<project-id>\` on Windows (`release-stable-win` for a stable build), one `.html` plus `<name>.artifact.json` per artifact and a `.file-versions/` history. `GET /api/projects/<id>/files` returns the same list with `localPath`, size and manifest, so an agent can resolve the path without scanning disk.
- **Open it:** `Start-Process "C:\...\projects\<id>\concept.html"` (Windows) or `open` (macOS). The artifact is self-contained — verified headless at 1440×900 and 390×844 with zero page errors and no daemon, sign-in or session involved.
- **Serve the folder** when several artifacts link to each other: any static server rooted at the project directory.
- **Captures** stay with the export endpoint above; `od export --format html` also runs headless (only `image`/`pdf` need the desktop runtime's Chromium).

The write returns after the bytes land, so a browser refreshed on that file is the current version. No reload command, no sidebar.

### Auto-open changed artifacts

`npm run design:watch -- --project <id>` polls the project folder and opens each new or rewritten `.html` in the default browser; that replaces the desktop tab you would otherwise have to find. Omit `--project` to watch the most recently modified project, or pass `--dir <path>`. `--no-open` prints paths only (remote shells, CI), `--all` opens every artifact that changed in one poll instead of just the newest, `--once` scans and exits, and `--open-existing` opens the newest file at startup. Polling is deliberate: it behaves the same on Windows, macOS, Linux and network drives, and survives the write-then-rename pattern editors use. Paths resolve per platform — `%APPDATA%\Open Design`, `~/Library/Application Support/Open Design`, `$XDG_CONFIG_HOME` or `~/.config/Open Design` — and the opener is `explorer.exe`, `open`, `xdg-open`, or `wslview` under WSL. A headless or SSH session has no browser to open, so use `--no-open` there; if OpenDesign changes its namespace layout, `--dir` bypasses resolution entirely.

## Why a new artifact does not open itself, and what to do

Three separate behaviours, checked against 0.27.0 on 2026-11-05:

- `POST /api/active` is a **write-only** channel. `apps/daemon/src/routes/active-context.ts` documents the web UI as the writer and the MCP surface as the reader; the web app only posts (`apps/web/src/App.tsx`) and never reads it back. Setting it from outside does not move the UI.
- `opendesign://` handles only workspace invites (`/invite/continue`) and `workspace/open`; there is no deep link to a project file. `od://` is the packaged app's own proxy, not an external navigation API.
- Tab state (`tabs`, `tabs_state`) is read when the view mounts, and artifact writes emit no event.

So after an external write, the owner reloads the window and clicks the file, or you open the artifact URL `http://127.0.0.1:<web-port>/projects/<project-id>/files/<artifact>` — a real route (`apps/web/src/router.ts`), but it needs a signed-in session in that browser: an unauthenticated fresh browser lands on the sign-in screen. Opening the file from disk has neither limitation, which is why it is the default here.

## When the owner insists on the desktop UI

When an external agent creates a project via the daemon API or CLI while the OpenDesign Electron window is already open, the desktop UI may not display it immediately for three reasons:

| Cause | Resolution |
| --- | --- |
| `POST /api/active` rejected with CSRF / same-origin error | Include `Origin: http://127.0.0.1:<daemon-port>` in the HTTP headers when calling `/api/active` |
| Desktop sidebar filters out projects without a conversation title or active tab | Ensure `conversations` has a row with a non-null `title` for `project_id`, and `tabs` / `tabs_state` list the active `.html` artifact |
| Electron React frontend caches project state in memory | Ask the user to focus the OpenDesign desktop window and press `Ctrl + R` (`View -> Reload`), or open the local Next.js web sidecar URL (`http://127.0.0.1:<web-port>`) in any browser |

Upstream status, checked 2026-11-05: [issue #8964](https://github.com/nexu-io/open-design/issues/8964) confirms the cause — the daemon emits no catalog event and the Home view keeps its own `POST` response. [PR #8968](https://github.com/nexu-io/open-design/pull/8968) adds a thin `project-catalog-changed` SSE and a cache-bypassing re-read; it is approved and green but **unmerged**, so 0.27.0 (2026-11-04) still needs the reload. The earlier Projects-tab polling fix (#3993) never covered Home, and artifact content has no change event at all, so that part outlives #8968. Treat this section as a fallback, not the workflow.
