# H-T6-q3 pricing section report

## Answer

### Gate status

This folder has no `src/` tree, no `baseline.config.json`, no `audit/` folder and no Art Direction Record. AGENTS.md has no `## Art Direction Record` section, so the visual-implementation gate is not met. The markup below is a draft for after the record is saved and `npm run check:art-direction -- --require-record` passes. It should not be placed in `src/` before then.

AGENTS.md also says a missing `baseline.config.json` in this root means the existing EmDash Node.js + SQLite application. Under that profile, if editors will change prices, the tiers should come from a CMS collection with `entry.edit.*` proxies (use `emdash-content-modeling` and `building-emdash-site`, which I did not open). The static array below is a placeholder for that query.

### Decisions

- **No client-side JavaScript.** The monthly/annual switch is a native radio group. Prices for both periods are in the DOM and CSS shows the active one. There is no `<script>`, no island and no `astro:page-load` binding. The Subscription archetype suggests `define:vars` for pricing calculators, but this is a two-state visibility toggle, so the native approach is simpler and works without JavaScript.
- **Not `Tabs.astro`.** Tabs implies tablist/tabpanel navigation. A billing period is a single choice that changes values, so a radio group is the correct semantics.
- **Not `Card` with `href`.** Card's stretched heading link would make the whole tier one link. A tier has its own CTA, so the card uses the plain `card` surface class with no link contract. Confirm in `global.css` that `.card` is styled outside Card.astro.
- **Section pacing.** The metrics ledger (`.grid-hairline`) comes before the three-column tier grid. That follows the rule against consecutive identical 3-column card grids. The next section must not be another card row.
- **No invented data.** Prices, uptime, customer counts, response times and CTA destinations are bracketed placeholders. The archetype rule applies: if verified metrics do not exist, omit the strip rather than fill it.

### Utilities chosen

| Utility | Where | Why |
| --- | --- | --- |
| `Section` (`labelledBy`) | Pricing wrapper | Owns block padding and stack gap. No margins on children. |
| `Container width="content"` | Inside section | 76rem measure suits three tiers. Wide would stretch the cards. |
| `Grid minimum="standard"` | Tier cards | Intrinsic auto-fit; collapses to one column on mobile without `lg:grid-cols-3` breakpoints. |
| `.grid-hairline` | Metrics strip | Exposed 1px cell walls for the proof ledger, with `.tabular-nums` values. |
| `.eyebrow-telemetry` | Section index, labels | Mono uppercase telemetry voice. |
| `.font-accent` | One word in the h2 | Accent voice on one focal word only. |
| `.tabular-nums` | Prices, metric values | Stable numeric alignment when values switch. |
| `.card` surface class, `.surface-elevated` | Tiers; featured tier elevated | Three-tier depth. Only the featured tier is raised. |
| `.btn` (featured), `.btn--secondary` (others), `.icon-nudge` | CTAs | One primary action per visible emphasis; the others stay secondary. |
| `.badge-pill` | Billing labels | Pill labels for the radio options. Checked-state styling is added locally, because the pill class may not style `:checked`. |

Not used here: `LogoTicker`, `Sidebar`, bento grids, `.ui-specimen`, `ClientRouter`, `data-reveal`. `Disclosure` belongs in a separate pricing FAQ if one is added.

### Astro markup (draft: `src/components/PricingSection.astro`)

```astro
---
import Section from './Section.astro';
import Container from './Container.astro';
import Grid from './Grid.astro';

// Draft content. Replace every bracketed value with verified data before publishing.
// Pass a unique idPrefix if this component is rendered more than once on a page.
const { idPrefix = 'pricing' } = Astro.props;

const metrics = [
  { label: 'Uptime', value: '[99.xx%]', note: '[period and source]' },
  { label: 'Customers', value: '[count]', note: '[what is counted]' },
  { label: 'Median response', value: '[time]', note: '[how it is measured]' },
];

const tiers = [
  { id: 'team', name: '[Plan name]', summary: '[Who it is for]', monthly: '[price]', annual: '[price, billed yearly]', unit: '[per seat / month]', features: ['[Included capability]', '[Included capability]'], cta: '[Action verb + outcome]', href: '[destination]', featured: false },
  { id: 'growth', name: '[Plan name]', summary: '[Who it is for]', monthly: '[price]', annual: '[price, billed yearly]', unit: '[per seat / month]', features: ['[Included capability]', '[Included capability]'], cta: '[Action verb + outcome]', href: '[destination]', featured: true },
  { id: 'enterprise', name: '[Plan name]', summary: '[Who it is for]', monthly: '[Custom]', annual: '[Custom]', unit: '[terms]', features: ['[Included capability]', '[Included capability]'], cta: '[Contact action]', href: '[contact destination]', featured: false },
];

const billingName = `${idPrefix}-billing`;
const annualId = `${idPrefix}-annual`;
---

<Section labelledBy={`${idPrefix}-title`} class="pricing">
  <Container width="content">
    <p class="eyebrow-telemetry">[03 // PRICING]</p>
    <h2 id={`${idPrefix}-title`}>[Heading with <em class="font-accent">one</em> accent word]</h2>

    <dl class="grid-hairline" aria-label="Service metrics">
      {metrics.map((m) => (
        <div>
          <dt class="eyebrow-telemetry">{m.label}</dt>
          <dd class="tabular-nums">{m.value}</dd>
          <dd>{m.note}</dd>
        </div>
      ))}
    </dl>

    <fieldset class="pricing-billing">
      <legend class="eyebrow-telemetry">Billing period</legend>
      <input class="pricing-billing__input" type="radio" id={`${idPrefix}-monthly`} name={billingName} value="monthly" checked />
      <label class="badge-pill" for={`${idPrefix}-monthly`}>Monthly</label>
      <input class="pricing-billing__input" type="radio" id={annualId} name={billingName} value="annual" />
      <label class="badge-pill" for={annualId}>Annual <span>[save x%]</span></label>
    </fieldset>

    <Grid minimum="standard">
      {tiers.map((tier) => (
        <article class:list={['card', 'flow', 'pricing-tier', tier.featured && 'surface-elevated']} aria-labelledby={`${idPrefix}-${tier.id}`}>
          <h3 id={`${idPrefix}-${tier.id}`}>{tier.name}</h3>
          <p>{tier.summary}</p>
          <p class="pricing-tier__price">
            <span class="pricing-price pricing-price--monthly tabular-nums">{tier.monthly}</span>
            <span class="pricing-price pricing-price--annual tabular-nums">{tier.annual}</span>
            <span class="pricing-tier__unit">{tier.unit}</span>
          </p>
          <ul>
            {tier.features.map((feature) => <li>{feature}</li>)}
          </ul>
          <a class:list={['btn', !tier.featured && 'btn--secondary']} href={tier.href}>
            {tier.cta} <span class="icon-nudge" aria-hidden="true">→</span>
          </a>
        </article>
      ))}
    </Grid>
  </Container>
</Section>

<style>
  @layer components {
    .pricing-billing {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      border: 0;
      min-inline-size: 0;
    }

    .pricing-billing__input {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .pricing-billing__input:focus-visible + label {
      outline: 2px solid var(--color-focus);
      outline-offset: 3px;
    }

    .pricing-billing__input:checked + label {
      border-color: var(--color-border-strong);
      background: var(--color-action-subtle);
    }

    /* Zero-JS state: show one price per tier, selected by the radio group. */
    .pricing:has(#pricing-annual:checked) .pricing-price--monthly,
    .pricing:not(:has(#pricing-annual:checked)) .pricing-price--annual {
      display: none;
    }
  }
</style>
```

Notes on the draft:

- The CSS selectors assume the default `idPrefix` of `pricing`. The `:has()` rule hard-codes `#pricing-annual`. If the prefix changes, change that selector too, or scope it with a `data-billing` attribute.
- The `<style>` block follows the layer contract. Tokens such as `--color-focus`, `--color-border-strong` and `--color-action-subtle` are named in the docs, but I did not open `global.css`. Confirm the names and the text-on-tint contrast with `npm run design:tokens`.
- Add `.pricing-tier__price` and `.pricing-tier__unit` styles in the same layer only if the calibrated type needs them. Do not add flow margins to the card, because `.flow` already spaces its children.
- Reset `dl` and `dd` margins inside `.grid-hairline` if the global reset does not cover them.

### Verification plan

1. Save the Art Direction Record, then run `npm run check:art-direction -- --require-record`.
2. Run `npm run design:tokens` and `npm run test:design`. Check the badge label on the checked tint, the primary button on the featured surface, and the secondary button.
3. Calibrate the component on `/_styleguide` and record it in `audit/component-calibration.md`.
4. In the browser at 375, 768 and 1440 px: no horizontal overflow, no awkward heading wraps, equal-height tier cards with CTAs aligned at the bottom, and the metrics ledger readable.
5. Keyboard: Tab reaches the radio group, arrow keys switch between Monthly and Annual, the focus ring is visible, and each CTA is reachable. Confirm that the hidden period's price is not announced by a screen reader (`display: none` removes it from the accessibility tree).
6. Run `npm run verify`, `npm run build` and `npm run audit:html`. Check each name against `package.json` first. This folder does not show a `package.json` scripts block that I opened.

### Limits

- I did not open the component source, `global.css`, `design-iteration.md`, `art-direction-and-calibration.md` or any EmDash specialist. Token and utility names come from the docs, not from the stylesheet.
- Nothing was rendered, built or tested. The markup is a design draft.
- Copy and prices are placeholders. The site's language must come from its brief.
- No file in the site folder was edited.

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/astro-site-design/SKILL.md
4. docs/site-working-rules.md
5. .agents/skills/site-art-direction/SKILL.md
6. .agents/skills/new-site-workflow/SKILL.md
7. .agents/skills/astro-site-design/references/landing-page-archetypes.md
8. docs/native-composition.md
9. docs/design-framework.md
10. docs/reusable-public-patterns.md

Directory globs were used only to list files. Only the files above were opened.
