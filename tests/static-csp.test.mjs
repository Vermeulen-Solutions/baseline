import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cspSettings, staticPolicy, withPolicyHeader, writeStaticCsp, CSP_RECEIPT } from '../scripts/static-csp.mjs';

function temporary(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'static-csp-'));
  return Promise.resolve(run(directory)).finally(() => fs.rmSync(directory, { recursive: true, force: true }));
}
const quiet = { info() {}, warn() {} };

test('settings come from the environment first, then .env.production, then .env', () => temporary(root => {
  fs.writeFileSync(path.join(root, '.env'), 'CSP_MODE=enforce\nCSP_SOURCES="frame-src https://player.vimeo.com"\n');
  fs.writeFileSync(path.join(root, '.env.production'), 'CSP_MODE=report\n');
  assert.deepEqual(cspSettings(root, {}), { mode: 'report', extra: { 'frame-src': ['https://player.vimeo.com'] } });
  assert.equal(cspSettings(root, { CSP_MODE: 'off' }).mode, 'off');
  assert.equal(cspSettings(root, { CSP_MODE: 'anything' }).mode, 'off');
  assert.throws(() => cspSettings(root, { CSP_SOURCES: 'script-src https://a.example "x"' }), /source expression/);
}));

test('the site-wide policy hashes every executed inline block once and ignores data blocks', () => temporary(async directory => {
  fs.mkdirSync(path.join(directory, 'about'));
  fs.writeFileSync(path.join(directory, 'index.html'), '<style>a{}</style><script>one()</script><script type="application/ld+json">{}</script><script src="/x.js"></script>');
  fs.writeFileSync(path.join(directory, 'about/index.html'), '<script>one()</script><script type="speculationrules">{}</script>');
  const { pages, policy } = await staticPolicy(directory, { 'frame-src': ['https://www.youtube-nocookie.com'] });
  assert.equal(pages, 2);
  const scriptSrc = policy.split('; ').find(part => part.startsWith('script-src ')).split(' ');
  assert.equal(scriptSrc.filter(source => source.startsWith("'sha256-")).length, 2, 'one() and the speculation rules');
  assert.match(policy, /style-src 'self' 'sha256-[^']+'/);
  assert.match(policy, /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);
  assert.doesNotMatch(policy, /unsafe-inline'[^;]*script/);
}));

test('the header joins an existing _headers file and never replaces a policy the site sets', () => {
  assert.equal(withPolicyHeader('', 'Content-Security-Policy', 'p').text, '/*\n  Content-Security-Policy: p\n');
  assert.equal(withPolicyHeader('/fonts/*\n  Cache-Control: max-age=31536000\n', 'Content-Security-Policy-Report-Only', 'p').text, '/fonts/*\n  Cache-Control: max-age=31536000\n\n/*\n  Content-Security-Policy-Report-Only: p\n');
  assert.equal(withPolicyHeader('/*\n  Content-Security-Policy: mine\n', 'Content-Security-Policy', 'p').skipped, true);
});

test('a build writes _headers and the receipt only when CSP_MODE asks for it', () => temporary(async directory => {
  fs.writeFileSync(path.join(directory, 'index.html'), '<script>go()</script>');
  assert.equal(await writeStaticCsp({ directory, root: directory, env: {}, logger: quiet }), null);
  assert.equal(fs.existsSync(path.join(directory, '_headers')), false);
  const result = await writeStaticCsp({ directory, root: directory, env: { CSP_MODE: 'report' }, logger: quiet });
  assert.equal(result.header, 'Content-Security-Policy-Report-Only');
  assert.match(fs.readFileSync(path.join(directory, '_headers'), 'utf8'), /^\/\*\n {2}Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'sha256-/);
  assert.equal(fs.readFileSync(path.join(directory, CSP_RECEIPT), 'utf8'), `${result.header}: ${result.policy}\n`);
}));
