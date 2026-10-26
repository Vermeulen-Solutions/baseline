# OpenPencil connection, schemas and local `.fig` discipline

## Desktop fast path and version-matched setup

Discover an existing OpenPencil MCP connection first. If already connected, skip installation and run the read-only identity check below. Otherwise follow [docs/openpencil-onboarding.md](../../../../docs/openpencil-onboarding.md) when present and the [official MCP guide](https://openpencil.dev/programmable/mcp-server):

1. Install the official [OpenPencil desktop release](https://github.com/open-pencil/open-pencil/releases) (`open-pencil/open-pencil`, distinct from commercial Pencil) and the matching global MCP package outside the site repository, for example `npm.cmd install -g @open-pencil/mcp@0.16.0`. Never add `@open-pencil/*` packages to a site's `package.json` or lockfile.
2. Open the desktop app with the intended document. Register `openpencil-mcp` as a **stdio** server in the user's private MCP client configuration (on Windows, invoking Node with the installed `dist/stdio.mjs` entry avoids `.cmd` wrapper friction). Do not alter global client configuration without the user's setup scope.
3. The local bridge uses loopback port `7600` with private discovery/authentication. Prefer stdio discovery; never commit the private discovery token, loosen filesystem roots/CORS, or enable arbitrary `eval`.
4. Do not configure internal [OpenPencil coding agents (ACP)](https://openpencil.dev/programmable/coding-agents) or extra model subscriptions when an external agent is already driving OpenPencil over MCP.

## Read-only smoke test and schema discipline

OpenPencil `0.16.0` exposes a broad tool surface (132 tools observed in the trial). Always inspect the live tool schema before calling a tool rather than guessing parameter names:

1. Call `list_documents` first to confirm the active `document_id` (such as `tab-1`), `page_id` (such as `0:1`), document name and file path. Transport health alone does not prove a document is open.
2. Pass `document_id` and `page_id` only to tools whose schema accepts them. Global tools (such as settings) reject document IDs.
3. Inspect existing structure before writing: use `get_page_tree`, `list_variables`, `get_components` and `get_font_status`. A requested font family is not loaded unless `get_font_status` confirms it; document any canvas-only font substitution (such as Arial/Georgia/Consolas for system stacks) rather than silently altering the site's typography pairing.

| Symptom | Recovery |
| --- | --- |
| Bridge unreachable / no documents | Ask the user to open OpenPencil desktop with a document and ensure the matching `@open-pencil/mcp` version is installed |
| Tool rejects `document_id` | Inspect that tool's live schema; omit target IDs on global tools |
| Card title or body overflows mobile frame | Set text width to Fill and height to auto-resize inside native flex containers; keep Fixed width only for intentional desktop measure |
| Reopened `.fig` has different IDs | Re-run `list_documents` and `get_page_tree`; match frames, variables and components by saved file path and owned names rather than stale `tab-*` or `0:*` session IDs |
| Path outside allowed root | Save inside the server's permitted filesystem root (or ask the user to save/move the file); never weaken server security flags |

## Declarative scene batches, variables and `.fig` persistence

Use clearly named owned frames (for example `Baseline / Concept A / Desktop` at `1440×900` and `Baseline / Concept A / Mobile` at `390×844` or `390×1100` when lower stacked panels need room); never wipe unrelated user frames.

1. **Variables and components:** Create semantic color variables (`color-page`, `color-surface`, `color-elevated`, `color-text`, `color-action`) using sampled hex/RGB values while keeping the source OKLCH and fluid `clamp()` expressions in the project context or handoff record. Bind fills and strokes to those variables and define reusable control components (such as primary and secondary buttons) instead of unconnected raw rectangles.
2. **Declarative JSX (`render`) and native layout:** Build frames with native flex/grid layout, real padding and gaps rather than manual coordinate math. Note that `render` takes OpenPencil scene JSX, not React or HTML DOM.
3. **Readback and visual inspection:** After each small batch (one to three coherent edits), read back the affected subtree/bindings (`get_page_tree`, `get_node`) and export the affected frame render to inspect visual hierarchy, wrapping, contrast and spacing.
4. **Save and cold recovery:** Save to the agreed local `.fig` file. When resuming in a fresh session or handing off to another agent, reopen the `.fig` file, call `list_documents` and `get_page_tree` to read the remapped session IDs, and verify that all text nodes, variables and components match the dated handoff evidence before translating to Astro.
