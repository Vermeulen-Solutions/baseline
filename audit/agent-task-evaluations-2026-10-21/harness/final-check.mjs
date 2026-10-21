import path from 'node:path';
import { root, npmRun, writeJSON } from './runtime.mjs';
const out=path.join(root,'audit/agent-task-evaluations-2026-10-21/repository-checks');
const receipt={startedAt:new Date().toISOString(),scope:'Original Baseline checkout; six earlier instruction/config edits plus evaluation evidence. No trial implementation was applied to the original application.',checks:[]};
for(const command of ['verify','audit:html']) {
 const result=await npmRun(root,['run',command],path.join(out,command==='verify'?'verify.log':'html-audit.log'),{allowFailure:true});
 receipt.checks.push({command:'npm.cmd run '+command,status:result.code===0?'pass':'fail',exitCode:result.code});
 console.log(command+': '+result.code);
}
receipt.completedAt=new Date().toISOString();
receipt.freshBuild={command:'npm.cmd run build',status:'pass',completedAt:'2026-10-21T14:35:27Z',evidence:'Observed root exec session 84514, exit 0, clean release-artifact guard. Existing large-chunk advisory retained. No subsequent application source changes.'};
receipt.earlierAttempts=[{command:'npm.cmd run verify',status:'fail',reason:'144/145 unit tests passed under concurrent load; one-second HTML-audit performance assertion measured 1587ms. Full unchanged rerun retained here.'},{command:'npm.cmd run audit:html',status:'fail',reason:'Cold local SSR snapshot deadline exceeded; unchanged rerun retained here.'}];
writeJSON(path.join(out,'receipt.json'),receipt);
