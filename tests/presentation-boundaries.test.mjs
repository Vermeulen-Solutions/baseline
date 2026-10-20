import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import sharp from 'sharp';
import { responsiveImageInput } from '../src/lib/responsive-image.ts';
import { albumPhotos, photo } from '../src/lib/photo-gallery.ts';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../', import.meta.url));

test('native image metadata bounds responsive candidates and preserves authored dimensions', () => {
  const metadata = { src: '/_astro/photo.jpg', width: 1200, height: 800, format: 'jpg' };
  const image = responsiveImageInput(metadata);
  assert.deepEqual(image.widths, [480, 800, 1200]);
  assert.equal(image.original, metadata.src);
  assert.equal(image.src, metadata);
  assert.equal(responsiveImageInput(metadata, 600).height, 400);
  assert.deepEqual(responsiveImageInput({ ...metadata, width: 96, height: 64 }).widths, []);
  assert.deepEqual(responsiveImageInput('/photo.jpg').widths, []);
  assert.deepEqual(responsiveImageInput('/photo.jpg', 1800, 1200).widths, [480, 800, 1400]);
  assert.deepEqual(responsiveImageInput('/photo.jpg', NaN, 1200).widths, []);
});

test('malformed image and gallery inputs produce bounded presentation values', () => {
  for (const src of [null, undefined, 42, [], {}, { src: null }, { src: { toString: null } }, 'javascript:alert(1)', '//remote.invalid/image.jpg']) {
    const image = responsiveImageInput(src, NaN, -1);
    assert.equal(image.original, '');
    assert.equal(image.width, undefined);
    assert.equal(image.height, undefined);
    assert.equal(image.aspectRatio, 4 / 3);
    assert.deepEqual(image.widths, []);
  }
  const image = responsiveImageInput({ src: '/photo.jpg', width: 0, height: Infinity }, 640, 480);
  assert.equal(image.src, '/photo.jpg'); assert.equal(image.aspectRatio, 4 / 3);
  assert.deepEqual(albumPhotos([null, {}, 42, { _type: 'gallery', images: [null, { asset: { meta: { storageKey: { toString: null } } } }] }]), []);
  assert.equal(photo(null), null);
  assert.equal(responsiveImageInput('images/relative.jpg').original, 'images/relative.jpg');
});

test('shared shell, annotated Card and native images build without a CMS integration or server adapter', { timeout: 90000 }, async () => {
  const stage = await fs.mkdtemp(path.join(tmpdir(), 'baseline-presentation-'));
  try {
    const files = ['src/layouts/SiteShell.astro', 'src/styles/global.css', ...['Card', 'ResponsiveImage', 'EditorialImage', 'EmDashImage', 'PhotoGallery', 'Disclosure', 'LogoTicker', 'Section', 'Container', 'Grid'].map(name => `src/components/${name}.astro`), ...['responsive-image', 'public-link', 'photo-gallery', 'image-source', 'justified-gallery'].map(name => `src/lib/${name}.ts`)];
    for (const file of files) {
      await fs.mkdir(path.dirname(path.join(stage, file)), { recursive: true });
      await fs.copyFile(path.join(root, file), path.join(stage, file));
    }
    await fs.symlink(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    await fs.mkdir(path.join(stage, 'src/assets'), { recursive: true });
    await fs.mkdir(path.join(stage, 'src/pages'), { recursive: true });
    await sharp({ create: { width: 1600, height: 1000, channels: 3, background: '#486b83' } }).jpeg().toFile(path.join(stage, 'src/assets/photo.jpg'));
    await fs.writeFile(path.join(stage, 'package.json'), JSON.stringify({ type: 'module', private: true }));
    await fs.writeFile(path.join(stage, 'astro.config.mjs'), `import { defineConfig } from 'astro/config';\nimport tailwindcss from '@tailwindcss/vite';\nexport default defineConfig({ output: 'static', vite: { plugins: [tailwindcss()] } });\n`);
    await fs.writeFile(path.join(stage, 'src/pages/index.astro'), `---
import SiteShell from '../layouts/SiteShell.astro';
import Card from '../components/Card.astro';
import ResponsiveImage from '../components/ResponsiveImage.astro';
import image from '../assets/photo.jpg';
---
<SiteShell title="Shared shell specimen" description="Metadata specimen" canonical="https://example.invalid/specimen" lang="fr">
  <meta slot="head" name="shell-extension" content="head-contribution" />
  <span slot="body-start" id="body-start-contribution"></span>
  <header slot="header" id="header-contribution"></header>
  <Card title="Annotated title" href="/target" description="Annotated copy" action="Read more" image={image} imageWidth={600} titleEdit={{'data-emdash-field':'title'}} descriptionEdit={{'data-emdash-field':'description'}} actionEdit={{'data-emdash-field':'action'}} />
  <ResponsiveImage src={image} alt="Original fallback" originalSrc="/original-photo.jpg" optimize={false} />
  <footer slot="footer" id="footer-contribution"></footer>
  <span slot="body-end" id="body-end-contribution"></span>
</SiteShell>`);
    await fs.writeFile(path.join(stage, 'src/pages/edge.astro'), `---
import Card from '../components/Card.astro';
import ResponsiveImage from '../components/ResponsiveImage.astro';
import Disclosure from '../components/Disclosure.astro';
import LogoTicker from '../components/LogoTicker.astro';
import Section from '../components/Section.astro';
import Container from '../components/Container.astro';
import Grid from '../components/Grid.astro';
const bad = { toString: null };
---
<html lang="en"><head><title>Malformed inputs</title></head><body>
<Card title={bad} headingLevel={bad} href={bad} image={bad} description={bad} action={bad} titleEdit="bad" imageAspect={bad} />
<Card title="Unsupported link" href="javascript:alert(1)" />
<ResponsiveImage src={null} alt="Missing photo" width={640} height={480} />
<ResponsiveImage src={bad} alt={bad} width={NaN} height={-10} />
<ResponsiveImage src="/missing.jpg" alt="Unknown dimensions" />
<Disclosure id={bad} open="false" /><Disclosure id="bad id"><span slot="summary">Second panel</span></Disclosure>
<Disclosure id="valid-panel" open><span slot="summary">Open panel</span><a href="/target">Body link</a></Disclosure>
<LogoTicker id={null} label={bad} animate="false"><li>Partner</li></LogoTicker>
<LogoTicker id="bad id" label={null}><li>Other partner</li></LogoTicker>
<Section labelledBy={bad} spacing={bad}><Container width={null} breakout="false"><Grid minimum={bad}>Content</Grid></Container></Section>
</body></html>`);
    // A component compilation smoke test, not a certified generated static site.
    // Installed packages are reused; the import-closure test separately forbids CMS dependencies.
    const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(name)));
    const child = spawn(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: stage, env, timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const [code] = await once(child, 'exit');
    assert.equal(code, 0, output);
    const html = await fs.readFile(path.join(stage, 'dist/index.html'), 'utf8');
    for (const text of ['lang="fr"', '<title>Shared shell specimen</title>', 'content="Metadata specimen"', 'href="https://example.invalid/specimen"', 'name="shell-extension"', 'data-emdash-field="title"', 'data-emdash-field="description"', 'data-emdash-field="action"', 'data-original-src="/original-photo.jpg"']) assert.ok(html.includes(text), text);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
    assert.ok(!html.includes('slot="'), 'Named contributions must not add wrapper/slot attributes');
    const order = ['id="body-start-contribution"', 'class="skip-link"', 'id="header-contribution"', 'id="main-content"', 'id="footer-contribution"', 'id="body-end-contribution"'].map(marker => html.indexOf(marker));
    assert.ok(order.every((position, i) => position >= 0 && (i === 0 || position > order[i - 1])), order.join(','));
    const outputs = await fs.readdir(path.join(stage, 'dist'), { recursive: true });
    assert.ok(!outputs.some(file => /(?:^|[\\/])server[\\/]|\.db$/.test(file)));
    const optimized = outputs.filter(file => file.endsWith('.webp'));
    assert.ok(optimized.length >= 3, 'Expected actual optimized raster files');
    for (const file of optimized) { const image = await sharp(await fs.readFile(path.join(stage, 'dist', file))).metadata(); assert.ok(image.width <= 1600); assert.equal(image.format, 'webp'); }
    assert.ok(!html.includes('/_emdash/'));
    const edge = await fs.readFile(path.join(stage, 'dist/edge/index.html'), 'utf8');
    const elements = [];
    const visit = node => { if (node.tagName) elements.push(node); for (const child of node.childNodes ?? []) visit(child); };
    visit(parse(edge));
    const attr = (node, name) => node.attrs.find(a => a.name === name)?.value;
    const ids = elements.map(node => attr(node, 'id')).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, 'Generated controls have unique IDs');
    assert.ok(ids.every(id => /^[A-Za-z][\w:.-]*$/.test(id)));
    for (const summary of elements.filter(node => node.tagName === 'summary')) {
      assert.ok(ids.includes(attr(summary, 'aria-controls')));
      assert.equal(attr(summary, 'aria-expanded'), undefined, 'No stale explicit state without JS');
    }
    assert.equal(elements.filter(node => node.tagName === 'details' && attr(node, 'open') !== undefined).length, 1);
    assert.ok(elements.some(node => attr(node, 'class')?.includes('image-fallback') && attr(node, 'style')?.includes('aspect-ratio: 1.3333333333333333')));
    assert.ok(!elements.some(node => node.tagName === 'img' && !attr(node, 'src')));
    assert.ok(!elements.some(node => node.tagName === 'a' && attr(node, 'href')?.startsWith('javascript:')));
    assert.ok(!elements.some(node => node.tagName === 'input' && attr(node, 'checked') !== undefined));
    for (const name of ['class="section"', 'container-shell--content', 'grid-auto--standard']) assert.ok(edge.includes(name), name);
    assert.doesNotMatch(edge, /\[object Object\]|NaN|Infinity/);
  } finally {
    assert.equal(path.dirname(stage), path.resolve(tmpdir()));
    assert.ok(path.basename(stage).startsWith('baseline-presentation-'));
    await fs.unlink(path.join(stage, 'node_modules')).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await fs.rm(stage, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
