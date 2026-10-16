import { spawnSync } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const tests = (await readdir('tests')).filter(name => name.endsWith('.test.mjs')).map(name => path.join('tests', name));
const steps = [
  ['art-direction', ['scripts/check-art-direction.mjs', '--changed']],
  ['syntax-lint', ['scripts/check-script-syntax.mjs']],
  ['schema-budget', ['scripts/check-schema-budget.mjs']],
  ['unit-tests', ['--test', ...tests]],
  ['normal-build', ['node_modules/astro/bin/astro.mjs', 'build']],
  ['release-profile', ['scripts/assert-release-artifact.mjs']],
];
const env = { ...process.env, CI: 'true' }; delete env.ASTRO_TEST_FIXTURES;
const started = performance.now(), receipts = [], logs = [];
for (const [name, args] of steps) {
  const start = performance.now();
  const result = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  receipts.push({ name, seconds: +( (performance.now() - start) / 1000 ).toFixed(3), exitCode: result.status });
  logs.push(`${name}\n${result.stdout || ''}${result.stderr || ''}`);
  if (result.status !== 0) { process.exitCode = 1; break; }
}
const seconds = +((performance.now() - started) / 1000).toFixed(3);
await mkdir('.emdash/checks', { recursive: true });
await writeFile('.emdash/checks/ci-fast.log', logs.join('\n'));
await writeFile('.emdash/checks/ci-fast.json', JSON.stringify({ node: process.versions.node, platform: process.platform, seconds, under60Seconds: seconds < 60, excludes: 'GitHub checkout/setup/npm ci/queue time; actual Actions execution not claimed', browserTestsRun: false, receipts }, null, 2) + '\n');
console.log(JSON.stringify({ node: process.versions.node, seconds, receipts }, null, 2));
