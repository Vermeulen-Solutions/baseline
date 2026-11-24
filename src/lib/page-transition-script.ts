/**
 * The head script behind SiteShell's transitionStyle on cross-document view transitions.
 *
 * A cross-document transition has no router to say which way a visitor moved or which card they
 * picked, so the two pages agree through pageswap (the page being left) and pagereveal (the page
 * arriving):
 * - direction: Back and Forward in history compare entry indexes; a link compares path depth, and
 *   data-vt-direction="back|forward" on the link or an ancestor overrides it. The arriving page
 *   carries html[data-vt-direction] until the transition ends, so styles can run the other way.
 * - morph: a link inside a card ([data-vt-card] or .card) names that card's parts, and the arriving
 *   page names its hero parts the same, so the card grows into the detail page as one object. A part
 *   is [data-vt-part="<name>"] in the card and [data-vt-hero-part="<name>"] on the detail page; the
 *   card's media (.card-media or [data-vt-media]) is the part "media" and [data-vt-title] the part
 *   "title", with [data-vt-hero-media] / [data-vt-hero-title] their heroes. A Card's plain .card-title
 *   is not a part: a part that finds no partner on the next page fades on its own, so a title travels
 *   only where the site marks both ends. Only the picked card is named, as hero-<part>. Going back
 *   (history Back, or a link marked data-vt-direction="back"), the detail page names its hero parts
 *   and the list page the card that links to the page left, so the object shrinks back into its place.
 * - arrival: [data-arrive] elements on the arriving page get their own names (arrive-1, arrive-2 …)
 *   and the classes arrive / arrive-2 / arrive-3, so they come in after the page in every browser.
 *   Generated names (match-element) never pair across documents, and Safari ignores them there.
 * - origin: the point the visitor clicked, as --vt-x and --vt-y on the root, for styles that open
 *   from it (iris). Without a click (history, keyboard), the centre.
 *
 * It must be a classic inline script in <head>: pagereveal fires before the first frame, before
 * any module runs. Browsers without these events load pages as before.
 */
export const PAGE_TRANSITION_KEY = 'baseline:page-transition';

/** The page-change styles src/styles/expressive.css draws for SiteShell transitionStyle. */
export const TRANSITION_STYLES = ['fade', 'lift', 'curtain', 'wipe', 'iris', 'blinds', 'slide', 'stack'] as const;
export type TransitionStyle = (typeof TRANSITION_STYLES)[number];

export function pageTransitionScript(): string {
  return `(() => {
  if (!('onpagereveal' in window)) return;
  const KEY = ${JSON.stringify(PAGE_TRANSITION_KEY)};
  const root = document.documentElement;
  const PART = /^[a-z][a-z0-9-]{0,30}$/;
  const depth = (url) => new URL(url, location.href).pathname.replace(/\\/+$/, '').split('/').filter(Boolean).length;
  const path = (url) => { try { return new URL(url, location.href).pathname.replace(/\\/+$/, '') || '/'; } catch { return ''; } };
  const same = (a, b) => { try { const x = new URL(a, location.href), y = new URL(b, location.href); return x.origin === y.origin && x.pathname === y.pathname; } catch { return false; } };
  // The parts of a card, and the hero parts of a detail page, as [part name, element] pairs.
  const cardParts = (card) => {
    const found = new Map();
    const media = card.querySelector('[data-vt-media], .card-media');
    const title = card.querySelector('[data-vt-title]');
    if (media) found.set('media', media);
    if (title) found.set('title', title);
    card.querySelectorAll('[data-vt-part]').forEach((el) => { const name = el.getAttribute('data-vt-part'); if (PART.test(name || '') && !found.has(name)) found.set(name, el); });
    return found;
  };
  const heroParts = () => {
    const found = new Map();
    const media = document.querySelector('[data-vt-hero-media]');
    const title = document.querySelector('[data-vt-hero-title]');
    if (media) found.set('media', media);
    if (title) found.set('title', title);
    document.querySelectorAll('[data-vt-hero-part]').forEach((el) => { const name = el.getAttribute('data-vt-hero-part'); if (PART.test(name || '') && !found.has(name)) found.set(name, el); });
    return found;
  };
  const named = [];
  const nameAs = (el, name, cls) => {
    if (!(el instanceof HTMLElement) || el.style.viewTransitionName) return false;
    el.style.viewTransitionName = name;
    el.style.viewTransitionClass = cls;
    named.push(el);
    return true;
  };
  const nameParts = (parts, only) => {
    const done = [];
    parts.forEach((el, part) => { if ((!only || only.includes(part)) && nameAs(el, 'hero-' + part, part === 'media' ? 'vt-media' : 'vt-part')) done.push(part); });
    return done;
  };
  const clear = () => {
    named.splice(0).forEach((el) => { el.style.viewTransitionName = ''; el.style.viewTransitionClass = ''; });
    root.removeAttribute('data-vt-direction');
    root.style.removeProperty('--vt-x');
    root.style.removeProperty('--vt-y');
  };
  let source = null;
  let point = null;
  addEventListener('click', (event) => {
    source = event.target instanceof Element ? event.target.closest('a[href]') : null;
    point = event.clientX || event.clientY ? { x: Math.round((event.clientX / innerWidth) * 100), y: Math.round((event.clientY / innerHeight) * 100) } : null;
  }, true);
  addEventListener('pageswap', (event) => {
    const to = event.activation && event.activation.entry && event.activation.entry.url;
    if (!event.viewTransition || !to) return;
    const link = source && same(source.href, to) ? source : null;
    const override = link && link.closest('[data-vt-direction]');
    const traverse = event.activation.navigationType === 'traverse';
    let dir = depth(to) < depth(location.href) ? 'back' : 'forward';
    if (traverse && event.activation.from && event.activation.entry && typeof event.activation.entry.index === 'number' && typeof event.activation.from.index === 'number') dir = event.activation.entry.index < event.activation.from.index ? 'back' : 'forward';
    if (override) dir = override.getAttribute('data-vt-direction') === 'back' ? 'back' : 'forward';
    const card = !traverse && link ? link.closest('[data-vt-card], .card') : null;
    let parts = card ? nameParts(cardParts(card)) : [];
    // Going back from a detail page (history Back, or a link marked back): its hero parts return into
    // the card that links here. Going up by path depth alone (to the home page) names nothing.
    const backward = dir === 'back' && (traverse || Boolean(override));
    const from = !card && backward ? path(location.href) : '';
    if (from) parts = nameParts(heroParts());
    const at = link && point ? point : { x: 50, y: 50 };
    try { sessionStorage.setItem(KEY, JSON.stringify({ to: path(to), dir, parts, from, x: at.x, y: at.y })); } catch {}
  });
  addEventListener('pagereveal', (event) => {
    let note = null;
    try { note = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch {}
    if (!event.viewTransition) return;
    const mine = note && note.to === path(location.href) ? note : null;
    const activation = window.navigation && navigation.activation;
    let dir = mine ? mine.dir : 'forward';
    if (activation && activation.navigationType === 'traverse' && activation.from && activation.entry) dir = activation.entry.index < activation.from.index ? 'back' : 'forward';
    root.setAttribute('data-vt-direction', dir);
    const x = mine && Number.isFinite(mine.x) ? mine.x : 50;
    const y = mine && Number.isFinite(mine.y) ? mine.y : 50;
    root.style.setProperty('--vt-x', x + '%');
    root.style.setProperty('--vt-y', y + '%');
    const parts = mine && Array.isArray(mine.parts) ? mine.parts.filter((part) => PART.test(part)) : [];
    if (parts.length && mine.from) {
      const link = [...document.querySelectorAll('a[href]')].find((a) => path(a.href) === mine.from && a.closest('[data-vt-card], .card'));
      if (link) nameParts(cardParts(link.closest('[data-vt-card], .card')), parts);
    } else if (parts.length) {
      nameParts(heroParts(), parts);
    }
    if (root.hasAttribute('data-transition-style')) {
      document.querySelectorAll('[data-arrive]').forEach((el, index) => {
        const step = el.getAttribute('data-arrive');
        nameAs(el, 'arrive-' + (index + 1), step === '2' ? 'arrive arrive-2' : step === '3' ? 'arrive arrive-3' : 'arrive');
      });
    }
    event.viewTransition.finished.finally(clear);
  });
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    clear();
    document.querySelectorAll('[style*="view-transition-name: hero-"]').forEach((el) => { el.style.viewTransitionName = ''; el.style.viewTransitionClass = ''; });
  });
})();`;
}
