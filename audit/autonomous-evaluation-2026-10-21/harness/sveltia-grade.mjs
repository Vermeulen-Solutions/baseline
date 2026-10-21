import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {npmRun} from '../agent-task-evals/runtime.mjs';
const state=JSON.parse(fs.readFileSync('.emdash/checks/autonomous-evaluation/state.json')),control=path.join(state.root,'.emdash/checks/autonomous-evaluation');
const report={startedAt:new Date().toISOString(),checks:[],limits:['Real Astro build/schema and emitted-HTML acceptance. No credentialed browser-editor GitHub login/save or general UI audit.']};
for(const trial of state.trials.filter(t=>t.scenario==='sveltia')){
 const file=path.join(trial.site,'src/content/posts/welcome.md'),original=fs.readFileSync(file,'utf8');
 const config=JSON.parse(fs.readFileSync(path.join(trial.site,'public/admin/config.yml'))),field=config.collections.find(c=>c.name==='posts').fields.find(f=>f.name==='readingMinutes');
 report.checks.push({trial:trial.id,name:'paired editor control',status:field?.widget==='number'&&field.required===false&&field.min===1&&field.max===60&&(field.value_type==='int'||field.step===1)?'pass':'fail',field});
 try{
  for(const [label,value,valid] of [['min','1',true],['max','60',true],['zero','0',false],['above-max','61',false],['fraction','1.5',false],['string','"2"',false]]){
   fs.writeFileSync(file,original.replace(/^---\r?\n/,'---\nreadingMinutes: '+value+'\n'));
   const result=await npmRun(trial.site,['run','build'],path.join(control,trial.id+'-'+label+'.log'),{allowFailure:true});
   let status=valid?result.code===0:result.code!==0&&/readingMinutes/.test(fs.readFileSync(result.log,'utf8'));
   if(valid)status&&=new RegExp('>'+value+' min read<').test(fs.readFileSync(path.join(trial.site,'dist/posts/welcome/index.html'),'utf8'));
   report.checks.push({trial:trial.id,name:label,input:value,expected:valid?'accepted and rendered':'schema rejection',exitCode:result.code,status:status?'pass':'fail'});
  }
 }finally{
  fs.writeFileSync(file,original);const result=await npmRun(trial.site,['run','build'],path.join(control,trial.id+'-restored.log'),{allowFailure:true});const html=result.code===0?fs.readFileSync(path.join(trial.site,'dist/posts/welcome/index.html'),'utf8'):'';report.checks.push({trial:trial.id,name:'legacy absent value and restored build',exitCode:result.code,contentRestored:fs.readFileSync(file,'utf8')===original,status:result.code===0&&!/\d+ min read/.test(html)?'pass':'fail'});
 }
}
report.completedAt=new Date().toISOString();report.status=report.checks.every(c=>c.status==='pass')?'pass':'fail';fs.writeFileSync(path.join(state.out,'sveltia-acceptance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status==='fail')process.exitCode=1;
