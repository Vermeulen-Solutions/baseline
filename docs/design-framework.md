# Design Framework & Token Physics

Baseline supplies fluid type/space scales and small structural layout primitives. Use fluid values for continuous sizing and intrinsic wrapping for content-driven layouts. Media queries remain useful for a deliberate change of composition; avoid accumulating spacing breakpoints to repair unclear ownership. Token mathematics describes reference values, while rendered checks establish whether actual content remains readable and usable.

## Explaining layout spacing during new-site setup

Use **layout spacing** as the plain-language description. **Spacing tokens**, **layout primitives**, **stack/grid gaps**, **fluid spacing** and **flow spacing** describe its individual techniques. This is a composition of CSS techniques, not a standard feature named “automatic spacing”. The internal `automatic-v2` identifier remains a compatibility contract for installed sites, not a user-facing product name. See [Every Layout's Stack](https://every-layout.dev/layouts/stack/) and [CSS gaps](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Gaps/Defining_gaps) for the underlying patterns.

Explain: “Sections, content groups, and grids get consistent spacing that adapts to screen size. Shared settings keep changes consistent across the site, while individual layouts can have their own spacing. Article text uses flow spacing between headings, paragraphs, lists, and media.”

During the visual-direction handoff, the agent explains shared spacing defaults. Express uses them with brief-led density (balanced if unspecified), without a separate CSS-policy question. Standard asks once about shared versus custom spacing when it is a material unresolved choice. Record the approach, spatial density, exceptions and approved/assumed status in the site's `AGENTS.md`. Existing answers and autonomous authorization take precedence; this is not a new maintenance approval gate. Profile generation itself remains noninteractive and enables the current defaults.

Custom spacing retains the current shell policy and token scales: adjust root/context aliases, primitive gap/padding controls, or use `layout="custom"` when owning display/gap. It does not select the legacy compatibility policy. Calibrate actual values on `/_styleguide` and save evidence in `audit/component-calibration.md`. Maintenance stays in CSS and the CLI; no separate settings UI or configuration store.

---

## 1. Continuous Fluid Scaling

Global type and spacing use bounded, ascending CSS `clamp()` expressions with `rem` bounds and a preferred `rem + vi` term. The CLI generator defaults to **20–80rem of viewport inline size**. At a 16px root and horizontal writing, that corresponds to 320–1280 CSS pixels. At a 20px root, it corresponds to 400–1600 CSS pixels. `vi` follows the root writing mode's inline axis; legacy `vw` follows physical viewport width ([CSS Values and Units](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths)).

Authored tokens and aesthetic presets can have different transition ranges. Their actual saturation points follow their own coefficients, with small differences from four-place rounding. Inspect `npm run design:tokens -- --json`: each `fluid.tokens` entry reports its `transitionRem`, five reference samples, changed root-font samples and zoom estimates. Equal bounds are valid constants and report a null transition range. The tables below assume a 16px root, horizontal writing, and whole-pixel rounding; they do not promise exact 20–80rem interpolation for every authored token.

### Mathematics and diagnostic contract

The generator uses linear interpolation between requested sizes and viewport endpoints, consistent with [Utopia's clamp calculation](https://utopia.fyi/blog/clamp/). Utopia is a comparison reference, with no runtime dependency or second generator. Baseline emits logical `vi` units and rounds bounds and coefficients to four decimal places. Independent tests cover both endpoints, midpoint, values outside the range, monotonicity and the rounding-error bound. Golden output hashes preserve the existing named type scales, representative spacing scales and all lane presets.

`buildFluidClamp(minRem, maxRem, minViewportRem = 20, maxViewportRem = 80)` requires finite numeric inputs, `0 < minRem <= maxRem`, and a finite domain satisfying `0 <= minViewportRem < maxViewportRem`. Reversed sizes are unsupported for both type and spacing. A permitted spacing ratio does not guarantee that every combination of base sizes is ascending; adjust the inputs when bounds validation fails. Coefficients that cannot represent growth at four decimal places fail before CSS is emitted.

The global-token validator supports a deliberately bounded grammar: positive ordered `rem` bounds and an affine `rem + vi` term (optionally inside `calc()`), or a direct viewport term. Negative intercepts, finite decimal/exponent numbers and existing `vw` values are supported; generated scales continue to use `vi`. CSS binary `+`/`-` requires surrounding whitespace. Negative slopes, zero slopes with varying bounds, malformed expressions, non-finite coefficients/domains and overflowing reference evaluations fail. General CSS math, variables and container units are outside this contract. `cqi` needs a separately documented inline-size container and matching validators/specimens before adoption; adding a substring containing `vi` cannot bypass that boundary.

The JSON report models a fixed 1280px physical viewport, 16px root and horizontal writing. At estimated 200%/400% zoom, CSS viewport size shrinks to 640/320px while the root stays 16 CSS pixels. `effectiveSizeRatio` compares the enlarged modeled size against the initial size. A ratio below the requested zoom factor produces a text-token advisory, not an audit failure or a WCAG verdict. `rootFontSamples` separately evaluate 16/20/32px roots at a fixed 1280 CSS-pixel viewport. These calculations describe assumptions; they do not reproduce text-only browser resizing, font metrics, clipping, wrapping or focus behavior.

Use `npm run test:design` and `npm run verify` for mathematical checks. Run the existing local Windows `npm run test:visual:functional` for actual Chromium 200%/400% zoom, 320px reflow, text spacing and keyboard journeys. Numerical results do not replace rendered acceptance or manual assistive-technology and text-only resize checks. No browser/screenshot suite runs in CI or production builds.

### Fluid Typography Scale

Defined in `src/styles/global.css` under Tailwind v4's `@theme`:

| Token | Formula | 320px Viewport | 1280px Viewport | Intended Role |
| :--- | :--- | :--- | :--- | :--- |
| `--text-step--1` | `clamp(0.875rem, calc(0.8333rem + 0.2083vi), 1rem)` | 14px | 16px | Captions, metadata, fine print |
| `--text-step-0` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` | 16px | 24px | Body copy, default interface text |
| `--text-step-1` | `clamp(1.25rem, calc(1rem + 1.25vi), 2rem)` | 20px | 32px | Section headings (`<h2>`), cards |
| `--text-step-2` | `clamp(1.75rem, calc(1.25rem + 2.5vi), 3.25rem)` | 28px | 52px | Page titles (`<h1>`), hero display |
| `--text-step-2-to-0` | `clamp(1rem, calc(0.25rem + 3.75vi), 3.25rem)` | 16px | 52px | High-contrast display bridge |
| `--text-step-3-to-1` | `clamp(1.25rem, calc(0.25rem + 5vi), 4.25rem)` | 20px | 68px | Dramatic hero display bridge |

All headings apply `text-wrap: balance` by default to prevent awkward single-word typographic orphans.

### Fluid Spatial Density Scale

Spacing grows proportionally with the screen, maintaining balanced visual weight from mobile phones to 4K monitors:

| Token | Formula | 320px Viewport | 1280px Viewport | Intended Role |
| :--- | :--- | :--- | :--- | :--- |
| `--spacing-content` | `clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)` | 16px | 24px | Flow margins, card inner padding |
| `--spacing-grid` | `clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem)` | 20px | 36px | Column gaps, figure margins |
| `--spacing-container`| `clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)` | 16px | 32px | Page horizontal gutter padding |
| `--spacing-section` | `clamp(3rem, calc(1rem + 10vi), 9rem)` | 48px | 144px | Vertical section breathing room |
| `--spacing-xl-to-sm` | `clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)` | 12px | 64px | High-contrast padding/gap bridge |
| `--spacing-2xl-to-md` | `clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)` | 20px | 104px | Hero/spotlight padding bridge |

`--spacing-section` interpolates between its bounds without per-breakpoint padding overrides. Check actual page pacing and use a deliberate layout breakpoint when the content requires a different composition.

---

## 2. Typographic Measures (Line Lengths)

Unconstrained line lengths make paragraphs exhausting to read on wide screens. Baseline enforces three typographic boundaries plus a gutter-safe content measure:

```css
--measure-reading: 68ch;   /* Ideal line length for body prose (~60-75 characters) */
--measure-content: 76rem;  /* Standard content container (~1216px) */
--measure-content-safe: min(var(--measure-content), calc(100% - var(--spacing-container) * 2));
--measure-wide:    88rem;  /* Wide layouts, navbars, and media galleries (~1408px) */
```

Editorial prose is constrained by its reading container; generic component paragraphs and structural lists do not receive prose indentation or media margins.

---

## 3. Structural Layout Primitives

Baseline provides small, semantic Astro layout primitives located in `src/components/`. They accept standard slots and forward custom class names.

### Cascade and layout spacing contract

Owned CSS uses `@layer base` or `@layer components`. The document establishes `theme, base, vendor, astro, components, utilities` before stylesheet loading. PhotoSwipe is imported into `vendor`; contextual defaults use `:where()` so utilities override them. `check:css` parses owned CSS, Astro styles and local imports, including static overlays. This does not certify third-party admin/editor CSS.

`SiteShell spacingPolicy="automatic-v2"` activates structural defaults. Its default is `legacy`, protecting downstream site-owned Bases. Current starter and newly generated Bases explicitly activate v2. Upgrade activation is a reviewed site migration; see [baseline updates](baseline-updates.md).

| Owner | Automatic-v2 behavior | Local control |
| --- | --- | --- |
| Section | Block padding; column stack of direct children with container gap | `spacing="section|content|none"`, `gap`, `layout="stack|custom"` |
| Ordinary Container | Centered reading/content/wide measure; column stack with content gap | `width`, `gap`, `layout="stack|custom"` |
| Breakout Container | Named-track grid; content gap, preserving subgrid propagation | `breakout`, `gap`, track classes |
| Grid | Intrinsic auto-fit columns; grid gap | `minimum="compact|standard|wide"`, `gap` |
| Site main | Horizontal page gutters once; no inferred block spacing | Compose explicit Sections |
| RichText | Editorial sibling rhythm and bounded prose presentation | Six public flow controls, or `flow={false}` |

`spacing="none"` removes Section padding only. It does not zero its child gap or affect a nested Section. Compact spacing uses the existing content scale. Each primitive initializes its local `--section-padding`, `--container-gap`, `--content-gap` or `--grid-gap` from the appropriate `--layout-*` context; local modes do not leak into nested primitives. Intentionally scoped `--layout-*` aliases inherit.

Use `layout="custom"` when the caller owns display, direction and gaps. Ordinary stack mode is appropriate for vertical siblings; change to custom before composing an unrelated row/grid. Breakout always retains its named-grid contract. Avoid adding `space-y-*` or flow margins to an already gapped group; use `gap-0` when deliberately transferring ownership.

```astro
<Section labelledBy="news" spacing="content">
  <Container width="content">
    <h2 id="news">News</h2>
    <Grid minimum="standard" gap="var(--spacing-content)">
      <!-- Repeated cards -->
    </Grid>
  </Container>
</Section>

<Section labelledBy="actions" spacing="none" layout="custom" class="flex flex-wrap gap-content">
  <h2 id="actions">Actions</h2>
  <!-- Caller-owned composition -->
</Section>

<Container breakout class="flow" data-editorial-content>
  <p>Reading track</p>
  <figure class="content--feature"><!-- Feature track --></figure>
  <figure class="content--wide"><!-- Wide track --></figure>
</Container>
```

The components preserve ordinary HTML attributes, IDs, ARIA, class/class:list and string/object styles. A `gap` prop wins over the same local custom property in passed style; a real `gap-*` utility wins over the default property through layers. Invalid enum inputs normalize to documented defaults; empty/non-string optional gap values are omitted. These normalization rules do not validate arbitrary caller CSS.

Breakout children normally occupy the reading track (`--measure-reading`). `.content--feature`, `.content--wide`, `.content--full` and `.content--full-safe` select wider named tracks. Within the padded site shell, the grid does not add another gutter; full/full-safe extend to the shell content edge. Viewport-edge bleed requires a caller-owned shell composition and rendered verification. Native image placement hints must match those actual bounds.

### `<Card />` (Turnkey Accessible Card & Concentric Radius)

`<Card>` renders a semantic `<article class="card">` and uses `.clickable-parent` on the heading's `<a>` tag so the entire card is clickable while screen readers announce only the heading as the link name. Paired with `.focus-parent` (`:focus-within:has(:focus-visible)`), keyboard navigation draws a single focus ring on the card perimeter without sticky mouse outlines. Customize cards via `--card-bg`, `--card-text`, `--card-muted`, `--card-border-color`, `--card-radius`, `--card-padding`, `--card-frame-padding`, `--card-gap`, `--card-shadow`, and automatic concentric media radius (`--card-media-radius: max(0px, calc(var(--card-radius) - var(--card-frame-padding)))`).

---

## 4. Editorial rhythm and boundaries

CMS Portable Text and native Markdown use the platform `RichText` component. It adds `.flow` and `data-editorial-content` by default:

```astro
<RichText value={entry.data.body} /> <!-- EmDash -->
<RichText><Content /></RichText>    <!-- Static native Markdown -->
```

Generic `.flow` / `[data-flow]` supplies only one-sided spacing between visible direct siblings. Handwritten prose opts into element-aware presentation with `data-editorial-content`. Its controls are `--flow-space`, `--heading-spacing`, `--list-spacing`, `--list-item-spacing`, `--figure-spacing` and `--blockquote-spacing`. Each direct child resets a private computed spacing value; a heading's value cannot leak into nested flows. Figures and quotes use leading spacing only, avoiding duplicate trailing margins or a compensation guard.

Nested list indentation, list-item rhythm and internal quote paragraphs are bounded by native CSS `@scope`. Mark composite roots `data-editorial-island`; Card, LogoTicker, PhotoGallery and Disclosure already do so. Disclosure's actual body establishes its own editorial boundary. Do not add editorial defaults to arbitrary descendants or store presentation utilities in CMS data.

`.article-body` is a margin wrapper. Public metadata/listing stacks use layout gaps and block dates, with unindented structural lists; prose lists retain indentation and markers. Each relationship has one owner.

`flow={false}` relinquishes both rhythm and editorial defaults. Without attributes it renders the content without a wrapper; supplied classes/attributes require a plain wrapper. Empty public values/slots are omitted; actual CMS edit metadata retains a selectable empty editor field. A public empty-content test is not proof of live-editor behavior: the maintained E01 rehearsal checks selection, typing, blur save, reload, publish and anonymous reload.

---

## 5. Elevation Shadows, Easing, Masks & Contextual Surfaces

- **Multi-Layer OKLCH Shadows (`@theme`):** `--shadow-sm` (3-stop), `--shadow-md` (4-stop), and `--shadow-lg` (6-stop) derived from `oklch(from var(--color-text) l c h / alpha)`.
- **Curated Easing Curves (`@theme`):** `--ease-smooth`, `--ease-snappy`, and physics-inspired `--ease-spring` (via CSS `linear()`).
- **Background & Mask Helpers:** Mark background media with `.is-bg` (its parent automatically becomes `position: relative; isolation: isolate` via `:where(:has(> .is-bg))`), and apply `.fade--bottom`, `.fade--top`, `.fade--block`, or `.fade--inline` (`--fade-amount: 25%`) for surface-independent `mask-image` fades.
- **Contextual Surface Scopes:** Apply `data-surface="dark"` or `data-surface="light"` to any section or card to remap `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-focus`, and `--color-link` together. Text links retain action ink by default, use the existing light focus ink on dark surfaces, and restore action ink on nested light surfaces. Optional `--surface-dark-link` / `--surface-light-link` aliases support calibrated overrides without changing solid-action colors.

---

## 6. Agent-First Token Calibration & WCAG Contrast Audit (`npm run design:tokens`)

Start `npm run dev` and use its **Component calibration** path on the local origin
printed by Astro. The path follows `base` and `trailingSlash`: generated static
sites default to `/_styleguide/`, whose slashless variant returns 404. EmDash's
default accepts `/_styleguide`. A release preview intentionally returns 404;
use development or `npm run fixtures:build` followed by `npm run fixtures:serve`
for calibration. Do not rebuild fixtures merely to recover from a missing slash.

`npm run verify` continues to audit the installed site's real tokens, contrast,
font loading, edit targets and source contracts after `--init-client`. Algorithm
tests use fixed neutral specimens and synthetic exception lists; profile-generator
rehearsals use a separate synthetic source. They do not restore starter exemptions
or neutral colours in the client site. The production generator still refuses
unreviewed source bytes.

Byte-bound migration fixtures use LF checkouts through `.gitattributes`, keeping
their reviewed hashes and reports unchanged on Windows. This does not rewrite
files already checked out as CRLF. If updating an older checkout, inspect
`git ls-files --eol tests/fixtures` and preserve local fixture edits before using
a fresh checkout with the new attributes. Do not rebaseline evidence hashes to
make a line-ending error pass.

Baseline treats `src/styles/global.css` as the single source of truth for tokens, backed by an automated CLI engine (`scripts/design-system.mjs`) and live Vite HMR on `/_styleguide`:

1. **List or seed a canonical Aesthetic Lane preset:**
   ```sh
   npm run design:tokens -- --list-lanes
   npm run design:tokens -- --lane editorial-paper --write
   ```
   Available presets: `neutral`, `technical-systems`, `product-led-minimalism`, `editorial-paper`, and `luminous-futurism`.
2. **Generate parametric fluid scales or WCAG-safe OKLCH brand palettes:**
   ```sh
   # Derive all --text-step-* and --spacing-* fluid clamp() tokens from mathematical ratios
   npm run design:tokens -- --type-scale major-third --space-scale 1.5 --write

   # Synthesize a complete light + [data-surface="dark"] OKLCH palette from brand hex/OKLCH seeds
   npm run design:tokens -- --seed-accent "#1B4332" --seed-canvas "#FAF8F5" --write

   # Set individual @theme, :root (--root:...), or dark-surface (--dark:...) tokens
   npm run design:tokens -- --set "--radius-card=0.5rem" --set "--root:--measure-reading=64ch" --write
   ```
3. **Run the automated token & WCAG contrast audit and record Stage 4.5 evidence:**
   ```sh
   npm run design:tokens
   npm run design:tokens -- --write-calibration
   npm run test:design
   ```
   This directly parses `src/styles/global.css`, verifies 14 WCAG contrast pairs across default, dark and restored-light contexts (including 4.5:1 text-link gates), checks fluid `clamp()` bounds, confirms `/_styleguide` swatch and `src/` consumer coverage, and writes a deterministic `## Token Calibration` section (bound to the LF-normalised SHA-256 of `src/styles/global.css`) into `audit/component-calibration.md`.

---

## 7. Optional Visual Page Builder Integration (`@perkyzz/emvb`)

Core routes, collections, and long-form articles should use Baseline's zero-JS Astro primitives (`<Section>`, `<Container>`, `<Grid>`, `<Card>`, `.flow`). When a client also needs a drag-and-drop visual editor for bespoke marketing landing pages or popups, integrate **[EmVB](https://emvb.dev/)** (`@perkyzz/emvb`) as an optional Stage 2 native plugin:

1. **Install EmVB (and optional MCP server):**
   ```sh
   npm install @perkyzz/emvb
   ```
2. **Register in `astro.config.mjs` and pass `canvasStyles`:**
   Pass your global stylesheet so the EmVB editor iframe and rendered blocks inherit Baseline's typography and CSS custom properties:
   ```js
   import { emvb } from "@perkyzz/emvb";

   // Inside emdash({ plugins: [...] }):
   emvb({
     canvasStyles: ["/src/styles/global.css"],
   })
   ```
3. **Resolve EmVB pages in `src/pages/[slug].astro`:**
   ```astro
   ---
   import { resolveEmVBPage } from "@perkyzz/emvb/runtime";
   import EmVBPage from "@perkyzz/emvb/astro/EmVBPage.astro";

   const emvb = await resolveEmVBPage(Astro);
   ---
   {emvb ? <EmVBPage page={emvb} /> : (
     <!-- Standard Astro template fallback -->
   )}
   ```
4. **Synchronize tokens via MCP (`@perkyzz/emvb-mcp`):**
   Agents can use `emvb_get_styles` and `emvb_update_styles` to align EmVB's site-styles palette and fluid typography scale with the OKLCH and `clamp()` tokens defined in `src/styles/global.css`.
## 8. Contextual spacing maintenance

CSS remains the configuration source. Four regular `:root` aliases select the existing spacing scales: `--layout-section-padding`, `--layout-container-gap`, `--layout-content-gap`, and `--layout-grid-gap`. They are not additional Tailwind scales. Regional selectors can override these aliases intentionally; primitive modes and gap props apply locally.

Preview a narrow grid change with `npm run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.75)" --json`. Add `--write` to save it. Use `--write --write-calibration` when saved-source calibration is needed. A lane or `--space-scale` operation changes broader base values and therefore affects all their consumers; use those for a deliberate global recalibration.

Unknown names/scopes, ambiguous declarations and unsupported spacing expressions fail validation. The bounded spacing report supports references, fallbacks, nonnegative px/rem/vi/vw lengths, the documented fluid clamp grammar, and proportional/additive calculations. Samples describe reference environments, not a complete CSS engine or downstream consumer inventory. Preview does not write source or calibration. The candidate passes token, font and applicable edit-proxy checks before CSS, records or starter exceptions change. Review the diff, run verification, then inspect the affected compositions at narrow and wide widths.


Choose the smallest scope that answers the change request:

| Request | Change | Example |
| --- | --- | --- |
| Whole site's spatial scale | Existing `@theme --spacing-*` values | Deliberate `--space-scale` recalibration |
| All structural grid gaps | Regular root alias | `--layout-grid-gap: calc(var(--spacing-grid) * 0.75)` |
| One region's density | Layered regional alias | `@layer components { :where(.compact-region) { --layout-content-gap: var(--spacing-content); --layout-container-gap: var(--spacing-content); } }` |
| One primitive | `gap` prop or local property | `<Container gap="0px">` |
| One explicit exception | Utility | `<Grid class="gap-0">` |
| Editorial media relationship | Prose control on its boundary | `<RichText style="--figure-spacing: 2rem" ... />` |

For day-2 requests, inspect the route and actual owner, preview the narrow CLI change, review the diff, write explicitly, run `verify`/build and inspect affected pages plus styleguide at narrow/intermediate/wide widths. Regenerate source-bound calibration only after the saved change. No database configuration, admin panel, generated CSS copy or second token store is involved. Keep the art-direction record aligned when changing a client's core visual physics.
