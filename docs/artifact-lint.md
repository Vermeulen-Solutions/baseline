# HTML artifact preflight

`npm run design:artifact-check -- <file.html|directory>` checks an HTML concept or export without OpenDesign, a daemon, browser or network access. With no input it recursively checks `audit/visual-concepts`; select the current concept explicitly so historical drafts do not become release failures. It never changes artifacts or executes their scripts. The command is opt-in and is not part of verify, build or CI archive scanning.

```sh
npm run design:artifact-check -- audit/visual-concepts/current/index.html --json
npm run design:artifact-check -- exported-html/ --fail-on p2 --agent-message
npm run design:artifact-check -- concept.html --opendesign
```

Use `-` as the sole input for stdin. Directories include `.html` and `.htm` recursively, omit `.html.tpl` sources and reject symlinks. Multiple inputs are deduplicated. Exit 0 means no findings at the selected threshold, 1 means findings at/above it, and 2 means an input/parse error. `--fail-on p0|p1|p2|none` defaults to `p1`. JSON includes counts, per-file findings (stable ID, severity, source line, bounded snippet, message and fix), an actionable `agentMessage`, and explicit source-only coverage. `--agent-message` also prints that message in text mode.

## Adapted rules

The rules were reviewed against the lint implementation bundled with OpenDesign Desktop 0.27.0. Baseline uses its own HTML/CSS parsing and project vocabulary. This is a selected adaptation, not full OpenDesign policy parity or design approval. Provenance and comparison fixtures are recorded in `audit/artifact-lint-adaptation-2026-11-07.json` in the Baseline source repository.

| Rule | Level | Baseline interpretation |
| --- | --- | --- |
| `filler-copy` | P1 | Replace representative-page filler before direction review. HTML comments, scripts, CSS strings, templates, code/pre and explicitly hidden content are excluded; copy hidden only by CSS can still be reported. |
| `invented-metric` | P2 | A bounded set of quantified marketing phrases requires evidence. A match cannot prove fabrication or validate other claims. |
| `external-image` | P2 | Stock/placeholder hosts in image src/srcset require source, rights and durability review. Approved Unsplash imagery is allowed; prepare a durable copy using the media workflow. |
| `all-caps-no-tracking` | P2 | Same-block uppercase tracking below 0.06em or unresolved tracking needs rendered review. Unconditional root defaults, @theme tokens, simple var aliases/fallbacks and same-block px/font-size pairs are recognized. Separate cascade/inheritance, themed overrides, rem/computed sizes and external CSS remain unmeasured; a source warning does not establish cramped text. |
| `raw-hex` | P2 | More than twelve hex occurrences across non-token embedded/inline declarations suggests role drift. Custom-property declarations, quoted strings and URL fragments are excluded. Existing token checks remain authoritative for production CSS. |
| `accent-overuse` | P2 | More than six inline blocks using `--color-action` or legacy `--accent` calls for a hierarchy review. Source count cannot establish visible uses per screen. |
| `missing-section-anchor` | P2, opt-in | `--opendesign` checks section comment anchors for the selected OpenDesign surface. Ordinary HTML/Astro does not require `data-od-id`. |

No P0 rule is adopted: this source pass cannot infer an emergency defect or invalidate an approved art direction. Review P2 findings with the brief, sources and actual render; `--fail-on p2` is available for a deliberately stricter review. A labelled intentional specimen may legitimately contain filler; record that exception in the existing review notes rather than changing production content to satisfy a heuristic.

## Rules deliberately left out

OpenDesign's `purple-gradient`, `trust-gradient`, `ai-default-indigo`, `emoji-icon`, `left-accent-card` and `sans-display` encode aesthetic seed choices. Baseline follows the accepted Art Direction Record, semantic tokens and rendered critique instead of banning an approved palette, sans display face, icon language or callout treatment. `scroll-into-view` is an embedding constraint, not a general website ban. `slide-theme-missing` and `slide-rhythm` belong to slide seeds rather than public-page contracts. Keep OpenDesign-specific checks available when those surfaces need them; no app skill or CLI/export capability is removed by this adaptation.

The installed source-only `od lint` function does not measure contrast or clipping. The separate `funnel-label-clipped` finding belongs to diagram rendering. Do not claim those capabilities from its output or this preflight. Load and inspect the concept at 390/768/1440, check computed fonts/themes, keyboard/focus and motion, and use the installed browser evidence tools for geometry and composed contrast. `audit:ui`, when available, checks route overflow, edges and focus; it does not certify text contrast. External stylesheets/assets and script-generated content are not inspected here. Use native token checks, HTML integrity and browser/runtime acceptance for the Astro implementation.

## Workflow and adoption

For HTML/browser concepts, run this preflight after each edit batch and before presenting the current comparison; resolve P1 findings and review P2 evidence. Use `design:prompt-check` earlier for an external prompt. Neither tool selects the direction or replaces the art-direction gate, real proof, native calibration or rendered acceptance. For a selected OpenDesign project use `--opendesign`; its native `od lint` remains optional for app/seed-specific diagnostics.

Fresh profiles include the checker, tests, this guide and the npm command using already-shipped `parse5` and `postcss` development dependencies. Older sites adopt these exact files, dependencies if absent, and the package script as a reviewed additive change; run their own lockfile update and verification. Bounded `sync:baseline` does not add missing files, dependencies, commands or managed membership. Carry this guide with the updated design-iteration skill reference, and preserve client artifacts and calibrated tokens.
