import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkHostedAuth, checkAuthBuildLog } from '../scripts/check-hosted-auth.mjs';

const buildLog = '[WARN] Some chunks are larger than 500 kB\n[build] Complete!';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const error = code => ({ success: false, error: { code, message: 'synthetic' } });
const input = { origin: 'https://preview.example.test', version: '1.4.0', buildLog };

test('missing-session warnings and incomplete logs stop before the network; unrelated warnings do not', async () => {
  for (const warning of ['Astro sessions are disabled (`session: false`), but EmDash stores signed-in users in the Astro session.', 'No Astro session driver is configured, but EmDash stores signed-in users in the Astro session.', 'Sign-in needs an Astro session driver']) {
    await assert.rejects(checkHostedAuth({ ...input, buildLog: `${warning}\n${buildLog}`, fetcher: () => assert.fail('must not request') }));
  }
  assert.throws(() => checkAuthBuildLog(''), /complete/);
  assert.throws(() => checkAuthBuildLog('building...'), /completion/);
  checkAuthBuildLog(buildLog);
});

test('bootstrap and locked probes send no credential or nonce and require exact native validation', async () => {
  for (const needsSetup of [true, false]) {
    const calls = [];
    const result = await checkHostedAuth({ ...input, fetcher: async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) return json({ success: true, data: { needsSetup } });
      assert.equal(url.pathname, '/_emdash/api/setup/admin/verify');
      assert.equal(options.body, '{}'); assert.equal(options.credentials, 'omit');
      assert.equal(options.headers.Origin, input.origin); assert.equal(options.redirect, 'manual');
      assert.equal(Object.keys(options.headers).some(k => /cookie|authorization|nonce/i.test(k)), false);
      return json(error(needsSetup ? 'INVALID_STATE' : 'SETUP_COMPLETE'), 400);
    } });
    assert.equal(calls.length, 2); assert.equal(result.setupLocked, !needsSetup); assert.equal(result.sessionGuardReached, true);
  }
});

test('session failures, blocked/redirected/SPAs, oversized responses and unsupported versions remain unverified', async () => {
  for (const response of [json(error('SESSION_UNAVAILABLE'), 500), json(error('INVALID_STATE'), 200), json(error('BAD_REQUEST'), 400), new Response('<html>setup</html>'), new Response(null, { status: 302 }), json({ text: 'x'.repeat(33000) }, 400)]) {
    let count = 0;
    await assert.rejects(checkHostedAuth({ ...input, fetcher: async () => ++count === 1 ? json({ success: true, data: { needsSetup: true } }) : response }));
  }
  for (const body of [{ success: false }, { success: true, data: { needsSetup: 'false' } }]) await assert.rejects(checkHostedAuth({ ...input, fetcher: async () => json(body) }));
  for (const version of ['1.2.0', '1.3.1', undefined]) await assert.rejects(checkHostedAuth({ ...input, version, fetcher: () => assert.fail('unsupported') }));
  for (const origin of ['http://example.test', 'https://user:secret@example.test', 'https://example.test/path']) await assert.rejects(checkHostedAuth({ ...input, origin, fetcher: () => assert.fail('invalid origin') }));
});

test('the installed 1.4.0 native verification route guards session and nonce before credential writes', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../node_modules/emdash/package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.version, '1.4.0');
  const route = fs.readFileSync(new URL('../node_modules/emdash/dist/astro/routes/api/setup/admin-verify.mjs', import.meta.url), 'utf8');
  const session = route.indexOf('if (!session)'), nonce = route.indexOf('if (!setupState.nonce'), parse = route.indexOf('await parseBody'), create = route.indexOf('await createFirstAdmin');
  assert.ok(session > 0 && nonce > session && parse > nonce && create > parse);
  assert.match(route.slice(session, nonce), /"INVALID_STATE"/);
});
