# Brilliant native capability trial

Use native components and scoped design-system recipes for repeated editable concepts, with explicit checks for overrides and cross-canvas persistence. Use non-creating conversion preflight before an HTML import. The tested UI guidance tools are useful for explaining controls. Keep browser acceptance separate: this trial's native modes and component variants did not become responsive, semantic or fully dynamic HTML behavior.

## Scope and evidence

This follow-up exercises capabilities identified in the installed `.claude-prod` knowledge rather than only adding skill prose. All native work is inside the existing unpublished local `Baseline` project at `C:/dev/baseline-designs/Baseline`, under `Studies/Native capabilities`. Three new canvases hold Components, Consumers, and Modes and typography. The study has its own scoped `Styles/native-trial.ds`; existing studies, Scratch, the root default system, accounts and sharing were not edited. The supplied copy is an agent-authored mechanical test specimen, not an approved site direction.

The [MCP receipts](visual-concepts/brilliant-native-capabilities-2026-11-06/receipts.json) preserve the authored batches, warnings, bounded reads and export results. [Observations](visual-concepts/brilliant-native-capabilities-2026-11-06/observations.json) record the disk/preflight comparisons. Vendor manuals, full tool schemas and unrelated projects are retained privately outside Git. Native project files remain local; the committed images/HTML are exports of this owned study.

## Exercised native behavior

| Case | Observed result and boundary |
| --- | --- |
| Master and instances | One Delivery card master, two same-canvas copies and one cross-canvas copy retained their own headings/descriptions. Border, gap and heading changes propagated in resolved native state. An initially incomplete stroke syntax was reported and corrected with an explicit width. |
| Slots | Native code/stack icons filled two marker slots and survived shared edits; other slots stayed empty. |
| Content versus style overrides | The content-only CMS heading followed the shared size. The Static heading explicitly overridden to 28px stayed 28px when the master became 22px, with a named warning. `reset_text_style_overrides` restored 22px and kept “Git-owned content”. |
| Ambiguous stale style | A shared button-label edit flagged two copies as having different text styles, without distinguishing intentional edits from stale style. Reset on the two named text IDs kept “Create project” and “Read workflow”. This is a bounded remedy, not permission to erase all overrides. |
| Variant switching | An Action button set had primary and secondary tones. Switching Create project from primary to secondary changed paint while retaining its custom characters. These were native visual states; no browser click behavior was authored. |
| Cross-canvas persistence | After a master edit the closed Consumers file was byte-identical to its pre-edit bytes, as the tool's note predicted. A native read resolved the changed heading/layout in memory. A later real consumer copy edit changed the stored file. Opening/previewing is not proof that every consumer body has been rewritten on disk. |
| Long copy | A longer overridden paragraph grew the native card; the action moved down without the observed collision. Its height later grew again when the shared body recipe changed to bold. |
| Composite recipes | Body typography followed a shared weight edit. Surface composites followed theme fills and a shared radius change from 12 to 18; one explicit local radius stayed 20. |
| Modes | Light/dark changed surface/ink. Compact padding resolved to 12 versus 24. Large text resolved to 20px versus 16px. Resolved reads and actual native rendering were inspected. These selected mode specimens do not prove every combination or accessibility acceptance. |

Inspect the [component specimens](visual-concepts/brilliant-native-capabilities-2026-11-06/components-final.png), [variant masters](visual-concepts/brilliant-native-capabilities-2026-11-06/variants-final.png), and [cross-canvas consumer after revision](visual-concepts/brilliant-native-capabilities-2026-11-06/consumers-final.png). Mode recipes are shown [before](visual-concepts/brilliant-native-capabilities-2026-11-06/modes-before.png) and [after the shared edit and range repair](visual-concepts/brilliant-native-capabilities-2026-11-06/modes-final.png).

## Text, alpha and conversion failures

Inserting “native ” before “shared styles” left the original styled span at character offsets 15–28, styling the wrong substring. Reapplying the substring span moved it to 22–35. The final native PNG and browser export style the intended phrase. Treat rich-text ranges as offsets that need rechecking after copy edits.

This trial refines the previous adapter's alpha advice. A DS token `#ff000080` resolved to red at 50% opacity, using CSS RGBA order. A literal BL paint with that string emitted an auto-correction to `solid(#FF0000,o(0.50))` and explained the underlying ARGB parser. Both final native swatches were translucent red. The skill now distinguishes these paths instead of telling callers to transpose all DS tokens to ARGB.

`convert_html` with `layout: true` ran two inputs in a throwaway world; the before/after canvas inventory was identical. The input using `font:700 24px Arial` returned Inter 32 for its heading. The input using explicit family, size and weight returned Arial 24. Both returned empty notes. The preflight is useful precisely because success/no warnings do not mean the intended properties survived.

## UI guidance actually exercised

`list_stagers` exposed the real Fills inspector schema. `render_ui` refused an output path under the repository worktree; the returned allowed roots included the owned Baseline project. Retrying under its Exports folder succeeded and produced [this staged inspector](visual-concepts/brilliant-native-capabilities-2026-11-06/staged-fills.png), with supplied blue, ink and 50%-red rows. This is a deterministic widget illustration, not a screenshot of a live selection.

`list_ui_targets` found `project.libraries`. A one-step `show_ui` guide opened the actual Libraries surface and displayed its guidance card. The agent clicked Done; `show_ui_outcome` returned `done`, one step reached and `changed: []`. This was an agent-operated walkthrough test, not an independent human usability result. No library was added or published. Afterward `switch_canvas` returned `presented: true` while the Libraries surface still covered the canvas; the Files rail restored the design view. The complete final mode study was then inspected in the desktop editor without reloading. A keyboard fit shortcut had no visible effect through this automation; the visible zoom menu's fit action worked.

## Raw HTML checks

[Browser evidence](visual-concepts/brilliant-native-capabilities-2026-11-06/browser-checks.json) covers the unmodified [mode export](visual-concepts/brilliant-native-capabilities-2026-11-06/modes-final.html) and [consumer export](visual-concepts/brilliant-native-capabilities-2026-11-06/consumers-final.html) in Chromium at 390, 768 and 1120. All six renders had zero page/console errors. The [mode browser capture](visual-concepts/brilliant-native-capabilities-2026-11-06/modes-final-browser.png) and [consumer browser capture](visual-concepts/brilliant-native-capabilities-2026-11-06/consumers-final-browser.png) were visually inspected.

Colour modes, the 20/18 radii and the repaired italic phrase survived. The native blue link became browser-default blue. The native visual buttons became generic div content: both exports had zero semantic headings or buttons. The 1120px mode board overflowed 390/768; the 720px consumer board overflowed 390. At larger widths the latter stayed a fixed 720px board rather than adapting.

The export emitted colour variables for the used modes, but type and density were fixed inline geometry. Changing the compact/large-text element's `data-bl-mode` to the ordinary light value in a separate browser DOM experiment left its body at 20px and its inset at 12px. The raw exported file was not patched. Native accessibility modes therefore do not establish runtime accessible mode switching in exported HTML.

## Adoption and limits

The maintained skill now routes tasks to focused component/layout/type/mode/preflight/UI knowledge and carries the observed failures and repairs. It uses the installed MCP as authority instead of copying the bundled multi-environment agent instructions or vendor manuals. These specimens test native mechanics beyond the earlier HTML recreation, not a new full-site design, a creative-quality comparison or a universal undo guarantee. Libraries, generated assets, shaders and film export were not exercised in this pass. No model-token or cost benchmark is available.
