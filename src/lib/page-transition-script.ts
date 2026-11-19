/**
 * The head script behind SiteShell's transitionStyle on cross-document view transitions.
 *
 * A cross-document transition has no router to say which way a visitor moved or which card they
 * picked, so the two pages agree through pageswap (the page being left) and pagereveal (the page
 * arriving):
 * - direction: Back and Forward in history compare entry indexes; a link compares path depth, and
 *   data-vt-direction="back|forward" on the link or an ancestor overrides it. The arriving page
 *   carries html[data-vt-direction] until the transition ends, so styles can run the other way.
 * - morph: a link inside a card ([data-vt-card] or .card) names that card's media (.card-media or
 *   [data-vt-media]) hero-media, and the arriving page names its [data-vt-hero-media] the same, so
 *   the picture grows into the detail page. Only the picked card is named.
 *
 * It must be a classic inline script in <head>: pagereveal fires before the first frame, before
 * any module runs. Browsers without these events load pages as before.
 */
export const PAGE_TRANSITION_KEY = 'baseline:page-transition';

export function pageTransitionScript(): string {
  return `(() => {
  if (!('onpagereveal' in window)) return;
  const KEY = ${JSON.stringify(PAGE_TRANSITION_KEY)};
  const root = document.documentElement;
  const depth = (url) => new URL(url, location.href).pathname.replace(/\\/+$/, '').split('/').filter(Boolean).length;
  const same = (a, b) => { try { const x = new URL(a, location.href), y = new URL(b, location.href); return x.origin === y.origin && x.pathname === y.pathname; } catch { return false; } };
  let source = null;
  addEventListener('click', (event) => { source = event.target instanceof Element ? event.target.closest('a[href]') : null; }, true);
  addEventListener('pageswap', (event) => {
    const to = event.activation && event.activation.entry && event.activation.entry.url;
    if (!event.viewTransition || !to) return;
    const link = source && same(source.href, to) ? source : null;
    const override = link && link.closest('[data-vt-direction]');
    const traverse = event.activation.navigationType === 'traverse';
    let dir = depth(to) < depth(location.href) ? 'back' : 'forward';
    if (override) dir = override.getAttribute('data-vt-direction') === 'back' ? 'back' : 'forward';
    const card = !traverse && link ? link.closest('[data-vt-card], .card') : null;
    const media = card ? card.querySelector('[data-vt-media], .card-media') : null;
    if (media && !media.style.viewTransitionName) { media.style.viewTransitionName = 'hero-media'; media.style.viewTransitionClass = 'vt-media'; }
    try { sessionStorage.setItem(KEY, JSON.stringify({ to: new URL(to, location.href).pathname, dir, morph: Boolean(media) })); } catch {}
  });
  addEventListener('pagereveal', (event) => {
    let note = null;
    try { note = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch {}
    if (!event.viewTransition) return;
    const activation = window.navigation && navigation.activation;
    let dir = note && note.to === location.pathname ? note.dir : 'forward';
    if (activation && activation.navigationType === 'traverse' && activation.from && activation.entry) dir = activation.entry.index < activation.from.index ? 'back' : 'forward';
    root.setAttribute('data-vt-direction', dir);
    const hero = note && note.morph && note.to === location.pathname ? document.querySelector('[data-vt-hero-media]') : null;
    if (hero instanceof HTMLElement && !hero.style.viewTransitionName) { hero.style.viewTransitionName = 'hero-media'; hero.style.viewTransitionClass = 'vt-media'; }
    event.viewTransition.finished.finally(() => {
      root.removeAttribute('data-vt-direction');
      if (hero instanceof HTMLElement) { hero.style.viewTransitionName = ''; hero.style.viewTransitionClass = ''; }
    });
  });
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    root.removeAttribute('data-vt-direction');
    document.querySelectorAll('[style*="view-transition-name: hero-media"]').forEach((el) => { el.style.viewTransitionName = ''; el.style.viewTransitionClass = ''; });
  });
})();`;
}
