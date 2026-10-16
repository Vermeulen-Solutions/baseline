# URL-to-Astro & external registry component quarantine

Use for a URL/screenshot migration or when sourcing candidate UI patterns from an external component registry (such as `21st.dev MCP`) after source inspection, content ownership, and the saved Art Direction Record. This is Stage 4.5 of `new-site-workflow`, before broad page assembly. A URL or registry snippet alone supplies neither complete content nor permission to bypass project token physics. The Issue #10 video is an inspiration supplied with the RFC, not a verified transcript or a promise of perfect conversion.

## Calibrate before multiplying pages

1. Inventory representative source elements or candidate registry blueprints at narrow/intermediate/wide widths, including states, surfaces, missing media and long/translated text. Record preserve/refine/replace decisions and asset provenance.
2. Map them to actual tokens and component APIs on `/_styleguide`: `Section labelledBy/spacing`, `Container width="reading|content|wide"` or `Container breakout` (`.content-grid` with `.content--feature|wide|full|full-safe` for editorial layouts with wide callouts/media), intrinsic `Grid minimum`, and `Card layout="stacked|horizontal"` (tuned via `--card-*` custom properties, concentric `--card-media-radius`, and `.clickable-parent`/`.focus-parent`). Add a variant only for an evidenced repeated difference. Do not invent Heading/ButtonWrapper or theme APIs from a video example.
3. Calibrate source tokens and production components through deterministic fixtures. No new client page templates or bespoke sections during this pass. Preserve the styleguide runtime guard, synthetic CMS identities and coverage manifest. Never fix component defects with specimen-only CSS.
4. Save `audit/component-calibration.md`: source references/capture metadata, component/token mapping, supported states/surfaces, asset ownership, narrow/wide and keyboard/reduced-motion results, unresolved gaps, and ready/deferred decisions. For brief-led greenfield work, use the same review of relevant primitives; document inapplicable source comparisons.
5. Pass the art-direction check and relevant component checks. Resolve material reusable-component gaps before Stage 5. This is a recorded engineering gate, not a claim that a filename prevents edits. Page implementation may reveal new needs: return to calibration, update evidence and recheck affected archetypes. Do not freeze every future component up front.

## External registry & 21st.dev transmutation protocol

When sourcing a component blueprint from `21st.dev MCP` or another external UI registry, never drop raw React/JSX or arbitrary Tailwind palette classes directly into `src/pages/`. Apply this 5-step transmutation inside `/_styleguide`:

1. **De-Reactify to Zero-JS Astro:** Strip React state hooks, `framer-motion` wrappers, and `client:*` hydration unless interactive island state is genuinely required. Convert JSX into native `.astro` markup using pure CSS transitions, `@keyframes`, native `<details>/<summary>`, or CSS checkbox/`:has()` patterns.
2. **Tokenize Hardcoded Palettes:** Replace raw Tailwind palette classes (`bg-zinc-900`, `text-slate-400`, `border-white/10`, `text-indigo-500`) with Baseline's semantic surface and ink tokens (`var(--color-page)`, `var(--color-surface)`, `var(--color-text)`, `var(--color-muted)`, `var(--color-border)`, `var(--color-action)`, and `data-surface="dark"` / `data-surface="light"`).
3. **Fluidize Typography & Spacing:** Replace rigid pixel sizes (`text-4xl`, `p-8`) with Baseline's fluid typographic steps (`--text-step--1` through `--text-step-2`, or high-contrast bridges `--text-step-3-to-1`, `--text-step-2-to-0`), spacing tokens (`--spacing-*`, `--spacing-2xl-to-md`, `--spacing-xl-to-sm`), and layout primitives (`<Section>`, `<Container>`, `<Container breakout>`, `<Grid>`, `.flow`).
4. **Bind EmDash Live Edit Proxies:** Accept and forward CMS field edit attributes (`{...edit?.title}`) on editable text nodes so the transmuted component works natively inside the EmDash Visual Editor.
5. **Verify Accessibility & Edge States:** Test keyboard focus order, `prefers-reduced-motion`, 320px/390px narrow reflow, and long localized strings on `/_styleguide` before promoting to page templates.

## Open structure, deliberate composites

Compose structural wrappers with slots, real headings and shared tokens:

```astro
<Section labelledBy="services">
  <Container width="reading">
    <div class="flow"><h2 id="services">Services</h2><p>Editorial content</p></div>
  </Container>
</Section>
```

Use parent `gap`, container padding and editorial `.flow` for rhythm. Reusable semantic composites (Card, navigation, a repeated editorial section) are valid when their content/interaction contract recurs. Avoid opaque page-sized components with hardcoded content, nested hidden containers and per-instance spacing. Keep queries separate from presentation; accept/forward the field attributes needed by actual CMS owners. Do not duplicate IDs or edit proxies for visual repetition.

## Surface-aware actions

Where the brief requires them, document three distinct action roles: primary solid action; secondary ghost/outline; and inverted contrast on a contrasting surface. Scope semantic foreground/background/border/focus tokens to the containing surface, not merely the root theme. Test text/control contrast and hover, active, focus, disabled and applicable loading states on each supported surface. An anchor navigates; a button performs an action. The starter currently has native controls, not a universal Button API or a complete dark theme. Add patterns when required and test them; do not fabricate three variants solely for the specimen page.

## Asset boundary

Downloaded site imagery belongs in `src/assets/` with provenance/native dimensions, or EmDash Media Library with canonical ownership. Use Astro Image/Picture/getImage or the documented storage-backed CMS pipeline. Do not download site content images into `public/`; reserve it for deliberate unchanged URL assets such as favicon/robots or licensed font files, with a recorded reason. Preserve existing public URLs until a scoped migration replaces them. A `src/assets/` import alone does not optimize an image, and public/remote URLs can be processed with explicit dimensions and the appropriate image-service configuration. Verify emitted image delivery, native-width limits, captions and editor behavior.

## LogoTicker contract and handoff

`LogoTicker.astro` renders trusted Astro slot markup once and repeats it server-side through Fragment; its CSS needs no script or hydration. Supply only noninteractive, ID-free `<li>` artwork/text; never raw scraped HTML, scripts/islands, links, form controls, SVG IDs or CMS edit proxies. Use standalone vector files via native images where appropriate. If logos need links/editor proxies, use the static PartnersPanel or an unduplicated list. Unique component `id`, translated region/control labels and authored dimensions remain caller responsibilities.

Motion is optional; the persistent native checkbox lets keyboard/touch users stop it, hover/focus pauses it, and reduced motion/print shows one wrapped list. Hidden duplicates are inert and aria-hidden. Check empty/single/many items, short tracks at wide widths, RTL, no-JS and reduced motion. Zero hydration does not imply zero CSS/GPU cost or guaranteed SEO.

Keep a concise handoff with decisions, changed files, checks and remaining gaps between calibration, assembly and motion work. Create/fork/archive chats only at the user's request. No mandatory Lenis, sliders or motion dependency.
