import fs from 'node:fs'; import path from 'node:path';
for (const f of fs.readdirSync('runs').sort()) {
  const fx = f.includes('k7') ? 'site-k7' : f.includes('r5') ? 'site-r5' : 'site-m2';
  const t = fs.readFileSync('runs/' + f, 'utf8'); const sec = t.split(/## Files read/)[1] || '';
  const paths = [...sec.matchAll(/((?:\.agents|docs)\/[\w./-]+\.md|AGENTS\.md|README\.md|package\.json)/g)].map(m => m[1]);
  let w = 0, skill = 0, n = 0; const seen = new Set();
  for (const p of paths) { if (seen.has(p)) continue; seen.add(p); const fp = path.join(fx, p); if (!fs.existsSync(fp)) continue; n++; const c = fs.readFileSync(fp, 'utf8').split(/\s+/).filter(Boolean).length; w += c; if (p.startsWith('.agents')) skill += c; }
  console.log(f.padEnd(14), 'files', String(n).padStart(2), 'words', String(w).padStart(6), 'skill-words', String(skill).padStart(6));
}
