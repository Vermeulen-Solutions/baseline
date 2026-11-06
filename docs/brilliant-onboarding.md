# Brilliant onboarding

Brilliant is an optional editable local design canvas for agent-driven concept work. Baseline defaults to HTML/browser concepts when no preference is established and explicitly presents Brilliant, OpenPencil and Penpot alternatives. Reuse a settled choice and an already working connection. Choosing Brilliant preserves the same two-or-three-direction comparison, selection, native calibration and representative Astro proof; it does not require another agent or a service in the deployed site.

## What is verified

The November 6, 2026 local pilot observed native semantic-colour bindings, variables in full-document HTML/React exports, live desktop edits without reload and an independent owner text/name edit surviving an agent checkpoint rollback. It also found dropped `clamp()`/`vi`/CSS-variable input, fixed-width exported layouts, an initial mobile conversion overflow and a separate fixed-height/hug undo discrepancy. Redo acted per row. These are bounded observations, not universal correctness or token-efficiency claims. The maintained [Brilliant skill](../.agents/skills/brilliant-site-design/SKILL.md) carries the operational rules and tested native probe.

Use Brilliant for the value of owner editing and visual comparison. Keep original CSS expressions and prove responsive behavior in Astro. The app's MCP server reported 1.0.0 in the pilot; that is not an independently established desktop release version. Recheck actual schemas and the installed contract after app updates. No app source/manuals are vendored into Baseline.

## Connect the existing app

1. Reuse the installed app and configured connection. If the app is missing, follow [official installation](https://brilliant.design/docs/getting-started/installation) for the chosen platform within the authorized setup scope. A concept request alone does not authorize installing software or changing global configuration/accounts.
2. Open the desktop app and inspect its MCP connection settings. The documented desktop endpoint is `http://127.0.0.1:3333/mcp`, with 3334/3335 fallback when occupied. Connect the actual address through the harness's supported HTTP MCP configuration; use the [official agent overview](https://brilliant.design/docs/agents/overview) for current client setup. Do not assume a universal JSON configuration works in every harness. Baseline adds no runtime package, bridge or design service to any platform profile.
3. Discover the live tools, choose the owned local project and call `init` with its exact key/path. A new project can use an existing empty directory. Keep the returned `sessionId` on subsequent accepting calls, confirm the returned project and use the same session for refs/checkpoints. The skill's connection reference covers idempotent retries and partial saves.
4. If the project opens in the background, open the owned project tab once. The tested `switch_canvas` could return `presented: false` while the desktop displayed “Agent working in project” and “Open project”. Confirm the intended canvas is visible before judging freshness; record any refresh actually needed. The pilot needed no Ctrl+R for later writes.

Local unpublished projects are distinct from public sharing. Keep work unpublished unless the owner authorizes sharing; do not infer confidentiality from a localhost MCP endpoint. For any intended publication or cloud workflow, check [Brilliant's sync documentation](https://brilliant.design/docs/platform/sync) and the actual project's publication/access state. No subscription purchase or account change is required by this adapter.

## First representative loop

Use the current site brief, source roles, approved fonts, real content/assets and the installed `brilliant-site-design` skill. For a new direction, compare two or three structurally distinct concepts at `1440×900` and `390×844` intent. Work in focused batches with named checkpoints and inspect returned diagnostics plus a native PNG after meaningful writes. In the pilot, external MCP edits returned actionable overflow notes; built-in chat is not required for that feedback.

HTML fences are convenient for sampled layouts. Native semantic-token work uses `ds` + `bl` fences and version-matched knowledge. Keep original OKLCH/fluid values alongside any pixel/sRGB approximations; never call a sampled canvas size preserved CSS. Do not overwrite an existing client's design system just to reproduce the neutral probe.

Export into the bound project's `Exports/` folder. The pilot refused sibling paths outside allowed roots. Inspect the actual format: `htmlDoc` and React preserved native colour variables, snippet/Flexbox HTML flattened them, and all tested variants retained fixed outer widths. Compare the export in headless Chromium at 390/768/1440 and record real dimensions, clipping, overflow, fonts and runtime errors. Present one named review surface with complete-page links and desktop/mobile comparison; images alone do not prove reflow.

After undo/redo, re-read restored sizes, text, native bindings and independent owner edits. Checkpoint rollback is useful but not a lossless transaction guarantee. Preserve the saved authored batch and accepted scene identity so a bounded correction can be made without discarding human work.

Select the direction, save/check the Art Direction Record, calibrate native primitives on `/_styleguide` and prove one representative Astro route. Restore semantic markup, responsive relationships, font loading, focus, required states and adopted motion/reduced motion through the site's real components. Exported JSX is not a reason to install React in a static profile. Complete the installed verification and agreed release endpoint.

## Adoption by existing sites

New generated profiles include this skill and guide without a package dependency. Older static/Sveltia installations need deliberate additive adoption: review/copy the guide and complete skill directory, update installed `baseline.config.json` skill membership and reviewed managed records through the normal [Baseline update workflow](baseline-updates.md), and preserve the original provenance/client decisions. Ordinary bounded sync must not grow membership automatically.

For EmDash/template sites using the maintained skill helper, a fresh checkout can discover the bundled skill. An existing ownership receipt retains its recorded optional membership; explicitly stage `--add-skill brilliant-site-design` at the chosen published immutable source commit if adopting it, review the staged diff/conflicts and apply through [skill synchronization](https://github.com/Vermeulen-Solutions/baseline/blob/main/docs/skill-synchronization.md). Guide/docs adoption and the helper itself are separately reviewed files. A skill update does not install the desktop app or configure the harness.
