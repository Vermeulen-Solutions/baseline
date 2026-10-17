import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { decodeOwnership } from '../src/utils/emdash-ownership.mjs';
import { inspectReference, referenceLimits } from '../src/utils/reference-image.mjs';

test('ownership adapter accepts actual installed field/entry proxies and fails unknown formats closed', async () => {
  const { version } = JSON.parse(await readFile('node_modules/emdash/package.json','utf8'));
  const source = await readFile('node_modules/emdash/src/visual-editing/editable.ts','utf8');
  const {createEditable,createNoop} = await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
  const proxy = createEditable('pages','disposable-unit-entry',{status:'published',hasDraft:true});
  assert.equal(version,'1.3.0','Review adapter after upgrading EmDash');
  assert.equal(decodeOwnership({...proxy}['data-emdash-ref'],version).kind,'entry');
  assert.equal(decodeOwnership(proxy.title['data-emdash-ref'],version).field,'title');
  assert.equal(decodeOwnership({...createNoop()}['data-emdash-ref'] ?? null,version).kind,'unannotated');
  for(const raw of ['bad', '[]', '{}', JSON.stringify({collection:'pages',id:'one',field:8}), JSON.stringify({collection:'pages',id:'one',locale:'nl'}), 'x'.repeat(4097)]) assert.equal(decodeOwnership(raw,version).kind,'unsupported');
  assert.equal(decodeOwnership(proxy.title['data-emdash-ref'],'1.4.0').kind,'unsupported');
  assert.match(decodeOwnership(proxy.title['data-emdash-ref'],version).locale,/Not supplied/);
});

test('local reference inspection handles actual PNG/JPEG/WebP headers and rejects decompression bounds before decode', async () => {
  const png = new Uint8Array(await readFile('tests/visual/baselines/win32/chromium-390/home.png'));
  assert.deepEqual(inspectReference(png,'image/png'),{width:390,height:844,type:'image/png'});
  const jpeg = Uint8Array.from([255,216,255,192,0,8,8,0,100,0,200,1]);
  assert.deepEqual(inspectReference(jpeg,'image/jpeg'),{width:200,height:100,type:'image/jpeg'});
  const webp = new Uint8Array(30); webp.set([...Buffer.from('RIFF')]); webp.set([...Buffer.from('WEBPVP8X')],8); webp[24]=199;webp[27]=99;
  assert.deepEqual(inspectReference(webp,'image/webp'),{width:200,height:100,type:'image/webp'});
  for(const [bytes,mime] of [[png,'image/svg+xml'],[Buffer.from('<svg/>'),'image/svg+xml'],[jpeg.slice(0,9),'image/jpeg'],[new Uint8Array(referenceLimits.bytes+1),'image/png']]) assert.throws(()=>inspectReference(bytes,mime));
  const bomb = png.slice(0,24); new DataView(bomb.buffer).setUint32(16,16000); new DataView(bomb.buffer).setUint32(20,60000);
  assert.throws(()=>inspectReference(bomb,'image/png'),/32 megapixels/);
});

import { tokenDefinitions, createTokenMap, exportTokens } from '../src/utils/design-tweaks.mjs';

test('inspector covers every authored theme token and keeps derived layout source-owned', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  const theme = css.slice(css.indexOf('@theme {'), css.indexOf(':root {'));
  const declared = [...theme.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]);
  const keys = tokenDefinitions.map(token => token.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of declared) assert.ok(keys.includes(key), 'Missing inspector setting: ' + key);
  assert.equal(tokenDefinitions.find(token => token.key === '--measure-content-safe').readonly, true);
  assert.deepEqual(createTokenMap({}, { '--measure-content-safe': '10px' }), {});
});

test('family calibration covers fluid pairs and gutters; individual edits and resets take precedence', () => {
  const source = { '--text-step-3-to-1': 'clamp(1rem, 4vi, 4rem)', '--spacing-container': '2rem', '--spacing-xl-to-sm': '3rem' };
  const tokens = createTokenMap(source, { typeScale: '1.2', densityScale: '.8', '--spacing-container': '2rem' });
  assert.equal(tokens['--text-step-3-to-1'], 'calc(clamp(1rem, 4vi, 4rem) * 1.2)');
  assert.equal(tokens['--spacing-xl-to-sm'], 'calc(3rem * 0.8)');
  assert.equal(tokens['--spacing-container'], undefined, 'Reset to source must override density without exporting a no-op');
  const changed = createTokenMap(source, { densityScale: '.8', '--spacing-container': '4rem' });
  assert.equal(changed['--spacing-container'], '4rem');
});

test('new token families export to their owning theme/root blocks', () => {
  const tokens = { '--font-body': 'serif', '--radius-card': '1rem', '--shadow-sm': 'none', '--ease-smooth': 'ease', '--measure-content': '80rem', '--font-weight-display': '600' };
  const css = exportTokens(tokens);
  const [theme, root] = css.split(':root {');
  for (const key of ['--font-body', '--radius-card', '--shadow-sm', '--ease-smooth']) assert.ok(theme.includes(key + ':'));
  for (const key of ['--measure-content', '--font-weight-display']) { assert.ok(root.includes(key + ':')); assert.ok(!theme.includes(key + ':')); }
});
