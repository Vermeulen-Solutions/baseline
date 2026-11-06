---
name: brilliant-site-design
description: Iterate site concepts in Brilliant's editable local canvas through MCP, preserve Baseline token intent, inspect exports and translate the selected direction into Astro. Use when Brilliant is the selected design surface; HTML/browser remains the default when no surface is selected.
---

# Brilliant site design

Use Brilliant for the selected canvas work within Baseline's existing design workflow. The same agent can design and implement. Reuse the chosen project, accepted direction and current feedback; do not repeat discovery, install another surface or introduce a second agent automatically. The shared [design iteration loop](../site-art-direction/references/design-iteration.md) owns surface choice, reference research, two-or-three-direction comparison, selection and native Astro acceptance.

Brilliant is an editable vector/layout canvas. HTML input is converted to native objects; it is not a browser CSS runtime. The mechanics pilot verified live updates, native colour-role bindings and one independent owner-edit/rollback case. A later full-page Baseline recreation needed substantial native repair and did not provide a faithful HTML round trip. These are bounded results for those paths, not a verdict on native concept authoring. Keep dropped fluid CSS, fixed-width exports and the observed sizing-intent undo discrepancy explicit.

## Connect and identify

Read [connection and recovery](references/connection-and-recovery.md) when connecting, reopening a project or recovering a call. Use the installed version-matched MCP schemas and knowledge, rather than assuming this adapter contains the full vendor API. The desktop app normally serves `http://127.0.0.1:3333/mcp`, with documented fallback ports 3334/3335. Inspect the actual connection; no app-specific client plugin is required by the tested HTTP path. [Brilliant onboarding](../../../docs/brilliant-onboarding.md) covers missing setup when supplied.

Use **one clearly named project per site or design assignment**, such as `Baseline`. Inspect `list_projects` first and reuse the settled project key. All directions, desktop/mobile boards, revisions and related studies belong inside it as named canvases/folders, for example `Directions/A – Workbench`, `Directions/B – Field notes` and `Studies/Compatibility`. Do not create a new project for each iteration or use an anonymous backing folder named `project`. Separate projects are for unrelated assignments or an explicitly requested separation. Scratch stays a sandbox; an owner's example there is not permission to overwrite it or use it as the site's project.

Call `init` with that project's exact key or absolute path and a short agent name. Pass its `sessionId` to every accepting tool and keep the session for refs/checkpoints. Confirm the returned project and owner-visible name before writing. A genuinely new project starts in a descriptively named empty local folder. Renaming a local project in the desktop UI renames its backing folder: protect linked artifacts and recover the new key before continuing. Consolidate through supported app copy/paste, preserving scoped design systems/assets and verifying the copy; see the connection reference. Keep work unpublished unless sharing is separately authorized. Naming a project never requires publishing it, buying a plan or changing global configuration.

## Map before authoring

Read [Baseline mapping and export](references/baseline-mapping-and-export.md) before the first concept or native-token edit. Inspect the site's CSS and component APIs, approved typography, real copy/assets, preserved commitments and important states. Keep original OKLCH/fluid expressions beside any computed canvas values. The source CSS remains implemented authority; native tokens and exports describe a proposal.

- **Native concept path:** compose the brief's hierarchy directly with named native content/layout groups, typography and suitable vector/effect layers. Use hug/fill and wrapping for changing copy and controls; reserve fixed coordinates for intentional artwork/overlays. An elaborate native illustration can be editable without being an image or a browser-DOM reconstruction. Learn from an owner-selected native example read-only, without copying its factual claims or treating it as a speed/quality benchmark.
- **HTML/recreation path:** an `html` fence accepts inline HTML/CSS without knowledge loading. Inspect source styles/content and preflight a representative slice before importing a whole page. A successful conversion or a high object count does not establish fidelity. Browser-sampled fixed frames are a declared reconstruction method, not the default way to author a new native concept; do not assume `clamp()`, `vi`, custom properties, grid, rich text or effects survive. Inspect bounds and the actual render before expanding.
- **Native-token path:** load `blueprint/core`, `blueprint/layout`, `design-systems/core` and `design-systems/authoring` as needed. Author the design system with a `ds` fence and use its references in `bl` fences. HTML fences do not provide the same native design-system discipline.
- Load knowledge in one or two focused batches. Follow prerequisite information returned by the installed server; avoid fetching the whole catalogue or repeatedly reading the complete canvas. Tool-call counts and bytes are not model tokens.

Load the relevant installed keys when the task needs these capabilities; the mapping and connection references carry the observed limits:

| Task | Knowledge keys / tool |
| --- | --- |
| Repeated cards, buttons, states and slots | `blueprint/components`, relevant `design/blocks/*`; inspect with `read(expandInstances: true)` |
| Layout relationships and intentional overlap | `blueprint/layout`, `blueprint/layout-patterns` |
| Shared typography/surface recipes and modes | `design-systems/authoring-composites`, `design-systems/authoring-branches`, `design-systems/authoring-modes`, `design-systems/apply` |
| Mixed text styles and links | `blueprint/text`, `blueprint/styled-ranges`; reapply ranges after copy changes |
| HTML conversion preflight | Discover `convert_html`; inspect its `layout: true` output before creating objects |
| Helping the owner find a control | `reference/show-me`, `reference/ui-walkthroughs`; discover targets/stagers first |

Use native masters/instances for repeated structures and variants for their discrete states. Test one shared edit and one local override before expanding a component family. Cross-canvas propagation, stored consumer bodies and text-style overrides have distinct limits; follow the mapping reference rather than promising every instance is immediately synchronized on disk.

## Iterate and inspect

1. Pick the representative slice from the brief. For an open new direction, compare two or three concepts with meaningful structural differences, shared real content and desktop/mobile intent (`1440×900`, `390×844`). A tall mobile board may extend below the viewport; report its actual capture dimensions. Small refinements edit the selected composition directly.
2. Write through `edit`, with the document kind and `file(path)` as the fence's first row. Name canvases, boards and important layers by purpose (`Hero copy`, `Primary action`, `Product specimen`), not generic DOM tags or `viewport`. Build in coherent batches, commonly one to three changes, with named `// label` checkpoints. Save the authored batch and relevant refs in the concept notes. Never modify `.bl`/`.ds` files directly to bypass the canvas pipeline. Read the mapping reference for native tracking/alpha units, explicit alignment and clipping before translating CSS values.
3. Read the returned warnings, geometry and actual saved state. External MCP edits can return composition/overflow notes; they are not exclusive to built-in chat. Inspect a PNG after each meaningful batch and fix overflow, text sizing or missing content before review. A clean diagnostic is neither a contrast audit nor design approval.
4. Verify the owner's actual surface. A project opened in the background may return `presented: false`; open its tab once before claiming the owner can see it. Check that the intended write appears in that open canvas without reloading. An API preview alone proves only the preview. Reuse the working tab rather than refreshing after every write or silently switching surfaces.
5. For rollback, use the same session and named checkpoint, then re-read both the intended restored properties and any independent owner edits. The pilot preserved an owner text/name edit while restoring an agent heading and bar height, but a separate hug-to-fixed rollback retained a newer measured height. Redo was row-granular. Do not promise universal full-turn undo or assume one redo restores a whole batch. Inspect state before a bounded repair; retain owner edits and evidence of any discrepancy.

Before accepting a representative concept, try a realistic longer headline, paragraph and CTA. Check that content containers and the surrounding page grow and that narrow-screen actions wrap without collisions. A good fixed screenshot does not establish edit resilience. Recheck alignment, explicit page ground and clip flags after converting frames to auto layout; separately check that decorative absolute layers stay outside content flow.

Never use a fabricated quote, customer, metric or team portrait to fill the canvas. Generated illustrations and honest editorial drafts need clear labels and realistic content shapes; apply the site's existing asset preparation and provenance rules when assets are intended for production.

## Export, select and prove in Astro

Export to the bound project's `Exports/` folder, using returned refs/IDs and actual schemas. Inspect both the format and returned file: the tested HTML document and React exports preserved five named colour variables, while snippet/Flexbox HTML flattened them. All tested variants retained fixed outer pixel widths; native gap/padding/type references did not become fluid CSS. The mapping reference includes the tested tradeoffs and a native probe.

Render the selected export in headless Chromium at 390/768/1440, listen for `pageerror`/`console.error`, and compare matching-width captures with the canvas. Check actual fonts/optical faces, link paint, named fragment targets, semantic headings/landmarks, overflow, required states and adopted motion/reduced motion. A zero-error render can still fail every behavioral requirement. Wrap a Flex snippet in a minimal document with viewport metadata and a body-margin reset before blaming browser defaults on its layout. Keep the raw export separate from repairs, record failures honestly and do not scale a desktop export down and call it responsive. Present one named review entry with complete-page links, actual dimensions, what is real and meaningful feedback prompts. Owner language and controls follow the shared iteration loop.

After direction selection, save/check the site's Art Direction Record, translate relationships through real Astro primitives and source tokens, calibrate `/_styleguide`, then prove one representative route before rollout. Recreate semantic HTML, responsive layout, font loading, focus, required interactions and adopted motion/reduced-motion in Astro. Neither a native canvas nor exported JSX proves CMS editing or production readiness. Keep a compact source-expression/role/component/state map and approval-versus-assumption record; another-agent handoff is optional. Run the site's installed verification commands and complete the agreed release endpoint.
