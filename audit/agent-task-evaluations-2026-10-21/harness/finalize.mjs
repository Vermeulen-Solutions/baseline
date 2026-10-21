import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root, control, writeJSON } from './runtime.mjs';
const out=path.join(root,'audit/agent-task-evaluations-2026-10-21');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(path.join(out,file),'utf8'));
const results=read('results.json');assert.equal(results.trials.length,10);
for(const trial of results.trials){assert.ok(!trial.infrastructureError);for(const status of ['pass','fail','unverified'])assert.equal(trial.summary[status],trial.criteria.filter(c=>c.status===status).length);}
const source=read('source-receipt.json');
for(const file of source.originalDirtyPaths)assert.equal(hash(fs.readFileSync(path.join(root,file))),source.fileHashes[file],file+' changed after snapshot');
assert.equal(hash(fs.readFileSync(path.join(out,'protocol.json'))),source.protocolSHA256);
assert.equal(hash(fs.readFileSync(path.join(out,'prompts.json'))),source.promptsSHA256);
const grade=read('grader-receipt.json');grade.finalImplementationHashes=Object.fromEntries(['prepare.mjs','runtime.mjs','grade.mjs','checkpoint.mjs','continue-prepare.mjs','collect.mjs','final-check.mjs','finalize.mjs'].map(f=>[f,hash(fs.readFileSync(path.join(control,f)))]));
grade.finalHashesRecordedAt=new Date().toISOString();writeJSON(path.join(out,'grader-receipt.json'),grade);
const dispatch=read('dispatch.json');dispatch.continuation.completedTrialIds=results.trials.map(t=>t.trial);dispatch.continuation.completedAt=new Date().toISOString();dispatch.continuation.newSessions=[...new Set([...dispatch.continuation.newSessions,'sveltia_second_clean','resume_second_b'])];writeJSON(path.join(out,'dispatch.json'),dispatch);
for(const name of ['finalize.mjs'])fs.copyFileSync(path.join(control,name),path.join(out,'harness',name));
const files=fs.readdirSync(out,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()&&e.name!=='evidence-inventory.json').map(e=>path.join(e.parentPath,e.name)).sort();
let jsonCount=0;for(const f of files)if(f.endsWith('.json')){JSON.parse(fs.readFileSync(f,'utf8'));jsonCount++;}
for(const f of fs.readdirSync(path.join(out,'harness')).filter(f=>f.endsWith('.mjs')))execFileSync(process.execPath,['--check',path.join(out,'harness',f)],{stdio:'pipe'});
writeJSON(path.join(out,'evidence-inventory.json'),{recordedAt:new Date().toISOString(),sourceAndProtocolUnchanged:true,completedTrials:10,jsonFilesValidated:jsonCount,files:files.map(file=>({path:path.relative(out,file).replaceAll('\\','/'),sha256:hash(fs.readFileSync(file))}))});
console.log('Final evidence integrity passed: 10 trials; '+jsonCount+' JSON files; unchanged source/prompt/protocol hashes.');
