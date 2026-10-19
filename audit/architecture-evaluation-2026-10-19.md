# Baseline architectural evaluation — 19 October 2026

**Recommendation: retain Baseline's foundations and selectively import ten repositories' patterns.** None warrants replacing the starter. The most valuable immediate work is metadata ownership, article semantics, native disclosure composition, and reusable interaction acceptance tests. Intrinsic layout additions and fluid-scale diagnostics follow. Adopting a React/Svelte UI runtime globally would work against the public-site mission.

This is a source-code evaluation, not a Lighthouse ranking or a WCAG conformance assessment. Fourteen repositories were shallow-cloned from GitHub, pinned to commits, and inspected without installing or executing their application dependencies. Source-verified behavior is distinguished from inferred risks and proposed acceptance tests. No upstream bundle sizes or assistive-technology results were measured. “Zero component JS” means the inspected component has no authored client script; it does not mean its containing site ships no JavaScript. Snapshot provenance and inspected-file hashes are in [the source manifest](architecture-evaluation-2026-10-19.sources.json).

Baseline was inspected at `03340d1c8939f0aa845e5db84b93f47cc49ea875` with a clean initial working tree. Relevant installed versions: Astro 7.4.0, EmDash 1.3.0, Tailwind v4; local Node 24.21.0. This deliverable adds research documentation only. The proposals below are drafts, not shipped changes.

## 1. Comparative evaluation matrix

Selection means a distinct pattern merits a technical deep dive. It does **not** endorse copying a repository, its theme, its dependency graph, or every accessibility claim in its README. Framework-specific behavior engines are compared on interaction contracts; a token library is not penalized for having no SEO renderer.

| Repository | Architecture and source examined | Architectural value | Costs / limitations | Decision |
| --- | --- | --- | --- | --- |
| `incluud/accessible-astro-starter` | Astro, Tailwind 4 plus SCSS; navigation, layout, ESLint, package/workflow | Strict Astro accessibility lint configuration; explicit keyboard navigation and named landmarks | Duplicated mobile/desktop navigation; custom event lifecycle and path matching; no demonstrated public-page a11y journey gate | **Select:** lint and integration lessons |
| `arthelokyo/astrowind` | Astro 7/Tailwind 4; Hero, types, metadata, check scripts | Slots exist, typed data and substantial SEO setup; genuinely low framework overhead | Hero owns heading, CTA rendering, image treatment and section spacing; raw HTML string channels; hard-coded header compensation | **Reject as Baseline component architecture** |
| `BryanHogan/astro-starter-template` | Lean Astro; Head, HeaderNavigation, package | Explicit image alternatives, article dates, canonical and schema defaults; little dependency overhead | Head assumes person/publisher identity and PNG dimensions; direct JSON serialization; navigation tied to fixed-header styling; no root test/lint script | **Screened, no additional deep dive:** useful examples, overlapping SEO value |
| `devgelo-labs/astro-starter-pro` | Astro 6/Tailwind 4; Seo, Schema, package, lint config | Clear separation of metadata and structured-data components; Vitest/Husky tools declared | `BreadcrumbList` accepted but not implemented; `og:url` uses request URL while canonical uses configured origin; raw JSON serialization; tool presence is not test coverage | **Reject current SEO implementation as reference** |
| `surjithctly/astroship` | Astro 7/Tailwind 4; Hero, navbar dependency, package | Simple static output; native Astro image processing | Hero contains site copy, assets, actions and a `main` landmark; responsive class styling defines the template; navbar behavior delegated to a package outside this audit | **Reject as foundation** |
| `satnaing/astro-paper` | Astro content blog; Layout/PostLayout, Header, PNG endpoint, CI | Collection-driven OG generation, publication filtering, metadata composition and locale/base-path care | Duplicate `og:type` through head slot; raw JSON-LD; forced smooth skip scrolling; theme is blog-specific | **Select:** static content-to-OG pipeline |
| `incluud/accessible-astro-components` | Native Astro components; AccordionItem, Modal, SkipLink, build CI | Native details/dialog, slotted body, per-modal cancellation cleanup | Redundant manual focus trap; hard-coded colors; global first-match skip selector; build matrix does not certify interactions | **Select:** native semantics plus limitations |
| `radix-ui/primitives` | React headless packages; Dialog, FocusScope, DismissableLayer, tests/CI | Composable behavior layers; nested focus lifecycle; broken IDREF regression tests and axe | React/hydration plus focus, scroll, portal and layer dependencies; no public-site SEO or token system | **Select:** behavioral oracle and test contracts |
| `adobe/react-spectrum` | React Aria hooks/components; dialog, overlay, focus, form and browser tests | Native versus ARIA validation policy; server-error recovery; browser/AT-specific focus handling | Extensive framework/runtime surface and browser workarounds; styled Spectrum is a separate adoption decision | **Select:** form recovery and focus policy |
| `trys/utopia-core` | Pure TS math; clamp/type/space generators and tests | Explicit viewport/container unit model, paired scales, resize-risk diagnostic | Assumes 16px rem conversion; default `vw`; old snapshot; no full CSS/a11y validator | **Select:** offline numerical reference |
| `madrilene/eleventy-excellent` | Eleventy, CUBE/Every Layout compositions, generated CSS, Tailwind 3 utilities | Sidebar/Cluster/Repel composition; generated page audit inventory | Tailwind 3 pipeline; grid minimum can overflow narrow hosts; index-coupled gallery dialogs; shell sleeps for audit server readiness | **Select:** intrinsic layout and audit inventory |
| `withastro/starlight` | Astro docs framework; PageFrame, Head, canonical utilities, tests/CI | Native popover navigation; explicit head merge/precedence; URL policy and regression suites | Docs shell fixed widths/heights; navigation enhancement inerts main/skip regions; not a generic client-site theme | **Select:** metadata policy and native navigation benchmark |
| `huntabyte/bits-ui` | Svelte 5 headless components; Dialog, Accordion and browser tests | Find-in-page reveal handling; nested overlays, shadow roots, focus restore and teardown tests | Svelte runtime needed; advanced layers inappropriate for simple HTML disclosures | **Select:** searchability and lifecycle regressions |
| `haydenbleasel/next-forge` | Next.js/Turborepo monorepo; SEO serializer/metadata, design-system manifest | Typed structured-data boundary and explicit HTML-safe serialization | Broad app/auth/observability dependencies, deployment identity assumptions, overwrite-oriented UI update script | **Select only the serializer boundary; reject whole-stack adoption** |

### What Baseline already does better

[`Section`, `Container`, and `Grid`](../src/components/) already separate structure from content. `global.css` uses `repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr))`, which is safer in a narrow host than Excellent's unconstrained grid minimum. Retain it. Baseline's `Card` is a **semantic composite**, not a pure structural primitive: its title/image/action props coexist with media/metadata/body slots and caller-owned attribute bags. Quarantine should preserve that documented distinction rather than treating prop count alone as a defect.

The [token CLI](../scripts/design-system.mjs) already computes fluid scales and light/dark contrast pairs. OKLCH authoring is not a separate perceptual accessibility standard: the inspected contrast function converts colors to relative luminance and computes a WCAG contrast ratio. Keep that distinction explicit; do not describe OKLCH or an interpolation check as proof of AA.

The [existing local browser suite](../tests/visual/behavior.spec.mjs) verifies actual ticker motion, native stop/pause, RTL geometry, no-JS controls/gallery navigation, reduced motion, print, 320px text spacing and actual Chromium 200%/400% zoom. It also tests an illustrative error-summary link. Proposals should extend this investment, not introduce a competing screenshot stack. Generated static profiles currently have their own bounded verification and manual-browser contract; they do not automatically inherit this EmDash fixture harness.

### Immediate Baseline gaps, observed in source

| Finding | Evidence | Consequence / confidence |
| --- | --- | --- |
| Metadata emitted by two owners | [SiteShell](../src/layouts/SiteShell.astro) emits description/canonical; [Base](../src/layouts/Base.astro) inserts `EmDashHead`, which emits those same tags | Duplicate description when populated; duplicate canonical on content routes supplying canonical. EmDash's internal dedup cannot remove shell markup. Source-established; no rendered count was collected in this evaluation. |
| All CMS routes explicitly use `website` | `Base.astro` passes `pageType: "website"`; [post route](../src/pages/posts/[slug].astro) supplies content identity but no article metadata | Overrides EmDash's content/article default, selecting website OG/schema behavior. Source-established. |
| Canonical origin depends on incoming host | CMS post/page routes pass `Astro.url.origin` to `getSeoMeta` | Preview/alternate hosts can leak into canonical defaults. Use configured public settings URL, with an intentional local fallback. |
| Static metadata is minimal | [Static Base](../profiles/static/project/src/layouts/Base.astro) supplies title, description, canonical and language | No shared OG/Twitter/article schema contract in that wrapper. This is a feature gap, not evidence that pages cannot be indexed. |
| `lint` is script syntax checking | [package.json](../package.json), [syntax checker](../scripts/check-script-syntax.mjs) | No general Astro template accessibility lint gate under that command. Existing structural tests remain valuable. |
| Form recovery is split across layers | [FormError](../src/components/FormError.astro), [recovery tests](../tests/form-recovery.test.mjs), illustrative browser case | Server recovery unit coverage and error-link focus exist; end-to-end invalid-submit → corrected-submit → result behavior is not established by those tests. |

Installed EmDash source and the [official SEO guide](https://docs.emdashcms.com/guides/seo/) confirm that `EmDashHead` handles metadata, editor SEO overlays, plugin precedence and JSON-LD; it deliberately leaves document `<title>` to the template. Avoid adding a second generic SEO renderer to the CMS branch.

### Runtime footprint: what the inspected source establishes

| Selected source | Browser work established by source | Adoption boundary |
| --- | --- | --- |
| Accessible Astro Starter | Vanilla navigation/toggle scripts, ClientRouter and launcher integration | Import lint policy; do not inherit the site runtime |
| Accessible Astro Components | AccordionItem has no client script; Modal and SkipLink have scripts | Disclosure can remain zero-script; modal needs only native opening/closing enhancement |
| AstroPaper | OG generation runs at build/server; header/theme/router scripts run in browser | Social image generation itself needs zero browser JS |
| Radix | React plus focus, portal, scroll and dismissal modules | Optional existing complex island only |
| React Aria | React hooks and focus/overlay/form behavior | Translate tested contracts; avoid global hydration |
| Utopia | Generation is offline math; emitted CSS has no client library | Zero browser JS for token output |
| Eleventy Excellent | Composition CSS has no JS; gallery/theme enhancements have scripts | Import CSS relationships, not the gallery controller |
| Starlight | Toggle is native HTML; PageFrame adds popover/media/inert listeners | Count the complete navigation enhancement, not just the button |
| Bits UI | Svelte state and interaction layers | Test reference; no new Svelte dependency by default |
| Next Forge | JsonLd emits inert data on the server; interactive design-system parts use client React | Serializer adds no interaction JS |

Exact minified/gzipped route transfer sizes require building a specified route with pinned dependencies, then separating shared runtime, component code and optional islands. Those measurements were not performed here; source length and package download size would be misleading substitutes. A follow-up implementation PR should measure the production route's actual JS requests with cache disabled before/after, recording raw and compressed transfer, hydration and deferred modules. Set any numeric budget from that measured fixture, not from an upstream README.

## 2. Ruthless rejections and anti-patterns

**AstroWind's Hero is not sufficiently structural for Baseline.** It does have named slots, so “no composability” would be an unfair criticism. The problem is that slots are rendered into strings and fed through owned heading/action/image markup. The component also compensates for a particular header with `md:-mt-[76px]` and `md:pt-[76px]`. Those assumptions become layout debt across brands and CMS field wrappers. Reject the widget API and header-coupled geometry; keep any independently justified URL/metadata idea. Evidence: [Hero source](https://github.com/arthelokyo/astrowind/blob/14e1a691f80548dcc36370847b1a02c0d0b12821/src/components/widgets/Hero.astro).

**Astroship is a marketing composition, not a reusable Hero primitive.** Its hero imports an astronaut image, contains the marketing copy, defines actions and uses `main` as its root. That is fine for its own page, but slotting it into Baseline's existing `main` risks duplicated landmarks. Rebuild the composition with Section/Container/Grid rather than adding more Hero props. Evidence: [hero source](https://github.com/surjithctly/astroship/blob/da1272bb141abf42a3435d81774df92f0427ad57/src/components/hero.astro).

**Starter Pro's API promises more than it implements.** `Schema.astro` accepts `BreadcrumbList`, but branches only for WebSite and BlogPosting, leaving `{}` for breadcrumbs. Its `Seo.astro` can produce differing canonical and social URLs. Do not adopt API shape as evidence of correctness. Evidence: [Schema](https://github.com/devgelo-labs/astro-starter-pro/blob/a16f7155ba78460e96c73987a8c544d2e0ce8e6c/src/components/seo/Schema.astro), [Seo](https://github.com/devgelo-labs/astro-starter-pro/blob/a16f7155ba78460e96c73987a8c544d2e0ce8e6c/src/components/seo/Seo.astro).

**Bryan Hogan's starter is not bloated and should not be labeled a bad template.** It is excluded from the deep-dive set because its transferable head patterns overlap the selected sources. Do not import automatic trailing-slash removal without matching hosting policy, assume every site is authored/published by a Person, or label arbitrary OG images as PNG/1200×630. Its raw JSON-LD path also needs the same serialization boundary discussed below. Evidence: [Head](https://github.com/BryanHogan/astro-starter-template/blob/25d8ec849133eded43f0b4a387af649ee973a947/src/components/Head.astro).

**Reject whole-stack Next Forge and global headless-runtime adoption.** Next Forge's design-system package includes auth and observability workspaces alongside UI, and `bump-ui` can overwrite the entire component inventory. That model does not fit a bounded shared-file baseline with client-calibrated tokens. Radix, React Aria and Bits are excellent behavior references; adding their complete runtimes to every brochure page would add unnecessary dependencies. A complex existing React island may justify one of them locally. Evidence: [design-system dependencies](https://github.com/haydenbleasel/next-forge/blob/f189de79ceef7c1ef69f61f12e272f99b4cdb699/packages/design-system/package.json), [update scripts](https://github.com/haydenbleasel/next-forge/blob/f189de79ceef7c1ef69f61f12e272f99b4cdb699/package.json).

**Reject unsafe pattern transfer even from selected sources.** Direct `set:html={JSON.stringify(editorData)}` does not escape an HTML script terminator. Native-dialog plus a naïve first/last focusable selector duplicates browser work and misses hidden elements. Rebinding document listeners on every route transition without teardown can accumulate callbacks. A Lighthouse score, axe pass, Storybook story, dependency name or package `test` script is not a keyboard journey. A no-JS story must include mobile navigation, not only static text.

## 3. Detailed technical deep dives

### A. Accessible Astro Starter — lint the authoring surface

**Architectural strength.** It makes accessibility rules part of source authoring rather than relying on final-page scoring. The high-value seam is its [ESLint configuration](https://github.com/incluud/accessible-astro-starter/blob/3fc28ca1a2f91ec618a0f788ba392041d4855540/eslint.config.js), not its complete theme.

```js
...astro.configs['flat/recommended'],
...astro.configs['flat/jsx-a11y-strict'],
```

**Interaction source.** [Navigation](https://github.com/incluud/accessible-astro-starter/blob/3fc28ca1a2f91ec618a0f788ba392041d4855540/src/components/Navigation.astro) uses labelled desktop/mobile nav elements, dropdown `aria-expanded` updates, click listeners, ArrowLeft/Right for top-level movement, ArrowUp/Down within dropdowns, Escape and Tab closure. There is no modal focus trap. The mobile toggle updates its accessible label and expansion state in [ResponsiveToggle](https://github.com/incluud/accessible-astro-starter/blob/3fc28ca1a2f91ec618a0f788ba392041d4855540/src/components/ResponsiveToggle.astro). However, the keydown listener is attached to the first nav list, while dropdown click handlers use a document-wide query. Do not assume identical mobile keyboard behavior. `event.target` in a button click handler can be an inner SVG; use `currentTarget` or delegated `closest()` when adapting. Mobile navigation is CSS-hidden until script toggles it, so its no-JS usefulness requires separate examination.

**SEO.** [DefaultLayout](https://github.com/incluud/accessible-astro-starter/blob/3fc28ca1a2f91ec618a0f788ba392041d4855540/src/layouts/DefaultLayout.astro) resolves social image URLs against `Astro.site` and configures OG/Twitter through `astro-seo`; its canonical default is the incoming full URL. Tracking queries and preview origins should not become Baseline defaults. It also enables ClientRouter; Baseline need not inherit that lifecycle merely to gain metadata.

**Tokens/layout.** Tailwind plus SCSS/global theme variables offers flexibility but duplicates Baseline's token authority. PageHeader/navigation styling remains a theme layer. Retain Baseline's single `@theme` and open structural slots.

**Verification.** Strict lint configuration is present, but root scripts do not wire an ESLint command into public-page CI acceptance. CLI e2e scripts test the generator, not visitor keyboard journeys. Do not report an enforced a11y pipeline from the config alone.

**Baseline translation.** Add a separately named `lint:templates`, integrate it into `verify`, and preserve script syntax checking. Map only genuine semantic components to lint rules; do not invent blanket `Hero`/`Card` mappings that hide generated markup. Include both static profile manifests and fixture specimens.

### B. Accessible Astro Components — native semantics with a smaller API

**Architectural strength and source.** [AccordionItem](https://github.com/incluud/accessible-astro-components/blob/0ed04fb813b4de7ae626de6aa06c110807a3c43a/src/components/accordion/AccordionItem.astro) uses native details and a slotted body:

```astro
<details class:list={['wrapper', `variant-${variant}`]} name={name} {...open ? { open } : {}}>
```

The summary owns the title and heading component; body content remains slotted. Native activation supplies keyboard toggle/expanded semantics without authored JS. The shared `name` enables exclusive groups where supported. Arrow-key accordion navigation is not implemented and is not required for a simple details disclosure. Avoid redundant hand-synchronized `aria-expanded` on summary. Its advanced `::details-content` animation should be optional; confirm reduced-motion behavior because not every transition is inside the no-preference guard.

**Dialogs and skip links.** [Modal](https://github.com/incluud/accessible-astro-components/blob/0ed04fb813b4de7ae626de6aa06c110807a3c43a/src/components/modal/Modal.astro) uses `aria-labelledby`, an autofocus title, `showModal()` and native close. A WeakMap of AbortControllers scopes active listeners and closes cleanup on all close paths. It nevertheless adds a document keydown trap using a selector that filters disabled but not all hidden/non-tabbable candidates. Native modal behavior already supplies background inertness. Setup also binds on `astro:after-swap`; active-modal cleanup is stronger than permanent trigger-listener lifecycle. [SkipLink](https://github.com/incluud/accessible-astro-components/blob/0ed04fb813b4de7ae626de6aa06c110807a3c43a/src/components/skiplink/SkipLink.astro) handles Enter and focuses a target, but queries the first `.skip-link a`; multiple instances are not reliably scoped.

**SEO/layout.** These primitives have no SEO system. Disclosure text remains server-rendered; a UI accordion must not automatically emit FAQ schema. Hard-coded light-dark HSL colors, sizes and title props should become Baseline role tokens and a summary slot. Native heading-in-summary announcements still need browser/AT checks.

**Verification.** [CI](https://github.com/incluud/accessible-astro-components/blob/0ed04fb813b4de7ae626de6aa06c110807a3c43a/.github/workflows/ci.yml) builds an Astro/Node compatibility matrix and guards published package contents. It is not an interaction test suite.

**Baseline translation.** Start with a zero-script `Disclosure.astro`; add a native `Dialog.astro` only when a real modal use case exists. Keep public HTML slots and CMS field attributes caller-owned. Borrow cancellation discipline, not the redundant focus loop or theme values.

### C. AstroPaper — derive social assets from the publication inventory

**Architectural strength.** Its [per-post PNG endpoint](https://github.com/satnaing/astro-paper/blob/35cfa7fbe0b897306d27670d3819e55d5205f3dd/src/pages/posts/[...slug]/index.png.ts) derives asset paths from the same content inventory as article routes:

```ts
const posts = await getCollection("posts").then(p =>
  p.filter(({ data }) => !data.draft && !data.ogImage)
);
```

`getStaticPaths()` passes entries as props; GET renders Satori SVG and converts with Sharp to a 1200×630 PNG. Explicit editorial images skip generation. This is server/build work, not a client React island. Experimental font helpers and font-file fetching are version-specific; Baseline should prefer known licensed local font inputs and test them against installed Astro.

**SEO.** [Layout](https://github.com/satnaing/astro-paper/blob/35cfa7fbe0b897306d27670d3819e55d5205f3dd/src/layouts/Layout.astro) centralizes absolute canonical/social URLs and RSS links. [PostLayout](https://github.com/satnaing/astro-paper/blob/35cfa7fbe0b897306d27670d3819e55d5205f3dd/src/layouts/PostLayout.astro) adds article dates and BlogPosting JSON-LD through a head slot. It also adds `og:type=article` after the parent already emits `website`, so this is composition without deduplication. Its JSON image can be omitted even when Layout resolves a fallback social image. Adopt a resolved metadata model instead of separate fallback paths.

**Interactions.** [Header](https://github.com/satnaing/astro-paper/blob/35cfa7fbe0b897306d27670d3819e55d5205f3dd/src/components/Header.astro) uses a button with `aria-controls` and `aria-expanded` and toggles visibility/icon classes on click; it does not implement a modal focus trap or Escape close. The skip handler explicitly focuses `main`, temporarily adds tabindex and then calls `scrollIntoView({ behavior: "smooth" })`. That explicit JS behavior needs a reduced-motion policy. Baseline already has a permanently focusable main; test native fragment focus before adding script.

**Tokens/layout.** Tailwind v4 semantic colors are useful; monospace identity and blog widths are theme decisions. They do not improve Baseline's existing fluid scale or layout primitives.

**Verification and translation.** [CI](https://github.com/satnaing/astro-paper/blob/35cfa7fbe0b897306d27670d3819e55d5205f3dd/.github/workflows/ci.yml) runs lint, formatting and build; build includes Astro checking and Pagefind. No foundational browser journeys were found in that configuration. Add optional build-time OG generation to static profiles; use revision-keyed generation/caching for live CMS content. Never prerender changing CMS posts merely to reuse this route. Keep content images in assets/media, not copied into public.

### D. Radix Primitives — behavior layers and adversarial tests

**Architectural strength.** [Dialog](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/dialog/src/dialog.tsx) separates trigger, portal, overlay, content, title and description; its behavior implementation composes FocusScope and DismissableLayer rather than a monolithic styled dialog.

```tsx
trapFocus={context.open}
disableOutsidePointerEvents={context.open}
```

Trigger uses `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` only while referenced content exists. Content uses `role="dialog"`, title/description ID references, and background hiding via `hideOthers`; do not assume this version's content relies on `aria-modal`. Modal close autofocus returns to the trigger. Nonmodal close has a different policy after outside interaction.

**Keyboard/event details.** [FocusScope](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/focus-scope/src/focus-scope.tsx) uses focusin/focusout listeners, a mutation observer when focused content disappears, mount/unmount autofocus events, and nested scope pause/resume. [DismissableLayer](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/dismissable-layer/src/dismissable-layer.tsx) coordinates outside pointer/focus behavior and top-layer Escape handling. Dialog prevents right-click dismiss and accounts for Safari focus after pointer interaction. This is substantially more than first/last Tab wrapping.

**SEO and layout.** There is no canonical/schema pipeline and no fluid token system here. Unstyled data-state/attribute contracts can map to Baseline roles, but React primitives require React execution and associated focus/scroll/portal code. No bundle byte figure was measured. Baseline already uses React for CMS integration; that does not make public React hydration free.

**Verification.** [Dialog tests](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/dialog/src/dialog.test.tsx) combine axe with focus, Escape, missing ID targets, and label/description reference tests. FocusScope has separate regressions. [CI](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/.github/workflows/build.yml) runs unit and Playwright suites. The selected test file is primarily component integration testing, not a complete website journey.

**Baseline translation.** Translate invariants into native-dialog browser tests: real labels resolve, focus enters, Tab/Shift+Tab cannot reach background, Escape closes only the intended layer, focus returns to the actual invoker, and deleting focused content does not escape confinement. Use Radix directly only inside justified complex React islands; do not reproduce its internals as a home-grown generic engine.

### E. React Spectrum / React Aria — forms are state transitions

**Architectural strength.** The unstyled React Aria layer separates accessibility behavior from Spectrum visual design. [Form tests](https://github.com/adobe/react-spectrum/blob/261344335e54265b2d02dc57a43b911a718de707/packages/react-aria-components/test/Form.test.js) exercise server-error state rather than only form snapshots:

```js
expect(input.validity.valid).toBe(false);
expect(document.activeElement).toBe(input);
```

The scenario submits, binds server errors through `aria-describedby`, checks focus/validity, submits again to prove errors persist, then edits and blurs to clear the relevant error. Native validation uses `required` without redundant `aria-required`; an explicit ARIA-validation mode instead uses novalidate and ARIA. This is useful policy for Baseline's bounded server recovery.

**Interactions.** [useDialog](https://github.com/adobe/react-spectrum/blob/261344335e54265b2d02dc57a43b911a718de707/packages/react-aria/src/dialog/useDialog.ts) returns dialog/title/content attribute contracts, focuses the dialog if no child already owns focus, coordinates containment and includes an iOS VoiceOver delayed refocus workaround. It deliberately does not blindly use `aria-modal` because of a documented Safari/iframe interaction. [useModalOverlay](https://github.com/adobe/react-spectrum/blob/261344335e54265b2d02dc57a43b911a718de707/packages/react-aria/src/overlays/useModalOverlay.ts) combines overlay handling, scroll prevention, focus containment and outside hiding/inertness. [useOverlay](https://github.com/adobe/react-spectrum/blob/261344335e54265b2d02dc57a43b911a718de707/packages/react-aria/src/overlays/useOverlay.ts) restricts close handling to the topmost visible overlay and supports Escape/outside/blur policies. These are React hooks, not zero-JS HTML.

**SEO/tokens/layout.** No public SEO pipeline exists in these examined modules. Hook/component styling is orthogonal; adopting Spectrum's brand tokens would conflict with multi-brand authority. Keep Baseline labels, field error markup and CSS roles, using behavior contracts as reference.

**Verification.** [Browser dialog test](https://github.com/adobe/react-spectrum/blob/261344335e54265b2d02dc57a43b911a718de707/packages/react-aria-components/test/Dialog.browser.test.tsx) parameterizes mouse and keyboard opening and checks focus containment. Form.test is component integration coverage, not proof of a live HTTP submit. Browser testing has a dedicated Vitest/Playwright configuration; broad upstream infrastructure is larger than Baseline needs.

**Baseline translation.** Extend existing FormError and recovery helpers with a synthetic local journey: invalid server response → retained allowlisted values → summary/field focus → correction → successful response. Test stale error persistence, expired state and second submission. Static profiles need an explicit external/service handler contract; they cannot gain server session recovery just by importing markup.

### F. Utopia Core — numerical reference, not a second token authority

**Architectural strength and code.** [Generator](https://github.com/trys/utopia-core/blob/135c05142be271f1906897b61437d87465c09ec2/src/index.ts) calculates the line between explicit size/width endpoints, then expresses it as a clamp. It distinguishes viewport inline (`vi`), viewport width (`vw`), and container (`cqi`) output. A small source excerpt:

```ts
const intersection = (-1 * (minWidth / divider)) * slope + (minSize / divider);
```

Type scales interpolate base size/ratio; space scales include one-up/custom pairs. Reversed size endpoints are handled. `checkWCAG` estimates ranges where browser zoom may not yield sufficient text enlargement. It is a diagnostic based on a mathematical browser model, not a conformance verdict.

**Tokens/layout.** Baseline already implements the same endpoint principle. Keep its canonical lane presets and token names. Useful additions are explicit reference unit metadata and endpoint/midpoint/monotonicity tests, including negative slopes where intentionally supported. Utopia divides by 16 for rem output and defaults to `vw`; neither default should silently overwrite Baseline's assumptions. A `cqi` token requires a defined ancestor query container; otherwise the intended component sizing reference is missing. Baseline's current fluid validator expects viewport units, so adding container-relative tokens also requires a scoped validator policy.

**Interactions and SEO.** No UI interaction, ARIA, canonical or JSON-LD system is provided. Generated CSS requires no client runtime. Typography still needs actual text-resize, zoom/reflow and browser tests.

**Verification.** [Tests](https://github.com/trys/utopia-core/blob/135c05142be271f1906897b61437d87465c09ec2/src/index.test.ts) include exact generated expressions for rem/px/vi/cqi and scale combinations. `prepublishOnly` runs Vitest and tsc; no checked-in browser acceptance or comprehensive WCAG gate was observed. Age alone does not invalidate arithmetic, but treat this pinned implementation as reference material rather than an automatic new dependency.

**Baseline translation.** Add independent mathematical checks to the token test suite and retain local zoom checks. Do not migrate to Utopia's labels, install a second Tailwind configuration, or replace contrast checks with its resize warning.

### G. Eleventy Excellent — small intrinsic relationships

**Architectural strength.** [Sidebar](https://github.com/madrilene/eleventy-excellent/blob/69f0948c6d3c884e5b4e53a94f7893668a83d539/src/assets/css/global/compositions/sidebar.css) implements content/sidebar stacking through flex wrapping and minimum content share:

```css
flex-basis: 0;
flex-grow: 999;
min-inline-size: var(--sidebar-content-min-width, 50%);
```

[Cluster](https://github.com/madrilene/eleventy-excellent/blob/69f0948c6d3c884e5b4e53a94f7893668a83d539/src/assets/css/global/compositions/cluster.css) wraps intrinsic children with a configurable gap/alignment. Wrapper, Repel and Flow are similarly relationships rather than client page sections. This is a stronger match for Baseline than any marketing Hero. CUBE's separation of composition, utility, block and exception is compatible with Tailwind utilities plus semantic Astro primitives; importing Tailwind 3 is unnecessary.

**Tokens/layout.** Design tokens are stored as data and generated into CSS with a clamp helper. Keep `@theme` as Baseline's authoritative output. Add Cluster/Sidebar only for demonstrated use cases. Preserve DOM reading order; an option called `rtl` to swap a sidebar is not a localization strategy. Excellent's grid minimum lacks Baseline's `min(100%, …)` containment guard. Do not regress that protection or import experimental masonry as a foundation requirement.

**Interactions.** [Gallery dialog script](https://github.com/madrilene/eleventy-excellent/blob/69f0948c6d3c884e5b4e53a94f7893668a83d539/src/assets/scripts/bundle/dialog.js) uses native dialogs with click open/close, arrow/swipe gallery movement and light dismiss. It matches opener and modal by list index, not a stable ID relationship. Treat that as an example to avoid for editor-reordered collections. Native showModal supplies modal behavior; this script does not establish a general focus policy or no-JS fallback for the gallery.

**SEO.** [Metadata](https://github.com/madrilene/eleventy-excellent/blob/69f0948c6d3c884e5b4e53a94f7893668a83d539/src/_includes/head/meta-info.njk) derives description/canonical/OG from site/page data and a generated image path. Twitter-specific tags were deliberately removed. [BlogPosting](https://github.com/madrilene/eleventy-excellent/blob/69f0948c6d3c884e5b4e53a94f7893668a83d539/src/_includes/schemas/BlogPosting.njk) is manually interpolated JSON: do not transfer it as a safe serialization method for editorial strings.

**Verification and translation.** [Audit config generator](https://github.com/madrilene/eleventy-excellent/blob/69f0948c6d3c884e5b4e53a94f7893668a83d539/src/common/pa11y.njk) derives URL coverage from publication collections or explicit paths, with per-page/global ignores. This is a useful inventory mechanism, but no real keyboard sequence is specified. Its shell-script sleeps and background process launch are unsuitable for Baseline's Windows owned-server harness. Use existing readiness/cleanup control; make ignores narrow and reviewable. Keep browser audits local under current policy.

### H. Starlight — native navigation and deterministic head policy

**Architectural strength.** [MobileMenuToggle](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/src/components/MobileMenuToggle.astro) delegates opening to native popover markup:

```astro
<button popovertarget="starlight__sidebar" class="sl-menu-button sl-flex md:sl-hidden print:hidden">
```

This is **zero authored JS in the toggle**, not zero JS for navigation. [PageFrame](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/src/components/PageFrame.astro) supplies a custom element, a matchMedia change listener to remove popover behavior on desktop, and a toggle listener that marks main/skip-link regions inert. The header remains active. Its `popover="auto"` behavior supplies native light dismiss/Escape, but popover alone is nonmodal and supplies no focus trap. This hybrid is a useful benchmark, not a drop-in generalized modal drawer. Teardown and restoration of previously inert state should be explicit in a Baseline adaptation.

**Skip link and layout.** [SkipLink](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/src/components/SkipLink.astro) is a translated native fragment anchor, with focus-visible placement. PageFrame composes header/sidebar/default slots, but its docs-specific fixed header/sidebar dimensions should remain upstream. Keep Baseline's Section/Container/flow interfaces.

**SEO and code.** [Head utility](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/src/utils/head.ts) parses defaults and merges site/page heads with explicit replacement keys:

```ts
return [...oldHead.filter((tag) => !hasTag(newHead, tag)), ...newHead];
```

It deduplicates title, metadata by name/property/http-equiv, and canonical/sitemap links, then orders tags. [Canonical utility](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/src/utils/canonical.ts) respects build format and trailingSlash. Locale alternates are generated from configured locales; Baseline should instead link actually published translations for CMS content. The inspected utility is not a complete JSON-LD/OG-image generator, and not every repeated tag should be globally collapsed (multiple OG images may be intentional).

**Verification.** [Head tests](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/__tests__/head/head.test.ts), canonical/i18n tests, and [browser tests](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/packages/starlight/__e2e__/basics.test.ts) verify real framework behavior, including keyboard tab-component selection and persistence. [CI](https://github.com/withastro/starlight/blob/b77aca9047de0f1f5213559def6ebd70c6158770/.github/workflows/ci.yml) separates unit, type, lint, builds and Windows/Linux e2e. Do not transplant its browser CI into Baseline's local-only policy.

**Baseline translation.** Adopt explicit single-owner metadata and URL tests. Evaluate a nonmodal native popover for compact navigation, with visible no-JS fallback for unsupported browsers. Use a true native modal dialog for a deliberately modal drawer. The semantics must match the interaction model.

### I. Bits UI — searchability, teardown, and browser regressions

**Architectural strength.** [Accordion state](https://github.com/huntabyte/bits-ui/blob/fd10616a873a8e6e3652e31dcc88c5c2f155a9e2/packages/bits-ui/src/lib/bits/accordion/accordion.svelte.ts) can retain closed panels as `hidden="until-found"` and open the state when the browser reveals a match:

```ts
const unsubBeforeMatch = on(node, "beforematch", handleBeforeMatch);
```

This solves a discovery problem that an accessibility tree snapshot cannot catch. The hook is installed/removed through state lifecycle and synchronizes open state, rather than merely unhiding a DOM node. Opening is deferred with requestAnimationFrame so search highlighting can finish; cleanup cancels a pending frame and checks destruction before state access. The trigger has expansion/disabled relationships; directional navigation uses a roving-focus helper. Baseline's native details disclosure should be tested for find-in-page and hash reveal before adding an equivalent custom engine.

**Dialogs.** [Dialog content](https://github.com/huntabyte/bits-ui/blob/fd10616a873a8e6e3652e31dcc88c5c2f155a9e2/packages/bits-ui/src/lib/bits/dialog/components/dialog-content.svelte) composes FocusScope, EscapeLayer, DismissibleLayer, TextSelectionLayer and ScrollLock. State supplies role, aria-modal and title/description IDs. Open-state gates focus scope and dismissal behavior; callbacks can prevent default handling. This is Svelte client runtime, not server-only snippets.

**SEO/tokens/layout.** No canonical/schema/OG pipeline exists here. Retaining searchable HTML is a usability property, not a guarantee of indexing or rich-result eligibility. Headless parts and state attributes fit token-bound styling, but no reason exists to import Svelte into Baseline solely to get an accordion.

**Verification.** [Dialog browser tests](https://github.com/huntabyte/bits-ui/blob/fd10616a873a8e6e3652e31dcc88c5c2f155a9e2/tests/src/tests/dialog/dialog.browser.test.ts) cover one-focusable-element traps, programmatic opener restoration, shadow-root focus, nested overlay depth, preserving scrollbar gutter and cleanup after unmount. [Accordion tests](https://github.com/huntabyte/bits-ui/blob/fd10616a873a8e6e3652e31dcc88c5c2f155a9e2/tests/src/tests/accordion/accordion.browser.test.ts) cover keyboard movement and beforematch. The latter dispatches a synthetic beforematch event; it does not prove browser UI Find integration by itself. [CI](https://github.com/huntabyte/bits-ui/blob/fd10616a873a8e6e3652e31dcc88c5c2f155a9e2/.github/workflows/test.yml) explicitly builds and runs Chromium component/browser tests.

**Baseline translation.** Add native disclosure find/hash acceptance and disconnected/reconnected enhancement cases. Use explicit stable IDs, do not assume DOM order equals content identity, and treat duplicate setup after navigation as a regression scenario. Keep these as generic fixture journeys, independent of client copy.

### J. Next Forge — select the serialization boundary, reject the app stack

**Architectural strength and code.** [JsonLd](https://github.com/haydenbleasel/next-forge/blob/f189de79ceef7c1ef69f61f12e272f99b4cdb699/packages/seo/json-ld.tsx) accepts typed schema data and escapes dangerous HTML characters before putting serialized text into script markup:

```ts
.replace(/</g, "\\u003c")
.replace(/>/g, "\\u003e")
.replace(/&/g, "\\u0026")
```

It also escapes Unicode line separators. `<` escaping prevents a literal closing-script sequence from terminating the script element. Types from schema-dts support authoring but do not validate runtime editor data or prove Google rich-result eligibility.

**SEO.** [Metadata factory](https://github.com/haydenbleasel/next-forge/blob/f189de79ceef7c1ef69f61f12e272f99b4cdb699/packages/seo/metadata.ts) centralizes a Next Metadata object and merge defaults. Public metadataBase depends on a Vercel environment value; author/publisher/site identity are baked into defaults. Translate the pure data/serialization boundary, not Next APIs or hosting identity. Baseline's CMS branch already has structured contributions, escaping and CSP handling in EmDash; avoid bypassing those.

**Interactions/layout.** Design-system dialogs and accordions wrap client React/Radix primitives. The broader package brings auth/observability dependencies and theme utilities. No zero-JS public navigation or Baseline-compatible open-slot layout system is established by this package. No runtime byte savings are claimed.

**Verification.** Root commands use Turbo/Ultracite and workspace type checks. The inspected SEO package does not itself establish a serializer regression test or a foundational website keyboard journey. A typed API still needs parser-based adversarial tests. No pre-commit or passing browser coverage is inferred from tooling names.

**Baseline translation.** Give static profiles one dependency-free JSON-LD serializer and test it through an HTML parser, including `</script>` in titles. Preserve objects as data until the final serializer; never accept raw editor-authored script strings. Reject the monorepo template/dependency system for this task.

## 4. Concrete action plan and PR-ready proposals

### PR 1 — one metadata owner per profile (P0)

**Problem/outcome:** CMS pages currently place shell metadata alongside EmDash metadata, while static pages lack social/article metadata. Make each branch own exactly one metadata set, preserving EmDash's editor/plugin resolution and shared landmarks.

**Files:** `src/layouts/SiteShell.astro`, `src/layouts/Base.astro`, `src/pages/posts/[slug].astro`, `src/pages/[slug].astro`, `profiles/static/project/src/layouts/Base.astro`, new `src/components/StaticMetadata.astro` and `src/lib/metadata.ts`, static post route/schema and Sveltia paired config where fields are added; relevant profile inventories/tests.

Minimal shell contract, **proposed**:

```astro
---
// Extend existing Props; retain title, lang, skip label and all structural slots.
const { metadataOwner = 'shell', description, canonical } = Astro.props;
---
<!-- In the existing head, alongside the existing single title: -->
{metadataOwner === 'shell' && description && <meta name="description" content={description} />}
{metadataOwner === 'shell' && canonical && <link rel="canonical" href={canonical} />}
<slot name="head" />
```

Add `metadataOwner?: 'shell' | 'platform'` to Props. CMS Base passes `platform` and retains `EmDashHead`. Static Base passes `platform` and places StaticMetadata in that slot. StaticMetadata owns description/canonical/social/structured tags, **not** a second title, charset or viewport. Do not add a global SEO component alongside EmDashHead.

Add explicit Base `pageType` and `articleMeta` props typed from the installed EmDash page-context input. Posts pass article metadata using actual published/modified/author values; ordinary Pages remain website. The current `pageType: "website"` must not override every content route. Resolve public canonical defaults using `settings.url || Astro.site` before a local-development request-origin fallback. Keep editor canonical overrides and plugin precedence; do not silently forbid legitimate cross-domain canonicals.

Static metadata should derive all outputs from one resolved object: absolute canonical/image URL, title/description, page kind, locale, published/modified dates and real author identity. Use the configured public origin, remove tracking query/hash from default canonicals, preserve meaningful route parameters according to a documented policy, match Astro build/trailingSlash/base settings, and avoid lowercasing case-sensitive paths. Explicit overrides need validation separately from default generation. Hreflang links must represent real translated pages and be reciprocal; do not fabricate translations from locale configuration.

**Accept:** parse representative HTML for each profile; exactly one title, description, canonical and primary og:type; URL consistency across canonical/og:url/schema; correct article dates; fallback OG image resolved once; no preview domain on production defaults; editor and plugin overrides preserved; locale alternates only for published translations. Unit-test URL policy without a browser, then verify rendered counts locally. Do not rely solely on regex over source.

### PR 2 — static structured-data serialization (P0)

**Files:** `src/lib/json-ld.ts`, `src/components/StaticMetadata.astro`, `tests/json-ld.test.mjs`, generated-profile test/inventory entries.

Dependency-free draft (inspired by Next Forge's boundary, written for Baseline):

```ts
export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
```

```astro
<script is:inline type="application/ld+json" set:html={serializeJsonLd(graph)} />
```

Accept typed/validated graph data, not a raw HTML override. Include known BlogPosting/WebSite/BreadcrumbList builders only when real page data supports them. Breadcrumb items need stable positions/absolute URLs; do not expose a variant until implemented. Omit unknown author/date/image facts. Align CSP handling with the chosen static hosting policy; EmDash's own renderer/CSP integration remains authoritative in CMS mode.

**Accept:** parse HTML containing adversarial editorial text (quotes, ampersands, literal closing-script text, U+2028/U+2029); exactly the intended script node exists, JSON.parse round-trips text, no injected element appears. Validate schema structure and absolute URLs separately. This is more meaningful than asserting the source contains `.replace`.

### PR 3 — foundational journeys using the existing harness (P0)

**Files:** `tests/visual/behavior.spec.mjs`, `tests/visual/contract.mjs`, `src/components/dev/Styleguide.astro`, fixtures, `docs/visual-regression.md`; optional separate local DOM-only a11y runner after profile support is implemented.

Extend the existing local functional suite. Keep screenshots and browser tests out of automatic CI/production builds under current policy. CPU-only metadata/token/template tests can run in `verify` and generated-profile jobs. Do not claim the CMS fixture harness works on static profiles until generation, serving, cleanup and dependency inventories explicitly support it.

| Generic journey | Required assertions | Existing coverage to preserve |
| --- | --- | --- |
| First keyboard entry | First intended Tab reaches skip link; Enter focuses main; next Tab reaches the expected main-content control; target not obscured | Shared shell already has a native anchor and `tabindex=-1` target |
| Disclosure | Enter/Space toggles; closed links absent from tab order; state survives content edits; named-group behavior where supported | Add native fixture rather than a new application page |
| Find/hash reveal | Closed disclosure containing a match can be discovered; fragment target revealed | Bits beforematch tests are a reference, not proof of native browser Find |
| Responsive navigation | Open/close/Escape; correct expansion relationship; no-JS links available; focus safe after resize | Do not confuse nonmodal disclosure/popover with modal trap |
| Modal | Initial focus, forward/backward Tab containment, Escape/close button, opener restore, removed opener, nested overlay, repeated mount/unmount | PhotoSwipe gallery checks do not certify a new dialog primitive |
| Form recovery | Invalid POST, retained allowlisted values, summary/field associations, correct focus, repeat submit, correction/success | Retain unit tests and existing illustrative summary-link check |
| Motion | Runtime motion advances under no preference and actually stops under reduce; skip behavior avoids explicit smooth animation | Existing ticker/print/motion/zoom tests are substantial |

Illustrative addition using the **existing** helpers, not a new test framework:

```js
test('keyboard skip reaches main and continues inside it', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#main-content :focus')).toHaveCount(1);
});
```

The production PR should assert a known fixture's first control by role/name instead of merely any focused descendant, and check its rectangle against sticky UI. Add explicit fixture ownership and reject setup/error pages before assertions. An optional axe runner should scan open and closed states and retain rule/node evidence; it complements keyboard/AT checks. Do not suppress broad classes of violations to obtain green reports.

### PR 4 — zero-script open-slot disclosure (P1)

**Files:** `src/components/Disclosure.astro`, `src/styles/global.css`, shared styleguide fixture/inventory/tests and hash-bound infrastructure exception review.

Minimal draft, preserving normal details attributes:

```astro
---
import type { HTMLAttributes } from 'astro/types';
type Props = HTMLAttributes<'details'>;
const { class: className, ...attributes } = Astro.props;
---
<details {...attributes} class:list={['disclosure', className]}>
  <summary class="disclosure__summary"><slot name="summary" /></summary>
  <div class="flow disclosure__content"><slot /></div>
</details>
```

```css
/* In the existing component layer; values refer to existing semantic roles. */
.disclosure { border-block-end: 1px solid var(--color-border); }
.disclosure__summary { cursor: pointer; padding-block: var(--spacing-content); }
.disclosure__content { padding-block-end: var(--spacing-content); }
```

```astro
<Disclosure name="faq">
  <span slot="summary" {...(entry.edit.question || {})}>{entry.data.question}</span>
  <RichText value={entry.data.answer} />
</Disclosure>
```

The last usage is **CMS-only**; static routes use their own validated content and Markdown rendering without CMS imports. Summary content must have a meaningful label and no nested links/buttons. Preserve the native marker initially. Review heading announcements if a heading is placed inside summary. Do not add animation or FAQ JSON-LD by default. Multiple `<details>` may share a name for exclusive opening only when that behavior suits the content.

**Accept:** no authored component client script; no-JS keyboard toggle, long labels, dark surface, text spacing and 400% zoom; CMS edit attributes remain on caller-owned content; static output has no EmDash dependencies.

### PR 5 — native dialog only for a demonstrated modal need (P1)

**Files:** `src/components/Dialog.astro`, `src/scripts/dialog.ts`, styleguide and local journey cases. Prefer native `<dialog>` and small lifecycle-safe enhancement. A modal drawer is an appearance variant of this behavior; a simple nav disclosure is not.

Open-slot markup blueprint:

```astro
<baseline-dialog>
  <slot name="trigger" />
  <dialog id={id} aria-labelledby={labelledBy} aria-describedby={describedBy}>
    <slot />
  </dialog>
</baseline-dialog>
```

Contract: the caller supplies a unique ID, a real labelled heading, an explicit close button, and a normal-page fallback link for essential content. An enhanced trigger is a `type="button"` with `data-dialog-open`, initially hidden until setup succeeds. Close buttons use `type="button" data-dialog-close` or a dedicated method=dialog form **outside** any submitted business form. Focus placement is chosen with an autofocus control or suitable static heading; do not put tabindex on dialog itself.

Controller outline:

```ts
// Inside a custom element's connectedCallback; store controller on the instance.
const controller = new AbortController();
const { signal } = controller;
const dialog = this.querySelector('dialog');
const trigger = this.querySelector<HTMLButtonElement>('[data-dialog-open]');
if (!(dialog instanceof HTMLDialogElement) || !trigger || !dialog.showModal) return;
trigger.addEventListener('click', () => {
  if (!dialog.open) dialog.showModal();
}, { signal });
dialog.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const close = event.target.closest('[data-dialog-close]');
  if (close && close.closest('dialog') === dialog) dialog.close();
}, { signal });
trigger.hidden = false;
// disconnectedCallback: close an open dialog, abort this controller, clear refs.
```

This is an outline, not a ready-to-paste complete class: guard reconnect/double setup, restrict trigger ownership to this instance, preserve actual invoker semantics, and clean up listeners on disconnect. Use native Escape/cancel and modality; do not add a document Tab loop. Keep backdrop dismiss an explicit product policy. Newer invoker commands can reduce JS further if target-browser support is verified; do not silently remove the fallback. [Native dialog reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

**Accept:** all modal journeys in PR 3, initial focus choices for long content/forms, nested native modals, AT checks on agreed browsers, and fallback navigation when JS fails. Do not ship this primitive because it is on a checklist if no client need exists.

### PR 6 — Cluster/Sidebar composition without theme debt (P1)

**Files:** `src/components/Cluster.astro`, `src/components/Sidebar.astro`, `src/styles/global.css`, shared inventory and calibration specimens. Start with CSS relationships plus default slots; expose only evidenced variants, not arbitrary style prop bags.

```css
.cluster { display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-content); }
.with-sidebar { display: flex; flex-wrap: wrap; gap: var(--spacing-grid); }
.with-sidebar > :first-child { flex: 1 1 var(--sidebar-basis, 18rem); }
.with-sidebar > :last-child { flex: 999 1 0; min-inline-size: min(100%, 60%); }
```

`--sidebar-basis` is a documented contextual layout variable, not a new global brand token by default. Define which child is the sidebar and preserve source order. Do not equate visual placement with RTL. Thin wrappers should accept class and normal HTML attributes, expose slots, and contain no content query or CMS import. Keep the current Grid rather than duplicating it.

**Accept:** both foundations, narrow parent inside a wide viewport, long unbroken text, missing/long sidebar content, RTL, keyboard reading order and editor wrappers; verify no unintended overflow and no new client JS. Calibrate on `/_styleguide` before broad usage.

### PR 7 — token diagnostics and lint enforcement (P1)

**Files:** `scripts/design-system.mjs`, token tests, new `eslint.config.mjs`, package scripts, profile bounded inventories, generated CI configuration as appropriate.

Token diagnostics should evaluate exact endpoints, midpoint, min/max clamping, monotonicity, reduced browser width during zoom, and changed root font sizes. Preserve lane selection and existing role contrast audits. Report resize-risk estimates as warnings until validated; Utopia's function name must not become a claim of conformance. Accept `cqi` only in explicitly container-scoped tokens and specimen contexts. Keep `vi` for the global scale.

Suggested scripts (new commands are proposals, not currently installed):

```json
{
  "lint:scripts": "node scripts/check-script-syntax.mjs",
  "lint:templates": "eslint src profiles/static/project/src --max-warnings 0",
  "lint": "npm run lint:scripts && npm run lint:templates",
  "test:metadata": "node --test tests/metadata.test.mjs tests/json-ld.test.mjs"
}
```

Choose Astro-compatible ESLint/plugin/parser versions with installed Astro 7/TypeScript, add npm lockfile updates, and fail on real new violations. Add strict Astro a11y rules from the verified package exports rather than guessing JSX parser settings. A generated site has no `profiles/static/project/src` directory: generate a profile-specific `lint:templates` command targeting `src`, and include its config/dependencies explicitly. Preserve `verify`'s existing order; `npm test` already discovers new root `*.test.mjs` files, so do not run metadata tests twice in the default chain.

No browser command is added to automatic verify/CI. Optional local axe/browser work belongs behind an explicit local command using the owned fixture setup. Continue `npm run test:visual:functional` for EmDash fixtures; add static browser support only after defining its own bounded setup contract.

### PR 8 — optional OG asset pipeline (P2)

**Files:** static profile `src/pages/posts/[...id].png.ts`, a shared pure OG composition helper, profile schema/editor form only if an explicit social override is needed, and CMS-specific generation/cache integration separately.

Use one publication filter and slug helper for HTML and PNG paths. Generate only for published entries without a supplied social image. Fonts and colors come from reviewed brand assets/tokens; make the generated composition handle long titles, Unicode and actual locale fonts. Cache by content revision plus font/theme inputs. CMS requests require appropriate publication checks, cache hints/invalidation and resource limits; use current supported media APIs. Avoid an unbounded image-render endpoint. Confirm whether Satori's extra dependency is justified before adding it to every generated site.

**Accept:** image response type/dimensions, long titles, real font loading, no draft leakage, stable URL/metadata references, content update invalidation, deterministic static build and no client runtime. A supplied OG image may be JPG/WebP/etc.; do not claim PNG dimensions without inspecting the asset.

### Implementation order and delivery gates

1. Fix ownership/article semantics and static serialization; add parser-based tests before new visual components.
2. Extend keyboard/form/motion acceptance on existing specimens; add strict template lint.
3. Add native Disclosure and evidenced intrinsic relationships; calibrate dark/light/narrow/editor cases.
4. Implement Dialog and OG generation only for a demonstrated requirement.

For every shared addition, update `profiles/manifests/shared.json`, `profiles/file-inventory.json` and dependency/script inventories **only where applicable**; ensure generated `static` and `static-sveltia` remain independently installable. Sveltia forms must match any changed content schema. Review exact hash-bound starter infrastructure exceptions rather than exempting whole directories. No fictional client Art Direction Record is needed for this documentation evaluation; actual site visual work still follows the art-direction gate.

Run `npm run verify` for each implementation PR, `npm run test:profiles` when shared/generator inventory changes, `npm run build`/release artifact checks for delivery-affecting changes, and local Windows `npm run test:visual:functional`/visual verification for rendered behavior changes. Browser and assistive-technology acceptance remain distinct from source/unit gates. Retain source license notices for copied/adapted implementation code; these repositories include MIT, ISC and Apache-2.0 material, so verify the relevant file/package license at the pinned revision before vendoring.

## Evidence and validation for this evaluation

All external source links are immutable commit links resolved from the manifest. File hashes identify exactly inspected bytes; they are research provenance, not dependency pins for future installs. Supplementary primary references: [Astro static route generation](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths), [EmDash SEO](https://docs.emdashcms.com/guides/seo/), [Every Layout Sidebar](https://every-layout.dev/layouts/sidebar/), [CUBE CSS](https://cube.fyi/), [native popover](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover).

`npm run verify` passed: **177 tests passed**, zero failed/skipped, and Astro checked 40 files with zero errors, warnings or hints. A parse5 spot probe confirmed that the draft serializer prevents an injected image element from a closing-script payload while preserving the JSON value. Two pure-function calls to the pinned Utopia source matched the expected viewport/container expressions; no upstream application dependencies were installed. The source manifest records these results and bounded research evidence. No upstream application builds, bundle-size benchmark, external browser matrix or screen-reader session was run. Draft implementation blueprints require the acceptance work listed in their respective proposals.
