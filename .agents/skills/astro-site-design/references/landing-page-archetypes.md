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

## Strategic intake and funnel qualification

Gather these essentials before drafting copy or assembling layouts. Ask only for what is missing in a single batch, or make one-line reversible working assumptions when rapid autonomous execution is authorized:

- **Purpose & Primary Action:** Identify the ONE primary conversion action (e.g., start trial, schedule demo, download spec, purchase, or join waitlist) and the exact deliverable the visitor receives. Avoid competing calls to action above the fold.
- **Audience & Traffic Context:** Define the ICP (Ideal Customer Profile), their core burning pain, their top three objections to converting today, and the incoming traffic channel (paid campaign, organic search, referral, or newsletter) to ensure immediate message matching.
- **Verifiable Proof & Risk Reversal:** Catalog real customer quotes, client logos with descriptive alt text, verified performance metrics, case study milestones, and risk-reversal terms (e.g., 30-day money-back guarantee, cancel anytime, or no credit card required).
- **Indexing Intent:** Distinguish evergreen organic pages (indexable, structured for AEO/SEO) from time-bound campaign landing pages (set to `noindex, nofollow` to concentrate ad conversion without duplicate content dilution).

## Conversion copywriting engine

High-converting pages succeed on clarity, precision, and outcome-led arguments rather than decorative excess or empty buzzwords:

### Tested headline formulas
Replace vague AI-slop headlines (such as "Empowering your business with intelligent synergy") with deterministic formulas:
- **`{Outcome} without {Pain / Friction}`:** e.g., *"Deterministic edge deployments without container cold starts."*
- **`The {Category} for {Specific Audience}`:** e.g., *"The relational CMS engineered for editorial teams who publish hourly."*
- **`Ship {Result} in {Timeframe}`:** e.g., *"Cut monthly billing reconciliation from five days to two hours."*

### Subheadline & lead prose contract
Keep the subheadline to exactly one or two concise sentences. Clarify *how* the outcome is achieved and *who* it serves. Apply `text-wrap: balance` to headings and `text-wrap: pretty` to lead prose; avoid orphaned terminal words or awkward line breaks.

### Action-oriented CTA triggers
Compose button labels using an active verb paired with the concrete outcome or deliverable. Never use generic labels like "Submit", "Get Started", or "Learn More":
- ✅ *"Start 14-day trial"* / *"Download technical spec"* / *"Book architecture review"* / *"Deploy to Cloudflare"*
- Place risk reversals (e.g., `No credit card required • Cancel anytime`) directly adjacent to primary CTA triggers to eliminate micro-friction.
- Repeat the exact same primary action label across the hero, mid-page proof, and closing conversion banner.

### Benefit-first capability points
Features explain what the mechanism does; benefits explain what that capability unlocks for the visitor. Format feature points as outcome-first pairs:
- **Pattern:** `**[Bold Outcome Benefit]** — [Concrete mechanism, technical proof, or verifiable metric].`
- **Example:** `**Sub-millisecond routing** — P99 latency under 1.4ms across 38 global edge PoPs without cold starts.`

### Objection elimination sequence
Treat objections as essential section arguments rather than an afterthought. Map each major objection directly to a section:
1. *Skepticism about claims* → Concrete customer quote or verifiable metric ledger immediately following the hero.
2. *Complexity or friction of adoption* → Clear 3-step "How it works" process walkthrough.
3. *Vendor lock-in or migration anxiety* → Explicit data portability guarantee and technical comparison matrix.
4. *Edge cases and terms* → Structured native `<Disclosure>` FAQ accordion ordered by objection severity.

## Deterministic section build order

When generating or refactoring a landing page, assemble sections in this deterministic sequence to preserve token discipline, prevent layout regressions, and keep diffs reviewable:

1. **Hero & Value Proposition:** Single `<h1>`, subheadline, primary CTA with adjacent risk reversal, and a live-coded `.ui-specimen` or framed visual.
2. **Proof & Telemetry Strip:** Zero-JS `<LogoTicker>` marquee or 4-cell `.grid-hairline` metric ledger (`.tabular-nums`).
3. **Problem-to-Solution Transition:** Contrast the incumbent friction with the deterministic new model.
4. **Feature & Capability Variance:** Alternating structural geometries (e.g., asymmetric `.bento-grid`, sticky `<Sidebar>` narrative, or `.grid-hairline` matrix).
5. **Objection Elimination & FAQ:** Native `<details class="disclosure">` accordion answering top objections, backed by Schema.org `FAQPage` JSON-LD for answer engine optimization (AEO).
6. **Closing Conversion Banner:** Inverted high-contrast focal band (`<Section data-surface="dark" class="surface-spotlight">`) with the repeated primary CTA.
7. **Footer & Compliance:** Semantic landmarks, privacy/terms links, and skip link targets.

## Section composition with Baseline primitives

- **Hero & Openers:** Compose a `<Section>` containing a `<Container width="content">` for centered copy or `<Container width="wide">` with a 12-column asymmetric split (`7/5` or `6/6`) pairing the value proposition with a live-coded `.ui-specimen` console or prepared editorial media. Keep a single `<h1>` per page.
- **Proof & Trust Strips:** Use `<LogoTicker>` for continuous zero-JS client logos or partner badges, or `.grid-hairline` for a 4-cell tabular metrics ledger (`.tabular-nums`). Cloned ticker items are automatically hidden and inert for assistive tech.
- **Feature & Benefit Grids:** Vary section geometry across the page—combine a `<Grid>` of `<Card>` items in one section with an exposed `1px` `.grid-hairline` matrix or `<Sidebar>` sticky narrative + spec list in the next. Never stack two identical 3-column card grids back-to-back.
- **Long-Form Editorial & Breakouts:** Use `<Container breakout class="flow">` (`.content-grid`) when long-form text needs reading measure (`68ch`) while figures or galleries expand to `.content--feature`, `.content--wide`, or `.content--full`.
- **Objections & FAQs:** Render native `<details class="disclosure">` (or `Disclosure.astro`) with native keyboard focus and toggle states. Never introduce a heavy client accordion script.
- **Closing CTA:** Wrap closing conversion sections in a dedicated `<Section data-surface="dark" class="surface-spotlight">` to establish high visual contrast and an inverted focal surface that commands attention.

## High-craft architectural patterns (`src/styles/global.css`)

### 1. 4-Voice Hero with Live-Coded UI Specimen (`.ui-specimen`)

For technical, SaaS, AI, fintech, or B2B sites, build the hero visual as a real HTML/CSS/SVG telemetry or product console instead of using generic stock photography:

```astro
<Section class="bg-grid-blueprint surface-spotlight">
  <Container width="wide">
    <div class="grid items-center gap-[var(--spacing-grid)] lg:grid-cols-12">
      <div class="flow lg:col-span-7">
        <p class="eyebrow-telemetry">
          <span class="status-dot" aria-hidden="true"></span>
          <span>[01 // SYSTEM ARCHITECTURE]</span>
        </p>
        <h1>
          Deterministic infrastructure for <em class="font-accent">autonomous</em> workflows.
        </h1>
        <p>
          Sub-millisecond edge routing with verifiable state snapshots and zero cold-start overhead.
        </p>
        <Cluster>
          <a class="badge-pill" href="/docs">Inspect telemetry →</a>
        </Cluster>
      </div>
      <div class="lg:col-span-5">
        <aside class="ui-specimen" aria-label="Live cluster telemetry specimen">
          <div class="ui-specimen__header">
            <span>cluster-eu-central // v2.4</span>
            <span class="tabular-nums">99.998% SLA</span>
          </div>
          <div class="grid-hairline">
            <div>
              <p class="eyebrow-telemetry">P99 LATENCY</p>
              <p class="tabular-nums" style="font-size: var(--text-step-1); font-weight: 700;">1.42ms</p>
            </div>
            <div>
              <p class="eyebrow-telemetry">THROUGHPUT</p>
              <p class="tabular-nums" style="font-size: var(--text-step-1); font-weight: 700;">48.2k/s</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </Container>
</Section>
```

### 2. Exposed `1px` Hairline Ledger Grid (`.grid-hairline` & `.frame-crosshair`)

When presenting technical specifications, architectural pillars, or numbered process steps, replace floating drop-shadow cards with an exposed `1px` cell-wall matrix:

```astro
<Section>
  <Container width="content">
    <p class="eyebrow-telemetry">§ 02 // CAPABILITIES</p>
    <h2>Engineered for <em class="font-accent">precision</em> at scale</h2>
    <div class="grid-hairline frame-crosshair">
      <article class="flow">
        <span class="eyebrow-telemetry">01 // INGEST</span>
        <h3>Zero-copy streaming</h3>
        <p>Direct memory pipelines eliminate serialization bottlenecks across worker boundaries.</p>
      </article>
      <article class="flow">
        <span class="eyebrow-telemetry">02 // VERIFY</span>
        <h3>Cryptographic receipts</h3>
        <p>Every state transition emits a signed, replayable ledger entry with deterministic hashes.</p>
      </article>
      <article class="flow">
        <span class="eyebrow-telemetry">03 // OBSERVE</span>
        <h3>Real-time trace matrix</h3>
        <p>Inspect live span waterfalls without sampling loss or external agent sidecars.</p>
      </article>
    </div>
  </Container>
</Section>
```

### 3. Signature Header Archetypes

Commit to a header architecture that reinforces the chosen Aesthetic Lane rather than rendering an unstyled link row:
- **Floating Glass Capsule (`Obsidian Tech` / `Clinical Clarity`):** Wrap `.site-nav` inside a centered capsule (`margin-block-start: 0.75rem; border-radius: 9999px`) using `.surface-glass`.
- **Exposed Brutalist Multi-Cell Bar (`Brutalist Signal` / `Kinetic Poster`):** Pair a compact top `.eyebrow-telemetry` status strip with a full-width `1px solid var(--color-border)` header where navigation groups are separated by vertical `1px` cell borders.
- **Editorial Hairline Masthead (`Editorial Paper` / `Warm Craft`):** Pair a serif or geometric brand mark with numbered navigation links (`01 Index`, `02 Archive`, `03 Practice`) above a crisp `1px` ink rule.

### 4. Instant Page Transitions & Hover/Tap Prefetching (`<ClientRouter fallback="swap" />`)

To achieve instantaneous multi-page navigation with 80ms hover prefetching, `touchstart`/`mousedown` mobile preloading, `<head>` CSS deduplication, and `180ms` native View Transitions:

1. **Slot `<ClientRouter fallback="swap" />` into `<SiteShell>` inside `src/layouts/Base.astro`:**
   ```astro
   ---
   import { ClientRouter } from 'astro:transitions';
   import SiteShell from './SiteShell.astro';
   ---
   <SiteShell spacingPolicy="automatic-v2" title={title} metadataOwner="platform" lang={lang}>
     <ClientRouter fallback="swap" slot="head" />
     <!-- head metadata, header, main slot, footer -->
   </SiteShell>
   ```
   (`SiteShell.astro` already marks `a.skip-link` with `data-astro-reload` so native `#main-content` keyboard focus transfer is preserved.)
2. **Follow the View Transition Script Lifecycle:**
   - Re-apply any dynamic `<html>` surface/theme attributes inside `document.addEventListener('astro:after-swap', applySurfaceState)` so the new DOM frame paints without a flash (`SiteShell.astro` already persists `baseline:surface` across swaps automatically).
   - Bind all interactive UI behavior (drawers, tab switchers, calculators) inside `document.addEventListener('astro:page-load', () => { ... })` instead of `DOMContentLoaded`.
   - On `emdash` CMS sites, add `data-astro-reload` to `/_emdash/*` links and server-validated `<form method="post">` elements, or restrict `<ClientRouter />` to public routes where live inline Portable Text editing is not active.

### 5. Zero-JS Sticky Stacking Cards (`.stack-cards` & `.stack-card`)

For agency capability decks, multi-stage process walkthroughs, or architectural deep-dives, stack full-width cards physically as the user scrolls without any JavaScript scroll listeners:

```astro
---
const stages = [
  { id: '01', title: 'Deterministic Ingestion', summary: 'Zero-copy edge parsing with schema validation at line rate.' },
  { id: '02', title: 'Policy Compilation', summary: 'Isolated execution graphs compiled into verifiable state machines.' },
  { id: '03', title: 'Cryptographic Settlement', summary: 'Immutable receipts committed across regional quorum nodes.' },
];
---
<div class="stack-cards">
  {stages.map((stage, index) => (
    <article class="stack-card flow" style={`--stack-index: ${index}; padding: var(--spacing-content);`}>
      <p class="eyebrow-telemetry">STAGE // {stage.id}</p>
      <h3>{stage.title}</h3>
      <p>{stage.summary}</p>
    </article>
  ))}
</div>
```

### 6. Pure-CSS Telemetry Histograms Inside Interactive Bento Cards (`.viz-bars` & `.viz-bar`)

Embed live-coded CSS bar charts directly inside `<Card>` or Bento cells without shipping a charting library:

```astro
<Card title="Regional Edge Throughput" href="/architecture">
  <p class="eyebrow-telemetry">P99 LATENCY // 12.4MS</p>
  <div class="viz-bars" role="img" aria-label="12-region throughput distribution">
    {[42, 58, 64, 51, 76, 84, 92, 88, 79, 95, 91, 98].map((val, idx) => (
      <span class="viz-bar" data-active={idx === 11 ? '' : undefined} style={`--bar-value: ${val}%;`} />
    ))}
  </div>
</Card>
```

### 7. Declarative Category Filter Grids with Reflow Replay (`[data-filter-root]`)

`SiteShell.astro` ships a built-in delegated filter controller. Mark any section or wrapper with `data-filter-root`, filter buttons with `data-filter-btn="<token>"` (`"all"` shows every item), and items with `data-filter-item="<token>"` (space- or comma-separated tokens). Clicking a filter pill updates `aria-pressed`, hides non-matching items, and replays `.animate-card-in` via a synchronous `void item.offsetWidth` layout flush:

```astro
<div data-filter-root class="flow">
  <div role="toolbar" aria-label="Filter case studies" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
    <button type="button" class="badge-pill" data-filter-btn="all" data-active aria-pressed="true">ALL</button>
    <button type="button" class="badge-pill" data-filter-btn="infra" aria-pressed="false">INFRASTRUCTURE</button>
    <button type="button" class="badge-pill" data-filter-btn="security" aria-pressed="false">SECURITY</button>
  </div>
  <Grid minimum="standard">
    <div data-filter-item="infra">
      <Card title="Zero-Copy Mesh" description="Sub-millisecond regional routing." href="/work/mesh" />
    </div>
    <div data-filter-item="security">
      <Card title="Enclave Attestation" description="Hardware-rooted key rotation." href="/work/enclave" />
    </div>
  </Grid>
</div>
```

### 8. Progressive-Enhancement Scroll Reveals (`[data-reveal]`) & FOUC-Free Daylight / Dark Mode (`<SiteShell surface="...">` + `[data-surface-toggle]`)

- **Scroll Reveals:** Add `data-reveal` and optional `data-reveal-delay="120"` (`ms`) to cards or sections. Content remains 100% visible when JS is disabled or when already above the fold; `SiteShell.astro` sets `html[data-reveal-ready]` and observes below-the-fold `[data-reveal]` elements on `astro:page-load` (automatically respecting `prefers-reduced-motion: reduce`).
- **Light/Dark Mode & Daylight Switch (`surface="dark|light|system"`):**
  1. Choose the default surface in `Base.astro` on `<SiteShell>`: pass `surface="dark"` for dark-first lanes (`Obsidian Tech`, `Kinetic Poster`, `Luminous Futurism`) that offer a **Daylight Switch**, `surface="light"` for daylight-first lanes that offer a **Night Switch**, or `surface="system"` to follow `prefers-color-scheme: dark` until the user overrides it.
  2. When `<html data-surface="dark">` or `<html data-surface="light">` is active, `global.css` automatically derives a deeper `--color-page` canvas beneath `--color-surface` cards and `--color-elevated` controls so 3-tier depth is preserved in both modes.
  3. Render a `[data-surface-toggle]` button anywhere in the header or footer and use `[data-surface-icon="light"]` (shown when in dark mode, inviting a switch to daylight) and `[data-surface-icon="dark"]` (shown when in light mode, inviting a switch to dark) for zero-JS label/icon swapping:

```astro
<button type="button" class="badge-pill" data-surface-toggle aria-label="Toggle color theme" aria-pressed="true">
  <span class="status-dot"></span>
  <span data-surface-icon="light">DAYLIGHT // MODE</span>
  <span data-surface-icon="dark">OBSIDIAN // MODE</span>
</button>
```

### 9. Zero-Framework Micro-Islands (`<script define:vars={{ ... }}>` + `astro:page-load`)

For bespoke interactive widgets—such as **ROI/pricing calculators**, **usage tier sliders**, or **interactive DAG/architecture node inspectors**—never pull in React or a client UI framework unless complex stateful trees require it. Instead, serialize frontmatter data with `define:vars` and bind a scoped listener on `astro:page-load`:

```astro
---
const nodes = [
  { id: 'ingest', label: '01 // INGEST', latency: '0.4ms', throughput: '1.2M msg/s', status: 'NOMINAL' },
  { id: 'route', label: '02 // ROUTE', latency: '1.1ms', throughput: '980K msg/s', status: 'VERIFIED' },
  { id: 'commit', label: '03 // COMMIT', latency: '2.8ms', throughput: '640K msg/s', status: 'LOCKED' },
];
---
<div class="ui-specimen" id="pipeline-inspector">
  <div class="ui-specimen__header">
    <span>DAG // PIPELINE INSPECTOR</span>
    <span class="badge-pill"><span class="status-dot"></span><span data-node-status>{nodes[0].status}</span></span>
  </div>
  <div style="padding: var(--spacing-content);" class="flow">
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
      {nodes.map((node, index) => (
        <button type="button" class="badge-pill" data-node-btn={node.id} aria-pressed={index === 0 ? 'true' : 'false'}>
          {node.label}
        </button>
      ))}
    </div>
    <div class="grid-hairline">
      <div>
        <p class="eyebrow-telemetry">LATENCY</p>
        <p class="tabular-nums" data-node-latency>{nodes[0].latency}</p>
      </div>
      <div>
        <p class="eyebrow-telemetry">THROUGHPUT</p>
        <p class="tabular-nums" data-node-throughput>{nodes[0].throughput}</p>
      </div>
    </div>
  </div>
</div>

<script is:inline define:vars={{ nodes }}>
  const bindInspector = () => {
    const root = document.getElementById('pipeline-inspector');
    if (!root || root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';
    root.addEventListener('click', (event) => {
      const btn = event.target instanceof Element ? event.target.closest('[data-node-btn]') : null;
      if (!btn) return;
      const selected = nodes.find((n) => n.id === btn.getAttribute('data-node-btn'));
      if (!selected) return;
      root.querySelectorAll('[data-node-btn]').forEach((el) => el.setAttribute('aria-pressed', String(el === btn)));
      const latency = root.querySelector('[data-node-latency]');
      const throughput = root.querySelector('[data-node-throughput]');
      const status = root.querySelector('[data-node-status]');
      if (latency) latency.textContent = selected.latency;
      if (throughput) throughput.textContent = selected.throughput;
      if (status) status.textContent = selected.status;
    });
  };
  bindInspector();
  document.addEventListener('astro:page-load', bindInspector);
</script>
```

### 10. Asymmetric 12-Column Bento Grids, Tactile Action Roles & Editorial Craft

To avoid repetitive equal-width 3-column card rows and flat link styling, combine `.bento-grid`, `.btn` / `.btn--secondary` + `.icon-nudge`, `[data-sticky-header]`, `.surface-grain`, `.prose-dropcap`, and `.reel-snap`:

```astro
<header data-sticky-header style="padding-block: 1rem;">
  <Container width="wide" layout="custom" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
    <a href="/" style="font-family: var(--font-display); font-weight: 700; text-decoration: none;">ACME // SYS</a>
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <button type="button" class="btn btn--ghost" data-surface-toggle aria-pressed="false">Theme</button>
      <a href="/contact" class="btn">Start deployment <span aria-hidden="true" class="icon-nudge">→</span></a>
    </div>
  </Container>
</header>

<Section class="surface-grain">
  <Container width="content">
    <div class="bento-grid">
      <div class="bento-span-8">
        <Card title="Global State Replication" description="Deterministic consensus across 38 edge regions." href="/replication" />
      </div>
      <div class="bento-span-4">
        <Card title="Zero-Trust Enclaves" description="Hardware-attested execution." href="/security" />
      </div>
    </div>
  </Container>
</Section>
```

### 11. Native Astro 5/6/7 Platform Superpowers (Fonts API, Shared-Element Morphing, Inline SVG Components, Server Islands & Speculation Rules)

1. **Zero-CLS Native Fonts API (`fontProviders` + `<Font />`):**
   ```js
   // astro.config.mjs
   import { defineConfig, fontProviders } from 'astro/config';
   export default defineConfig({
     fonts: [
       { provider: fontProviders.google(), name: 'Space Grotesk', cssVariable: '--font-display', weights: [500, 700] },
       { provider: fontProviders.google(), name: 'Instrument Serif', cssVariable: '--font-accent', styles: ['italic'] },
     ],
   });
   ```
   And inside `Base.astro` `<head>`:
   ```astro
   ---
   import { Font } from 'astro:assets';
   ---
   <Font cssVariable="--font-display" preload />
   <Font cssVariable="--font-accent" />
   ```
2. **Shared-Element Card → Article Morphing (`<Card transitionName="..." />` + `.vt-morph`):**
   On a listing route (`/posts`):
   ```astro
   <Card title={post.title} href={`/posts/${post.slug}`} image={post.cover} transitionName={`post-${post.slug}`} />
   ```
   On the detail route (`/posts/[slug]`):
   ```astro
   <h1 class="vt-morph" style={`--vt-name: post-${post.slug}-title;`}>{post.title}</h1>
   <figure class="vt-morph" style={`--vt-name: post-${post.slug}-media;`}>
     <ResponsiveImage src={post.cover} alt={post.coverAlt} />
   </figure>
   ```
3. **Native Inline SVG Component Imports (`.svg-icon`):**
   Import any `.svg` from `src/assets/` as an Astro component and pass native `<svg>` attributes:
   ```astro
   ---
   import BrandGlyph from '../assets/brand-glyph.svg';
   ---
   <BrandGlyph width={24} height={24} class="svg-icon" aria-hidden="true" />
   ```
4. **Server Islands (`server:defer` + `.skeleton-shimmer`) for Hybrid EmDash SSR Pages:**
   ```astro
   <LiveTelemetryBanner server:defer>
     <div slot="fallback" class="skeleton-shimmer" style="block-size: 2.5rem; inline-size: 14rem;" aria-hidden="true"></div>
   </LiveTelemetryBanner>
   ```
5. **Speculation Rules Prerendering (`experimental.clientPrerender`) & Progressive-Enhancement `astro:actions` Forms:**
   - Enable `prefetch: { prefetchAll: true, defaultStrategy: 'hover' }, experimental: { clientPrerender: true }` in `astro.config.mjs` on static sites so Chromium browsers prerender hovered links via `<script type="speculationrules">`.
   - Use `defineAction({ accept: 'form', input: z.object(...) })` in `src/actions/index.ts` so `<form method="POST" action={actions.contact}>` validates on the server with zero client JS required.

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
