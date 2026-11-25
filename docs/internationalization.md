# Internationalization (i18n) Architecture

This guide documents the native multilingual architecture for EmDash CMS and Astro sites, contrasting it with anti-patterns and explaining how to structure collections, seeds, Astro routes, and translation workflows.

---

## 1. Core Principle: Row-Per-Locale

EmDash uses a **row-per-locale** content model. Every translation of an entry is stored as its own record in the database collection table (`ec_{collection}`), linked to its siblings via a shared `translation_group`.

```text
ec_news:
┌──────────────────────┬──────────────────────┬────────┬────────┬───────────────────┐
│ id                   │ slug                 │ locale │ status │ translation_group │
├──────────────────────┼──────────────────────┼────────┼────────┼───────────────────┤
│ 01J9... (French row) │ victoires-du-weekend │ fr     │ publ.  │ 01J9... (Group A) │
│ 01J9... (English row)│ weekend-victories    │ en     │ publ.  │ 01J9... (Group A) │
└──────────────────────┴──────────────────────┴────────┴────────┴───────────────────┘
```

### The Anti-Pattern: Field-Level Language Duplication

Never create duplicate columns for languages on a single entry (e.g. `title_en`, `content_en`, `facilities_en`, or a custom `language` string column).

| Problem | Field-Per-Language (`_en`, `_de`) | Native Row-Per-Locale |
| :--- | :--- | :--- |
| **Form Usability** | With 3+ languages, editing forms become overwhelmingly long, cluttered, and confusing. | Clean, dedicated form per language with EmDash's native locale selector. |
| **Lifecycle & Status** | Cannot publish French while English is still a draft. Both share one status. | Each translation has its own independent `status` (`draft`, `published`, `scheduled`). |
| **URL Slugs** | Slugs cannot be localized (e.g. forced to use a shared slug or hacky query params). | Independent, localized slugs (e.g. `/equipes/dames-lna` and `/en/teams/womens-lna`). |
| **Visual Editing** | EmDash visual editor and preview cannot bind to arbitrary custom language fields. | Fully supported; editors switch languages in the admin bar seamlessly. |
| **Content Queries** | Requires fragile in-memory filtering or template-level conditionals. | Native query filtering: `getEmDashCollection(type, { locale })`. |
| **Relationships** | Cross-collection relationships require manual mapping per language. | Content references store `translation_group`s, linking relationships across all languages automatically. |
| **Extensibility** | Adding a new language requires schema alterations and database migrations. | Adding a new language requires zero schema changes. |

---

## 2. Relationships Across Locales

EmDash's reference table (`_emdash_content_references`) links records using `parent_group` and `child_group`.

When you link a person (e.g., a coach) to a team in the French editor, EmDash records the relationship between their translation groups. As a result:
- The French team page automatically resolves the French person entry.
- The English team page automatically resolves the English person entry, and the French one when no English entry exists, so a person entered only in the default locale still appears on every locale's team page.
- Editors do not need to re-link relationships for every language translation.

---

## 3. Schema & Seed Configuration

### Field Definitions: facts are entered once (required)

Translations need maintenance. A site's maintainers will not keep two languages in step, so anything that can be entered once must be entered once: **only prose is translatable**. Every field that holds a fact sets `translatable: false` when it is created. EmDash then copies it to every translation when the entry is published, and links between entries (`reference` fields) are already shared by the translation group.

| Translatable (prose) | Not translatable (facts) |
| --- | --- |
| Titles that are real text, descriptions, body copy, button labels, alt text written for a reader | Times, days, dates, numbers, prices and fees, phone numbers, email addresses, postal addresses, bank details, website links, photos and files, choice lists, switches, display order, references |

```json
{
  "slug": "news",
  "label": "News",
  "fields": [
    { "slug": "title", "label": "Title", "type": "string", "required": true },
    { "slug": "content", "label": "Content", "type": "portableText" },
    { "slug": "featured_image", "label": "Featured Image", "type": "image", "translatable": false },
    { "slug": "pinned", "label": "Pinned", "type": "boolean", "translatable": false }
  ]
}
```

Decide this when the field is created. EmDash 1.5 refuses to switch an existing field to non-translatable (`FIELD_UPDATE_REQUIRES_MIGRATION`), even when every translation holds the same value; that needs a content migration (a new field, a copy, removing the old one).

**A fact that reads differently per language is still entered once.** Store it in a language-neutral form and let the page write it in its own language: a weekday as one choice whose label the code prints (`Lundi` on French pages, `Monday` on English ones), a time in one notation the code reformats (`19h30` or `19:30`), a period derived from a season field, an amount as a number with the currency added in each locale's order (`600 CHF`, `CHF 600`). Never ask maintainers to type the English form of a fact.

**A collection of facts is entered once, in the default locale.** When a collection translates nothing but its title (people, training sessions, sponsors, venues), create its entries in the default locale only. List pages in other locales show their own entries plus every default-locale entry without a twin, and single-entry lookups already follow the fallback chain:

```ts
export async function withDefaultLocaleFallback(name: string, locale: string, options = {}) {
  const own = await getEmDashCollection(name, { ...options, locale });
  if (locale === DEFAULT_LOCALE) return own.entries;
  const fallback = await getEmDashCollection(name, { ...options, locale: DEFAULT_LOCALE });
  const group = (entry) => entry.data.translationGroup || entry.data.id;
  const present = new Set(own.entries.map(group));
  return [...own.entries, ...fallback.entries.filter((entry) => !present.has(group(entry)))];
}
```

Apply the same rule to taxonomy terms: on another locale, list a term that has no translation with its default-locale label rather than leaving the entries that use it out. And to a photo chosen per page slot: show the default locale's photo, keeping a translation's own alt text only while it still holds that same photo.

**On a site already built with translated facts**, do not ask maintainers to keep both copies: read the fact from the default locale in code (as above), check that every page reads the same before and after, then move the other locales' copies to the trash.

`npm run check:i18n-facts` enforces this on a multilingual site and is part of `verify` and `verify:fast`. It reads the field definitions from the local database (`--db <file>`; for a Workers site, the `data.db` that `db:local-copy` writes) and fails on each translatable field whose type holds a fact (number, date, switch, image, file, reference, choice list, link, email) or whose name says it does (time, day, phone, address, IBAN, price, fee, order…). It also advises which collections translate only their title. A deliberate exception, such as a link whose target differs per language or a per-locale form submission store, goes in `audit/i18n-facts-exceptions.json` with its reason:

```json
{ "editorial_sections.destination": "each language links to its own path" }
```

### Seed File (`seed/seed.json`)

When providing initial or migrated content in `seed.json`, define each translation as a separate entry in the collection's array. Link translations to the primary entry using `translationOf`:

```json
{
  "content": {
    "pages": [
      {
        "id": "page-about-fr",
        "slug": "a-propos",
        "locale": "fr",
        "status": "published",
        "data": {
          "title": "À propos",
          "content": [...]
        }
      },
      {
        "id": "page-about-en",
        "slug": "about-us",
        "locale": "en",
        "translationOf": "page-about-fr",
        "status": "published",
        "data": {
          "title": "About Us",
          "content": [...]
        }
      }
    ]
  }
}
```

---

## 4. Astro Configuration (`astro.config.mjs`)

Configure Astro's built-in i18n routing:

```javascript
export default defineConfig({
  // ...
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

> [!IMPORTANT]
> Always set `prefixDefaultLocale: false`. If the default locale is prefixed (e.g. `/fr/`), the EmDash Admin UI (`/_emdash/admin`) and internal API endpoints can be incorrectly rewritten or blocked by Astro routing.

---

## 5. Querying and Rendering in Astro

### Querying by Locale

Pass `{ locale: Astro.currentLocale }` to EmDash query functions:

```astro
---
import { getEmDashCollection, getEmDashEntry } from "emdash";

// Query all published news for the current locale
const { entries: articles } = await getEmDashCollection("news", {
  locale: Astro.currentLocale,
  status: "published",
  orderBy: { published_at: "desc" },
});

// Query a specific entry by slug and locale
const slug = Astro.params.slug;
const { entry: page } = await getEmDashEntry("pages", slug, {
  locale: Astro.currentLocale,
});
---
```

### Values written per locale

Each translation is its own row, so a value kept as text is written the way that locale writes it. On a launched club site the French training sessions read `19h30 – 21h30` and the English ones `19:30 – 21:30`; a time parser that read only the `h` form dropped every English session, and the English home page and team pages showed no training times while the French ones were complete. The English schedules page, which printed the text unparsed, hid the fault.

- **Parse every form the locales use**, or store the value in a typed field (a time, a number, a date) instead of text.
- **Print the value in the page's locale** (`19h30` on French pages, `19:30` on English ones), not in the default locale's form.
- **Test against each locale's real rows.** A rehearsal copy or local database can hold older translations than production: check the deployed or preview version on every locale before calling it done.

### Resolving Alternate Language URLs (Language Switcher)

To provide an accurate language toggle link for the current page:

```astro
---
import { getTranslations } from "emdash";

// entry.data.id is the database ULID
const { translations } = await getTranslations("pages", page.data.id);

// translations returns [{ id, locale, slug, status }, ...]
const englishTranslation = translations.find(t => t.locale === "en" && t.status === "published");
const englishHref = englishTranslation ? `/en/${englishTranslation.slug}` : "/en/";
---

<a href={englishHref} hreflang="en">English</a>
```

When you merge locales yourself (for example a helper that queries every locale and de-duplicates the entries), key them by locale and slug, never by slug alone: a French and an English entry often share a slug, such as a place name (`/le-lieu/parc-central/` and `/en/the-venue/parc-central/`), and de-duplicating by slug silently drops one of them from listings and sitemaps.

### Search-facing URLs when locale paths differ

EmDash builds two search-facing outputs from each collection's single `urlPattern` plus Astro's locale prefix: the generated `/sitemap.xml` and `/sitemap-{collection}.xml`, and the hreflang links `<EmDashHead>` adds for an entry passed as page `content`. That is correct when the English route is the French route with `/en` in front. It is wrong as soon as the localized slugs or section names in section 1 differ (`/actualites/{slug}` and `/en/news/{slug}`), or when a collection has no pattern (EmDash then uses `/{collection}/{slug}`). The result is a sitemap and hreflang links that point at addresses the site does not serve, or at CMS-only routes that duplicate real ones, while the language switcher looks right.

Resolve every search-facing URL through the same route knowledge as the language switcher:

1. **Sitemap.** Create `src/pages/sitemap.xml.ts`; EmDash does not inject its own route when the site defines one. Also create `src/pages/sitemap-[collection].xml.ts` that permanently redirects to `/sitemap.xml`, so the generated per-collection files disappear. List each public route once, with `<xhtml:link>` alternates only for real translations (`generateSitemapXml` in `src/lib/sitemap.ts` writes the XML). Query each locale separately, and leave out records whose route only redirects.
2. **hreflang.** Plugin `page:metadata` contributions win over EmDash's own for the same `hreflang` value. A small native plugin can return `fr`, `en` and `x-default` links for every public page from the same resolver the switcher uses; then the layout writes no hreflang tags of its own. Keep passing `content` to the page context, because that is how the SEO panel's description, canonical and noindex reach the page.
3. **One address per page.** A catch-all route that also resolves entries by bare slug serves copies of real pages (`/accueil` beside `/`, `/en/juniors` beside `/en/teams/juniors/`). Redirect such requests permanently (301) to the entry's real route, and name one form of each address in the canonical, the way `defaultCanonicalUrl` does.

After each deploy, `npm run check:live -- --origin <url>` reports sitemap URLs that redirect, pages whose canonical is not themselves, repeated hreflang values, and head hreflang that differs from the sitemap. Add `--strict-seo` to fail on any of them. Compare against production data, not only a local copy: slugs can differ between the two (for example English records that kept their French slugs), and only the live check sees what search engines see.

---

## 6. Translation Workflow & `@swiss.ky/linguadash`

### Native EmDash Editor Workflow

EmDash provides built-in translation management in the Admin UI:
- When viewing an entry, the locale dropdown in the top bar allows editors to switch to another language.
- If a translation does not exist yet, editors click **"Add translation"**, which initializes a new draft linked to the current translation group.
- Fields marked `translatable: false` automatically copy values from the source translation.

### Evaluating LinguaDash (`@swiss.ky/linguadash`)

[LinguaDash](https://plugins.emdashcms.com/plugins/@swiss.ky/linguadash) is an optional official registry plugin that enhances the EmDash admin for multilingual publishing teams:

- **What it provides** (v0.2.2, read on the registry and its README in November 2026):
  - A status per entry and language (missing, draft, done, outdated), set automatically; "outdated" when the source's translatable fields change after the translation was made.
  - A Translations admin page with missing, outdated and to-review lists (its missing-language scan covers the first 100 entries per collection).
  - A **Translate** button that drafts a translation with a provider on the site owner's own account (DeepL, Google Cloud Translation, Azure Translator, OpenAI, or Cloudflare AI Gateway). Drafts only, made on request; it never overwrites a published translation and does nothing on save.
  - Its docs mention content entries only: not taxonomy terms, and not reference fields.
- **Architecture Compatibility:**
  - LinguaDash is designed specifically **for** EmDash's native row-per-locale architecture and needs a plugin sandbox runner.
  - It requires entries to be linked via `translation_group` and cannot function on field-per-language structures (`_en`, `_de`).
- **Recommendation:**
  - The core EmDash CMS provides everything needed for standard multilingual websites without any plugin.
  - It translates prose; it does not remove the need to enter facts once (above). Install it when editors maintain translated prose (news, pages) and want drafts and the "outdated" signal when the source changes, with a fluent reader reviewing each draft before it is published.
