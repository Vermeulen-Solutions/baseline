# Baseline JSX and token specimen

Read the bundled upstream [authoring reference](upstream/references/design-authoring.md) first. This neutral, synthetic specimen demonstrates native scene layout, real component properties, states and source-expression metadata. It does not initialize a client theme. Adapt its copy, fonts and colors to the installed site and brief before real design work.

## Import the derived tokens, then render

Inspect the installed schemas. On the tested `0.16.0` surface, call `import_design_tokens` with `files: [{ path: "baseline-review/mobile.tokens.json", text: "<the JSON file contents>" }]`, `styles: false` and the confirmed document/page target. Use [review-tokens.json](../assets/review-tokens.json) as that JSON. The import updates same-name values in matching collections; use a scratch document or a deliberately owned collection, not an unchecked import over user variables.

Then call `render` with `jsx` containing [review-specimen.jsx](../assets/review-specimen.jsx), plus the current target. This is scene JSX, not HTML or React. The example uses a single expression compatible with `0.16.0`. Variable declarations are imported first; `designVar()` references them and does not create them. The named component and instance intentionally both appear for calibration; a production concept would keep its masters on an owned component sheet.

The color samples are illustrative sRGB, not conversions of the site's OKLCH theme. Fonts Arial/Georgia/Consolas are explicit canvas samples for sans/accent/mono, not permission to replace site fonts. Run `get_font_status` after rendering and document actual substitutions. Sample the installed theme and fonts before judging client fidelity.

## Source expressions and viewport samples

`--spacing-container: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)` samples about `17.16693px` at 390 CSS px and `32px` at 1440 CSS px with a 16px root in horizontal writing. `--spacing-content: clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` samples about `16.58267px` at 390px and `24px` at 1440px. These expressions come from the neutral starter; accepted site calibration wins.

The example's DTCG `$extensions["dev.openpencil"]` stores `codeSyntax.WEB`, `unit` and `expression`. `design_to_tokens` can read back CSS/DTCG metadata without arbitrary `eval`. Verify the export, then verify it again after `.fig` save/reopen; retain the source JSON/CSS in the handoff if the installed roundtrip loses metadata. The expression is provenance for a sampled canvas number, not a browser responsive-layout engine. Importing updated samples changes the design; use explicit owned modes/boards and verify geometry after a mode change.

## Map to native Astro, preserving ownership

The outer frame represents the shell's single horizontal gutter, not an extra panel padding copied around every Section. `Section` owns section padding; `Container` owns content stack gap; `Grid`/`.bento-grid` owns collection layout; `Card` owns its internal padding. Panel padding is internal to its surface. Never pay the page gutter twice. Use `Section labelledBy`, `Container width="content|wide|reading"` and real `Card` props/slots; map `Title` to content and `ShowMetadata` to conditional metadata, preserving EmDash edit proxies where applicable.

Retain the shared five-point rubric: base/surface/elevated or glass; display/body/accent/mono with `.eyebrow-telemetry` and `.tabular-nums`; meaningful desktop rhythm such as `7/5` `.bento-grid` with source-order mobile stacking; `.btn`, `.btn--secondary`, `.btn--ghost` and `.icon-nudge`; browser-verified reveal/sticky/transition/reduced-motion behavior. This compact vertical calibration frame intentionally does not demonstrate desktop asymmetry or runtime motion. Add the representative 1440px composition and native Astro proof rather than claiming this one frame satisfies route acceptance.

## Exercise before trusting the recipe

Follow [scoped-review.md](scoped-review.md): render a real instance with a long Title and `ShowMetadata={false}`, compare it against a before specimen, inspect lower-panel geometry, run scoped lint, and inspect the export. Exercise the Default/Disabled component variants. Save/reopen and check native properties, state identity and metadata. If a property setter is absent, a bounded `render` replacement of the owned instance can set native properties; inspect the new ID and retained component linkage. Do not enable arbitrary scripting to bypass missing tools.
