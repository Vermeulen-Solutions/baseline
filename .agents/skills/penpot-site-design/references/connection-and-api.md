# Connection and API discipline

## Hosted fast path and onboarding

Discover an existing Penpot MCP connection first. If absent: in Penpot account settings → Integrations enable MCP Server and generate the private connection key/URL; configure the chosen MCP client; open the intended design file; File → MCP Server → Connect. Keep that tab awake. Follow the current [official instructions](https://help.penpot.app/mcp/) if labels change. A Penpot account is needed; installing a local design app or a second agent is not. Do not create accounts or alter global client configuration without the user's scope.

The hosted URL carries a `userToken` query credential. Keep the full URL out of Git, project `.mcp.json`, briefs, screenshots, logs and shell history. Use private client configuration or documented environment substitution where actually supported; do not invent `${ENV}` interpolation or replace a query key with a bearer token. Never echo the key to debug a connection. `develop/mcp` documents local development too; it is not a reason to clone Penpot or add its packages to a site. Remote MCP cannot import a local filesystem asset just because a local server can.

## Read-only smoke test

Discover tools and their current schemas. The hosted server observed on 2026-10-26 exposed `high_level_overview`, `penpot_api_info`, `execute_code`, `export_shape`; names/capabilities may change. Read the overview once and relevant API types before using them. Example `execute_code` body after confirming these APIs:

```js
return {
  file: penpot.currentFile && { id: penpot.currentFile.id, name: penpot.currentFile.name },
  page: penpot.currentPage && { id: penpot.currentPage.id, name: penpot.currentPage.name },
  pages: penpotUtils.getPages()
};
```

Confirm file and page against the user's target. Duplicate file names require IDs/link confirmation. Inspect existing page children before creating anything. `tools/list` is a transport check, not this canvas check. Only one browser tab can be active for the connection; switching files/pages changes the target. Re-check identity at each resumed session and before a batch after navigation.

| Symptom | Recovery |
| --- | --- |
| Unauthorized/expired key | Ask the user to renew the private connection in their client; do not print it |
| No plugin/file | Open intended file and connect File → MCP Server |
| Suspended/no heartbeat | Ask the user to focus/wake the connected tab, then retry the read-only call |
| Wrong file/page | Stop writes, identify the intended target, reconnect/select it and re-check |
| Missing tool/member | Inspect live schemas/API docs; adapt or name the exact unavailable capability |
| Second client takes over | Use sequential writers; reconnect, re-check IDs and read saved state |

## Small reversible writes

Use a clearly named owned page/board; never clear the file to start. Make each batch find-or-create by exact owned name/ID, refuse ambiguous matches, and read back before retrying a timeout (the first call may have committed). Preserve a recoverable copy or version for substantial edits; avoid deleting unrelated user objects. Save identifiers outside ephemeral `storage` when a handoff is intended.

After querying `Board`, `Text` and relevant member documentation, a bounded board creation uses:

```js
if (penpot.currentFile?.id !== expectedFileId) throw Error('Wrong target');
const hits = penpot.currentPage.findShapes({ name: 'Baseline / Concept A / Desktop' });
if (hits.length > 1) throw Error('Ambiguous owned board');
const board = hits[0] ?? penpot.createBoard();
board.name = 'Baseline / Concept A / Desktop';
board.resize(1440, 900); // width/height are read-only; use resize()
board.x = 0; board.y = 0;
board.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }]; // source-derived sample
return { id: board.id, width: board.width, height: board.height };
```

`expectedFileId` is an explicit input from the preceding identity check, not a guessed global. Shape coordinates are absolute page coordinates; `appendChild()` preserves position. Use the documented helper for parent-relative placement. Set `fills`/`strokes` as complete arrays; use supported uppercase hex samples. Text `fontSize`/`lineHeight` use the documented types; inspect font availability/variants and actual `textBounds`. Verify an exact family match: the hosted `findByName('Noto Sans')` returned `Noto Sans Ogham` in the pilot; use `fonts.all.find(f => f.name === requestedFamily)` or verify the lookup result before applying. `resize()` may reset text growth, so restore `growType` and verify wrapping. Add flex/grid to an empty parent or use the documented order-preserving helper. Use real gaps/padding rather than unexplained spacer rectangles.

Read bounds, parent/child IDs, text, fills and layout after changes. Call `export_shape` with its live schema, inspect the image and fix overlaps/clipping. Do not claim an export succeeded because the tool returned HTTP 200: inspect tool errors/content. Exported renders and structures are complementary. Keep credentials out of capture metadata; a file/page/board identifier is sufficient to recover the work.
