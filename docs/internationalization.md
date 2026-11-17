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
- The English team page automatically resolves the English person entry.
- Editors do not need to re-link relationships for every language translation.

---

## 3. Schema & Seed Configuration

### Field Definitions

Fields in a collection schema should simply use `translatable: true` (the default). Invariant fields (such as numeric order, external identifiers, or boolean flags) can set `translatable: false`.

```json
{
  "slug": "news",
  "label": "News",
  "fields": [
    { "slug": "title", "label": "Title", "type": "string", "required": true },
    { "slug": "content", "label": "Content", "type": "portableText" },
    { "slug": "featured_image", "label": "Featured Image", "type": "image" },
    { "slug": "pinned", "label": "Pinned", "type": "boolean", "translatable": false }
  ]
}
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

- **What it provides:**
  - A translation overview dashboard showing coverage percentages and missing translations across all collections.
  - Side-by-side editing views to compare source copy against translations.
  - Integration with automated/AI translation providers (DeepL, OpenAI) to draft translations with a single click.
- **Architecture Compatibility:**
  - LinguaDash is designed specifically **for** EmDash's native row-per-locale architecture.
  - It requires entries to be linked via `translation_group` and cannot function on field-per-language structures (`_en`, `_de`).
- **Recommendation:**
  - The core EmDash CMS provides everything needed for standard multilingual websites without any plugin.
  - Install LinguaDash when editorial teams need translation progress dashboards, automated translation drafting, or side-by-side comparison.
