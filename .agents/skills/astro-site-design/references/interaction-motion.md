# Interaction motion and polish review

Read when implementing or reviewing motion on controls, menus, disclosures, dialogs, toasts, cards, hover/press feedback or page-level reveals, or when an existing animation feels slow, jumpy or janky. Impeccable's `reference/animate.md` decides whether the site needs motion at all and which focal moment deserves authorship. This reference turns that decision into interface mechanics that pass a strict review. It does not ask for more motion: a correct result is sometimes no animation.

## Decide whether it moves

Name one purpose before writing code: feedback, state change, spatial continuity, preventing a jarring jump, explanation, or a rare delight moment. If none applies, do not animate.

Match motion to how often the visitor sees it:

| Frequency | Decision |
| --- | --- |
| Repeated constantly, or triggered from the keyboard (search shortcuts, list navigation, tab switching by key) | No animation. Change state instantly. |
| Many times per visit (link and button hover, filters, accordions) | Fast and subtle, or nothing |
| Occasional (menu, dialog, toast, disclosure) | Standard interface motion |
| Rare or first-time (one authored hero sequence, a completed enquiry) | The place for an authored focal moment |

Content the visitor is reading or acting on should not move for style. Decorative pointer-tracking belongs on a deliberately expressive surface, not on prices, forms or data.

## Choose the cheapest tool that works

Walk down this list and stop at the first fit. Do not add a dependency for an effect the existing stack expresses cleanly.

| Need | Tool |
| --- | --- |
| Hover, press, colour or a state toggled by a class/attribute | CSS transition |
| Entry when an element is inserted or shown, without script state | CSS transition with `@starting-style` |
| A predetermined sequence that must stay smooth while the page is busy (navigation, hydration) | CSS animation |
| Programmatic control, sequencing or dynamic values without a library | Web Animations API (`element.animate()`) |
| Springs, gestures with momentum or exit animations of removed elements | The site's already adopted motion library; adopt one only as a recorded dependency decision |

A menu, dialog, disclosure or toast is first a component with focus, keyboard and announcement behavior. Use native elements (`<dialog>`, `<details>`, popover) or the site's accessible primitive, then animate it. Never hand-build a `<div>` dropdown to make it animatable. Choose the native feature, and check its browser support and fallback, with [native platform choices](native-platform.md).

## Properties, easing and duration

- Animate `transform` and `opacity` by default. `clip-path` and `filter` are acceptable with a reason. Avoid `width`, `height`, `margin`, `padding`, `top` and `left`; the narrow exception is a disclosure with no transform equivalent, which should still be checked for jank.
- Never write `transition: all`. List the exact properties, so a later layout change does not start animating by accident.
- Never grow from `scale(0)`. Start from `scale(0.95)`–`scale(0.97)` with `opacity: 0`.
- Menus, popovers and tooltips grow from their trigger: set `transform-origin` toward the trigger. Centered dialogs keep a centered origin.
- Use percentage translates (`translateY(100%)`) for elements of unknown size rather than fixed pixels.
- Never use `ease-in` on interface motion; it delays the moment the visitor is watching. Use a strong ease-out for entering and exiting, ease-in-out for movement on screen, and `linear` only for constant motion such as progress.
- Extend the site's existing tokens before introducing curves. The starter ships `--ease-smooth` and `--ease-snappy` (both strong ease-out curves) and `--ease-spring`, a `linear()` curve that overshoots; keep the overshoot for small playful details, not dialogs, menus or reading content. Do not hand-roll a near-duplicate curve.

| Element | Typical duration |
| --- | --- |
| Press feedback | 100–160 ms |
| Tooltip or small popover | 125–200 ms |
| Menu or select | 150–250 ms |
| Dialog or drawer | 200–300 ms, up to about 500 ms for a large drawer |
| Authored focal entrance or explanatory sequence | Longer, per Impeccable's focal-moment guidance |

Interface motion stays under 300 ms unless a recorded reason applies. Exits are as fast as or faster than entrances. Stagger only content that appears as a list, at 30–80 ms per item with a capped total, and never block interaction while it plays.

## Interruption, exit and pointer gating

- Use transitions, not keyframes, for anything a visitor can trigger repeatedly: a transition retargets from its current value, while a keyframe restarts from zero. Click a toggle or open a menu twice quickly to check.
- Exit along the path the element entered: a drawer from the right leaves to the right.
- Slow where the visitor is deciding, fast where the system responds: a deliberate hold or confirm can take longer, while its release snaps back.
- Gate hover motion behind `@media (hover: hover) and (pointer: fine)`. Touch screens fire a hover on tap, leaving cards lifted or icons nudged after the finger moves on. Colour changes that also mark focus can stay ungated.
- Every motion-carried state also needs a static cue: colour, icon, label or position. Motion is never the only feedback.

## Reduced motion in the starter

The starter's global `prefers-reduced-motion: reduce` rule collapses every animation and transition to near zero, removes view-transition slides and keeps `data-reveal` content visible. State changes therefore happen instantly for those visitors. Design for that: content and selected state must never depend on an animation completing. When a short opacity or colour transition genuinely aids comprehension under reduced motion, add a deliberately scoped exception for that element and remove only the spatial movement. Do not weaken the global rule.

## Performance diagnosis

Name the cause before changing code. Work down this list, in order of how often it is the problem:

1. **Wrong property.** Layout properties first, then paint-heavy ones such as `box-shadow` and `border-radius`. Swap down: `scale()` for size, `translate()` for position, `opacity` for visibility, and `filter: drop-shadow()` for an animated shadow.
2. **A busy main thread.** Jank only during navigation or loading means script-driven animation is competing with page work; move it to CSS or WAAPI.
3. **Per-frame script work.** A handler on `scroll`, `pointermove` or `requestAnimationFrame` that changes inherited state or writes many styles per frame.
4. **Inherited custom properties.** Driving a child's transform from a CSS variable set on a large parent recalculates styles for every descendant each frame; set `transform` on the moving element directly. Suspect this when the effect slows down as content grows.
5. **Blur.** Keep animated `blur()` under about 20 px; 2–5 px is usually enough to soften a crossfade. Bound blur, backdrop and shadow effects to small regions.
6. **Layer hand-off.** Only when a one-pixel shift or first-frame stutter remains, add `will-change: transform` to the animating element itself, never to a container or `*`.

A fast development laptop hides most of these. State which findings are verified from code and which need a recording on a representative phone.

## Inspect the feel

Rendered acceptance follows the root/site verification rules: headless Chromium with `pageerror` and `console.error` listeners, rapid overlapping input, interruption, narrow reflow and the reduced-motion preference. In addition, for feel:

- Replay the motion slowly: the browser's Animations panel at 10–25 % speed, or a temporary 2–5× duration. Check that crossfades blend, easing does not stop abruptly, `transform-origin` is right and coordinated properties stay in sync.
- Walk every state: hover, focus, active, open, closed, loading and error.
- Try touch on an actual device or touch emulation for hover gating and gestures, and say which was used.
- If a value depends on feel that cannot be judged from code, say so instead of presenting a guess as settled.

## Review report

When reviewing motion or interface polish, report in this shape rather than as a list of opinions:

1. **Scope and evidence.** State the scope, styling system and boundary. For motion, interaction states and performance, list what was actually inspected and the result: findings, clear, or `Not reviewed` with a reason. Never imply that an uninspected area was reviewed.
2. **Findings.** One row per issue with severity, `path:line` or exact screen/component, before, after and why (the rule above and its visitor impact). `HIGH`: makes an interaction inaccessible, misleading or repeatedly disruptive. `MEDIUM`: a noticeable usability or consistency problem. `LOW`: isolated polish. Consolidate a repeated issue into one row listing every location.
3. **Considered but rejected.** One to five real candidates and why they were left, such as a duration that matches an existing token. Do not invent filler.
4. **Verification and verdict.** The commands and interactions actually run with their observed results, each unrun check marked `Not verified`, and a verdict: `Block` if a `HIGH` remains, `Needs changes` for `MEDIUM`/`LOW`, `Approve` only with no actionable findings.

## Sources

This Baseline-owned procedure distils [Emil Kowalski's animate](https://github.com/emilkowalski/skills/blob/c8a79627b59d72d764d6ab6f2c87c09a48169833/skills/animate/SKILL.md), [review-animations standards](https://github.com/emilkowalski/skills/blob/c8a79627b59d72d764d6ab6f2c87c09a48169833/skills/review-animations/STANDARDS.md) and [animation-performance](https://github.com/emilkowalski/skills/blob/c8a79627b59d72d764d6ab6f2c87c09a48169833/skills/animation-performance/SKILL.md), and the review format of [Make Interfaces Feel Better](https://github.com/jakubkrehel/make-interfaces-feel-better/blob/35545ea1512ad59fa463e6b1f95ca9c052981fe6/skills/make-interfaces-feel-better/SKILL.md) (all MIT). Their React, Motion-library and Tailwind examples are not Baseline defaults; this reference keeps the site's existing runtime, tokens and accessible primitives. Impeccable's upstream mirror is unchanged.
