import test from 'node:test';
import assert from 'node:assert/strict';
import { scanInvocation, MODERN_WEB_GUIDANCE_VERSION } from '../scripts/audit-modern-web.mjs';

test('scan is pinned to an exact version and never floats to latest', () => {
  assert.match(MODERN_WEB_GUIDANCE_VERSION, /^\d+\.\d+\.\d+$/);
  const { args } = scanInvocation('src', 'linux', {});
  assert.ok(args.includes(`--package=modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION}`));
  assert.ok(!args.join(' ').includes('latest'));
  assert.deepEqual(args.slice(-3), ['legacy-scan', 'src', '--json']);
});

test('scan always disables telemetry, even when the environment enables it', () => {
  const { options } = scanInvocation('src', 'linux', { DISABLE_TELEMETRY: '0', KEEP: 'yes' });
  assert.equal(options.env.DISABLE_TELEMETRY, '1');
  assert.equal(options.env.KEEP, 'yes');
});

test('Windows uses the npm.cmd launcher through a shell', () => {
  assert.equal(scanInvocation('src', 'win32', {}).command, 'npm.cmd');
  assert.equal(scanInvocation('src', 'win32', {}).options.shell, true);
  assert.equal(scanInvocation('src', 'linux', {}).command, 'npm');
  assert.equal(scanInvocation('src', 'linux', {}).options.shell, false);
});

test('scan targets that could reach a shell or act as flags are refused', () => {
  for (const target of ['src & calc', 'src;ls', '$(x)', 'a b', '--help']) assert.throws(() => scanInvocation(target, 'win32', {}), /Unsupported scan target/);
  for (const target of ['src', 'profiles/static/project/src', 'C:\\dev\\site\\src', '../site/src']) assert.doesNotThrow(() => scanInvocation(target, 'win32', {}));
});
