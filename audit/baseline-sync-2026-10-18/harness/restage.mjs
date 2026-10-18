import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
const {candidate,cases}=JSON.parse(await fs.readFile(path.join(root,'commits.json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const name of cases) {
  const site=path.join(root,name);
  // These operations move only this run's exact, already-archived proposal directory.
  const from=path.resolve(site,'.baseline','updates',candidate);
  const to=path.resolve(root,'history',name,candidate);
  assert.equal(path.dirname(from),path.join(site,'.baseline','updates'));
  assert.ok(from.startsWith(root+path.sep) && to.startsWith(path.join(root,'history')+path.sep));
  assert.match(path.basename(from),/^[a-f0-9]{40}$/);
  assert.equal((await fs.lstat(from)).isSymbolicLink(),false);
  const verification=JSON.parse(await fs.readFile(path.join(root,'receipts',name,'verification.json')));
  assert.equal(verification.passed,true);
  const watched=['package.json','package-lock.json','src/styles/global.css','src/components/Container.astro','src/components/Section.astro','baseline.config.json','audit/design-gate-exceptions.json'];
  const before=Object.fromEntries(await Promise.all(watched.map(async f=>[f,hash(await fs.readFile(path.join(site,f)))])));
  await fs.mkdir(path.dirname(to),{recursive:true}); await fs.rename(from,to);
  for(const mode of ['--ref','--apply']) {
    const args=['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','sync:baseline','--',mode,candidate];
    const result=spawnSync(process.execPath,args,{cwd:site,encoding:'utf8',timeout:300000,maxBuffer:4*1024*1024});
    await fs.writeFile(path.join(root,'receipts',name,`restage-${mode.slice(2)}.log`),(result.stdout??'')+(result.stderr??''));
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  const stage=JSON.parse(await fs.readFile(path.join(from,'stage.json')));
  assert.deepEqual(stage.entries.map(e=>e.target).sort(),['src/components/Container.astro','src/styles/global.css']);
  assert.ok(stage.entries.every(e=>e.conflict));
  const after=Object.fromEntries(await Promise.all(watched.map(async f=>[f,hash(await fs.readFile(path.join(site,f)))])));
  assert.deepEqual(before,after);
  const managed=JSON.parse(await fs.readFile(path.join(site,'.baseline/managed-files.json')));
  assert.deepEqual(managed.lastSync.applied,[]);
  assert.deepEqual(managed.lastSync.conflicts.sort(),['src/components/Container.astro','src/styles/global.css']);
  await fs.writeFile(path.join(root,'receipts',name,'restage-integrity.json'),JSON.stringify({candidate,stage,lockfileAndSourcesUnchanged:true,before,after,lastSync:managed.lastSync},null,2)+'\n');
  console.log(`${name}: repeated real-network sync retained both proposals; package/lockfile and source bytes unchanged`);
}
