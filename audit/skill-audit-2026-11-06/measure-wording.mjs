import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2]; const skills = process.argv.slice(3);
const SOFT = /\b(where appropriate|when appropriate|as appropriate|appropriate(ly)?|meaningful(ly)?|deliberate(ly)?|as needed|if needed|where needed|suitable|reasonabl[ey]|sensible|carefully|thoughtful(ly)?|intentional(ly)?|as necessary|where useful|when useful|relevant|applicable|proper(ly)?)\b/gi;
const STRICT = /\b(must|never|always|do not|don't)\b/gi;
const WHY = /\b(because|so that|otherwise|since|which means|prevents?|to avoid)\b/gi;
const walk = d => fs.readdirSync(d,{withFileTypes:true}).flatMap(e => e.isDirectory() ? (e.name==='upstream'?[]:walk(path.join(d,e.name))) : e.name.endsWith('.md')?[path.join(d,e.name)]:[]);
const rows=[];
for (const s of skills) for (const f of walk(path.join(root,s))) {
  const t=fs.readFileSync(f,'utf8'); const w=t.split(/\s+/).filter(Boolean).length;
  const c=r=>(t.match(r)||[]).length;
  rows.push({f:path.relative(root,f).split(path.sep).join('/'),w,soft:c(SOFT),strict:c(STRICT),why:c(WHY)});
}
const r1=x=>(x).toFixed(1);
for (const r of rows) console.log(`${String(r.w).padStart(5)} soft ${r1(r.soft*1000/r.w).padStart(5)}/k strict ${r1(r.strict*1000/r.w).padStart(5)}/k why ${r1(r.why*1000/r.w).padStart(5)}/k  ${r.f}`);
const tot={}; for (const r of rows){const s=r.f.split('/')[0]; tot[s]??={w:0,soft:0,strict:0,why:0}; for(const k of ['w','soft','strict','why']) tot[s][k]+=r[k];}
console.log('--- totals'); for (const [s,t] of Object.entries(tot)) console.log(`${String(t.w).padStart(6)} soft ${r1(t.soft*1000/t.w)}/k strict ${r1(t.strict*1000/t.w)}/k why ${r1(t.why*1000/t.w)}/k ${s}`);
