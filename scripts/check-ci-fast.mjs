import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { testEnvironment, testInvocation } from './run-tests.mjs';

const BUDGET_SECONDS = 60;
const FAILURE_TAIL_LINES = 60;

async function main() {
  // Mirrors `npm run verify:fast` (check:css runs inside the unit tier through
  // tests/design-workflow.test.mjs), then adds the build and release gates.
  const steps = [
    ['art-direction', ['scripts/check-art-direction.mjs', '--changed']],
    ['syntax-lint', ['scripts/check-script-syntax.mjs']],
    ['template-lint', ['node_modules/eslint/bin/eslint.js', 'src', 'profiles/static/project/src', '--max-warnings', '0']],
    ['docs-format', ['scripts/check-docs-format.mjs']],
    ['design-tokens', ['scripts/design-system.mjs']],
    ['schema-budget', ['scripts/check-schema-budget.mjs']],
    ['unit-tests', testInvocation('unit').args],
    ['normal-build', ['node_modules/astro/bin/astro.mjs', 'build']],
    ['release-profile', ['scripts/assert-release-artifact.mjs']],
  ];
  const env = { ...process.env, CI: 'true' }; delete env.ASTRO_TEST_FIXTURES;
  // Same isolation as `npm run test:unit`: Git fixtures must not inherit hook state.
  const testEnv = testEnvironment(env);
  const started = performance.now(), receipts = [], logs = [];
  let failure;
  for (const [name, args] of steps) {
    const start = performance.now();
    const result = spawnSync(process.execPath, args, { env: name === 'unit-tests' ? testEnv : env, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
    const output = `${result.stdout || ''}${result.stderr || ''}${result.error?.message || ''}`;
    receipts.push({ name, seconds: +( (performance.now() - start) / 1000 ).toFixed(3), exitCode: result.status, ...(result.error && { error: result.error.message }), ...(result.signal && { signal: result.signal }) });
    logs.push(`${name}\n${output}`);
    if (result.status !== 0) { failure = { name, output }; process.exitCode = 1; break; }
  }
  const seconds = +((performance.now() - started) / 1000).toFixed(3);
  const underBudget = seconds < BUDGET_SECONDS;
  await mkdir('.emdash/checks', { recursive: true });
  await writeFile('.emdash/checks/ci-fast.log', logs.join('\n'));
  await writeFile('.emdash/checks/ci-fast.json', JSON.stringify({ node: process.versions.node, platform: process.platform, seconds, under60Seconds: underBudget, excludes: 'GitHub checkout/setup/npm ci/queue time; actual Actions execution not claimed', browserTestsRun: false, receipts }, null, 2) + '\n');
  console.log(JSON.stringify({ node: process.versions.node, seconds, under60Seconds: underBudget, receipts }, null, 2));
  // The receipts alone do not say why a step failed. Show the end of its output
  // here; the complete output of every step is in the log file.
  if (failure) {
    const lines = failure.output.trimEnd().split(/\r?\n/);
    console.error(`Fast CI step "${failure.name}" failed. Last ${Math.min(lines.length, FAILURE_TAIL_LINES)} of ${lines.length} output lines (full log: .emdash/checks/ci-fast.log):`);
    console.error(lines.slice(-FAILURE_TAIL_LINES).join('\n'));
    const notRun = steps.slice(receipts.length).map(([name]) => name);
    if (notRun.length) console.error(`Not run: ${notRun.join(', ')}.`);
  }
  if (!underBudget) { console.error(`Fast CI budget exceeded: ${seconds}s (expected < ${BUDGET_SECONDS}s). See .emdash/checks/ci-fast.log.`); process.exitCode = 1; }
}

try { await main(); }
catch (error) { console.error(`Fast CI check failed: ${error.message}`); process.exitCode = 1; }
