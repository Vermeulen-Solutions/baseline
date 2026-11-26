---
bump: minor
platforms: [emdash]
areas: [tooling, docs, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-i18n-facts.mjs]
---

# Multilingual sites enter facts once: only prose is translatable (`check:i18n-facts`)

Translations need maintenance, and a site's maintainers do not keep two languages in step. On a real two-language club site every training session, staff member and sponsor was kept twice, and the copies drifted (wrong venues, an outdated coach, times written two ways). The guidance said fields "should simply use `translatable: true`". It now requires the opposite for facts:

- Every field that holds a fact (times, days, dates, numbers, prices, phones, emails, addresses, bank details, links, photos, files, choice lists, switches, order) is created non-translatable.
- A fact that reads differently per language is stored once and written per locale by the code.
- A collection that translates only its title is entered once, in the default locale, with other locales listing it as a fallback; taxonomy terms and slot photos fall back the same way.
- EmDash 1.5 refuses to switch an existing field (`FIELD_UPDATE_REQUIRES_MIGRATION`), so existing sites read the fact from the default locale in code and trash the copies.

`npm run check:i18n-facts` reads the field definitions from the local database. It fails on each translatable field that holds a fact, by type or name, unless `audit/i18n-facts-exceptions.json` gives a reason. It also names collections that translate only their title. Single-language sites, and checkouts without a local database, pass with a note. It is part of `verify` and `verify:fast` on the EmDash profile; the static profiles keep their own `verify` without it.

`docs/internationalization.md` and `emdash-content-modeling` carry the rule; the LinguaDash section is corrected (no side-by-side editing, more providers, translations only on request, content entries only) and positioned for prose.

## For sites

Copy `scripts/check-i18n-facts.mjs`, add `"check:i18n-facts": "node scripts/check-i18n-facts.mjs"` and put `npm run check:i18n-facts` into `verify` and `verify:fast` after `check:art-direction` (by hand: the site owns `package.json`). On a multilingual site, run it (for a Workers site with `--db` on a `db:local-copy` data.db). Fix each finding by reading the fact from the default locale in code, or record a reason in `audit/i18n-facts-exceptions.json`. The skill sync delivers the content-modeling rule.
