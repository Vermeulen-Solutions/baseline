import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('src/styles/expressive.css');
const shell = read('src/layouts/SiteShell.astro');
const stage = read('src/components/MediaStage.astro');
const index = read('src/components/IndexList.astro');
const scriptSource = read('src/lib/page-transition-script.ts');

/** Text of the block that opens at `start` (balanced braces). */
function block(source, start) {
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open, i + 1);
  }
  return '';
}

test('every scroll-driven effect sits inside reduced-motion and feature guards', () => {
  const guarded = block(css, css.indexOf('@media (prefers-reduced-motion: no-preference)'));
  assert.match(guarded, /@supports \(animation-timeline: view\(\)\)/);
  for (const selector of ['[data-reveal="frame"]', '[data-reveal="mask"]', '[data-scroll="open"]', '[data-scroll="recede"]', '[data-scroll="rise"]']) {
    assert.ok(guarded.includes(selector), `${selector} is guarded`);
  }
  const outside = css.replace(guarded, '');
  assert.doesNotMatch(outside, /animation-timeline/, 'no scroll timeline outside the guard');
  assert.match(guarded, /:root:has\(#emdash-toolbar\)\) :where\(\[data-reveal="frame"\][^)]*\) \{\s*animation: none;/, 'the visual editor keeps everything at rest');
});

test('the layer is opt-in: every rule needs an attribute or class a page adds', () => {
  const rules = [...css.matchAll(/^\t([^@\s/}][^{}]*)\{/gm)].map((match) => match[1].trim());
  const optIn = /\.bleed|\.display-fit|data-shape|data-tone|data-reveal|data-scroll|data-transition-style|data-arrive|\.arrive|^:root$|:root:has\(\.bleed\)/;
  for (const selector of rules) {
    if (/^(from|to|\d)/.test(selector)) continue;
    assert.match(selector, optIn, `rule "${selector}" applies only after a page opts in`);
  }
  assert.doesNotMatch(css, /^\t[^\t@]*\b(?:img|section|h[1-6]|main|body)\s*\{/m, 'no bare element rules');
});

test('page-transition styles and arrival choreography stand down for reduced motion', () => {
  const reduce = block(css, css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduce, /html\[data-transition-style\]::view-transition-old\(root\)/);
  assert.match(reduce, /::view-transition-new\(\*\.arrive\)/);
  assert.match(reduce, /animation: none !important/);
  assert.match(css, /:where\(html\[data-transition-style\]:active-view-transition\) :where\(\[data-arrive\]\) \{\s*view-transition-name: match-element;/, 'arrival names exist only during a transition');
});

test('colours and motion values come from tokens', () => {
  const declarations = css.split('\n').filter((line) => /^\s+[a-z-]+:/.test(line) && !/^\s+--/.test(line));
  for (const line of declarations) assert.doesNotMatch(line, /#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/i, line.trim());
  for (const duration of css.matchAll(/var\(--duration-([a-z]+)\)/g)) assert.ok(['fast', 'base', 'slow', 'slower', 'stage'].includes(duration[1]), duration[0]);
  for (const ease of css.matchAll(/var\(--ease-([a-z]+)\)/g)) assert.ok(['smooth', 'snappy', 'spring', 'exit'].includes(ease[1]), ease[0]);
  assert.match(css, /--duration-stage: 560ms;/);
  assert.match(css, /--radius-shape: clamp\(/);
});

test('photograph treatments apply only where a frame or image asks for one, and duotone inks come from tokens', () => {
  assert.match(css, /:where\(\[data-tone="warm"\]\) :where\(img\),\s*:where\(img\[data-tone="warm"\]\) \{\s*filter: sepia\(0\.28\)/);
  assert.match(css, /:where\(\[data-tone="mono"\]\) :where\(img\)/);
  assert.match(css, /:where\(\[data-tone="duotone"\]\)::before \{\s*background-color: var\(--tone-ink\);\s*mix-blend-mode: color;/);
  assert.match(css, /:where\(\[data-tone="duotone"\]\)::after \{\s*background-color: var\(--tone-paper\);\s*mix-blend-mode: multiply;/);
  assert.match(css, /--tone-ink: var\(--color-action\);/);
  assert.match(stage, /data-tone=\{tone === 'warm' \|\| tone === 'mono' \|\| tone === 'duotone' \? tone : undefined\}/);
});

test('the fitted line stays between a rem floor and 2.5 times it, so browser zoom can always double it', () => {
  assert.match(css, /font-size: clamp\(var\(--display-fit-min, 3rem\), calc\(100cqi \/ var\(--fit, 6\)\), calc\(var\(--display-fit-min, 3rem\) \* 2\.5\)\);/);
  assert.match(css, /text-wrap: balance;/);
  assert.doesNotMatch(block(css, css.indexOf('.display-fit > :where(*)')), /white-space: nowrap/);
});

test('SiteShell writes the style only when a site sets it, and the script only for cross-document navigation', async () => {
  const { TRANSITION_STYLES } = await import(new URL('../src/lib/page-transition-script.ts', import.meta.url));
  assert.deepEqual([...TRANSITION_STYLES], ['fade', 'lift', 'curtain', 'wipe', 'iris', 'blinds', 'slide', 'stack']);
  for (const style of TRANSITION_STYLES.slice(1)) assert.match(css, new RegExp('html\\[data-transition-style="' + style + '"\\]::view-transition-new\\(root\\)'), style + ' is drawn');
  assert.match(shell, /transitionStyle\?: TransitionStyle;/);
  assert.match(shell, /const transitionStyle = TRANSITION_STYLES\.includes\(rawTransitionStyle as TransitionStyle\) \? rawTransitionStyle : undefined;/);
  assert.match(shell, /const transitionScript = transitionStyle && pageTransitions === 'cross-document' \? pageTransitionScript\(\) : undefined;/);
  assert.match(shell, /data-transition-style=\{transitionStyle\}/);
  assert.match(shell, /\{transitionScript && <script is:inline set:html=\{transitionScript\}><\/script>\}/);
});

/**
 * A small fake page: elements with attributes, a parent, children, closest() and the two query methods,
 * enough for the head script. Selectors are the simple ones the script uses: [attr], [attr="v"],
 * .class and a[href], joined with commas.
 */
function fakePage(build) {
  const all = [];
  const el = (tag, attrs = {}, children = []) => {
    const node = { tag, attrs: { ...attrs }, children, parent: null, style: { viewTransitionName: '', viewTransitionClass: '' } };
    if ('href' in node.attrs) node.href = node.attrs.href;
    node.getAttribute = (k) => (k in node.attrs ? node.attrs[k] : null);
    node.hasAttribute = (k) => k in node.attrs;
    node.matches = (selector) => selector.split(',').map((part) => part.trim()).some((one) => {
      if (one === 'a[href]') return tag === 'a' && 'href' in node.attrs;
      const cls = one.match(/^\.([\w-]+)$/);
      if (cls) return (node.attrs.class || '').split(/\s+/).includes(cls[1]);
      const attr = one.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
      if (attr) return attr[1] in node.attrs && (attr[2] === undefined || node.attrs[attr[1]] === attr[2]);
      throw Error('selector not supported by the fake: ' + one);
    });
    node.closest = (selector) => { for (let n = node; n; n = n.parent) if (n.matches(selector)) return n; return null; };
    const descendants = () => node.children.flatMap((child) => [child, ...child.descendants()]);
    node.descendants = descendants;
    node.querySelectorAll = (selector) => descendants().filter((n) => n.matches(selector));
    node.querySelector = (selector) => node.querySelectorAll(selector)[0] ?? null;
    for (const child of children) child.parent = node;
    all.push(node);
    return node;
  };
  const body = build(el);
  return { body, all };
}

/** Runs the head script on a fake page and returns its listeners and state. */
async function runScript({ href = 'https://site.test/works/', page = () => [], transitionStyle = 'lift' } = {}) {
  const { pageTransitionScript } = await import(new URL('../src/lib/page-transition-script.ts', import.meta.url));
  const listeners = {};
  const attributes = new Map(transitionStyle ? [['data-transition-style', transitionStyle]] : []);
  const rootStyle = new Map();
  const storage = new Map();
  const { body } = fakePage((el) => el('body', {}, page(el)));
  const location = new URL(href);
  const context = {
    URL,
    JSON,
    Boolean,
    Number,
    Math,
    Array,
    location,
    innerWidth: 1000,
    innerHeight: 800,
    sessionStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) },
    addEventListener: (name, fn) => { listeners[name] = fn; },
    document: {
      documentElement: {
        setAttribute: (k, v) => attributes.set(k, v),
        removeAttribute: (k) => attributes.delete(k),
        getAttribute: (k) => attributes.get(k) ?? null,
        hasAttribute: (k) => attributes.has(k),
        style: { setProperty: (k, v) => rootStyle.set(k, v), removeProperty: (k) => rootStyle.delete(k) },
      },
      querySelector: (selector) => body.querySelector(selector),
      querySelectorAll: (selector) => body.querySelectorAll(selector),
    },
    HTMLElement: Object,
    Element: Object,
  };
  context.window = context;
  context.onpagereveal = null;
  vm.createContext(context);
  vm.runInContext(pageTransitionScript(), context);
  const find = (selector) => body.querySelector(selector);
  return { listeners, attributes, rootStyle, storage, context, find };
}

const swap = (page, to, type = 'push') => page.listeners.pageswap({ viewTransition: {}, activation: { navigationType: type, entry: { url: to } } });
const reveal = (page) => {
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  page.listeners.pagereveal({ viewTransition: { finished } });
  return async () => { finish(); await finished; await new Promise((resolve) => setImmediate(resolve)); };
};

// A works list: two cards, each with a photograph, a title, a year and a link.
const list = (el) => [
  el('article', { class: 'card' }, [
    el('div', { class: 'card-media' }),
    el('h3', { class: 'card-title', 'data-vt-title': '' }, [el('a', { href: 'https://site.test/works/dusk/' })]),
    el('span', { 'data-vt-part': 'year' }),
  ]),
  el('article', { class: 'card' }, [
    el('div', { class: 'card-media' }),
    el('h3', { class: 'card-title' }, [el('a', { href: 'https://site.test/works/dawn/' })]),
    el('span', { 'data-vt-part': 'year' }),
  ]),
];
// A work's page: its photograph, title and year as hero parts, and two arriving lines.
const detail = (el) => [
  el('figure', { 'data-vt-hero-media': '' }),
  el('h1', { 'data-vt-hero-title': '', 'data-arrive': '' }),
  el('p', { 'data-vt-hero-part': 'year' }),
  el('p', { 'data-arrive': '2' }),
  el('p', { 'data-arrive': '3' }),
];

test('the page being left records the direction by path depth, and a link can override it', async () => {
  const page = await runScript({ href: 'https://site.test/works/valley/', page: (el) => [el('nav', { 'data-vt-direction': 'back' }, [el('a', { href: 'https://site.test/works/valley/detail/' })]), el('a', { href: 'https://site.test/works/' })] });
  page.listeners.click({ target: page.find('[href="https://site.test/works/"]') ?? { closest: () => null }, clientX: 0, clientY: 0 });
  swap(page, 'https://site.test/works/');
  assert.equal(JSON.parse(page.storage.get('baseline:page-transition')).dir, 'back');

  const deeper = page.find('[data-vt-direction]').querySelector('a[href]');
  page.listeners.click({ target: deeper, clientX: 0, clientY: 0 });
  swap(page, 'https://site.test/works/valley/detail/');
  assert.equal(JSON.parse(page.storage.get('baseline:page-transition')).dir, 'back', 'data-vt-direction="back" wins over depth');
});

test('only the picked card names its parts, and the arriving page names its hero parts to match', async () => {
  const left = await runScript({ href: 'https://site.test/works/', page: list });
  const link = left.find('[href="https://site.test/works/dusk/"]');
  left.listeners.click({ target: link, clientX: 250, clientY: 200 });
  swap(left, 'https://site.test/works/dusk/');
  const [picked, other] = [link.closest('.card'), left.find('[href="https://site.test/works/dawn/"]').closest('.card')];
  assert.equal(picked.querySelector('.card-media').style.viewTransitionName, 'hero-media');
  assert.equal(picked.querySelector('.card-media').style.viewTransitionClass, 'vt-media');
  assert.equal(picked.querySelector('.card-title').style.viewTransitionName, 'hero-title');
  assert.equal(picked.querySelector('.card-title').style.viewTransitionClass, 'vt-part');
  assert.equal(picked.querySelector('[data-vt-part]').style.viewTransitionName, 'hero-year');
  assert.equal(other.querySelector('.card-media').style.viewTransitionName, '', 'other cards stay unnamed');
  const note = JSON.parse(left.storage.get('baseline:page-transition'));
  assert.deepEqual(note, { to: '/works/dusk', dir: 'forward', parts: ['media', 'title', 'year'], from: '', x: 25, y: 25 });

  const arriving = await runScript({ href: 'https://site.test/works/dusk/', page: detail });
  arriving.storage.set('baseline:page-transition', left.storage.get('baseline:page-transition'));
  const end = reveal(arriving);
  assert.equal(arriving.attributes.get('data-vt-direction'), 'forward');
  assert.equal(arriving.rootStyle.get('--vt-x'), '25%', 'the click point is the origin of an iris');
  assert.equal(arriving.find('[data-vt-hero-media]').style.viewTransitionName, 'hero-media');
  assert.equal(arriving.find('[data-vt-hero-title]').style.viewTransitionName, 'hero-title', 'a part is named once, as the hero, even when it also arrives');
  assert.equal(arriving.find('[data-vt-hero-part]').style.viewTransitionName, 'hero-year');
  const arrive = arriving.find('[data-arrive="2"]');
  assert.equal(arrive.style.viewTransitionName, 'arrive-2', 'arriving lines get their own names, which every browser pairs');
  assert.equal(arrive.style.viewTransitionClass, 'arrive arrive-2');
  assert.equal(arriving.find('[data-arrive="3"]').style.viewTransitionClass, 'arrive arrive-3');
  await end();
  assert.equal(arriving.attributes.has('data-vt-direction'), false, 'direction is cleared when the transition ends');
  assert.equal(arriving.rootStyle.size, 0, 'the click point is cleared');
  assert.equal(arriving.find('[data-vt-hero-media]').style.viewTransitionName, '', 'the hero names are cleared');
  assert.equal(arrive.style.viewTransitionName, '', 'the arrival names are cleared');
});

test('going back, the detail page names its hero parts and the list names the card that links to it', async () => {
  const leaving = await runScript({ href: 'https://site.test/works/dusk/', page: detail });
  leaving.listeners.click({ target: { closest: () => null }, clientX: 0, clientY: 0 });
  swap(leaving, 'https://site.test/');
  assert.equal(leaving.find('[data-vt-hero-media]').style.viewTransitionName, '', 'going up to the home page by a plain link names nothing');
  leaving.listeners.pageswap({ viewTransition: {}, activation: { navigationType: 'traverse', from: { index: 4 }, entry: { index: 3, url: 'https://site.test/works/' } } });
  assert.equal(leaving.find('[data-vt-hero-media]').style.viewTransitionName, 'hero-media');
  assert.equal(leaving.find('[data-vt-hero-part]').style.viewTransitionName, 'hero-year');
  const note = JSON.parse(leaving.storage.get('baseline:page-transition'));
  assert.equal(note.dir, 'back');
  assert.equal(note.from, '/works/dusk');

  const list2 = await runScript({ href: 'https://site.test/works/', page: list });
  list2.storage.set('baseline:page-transition', leaving.storage.get('baseline:page-transition'));
  reveal(list2);
  const card = list2.find('[href="https://site.test/works/dusk/"]').closest('.card');
  assert.equal(card.querySelector('.card-media').style.viewTransitionName, 'hero-media');
  assert.equal(card.querySelector('[data-vt-part]').style.viewTransitionName, 'hero-year');
  assert.equal(list2.find('[href="https://site.test/works/dawn/"]').closest('.card').querySelector('.card-media').style.viewTransitionName, '');
  assert.equal(list2.attributes.get('data-vt-direction'), 'back');
});

test('history traversal compares entry indexes; no transition leaves the page untouched', async () => {
  const page = await runScript({ href: 'https://site.test/works/dusk/', page: detail });
  page.context.navigation = { activation: { navigationType: 'traverse', from: { index: 4 }, entry: { index: 3 } } };
  page.listeners.pagereveal({ viewTransition: { finished: new Promise(() => {}) } });
  assert.equal(page.attributes.get('data-vt-direction'), 'back');
  assert.equal(page.rootStyle.get('--vt-x'), '50%', 'without a click the origin is the centre');

  const still = await runScript({ href: 'https://site.test/works/', page: detail });
  still.listeners.pagereveal({ viewTransition: null });
  assert.equal(still.attributes.get('data-vt-direction'), undefined, 'reduced motion or no support: nothing is set');
  assert.equal(still.find('[data-vt-hero-media]').style.viewTransitionName, '');
  assert.equal(still.find('[data-arrive]').style.viewTransitionName, '');

  const plain = await runScript({ href: 'https://site.test/works/dusk/', page: detail, transitionStyle: null });
  reveal(plain);
  assert.equal(plain.find('[data-arrive="2"]').style.viewTransitionName, '', 'arrival names only with a transition style');
});

test('a card\'s plain title is not a part: only a title marked at both ends travels', async () => {
  const left = await runScript({ href: 'https://site.test/works/', page: list });
  const link = left.find('[href="https://site.test/works/dawn/"]');
  left.listeners.click({ target: link, clientX: 1, clientY: 1 });
  swap(left, 'https://site.test/works/dawn/');
  assert.equal(link.closest('.card').querySelector('.card-title').style.viewTransitionName, '');
  assert.deepEqual(JSON.parse(left.storage.get('baseline:page-transition')).parts, ['media', 'year']);
});

test('a part name is a short lower-case word; anything else is never written into a name', async () => {
  const left = await runScript({ href: 'https://site.test/works/', page: (el) => [el('article', { class: 'card' }, [el('a', { href: 'https://site.test/works/x/' }), el('span', { 'data-vt-part': 'Year; color: red' }), el('span', { 'data-vt-part': '9lives' })])] });
  left.listeners.click({ target: left.find('a[href]'), clientX: 1, clientY: 1 });
  swap(left, 'https://site.test/works/x/');
  for (const span of left.find('.card').querySelectorAll('[data-vt-part]')) assert.equal(span.style.viewTransitionName, '');
});

test('MediaStage keeps words readable: below the picture on a narrow stage, on a token scrim on a wide one', () => {
  assert.match(stage, /container: media-stage \/ inline-size;/);
  assert.match(stage, /\.media-stage__layout \{\s*display: grid;\s*grid-template-areas: "picture" "words" "caption";/);
  assert.match(stage, /@container media-stage \(min-width: 40rem\)/);
  assert.match(stage, /\.media-stage\[data-words\]\[data-stage="screen"\] \.media-stage__picture \{ block-size: min\(52svh, 56rem\); \}/, 'the heading stays on the first screen of a phone');
  assert.match(stage, /--stage-scrim: var\(--surface-dark-bg, /);
  assert.match(stage, /--color-text: var\(--surface-dark-text, /);
  assert.match(stage, /loading=\{priority \? 'eager' : 'lazy'\}/);
  assert.match(stage, /fetchpriority=\{priority \? 'high' : undefined\}/);
  assert.match(stage, /@media \(forced-colors: active\)/);
});

test('IndexList rows are a real list with one stretched link, and the preview is decoration for fine pointers only', () => {
  assert.match(index, /<List \{\.\.\.attributes\} class:list=\{\['index-list', className\]\} role="list"/);
  assert.match(index, /<a class="clickable-parent" href=\{item\.href\}>\{item\.title\}<\/a>/);
  assert.match(index, /<span class="index-list__preview" aria-hidden="true" data-vt-media>/);
  assert.match(index, /<ResponsiveImage src=\{item\.image\} alt=""/);
  assert.match(index, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.index-list__preview \{ display: block; \}/);
  assert.doesNotMatch(index, /\.index-list__title \{[^}]*translate/, 'the title never moves under the pointer');
});

test('PhotoSet fits the photographs it is given, crops by design and moves a linked picture only for a fine pointer', () => {
  const set = read('src/components/PhotoSet.astro');
  assert.match(set, /const counts = \{ pair: \[2, 2\], trio: \[3, 3\], strip: \[3, 6\], tallSmall: \[2, 2\] \} as const;/);
  // Content changes: a count that does not suit the layout takes the arrangement that fits, and the build goes on.
  assert.doesNotMatch(set, /throw new Error\(`PhotoSet: layout "\$\{[a-z]+\}" takes/, 'a changed number of photographs never stops the build');
  assert.match(set, /throw new Error\(`PhotoSet: unknown layout/, 'a misspelt layout is still a build error');
  assert.match(set, /const items = given\.filter\(\(item\) => item && item\.image\);/, 'an item without a picture is left out');
  assert.match(set, /count >= range\[0\] && count <= range\[1\] \? wanted\s*: count <= 1 \? 'single'\s*: count === 2 \? 'pair'\s*: count === 3 \? 'trio'\s*: 'strip';/);
  assert.match(set, /Math\.ceil\(count \/ Math\.ceil\(count \/ 6\)\)/, 'a long strip wraps into rows of equal length');
  assert.match(set, /\{\(count > 0 \|\| hasWords\) && <div/, 'nothing is rendered for an empty set without words');
  assert.match(set, /import\.meta\.env\.DEV\) \{\s*console\.warn\(`PhotoSet: layout/, 'the mismatch is said once, while developing');
  assert.doesNotMatch(set, /:has\(\.photo-set__item:nth-of-type/, 'the strip takes its row length from the count, not from a selector per count');
  assert.match(set, /container: photo-set \/ inline-size;/);
  assert.match(set, /@container photo-set \(min-width: 40rem\)/);
  assert.match(set, /class="photo-set__frame" data-tone=\{toneValue\} data-audit-crop-ok/, 'audit:ui knows the frame crops on purpose');
  assert.match(set, /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(set, /<figure class="photo-set__item"/);
  assert.doesNotMatch(set, /#[0-9a-f]{3,8}\b|\d+ms/i, 'colours and durations come from tokens');
});

test('a cross-document site ships no client-router code', () => {
  assert.match(shell, /const routerSupport = pageTransitions !== 'cross-document';/);
  assert.match(shell, /\{routerSupport && \(\s*<script is:inline>/);
  const core = shell.slice(shell.indexOf("const STORAGE_KEY = 'baseline:surface';"), shell.indexOf('{routerSupport && ('));
  for (const routerOnly of ['astro:before-preparation', 'astro:before-swap', 'astro:after-swap', 'warmPage', 'cleanupMorphNames']) assert.ok(!core.includes(routerOnly), routerOnly + ' is only in the router script');
  assert.match(core, /window\.__baseline_applySurface = applySurface;/);
  assert.doesNotMatch(shell, /^\s*import \{ swapFunctions \} from 'astro:transitions\/client';/m, 'the swap helpers are not a static import');
  assert.match(shell, /if \(document\.querySelector\('meta\[name="astro-view-transitions-enabled"\]'\)\) \{\s*import\('astro:transitions\/client'\)/);
});

test('the transition script is a classic inline script with no module syntax', () => {
  assert.doesNotMatch(scriptSource.slice(scriptSource.indexOf('return `')), /\bimport\b|\bexport\b/);
  assert.match(scriptSource, /if \(!\('onpagereveal' in window\)\) return;/);
});
