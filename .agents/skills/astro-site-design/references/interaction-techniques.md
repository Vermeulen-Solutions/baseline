# Interaction techniques worth reusing

Distinctive interfaces (a floating dock, a command palette, link previews, rolling numbers, paper textures, sound) belong to one site's art direction and are not shipped as Baseline components. The techniques under them carry over to any site that needs them. Each one keeps working without the effect: the effect is added, never required.

## Motion

- **Springs in script, short eases in CSS.** A small spring function (stiffness, damping, velocity) gives physical motion for drags and toggles; CSS transitions keep short durations and the site's easing tokens. Every moving thing has a reduced-motion answer, read once (`matchMedia('(prefers-reduced-motion: reduce)')`) and honoured in both script and CSS.
- **A hover lift that cannot jitter.** When a card lifts on hover, lift its inner content and keep the hit area still; otherwise the moved card can slide out from under the pointer, drop, and lift again in a loop.
- **The first screen is never hidden.** Headline and media on the first screen paint at full opacity; entrance effects there use movement or blur, not a start at opacity 0, and never a start at 0.01 to fool the largest-paint metric. Below the fold, reveal with scroll-driven animations (`animation-timeline: view()`) and fall back to an IntersectionObserver that only runs when the CSS feature is missing. `npm run check:quality` reports a hidden first screen.
- **Headline word effects keep one sentence.** When a headline is split into word spans for an effect, do the split in the markup (no flash of the whole line before a script splits it) and give the heading an `aria-label` with the plain sentence, so a screen reader does not stop on every span.
- **Numbers that roll.** The HTML holds the real final value; the animation only counts up to it. Without script, or with reduced motion, the number is simply there.
- **Persistent elements across pages.** A floating menu or sticky header that should hold still during cross-document view transitions gets a `view-transition-name` only while a transition is active (`:active-view-transition`), as Baseline's header does.

## Overlays and shortcuts

- **Command palette.** A native `<dialog>` opened with `showModal()` traps and returns focus for free. `Ctrl+K`/`Cmd+K` open it; a single-key shortcut such as `/` works only when focus is not in a field and comes with a visible way to turn it off (WCAG 2.1.4). Every page it lists is also reachable through ordinary links; without script its buttons are hidden.
- **Link previews and hover cards** are dismissable with Escape, stay open while the pointer moves onto them, and stay until the pointer or focus leaves (WCAG 1.4.13). They repeat information that is also on the destination page, never replace it.
- **Gestures have a single-press twin.** Pull-to-dismiss, drag-to-compare and swipe carousels also work with a button, a tap or the keyboard (WCAG 2.5.1 and 2.5.7). A carousel without script is a scrollable row reachable by Tab.

## Texture, light and sound

- **Decorative layers use one property.** A grain or sheen that sets only `background-image` survives a later `background-color`; a later `background` shorthand wipes it, so components set `background-color` instead. Decorative images and strips are `aria-hidden`, with the same point made in words beside them.
- **Ambient effects are optional.** A shadow that leans with the time of day or a live local clock is decoration; nothing depends on it, and it renders sensibly before its script runs.
- **Sound is off until the visitor turns it on**, with a visible switch that remembers the choice, and no cue longer than three seconds (WCAG 1.4.2).
- **Device-local preferences** (theme, sound, a turned-off shortcut) live in `localStorage` behind `try`/`catch`, with a sensible default when storage is unavailable.

## Images

- **Cut to the frame at build time.** When many images must show at one fixed ratio (a contact sheet, fanned prints), crop them at build time to that ratio with a chosen focus, instead of letting CSS `object-fit` crop a larger file in the browser: the bytes shrink and the crop is decided, not accidental.
- **Real dimensions for every image.** Store width and height for images outside the asset pipeline (a JSON map of `public/` images checked by a test) so layout space is reserved and nothing shifts.
