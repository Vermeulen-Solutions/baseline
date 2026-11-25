# Scoped review: comments, lint and before/after

Use this loop after the owner has asked for changes, whether by comments on the canvas or in chat. Keep the selected surface and the scope the owner gave: a comment about one button is not permission to redesign the page.

## The comment loop, in detail

1. `list_comments` with the document's `document_id`. Without `includeResolved` it lists open threads only. Each thread has an `id`, `text`, `author`, `node` (the layer it is pinned to: on a click, the board), `position` (canvas coordinates) and `replies`.
2. Locate the target from `position`: `get_page_tree { root_id: <board>, depth: 3 }` for the board's named layers, then `get_bounds { id }` on the likely ones; the target is the smallest named layer whose box contains the point. A point in the gap between siblings usually means the group ("these cards"). Overlapping layers: inspect both.
3. Record the baseline: `get_jsx` of the target and an `export_image` (JPG) of its area.
4. Find the cause in the layout before changing values. Two cases seen in Baseline's trial: cards of unequal height in a row whose children hug their own text (fix: `items="stretch"` on the row and `h="fill"` down to the card), and a button whose label column had no width so its text wrapped into 100 px (fix: `w="fill"` on the column). Fixing the layout keeps the result right when the text changes.
5. Change the smallest layer that fixes it: edit its JSX and `render` with `replace_id`, or one setter for one value. Check the other board of the pair (desktop or phone) for the same fault.
6. Export the area again and look at it. `diff_pixels` between before and after confirms the edit changed only the intended region when that is in doubt; a changed-pixel ratio is not a design score.
7. Reply to the thread (`reply_to_comment { id, text, author }`) with what was wrong and what changed, in two or three sentences with the numbers. Resolve it (`resolve_comment { id }`), run `lint` again and `save_document`.
8. A note you cannot act on (a fact only the owner has, two possible meanings) gets a reply with the question and stays open. Resolving is only for a change made and checked.

Comment pins are canvas positions. A pin left open while its layer moves stops pointing at it: act on notes in the round they were left, and match older open threads by their text and the layer names, not by position alone.

## Lint: what to fix and what to leave

`lint` returns findings with a rule, a severity, the layer (`node_id`, `node_name`, `path`), a `suggest` text and sometimes a safe `fix`.

- Run `preset: "accessibility"` before every hand-over and fix all of it: `color-contrast` (move the colour until the ratio passes; large bold text needs 3:1, body text 4.5:1), `touch-target-size` (padding up to 44 px), `min-text-size` (12 px at least).
- `recommended` and `strict` also report naming, spacing scale, radius scale, unbound colours, groups and hidden layers. Read them; do not apply them wholesale. `lint_fix` binds colours to matching variables and rounds geometry; with `suggestions: true` it also snaps spacing and radius to a scale, raises text sizes, converts groups and deletes hidden layers, which can damage deliberate fluid samples and state specimens. Apply a suggestion only after looking at the layer it changes.

## Patches between two versions

For a larger change, duplicate the owned board as `Before`, make the change on the original, and compare: `diff_nodes` gives the attribute differences as an appliable patch, `preview_patch` shows what a patch would set, `apply_patch` applies it only while the nodes still match. Do not force a patch over changed values.

## Saved state and fonts

- Save after each round. Since 0.17 IDs survive save and reopen; check the reopened document with `list_documents` and `get_page_tree` before relying on old IDs anyway.
- `get_font_status` reports requested faces, the source each loaded from and any substitution. Seen on 0.16 (Windows): text could render garbled after reopening, and a style name passed to `set_font` could silently fall back to Regular. On 0.17 text keeps each face's own style name; still read back a node's family, style and weight after a font change and look at a fresh export.

## Browser boundary

Canvas states and control previews show intent. Translate them to the installed Astro components and semantic controls, then verify focus, keyboard behaviour, reflow at intermediate widths, overflow, reduced motion and real destinations in the browser. Use `/_styleguide` for primitive calibration. Do not add Storybook, React or Vue controls or a parallel token build to make a canvas export executable.
