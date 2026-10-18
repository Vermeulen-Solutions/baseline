// Disposable infrastructure fixture. Runs real development and built Node HTTP checks.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { LocalStorage } from 'emdash/storage/local';

const root = process.cwd(), origin = 'http://127.0.0.1:4332';
const fixture = 'src/pages/native-image-check.astro';
const originals = ['public/native-image-check-large.jpg', 'public/native-image-check-small.png'];
const key = 'native-image-check-fresh.jpg';
const storage = new LocalStorage({ directory: './uploads', baseUrl: '/_emdash/api/media/file' });
const env = {...process.env, SITE_URL:'https://starter-image-check.invalid', HOST:'127.0.0.1', PORT:'4332'};
let server;
const owned = [];
let uploaded = false;
let built = false;
async function run(args, environment = env) {
  const child = spawn(process.execPath, args, {cwd:root, env:environment, stdio:'inherit'});
  const [code] = await once(child,'exit'); assert.equal(code,0,'Astro build');
}
async function start(args) {
  server = spawn(process.execPath, args, {cwd:root, env, stdio:'inherit'});
  for (let i=0;i<120;i++) {
    if(server.exitCode !== null) throw Error('Test server exited');
    try { const r=await fetch(origin+'/native-image-check/'); if(r.ok) return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw Error('Test server did not become ready');
}
async function stop() { if(server && server.exitCode===null) { const exited=once(server,'exit');server.kill();await exited; } server=undefined; }
function attrs(tag) { return Object.fromEntries([...tag.matchAll(/\s([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2].replaceAll('&amp;','&')])); }
async function check(label, fresh=false) {
  const html=await (await fetch(origin+'/native-image-check/')).text();
  const images=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>attrs(m[0]));
  assert.equal(images.length,4);const results=[];
  for(const image of images) {
    if(image.alt==='small' || image.alt==='preserved') { assert.ok(!image.srcset);continue; }
    if(image.alt==='fresh' && !fresh) continue;
    assert.ok(image.srcset,'native responsive candidates');
    for(const candidate of image.srcset.split(',')) {
      const [src,w]=candidate.trim().split(/\s+/);const response=await fetch(new URL(src,origin));assert.equal(response.status,200);
      const metadata=await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      assert.equal(metadata.format,'webp');assert.ok(Math.abs(metadata.width-parseInt(w))<=1);assert.ok(metadata.width<=1800);
      results.push({width:metadata.width,height:metadata.height,format:metadata.format});
    }
  }
  const rejected=await fetch(origin+'/_image?href='+encodeURIComponent('https://unapproved.invalid/photo.jpg')+'&w=800&f=webp');assert.equal(rejected.status,403);
  assert.ok(html.includes('data-original-src'));return {label,candidates:results,rejectedRemote:rejected.status};
}
const results=[];
try {
  for(const file of [fixture,...originals]) { try {await fs.access(file);throw Error('Fixture already exists: '+file);}catch(e){if(e.code!=='ENOENT')throw e;} }
  try { await storage.download(key); throw Error('Storage fixture already exists'); } catch(e) { if (!String(e.message).includes('not found')) throw e; }
  owned.push(fixture,...originals);
  // Git does not retain an empty public directory in a fresh checkout.
  await fs.mkdir(path.join(root, 'public'), { recursive: true });
  await sharp({create:{width:1800,height:1200,channels:3,background:'#486b83'}}).jpeg().toFile(originals[0]);
  await sharp({create:{width:640,height:400,channels:3,background:'#486b83'}}).png().toFile(originals[1]);
  await fs.writeFile(fixture, `---\nimport ResponsiveImage from '../components/EmDashImage.astro';\n---\n<main><ResponsiveImage src="/native-image-check-large.jpg" alt="large"/><ResponsiveImage src="/native-image-check-small.png" alt="small"/><ResponsiveImage src="/native-image-check-large.jpg" alt="preserved" optimize={false}/><ResponsiveImage src="/_emdash/api/media/file/${key}" alt="fresh"/></main>\n`);
  await start(['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port','4332']);results.push(await check('development'));await stop();
  await run(['node_modules/astro/bin/astro.mjs','build']);
  built = true;
  await storage.upload({key,body:await fs.readFile(originals[0]),contentType:'image/jpeg'});
  uploaded = true;
  await start(['--env-file-if-exists=.env','dist/server/entry.mjs']);results.push(await check('built-node-new-storage-image',true));await stop();
  await fs.mkdir('audit/native-images-starter-20261005',{recursive:true});
  await fs.writeFile('audit/native-images-starter-20261005/http-images.json',JSON.stringify(results,null,2)+'\n');
  console.log('Native image checks passed in development and built Node, including media added after build.');
} finally {
  await stop();if(uploaded) await storage.delete(key);
  for(const file of owned) await fs.rm(path.resolve(root,file),{force:true});
  // Never leave a disposable public route in the production output.
  if (built) await run(['node_modules/astro/bin/astro.mjs','build'], process.env);
}
