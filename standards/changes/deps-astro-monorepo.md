---
bump: patch
platforms: [emdash, static]
areas: [dependencies]
adoption: manual
visible: no
database: no
packages: [@astrojs/node@11.1.14, astro@7.4.13]
---

# Dependency update: astro monorepo (2 packages)

Renovate moved these versions in Baseline on branch `renovate/astro-monorepo`; its pull request links each release's notes.

- `@astrojs/node` 11.1.13 to 11.1.14 (patch, `package.json`)
- `astro` 7.4.12 to 7.4.13 (patch, `package.json`)

## For sites

`@astrojs/node` and `astro` are runtime versions that standards releases certify. Baseline runs ahead of its last release until the next one certifies them, so sites take them with that release, when the site audit expects them.

When the site takes that release, run `npm install --save-exact @astrojs/node@11.1.14 astro@7.4.13` in EmDash sites, and `npm install --save-exact astro@7.4.13` in static sites, then `npm run verify` and `npm run build`.
