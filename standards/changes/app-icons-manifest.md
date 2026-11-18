---
bump: minor
platforms: [emdash, static]
areas: [components, tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/generate-icons.mjs, tests/generate-icons.test.mjs, src/lib/web-manifest.ts, src/pages/site.webmanifest.ts, src/layouts/Base.astro, public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png]
---

# App icons and a web manifest

Sites shipped only `favicon.svg`, so an iPhone bookmark on the home screen showed a screenshot of the page, and Android had no icon or name to use.

- **`npm run icons`** (`scripts/generate-icons.mjs`, using sharp) turns the favicon into four PNGs: `apple-touch-icon.png` and `icon-maskable-512.png` on a ground colour, `icon-192.png` and `icon-512.png` transparent.
- **`/site.webmanifest`** names the site from its title (EmDash settings, or the static site config) and lists the icons with `display: browser`.
- **Both Base layouts** link the touch icon and the manifest.
- **`check:quality` and `parity:html`** now also reach static sites as npm scripts; their files already shipped, but the scripts were missing.

## For sites

1. Copy `scripts/generate-icons.mjs`, `tests/generate-icons.test.mjs` and `src/lib/web-manifest.ts`.
2. Add the manifest endpoint: `src/pages/site.webmanifest.ts` on EmDash sites, the static profile's version on static sites.
3. Add the two `<link>` lines from the Base layout, and the `icons` script to `package.json`.
4. Run `npm run icons -- --background "#<the site's ground colour>"` and commit the PNGs.
