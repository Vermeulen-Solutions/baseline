# Phase 6 fluid-token mathematics and diagnostics

This slice hardens the existing agent-first token CLI without changing the stylesheet, lane presets, generated valid scales, components or public runtime. The source is `scripts/design-system.mjs`; the portable mathematical suite is `tests/fluid-tokens.test.mjs`. The [framework contract](../design-framework.md) defines the bounded grammar, reference units, rounding and resize-model limits.

## Verification scope

The suite independently checks five interpolation points, saturation outside the requested range, monotonicity and four-place rounding tolerances. It compares the 1–2rem/320–1440px example from [Utopia](https://utopia.fyi/blog/clamp/) using Baseline's logical `vi` output. Utopia is a reference, not a dependency. Golden hashes were independently computed from the Phase 5 Git source and compared with the current generator for every named type ratio, three valid spacing ratios and the entire authored lane object.

Malformed terms, invalid binary whitespace, non-finite coefficients, invalid or zero-width domains, unsupported container context, descending scales and numeric overflow fail closed. Equal bounds remain valid constants. Legacy `vw` remains supported with an axis advisory. A spacing ratio within the permitted range can still fail for a particular pair of base sizes; this existing ascending-size constraint is retained.

JSON adds a `fluid` object with reference assumptions and per-token samples: actual transition widths in root-relative viewport units, five reference sizes, 16/20/32px root-font scenarios and modeled 200%/400% zoom. Text resize estimates are advisory. The normal audit continues to enforce the existing font-loading, CMS-proxy, token-coverage and 14 semantic contrast checks. Contrast labels now describe WCAG relative luminance ratios; OKLCH coordinates alone certify nothing.

## Reproduction

```sh
npm run design:tokens
npm run design:tokens -- --json
npm run test:design
npm run verify
npm run test:profiles -- --keep
npm run test:visual:functional
```

The last command is local Windows browser verification only. The existing suite uses actual Chromium extension-driven zoom, 320px reflow, text-spacing overrides, keyboard navigation and native composition. It compares existing screenshots without updating references or thresholds. Fresh profile verification independently installs, clean-installs, verifies and builds both generated static foundations, then runs HTTP and fixture/release checks. No CMS dependency is introduced.

Execution results and source hashes are recorded in [`fluid-tokens-phase-6-checks.json`](../../audit/verification/fluid-tokens-phase-6-checks.json).

## Adoption and remaining acceptance

An existing managed CLI can be proposed through bounded synchronization. Newly shared tests/docs and `test:design` script changes need explicit additive adoption; the installed managed inventory does not grow automatically. Follow [baseline updates](../baseline-updates.md), retain calibrated CSS and review any new validation error before altering a client token. No package dependency changes are needed. The generated static design command now includes the portable suite.

Numeric and browser reflow results do not certify text enlargement or assistive technology support. Manual text-only resizing, screen-reader observations, other browser engines/writing modes, physical devices and CMS editor save/reload remain outside this automated slice. The zoom model's shrink estimate is not a rendered font-size measurement or a WCAG verdict. Phase 7 capabilities remain deferred pending an actual requirement; Phase 8 owns final release/adoption rehearsal and the outstanding manual observations.
