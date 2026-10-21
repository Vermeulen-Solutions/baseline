import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { control, trialOf, writeJSON } from './runtime.mjs';
const trial = trialOf(process.argv[2]);
const git = (...args) => execFileSync('git',['-C',trial.site,...args],{encoding:'utf8',windowsHide:true});
const out = path.join(control,trial.id+'-checkpoint'); fs.mkdirSync(out,{recursive:true});
const files = [...new Set([...git('diff','--name-only','HEAD').trim().split('\n'),...git('ls-files','--others','--exclude-standard').trim().split('\n')])].filter(Boolean);
const receipt={trial:trial.id,capturedAt:new Date().toISOString(),baseCommit:git('rev-parse','HEAD').trim(),files:[],checks:{}};
for(const file of files) {
  const from = path.join(trial.site,file); if(!fs.existsSync(from)) continue;
  const bytes=fs.readFileSync(from), to=path.join(out,'files',file);
  fs.mkdirSync(path.dirname(to),{recursive:true}); fs.writeFileSync(to,bytes);
  receipt.files.push({path:file,sha256:createHash('sha256').update(bytes).digest('hex')});
}
assert.ok(!files.some(f=>f.startsWith('src/pages/')),'No deferred routes in phase A');
assert.equal(git('diff','HEAD','--','src/config/site.ts').trim(),'','Navigation deferred');
assert.ok(receipt.files.some(f=>f.path==='HANDOFF.md'),'Written handoff persisted');
assert.ok(receipt.files.some(f=>f.path==='src/content.config.ts'),'Typed schema persisted');
const workshops=receipt.files.filter(f=>f.path.startsWith('src/content/workshops/'));
assert.equal(workshops.length,2,'Two workshop content files');
const text=workshops.map(f=>fs.readFileSync(path.join(trial.site,f.path),'utf8')).join('\n');
for(const value of ['Clear project briefs','clear-project-briefs','Winter planning clinic','winter-planning-clinic','2026-11-12','2026-12-03','Northline Studio'])assert.ok(text.includes(value),value);
receipt.checks={noRouteImplementation:true,noNavigationChange:true,typedSchemaPresent:true,twoSampleEntriesPresent:true,writtenHandoffPresent:true};
writeJSON(path.join(out,'receipt.json'),receipt); console.log(JSON.stringify(receipt));
