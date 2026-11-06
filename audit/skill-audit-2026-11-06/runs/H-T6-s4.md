## Answer

### Gate and scope first

- **The Art Direction Record is missing.** `AGENTS.md` has no `## Art Direction Record`, and `site-art-direction` and `docs/site-working-rules.md` say site-specific visual implementation under `src/` or `public/` must wait until one is saved and `npm run check:art-direction -- --require-record` passes. The markup below is therefore a proposal to write after the record exists. Its token choices (lane, typography pairing, border and density physics) should come from that record, not be fixed here. My assumption for a B2B software product is Technical Systems or Product-Led Minimalism; the owner should choose.
- **The site source is not in this folder.** There is no `src/`, so I could not check the real props of `Section`, `Container`, `Grid` or `Cluster`, or the exact utility names in `src/styles/global.css`. The props below come from `docs/design-framework.md` and `docs/native-composition.md`. Verify them against the installed components before writing.
- **Metrics and prices need owner data.** The skill's rule is that a metric or price must be supported by evidence, never invented. Every figure below is a bracketed placeholder. If uptime, customer count or response time cannot be verified, omit the strip (the archetype guidance allows that) instead of publishing placeholders.

### Section plan and order

1. Metrics strip: a 3-cell `.grid-hairline` ledger with `.tabular-nums` values. This is the proof strip the landing archetype describes, and its exposed hairline geometry differs from the card rows around it.
2. Pricing heading and billing switch (monthly/annual), built from `.badge-pill` buttons with `aria-pressed`.
3. Three tiers in one `Grid`, one per plan, each with a price, a short feature list and one CTA.
4. Pricing is a comparison task, so uniform equal columns are justified. Record that as the specific exception to the "no consecutive identical 3-column grids" rule. Place a dark `surface-spotlight` closing band and any FAQ `Disclosure` after it, not inside it.

### Proposed markup (`src/components/PricingSection.astro`, to be written after the record)

```astro
---
import Section from './Section.astro';
import Container from './Container.astro';
import Grid from './Grid.astro';
import Cluster from './Cluster.astro';

// Owner-supplied values only. Placeholders until verified.
const metrics = [
  { label: 'Uptime', value: '[99.xx%]', note: '[period and source]' },
  { label: 'Customers', value: '[n]', note: '[as of date]' },
  { label: 'Median response', value: '[n h]', note: '[support channel]' },
];

const tiers = [
  { id: 'team', name: 'Team', monthly: '[EUR xx]', annual: '[EUR xx]', unit: '[unit]', featured: false,
    features: ['[Feature]', '[Feature]'], cta: { label: '[Verb + plan name]', href: '/signup?plan=team' } },
  { id: 'business', name: 'Business', monthly: '[EUR xx]', annual: '[EUR xx]', unit: '[unit]', featured: true,
    features: ['[Feature]', '[Feature]'], cta: { label: '[Verb + plan name]', href: '/signup?plan=business' } },
  { id: 'enterprise', name: 'Enterprise', monthly: null, annual: null, unit: null, featured: false,
    features: ['[Feature]', '[Feature]'], cta: { label: 'Talk to sales', href: '/contact' } },
];
---

<Section labelledBy="pricing-title" spacing="section">
  <Container width="content">
    <p class="eyebrow-telemetry">§ 03 // PRICING</p>
    <h2 id="pricing-title">Plans that scale with <em class="font-accent">your team</em></h2>

    <dl class="grid-hairline" aria-label="Reliability figures">
      {metrics.map((m) => (
        <div>
          <dt class="eyebrow-telemetry">{m.label}</dt>
          <dd class="tabular-nums">{m.value}</dd>
          <dd>{m.note}</dd>
        </div>
      ))}
    </dl>

    <div class="pricing" data-billing-root data-billing="monthly">
      <Cluster role="group" aria-label="Billing period">
        <button type="button" class="badge-pill" data-billing-btn="monthly" aria-pressed="true">Monthly</button>
        <button type="button" class="badge-pill" data-billing-btn="annual" aria-pressed="false">
          Annual <span class="tabular-nums">[save xx%]</span>
        </button>
      </Cluster>
      <p class="sr-status" role="status" data-billing-status></p>

      <Grid minimum="standard" gap="var(--spacing-grid)">
        {tiers.map((tier) => (
          <article class:list={['tier', tier.featured && 'surface-elevated']} aria-labelledby={`tier-${tier.id}`}>
            <div class="flow">
              <h3 id={`tier-${tier.id}`}>{tier.name}</h3>
              {tier.monthly ? (
                <p class="price">
                  <span class="tabular-nums" data-price="monthly">{tier.monthly}<span class="unit"> / {tier.unit}</span></span>
                  <span class="tabular-nums" data-price="annual">{tier.annual}<span class="unit"> / {tier.unit}, billed annually</span></span>
                </p>
              ) : (
                <p class="price">Custom pricing</p>
              )}
              <ul>
                {tier.features.map((f) => <li>{f}</li>)}
              </ul>
              <a class={tier.featured ? 'btn' : 'btn btn--secondary'} href={tier.cta.href}>{tier.cta.label}</a>
            </div>
          </article>
        ))}
      </Grid>
    </div>
  </Container>
</Section>

<style>
  @layer components {
    :where(.pricing) .price { font-size: var(--text-step-1); color: var(--color-text); }
    :where(.pricing) .unit { font-size: var(--text-step--1); color: var(--color-muted); }
    :where(.pricing) .tier { padding: var(--spacing-content); border: 1px solid var(--color-border); border-radius: var(--radius-card); }
    :where(.pricing[data-billing='monthly']) [data-price='annual'],
    :where(.pricing[data-billing='annual']) [data-price='monthly'] { display: none; }
  }
</style>

<script>
  const bindBilling = () => {
    const root = document.querySelector('[data-billing-root]');
    if (!(root instanceof HTMLElement) || root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';
    root.addEventListener('click', (event) => {
      const btn = event.target instanceof Element ? event.target.closest('[data-billing-btn]') : null;
      if (!btn || !root.contains(btn)) return;
      const mode = btn.getAttribute('data-billing-btn');
      root.dataset.billing = mode;
      root.querySelectorAll('[data-billing-btn]').forEach((el) => el.setAttribute('aria-pressed', String(el === btn)));
      const status = root.querySelector('[data-billing-status]');
      if (status) status.textContent = mode === 'annual' ? 'Showing annual prices' : 'Showing monthly prices';
    });
  };
  bindBilling();
  document.addEventListener('astro:page-load', bindBilling);
</script>
```

Notes on the markup:

- The `{' '}` rule applies: the h2 keeps `<em class="font-accent">` on the same line as the text. Adjacent inline spans in the price line have no whitespace between them, so they do not concatenate.
- `.sr-status` is a placeholder name. Use the site's visually-hidden utility if `global.css` has one.
- Without JavaScript the billing switch does nothing and annual prices stay hidden. Monthly prices still render, and Enterprise shows its custom-pricing line. If annual prices must be readable without JS, render both blocks and drop the hiding rule.
- The script binds on `astro:page-load` and uses delegated clicks on the root, so it survives ClientRouter swaps. The root is replaced on navigation, so it does not stack listeners.
- The featured tier uses `.surface-elevated` for depth. Its CTA is a solid `.btn`. The other tiers use `.btn--secondary`. CTAs are anchors because they navigate. Use a `<button>` only if a control performs an action in place.
- Labels such as "Start [plan] trial" must match a real offer. Do not use generic "Get started" or "Learn more" labels.
- No flow margins sit inside a gapped stack: `Section` and `Container` own sibling spacing, and `.flow` is used only inside each tier.

### Baseline utilities chosen and why

| Need | Utility | Why this one |
| --- | --- | --- |
| Section and rhythm | `Section labelledBy spacing="section"`, `Container width="content"` | Section owns block padding and the stack gap. Content width fits three tiers without a custom measure. |
| Heading voice | `h2` with `.font-accent` on one focal word, `.eyebrow-telemetry` label | Four-voice typography reads as a system. Keep the focal word to one or two. |
| Metrics strip | `.grid-hairline` with `.tabular-nums` | An exposed 1px ledger, not a card row. Tabular figures stop numbers shifting width as the content changes. |
| Billing switch | `.badge-pill` buttons with `aria-pressed`, inside `Cluster role="group"` | Matches the site's existing filter and toggle pattern. Cluster wraps on narrow screens without a custom flex row. |
| Tier grid | `Grid minimum="standard"` with `gap="var(--spacing-grid)"` | Intrinsic columns from the token scale. Check the 768px case: if it breaks to 2+1, use `minimum="wide"` or a documented local layout. |
| Depth on the featured tier | `.surface-elevated` | Third surface tier (`--color-elevated`) stays correct in dark mode and under contrast checks. Hand-picked shadows do not. |
| CTA hierarchy | `.btn` (featured), `.btn--secondary` (others) | One action hierarchy across the site. Keep one primary action per tier. |
| Interaction | `define:vars`-free `<script>` on `astro:page-load` | Micro-island pattern with no framework runtime. It works on the initial load and after navigation. |

Utilities I deliberately did not use:

- **`Card`**: its `.clickable-parent` makes the whole card one link. A tier has several controls, so an article with explicit CTAs is correct.
- **`.bento-grid`, `Sidebar`, `.stack-cards`**: these would break the comparison that pricing needs. They belong to other sections of the page.
- **`.ui-specimen`**: a pricing section is not a product hero.
- **`.surface-spotlight`**: reserve it for the closing conversion band.
- **`data-reveal`**: adds motion without a visitor need. Add it only if the owner asks.
- **ClientRouter, `server:defer`, actions**: not needed for a static pricing block.

### Verification before handoff

- Write the Art Direction Record, then run `npm run check:art-direction -- --require-record`.
- Run `npm run verify:fast` during edits. Before handoff, run `npm run verify`, `npm run build` and `npm run audit:html`.
- Because the section includes a client script, run headless Chromium against the built route. Listen for `pageerror` and `console.error`. Test rapid overlapping billing clicks, navigation away and back, and BFCache restore.
- Inspect rendered output at 375px, 768px and 1440px for overflow, awkward heading wraps and the tier grid breakpoint.
- Check contrast for `--color-muted` in the `.unit` text, the secondary button on its surface, and the featured tier on `--color-elevated`.
- Check keyboard order and the `aria-pressed` and status announcements for the billing switch.

## Files read

1. AGENTS.md
2. docs/site-working-rules.md
3. docs/design-framework.md
4. docs/native-composition.md
5. .agents/skills/astro-site-design/SKILL.md
6. .agents/skills/site-art-direction/SKILL.md
7. .agents/skills/astro-site-design/references/baseline-utilities.md
8. .agents/skills/astro-site-design/references/landing-page-archetypes.md
9. .agents/skills/astro-site-design/references/component-quarantine.md
