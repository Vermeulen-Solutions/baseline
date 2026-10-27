# Source-Derived Canvas Bootstrap

The canvas kit generator (`scripts/canvas-kit.mjs`, run via `npm run design:canvas-kit`) extracts tokens and semantic preview components from an existing Baseline site into a disposable external folder. This allows design tools like OpenDesign and OpenPencil to bootstrap directly from verified project CSS without modifying site code.

```powershell
# Basic extraction from default src/styles/global.css:
npm.cmd run design:canvas-kit -- --out ../canvas-kit-001

# Advanced extraction with explicit CSS load order and role mapping:
node scripts/canvas-kit.mjs --root ../my-site --css src/styles/global.css --css src/styles/theme.css --context-class site-design --map ../site-role-map.json --out ../canvas-kit-002
```

The generator uses PostCSS, TypeScript, and Playwright Chromium. Ensure Playwright Chromium is installed (`npx playwright install chromium`) before running the command.

## Sampling and Output

The generator evaluates ordered project CSS in an isolated Chromium browser context across mobile (`390×844`) and desktop (`1440×900`) viewports with a 16px root (`--root-font-px` overrides the root font size). Chromium resolves aliases, derived colors, and fluid `clamp()` lengths into 8-bit sRGB values:

- **`canvas-kit.json`:** Comprehensive diagnostic report recording source hashes, declaration contexts, font requests, and unresolved properties. Font-relative lengths (such as `em`, `ch`, `lh`) remain unresolved by design because the inert span does not reproduce font metrics or element line heights.
- **`390.tokens.json` & `1440.tokens.json`:** Viewport-specific DTCG design token files with `site390/*` and `site1440/*` variable namespaces for OpenPencil, preserving both viewports simultaneously without relying on mode switching.
- **`open-design/`:** Contains `DESIGN.md` (canonical tokens and Astro primitive contracts), `open-design.json` (design system manifest), and `specimen.html` (zero-JS preview) for OpenDesign Desktop.
- **`.jsx` Previews:** Semantic Card component previews with Title, ShowMetadata properties, and Primary/Secondary/Ghost action variants for OpenPencil.

## Custom Role Mapping

If an existing site uses custom variable names for core roles, provide a JSON mapping file (`--map <path>`):

```json
{
  "--color-page": "--brand-canvas",
  "--spacing-container": "--page-gutter",
  "--text-step-2": "--display-size"
}
```

The mapping explicitly binds project-specific custom properties to canonical canvas roles. Unmapped properties remain unresolved.

## Importing into Design Surfaces

- **OpenDesign:** Install the emitted folder into OpenDesign Desktop using `od plugin install --source <path-to-open-design-folder>`. See [OpenDesign onboarding](opendesign-onboarding.md).
- **OpenPencil:** Import `390.tokens.json` and `1440.tokens.json` via OpenPencil's `import_design_tokens` MCP tool, then render the accompanying JSX preview nodes. See [OpenPencil onboarding](openpencil-onboarding.md).
- **Penpot:** Use the values in `canvas-kit.json` as a reference when establishing typography and color palettes in Penpot. See [Penpot onboarding](penpot-onboarding.md).

## Running Browser Sampler Tests

To run the full Chromium regression tests for the token sampler on Windows:

```powershell
$env:BASELINE_CANVAS_BROWSER_TESTS = '1'
node --test tests/canvas-kit.test.mjs
Remove-Item Env:BASELINE_CANVAS_BROWSER_TESTS
```

These optional tests compare the sampler's emitted values against a live browser's computed styles for registered custom properties, fluid clamps, and contextual overrides.

## Headless CLI Verification (OpenPencil)

To inspect `.fig` design files without opening the desktop GUI, use the standalone `@open-pencil/cli`:

```powershell
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil info C:/designs/review.fig --json
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil tokens C:/designs/review.fig --format css --json
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil lint C:/designs/review.fig --preset accessibility --json
npm.cmd exec --yes --package=@open-pencil/cli@0.16.0 -- openpencil diff files C:/designs/before.fig C:/designs/after.fig --json
```

Always run headless inspection on a closed copy of the `.fig` file rather than one actively open in the desktop editor. Note that `diff files` exits with code 1 when visual differences are detected.
