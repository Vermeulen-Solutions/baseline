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
