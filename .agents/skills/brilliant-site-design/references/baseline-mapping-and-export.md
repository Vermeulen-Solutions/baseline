# Baseline mapping, native tokens and export

Read before the first concept, native-token change or Astro handoff. CSS owns the implemented values. A Brilliant scene is an editable proposal with its own layout solver; a correct static render does not establish browser behavior.

## Carry the source intent

Inspect the actual `src/styles/global.css`, component APIs and accepted project decisions. If installed, `npm run design:canvas-kit` and `npm run design:tokens -- --json` help inspect source roles; check available commands first. Retain original declarations, local aliases, scopes and fluid expressions. Sample at the comparison widths using a real browser/installed supported evaluator, and label the resulting numbers with viewport/root-font assumptions.

The neutral pilot mapped five source roles into native `color.page`, `color.surface`, `color.text`, `color.action` and `color.border`. It kept original OKLCH strings beside browser-resolved sRGB approximations. A real site can need muted/on-action/elevated/focus and contextual surface roles too; five samples are not a complete client token contract. Preserve the site's approved typography. Record a canvas font substitution separately from the accepted production pairing and verify actual fonts on the Astro route.

HTML `clamp()`, `vi`, custom-property declarations and `var()` paints were dropped by the tested converter without warnings. Gap/padding/font constants survived. Use sampled constants deliberately when exploring an HTML layout, then inspect the result. Do not treat HTML-fence creation as native semantic-token authoring or infer preserved expressions from a screenshot.

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

## Test the right export flavour

Use the actual `export` schema, owned `project`, `sessionId`, `canvasId`, returned refs/IDs and a destination under that project's `Exports/`. The pilot's names and behavior are a tested baseline, not a guarantee across future app versions:

| Format | Colour roles in the native probe | Layout and handoff limits |
| --- | --- | --- |
| `html` | Flattened into literal colours | Absolute positions, fixed outer size; colour roles must be reconstructed |
| `htmlDoc` | Five `--color-*` declarations and six `var()` uses | Self-contained document; absolute positions and pixel sizes, not semantic/responsive Astro |
| `htmlFlex` | Flattened into literal colours | Some Flexbox relationships and literal gap/padding survive, but outer width remains fixed |
| `react` | Five declarations and six `var()` uses | Flex relationships and literal sizes; exported JSX parsing does not prove a working mount or justify adding React to a static site |

All four lacked the original fluid expressions. `htmlDoc`/React preserved native colour roles; an offline `--color-action` edit propagated to the rendered action sample. That does not certify every token type or prove a native design-system edit propagates in every context. Compare expressions and role references explicitly instead of choosing an export by filename alone.

Capture the complete board plus the requested viewport slice when the page is taller. Inspect actual PNG dimensions and equivalent browser extents: the pilot's 1009.16px content rounded to 1010px in the native PNG and 1009px in Chromium. A measured pixel difference has no automatic aesthetic or fidelity pass threshold; inspect wrapping, geometry, fonts, clipping and required states yourself.

## Native Astro proof and acceptance

1. Export and render the selected artifact at 390/768/1440 with zero page/console exceptions. Check content, overflow and intermediate reflow; a 1440px board that stays 1440px wide fails responsive acceptance. A separate 390px board or a scaled image is responsive intent, not a working responsive page.
2. Map selected relationships onto source roles and real `Section`/`Container`/`Grid`/`Card` APIs or appropriate existing primitives. Recreate semantic headings, links, reading order, native image delivery and content ownership. Do not paste exported absolute positioning/JSX into public routes as a finished page.
3. Follow the shared [token handoff](../../site-art-direction/references/token-handoff.md), save/check the Art Direction Record before client-specific visual implementation and calibrate `/_styleguide`. Keep isolated concept work under `audit/visual-concepts/` separate from implemented site tokens and CMS records.
4. Compare one representative real Astro route with the selected composition. Verify actual typography/loading, narrow/intermediate/wide layouts, long content, keyboard/focus, destinations, required interactive/error/empty states and adopted motion/reduced motion. CMS work additionally requires actual typing/save/reload on real edit targets. Complete the site's installed checks and authorized release endpoint; export success is not deployment acceptance.

Record one compact mapping and dated evidence in the existing context home: source expression/role, canvas binding and sampled assumptions, native primitive/state, selected versus draft artifact and approval versus assumption. Report setup, knowledge/schema reads, writes, screenshots, repairs and translation separately if measuring effort. Use actual harness tokens only when exposed; otherwise state unavailable and retain call/byte measurements as operational evidence.
