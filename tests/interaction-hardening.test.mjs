import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { HTML_FRAME_POLICY, SECURITY_HEADERS, missingSecurityHeaders, withSecurityHeaders } from '../src/lib/security-headers.ts';
import { buildLlmsTxt, entryLink, isNoIndexEntry, llmsLine } from '../src/lib/llms-txt.ts';
import { noteUnknownPortableTextType, resetUnknownPortableTextReports, unknownPortableTextLabel } from '../src/lib/portable-text-fallback.ts';
import { definedCustomProperties, inspectGuardrailTree, inspectTokenReferences } from '../scripts/css-contracts.mjs';

const read = file => readFileSync(file, 'utf8');
const html = { 'Content-Type': 'text/html; charset=utf-8' };

test('security headers are added only where missing and never replace a route policy', () => {
  const plain = withSecurityHeaders(new Response('ok', { headers: html }));
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.equal(plain.headers.get(name), value);
  assert.equal(plain.headers.get('Content-Security-Policy'), HTML_FRAME_POLICY);

  const owned = withSecurityHeaders(new Response('ok', { headers: { ...html, 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'" } }));
  assert.equal(owned.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(owned.headers.get('Content-Security-Policy'), "default-src 'self'");

  const framed = withSecurityHeaders(new Response('ok', { headers: { ...html, 'X-Frame-Options': 'DENY' } }));
  assert.equal(framed.headers.has('Content-Security-Policy'), false, 'an explicit frame policy is left alone');

  const media = withSecurityHeaders(new Response('x', { headers: { 'Content-Type': 'image/png' } }));
  assert.equal(media.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(media.headers.has('Content-Security-Policy'), false, 'frame policy is for documents only');
});

test('security headers survive immutable responses and skip protocol upgrades', () => {
  const redirect = withSecurityHeaders(Response.redirect('https://example.test/next', 301));
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), 'https://example.test/next');
  assert.equal(redirect.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(missingSecurityHeaders(101, new Headers()), []);
  assert.deepEqual(missingSecurityHeaders(200, new Headers({ Upgrade: 'websocket' })), []);
  const middleware = read('src/middleware.ts');
  assert.match(middleware, /export const onRequest = defineMiddleware\(async \(context, next\) => withSecurityHeaders\(await handle\(context, next\)\)\);/);
});

test('missing CMS entries answer with the 404 page and a 404 status, not a redirect', () => {
  const routes = ['src/pages/[slug].astro', 'src/pages/posts/[slug].astro', 'src/pages/category/[slug].astro', 'src/pages/tag/[slug].astro'];
  for (const file of routes) {
    const source = read(file);
    assert.doesNotMatch(source, /Astro\.redirect\(["']\/404["']\)/, `${file} must not redirect to /404`);
    assert.match(source, /return Astro\.rewrite\("\/404"\);/, `${file} rewrites to the 404 page`);
  }
  assert.match(read('src/pages/404.astro'), /Astro\.response\.status = 404;/);
});

test('llms.txt lists safe one-line links and drops unusable ones', () => {
  assert.equal(llmsLine('a b\u0007  c\n'), 'a b c');
  assert.equal(llmsLine('x'.repeat(300)).length, 200);
  const text = buildLlmsTxt({
    title: 'Site [one]',
    summary: 'First\nline',
    sections: [
      { heading: 'Pages', links: [
        { title: 'About [us]', url: 'https://example.test/about(us)', description: 'Who\twe are' },
        { title: 'Script', url: 'javascript:alert(1)' },
        { title: 'Credentials', url: 'https://user:pass@example.test/' },
        { title: '', url: 'https://example.test/untitled' },
      ] },
      { heading: 'Empty', links: [] },
    ],
  });
  assert.equal(text, '# Site [one]\n\n> First line\n\n## Pages\n\n- [About \\[us\\]](https://example.test/about%28us%29): Who we are\n');
});

test('llms.txt respects the SEO panel noindex flag and falls back to the entry id', () => {
  assert.equal(isNoIndexEntry({ data: { seo: { noIndex: true } } }), true);
  for (const data of [undefined, null, {}, { seo: null }, { seo: { noIndex: false } }, { seo: { noIndex: 1 } }]) assert.equal(isNoIndexEntry({ data }), false);
  assert.deepEqual(entryLink({ id: 'about', data: { title: ' ', excerpt: 42 } }, 'https://example.test/about'), { title: 'about', url: 'https://example.test/about', description: null });
  const route = read('src/pages/llms.txt.ts');
  assert.match(route, /export const prerender = false;/);
  assert.match(route, /filter\(entry => !isNoIndexEntry\(entry\)\)/);
  assert.match(route, /cache\.set\(posts\.cacheHint\)/);
});

test('unknown Portable Text types render nothing publicly and are reported once per type', () => {
  resetUnknownPortableTextReports();
  assert.equal(unknownPortableTextLabel('acme.callout<script>'), 'acme.calloutscript');
  assert.equal(unknownPortableTextLabel(undefined), 'unnamed');
  const messages = [];
  assert.equal(noteUnknownPortableTextType('acme.callout', message => messages.push(message)), true);
  assert.equal(noteUnknownPortableTextType('acme.callout', message => messages.push(message)), false);
  assert.equal(messages.length, 1);
  for (let index = 0; index < 100; index++) noteUnknownPortableTextType(`type-${index}`, () => {});
  assert.equal(noteUnknownPortableTextType('late', () => {}), false, 'reports are bounded');
  resetUnknownPortableTextReports();
  const component = read('src/components/PortableTextUnknown.astro');
  assert.match(component, /\{import\.meta\.env\.DEV && \(/, 'the placeholder is development-only');
  assert.doesNotMatch(component, /style="/, 'no inline style attribute');
  assert.match(read('src/components/RichText.astro'), /unknownType: PortableTextUnknown,/);
});

/** Each rule with its chain of enclosing at-rules, for nesting assertions. */
function rulesWithContext(css) {
  const rules = [];
  postcss.parse(css).walkRules(rule => {
    const context = [];
    for (let node = rule.parent; node; node = node.parent) if (node.type === 'atrule') context.unshift(`@${node.name} ${node.params}`.trim());
    rules.push({ selector: rule.selector, context, rule });
  });
  return rules;
}

test('hover styles in global.css exist only where a pointer can hover', () => {
  const hovers = rulesWithContext(read('src/styles/global.css')).filter(item => /:hover\b/.test(item.selector));
  assert.ok(hovers.length >= 5);
  for (const item of hovers) assert.ok(item.context.some(at => /^@media .*\(hover: hover\)/.test(at)), `${item.selector} must sit inside @media (hover: hover)`);
});

test('motion tokens are complete and dialogs choreograph entry and exit behind reduced motion', () => {
  const css = read('src/styles/global.css');
  for (const token of ['--ease-exit:', '--radius-pill:', '--focus-ring-width:', '--focus-ring-offset:']) assert.ok(css.includes(token), `${token} is defined`);
  assert.doesNotMatch(css, /--(?:ease-out|radius-sm|radius-container|ease-standard)\b/, 'no undefined token names');
  const hookUses = [...css.matchAll(/var\(--duration-normal\b/g)].map(match => css.slice(match.index, match.index + 60));
  assert.equal(hookUses.length, 3);
  for (const use of hookUses) assert.match(use, /^var\(--duration-normal, var\(--duration-(?:slow|slower)\)\)/, 'the documented hook always falls back to a scale token');
  const rules = rulesWithContext(css);
  const dialog = rules.find(item => item.selector === ':where(dialog)' && item.context.includes('@media (prefers-reduced-motion: no-preference)'));
  assert.ok(dialog, 'dialog motion is gated on reduced motion');
  const transition = dialog.rule.nodes.find(node => node.prop === 'transition')?.value ?? '';
  assert.match(transition, /display var\(--duration-fast\) var\(--ease-exit\) allow-discrete/);
  assert.match(transition, /overlay var\(--duration-fast\) var\(--ease-exit\) allow-discrete/);
  assert.ok(rules.some(item => item.selector === ':where(dialog[open])::backdrop' && item.context.some(at => at.startsWith('@starting-style'))), 'backdrop fades in');
  assert.ok(rules.some(item => item.selector === '.site-menu[open] > .site-menu__panel' && item.context.some(at => at.startsWith('@starting-style'))), 'menu panel has an entry state');
  for (const item of rules.filter(entry => entry.context.some(at => at.startsWith('@starting-style')))) {
    assert.ok(item.context.includes('@media (prefers-reduced-motion: no-preference)'), `${item.selector} entry motion is gated`);
  }
});

test('cross-document page transitions are opt-in, reduced-motion aware and hold the header', () => {
  const shell = read('src/layouts/SiteShell.astro');
  assert.match(shell, /pageTransitions = 'none'/, 'off unless a layout opts in');
  assert.match(shell, /\{pageTransitions === 'cross-document' && <style is:inline>@media \(prefers-reduced-motion: no-preference\) \{ @view-transition \{ navigation: auto; \} \}<\/style>\}/);
  assert.match(read('src/layouts/Base.astro'), /const pageTransitions = getRequestContext\(\)\?\.editMode \? 'none' : 'cross-document';/, 'the visual editor keeps plain navigation');
  assert.match(read('src/layouts/Base.astro'), /pageTransitions=\{pageTransitions\}/);
  assert.match(read('profiles/static/project/src/layouts/Base.astro'), /pageTransitions="cross-document"/, 'static Base opts in');
  for (const file of ['src/layouts/Base.astro', 'profiles/static/project/src/layouts/Base.astro']) {
    const layout = read(file);
    assert.match(layout, /<header slot="header" class="site-header" data-sticky-header data-vt-header>/, `${file} holds its header`);
  }
});

test('card media zoom is a tokenized, composited, motion-gated hover and focus effect', () => {
  const card = read('src/components/Card.astro');
  assert.match(card, /--card-media-hover-scale: 1\.03;/);
  assert.match(card, /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\) \{\n  \.card--clickable:hover \.card-media :global\(img\) \{ scale: var\(--card-media-hover-scale\); \}/);
  assert.match(card, /\.card--clickable:focus-within:has\(:focus-visible\) \.card-media :global\(img\) \{ scale: var\(--card-media-hover-scale\); \}/);
  assert.doesNotMatch(card, /transition:[^;]*\b(?:width|height|margin|padding)\b/, 'no layout-property transitions');
});

test('undefined scale-token references are reported, and Baseline has none', () => {
  const defined = definedCustomProperties([':root { --ease-smooth: ease; }', 'el.style.setProperty("--radius-card", "1rem"); const s = "--z-raised: 1";']);
  assert.deepEqual([...defined].sort(), ['--ease-smooth', '--radius-card', '--z-raised']);
  const findings = inspectTokenReferences('a { transition: x var(--ease-smooth); }\nb { border-radius: var(--radius-sm, 4px); z-index: var(--z-raised); }', defined, { file: 'x.css' });
  assert.deepEqual(findings.map(item => [item.line, item.rule, item.message.split(' ')[0]]), [[2, 'undefined-token', '--radius-sm']]);
  assert.deepEqual(inspectTokenReferences('a { color: var(--color-unknown); }', defined), [], 'only closed scales are checked');
  assert.deepEqual(inspectTokenReferences('a { animation-duration: var(--duration-normal, 1s); }', defined), [], 'documented hooks are allowed');
  const tree = inspectGuardrailTree().findings.filter(item => item.rule === 'undefined-token');
  assert.deepEqual(tree, []);
});

test('public route sources never introduce client scripts for these interactions', () => {
  const walk = dir => readdirSync(dir).flatMap(name => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
  for (const file of [...walk('src/pages'), 'src/components/Card.astro', 'src/components/PortableTextUnknown.astro']) {
    if (!file.endsWith('.astro') || file.includes('_styleguide')) continue;
    assert.doesNotMatch(read(file), /<script\b/, `${file} stays zero-JS`);
  }
});
