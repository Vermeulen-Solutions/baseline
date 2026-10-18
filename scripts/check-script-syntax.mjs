import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

// Fast parser check, not a claim of TypeScript/ESLint semantic analysis.
const files = existsSync('playwright.config.mjs') ? ['playwright.config.mjs'] : [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'baselines') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (/\.(mjs|js)$/.test(entry.name)) files.push(file);
  }
}
await collect('scripts'); await collect('tests');
if (existsSync('profiles')) await collect('profiles');
let cursor = 0, failures = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < files.length) {
    const file = files[cursor++];
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] });
      let errors = ''; child.stderr.on('data', data => errors += data);
      child.once('error', reject);
      child.once('exit', code => { if (code !== 0) { failures++; console.error(`${file}\n${errors}`); } resolve(); });
    });
  }
}));
console.log(`Syntax checked ${files.length} JavaScript modules.`);
if (failures) process.exitCode = 1;
