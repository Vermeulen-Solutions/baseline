import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

test('visual updates require the explicit local wrapper flag and are rejected in CI', () => {
  for (const [args, env, message] of [
    [['scripts/test-visual.mjs'], { CI: 'true' }, /local-only/],
    [['scripts/test-visual.mjs', '--update'], { CI: 'true' }, /local-only/],
    [['scripts/test-visual.mjs', '--update-snapshots=all'], {}, /Allowed flags/],
    [['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.config.mjs', '--update-snapshots=all', '--list'], { VISUAL_UPDATE: '0' }, /raw snapshot update flags are forbidden/],
  ]) {
    const result = spawnSync(process.execPath, args, { env: { ...process.env, ...env }, encoding: 'utf8', timeout: 30000 });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, message);
  }
});

test('visual wrapper cancellation reaches graceful child handlers on Windows', async () => {
  const child = spawn(process.execPath, ['--import', './tests/visual/cancel-receiver.mjs', '--input-type=module', '-e', 'const timer=setInterval(()=>{},1000);process.once("SIGINT",()=>{clearInterval(timer);process.send("cleaned");process.disconnect();});process.send("ready");', '--', '--visual-cancel-probe'], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  const timer = setTimeout(() => child.kill(), 10000); timer.unref();
  try {
    assert.equal((await once(child, 'message'))[0], 'ready');
    const cleaned = once(child, 'message'), exited = once(child, 'exit');
    child.send({ type: 'visual-cancel', signal: 'SIGINT' });
    assert.equal((await cleaned)[0], 'cleaned');
    assert.equal((await exited)[0], 0);
  } finally { clearTimeout(timer); if (child.exitCode === null) child.kill(); }
});
