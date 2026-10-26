# Source-derived canvas bootstrap

Use this optional manual command after selecting a design surface. It emits a disposable kit outside the site, preserving CSS and Astro as the source of truth. It never edits site files, installs tooling, opens a design document or changes client configuration. Inspect source paths and declared component contracts with `baseline:inspect` first.

```powershell
npm.cmd run design:canvas-kit -- --out ../canvas-kit-001
# Preserve the CSS load order of an existing site's actual layout:
node scripts/canvas-kit.mjs --root ../my-site --css src/styles/global.css --css src/styles/theme.css --context-class site-design --map ../site-role-map.json --out ../canvas-kit-002
```

This uses existing PostCSS, TypeScript and Playwright development dependencies and an already installed full Chromium. `npx.cmd playwright install chromium` is a separate intentional setup step. The command is outside verify/build/CI. Missing browser tooling fails without publishing a kit; manual source mapping remains a complete alternative.

## Sampling and output

Default input is `src/styles/global.css`; repeated `--css` arguments replace it with ordered project-relative styles. No target JS/config is executed. The inert harness removes font loads, imports and ordinary declarations, while retaining `@property` syntax/inheritance/initial-value descriptors; maps default `@theme` into its theme layer; and preserves custom-property rules/layers/media conditions. It samples a span under the optional body context class at 390×844 and 1440×900, using a default surface, horizontal writing and a 16px root (`--root-font-px` changes that explicit assumption). Chromium resolves aliases, derived colors and fluid lengths; eight-bit sRGB samples retain alpha. Font- or line-height-relative lengths such as `em`, `ex`, `ch`, `cap`, `ic`, `lh`, `rex`, `rch`, `rcap`, `ric` and `rlh` are unresolved because the inert span does not reproduce the page's font metrics or element line heights. This is token sampling, not the full page cascade or component geometry. Other CSS imports and non-default `@theme` directives are refused: supply reviewed explicit local CSS sources or inspect the actual rendered site instead.

`canvas-kit.json` records source hashes, declaration expressions/contexts, selected roles/classes, environment, font requests, declared component props and unresolved values. Each token's `contextRisks` identifies conditional selectors or at-rules on that property and its `var()` dependencies; `contextReviewRequired` and the CLI's `conditionalRoles` surface these cases even when the default probe resolves a value. A warning is not proof that an alternative rule applies, and an empty list is not proof of complete cascade fidelity. `--context-class` sets classes on `body` only: it does not add HTML data attributes, ancestor elements, component classes to the probe, or infer which theme/route is intended. Compare flagged values and the assumed root size against the actual rendered page before importing or approving them. `sceneReady` only means required values were emitted, not that visual fidelity was verified. Independent `390.tokens.json` and `1440.tokens.json` collections use unique `site390/*` and `site1440/*` variables, avoiding dependence on scalar recomputation after a mode switch. Original production names remain in `codeSyntax.WEB`; samples are not a second production token authority.

When comparing saved metadata, inspect the DTCG export and recorded source expressions. A combined CSS export may disambiguate duplicate CSS names across collections/role aliases by prefixing them. That output is not a replacement stylesheet or proof that a production property was renamed.

When required roles resolve, matching `.jsx` files provide a real Card with Title/ShowMetadata properties, a long-copy instance and Primary/Secondary/Ghost action variants. These are semantic previews with illustrative copy, not extracted Astro implementations. Fixed 240×48 calibration controls are not measured production dimensions. Use actual source-owned component/layout APIs when translating. Missing roles emit diagnostic/token files without inventing a scene (exit 1); invalid inputs, drift, linked paths and existing/in-target outputs refuse (exit 2). Complete kits exit 0. Never import over unchecked user-owned variables.

## Existing names and fonts

A role map is a JSON object of canonical canvas role → existing source custom property:

```json
{
  "--color-page": "--brand-canvas",
  "--spacing-container": "--page-gutter",
  "--text-step-2": "--display-size"
}
```

Mapping is explicit, not a guessed fallback or reason to rename an accepted theme. Only custom-property names are allowed. The map/digest are recorded; unresolved names remain unresolved. Review meanings: a card radius is not automatically a control radius, and one heading token may not represent every heading level. Preserve actual CSS load order and sampling context.

Fonts retain source stacks. Font declarations must be valid `font-family` syntax and required colors and lengths must resolve as the expected token type; otherwise the scene is withheld. Generic system stacks have explicitly recorded canvas samples (Arial, Georgia or Consolas); custom family requests are retained. No font is installed or certified. Check `get_font_status`/CLI `fonts` before judging wrapping, declare substitutions and verify production fonts in Astro.

## Import and verify

For OpenPencil, load its Baseline skill and bundled release-matched upstream reference. Inspect `import_design_tokens` and `render` schemas. Import each JSON as a separate `{ path, text }` file with `styles:false` into an agreed scratch document, then render matching JSX. Its JSON path is a payload label, not permission to expand filesystem roots. Inspect fonts, bounds, bindings and exported desktop/mobile views. Use the scoped properties/lint/diff loop, save `.fig` and verify recovery before implementation.

For Penpot, map the source report through the documented Penpot variable/component APIs; this scope does not emit an executable Penpot bootstrapper. Direct Astro users can use the report without a canvas. Every path retains design selection, native `/_styleguide` calibration, route/browser acceptance and the authorized release endpoint.

To rerun the local Chromium regressions for the sampler on Windows, use the already installed browser and run:

```powershell
$env:BASELINE_CANVAS_BROWSER_TESTS = '1'
node --test tests/canvas-kit.test.mjs
Remove-Item Env:BASELINE_CANVAS_BROWSER_TESTS
```

Those optional tests compare a real browser's page values with the kit for font-relative lengths, registered non-inherited properties and conditional/aliased declarations. The ordinary fast suite keeps its browser-free injected-sampler tests; these local checks do not run in CI or the site build.

## Headless saved-file checks

Prefer a version-matched external OpenPencil CLI for saved-file inspection before inventing parsers. It is optional and separate from site dependencies; inspect installed help. Tested Windows examples use the npm cache without altering the project lockfile:

```powershell
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil info C:/designs/review.fig --json
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil tokens C:/designs/review.fig --format css --json
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil lint C:/designs/review.fig --preset accessibility --json
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil diff files C:/designs/before.fig C:/designs/after.fig --json
```

These read-only commands need no editor. `diff files` exits 1 for differences; inspect the result rather than treating that exit as a defect by itself. Use a separately owned closed copy for headless writes, never a file concurrently open for manual editing. Do not use `lint --fix` by default. Raster exports require fonts/renderer support: inspect diagnostics and use `--font-policy strict` when faithful fonts are an acceptance requirement. Canvas checks do not certify browser layout, accessibility or CMS bindings.

Observed Windows/Node 24 limitation in CLI 0.16.0: `info`, `tokens`, `lint` and file diffs worked without the editor, but headless `eval` failed during CanvasKit initialization with a doubled drive-letter WASM path. Use desktop MCP for authoring/renders on that affected setup; do not patch installed packages or disable safeguards as an onboarding step. This is version/environment evidence, not a claim that headless authoring is unsupported everywhere. The desktop trial also exposed stale glyph rendering after reopen despite available-font diagnostics; follow the skill's scoped recovery and inspect both export and visible canvas before acceptance.
