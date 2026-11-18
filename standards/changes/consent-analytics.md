---
bump: minor
platforms: [emdash, static]
areas: [components, docs, skills]
adoption: copy
visible: yes
database: no
files: [src/lib/consent.ts, src/lib/load-on-click.ts, src/components/Analytics.astro, src/components/ConsentBanner.astro, src/components/VideoEmbed.astro, src/components/MapEmbed.astro, src/layouts/Base.astro, src/env.d.ts]
---

# Analytics with consent, and embeds that load on click

Both Base layouts now render `Analytics.astro` and `ConsentBanner.astro`. They produce nothing until a measurement id is set in the build environment, and tags load only on `PUBLIC_ANALYTICS_HOSTS`, never on previews or locally.

- **`PUBLIC_CF_BEACON_TOKEN`:** Cloudflare Web Analytics, cookie-free, no banner.
- **`PUBLIC_GA_ID` / `PUBLIC_GTM_ID`:** Google Consent Mode v2 with every type denied until the visitor agrees.
  - `PUBLIC_CONSENT_MODE=strict` loads nothing before consent.
  - Choices are remembered per `PUBLIC_CONSENT_VERSION`.
  - `data-track` attributes send click events.
- **The banner** offers Accept all, Reject all and a per-category choice. It never takes focus on load, reopens from any `data-consent-open` element, and takes all its labels as props.
- **`VideoEmbed.astro` and `MapEmbed.astro`:** YouTube through youtube-nocookie.com, Vimeo with `dnt=1`, maps by embed URL. They contact the provider only on click, with a real link without JavaScript.

## For sites

1. Copy the files listed above and add `<Analytics slot="body-end" />` and `<ConsentBanner slot="body-end" />` to the Base layout, with labels in the site's language.
2. Set the ids and `PUBLIC_ANALYTICS_HOSTS` in the production build environment, and add a "Cookie settings" link with `data-consent-open` to the footer.
3. With a CSP, add the origins from `.env.example` to `CSP_SOURCES`.
4. Name the providers in the privacy notice.
