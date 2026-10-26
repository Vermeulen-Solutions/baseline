# Baseline mapping and concrete design recipes

Read the installed `src/styles/global.css` and actual component props first; installed versions and accepted site calibration beat starter samples. CSS owns production values, `AGENTS.md` owns accepted direction, CMS/typed files own copy, Penpot holds proposals and visual references. Do not create another permanent token registry.

## Token and primitive map

| Penpot role | Baseline source/implementation | Preserve during translation |
| --- | --- | --- |
| Canvas, panel, raised specimen | `--color-page`, `--color-surface`, derived `--color-elevated` / `.surface-elevated` or `.surface-glass` | Contextual dark/light derivations; do not flatten all panels into white shadow cards |
| Display, reading, accent, metadata | `--font-display`, `--font-body`, `--font-accent` / `.font-accent`, `--font-mono` / `.eyebrow-telemetry` + `.tabular-nums` | Actual served fonts/weights, source fluid sizes, meaningful metadata |
| Section/chapter | `<Section labelledBy="…" spacing="section|content|none" layout="stack|custom">` | Section owns block padding; `none` does not mean all gaps are zero |
| Measure and gutters | `<Container width="reading|content|wide">` or `breakout` | Shell applies horizontal gutters once; preserve named breakout lines |
| Repeated items | `<Grid minimum="compact|standard|wide">`, `<Sidebar>`, `<Cluster>` | Intrinsic reflow and DOM order; no invented `Grid min` prop |
| Linked editorial tile | `<Card title href description action transitionName>` | Real title/link/edit props, semantic heading level, image fit and aspect |
| Actions | Native `<a>` or `<button>` with `.btn`, `.btn--secondary`, `.btn--ghost`, `.icon-nudge` | Correct semantics, destinations, focus/hover/active/disabled and hit area |

Native example using existing contracts (imports omitted):

```astro
<Section labelledBy="updates-title">
  <Container width="content">
    <h2 id="updates-title">{title}</h2>
    <Grid minimum="standard">
      {items.map(item => <Card title={item.title} href={item.href}
        description={item.excerpt} action={item.action}
        transitionName={`post-${item.slug}`} />)}
    </Grid>
  </Container>
</Section>
```

Uniform comparison listings can legitimately use Grid; vary adjacent sections instead of forcing every list into a bento. For EmDash, forward the actual field proxies through `titleEdit`, `descriptionEdit`, `actionEdit` where applicable and preserve canonical rich text/edit boundaries. Static content stays in its typed source. Do not infer editor behavior from a Penpot component.

## Five-point recipe at 1440×900 and 390×844

1. **3-Tier Surface Depth:** Base → Surface → Elevated/Glass using semantic roles, `1px` quiet/strong rules (`--color-border`, `--color-border-strong`) and optional `--surface-highlight` inner top edge. Use one purposeful rhythm breaker such as `.grid-hairline` or a dark chapter, rather than a shadow on every rectangle. Existing brand physics may justify a named exception.
2. **4-Voice Typography:** Display tracking `-0.03em` to `-0.04em`, line-height `0.95–1.08`, balanced wrapping; body line-height `1.6–1.68` and `60–68ch` measure; selective italic `<em class="font-accent">` on one or two focal words; mono `.eyebrow-telemetry` around `0.75rem` / `0.12em` tracking and `.tabular-nums` for real dates/times. Do not invent metrics to fill telemetry. Preserve a different accepted font pairing/role treatment with explicit rationale.
3. **Grid Rhythm & Asymmetry:** Compare a `7/5` or `8/4` twelve-column `.bento-grid`, `1px` `.grid-hairline` ledger or `<Sidebar>` against repetitive equal cards. Do not place identical three-column sections consecutively without a content/brand reason. Mobile stacks in meaningful reading order; never shrink desktop twelve-column text to fit 390px.
4. **Tactile Actions:** Distinguish `.btn` primary, `.btn--secondary` and `.btn--ghost` by role; `.icon-nudge` is a small directional cue, not a second target. Show focused/hovered and disabled states where relevant, but implement native keyboard/focus behavior in Astro. Avoid nested links.
5. **Motion & Polish:** Annotate adopted `data-reveal`, `data-sticky-header`, `<Card transitionName>` and `[data-surface-toggle]` states. Card/detail names must match (`post-${slug}` plus the native title/media suffixes). Test reduced motion, ordinary navigation and zero FOUC in the browser; a canvas arrow does not verify these.

Keep the selected hero specimen concrete: `.ui-specimen` with truthful telemetry for a tool, a capability stage for a studio, or prepared photography/editorial captions for a physical brand. Do not substitute generic AI artwork. Use existing licensed assets, native icon sets and code-native shapes; generate new expressive imagery only within the user's asset scope, with provenance and the narrative metaphor.

## Fluid values and states

For each sampled canvas value, retain the source expression and scope, for example `--spacing-container: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)`. The neutral starter samples about 17.17px at 390px and 32px at 1440px (16px rem); an accepted site's expression can differ. Never overwrite it with the sampled number. Preserve `--layout-*` aliases and contextual density instead of flattening all gaps to an 8px grid. Section, Container and Grid own different relationships; do not add flow margins on top of a layout gap.

At 390px inspect equal left/right content bounds, long words, long translated headings, an absent image and touch navigation. At an intermediate width such as 768px inspect the stacking threshold and awkward near-fit text. At 1440px inspect measure, line lengths, lower sections and varied rhythm. Include real content, empty/error states for functional flows, and identify any untested state explicitly.
