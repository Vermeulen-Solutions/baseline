---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# A label above a heading and an accented phrase are allowed when earned

The composition audit failed a sourced direction for three or more small labels above section headings, and for one italic word in the page heading, whatever they said. The owner's preferred references use both, and use them well. The two findings now report only the unearned use.

- **`kicker-openings`** counts the labels that only name their section. A label that carries a fact the visitor needs (a date, an hour, a price, a count, a distance) is earned and not counted. The audit reads a figure or a currency in the label, after setting aside a bare index at its start (`01 //`, `[02]`, `03 ·`): a bare number is not a fact. Three or more unearned labels are the finding, as before.
- **`accent-word`** reports a word or phrase in italics in some headings and not others. It is earned once, in the page heading, or as the direction's way of setting every heading (four in five or more), which the Art Direction Record names.
- The skills say the same: `site-art-direction` (the accent, the lanes, world building), `astro-site-design` (the typography roles and the list of generated-page marks) and the craft-floor exceptions in `impeccable-passes.md`.

Checked on three public pages that use both devices throughout and on two trial sites: an italic word carried through every heading is no longer reported; labels that only name their section still are (six to nine a page); the trial sites are unchanged.

## For sites

Copy `scripts/audit-composition.mjs` and the skills. A site that removed fact-bearing labels or its page heading's accent to pass the audit may put them back.
