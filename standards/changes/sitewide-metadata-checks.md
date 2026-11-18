---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, tests/check-quality.test.mjs]
---

# Titles, descriptions and JSON-LD graphs checked across the site

`npm run check:quality` now reports four more kinds of issue:

- **`title`:** missing, or over 60 characters.
- **`description`:** missing, or outside 70 to 160 characters, on indexable routes. Noindex and error pages need only a title.
- **`duplicate-title` / `duplicate-description`:** the same text on more than one indexable route.
- **`json-ld`, three new cases:** an `@id` defined twice, a reference to an `@id` the page never defines, or a rating or review on the site's own organization. Google never shows that last kind and treats it as self-serving.

All three limits can be changed per route in `page-budget.json` (`titleChars`, `descriptionMinChars`, `descriptionMaxChars`).

The content-modeling skill gains field rules: an SEO description on every entry, an optional short title for long names, and summary lengths enforced where editors type.

On Baseline's own demo content it found pages that fall back to the site tagline, all sharing one 17-character description.

## For sites

Copy `scripts/check-quality.mjs` and `tests/check-quality.test.mjs`, run `npm run check:quality`, and give each reported page its own title and description. A page that falls back to the tagline shares it with every other such page.
