---
bump: minor
platforms: [emdash, static]
areas: [components, docs]
adoption: copy
visible: no
database: no
files: [src/lib/opening-hours.ts, src/components/Hours.astro, src/lib/structured-data.ts]
---

# Opening hours, on the page and in structured data from one list

`src/lib/opening-hours.ts` validates a list of opening hours (days, and times on the 24-hour clock). Invalid entries are dropped, never guessed. The list feeds two places:

- **The Organization graph:** as `openingHoursSpecification`, from the baseline-metadata plugin's `options.organization.openingHours` on EmDash sites.
- **`Hours.astro`:** as a table with one row per weekday, day names and times in the page locale, closed days labelled and split days listed.

## For sites

Copy `src/lib/opening-hours.ts` and `src/components/Hours.astro` (and the updated `src/lib/structured-data.ts` on EmDash sites). Keep the hours in one module and pass that list to both the metadata options and `Hours`.
