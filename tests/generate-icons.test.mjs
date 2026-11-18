import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ICONS, parseArgs, renderIcons } from '../scripts/generate-icons.mjs';
import { webManifest, shortName } from '../src/lib/web-manifest.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('arguments keep the defaults and refuse bad colours and padding', () => {
  assert.deepEqual(parseArgs([]), { source: 'public/favicon.svg', out: 'public', background: '#ffffff', padding: 0.1 });
  assert.equal(parseArgs(['--background', '#1B2531']).background, '#1B2531');
  assert.throws(() => parseArgs(['--background', 'white']), /six-digit hex/);
  assert.throws(() => parseArgs(['--padding', '0.5']), /from 0 to 0.3/);
  assert.throws(() => parseArgs(['--size', '1']), /Unknown option/);
});

test('icons render at their sizes; the touch and maskable icons are opaque on the ground colour', async () => {
  const sharp = createRequire(import.meta.url)('sharp');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="#c00"/></svg>');
  const icons = await renderIcons(svg, { background: '#112233', padding: 0.1 });
  assert.deepEqual(Object.keys(icons), ICONS.map(i => i.file));
  for (const icon of ICONS) {
    const meta = await sharp(icons[icon.file]).metadata();
    assert.equal(meta.width, icon.size, icon.file);
    assert.equal(meta.height, icon.size, icon.file);
    const { isOpaque } = await sharp(icons[icon.file]).stats();
    assert.equal(isOpaque, icon.ground, `${icon.file} opaque: ${icon.ground}`);
  }
  // The corner of the touch icon is the ground colour, not black.
  const { data } = await sharp(icons['apple-touch-icon.png']).raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([...data.subarray(0, 3)], [0x11, 0x22, 0x33]);
});

test('Baseline ships the generated icons next to its favicon', () => {
  for (const icon of ICONS) assert.ok(existsSync(new URL(`../public/${icon.file}`, import.meta.url)), icon.file);
});

test('the manifest names the site, keeps the browser chrome and lists the icons under the base path', () => {
  assert.equal(shortName('Studio'), 'Studio');
  assert.equal(shortName('Vermeulen Solutions Studio'), 'Vermeulen');
  assert.equal(shortName('Supercalifragilistic'), 'Supercalifra');
  const manifest = webManifest({ name: '  My   Site ', base: '/docs/' });
  assert.equal(manifest.name, 'My Site');
  assert.equal(manifest.display, 'browser');
  assert.equal(manifest.start_url, '/docs/');
  assert.deepEqual(manifest.icons.map(i => i.src), ['/docs/icon-192.png', '/docs/icon-512.png', '/docs/icon-maskable-512.png']);
  assert.equal(manifest.icons[2].purpose, 'maskable');
  assert.equal('theme_color' in manifest, false, 'colours only when given');
  assert.equal(webManifest({ name: '' }).name, 'Website');
});

test('both Base layouts link the touch icon and the manifest', () => {
  for (const file of ['src/layouts/Base.astro', 'profiles/static/project/src/layouts/Base.astro']) {
    const layout = read(file);
    assert.match(layout, /rel="apple-touch-icon"/, file);
    assert.match(layout, /rel="manifest"/, file);
  }
});
