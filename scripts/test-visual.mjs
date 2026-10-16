import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { visualContract } from '../tests/visual/contract.mjs';

const args = process.argv.slice(2);
const update = args.includes('--update');
const repeat = args.find(arg => /^--repeat=[1-5]$/.test(arg))?.split('=')[1] || '1';
const sensitivity = args.includes('--sensitivity');
const functional = args.includes('--functional');
if (args.some(arg => !['--update', '--sensitivity', '--functional'].includes(arg) && !/^--repeat=[1-5]$/.test(arg))) throw new Error('Allowed flags: --update, --repeat=1..5, --sensitivity, --functional');
if (process.env.CI || process.env.GITHUB_ACTIONS === 'true') throw new Error('Visual tests are local-only; never run them in GitHub Actions');
if (update && (process.env.CI || sensitivity || functional)) throw new Error('Baseline --update is local-only and cannot combine with sensitivity/functional-only mode');
const pkg = JSON.parse(await readFile('node_modules/@playwright/test/package.json', 'utf8'));
if (pkg.version !== '1.64.1') throw new Error('Unexpected Playwright version; run npm ci');
const runnerArgs = ['--import', './tests/visual/cancel-receiver.mjs', 'node_modules/@playwright/test/cli.js', 'test', '--config=playwright.config.mjs', `--repeat-each=${repeat}`];
if (sensitivity) runnerArgs.push('--grep', 'sensitivity');
if (functional) runnerArgs.push('--grep', 'behavior|reflow|zoom');
const env = { ...process.env, VISUAL_UPDATE: update ? '1' : '0' };
delete env.VISUAL_ORIGIN;
const child = spawn(process.execPath, runnerArgs, { cwd: path.resolve('.'), env, stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { if (child.connected) child.send({ type: 'visual-cancel', signal }); });
const [code] = await once(child, 'exit'); process.exitCode = code ?? 1;
if (code === 0 && update) {
  const directory = path.resolve('tests/visual/baselines', process.platform);
  const hashes = {};
  for (const name of (await readdir(directory, { recursive: true })).sort()) if (name.endsWith('.png')) hashes[name.replaceAll('\\', '/')] = createHash('sha256').update(await readFile(path.join(directory, name))).digest('hex');
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ ...visualContract, platform: process.platform, authoritative: process.platform === 'win32', files: hashes }, null, 2) + '\n');
}
