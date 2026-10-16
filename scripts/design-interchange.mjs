import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { lint } from '@google/design.md/linter';
export function validateDesign(content) {
  const result = lint(content);
  // 0.4.0 silently drops unresolved color aliases; require every written reference to resolve.
  const unresolved = [...new Set([...content.matchAll(/\{([A-Za-z][\w-]*(?:\.[\w-]+)+)\}/g)].map(m => m[1]))].filter(ref => !result.designSystem.symbolTable.has(ref));
  const errors = [...result.findings.filter(f => f.severity === 'error'), ...unresolved.map(ref => ({ severity: 'error', rule: 'starter-unresolved-reference', message: 'Unresolved token reference: ' + ref }))];
  return { summary: { ...result.summary, errors: errors.length }, findings: [...result.findings.filter(f => f.severity !== 'error'), ...errors] };
}
export async function checkMapping(root, mapping) {
  const css = await readFile(path.join(root, mapping.source), 'utf8');
  const drift = mapping.mappings.filter(({ source, value }) => {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const actual = css.match(new RegExp(escaped + '\\s*:\\s*([^;]+);'))?.[1].trim();
    return actual !== value;
  });
  return { status: drift.length ? 'drift' : 'current', drift: drift.map(m => m.source) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const option = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
  try {
    const file = option('--file') ?? 'DESIGN.md';
    const content = await readFile(file, 'utf8').catch(e => { if (e.code === 'ENOENT' && !option('--file')) return null; throw e; });
    if (content === null) console.log('DESIGN.md absent; optional bridge not applicable.');
    else {
      const report = validateDesign(content);
      if (option('--mapping')) report.mapping = await checkMapping(process.cwd(), JSON.parse(await readFile(option('--mapping'), 'utf8')));
      if (report.summary.errors || report.mapping?.status === 'drift') { console.log(JSON.stringify(report, null, 2)); process.exitCode = 1; }
      else if (process.argv.includes('--export')) {
        const format = option('--format') ?? 'css-vars';
        if (!['css-vars', 'css-tailwind', 'dtcg', 'json-tailwind'].includes(format)) throw Error('Unsupported export format');
        process.stdout.write(execFileSync(process.execPath, [createRequire(import.meta.url).resolve('@google/design.md'), 'export', path.resolve(file), '--format', format], { encoding: 'utf8' }));
      } else console.log(JSON.stringify(report, null, 2));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
