# Impression tier: scripted motion

Read this when the Art Direction Record says `Motion Tier: impression`. On that tier the site's job is how it feels, and three things are built on every such site: a smoothed scroll, page changes that move, and at least one pinned scene. `audit:composition` reports `impression-motion` (a floor finding) until all three are on the built pages. On the `task` and `editorial` tiers, build none of this.

Scripts are allowed here. The rule that interaction stays without JavaScript does not apply to these three pieces on an impression site; it still applies to everything else (menus, disclosures, forms), and every piece below stands still under `prefers-reduced-motion: reduce`.

Build the three pieces in this order. Each has a check; run it before the next piece.

## 1. Smoothed scroll

Follow [smooth scroll](smooth-scroll.md) exactly: install `lenis@1.3.27`, add `src/components/SmoothScroll.astro`, and place `<SmoothScroll slot="body-end" />` in the layout. On this tier it is required, not a choice.

**Check.** Build, serve, and open the home page at 1440 wide: `document.documentElement.classList.contains('lenis')` is `true`.

## 2. Page transitions

The starter's `transitionStyle` crossfades and curtains are CSS on the browser's own page change. An impression site uses Interlude, a transition engine for Astro's client router (MIT, `github.com/codrops/interlude`), where each transition is a small script that covers the old page and reveals the new one. It was tested inside Baseline's shell at commit `9754ce545a1528fdb73f7e10fdcceb29527d094f` with `gsap@3.15.1`, on the static profile: the cover and reveal play, focus moves to the new page's `<main>`, reduced motion swaps the pages at once, and the page's scripts stay under the default 120 KB script budget (118.6 KB measured with two transitions and the smoothed scroll). It has not been tested in the EmDash visual editor: on an EmDash site, render the two additions below only when the page is not in edit mode.

Interlude is a set of files copied into the site, not a package.

1. Install the animation library: `npm install --save-exact gsap@3.15.1`.
2. Fetch Interlude's source into a folder **outside** the site, at the tested commit:

   ```bash
   git clone https://github.com/codrops/interlude.git ../interlude-src
   git -C ../interlude-src checkout 9754ce545a1528fdb73f7e10fdcceb29527d094f
   ```

3. Copy these files into the site (run from the site's folder). Leave `webgl.ts` out: the WebGL transitions need three.js, which is not part of this recipe.

   ```bash
   mkdir -p src/lib/interlude src/transitions
   cp ../interlude-src/src/lib/interlude/*.ts src/lib/interlude/
   rm src/lib/interlude/webgl.ts
   cp ../interlude-src/LICENSE src/lib/interlude/LICENSE
   cp ../interlude-src/src/components/Interlude.astro src/components/Interlude.astro
   cp ../interlude-src/src/interlude.config.ts src/interlude.config.ts
   cp ../interlude-src/src/transitions/curtain.ts ../interlude-src/src/transitions/wipe.ts src/transitions/
   ```


4. Make two edits to the copied files:
   - In `src/interlude.config.ts`, set `defaultTransition: 'curtain'`. (The file's own default, `peel`, is a transition this recipe does not copy.)
   - In `src/components/Interlude.astro`, put the styles in Baseline's components layer: directly after the line `<style is:global>` add the line `@layer components {`, and directly before the line `</style>` add the line `}`. Without this, `check:css` (part of `verify`) fails with "Author selector must belong to base or components: .interlude".
5. In `src/layouts/Base.astro`, make four changes:
   - add the imports `import { ClientRouter } from 'astro:transitions';` and `import Interlude from '../components/Interlude.astro';`;
   - on `<SiteShell …>`, set `pageTransitions="none"` and `prefetch="off"` (the client router replaces both);
   - inside `<Fragment slot="head">`, add `<ClientRouter />` as its first child;
   - directly inside `<SiteShell>`, before the header, add `<Interlude slot="body-start" />`.
6. In the site's direction stylesheet, inside `@layer components`, add:

   ```css
   :root { --interlude-color: var(--color-text); } /* the colour of the cover: one of the world's colours */
   body { overflow-x: clip; }                      /* a page moved sideways must not show a scrollbar */
   main:focus { outline: none; }                   /* focus moves to <main> after each page change */
   ```

7. Choose the transition from the world, as the World's Motion line records the other motions: `curtain` (a panel rises and uncovers the next page) or `wipe` (a panel crosses sideways). One link can use another with `data-transition="wipe"`. To use a different transition from `../interlude-src/src/transitions/`, copy its file too and read the comment at its top: it says what else it needs.

Three things change once the client router is on, because a page change no longer loads a new document:

- **A site script that sets up a page runs on the first page only.** Wrap its set-up in `document.addEventListener('astro:page-load', () => { … })`, which runs on the first load and after every page change. Look for the page's elements inside `document.querySelector('main')`.
- **A form that must post as a normal page load** takes the attribute `data-astro-reload`.
- **A modal `<dialog>` stays above the cover.** Close it on the `interlude:leave` event.

**Check.** Run `npm run verify`: it passes with the copied files in place (the lint, the CSS contract, the tests and the type check were run on them). Then build and serve. In a browser at 1440 wide: click a link in the navigation to the second built page, wait three seconds, then confirm all of these: the address changed; `document.querySelector('[data-interlude]').dataset.state` is `"idle"`; `document.activeElement` is the `<main>` element; `document.querySelectorAll('[inert]').length` is `0`; the browser console shows no error. Press Back and confirm the first page is shown and scrolls. Then repeat the click with reduced motion emulated: the page changes at once.

## 3. A pinned scene

A pinned scene is a section whose stage stays on screen while the visitor scrolls through it, and whose parts move with the scroll. It is plain CSS (a scroll-driven animation on a sticky stage), so it needs no library and works with the smoothed scroll. Build at least one on the home page, from an object of the site's world: the evening's three rooms, the dish in five times, the hall filling.

```astro
<section class="scene bleed" aria-labelledby="scene-title">
  <div class="scene__stage">
    <h2 id="scene-title">One evening, three rooms</h2>
    <div class="scene__plate" data-plate="1">…</div>
    <div class="scene__plate" data-plate="2">…</div>
    <div class="scene__plate" data-plate="3">…</div>
  </div>
</section>
```

```css
@layer components {
  /* Without scroll-driven animations, or with reduced motion, the section is an ordinary block
     with every plate in place: write that layout first. */
  .scene__stage { display: grid; gap: var(--spacing-content); padding: var(--spacing-section) var(--spacing-container); }

  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: view()) {
      /* The section is the track: three screens of scrolling. Its stage stays on screen. */
      .scene { block-size: 300svh; view-timeline-name: --scene; view-timeline-axis: block; }
      .scene__stage { position: sticky; inset-block-start: 0; block-size: 100svh; overflow: clip; align-content: center; }
      .scene__plate {
        animation-name: scene-plate-in;
        animation-timing-function: linear;
        animation-fill-mode: both;
        animation-timeline: --scene;
      }
      /* Each plate takes its share of the time the stage is pinned ("contain"). */
      .scene__plate[data-plate="1"] { animation-range: contain 0% contain 30%; }
      .scene__plate[data-plate="2"] { animation-range: contain 30% contain 60%; }
      .scene__plate[data-plate="3"] { animation-range: contain 60% contain 90%; }
    }
  }

  @keyframes scene-plate-in {
    from { opacity: 0; translate: 0 4rem; }
    to { opacity: 1; translate: 0 0; }
  }
}
```

Rules for a scene:

- Write `animation-name`, `animation-timing-function` and `animation-fill-mode` as separate properties, never the `animation` shorthand beside `animation-timeline`: the production minifier breaks that pair, and `check:css` fails on it.
- Name the `@keyframes` after the world's motion and list it on the record's World › Motion line, like every other world motion.
- Keep a track between two and four screens (`200svh` to `400svh`). Longer, and the visitor scrolls through nothing.
- Every word in the scene is readable when nothing animates. Nothing the main visitor came for sits inside a scene.
- Never put a scene on the first screen: the first screen opens settled.

**Check.** Build, serve, and run `npm run audit:composition -- --base <origin> --routes <the built pages>`. It prints `Motion Tier impression: smoothed scroll, moving page changes and a pinned scene are present.` when all three pieces are built, or `[impression-motion]` with the piece that is missing. Then run `npm run check:quality -- --base <origin> --routes <the built pages> --only script-weight,first-viewport-hidden,first-viewport-scroll-motion`. If it reports `script-weight`, the site's own scripts pushed the page over 120 KB: add `"limits": { "scriptKB": 200, "_why": "impression tier: GSAP, the transition engine and the smoothed scroll" }` to `page-budget.json` at the site root, and run it again.

## Record it

On the record's World › Motion line, after the world's motions, say that the scroll is smoothed and which transition the pages use. In the Decisions, name `lenis@1.3.27`, `gsap@3.15.1` and the Interlude commit.
