# Native platform choices for interactive UI

Read before writing client JavaScript for an overlay, dismissal, positioning, disclosure, tabs or toast, or before adding a UI dependency. Language models often reach for libraries and script-driven geometry that the browser now provides, and just as often reach for new features that some visitors' browsers lack. This table covers both mistakes.

## Decide in this order

1. **A shipped primitive wins.** Read [shipped primitives](shipped-primitives.md). Never write a parallel version of `SearchDialog`, `Tabs`, `CopyButton`, `ThemeSelect`, `TableOfContents` or `Disclosure`, because each already carries localization, accessibility and ClientRouter teardown.
2. **The site's architecture and tokens come next.** `SiteShell` owns navigation transitions and surface switching; `src/styles/global.css` owns values.
3. **This table chooses the browser feature.**
4. **[Interaction motion](interaction-motion.md) covers how it moves.** Impeccable decides whether the feature should exist and critiques the result.

## Browser support policy

Support levels are the web platform's Baseline status, which is unrelated to this starter's name. A site may record a different policy in its `AGENTS.md`, and that record wins.

| Status | Rule | Why |
| --- | --- | --- |
| Widely available | Use freely, including for essential content, navigation, forms and focus | Supported across current browsers for at least 30 months |
| Newly available | Use with a fallback, or only where losing the feature costs convenience | Recent browser versions still have real audience share |
| Limited availability | Feature-detected enhancement only; losing it must cost only convenience or polish | At least one major engine lacks it |
| Origin trial or behind a flag | Never on a client site | It can change or disappear |

Essential content, navigation, forms and focus must never depend on a Newly or Limited feature without a tested fallback. Baseline's automated browser checks run only in Chromium, so a passing check says nothing about Safari or Firefox: test any fallback by removing native support in the test, and report real Safari or Firefox behavior as `Not verified` unless it was actually run.

## Choose the feature

Status checked 2026-11-10 against `web-features` 3.45.0. Check a row's status again if it decides something essential.

| Need | Native feature | Status | Rule or fallback |
| --- | --- | --- | --- |
| Modal dialog | `<dialog>` with `showModal()` | Widely | Do not add `role="dialog"`, `aria-modal`, a manual focus trap or `inert` toggling; the browser provides them |
| Click outside closes a modal | `closedby="any"` | Limited, no Safari | Guard a fallback with `!('closedBy' in HTMLDialogElement.prototype)`. Compare pointer position at both press and release against the dialog's box; never test `event.target === dialog`, which also closes on a text-selection drag ending on the backdrop. See `src/lib/search.ts` |
| Non-modal menu, panel or tooltip | `popover` with `popovertarget` | Newly | Do not use it where the content is essential and has no other route. A popover is not modal: do not trap focus |
| Declarative open and close buttons | `command` and `commandfor` | Newly | Keep a small script fallback; adding a polyfill is a recorded dependency decision |
| Place an element relative to its trigger | CSS anchor positioning | Limited | Wrap in `@supports (anchor-name: --a)`; the unsupported layout must stay usable, such as static or centered placement. Do not compute geometry in JavaScript just to avoid the fallback |
| Accordion with one open panel | `<details name="…">` | Newly | Use `Disclosure` first. Unsupported browsers allow several open panels, which is acceptable |
| Browser find reaches collapsed content | `hidden="until-found"` | Limited, no Safari | Unsupported browsers treat it as `hidden`, so a visible control must still reveal the content |
| Inert background outside a dialog | `inert` | Widely | Needed only for custom non-dialog overlays |
| Animate an overlay opening | `@starting-style`, `transition-behavior: allow-discrete` | Newly | Without support the overlay appears instantly, which is acceptable |
| Keep an overlay on top while it closes | `overlay` in the transition list | Limited, Chromium only | Exit animation may be cut short elsewhere; never depend on it |
| Page navigation transitions | `<ClientRouter fallback="swap" />` from the shell | Same-document Newly; cross-document Limited, no Firefox | Do not add `@view-transition` beside ClientRouter. The shell's guards keep the CMS editor on native navigation |
| Light and dark appearance | `ThemeSelect` or `data-surface-toggle` | Shipped | Do not add a separate `<meta name="color-scheme">` toggle |
| Component responds to its own width | Container queries | Widely | See [responsive architecture](responsive-architecture.md) |
| Aligned nested grids | `subgrid` | Widely | Use freely |
| Style a parent by its children | `:has()` | Widely | Use freely |
| Perceptual color | `oklch()` | Widely | Use through tokens |
| Viewport units that track mobile browser bars | `dvb`, `svb`, `lvb` and the matching `vi` forms | Widely | Use freely |
| Show validation errors after interaction | `:user-invalid` | Widely | Pair with a visible text error, not color alone |
| Skip rendering offscreen sections | `content-visibility: auto` through `.section-defer` | Newly | Below the fold only. Without support the section renders normally |
| Load priority | `fetchpriority` | Newly | A hint only, safely ignored. Set it on the hero image, not on many elements |
| Lazy image loading | `loading="lazy"` on images | Widely | Never on the Largest Contentful Paint image. Lazy video and audio are Limited |
| Scroll-driven reveals | `animation-timeline: view()` | Newly | Wrap in `@supports`; content must be visible without it |
| Break up long script work | `scheduler.yield()` | Limited, no Safari | Fall back to `setTimeout(0)` |
| Sanitize untrusted HTML | Sanitizer API | Limited, no Safari | Do not rely on it; sanitize on the server |
| Styled native select | Customizable `<select>` | Limited | Enhancement only; the plain select must stay usable |
| Prerender likely next pages | Speculation rules | Limited, Chromium only | Enhancement only; never required for correct navigation |

## When the need is not listed

Follow step 3 of [capability routing](../../site-art-direction/references/capability-routing.md), checking support on MDN or webstatus.dev before relying on a feature. Google Chrome's `modern-web-guidance` is a useful source to read for a specific pattern, but its guides assume vanilla HTML and its instructions do not override this project's. Keep its output as reference material only.

## Sources

Patterns reviewed from [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance/tree/4dd968349e54ca45a05dd5c818fb035c9054b022) v1.0.0, Apache-2.0, and rewritten for Astro, EmDash and Baseline's shipped primitives. Support status comes from [web-features](https://www.npmjs.com/package/web-features) 3.45.0.
