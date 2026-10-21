import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { state, writeJSON, npmRun, control } from './runtime.mjs';
const s = state();
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], {encoding:'utf8', windowsHide:true});
for (const [id, scenario, from, ref] of [
  ['sveltia-field-5','sveltia-field',s.baseSveltia,'HEAD'],
  ['cms-journal-3','cms-journal',s.trials.find(t=>t.id==='cms-journal-1').site,'HEAD']
]) {
  const directory = path.join(s.workspace,id), site = path.join(directory,'site');
  if(fs.existsSync(directory)) throw Error('Existing trial '+id);
  fs.mkdirSync(directory); git(directory,'clone','--quiet','--no-hardlinks',from,'site');
  git(site,'checkout','--detach',ref);
  s.trials.push({id,scenario,attempt:Number(id.split('-').at(-1)),directory,site,source:null});
  writeJSON(path.join(control,'state.json'),s);
  await npmRun(site,['ci','--no-audit','--no-fund'],path.join(control,id+'-ci.log'));
  if(scenario==='cms-journal') {
    // Reuse only the synthetic local encryption configuration, never a DB or session.
    fs.copyFileSync(path.join(from,'.env'),path.join(site,'.env'));
  }
  console.log('READY '+id);
}
// Detached committed pre-task CMS tree: diagnose pre-existing verification failures.
const cms = s.trials.find(t=>t.id==='cms-journal-1').site;
const clean = path.join(s.workspace,'cms-preflight-diagnostic');
git(cms,'worktree','add','--detach',clean,'HEAD');
fs.symlinkSync(path.join(cms,'node_modules'),path.join(clean,'node_modules'),'junction');
console.log('DIAGNOSTIC '+clean);
await npmRun(clean,['run','verify'],path.join(control,'cms-preflight-verify.log'),{allowFailure:true});
console.log('Diagnostic completed');
