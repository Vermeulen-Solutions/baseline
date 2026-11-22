---
bump: minor
platforms: [emdash, static]
areas: [styles]
adoption: manual
visible: yes
database: no
---

# The phone header's two-line clamp applies to a plain text title only

Below 48rem the starter clamps a text site title to two lines. The rule matched every brand link without a logo image and outweighed a site's own brand class, so a brand built from elements (a mark beside the name, the name and a place) was laid out as the clamp's stacked box: in two design sprints the name ran into its divider, or the mark sat above the name.

- The clamp now applies only to a brand link that holds plain text, and it carries the weight of the `.site-brand` class alone, so a site's own brand class can replace it.
- A plain text title and a logo image behave as before.

## For sites

Sites own `src/styles/global.css`: replace the selector of the rule inside `@media not (min-width: 48rem)` that sets `-webkit-line-clamp: 2` with `:where(.site-nav:has(> .site-menu)) > .site-brand:where(:not(:has(> *)))`. Only a site whose brand link contains elements other than a logo image looks different on a phone: its brand keeps the layout the site gave it. Check the header at 390 once, and remove any override the site added to defeat the old rule.
