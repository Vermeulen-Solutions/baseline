---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, scripts/copy-tells.mjs, tests/check-quality.test.mjs, tests/copy-tells.test.mjs]
---

# Copy voice and the tells of model copy

Trial sites built from a plain brief had decent French copy that still fell into the habits every model writes now: a heading in two fragments (« Un arbre tombe. Il reste. »), a pair of counts (« Un tronc, onze mois »), and the same warm, modest voice for every client. Baseline's copy guidance covered the brief, claims and microcopy, but not voice or these tells, and Impeccable has no copy guidance either.

- New `new-site-workflow/references/copy-voice.md`: the fact sheet that replaces invented detail, one register per client chosen from five, shaping a page from the visitor's questions, a device budget per page, the tells in English and French (words and stock lines that stand in for a fact, residue, the second-generation habits that look like good copy), the over-correction each rule breeds, and the checks before handoff (a rival's name in each heading, headings of all pages side by side, read aloud as the owner, a fresh reader). `copywriting.md` and the workflow route to it.
- `check:quality` reports `copy-tell` on pages whose `lang` is English or French: each word or stock line that stands in for a fact, template residue and a stale copyright year on their own; two-fragment headings, pairs of counts, contrast frames, negation runs, virtue words, em dashes and exclamation marks only when used often enough on one page to be a habit. Quotations and `[data-copy-ignore]` are skipped as before; the budget's new `copyAllow` lists words the trade uses literally, and `"copyTells": false` turns the check off.

On the trial site's five pages it reports nothing: its copy uses each device once or twice, under the habit line.

## For sites

Copy `scripts/check-quality.mjs`, `scripts/copy-tells.mjs` and their tests (`site:files --files scripts/check-quality.mjs,scripts/copy-tells.mjs,tests/check-quality.test.mjs,tests/copy-tells.test.mjs --apply`), run `check:quality` against a local build, and fix each `copy-tell` or add the word to `copyAllow` with the reason in the brief. The guide arrives with the usual skill sync.
