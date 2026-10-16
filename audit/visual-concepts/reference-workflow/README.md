# Visual-first workflow replay — 2026-10-16

These are constructed, neutral examples for #1, not a client migration, public deployment or proof of editor saveability. All copy/artwork is synthetic. The isolated concept-study exception applies; no client Art Direction Record is invented and production src/public is untouched. The two pages share the production Container/Grid and global Tailwind v4 tokens.

## Evidence preflight and decisions

| Input | Facts | Decision | Unknowns / bounds |
| --- | --- | --- | --- |
| `source-flat.html`, captured as `captures/flat-reference-1440.png` | Local HTML used only to manufacture a standalone 1440×900 CSS-pixel reference, DPR 1, full page, static English shell/German copy, system Arial, inline three-color SVG, no external assets or interactions | Preserve hierarchy, text, mark colors and semantic address break; map visible roles into shipped neutral tokens; infer intrinsic stacking below the supplied wide frame | A flat image alone does not prove mobile rules, font identity/rights, CMS ownership or hidden states. Source HTML is disclosed for fixture provenance, not evidence a real screenshot would provide. |
| `source-legacy.html` | Local rendered one-page source; header/content/cards/address inventory complete; 1100px fixed-width main; live inspection and pre-implementation captures show overflow at 390 and 768, none at 1440 | **Refine** composition using Container/Grid, fluid type/spacing and intrinsic cards; preserve all meaningful copy, three-color mark and address lines | This fixture has no WordPress builder config, CMS or extra routes. Do not infer those scopes from it. |

Neither case warrants an overhaul: the source hierarchy is usable. Preserve/refine/overhaul is a brief-specific decision, not an automatic upgrade in visual ambition. Output `/flat/` demonstrates token translation with explicit responsive assumptions; `/refine/` demonstrates source-site refinement. Both intentionally converge on the same reusable composition. This is not a numerical screenshot-fidelity acceptance test; typography and spacing differ from the flat input where shipped tokens were selected.

## Contextual safeguards verified

- Keep one semantic `address br`; headings have no forced breaks. No blanket removal.
- Keep the valid `1fr` in production Grid's bounded auto-fit track. The failure in the source is its fixed page width, not every `1fr`.
- Preserve all three SVG fill colors. Brand artwork is not automatically converted to currentColor.
- Preserve the complete German long-copy specimen and test its wrapping; do not shorten it to satisfy a word budget.
- Read source fluid expressions from global.css rather than baking sampled computed sizes into tokens.

`before.json` records the three source-site widths and the immutable flat input hash. `after.json` records six built-Astro captures at **390/768/1440** after a clean reload. Each passes document overflow, address break, logo colors, long-copy retention, no console errors, zero scripts, zero inline token overrides and empty local storage. Full-page PNGs sit beside the manifests. HUD export/reload behavior is separately covered by the existing HUD suite; no HUD was mounted in these concept pages.

Visual review: the narrow source clipped the card group and long copy; the refinement stacks three readable cards within the viewport. Wide output retains the hierarchy and mark with larger token-driven spacing/type. Intermediate captures remain within the viewport. The study does not imply real editor save/reload; use the separate scoped certification receipt for that contract and repeat it on a client's supported editor surface.

## Replay locally

From the repository root, with the pinned Windows Playwright renderer installed:

```sh
node audit/visual-concepts/reference-workflow/capture-before.mjs
npx --no-install astro build --root audit/visual-concepts/reference-workflow
node audit/visual-concepts/reference-workflow/capture-after.mjs
```

The before step writes only this concept's synthetic source/captures; the build writes under ignored .emdash/checks/. The after step serves that static artifact on ephemeral loopback and closes it after capture. This replay is manual, separate from visual goldens, normal builds and CI. It never updates authoritative visual baselines.
