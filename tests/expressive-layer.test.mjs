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

test('SiteShell writes the style only when a site sets it, and the script only for cross-document navigation', () => {
  assert.match(shell, /transitionStyle\?: 'fade' \| 'lift' \| 'curtain' \| 'wipe';/);
  assert.match(shell, /const transitionStyle = rawTransitionStyle === 'fade' \|\| rawTransitionStyle === 'lift' \|\| rawTransitionStyle === 'curtain' \|\| rawTransitionStyle === 'wipe' \? rawTransitionStyle : undefined;/);
  assert.match(shell, /const transitionScript = transitionStyle && pageTransitions === 'cross-document' \? pageTransitionScript\(\) : undefined;/);
  assert.match(shell, /data-transition-style=\{transitionStyle\}/);
  assert.match(shell, /\{transitionScript && <script is:inline set:html=\{transitionScript\}><\/script>\}/);
});

/** Runs the head script against a small fake browser and returns its listeners and state. */
async function runScript({ href = 'https://site.test/works/', heroOnPage = true } = {}) {
  const { pageTransitionScript } = await import(new URL('../src/lib/page-transition-script.ts', import.meta.url));
  const listeners = {};
  const attributes = new Map();
  const storage = new Map();
  const styleOf = () => ({ viewTransitionName: '', viewTransitionClass: '' });
  const hero = { style: styleOf() };
  const location = new URL(href);
  const context = {
    URL,
    JSON,
    Boolean,
    location,
    sessionStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) },
    addEventListener: (name, fn) => { listeners[name] = fn; },
    document: {
      documentElement: { setAttribute: (k, v) => attributes.set(k, v), removeAttribute: (k) => attributes.delete(k), getAttribute: (k) => attributes.get(k) ?? null },
      querySelector: (selector) => (selector === '[data-vt-hero-media]' && heroOnPage ? hero : null),
      querySelectorAll: () => [],
    },
    HTMLElement: Object,
    Element: Object,
  };
  context.window = context;
  context.onpagereveal = null;
  vm.createContext(context);
  vm.runInContext(pageTransitionScript(), context);
  return { listeners, attributes, storage, hero, context };
}

const link = (href, { back = false, media = null } = {}) => ({
  href,
  closest: (selector) => {
    if (selector === 'a[href]') return link(href, { back, media });
    if (selector === '[data-vt-direction]') return back ? { getAttribute: () => 'back' } : null;
    if (selector === '[data-vt-card], .card') return media ? { querySelector: () => media } : null;
    return null;
  },
});

test('the page being left records the direction by path depth, and a link can override it', async () => {
  const { listeners, storage } = await runScript({ href: 'https://site.test/works/valley/' });
  const target = link('https://site.test/works/');
  listeners.click({ target });
  listeners.pageswap({ viewTransition: {}, activation: { navigationType: 'push', entry: { url: 'https://site.test/works/' } } });
  assert.deepEqual(JSON.parse(storage.get('baseline:page-transition')), { to: '/works/', dir: 'back', morph: false });

  const deeper = link('https://site.test/works/valley/detail/', { back: true });
  listeners.click({ target: deeper });
  listeners.pageswap({ viewTransition: {}, activation: { navigationType: 'push', entry: { url: 'https://site.test/works/valley/detail/' } } });
  assert.equal(JSON.parse(storage.get('baseline:page-transition')).dir, 'back', 'data-vt-direction="back" wins over depth');
});

test('only the picked card names its media, and the arriving page names its hero to match', async () => {
  const left = await runScript({ href: 'https://site.test/works/' });
  const media = { style: { viewTransitionName: '', viewTransitionClass: '' } };
  left.listeners.click({ target: link('https://site.test/works/dusk/', { media }) });
  left.listeners.pageswap({ viewTransition: {}, activation: { navigationType: 'push', entry: { url: 'https://site.test/works/dusk/' } } });
  assert.equal(media.style.viewTransitionName, 'hero-media');
  assert.equal(media.style.viewTransitionClass, 'vt-media');

  const arriving = await runScript({ href: 'https://site.test/works/dusk/' });
  arriving.storage.set('baseline:page-transition', left.storage.get('baseline:page-transition'));
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  arriving.listeners.pagereveal({ viewTransition: { finished } });
  assert.equal(arriving.attributes.get('data-vt-direction'), 'forward');
  assert.equal(arriving.hero.style.viewTransitionName, 'hero-media');
  finish();
  await finished; await new Promise((resolve) => setImmediate(resolve));
  assert.equal(arriving.attributes.has('data-vt-direction'), false, 'direction is cleared when the transition ends');
  assert.equal(arriving.hero.style.viewTransitionName, '', 'the hero name is cleared');
});

test('history traversal compares entry indexes; no transition leaves the page untouched', async () => {
  const page = await runScript({ href: 'https://site.test/works/dusk/' });
  page.context.navigation = { activation: { navigationType: 'traverse', from: { index: 4 }, entry: { index: 3 } } };
  page.listeners.pagereveal({ viewTransition: { finished: new Promise(() => {}) } });
  assert.equal(page.attributes.get('data-vt-direction'), 'back');

  const still = await runScript({ href: 'https://site.test/works/' });
  still.listeners.pagereveal({ viewTransition: null });
  assert.equal(still.attributes.size, 0, 'reduced motion or no support: nothing is set');
  assert.equal(still.hero.style.viewTransitionName, '');
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

test('the transition script is a classic inline script with no module syntax', () => {
  assert.doesNotMatch(scriptSource.slice(scriptSource.indexOf('return `')), /\bimport\b|\bexport\b/);
  assert.match(scriptSource, /if \(!\('onpagereveal' in window\)\) return;/);
});
