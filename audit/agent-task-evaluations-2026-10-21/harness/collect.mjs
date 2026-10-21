import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { state, control, root, writeJSON } from './runtime.mjs';
const dest=path.join(root,'audit/agent-task-evaluations-2026-10-21');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
const selected=['static-new-1','static-new-2','sveltia-field-3','sveltia-field-5','regional-spacing-1','regional-spacing-2','cms-journal-1','cms-journal-3','cold-resume-1','cold-resume-2'];
const results=[];
for(const id of selected){
 const trial=state().trials.find(t=>t.id===id);if(!trial)continue;
 const grade=path.join(control,id+'-grade'),out=path.join(dest,'trials',id);fs.mkdirSync(out,{recursive:true});
 const report=path.join(grade,'report.json');if(!fs.existsSync(report))continue;
 const data=JSON.parse(fs.readFileSync(report)); results.push({trial:id,status:data.status,summary:data.summary,criteria:data.criteria,limits:data.limits});
 copy(report,path.join(out,'report.json'));
 for(const name of ['EVALUATION-NOTES.md','EVALUATION-NOTES-A.md','EVALUATION-NOTES-B.md']){const f=path.join(trial.directory,name);if(fs.existsSync(f))copy(f,path.join(out,name));}
 const checkpoint=path.join(control,id+'-checkpoint');if(fs.existsSync(checkpoint))fs.cpSync(checkpoint,path.join(out,'checkpoint'),{recursive:true});
 for(const file of fs.readdirSync(grade))if(/\.log$|^report-before.*\.json$/.test(file))copy(path.join(grade,file),path.join(out,'logs',file));
 const screenshots=fs.readdirSync(grade).filter(f=>f.endsWith('.png'));
 const choose=trial.scenario==='static-new'?['390--.png','1440--.png']:trial.scenario==='cms-journal'?['390--journal-.png','1440--journal-planning-your-first-workshop.png','editor-public-reload.png']:trial.scenario==='cold-resume'?['390--workshops-.png','1440--workshops-.png']:[];
 for(const file of screenshots.filter(f=>choose.includes(f)))copy(path.join(grade,file),path.join(out,'screenshots',file));
 const git=(...args)=>execFileSync('git',['-C',trial.site,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 let files=[];
 if(fs.existsSync(path.join(trial.site,'.git'))){
   fs.writeFileSync(path.join(out,'changes.patch'),git('diff','--no-ext-diff','--binary','HEAD'));
   files=[...git('diff','--name-only','HEAD').trim().split('\n'),...git('ls-files','--others','--exclude-standard').trim().split('\n')].filter(Boolean);
 }else{
   const owned=['src','public','audit'];
   for(const dir of owned)if(fs.existsSync(path.join(trial.site,dir)))for(const entry of fs.readdirSync(path.join(trial.site,dir),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()))files.push(path.relative(trial.site,path.join(entry.parentPath,entry.name)));
   files.push(...['AGENTS.md','README.md','astro.config.mjs','baseline.config.json','package.json','package-lock.json','tsconfig.json'].filter(f=>fs.existsSync(path.join(trial.site,f))));
 }
 const inventory=[];
 for(const file of [...new Set(files)]){
   if(/(^|[/\\])(node_modules|\.env|\.emdash|dist|\.astro)([/\\]|$)/.test(file))continue;
   if(/^audit[/\\].*\.png$/i.test(file))continue;
   const from=path.join(trial.site,file);if(!fs.existsSync(from))continue;
   copy(from,path.join(out,'artifacts',file));inventory.push({path:file.replaceAll('\\','/'),sha256:hash(fs.readFileSync(from))});
 }
 writeJSON(path.join(out,'artifact-inventory.json'),{trial:id,files:inventory});
 if(trial.scenario==='cms-journal'){
  const receipt=path.join(trial.directory,'evidence/editor-acceptance.json');if(fs.existsSync(receipt))copy(receipt,path.join(out,'worker-editor-acceptance.json'));
 }
}
writeJSON(path.join(dest,'results.json'),{recordedAt:new Date().toISOString(),trials:results});
const harness=path.join(dest,'harness');fs.mkdirSync(harness,{recursive:true});
for(const name of ['prepare.mjs','runtime.mjs','grade.mjs','checkpoint.mjs','continue-prepare.mjs','collect.mjs','final-check.mjs'])copy(path.join(control,name),path.join(harness,name));
console.log(JSON.stringify(results.map(({trial,status,summary})=>({trial,status,summary})),null,2));
