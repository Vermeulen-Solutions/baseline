---
name: brilliant-site-design
description: Iterate site concepts in Brilliant's editable local canvas through MCP, preserve Baseline token intent, inspect exports and translate the selected direction into Astro. Use when Brilliant is the selected design surface; HTML/browser remains the default when no surface is selected.
---

# Brilliant site design

Use Brilliant for the selected canvas work within Baseline's existing design workflow. The same agent can design and implement. Reuse the chosen project, accepted direction and current feedback; do not repeat discovery, install another surface or introduce a second agent automatically. The shared [design iteration loop](../site-art-direction/references/design-iteration.md) owns surface choice, reference research, two-or-three-direction comparison, selection and native Astro acceptance.

Brilliant is an editable vector/layout canvas. HTML input is converted to native objects; it is not a browser CSS runtime. The local pilot observed immediate desktop updates, native colour-role bindings and preservation of an independent owner edit during agent checkpoint rollback. It also observed dropped fluid CSS, fixed-width exports and a sizing-intent undo discrepancy. Keep those limits explicit throughout the work.

## Connect and identify

Read [connection and recovery](references/connection-and-recovery.md) when connecting, reopening a project or recovering a call. Use the installed version-matched MCP schemas and knowledge, rather than assuming this adapter contains the full vendor API. The desktop app normally serves `http://127.0.0.1:3333/mcp`, with documented fallback ports 3334/3335. Inspect the actual connection; no app-specific client plugin is required by the tested HTTP path. [Brilliant onboarding](../../../docs/brilliant-onboarding.md) covers missing setup when supplied.

Call `init` with the owned project's exact key or absolute path and a short agent name. Pass its `sessionId` to every subsequent tool that accepts it and keep that session for refs/checkpoints. Confirm the returned project before writing. A new pilot project starts in an agreed empty local directory; do not bind to whichever client project happens to be on screen. Keep local work unpublished unless sharing is separately authorized. Normal canvas work does not authorize account, billing, global MCP configuration or publication changes.

## Map before authoring

Read [Baseline mapping and export](references/baseline-mapping-and-export.md) before the first concept or native-token edit. Inspect the site's CSS and component APIs, approved typography, real copy/assets, preserved commitments and important states. Keep original OKLCH/fluid expressions beside any computed canvas values. The source CSS remains implemented authority; native tokens and exports describe a proposal.

- **HTML path:** an `html` fence accepts inline HTML/CSS without knowledge loading. Use it for a sampled mechanical layout, not to assume `clamp()`, `vi` or CSS custom properties survive conversion. Inspect bounds and the render before continuing.
- **Native-token path:** load `blueprint/core`, `blueprint/layout`, `design-systems/core` and `design-systems/authoring` as needed. Author the design system with a `ds` fence and use its references in `bl` fences. HTML fences do not provide the same native design-system discipline.
- Load knowledge in one or two focused batches. Follow prerequisite information returned by the installed server; avoid fetching the whole catalogue or repeatedly reading the complete canvas. Tool-call counts and bytes are not model tokens.

## Iterate and inspect

1. Pick the representative slice from the brief. For an open new direction, compare two or three concepts with meaningful structural differences, shared real content and desktop/mobile intent (`1440×900`, `390×844`). A tall mobile board may extend below the viewport; report its actual capture dimensions. Small refinements edit the selected composition directly.
2. Write through `edit`, with the document kind and `file(path)` as the fence's first row. Build and iterate in coherent batches, commonly one to three changes. Add named `// label` checkpoints before substantial changes and section boundaries on large blocks. Save the authored batch and the relevant returned refs in the existing concept notes. Never modify `.bl`/`.ds` files directly to bypass the canvas pipeline.
3. Read the returned warnings, geometry and actual saved state. External MCP edits can return composition/overflow notes; they are not exclusive to built-in chat. Inspect a PNG after each meaningful batch and fix overflow, text sizing or missing content before review. A clean diagnostic is neither a contrast audit nor design approval.
4. Verify the owner's actual surface. A project opened in the background may return `presented: false`; open its tab once before claiming the owner can see it. Check that the intended write appears in that open canvas without reloading. An API preview alone proves only the preview. Reuse the working tab rather than refreshing after every write or silently switching surfaces.
5. For rollback, use the same session and named checkpoint, then re-read both the intended restored properties and any independent owner edits. The pilot preserved an owner text/name edit while restoring an agent heading and bar height, but a separate hug-to-fixed rollback retained a newer measured height. Redo was row-granular. Do not promise universal full-turn undo or assume one redo restores a whole batch. Inspect state before a bounded repair; retain owner edits and evidence of any discrepancy.

Never use a fabricated quote, customer, metric or team portrait to fill the canvas. Generated illustrations and honest editorial drafts need clear labels and realistic content shapes; apply the site's existing asset preparation and provenance rules when assets are intended for production.

## Export, select and prove in Astro

Export to the bound project's `Exports/` folder, using returned refs/IDs and actual schemas. Inspect both the format and returned file: the tested HTML document and React exports preserved five named colour variables, while snippet/Flexbox HTML flattened them. All tested variants retained fixed outer pixel widths; native gap/padding/type references did not become fluid CSS. The mapping reference includes the tested tradeoffs and a native probe.

Render the selected export in headless Chromium at 390/768/1440, listen for `pageerror`/`console.error`, inspect overflow, typography, reading order, required states and real destinations, and compare matching-width captures with the canvas. Record failed checks honestly; do not scale a desktop export down and call it responsive. Present one comparison/review entry with complete-page links, tested dimensions, what is real, fixed-width limitations and meaningful feedback questions. Owner language and review controls follow the shared iteration loop.

After direction selection, save/check the site's Art Direction Record, translate relationships through real Astro primitives and source tokens, calibrate `/_styleguide`, then prove one representative route before rollout. Recreate semantic HTML, responsive layout, font loading, focus, required interactions and adopted motion/reduced-motion in Astro. Neither a native canvas nor exported JSX proves CMS editing or production readiness. Keep a compact source-expression/role/component/state map and approval-versus-assumption record; another-agent handoff is optional. Run the site's installed verification commands and complete the agreed release endpoint.
