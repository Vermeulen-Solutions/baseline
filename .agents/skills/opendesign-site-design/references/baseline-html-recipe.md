# Baseline HTML/CSS specimen and token mapping for OpenDesign

Read [connection-and-cli.md](connection-and-cli.md) and the bundled [Baseline Design System plugin](../assets/plugins/baseline-design-system/DESIGN.md) first. Unlike vector scene graphs, OpenDesign renders real HTML and CSS in Chromium. Author prototypes directly against Baseline's semantic CSS custom properties and structural class vocabulary so approved concepts translate into Astro primitives without rewriting token names or layout math.

## 1. Semantic token mapping rule (`token-map` to Baseline)

Whether you start from an existing site's `npm run design:canvas-kit` output ([canvas-kit.md](../../../../docs/canvas-kit.md)), one of Baseline's four Aesthetic Lanes, or one of OpenDesign's 154 bundled `DESIGN.md` systems, always declare the prototype's `:root` and `[data-surface="dark"]` blocks using Baseline's canonical property names:

```css
:root {
  /* 3-Tier Surface Physics */
  --color-page: oklch(98.5% 0.008 85);
  --color-surface: oklch(96.5% 0.012 85);
  --color-elevated: oklch(99.5% 0.004 85);
  --surface-highlight: rgba(255, 255, 255, 0.7);

  /* Ink & Action Hierarchy */
  --color-text: oklch(20% 0.015 255);
  --color-muted: oklch(44% 0.015 255);
  --color-action: oklch(52% 0.16 38);
  --color-on-action: oklch(99% 0.005 85);

  /* 2-Tier Borders & Radii */
  --color-border: oklch(88% 0.012 85);
  --color-border-strong: oklch(76% 0.018 85);
  --radius-card: 0.75rem;
  --radius-control: 0.5rem;

  /* 4-Voice Typography */
  --font-display: "Instrument Serif", Georgia, serif;
  --font-accent: "Instrument Serif", Georgia, serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Fluid Type & Spacing Scales */
  --text-step--1: clamp(0.8125rem, calc(0.79rem + 0.11vi), 0.875rem);
  --text-step-0: clamp(1rem, calc(0.96rem + 0.22vi), 1.125rem);
  --text-step-1: clamp(1.25rem, calc(1.16rem + 0.43vi), 1.5rem);
  --text-step-2: clamp(1.625rem, calc(1.45rem + 0.87vi), 2.125rem);
  --text-step-3: clamp(2.125rem, calc(1.82rem + 1.52vi), 3rem);

  --spacing-container: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem);
  --spacing-section: clamp(3rem, calc(2.13rem + 4.35vi), 5.5rem);
  --spacing-grid: clamp(1.25rem, calc(1.08rem + 0.87vi), 1.75rem);
  --spacing-content: clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem);
}
```

If an OpenDesign reference system uses custom names (such as `--paper`, `--ink`, `--coral`), alias them onto the `--color-*` roles above rather than referencing non-Baseline names across component rules.

## 2. Structural HTML pattern (`od lint` clean)

Structure every top-level section with `data-od-id="<section-id>"` and match Baseline's primitive ownership (`Section` owns block padding; `Container` owns max-width, horizontal gutter and stack gap; `Grid`/`.bento-grid` owns grid gap; `Card` owns surface, border, radius and internal padding; `.flow` spaces editorial siblings):

```html
<section class="section" data-od-id="announcements-preview" aria-labelledby="section-heading">
  <div class="container">
    <header class="section__header flow">
      <p class="eyebrow-telemetry">[01 // COMMUNITY BOARD]</p>
      <h2 id="section-heading" class="section__title">
        Room for <em class="font-accent">useful</em> ideas
      </h2>
    </header>

    <div class="bento-grid">
      <article class="card flow">
        <div class="card__meta">
          <span class="badge-pill">ACTIVE</span>
          <time class="tabular-nums" datetime="2026-10-27">27 OCT 2026</time>
        </div>
        <h3 class="card__title">A short starting title</h3>
        <p class="card__body">
          A component calibrated from the installed site, with source expressions retained and measure constrained between 60ch and 68ch.
        </p>
        <div class="card__actions">
          <a class="btn" href="#primary">Primary action</a>
          <a class="btn btn--secondary" href="#secondary">Secondary action</a>
        </div>
      </article>
    </div>
  </div>
</section>
```

## 3. Pre-handoff checklist (`od lint` & `od export`)

1. **Uppercase tracking (`all-caps-no-tracking`):** Every element with `text-transform: uppercase` (`.eyebrow-telemetry`, `.badge-pill`, tags) must include `letter-spacing: 0.06em` to `0.12em`.
2. **Section anchors (`missing-section-anchor`):** Every `<section>` must carry a descriptive `data-od-id` attribute.
3. **Dual-viewport verification:** Inspect both `1440×900` and `390×844` renders (`od export`) or responsive preview frames to verify that long titles wrap cleanly and multi-button rows stack or reflow without horizontal overflow.
4. **Astro transmutation:** Follow [Handoff to Baseline Astro](../assets/plugins/od-astro-baseline-export/SKILL.md) to decompose the approved artifact into `<Section>`, `<Container>`, `<Grid>`, `<Card>` and `.flow` on `/_styleguide` before route assembly.
