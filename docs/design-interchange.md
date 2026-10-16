# Optional DESIGN.md bridge

Decision: adopt a curated one-way documentation/export path, using lockfile-pinned `@google/design.md@0.4.0` and its Windows-compatible `designmd` alias. The alpha specification is pinned to [9bf8eae](https://github.com/google-labs-code/design.md/blob/9bf8eae67128b6cc55ad9bf86665767deb4c11cd/docs/spec.md). The neutral example lives under `audit/visual-concepts/neutral-interchange/`; this starter intentionally has no client DESIGN.md or fabricated Art Direction Record.

AGENTS.md owns project policy and the direction decision. `src/styles/global.css` and component styles own shipped values/behavior. DESIGN.md explains intent and maps the implemented system for external tools. Its frontmatter is normative within that document. A proposal becomes effective through reviewed source changes and reconciliation with the saved direction record. Resolve discrepancies explicitly; preserve authored rationale when merging an existing document. The art-direction gate is unchanged.

Run `npm run design:check -- --file audit/visual-concepts/neutral-interchange/DESIGN.md --mapping audit/visual-concepts/neutral-interchange/mapping.json`. A bare check skips an absent root DESIGN.md. No production runtime imports this tooling. `npm run design:export -- --file <file> --format css-vars` lints before producing stdout; it writes no source files. Review output in a separate artifact and merge deliberately. Never redirect it over global.css or an authored DESIGN.md.

| Source / case | Supported representation | Observed limitation in 0.4.0 |
| --- | --- | --- |
| `--color-action` OKLCH | `colors.primary` accepts the original expression | css-vars converts it to sRGB hex; original syntax/gamut intent is lost |
| Semantic alias | `{colors.primary}` | Export duplicates the resolved color; it does not preserve the dependency |
| `--text-step-0`, grid/content spacing | Preserve verbatim in mapping.json and prose | `clamp/calc/vi` is not a valid alpha Dimension; do not sample a viewport or substitute a fixed size |
| Body font stack and weight 400 | `typography.body.fontFamily/fontWeight` | Lint accepts a partial role; css-vars output omits typography when fontSize is absent |
| `--radius-control` | `rounded.control` | Namespace differs from production `--radius-*`; raw export is not a drop-in replacement |
| Focus/surface aliases | Contextual behavior retained in source and sidecar | `data-surface=dark` changes focus ink; no complete dark theme can be inferred |
| Motion/shadows/conditional styles | Linked source/prose | No claim of lossless translation or automatic bidirectional updates |

The pinned linter also silently drops an unresolved color alias. The starter wrapper adds an explicit reference-resolution check; malformed typography and fluid dimensions already produce linter errors. Tests cover valid input, those negative cases and mapped-source drift. Successful export alone is not lint success or round-trip fidelity. See `audit/phase-2/design-export.css` and the mapping sidecar for actual observations.

The account-free concept workflow is: collect real content shapes/assets/provenance → draft an isolated concept under audit/visual-concepts → inspect desktop/mobile composition using the existing dev styleguide or a local prototype → select the direction → reconcile AGENTS/DESIGN/source → implement through specialist skills. The example uses the authored grid SVG and existing public component shapes; Phase 1 wide/mobile captures provide its local reference surface. Generated markup remains evidence and still needs EmDash field ownership, native images, accessibility and runtime checks.

Stitch and OpenDesign are optional external experiments. No callable connector was available for an exchange in this session; both remain explicitly unverified and deferred. Review their current access/version/license and record imported/exported artifacts and token losses before claiming compatibility. Neither is a build dependency or required account.
