# Marketing landing page archetypes and conversion patterns

Read when composing high-conversion marketing pages, product showcases, waitlists, or campaigns. Use Baseline's native primitives (`Section`, `Container`, `Grid`, `Card`, `PhotoGallery`, `LogoTicker`, and `Disclosure`) rather than rigid monolithic widgets.

## The six core page archetypes

Match the page's primary visitor intent to the appropriate structural archetype rather than creating a generic layout:

| Archetype | Primary job | Critical sections | Recommended Baseline composition |
| --- | --- | --- | --- |
| **Lead generation** | Capture an email/contact in exchange for an offer or resource | Offer, proof/logos, concise form, objections/FAQ | Split `<Section>` + `<Container width="content">`, `<LogoTicker>` proof strip, server-validated `<form>` with form recovery, `<Disclosure>` FAQ accordion |
| **Sales** | Sell a specific product or service on one focused page | Promise, core features, proof/testimonials, pricing, guarantee | `<Section>` with split visual, `<Grid>` feature cards with concentric media radius, customer quote/ratings, pricing cards, trust badges |
| **Click-through** | Warm up visitors before sending them to signup or checkout | Value match, key benefits, single repeated action | Clean `<Section>` hero, 3-column `<Grid>` of `<Card>` benefits, repeated primary button pointing to target route |
| **Product details** | Explain a complex product or software in depth | Overview, deep features, specs/matrix, visual gallery, pricing | `<Container breakout class="flow">` editorial content grid, `<PhotoGallery>` lightbox, technical comparison table, clear pricing breakdown |
| **Pre-launch / Waitlist** | Build anticipation and gather early signups | Form first, milestones/roadmap, teaser features | High-contrast hero with email input above fold, timeline grid, feature preview cards |
| **Subscription** | Sell ongoing recurring value (SaaS or membership) | Trust strip, plan cards with billing toggle, retention/practices, updates | `<LogoTicker>` marquee, multi-tier pricing with monthly/yearly state, FAQ, newsletter signup band |

## Conversion copywriting rules

High-converting pages succeed on clarity, not decorative excess. When drafting or refining page copy:
- **Message matching:** The main `<h1>` headline must immediately reiterate the promise made in the external ad, email, search query, or link that brought the visitor.
- **Single primary action:** Choose one primary user action per page. Repeat that action across the hero, after the social proof, and in the closing banner using the **exact same button label**.
- **Evidence over claims:** Replace generic superlatives with verifiable facts, real quotes, and specific numbers. Every logo must represent a real partner or client with informative `alt` text.
- **Explicit expectation setting:** State clearly what happens after submitting or clicking (what is delivered, delivery time, privacy terms, and how to cancel or unsubscribe).

## Section composition with Baseline primitives

- **Hero & Openers:** Compose a `<Section>` containing a `<Container width="content">` for centered copy or `<Container breakout>` for split text and responsive media. Keep a single `<h1>` per page.
- **Proof & Trust Strips:** Use `<LogoTicker>` for continuous zero-JS client logos or partner badges. Cloned items are automatically hidden and inert for assistive tech.
- **Feature & Benefit Grids:** Use `<Grid columns={...}>` with `<Card>`. Cards use accessible stretched heading links (`.clickable-parent` and `.focus-parent`) so screen readers hear clean semantics while the entire card remains clickable.
- **Long-Form Editorial & Breakouts:** Use `<Container breakout class="flow">` (`.content-grid`) when long-form text needs reading measure (`68ch`) while figures or galleries expand to `.content--feature`, `.content--wide`, or `.content--full`.
- **Objections & FAQs:** Render native `<details class="disclosure">` (or `Disclosure.astro`) with native keyboard focus and toggle states. Never introduce a heavy client accordion script.
- **Closing CTA:** Wrap closing conversion sections in a dedicated `<Section data-surface="dark">` to establish high visual contrast and an inverted focal surface that commands attention.

## Schema.org structured data patterns

In addition to site-wide metadata handled by `SiteShell` / `EmDashHead`, marketing pages benefit from structured data rich results. Serialize JSON-LD using `<script type="application/ld+json" set:html={JSON.stringify(schema).replace(/</g, '\\u003c')} />` to prevent XSS script breakout.

### FAQPage schema (for native `<details>` accordions)

When a page includes an FAQ section, emit Schema.org `FAQPage` JSON-LD corresponding to the rendered questions:

```astro
---
const faqItems = [
  { question: 'What is the return policy?', answer: 'We offer a 30-day full refund policy.' },
  { question: 'How do updates work?', answer: 'All updates are delivered automatically via Git.' },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};
---

<script type="application/ld+json" set:html={JSON.stringify(faqSchema).replace(/</g, '\\u003c')} />
```

### Organization / LocalBusiness schema

Emit publisher or local organization context on homepage or contact pages:

```astro
---
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Acme Corporation',
  url: 'https://example.com',
  logo: 'https://example.com/logo.png',
  sameAs: [
    'https://twitter.com/acme',
    'https://github.com/acme',
  ],
};
---

<script type="application/ld+json" set:html={JSON.stringify(organizationSchema).replace(/</g, '\\u003c')} />
```
