import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEDIA_TRANSITION_CLASS, mediaTransition, transitionName } from '../src/lib/view-transition.ts';

const ident = /^-?[A-Za-z_][A-Za-z0-9_-]*$/;

test('transition names are CSS-ident safe for any slug', () => {
  assert.equal(transitionName('post', 'summer-camp'), 'post-summer-camp');
  assert.equal(transitionName('story', 'été 2026: l’édition!'), 'story-t-2026-l-dition');
  assert.equal(transitionName('post', 'a.b/c d'), 'post-a-b-c-d');
  assert.equal(transitionName('event', 2026), 'event-2026');
  assert.equal(transitionName(' post ', null, undefined, false, '', '  ', 'x'), 'post-x');
  assert.equal(transitionName('2026-retreat'), 'vt-2026-retreat', 'An ident cannot start with a digit');
  assert.equal(transitionName(2026), 'vt-2026');
  for (const keyword of ['none', 'auto', 'root', 'NONE', 'match-element', 'inherit']) assert.equal(transitionName(keyword), `vt-${keyword}`, 'Reserved keywords cannot name an element');
  for (const empty of [[], [''], ['---'], ['!!!', null], [undefined]]) assert.equal(transitionName(...empty), '');
  for (const hostile of ['x; background: url(//outside.test)', 'a{}b', 'a"b\'c', 'a\b', 'x/*y*/', '</style>', 'a\nb', '-9lives', '--custom']) {
    const name = transitionName('post', hostile);
    assert.match(name, ident, hostile);
    const bare = transitionName(hostile);
    assert.match(bare, ident, hostile);
  }
});

test('mediaTransition pairs the name with the shared media class and omits the attribute when empty', () => {
  assert.equal(MEDIA_TRANSITION_CLASS, 'vt-media');
  assert.equal(mediaTransition('post', 'summer-camp'), 'view-transition-name: post-summer-camp; view-transition-class: vt-media');
  assert.equal(mediaTransition('post', 'x; color: red'), 'view-transition-name: post-x-color-red; view-transition-class: vt-media');
  assert.equal(mediaTransition(''), undefined);
  assert.equal(mediaTransition(null, '!!'), undefined);
  // List and detail call the helper with the same parts and must agree.
  assert.equal(mediaTransition('story', 'A.B'), mediaTransition('story', 'A.B'));
});

test('the stylesheet ships the matching media group and held-header rules, with reduced motion', () => {
  const css = readFileSync('src/styles/global.css', 'utf8').replace(/\s+/g, ' ');
  for (const rule of [
    `::view-transition-group(*.${MEDIA_TRANSITION_CLASS}) {`,
    `::view-transition-old(*.${MEDIA_TRANSITION_CLASS}), ::view-transition-new(*.${MEDIA_TRANSITION_CLASS}) { block-size: 100%; object-fit: cover; }`,
    ':where([data-sticky-header][data-vt-header]) { view-transition-name: site-header; view-transition-class: vt-header; }',
    '::view-transition-old(site-header) { display: none; }',
    '::view-transition-new(site-header) { animation: none; }',
    '::view-transition-old(*.vt-header) { display: none; }',
    '::view-transition-new(*.vt-header) { animation: none; }',
  ]) assert.ok(css.includes(rule), `Missing rule: ${rule}`);
  assert.match(css, /::view-transition-group\(\*\.vt-media\) \{[^}]*overflow: clip;[^}]*\}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ ::view-transition-group\(site-header\), ::view-transition-group\(\*\.vt-header\), ::view-transition-group\(\*\.vt-media\), ::view-transition-old\(\*\.vt-media\), ::view-transition-new\(\*\.vt-media\) \{ animation: none !important; \} \}/);
  const card = readFileSync('src/components/Card.astro', 'utf8');
  assert.ok(card.includes("from '../lib/view-transition'") && card.includes("mediaTransition(rawTransitionName, 'media')"), 'Card must use the shared helper for its media name');
});
