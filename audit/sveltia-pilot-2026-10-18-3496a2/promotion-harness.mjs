import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { stripVTControlCharacters } from 'node:util';

const base = 'C:/dev/emdash-baseline';
const target = JSON.parse(await fs.readFile(path.join(base, '.emdash/checks/sveltia-pilot-target.json'), 'utf8'));
const label = process.argv[2];
if (!/^[a-z-]+$/.test(label)) throw new Error('Expected an owned rehearsal label');
const report = path.join(base, 'audit/sveltia-pilot-2026-10-18-3496a2');
const npm = 'C:/Users/Jaap/AppData/Roaming/npm/node_modules/npm/bin/npm-cli.js';
const wrangler = path.join(base, '.emdash/checks/sveltia-pages-tools/node_modules/wrangler/bin/wrangler.js');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: target.path, encoding: 'utf8' }).trim();
const receipt = { label, commit, startedAt: new Date().toISOString(), checks: [], deploymentAttempted: false, deploymentSucceeded: false, trigger: 'Explicit local promotion from checked-out GitHub commit, not automatic Git integration' };
const commands = [
  ['art-direction-all', ['run', 'check:art-direction', '--', '--base', '4b825dc642cb6eb9a060e54bf8d69288fbee4904']],
  ['verify', ['run', 'verify']], ['build', ['run', 'build']], ['dev-tools', ['run', 'check:dev-tools']],
];
for (const [command, args] of commands) {
  const result = spawnSync(process.execPath, [npm, ...args], { cwd: target.path, encoding: 'utf8', timeout: 180000, maxBuffer: 12e6, env: { ...process.env, SITE_URL: `https://${target.pagesProject}.pages.dev` } });
  await fs.writeFile(path.join(report, `${label}-${command}.log`), stripVTControlCharacters((result.stdout ?? '') + (result.stderr ?? '')).replace(/\r\n?/g, '\n').replace(/[\t ]+$/gm, '').trimEnd() + '\n');
  receipt.checks.push({ command: `npm ${args.join(' ')}`, exitCode: result.status, error: result.error?.message });
  if (result.status !== 0) break;
}
if (receipt.checks.length === commands.length && receipt.checks.every(check => check.exitCode === 0)) {
  receipt.deploymentAttempted = true;
  const result = spawnSync(process.execPath, [wrangler, 'pages', 'deploy', 'dist', '--project-name', target.pagesProject, '--branch', 'main', '--commit-hash', commit], { cwd: target.path, encoding: 'utf8', timeout: 180000, maxBuffer: 12e6, env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: '8a056899caba072c5a49a735d83ac6e8', WRANGLER_SEND_METRICS: 'false' } });
  await fs.writeFile(path.join(report, `${label}-deploy.log`), stripVTControlCharacters((result.stdout ?? '') + (result.stderr ?? '')).replace(/\r\n?/g, '\n').replace(/[\t ]+$/gm, '').trimEnd() + '\n');
  receipt.deploymentExitCode = result.status;
  receipt.deploymentSucceeded = result.status === 0;
}
receipt.completedAt = new Date().toISOString();
await fs.writeFile(path.join(report, `${label}-promotion.json`), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
if (!receipt.deploymentSucceeded) process.exitCode = 1;
