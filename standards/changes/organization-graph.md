---
bump: minor
platforms: [emdash]
areas: [components, skills, docs]
adoption: copy
visible: no
database: no
files: [src/lib/structured-data.ts, src/plugins/baseline-metadata/index.ts]
---

# A fuller Organization graph: social profiles and business facts

The homepage Organization graph gains two sources:

- **`sameAs`** from EmDash's social settings. Usernames become profile URLs for X, GitHub, Facebook, Instagram and YouTube; LinkedIn counts only as a full URL.
- **Site-owned business facts** in the baseline-metadata plugin's `options.organization`:
  - a specific schema.org type or list of types (`ProfessionalService`, `LocalBusiness`, `Dentist`…);
  - telephone, email, a postal address and places served;
  - extra profiles such as the Google Business Profile;
  - a price range.

Values are validated: invalid types fall back to `Organization`, non-http URLs are dropped, empty fields left out. No rating is ever added.

## For sites

1. Take `src/lib/structured-data.ts` and `src/plugins/baseline-metadata/index.ts`.
2. Add the business's facts under `options.organization` in `astro.config.mjs`, matching its public listings word for word.
3. Fill the social usernames in EmDash settings.
