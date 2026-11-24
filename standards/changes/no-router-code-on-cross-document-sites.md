---
bump: minor
platforms: [emdash, static]
areas: [components, delivery]
adoption: manual
visible: no
database: no
---

# Cross-document sites no longer ship the client-router script

`SiteShell` wrote about 30 KB of inline client-router script (navigation warming, card morphs, direction, scroll and focus under `<ClientRouter />`) into every page, and every page imported Astro's swap helpers (about 12 KB more). A site with `pageTransitions="cross-document"`, which is the starter default, cannot have a client router, so none of it ran. On the starter's built home page the HTML falls from 48 KB to 17 KB (11.4 KB to 5.2 KB compressed) and the shell's module from 15.7 KB to 3.4 KB.

- The router script is written only when `pageTransitions` is not `cross-document`. A site that adds `<ClientRouter />` already sets `pageTransitions="none"`, as the shell's own comment and the impression-tier recipe say, and keeps everything it had.
- Astro's swap helpers are loaded on demand, only on a page that has `<ClientRouter />`; the router script falls back to its own helpers until they arrive.
- The theme, sticky header, reveal and filter code every page needs is unchanged.

## For sites

`SiteShell.astro` is Baseline-owned: take it whole when the site has not changed it, otherwise move the router block behind `routerSupport` by hand and make the swap-helper import dynamic. Check one page with `<ClientRouter />` if the site has any: open a page, follow a link and press Back.
