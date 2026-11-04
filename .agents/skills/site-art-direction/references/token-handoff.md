# Selected canvas to native tokens

Use when a selected design changes shared color, typography, spacing, radius or surface behavior. Reuse the current concept/decision and calibration notes. This recipe connects the existing canvas skills and token CLI; it adds no universal importer, parallel token authority or mandatory handoff document. For an unchanged accepted theme, inspect the affected relationship without reimporting the full design.

## Identify the intended change

Record the selected artifact/file/board and revision, approval versus working assumption, affected route/state and the concrete visual decision. Read the relevant canvas values and current `src/styles/global.css` declarations with their selectors, scopes and aliases. A canvas export can contain sampled pixel values, detached text styles or local overrides; an exported property name alone does not establish its production role.

Map only the affected design values to existing semantic tokens and native consumers. For example, a card-corner decision can map to `--radius-card`, while a local component exception may belong to its supported `--card-*` property instead. Keep default/dark/restored-light scopes distinct. Preserve original `clamp()`, `calc()`, `vi`, aliases and root/context assumptions alongside any viewport samples. A 1440px measurement cannot determine a fluid scale; when only samples exist, derive and review the responsive relationship explicitly before proposing CSS.

For typography, map display/body/accent/mono roles to the intended family, weight/style and source. Roles may share a family. Keep canvas-only substitutions explicit, inspect the installed font checks and verify actual browser glyph use after translation. A font listed as available in a canvas is not evidence of the face used on the public route.

## Preview with the installed CLI

Use the site's current CSS and existing `design:tokens` operation. For example, from the site root in Windows PowerShell:

```powershell
npm.cmd run design:tokens -- --css src/styles/global.css --set '--radius-card=1rem' --json
```

This illustrative value is not a default design decision. Repeat `--set` for each reviewed existing token; `--root:<token>=<value>` and `--dark:<token>=<value>` target those CLI-supported scopes. Keep each complete expression quoted. An omitted `--write` previews and validates the candidate without saving CSS; `--json` reports proposed changes and diagnostics, not a unified CSS patch. For a literal before/after CSS diff, apply the same operation to an owned disposable copy and compare it with the recorded source. Do not use `--init-client`, `--write-record` or `--write-calibration` to preview a scoped update to an existing site.

**Older sites with an incomplete token set.** A site created before the current token contract can fail `design:tokens` before any change is proposed. The plain audit then reports a `Contract gap` with the number of missing required tokens and any missing scope block (often `[data-surface="dark"]`). A `--set` preview still runs and its `comparison` shows how many errors it resolves or introduces, but `--write` is refused until the whole candidate is valid. To complete the contract, preview `--add-missing`: it inserts only the missing required tokens with Baseline starter values (`added` in `--json`), adds a missing `:root` or dark-surface block beside the existing blocks, and never changes existing declarations. Combine it with `--set` in the same command to replace starter values with the site's own. Starter values are suggestions, not calibration. Inserting them can change rendering wherever components already read those tokens, so treat the migration as a visual change: save it only within an authorized design scope, then inspect the affected routes. A presentation-preserving maintenance update leaves the gap reported and does not add tokens.

Review exactly which declarations would change, token/contrast diagnostics, unresolved mappings and affected consumers. Stop the apply step on a missing/ambiguous mapping or failed candidate validation; do not silently choose a similar token or flatten the artifact's stylesheet into a route. Preserve unrelated CSS and keep source expressions authoritative. If the supported CLI cannot represent the needed contextual scope, use a bounded reviewed source edit and the existing audits rather than broadening an importer.

## Apply and prove the relationship

Check that the source still matches the version used for preview, then apply the same reviewed arguments with `--write` within the existing authorized scope. Run `design:tokens` against the saved CSS. The CLI's validation is not a stale-source lock, canvas comparison or browser acceptance; re-preview if intervening edits changed the inputs.

Calibrate the affected native primitive and meaningful variants on `/_styleguide`, then inspect one representative real route and relevant shared consumers at narrow, intermediate and wide widths. Compare the intended relationship with the selected canvas, retaining text, destinations, content/edit ownership, focus, missing/long content and relevant surface/state behavior. Check actual fonts and prepared media where they changed. Prefer computed relationships plus visual inspection over exact pixel equality when native reflow differs legitimately from a canvas frame.

Record the requested change, source/target mapping, reviewed CSS diff, actual checks and remaining status in the existing evidence. A synthetic rehearsal must label its selection as a fixture decision and report the paths/conditions actually exercised; it does not establish user approval or cross-tool roundtrip fidelity. Continue the installed verification and agreed release endpoint after the representative proof succeeds.
