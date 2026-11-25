---
name: openpencil-site-design
description: Design Baseline site concepts in the OpenPencil desktop canvas through MCP and review them with the owner through comments pinned on the design: set up the app and its MCP bridge, build each board in one JSX render, run OpenPencil's accessibility check, then read the owner's comments, change the design, reply and resolve. Use when the owner chooses OpenPencil or wants to review designs by marking them; direct Astro/browser design does not require it.
---

# OpenPencil site design

OpenPencil (`open-pencil/open-pencil`, distinct from commercial Pencil) is a local desktop design canvas with an MCP server. In Baseline its value is the review loop: the owner looks at the boards and **pins short notes on what should change**; the agent reads each note, finds the layer under it, changes the design, replies with what changed and resolves the note. The owner never has to edit the canvas by hand or write a design critique. The same agent designs and implements; the canvas does not make a design better by itself, so the direction still comes from `site-art-direction`.

This skill is written and tested for **OpenPencil 0.17.0** (app and `@open-pencil/mcp`). 0.17 renamed every MCP tool to a verb-first name and changed design JSX; on another version, read the live tool list and [the upstream skill](references/upstream/SKILL.md) before trusting a tool name here.

## 1. Set it up with the owner (once per machine)

Walk the owner through these steps in chat, one at a time, and check each before the next. Skip what is already done.

1. **App.** Install OpenPencil Desktop from the [official releases](https://github.com/open-pencil/open-pencil/releases) and open it. Note its version (on Windows, the file version of `%LOCALAPPDATA%\OpenPencil\OpenPencil.exe`).
2. **Bridge, same version as the app.** `npm install -g @open-pencil/mcp@<app version>` (for example `@0.17.0`), outside the site repository. Never add `@open-pencil/*` to a site's `package.json`.
3. **Register it with the agent** as a stdio server. Claude Code: `claude mcp add --scope user open-pencil -- openpencil-mcp`, then allow its tools without opening every permission (`"permissions": { "allow": ["mcp__open-pencil__*"] }` in the user's Claude Code settings). Other harnesses: a stdio server whose command is `openpencil-mcp`. Restart the agent session so the tools load. Never set `bypassPermissions`, an empty `OPENPENCIL_MCP_AUTH_TOKEN` or a wildcard CORS origin.
4. **Turn the app's server on.** In OpenPencil: Settings › MCP › Local server **on**, and **"Share only the selection" off** (with it on, the agent sees neither comments nor editing tools). If Settings › Tool access lists tools as disabled after an update, the owner re-enables them there.
5. **Check.** Call `list_documents`. A JSON list (empty is fine) means the connection works. "OpenPencil app is not connected" means the app is closed or its server is off: ask the owner to open it; do not start or restart it yourself.

**Where files can live.** The MCP server writes and opens files only inside its root, which on Windows defaults to the user's home folder: a path such as `C:\dev\<site>\…` is refused. Keep the design file at `<home>/Documents/OpenPencil/<site>/<name>.fig` and record that path in the site's notes. Photos used on the canvas go in the same folder, prepared first (`npm run media:prepare`, at most 2400 px) so the `.fig` stays small. `OPENPENCIL_MCP_ROOT` narrows the root (see [connection and API](references/connection-and-api.md)).

## 2. Build the boards fast

Measured on 0.17.0: the [specimen](assets/review-specimen.jsx) (tokens, a component, an instance and variants) rendered in 0.24 s, a row of four cards in 0.9 s, an export took 0.1–0.4 s and reading comments 0.02 s. A whole board is seconds of tool time; what made an early trial slow (twenty minutes for one direction) was authoring it element by element, rebuilding an HTML page in the canvas, and opening a fresh bridge for every call. So:

1. **Author in the canvas from the start.** Do not design in HTML and then copy it across: there is no HTML import over MCP, and redrawing an existing page is the slow path.
2. **One `render` per board.** Write each board (`<Site> · <Direction> · Bureau 1440`, `… · Natel 390`) as one design-JSX tree with native layout: `flex="col"`/`"row"`, `gap`, padding, `w="fill"` on wrapping text, `items="stretch"` where siblings must share a height. Build repeated rows with `{items.map(…)}` in the JSX instead of writing each one. Absolute `x`/`y` only for art that must sit at an exact spot. Read [the design-authoring reference](references/upstream/references/design-authoring.md) first; the [JSX recipe](references/baseline-jsx-recipe.md) is a tested starting point.
3. **Name every layer the owner might point at** ("Hero headline", "Call button", "Photo – atelier", "Card – Fuite"). Comments are matched to layers by position and the names make the match certain; they also become the vocabulary of your replies.
4. **Photos:** draw each photo slot as a named `Rectangle` in the JSX, then one `set_image_fill` per slot with `image_path` (a file inside the root), never base64.
5. **Look once per board:** one `export_image` of the board (`format: "JPG"`, `maxEdge` up to 2048; a PNG over about 880 KB is refused), opened at full size. Fix what is wrong, then look again.
6. **Fix in place:** `get_jsx` on the smallest layer that is wrong, edit the JSX, `render` it with `replace_id` (the layer keeps its ID). Use single setters (`set_fill`, `set_font`, `update_node`) only for one value. Several setters at once go in `batch_update`, which applies all or none.
7. **One session for all of it.** With the bridge registered (step 1.3) the agent keeps one connection; a client that starts the bridge again for each call pays about two seconds a call.

Fonts: call `list_available_fonts` before choosing faces and `get_font_status` after rendering; record any substitution instead of silently changing the site's pairing.

## 3. Before the owner looks

1. `lint` with `preset: "accessibility"` on the page: contrast, touch targets, text size. Fix every finding at its source (a lighter or darker colour, padding for a 44 px target, 12 px minimum text) and run it again until it reports no errors. The owner's notes are for design, not for defects the canvas already finds.
2. `zoom_to_fit` so all boards are in view, `save_document`, and export the boards once for the chat.
3. Tell the owner in plain words: open `<path>.fig`, press **C**, click on whatever should change and type a short note ("bigger", "too dark", "phone: too much text here"); no reason is needed and nothing has to be selected first. Say when you will read them (when they tell you they are done).

## 4. Work through the owner's comments

Asking for review by comments is the owner's authorisation to reply to and resolve those threads. Do not add comments of your own or reply to anyone else's threads.

1. `list_comments` (open threads only). Each has `text`, `node` (the board it is pinned to), `position` (canvas x, y) and `replies`.
2. **Find the target.** A click on a board pins the note to the **board**, whatever the owner had selected. Find the layer under the point: `get_bounds` on the board's named children (and theirs) and take the smallest named layer whose box contains `position`. When two layers overlap there, look at both. When the note could mean two things, reply with the question and leave the thread open.
3. **Find the cause before changing anything.** "This button isn't aligned" can be a collapsed column inside it; "these cards should be the same height" is a row whose children size to their own text. Fix the cause in the layout so it stays fixed when the text changes, and check the same pattern on the other board of the pair (desktop and phone): fix it there too and say so.
4. Export the affected area before and after; look at the after image.
5. `reply_to_comment` with `author` set to your agent name and two or three sentences: what was wrong and what changed, with the numbers (heights, sizes, colours). Then `resolve_comment`, `lint` again, and `save_document`.
6. Report in chat with the before and after images. Record each round (note, cause, change, time) in the site's notes.

## 5. Translate and finish

The board is the picture of the decision, not code. Exported JSX, HTML or images are never pasted into a page. Read [penpot-site-design/references/handoff-and-astro.md](../penpot-site-design/references/handoff-and-astro.md), save the Art Direction Record, calibrate tokens and primitives on `/_styleguide`, then build the routes with Baseline's native components and test them in a browser at 390, 768 and 1440 wide, with keyboard, reduced motion and real content. Keep the `.fig` path, the board names and the resolved threads in the site's notes as the record of what the owner chose.

## References

- [Connection and API](references/connection-and-api.md): setup details, the tool families, root and security settings, recovery.
- [Scoped review](references/scoped-review.md): comparing before and after, lint, patches and the comment loop in detail.
- [JSX recipe](references/baseline-jsx-recipe.md) with [review-specimen.jsx](assets/review-specimen.jsx) and [review-tokens.json](assets/review-tokens.json): a tested 0.17 specimen with tokens, a component with properties and variants.
- [Upstream OpenPencil skill v0.17.0](references/upstream/SKILL.md) and its [design-authoring reference](references/upstream/references/design-authoring.md) (unmodified, see [provenance](references/upstream/PROVENANCE.json)).
- Shared loop: [design iteration](../site-art-direction/references/design-iteration.md). Other canvases: [brilliant-site-design](../brilliant-site-design/SKILL.md), [penpot-site-design](../penpot-site-design/SKILL.md), [opendesign-site-design](../opendesign-site-design/SKILL.md).
