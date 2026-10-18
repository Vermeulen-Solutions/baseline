import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const commits=JSON.parse(await fs.readFile(path.join(root,'commits.json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const probes=[];
for(const repository of ['emdash-baseline','baseline']) {
  const url=`https://raw.githubusercontent.com/Vermeulen-Solutions/${repository}/${commits.released}/scripts/sync-baseline.mjs`;
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200);
  const bytes=Buffer.from(await response.arrayBuffer());
  probes.push({requested:url,finalURL:response.url,status:response.status,redirected:response.redirected,sha256:hash(bytes)});
}
assert.equal(probes[0].sha256,probes[1].sha256);
for(const name of commits.cases) {
  const site=path.join(root,name);
  const managed=JSON.parse(await fs.readFile(path.join(site,'.baseline/managed-files.json')));
  const original=JSON.parse(await fs.readFile(path.join(root,'receipts',name,'original-managed.json')));
  const exceptions=JSON.parse(await fs.readFile(path.join(site,'audit/design-gate-exceptions.json')));
  const before=JSON.parse(execFileSync('git',['show','HEAD:audit/design-gate-exceptions.json'],{cwd:site,encoding:'utf8'}));
  const source=JSON.parse(await fs.readFile(path.join(site,'baseline.config.json'))).source;
  const report={source,sourceTreeDirty:original.sourceTreeDirty,installedFiles:Object.keys(original.files).length,currentFiles:Object.keys(managed.files).length,conflicts:[],cleanUpdate:{},gateHashes:{}};
  assert.equal(original.sourceTreeDirty,false);
  for(const file of ['src/styles/global.css','src/components/Container.astro','src/components/Section.astro']) {
    const base=execFileSync('git',['show',`${source.commit}:${file}`],{cwd:path.join(root,'source'),maxBuffer:1024*1024});
    assert.equal(hash(base),original.files[file].sha256);
    const target=path.join(root,'receipts',name,'base',file); await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,base);
    const currentHash=hash(await fs.readFile(path.join(site,file)));
    const oldGate=before.find(e=>e.path===file).sha256;
    const newGate=exceptions.find(e=>e.path===file).sha256;
    if(file.includes('Section.astro')) {
      assert.notEqual(oldGate,newGate); assert.equal(newGate,currentHash);
      assert.equal(managed.files[file].sha256,currentHash);
      assert.equal(managed.files[file].lastUpdateCommit,commits.candidate);
      report.cleanUpdate={path:file,currentHash,receiptHash:managed.files[file].sha256,commit:commits.candidate};
    } else {
      assert.equal(oldGate,newGate); assert.notEqual(currentHash,newGate);
      assert.equal(managed.files[file].sha256,original.files[file].sha256);
      report.conflicts.push({path:file,localHash:currentHash,originalBaseHash:original.files[file].sha256,receiptBasePreserved:true});
    }
    report.gateHashes[file]={before:oldGate,after:newGate,localEditsNotExempted:!file.includes('Section.astro')};
  }
  // No implicit dependency/script/workflow updates, even though the upstream is a full CMS repository.
  const packageJSON=JSON.parse(await fs.readFile(path.join(site,'package.json')));
  assert.ok(!JSON.stringify(packageJSON.scripts).match(/schema-budget|sqlite|emdash-skills|db:/));
  assert.equal(Object.keys(original.files).length,Object.keys(managed.files).length);
  await fs.writeFile(path.join(root,'receipts',name,'integrity.json'),JSON.stringify(report,null,2)+'\n');
}
await fs.writeFile(path.join(root,'receipts','network-probes.json'),JSON.stringify(probes,null,2)+'\n');
console.log(JSON.stringify({network:probes,integrityCases:commits.cases.length},null,2));
