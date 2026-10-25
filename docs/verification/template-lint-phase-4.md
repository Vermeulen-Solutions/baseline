# Phase 4: Astro accessibility template gate

`npm run verify` now runs two lint gates: `lint:scripts` retains the JavaScript syntax checker, and `lint:templates` runs ESLint with zero tolerated warnings. Root template lint covers `src` and `profiles/static/project/src`. Generated static and Sveltia projects use `eslint src --max-warnings 0` and the same portable configuration and regression tests. EmDash dependencies are unnecessary there.

## Toolchain and compatibility

The development dependencies are pinned to ESLint 10.13.0, eslint-plugin-astro 3.2.1, eslint-plugin-jsx-a11y-x 0.2.0 and @typescript-eslint/parser 8.71.2. Astro's recommended and strict accessibility presets are composed in `eslint.config.mjs`; typed frontmatter uses the TypeScript parser. Type checking remains an independent `astro check` gate. JSX accessibility checks apply to Astro templates here, not a promise of lint coverage for React, Markdown, CSS or every JavaScript module.

The [Astro plugin requirements](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/) raise the development floor to `^22.22.3 || ^24.16.0 || >=26.3.0`. The package engine, generated projects and current CI configuration follow that floor; CI uses 24.16.0. ESLint 9 reached [end of life](https://eslint.org/version-support/) on 2026-08-06. The parser's [supported dependency ranges](https://typescript-eslint.io/users/dependency-versions/) include ESLint 10 and the installed TypeScript 6.0.3.

`standards/manifest.json` remains the historical scoped certification snapshot. This tooling change does not retroactively certify a new Node/runtime matrix or claim the new lint tool works on the snapshot's older minimum patch versions. The execution receipt records the exact versions actually exercised.

## Source decisions

Only `ResponsiveImage` is mapped to a native `img` in the active plugin's `jsx-a11y-x` settings. Its implementation is a known image presentation primitive. No polymorphic layout or arbitrary CMS section receives an invented native role. Existing image alternatives forwarded through spreads are now explicit props, preserving their values while making the contract visible to static analysis.

Five source-line suppressions preserve intentional behavior:

- `FormError.astro`: optional native summary autofocus, off by default.
- `FormRecoveryFixture.astro`: opts into that policy only after failed validation.
- `LogoTicker.astro`: two explicit list roles; the duplicate stays inert and hidden.
- `components/dev/Styleguide.astro`: an explicit list role on palette swatches.

The list roles retain [Safari list semantics after `list-style: none`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/list-style#accessibility). Each exception names one rule and one following line, with a reason. Astro JSX comments (`{/* eslint-disable-next-line ... */}`) are required; HTML comments do not suppress these diagnostics. Unused directives fail lint, and a regression test proves an exception does not silence the next control. The native autofocus policy retains Phase 3's tested keyboard recovery behavior; manual AT review remains open.

Exact art-direction exception hashes cover these infrastructure edits. No token, client theme, image description, rendered interaction policy or content schema was changed. The lint dependencies execute during development and add no browser code.

## Verification and boundaries

The ten portable tests use the real project configuration and virtual Astro input. They reject missing image alternatives (native and mapped component), invalid ARIA values, click-only interaction, labels lacking a control, placeholder links, positive tabindex and unreviewed autofocus. A valid typed, slotted native disclosure passes. Line exceptions are tested for scope and obsolescence.

An additional CLI mutation rehearsal creates a missing-alt template separately in each root lint target, requires exit 1 with `astro/jsx-a11y/alt-text`, removes it in `finally`, then requires a clean exit. No mutation fixture remains in source. Independent profile verification exercises fresh installs, clean installs, all ten lint tests, full verify, production/fixture builds and HTTP acceptance.

This is source analysis, not WCAG certification. The upstream strict preset does not detect a bare unlabeled input by itself, and cannot prove computed alternatives are useful, label references resolve, slot output is correct, focus restores, or screen-reader announcements work. Phase 3 rendered journeys remain necessary. No browser was installed or launched for this lint slice, and CI retains its browser-free policy. No screenshot goldens were updated.

## Existing-site adoption

New profile generation includes the four development dependencies, configuration, scripts and portable tests through explicit manifests and inventories. Existing sites need an additive tooling upgrade; `sync:baseline` does not expand an installed site's bounded inventory or rewrite `package.json` and its lockfile.

1. Upgrade local and CI Node to the declared floor and use a working branch.
2. Install the four exact development versions above with npm; review the lockfile.
3. Add the reviewed `eslint.config.mjs` and `tests/template-lint.test.mjs`. Preserve existing client component mappings only where their native output is known.
4. Rename the old syntax script to `lint:scripts`, add `lint:templates`, and make `lint` run both. Use `eslint src --max-warnings 0` in an installed site; only the Baseline source repository has the additional static-overlay source target.
5. Fix genuine diagnostics and review any per-line exceptions individually. Do not copy starter art-gate exemptions onto client-authored components.
6. Run `npm run verify` and the site's build. Run affected rendered journeys if resolving a diagnostic changes output or behavior. Commit the tooling, source decisions, lockfile and applicable inventory evidence together after verification.

Do not hand-edit a managed receipt to make a new config appear synchronized. Adopt new managed membership through a reviewed generator migration, or record the new tooling as a separately adopted local file. Locally calibrated CSS remains owned by the site.

See the [execution receipt](../../audit/verification/template-lint-phase-4-checks.json) in the full Baseline repository for results, hashes and retained generated projects.
