# Impression tier: scripted motion

Read this when the Art Direction Record says `Motion Tier: impression`. On that tier the site's job is how it feels, and three things are built on every such site: a smoothed scroll, page changes that move, and at least one pinned scene. `audit:composition` reports `impression-motion` (a floor finding) until all three are on the built pages. On the `task` and `editorial` tiers, build none of this.

Scripts are allowed here. The rule that interaction stays without JavaScript does not apply to these three pieces on an impression site; it still applies to everything else (menus, disclosures, forms), and every piece below stands still under `prefers-reduced-motion: reduce`.

Build the three pieces in this order. Each has a check; run it before the next piece.

## 1. Smoothed scroll

Follow [smooth scroll](smooth-scroll.md) exactly: install `lenis@1.3.28`, add `src/components/SmoothScroll.astro`, and place `<SmoothScroll slot="body-end" />` in the layout. On this tier it is required, not a choice.

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

7. Choose the transition from the world, as the World's Motion line records the other motions. The two copied above are `curtain` (a panel rises and uncovers the next page) and `wipe` (a panel crosses sideways). Interlude has twelve more that need no WebGL; when one is closer to how this world changes scene, copy its file from `../interlude-src/src/transitions/` as well, set it as `defaultTransition`, and read the comment at its top, which says what else it needs (the ones marked `old-page` need `src/lib/interlude/old-page.ts` copied too):

   | Transition | What moves | A world it suits |
   | --- | --- | --- |
   | `columns` | bars rise one after another to cover the page, then carry on up to reveal the next | slats, shutters, a stage's flats |
   | `circle` | a circle grows from where the visitor clicked to cover the page, and the next page opens from the same spot | a lens, a porthole, a spotlight |
   | `stack` (old-page) | the page steps back like a card going onto a pile and a sheet slides up over it | a pile of sheets, programmes, menus |
   | `slide-over` (old-page) | the next page slides up over this one, which steps back into the dark | a drawer, a sliding door, a night falling |
   | `peel` (old-page) | the page turns over like a sheet of paper, the fold sweeping from one corner to the other | a poster, a page of a book, a label |
   | `slices` (old-page) | the page breaks into columns and in each the next page pushes the old one up, column after column | a press, a row of planks or tiles |
   | `frame` (old-page) | a coloured rectangle grows from the middle and the next page grows inside it as a frame | a gallery, a picture rail, a window |
   | `cube` (old-page) | the page pulls back as the face of a box, the box turns to the next page and comes forward | a sign that turns, a box, a die |
   | `corner` (old-page) | a coloured rectangle, a dark one and then the next page grow from the top-left corner | printed matter in layers, a poster run |
   | `tear` (old-page) | a jagged tear runs down from where the visitor clicked and the two halves pull apart | a ticket stub, a flyer, a wall poster |
   | `carousel` (old-page) | the page zooms out into a row of the site's pages, slides to the next and zooms in | a set list, a run of rooms, a menu of dishes |
   | `typewriter` | a dark sheet comes in and a grid of cells types the site's tagline, then erases it | a press, a newsroom, a typed form |

   `frame`, `corner` and others take their colours from the site's CSS when it defines `--red`, `--color-accent` or `--color-bg` (their comments say which), so set those to the world's colours. `carousel` reads its row of pages from the links its `LINKS` selector finds and `typewriter` types a `PHRASE`: point both at the site's own navigation and words before using them. The WebGL ones (`channel`, `dissolve`, `dither`, `ink`, `particles`, `spiral`, `velvet`) need three.js and are not part of this recipe. One link can use another transition with `data-transition="<name>"`.

Three things change once the client router is on, because a page change no longer loads a new document:

- **A site script that sets up a page runs on the first page only.** Wrap its set-up in `document.addEventListener('astro:page-load', () => { … })`, which runs on the first load and after every page change. Look for the page's elements inside `document.querySelector('main')`.
- **A form that must post as a normal page load** takes the attribute `data-astro-reload`.
- **A modal `<dialog>` stays above the cover.** Close it on the `interlude:leave` event.

**Check.** Run `npm run verify`: it passes with the copied files in place (the lint, the CSS contract, the tests and the type check were run on them). Then build and serve. In a browser at 1440 wide: click a link in the navigation to the second built page, wait three seconds, then confirm all of these: the address changed; `document.querySelector('[data-interlude]').dataset.state` is `"idle"`; `document.activeElement` is the `<main>` element; `document.querySelectorAll('[inert]').length` is `0`; the browser console shows no error. Press Back and confirm the first page is shown and scrolls. Then repeat the click with reduced motion emulated: the page changes at once.

## 3. A pinned scene

A pinned scene is a section whose stage stays on screen while the visitor scrolls through it, and whose parts move with the scroll. It is plain CSS (a scroll-driven animation on a sticky stage), so it needs no library and works with the smoothed scroll. Build at least one on the home page.

**The scene tells the site's subject; it does not decorate it.** Find the scene in this client's own material, in three steps, and write the answers in `audit/world/notes.md`:

1. List three things about this client that change as you go through them: something that unfolds in time, something you move through in space, something that is made or done in stages, something that is taken apart or put together. Take each from the client's message and photographs, and name the photographs that would show it.
2. Choose the one with the most photographs that differ from each other, and that no other business of the same trade could show in the same way.
3. Write its steps, three to six, each with the photograph or block of content that fills the stage at that step.

This page gives no example of a scene on purpose. An earlier version named one, and all three trial sites built from it afterwards made that same scene.

Then fill the stage with it: each step of the scene shows a photograph or a block of content across at least half the screen, and the steps replace one another as the visitor scrolls. Two trial sites built from one brief show the difference. Through one scene 58% of the screen changed from step to step. In the other a single ornament turned beside three lines of text for three screens of scrolling, and 0.2% changed: it met every rule and showed nothing. `audit:composition` measures this and fails a scene through which less than a quarter of the screen changes.

```astro
<section class="scene bleed" aria-labelledby="scene-title">
  <div class="scene__stage">
    <h2 id="scene-title"><!-- the scene's title, in the client's words --></h2>
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
      /* Each plate takes its share of the time the stage is pinned ("contain"). The last one is in
         place at 70%, so the finished scene stays on screen for the last 0.6 of a screen. */
      .scene__plate[data-plate="1"] { animation-range: contain 0% contain 25%; }
      .scene__plate[data-plate="2"] { animation-range: contain 25% contain 50%; }
      .scene__plate[data-plate="3"] { animation-range: contain 50% contain 70%; }
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
- The last step of the scene is as full as the first. A scene that ends on an empty stage leaves the visitor scrolling through nothing.
- **The finished scene stays on screen before the stage leaves.** The last step is in place while the visitor can still scroll at least 0.6 of a screen with the whole stage in view. A scene whose last step completes at `contain 100%` finishes exactly as the stage scrolls away: on another project's owner-scored page, all seven scroll scenes were built that way, and the owner's remark was that everything finished opening just as the section left. The time left is `(1 − the last step's end) × (the track's screens − 1)`: on a `300svh` track end the last step by `contain 70%`, on `400svh` by `contain 80%`; a `200svh` track leaves one screen in all, too little for three steps and a hold, so give a scene of three or more steps `300svh`. The held scene still has something to read: the last step's words, not an empty stage.
- **When the steps sit on top of one another, one step shows at a time.** The example above lays its plates out one below the other, so each only arrives. When each step fills the stage and replaces the one before (the plates share one grid cell or are positioned on the stage), a step must also leave, or the words of two steps show through each other: two trial sites shipped exactly that. Give every step except the last keyframes that arrive and leave (`0% { opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { opacity: 0 }`), give the last step keyframes that only arrive, and set the ranges end to end so that one step's range ends where the next begins and the last ends early enough to hold, as the rule above says (`contain 0% contain 25%`, `contain 25% contain 50%`, `contain 50% contain 70%` on a `300svh` track). Check it by scrolling slowly through the scene on the built site: at no point are two steps' words readable together.
- A label that belongs to one step changes with the steps. A large hour, number or title that stays the same through every step while a smaller one beside it changes reads as a mistake.
- An ornament that turns, a line that draws or a number that counts may accompany the steps; on its own it is not a scene.

**Check.** Build, serve, and run `npm run audit:composition -- --base <origin> --routes <the built pages>`. It prints `Motion Tier impression: smoothed scroll, moving page changes and a pinned scene are present.` when all three pieces are built, or `[impression-motion]` with the piece that is missing. "A pinned scene that carries the subject" means the scene is there and too little of the screen changes through it: make its steps larger, as the paragraph above says, and run the audit again. "A pinned scene that holds its last step" means the scene's scroll-driven animations finish too close to the moment the stage scrolls away: end the last step's range earlier, as the rules above say. Then run `npm run check:quality -- --base <origin> --routes <the built pages> --only script-weight,first-viewport-hidden,first-viewport-scroll-motion`. If it reports `script-weight`, the site's own scripts pushed the page over 120 KB: add `"limits": { "scriptKB": 200, "_why": "impression tier: GSAP, the transition engine and the smoothed scroll" }` to `page-budget.json` at the site root, and run it again.

## Record it

On the record's World › Motion line, after the world's motions, say that the scroll is smoothed and which transition the pages use. In the Decisions, name `lenis@1.3.28`, `gsap@3.15.1` and the Interlude commit.
