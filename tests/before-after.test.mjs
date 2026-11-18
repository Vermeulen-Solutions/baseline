import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/BeforeAfter.astro', import.meta.url), 'utf8');
const markup = source.split('<style>')[0];
const style = source.slice(source.indexOf('<style>'), source.indexOf('</style>'));
const script = source.slice(source.indexOf('<script>'));

test('the comparison is a native range input, hidden until the script makes it work', () => {
  assert.match(markup, /<input\s+class="before-after__range"\s+type="range"\s+min="0"\s+max="100"/);
  assert.match(markup, /aria-label=\{sliderLabel\}/);
  assert.match(markup, /aria-valuetext=\{valueText\.replace\('\{percent\}', String\(position\)\)\}/);
  assert.match(markup, /value=\{position\}\s+aria-label/);
  assert.match(markup, /\n\s+hidden\n\s+\/>/, 'the slider starts hidden');
  assert.match(markup, /class="before-after__hint" hidden/, 'the hint starts hidden');
  assert.match(markup, /<span class="before-after__handle" aria-hidden="true">/);
  assert.match(markup, /dir="ltr"/, 'the divider runs left to right whatever the page direction');
});

test('without the script both pictures stand one after the other; with it they share one frame', () => {
  assert.match(style, /\.before-after__frame \{ position: relative; display: grid;/);
  assert.match(style, /\.before-after\[data-ready\] \.before-after__frame \{ display: block;/);
  assert.match(style, /clip-path: inset\(0 calc\(100% - var\(--before-after-position\)\) 0 0\)/);
  assert.match(style, /\.before-after__range:focus-visible ~ \.before-after__handle::after \{\s*outline: var\(--focus-ring-width/);
  assert.match(style, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(style, /#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i, 'colours come from tokens');
});

test('the script shows the slider, follows its value and jumps to a tap', () => {
  assert.match(script, /range\.hidden = false;/);
  assert.match(script, /figure\.setAttribute\('data-ready', ''\)/);
  assert.match(script, /range\.addEventListener\('input', show\)/);
  assert.match(script, /event\.pointerType !== 'touch'/);
  assert.match(script, /aria-valuetext', template\.replace\('\{percent\}', range\.value\)/);
  assert.match(script, /astro:page-load/);
});
