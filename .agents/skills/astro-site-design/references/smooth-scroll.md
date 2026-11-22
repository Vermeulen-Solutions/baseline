# Smooth scroll for impression-led sites

Read this when the Art Direction Record sets the motion range to expressive and the site's job is the impression, or when a page's staging is built on the scroll (pinned photographs, view-timeline entrances, layered parallax). Smoothed wheel scrolling gives that staging weight: the page glides and settles instead of jumping by the wheel's steps, and the scroll-linked motion moves with it. It is a recorded dependency decision for one site, never a default. When the record says `Motion Tier: impression` it is required: build it as the first of the three pieces in [impression motion](impression-motion.md).

## When to reach for it

| Reach for it | Leave the scroll native |
|---|---|
| The visitor comes to look and be persuaded by the work, the place or the food: an architect, a studio, a photographer, an artist's or maker's portfolio, a restaurant, caterer or hotel, a venue, an event, a launch | The visitor comes to do something or find a fact: a local service where people want the phone number and the hours, booking and shop flows, forms, timetables, documentation, news |
| Long, image-led pages whose sections are staged with the scroll | Short pages, or pages read as reference |
| The motion range is expressive and the World names scroll-linked motions | The audience includes many older, motion-sensitive or assistive-technology users, or the performance budget is tight (public services, health, schools' admissions pages) |

A site with both jobs (a maker whose site is a portfolio and takes commissions) decides from the record's first job; when the enquiry comes first, keep the scroll native and put the expression in the world's objects and motions. Smooth scroll on its own adds little: it pays off with the scroll-linked staging it carries, so build that first.

## How

[Lenis](https://github.com/darkroomengineering/lenis) (MIT) wraps the window's own scroll, so `position: sticky`, anchors, find-in-page and CSS scroll-driven animations (`animation-timeline: view()`) keep working. Touch screens keep their native scroll (its `syncTouch` stays off), and with `prefers-reduced-motion: reduce` it turns the smoothing off by itself. It adds about 6 KB compressed.

```bash
npm install --save-exact lenis@1.3.27
```

`src/components/SmoothScroll.astro`, placed once in the layout (`<SmoothScroll slot="body-end" />` inside `SiteShell`):

```astro
---
/** Smoothed wheel scrolling for an impression-led site (recorded in the Art Direction Record). */
---
<script>
  import Lenis from 'lenis';
  import 'lenis/dist/lenis.css';

  const w = window as typeof window & { smoothScroll?: Lenis };
  // With Interlude page transitions: is the transition layer covering the page?
  const covered = () => { const layer = document.querySelector<HTMLElement>('[data-interlude]'); return Boolean(layer && layer.dataset.state && layer.dataset.state !== 'idle'); };

  function start() {
    // The visual editor scrolls natively.
    if (document.getElementById('emdash-toolbar')) return;
    w.smoothScroll = new Lenis({
      autoRaf: true,
      anchors: true, // in-page links glide too
      allowNestedScroll: true, // menus, lists and lightboxes that scroll inside themselves stay native
      stopInertiaOnNavigate: true,
    });
    // Started under a page transition's cover: still until the page is shown.
    if (covered()) w.smoothScroll.stop();
  }

  start();
  // With <ClientRouter />: no gliding under a page change. The swap replaces the <html> classes Lenis
  // keeps its state in, so a fresh instance starts on the new page (a kept one stays stopped).
  document.addEventListener('astro:before-preparation', () => w.smoothScroll?.stop());
  document.addEventListener('astro:after-swap', () => {
    w.smoothScroll?.destroy();
    start();
  });
  // Interlude has uncovered the new page: scroll again. Without Interlude this event never fires.
  document.addEventListener('interlude:idle', () => w.smoothScroll?.start());
</script>
```

Two settings to leave alone:

- **`autoToggle`** stops Lenis while the page has `overflow: hidden`. Under `<ClientRouter />` the swap wipes the classes it depends on, and the next page can no longer be scrolled with the wheel. Baseline's menu does not lock the page, and a modal that does can use `data-lenis-prevent` on its scrolling area.
- **`syncTouch`** smooths touch scrolling too; it fights the phone's own inertia and is unstable on older iOS.

Lenis does not support CSS `scroll-snap` (leave snapping out of a smoothed page) and stops gliding over an `<iframe>` such as an embedded map; put `data-lenis-prevent` on any element that should scroll natively when `allowNestedScroll` does not catch it.

## Check it on the built site

On the preview (`npm run build`, then serve), at 1440 wide:

- a wheel step glides over about a second (sample `scrollY` every 60 ms after `mouse.wheel(0, 800)`), and under `reducedMotion: 'reduce'` it lands at once;
- the skip link still moves focus to the main content, and Page Down and the arrow keys scroll;
- the world's scroll-driven motions still run (`audit:composition` reports them, and `world-motion` stays quiet);
- at 390 wide with touch, the page scrolls natively and the menu opens and scrolls;
- after a page change (cross-document, or `<ClientRouter />` and the back button), the new page scrolls with the wheel, and going back restores the position.

Record in the World's `Motion` line that the scroll is smoothed and why, and in the Decisions the dependency and its version.
