---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/css-contracts.mjs, scripts/audit-composition.mjs]
---

# `check:css` reports three CSS habits; `audit:composition` reports a mark stranded from its word

Two rules the guidance already held, or should have, had no check behind them.

- **Three CSS habits.** The motion reference forbids `transition: all`, and nothing looked for it. `check:css` now reports it as `transition-all`, with two more of the same kind: `fixed-text-metric` (a `line-height` or `letter-spacing` given as one `px` or `rem` length, which stops following the font size) and `balance-on-paragraph` (`text-wrap: balance` on a `p` selector, where `pretty` is the value meant). They are advisory like the token guardrails, read from the same declarations, and take the same `token-exempt: <reason>` comment. The starter has none of the three.
- **Stranded marks.** French sets a space before `?`, `!`, `:`, `;` and `%` and inside `« »`. When that space is an ordinary one, the browser may break the line there and the mark opens the next line alone. Baseline had no guidance and no check for it. `audit:composition` now reports `text-stranded` at both widths: a mark on the line below the character before the space, or a `«` on the line above its word. A non-breaking space never gives one. The copy checklist in `new-site-workflow/references/copy-voice.md` has the rule.
- The command index now also lists the three opening advisories added in the previous change (`hero-copy`, `hero-actions`, `hero-strip`), which it had missed.

## For sites

Copy the two scripts; the guidance comes with the skill sync. Nothing fails by itself: the new findings are advisory, and fail a run only with `check:css -- --strict-guardrails` or `audit:composition -- --strict`. A site that runs either strict flag in its own pipeline will see them on the next run.

For `text-stranded`, type a non-breaking space (U+00A0, or the narrow U+202F) in copy written in the code. Text an editor types in the CMS or in Markdown needs the ordinary space replaced where it is rendered; Baseline ships no helper for that yet.

## Limits

- `text-stranded` reads inside one text node, so a mark in a node of its own (after an emphasised word, `<em>club</em> ?`) is not seen.
- No Baseline site or trial was measured for stranded marks before the finding was added, so how often it fires on real pages is not known.

## Considered and deferred

- A render-time helper that replaces the ordinary space in editor-typed French text (Portable Text and Markdown). It touches the rich-text renderers on both foundations.
- More patterns of the same kind: `100vw` widths, a `font-weight` with no loaded face, a fixed `height` on a box that holds text.
