# Baseline mapping, native tokens and export

Read before the first concept, native-token change or Astro handoff. CSS owns the implemented values. A Brilliant scene is an editable proposal with its own layout solver; a correct static render does not establish browser behavior.

## Carry the source intent

Inspect the actual `src/styles/global.css`, component APIs and accepted project decisions. If installed, `npm run design:canvas-kit` and `npm run design:tokens -- --json` help inspect source roles; check available commands first. Retain original declarations, local aliases, scopes and fluid expressions. Sample at the comparison widths using a real browser/installed supported evaluator, and label the resulting numbers with viewport/root-font assumptions.

The neutral pilot mapped five source roles into native `color.page`, `color.surface`, `color.text`, `color.action` and `color.border`. It kept original OKLCH strings beside browser-resolved sRGB approximations. A real site can need muted/on-action/elevated/focus and contextual surface roles too; five samples are not a complete client token contract. Preserve the site's approved typography. Record a canvas font substitution separately from the accepted production pairing and verify actual fonts on the Astro route.

HTML `clamp()`, `vi`, custom-property declarations and `var()` paints were dropped by the tested converter without warnings. Gap/padding/font constants survived. Use sampled constants deliberately when exploring an HTML layout, then inspect the result. Do not treat HTML-fence creation as native semantic-token authoring or infer preserved expressions from a screenshot.

## Choose the authoring path for the goal

For a new Brilliant concept, author its visual hierarchy in native groups and layout, with editable typography and brief-led illustration. An owner-selected native Scratch example demonstrated layered gradient fills, vector silhouettes/arcs, restrained glows and semantically named illustration groups, alongside auto layout for editorial copy, navigation and controls. These are useful native composition patterns; they do not establish that the example's business claims are true, who created it, how many tokens it took or whether it is responsive. Extract the construction principle, not its copy, palette or private scene.

For an exact recreation, capture the real source at matching widths, preserve its copy/assets and adaptation constraints, and compare a representative converted slice before importing everything. The [full Baseline mockup trial](https://github.com/Vermeulen-Solutions/baseline/blob/0e9a35a/audit/brilliant-baseline-mockup-2026-11-06.md) created 870 objects through sampled HTML but failed visual review. Native reconstruction represented the full design with partial fidelity after repair. That result is specific to the tested path, not evidence that native design authoring is inherently a DOM-copying task or that every capture/import path fails.

When preparing inline CSS, copy only applicable layout properties: computed `flex-direction: row` on a block is not its authored layout, and blindly inlining it changes conversion. Retain original expressions, normalize deliberately supported colour syntax and inspect grid, rich text, borders, fonts and effects rather than trusting a success response. Fixed browser-derived geometry is a declared reconstruction, not responsive behavior or a maintainable default for new concepts.

## Native probe recipe

Load the version-matched `blueprint/core`, `blueprint/layout`, `design-systems/core` and `design-systems/authoring` knowledge before using this pattern. The example values below are the neutral November 2026 pilot samples, not client defaults to copy blindly. Replace them from the current source mapping and preserve the original expressions in the concept notes.

In the pilot, `designSystem: "new"` with an untouched shipped default required a `ds` fence on `Styles/default.ds`. A previously authored project can use a named design-system file instead. Read the actual `init` guidance and existing catalog before changing it; never overwrite a client's system wholesale. In explicit native-token mode, tokenizable properties need supported token references, while `s()` dimensions can be numeric. `designSystem: "none"` is for sampled literal work and must not be mixed with `$token` expectations.

The following is the tested edit structure, with a short probe before larger pages:

````text
```ds
file("Styles/default.ds")
color.page: #fafcfe
color.surface: #ffffff
color.text: #1a2029
color.action: #005198
color.border: #c8ced8
font.family: "Arial"
font.size.display: 40
font.size.body: 18
font.weight.display: 700
spacing.pad: 24
spacing.gap: 12
radius.card: 12
```
```bl
file("Compatibility.bl")
// semantic probe
al(v,g($spacing.gap),pad($spacing.pad)) s(390,hug) f[($color.page)] "Semantic role probe" #probe
  t("Build with Baseline",$font.family,$font.size.display,$font.weight.display) s(fill,hug) f[($color.text)] #probeTitle
  al(v,g($spacing.gap),pad($spacing.pad)) s(fill,hug) f[($color.surface)] rd($radius.card) "Surface" #probeSurface
    t("Five named semantic colours",$font.family,$font.size.body) s(fill,hug) f[($color.text)] #probeBody
    r s(fill,1) f[($color.border)] "Border sample" #probeBorder
    r s(fill,24) f[($color.action)] "Action sample" #probeAction
preview(#probe)
```
````

Read back the actual bindings and bounds. Only change the requested declarations in an existing system. Native named number tokens still represent canvas values; they do not recreate `clamp()` or contextual CSS automatically. Keep narrow/wide specimens, realistic long copy and the reading-order intent beside the chosen composition.

## Native units and edit resilience

- **Tracking:** bare `ls(N)` uses pixels, while the tested token-bound tracking value is relative to the font size. Translate CSS pixel tracking as `letterSpacingPx / fontSizePx` before binding, then inspect the resolved pixel value. Binding `-4.925` as a token at 109.44px produced roughly -539px tracking; `-0.045` resolved correctly. A clean parse did not detect that unit mistake.
- **Alpha:** distinguish document parsers. A later native capability trial verified `#ff000080` in a `ds` colour token as CSS `RRGGBBAA`: red at 50% opacity. A bare `bl` paint using the same string was auto-corrected to `solid(#FF0000,o(0.50))`, with a note that its underlying parser uses `AARRGGBB`. Prefer explicit `solid(colour,o(...))` for literal paints and inspect resolved colour/alpha and correction notes; do not transpose every eight-digit DS token to ARGB. The earlier trial's `rgba()` DS declarations returned unknown-generator notes even while the write reported ready.
- **Fonts:** inspect the actual source display/body faces, weights and optical variants. Replacing a CSS stack with its broad family name can change selection: this trial's exported `Segoe UI Variable` family fell back to `Segoe UI` in Chromium. Check real rendered fonts when fidelity matters. A repeated identical PNG did not clear the tool's persistent provisional-font warning; record that limit rather than exporting indefinitely or certifying all fonts as settled.
- **Content flow:** use native auto layout, hug/fill, bounded widths and wrapping for headline, deck, actions and page sections. Preserve real margins/gaps intentionally; do not assume sampled fixed frames absorb longer copy. Try a longer headline, paragraph and CTA before accepting a representative layout. Keep single-line labels intrinsic where appropriate.
- **Alignment and clipping:** explicitly check start/center/end alignment when enabling auto layout on a frame. Re-read clip flags, page ground, dimensions and bounds after the type change, and mark decorative backgrounds/overlays absolute so they do not join content flow. In the trial, restoring explicit alignment and clipping repaired unintended centering and oversized raster exports.
- **Cross-row gaps:** this runtime could bind the main-axis gap but refused a token on the wrap-row gap; a numeric cross-gap was accepted. Read the installed contract and resolved layout instead of silently accepting the reported fallback.

Keep illustration/effect layers separate from content layout, and name important groups by design purpose. A source coordinate is reasonable for a star, overlay or deliberate overlap; it is not a reason to freeze every text and button parent. Read diagnostics critically: a warning that a background is behind transparent content is not automatically a reason to bring it over the text.

## Reusable components, composites and modes

Use a `comp` master plus `inst()` and content `override()` for repeated structures. Use `axes[...]`, `variant(...)` and `at(...)` for discrete states, and named slots for replaceable child content. Load `blueprint/components` before authoring; discover returned child IDs with a bounded `read` using `expandInstances: true` before inspecting or changing one copy. The native capability trial verified shared border, gap and heading edits, content overrides, a filled icon slot, cross-canvas instances, a primary-to-secondary switch retaining custom button copy, and longer text growing a hug card.

Content overrides and style overrides are different. A text-only card override followed shared typography while retaining its words; an explicitly styled instance heading kept its local 28px size when the master became 22px. The tool also flagged some button text styles as different without being able to distinguish intentional overrides from stale styles. Inspect the named copies. When restoring the master's style is intended, `reset_text_style_overrides` on the reported text/instance IDs kept the characters in this trial. It also removes intentional local text styling, so do not reset a whole canvas indiscriminately.

Read cross-canvas synchronization notes. A master edit did not rewrite the closed consumer canvas's file; reading it resolved the new master geometry in memory. A later genuine consumer edit persisted the updated body. An up-to-date preview therefore does not certify every stored consumer body for a portable-file handoff. Inspect affected consumers and their save state, and use supported edits for needed changes; do not patch native files or manufacture no-op writes to silence the warning.

Native DS composites can bind typography and surface recipes, with per-field overrides. The trial's `$typography.body` followed a shared weight edit and resolved 16px normally versus 20px in large-text mode. `$surface.card` followed light/dark fills and a radius change to 18px while one explicit local radius remained 20px. Density compact resolved 12px padding versus 24px comfortable padding. These are tested native relationships, not automatic CSS accessibility behavior. Scope study systems beside their canvases; the trial used its own standalone scoped DS without changing the project's default or a global pin.

Recheck styled ranges after changing characters. Inserting `native ` before a styled phrase left the old numeric span offsets in place and styled the wrong words. Reapplying `spans[("shared styles",i,$color.action)]` against the new text moved the range to the intended substring; native rendering and HTML both then preserved it. Do not assume a range originally authored by substring will keep following that substring through later text edits.

## Test the right export flavour

Use the actual `export` schema, owned `project`, `sessionId`, `canvasId`, returned refs/IDs and a destination under that project's `Exports/`. The pilot's names and behavior are a tested baseline, not a guarantee across future app versions:

| Format | Colour roles in the native probe | Layout and handoff limits |
| --- | --- | --- |
| `html` | Flattened into literal colours | Absolute positions, fixed outer size; colour roles must be reconstructed |
| `htmlDoc` | Five `--color-*` declarations and six `var()` uses | Self-contained document; absolute positions and pixel sizes, not semantic/responsive Astro |
| `htmlFlex` | Flattened into literal colours | Some Flexbox relationships and literal gap/padding survive, but outer width remains fixed |
| `react` | Five declarations and six `var()` uses | Flex relationships and literal sizes; exported JSX parsing does not prove a working mount or justify adding React to a static site |

All four lacked the original fluid expressions. `htmlDoc`/React preserved native colour roles; an offline `--color-action` edit propagated to the rendered action sample. That does not certify every token type or prove a native design-system edit propagates in every context. Compare expressions and role references explicitly instead of choosing an export by filename alone.

Check native and browser results separately. The full-page trial kept editable native content but exported linked text with default blue/underline styling, omitted named fragment targets and produced no semantic heading/landmark elements. Those are observed acceptance failures for that reconstruction/export path. Check all meaningful text, actual font selection, link paint/destinations, semantics and required states; record pre-existing source placeholders separately. Do not silently patch the export and present the repaired result as native export fidelity.

The later native component/mode trial confirms limits beyond HTML recreation: its `htmlDoc` retained mode-specific colour variables and the repaired italic phrase, but the native link again became browser-default blue. Visual component buttons became `div` content, not semantic controls. Native body sizes/density geometry were fixed inline values: changing the exported compact/large-text element to the light mode attribute left its 20px body and 12px inset unchanged. Neither native variants nor native accessibility modes establish browser interactions or runtime mode switching.

`htmlFlex` is a snippet. Render it inside a minimal document with viewport metadata and `body { margin: 0 }` before diagnosing matching-width overflow: the raw browser's default body margin caused a separate, removable offset. Keep that wrapper and its result distinct from the raw snippet and from a responsive implementation. A full-document export with zero runtime errors still failed narrow-width reflow, motion/reduced-motion and semantic acceptance.

Capture the complete board plus the requested viewport slice when the page is taller. Inspect actual PNG dimensions and equivalent browser extents: the pilot's 1009.16px content rounded to 1010px in the native PNG and 1009px in Chromium. A measured pixel difference has no automatic aesthetic or fidelity pass threshold; inspect wrapping, geometry, fonts, clipping and required states yourself.

## Native Astro proof and acceptance

1. Export and render the selected artifact at 390/768/1440 with zero page/console exceptions. Check content, overflow and intermediate reflow; a 1440px board that stays 1440px wide fails responsive acceptance. A separate 390px board or a scaled image is responsive intent, not a working responsive page.
2. Map selected relationships onto source roles and real `Section`/`Container`/`Grid`/`Card` APIs or appropriate existing primitives. Recreate semantic headings, links, reading order, native image delivery and content ownership. Do not paste exported absolute positioning/JSX into public routes as a finished page.
3. Follow the shared [token handoff](../../site-art-direction/references/token-handoff.md), save/check the Art Direction Record before client-specific visual implementation and calibrate `/_styleguide`. Keep isolated concept work under `audit/visual-concepts/` separate from implemented site tokens and CMS records.
4. Compare one representative real Astro route with the selected composition. Verify actual typography/loading, narrow/intermediate/wide layouts, long content, keyboard/focus, destinations, required interactive/error/empty states and adopted motion/reduced motion. CMS work additionally requires actual typing/save/reload on real edit targets. Complete the site's installed checks and authorized release endpoint; export success is not deployment acceptance.

Record one compact mapping and dated evidence in the existing context home: source expression/role, canvas binding and sampled assumptions, native primitive/state, selected versus draft artifact and approval versus assumption. Report setup, knowledge/schema reads, writes, screenshots, repairs and translation separately if measuring effort. Use actual harness tokens only when exposed; otherwise state unavailable and retain call/byte measurements as operational evidence.
