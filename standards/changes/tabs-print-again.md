---
bump: patch
platforms: [emdash, static]
areas: [styles]
adoption: copy
visible: no
database: no
files: [src/styles/global.css]
---

# Inactive tab panels print again

The rule that makes `hidden` always hide outranked the print rule that shows every tab panel inside `[data-print-content]`, so a printed page showed only the open tab. The print rule now matches it in specificity and follows it. Found by the visual suite while certifying 0.8.0.

## For sites

A site that took "The `hidden` attribute always hides" and prints tabs copies the print rule from Baseline's `src/styles/global.css` (`[data-print-content] :is([role="tabpanel"], .tabs__panel)`). Nothing changes on screen.
